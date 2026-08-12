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
import { authFetch } from '@/lib/auth-fetch';
import { useEffect, useState, use } from 'react';
import { GraduationCap } from 'lucide-react';
import type { RoomData, BrandingConfig } from '@/types';

// Client component wrapper for the room page
function RoomPageContent({ roomId }: { roomId: string }) {
  const { setRoom, setBranding } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoom() {
      try {
        // Fetch room data from API (auth required — uses authFetch for token)
        const response = await authFetch(`/api/room?roomId=${roomId}`);
        if (!response.ok) {
          if (response.status === 410) {
            setError('This lesson has ended. The link is no longer active.');
            return;
          }
          throw new Error('Failed to load room');
        }

        const roomData: RoomData = await response.json();

        // Determine if the current user is the tutor.
        // Instead of calling supabase.auth.getUser() (which can hang with SSR client),
        // we compare the auth token's subject claim against roomData.tutorId.
        // The authFetch already validated the token server-side.
        let tutorMatch = false;
        let userId: string | null = null;
        let userName: string | null = null;

        // Decode the JWT to get the user ID (sub claim)
        // The token was already fetched by authFetch internally
        try {
          const supabase = createClient();
          if (supabase) {
            // getSession reads from cookies — should be fast, but add timeout
            const sessionPromise = supabase.auth.getSession();
            const timeout = new Promise<null>(r => setTimeout(() => r(null), 3000));
            const sessionResult = await Promise.race([sessionPromise, timeout]);
            if (sessionResult && sessionResult.data.session) {
              userId = sessionResult.data.session.user.id;
              userName = sessionResult.data.session.user.user_metadata?.name
                || sessionResult.data.session.user.email
                || null;
              tutorMatch = userId === roomData.tutorId;
            }
          }
        } catch {
          // If getSession fails, we still have roomData —
          // just treat user as non-tutor (student view)
        }

        // Set room state — include isTutor, userId, userName for whiteboard
        setRoom({
          roomId: roomData.id,
          subject: roomData.subject as 'MATH' | 'SCIENCE' | 'LANGUAGE' | 'GENERAL',
          isActive: roomData.isActive,
          userId,
          userName,
          branding: {
            logoUrl: roomData.brandingLogo || null,
            color: roomData.brandingColor || null,
            agencyName: roomData.tutor?.name || null,
          },
          isTutor: tutorMatch,
        } as any);

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
          let studentIdentity = userId || '';
          if (!studentIdentity) {
            // Generate a session-based identity for anonymous students
            try {
              const { getFingerprintHash } = await import('@/lib/fingerprint');
              const fp = await getFingerprintHash();
              studentIdentity = fp || `anon_${roomId}_${Date.now()}`;
              // Also report fingerprint if user is logged in
              if (userId) {
                const { reportFingerprint } = await import('@/lib/fingerprint');
                reportFingerprint(userId).catch(() => {});
              }
            } catch {
              studentIdentity = `anon_${roomId}_${Date.now()}`;
            }
          }
          authFetch('/api/room/participants', {
            method: 'POST',
            body: JSON.stringify({
              roomId,
              studentIdentity,
              studentName: userName || null,
            }),
          }).catch(() => { /* silent — don't block the lesson */ });
        }

        setLoading(false);
      } catch (err) {
        console.error('[RoomPage] loadRoom error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load room');
        setLoading(false);
      }
    }

    if (roomId) {
      loadRoom().catch(e => console.error('[RoomPage] loadRoom error:', e));
    }
  }, [roomId, setRoom, setBranding]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-pulse-glow">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading your lesson...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-6 max-w-md mx-auto px-6" role="alert">
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
// In Next.js 15 App Router, params is a Promise.
// We use React.use() to unwrap it synchronously in the client.
export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  // React.use() unwraps the Promise synchronously.
  // This works in both server and client rendering.
  const resolved = use(params);
  const roomId = resolved.roomId;

  if (!roomId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-pulse-glow">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Invalid lesson link.</p>
        </div>
      </div>
    );
  }

  return <RoomPageContent roomId={roomId} />;
}
