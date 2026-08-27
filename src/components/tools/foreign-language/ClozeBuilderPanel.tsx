// ============================================================
// ClozeBuilder — Fill-in-the-Blank Exercise Generator
// ============================================================
// Category: Foreign Language
// Select text → auto-generate cloze exercise by blanking out
// key words. Students write answers in blanks. Tap to reveal.
// ============================================================

'use client';

import React, { useState, useCallback } from 'react';
import { Editor } from '@tldraw/tldraw';
import { useAppStore } from '@/store/app-store';
import { Puzzle, Plus, X, Eye, EyeOff, Check } from 'lucide-react';

interface ClozePanelProps {
  editor: Editor | null;
}

export default function ClozeBuilderPanel({ editor }: ClozePanelProps) {
  const { room, toggleClozeMode, addClozeBlank } = useAppStore();
  const { clozeMode, clozeBlanks } = room;
  const [inputText, setInputText] = useState('');
  const [blankedText, setBlankedText] = useState('');
  const [revealedBlanks, setRevealedBlanks] = useState<Set<number>>(new Set());

  const handleGenerate = useCallback(() => {
    if (!inputText.trim()) return;

    const words = inputText.split(/\s+/);
    // Blank out every Nth word (skip articles, prepositions for language exercises)
    const skipWords = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'to', 'of', 'and', 'is', 'are', 'el', 'la', 'los', 'las', 'un', 'una', 'de', 'en', 'y', 'es', 'le', 'les', 'des', 'du']);
    const blanks: string[] = [];
    let result = words.map((word, i) => {
      const clean = word.replace(/[^a-zA-Z\u00e0-\u00ff]/g, '');
      if (!skipWords.has(clean.toLowerCase()) && (i + 1) % 4 === 0) {
        blanks.push(clean);
        return `___${blanks.length}___`;
      }
      return word;
    }).join(' ');

    setBlankedText(result);
    addClozeBlank(blanks.join(','));
  }, [inputText, addClozeBlank]);

  const handleReveal = useCallback((index: number) => {
    setRevealedBlanks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleRevealAll = useCallback(() => {
    const blanks = clozeBlanks.flatMap(b => b.split(','));
    setRevealedBlanks(new Set(blanks.map((_, i) => i)));
  }, [clozeBlanks]);

  const handleInsertToCanvas = useCallback(() => {
    if (!editor || !blankedText) return;
    const center = editor.getCurrentPageBounds()?.center || { x: 400, y: 300 };
    editor.createShapes([{
      id: `shape:cloze-${Date.now()}` as any,
      type: 'text' as const,
      x: center.x - 200,
      y: center.y - 100,
      width: 400,
      height: 200,
      props: { text: blankedText, size: 'm', font: 'sans', color: '#1f2937' },
    }] as any);
  }, [editor, blankedText]);

  if (!clozeMode) return null;

  const words = blankedText.split(/(___\d+___)/);
  const answers = clozeBlanks.flatMap(b => b.split(',')).filter(Boolean);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 140,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid rgba(99,102,241,0.2)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(99,102,241,0.12)',
        minWidth: 400,
        maxWidth: 500,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#4338ca' }}>
          <Puzzle style={{ width: 14, height: 14 }} />
          Cloze Builder
        </div>
        <button onClick={toggleClozeMode} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {!blankedText ? (
        /* Input mode */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste text here to create a fill-in-the-blank exercise..."
            style={{
              width: '100%', minHeight: 60, padding: '8px 10px', borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.15)', fontSize: 12, resize: 'vertical', outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleGenerate}
            disabled={!inputText.trim()}
            style={{
              padding: '6px 12px', borderRadius: 8, border: 'none',
              background: inputText.trim() ? '#6366f1' : '#d1d5db',
              color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Generate Cloze
          </button>
        </div>
      ) : (
        /* Cloze display mode */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Text with blanks */}
          <div style={{ fontSize: 14, lineHeight: 1.8, color: '#1f2937', padding: '8px 10px', background: 'rgba(0,0,0,0.02)', borderRadius: 8 }}>
            {words.map((word, i) => {
              const blankMatch = word.match(/___(\d+)___/);
              if (blankMatch) {
                const blankIndex = parseInt(blankMatch[1]) - 1;
                const isRevealed = revealedBlanks.has(blankIndex);
                return (
                  <span key={i}>
                    <button
                      onClick={() => handleReveal(blankIndex)}
                      style={{
                        display: 'inline-block', minWidth: 60, padding: '2px 8px',
                        borderRadius: 4, border: `1px solid ${isRevealed ? '#10b981' : '#6366f1'}`,
                        background: isRevealed ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.05)',
                        color: isRevealed ? '#059669' : '#6366f1',
                        fontWeight: 600, fontSize: 13, cursor: 'pointer',
                        margin: '0 2px',
                      }}
                    >
                      {isRevealed ? (answers[blankIndex] || '?') : `${blankIndex + 1}`}
                    </button>{' '}
                  </span>
                );
              }
              return <span key={i}>{word} </span>;
            })}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleRevealAll}
              style={{
                flex: 1, padding: '5px 8px', borderRadius: 6, border: 'none',
                background: '#10b981', color: 'white', fontSize: 11,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Eye style={{ width: 12, height: 12, display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
              Reveal All
            </button>
            <button
              onClick={() => { setRevealedBlanks(new Set()); }}
              style={{
                flex: 1, padding: '5px 8px', borderRadius: 6, border: 'none',
                background: 'rgba(0,0,0,0.05)', color: '#6b7280', fontSize: 11,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              <EyeOff style={{ width: 12, height: 12, display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
              Hide All
            </button>
            <button
              onClick={handleInsertToCanvas}
              style={{
                flex: 1, padding: '5px 8px', borderRadius: 6, border: 'none',
                background: '#6366f1', color: 'white', fontSize: 11,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Plus style={{ width: 12, height: 12, display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
              Add to Board
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
