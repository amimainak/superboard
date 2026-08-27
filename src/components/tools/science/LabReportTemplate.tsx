'use client';

import React, { useState, useCallback } from 'react';
import { Editor } from '@tldraw/tldraw';
import { X, FlaskConical, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LabReportTemplateProps {
  editor: unknown;
  onClose?: () => void;
}

interface Section {
  id: string;
  title: string;
  placeholder: string;
  content: string;
  expanded: boolean;
  color: string;
}

const DEFAULT_SECTIONS: Omit<Section, 'id' | 'content' | 'expanded'>[] = [
  { title: 'Title', placeholder: 'e.g. The Effect of Temperature on Enzyme Activity', color: '#2563eb' },
  { title: 'Hypothesis', placeholder: 'If... then... because... (your testable prediction)', color: '#dc2626' },
  { title: 'Materials', placeholder: 'List all materials and equipment used:\n- Beaker (250mL)\n- Thermometer\n- ...', color: '#059669' },
  { title: 'Procedure', placeholder: 'Step-by-step instructions:\n1. Gather materials\n2. Set up apparatus\n3. ...', color: '#7c3aed' },
  { title: 'Data Table', placeholder: 'Record your quantitative observations:\n| Trial | Temp (°C) | Time (s) | Result |\n|-------|-----------|-----------|--------|\n|   1   |     20    |     45    |  ...   |', color: '#d97706' },
  { title: 'Analysis', placeholder: 'Interpret your data. What patterns do you see? Calculate means, identify trends.', color: '#0891b2' },
  { title: 'Conclusion', placeholder: 'Restate hypothesis. Was it supported? Explain using evidence from your data. Sources of error?', color: '#be185d' },
];

export default function LabReportTemplate({ editor, onClose }: LabReportTemplateProps) {
  const [sections, setSections] = useState<Section[]>(
    DEFAULT_SECTIONS.map((s, i) => ({
      ...s,
      id: `sec-${i}`,
      content: '',
      expanded: i === 0,
    }))
  );
  const [reportTitle, setReportTitle] = useState('Lab Report');

  const toggleSection = useCallback((id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, expanded: !s.expanded } : s));
  }, []);

  const updateContent = useCallback((id: string, content: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, content } : s));
  }, []);

  const expandAll = useCallback(() => {
    setSections(prev => prev.map(s => ({ ...s, expanded: true })));
  }, []);

  const collapseAll = useCallback(() => {
    setSections(prev => prev.map(s => ({ ...s, expanded: false })));
  }, []);

  const addToBoard = useCallback(() => {
    const ed = editor as Editor | null;
    if (!ed) return;
    const center = ed.getCurrentPageBounds()?.center || { x: 400, y: 300 };
    const startX = center.x - 220;
    const shapes: any[] = [];
    let y = center.y - 200;

    // Report title
    shapes.push({
      id: `shape:lr-title-${Date.now()}` as any,
      type: 'text' as const,
      x: startX,
      y,
      props: { text: reportTitle || 'Lab Report', size: 'xl', font: 'sans' },
    });
    y += 40;

    // Line under title
    shapes.push({
      id: `shape:lr-line-${Date.now()}` as any,
      type: 'line' as const,
      x: startX,
      y,
      props: { points: [{ x: 0, y: 0 }, { x: 440, y: 0 }], color: '#374151', size: 'm' },
    });
    y += 20;

    // Sections
    sections.forEach((section) => {
      // Section header
      shapes.push({
        id: `shape:lr-sec-${section.id}-${Date.now()}` as any,
        type: 'text' as const,
        x: startX,
        y,
        props: { text: section.title.toUpperCase(), size: 'm', font: 'sans', color: section.color },
      });
      y += 20;

      // Content or placeholder
      const text = section.content || section.placeholder;
      const lines = text.split('\n');
      lines.forEach((line, li) => {
        shapes.push({
          id: `shape:lr-content-${section.id}-${li}-${Date.now()}` as any,
          type: 'text' as const,
          x: startX + 15,
          y: y + li * 16,
          props: {
            text: line,
            size: 's',
            font: 'sans',
            color: section.content ? '#374151' : '#9ca3af',
          },
        });
      });

      y += Math.max(lines.length * 16, 30) + 20;
    });

    ed.createShapes(shapes);
  }, [editor, sections, reportTitle]);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1001,
    width: 480,
    maxHeight: 'calc(100vh - 80px)',
    overflowY: 'auto',
  };

  const filledCount = sections.filter(s => s.content.trim()).length;

  return (
    <div style={panelStyle}>
      <Card className="shadow-xl border-2 border-emerald-200 bg-white/97 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
              <FlaskConical className="w-4 h-4" />
              Lab Report Template
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <Input
                value={reportTitle}
                onChange={e => setReportTitle(e.target.value)}
                placeholder="Report Title"
                className="h-7 text-xs w-48"
              />
              <Badge variant="outline" className="text-[9px] border-emerald-300 text-emerald-700">
                {filledCount}/{sections.length} filled
              </Badge>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={expandAll}>Expand All</Button>
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={collapseAll}>Collapse All</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[calc(100vh-220px)]">
            <div className="space-y-1.5">
              {sections.map(section => (
                <div
                  key={section.id}
                  className="rounded-lg border overflow-hidden"
                  style={{ borderColor: section.content ? section.color : '#e5e7eb' }}
                >
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-1.5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: section.color }} />
                    {section.expanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="text-xs font-semibold" style={{ color: section.color }}>{section.title}</span>
                    {section.content.trim() && (
                      <Badge variant="outline" className="text-[8px] ml-auto border-green-300 text-green-700">filled</Badge>
                    )}
                  </button>

                  {/* Section content */}
                  {section.expanded && (
                    <div className="px-3 pb-3">
                      <Textarea
                        value={section.content}
                        onChange={e => updateContent(section.id, e.target.value)}
                        placeholder={section.placeholder}
                        className="min-h-[80px] text-xs border-gray-200"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="mt-3">
            <Button onClick={addToBoard} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="w-4 h-4 mr-1.5" /> Add to Board
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
