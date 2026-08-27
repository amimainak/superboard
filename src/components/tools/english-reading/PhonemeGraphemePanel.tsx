'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Type, Scissors, Layers } from 'lucide-react';

interface Props { editor?: unknown; }

interface GraphemeMapping {
  grapheme: string;
  phoneme: string;
  color: string;
}

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

function breakDownWord(word: string): GraphemeMapping[] {
  if (!word.trim()) return [];
  const w = word.trim().toLowerCase();
  const parts: GraphemeMapping[] = [];
  let i = 0;
  while (i < w.length) {
    let len = 1;
    if (i + 1 < w.length) {
      const digraph = w.slice(i, i + 2);
      const commonDigraphs = ['sh', 'ch', 'th', 'ph', 'wh', 'ck', 'ng', 'qu', 'ee', 'ea', 'oo', 'ou', 'ow', 'oi', 'oy', 'ai', 'ay', 'aw', 'au', 'ew', 'ey', 'ie', 'igh', 'eigh', 'tch', 'dge', 'tion', 'sion'];
      if (commonDigraphs.includes(digraph)) len = 2;
      if (i + 3 < w.length && ['igh', 'tch', 'dge'].includes(w.slice(i, i + 3))) len = 3;
    }
    parts.push({
      grapheme: w.slice(i, i + len),
      phoneme: `/${w.slice(i, i + len)}/`,
      color: COLORS[parts.length % COLORS.length],
    });
    i += len;
  }
  return parts;
}

export default function PhonemeGraphemePanel({ editor: _editor }: Props) {
  const store = useAppStore();
  const [word, setWord] = useState('');
  const [mappings, setMappings] = useState<GraphemeMapping[]>([]);

  if (!store.room.phonemeGraphemeOpen) return null;

  const handleBreakDown = () => {
    const result = breakDownWord(word);
    setMappings(result);
  };

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 260, maxHeight: 480, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Phoneme-Grapheme Map</span>
        <button onClick={() => store.togglePhonemeGrapheme()} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width: 14, height: 14 }} /></button>
      </div>

      {/* Word input */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }}>
          <Type style={{ width: 14, height: 14, color: '#6366f1', flexShrink: 0 }} />
          <input
            value={word}
            onChange={e => setWord(e.target.value)}
            placeholder='Enter a word...'
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, outline: 'none', color: '#374151' }}
            onKeyDown={e => e.key === 'Enter' && handleBreakDown()}
          />
        </div>
        <button
          onClick={handleBreakDown}
          disabled={!word.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, border: 'none', background: word.trim() ? '#6366f1' : '#d1d5db', color: '#fff', fontSize: 11, fontWeight: 600, cursor: word.trim() ? 'pointer' : 'not-allowed', transition: 'background 0.15s', whiteSpace: 'nowrap' }}
        >
          <Scissors style={{ width: 12, height: 12 }} /> Break Down
        </button>
      </div>

      {/* Mapped result */}
      {mappings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <Layers style={{ width: 24, height: 24, color: '#d1d5db' }} />
          Type a word and click &quot;Break Down&quot; to see its grapheme-phoneme mapping.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Grapheme boxes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Graphemes</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {mappings.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ padding: '4px 10px', borderRadius: 6, background: `${m.color}18`, border: `1.5px solid ${m.color}50`, color: m.color, fontSize: 16, fontWeight: 700, fontFamily: 'serif', minWidth: 32, textAlign: 'center' }}>
                    {m.grapheme}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: m.color, fontFamily: 'monospace' }}>
                    {m.phoneme}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 8, background: '#eef2ff', border: '1px solid #c7d2fe' }}>
            <Layers style={{ width: 14, height: 14, color: '#6366f1' }} />
            <span style={{ fontSize: 11, color: '#4338ca', fontWeight: 500 }}>
              {mappings.length} grapheme{mappings.length !== 1 ? 's' : ''} in &quot;{word.trim()}&quot;
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
