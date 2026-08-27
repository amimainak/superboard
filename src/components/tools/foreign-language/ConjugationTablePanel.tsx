// ============================================================
// ConjugationTablePanel — Verb Conjugation Templates
// ============================================================
// Category: Foreign Language
// Pre-built templates for regular/irregular verb conjugations,
// noun declensions, adjective agreement tables.
// ============================================================

'use client';

import React, { useState, useCallback } from 'react';
import { Editor } from '@tldraw/tldraw';
import { Table2, Plus, X, Languages } from 'lucide-react';

interface ConjugationPanelProps {
  editor: Editor | null;
}

type TemplateType = 'present' | 'preterite' | 'subjunctive' | 'pass-compose' | 'futur' | 'noun-declension' | 'adjective-agreement';

const TEMPLATES: { id: TemplateType; label: string; language: string; description: string }[] = [
  { id: 'present', label: 'Present Tense', language: 'Spanish', description: 'yo, tú, él/ella, nosotros, vosotros, ellos' },
  { id: 'preterite', label: 'Preterite', language: 'Spanish', description: 'Past tense conjugation' },
  { id: 'subjunctive', label: 'Subjunctive', language: 'Spanish', description: 'Present subjunctive mood' },
  { id: 'pass-compose', label: 'Pass\u00e9 Compos\u00e9', language: 'French', description: 'avoir/\u00eatre + past participle' },
  { id: 'futur', label: 'Futur Simple', language: 'French', description: 'Simple future tense' },
  { id: 'noun-declension', label: 'Noun Declension', language: 'German', description: 'Nom, Akk, Dat, Gen cases' },
  { id: 'adjective-agreement', label: 'Adjective Agreement', language: 'French', description: 'Masc/Fem sing/pl agreement' },
];

const PRONOUNS = {
  present: ['yo', 't\u00fa', '\u00e9l/ella/Ud.', 'nosotros/as', 'vosotros/as', 'ellos/ellas/Uds.'],
  preterite: ['yo', 't\u00fa', '\u00e9l/ella/Ud.', 'nosotros/as', 'vosotros/as', 'ellos/ellas/Uds.'],
  subjunctive: ['yo', 't\u00fa', '\u00e9l/ella/Ud.', 'nosotros/as', 'vosotros/as', 'ellos/ellas/Uds.'],
  'pass-compose': ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles'],
  futur: ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles'],
  'noun-declension': ['Nominativ', 'Akkusativ', 'Dativ', 'Genitiv'],
  'adjective-agreement': ['Masc. Sing.', 'Fem. Sing.', 'Masc. Pl.', 'Fem. Pl.'],
};

function createConjugationTable(editor: Editor, templateId: TemplateType, verb: string) {
  const center = editor.getCurrentPageBounds()?.center || { x: 400, y: 300 };
  const pronouns = PRONOUNS[templateId];
  const headerW = 180, rowH = 40, verbColW = 140;
  const totalW = headerW + verbColW;
  const headerH = 50;

  // Title
  editor.createShapes([{
    id: `shape:conj-title-${Date.now()}` as any,
    type: 'text' as const,
    x: center.x - totalW / 2,
    y: center.y - 200,
    width: totalW,
    height: 30,
    props: { text: `Conjugation: ${verb}`, size: 'l', font: 'sans', color: '#4338ca' },
  }] as any);

  // Header row
  editor.createShapes([{
    id: `shape:conj-h1-${Date.now()}` as any,
    type: 'geo' as const,
    x: center.x - totalW / 2,
    y: center.y - 160,
    width: headerW,
    height: headerH,
    props: { geo: 'rectangle', w: headerW, h: headerH, color: '#6366f1', fill: 'solid', dash: 'draw', size: 'm', text: 'Subject', align: 'middle', verticalAlign: 'middle' },
  }, {
    id: `shape:conj-h2-${Date.now()}` as any,
    type: 'geo' as const,
    x: center.x - totalW / 2 + headerW,
    y: center.y - 160,
    width: verbColW,
    height: headerH,
    props: { geo: 'rectangle', w: verbColW, h: headerH, color: '#6366f1', fill: 'solid', dash: 'draw', size: 'm', text: verb, align: 'middle', verticalAlign: 'middle' },
  }] as any);

  // Pronoun rows
  pronouns.forEach((pronoun, i) => {
    const y = center.y - 160 + headerH + i * rowH;
    editor.createShapes([{
      id: `shape:conj-pronoun-${Date.now()}-${i}` as any,
      type: 'geo' as const,
      x: center.x - totalW / 2,
      y,
      width: headerW,
      height: rowH,
      props: { geo: 'rectangle', w: headerW, h: rowH, color: '#374151', fill: 'none', dash: 'draw', size: 's', text: pronoun, align: 'middle', verticalAlign: 'middle' },
    }, {
      id: `shape:conj-verb-${Date.now()}-${i}` as any,
      type: 'geo' as const,
      x: center.x - totalW / 2 + headerW,
      y,
      width: verbColW,
      height: rowH,
      props: { geo: 'rectangle', w: verbColW, h: rowH, color: '#374151', fill: 'none', dash: 'draw', size: 'm', text: '', align: 'middle', verticalAlign: 'middle' },
    }] as any);
  });
}

export default function ConjugationTablePanel({ editor }: ConjugationPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('present');
  const [verb, setVerb] = useState('hablar');

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
        minWidth: 260,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#374151' }}>
          <Table2 style={{ width: 14, height: 14 }} />
          Conjugation Table
        </div>
        <button onClick={() => setOpen(false)} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {/* Language tabs */}
      <div style={{ display: 'flex', gap: 2 }}>
        {['Spanish', 'French', 'German'].map((lang) => (
          <span
            key={lang}
            style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
              background: TEMPLATES.some(t => t.language === lang && t.id === selectedTemplate) ? '#6366f1' : 'rgba(0,0,0,0.05)',
              color: TEMPLATES.some(t => t.language === lang && t.id === selectedTemplate) ? 'white' : '#6b7280',
              cursor: 'pointer',
            }}
          >
            {lang}
          </span>
        ))}
      </div>

      {/* Template selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 150, overflowY: 'auto' }}>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTemplate(t.id)}
            style={{
              padding: '5px 8px', borderRadius: 6, border: '1px solid transparent',
              background: selectedTemplate === t.id ? 'rgba(99,102,241,0.1)' : 'transparent',
              cursor: 'pointer', textAlign: 'left', fontSize: 11,
              fontWeight: selectedTemplate === t.id ? 600 : 400,
              color: selectedTemplate === t.id ? '#4338ca' : '#6b7280',
            }}
          >
            {t.label} <span style={{ color: '#9ca3af' }}> ({t.language})</span>
          </button>
        ))}
      </div>

      {/* Verb/word input */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          value={verb}
          onChange={(e) => setVerb(e.target.value)}
          placeholder="Enter verb/word..."
          style={{
            flex: 1, padding: '6px 10px', borderRadius: 8,
            border: '1px solid rgba(0,0,0,0.15)', fontSize: 13,
            fontWeight: 500, outline: 'none',
          }}
        />
        <button
          onClick={() => {
            if (editor && verb.trim()) {
              createConjugationTable(editor, selectedTemplate, verb.trim());
              setOpen(false);
            }
          }}
          style={{
            padding: '6px 12px', borderRadius: 8, border: 'none',
            background: '#6366f1', color: 'white', fontSize: 12,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Preview hint */}
      <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>
        {PRONOUNS[selectedTemplate]?.join(', ')}
      </div>
    </div>
  );
}
