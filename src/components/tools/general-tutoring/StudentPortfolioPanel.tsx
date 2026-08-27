'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, FolderOpen, Star, Download, Calendar } from 'lucide-react';

interface Props { editor?: unknown; }

const STUDENT_NAMES = ['Alex Chen', 'Maria Garcia', 'Jamal Williams', 'Sarah Kim', 'David Thompson'];
const SUBJECT_COLORS: Record<string, string> = { MATH: '#3b82f6', SCIENCE: '#8b5cf6', LANGUAGE: '#6366f1', GENERAL: '#f59e0b', PE: '#ef4444', HEALTH: '#ec4899', ARTS: '#a855f7' };

interface PortfolioEntry {
  id: string;
  student: string;
  date: string;
  subject: string;
  description: string;
  tags: string[];
  isExemplary: boolean;
}

export default function StudentPortfolioPanel({ editor }: Props) {
  const store = useAppStore();
  const isOpen = store.room.studentPortfolioOpen;

  const [selectedStudent, setSelectedStudent] = useState('Alex Chen');
  const [tagging, setTagging] = useState(false);
  const [tagSubject, setTagSubject] = useState('MATH');
  const [tagDescription, setTagDescription] = useState('');
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([
    { id: '1', student: 'Alex Chen', date: '2026-08-01', subject: 'MATH', description: 'Algebra problem set - perfect score', tags: ['algebra', 'exemplary'], isExemplary: true },
    { id: '2', student: 'Alex Chen', date: '2026-08-03', subject: 'SCIENCE', description: 'Lab report on photosynthesis', tags: ['biology', 'lab'], isExemplary: false },
    { id: '3', student: 'Maria Garcia', date: '2026-08-02', subject: 'LANGUAGE', description: 'Persuasive essay draft', tags: ['writing', 'draft'], isExemplary: false },
  ]);

  const filteredPortfolio = portfolio.filter(e => e.student === selectedStudent);

  const handleTagCurrentWork = () => {
    if (!tagging) {
      setTagging(true);
      return;
    }
    if (!tagDescription.trim()) return;
    const entry: PortfolioEntry = {
      id: `p-${Date.now()}` as any,
      student: selectedStudent,
      date: new Date().toISOString().split('T')[0],
      subject: tagSubject,
      description: tagDescription,
      tags: [],
      isExemplary: false,
    };
    setPortfolio(prev => [...prev, entry]);
    setTagging(false);
    setTagDescription('');
  };

  const handleExport = () => {
    const text = filteredPortfolio.map(e => `[${e.date}] ${e.subject}: ${e.description}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-${selectedStudent.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const removeEntry = (id: string) => {
    setPortfolio(prev => prev.filter(e => e.id !== id));
  };

  if (!isOpen) return null;

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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          <FolderOpen style={{ width: 14, height: 14 }} />
          Student Portfolio
        </span>
        <button onClick={() => store.toggleStudentPortfolio()} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Student Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#6b7280' }}>Student</span>
        <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)', fontSize: 12, outline: 'none', background: '#fff', cursor: 'pointer' }}>
          {STUDENT_NAMES.map((name) => (<option key={name} value={name}>{name}</option>))}
        </select>
      </div>

      {/* Tag Current Work */}
      <button onClick={tagging ? handleTagCurrentWork : () => setTagging(true)} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)', background: tagging ? '#6366f1' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: tagging ? '#fff' : '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <Star style={{ width: 12, height: 12 }} />
        {tagging ? 'Confirm: Tag Current Work' : 'Tag Current Work'}
      </button>
      {tagging && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0' }}>
          <select value={tagSubject} onChange={(e) => setTagSubject(e.target.value)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(0,0,0,0.1)', fontSize: 11, outline: 'none' }}>
            {['MATH', 'SCIENCE', 'LANGUAGE', 'GENERAL', 'PE', 'HEALTH', 'ARTS'].map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
          <textarea value={tagDescription} onChange={(e) => setTagDescription(e.target.value)} placeholder="Describe the work..." style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)', fontSize: 11, resize: 'vertical', minHeight: 40, outline: 'none', fontFamily: 'inherit' }} />
          <button onClick={() => setTagging(false)} style={{ padding: '4px 8px', borderRadius: 4, border: 'none', background: 'transparent', color: '#6b7280', fontSize: 10, cursor: 'pointer' }}>Cancel</button>
        </div>
      )}

      {/* Portfolio Grid */}
      {filteredPortfolio.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {filteredPortfolio.map((entry) => (
            <div key={entry.id} style={{ borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden', background: '#fafafa' }}>
              {/* Thumbnail placeholder */}
              <div style={{ height: 60, background: SUBJECT_COLORS[entry.subject] || '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {entry.isExemplary && <Star style={{ width: 14, height: 14, color: '#fbbf24' }} />}
              </div>
              {/* Info */}
              <div style={{ padding: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 2 }}>{entry.subject}</div>
                <div style={{ fontSize: 9, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Calendar style={{ width: 9, height: 9 }} />
                  {entry.date}
                </div>
                <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>{entry.description}</div>
              </div>
              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 4px 4px 0' }}>
                <button onClick={() => removeEntry(entry.id)} style={{ width: 20, height: 20, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X style={{ width: 10, height: 10, color: '#d1d5db' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 11 }}>
          No portfolio entries for {selectedStudent}. Tag current work to get started.
        </div>
      )}

      {/* Export */}
      {filteredPortfolio.length > 0 && (
        <button onClick={handleExport} style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Download style={{ width: 12, height: 12 }} />
          Export Portfolio
        </button>
      )}
    </div>
  );
}
