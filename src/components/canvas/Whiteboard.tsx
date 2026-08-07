// ============================================================
// Whiteboard — Main Canvas Component
// ============================================================
// Integrates Tldraw with Yjs for real-time collaboration sync.
// Lazy loads GeoGebra, KaTeX, and AI components (Performance Mandate).
// Initial load must be < 1.5 seconds.
// ============================================================

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { useYjsProvider } from '@/hooks/useYjsProvider';
import dynamic from 'next/dynamic';

// Lazy load heavy components (Performance Mandate)
const Toolbar = dynamic(() => import('@/components/canvas/Toolbar'), { ssr: false });
const PageSidebar = dynamic(() => import('@/components/canvas/PageSidebar'), { ssr: false });
const PipVideoPanel = dynamic(() => import('@/components/video/PipVideoPanel'), { ssr: false });
const AIControlPanel = dynamic(() => import('@/components/ai/AIControlPanel'), { ssr: false });
const BrandedHeader = dynamic(() => import('@/components/branding/BrandedHeader'), { ssr: false });
const UsageBar = dynamic(() => import('@/components/premium/UsageBar'), { ssr: false });
const PaywallModal = dynamic(() => import('@/components/premium/PaywallModal'), { ssr: false });
const WaitingRoom = dynamic(() => import('@/components/student/WaitingRoom'), { ssr: false });
const NameEntryModal = dynamic(() => import('@/components/student/NameEntryModal'), { ssr: false });

export default function Whiteboard() {
  const { room, setRoom, setCurrentPage, setTotalPages } = useAppStore();
  const { roomId, subject, isTutor, currentPageIndex, totalPages, branding, focusMode } = room;

  const canvasRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<unknown>(null);
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

  // Handle tool changes
  const handleToolChange = useCallback((tool: string) => {
    setActiveTool(tool);
    // TODO: Set Tldraw tool once editor is mounted
    // editorRef.current?.setCurrentTool(tool)
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden">
      {/* Connection Status Indicator */}
      <div className="fixed top-1 right-1 z-50">
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

      {/* Branded Header */}
      <BrandedHeader />

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
        <div className="flex flex-1 overflow-hidden">
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

          {/* Canvas Container */}
          <main
            ref={canvasRef}
            className="flex-1 relative overflow-hidden"
            id="whiteboard-canvas"
          >
            {/* 
              TODO: Mount Tldraw Editor here
              The Tldraw component connects to Yjs via the provider.
              
              Example (Tldraw v5):
              <Tldraw
                onMount={(editor) => { editorRef.current = editor }}
                components={{ ... }}
              />
            */}

            {/* Placeholder canvas while Tldraw loads */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">
                  {subject === 'MATH'
                    ? 'Mathematics Whiteboard'
                    : subject === 'SCIENCE'
                      ? 'Science Whiteboard'
                      : subject === 'LANGUAGE'
                        ? 'Language Whiteboard'
                        : 'General Whiteboard'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isYjsConnected
                    ? `Connected — Room: ${roomId} | Page: ${currentPageIndex + 1}/${totalPages}`
                    : `Connecting... Room: ${roomId} | Page: ${currentPageIndex + 1}/${totalPages}`}
                </p>
                {focusMode && (
                  <div className="mt-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium inline-block">
                    Focus Mode Active
                  </div>
                )}
              </div>
            </div>

            {/* Floating PiP Video Panel — ALWAYS VISIBLE */}
            <PipVideoPanel />
          </main>

          {/* AI Control Panel (Sheet, slides from right) */}
          <AIControlPanel />
        </div>
      )}

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
  editorRef: React.RefObject<unknown>;
  activeTool: string;
  onToolChange: (tool: string) => void;
}) {
  const [editor, setEditor] = useState<unknown>(null);

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
