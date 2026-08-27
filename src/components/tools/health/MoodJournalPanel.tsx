'use client';

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Heart, Smile, Frown, Meh } from 'lucide-react';

interface Props {
  editor?: unknown;
}

interface MoodEntry {
  id: string;
  mood: number;
  energy: number;
  gratitude: string;
  timestamp: number;
}

const MOODS = [
  { value: 1, emoji: '😞', label: 'Very Bad' },
  { value: 2, emoji: '😟', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

const ENERGY_LABELS = ['Exhausted', 'Low', 'Moderate', 'Energetic', 'Peak'];

export default function MoodJournalPanel({ editor }: Props) {
  const store = useAppStore();
  const isOpen = store.room.moodJournalOpen;
  const toggle = store.toggleMoodJournal;

  const [selectedMood, setSelectedMood] = useState<number>(3);
  const [energy, setEnergy] = useState(3);
  const [gratitude, setGratitude] = useState('');
  const [entries, setEntries] = useState<MoodEntry[]>([]);

  const saveEntry = useCallback(() => {
    if (!gratitude.trim()) return;
    setEntries((prev) => [
      { id: `mood-${Date.now()}` as any, mood: selectedMood, energy, gratitude: gratitude.trim(), timestamp: Date.now() },
      ...prev,
    ]);
    setGratitude('');
  }, [selectedMood, energy, gratitude]);

  const moodAvg = entries.length > 0
    ? entries.reduce((a, e) => a + e.mood, 0) / entries.length
    : 0;

  const moodIcon = (mood: number) => {
    if (mood <= 1) return <Frown style={{ width: 14, height: 14 }} />;
    if (mood <= 3) return <Meh style={{ width: 14, height: 14 }} />;
    return <Smile style={{ width: 14, height: 14 }} />;
  };

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = { padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.15)', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, width: 320, maxHeight: 'calc(100vh - 60px)', overflowY: 'auto', borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px 0 12px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Heart style={{ width: 14, height: 14, color: '#ec4899' }} />
          Mood Journal
        </span>
        <button onClick={toggle} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div style={{ padding: '8px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Mood selector */}
        <div>
          <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>How are you feeling?</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setSelectedMood(m.value)}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 8, border: selectedMood === m.value ? '2px solid #ec4899' : '1px solid rgba(0,0,0,0.1)',
                  background: selectedMood === m.value ? '#fdf2f8' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 20 }}>{m.emoji}</span>
                <span style={{ fontSize: 9, color: '#6b7280' }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: '#6b7280' }}>Energy Level</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b' }}>{ENERGY_LABELS[energy - 1]}</span>
          </div>
          <input type="range" min={1} max={5} value={energy} onChange={(e) => setEnergy(parseInt(e.target.value))} style={{ width: '100%', accentColor: '#f59e0b' }} />
        </div>

        {/* Gratitude */}
        <div>
          <label style={{ fontSize: 10, color: '#6b7280', marginBottom: 2, display: 'block' }}>What are you grateful for?</label>
          <textarea value={gratitude} onChange={(e) => setGratitude(e.target.value)} placeholder="I'm grateful for..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <button onClick={saveEntry} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#ec4899', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          Save Entry
        </button>

        {/* Mood trend */}
        {entries.length > 0 && (
          <div style={{ padding: '8px', borderRadius: 8, background: '#fdf2f8', border: '1px solid rgba(236,72,153,0.15)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#be185d', marginBottom: 6 }}>Mood Trend</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 40 }}>
              {entries.slice(0, 10).reverse().map((e) => (
                <div key={e.id} style={{ flex: 1, height: `${(e.mood / 5) * 100}%`, background: e.mood >= 4 ? '#22c55e' : e.mood >= 3 ? '#f59e0b' : '#ef4444', borderRadius: 2, minWidth: 8 }} title={`${MOODS[e.mood - 1].label}`} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>Average: {moodAvg.toFixed(1)} / 5</div>
          </div>
        )}

        {/* Entries list */}
        {entries.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
            {entries.map((e) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 8px', borderRadius: 6, background: '#f9fafb', border: '1px solid rgba(0,0,0,0.06)' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{MOODS[e.mood - 1].emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#1f2937' }}>{e.gratitude}</div>
                  <div style={{ fontSize: 9, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {moodIcon(e.mood)} Energy: {e.energy}/5 · {new Date(e.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
