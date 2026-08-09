// ============================================================
// SessionTimer — Floating in-session timer for whiteboard
// ============================================================
// Fixed top-center, z-40. Auto-starts on mount.
// 5-minute warning: amber background + pulse animation.
// Tutor-only: Extend +15min and End buttons.
// ============================================================
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Clock, Plus, LogOut } from 'lucide-react';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
type Props = {
  isTutor: boolean;
  onEndLesson?: () => void;
  onExtend?: () => void;
};

export default function SessionTimer({ isTutor, onEndLesson, onExtend }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [pulseWarning, setPulseWarning] = useState(false);
  const [extending, setExtending] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSecondsRef = useRef(0);

  // Timer tick
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Detect 5-minute milestones for warning pulse
  useEffect(() => {
    const prev = prevSecondsRef.current;
    prevSecondsRef.current = seconds;

    if (seconds <= 0 || seconds === prev) return;

    const warningInterval = 5 * 60; // 300 seconds
    if (seconds % warningInterval === 0) {
      const handle = setTimeout(() => {
        setPulseWarning(true);
        const clearHandle = setTimeout(() => {
          setPulseWarning(false);
        }, 5000);
        pulseTimeoutRef.current = clearHandle;
      }, 0);
      return () => clearTimeout(handle);
    }
  }, [seconds]);

  // Cleanup pulse timeout on unmount
  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    };
  }, []);

  const handleExtend = () => {
    setExtending(true);
    setPulseWarning(false);
    onExtend?.();
    setTimeout(() => setExtending(false), 1000);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
      <div
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border transition-all duration-300 backdrop-blur-sm
          ${pulseWarning
            ? 'bg-amber-500/90 text-white border-amber-400 animate-pulse shadow-amber-500/30'
            : 'bg-white/90 text-gray-800 border-gray-200'
          }
        `}
      >
        <Clock className={`w-4 h-4 ${pulseWarning ? 'text-white' : 'text-emerald-500'}`} />
        <span className={`text-sm font-mono font-semibold tabular-nums tracking-wide ${pulseWarning ? 'text-white' : 'text-gray-900'}`}>
          {formatTime(seconds)}
        </span>

        {isTutor && (
          <div className="flex items-center gap-1.5 ml-1.5 border-l border-current/15 pl-1.5">
            <button
              type="button"
              disabled={extending}
              onClick={handleExtend}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                pulseWarning
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              } disabled:opacity-50`}
            >
              <Plus className={`w-3 h-3 ${extending ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">+15min</span>
            </button>
            <button
              type="button"
              onClick={onEndLesson}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                pulseWarning
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">End</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
