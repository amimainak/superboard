'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Editor } from '@tldraw/tldraw';
import { X, Clock, Plus, GripVertical, Trash2, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TimelinePanelProps {
  editor: unknown;
  onClose?: () => void;
}

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  color: string;
}

const ERA_COLORS = [
  { label: 'Ancient', color: '#92400e', bg: '#fef3c7' },
  { label: 'Medieval', color: '#7c3aed', bg: '#ede9fe' },
  { label: 'Renaissance', color: '#0369a1', bg: '#e0f2fe' },
  { label: 'Revolution', color: '#dc2626', bg: '#fee2e2' },
  { label: 'Modern', color: '#059669', bg: '#d1fae5' },
  { label: 'Contemporary', color: '#2563eb', bg: '#dbeafe' },
];

export default function TimelinePanel({ editor, onClose }: TimelinePanelProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(ERA_COLORS[0].color);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragOverRef = useRef<number | null>(null);

  const addEvent = useCallback(() => {
    if (!newTitle.trim() || !newDate.trim()) return;
    const event: TimelineEvent = {
      id: `evt-${Date.now()}` as any,
      title: newTitle.trim(),
      date: newDate.trim(),
      description: newDesc.trim(),
      color: newColor,
    };
    setEvents(prev => {
      const updated = [...prev, event];
      updated.sort((a, b) => {
        const numA = parseInt(a.date.replace(/[^\d-]/g, ''));
        const numB = parseInt(b.date.replace(/[^\d-]/g, ''));
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.date.localeCompare(b.date);
      });
      return updated;
    });
    setNewTitle('');
    setNewDate('');
    setNewDesc('');
  }, [newTitle, newDate, newDesc, newColor]);

  const removeEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((index: number) => {
    dragOverRef.current = index;
  }, []);

  const handleDrop = useCallback((index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    setEvents(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(dragIndex, 1);
      arr.splice(index, 0, moved);
      return arr;
    });
    setDragIndex(null);
    dragOverRef.current = null;
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  const addToBoard = useCallback(() => {
    const ed = editor as Editor | null;
    if (!ed || events.length === 0) return;
    const center = ed.getCurrentPageBounds()?.center || { x: 400, y: 300 };
    const startX = center.x - 250;
    const startY = center.y - 200;
    const spacing = 70;
    const shapes: any[] = [];

    // Title
    shapes.push({
      id: `shape:tl-title-${Date.now()}` as any,
      type: 'text' as const,
      x: startX,
      y: startY - 50,
      props: { text: 'Timeline', size: 'xl', font: 'sans' },
    });

    // Vertical line
    shapes.push({
      id: `shape:tl-line-${Date.now()}` as any,
      type: 'line' as const,
      x: startX + 30,
      y: startY,
      props: {
        points: [{ x: 0, y: 0 }, { x: 0, y: events.length * spacing }],
        color: '#9ca3af',
        size: 'm',
      },
    });

    // Events
    events.forEach((evt, i) => {
      const y = startY + i * spacing;
      // Dot
      shapes.push({
        id: `shape:tl-dot-${evt.id}-${Date.now()}` as any,
        type: 'ellipse' as const,
        x: startX + 24,
        y: y - 4,
        props: { w: 12, h: 12, color: evt.color, fill: 'solid' },
      });
      // Date
      shapes.push({
        id: `shape:tl-date-${evt.id}-${Date.now()}` as any,
        type: 'text' as const,
        x: startX - 80,
        y: y - 8,
        props: { text: evt.date, size: 's', font: 'sans', color: evt.color },
      });
      // Title
      shapes.push({
        id: `shape:tl-title-${evt.id}-${Date.now()}` as any,
        type: 'text' as const,
        x: startX + 50,
        y: y - 10,
        props: { text: evt.title, size: 'm', font: 'sans' },
      });
      // Description
      if (evt.description) {
        shapes.push({
          id: `shape:tl-desc-${evt.id}-${Date.now()}` as any,
          type: 'text' as const,
          x: startX + 50,
          y: y + 8,
          props: { text: evt.description, size: 's', font: 'sans', color: '#6b7280' },
        });
      }
    });

    ed.createShapes(shapes);
  }, [editor, events]);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 1001,
    width: 420,
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto',
  };

  return (
    <div style={panelStyle}>
      <Card className="shadow-xl border-2 border-violet-200 bg-white/97 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-violet-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timeline Builder
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add Event Form */}
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-medium">Title</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Event title" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Date/Year
              </Label>
              <Input value={newDate} onChange={e => setNewDate(e.target.value)} placeholder="e.g. 1776" className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Era/Theme</Label>
              <div className="flex flex-wrap gap-1">
                {ERA_COLORS.map(era => (
                  <Badge
                    key={era.label}
                    variant={newColor === era.color ? 'default' : 'outline'}
                    className="text-[9px] cursor-pointer px-1.5 py-0"
                    style={newColor === era.color ? { backgroundColor: era.color, borderColor: era.color } : { borderColor: era.color, color: era.color }}
                    onClick={() => setNewColor(era.color)}
                  >
                    {era.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-medium">Description</Label>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description..." className="min-h-[48px] text-xs" />
            </div>
          </div>

          <Button onClick={addEvent} disabled={!newTitle.trim() || !newDate.trim()} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="w-4 h-4 mr-1.5" /> Add Event
          </Button>

          {/* Timeline Display */}
          {events.length > 0 && (
            <ScrollArea className="max-h-72">
              <div className="relative pl-6 border-l-2 border-violet-200 ml-3 space-y-1">
                {events.map((evt, index) => (
                  <div
                    key={evt.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={() => handleDragOver(index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    className={`relative flex items-start gap-2 p-2 rounded-lg border transition-colors cursor-grab active:cursor-grabbing ${
                      dragIndex === index ? 'opacity-40' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Timeline dot */}
                    <div
                      className="absolute -left-[25px] top-3 w-3 h-3 rounded-full border-2 border-white"
                      style={{ backgroundColor: evt.color }}
                    />
                    {/* Grip handle */}
                    <GripVertical className="w-4 h-4 mt-0.5 text-gray-300 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold" style={{ color: evt.color }}>{evt.date}</span>
                        <span className="text-xs font-semibold truncate">{evt.title}</span>
                        <button onClick={() => removeEvent(evt.id)} className="ml-auto flex-shrink-0">
                          <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                      {evt.description && (
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{evt.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {events.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Add events to build your timeline. Events will be sorted by date.
            </div>
          )}

          <Button onClick={addToBoard} disabled={events.length === 0} variant="outline" className="w-full border-violet-300 text-violet-700">
            <Plus className="w-4 h-4 mr-1.5" /> Add to Board
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
