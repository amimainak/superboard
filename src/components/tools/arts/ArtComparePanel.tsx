'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Columns2, PenTool } from 'lucide-react';

interface Props {
  editor?: unknown;
}

const CRITIQUE_PROMPTS = [
  'Composition — How are elements arranged? What draws the eye?',
  'Technique — What media and methods were used? How effectively?',
  'Subject Matter — What is depicted? What themes or symbols are present?',
  'Historical Context — When was this created? What was happening culturally?',
  'Personal Response — How does this make you feel? What does it remind you of?',
];

export default function ArtComparePanel({ editor }: Props) {
  const store = useAppStore();
  const isOpen = store.room.artCompareOpen;
  const toggle = store.toggleArtCompare;

  const [leftTitle, setLeftTitle] = useState('');
  const [leftArtist, setLeftArtist] = useState('');
  const [rightTitle, setRightTitle] = useState('');
  const [rightArtist, setRightArtist] = useState('');
  const [critiqueNotes, setCritiqueNotes] = useState<Record<number, string>>({});
  const [comparisonNotes, setComparisonNotes] = useState('');

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = { padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.15)', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 10, color: '#6b7280', marginBottom: 2, display: 'block' };
  const placeholderStyle: React.CSSProperties = { width: '100%', height: 100, borderRadius: 8, background: '#f9fafb', border: '2px dashed rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 11 };

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, width: 380, maxHeight: 'calc(100vh - 60px)', overflowY: 'auto', borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px 0 12px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Columns2 style={{ width: 14, height: 14, color: '#f59e0b' }} />
          Art Comparison
        </span>
        <button onClick={toggle} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div style={{ padding: '8px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Side by side artwork inputs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ title: leftTitle, setT: setLeftTitle, artist: leftArtist, setA: setLeftArtist, label: 'Artwork A' }, { title: rightTitle, setT: setRightTitle, artist: rightArtist, setA: setRightArtist, label: 'Artwork B' }].map((side) => (
            <div key={side.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{side.label}</div>
              <div style={placeholderStyle}>{side.label}</div>
              <label style={labelStyle}>Title</label>
              <input value={side.title} onChange={(e) => side.setT(e.target.value)} placeholder="Artwork title..." style={inputStyle} />
              <label style={labelStyle}>Artist</label>
              <input value={side.artist} onChange={(e) => side.setA(e.target.value)} placeholder="Artist name..." style={inputStyle} />
            </div>
          ))}
        </div>

        {/* Critique prompts */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <PenTool style={{ width: 12, height: 12, color: '#f59e0b' }} />
            <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Critique Prompts</span>
          </div>
          {CRITIQUE_PROMPTS.map((prompt, i) => (
            <div key={i} style={{ marginBottom: 6, padding: '6px 8px', borderRadius: 6, background: '#fffbeb', border: '1px solid rgba(245,158,11,0.15)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>{prompt.split('—')[0].trim()}</div>
              <div style={{ fontSize: 10, color: '#78716c' }}>{prompt.split('—')[1]?.trim()}</div>
              <textarea
                value={critiqueNotes[i] || ''}
                onChange={(e) => setCritiqueNotes((prev) => ({ ...prev, [i]: e.target.value }))}
                placeholder="Write your analysis..."
                rows={2}
                style={{ width: '100%', marginTop: 4, padding: '4px 6px', borderRadius: 4, border: '1px solid rgba(0,0,0,0.1)', fontSize: 10, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>

        {/* Comparison notes */}
        <div>
          <label style={{ fontSize: 10, color: '#6b7280', fontWeight: 500, marginBottom: 2, display: 'block' }}>Overall Comparison Notes</label>
          <textarea
            value={comparisonNotes}
            onChange={(e) => setComparisonNotes(e.target.value)}
            placeholder="Compare and contrast the two artworks..."
            rows={4}
            style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.15)', fontSize: 11, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>
      </div>
    </div>
  );
}
