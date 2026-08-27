'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, BookOpen, Plus, CheckCircle } from 'lucide-react';

interface Props { editor?: unknown; }

interface TaggedStandard {
  id: string;
  code: string;
  description: string;
}

export default function StandardsTrackerPanel({ editor: _editor }: Props) {
  const store = useAppStore();
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [standards, setStandards] = useState<TaggedStandard[]>([]);

  if (!store.room.standardsTrackerOpen) return null;

  const addStandard = () => {
    if (!code.trim()) return;
    const entry: TaggedStandard = {
      id: `std-${Date.now()}` as any,
      code: code.trim(),
      description: description.trim() || 'No description provided',
    };
    setStandards(prev => [...prev, entry]);
    setCode('');
    setDescription('');
  };

  const removeStandard = (id: string) => {
    setStandards(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 260, maxHeight: 480, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Standards Tracker</span>
        <button onClick={() => store.toggleStandardsTracker()} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width: 14, height: 14 }} /></button>
      </div>

      {/* Input area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 6, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <BookOpen style={{ width: 14, height: 14, color: '#16a34a', flexShrink: 0 }} />
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder='e.g. CCSS.ELA.RL.6.1'
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 12, outline: 'none', color: '#374151', fontFamily: 'monospace' }}
            onKeyDown={e => e.key === 'Enter' && addStandard()}
          />
        </div>
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder='Standard description...'
          style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, outline: 'none', color: '#374151' }}
        />
        <button
          onClick={addStandard}
          disabled={!code.trim()}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 0', borderRadius: 8, border: 'none', background: code.trim() ? '#16a34a' : '#d1d5db', color: '#fff', fontSize: 12, fontWeight: 600, cursor: code.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.15s' }}
        >
          <Plus style={{ width: 14, height: 14 }} /> Add to Lesson
        </button>
      </div>

      {/* Coverage summary */}
      {standards.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 8 }}>
          <CheckCircle style={{ width: 14, height: 14, color: '#16a34a' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>{standards.length} standard{standards.length !== 1 ? 's' : ''} covered</span>
        </div>
      )}

      {/* Tagged standards list */}
      {standards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 11 }}>
          No standards tagged yet. Add a standard code above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
          {standards.map(std => (
            <div key={std.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '6px 8px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <CheckCircle style={{ width: 14, height: 14, color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', fontFamily: 'monospace' }}>{std.code}</div>
                <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2, lineHeight: 1.3 }}>{std.description}</div>
              </div>
              <button onClick={() => removeStandard(std.id)} style={{ width: 20, height: 20, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <X style={{ width: 12, height: 12, color: '#9ca3af' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
