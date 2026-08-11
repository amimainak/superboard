// ============================================================
// Whiteboard — Main Canvas Component
// ============================================================
// Integrates Fabric.js canvas with Yjs for real-time collaboration sync.
// Lazy loads GeoGebra, KaTeX, and AI components (Performance Mandate).
// Initial load must be < 1.5 seconds.
// ============================================================

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { useYjsProvider } from '@/hooks/useYjsProvider';
import { authFetch } from '@/lib/auth-fetch';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { Canvas as FabricCanvasType } from 'fabric';

// Lazy load heavy components (Performance Mandate)
const Toolbar = dynamic(() => import('@/components/canvas/Toolbar'), { ssr: false });
const PageSidebar = dynamic(() => import('@/components/canvas/PageSidebar'), { ssr: false });
// TldrawCanvas kept as fallback; FabricCanvas is primary
const FabricCanvas = dynamic(() => import('@/components/canvas/FabricCanvas'), { ssr: false });
const PipVideoPanel = dynamic(() => import('@/components/video/PipVideoPanel'), { ssr: false });
const AIControlPanel = dynamic(() => import('@/components/ai/AIControlPanel'), { ssr: false });
const BrandedHeader = dynamic(() => import('@/components/branding/BrandedHeader'), { ssr: false });
const UsageBar = dynamic(() => import('@/components/premium/UsageBar'), { ssr: false });
const PaywallModal = dynamic(() => import('@/components/premium/PaywallModal'), { ssr: false });
const WaitingRoom = dynamic(() => import('@/components/student/WaitingRoom'), { ssr: false });
const NameEntryModal = dynamic(() => import('@/components/student/NameEntryModal'), { ssr: false });
const FileAttachmentsBar = dynamic(() => import('@/components/canvas/FileAttachmentsBar'), { ssr: false });
const PresenceIndicator = dynamic(() => import('@/components/canvas/PresenceIndicator'), { ssr: false });
const SessionTimer = dynamic(() => import('@/components/canvas/SessionTimer'), { ssr: false });
const LivePollPanel = dynamic(() => import('@/components/canvas/LivePollPanel'), { ssr: false });
const VideoLimitBanner = dynamic(() => import('@/components/video/VideoLimitBanner'), { ssr: false });

export default function Whiteboard() {
  const { toast } = useToast();
  const router = useRouter();
  const { room, setRoom, setCurrentPage, setTotalPages, tier } = useAppStore();
  const { roomId, subject, isTutor, currentPageIndex, totalPages, branding, focusMode } = room;

  const canvasRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<FabricCanvasType | null>(null);
  const [activeTool, setActiveTool] = useState('draw');
  const [showWaitingRoom, setShowWaitingRoom] = useState(isTutor ? false : true);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tutorPresent, setTutorPresent] = useState(isTutor);

  // Sync waiting room with isTutor state changes
  useEffect(() => {
    if (isTutor) {
      setShowWaitingRoom(false);
    }
  }, [isTutor]);

  // ============================================================
  // CRDT: Initialize Yjs + Hocuspocus connection
  // ============================================================
  const {
    ydoc,
    provider,
    isConnected: isYjsConnected,
    isSyncing,
    awareness,
    setLocalState,
  } = useYjsProvider({
    roomId: roomId || '',
    userId: room.userId || 'anonymous',
    userName: room.userName || 'Anonymous',
    userColor: room.userColor || '#3b82f6',
    userRole: isTutor ? 'tutor' : 'student',
    onAwarenessChange: (states) => {
      // Check if tutor is present for student waiting room
      const statesArr = Array.from(states.values()) as Array<{ user?: { role: string } }>;
      const hasTutor = statesArr.some((s) => s.user?.role === 'tutor');
      setTutorPresent(hasTutor);
    },
  });

  // Handle student joining flow
  const handleJoin = useCallback(() => {
    setShowNameModal(true);
  }, []);

  const handleNameSubmit = useCallback(
    (name: string, color: string) => {
      setRoom({ userName: name, userColor: color });
      setShowNameModal(false);
      setShowWaitingRoom(false);
      // Update awareness with real name and color
      setLocalState({
        user: {
          id: room.userId || 'anonymous',
          name,
          color,
          role: 'student',
        },
      });
    },
    [setRoom, setLocalState, room.userId]
  );

  // Handle page changes
  const handlePageChange = useCallback(
    (index: number) => {
      setCurrentPage(index);
      if (ydoc) {
        const yPagesMap = ydoc.getMap<string>('meta');
        yPagesMap.set('currentPage', String(index));
      }
    },
    [setCurrentPage, ydoc]
  );

  const handleAddPage = useCallback(() => {
    setTotalPages(totalPages + 1);
    setCurrentPage(totalPages);
    if (ydoc) {
      const yPagesMap = ydoc.getMap<string>('meta');
      const newCount = String(totalPages + 1);
      yPagesMap.set('totalPages', newCount);
      yPagesMap.set('currentPage', newCount);
    }
  }, [totalPages, setCurrentPage, setTotalPages, ydoc]);

  const handleDeletePage = useCallback(
    (index: number) => {
      if (totalPages <= 1) return;
      setTotalPages(totalPages - 1);
      if (currentPageIndex >= totalPages - 1) {
        setCurrentPage(totalPages - 2);
      }
      if (ydoc) {
        const yPagesMap = ydoc.getMap<string>('meta');
        const newCount = String(totalPages - 1);
        yPagesMap.set('totalPages', newCount);
        if (currentPageIndex >= totalPages - 1) {
          yPagesMap.set('currentPage', String(totalPages - 2));
        }
      }
    },
    [totalPages, currentPageIndex, setCurrentPage, setTotalPages, ydoc]
  );

  // ============================================================
  // Tool changes — propagate to canvas
  // ============================================================
  const handleToolChange = useCallback((tool: string) => {
    setActiveTool(tool);
    // FabricCanvas handles tool switching internally via its own useCanvasTools hook.
    // The editorRef is available for FileAttachmentsBar export/upload operations.
  }, []);

  // ============================================================
  // End Lesson — calls PATCH /api/room/[roomId] to close the room
  // ============================================================
  const [endingLesson, setEndingLesson] = useState(false);
  const handleEndLesson = useCallback(async () => {
    if (endingLesson || !roomId) return;
    setEndingLesson(true);
    try {
      const res = await authFetch(`/api/room/${roomId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: false }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Failed to end lesson', description: (data as { error?: string }).error || 'Please try again.' });
        setEndingLesson(false);
        return;
      }
      toast({ title: 'Lesson ended', description: 'Redirecting to dashboard...' });
      setTimeout(() => router.push('/'), 1000);
    } catch {
      toast({ title: 'Failed to end lesson', description: 'Network error — please try again.' });
      setEndingLesson(false);
    }
  }, [roomId, endingLesson, router]);

  // Called by FabricCanvas when the canvas mounts
  const handleEditorReady = useCallback((canvas: FabricCanvasType) => {
    editorRef.current = canvas;
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden">
      {/* Connection Status Indicator */}
      <div className="fixed top-1 right-1 z-50 flex items-center gap-2">
        <PresenceIndicator awareness={awareness} />
        <div
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            isYjsConnected
              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
              : isSyncing
                ? 'bg-amber-500 animate-pulse'
                : 'bg-gray-300'
          }`}
          title={
            isYjsConnected
              ? 'Connected — real-time sync active'
              : isSyncing
                ? 'Syncing...'
                : 'Disconnected — reconnecting...'
          }
        />
      </div>

      {/* Session Timer (tutor only) */}
      {isTutor && !showWaitingRoom && (
        <SessionTimer isTutor={isTutor} onEndLesson={handleEndLesson} />
      )}

      {/* Branded Header */}
      <BrandedHeader onEndLesson={isTutor ? handleEndLesson : undefined} />

      {/* Video Limit Banner (soft-stop) */}
      {!showWaitingRoom && <VideoLimitBanner />}

      {/* Student Waiting Room (shown before tutor joins) */}
      {showWaitingRoom && (
        <WaitingRoom
          onJoin={handleJoin}
          roomCode={roomId || ''}
          branding={branding}
          tutorPresent={tutorPresent}
        />
      )}

      {/* Student Name Entry Modal */}
      <NameEntryModal
        open={showNameModal}
        onJoin={handleNameSubmit}
        onOpenChange={setShowNameModal}
      />

      {/* Main Canvas Area */}
      {!showWaitingRoom && (
        <div className="flex flex-1 overflow-hidden relative">
          {/* Yjs Connection Indicator — non-blocking toast-style pill */}
          {/* NOTE: Canvas is shown immediately regardless of Yjs connection status.
              When Hocuspocus is unavailable (e.g. Vercel without self-hosted server),
              the whiteboard still works in standalone mode. */}
          {/* Page Sidebar (Tutor Only) */}
          <PageSidebar
            currentPage={currentPageIndex}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onAddPage={handleAddPage}
            onDeletePage={handleDeletePage}
          />

          {/* Toolbar */}
          <div className="flex-shrink-0 flex items-start pt-4 pl-2" role="toolbar" aria-label="Whiteboard tools">
            <ToolbarWrapper
              editorRef={editorRef}
              activeTool={activeTool}
              onToolChange={handleToolChange}
            />
          </div>

          {/* Canvas Container — Tldraw Editor */}
          <main
            ref={canvasRef}
            className="flex-1 relative overflow-hidden"
            id="whiteboard-canvas"
          >
            {/* Fabric.js Canvas with Yjs Sync */}
            <FabricCanvas
              ydoc={ydoc}
              pageIndex={currentPageIndex}
              isTutor={isTutor}
              readOnly={!isTutor && focusMode}
              activeTool={activeTool}
              onCanvasReady={handleEditorReady}
              awareness={awareness}
            />

            {/* Floating PiP Video Panel — ALWAYS VISIBLE */}
            <PipVideoPanel />
          </main>

          {/* AI Control Panel (Sheet, slides from right) */}
          <AIControlPanel />

          {/* Live Poll Panel */}
          {ydoc && (
            <LivePollPanel ydoc={ydoc} isTutor={isTutor} />
          )}
        </div>
      )}

      {/* File Attachments Bar (above Usage Bar) */}
      <FileAttachmentsBar
        roomId={roomId || ''}
        isTutor={isTutor}
        editorRef={editorRef}
        tier={tier}
      />

      {/* Usage Bar (Bottom) — Free/Pro users */}
      <UsageBar />

      {/* Paywall Modal */}
      <PaywallModal />
    </div>
  );
}

// Wrapper to avoid accessing ref during render
function ToolbarWrapper({
  editorRef,
  activeTool,
  onToolChange,
}: {
  editorRef: React.RefObject<FabricCanvasType | null>;
  activeTool: string;
  onToolChange: (tool: string) => void;
}) {
  const [editor, setEditor] = useState<FabricCanvasType | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      setEditor(editorRef.current);
    }
  }, [editorRef]);

  return (
    <Toolbar
      editor={editor}
      activeTool={activeTool}
      onToolChange={onToolChange}
    />
  );
}
