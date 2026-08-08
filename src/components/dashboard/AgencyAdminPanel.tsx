// ============================================================
// Agency Admin Panel
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import type { SubTutorRow, InviteRow } from '@/types';
import { isAgencyTier } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Users,
  Settings,
  Crown,
  Check,
  Download,
} from 'lucide-react';

export function AgencyAdminPanel({ agencyUserId }: { agencyUserId: string }) {
  const [subTutors, setSubTutors] = useState<SubTutorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string>('AGENCY');
  const [maxSubTutors, setMaxSubTutors] = useState<number>(5);

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState<{ code: string; expiresAt: string; warning?: string } | null>(null);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);

  // Remove confirmation state
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const loadSubTutors = useCallback(() => {
    if (!agencyUserId) return;
    setLoading(true);
    authFetch(`/api/usage/agency?agencyId=${agencyUserId}`).then((res) => res.json()).then((data) => setSubTutors(data.subTutors || [])).catch(() => {}).finally(() => setLoading(false));
  }, [agencyUserId]);

  const loadInvites = useCallback(() => {
    if (!agencyUserId) return;
    setInvitesLoading(true);
    authFetch('/api/agency/invite').then((res) => res.json()).then((data) => setInvites(data.invites || [])).catch(() => {}).finally(() => setInvitesLoading(false));
  }, [agencyUserId]);

  useEffect(() => {
    loadSubTutors();
    loadInvites();
  }, [loadSubTutors, loadInvites]);

  const handleSendInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setInviteError('');
    setInviteSuccess(null);
    setInviteSending(true);
    try {
      const res = await authFetch('/api/agency/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteError(data.message || data.error || 'Failed to send invite');
        return;
      }
      setInviteSuccess({ code: data.code, expiresAt: data.expiresAt, warning: data.warning });
      setInviteEmail('');
      loadInvites();
      loadSubTutors();
    } catch {
      setInviteError('Network error. Please try again.');
    } finally {
      setInviteSending(false);
    }
  };

  const handleCancelInvite = async (code: string) => {
    try {
      await authFetch(`/api/agency/invite/${code}/cancel`, { method: 'POST' });
      loadInvites();
    } catch { /* silent */ }
  };

  const handleRemoveTutor = async (tutorId: string) => {
    setRemoving(true);
    try {
      const res = await authFetch(`/api/agency/subtutors/${tutorId}`, { method: 'DELETE' });
      if (res.ok) {
        loadSubTutors();
        loadInvites();
      }
    } catch { /* silent */ }
    setRemoving(false);
    setRemoveConfirmId(null);
  };

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(link).then(() => {
      setInviteLinkCopied(true);
      setTimeout(() => setInviteLinkCopied(false), 2000);
    }).catch(() => { /* clipboard may be blocked */ });
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /><span className="ml-3 text-sm text-muted-foreground">Loading...</span></div>;

  const totalVideo = subTutors.reduce((sum, t) => sum + t.videoMinutesUsed, 0);
  const totalCredits = subTutors.reduce((sum, t) => sum + t.aiCreditsUsed, 0);
  const totalRooms = subTutors.reduce((sum, t) => sum + t.activeRooms, 0);
  const pendingInvites = invites.filter((i) => i.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Invite Sub-Tutor Button */}
      <div className="flex items-center justify-between">
        <div />
        <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) { setInviteError(''); setInviteSuccess(null); setInviteEmail(''); } }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm gap-2">
              <Plus className="w-4 h-4" /> Invite Sub-Tutor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg">Invite a Sub-Tutor</DialogTitle>
              <DialogDescription>Send an invite link to a tutor you&apos;d like to add to your agency.</DialogDescription>
            </DialogHeader>
            {inviteSuccess ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"><Check className="w-4 h-4 text-emerald-600" /></div>
                  <div><p className="text-sm font-medium text-emerald-800">Invite sent successfully!</p><p className="text-xs text-emerald-600">Link expires in 7 days</p></div>
                </div>
                {inviteSuccess.warning && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <Crown className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700">{inviteSuccess.warning}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Invite link</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted rounded-lg px-3 py-2 truncate block">{window.location.origin}/invite/{inviteSuccess.code}</code>
                    <Button size="sm" variant="outline" className="flex-shrink-0 text-xs" onClick={() => copyInviteLink(inviteSuccess.code)}>
                      {inviteLinkCopied ? <Check className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                      {inviteLinkCopied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-2" onClick={() => setInviteSuccess(null)}>Send another invite</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email" className="text-sm font-medium">Email address</Label>
                  <Input id="invite-email" type="email" placeholder="tutor@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()} className="rounded-xl" />
                </div>
                {inviteError && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{inviteError}</p>
                )}
                <Button className="w-full rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all" onClick={handleSendInvite} disabled={inviteSending || !inviteEmail.trim()}>
                  {inviteSending ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> Sending...</> : 'Send Invite'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl stat-gradient-sparkles p-5 text-white shadow-lg shadow-emerald-500/15 card-hover"><p className="text-3xl font-bold">{subTutors.length}{maxSubTutors !== Infinity ? <span className="text-base font-normal">/{maxSubTutors}</span> : ''}</p><p className="text-sm text-white/80 mt-1">Sub-Tutors</p></div>
        <div className="rounded-2xl stat-gradient-video p-5 text-white shadow-lg shadow-sky-500/15 card-hover"><p className="text-3xl font-bold">{totalRooms}</p><p className="text-sm text-white/80 mt-1">Total Lessons</p></div>
        <div className="rounded-2xl stat-gradient-recordings p-5 text-white shadow-lg shadow-emerald-500/15 card-hover"><p className="text-3xl font-bold">{totalVideo} min</p><p className="text-sm text-white/80 mt-1">Video Used</p></div>
      </div>

      {/* Pending Invites */}
      {invitesLoading ? null : invites.length === 0 ? null : (
        <div className="rounded-2xl border overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-muted/50 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold">Invites ({pendingInvites.length} pending)</h3>
          </div>
          <div className="divide-y">
            {invites.map((invite) => {
              const isExpired = invite.status === 'EXPIRED' || (invite.status === 'PENDING' && new Date(invite.expiresAt) < new Date());
              const isAccepted = invite.status === 'ACCEPTED';
              const isCancelled = invite.status === 'CANCELLED';
              return (
                <div key={invite.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{invite.invitedEmail}</p>
                    <p className="text-xs text-muted-foreground">Expires {new Date(invite.expiresAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isAccepted && <Badge className="bg-emerald-100 text-emerald-700 text-[10px] rounded-full border-0">Accepted{invite.recipient?.name ? ` by ${invite.recipient.name}` : ''}</Badge>}
                    {isExpired && <Badge variant="secondary" className="text-[10px] rounded-full text-muted-foreground">Expired</Badge>}
                    {isCancelled && <Badge variant="secondary" className="text-[10px] rounded-full text-muted-foreground">Cancelled</Badge>}
                    {!isAccepted && !isExpired && !isCancelled && (
                      <>
                        <Badge className="bg-amber-100 text-amber-700 text-[10px] rounded-full border-0">Pending</Badge>
                        <Button size="sm" variant="ghost" className="text-xs text-muted-foreground hover:text-red-600 h-7 px-2" onClick={() => handleCancelInvite(invite.code)}>Cancel</Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tutors Table */}
      {subTutors.length === 0 && invites.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center"><Users className="w-8 h-8 text-emerald-400" /></div>
          <p className="text-muted-foreground font-medium">No sub-tutors assigned yet</p>
          <p className="text-xs text-muted-foreground mt-1">Invite a tutor to get started</p>
        </div>
      ) : subTutors.length === 0 ? null : (
        <div className="rounded-2xl border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b"><tr><th className="text-left px-4 py-3 font-semibold">Tutor</th><th className="text-left px-4 py-3 font-semibold">Tier</th><th className="text-right px-4 py-3 font-semibold">Lessons</th><th className="text-right px-4 py-3 font-semibold">Video</th><th className="text-right px-4 py-3 font-semibold">Smart Credits</th><th className="text-right px-4 py-3 font-semibold">Last Active</th><th className="px-4 py-3" /></tr></thead>
            <tbody>
              {subTutors.map((tutor) => (
                <tr key={tutor.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3"><p className="font-medium">{tutor.name || '\u2014'}</p><p className="text-xs text-muted-foreground">{tutor.email}</p></td>
                  <td className="px-4 py-3"><Badge variant={isAgencyTier(tutor.tier as any) ? 'default' : 'secondary'} className={`text-[10px] rounded-full ${isAgencyTier(tutor.tier as any) ? 'bg-amber-100 text-amber-700' : ''}`}>{tutor.tier}</Badge></td>
                  <td className="px-4 py-3 text-right font-medium">{tutor.activeRooms}</td>
                  <td className="px-4 py-3 text-right font-medium">{tutor.videoMinutesUsed}</td>
                  <td className="px-4 py-3 text-right font-medium">{tutor.aiCreditsUsed}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{tutor.joinedAt ? new Date(tutor.joinedAt).toLocaleDateString() : '\u2014'}</td>
                  <td className="px-4 py-3 text-right">
                    {removeConfirmId === tutor.id ? (
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-xs text-red-500 mr-1">Sure?</span>
                        <Button size="sm" variant="destructive" className="h-7 text-xs px-2" disabled={removing} onClick={() => handleRemoveTutor(tutor.id)}>{removing ? '...' : 'Yes'}</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setRemoveConfirmId(null)}>No</Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-red-600" onClick={() => setRemoveConfirmId(tutor.id)}>Remove</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== SETTINGS DIALOG ===== */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">Settings</DialogTitle>
          <div className="gradient-primary px-6 pt-8 pb-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/90 flex items-center justify-center mx-auto mb-4">
              <Settings className="w-7 h-7 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-white">Settings</h2>
            <p className="text-sm text-white/70 mt-1">Manage your account preferences</p>
          </div>
          <div className="px-6 pb-6 pt-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <div className="h-11 rounded-xl bg-gray-50 border border-gray-200 px-3 flex items-center text-sm text-gray-600">{userEmail || ''}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Plan</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`rounded-full px-3 py-0.5 font-medium ${isAgencyTier(userTier as any) ? 'bg-purple-50 text-purple-600 border-purple-200' : userTier === 'PRO' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {userTier === 'AGENCY_PREMIUM' ? 'Agency Premium' : userTier === 'AGENCY_STANDARD' ? 'Agency Standard' : userTier === 'AGENCY' ? 'Agency' : userTier === 'PRO' ? 'Pro' : 'Free'}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Need to change your email or password?</p>
              <Button variant="link" className="text-xs text-primary mt-1">Contact Support</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
