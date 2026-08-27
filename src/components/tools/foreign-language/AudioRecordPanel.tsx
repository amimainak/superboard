// ============================================================
// AudioRecordPanel — Audio Recording & Playback
// ============================================================
// Category: Foreign Language
// Record pronunciation → pin as playable audio sticker.
// Student records attempt → play both back-to-back.
// ============================================================

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { Mic, Square, Play, Pause, RotateCcw, X, Volume2, User, GraduationCap } from 'lucide-react';

export default function AudioRecordPanel() {
  const { room, setAudioRecording, setAudioPlaybackUrl } = useAppStore();
  const { audioRecording } = room;
  const [open, setOpen] = useState(false);
  const [recordings, setRecordings] = useState<{ id: string; url: string; label: string; role: 'tutor' | 'student' }[]>([]);
  const [activePlayback, setActivePlayback] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStartRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const newRecording = {
          id: `audio:${Date.now()}` as any,
          url,
          label: `Recording ${recordings.length + 1}`,
          role: 'tutor' as const,
        };
        setRecordings((prev) => [...prev, newRecording]);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setAudioRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Audio recording failed:', err);
    }
  }, [recordings.length, setAudioRecording]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setAudioRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [setAudioRecording]);

  const handlePlay = useCallback((id: string, url: string) => {
    const audio = new Audio(url);
    audio.onended = () => setActivePlayback(null);
    audio.play();
    setActivePlayback(id);
  }, []);

  const handleStop = useCallback(() => {
    setActivePlayback(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recordings.forEach((r) => URL.revokeObjectURL(r.url));
    };
  }, []);

  if (!open) return null;

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
        border: '1px solid rgba(239, 68, 68, 0.2)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(239,68,68,0.12)',
        minWidth: 240,
        maxHeight: 400,
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#374151' }}>
          <Volume2 style={{ width: 14, height: 14 }} />
          Audio Recorder
        </div>
        <button onClick={() => setOpen(false)} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {/* Record button */}
      <button
        onClick={audioRecording ? handleStopRecording : handleStartRecording}
        style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          background: audioRecording ? '#ef4444' : '#6366f1',
          color: 'white', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6,
        }}
      >
        {audioRecording ? (
          <>
            <Square style={{ width: 12, height: 12 }} />
            Stop ({Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')})
          </>
        ) : (
          <>
            <Mic style={{ width: 12, height: 12 }} />
            Start Recording
          </>
        )}
      </button>

      {/* Recordings list */}
      {recordings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>Recordings:</span>
          {recordings.map((rec) => (
            <div
              key={rec.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 8px', borderRadius: 8,
                border: '1px solid rgba(0,0,0,0.06)', background: 'white',
              }}
            >
              <button
                onClick={() => activePlayback === rec.id ? handleStop() : handlePlay(rec.id, rec.url)}
                style={{
                  width: 28, height: 28, borderRadius: 6, border: 'none',
                  background: activePlayback === rec.id ? '#10b981' : 'rgba(0,0,0,0.05)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {activePlayback === rec.id
                  ? <Pause style={{ width: 12, height: 12, color: 'white' }} />
                  : <Play style={{ width: 12, height: 12, color: '#374151' }} />
                }
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>{rec.label}</div>
                <div style={{ fontSize: 9, color: '#9ca3af' }}>
                  {activePlayback === rec.id ? 'Playing...' : 'Tap to play'}
                </div>
              </div>
              <button
                onClick={() => setRecordings((prev) => prev.filter((r) => r.id !== rec.id))}
                style={{
                  width: 24, height: 24, borderRadius: 6, border: 'none',
                  background: 'transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X style={{ width: 12, height: 12, color: '#d1d5db' }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Instruction */}
      <div style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', lineHeight: 1.4 }}>
        Record pronunciation examples for students to practice
      </div>
    </div>
  );
}
