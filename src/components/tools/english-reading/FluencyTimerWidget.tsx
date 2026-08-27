// ============================================================
// FluencyTimerWidget — Reading Fluency Timer
// ============================================================
// Category: English & Reading
// Counts up (timed reading) or down (fluency drill).
// Auto-stops and shows word count / WPM.
// ============================================================

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { Timer, Play, Pause, Square, RotateCcw, BookOpen } from 'lucide-react';

export default function FluencyTimerWidget() {
  const { room, startFluencyTimer, stopFluencyTimer, tickFluencyTimer, setFluencyWpm } = useAppStore();
  const isTutor = room.isTutor;
  const {
    fluencyTimerActive, fluencyTimerSeconds, fluencyTimerDirection,
    fluencyTimerTotal, fluencyWpm,
  } = room;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordCountRef = useRef(0);

  // Tick every second
  useEffect(() => {
    if (fluencyTimerActive) {
      intervalRef.current = setInterval(() => {
        tickFluencyTimer();
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fluencyTimerActive, tickFluencyTimer]);

  // Auto-stop countdown
  useEffect(() => {
    if (fluencyTimerDirection === 'down' && fluencyTimerActive && fluencyTimerSeconds <= 0) {
      stopFluencyTimer();
      // Calculate WPM
      if (wordCountRef.current > 0 && fluencyTimerTotal > 0) {
        const wpm = Math.round((wordCountRef.current / fluencyTimerTotal) * 60);
        setFluencyWpm(wpm);
      }
    }
  }, [fluencyTimerSeconds, fluencyTimerDirection, fluencyTimerActive, fluencyTimerTotal, stopFluencyTimer, setFluencyWpm]);

  const handleSetWordCount = useCallback((count: number) => {
    wordCountRef.current = count;
  }, []);

  const handleStop = useCallback(() => {
    stopFluencyTimer();
    if (wordCountRef.current > 0 && fluencyTimerSeconds > 0) {
      const wpm = Math.round((wordCountRef.current / fluencyTimerSeconds) * 60);
      setFluencyWpm(wpm);
    }
  }, [stopFluencyTimer, fluencyTimerSeconds, setFluencyWpm]);

  if (!fluencyTimerActive && fluencyTimerSeconds === 0 && fluencyWpm === null) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: '25%',
        transform: 'translateX(-50%)',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.97)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.12)',
      }}
    >
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#059669' }}>
        <BookOpen style={{ width: 14, height: 14 }} />
        Fluency Timer
      </div>

      {/* Timer display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Timer style={{ width: 16, height: 16, color: '#059669' }} />
        <span style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: '#1f2937', minWidth: 70, textAlign: 'center' }}>
          {Math.floor(fluencyTimerSeconds / 60)}:{String(fluencyTimerSeconds % 60).padStart(2, '0')}
        </span>
        <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>
          {fluencyTimerDirection === 'up' ? 'COUNT UP' : `of ${Math.floor(fluencyTimerTotal / 60)}:${String(fluencyTimerTotal % 60).padStart(2, '0')}`}
        </span>
      </div>

      {/* Word count input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}>
        <span>Words read:</span>
        <input
          type="number"
          min={0}
          defaultValue={0}
          onChange={(e) => handleSetWordCount(parseInt(e.target.value) || 0)}
          style={{
            width: 50, padding: '2px 6px', borderRadius: 4,
            border: '1px solid rgba(0,0,0,0.15)', fontSize: 13,
            fontWeight: 600, textAlign: 'center', outline: 'none',
          }}
        />
      </div>

      {/* WPM display */}
      {fluencyWpm !== null && (
        <div style={{
          fontSize: 14, fontWeight: 700, color: '#059669',
          padding: '4px 12px', borderRadius: 8,
          background: 'rgba(16, 185, 129, 0.1)',
        }}>
          {fluencyWpm} WPM
        </div>
      )}

      {/* Controls */}
      {isTutor && (
        <div style={{ display: 'flex', gap: 4 }}>
          {!fluencyTimerActive && (
            <>
              <button
                onClick={() => startFluencyTimer('up')}
                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#059669', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                title="Count up"
              >
                <Play style={{ width: 10, height: 10 }} /> Up
              </button>
              <button
                onClick={() => startFluencyTimer('down', 60)}
                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#059669', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                title="Count down from 1 min"
              >
                <Pause style={{ width: 10, height: 10 }} /> 1m
              </button>
              <button
                onClick={() => startFluencyTimer('down', 120)}
                style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#059669', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                title="Count down from 2 min"
              >
                <Pause style={{ width: 10, height: 10 }} /> 2m
              </button>
            </>
          )}
          {fluencyTimerActive && (
            <button
              onClick={handleStop}
              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#ef4444', color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              title="Stop and calculate WPM"
            >
              <Square style={{ width: 10, height: 10 }} /> Stop
            </button>
          )}
          {!fluencyTimerActive && fluencyWpm !== null && (
            <button
              onClick={() => setFluencyWpm(null)}
              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', fontSize: 11, fontWeight: 600, cursor: 'pointer', color: '#6b7280' }}
              title="Reset"
            >
              <RotateCcw style={{ width: 10, height: 10 }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
