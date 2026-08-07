// ============================================================
// Admin Control Panel — Full Dashboard (v2)
// ============================================================
// 7 tabs: Overview | Users | Rooms | Billing | Audit | Settings | Tools
// ============================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Users, LayoutDashboard, DoorOpen, Shield, Search, Plus,
  Trash2, Edit, ChevronLeft, ChevronRight, TrendingUp,
  Activity, Video, FileText, GraduationCap, Ban, CreditCard,
  ScrollText, Settings, Download, Zap, AlertTriangle,
  Clock, UserX, UserCheck, Power, Radio,
} from 'lucide-react';

/* ── Types ── */
interface AdminUser {
  id: string; email: string; name: string | null; tier: string;
  isAdmin: boolean; status: string; gracePeriodEndsAt: string | null;
  parentAgencyId: string | null; customDomain: string | null;
  createdAt: string; updatedAt: string;
  _count: { rooms: number; templates: number; subTutors: number; sentInvites: number };
}
interface AdminRoom {
  id: string; subject: string; isActive: boolean; brandingLogo: string | null;
  brandingColor: string | null; createdAt: string; updatedAt: string;
  tutor: { id: string; name: string | null; email: string; tier: string };
  _count: { pages: number; participants: number; recordings: number };
}
interface PlatformStats {
  overview: { totalUsers: number; recentUsers: number; totalRooms: number; activeRooms: number;
    totalTemplates: number; totalRecordings: number; totalParticipants: number;
    suspendedUsers: number; bannedUsers: number };
  usersByTier: { tier: string; count: number }[];
  usersByStatus: { status: string; count: number }[];
  roomsBySubject: { subject: string; count: number }[];
  usage: { aiCreditsTotal: number; videoMinutesTotal: number; recordingsTotal: number };
  dailySignups: { createdAt: Date; _count: { createdAt: number } }[];
}
interface BillingData {
  mrr: number; arr: number; totalActiveSubscriptions: number;
  statusBreakdown: { status: string; count: number }[];
  planBreakdown: { tier: string; count: number; mrr: number }[];
  dunningQueue: any[]; recentlyCanceled: any[];
}
interface AuditEntry {
  id: string; action: string; targetType: string | null; targetId: string | null;
  metadata: string | null; createdAt: string;
  admin: { id: string; email: string; name: string | null };
}
interface SubscriptionEntry {
  id: string; stripeSubscriptionId: string; planName: string; status: string;
  currentPeriodStart: string; currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean; amountMonthlyCents: number;
  user: { id: string; email: string; name: string | null; tier: string; status: string };
}

/* ── Helpers ── */
function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return email[0].toUpperCase();
}
function tierBadgeColor(tier: string) {
  const m: Record<string, string> = { FREE: 'bg-gray-100 text-gray-700', PRO: 'bg-cyan-50 text-cyan-700', AGENCY: 'bg-amber-50 text-amber-700' };
  return m[tier] || m.FREE;
}
function statusBadge(s: string) {
  const m: Record<string, { bg: string; text: string; icon: any }> = {
    ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: UserCheck },
    SUSPENDED: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock },
    BANNED: { bg: 'bg-red-50', text: 'text-red-700', icon: UserX },
  };
  const v = m[s] || m.ACTIVE;
  return <Badge variant="secondary" className={`${v.bg} ${v.text} border-0`}><v.icon className="w-3 h-3 mr-1" />{s}</Badge>;
}
function Pagination({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (p: number | ((prev: number) => number)) => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p: number) => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="w-4 h-4" /></Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))} disabled={page === totalPages}><ChevronRight className="w-4 h-4" /></Button>
      </div>
    </div>);
}

/* ════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ════════════════════════════════════════════════════════════════ */
export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
            <div><h1 className="text-xl font-bold text-gray-900">Admin Control Panel</h1><p className="text-xs text-gray-500">Superboard Platform Management</p></div>
          </div>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-0"><Shield className="w-3 h-3 mr-1" />Admin Access</Badge>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 h-auto flex-wrap gap-1">
            {[
              { v: 'overview', l: 'Overview', i: LayoutDashboard },
              { v: 'users', l: 'Users', i: Users },
              { v: 'rooms', l: 'Rooms', i: DoorOpen },
              { v: 'billing', l: 'Billing', i: CreditCard },
              { v: 'audit', l: 'Audit Log', i: ScrollText },
              { v: 'settings', l: 'Settings', i: Settings },
              { v: 'tools', l: 'Tools', i: Zap },
            ].map(t => (
              <TabsTrigger key={t.v} value={t.v} className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 px-3 py-2 text-xs sm:text-sm">
                <t.i className="w-4 h-4 mr-1" />{t.l}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="overview"><OverviewTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="rooms"><RoomsTab /></TabsContent>
          <TabsContent value="billing"><BillingTab /></TabsContent>
          <TabsContent value="audit"><AuditTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
          <TabsContent value="tools"><ToolsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   OVERVIEW TAB
   ════════════════════════════════════════════════════════════════ */
function OverviewTab() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<BillingData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, bRes] = await Promise.all([authFetch('/api/admin/stats'), authFetch('/api/admin/billing')]);
        if (sRes.ok) setStats(await sRes.json());
        if (bRes.ok) setBilling(await bRes.json());
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-16" /></CardContent></Card>)}</div>;
  if (!stats) return <p className="text-center py-12 text-gray-500">Failed to load.</p>;
  const { overview, usersByTier, usersByStatus, roomsBySubject, usage } = stats;

  return (
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="MRR" value={billing ? `$${billing.mrr.toFixed(2)}` : 'N/A'} subtitle={billing ? `${billing.totalActiveSubscriptions} active subs` : 'No Stripe data'} icon={<CreditCard className="w-5 h-5" />} gradient="stat-gradient-sparkles" />
        <KPICard title="Total Users" value={overview.totalUsers} subtitle={`${overview.recentUsers} new this month`} icon={<Users className="w-5 h-5" />} gradient="stat-gradient-video" />
        <KPICard title="Active Rooms" value={overview.activeRooms} subtitle={`${overview.totalRooms} total`} icon={<Radio className="w-5 h-5" />} gradient="stat-gradient-recordings" />
        <KPICard title="Participants" value={overview.totalParticipants} subtitle="Unique students" icon={<GraduationCap className="w-5 h-5" />} gradient="stat-gradient-sparkles" />
      </div>
      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        <KPICard title="ARR" value={billing ? `$${billing.arr.toFixed(0)}` : 'N/A'} subtitle="Annual run rate" icon={<TrendingUp className="w-5 h-5" />} gradient="stat-gradient-sparkles" />
        <KPICard title="AI Credits Used" value={usage.aiCreditsTotal.toLocaleString()} subtitle="All-time" icon={<Activity className="w-5 h-5" />} gradient="stat-gradient-video" />
        <KPICard title="Suspended" value={overview.suspendedUsers} subtitle="Needs attention" icon={<AlertTriangle className="w-5 h-5" />} gradient="stat-gradient-recordings" />
        <KPICard title="Recordings" value={overview.totalRecordings} subtitle="Total lessons" icon={<Video className="w-5 h-5" />} gradient="stat-gradient-sparkles" />
      </div>
      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-emerald-600" />Users by Tier</CardTitle></CardHeader><CardContent><DistributionBars items={usersByTier.map(t => ({ key: t.tier, count: t.count }))} total={overview.totalUsers} colors={{ FREE: 'bg-gray-400', PRO: 'bg-cyan-500', AGENCY: 'bg-amber-500' }} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><DoorOpen className="w-4 h-4 text-cyan-600" />Rooms by Subject</CardTitle></CardHeader><CardContent><DistributionBars items={roomsBySubject.map(r => ({ key: r.subject.toLowerCase(), count: r.count }))} total={overview.totalRooms} colors={{ math: 'bg-emerald-500', science: 'bg-teal-500', language: 'bg-cyan-500', general: 'bg-lime-500' }} /></CardContent></Card>
      </div>
      {/* Recent Activity */}
      <Card><CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><ScrollText className="w-4 h-4 text-amber-600" />User Status Overview</CardTitle></CardHeader><CardContent><DistributionBars items={usersByStatus.map(s => ({ key: s.status, count: s.count }))} total={overview.totalUsers} colors={{ ACTIVE: 'bg-emerald-500', SUSPENDED: 'bg-amber-500', BANNED: 'bg-red-500' }} /></CardContent></Card>
    </div>
  );
}

function DistributionBars({ items, total, colors }: { items: { key: string; count: number }[]; total: number; colors: Record<string, string> }) {
  if (!items.length) return <p className="text-sm text-gray-400 text-center py-4">No data</p>;
  return <div className="space-y-3">{items.map(item => { const pct = total > 0 ? (item.count / total) * 100 : 0; return (<div key={item.key}><div className="flex items-center justify-between mb-1"><span className="text-sm font-medium text-gray-700 capitalize">{item.key}</span><span className="text-sm text-gray-500">{item.count} ({pct.toFixed(1)}%)</span></div><div className="h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${colors[item.key] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} /></div></div>); })}</div>;
}

function KPICard({ title, value, subtitle, icon, gradient }: { title: string; value: string | number; subtitle: string; icon: React.ReactNode; gradient: string }) {
  return <Card className="card-hover overflow-hidden"><CardContent className="p-0"><div className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-gray-500 mb-1">{title}</p><p className="text-2xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-400 mt-0.5">{subtitle}</p></div><div className={`w-9 h-9 rounded-lg ${gradient} flex items-center justify-center text-white`}>{icon}</div></div></div></CardContent></Card>;
}

/* ════════════════════════════════════════════════════════════════
   USERS TAB
   ════════════════════════════════════════════════════════════════ */
function UsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(''); const [tierFilter, setTierFilter] = useState('');
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', tier: 'FREE' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: page.toString(), limit: '15', search, tier: tierFilter });
      const r = await authFetch(`/api/admin/users?${p}`);
      if (r.ok) { const d = await r.json(); setUsers(d.users); setTotalPages(d.pagination.totalPages); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [page, search, tierFilter]);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function addUser() {
    const r = await authFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(newUser) });
    if (r.ok) { toast({ title: 'Created', description: `${newUser.email} added.` }); setShowAdd(false); setNewUser({ email: '', name: '', tier: 'FREE' }); loadUsers(); }
    else { const d = await r.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); }
  }
  async function saveUser() {
    if (!editUser) return;
    const r = await authFetch(`/api/admin/users/${editUser.id}`, { method: 'PATCH', body: JSON.stringify({ tier: editUser.tier, name: editUser.name, isAdmin: editUser.isAdmin }) });
    if (r.ok) { toast({ title: 'Updated', description: `${editUser.email} saved.` }); setEditUser(null); loadUsers(); }
    else { const d = await r.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); }
  }
  async function confirmDeleteUser() {
    if (!deleteTarget) return;
    const r = await authFetch(`/api/admin/users/${deleteTarget.id}`, { method: 'DELETE' });
    if (r.ok) { toast({ title: 'Deleted', description: `${deleteTarget.email} removed.` }); setDeleteTarget(null); loadUsers(); }
    else { const d = await r.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); }
  }
  async function changeStatus(userId: string, status: string, reason?: string) {
    const r = await authFetch(`/api/admin/users/${userId}/ban`, { method: 'POST', body: JSON.stringify({ status, reason }) });
    if (r.ok) { toast({ title: status === 'ACTIVE' ? 'Activated' : status === 'SUSPENDED' ? 'Suspended' : 'Banned', description: 'User status updated.' }); loadUsers(); }
    else { const d = await r.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); }
  }
  async function resetPassword(userId: string, email: string) {
    const r = await authFetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' });
    if (r.ok) toast({ title: 'Password Reset Sent', description: `Reset email sent to ${email}` });
    else { const d = await r.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); }
  }
  async function bulkAction(action: string, tier?: string) {
    const ids = Array.from(selectedIds);
    if (!ids.length) { toast({ title: 'No users selected', variant: 'destructive' }); return; }
    const r = await authFetch('/api/admin/users/bulk', { method: 'POST', body: JSON.stringify({ userIds: ids, action, tier }) });
    if (r.ok) { const d = await r.json(); toast({ title: 'Bulk Action Done', description: d.message }); setSelectedIds(new Set()); loadUsers(); }
    else { const d = await r.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search users..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
            <Select value={tierFilter} onValueChange={v => { setTierFilter(v === 'ALL' ? '' : v); setPage(1); }}><SelectTrigger className="w-32"><SelectValue placeholder="All Tiers" /></SelectTrigger><SelectContent><SelectItem value="ALL">All</SelectItem><SelectItem value="FREE">Free</SelectItem><SelectItem value="PRO">Pro</SelectItem><SelectItem value="AGENCY">Agency</SelectItem></SelectContent></Select>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedIds.size} selected</Badge>
                <Select onValueChange={v => bulkAction('changeTier', v)}><SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Set Tier" /></SelectTrigger><SelectContent><SelectItem value="FREE">Free</SelectItem><SelectItem value="PRO">Pro</SelectItem><SelectItem value="AGENCY">Agency</SelectItem></SelectContent></Select>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => bulkAction('suspend')}>Suspend</Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => bulkAction('activate')}>Activate</Button>
              </div>
            )}
          </div>
          <Dialog open={showAdd} onOpenChange={setShowAdd}><DialogTrigger asChild><Button className="gradient-primary text-white"><Plus className="w-4 h-4 mr-2" />Add User</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Add User</DialogTitle><DialogDescription>Create a new account.</DialogDescription></DialogHeader><div className="space-y-3 py-2"><div><Label>Email</Label><Input type="email" placeholder="user@example.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></div><div><Label>Name</Label><Input placeholder="John Doe" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} /></div><div><Label>Tier</Label><Select value={newUser.tier} onValueChange={v => setNewUser({ ...newUser, tier: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FREE">Free</SelectItem><SelectItem value="PRO">Pro</SelectItem><SelectItem value="AGENCY">Agency</SelectItem></SelectContent></Select></div></div><DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button><Button className="gradient-primary text-white" onClick={addUser} disabled={!newUser.email}>Create</Button></DialogFooter></DialogContent></Dialog>
        </div>
      </CardContent></Card>
      {/* Table */}
      <Card><CardContent className="p-0">
        {loading ? <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> :
        users.length === 0 ? <div className="text-center py-12 text-gray-500"><Users className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No users found</p></div> : (
          <>
            <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-gray-50/50"><TableHead className="w-8"></TableHead><TableHead className="w-10"></TableHead><TableHead>User</TableHead><TableHead>Tier</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Rooms</TableHead><TableHead className="hidden lg:table-cell">Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{users.map(u => (
              <TableRow key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell><input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => { const s = new Set(selectedIds); s.has(u.id) ? s.delete(u.id) : s.add(u.id); setSelectedIds(s); }} className="rounded" /></TableCell>
                <TableCell><Avatar className="h-8 w-8"><AvatarFallback className="text-xs font-medium bg-emerald-50 text-emerald-700">{getInitials(u.name, u.email)}</AvatarFallback></Avatar></TableCell>
                <TableCell><p className="font-medium text-gray-900 text-sm">{u.name || 'No name'}</p><p className="text-xs text-gray-500 truncate max-w-[200px]">{u.email}</p></TableCell>
                <TableCell><Badge variant="secondary" className={`${tierBadgeColor(u.tier)} border-0`}>{u.tier}</Badge></TableCell>
                <TableCell>{statusBadge(u.status)}</TableCell>
                <TableCell className="hidden md:table-cell"><span className="text-sm text-gray-600">{u._count.rooms}</span></TableCell>
                <TableCell className="hidden lg:table-cell"><span className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span></TableCell>
                <TableCell className="text-right"><div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditUser({ ...u })} title="Edit"><Edit className="w-3 h-3 text-gray-500" /></Button>
                  {u.status !== 'ACTIVE' && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeStatus(u.id, 'ACTIVE')} title="Activate"><UserCheck className="w-3 h-3 text-emerald-600" /></Button>}
                  {u.status === 'ACTIVE' && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeStatus(u.id, 'SUSPENDED')} title="Suspend"><Clock className="w-3 h-3 text-amber-600" /></Button>}
                  {u.status !== 'BANNED' && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeStatus(u.id, 'BANNED')} title="Ban"><Ban className="w-3 h-3 text-red-500" /></Button>}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => resetPassword(u.id, u.email)} title="Reset Password"><Power className="w-3 h-3 text-blue-500" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => setDeleteTarget(u)} title="Delete"><Trash2 className="w-3 h-3" /></Button>
                </div></TableCell>
              </TableRow>
            ))}</TableBody></Table></div>
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          </>
        )}
      </CardContent></Card>
      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={o => { if (!o) setEditUser(null); }}>
        <DialogContent><DialogHeader><DialogTitle>Edit User</DialogTitle><DialogDescription>Change tier, name, or admin access.</DialogDescription></DialogHeader>
        {editUser && <div className="space-y-4 py-2">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><Avatar className="h-10 w-10"><AvatarFallback className="bg-emerald-50 text-emerald-700">{getInitials(editUser.name, editUser.email)}</AvatarFallback></Avatar><div><p className="font-medium text-sm">{editUser.email}</p><p className="text-xs text-gray-500">Status: {editUser.status}</p></div></div>
          <Separator /><div><Label>Name</Label><Input value={editUser.name || ''} onChange={e => setEditUser({ ...editUser, name: e.target.value || null })} /></div>
          <div><Label>Tier</Label><Select value={editUser.tier} onValueChange={v => setEditUser({ ...editUser, tier: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FREE">Free ($0)</SelectItem><SelectItem value="PRO">Pro ($10/mo)</SelectItem><SelectItem value="AGENCY">Agency ($39/mo)</SelectItem></SelectContent></Select></div>
          <div><Label>Grace Period (days)</Label><Input type="number" placeholder="e.g. 7" /><p className="text-xs text-gray-400 mt-1">Adds extra access days for support cases.</p></div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><Label className="text-sm font-medium">Admin Access</Label><p className="text-xs text-gray-500">Full platform management</p></div><button onClick={() => setEditUser({ ...editUser, isAdmin: !editUser.isAdmin })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editUser.isAdmin ? 'bg-emerald-500' : 'bg-gray-200'}`}><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editUser.isAdmin ? 'translate-x-6' : 'translate-x-1'}`} /></button></div>
        </div>}
        <DialogFooter><Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button><Button className="gradient-primary text-white" onClick={saveUser}>Save</Button></DialogFooter></DialogContent>
      </Dialog>
      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete User</AlertDialogTitle><AlertDialogDescription>Permanently remove {deleteTarget?.email} and all their data?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={confirmDeleteUser}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ROOMS TAB
   ════════════════════════════════════════════════════════════════ */
function RoomsTab() {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState(''); const [subjectFilter, setSubjectFilter] = useState('');
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: page.toString(), limit: '15', search, subject: subjectFilter });
      const r = await authFetch(`/api/admin/rooms?${p}`);
      if (r.ok) { const d = await r.json(); setRooms(d.rooms); setTotalPages(d.pagination.totalPages); }
    } catch {} finally { setLoading(false); }
  }, [page, search, subjectFilter]);
  useEffect(() => { load(); }, [load]);

  async function toggleRoom(roomId: string, active: boolean) {
    const r = await authFetch('/api/admin/rooms', { method: 'PATCH', body: JSON.stringify({ roomId, isActive: !active }) });
    if (r.ok) { toast({ title: active ? 'Closed' : 'Opened' }); load(); } else { const d = await r.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); }
  }
  async function forceEnd(roomId: string) {
    const r = await authFetch(`/api/admin/rooms/${roomId}/force-end`, { method: 'POST' });
    if (r.ok) { toast({ title: 'Force Ended', description: 'Session terminated.' }); load(); } else { const d = await r.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); }
  }
  async function deleteRoom() {
    if (!deleteRoomId) return;
    const r = await authFetch(`/api/admin/rooms?roomId=${deleteRoomId}`, { method: 'DELETE' });
    if (r.ok) { toast({ title: 'Deleted' }); setDeleteRoomId(null); load(); } else { const d = await r.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); }
  }

  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4"><div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search rooms..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
        <Select value={subjectFilter} onValueChange={v => { setSubjectFilter(v === 'ALL' ? '' : v); setPage(1); }}><SelectTrigger className="w-36"><SelectValue placeholder="All Subjects" /></SelectTrigger><SelectContent><SelectItem value="ALL">All</SelectItem><SelectItem value="MATH">Math</SelectItem><SelectItem value="SCIENCE">Science</SelectItem><SelectItem value="LANGUAGE">Language</SelectItem><SelectItem value="GENERAL">General</SelectItem></SelectContent></Select>
      </div></CardContent></Card>
      <Card><CardContent className="p-0">
        {loading ? <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div> :
        rooms.length === 0 ? <div className="text-center py-12 text-gray-500"><DoorOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No rooms found</p></div> : (
          <>
            <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-gray-50/50"><TableHead>Room</TableHead><TableHead>Tutor</TableHead><TableHead>Subject</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Participants</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{rooms.map(r => (
              <TableRow key={r.id} className="hover:bg-gray-50/50">
                <TableCell><div className="flex items-center gap-2"><div className="w-2 h-8 rounded-full" style={{ backgroundColor: r.brandingColor || '#059669' }} /><p className="font-mono text-xs text-gray-900">{r.id.slice(0, 8)}...</p></div></TableCell>
                <TableCell><p className="text-sm font-medium">{r.tutor.name || 'No name'}</p><p className="text-xs text-gray-500">{r.tutor.email}</p></TableCell>
                <TableCell><Badge variant="secondary" className="capitalize border-0">{r.subject.toLowerCase()}</Badge></TableCell>
                <TableCell>{r.isActive ? <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-0"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />Active</Badge> : <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-0">Closed</Badge>}</TableCell>
                <TableCell className="hidden md:table-cell"><span className="text-sm text-gray-600">{r._count.participants}</span></TableCell>
                <TableCell className="text-right"><div className="flex items-center justify-end gap-1">
                  {r.isActive && <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-600 hover:bg-red-50" onClick={() => forceEnd(r.id)}><Power className="w-3 h-3 mr-1" />Force End</Button>}
                  <Button variant="ghost" size="sm" className={`h-7 px-2 text-xs ${r.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`} onClick={() => toggleRoom(r.id, r.isActive)}>{r.isActive ? 'Close' : 'Open'}</Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => setDeleteRoomId(r.id)}><Trash2 className="w-3 h-3" /></Button>
                </div></TableCell>
              </TableRow>
            ))}</TableBody></Table></div>
            <Pagination page={page} totalPages={totalPages} setPage={setPage} />
          </>
        )}
      </CardContent></Card>
      <AlertDialog open={!!deleteRoomId} onOpenChange={o => { if (!o) setDeleteRoomId(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Room</AlertDialogTitle><AlertDialogDescription>Permanently remove this room and all its data?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={deleteRoom}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   BILLING TAB
   ════════════════════════════════════════════════════════════════ */
function BillingTab() {
  const { toast } = useToast();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [extendId, setExtendId] = useState<string | null>(null);
  const [extendDays, setExtendDays] = useState(7);

  useEffect(() => {
    (async () => {
      try {
        const [bRes, sRes] = await Promise.all([
          authFetch('/api/admin/billing'),
          authFetch(`/api/admin/subscriptions?page=${page}&limit=15&status=${statusFilter}`),
        ]);
        if (bRes.ok) setBilling(await bRes.json());
        if (sRes.ok) { const d = await sRes.json(); setSubscriptions(d.subscriptions); setTotalPages(d.pagination.totalPages); }
      } catch {} finally { setLoading(false); }
    })();
  }, [page, statusFilter]);

  async function extendSub() {
    if (!extendId) return;
    const r = await authFetch('/api/admin/subscriptions', { method: 'PATCH', body: JSON.stringify({ subscriptionId: extendId, extendDays }) });
    if (r.ok) { toast({ title: 'Extended', description: `Added ${extendDays} days.` }); setExtendId(null); window.location.reload(); }
    else { const d = await r.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); }
  }

  if (loading) return <div className="grid grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-16" /></CardContent></Card>)}</div>;

  return (
    <div className="space-y-6">
      {/* Revenue Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Monthly Recurring Revenue" value={billing ? `$${billing.mrr.toFixed(2)}` : '$0'} subtitle={billing ? `${billing.totalActiveSubscriptions} active` : ''} icon={<CreditCard className="w-5 h-5" />} gradient="stat-gradient-sparkles" />
        <KPICard title="Annual Run Rate" value={billing ? `$${billing.arr.toFixed(0)}` : '$0'} subtitle="Projected annual" icon={<TrendingUp className="w-5 h-5" />} gradient="stat-gradient-video" />
        <KPICard title="Past Due" value={billing?.dunningQueue?.length || 0} subtitle="Need attention" icon={<AlertTriangle className="w-5 h-5" />} gradient="stat-gradient-recordings" />
      </div>
      {/* Plan Breakdown */}
      {billing?.planBreakdown && billing.planBreakdown.length > 0 && (
        <Card><CardHeader><CardTitle className="text-base">Revenue by Plan</CardTitle></CardHeader><CardContent>
          <div className="space-y-3">{billing.planBreakdown.map(p => (
            <div key={p.tier} className="flex items-center justify-between"><span className="text-sm font-medium capitalize">{p.tier}</span><div className="flex items-center gap-4"><span className="text-sm text-gray-500">{p.count} subs</span><span className="text-sm font-semibold">${p.mrr.toFixed(2)}/mo</span></div></div>
          ))}</div>
        </CardContent></Card>
      )}
      {/* Dunning Queue */}
      {billing?.dunningQueue && billing.dunningQueue.length > 0 && (
        <Card className="border-red-200"><CardHeader><CardTitle className="text-base text-red-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Dunning Queue — Failed Payments</CardTitle></CardHeader><CardContent>
          <Table><TableHeader><TableRow><TableHead>User</TableHead><TableHead>Plan</TableHead><TableHead>Period End</TableHead></TableRow></TableHeader><TableBody>
            {billing.dunningQueue.slice(0, 10).map(s => (
              <TableRow key={s.id}><TableCell><p className="text-sm">{s.user?.email}</p><p className="text-xs text-gray-500">{s.user?.name || 'No name'}</p></TableCell><TableCell><Badge variant="secondary" className="bg-red-50 text-red-700 border-0">{s.planName}</Badge></TableCell><TableCell><span className="text-sm">{new Date(s.currentPeriodEnd).toLocaleDateString()}</span></TableCell></TableRow>
            ))}
          </TableBody></Table>
        </CardContent></Card>
      )}
      {/* Subscriptions Directory */}
      <Card><CardHeader><CardTitle className="text-base">All Subscriptions</CardTitle></CardHeader><CardContent className="p-0">
        <div className="px-4 pt-3 pb-2 flex gap-2"><Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1); }}><SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="All Status" /></SelectTrigger><SelectContent><SelectItem value="ALL">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="past_due">Past Due</SelectItem><SelectItem value="canceled">Canceled</SelectItem><SelectItem value="trialing">Trialing</SelectItem></SelectContent></Select></div>
        {subscriptions.length === 0 ? <p className="text-center py-8 text-gray-400">No subscriptions</p> : (
          <><Table><TableHeader><TableRow className="bg-gray-50/50"><TableHead>User</TableHead><TableHead>Plan</TableHead><TableHead>Status</TableHead><TableHead className="hidden sm:table-cell">Amount</TableHead><TableHead className="hidden md:table-cell">Period End</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{subscriptions.map(s => (
            <TableRow key={s.id}><TableCell><p className="text-sm font-medium">{s.user?.email}</p></TableCell><TableCell><Badge variant="secondary" className={`${tierBadgeColor(s.user?.tier || 'FREE')} border-0`}>{s.planName}</Badge></TableCell><TableCell><Badge variant="secondary" className={`border-0 ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700' : s.status === 'past_due' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{s.status.replace('_', ' ')}</Badge></TableCell><TableCell className="hidden sm:table-cell"><span className="text-sm">${(s.amountMonthlyCents / 100).toFixed(2)}</span></TableCell><TableCell className="hidden md:table-cell"><span className="text-xs">{new Date(s.currentPeriodEnd).toLocaleDateString()}</span></TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setExtendId(s.id)}>Extend</Button></TableCell></TableRow>
          ))}</TableBody></Table>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} /></>
        )}
      </CardContent></Card>
      {/* Extend Dialog */}
      <Dialog open={!!extendId} onOpenChange={o => { if (!o) setExtendId(null); }}><DialogContent><DialogHeader><DialogTitle>Extend Subscription</DialogTitle><DialogDescription>Add extra days to this subscription.</DialogDescription></DialogHeader><div className="py-2"><Label>Days to extend</Label><Input type="number" value={extendDays} onChange={e => setExtendDays(parseInt(e.target.value) || 7)} /></div><DialogFooter><Button variant="outline" onClick={() => setExtendId(null)}>Cancel</Button><Button className="gradient-primary text-white" onClick={extendSub}>Extend</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   AUDIT TAB
   ════════════════════════════════════════════════════════════════ */
function AuditTab() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    (async () => {
      try { const r = await authFetch(`/api/admin/audit?page=${page}&limit=30`); if (r.ok) { const d = await r.json(); setLogs(d.logs); setTotalPages(d.pagination.totalPages); } } catch {} finally { setLoading(false); }
    })();
  }, [page]);

  function formatAction(action: string) { return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }
  function getActionColor(action: string) {
    if (action.includes('DELETE') || action.includes('BAN') || action.includes('FORCE_END')) return 'bg-red-50 text-red-700 border-red-200';
    if (action.includes('CREATE') || action.includes('ACTIVATE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (action.includes('UPDATE') || action.includes('CHANGE') || action.includes('TOGGLE') || action.includes('EXTEND')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  }

  return (
    <Card><CardHeader><CardTitle className="text-base">Admin Action Log</CardTitle></CardHeader><CardContent className="p-0">
      {loading ? <div className="p-6 space-y-3">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div> :
      logs.length === 0 ? <p className="text-center py-12 text-gray-400">No actions logged yet.</p> : (
        <>
          <Table><TableHeader><TableRow className="bg-gray-50/50"><TableHead className="w-10"></TableHead><TableHead>Action</TableHead><TableHead>Admin</TableHead><TableHead className="hidden md:table-cell">Target</TableHead><TableHead className="hidden lg:table-cell">Details</TableHead><TableHead className="text-right">Time</TableHead></TableRow></TableHeader>
          <TableBody>{logs.map(l => {
            let meta: any = null; try { meta = l.metadata ? JSON.parse(l.metadata) : null; } catch {}
            return (
              <TableRow key={l.id}><TableCell><ScrollText className="w-4 h-4 text-gray-400" /></TableCell>
              <TableCell><Badge variant="outline" className={`text-xs ${getActionColor(l.action)}`}>{formatAction(l.action)}</Badge></TableCell>
              <TableCell><p className="text-sm">{l.admin?.name || 'Unknown'}</p><p className="text-xs text-gray-500">{l.admin?.email}</p></TableCell>
              <TableCell className="hidden md:table-cell">{l.targetType ? <span className="text-sm text-gray-600">{l.targetType}{l.targetId ? ` (${l.targetId.slice(0, 8)}...)` : ''}</span> : <span className="text-gray-400 text-xs">—</span>}</TableCell>
              <TableCell className="hidden lg:table-cell max-w-[200px]"><p className="text-xs text-gray-500 truncate">{meta ? JSON.stringify(meta) : '—'}</p></TableCell>
              <TableCell className="text-right"><span className="text-xs text-gray-500">{new Date(l.createdAt).toLocaleString()}</span></TableCell>
              </TableRow>
            );
          })}</TableBody></Table>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}
    </CardContent></Card>
  );
}

/* ════════════════════════════════════════════════════════════════
   SETTINGS TAB
   ════════════════════════════════════════════════════════════════ */
function SettingsTab() {
  const { toast } = useToast();
  const [maintenance, setMaintenance] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try { const r = await authFetch('/api/admin/config'); if (r.ok) { const d = await r.json(); setMaintenance(d.maintenanceMode); setAnnouncement(d.announcementText || ''); } } catch {} finally { setLoading(false); }
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const r = await authFetch('/api/admin/config', { method: 'PATCH', body: JSON.stringify({ maintenanceMode: maintenance, announcementText: announcement }) });
      if (r.ok) toast({ title: 'Saved', description: 'Platform settings updated.' });
      else { const d = await r.json(); toast({ title: 'Error', description: d.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Network error', variant: 'destructive' }); } finally { setSaving(false); }
  }

  if (loading) return <Card><CardContent className="p-6"><Skeleton className="h-4 w-48" /><Skeleton className="h-8 w-24 mt-3" /></CardContent></Card>;

  return (
    <div className="space-y-6 max-w-2xl">
      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Maintenance Mode</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"><div><p className="text-sm font-medium">Enable Maintenance Mode</p><p className="text-xs text-gray-500">When on, all users see a maintenance page. Admins can still access the panel.</p></div><Switch checked={maintenance} onCheckedChange={setMaintenance} /></div>
        {maintenance && <div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-700 font-medium">Maintenance mode is ON. Users cannot access the platform.</p></div>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Radio className="w-4 h-4 text-cyan-500" />Announcement Banner</CardTitle></CardHeader><CardContent className="space-y-4">
        <div><Label>Banner Text</Label><Textarea placeholder="Enter a message to display across the platform (e.g., 'Scheduled maintenance on Saturday 2-4 AM')..." value={announcement} onChange={e => setAnnouncement(e.target.value)} rows={3} /><p className="text-xs text-gray-400 mt-1">Leave empty to hide the banner.</p></div>
        {announcement && <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg"><p className="text-sm text-cyan-800 font-medium">Preview: {announcement}</p></div>}
      </CardContent></Card>
      <Button className="gradient-primary text-white" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   TOOLS TAB
   ════════════════════════════════════════════════════════════════ */
function ToolsTab() {
  const { toast } = useToast();

  async function exportCSV() {
    try {
      const r = await authFetch('/api/admin/users/export');
      if (!r.ok) { toast({ title: 'Export Failed', variant: 'destructive' }); return; }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `superboard-users-${new Date().toISOString().split('T')[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast({ title: 'Exported', description: 'CSV downloaded.' });
    } catch { toast({ title: 'Error', description: 'Failed to export.', variant: 'destructive' }); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Download className="w-4 h-4 text-emerald-600" />Export Data</CardTitle></CardHeader><CardContent className="space-y-4">
        <p className="text-sm text-gray-600">Download a CSV of all platform users with their tiers, statuses, and room counts.</p>
        <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" />Export Users as CSV</Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-cyan-600" />Bulk Operations</CardTitle></CardHeader><CardContent className="space-y-3">
        <p className="text-sm text-gray-600">Go to the <strong>Users</strong> tab and select users with checkboxes. Bulk actions will appear in the toolbar.</p>
        <div className="p-3 bg-gray-50 rounded-lg space-y-2"><p className="text-xs font-medium text-gray-500">Available bulk actions:</p><ul className="text-xs text-gray-600 space-y-1"><li>• Change tier for selected users</li><li>• Suspend selected users</li><li>• Activate selected users</li></ul></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-4 h-4 text-amber-600" />Billing Operations</CardTitle></CardHeader><CardContent className="space-y-3">
        <p className="text-sm text-gray-600">Go to the <strong>Billing</strong> tab to:</p>
        <ul className="text-xs text-gray-600 space-y-1"><li>• View MRR/ARR and subscription breakdown</li><li>• Monitor failed payments (dunning queue)</li><li>• Extend subscription periods for support cases</li><li>• Cancel subscriptions</li></ul>
      </CardContent></Card>
    </div>
  );
}
