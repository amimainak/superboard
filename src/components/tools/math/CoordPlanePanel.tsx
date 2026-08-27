'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Grid3X3, Hash } from 'lucide-react';

interface Props { editor?: unknown; }

export default function CoordPlanePanel({ editor: _editor }: Props) {
  const store = useAppStore();
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [yMin, setYMin] = useState(-10);
  const [yMax, setYMax] = useState(10);
  const [gridSpacing, setGridSpacing] = useState(1);
  const [showLabels, setShowLabels] = useState(true);

  if (!store.room.coordPlaneOpen) return null;

  const numberInputStyle: React.CSSProperties = { width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', color: '#374151', textAlign: 'center', fontFamily: 'monospace' };
  const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 600, color: '#9ca3af', marginBottom: 2 };

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 260, maxHeight: 480, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Coordinate Plane</span>
        <button onClick={() => store.toggleCoordPlane()} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width: 14, height: 14 }} /></button>
      </div>

      {/* Range selectors */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...labelStyle }}>X Range</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input type='number' value={xMin} onChange={e => setXMin(parseInt(e.target.value) || 0)} style={numberInputStyle} />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>to</span>
            <input type='number' value={xMax} onChange={e => setXMax(parseInt(e.target.value) || 0)} style={numberInputStyle} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ ...labelStyle }}>Y Range</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input type='number' value={yMin} onChange={e => setYMin(parseInt(e.target.value) || 0)} style={numberInputStyle} />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>to</span>
            <input type='number' value={yMax} onChange={e => setYMax(parseInt(e.target.value) || 0)} style={numberInputStyle} />
          </div>
        </div>
      </div>

      {/* Grid spacing */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <Grid3X3 style={{ width: 12, height: 12, color: '#6366f1' }} />
          <span style={{ ...labelStyle, marginBottom: 0 }}>Grid Spacing</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type='range' min={0.5} max={5} step={0.5}
            value={gridSpacing}
            onChange={e => setGridSpacing(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: '#6366f1', height: 4 }}
          />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', width: 32, textAlign: 'right', fontFamily: 'monospace' }}>{gridSpacing}</span>
        </div>
      </div>

      {/* Show Labels checkbox */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, background: '#f9fafb', border: '1px solid #e5e7eb', marginBottom: 8, cursor: 'pointer' }} onClick={() => setShowLabels(!showLabels)}>
        <div style={{ width: 16, height: 16, borderRadius: 4, border: showLabels ? '1.5px solid #6366f1' : '1.5px solid #d1d5db', background: showLabels ? '#6366f1' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {showLabels && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>&#10003;</span>}
        </div>
        <span style={{ fontSize: 11, color: '#374151' }}>Show Labels</span>
      </div>

      {/* Mini preview */}
      <div style={{ borderRadius: 8, background: '#fafafa', border: '1px solid #e5e7eb', marginBottom: 8, overflow: 'hidden' }}>
        <MiniCoordPreview xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax} gridSpacing={gridSpacing} showLabels={showLabels} />
      </div>

      {/* Draw on Canvas button */}
      <button
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 0', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#4f46e5'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#6366f1'; }}
      >
        <Hash style={{ width: 12, height: 12 }} /> Draw on Canvas
      </button>
    </div>
  );
}

function MiniCoordPreview({ xMin, xMax, yMin, yMax, gridSpacing, showLabels }: { xMin: number; xMax: number; yMin: number; yMax: number; gridSpacing: number; showLabels: boolean }) {
  const w = 200, h = 140;
  const xRange = xMax - xMin;
  const yRange = yMax - yMin;
  const toSvgX = (x: number) => ((x - xMin) / xRange) * w;
  const toSvgY = (y: number) => h - ((y - yMin) / yRange) * h;

  const gridLines: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];

  for (let x = Math.ceil(xMin / gridSpacing) * gridSpacing; x <= xMax; x += gridSpacing) {
    const sx = toSvgX(x);
    gridLines.push(<line key={`gv${x}`} x1={sx} y1={0} x2={sx} y2={h} stroke={Math.abs(x) < 0.01 ? '#9ca3af' : '#e5e7eb'} strokeWidth={Math.abs(x) < 0.01 ? 1 : 0.5} />);
    if (showLabels && x !== 0) {
      labels.push(<text key={`lx${x}`} x={sx} y={h - 2} textAnchor='middle' fontSize='7' fill='#9ca3af'>{Number.isInteger(x) ? x : x.toFixed(1)}</text>);
    }
  }
  for (let y = Math.ceil(yMin / gridSpacing) * gridSpacing; y <= yMax; y += gridSpacing) {
    const sy = toSvgY(y);
    gridLines.push(<line key={`gh${y}`} x1={0} y1={sy} x2={w} y2={sy} stroke={Math.abs(y) < 0.01 ? '#9ca3af' : '#e5e7eb'} strokeWidth={Math.abs(y) < 0.01 ? 1 : 0.5} />);
    if (showLabels && y !== 0) {
      labels.push(<text key={`ly${y}`} x={3} y={sy - 2} textAnchor='start' fontSize='7' fill='#9ca3af'>{Number.isInteger(y) ? y : y.toFixed(1)}</text>);
    }
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', margin: '0 auto' }}>
      {gridLines}
      {labels}
    </svg>
  );
}
