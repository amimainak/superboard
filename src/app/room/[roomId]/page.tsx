// ============================================================
// Room Page — [roomId]
// ============================================================
// Main Whiteboard / Waiting Room page.
// Determines if user is tutor or student, loads room data,
// applies branding, initializes real-time connections.
// ============================================================

'use client';

import Whiteboard from '@/components/canvas/Whiteboard';
import { useAppStore } from '@/store/app-store';
import { createClient } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import type { RoomData, BrandingConfig } from '@/types';

// Client component wrapper for the room page
function RoomPageContent({ roomId }: { roomId: string }) {
  const { setRoom, setBranding } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoom() {
      try {
        // Fetch room data from API (no auth needed — students access this too)
        const response = await fetch(`/api/room?roomId=${roomId}`);
        if (!response.ok) {
          if (response.status === 410) {
            setError('This lesson has ended. The link is no longer active.');
            return;
          }
          throw new Error('Failed to load room');
        }

        const roomData: RoomData = await response.json();

        // Determine if the current user is the tutor by comparing
        // the authenticated user's ID against the room's tutorId
        let tutorMatch = false;
        let user: import('@supabase/supabase-js').User | null = null;
        const supabase = createClient();
        if (supabase) {
          const { data: { session: sess } } = await supabase.auth.getSession();
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          user = currentUser;
          tutorMatch = !!user && user.id === roomData.tutorId;
          if (!tutorMatch && sess?.user?.id === roomData.tutorId) {
            tutorMatch = true; // fallback to session user
          }
        }

        // Set room state — include isTutor so whiteboard knows to skip waiting room
        setRoom({
          roomId: roomData.id,
          subject: roomData.subject as 'MATH' | 'SCIENCE' | 'LANGUAGE' | 'GENERAL',
          isActive: roomData.isActive,
          brandingLogo: roomData.brandingLogo || null,
          brandingColor: roomData.brandingColor || null,
          isTutor: tutorMatch,
        });

        // Set branding config
        const branding: BrandingConfig = {
          logoUrl: roomData.brandingLogo,
          color: roomData.brandingColor,
          agencyName: roomData.tutor?.name || null,
          customDomain: null,
        };
        setBranding(branding);

        // Track student participation (for agency billing)
        if (!tutorMatch) {
          // Student joined — track via fingerprint or user ID
          let studentIdentity = user?.id || '';
          if (!studentIdentity) {
            // Generate a session-based identity for anonymous students
            try {
              const { reportFingerprint } = await import('@/lib/fingerprint');
              const fp = await reportFingerprint();
              studentIdentity = fp || `anon_${roomId}_${Date.now()}`;
            } catch {
              studentIdentity = `anon_${roomId}_${Date.now()}`;
            }
          }
          fetch('/api/room/participants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId,
              studentIdentity,
              studentName: user?.user_metadata?.name || null,
            }),
          }).catch(() => { /* silent — don't block the lesson */ });
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load room');
        setLoading(false);
      }
    }

    if (roomId) {
      loadRoom();
    }
  }, [roomId, setRoom, setBranding]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Room not found</h2>
          <p className="text-gray-500 leading-relaxed">This room link does not exist or has expired. Please check the link with your tutor and try again.</p>
          <a href="/" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 gradient-primary text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">
            Go to Superboard
          </a>
        </div>
      </div>
    );
  }

  return <Whiteboard />;
}

// Page component — uses params from the URL
// In Next.js App Router, params is a Promise that we await
export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  // Use React.use() to unwrap the params Promise (Next.js 16 pattern)
  // This avoids hydration mismatch from window.location access
  const { roomId } = useRoomParams(params);

  if (!roomId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return <RoomPageContent roomId={roomId} />;
}

// Safe hook to extract roomId from params without hydration issues
function useRoomParams(params: Promise<{ roomId: string }>): { roomId: string | null } {
  const [resolved, setResolved] = useState<{ roomId: string | null }>({ roomId: null });

  useEffect(() => {
    params.then((p) => setResolved({ roomId: p.roomId || null }));
  }, [params]);

  return resolved;
}
