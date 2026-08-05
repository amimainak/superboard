// ============================================================
// RecordButton — LiveKit E2EE Recording Toggle
// ============================================================
// Red circle button that toggles recording on/off.
// Shows a live duration timer while recording.
// Pulse animation while active.
// ============================================================

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';
import { hasFeature } from '@/lib/usage';
import type { Tier } from '@/types';

// ---- Helpers ----

/** Format seconds into MM:SS or HH:MM:SS */
function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

// ============================================================
// Component
// ============================================================

export default function RecordButton() {
  const isRecording = useAppStore((s) => s.room.isRecording);
  const setRecording = useAppStore((s) => s.setRecording);
  const tier = useAppStore((s) => s.tier);
  const openPaywall = useAppStore((s) => s.openPaywall);

  // Tier gate: recordings require PRO or AGENCY
  const canRecord = hasFeature(tier as Tier, 'recordings');

  // Local timer state
  const [elapsed, setElapsed] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Timer tick ----
  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setElapsed(0);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]);

  // ---- Toggle handler ----
  const handleToggle = useCallback(async () => {
    // Block if tier doesn't have recording feature
    if (!canRecord) {
      openPaywall('recordings');
      return;
    }

    if (isRecording) {
      // Stop recording
      setIsStopping(true);
      try {
        // TODO: POST /api/room/recording/end
        console.log('TODO: POST /api/room/recording/end');
        // await fetch('/api/room/recording/end', { method: 'POST' });
        setRecording(false);
      } catch (err) {
        console.error('Failed to stop recording:', err);
      } finally {
        setIsStopping(false);
      }
    } else {
      // Start recording
      setIsStarting(true);
      try {
        // TODO: POST /api/room/recording/start
        console.log('TODO: POST /api/room/recording/start');
        // await fetch('/api/room/recording/start', { method: 'POST' });
        setRecording(true);
      } catch (err) {
        console.error('Failed to start recording:', err);
      } finally {
        setIsStarting(false);
      }
    }
  }, [isRecording, setRecording]);

  const isDisabled = isStarting || isStopping || !canRecord;

  return (
    <div className="flex items-center gap-2">
      {/* Record button */}
      <button
        type="button"
        disabled={isDisabled}
        onClick={handleToggle}
        className={cn(
          'relative flex items-center justify-center',
          'w-8 h-8 rounded-full transition-all duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isRecording
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
            : 'bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-red-400'
        )}
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {/* Pulse ring while recording */}
        {isRecording && (
          <span
            className={cn(
              'absolute inset-0 rounded-full',
              'bg-red-500/30 animate-ping',
              'pointer-events-none'
            )}
          />
        )}

        {/* Inner icon */}
        <span className="relative z-10">
          {isRecording ? (
            /* Square stop icon */
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
              className="text-white"
            >
              <rect x="1" y="1" width="10" height="10" rx="1.5" />
            </svg>
          ) : (
            /* Circle record icon */
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              className="text-current"
            >
              <circle cx="6" cy="6" r="5" fill="currentColor" />
            </svg>
          )}
        </span>
      </button>

      {/* Timer display */}
      {isRecording && elapsed > 0 && (
        <span className="text-red-400 text-[11px] font-mono font-medium tabular-nums animate-pulse">
          {formatDuration(elapsed)}
        </span>
      )}
    </div>
  );
}
