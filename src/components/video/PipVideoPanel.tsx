// ============================================================
// PipVideoPanel — Floating, Draggable PiP Video Panel
// ============================================================
// Native floating panel inside the whiteboard UI (position: fixed).
// Contains LiveKit video grid with tutor + student webcams,
// mute/deafen controls, and recording button.
//
// Uses useLiveKitRoom hook for real LiveKit connection management.
// Shows credit warnings at 80% and hard block at 100%.
// ============================================================

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { useLiveKitRoom } from '@/hooks/useLiveKitRoom';
import { useCredits } from '@/hooks/useCredits';
import RecordButton from './RecordButton';
import {
  Mic,
  MicOff,
  Headphones,
  HeadphoneOff,
  Minimize2,
  PhoneOff,
  GripHorizontal,
  Video,
  VideoOff,
  User,
  MonitorSpeaker,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ---- Types ----

interface PanelPosition {
  x: number;
  y: number;
}

interface PanelSize {
  width: number;
  height: number;
}

// ---- Constants ----

const MINIMIZED_SIZE = 56;
const DEFAULT_WIDTH = typeof window !== 'undefined' ? Math.min(360, window.innerWidth * 0.6) : 360;
const DEFAULT_HEIGHT = typeof window !== 'undefined' ? Math.min(300, window.innerHeight * 0.4) : 300;
const MIN_WIDTH = 200;
const MIN_HEIGHT = 180;
const EDGE_SNAP = 16;

// ============================================================
// Main Component
// ============================================================

export default function PipVideoPanel() {
  const roomActive = useAppStore((s) => s.room.isActive);
  const isTutor = useAppStore((s) => s.room.isTutor);
  const roomId = useAppStore((s) => s.room.roomId);
  const userId = useAppStore((s) => s.room.userId);

  // LiveKit connection
  const {
    connectionState,
    participants,
    localParticipant,
    error: lkError,
    isMuted,
    isCameraOff,
    isDeafened,
    toggleMic,
    toggleCamera,
    toggleDeafen,
    disconnect,
  } = useLiveKitRoom();

  // Credit tracking
  const {
    videoMinutesUsed,
    videoMinutesLimit,
    videoMinutesExhausted,
    refresh: refreshCredits,
  } = useCredits(isTutor ? userId : undefined);

  // ---- Panel state ----
  const [position, setPosition] = useState<PanelPosition>(() => ({
    x: Math.max(0, window.innerWidth - DEFAULT_WIDTH - EDGE_SNAP),
    y: Math.max(0, window.innerHeight - DEFAULT_HEIGHT - EDGE_SNAP),
  }));
  const [size, setSize] = useState<PanelSize>({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [inCall, setInCall] = useState(true);

  // ---- Video limit warning ----
  const isApproachingLimit = videoMinutesLimit !== Infinity &&
    videoMinutesUsed >= videoMinutesLimit * 0.8 &&
    !videoMinutesExhausted;

  // Track element refs for video rendering
  const videoElsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const audioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  // ---- Attach video tracks to DOM elements ----
  useEffect(() => {
    participants.forEach((p) => {
      if (p.cameraTrack && p.cameraTrack.track) {
        const track = p.cameraTrack.track;
        let videoEl = videoElsRef.current.get(p.identity);
        if (!videoEl) {
          videoEl = document.createElement('video');
          videoEl.autoplay = true;
          videoEl.playsInline = true;
          videoEl.muted = true;
          videoEl.className = 'w-full h-full object-cover';
          videoElsRef.current.set(p.identity, videoEl);
        }
        track.attach(videoEl);
      }
    });

    // Clean up detached tracks
    videoElsRef.current.forEach((videoEl, identity) => {
      const participant = participants.find((p) => p.identity === identity);
      if (!participant?.cameraTrack?.track) {
        if (videoEl.srcObject) {
          videoEl.srcObject = null;
        }
      }
    });

    return () => {
      videoElsRef.current.forEach((videoEl) => {
        try { videoEl.srcObject = null; } catch {}
      });
    };
  }, [participants]);

  // ---- Snap to corners on mount / resize ----
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - (isMinimized ? MINIMIZED_SIZE : size.width)),
        y: Math.min(prev.y, window.innerHeight - (isMinimized ? MINIMIZED_SIZE : size.height)),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [size.width, size.height, isMinimized]);

  // ---- Drag handlers ----
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isResizing) return;
      if ('touches' in e) {
        e.preventDefault();
        const rect = panelRef.current?.getBoundingClientRect();
        if (!rect) return;
        dragOffset.current = {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      } else {
        e.preventDefault();
        const rect = panelRef.current?.getBoundingClientRect();
        if (!rect) return;
        dragOffset.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
      setIsDragging(true);
    },
    [isResizing]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const newX = clientX - dragOffset.current.x;
      const newY = clientY - dragOffset.current.y;
      const currentW = isMinimized ? MINIMIZED_SIZE : size.width;
      const currentH = isMinimized ? MINIMIZED_SIZE : size.height;

      setPosition({
        x: Math.max(0, Math.min(newX, window.innerWidth - currentW)),
        y: Math.max(0, Math.min(newY, window.innerHeight - currentH)),
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      setPosition((prev) => snapToEdge(prev, isMinimized ? MINIMIZED_SIZE : size.width, isMinimized ? MINIMIZED_SIZE : size.height));
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, size, isMinimized]);

  // ---- Resize handlers ----
  const handleResizeStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isDragging) return;
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
      const startX = clientX;
      const startY = clientY;
      const startW = size.width;
      const startH = size.height;

      const handleResizeMove = (moveE: MouseEvent | TouchEvent) => {
        const moveX = 'touches' in moveE ? moveE.touches[0].clientX : (moveE as MouseEvent).clientX;
        const moveY = 'touches' in moveE ? moveE.touches[0].clientY : (moveE as MouseEvent).clientY;
        const deltaW = startX - moveX;
        const deltaH = startY - moveY;
        setSize({
          width: Math.max(MIN_WIDTH, Math.min(startW + deltaW, 600)),
          height: Math.max(MIN_HEIGHT, Math.min(startH + deltaH, 500)),
        });
      };

      const handleResizeEnd = () => {
        setIsResizing(false);
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
        window.removeEventListener('touchmove', handleResizeMove);
        window.removeEventListener('touchend', handleResizeEnd);
      };

      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      window.addEventListener('touchmove', handleResizeMove, { passive: false });
      window.addEventListener('touchend', handleResizeEnd);
    },
    [isDragging, size]
  );

  // ---- Don't render if room is not active or call has ended ----
  if (!roomActive || !inCall) return null;

  // ---- Get last speaker for minimized view ----
  const lastSpeaker = participants.find((p) => p.isSpeaking) || participants[0];
  const totalParticipants = participants.length + (localParticipant ? 1 : 0);

  // ---- Minimized view ----
  if (isMinimized) {
    if (!lastSpeaker && !localParticipant) {
      return (
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            width: MINIMIZED_SIZE,
            height: MINIMIZED_SIZE,
            zIndex: 9999,
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className={cn(
            'cursor-grab active:cursor-grabbing rounded-full',
            'bg-black/80 backdrop-blur-xl border border-white/10',
            'shadow-2xl flex items-center justify-center',
            'transition-shadow hover:shadow-[0_0_24px_rgba(59,130,246,0.3)]',
            'group'
          )}
          onClick={() => setIsMinimized(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsMinimized(false);
            }
          }}
          role="button"
          tabIndex={0}
          title="Click to expand video panel"
          aria-label="Expand video panel"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/80">
            {connectionState === 'connected' ? (
              <Video className="w-5 h-5 text-white" />
            ) : connectionState === 'connecting' ? (
              <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <VideoOff className="w-5 h-5 text-white/60" />
            )}
          </div>
          {useAppStore.getState().room.isRecording && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-black/80" />
          )}
        </div>
      );
    }

    const displayName = lastSpeaker?.name || localParticipant?.name || '...';
    const isLocal = !lastSpeaker;

    return (
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          width: MINIMIZED_SIZE,
          height: MINIMIZED_SIZE,
          zIndex: 9999,
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className={cn(
          'cursor-grab active:cursor-grabbing rounded-full',
          'bg-black/80 backdrop-blur-xl border border-white/10',
          'shadow-2xl flex items-center justify-center',
          'transition-shadow hover:shadow-[0_0_24px_rgba(59,130,246,0.3)]',
          'group'
        )}
        onClick={() => setIsMinimized(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsMinimized(false);
          }
        }}
        role="button"
        tabIndex={0}
        title="Click to expand video panel"
        aria-label="Expand video panel"
      >
        <div className="relative">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              isLocal ? 'bg-blue-500/80' : 'bg-emerald-500/80'
            )}
          >
            <User className="w-5 h-5 text-white" />
          </div>
          {lastSpeaker?.isSpeaking && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black/80" />
          )}
          {useAppStore.getState().room.isRecording && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-black/80" />
          )}
        </div>
      </div>
    );
  }

  // ---- Full panel view ----
  const gridCols = totalParticipants <= 1 ? 'grid-cols-1' : totalParticipants === 2 ? 'grid-cols-2' : 'grid-cols-2';

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: 9999,
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      className={cn(
        'rounded-2xl overflow-hidden flex flex-col',
        'bg-black/70 backdrop-blur-xl border border-white/10',
        'shadow-2xl',
        isDragging ? 'cursor-grabbing select-none' : 'cursor-grab',
        isResizing && 'cursor-se-resize'
      )}
    >
      {/* ---- Header (drag handle) ---- */}
      <div
        className="flex items-center justify-between px-3 h-[40px] shrink-0 bg-white/5 border-b border-white/5"
        aria-label="Video panel - drag handle"
        tabIndex={0}
        role="toolbar"
        onKeyDown={(e) => {
          const step = e.shiftKey ? 50 : 10;
          let dx = 0;
          let dy = 0;
          if (e.key === 'ArrowLeft') dx = -step;
          else if (e.key === 'ArrowRight') dx = step;
          else if (e.key === 'ArrowUp') dy = -step;
          else if (e.key === 'ArrowDown') dy = step;
          else return;
          e.preventDefault();
          setPosition((prev) => ({
            x: Math.max(0, Math.min(prev.x + dx, window.innerWidth - size.width)),
            y: Math.max(0, Math.min(prev.y + dy, window.innerHeight - size.height)),
          }));
        }}
      >
        <div className="flex items-center gap-1.5 text-white/70 text-xs font-medium">
          <GripHorizontal className="w-3.5 h-3.5" />
          <span>
            {connectionState === 'connected' ? 'Video Call' :
             connectionState === 'connecting' ? 'Connecting...' :
             connectionState === 'reconnecting' ? 'Reconnecting...' :
             connectionState === 'failed' ? 'Connection Failed' : 'Video Off'}
          </span>
          {/* Video limit warning */}
          {isApproachingLimit && (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          )}
          {useAppStore.getState().room.isRecording && (
            <span className="flex items-center gap-1 ml-1 text-red-400 text-[10px] font-semibold animate-pulse">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              REC
            </span>
          )}
          {/* Video minutes for free tier */}
          {videoMinutesLimit !== Infinity && (
            <span className="text-[10px] text-white/40 ml-1">
              {videoMinutesUsed}/{videoMinutesLimit}m
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(true);
            }}
            aria-label="Minimize video panel"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ---- Video limit warning banner ---- */}
      {isApproachingLimit && (
        <div className="px-3 py-1.5 bg-amber-500/20 border-b border-amber-500/30 flex items-center gap-2 text-amber-300 text-[11px]">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>{videoMinutesLimit - videoMinutesUsed} minutes of video remaining this period</span>
        </div>
      )}
      {videoMinutesExhausted && videoMinutesLimit !== Infinity && (
        <div className="px-3 py-1.5 bg-red-500/20 border-b border-red-500/30 flex items-center gap-2 text-red-300 text-[11px]">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>Video limit reached. Upgrade to continue using video.</span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto h-5 px-2 text-[10px] border-red-400/50 text-red-300 hover:bg-red-500/30"
            onClick={() => useAppStore.getState().openPaywall('Video minutes exhausted')}
          >
            Upgrade
          </Button>
        </div>
      )}

      {/* ---- Connection error banner ---- */}
      {lkError && connectionState === 'failed' && (
        <div className="px-3 py-1.5 bg-red-500/20 border-b border-red-500/30 text-red-300 text-[11px]">
          {lkError}
        </div>
      )}

      {/* ---- Video Grid Area ---- */}
      <div className="flex-1 relative overflow-hidden">
        {/* Connecting overlay */}
        {connectionState === 'connecting' || connectionState === 'reconnecting' ? (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-xs text-white/50">
              {connectionState === 'connecting' ? 'Joining video...' : 'Reconnecting...'}
            </span>
          </div>
        ) : connectionState === 'disconnected' || connectionState === 'failed' ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-white/30">
            <Video className="w-12 h-12" />
            <span className="text-xs">
              {connectionState === 'failed' ? 'Video connection failed' : 'Video disconnected'}
            </span>
            {connectionState === 'failed' && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 text-xs border-white/20 text-white/60 hover:bg-white/10"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            )}
          </div>
        ) : participants.length === 0 && !localParticipant ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-white/30">
            <Video className="w-12 h-12" />
            <span className="text-xs">Waiting for participants...</span>
            <span className="text-[10px] text-white/20">Video call is active</span>
          </div>
        ) : (
          <div className={cn('grid h-full gap-0.5 p-0.5', gridCols)}>
            {/* Local participant */}
            {localParticipant && (
              <div
                className={cn(
                  'relative rounded-lg overflow-hidden flex flex-col items-center justify-center',
                  'bg-gradient-to-b from-slate-800/60 to-slate-900/80'
                )}
              >
                <div className="flex-1 w-full flex items-center justify-center relative">
                  {isCameraOff ? (
                    <div className="flex flex-col items-center gap-2 text-white/20">
                      <VideoOff className="w-10 h-10" />
                      <span className="text-[10px]">Camera Off</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-white/30">
                      <User className="w-10 h-10" />
                      <span className="text-[10px]">You</span>
                    </div>
                  )}

                  {/* Name tag */}
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5">
                    <span
                      className={cn(
                        'text-[10px] font-medium text-white/90 px-1.5 py-0.5 rounded',
                        'bg-black/60 backdrop-blur-sm'
                      )}
                    >
                      {localParticipant.name}
                      <span className="ml-1 text-blue-400">&#9733;</span>
                    </span>
                  </div>

                  {/* Mute indicator */}
                  {isMuted && (
                    <div className="absolute top-1.5 right-1.5">
                      <div className="w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center">
                        <MicOff className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Remote participants */}
            {participants.map((participant) => (
              <div
                key={participant.identity}
                className={cn(
                  'relative rounded-lg overflow-hidden flex flex-col items-center justify-center',
                  'bg-gradient-to-b from-slate-800/60 to-slate-900/80',
                  participant.isSpeaking && 'ring-2 ring-green-400/60'
                )}
              >
                <div className="flex-1 w-full flex items-center justify-center relative">
                  {participant.isCameraOn ? (
                    <div className="flex flex-col items-center gap-2 text-white/30">
                      <Video className="w-10 h-10" />
                      <span className="text-[10px]">Camera Active</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-white/20">
                      <VideoOff className="w-10 h-10" />
                      <span className="text-[10px]">Camera Off</span>
                    </div>
                  )}

                  {/* Name tag */}
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5">
                    <span
                      className={cn(
                        'text-[10px] font-medium text-white/90 px-1.5 py-0.5 rounded',
                        'bg-black/60 backdrop-blur-sm'
                      )}
                    >
                      {participant.name}
                    </span>
                  </div>

                  {/* Mute indicator */}
                  {participant.isMuted && (
                    <div className="absolute top-1.5 right-1.5">
                      <div className="w-5 h-5 rounded-full bg-red-500/80 flex items-center justify-center">
                        <MicOff className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Speaking animation ring */}
                  {participant.isSpeaking && (
                    <div className="absolute inset-0 rounded-lg border-2 border-green-400/40 animate-pulse pointer-events-none" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- Controls Bar ---- */}
      <div className="flex items-center justify-center gap-1.5 px-3 h-[52px] shrink-0 bg-white/5 border-t border-white/5">
        {/* Camera toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-10 w-10 rounded-full text-white/70 hover:text-white hover:bg-white/10',
            isCameraOff && 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300'
          )}
          onClick={toggleCamera}
          disabled={connectionState !== 'connected'}
          aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </Button>

        {/* Mic toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-10 w-10 rounded-full text-white/70 hover:text-white hover:bg-white/10',
            isMuted && 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300'
          )}
          onClick={toggleMic}
          disabled={connectionState !== 'connected'}
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>

        {/* Deafen toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-10 w-10 rounded-full text-white/70 hover:text-white hover:bg-white/10',
            isDeafened && 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300'
          )}
          onClick={toggleDeafen}
          aria-label={isDeafened ? 'Undeafen audio' : 'Deafen audio'}
        >
          {isDeafened ? <HeadphoneOff className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
        </Button>

        {/* Monitor/Speaker output */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-white/70 hover:text-white hover:bg-white/10"
          aria-label="Toggle speaker output"
        >
          <MonitorSpeaker className="w-4 h-4" />
        </Button>

        {/* Recording button */}
        <RecordButton />

        {/* Leave call */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-red-400 hover:text-red-300 hover:bg-red-500/20"
          onClick={async () => {
            await disconnect();
            setInCall(false);
          }}
          aria-label="Leave call"
        >
          <PhoneOff className="w-4 h-4" />
        </Button>
      </div>

      {/* ---- Resize handle (bottom-left corner) ---- */}
      <div
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
        className={cn(
          'absolute bottom-0 left-0 w-6 h-6 cursor-se-resize',
          'opacity-30 hover:opacity-60 transition-opacity'
        )}
        role="separator"
        aria-label="Resize video panel"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!e.shiftKey) return;
          const step = 10;
          let dw = 0;
          let dh = 0;
          if (e.key === 'ArrowRight') dw = step;
          else if (e.key === 'ArrowUp') dh = step;
          else if (e.key === 'ArrowLeft') dw = -step;
          else if (e.key === 'ArrowDown') dh = -step;
          else return;
          e.preventDefault();
          setSize((prev) => ({
            width: Math.max(MIN_WIDTH, Math.min(prev.width + dw, 600)),
            height: Math.max(MIN_HEIGHT, Math.min(prev.height + dh, 500)),
          }));
        }}
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="text-white/60 w-4 h-4" aria-hidden="true">
          <path d="M14 14H8V13H13V8H14V14Z" />
          <path d="M14 10H9V9H13V5H14V10Z" opacity="0.6" />
        </svg>
      </div>
    </div>
  );
}

// ---- Helper: Snap position to nearest corner ----

function snapToEdge(
  pos: PanelPosition,
  width: number,
  height: number
): PanelPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const centerX = pos.x + width / 2;
  const centerY = pos.y + height / 2;

  const snapX = centerX < vw / 2 ? EDGE_SNAP : vw - width - EDGE_SNAP;
  const snapY = centerY < vh / 2 ? EDGE_SNAP : vh - height - EDGE_SNAP;

  return { x: snapX, y: snapY };
}

// Import Track for cleanup
import { Track } from 'livekit-client';
