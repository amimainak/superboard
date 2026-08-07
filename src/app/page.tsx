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
import { GraduationCap, Shield } from 'lucide-react';
import LandingPage from '@/components/landing/LandingPage';
import { AuthenticatedDashboard } from '@/components/dashboard/DashboardPage';
import AdminPanel from '@/components/admin/AdminPanel';

// ============================================================
// MAIN EXPORT — Auth Gate → Landing or Dashboard
// ============================================================
export default function Dashboard() {
  const { setTier, setIsAdmin } = useAppStore();

  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tierLoading, setTierLoading] = useState(true);
  const [isAdmin, setIsAdminState] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // --- Auth check on mount ---
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) { setAuthLoading(false); return; }

    // Initialize auth fetch token caching
    initAuthFetch();

    let mounted = true;

    // Listen for auth state changes FIRST to catch any race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
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
          } catch { /* ignore admin check failure */ }
        } catch { /* ignore */ }
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
          } catch { /* ignore */ }
        } catch { /* ignore */ }
      }
      setAuthLoading(false);
      setTierLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
  if (showAdmin && isAdmin) {
    return <AdminPanel />;
  }

  return (
    <div className="relative">
      <AuthenticatedDashboard user={user} userName={userName} tierLoading={tierLoading} />
      {/* Admin Access Button — floating */}
      {isAdmin && !showAdmin && (
        <button
          onClick={() => setShowAdmin(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-primary text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
          title="Open Admin Panel"
        >
          <Shield className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
