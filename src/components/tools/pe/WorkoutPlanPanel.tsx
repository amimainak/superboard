'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Dumbbell, Plus, Clock, Target } from 'lucide-react';

interface Props {
  editor?: unknown;
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  duration: number;
  muscleGroup: string;
}

const MUSCLE_GROUPS = ['chest', 'back', 'legs', 'arms', 'core', 'cardio'];

export default function WorkoutPlanPanel({ editor }: Props) {
  const store = useAppStore();
  const isOpen = store.room.workoutPlanOpen;
  const toggle = store.toggleWorkoutPlan;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [name, setName] = useState('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [duration, setDuration] = useState(30);
  const [muscleGroup, setMuscleGroup] = useState('chest');
  const [resting, setResting] = useState(false);
  const [restSeconds, setRestSeconds] = useState(60);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addExercise = useCallback(() => {
    if (!name.trim()) return;
    setExercises((prev) => [
      ...prev,
      { id: `ex-${Date.now()}` as any, name: name.trim(), sets, reps, duration, muscleGroup },
    ]);
    setName('');
  }, [name, sets, reps, duration, muscleGroup]);

  const removeExercise = useCallback((id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }, []);

  useEffect(() => {
    if (!resting || restSeconds <= 0) return;
    restRef.current = setInterval(() => {
      setRestSeconds((s) => {
        if (s <= 1) {
          setResting(false);
          return 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, [resting]);

  const startRest = (seconds?: number) => {
    setRestSeconds(seconds || 60);
    setResting(true);
  };

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = { padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.15)', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
  const btnStyle: React.CSSProperties = { padding: '6px 12px', borderRadius: 6, border: 'none', background: '#16a34a', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' };
  const smallBtnStyle: React.CSSProperties = { padding: '3px 8px', borderRadius: 4, border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontSize: 10, cursor: 'pointer' };

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, width: 320, maxHeight: 'calc(100vh - 60px)', overflowY: 'auto', borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px 0 12px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Dumbbell style={{ width: 14, height: 14, color: '#16a34a' }} />
          Workout Plan Builder
        </span>
        <button onClick={toggle} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div style={{ padding: '8px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Exercise name..." style={inputStyle} />

        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, color: '#6b7280', marginBottom: 2, display: 'block' }}>Sets</label>
            <input type="number" value={sets} onChange={(e) => setSets(Math.max(1, parseInt(e.target.value) || 1))} style={inputStyle} min={1} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, color: '#6b7280', marginBottom: 2, display: 'block' }}>Reps</label>
            <input type="number" value={reps} onChange={(e) => setReps(Math.max(1, parseInt(e.target.value) || 1))} style={inputStyle} min={1} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, color: '#6b7280', marginBottom: 2, display: 'block' }}>Duration (s)</label>
            <input type="number" value={duration} onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))} style={inputStyle} min={1} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 10, color: '#6b7280', marginBottom: 2, display: 'block' }}>Muscle Group</label>
          <select value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)} style={selectStyle}>
            {MUSCLE_GROUPS.map((g) => (
              <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
            ))}
          </select>
        </div>

        <button onClick={addExercise} style={btnStyle}>
          <Plus style={{ width: 14, height: 14 }} /> Add Exercise
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', borderRadius: 8, background: '#f0fdf4', border: '1px solid rgba(22,163,74,0.15)' }}>
          <Clock style={{ width: 14, height: 14, color: '#16a34a' }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: '#16a34a', flex: 1 }}>Rest Timer</span>
          {resting ? (
            <span style={{ fontSize: 16, fontWeight: 700, color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>{Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, '0')}</span>
          ) : null}
          <button onClick={() => startRest(60)} style={smallBtnStyle} disabled={resting}>60s</button>
          <button onClick={() => startRest(30)} style={smallBtnStyle} disabled={resting}>30s</button>
          <button onClick={() => setResting(false)} style={smallBtnStyle}>Reset</button>
        </div>

        {exercises.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
            {exercises.map((ex) => (
              <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', borderRadius: 8, background: '#f9fafb', border: '1px solid rgba(0,0,0,0.06)' }}>
                <Target style={{ width: 12, height: 12, color: '#16a34a', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</div>
                  <div style={{ fontSize: 9, color: '#9ca3af' }}>{ex.sets}x{ex.reps} · {ex.duration}s · {ex.muscleGroup}</div>
                </div>
                <button onClick={() => removeExercise(ex.id)} style={{ width: 20, height: 20, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: '#ef4444', fontSize: 10 }}>x</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
