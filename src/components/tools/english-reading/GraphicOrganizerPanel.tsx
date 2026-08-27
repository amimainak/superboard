// ============================================================
// GraphicOrganizerPanel — Pre-built Reading Organizers
// ============================================================
// Category: English & Reading
// Drag-and-drop organizers: Story Map, KWL Chart, Venn Diagram,
// Frayer Model, Cause-Effect Chain, Compare/Contrast
// ============================================================

'use client';

import React, { useState } from 'react';
import { Editor, TLGeoShapeProps } from '@tldraw/tldraw';
import { useAppStore } from '@/store/app-store';
import { LayoutDashboard, Circle, BookOpen, GitCompare, ArrowRightLeft, Clapperboard, X } from 'lucide-react';

interface OrganizerPanelProps {
  editor: Editor | null;
}

const ORGANIZERS = [
  {
    id: 'story-map',
    label: 'Story Map',
    icon: Clapperboard,
    description: 'Characters, Setting, Plot, Theme',
    category: 'english-reading',
  },
  {
    id: 'kwl-chart',
    label: 'KWL Chart',
    icon: BookOpen,
    description: 'Know, Want to Know, Learned',
    category: 'english-reading',
  },
  {
    id: 'venn-diagram',
    label: 'Venn Diagram',
    icon: Circle,
    description: 'Compare & Contrast two topics',
    category: 'english-reading',
  },
  {
    id: 'frayer-model',
    label: 'Frayer Model',
    icon: LayoutDashboard,
    description: 'Definition, Examples, Non-examples, Illustration',
    category: 'english-reading',
  },
  {
    id: 'cause-effect',
    label: 'Cause-Effect Chain',
    icon: ArrowRightLeft,
    description: 'Sequential cause and effect chain',
    category: 'english-reading',
  },
  {
    id: 'compare-contrast',
    label: 'Compare/Contrast',
    icon: GitCompare,
    description: 'Side-by-side comparison table',
    category: 'english-reading',
  },
];

function createStoryMap(editor: Editor) {
  const center = editor.getCurrentPageBounds()?.center || { x: 400, y: 300 };
  const w = 200, h = 80, gap = 20;
  const labels = ['Characters', 'Setting', 'Plot (Beginning)', 'Plot (Middle)', 'Plot (End)', 'Theme'];
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const shapes = labels.map((text, i) => ({
    id: `shape:organizer-${Date.now()}-${i}` as any,
    type: 'geo' as const,
    x: center.x - w / 2,
    y: center.y - 250 + i * (h + gap),
    width: w,
    height: h,
    props: {
      geo: 'rectangle' as TLGeoShapeProps['geo'],
      w: w,
      h: h,
      color: colors[i],
      fill: 'solid',
      dash: 'draw',
      size: 'm',
      font: 'sans',
      text: text,
      align: 'middle',
      verticalAlign: 'middle',
    },
  }));
  // Type assertion: shapes are programmatically constructed with valid Tldraw values
  editor.createShapes(shapes as any);
}

function createKWLChart(editor: Editor) {
  const center = editor.getCurrentPageBounds()?.center || { x: 400, y: 300 };
  const w = 240, h = 120, gap = 20;
  const labels = ['K — What I Know', 'W — What I Want to Know', 'L — What I Learned'];
  const colors = ['#10b981', '#f59e0b', '#6366f1'];
  const shapes = labels.map((text, i) => ({
    id: `shape:kwl-${Date.now()}-${i}` as any,
    type: 'geo' as const,
    x: center.x - w / 2,
    y: center.y - 200 + i * (h + gap),
    width: w,
    height: h,
    props: {
      geo: 'rectangle' as TLGeoShapeProps['geo'],
      w, h,
      color: colors[i],
      fill: 'solid',
      dash: 'draw',
      size: 'm',
      font: 'sans',
      text,
      align: 'middle',
      verticalAlign: 'top',
    },
  }));
  editor.createShapes(shapes as any);
}

function createVennDiagram(editor: Editor) {
  const center = editor.getCurrentPageBounds()?.center || { x: 400, y: 300 };
  const r = 120;
  const shapes = [
    {
      id: `shape:venn-left-${Date.now()}` as any,
      type: 'geo' as const,
      x: center.x - r,
      y: center.y - r,
      width: r * 2,
      height: r * 2,
      props: {
        geo: 'ellipse' as TLGeoShapeProps['geo'],
        w: r * 2, h: r * 2,
        color: '#6366f1',
        fill: 'semi',
        dash: 'draw',
        size: 'm',
        text: 'Topic A',
        align: 'middle',
        verticalAlign: 'top',
      },
    },
    {
      id: `shape:venn-right-${Date.now()}` as any,
      type: 'geo' as const,
      x: center.x - r / 2,
      y: center.y - r,
      width: r * 2,
      height: r * 2,
      props: {
        geo: 'ellipse' as TLGeoShapeProps['geo'],
        w: r * 2, h: r * 2,
        color: '#10b981',
        fill: 'semi',
        dash: 'draw',
        size: 'm',
        text: 'Topic B',
        align: 'middle',
        verticalAlign: 'top',
      },
    },
  ] as any;
  editor.createShapes(shapes as any);
}

function createFrayerModel(editor: Editor) {
  const center = editor.getCurrentPageBounds()?.center || { x: 400, y: 300 };
  const w = 160, h = 120, gap = 8;
  // 4 quadrants around center definition box
  const shapes = [
    // Center — Definition
    {
      id: `shape:frayer-center-${Date.now()}` as any,
      type: 'geo' as const,
      x: center.x - w / 2, y: center.y - h / 2,
      width: w, height: h,
      props: { geo: 'rectangle' as TLGeoShapeProps['geo'], w, h, color: '#6366f1', fill: 'solid', dash: 'draw', size: 'm', text: 'Definition', align: 'middle', verticalAlign: 'middle' },
    },
    // Top — Characteristics
    {
      id: `shape:frayer-top-${Date.now()}` as any,
      type: 'geo' as const,
      x: center.x - w / 2, y: center.y - h / 2 - h - gap,
      width: w, height: h,
      props: { geo: 'rectangle' as TLGeoShapeProps['geo'], w, h, color: '#10b981', fill: 'solid', dash: 'draw', size: 'm', text: 'Characteristics', align: 'middle', verticalAlign: 'middle' },
    },
    // Bottom — Examples
    {
      id: `shape:frayer-bottom-${Date.now()}` as any,
      type: 'geo' as const,
      x: center.x - w / 2, y: center.y + h / 2 + gap,
      width: w, height: h,
      props: { geo: 'rectangle' as TLGeoShapeProps['geo'], w, h, color: '#f59e0b', fill: 'solid', dash: 'draw', size: 'm', text: 'Examples', align: 'middle', verticalAlign: 'middle' },
    },
    // Left — Non-examples
    {
      id: `shape:frayer-left-${Date.now()}` as any,
      type: 'geo' as const,
      x: center.x - w / 2 - w - gap, y: center.y - h / 2,
      width: w, height: h,
      props: { geo: 'rectangle' as TLGeoShapeProps['geo'], w, h, color: '#ef4444', fill: 'solid', dash: 'draw', size: 'm', text: 'Non-examples', align: 'middle', verticalAlign: 'middle' },
    },
    // Right — Illustration
    {
      id: `shape:frayer-right-${Date.now()}` as any,
      type: 'geo' as const,
      x: center.x + w / 2 + gap, y: center.y - h / 2,
      width: w, height: h,
      props: { geo: 'rectangle' as TLGeoShapeProps['geo'], w, h, color: '#8b5cf6', fill: 'solid', dash: 'draw', size: 'm', text: 'Illustration', align: 'middle', verticalAlign: 'middle' },
    },
  ];
  editor.createShapes(shapes as any);
}

function createCauseEffectChain(editor: Editor) {
  const center = editor.getCurrentPageBounds()?.center || { x: 400, y: 300 };
  const w = 140, h = 60, gap = 16;
  const labels = ['Cause 1', 'Effect 1\n(Cause 2)', 'Effect 2\n(Cause 3)', 'Final Effect'];
  const colors = ['#ef4444', '#f59e0b', '#f59e0b', '#10b981'];
  const shapes = labels.map((text, i) => ({
    id: `shape:cause-effect-${Date.now()}-${i}` as any,
    type: 'geo' as const,
    x: center.x - (labels.length * (w + gap)) / 2 + i * (w + gap),
    y: center.y - h / 2,
    width: w,
    height: h,
    props: {
      geo: 'rectangle' as TLGeoShapeProps['geo'],
      w, h,
      color: colors[i],
      fill: 'solid',
      dash: 'draw',
      size: 's',
      text,
      align: 'middle',
      verticalAlign: 'middle',
    },
  }));
  editor.createShapes(shapes as any);

  // Add arrows between boxes
  for (let i = 0; i < labels.length - 1; i++) {
    const fromX = center.x - (labels.length * (w + gap)) / 2 + i * (w + gap) + w;
    const toX = fromX + gap;
    editor.createShapes([{
      id: `arrow:cause-${Date.now()}-${i}` as any,
      type: 'arrow' as const,
      x: fromX,
      y: center.y,
      width: gap,
      height: 0,
      props: {
        color: '#6b7280',
        dash: 'draw',
        size: 'm',
        arrowheadStart: 'none',
        arrowheadEnd: 'arrow',
        fill: 'none',
        bend: 0,
      },
    }] as any);
  }
}

function createCompareContrast(editor: Editor) {
  const center = editor.getCurrentPageBounds()?.center || { x: 400, y: 300 };
  const colW = 200, headerH = 40, rowH = 50;
  const labels = ['', 'Aspect', 'Topic A', 'Topic B'];
  const rowLabels = ['Similarity 1', 'Difference 1', 'Difference 2', 'Similarity 2'];
  const shapes = [
    // Headers
    ...labels.map((text, i) => ({
      id: `shape:cc-header-${Date.now()}-${i}` as any,
      type: 'geo' as const,
      x: center.x - colW + i * colW,
      y: center.y - 160,
      width: colW,
      height: headerH,
      props: {
        geo: 'rectangle' as TLGeoShapeProps['geo'],
        w: colW, h: headerH,
        color: i === 0 ? '#6b7280' : '#6366f1',
        fill: 'solid',
        dash: 'draw',
        size: 's',
        text,
        align: 'middle',
        verticalAlign: 'middle',
        bold: true,
      },
    })),
    // Rows
    ...rowLabels.flatMap((text, row) =>
      [0, 1, 2].map((col) => ({
        id: `shape:cc-cell-${Date.now()}-${row}-${col}` as any,
        type: 'geo' as const,
        x: center.x - colW + col * colW,
        y: center.y - 160 + headerH + row * rowH,
        width: colW,
        height: rowH,
        props: {
          geo: 'rectangle' as TLGeoShapeProps['geo'],
          w: colW, h: rowH,
          color: '#374151',
          fill: 'none',
          dash: 'draw',
          size: 's',
          text: col === 0 ? text : '',
          align: 'middle',
          verticalAlign: 'middle',
        },
      }))
    ),
  ];
  editor.createShapes(shapes as any);
}

const ORGANIZER_CREATORS: Record<string, (editor: Editor) => void> = {
  'story-map': createStoryMap,
  'kwl-chart': createKWLChart,
  'venn-diagram': createVennDiagram,
  'frayer-model': createFrayerModel,
  'cause-effect': createCauseEffectChain,
  'compare-contrast': createCompareContrast,
};

export default function GraphicOrganizerPanel({ editor }: OrganizerPanelProps) {
  const [open, setOpen] = useState(false);

  if (!open) return null;

  const handleInsert = (id: string) => {
    if (!editor) return;
    const creator = ORGANIZER_CREATORS[id];
    if (creator) {
      creator(editor);
      setOpen(false);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 50,
        left: 100,
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 10,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid rgba(0,0,0,0.1)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        minWidth: 200,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
          <LayoutDashboard style={{ width: 14, height: 14, display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
          Graphic Organizers
        </span>
        <button onClick={() => setOpen(false)} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>
      {ORGANIZERS.map((org) => (
        <button
          key={org.id}
          onClick={() => handleInsert(org.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.06)', background: 'white',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#f9fafb';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'white';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.06)';
          }}
        >
          <org.icon style={{ width: 16, height: 16, color: '#6366f1', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1f2937' }}>{org.label}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{org.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

export { ORGANIZERS, GraphicOrganizerPanel };
