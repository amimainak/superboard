// ============================================================
// Agency Admin Panel
// ============================================================
// Manages sub-tutors and students for agency owners.
// Includes sub-tutor count badge ("3/5" or "3/\u221E"),
// upsell warning at sub-tutor limit, and a Student Management tab.
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import type { SubTutorRow, InviteRow, Tier } from '@/types';
import { isAgencyTier, PRICING, CREDIT_PACKS } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  UserPlus,
  Crown,
  Shield,
  Check,
  Copy,
  AlertTriangle,
  Clock,
  DollarSign,
  ShoppingBag,
  Gift,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { StudentManagementPanel } from './StudentManagementPanel';

function getMaxSubTutors(tier: Tier): number {
  if (tier === 'AGENCY_PREMIUM') return Infinity;
  if (tier === 'AGENCY_STANDARD' || tier === 'AGENCY') return 5;
  return 0;
}

function getTierLabel(tier: Tier): string {
  if (tier === 'AGENCY_PREMIUM') return 'Agency Premium';
  if (tier === 'AGENCY_STANDARD') return 'Agency Standard';
  if (tier === 'AGENCY') return 'Agency';
  return tier;
}

export function AgencyAdminPanel({ agencyUserId, userTier }: { agencyUserId: string; userTier: Tier }) {
  const { toast } = useToast();
  const [subTutors, setSubTutors] = useState<SubTutorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [lessonHours, setLessonHours] = useState<{ totalHours: number; totalMinutes: number; completedRooms: number; activeRooms: number } | null>(null);

  // Credit pack state
  const [totalHoursRemaining, setTotalHoursRemaining] = useState<number>(0);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [buying, setBuying] = useState(false);

  const maxSubTutors = getMaxSubTutors(userTier);
  const atLimit = maxSubTutors !== Infinity && subTutors.length >= maxSubTutors;

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

  const loadLessonHours = useCallback(() => {
    authFetch('/api/agency/hours').then((res) => res.json()).then((data) => {
      setLessonHours({
        totalHours: data.totalHours || 0,
        totalMinutes: data.totalMinutes || 0,
        completedRooms: data.completedRooms || 0,
        activeRooms: data.activeRooms || 0,
      });
    }).catch(() => {});
  }, []);

  const loadCreditPacks = useCallback(() => {
    authFetch('/api/agency/credit-packs').then((res) => res.json()).then((data) => {
      setTotalHoursRemaining(data.totalHoursRemaining || 0);
    }).catch(() => {});
  }, []);

  const handleBuyHours = async (hours: number) => {
    setBuying(true);
    try {
      const res = await authFetch('/api/agency/credit-packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Failed to purchase', description: data.error || 'Could not create credit pack.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Credit pack created!', description: `${hours} prepaid hours added to your account.` });
      setBuyDialogOpen(false);
      loadCreditPacks();
    } catch {
      toast({ title: 'Network error', description: 'Could not reach the server.', variant: 'destructive' });
    } finally {
      setBuying(false);
    }
  };

  useEffect(() => {
    loadSubTutors();
    loadInvites();
    loadLessonHours();
    loadCreditPacks();
  }, [loadSubTutors, loadInvites, loadLessonHours, loadCreditPacks]);

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

  if (loading) return (
    <div className="space-y-4">
      <div className="flex items-center gap-3"><Skeleton className="h-6 w-32 rounded-full" /><Skeleton className="h-4 w-40" /></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  );

  const totalVideo = subTutors.reduce((sum, t) => sum + t.videoMinutesUsed, 0);
  const totalCredits = subTutors.reduce((sum, t) => sum + t.aiCreditsUsed, 0);
  const totalRooms = subTutors.reduce((sum, t) => sum + t.activeRooms, 0);
  const pendingInvites = invites.filter((i) => i.status === 'PENDING');
  const perHourRate = userTier === 'AGENCY_PREMIUM' ? PRICING.AGENCY_PREMIUM.perHour : PRICING.AGENCY_STANDARD.perHour;
  const estimatedCost = lessonHours ? (lessonHours.totalHours * perHourRate).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Tier Badge + Lesson Hours Summary */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Badge className={`rounded-full px-3 font-semibold text-xs ${userTier === 'AGENCY_PREMIUM' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'}`}>
            {userTier === 'AGENCY_PREMIUM' ? <Shield className="w-3 h-3 mr-1" /> : <Crown className="w-3 h-3 mr-1" />}
            {getTierLabel(userTier)}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-2xl stat-gradient-sparkles p-5 text-white shadow-lg shadow-emerald-500/15 card-hover">
          <p className="text-3xl font-bold">
            {subTutors.length}
            {maxSubTutors !== Infinity
              ? <span className="text-base font-normal">/{maxSubTutors}</span>
              : <span className="text-base font-normal">/\u221E</span>}
          </p>
          <p className="text-sm text-white/80 mt-1">Sub-Tutors</p>
        </div>
        <div className="rounded-2xl stat-gradient-video p-5 text-white shadow-lg shadow-sky-500/15 card-hover">
          <p className="text-3xl font-bold">{lessonHours?.totalHours || 0}<span className="text-base font-normal"> hrs</span></p>
          <p className="text-sm text-white/80 mt-1">Lesson Hours</p>
          {lessonHours && lessonHours.totalHours > 0 && (
            <p className="text-xs text-white/60 mt-0.5">(~${estimatedCost})</p>
          )}
        </div>
        <div className="rounded-2xl stat-gradient-recordings p-5 text-white shadow-lg shadow-emerald-500/15 card-hover">
          <p className="text-3xl font-bold">{totalRooms}</p>
          <p className="text-sm text-white/80 mt-1">Total Lessons</p>
        </div>
        <div className="rounded-2xl stat-gradient-sparkles p-5 text-white shadow-lg shadow-emerald-500/15 card-hover">
          <p className="text-3xl font-bold">${estimatedCost}</p>
          <p className="text-sm text-white/80 mt-1">Est. Hourly Cost</p>
        </div>
        {/* Prepaid Hours Card */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-5 text-white shadow-lg shadow-purple-500/15 card-hover relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <Gift className="w-5 h-5 text-white/20" />
          </div>
          <p className="text-3xl font-bold">{totalHoursRemaining}<span className="text-base font-normal"> hrs</span></p>
          <p className="text-sm text-white/80 mt-1">Prepaid Hours</p>
          <Button
            size="sm"
            className="mt-2 rounded-lg bg-white/20 hover:bg-white/30 border-0 text-white text-xs font-medium h-7 px-3"
            onClick={() => setBuyDialogOpen(true)}
          >
            <ShoppingBag className="w-3 h-3 mr-1" />
            Buy Hours
          </Button>
        </div>
      </div>

      {/* Buy Hours Dialog */}
      <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-violet-500" />
              Buy Prepaid Hours
            </DialogTitle>
            <DialogDescription>
              Save on hourly costs with prepaid credit packs. Hours are applied to your agency account immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {CREDIT_PACKS.map((pack) => (
              <button
                key={pack.hours}
                type="button"
                disabled={buying}
                onClick={() => handleBuyHours(pack.hours)}
                className="w-full flex items-center justify-between rounded-xl border-2 border-border hover:border-violet-400 hover:bg-violet-50/50 p-4 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div>
                  <p className="font-semibold text-sm">{pack.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{pack.rateLabel}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">${pack.priceCents / 100}</p>
                  <p className="text-[10px] text-muted-foreground">one-time</p>
                </div>
              </button>
            ))}
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              Payment integration coming soon. Packs are created immediately for testing.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upsell Warning — Standard tier at sub-tutor limit */}
      {userTier === 'AGENCY_STANDARD' && atLimit && (
        <div className="flex items-start gap-3 rounded-xl bg-purple-50 border border-purple-200 p-4">
          <AlertTriangle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-900">Sub-tutor limit reached ({maxSubTutors}/{maxSubTutors})</p>
            <p className="text-xs text-purple-700 mt-1">
              Upgrade to Agency Premium for unlimited sub-tutors, lower hourly rates ($2/hr vs $3/hr), and priority support.
            </p>
          </div>
          <Button
            size="sm"
            className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold flex-shrink-0 text-xs"
            onClick={() => { window.open('/api/stripe/checkout?plan=agency-premium', '_self'); }}
          >
            Upgrade
          </Button>
        </div>
      )}

      {/* Tabs: Sub-Tutors vs Students */}
      <Tabs defaultValue="subtutors" className="w-full">
        <TabsList className="bg-gray-100 rounded-xl p-1 h-auto">
          <TabsTrigger value="subtutors" className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium text-sm">
            <Users className="w-4 h-4" />Sub-Tutors
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{subTutors.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2 rounded-lg px-4 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 font-medium text-sm">
            <UserPlus className="w-4 h-4" />Students
          </TabsTrigger>
        </TabsList>

        {/* Sub-Tutors Tab */}
        <TabsContent value="subtutors" className="mt-6">
          <div className="space-y-5">
            {/* Invite Sub-Tutor Button */}
            <div className="flex items-center justify-end">
              {atLimit ? (
                <Button className="rounded-xl bg-gray-200 text-gray-500 cursor-not-allowed text-sm gap-2" disabled>
                  <Plus className="w-4 h-4" /> Limit Reached
                </Button>
              ) : (
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
                              {inviteLinkCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
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
              )}
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
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-red-600" onClick={() => setRemoveConfirmId(tutor.id)}>Remove</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="mt-6">
          <StudentManagementPanel agencyUserId={agencyUserId} />
        </TabsContent>
      </Tabs>

      {/* Remove Tutor Confirmation Dialog */}
      <AlertDialog open={!!removeConfirmId} onOpenChange={(open) => { if (!open) setRemoveConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this tutor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke their access to your agency. They will lose access to all shared resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={removing}
              onClick={() => { if (removeConfirmId) handleRemoveTutor(removeConfirmId); }}
            >
              {removing ? 'Removing...' : 'Remove Tutor'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
