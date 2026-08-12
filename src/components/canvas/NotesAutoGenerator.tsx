'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Canvas as FabricCanvasType } from 'fabric';
import { generateLessonNotes, type LessonNote } from '@/lib/canvas-to-notes';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Copy, Check, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotesAutoGeneratorProps {
  canvasRef: React.RefObject<FabricCanvasType | null>;
  /** Callback from parent: fired whenever canvas objects change */
  onChangeSignal?: number;
}

export default function NotesAutoGenerator({ canvasRef, onChangeSignal }: NotesAutoGeneratorProps) {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [collapsed, setCollapsed] = useState(true);
  const [copied, setCopied] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  const currentPage = useAppStore((s) => s.room.currentPageIndex);

  const regenerate = useCallback(() => {
    const fc = canvasRef.current;
    if (!fc) return;
    const result = generateLessonNotes(fc, currentPage);
    setNotes(result);
  }, [canvasRef, currentPage]);

  // Debounce: regenerate notes 5 seconds after last change signal
  useEffect(() => {
    if (onChangeSignal === undefined) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      regenerate();
    }, 5000);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [onChangeSignal, regenerate]);

  // Also regenerate on page change
  useEffect(() => {
    const timer = setTimeout(regenerate, 300);
    return () => clearTimeout(timer);
  }, [currentPage, regenerate]);

  const handleCopy = async () => {
    const text = notes
      .map((n) => `[${n.type.toUpperCase()}] ${n.content}`)
      .join('\n');
    if (!text) {
      toast({ title: 'No notes to copy', description: 'Draw or type on the canvas to generate notes.' });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: 'Notes copied!', description: `${notes.length} note${notes.length !== 1 ? 's' : ''} copied to clipboard.` });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy failed', description: 'Please select and copy manually.' });
    }
  };

  if (notes.length === 0) return null;

  return (
    <div className="absolute top-3 right-3 z-30 w-64">
      <button
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-card/95 border shadow-lg backdrop-blur-sm hover:bg-accent/50 transition-colors"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand auto-generated notes' : 'Collapse notes'}
      >
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <FileText className="w-4 h-4 text-emerald-600" />
          Lesson Notes
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700">
            {notes.length}
          </span>
        </span>
        {collapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
      </button>

      {!collapsed && (
        <div className="mt-1 max-h-80 overflow-y-auto rounded-lg bg-card/95 border shadow-lg backdrop-blur-sm">
          <div className="p-3 space-y-2">
            {notes.map((note) => (
              <div key={note.id} className="text-xs text-muted-foreground leading-relaxed">
                <span className="inline-block px-1.5 py-0.5 mr-1.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                  {note.type}
                </span>
                {note.content.length > 80 ? note.content.slice(0, 80) + '…' : note.content}
              </div>
            ))}
          </div>
          <div className="border-t p-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Notes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
