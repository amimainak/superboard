// ============================================================
// K-12 AI Superboard — Root Page (Auth Gate)
// ============================================================
// Unauthenticated visitors see a marketing landing page.
// Authenticated tutors see the full dashboard.
// ============================================================

'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { createClient } from '@/lib/supabase';
import { authFetch, initAuthFetch } from '@/lib/auth-fetch';
import type { Tier } from '@/types';
import type { User } from '@supabase/supabase-js';
import { GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
const LandingPage = dynamic(() => import('@/components/landing/LandingPage'), { ssr: true });
const AuthenticatedDashboard = dynamic(() => import('@/components/dashboard/DashboardPage').then(m => ({ default: m.AuthenticatedDashboard })), { ssr: false });
const AdminPanel = dynamic(() => import('@/components/admin/AdminPanel'), { ssr: false });

// ============================================================
// MAIN EXPORT — Auth Gate → Landing or Dashboard
// ============================================================
export default function Dashboard() {
  const { setTier, setIsAdmin } = useAppStore();
  const { toast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tierLoading, setTierLoading] = useState(true);
  const [isAdmin, setIsAdminState] = useState(false);

  // --- Auth check on mount ---
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setAuthLoading(false); return; }

    // Initialize auth fetch token caching
    initAuthFetch();

    // Register service worker for caching strategy
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => { console.warn('[SW Register]', err); });
    }

    let mounted = true;

    // Listen for auth state changes FIRST to catch any race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (!mounted) return;
      const user = session?.user ?? null;
      setUser(user);
      if (user) {
        try {
          const tierRes = await authFetch(`/api/auth/profile?userId=${user.id}`);
          if (tierRes.ok) {
            const profileData = await tierRes.json();
            if (profileData.tier) setTier(profileData.tier as Tier);
            if (profileData.name) setUserName(profileData.name);
          }
          // Auto-register OAuth users (Google, etc.) — creates profile if missing
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && user?.user_metadata) {
            try {
              await authFetch('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                  id: user.id,
                  email: user.email || '',
                  name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                }),
              });
            } catch (err) { console.warn('[Auth Register]', err); }
          }
          // Check admin status
          try {
            const adminRes = await authFetch('/api/admin/check');
            if (adminRes.ok) {
              const adminData = await adminRes.json();
              if (adminData.isAdmin) {
                setIsAdminState(true);
                setIsAdmin(true);
              }
            }
          } catch (err) { console.warn('[Admin Check]', err); }
        } catch (err) {
          console.warn('[Auth Profile]', err);
          toast({ title: 'Could not load profile', description: 'Some settings may not be available.', variant: 'destructive' });
        }
      }
      setAuthLoading(false);
      setTierLoading(false);
    });

    // Then check for existing session
    supabase.auth.getUser().then(async ({ data: { user } }: any) => {
      if (!mounted) return;
      if (user) {
        setUser(user);
        try {
          const tierRes = await authFetch(`/api/auth/profile?userId=${user.id}`);
          if (tierRes.ok) {
            const profileData = await tierRes.json();
            if (profileData.tier) setTier(profileData.tier as Tier);
            if (profileData.name) setUserName(profileData.name);
          }
          // Check admin status
          try {
            const adminRes = await authFetch('/api/admin/check');
            if (adminRes.ok) {
              const adminData = await adminRes.json();
              if (adminData.isAdmin) {
                setIsAdminState(true);
                setIsAdmin(true);
              }
            }
          } catch (err) { console.warn('[Admin Check]', err); }
        } catch (err) {
          console.warn('[Auth Profile]', err);
          toast({ title: 'Could not load profile', description: 'Some settings may not be available.', variant: 'destructive' });
        }
      }
      setAuthLoading(false);
      setTierLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- Check for ?admin=1 query param on mount ---
  // --- Check for ?invite_accepted=1 (from invite page redirect) ---
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === '1' && isAdmin) {
        setShowAdminState(true);
      }
      if (params.get('invite_accepted') === '1') {
        // Clean URL
        window.history.replaceState({}, '', '/');
      }
    }
  }, [isAdmin]);

  const [showAdminState, setShowAdminState] = useState(false);

  // --- Loading state ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-emerald-500/25 animate-pulse-glow">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading Superboard...</p>
        </div>
      </div>
    );
  }

  // --- Not logged in → Show Landing Page ---
  if (!user) {
    return <LandingPage />;
  }

  // --- Logged in → Show Dashboard (or Admin Panel if admin) ---
  if (showAdminState && isAdmin) {
    return <AdminPanel />;
  }

  return (
    <AuthenticatedDashboard user={user} userName={userName} tierLoading={tierLoading} isAdmin={isAdmin} />
  );
}
