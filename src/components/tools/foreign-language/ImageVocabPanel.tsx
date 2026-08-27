'use client';
import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Image, Plus, Trash2, Languages } from 'lucide-react';

interface Props {
  editor?: unknown;
}

interface VocabEntry {
  id: string;
  word: string;
  translation: string;
  imageUrl: string | null;
}

export default function ImageVocabPanel({ editor }: Props) {
  const store = useAppStore();
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [searching, setSearching] = useState(false);
  const [deck, setDeck] = useState<VocabEntry[]>([]);
  const [searchedImageUrl, setSearchedImageUrl] = useState<string | null>(null);

  const handleSearchImage = useCallback(() => {
    if (!word.trim()) return;
    setSearching(true);
    // Placeholder for image search API
    setTimeout(() => {
      setSearchedImageUrl(`https://placehold.co/120x90/7c3aed/white?text=${encodeURIComponent(word.trim().slice(0, 8))}`);
      setSearching(false);
    }, 800);
  }, [word]);

  const handleAddToDeck = useCallback(() => {
    if (!word.trim() || !translation.trim()) return;
    const entry: VocabEntry = {
      id: `vocab-${Date.now()}` as any,
      word: word.trim(),
      translation: translation.trim(),
      imageUrl: searchedImageUrl,
    };
    setDeck((prev) => [...prev, entry]);
    setWord('');
    setTranslation('');
    setSearchedImageUrl(null);
  }, [word, translation, searchedImageUrl]);

  const handleRemoveFromDeck = useCallback((id: string) => {
    setDeck((prev) => prev.filter((e) => e.id !== id));
  }, []);

  if (!store.room.imageVocabOpen) return null;

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
        minWidth: 260,
        maxHeight: 480,
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Languages style={{ width: 14, height: 14 }} />
          Image Vocab Builder
        </span>
        <button
          onClick={() => store.toggleImageVocab()}
          style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Word Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#6b7280' }}>Foreign Language Word</span>
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="e.g. Gato"
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid rgba(0,0,0,0.1)',
            fontSize: 12,
            outline: 'none',
          }}
        />
      </div>

      {/* Translation Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#6b7280' }}>English Translation</span>
        <input
          type="text"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          placeholder="e.g. Cat"
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            border: '1px solid rgba(0,0,0,0.1)',
            fontSize: 12,
            outline: 'none',
          }}
        />
      </div>

      {/* Search Image Button */}
      <button
        onClick={handleSearchImage}
        disabled={!word.trim() || searching}
        style={{
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid rgba(0,0,0,0.1)',
          background: (!word.trim() || searching) ? '#f3f4f6' : '#fff',
          cursor: (!word.trim() || searching) ? 'not-allowed' : 'pointer',
          fontSize: 11,
          color: '#374151',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <Image style={{ width: 12, height: 12 }} />
        {searching ? 'Searching...' : 'Search Image'}
      </button>

      {/* Image Preview */}
      {searchedImageUrl && (
        <div
          style={{
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.08)',
            background: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 80,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              background: '#ede9fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image style={{ width: 24, height: 24, color: '#7c3aed' }} />
          </div>
        </div>
      )}

      {/* Add to Deck Button */}
      <button
        onClick={handleAddToDeck}
        disabled={!word.trim() || !translation.trim()}
        style={{
          padding: '7px 10px',
          borderRadius: 6,
          border: 'none',
          background: (!word.trim() || !translation.trim()) ? '#e5e7eb' : '#7c3aed',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          cursor: (!word.trim() || !translation.trim()) ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <Plus style={{ width: 12, height: 12 }} />
        Add to Deck
      </button>

      {/* Deck Size Counter */}
      {deck.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: '#6b7280' }}>Vocabulary Deck</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: 10 }}>
            {deck.length} {deck.length === 1 ? 'word' : 'words'}
          </span>
        </div>
      )}

      {/* Vocabulary List */}
      {deck.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
          {deck.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid rgba(0,0,0,0.06)',
                background: '#fafafa',
              }}
            >
              {/* Image thumbnail placeholder */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 4,
                  background: entry.imageUrl ? '#ede9fe' : '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {entry.imageUrl ? (
                  <Image style={{ width: 14, height: 14, color: '#7c3aed' }} />
                ) : (
                  <Languages style={{ width: 14, height: 14, color: '#9ca3af' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{entry.word}</div>
                <div style={{ fontSize: 10, color: '#6b7280' }}>{entry.translation}</div>
              </div>
              <button
                onClick={() => handleRemoveFromDeck(entry.id)}
                style={{ width: 24, height: 24, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Trash2 style={{ width: 12, height: 12, color: '#9ca3af' }} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '12px 0', color: '#9ca3af', fontSize: 11 }}>
          Add vocabulary words with images to build your study deck.
        </div>
      )}
    </div>
  );
}
