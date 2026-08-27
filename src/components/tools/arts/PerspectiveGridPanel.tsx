'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Grid3X3, Move } from 'lucide-react';
import { Editor } from '@tldraw/tldraw';

interface Props {
  editor?: unknown;
}

type PointType = '1-point' | '2-point';

export default function PerspectiveGridPanel({ editor }: Props) {
  const store = useAppStore();
  const isOpen = store.room.perspectiveGridOpen;
  const toggle = store.togglePerspectiveGrid;

  const [pointType, setPointType] = useState<PointType>('1-point');
  const [horizonY, setHorizonY] = useState(50);
  const [vp1X, setVp1X] = useState(50);
  const [vp1Y, setVp1Y] = useState(50);
  const [vp2X, setVp2X] = useState(90);
  const [vp2Y, setVp2Y] = useState(50);
  const [density, setDensity] = useState(10);

  const ed = editor as Editor | null;

  const drawOnCanvas = () => {
    if (!ed) return;
    const bounds = ed.getCurrentPageBounds();
    if (!bounds) return;
    const bw = 800;
    const bh = 600;
    const cx = bw / 2;
    const cy = bh * (horizonY / 100);
    const vp1x = bw * (vp1X / 100);
    const vp1y = bh * (vp1Y / 100);
    const vp2x = bw * (vp2X / 100);
    const vp2y = bh * (vp2Y / 100);
    const lineCount = Math.max(4, density);
    const shapes: any[] = [];

    // Horizon line
    shapes.push({
      id: `shape:persp-horizon-${Date.now()}` as any,
      type: 'line' as const,
      x: 0, y: cy,
      props: { points: [{ x: 0, y: 0 }, { x: bw, y: 0 }], color: '#ef4444', size: 'm', dash: 'dashed' },
    });

    // Vanishing point 1 lines
    for (let i = 0; i < lineCount; i++) {
      const t = i / (lineCount - 1);
      const bottomX = t * bw;
      const topX = t * bw;
      shapes.push({
        id: `shape:persp-vp1-${Date.now()}-${i}` as any,
        type: 'line' as const,
        x: vp1x, y: vp1y,
        props: { points: [{ x: 0, y: 0 }, { x: bottomX - vp1x, y: bh - vp1y }], color: '#6b7280', size: 's' },
      });
    }

    // VP1 marker
    shapes.push({
      id: `shape:persp-vp1-dot-${Date.now()}` as any,
      type: 'geo' as const,
      x: vp1x - 6, y: vp1y - 6,
      props: { geo: 'ellipse', w: 12, h: 12, color: '#ef4444', fill: 'solid' },
    });
    shapes.push({
      id: `shape:persp-vp1-label-${Date.now()}` as any,
      type: 'text' as const,
      x: vp1x + 10, y: vp1y - 6,
      props: { text: 'VP1', size: 's', color: '#ef4444' },
    });

    if (pointType === '2-point') {
      // Vanishing point 2 lines
      for (let i = 0; i < lineCount; i++) {
        const t = i / (lineCount - 1);
        const bottomX = t * bw;
        shapes.push({
          id: `shape:persp-vp2-${Date.now()}-${i}` as any,
          type: 'line' as const,
          x: vp2x, y: vp2y,
          props: { points: [{ x: 0, y: 0 }, { x: bottomX - vp2x, y: bh - vp2y }], color: '#3b82f6', size: 's' },
        });
      }
      // VP2 marker
      shapes.push({
        id: `shape:persp-vp2-dot-${Date.now()}` as any,
        type: 'geo' as const,
        x: vp2x - 6, y: vp2y - 6,
        props: { geo: 'ellipse', w: 12, h: 12, color: '#3b82f6', fill: 'solid' },
      });
      shapes.push({
        id: `shape:persp-vp2-label-${Date.now()}` as any,
        type: 'text' as const,
        x: vp2x + 10, y: vp2y - 6,
        props: { text: 'VP2', size: 's', color: '#3b82f6' },
      });
    }

    ed.createShapes(shapes);
  };

  // Preview rendering
  const previewLines = useMemo(() => {
    const pw = 260;
    const ph = 160;
    const cy = ph * (horizonY / 100);
    const vp1x = pw * (vp1X / 100);
    const vp1y = ph * (vp1Y / 100);
    const vp2x = pw * (vp2X / 100);
    const vp2y = ph * (vp2Y / 100);
    const lineCount = Math.max(4, density);
    const lines: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];

    for (let i = 0; i < lineCount; i++) {
      const t = i / (lineCount - 1);
      lines.push({ x1: vp1x, y1: vp1y, x2: t * pw, y2: ph, color: '#d1d5db' });
    }
    if (pointType === '2-point') {
      for (let i = 0; i < lineCount; i++) {
        const t = i / (lineCount - 1);
        lines.push({ x1: vp2x, y1: vp2y, x2: t * pw, y2: ph, color: '#93c5fd' });
      }
    }
    return { lines, cy, vp1x, vp1y, vp2x, vp2y, pw, ph };
  }, [pointType, horizonY, vp1X, vp1Y, vp2X, vp2Y, density]);

  if (!isOpen) return null;

  const labelStyle: React.CSSProperties = { fontSize: 10, color: '#6b7280', marginBottom: 2, display: 'flex', justifyContent: 'space-between' };
  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)',
    background: active ? '#6366f1' : 'white', color: active ? 'white' : '#374151',
    fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  });

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, width: 300, maxHeight: 'calc(100vh - 60px)', overflowY: 'auto', borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px 0 12px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Grid3X3 style={{ width: 14, height: 14, color: '#6366f1' }} />
          Perspective Grid
        </span>
        <button onClick={toggle} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div style={{ padding: '8px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Point type */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setPointType('1-point')} style={btnStyle(pointType === '1-point')}>1-Point</button>
          <button onClick={() => setPointType('2-point')} style={btnStyle(pointType === '2-point')}>2-Point</button>
        </div>

        {/* Preview */}
        <div style={{ borderRadius: 8, background: '#fafafa', border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <svg viewBox={`0 0 ${previewLines.pw} ${previewLines.ph}`} style={{ width: '100%', display: 'block' }}>
            {/* Horizon line */}
            <line x1={0} y1={previewLines.cy} x2={previewLines.pw} y2={previewLines.cy} stroke="#ef4444" strokeWidth={1} strokeDasharray="4,3" />
            {/* VP lines */}
            {previewLines.lines.map((l, i) => (
              <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.color} strokeWidth={0.5} />
            ))}
            {/* VP markers */}
            <circle cx={previewLines.vp1x} cy={previewLines.vp1y} r={3} fill="#ef4444" />
            {pointType === '2-point' && <circle cx={previewLines.vp2x} cy={previewLines.vp2y} r={3} fill="#3b82f6" />}
          </svg>
        </div>

        {/* Sliders */}
        <div>
          <div style={labelStyle}><span>Horizon Y</span><span style={{ fontFamily: 'monospace' }}>{horizonY}%</span></div>
          <input type="range" min={10} max={90} value={horizonY} onChange={(e) => setHorizonY(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#ef4444' }} />
        </div>
        <div>
          <div style={labelStyle}><span>VP1 X</span><span style={{ fontFamily: 'monospace' }}>{vp1X}%</span></div>
          <input type="range" min={5} max={95} value={vp1X} onChange={(e) => setVp1X(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#ef4444' }} />
        </div>
        <div>
          <div style={labelStyle}><span>VP1 Y</span><span style={{ fontFamily: 'monospace' }}>{vp1Y}%</span></div>
          <input type="range" min={10} max={90} value={vp1Y} onChange={(e) => setVp1Y(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#ef4444' }} />
        </div>

        {pointType === '2-point' && (
          <>
            <div>
              <div style={labelStyle}><span>VP2 X</span><span style={{ fontFamily: 'monospace' }}>{vp2X}%</span></div>
              <input type="range" min={5} max={95} value={vp2X} onChange={(e) => setVp2X(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6' }} />
            </div>
            <div>
              <div style={labelStyle}><span>VP2 Y</span><span style={{ fontFamily: 'monospace' }}>{vp2Y}%</span></div>
              <input type="range" min={10} max={90} value={vp2Y} onChange={(e) => setVp2Y(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#3b82f6' }} />
            </div>
          </>
        )}

        <div>
          <div style={labelStyle}><span><Move style={{ width: 10, height: 10, display: 'inline', verticalAlign: '-1px' }} /> Grid Density</span><span style={{ fontFamily: 'monospace' }}>{density}</span></div>
          <input type="range" min={4} max={20} value={density} onChange={(e) => setDensity(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#6366f1' }} />
        </div>

        <button
          onClick={drawOnCanvas}
          style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#6366f1', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
        >
          <Grid3X3 style={{ width: 14, height: 14 }} /> Draw on Canvas
        </button>
      </div>
    </div>
  );
}
