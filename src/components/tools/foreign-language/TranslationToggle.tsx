// ============================================================
// TranslationToggle — Show/Hide Translation Layer
// ============================================================
// Category: Foreign Language
// Toggle button that hides/shows English translations
// beneath target-language text on the board.
// ============================================================

'use client';

import React from 'react';
import { useAppStore } from '@/store/app-store';
import { Languages, Eye, EyeOff } from 'lucide-react';

export default function TranslationToggle() {
  const { room, toggleTranslation } = useAppStore();
  const { translationVisible } = room;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: 16,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 10,
        background: translationVisible ? 'rgba(255,255,255,0.95)' : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${translationVisible ? 'rgba(0,0,0,0.1)' : 'rgba(239, 68, 68, 0.3)'}`,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        cursor: 'pointer',
      }}
      onClick={toggleTranslation}
      title={translationVisible ? 'Hide translations' : 'Show translations'}
    >
      {translationVisible
        ? <Eye style={{ width: 14, height: 14, color: '#6366f1' }} />
        : <EyeOff style={{ width: 14, height: 14, color: '#ef4444' }} />
      }
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        color: translationVisible ? '#4338ca' : '#ef4444',
      }}>
        {translationVisible ? 'Translations ON' : 'Translations OFF'}
      </span>
    </div>
  );
}
