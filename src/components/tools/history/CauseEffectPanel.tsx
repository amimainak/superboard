'use client';

import React, { useState, useCallback } from 'react';
import { Editor } from '@tldraw/tldraw';
import { X, ArrowRightLeft, Plus, Trash2, GripVertical, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CauseEffectPanelProps {
  editor: unknown;
  onClose?: () => void;
}

interface ChainNode {
  id: string;
  text: string;
  type: 'cause' | 'effect' | 'event';
  description: string;
}

interface ChainLink {
  fromId: string;
  toId: string;
}

const NODE_TYPES = [
  { value: 'cause' as const, label: 'Cause', color: '#dc2626', bg: '#fee2e2' },
  { value: 'event' as const, label: 'Event', color: '#2563eb', bg: '#dbeafe' },
  { value: 'effect' as const, label: 'Effect', color: '#059669', bg: '#d1fae5' },
];

export default function CauseEffectPanel({ editor, onClose }: CauseEffectPanelProps) {
  const [nodes, setNodes] = useState<ChainNode[]>([]);
  const [links, setLinks] = useState<ChainLink[]>([]);
  const [newText, setNewText] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'cause' | 'effect' | 'event'>('cause');
  const [linkMode, setLinkMode] = useState(false);
  const [linkSource, setLinkSource] = useState<string | null>(null);

  const addNode = useCallback(() => {
    if (!newText.trim()) return;
    const node: ChainNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` as any,
      text: newText.trim(),
      type: newType,
      description: newDesc.trim(),
    };
    setNodes(prev => [...prev, node]);
    setNewText('');
    setNewDesc('');
  }, [newText, newDesc, newType]);

  const removeNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setLinks(prev => prev.filter(l => l.fromId !== id && l.toId !== id));
    if (linkSource === id) setLinkSource(null);
  }, [linkSource]);

  const handleNodeClick = useCallback((id: string) => {
    if (!linkMode) return;
    if (!linkSource) {
      setLinkSource(id);
    } else if (linkSource !== id) {
      setLinks(prev => {
        const exists = prev.some(l => l.fromId === linkSource && l.toId === id);
        if (exists) return prev;
        return [...prev, { fromId: linkSource, toId: id }];
      });
      setLinkSource(null);
    }
  }, [linkMode, linkSource]);

  const removeLink = useCallback((fromId: string, toId: string) => {
    setLinks(prev => prev.filter(l => !(l.fromId === fromId && l.toId === toId)));
  }, []);

  const addToBoard = useCallback(() => {
    const ed = editor as Editor | null;
    if (!ed || nodes.length === 0) return;
    const center = ed.getCurrentPageBounds()?.center || { x: 400, y: 300 };
    const startX = center.x - 200;
    const startY = center.y - 150;
    const nodeH = 60;
    const nodeW = 200;
    const shapes: any[] = [];

    // Title
    shapes.push({
      id: `shape:ce-title-${Date.now()}` as any,
      type: 'text' as const,
      x: startX,
      y: startY - 50,
      props: { text: 'Cause & Effect Chain', size: 'l', font: 'sans' },
    });

    // Position nodes in a flowchart layout
    const nodePositions = new Map<string, { x: number; y: number }>();
    const nodeById = new Map(nodes.map(n => [n.id, n]));
    const placed = new Set<string>();
    const queue: string[] = [];

    // Find root nodes (no incoming links)
    const hasIncoming = new Set(links.map(l => l.toId));
    const roots = nodes.filter(n => !hasIncoming.has(n.id));
    if (roots.length === 0 && nodes.length > 0) queue.push(nodes[0].id);
    else roots.forEach(r => queue.push(r.id));

    let col = 0;
    const visited = new Set<string>();
    const colCount = new Map<number, number>();

    while (queue.length > 0) {
      const batchSize = queue.length;
      for (let i = 0; i < batchSize; i++) {
        const id = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);
        const rowCount = colCount.get(col) || 0;
        nodePositions.set(id, { x: startX + col * (nodeW + 60), y: startY + rowCount * (nodeH + 30) });
        colCount.set(col, rowCount + 1);

        // Add children
        links.filter(l => l.fromId === id).forEach(l => {
          if (!visited.has(l.toId)) queue.push(l.toId);
        });
      }
      col++;
    }

    // Place unvisited
    nodes.forEach((n, i) => {
      if (!nodePositions.has(n.id)) {
        nodePositions.set(n.id, { x: startX + col * (nodeW + 60), y: startY + i * (nodeH + 30) });
      }
    });

    // Draw nodes
    nodePositions.forEach((pos, id) => {
      const node = nodeById.get(id);
      if (!node) return;
      const typeInfo = NODE_TYPES.find(t => t.value === node.type);

      // Box
      shapes.push({
        id: `shape:ce-box-${id}-${Date.now()}` as any,
        type: 'geo' as const,
        x: pos.x,
        y: pos.y,
        props: {
          geo: 'rounded-rectangle',
          w: nodeW,
          h: nodeH,
          color: typeInfo?.color || '#374151',
          fill: 'semi',
          label: node.text,
          size: 'm',
        },
      });

      // Type badge text
      shapes.push({
        id: `shape:ce-badge-${id}-${Date.now()}` as any,
        type: 'text' as const,
        x: pos.x + 4,
        y: pos.y + 4,
        props: { text: node.type.toUpperCase(), size: 'xs', font: 'sans', color: typeInfo?.color },
      });

      if (node.description) {
        shapes.push({
          id: `shape:ce-desc-${id}-${Date.now()}` as any,
          type: 'text' as const,
          x: pos.x + 4,
          y: pos.y + nodeH + 4,
          props: { text: node.description, size: 's', font: 'sans', color: '#6b7280' },
        });
      }
    });

    // Draw arrows
    links.forEach((link, i) => {
      const from = nodePositions.get(link.fromId);
      const to = nodePositions.get(link.toId);
      if (!from || !to) return;
      shapes.push({
        id: `shape:ce-arrow-${i}-${Date.now()}` as any,
        type: 'arrow' as const,
        x: from.x + nodeW,
        y: from.y + nodeH / 2,
        props: {
          start: { type: 'point', x: 0, y: 0 },
          end: { type: 'point', x: to.x - (from.x + nodeW), y: to.y + nodeH / 2 - (from.y + nodeH / 2) },
          color: '#6b7280',
          size: 's',
          arrowheadEnd: 'arrow',
        },
      });
    });

    ed.createShapes(shapes);
  }, [editor, nodes, links]);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 1001,
    width: 440,
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto',
  };

  return (
    <div style={panelStyle}>
      <Card className="shadow-xl border-2 border-rose-200 bg-white/97 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-rose-700 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Cause & Effect Chain
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add node form */}
          <div className="space-y-2">
            <div className="flex gap-2">
              {NODE_TYPES.map(t => (
                <Badge
                  key={t.value}
                  variant={newType === t.value ? 'default' : 'outline'}
                  className="cursor-pointer text-xs flex-1 justify-center"
                  style={newType === t.value ? { backgroundColor: t.color, borderColor: t.color } : { borderColor: t.color, color: t.color }}
                  onClick={() => setNewType(t.value)}
                >
                  {t.label}
                </Badge>
              ))}
            </div>
            <Input value={newText} onChange={e => setNewText(e.target.value)} placeholder={'Node text (e.g. Taxation without representation)'} className="h-8 text-sm" />
            <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" className="min-h-[40px] text-xs" />
            <Button onClick={addNode} disabled={!newText.trim()} className="w-full bg-rose-600 hover:bg-rose-700 text-white">
              <Plus className="w-4 h-4 mr-1.5" /> Add Node
            </Button>
          </div>

          {/* Link mode toggle */}
          {nodes.length >= 2 && (
            <Button
              variant={linkMode ? 'default' : 'outline'}
              size="sm"
              className={`w-full ${linkMode ? 'bg-rose-600' : 'border-rose-300 text-rose-700'}`}
              onClick={() => { setLinkMode(!linkMode); setLinkSource(null); }}
            >
              <ArrowDown className="w-4 h-4 mr-1.5" />
              {linkMode ? `Linking... Click target${linkSource ? ' (source selected)' : ''}` : 'Connect Nodes'}
            </Button>
          )}

          {/* Nodes list */}
          {nodes.length > 0 && (
            <ScrollArea className="max-h-56">
              <div className="space-y-1.5">
                {nodes.map(node => {
                  const typeInfo = NODE_TYPES.find(t => t.value === node.type);
                  return (
                    <div
                      key={node.id}
                      onClick={() => handleNodeClick(node.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                        linkMode ? 'hover:border-rose-400' : ''
                      } ${linkSource === node.id ? 'ring-2 ring-rose-400 bg-rose-50' : ''}`}
                    >
                      <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                      <div
                        className="w-2 h-8 rounded-full flex-shrink-0"
                        style={{ backgroundColor: typeInfo?.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{node.text}</div>
                        <div className="text-[10px] text-muted-foreground">{node.type} {node.description ? `— ${node.description.slice(0, 40)}` : ''}</div>
                      </div>
                      <Badge variant="outline" className="text-[9px]" style={{ borderColor: typeInfo?.color, color: typeInfo?.color }}>{node.type}</Badge>
                      <button onClick={e => { e.stopPropagation(); removeNode(node.id); }}>
                        <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Links list */}
          {links.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500">Connections</div>
              {links.map((link, i) => {
                const from = nodes.find(n => n.id === link.fromId);
                const to = nodes.find(n => n.id === link.toId);
                if (!from || !to) return null;
                return (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="truncate max-w-[120px]">{from.text}</span>
                    <ArrowDown className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate max-w-[120px]">{to.text}</span>
                    <button onClick={() => removeLink(link.fromId, link.toId)} className="ml-auto">
                      <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {nodes.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Add cause, event, or effect nodes, then connect them to build your chain.
            </div>
          )}

          <Button onClick={addToBoard} disabled={nodes.length === 0} variant="outline" className="w-full border-rose-300 text-rose-700">
            <Plus className="w-4 h-4 mr-1.5" /> Add to Board
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
