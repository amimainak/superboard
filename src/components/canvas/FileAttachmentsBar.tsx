'use client';
import React, { useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { toast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/auth-fetch';
import type { Tier } from '@/types';
import type { Editor, TLAsset, TLAssetId, TLShape } from 'tldraw';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Paperclip,
  Download,
  FileText,
  LayoutTemplate,
  Share2,
} from 'lucide-react';

// ============================================================
// FileAttachmentsBar — Floating bottom toolbar
// ============================================================
// Provides file upload, export (PNG / PDF), save-to-template,
// and share-link functionality. Positioned above the UsageBar.
// Feature-gated: upload, export, and template actions require
// PRO+ tiers.
// ============================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/gif,image/svg+xml';
const ACCEPTED_FILE_TYPES = `${ACCEPTED_IMAGE_TYPES},application/pdf`;

interface FileAttachmentsBarProps {
  roomId: string;
  isTutor: boolean;
  editorRef: React.RefObject<Editor | null>;
  tier: Tier;
}

/** Check if the given tier has access to premium features (uploads, exports, templates) */
function isProOrAbove(tier: Tier): boolean {
  return tier === 'PRO' || tier === 'AGENCY' || tier === 'AGENCY_STANDARD' || tier === 'AGENCY_PREMIUM';
}

/** Read a File as a base64 data URL */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

/** Create a temporary anchor element and trigger a download */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Clean up the object URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export default function FileAttachmentsBar({
  roomId,
  isTutor,
  editorRef,
  tier,
}: FileAttachmentsBarProps) {
  const isActive = useAppStore((s) => s.room.isActive);
  const openPaywall = useAppStore((s) => s.openPaywall);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Only visible when the whiteboard is active (not in waiting room)
  if (!isActive) return null;

  const hasAccess = isProOrAbove(tier);

  // ----------------------------------------------------------
  // Upload handler
  // ----------------------------------------------------------
  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];

      // Size check
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'File too large',
          description: `Maximum file size is 10 MB. This file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
          variant: 'destructive',
        });
        // Reset input so the same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // PDF — not supported yet
      if (file.type === 'application/pdf') {
        toast({
          title: 'PDF import coming soon',
          description: 'PDF import will be available in a future update.',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Image files — add to tldraw canvas
      const editor = editorRef.current;
      if (!editor) {
        toast({
          title: 'Canvas not ready',
          description: 'Please wait for the whiteboard to finish loading.',
          variant: 'destructive',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);

        // Generate a unique asset ID matching tldraw's expected format
        const assetId = `asset:${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as TLAssetId;
        const isSvg = file.type === 'image/svg+xml';

        // Build the asset object — tldraw expects full TLAsset records.
        // We use 'as any' here because the TS branded types (TLAssetId, etc.)
        // cannot be satisfied at runtime without tldraw's own ID generators.
        const asset = {
          id: assetId,
          type: 'image' as const,
          meta: {},
          props: {
            src: dataUrl,
            w: 0,
            h: 0,
            name: file.name,
            mimeType: file.type,
            isAnimated: false,
          },
        } as unknown as TLAsset;

        editor.createAssets([asset]);

        // Create an image shape centered on the current viewport
        const { x, y } = editor.getViewportScreenCenter();
        const screenPoint = editor.screenToPage({ x, y });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        editor.createShapes([{
          type: 'image',
          x: screenPoint.x,
          y: screenPoint.y,
          props: {
            assetId: assetId as any,
            w: 400,
            h: 300,
          },
        }] as any);

        // If SVG, tldraw will resolve it — nothing extra needed.

        toast({
          title: 'Image added',
          description: `${file.name} has been placed on the canvas.`,
        });
      } catch {
        toast({
          title: 'Upload failed',
          description: 'Could not read the file. Please try again.',
          variant: 'destructive',
        });
      }

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [editorRef],
  );

  // ----------------------------------------------------------
  // Export PNG handler
  // ----------------------------------------------------------
  const handleExportPng = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) {
      toast({
        title: 'Canvas not ready',
        description: 'Please wait for the whiteboard to finish loading.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Get all shapes on the current page
      const shapes = editor.getCurrentPageShapes();

      if (shapes.length === 0) {
        toast({
          title: 'Canvas is empty',
          description: 'There are no shapes to export.',
          variant: 'destructive',
        });
        return;
      }

      const result = await editor.toImage(shapes as TLShape[], {
        format: 'png',
        scale: 2,
        padding: 'auto',
        background: true,
      });

      if (!result) {
        toast({
          title: 'Export failed',
          description: 'Could not generate the PNG.',
          variant: 'destructive',
        });
        return;
      }

      triggerDownload(result.blob, `whiteboard-${roomId}-${Date.now()}.png`);
      toast({ title: 'PNG exported', description: 'Your whiteboard has been downloaded.' });
    } catch {
      toast({
        title: 'Export failed',
        description: 'Something went wrong while generating the PNG.',
        variant: 'destructive',
      });
    }
  }, [editorRef, roomId]);

  // ----------------------------------------------------------
  // Export PDF handler (placeholder)
  // ----------------------------------------------------------
  const handleExportPdf = useCallback(() => {
    toast({
      title: 'PDF export',
      description: 'PDF export with branding — use the BrandedPdfExport component.',
    });
  }, []);

  // ----------------------------------------------------------
  // Save to Template handler
  // ----------------------------------------------------------
  const handleSaveTemplate = useCallback(async () => {
    if (!templateName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for the template.',
        variant: 'destructive',
      });
      return;
    }

    const editor = editorRef.current;
    if (!editor) {
      toast({
        title: 'Canvas not ready',
        description: 'Please wait for the whiteboard to finish loading.',
        variant: 'destructive',
      });
      return;
    }

    setSavingTemplate(true);
    try {
      const snapshot = editor.getSnapshot();
      const res = await authFetch('/api/room/templates', {
        method: 'POST',
        body: JSON.stringify({
          roomId,
          name: templateName.trim(),
          snapshot,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast({
          title: 'Save failed',
          description: data.error || 'Could not save the template.',
          variant: 'destructive',
        });
        setSavingTemplate(false);
        return;
      }

      toast({ title: 'Template saved', description: `"${templateName.trim()}" is now available as a template.` });
      setTemplateDialogOpen(false);
      setTemplateName('');
    } catch {
      toast({
        title: 'Save failed',
        description: 'Network error — please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingTemplate(false);
    }
  }, [editorRef, roomId, templateName]);

  // ----------------------------------------------------------
  // Share handler
  // ----------------------------------------------------------
  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied!',
        description: 'The room URL has been copied to your clipboard.',
      });
    } catch {
      // Fallback for insecure contexts
      try {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        toast({
          title: 'Link copied!',
          description: 'The room URL has been copied to your clipboard.',
        });
      } catch {
        toast({
          title: 'Copy failed',
          description: 'Could not copy the link. Please copy the URL manually.',
          variant: 'destructive',
        });
      }
    }
  }, []);

  // ----------------------------------------------------------
  // Gate helpers — show paywall when feature is locked
  // ----------------------------------------------------------
  const gate = (feature: string) => {
    if (!hasAccess) {
      openPaywall(feature);
    }
    return hasAccess;
  };

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        aria-hidden="true"
        onChange={handleUpload}
      />

      {/* Floating pill bar — above UsageBar */}
      <TooltipProvider delayDuration={400}>
        <div
          className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40
            flex items-center gap-1 px-2 py-1.5
            bg-background/80 backdrop-blur-md border
            rounded-full shadow-lg"
          role="toolbar"
          aria-label="File attachments and export"
        >
          {/* Upload Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-full"
                onClick={() => {
                  if (gate('Upload images')) {
                    fileInputRef.current?.click();
                  }
                }}
                aria-label="Upload image or PDF"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {hasAccess ? 'Upload image' : 'Upload image (Pro)'}
            </TooltipContent>
          </Tooltip>

          {/* Export PNG Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-full"
                onClick={() => {
                  if (gate('Export PNG')) {
                    handleExportPng();
                  }
                }}
                aria-label="Export as PNG"
              >
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {hasAccess ? 'Export PNG' : 'Export PNG (Pro)'}
            </TooltipContent>
          </Tooltip>

          {/* Export PDF Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-full"
                onClick={() => {
                  if (gate('Export PDF')) {
                    handleExportPdf();
                  }
                }}
                aria-label="Export as PDF"
              >
                <FileText className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {hasAccess ? 'Export PDF' : 'Export PDF (Pro)'}
            </TooltipContent>
          </Tooltip>

          {/* Save to Template Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-full"
                onClick={() => {
                  if (gate('Templates')) {
                    setTemplateDialogOpen(true);
                  }
                }}
                aria-label="Save as template"
              >
                <LayoutTemplate className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {hasAccess ? 'Save as template' : 'Save as template (Pro)'}
            </TooltipContent>
          </Tooltip>

          {/* Share Button — always available */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-full"
                onClick={handleShare}
                aria-label="Copy share link"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Copy share link</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* Template Name Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-primary" />
              Save as Template
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Give this template a name so you can find it later when creating a new board.
            </p>
            <Input
              placeholder="e.g. Algebra Review, Lab Report Outline…"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveTemplate();
                }
              }}
              autoFocus
              disabled={savingTemplate}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTemplateDialogOpen(false);
                  setTemplateName('');
                }}
                disabled={savingTemplate}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !templateName.trim()}
              >
                {savingTemplate ? 'Saving…' : 'Save Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
