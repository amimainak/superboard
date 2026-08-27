'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Music, Play } from 'lucide-react';

interface Props {
  editor?: unknown;
}

type ClefType = 'treble' | 'bass';
type ScaleType = 'major' | 'minor';

type NoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

const NOTE_NAMES: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Treble clef: C4=2 ledger lines below, D4=1 below, E4=first line (bottom), F4=first space, etc.
// Staff line positions (0 = bottom line E4, 1 = first space F4, 2 = second line, etc.)
const TREBLE_POSITIONS: Record<string, number> = {
  'C4': -2, 'D4': -1, 'E4': 0, 'F4': 1, 'G4': 2, 'A4': 3, 'B4': 4,
  'C5': 5, 'D5': 6, 'E5': 7, 'F5': 8, 'G5': 9, 'A5': 10, 'B5': 11,
};

const BASS_POSITIONS: Record<string, number> = {
  'C3': 0, 'D3': 1, 'E3': 2, 'F3': 3, 'G3': 4, 'A3': 5, 'B3': 6,
  'C4': 7, 'D4': 8, 'E4': 9, 'F4': 10, 'G4': 11,
};

const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

const INTERVAL_NAMES = ['Unison', 'm2', 'M2', 'm3', 'M3', 'P4', 'Tritone', 'P5', 'm6', 'M6', 'm7', 'M7'];

interface PlacedNote {
  id: string;
  note: string;
  accidental: string;
}

function getScaleNotes(root: NoteName, scaleType: ScaleType): string[] {
  const rootIdx = NOTE_NAMES.indexOf(root);
  const intervals = scaleType === 'major' ? MAJOR_SCALE_INTERVALS : MINOR_SCALE_INTERVALS;
  return intervals.map(interval => {
    const noteIdx = (rootIdx + Math.floor(interval / 2)) % 7;
    const octave = 4 + Math.floor((rootIdx + Math.floor(interval / 2)) / 7);
    const hasSharp = interval % 2 === 1 && !([0, 5].includes(interval));
    return `${NOTE_NAMES[noteIdx]}${octave}${hasSharp ? '#' : ''}`;
  });
}

export default function StaffNotationPanel({ editor }: Props) {
  const store = useAppStore();
  const isOpen = store.room.staffNotationOpen;
  const toggle = store.toggleStaffNotation;

  const [clef, setClef] = useState<ClefType>('treble');
  const [notes, setNotes] = useState<PlacedNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<NoteName>('C');
  const [accidental, setAccidental] = useState<string>('');
  const [scaleRoot, setScaleRoot] = useState<NoteName>('C');
  const [scaleType, setScaleType] = useState<ScaleType>('major');
  const [selectedInterval, setSelectedInterval] = useState(0);

  const positions = clef === 'treble' ? TREBLE_POSITIONS : BASS_POSITIONS;
  const octaveBase = clef === 'treble' ? 4 : 3;

  const addNote = () => {
    const noteKey = `${selectedNote}${octaveBase}${accidental}`;
    setNotes(prev => [...prev, { id: `n-${Date.now()}` as any, note: noteKey, accidental }]);
  };

  const removeNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const buildScale = () => {
    const scaleNotes = getScaleNotes(scaleRoot, scaleType);
    setNotes(scaleNotes.map((n, i) => ({ id: `s-${Date.now()}-${i}` as any, note: n, accidental: n.includes('#') ? '#' : '' })));
  };

  const showInterval = () => {
    if (notes.length < 2) return;
    const first = notes[notes.length - 2];
    const second = notes[notes.length - 1];
    const pos1 = positions[first.note.replace('#', '')] ?? 0;
    const pos2 = positions[second.note.replace('#', '')] ?? 0;
    const interval = Math.abs(pos2 - pos1) % 12;
    setSelectedInterval(interval);
  };

  const scaleNotes = useMemo(() => getScaleNotes(scaleRoot, scaleType), [scaleRoot, scaleType]);

  // SVG rendering
  const staffY = 60;
  const lineSpacing = 10;
  const noteXStart = 50;
  const noteSpacing = 30;

  const getNoteY = (noteKey: string): number => {
    const clean = noteKey.replace('#', '');
    const pos = positions[clean];
    if (pos === undefined) return staffY;
    return staffY - pos * (lineSpacing / 2);
  };

  if (!isOpen) return null;

  const btnStyle = (active: boolean, color: string): React.CSSProperties => ({
    padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)',
    background: active ? color : 'white', color: active ? 'white' : '#374151',
    fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  });

  const smallBtnStyle: React.CSSProperties = {
    padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(0,0,0,0.1)',
    background: 'white', fontSize: 10, cursor: 'pointer', fontWeight: 500,
  };

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, width: 380, maxHeight: 'calc(100vh - 60px)', overflowY: 'auto', borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px 0 12px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Music style={{ width: 14, height: 14, color: '#8b5cf6' }} />
          Staff Notation
        </span>
        <button onClick={toggle} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div style={{ padding: '8px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Clef selector */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setClef('treble')} style={btnStyle(clef === 'treble', '#8b5cf6')}>Treble</button>
          <button onClick={() => setClef('bass')} style={btnStyle(clef === 'bass', '#8b5cf6')}>Bass</button>
        </div>

        {/* Staff SVG */}
        <div style={{ borderRadius: 8, background: '#fefefe', border: '1px solid rgba(0,0,0,0.08)', padding: 8 }}>
          <svg viewBox="0 0 380 100" style={{ width: '100%' }}>
            {/* Staff lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line key={i} x1={30} y1={staffY + i * lineSpacing} x2={370} y2={staffY + i * lineSpacing} stroke="#d1d5db" strokeWidth={1} />
            ))}
            {/* Clef symbol */}
            <text x={35} y={staffY + 30} fontSize={28} fill="#374151" fontFamily="serif">{clef === 'treble' ? '\u{1D11E}' : '\u{1D122}'}</text>
            {/* Notes */}
            {notes.map((n, i) => {
              const y = getNoteY(n.note);
              return (
                <g key={n.id}>
                  {n.accidental && (
                    <text x={noteXStart + i * noteSpacing - 12} y={y + 4} fontSize={12} fill="#374151" fontWeight="bold">{n.accidental === '#' ? '♯' : '♭'}</text>
                  )}
                  <ellipse cx={noteXStart + i * noteSpacing} cy={y} rx={6} ry={4.5} fill="#1f2937" transform={`rotate(-15 ${noteXStart + i * noteSpacing} ${y})`} />
                  {/* Stem */}
                  <line x1={noteXStart + i * noteSpacing + 5} y1={y} x2={noteXStart + i * noteSpacing + 5} y2={y - 25} stroke="#1f2937" strokeWidth={1.5} />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Note name buttons */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {NOTE_NAMES.map(n => (
            <button key={n} onClick={() => setSelectedNote(n)} style={{ ...smallBtnStyle, background: selectedNote === n ? '#8b5cf6' : 'white', color: selectedNote === n ? 'white' : '#374151', border: selectedNote === n ? '1px solid #8b5cf6' : '1px solid rgba(0,0,0,0.1)' }}>
              {n}
            </button>
          ))}
          <button onClick={() => setAccidental(accidental === '#' ? '' : '#')} style={{ ...smallBtnStyle, background: accidental === '#' ? '#f59e0b' : 'white', color: accidental === '#' ? 'white' : '#374151' }}>♯ Sharp</button>
          <button onClick={() => setAccidental(accidental === 'b' ? '' : 'b')} style={{ ...smallBtnStyle, background: accidental === 'b' ? '#f59e0b' : 'white', color: accidental === 'b' ? 'white' : '#374151' }}>♭ Flat</button>
          <button onClick={addNote} style={{ ...smallBtnStyle, background: '#8b5cf6', color: 'white', border: '1px solid #8b5cf6' }}>Place Note</button>
        </div>

        {/* Scale builder */}
        <div>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 500, marginBottom: 4 }}>Scale Builder</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <select value={scaleRoot} onChange={(e) => setScaleRoot(e.target.value as NoteName)} style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid rgba(0,0,0,0.15)', fontSize: 11, outline: 'none' }}>
              {NOTE_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button onClick={() => setScaleType('major')} style={{ ...smallBtnStyle, background: scaleType === 'major' ? '#8b5cf6' : 'white', color: scaleType === 'major' ? 'white' : '#374151' }}>Major</button>
            <button onClick={() => setScaleType('minor')} style={{ ...smallBtnStyle, background: scaleType === 'minor' ? '#8b5cf6' : 'white', color: scaleType === 'minor' ? 'white' : '#374151' }}>Minor</button>
            <button onClick={buildScale} style={{ ...smallBtnStyle, background: '#8b5cf6', color: 'white' }}><Play style={{ width: 10, height: 10, display: 'inline', verticalAlign: '-1px' }} /> Build</button>
          </div>
          {scaleNotes.length > 0 && (
            <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
              {scaleNotes.map((n, i) => (
                <span key={i} style={{ padding: '2px 6px', borderRadius: 4, background: '#f3e8ff', color: '#7c3aed', fontSize: 10, fontWeight: 600 }}>{n}</span>
              ))}
            </div>
          )}
        </div>

        {/* Interval selector */}
        <div>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 500, marginBottom: 4 }}>Interval (last 2 notes)</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button onClick={showInterval} style={{ ...smallBtnStyle }}>Detect Interval</button>
            {selectedInterval > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#8b5cf6' }}>{INTERVAL_NAMES[selectedInterval] || `${selectedInterval} semitones`}</span>
            )}
          </div>
        </div>

        {/* Clear */}
        <button onClick={() => { setNotes([]); setSelectedInterval(0); }} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)', background: 'white', color: '#6b7280', fontSize: 10, cursor: 'pointer' }}>Clear All</button>
      </div>
    </div>
  );
}
