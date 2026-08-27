'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, BarChart3, Plus } from 'lucide-react';

interface Props { editor?: unknown; }

type ModelType = 'part-part-whole' | 'comparison' | 'multi-step';

const MODEL_TYPES: { id: ModelType; label: string; parts: string[] }[] = [
  { id: 'part-part-whole', label: 'Part-Part-Whole', parts: ['Part A', 'Part B'] },
  { id: 'comparison', label: 'Comparison', parts: ['Smaller', 'Difference'] },
  { id: 'multi-step', label: 'Multi-Step', parts: ['Part A', 'Part B', 'Part C'] },
];

const BAR_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function BarModelPanel({ editor: _editor }: Props) {
  const store = useAppStore();
  const [modelType, setModelType] = useState<ModelType>('part-part-whole');
  const [values, setValues] = useState<Record<string, string>>({});

  if (!store.room.barModelOpen) return null;

  const currentModel = MODEL_TYPES.find(m => m.id === modelType)!;

  const updateValue = (part: string, val: string) => {
    setValues(prev => ({ ...prev, [part]: val }));
  };

  const total = currentModel.parts.reduce((sum, p) => sum + (parseFloat(values[p]) || 0), 0);

  // Compute bar widths proportionally
  const maxVal = Math.max(...currentModel.parts.map(p => parseFloat(values[p]) || 0), 1);
  const barWidths = currentModel.parts.map(p => ((parseFloat(values[p]) || 0) / maxVal) * 200);

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 260, maxHeight: 480, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Bar Model / Tape Diagram</span>
        <button onClick={() => store.toggleBarModel()} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width: 14, height: 14 }} /></button>
      </div>

      {/* Model type selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {MODEL_TYPES.map(m => (
          <button
            key={m.id}
            onClick={() => { setModelType(m.id); setValues({}); }}
            style={{ padding: '4px 8px', borderRadius: 6, border: modelType === m.id ? '1.5px solid #6366f1' : '1px solid #e5e7eb', background: modelType === m.id ? '#eef2ff' : '#f9fafb', color: modelType === m.id ? '#4338ca' : '#6b7280', fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Number inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
        {currentModel.parts.map((part, i) => (
          <div key={part} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: BAR_COLORS[i], flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#6b7280', width: 72, flexShrink: 0 }}>{part}</span>
            <input
              type='number'
              value={values[part] || ''}
              onChange={e => updateValue(part, e.target.value)}
              placeholder='0'
              style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', color: '#374151', fontFamily: 'monospace' }}
            />
          </div>
        ))}
        {modelType === 'comparison' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0 0 16' }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>Larger = Smaller + Difference = <strong style={{ color: '#374151' }}>{(parseFloat(values['Smaller']) || 0) + (parseFloat(values['Difference']) || 0)}</strong></span>
          </div>
        )}
      </div>

      {/* Visual preview */}
      <div style={{ borderRadius: 8, background: '#fafafa', border: '1px solid #e5e7eb', padding: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {currentModel.parts.map((part, i) => {
            const w = Math.max(barWidths[i], parseFloat(values[part]) ? 8 : 0);
            return (
              <div key={part} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9, color: '#9ca3af', width: 56, textAlign: 'right', flexShrink: 0 }}>{part}</span>
                <div style={{ width: w, height: 24, borderRadius: 4, background: `${BAR_COLORS[i]}30`, border: `1.5px solid ${BAR_COLORS[i]}80`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'width 0.3s', minWidth: w > 0 ? 8 : 0 }}>
                  {values[part] && <span style={{ fontSize: 10, fontWeight: 600, color: BAR_COLORS[i] }}>{values[part]}</span>}
                </div>
              </div>
            );
          })}
          {modelType === 'part-part-whole' && total > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 9, color: '#9ca3af', width: 56, textAlign: 'right', flexShrink: 0 }}>Whole</span>
              <div style={{ width: 200, height: 24, borderRadius: 4, background: 'rgba(0,0,0,0.04)', border: '1px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#374151' }}>{total}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Draw button */}
      <button
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 0', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#4f46e5'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#6366f1'; }}
      >
        <BarChart3 style={{ width: 12, height: 12 }} /> Draw Model
      </button>
    </div>
  );
}
