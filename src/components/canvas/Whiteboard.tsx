// ============================================================
// Whiteboard — Main Canvas Component
// ============================================================
// Integrates Tldraw with Yjs for real-time sync.
// Lazy loads GeoGebra, KaTeX, and AI components (Performance Mandate).
// Initial load must be < 1.5 seconds.
// ============================================================

'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import dynamic from 'next/dynamic';

// Tldraw is the WHITEBOARD ENGINE — do NOT build custom HTML5 canvas
// NOTE: @tldraw/tldraw v5.x API — wire through a wrapper
// For now, we architecturally wire the canvas container with Yjs sync

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
  // Initialize waiting room: only show for students (isTutor defaults to false,
  // so we use isTutor explicitly to avoid showing it briefly for tutors before
  // room data sets isTutor=true)
  const [showWaitingRoom, setShowWaitingRoom] = useState(isTutor ? false : true);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tutorPresent, setTutorPresent] = useState(isTutor);

  // Sync waiting room with isTutor state changes
  useEffect(() => {
    if (isTutor) {
      setShowWaitingRoom(false);
    }
  }, [isTutor]);

  // Handle student joining flow
  const handleJoin = useCallback(() => {
    setShowNameModal(true);
  }, []);

  const handleNameSubmit = useCallback((name: string, color: string) => {
    setRoom({ userName: name, userColor: color });
    setShowNameModal(false);
    setShowWaitingRoom(false);
    // TODO: Join Yjs room and announce presence
    console.log(`[Student] ${name} joined with color ${color}`);
  }, [setRoom]);

  // Initialize Yjs connection
  useEffect(() => {
    if (!roomId) return;

    // TODO: Initialize Yjs + Hocuspocus connection
    // const ydoc = new Y.Doc()
    // const provider = new WebsocketProvider(
    //   'ws://localhost:3001',  // Hocuspocus server
    //   `room-${roomId}`,
    //   ydoc,
    //   {
    //     connect: true,
    //     awareness: {
    //       onUpdate: (awareness) => {
    //         // Handle cursor presence
    //       }
    //     }
    //   }
    // )
    //
    // Check if tutor is present for student waiting room
    // provider.awareness.on('change', () => {
    //   const states = Array.from(provider.awareness.getStates().values());
    //   const tutor = states.find(s => s.role === 'tutor');
    //   if (tutor) setTutorPresent(true);
    // })

    console.log(`[Whiteboard] Initializing Yjs for room: ${roomId}`);

    return () => {
      // TODO: Cleanup Yjs connection
      // provider.destroy()
    };
  }, [roomId]);

  // Handle page changes
  const handlePageChange = useCallback(
    (index: number) => {
      setCurrentPage(index);
      // TODO: Load page snapshot from Yjs
      console.log(`[Whiteboard] Switching to page ${index}`);
    },
    [setCurrentPage]
  );

  const handleAddPage = useCallback(() => {
    // TODO: Add new page to Yjs document
    setTotalPages(totalPages + 1);
    setCurrentPage(totalPages);
  }, [totalPages, setCurrentPage, setTotalPages]);

  const handleDeletePage = useCallback(
    (index: number) => {
      if (totalPages <= 1) return;
      // TODO: Delete page from Yjs document
      setTotalPages(totalPages - 1);
      if (currentPageIndex >= totalPages - 1) {
        setCurrentPage(totalPages - 2);
      }
    },
    [totalPages, currentPageIndex, setCurrentPage, setTotalPages]
  );

  // Handle tool changes
  const handleToolChange = useCallback((tool: string) => {
    setActiveTool(tool);
    // TODO: Set Tldraw tool
    // editorRef.current?.setCurrentTool(tool)
    console.log(`[Whiteboard] Tool changed to: ${tool}`);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden">
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
          <div className="flex-shrink-0 flex items-start pt-4 pl-2">
            <ToolbarWrapper
              editorRef={editorRef}
              activeTool={activeTool}
              onToolChange={handleToolChange}
            />
          </div>

          {/* Canvas Container */}
          <div
            ref={canvasRef}
            className="flex-1 relative overflow-hidden"
            id="whiteboard-canvas"
          >
            {/* 
              TODO: Mount Tldraw Editor here
              The Tldraw component goes in this container.
              It connects to Yjs via the provider initialized above.
              
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
                  Tldraw canvas will mount here when configured.
                  <br />
                  Room: {roomId} | Page: {currentPageIndex + 1}/{totalPages}
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
          </div>

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
  // Use useEffect to sync ref value to state, avoiding direct ref access during render
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
