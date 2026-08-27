// ============================================================
// FlashcardMode — Vocabulary Flashcard Widget
// ============================================================
// Category: Foreign Language
// Select word on board → flip card (front/back).
// Generate deck from session vocabulary.
// ============================================================

'use client';

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { CreditCard, ChevronLeft, ChevronRight, RotateCcw, Plus, X, Volume2 } from 'lucide-react';

export default function FlashcardModeWidget() {
  const {
    room, toggleFlashcardMode, setFlashcards, nextFlashcard,
    prevFlashcard, flipFlashcard,
  } = useAppStore();
  const { flashcardMode, flashcards, flashcardIndex, flashcardFlipped } = room;

  const [addMode, setAddMode] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');

  const handleAddCard = useCallback(() => {
    if (newFront.trim() && newBack.trim()) {
      const updated = [...flashcards, {
        id: `card:${Date.now()}` as any,
        front: newFront.trim(),
        back: newBack.trim(),
      }];
      setFlashcards(updated);
      setNewFront('');
      setNewBack('');
    }
  }, [newFront, newBack, flashcards, setFlashcards]);

  if (!flashcardMode) return null;

  const card = flashcards[flashcardIndex];

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1002,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.98)',
        border: '1px solid rgba(0,0,0,0.1)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
        minWidth: 320,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#374151' }}>
          <CreditCard style={{ width: 14, height: 14 }} />
          Flashcards ({flashcards.length})
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setAddMode(!addMode)}
            style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(99,102,241,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Add card"
          >
            <Plus style={{ width: 14, height: 14, color: '#6366f1' }} />
          </button>
          <button
            onClick={toggleFlashcardMode}
            style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {/* Add card form */}
      {addMode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', padding: 8, borderRadius: 8, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
          <input
            value={newFront}
            onChange={(e) => setNewFront(e.target.value)}
            placeholder="Front (word)..."
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.15)', fontSize: 13, outline: 'none' }}
          />
          <input
            value={newBack}
            onChange={(e) => setNewBack(e.target.value)}
            placeholder="Back (definition)..."
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.15)', fontSize: 13, outline: 'none' }}
          />
          <button
            onClick={handleAddCard}
            disabled={!newFront.trim() || !newBack.trim()}
            style={{ padding: '6px', borderRadius: 6, border: 'none', background: '#6366f1', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Add Card
          </button>
        </div>
      )}

      {/* Flashcard */}
      {card ? (
        <>
          {/* Card counter */}
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>
            Card {flashcardIndex + 1} of {flashcards.length}
          </div>

          {/* The card */}
          <div
            onClick={flipFlashcard}
            style={{
              width: 260,
              minHeight: 120,
              padding: 20,
              borderRadius: 12,
              border: `2px solid ${flashcardFlipped ? '#10b981' : '#6366f1'}`,
              background: flashcardFlipped ? 'rgba(16,185,129,0.05)' : 'rgba(99,102,241,0.05)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              userSelect: 'none',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: flashcardFlipped ? '#059669' : '#4338ca' }}>
              {flashcardFlipped ? card.back : card.front}
            </div>
            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 8 }}>
              {flashcardFlipped ? 'Tap to flip back' : 'Tap to reveal'}
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={prevFlashcard}
              disabled={flashcardIndex === 0}
              style={{
                width: 36, height: 36, borderRadius: 8, border: 'none',
                background: flashcardIndex > 0 ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.02)',
                cursor: flashcardIndex > 0 ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronLeft style={{ width: 16, height: 16, color: flashcardIndex > 0 ? '#374151' : '#d1d5db' }} />
            </button>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 4 }}>
              {flashcards.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: i === flashcardIndex ? '#6366f1' : 'rgba(0,0,0,0.1)',
                    transition: 'all 0.2s',
                  }}
                />
              ))}
            </div>
            <button
              onClick={nextFlashcard}
              disabled={flashcardIndex >= flashcards.length - 1}
              style={{
                width: 36, height: 36, borderRadius: 8, border: 'none',
                background: flashcardIndex < flashcards.length - 1 ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.02)',
                cursor: flashcardIndex < flashcards.length - 1 ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronRight style={{ width: 16, height: 16, color: flashcardIndex < flashcards.length - 1 ? '#374151' : '#d1d5db' }} />
            </button>
          </div>
        </>
      ) : (
        /* Empty state */
        <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af' }}>
          <CreditCard style={{ width: 32, height: 32, margin: '0 auto 8px', opacity: 0.5 }} />
          <p style={{ fontSize: 13, fontWeight: 500 }}>No flashcards yet</p>
          <p style={{ fontSize: 11 }}>Click + to add vocabulary cards</p>
        </div>
      )}
    </div>
  );
}
