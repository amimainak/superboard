// ============================================================
// PipVideoPanel — Floating, Draggable PiP Video Panel
// ============================================================
// Native floating panel inside the whiteboard UI (position: fixed).
// Contains LiveKit video grid with tutor + student webcams,
// mute/deafen controls, and recording button.
// Uses placeholder divs for actual video until LiveKit credentials are wired.
// ============================================================

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import RecordButton from './RecordButton';
import {
  Mic,
  MicOff,
  Headphones,
  HeadphoneOff,
  Minimize2,
  Maximize2,
  PhoneOff,
  GripHorizontal,
  Video,
  VideoOff,
  User,
  MonitorSpeaker,
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
const HEADER_HEIGHT = 40;
const CONTROLS_HEIGHT = 52;
const EDGE_SNAP = 16;

// ---- Placeholder Participant Type (mirrors LiveKit useParticipants) ----

interface PlaceholderParticipant {
  identity: string;
  name: string;
  isTutor: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isCameraOn: boolean;
  isSpeaking: boolean;
}

// TODO: Replace with real LiveKit `useParticipants()` data once connected
const PLACEHOLDER_PARTICIPANTS: PlaceholderParticipant[] = [
  // Populated dynamically when LiveKit is connected
];

// ============================================================
// Main Component
// ============================================================

export default function PipVideoPanel() {
  const roomActive = useAppStore((s) => s.room.isActive);
  const isRecording = useAppStore((s) => s.room.isRecording);
  const isTutor = useAppStore((s) => s.room.isTutor);
  const roomId = useAppStore((s) => s.room.roomId);

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

  // ---- In-call state (separate from room active so panel doesn't disappear) ----
  const [inCall, setInCall] = useState(true);

  // ---- Local media state (placeholder) ----
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // ---- Drag refs ----
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

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
      // Snap to nearest edge
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

  // ---- Minimized view: small circle with last speaker avatar ----
  if (isMinimized) {
    const lastSpeaker = PLACEHOLDER_PARTICIPANTS.find((p) => p.isSpeaking) || PLACEHOLDER_PARTICIPANTS[0];
    if (!lastSpeaker) {
      // No participants yet — show a generic camera icon
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
            <Video className="w-5 h-5 text-white" />
          </div>
          {isRecording && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-black/80" />
          )}
        </div>
      );
    }
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
        {/* Speaker avatar */}
        <div className="relative">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              lastSpeaker.isTutor ? 'bg-blue-500/80' : 'bg-emerald-500/80'
            )}
          >
            {lastSpeaker.isCameraOn ? (
              <User className="w-5 h-5 text-white" />
            ) : (
              <VideoOff className="w-5 h-5 text-white/60" />
            )}
          </div>
          {/* Speaking indicator */}
          {lastSpeaker.isSpeaking && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black/80" />
          )}
          {/* Recording indicator */}
          {isRecording && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border border-black/80" />
          )}
        </div>
      </div>
    );
  }

  // ---- Full panel view ----
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
        aria-label="Video panel - drag handle. Use arrow keys to move."
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
          <span>Video Call</span>
          {isRecording && (
            <span className="flex items-center gap-1 ml-1 text-red-400 text-[10px] font-semibold animate-pulse">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              REC
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

      {/* ---- Video Grid Area ---- */}
      <div className="flex-1 relative overflow-hidden">
        {/*
          =====================================================
          TODO: Replace placeholder grid with LiveKit components:
          =====================================================
          import { useTracks, VideoTrack, AudioTrack, useConnectionState, useParticipants, RoomAudioRenderer } from '@livekit/components-react';
          import { Track } from 'livekit-client';

          const connectionState = useConnectionState();
          const participants = useParticipants();
          const tracks = useTracks(
            [Track.Source.Camera, Track.Source.Microphone],
            { onlySubscribed: false }
          );

          // Render tracks using <VideoTrack> and <AudioTrack>
          // Add <RoomAudioRenderer /> for audio playback
          =====================================================
        */}
        <div className="grid grid-cols-2 h-full gap-0.5 p-0.5">
          {PLACEHOLDER_PARTICIPANTS.length === 0 ? (
            <div className="col-span-2 h-full flex flex-col items-center justify-center gap-3 text-white/30">
              <Video className="w-12 h-12" />
              <span className="text-xs">Video call ready</span>
              <span className="text-[10px] text-white/20">Participants will appear here</span>
            </div>
          ) : (
            PLACEHOLDER_PARTICIPANTS.map((participant) => (
              <div
                key={participant.identity}
                className={cn(
                  'relative rounded-lg overflow-hidden flex flex-col items-center justify-center',
                  'bg-gradient-to-b from-slate-800/60 to-slate-900/80',
                  participant.isSpeaking && 'ring-2 ring-green-400/60'
                )}
              >
                {/* Video placeholder area */}
                <div className="flex-1 w-full flex items-center justify-center relative">
                  {participant.isCameraOn ? (
                    <div className="flex flex-col items-center gap-2 text-white/30">
                      {/*
                        TODO: Replace with <VideoTrack track={...} />
                      */}
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
                      {participant.isTutor && (
                        <span className="ml-1 text-blue-400">&#9733;</span>
                      )}
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
            ))
          )}
        </div>

        {/* Connection state overlay (placeholder) */}
        {/*
          TODO: Show connection state overlay:
          const connectionState = useConnectionState();
          {connectionState !== 'connected' && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <p className="text-white/60 text-sm">Connecting...</p>
            </div>
          )}
        */}
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
          onClick={() => {
            setIsCameraOff(!isCameraOff);
            // TODO: room.localParticipant.setCameraEnabled(!isCameraOff);
          }}
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
          onClick={() => {
            setIsMuted(!isMuted);
            // TODO: room.localParticipant.setMicrophoneEnabled(!isMuted);
          }}
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
          onClick={() => {
            setIsDeafened(!isDeafened);
          }}
          aria-label={isDeafened ? 'Undeafen audio' : 'Deafen audio'}
        >
          {isDeafened ? <HeadphoneOff className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
        </Button>

        {/* Monitor/Speaker output */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-white/70 hover:text-white hover:bg-white/10"
          onClick={() => {
            // TODO: Toggle speaker output
          }}
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
          onClick={() => {
            // TODO: Leave room / end call
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
        aria-label="Resize video panel. Use Shift+Arrow keys to resize."
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

  // Determine nearest corner
  const snapX = centerX < vw / 2 ? EDGE_SNAP : vw - width - EDGE_SNAP;
  const snapY = centerY < vh / 2 ? EDGE_SNAP : vh - height - EDGE_SNAP;

  return { x: snapX, y: snapY };
}
