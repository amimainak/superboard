// ============================================================
// LessonTemplatePanel — Lesson Template Quick-Load
// ============================================================
// Category: General Tutoring
// Save/load lesson templates (specific page layout, text, exercises).
// One-click loading for pre-prepared lesson materials.
// ============================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Editor } from '@tldraw/tldraw';
import { useAppStore } from '@/store/app-store';
import { BookMarked, Plus, X, Save, FolderOpen, Trash2, Clock } from 'lucide-react';

interface LessonTemplatePanelProps {
  editor: Editor | null;
}

interface SavedTemplate {
  id: string;
  name: string;
  subject: string;
  createdAt: number;
  pageCount: number;
}

const QUICK_TEMPLATES = [
  { id: 'blank-lesson', name: 'Blank Lesson', description: 'Clean whiteboard, ready to write', pageCount: 3 },
  { id: 'reading-comp', name: 'Reading Comprehension', description: 'Passage + questions layout', pageCount: 2 },
  { id: 'vocab-practice', name: 'Vocab Practice', description: 'Word list + exercises', pageCount: 3 },
  { id: 'grammar-drill', name: 'Grammar Drill', description: 'Rules + practice sentences', pageCount: 4 },
  { id: 'quiz-session', name: 'Quiz Session', description: '5-question quiz layout', pageCount: 6 },
  { id: 'essay-workshop', name: 'Essay Workshop', description: 'Outline + drafting + revision', pageCount: 3 },
];

export default function LessonTemplatePanel({ editor }: LessonTemplatePanelProps) {
  const [open, setOpen] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const { room } = useAppStore();

  useEffect(() => {
    // Load saved templates from localStorage
    try {
      const stored = localStorage.getItem('superboard-templates');
      if (stored) setSavedTemplates(JSON.parse(stored));
    } catch {}
  }, []);

  const handleSave = useCallback(() => {
    if (!templateName.trim() || !editor) return;
    const newTemplate: SavedTemplate = {
      id: `template:${Date.now()}` as any,
      name: templateName.trim(),
      subject: room.subject,
      createdAt: Date.now(),
      pageCount: editor.getPages().length,
    };
    const updated = [newTemplate, ...savedTemplates];
    setSavedTemplates(updated);
    localStorage.setItem('superboard-templates', JSON.stringify(updated));
    setTemplateName('');
    setShowSaveDialog(false);
  }, [templateName, editor, room.subject, savedTemplates]);

  const handleDelete = useCallback((id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem('superboard-templates', JSON.stringify(updated));
  }, [savedTemplates]);

  const handleLoadQuick = useCallback((templateId: string) => {
    if (!editor) return;
    const template = QUICK_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    // Clear existing pages and create new ones
    const existingPages = editor.getPages();
    const existingIds = existingPages.map(p => p.id);

    // Create new pages
    const newPages = Array.from({ length: template.pageCount }, (_, i) => ({
      id: `page:template-${Date.now()}-${i}` as any,
      name: `Page ${i + 1}`,
      index: i,
      translation: { x: 0, y: 0 },
    }));

    // Add title to first page
    editor.createShapes([{
      id: `shape:template-title-${Date.now()}` as any,
      type: 'text' as const,
      x: 100,
      y: 50,
      width: 400,
      height: 30,
      props: { text: template.name, size: 'xl', font: 'sans', color: '#374151' },
    }] as any);

    (editor as any).addPages(newPages);
  }, [editor]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 50,
        left: 100,
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid rgba(0,0,0,0.1)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        minWidth: 280,
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#374151' }}>
          <BookMarked style={{ width: 14, height: 14 }} />
          Lesson Templates
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setShowSaveDialog(true)}
            style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(16,185,129,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Save current as template"
          >
            <Save style={{ width: 14, height: 14, color: '#059669' }} />
          </button>
          <button onClick={() => setOpen(false)} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <div style={{ display: 'flex', gap: 6, padding: 8, borderRadius: 8, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Template name..."
            style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.15)', fontSize: 12, outline: 'none' }}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button
            onClick={handleSave}
            disabled={!templateName.trim()}
            style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#10b981', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            Save
          </button>
        </div>
      )}

      {/* Quick templates */}
      <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Quick Start Templates
      </div>
      {QUICK_TEMPLATES.map((t) => (
        <button
          key={t.id}
          onClick={() => handleLoadQuick(t.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.06)', background: 'white',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#f9fafb';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'white';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.06)';
          }}
        >
          <FolderOpen style={{ width: 16, height: 16, color: '#6366f1', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1f2937' }}>{t.name}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{t.description}</div>
          </div>
          <span style={{ fontSize: 10, color: '#d1d5db' }}>{t.pageCount}p</span>
        </button>
      ))}

      {/* Saved templates */}
      {savedTemplates.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
            My Templates
          </div>
          {savedTemplates.map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.06)', background: 'white',
              }}
            >
              <BookMarked style={{ width: 14, height: 14, color: '#10b981', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#1f2937' }}>{t.name}</div>
                <div style={{ fontSize: 9, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock style={{ width: 9, height: 9 }} />
                  {new Date(t.createdAt).toLocaleDateString()}
                  {' '}{t.pageCount} pages
                </div>
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Trash2 style={{ width: 12, height: 12, color: '#d1d5db' }} />
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
