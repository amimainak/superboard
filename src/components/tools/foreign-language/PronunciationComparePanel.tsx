'use client';
import React, { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Mic, Play, Pause, Square, Volume2 } from 'lucide-react';

interface Props {
  editor?: unknown;
}

type RecordingState = 'idle' | 'recording' | 'recorded';
type PlaybackState = 'stopped' | 'playing' | 'paused';

interface AudioTrack {
  label: string;
  url: string | null;
  recordingState: RecordingState;
  playbackState: PlaybackState;
  duration: number;
}

export default function PronunciationComparePanel({ editor }: Props) {
  const store = useAppStore();
  const [tutorTrack, setTutorTrack] = useState<AudioTrack>({ label: 'Tutor', url: null, recordingState: 'idle', playbackState: 'stopped', duration: 0 });
  const [studentTrack, setStudentTrack] = useState<AudioTrack>({ label: 'Student', url: null, recordingState: 'idle', playbackState: 'stopped', duration: 0 });
  const [compareResult, setCompareResult] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);

  const tutorMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const studentMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const tutorChunksRef = useRef<Blob[]>([]);
  const studentChunksRef = useRef<Blob[]>([]);
  const tutorAudioRef = useRef<HTMLAudioElement | null>(null);
  const studentAudioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = useCallback(async (role: 'tutor' | 'student') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        if (role === 'tutor') {
          tutorChunksRef.current = [];
          setTutorTrack((prev) => ({ ...prev, url, recordingState: 'recorded', duration: 0 }));
        } else {
          studentChunksRef.current = [];
          setStudentTrack((prev) => ({ ...prev, url, recordingState: 'recorded', duration: 0 }));
        }
        stream.getTracks().forEach((t) => t.stop());
      };

      if (role === 'tutor') {
        tutorChunksRef.current = [];
        tutorMediaRecorderRef.current = mediaRecorder;
      } else {
        studentChunksRef.current = [];
        studentMediaRecorderRef.current = mediaRecorder;
      }

      mediaRecorder.start();

      if (role === 'tutor') {
        setTutorTrack((prev) => ({ ...prev, recordingState: 'recording', url: null }));
      } else {
        setStudentTrack((prev) => ({ ...prev, recordingState: 'recording', url: null }));
      }
    } catch {
      // Microphone not available
    }
  }, []);

  const stopRecording = useCallback((role: 'tutor' | 'student') => {
    if (role === 'tutor') {
      tutorMediaRecorderRef.current?.stop();
      setTutorTrack((prev) => ({ ...prev, recordingState: 'recorded' }));
    } else {
      studentMediaRecorderRef.current?.stop();
      setStudentTrack((prev) => ({ ...prev, recordingState: 'recorded' }));
    }
  }, []);

  const playAudio = useCallback((role: 'tutor' | 'student') => {
    const url = role === 'tutor' ? tutorTrack.url : studentTrack.url;
    if (!url) return;

    const audio = new Audio(url);
    if (role === 'tutor') {
      tutorAudioRef.current = audio;
      setTutorTrack((prev) => ({ ...prev, playbackState: 'playing' }));
    } else {
      studentAudioRef.current = audio;
      setStudentTrack((prev) => ({ ...prev, playbackState: 'playing' }));
    }

    audio.onended = () => {
      if (role === 'tutor') setTutorTrack((prev) => ({ ...prev, playbackState: 'stopped' }));
      else setStudentTrack((prev) => ({ ...prev, playbackState: 'stopped' }));
    };

    audio.play();
  }, [tutorTrack.url, studentTrack.url]);

  const pauseAudio = useCallback((role: 'tutor' | 'student') => {
    const audio = role === 'tutor' ? tutorAudioRef.current : studentAudioRef.current;
    if (!audio) return;
    audio.pause();
    if (role === 'tutor') setTutorTrack((prev) => ({ ...prev, playbackState: 'paused' }));
    else setStudentTrack((prev) => ({ ...prev, playbackState: 'paused' }));
  }, []);

  const stopAudio = useCallback((role: 'tutor' | 'student') => {
    const audio = role === 'tutor' ? tutorAudioRef.current : studentAudioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    if (role === 'tutor') setTutorTrack((prev) => ({ ...prev, playbackState: 'stopped' }));
    else setStudentTrack((prev) => ({ ...prev, playbackState: 'stopped' }));
  }, []);

  const handleCompare = useCallback(() => {
    setComparing(true);
    setCompareResult(null);
    // Placeholder comparison result
    setTimeout(() => {
      const results = [
        'Good match! Pronunciation is 87% similar to the tutor\'s recording.',
        'Some vowel sounds need adjustment. Focus on the middle syllable.',
        'Consonant clusters at the end of the word need more clarity.',
        'Intonation pattern is close. Try matching the rising pitch at the end.',
      ];
      setCompareResult(results[Math.floor(Math.random() * results.length)]);
      setComparing(false);
    }, 1500);
  }, []);

  if (!store.room.pronunciationCompareOpen) return null;

  const renderTrack = (track: AudioTrack, role: 'tutor' | 'student') => {
    const isRecording = track.recordingState === 'recording';
    const isRecorded = track.recordingState === 'recorded';
    const isPlaying = track.playbackState === 'playing';
    const isPaused = track.playbackState === 'paused';

    return (
      <div
        key={role}
        style={{
          padding: 10,
          borderRadius: 8,
          border: `1px solid ${isRecording ? '#fca5a5' : 'rgba(0,0,0,0.08)'}`,
          background: isRecording ? '#fef2f2' : '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{track.label}</span>
          {isRecording && (
            <span style={{ fontSize: 10, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626', animation: 'pulse 1s infinite' }} />
              Recording...
            </span>
          )}
        </div>

        {/* Waveform placeholder */}
        <div
          style={{
            height: 32,
            background: 'rgba(0,0,0,0.03)',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 6,
            overflow: 'hidden',
          }}
        >
          {isRecorded ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%', padding: '0 8px' }}>
              {Array.from({ length: 20 }, (_, i) => {
                const h = 4 + Math.random() * 20;
                return (
                  <div
                    key={i}
                    style={{
                      width: 3,
                      height: isPlaying || isPaused ? h : 4,
                      background: isPlaying ? '#7c3aed' : isPaused ? '#a78bfa' : '#d1d5db',
                      borderRadius: 1.5,
                      transition: 'height 0.2s, background 0.2s',
                    }}
                  />
                );
              })}
            </div>
          ) : (
            <Volume2 style={{ width: 16, height: 16, color: '#d1d5db' }} />
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 4 }}>
          {!isRecording ? (
            <button
              onClick={() => startRecording(role)}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid rgba(0,0,0,0.1)',
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                fontSize: 11,
                color: '#374151',
              }}
            >
              <Mic style={{ width: 12, height: 12 }} />
              {isRecorded ? 'Re-record' : 'Record'}
            </button>
          ) : (
            <button
              onClick={() => stopRecording(role)}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #fca5a5',
                background: '#fef2f2',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                fontSize: 11,
                color: '#dc2626',
              }}
            >
              <Square style={{ width: 12, height: 12 }} />
              Stop
            </button>
          )}

          {isRecorded && (
            <>
              {isPlaying ? (
                <button
                  onClick={() => pauseAudio(role)}
                  style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #ede9fe', background: '#f5f3ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Pause style={{ width: 12, height: 12, color: '#7c3aed' }} />
                </button>
              ) : (
                <button
                  onClick={() => playAudio(role)}
                  style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Play style={{ width: 12, height: 12, color: '#374151' }} />
                </button>
              )}
              {(isPlaying || isPaused) && (
                <button
                  onClick={() => stopAudio(role)}
                  style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Square style={{ width: 10, height: 10, color: '#374151' }} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

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
          <Mic style={{ width: 14, height: 14 }} />
          Pronunciation Compare
        </span>
        <button
          onClick={() => store.togglePronunciationCompare()}
          style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* Tutor Recording */}
      {renderTrack(tutorTrack, 'tutor')}

      {/* Student Recording */}
      {renderTrack(studentTrack, 'student')}

      {/* Compare Button */}
      <button
        onClick={handleCompare}
        disabled={!tutorTrack.url || !studentTrack.url || comparing}
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: 'none',
          background: (!tutorTrack.url || !studentTrack.url || comparing) ? '#e5e7eb' : '#7c3aed',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
          cursor: (!tutorTrack.url || !studentTrack.url || comparing) ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {comparing ? 'Comparing...' : 'Compare Pronunciation'}
      </button>

      {/* Compare Result */}
      {compareResult && (
        <div
          style={{
            padding: '8px 10px',
            background: '#f5f3ff',
            borderRadius: 8,
            border: '1px solid #ede9fe',
            fontSize: 11,
            color: '#4b5563',
            lineHeight: 1.5,
          }}
        >
          {compareResult}
        </div>
      )}

      {!tutorTrack.url && !studentTrack.url && (
        <div style={{ textAlign: 'center', padding: '8px 0', color: '#9ca3af', fontSize: 11 }}>
          Record tutor and student audio, then compare pronunciation.
        </div>
      )}
    </div>
  );
}
