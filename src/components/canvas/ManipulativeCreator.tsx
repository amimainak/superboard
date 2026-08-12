'use client';

import React, { useState, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { renderManipulative, type ManipulativeSpec } from '@/lib/manipulative-renderer';
import type { Canvas as FabricCanvasType } from 'fabric';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Wand2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ManipulativeCreatorProps {
  canvasRef: React.RefObject<FabricCanvasType | null>;
}

export default function ManipulativeCreator({ canvasRef }: ManipulativeCreatorProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const subject = useAppStore((s) => s.room.subject);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const desc = description.trim();
    if (!desc || !canvasRef.current) return;

    setLoading(true);
    try {
      const res = await fetch('/api/manipulative/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: desc, subject }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Generation failed');
      }

      const { spec } = (await res.json()) as { spec: ManipulativeSpec };

      // Render the manipulative onto the canvas
      const objects = renderManipulative(spec);
      const fc = canvasRef.current;

      // Position at center of viewport
      const vpt = fc.viewportTransform || [1, 0, 0, 1, 0, 0];
      const centerX = (fc.getWidth() / 2 - vpt[4]) / vpt[0];
      const centerY = (fc.getHeight() / 2 - vpt[5]) / vpt[3];

      for (const obj of objects) {
        // Offset objects relative to center
        if (obj.left !== undefined) {
          obj.left += centerX - 150;
        }
        if (obj.top !== undefined) {
          obj.top += centerY - 100;
        }
        (obj as any).name = `manipulative-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        fc.add(obj);
      }
      fc.renderAll();

      toast({
        title: 'Manipulative added!',
        description: `"${desc}" rendered to canvas.`,
      });
      setDescription('');
      setOpen(false);
    } catch (err) {
      toast({
        title: 'Failed to create manipulative',
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="w-9 h-9 text-primary"
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        aria-label="Create manipulative from description"
      >
        <Wand2 className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-1 p-1 rounded-lg border bg-card shadow-sm"
    >
      <Input
        ref={inputRef}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder='e.g. "fraction bars for 3/4"'
        className="h-8 w-44 text-xs"
        disabled={loading}
        aria-label="Manipulative description"
      />
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : (
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="w-8 h-8"
          disabled={!description.trim()}
          aria-label="Generate manipulative"
        >
          <Wand2 className="w-3.5 h-3.5" />
        </Button>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="w-8 h-8"
        onClick={() => { setOpen(false); setDescription(''); }}
        aria-label="Close manipulative creator"
      >
        <X className="w-3.5 h-3.5" />
      </Button>
    </form>
  );
}
