'use client';

import React, { useState, useCallback } from 'react';
import { Editor } from '@tldraw/tldraw';
import { X, FileText, Plus, Trash2, GripVertical, PenLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EssayBuilderProps {
  editor: unknown;
  onClose?: () => void;
}

interface EssayBlock {
  id: string;
  type: 'thesis' | 'topic-sentence' | 'evidence' | 'analysis' | 'counterargument' | 'conclusion';
  text: string;
}

const BLOCK_TYPES = [
  { value: 'thesis' as const, label: 'Thesis', color: '#dc2626', bg: '#fee2e2', icon: '🎯' },
  { value: 'topic-sentence' as const, label: 'Topic Sentence', color: '#2563eb', bg: '#dbeafe', icon: '📌' },
  { value: 'evidence' as const, label: 'Evidence', color: '#059669', bg: '#d1fae5', icon: '📎' },
  { value: 'analysis' as const, label: 'Analysis', color: '#7c3aed', bg: '#ede9fe', icon: '🔍' },
  { value: 'counterargument' as const, label: 'Counterargument', color: '#d97706', bg: '#fef3c7', icon: '⚡' },
  { value: 'conclusion' as const, label: 'Conclusion', color: '#0891b2', bg: '#cffafe', icon: '✅' },
];

export default function EssayBuilder({ editor, onClose }: EssayBuilderProps) {
  const [blocks, setBlocks] = useState<EssayBlock[]>([]);
  const [newType, setNewType] = useState<EssayBlock['type']>('thesis');
  const [newText, setNewText] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const addBlock = useCallback(() => {
    if (!newText.trim()) return;
    const block: EssayBlock = {
      id: `blk-${Date.now()}` as any,
      type: newType,
      text: newText.trim(),
    };
    setBlocks(prev => [...prev, block]);
    setNewText('');
  }, [newType, newText]);

  const removeBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  }, []);

  const updateBlockText = useCallback((id: string, text: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, text } : b));
  }, []);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDrop = useCallback((targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    setBlocks(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIndex, 1);
      arr.splice(targetIndex, 0, moved);
      return arr;
    });
    setDragIndex(null);
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  const addToBoard = useCallback(() => {
    const ed = editor as Editor | null;
    if (!ed || blocks.length === 0) return;
    const center = ed.getCurrentPageBounds()?.center || { x: 400, y: 300 };
    const startX = center.x - 200;
    const startY = center.y - 200;
    const shapes: any[] = [];

    shapes.push({
      id: `shape:eb-title-${Date.now()}` as any,
      type: 'text' as const,
      x: startX,
      y: startY - 40,
      props: { text: 'Essay Outline', size: 'xl', font: 'sans' },
    });

    let y = startY;
    blocks.forEach((block, i) => {
      const typeInfo = BLOCK_TYPES.find(t => t.value === block.type);
      const blockH = 40;

      // Type label
      shapes.push({
        id: `shape:eb-type-${block.id}-${Date.now()}` as any,
        type: 'text' as const,
        x: startX,
        y,
        props: { text: `${typeInfo?.icon || ''} ${block.type.replace('-', ' ').toUpperCase()}`, size: 'xs', font: 'sans', color: typeInfo?.color },
      });

      // Block background
      shapes.push({
        id: `shape:eb-bg-${block.id}-${Date.now()}` as any,
        type: 'geo' as const,
        x: startX,
        y: y + 14,
        props: { geo: 'rounded-rectangle', w: 400, h: blockH, color: typeInfo?.color || '#374151', fill: 'semi' },
      });

      // Text
      shapes.push({
        id: `shape:eb-text-${block.id}-${Date.now()}` as any,
        type: 'text' as const,
        x: startX + 10,
        y: y + 20,
        props: { text: block.text.slice(0, 100), size: 'm', font: 'sans' },
      });

      y += blockH + 30;
    });

    ed.createShapes(shapes);
  }, [editor, blocks]);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 1001,
    width: 460,
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto',
  };

  return (
    <div style={panelStyle}>
      <Card className="shadow-xl border-2 border-rose-200 bg-white/97 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-rose-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Essay Structure Builder
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Block type selector */}
          <div className="flex flex-wrap gap-1.5">
            {BLOCK_TYPES.map(t => (
              <Badge
                key={t.value}
                variant={newType === t.value ? 'default' : 'outline'}
                className="cursor-pointer text-[10px]"
                style={newType === t.value ? { backgroundColor: t.color, borderColor: t.color } : { borderColor: t.color, color: t.color }}
                onClick={() => setNewType(t.value)}
              >
                {t.icon} {t.label}
              </Badge>
            ))}
          </div>

          {/* Add block */}
          <div className="space-y-2">
            <Textarea
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Write your essay block content here..."
              className="min-h-[60px] text-sm"
            />
            <Button onClick={addBlock} disabled={!newText.trim()} className="w-full bg-rose-600 hover:bg-rose-700 text-white">
              <Plus className="w-4 h-4 mr-1.5" /> Add Block
            </Button>
          </div>

          {/* Blocks list with drag reorder */}
          {blocks.length > 0 && (
            <ScrollArea className="max-h-72">
              <div className="space-y-1.5">
                {blocks.map((block, index) => {
                  const typeInfo = BLOCK_TYPES.find(t => t.value === block.type);
                  const isEditing = editingId === block.id;
                  return (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDrop(index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-grab active:cursor-grabbing transition-colors ${
                        dragIndex === index ? 'opacity-40' : 'hover:bg-gray-50'
                      }`}
                      style={{ borderLeftColor: typeInfo?.color, borderLeftWidth: 3 }}
                    >
                      <GripVertical className="w-4 h-4 mt-0.5 text-gray-300 flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="text-[9px]"
                            style={{ borderColor: typeInfo?.color, color: typeInfo?.color, backgroundColor: typeInfo?.bg }}
                          >
                            {typeInfo?.icon} {typeInfo?.label}
                          </Badge>
                          <button onClick={() => setEditingId(isEditing ? null : block.id)}>
                            <PenLine className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                          </button>
                        </div>
                        {isEditing ? (
                          <Textarea
                            value={block.text}
                            onChange={e => updateBlockText(block.id, e.target.value)}
                            onBlur={() => setEditingId(null)}
                            className="min-h-[40px] text-xs"
                            autoFocus
                          />
                        ) : (
                          <p className="text-xs text-gray-700 line-clamp-2">{block.text}</p>
                        )}
                      </div>
                      <button onClick={() => removeBlock(block.id)} className="flex-shrink-0 mt-1">
                        <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {blocks.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Add essay blocks to build your outline. Drag to reorder.
            </div>
          )}

          <Button onClick={addToBoard} disabled={blocks.length === 0} variant="outline" className="w-full border-rose-300 text-rose-700">
            <Plus className="w-4 h-4 mr-1.5" /> Add to Board
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
