// ============================================================
// RubricOverlay — Grading Rubric Widget
// ============================================================
// Category: English & Reading
// Attach a rubric to a section of the board.
// Tap cells to score in real-time while reviewing essays.
// ============================================================

'use client';

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { ClipboardCheck, Plus, X, Save } from 'lucide-react';

const DEFAULT_RUBRICS = {
  essay: [
    { criterion: 'Thesis Statement', maxPoints: 4, selectedPoints: 0 },
    { criterion: 'Evidence & Support', maxPoints: 6, selectedPoints: 0 },
    { criterion: 'Organization', maxPoints: 4, selectedPoints: 0 },
    { criterion: 'Grammar & Mechanics', maxPoints: 3, selectedPoints: 0 },
    { criterion: 'Conclusion', maxPoints: 3, selectedPoints: 0 },
  ],
  paragraph: [
    { criterion: 'Topic Sentence', maxPoints: 3, selectedPoints: 0 },
    { criterion: 'Supporting Details', maxPoints: 4, selectedPoints: 0 },
    { criterion: 'Transitions', maxPoints: 2, selectedPoints: 0 },
    { criterion: 'Concluding Sentence', maxPoints: 1, selectedPoints: 0 },
  ],
  reading: [
    { criterion: 'Comprehension', maxPoints: 4, selectedPoints: 0 },
    { criterion: 'Analysis', maxPoints: 4, selectedPoints: 0 },
    { criterion: 'Evidence Citation', maxPoints: 4, selectedPoints: 0 },
    { criterion: 'Critical Thinking', maxPoints: 3, selectedPoints: 0 },
  ],
};

type RubricTemplate = keyof typeof DEFAULT_RUBRICS;

export default function RubricOverlay() {
  const { room, toggleRubric, setRubricData, updateRubricScore } = useAppStore();
  const { rubricOpen, rubricData } = room;

  if (!rubricOpen) return null;

  const totalPossible = rubricData?.reduce((sum, r) => sum + r.maxPoints, 0) || 0;
  const totalScored = rubricData?.reduce((sum, r) => sum + r.selectedPoints, 0) || 0;

  return (
    <div
      style={{
        position: 'absolute',
        top: 50,
        right: 16,
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(99,102,241,0.12)',
        minWidth: 240,
        maxHeight: '80vh',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#4338ca' }}>
          <ClipboardCheck style={{ width: 14, height: 14 }} />
          Grading Rubric
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {rubricData && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.1)' }}>
              {totalScored}/{totalPossible}
            </span>
          )}
          <button onClick={toggleRubric} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>
      </div>

      {/* Template selector */}
      {!rubricData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>Choose a template:</span>
          {(Object.keys(DEFAULT_RUBRICS) as RubricTemplate[]).map((key) => (
            <button
              key={key}
              onClick={() => setRubricData(DEFAULT_RUBRICS[key].map(r => ({ ...r })))}
              style={{
                padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)',
                background: 'white', cursor: 'pointer', textAlign: 'left', fontSize: 12,
                fontWeight: 600, color: '#374151', textTransform: 'capitalize',
              }}
            >
              {key} Rubric ({DEFAULT_RUBRICS[key].reduce((s, r) => s + r.maxPoints, 0)} pts)
            </button>
          ))}
        </div>
      )}

      {/* Rubric grid */}
      {rubricData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rubricData.map((row, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{row.criterion}</span>
                <span style={{ fontSize: 10, color: '#6b7280' }}>({row.maxPoints} pts)</span>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                {Array.from({ length: row.maxPoints }, (_, pt) => (
                  <button
                    key={pt}
                    onClick={() => updateRubricScore(i, pt + 1)}
                    style={{
                      width: 28, height: 28, borderRadius: 6, border: 'none',
                      background: pt < row.selectedPoints ? '#6366f1' : 'rgba(0,0,0,0.05)',
                      color: pt < row.selectedPoints ? 'white' : '#9ca3af',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {pt + 1}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Total score */}
          <div style={{
            padding: '8px 12px', borderRadius: 8, background: 'rgba(99,102,241,0.08)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 4,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#4338ca' }}>Total Score</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#4338ca' }}>
              {totalScored} / {totalPossible}
            </span>
          </div>

          {/* Reset */}
          <button
            onClick={() => setRubricData(null)}
            style={{
              padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)',
              background: 'transparent', cursor: 'pointer', fontSize: 10,
              fontWeight: 500, color: '#9ca3af',
            }}
          >
            Change Template
          </button>
        </div>
      )}
    </div>
  );
}
