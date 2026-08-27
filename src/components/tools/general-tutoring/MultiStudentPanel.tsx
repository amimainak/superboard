'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Users, Plus, Clock, AlertCircle } from 'lucide-react';

interface Props {
  editor?: unknown;
}

type StudentStatus = 'working' | 'idle' | 'needs-help';

interface StudentEntry {
  id: string;
  name: string;
  status: StudentStatus;
  attentionSeconds: number;
}

const STATUS_CONFIG: Record<StudentStatus, { label: string; color: string; bg: string }> = {
  working: { label: 'Working', color: '#059669', bg: '#d1fae5' },
  idle: { label: 'Idle', color: '#9ca3af', bg: '#f3f4f6' },
  'needs-help': { label: 'Needs Help', color: '#dc2626', bg: '#fee2e2' },
};

export default function MultiStudentPanel({ editor }: Props) {
  const store = useAppStore();
  const [students, setStudents] = useState<StudentEntry[]>([
    { id: 's1', name: 'Student 1', status: 'working', attentionSeconds: 0 },
    { id: 's2', name: 'Student 2', status: 'idle', attentionSeconds: 0 },
  ]);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Attention timer for current student
  useEffect(() => {
    if (currentStudentId && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === currentStudentId ? { ...s, attentionSeconds: s.attentionSeconds + 1 } : s
          )
        );
      }, 1000);
    }
    if (!currentStudentId && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentStudentId]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const addStudent = useCallback(() => {
    const name = newStudentName.trim() || `Student ${students.length + 1}`;
    const entry: StudentEntry = {
      id: `s-${Date.now()}` as any,
      name,
      status: 'idle',
      attentionSeconds: 0,
    };
    setStudents((prev) => [...prev, entry]);
    setNewStudentName('');
  }, [newStudentName, students.length]);

  const removeStudent = useCallback((id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setCurrentStudentId((prev) => (prev === id ? null : prev));
  }, []);

  const cycleStatus = useCallback((id: string) => {
    const order: StudentStatus[] = ['working', 'idle', 'needs-help'];
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const idx = order.indexOf(s.status);
        return { ...s, status: order[(idx + 1) % order.length] };
      })
    );
  }, []);

  const selectStudent = useCallback((id: string) => {
    setCurrentStudentId((prev) => (prev === id ? null : id));
  }, []);

  const handleAssignBreakout = useCallback((id: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'working' } : s))
    );
  }, []);

  if (!store.room.multiStudentOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 50,
        right: 16,
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 12,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid rgba(0,0,0,0.1)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        minWidth: 280,
        maxHeight: 480,
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users style={{ width: 14, height: 14 }} />
          Multi-Student Mode
        </span>
        <button
          onClick={() => store.toggleMultiStudent()}
          style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Add Student */}
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          type="text"
          value={newStudentName}
          onChange={(e) => setNewStudentName(e.target.value)}
          placeholder="Student name..."
          onKeyDown={(e) => e.key === 'Enter' && addStudent()}
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid rgba(0,0,0,0.1)',
            fontSize: 11,
            outline: 'none',
          }}
        />
        <button
          onClick={addStudent}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            border: '1px solid rgba(0,0,0,0.1)',
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus style={{ width: 14, height: 14, color: '#374151' }} />
        </button>
      </div>

      {/* Student List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {students.map((student) => {
          const isCurrent = currentStudentId === student.id;
          const cfg = STATUS_CONFIG[student.status];
          return (
            <div
              key={student.id}
              onClick={() => selectStudent(student.id)}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: isCurrent ? '1.5px solid #7c3aed' : '1px solid rgba(0,0,0,0.06)',
                background: isCurrent ? '#f5f3ff' : '#fafafa',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: cfg.color,
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: isCurrent ? 600 : 400, color: '#374151' }}>{student.name}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeStudent(student.id); }}
                  style={{ width: 20, height: 20, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X style={{ width: 12, height: 12, color: '#9ca3af' }} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); cycleStatus(student.id); }}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: 'none',
                    background: cfg.bg,
                    color: cfg.color,
                    fontSize: 9,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {cfg.label}
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {student.status === 'needs-help' && (
                    <AlertCircle style={{ width: 12, height: 12, color: '#dc2626' }} />
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#6b7280' }}>
                    <Clock style={{ width: 10, height: 10 }} />
                    {formatTime(student.attentionSeconds)}
                  </div>
                </div>
              </div>

              {isCurrent && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleAssignBreakout(student.id); }}
                  style={{
                    marginTop: 6,
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: '1px solid #ede9fe',
                    background: '#f5f3ff',
                    color: '#7c3aed',
                    fontSize: 10,
                    fontWeight: 500,
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  Assign Breakout Task
                </button>
              )}
            </div>
          );
        })}
      </div>

      {students.length === 0 && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 11 }}>
          Add students to manage multiple sessions.
        </div>
      )}
    </div>
  );
}
