// ============================================================
// SentenceRearrangePanel — Drag-and-Drop Sentence Tiles
// ============================================================
// Category: General Tutoring
// Drag-and-drop word/sentence tiles for syntax and
// word order exercises.
// ============================================================

'use client';

import React, { useState, useCallback } from 'react';
import { Editor } from '@tldraw/tldraw';
import { useAppStore } from '@/store/app-store';
import { GripVertical, Plus, X, Shuffle, Check, ArrowRight, RotateCcw } from 'lucide-react';

interface SentenceRearrangePanelProps {
  editor: Editor | null;
}

export default function SentenceRearrangePanel({ editor }: SentenceRearrangePanelProps) {
  const { room, toggleSentenceRearrangeMode, setSentenceTiles } = useAppStore();
  const { sentenceRearrangeMode, sentenceTiles } = room;
  const [inputSentence, setInputSentence] = useState('');
  const [localTiles, setLocalTiles] = useState<{ id: string; text: string; order: number }[]>([]);

  const handleSplit = useCallback(() => {
    if (!inputSentence.trim()) return;
    // Split by words, punctuation stays with words
    const words = inputSentence.match(/\S+/g) || [];
    const shuffled = words.map((word, i) => ({
      id: `tile:${Date.now()}-${i}` as any,
      text: word,
      order: Math.random(), // Random initial order
    })).sort((a, b) => a.order - b.order);

    setLocalTiles(shuffled);
    setSentenceTiles(shuffled);
  }, [inputSentence, setSentenceTiles]);

  const handleMove = useCallback((fromIndex: number, direction: 'left' | 'right') => {
    setLocalTiles((prev) => {
      const toIndex = direction === 'left' ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const next = [...prev];
      [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
      setSentenceTiles(next);
      return next;
    });
  }, [setSentenceTiles]);

  const handleCheck = useCallback(() => {
    // Check if tiles match original word order
    const original = inputSentence.match(/\S+/g) || [];
    const current = localTiles.map(t => t.text);
    const isCorrect = original.every((word, i) => word === current[i]);

    if (editor && isCorrect) {
      const center = editor.getCurrentPageBounds()?.center || { x: 400, y: 300 };
      editor.createShapes([{
        id: `shape:correct-${Date.now()}` as any,
        type: 'text' as const,
        x: center.x - 100,
        y: center.y - 20,
        width: 200,
        height: 30,
        props: { text: 'Correct! Well done!', size: 'l', font: 'sans', color: '#059669' },
      }] as any);
    }

    return isCorrect;
  }, [editor, inputSentence, localTiles, setSentenceTiles]);

  const handleReset = useCallback(() => {
    const original = inputSentence.match(/\S+/g) || [];
    const reset = original.map((word, i) => ({
      id: `tile:reset-${Date.now()}-${i}` as any,
      text: word,
      order: i,
    }));
    setLocalTiles(reset);
    setSentenceTiles(reset);
  }, [inputSentence, setSentenceTiles]);

  if (!sentenceRearrangeMode) return null;

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
        gap: 10,
        padding: 12,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid rgba(99,102,241,0.2)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(99,102,241,0.12)',
        minWidth: 420,
        maxWidth: 500,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#4338ca' }}>
          <GripVertical style={{ width: 14, height: 14 }} />
          Sentence Rearrange
        </div>
        <button onClick={toggleSentenceRearrangeMode} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {localTiles.length === 0 ? (
        /* Input mode */
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={inputSentence}
            onChange={(e) => setInputSentence(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSplit()}
            placeholder="Type a sentence to rearrange..."
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.15)', fontSize: 13, outline: 'none',
            }}
          />
          <button
            onClick={handleSplit}
            disabled={!inputSentence.trim()}
            style={{
              padding: '6px 12px', borderRadius: 8, border: 'none',
              background: inputSentence.trim() ? '#6366f1' : '#d1d5db',
              color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Shuffle style={{ width: 14, height: 14 }} />
          </button>
        </div>
      ) : (
        /* Tiles mode */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Instruction */}
          <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>
            Click arrows to rearrange words into the correct order
          </div>

          {/* Tiles */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', padding: '8px 10px', background: 'rgba(0,0,0,0.02)', borderRadius: 8, minHeight: 50 }}>
            {localTiles.map((tile, i) => (
              <div
                key={tile.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  padding: '4px 8px', borderRadius: 8,
                  background: 'white', border: '1px solid rgba(0,0,0,0.1)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <button
                  onClick={() => handleMove(i, 'left')}
                  disabled={i === 0}
                  style={{
                    width: 20, height: 20, borderRadius: 4, border: 'none',
                    background: i > 0 ? 'rgba(0,0,0,0.05)' : 'transparent',
                    cursor: i > 0 ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <ArrowRight style={{ width: 10, height: 10, transform: 'rotate(180deg)', color: i > 0 ? '#6b7280' : '#d1d5db' }} />
                </button>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', padding: '0 4px' }}>
                  {tile.text}
                </span>
                <span style={{ fontSize: 9, color: '#d1d5db', fontWeight: 600 }}>{i + 1}</span>
                <button
                  onClick={() => handleMove(i, 'right')}
                  disabled={i === localTiles.length - 1}
                  style={{
                    width: 20, height: 20, borderRadius: 4, border: 'none',
                    background: i < localTiles.length - 1 ? 'rgba(0,0,0,0.05)' : 'transparent',
                    cursor: i < localTiles.length - 1 ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <ArrowRight style={{ width: 10, height: 10, color: i < localTiles.length - 1 ? '#6b7280' : '#d1d5db' }} />
                </button>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleCheck}
              style={{
                flex: 1, padding: '5px 8px', borderRadius: 6, border: 'none',
                background: '#10b981', color: 'white', fontSize: 11,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Check style={{ width: 12, height: 12, display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
              Check Order
            </button>
            <button
              onClick={handleReset}
              style={{
                flex: 1, padding: '5px 8px', borderRadius: 6, border: 'none',
                background: 'rgba(0,0,0,0.05)', color: '#6b7280', fontSize: 11,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              <RotateCcw style={{ width: 12, height: 12, display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
              Show Answer
            </button>
            <button
              onClick={() => { setLocalTiles([]); setInputSentence(''); }}
              style={{
                flex: 1, padding: '5px 8px', borderRadius: 6, border: 'none',
                background: 'rgba(0,0,0,0.05)', color: '#6b7280', fontSize: 11,
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              New Sentence
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
