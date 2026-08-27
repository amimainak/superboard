// ============================================================
// DiacriticalToolbar — Floating Special Character Palette
// ============================================================
// Category: Foreign Language
// Provides language-specific diacritical characters
// for Spanish, French, German, Portuguese, etc.
// ============================================================

'use client';

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { X, Languages } from 'lucide-react';

const LANGUAGE_CHARSETS: Record<string, { label: string; chars: string[] }> = {
  spanish: {
    label: 'Spanish',
    chars: ['\u00f1', '\u00d1', '\u00e1', '\u00e9', '\u00ed', '\u00f3', '\u00fa', '\u00fc', '\u00bf', '\u00a1', '\u00fc', '\u00c1', '\u00c9', '\u00cd', '\u00d3', '\u00da'],
  },
  french: {
    label: 'French',
    chars: ['\u00e7', '\u00e0', '\u00e2', '\u00ea', '\u00eb', '\u00e9', '\u00e8', '\u00ee', '\u00ef', '\u00f4', '\u00fb', '\u00f9', '\u00c7', '\u00c0', '\u00ca', '\u00c9'],
  },
  german: {
    label: 'German',
    chars: ['\u00fc', '\u00f6', '\u00e4', '\u00df', '\u00dc', '\u00d6', '\u00c4'],
  },
  portuguese: {
    label: 'Portuguese',
    chars: ['\u00e3', '\u00f5', '\u00e1', '\u00e9', '\u00ed', '\u00f3', '\u00fa', '\u00e7', '\u00e2', '\u00ea', '\u00f4', '\u00c3', '\u00d5', '\u00c1', '\u00c7'],
  },
  italian: {
    label: 'Italian',
    chars: ['\u00e0', '\u00e8', '\u00e9', '\u00ec', '\u00f2', '\u00f9', '\u00c0', '\u00c8', '\u00c9'],
  },
  japanese: {
    label: 'Japanese',
    chars: ['\u3042', '\u3044', '\u3046', '\u3048', '\u304a', '\u304b', '\u304d', '\u304f', '\u3051', '\u3053', '\u3055', '\u3057', '\u3059', '\u305b', '\u305d', '\u305f'],
  },
};

export default function DiacriticalToolbar() {
  const { room, toggleDiacritical } = useAppStore();
  const { diacriticalOpen, diacriticalLanguage } = room;
  const [activeLang, setActiveLang] = useState(diacriticalLanguage || 'spanish');

  const charset = LANGUAGE_CHARSETS[activeLang] || LANGUAGE_CHARSETS.spanish;

  const handleInsert = useCallback((char: string) => {
    const event = new CustomEvent('superboard:insert-char', { detail: { char } });
    window.dispatchEvent(event);
    try {
      const activeEl = document.activeElement as HTMLElement;
      if (activeEl && activeEl.tagName === 'TEXTAREA' || activeEl && activeEl.tagName === 'INPUT') {
        const start = (activeEl as HTMLInputElement).selectionStart || 0;
        const end = (activeEl as HTMLInputElement).selectionEnd || 0;
        const value = (activeEl as HTMLInputElement).value || '';
        const newValue = value.slice(0, start) + char + value.slice(end);
        // React synthetic events need this workaround
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(activeEl, newValue);
        } else {
          (activeEl as HTMLInputElement).value = newValue;
        }
        activeEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } catch {}
  }, []);

  if (!diacriticalOpen) return null;

  const languages = Object.keys(LANGUAGE_CHARSETS);

  return (
    <div
      style={{
        position: 'absolute',
        top: 50,
        left: 100,
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 8,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid rgba(0,0,0,0.1)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        minWidth: 220,
        maxHeight: 320,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#374151' }}>
          <Languages style={{ width: 14, height: 14 }} />
          Special Characters
        </div>
        <button
          onClick={() => toggleDiacritical()}
          style={{
            width: 24, height: 24, borderRadius: 6, border: 'none',
            background: 'rgba(0,0,0,0.05)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {/* Language tabs */}
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {languages.map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang)}
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              border: 'none',
              background: activeLang === lang ? '#6366f1' : 'rgba(0,0,0,0.05)',
              color: activeLang === lang ? 'white' : '#6b7280',
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {LANGUAGE_CHARSETS[lang].label}
          </button>
        ))}
      </div>

      <Separator />

      {/* Character grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
        {charset.chars.map((char, i) => (
          <button
            key={`${activeLang}-${i}`}
            onClick={() => handleInsert(char)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'white',
              cursor: 'pointer',
              fontSize: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#f3f4f6';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'white';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
            title={`Insert ${char}`}
          >
            {char}
          </button>
        ))}
      </div>
    </div>
  );
}
