// ============================================================
// FileImport — PDF/Image Background Importer
// ============================================================
// Allows tutors to import PDFs and images as locked canvas backgrounds.
// Each PDF page becomes a separate canvas page.
// Uses browser APIs (FileReader + pdf.js-lite) for client-side processing.
// ============================================================

'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Editor, TLAssetId, TLShapePartial } from '@tldraw/tldraw';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Upload, FileImage, FileText, X } from 'lucide-react';
import { useAppStore } from '@/store/app-store';

interface FileImportProps {
  editor: Editor | null;
}

export default function FileImport({ editor }: FileImportProps) {
  const isTutor = useAppStore((s) => s.room.isTutor);
  const tier = useAppStore((s) => s.tier);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const canImport = isTutor && (tier === 'PRO' || tier === 'AGENCY');

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;

      setImporting(true);
      try {
        if (file.type === 'application/pdf') {
          await importPdfAsBackground(file, editor);
        } else if (file.type.startsWith('image/')) {
          await importImageAsBackground(file, editor);
        }
      } catch (err) {
        console.error('[FileImport] Error importing file:', err);
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [editor]
  );

  if (!canImport) return null;

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.svg"
        className="hidden"
        onChange={handleFileSelect}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            aria-label="Import PDF or image as background"
          >
            {importing ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          {importing ? 'Importing...' : 'Import Background (PDF/Image)'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

// ============================================================
// Import a PDF: each page becomes a Tldraw page with image bg
// ============================================================
async function importPdfAsBackground(file: File, editor: Editor) {
  // Create object URL for the PDF
  const arrayBuffer = await file.arrayBuffer();

  // Use pdf.js to render each page to canvas, then to image
  const PDFJS = await import('pdfjs-dist');
  PDFJS.GlobalWorkerOptions.workerSrc = '';

  const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 }); // 2x for crisp rendering

    // Render to offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({ canvas, canvasContext: ctx, viewport } as any).promise;

    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });

    // Create page if needed (first page uses current, rest create new)
    if (i > 1) {
      const newPageId = `page:imported-${Date.now()}-${i}`;
      (editor as any).addPages([
        {
          id: newPageId,
          name: `Page ${editor.getPages().length + 1}`,
          index: editor.getPages().length,
          translation: { x: 0, y: 0 },
        },
      ]);
      editor.setCurrentPage(newPageId as any);
    }

    // Upload as asset and place as background image
    const assetIds = editor.createAssets([
      {
        type: 'image',
        name: `${file.name} - Page ${i}`,
        mimeType: 'image/png',
        src: canvas.toDataURL('image/png'),
        width: viewport.width,
        height: viewport.height,
      } as any,
    ]);
    const assetId = (assetIds as any)[0];

    if (assetId) {
      // Create an image shape at the center of the viewport
      const bounds = editor.getCurrentPageBounds();
      if (bounds) {
        const scale = Math.min(
          (bounds.width * 0.9) / (viewport.width / 2),
          (bounds.height * 0.9) / (viewport.height / 2)
        );
        const w = (viewport.width / 2) * scale;
        const h = (viewport.height / 2) * scale;

        editor.createShapes([
          {
            type: 'image',
            x: bounds.center.x - w / 2,
            y: bounds.center.y - h / 2,
            width: w,
            height: h,
            assetId,
            isLocked: true, // Lock so students can't accidentally move
            opacity: 1,
          } as any,
        ] as any);
      }
    }
  }

  console.log(`[FileImport] Imported ${numPages} pages from PDF`);
}

// ============================================================
// Import an image as a locked background shape
// ============================================================
async function importImageAsBackground(file: File, editor: Editor) {
  const arrayBuffer = await file.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: file.type });

  // Read dimensions from image
  const dimensions = await getImageDimensions(blob);
  const dataUrl = await blobToDataUrl(blob);

  // Create asset
  const assetIds = editor.createAssets([
    {
      type: 'image',
      name: file.name,
      mimeType: file.type,
      src: dataUrl,
      width: dimensions.width,
      height: dimensions.height,
    } as any,
  ]);
  const assetId = (assetIds as any)[0];

  if (assetId) {
    const bounds = editor.getCurrentPageBounds();
    if (bounds) {
      const scale = Math.min(
        (bounds.width * 0.9) / dimensions.width,
        (bounds.height * 0.9) / dimensions.height
      );
      const w = dimensions.width * scale;
      const h = dimensions.height * scale;

      editor.createShapes([
        {
          type: 'image',
          x: bounds.center.x - w / 2,
          y: bounds.center.y - h / 2,
          width: w,
          height: h,
          assetId,
          isLocked: true,
          opacity: 1,
        } as any,
      ] as any);
    }
  }

  console.log(`[FileImport] Imported image: ${file.name} (${dimensions.width}x${dimensions.height})`);
}

// ============================================================
// Helpers
// ============================================================
function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 800, height: 600 });
    img.src = URL.createObjectURL(blob);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
