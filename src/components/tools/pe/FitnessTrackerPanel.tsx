'use client';

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Activity, TrendingUp, Plus } from 'lucide-react';

interface Props {
  editor?: unknown;
}

interface LogEntry {
  id: string;
  exerciseType: string;
  value: number;
  unit: string;
  date: string;
}

const EXERCISE_TYPES = ['Running', 'Walking', 'Cycling', 'Swimming', 'Push-ups', 'Sit-ups', 'Jump Rope', 'Plank', 'Squats', 'Pull-ups'];
const UNITS: Record<string, string[]> = {
  'Running': ['km', 'mi', 'm'],
  'Walking': ['km', 'mi', 'steps'],
  'Cycling': ['km', 'mi', 'min'],
  'Swimming': ['laps', 'm', 'min'],
  'Push-ups': ['reps', 'sets'],
  'Sit-ups': ['reps', 'sets'],
  'Jump Rope': ['min', 'reps'],
  'Plank': ['seconds', 'min'],
  'Squats': ['reps', 'sets'],
  'Pull-ups': ['reps', 'sets'],
};

export default function FitnessTrackerPanel({ editor }: Props) {
  const store = useAppStore();
  const isOpen = store.room.fitnessTrackerOpen;
  const toggle = store.toggleFitnessTracker;

  const [exerciseType, setExerciseType] = useState('Running');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('km');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<LogEntry[]>([]);

  const addEntry = useCallback(() => {
    const v = parseFloat(value);
    if (!v || v <= 0) return;
    setEntries((prev) => [
      { id: `entry-${Date.now()}` as any, exerciseType, value: v, unit, date },
      ...prev,
    ]);
    setValue('');
  }, [exerciseType, value, unit, date]);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const progressData = React.useMemo(() => {
    const grouped: Record<string, number[]> = {};
    entries.forEach((e) => {
      if (!grouped[e.exerciseType]) grouped[e.exerciseType] = [];
      grouped[e.exerciseType].push(e.value);
    });
    return Object.entries(grouped).map(([type, vals]) => ({
      type,
      total: vals.reduce((a, b) => a + b, 0),
      avg: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
      count: vals.length,
      latest: vals[0],
    }));
  }, [entries]);

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = { padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.15)', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, width: 320, maxHeight: 'calc(100vh - 60px)', overflowY: 'auto', borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px 0 12px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity style={{ width: 14, height: 14, color: '#16a34a' }} />
          Fitness Tracker
        </span>
        <button onClick={toggle} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div style={{ padding: '8px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <label style={{ fontSize: 10, color: '#6b7280', marginBottom: 2, display: 'block' }}>Exercise Type</label>
          <select value={exerciseType} onChange={(e) => { setExerciseType(e.target.value); setUnit(UNITS[e.target.value][0]); }} style={selectStyle}>
            {EXERCISE_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, color: '#6b7280', marginBottom: 2, display: 'block' }}>Value</label>
            <input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" style={inputStyle} min={0} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, color: '#6b7280', marginBottom: 2, display: 'block' }}>Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} style={selectStyle}>
              {(UNITS[exerciseType] || ['reps']).map((u) => (<option key={u} value={u}>{u}</option>))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, color: '#6b7280', marginBottom: 2, display: 'block' }}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <button onClick={addEntry} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#16a34a', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Plus style={{ width: 14, height: 14 }} /> Add Entry
        </button>

        {/* Progress display */}
        {progressData.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</div>
            {progressData.map((p) => (
              <div key={p.type} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: '#f9fafb', border: '1px solid rgba(0,0,0,0.06)' }}>
                <TrendingUp style={{ width: 12, height: 12, color: '#16a34a', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#1f2937' }}>{p.type}</div>
                  <div style={{ fontSize: 9, color: '#9ca3af' }}>{p.count} sessions · Total: {p.total.toFixed(1)} · Avg: {p.avg.toFixed(1)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Log table */}
        {entries.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Log</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                  <th style={{ textAlign: 'left', padding: '4px 0', color: '#6b7280', fontWeight: 500, fontSize: 10 }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '4px 0', color: '#6b7280', fontWeight: 500, fontSize: 10 }}>Exercise</th>
                  <th style={{ textAlign: 'right', padding: '4px 0', color: '#6b7280', fontWeight: 500, fontSize: 10 }}>Value</th>
                  <th style={{ width: 20 }}></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td style={{ padding: '4px 0', color: '#6b7280', fontSize: 10 }}>{e.date}</td>
                    <td style={{ padding: '4px 0', fontWeight: 500 }}>{e.exerciseType}</td>
                    <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{e.value} {e.unit}</td>
                    <td>
                      <button onClick={() => removeEntry(e.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', fontSize: 10 }}>x</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
