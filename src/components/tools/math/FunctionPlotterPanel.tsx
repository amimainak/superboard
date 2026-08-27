'use client';
import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, LineChart, Sliders, Play } from 'lucide-react';

interface Props { editor?: unknown; }

type FuncType = 'linear' | 'quadratic' | 'sin' | 'cos' | 'exponential';

const FUNC_TYPES: { id: FuncType; label: string; expr: string }[] = [
  { id: 'linear', label: 'Linear', expr: 'y = mx + b' },
  { id: 'quadratic', label: 'Quadratic', expr: 'y = ax\u00b2 + bx + c' },
  { id: 'sin', label: 'Sine', expr: 'y = sin(x)' },
  { id: 'cos', label: 'Cosine', expr: 'y = cos(x)' },
  { id: 'exponential', label: 'Exponential', expr: 'y = e\u02e3' },
];

function evaluateFunc(type: FuncType, x: number, params: Record<string, number>): number {
  switch (type) {
    case 'linear': return params.m * x + (params.b ?? 0);
    case 'quadratic': return (params.a ?? 1) * x * x + (params.b2 ?? 0) * x + (params.c ?? 0);
    case 'sin': return Math.sin(x * (params.freq ?? 1)) * (params.amp ?? 1);
    case 'cos': return Math.cos(x * (params.freq ?? 1)) * (params.amp ?? 1);
    case 'exponential': return Math.exp(x * (params.k ?? 1)) * (params.amp ?? 1);
    default: return 0;
  }
}

export default function FunctionPlotterPanel({ editor: _editor }: Props) {
  const store = useAppStore();
  const [funcType, setFuncType] = useState<FuncType>('linear');
  const [params, setParams] = useState<Record<string, number>>({ m: 1, b: 0, a: 1, b2: 0, c: 0, freq: 1, amp: 1, k: 1 });

  // Generate SVG path (before conditional return to satisfy hooks rules)
  const svgPath = useMemo(() => {
    const xRange = funcType === 'exponential' ? [-2, 3] : [-5, 5];
    const points: string[] = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const x = xRange[0] + (xRange[1] - xRange[0]) * (i / steps);
      const y = evaluateFunc(funcType, x, params);
      const clampedY = Math.max(-5, Math.min(5, y));
      const sx = 8 + (i / steps) * 184;
      const sy = 100 - ((clampedY + 5) / 10) * 180;
      points.push(i === 0 ? `M${sx},${sy}` : `L${sx},${sy}`);
    }
    return points.join(' ');
  }, [funcType, params]);

  const updateParam = (key: string, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const currentLabel = FUNC_TYPES.find(f => f.id === funcType);

  if (!store.room.functionPlotterOpen) return null;

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 260, maxHeight: 480, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Function Plotter</span>
        <button onClick={() => store.toggleFunctionPlotter()} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width: 14, height: 14 }} /></button>
      </div>

      {/* Function type selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {FUNC_TYPES.map(f => (
          <button
            key={f.id}
            onClick={() => setFuncType(f.id)}
            style={{ padding: '4px 8px', borderRadius: 6, border: funcType === f.id ? '1.5px solid #6366f1' : '1px solid #e5e7eb', background: funcType === f.id ? '#eef2ff' : '#f9fafb', color: funcType === f.id ? '#4338ca' : '#6b7280', fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Expression display */}
      <div style={{ padding: '6px 8px', borderRadius: 6, background: '#f0f9ff', border: '1px solid #bae6fd', marginBottom: 8, textAlign: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0369a1', fontFamily: 'serif', fontStyle: 'italic' }}>{currentLabel?.expr}</span>
      </div>

      {/* Parameter sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Sliders style={{ width: 12, height: 12, color: '#6366f1' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Parameters</span>
        </div>
        {funcType === 'linear' && (
          <ParamSlider label='m (slope)' value={params.m} min={-5} max={5} step={0.5} onChange={v => updateParam('m', v)} />
        )}
        {(funcType === 'linear') && (
          <ParamSlider label='b (y-int)' value={params.b ?? 0} min={-5} max={5} step={0.5} onChange={v => updateParam('b', v)} />
        )}
        {funcType === 'quadratic' && (
          <>
            <ParamSlider label='a' value={params.a ?? 1} min={-3} max={3} step={0.5} onChange={v => updateParam('a', v)} />
            <ParamSlider label='b' value={params.b2 ?? 0} min={-5} max={5} step={0.5} onChange={v => updateParam('b2', v)} />
            <ParamSlider label='c' value={params.c ?? 0} min={-5} max={5} step={0.5} onChange={v => updateParam('c', v)} />
          </>
        )}
        {(funcType === 'sin' || funcType === 'cos') && (
          <>
            <ParamSlider label='amplitude' value={params.amp ?? 1} min={0.5} max={3} step={0.5} onChange={v => updateParam('amp', v)} />
            <ParamSlider label='frequency' value={params.freq ?? 1} min={0.5} max={3} step={0.5} onChange={v => updateParam('freq', v)} />
          </>
        )}
        {funcType === 'exponential' && (
          <>
            <ParamSlider label='k (growth)' value={params.k ?? 1} min={-2} max={2} step={0.25} onChange={v => updateParam('k', v)} />
            <ParamSlider label='amplitude' value={params.amp ?? 1} min={0.5} max={3} step={0.5} onChange={v => updateParam('amp', v)} />
          </>
        )}
      </div>

      {/* SVG Preview */}
      <div style={{ borderRadius: 8, background: '#fafafa', border: '1px solid #e5e7eb', marginBottom: 8, overflow: 'hidden' }}>
        <svg width='200' height='100' viewBox='0 0 200 100' style={{ display: 'block', margin: '0 auto' }}>
          {/* Grid */}
          {[0, 1, 2, 3, 4].map(i => (
            <g key={i}>
              <line x1='0' y1={i * 20} x2='200' y2={i * 20} stroke='#f0f0f0' strokeWidth='0.5' />
              <line x1={i * 40} y1='0' x2={i * 40} y2='100' stroke='#f0f0f0' strokeWidth='0.5' />
            </g>
          ))}
          {/* Axes */}
          <line x1='0' y1='50' x2='200' y2='50' stroke='#d1d5db' strokeWidth='1' />
          <line x1='100' y1='0' x2='100' y2='100' stroke='#d1d5db' strokeWidth='1' />
          {/* Function curve */}
          <path d={svgPath} fill='none' stroke='#6366f1' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
        </svg>
      </div>

      {/* Plot button */}
      <button
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 0', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#4f46e5'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#6366f1'; }}
      >
        <Play style={{ width: 12, height: 12 }} /> Plot on Canvas
      </button>
    </div>
  );
}

function ParamSlider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 11, color: '#6b7280', width: 72, flexShrink: 0 }}>{label}</span>
      <input
        type='range'
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: '#6366f1', height: 4 }}
      />
      <span style={{ fontSize: 11, fontWeight: 600, color: '#374151', width: 28, textAlign: 'right', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}
