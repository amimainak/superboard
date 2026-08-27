'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Highlighter, Underline, Circle, PenTool } from 'lucide-react';

interface Props { editor?: unknown; }

const ANNOTATION_TYPES = [
  { id: 'underline', label: 'Underline', description: 'Key details', color: '#3b82f6', icon: Underline },
  { id: 'highlight', label: 'Highlight', description: 'Main idea', color: '#eab308', icon: Highlighter },
  { id: 'circle', label: 'Circle', description: 'Unknown vocab', color: '#ef4444', icon: Circle },
  { id: 'bracket', label: 'Bracket', description: 'Text evidence', color: '#22c55e', icon: PenTool },
];

export default function TextMarkupPanel({ editor: _editor }: Props) {
  const store = useAppStore();
  const [activeTool, setActiveTool] = useState<string>('highlight');

  if (!store.room.textMarkupOpen) return null;

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 260, maxHeight: 480, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Text Markup / Highlighter Set</span>
        <button onClick={() => store.toggleTextMarkup()} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width: 14, height: 14 }} /></button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Annotation Legend</span>
        {ANNOTATION_TYPES.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: activeTool === a.id ? `${a.color}15` : 'transparent', border: activeTool === a.id ? `1.5px solid ${a.color}` : '1.5px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }} onClick={() => setActiveTool(a.id)}>
              <div style={{ width: 12, height: 12, borderRadius: a.id === 'circle' ? '50%' : 2, background: a.color, opacity: 0.85, flexShrink: 0 }} />
              <Icon style={{ width: 14, height: 14, color: a.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{a.label}</div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>{a.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active tool indicator */}
      <div style={{ padding: '6px 8px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: '#6b7280' }}>Active: </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: ANNOTATION_TYPES.find(a => a.id === activeTool)?.color }}>{ANNOTATION_TYPES.find(a => a.id === activeTool)?.label}</span>
      </div>

      {/* Insert buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ANNOTATION_TYPES.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: `1px solid ${a.color}40`, background: `${a.color}10`, cursor: 'pointer', fontSize: 11, fontWeight: 500, color: a.color, transition: 'all 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${a.color}20`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${a.color}10`; }}
            >
              <Icon style={{ width: 12, height: 12 }} />
              Insert {a.label} on Canvas
            </button>
          );
        })}
      </div>
    </div>
  );
}
