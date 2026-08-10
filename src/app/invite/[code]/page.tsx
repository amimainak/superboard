// ============================================================
// Invite Accept Page — /invite/[code]
// ============================================================
// Public page that displays invite details and lets the
// recipient accept the invite (if authenticated & email matches).
// ============================================================

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { authFetch, initAuthFetch } from '@/lib/auth-fetch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Check, AlertCircle, LogIn, ArrowRight } from 'lucide-react';

type InviteState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'not_found' }
  | { status: 'expired' }
  | { status: 'already_used'; detail: string }
  | {
      status: 'loaded';
      agencyName: string;
      agencyBrandingLogo: string | null;
      agencyBrandingColor: string | null;
      invitedEmail: string;
      expiresAt: string;
      createdAt: string;
    };

export default function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteState>({ status: 'loading' });
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');

  // Resolve params
  useEffect(() => {
    params.then((p) => setCode(p.code || null));
  }, [params]);

  // Check auth state & load invite
  useEffect(() => {
    if (!code) return;

    const supabase = createClient();
    if (!supabase) {
      setInvite({ status: 'error', message: 'Unable to initialize. Please try again.' });
      return;
    }

    // Check auth
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (user?.email) {
        setIsAuthenticated(true);
        setUserEmail(user.email.toLowerCase());
        initAuthFetch();
      }
    });

    // Fetch invite (public — no auth required)
    fetch(`/api/agency/invite/${code}`)
      .then((res) => {
        if (res.status === 404) {
          setInvite({ status: 'not_found' });
          return null;
        }
        if (res.status === 410) {
          return res.json().then((data) => {
            if (data.error?.toLowerCase().includes('expired')) {
              setInvite({ status: 'expired' });
            } else {
              setInvite({ status: 'already_used', detail: data.detail || 'This invite is no longer available' });
            }
            return null;
          });
        }
        if (!res.ok) {
          setInvite({ status: 'error', message: 'Failed to load invite details' });
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setInvite({
            status: 'loaded',
            agencyName: data.agencyName,
            agencyBrandingLogo: data.agencyBrandingLogo,
            agencyBrandingColor: data.agencyBrandingColor,
            invitedEmail: data.invitedEmail,
            expiresAt: data.expiresAt,
            createdAt: data.createdAt,
          });
        }
      })
      .catch(() => {
        setInvite({ status: 'error', message: 'Network error. Please check your connection and try again.' });
      });
  }, [code]);

  const handleAccept = async () => {
    if (!code || invite.status !== 'loaded') return;
    setAccepting(true);
    setAcceptError('');
    try {
      const res = await authFetch(`/api/agency/invite/${code}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setAcceptError(data.message || data.error || 'Failed to accept invite');
        setAccepting(false);
        return;
      }
      // Success — redirect to dashboard with success indicator
      window.location.href = '/?invite_accepted=1';
    } catch {
      setAcceptError('Network error. Please try again.');
      setAccepting(false);
    }
  };

  // ---- Loading state ----
  if (invite.status === 'loading' || !code) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" aria-label="Loading invite...">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ---- Error states ----
  if (invite.status === 'not_found') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Invite not found</h1>
          <p className="text-gray-500 leading-relaxed">This invite link doesn&apos;t exist or may have been deleted. Please ask the agency owner to send a new invite.</p>
          <a href="/" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 gradient-primary text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">
            Go to Superboard
          </a>
        </div>
      </div>
    );
  }

  if (invite.status === 'expired') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Invite expired</h1>
          <p className="text-gray-500 leading-relaxed">This invite has expired. Please ask the agency owner to send a new one.</p>
          <a href="/" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 gradient-primary text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">
            Go to Superboard
          </a>
        </div>
      </div>
    );
  }

  if (invite.status === 'already_used') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Invite already used</h1>
          <p className="text-gray-500 leading-relaxed">{invite.detail}</p>
          <a href="/" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 gradient-primary text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (invite.status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="text-gray-500 leading-relaxed">{invite.message}</p>
          <a href="/" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 gradient-primary text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">
            Go to Superboard
          </a>
        </div>
      </div>
    );
  }

  // ---- Loaded invite state ----
  const emailMatches = userEmail === invite.invitedEmail.toLowerCase();
  const accentColor = invite.agencyBrandingColor || '#059669';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      {/* Subtle background accent */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${accentColor}15, transparent 70%)` }} />

      <div className="relative max-w-md w-full mx-auto">
        <div className="rounded-2xl border bg-white shadow-xl shadow-gray-200/50 overflow-hidden">
          {/* Header with gradient */}
          <div
            className="px-8 pt-10 pb-8 text-center"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
            }}
          >
            {invite.agencyBrandingLogo ? (
              <img
                src={invite.agencyBrandingLogo}
                alt={invite.agencyName}
                className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-white/20 p-1.5 object-contain"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
            )}
            <h1 className="text-xl font-bold text-white">{invite.agencyName}</h1>
            <p className="text-sm text-white/80 mt-1">Agency Invitation</p>
          </div>

          {/* Body */}
          <div className="px-8 py-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">
                You&apos;re invited to join{' '}
                <span style={{ color: accentColor }}>{invite.agencyName}</span>
              </h2>
              <p className="text-sm text-gray-500">as a sub-tutor</p>
            </div>

            {/* Details card */}
            <div className="rounded-xl bg-gray-50 border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</span>
                <span className="text-sm font-medium text-gray-900">{invite.invitedEmail}</span>
              </div>
              <div className="border-t" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expires</span>
                <span className="text-sm text-gray-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(invite.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Action area */}
            {!isAuthenticated ? (
              <div className="space-y-3">
                <Button
                  className="w-full h-12 rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-[15px]"
                  onClick={() => {
                    window.location.href = `/?showAuth=login`;
                  }}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign in to accept
                </Button>
                <p className="text-xs text-center text-gray-400">
                  You&apos;ll need to sign in with <strong>{invite.invitedEmail}</strong> to accept this invite.
                </p>
              </div>
            ) : !emailMatches ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
                  <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Email mismatch</p>
                    <p className="text-xs text-amber-700 mt-1">
                      This invite was sent to <strong>{invite.invitedEmail}</strong>, but you&apos;re signed in as <strong>{userEmail}</strong>. Please sign in with the correct account.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl font-semibold text-sm"
                  onClick={() => {
                    window.location.href = `/?showAuth=login`;
                  }}
                >
                  Sign in with a different account
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full h-12 rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-[15px]"
                  onClick={handleAccept}
                  disabled={accepting}
                >
                  {accepting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Accept Invite
                    </>
                  )}
                </Button>
                {acceptError && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 text-center" role="alert">{acceptError}</p>
                )}
              </div>
            )}

            {/* Footer link */}
            <div className="pt-2">
              <a href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1">
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                Back to Superboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
