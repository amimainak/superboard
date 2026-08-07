// ============================================================
// Admin Control Panel — Full Dashboard
// ============================================================
// A high-level control panel for the platform owner to manage
// users, rooms, tiers, and view platform analytics.
// No coding knowledge required — everything via UI.
// ============================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { useToast } from '@/hooks/use-toast';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Users, LayoutDashboard, DoorOpen, Shield, Search, Plus,
  Trash2, Edit, ChevronLeft, ChevronRight, TrendingUp,
  Activity, Video, FileText, GraduationCap, Eye, Ban,
  UserCog, BarChart3, Clock, ArrowUpRight,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================
interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  tier: string;
  isAdmin: boolean;
  parentAgencyId: string | null;
  customDomain: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { rooms: number; templates: number; subTutors: number; sentInvites: number };
}

interface AdminRoom {
  id: string;
  subject: string;
  isActive: boolean;
  brandingLogo: string | null;
  brandingColor: string | null;
  createdAt: string;
  updatedAt: string;
  tutor: { id: string; name: string | null; email: string; tier: string };
  _count: { pages: number; participants: number; recordings: number };
}

interface PlatformStats {
  overview: {
    totalUsers: number;
    recentUsers: number;
    totalRooms: number;
    activeRooms: number;
    totalTemplates: number;
    totalRecordings: number;
    totalParticipants: number;
  };
  usersByTier: { tier: string; count: number }[];
  roomsBySubject: { subject: string; count: number }[];
  usage: {
    aiCreditsTotal: number;
    videoMinutesTotal: number;
    recordingsTotal: number;
  };
  dailySignups: { createdAt: Date; _count: { createdAt: number } }[];
}

// ============================================================
// Main Admin Panel Component
// ============================================================
export default function AdminPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Control Panel</h1>
              <p className="text-xs text-gray-500">Superboard Platform Management</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <Shield className="w-3 h-3 mr-1" />
            Admin Access
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 h-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 px-4 py-2">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="rooms" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 px-4 py-2">
              <DoorOpen className="w-4 h-4 mr-2" />
              Rooms
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
          <TabsContent value="rooms">
            <RoomsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================================
// Overview Tab — Platform Statistics
// ============================================================
function OverviewTab() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const res = await authFetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return <div className="text-center py-12 text-gray-500">Failed to load statistics.</div>;

  const { overview, usersByTier, roomsBySubject, usage } = stats;

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Users"
          value={overview.totalUsers}
          subtitle={`${overview.recentUsers} new this month`}
          icon={<Users className="w-5 h-5" />}
          gradient="stat-gradient-sparkles"
        />
        <KPICard
          title="Active Rooms"
          value={overview.activeRooms}
          subtitle={`${overview.totalRooms} total rooms`}
          icon={<DoorOpen className="w-5 h-5" />}
          gradient="stat-gradient-video"
        />
        <KPICard
          title="AI Credits Used"
          value={usage.aiCreditsTotal.toLocaleString()}
          subtitle="All-time usage"
          icon={<Activity className="w-5 h-5" />}
          gradient="stat-gradient-recordings"
        />
        <KPICard
          title="Total Participants"
          value={overview.totalParticipants}
          subtitle="Unique students"
          icon={<GraduationCap className="w-5 h-5" />}
          gradient="stat-gradient-sparkles"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Video Minutes"
          value={usage.videoMinutesTotal.toLocaleString()}
          subtitle="All-time"
          icon={<Video className="w-5 h-5" />}
          gradient="stat-gradient-video"
        />
        <KPICard
          title="Recordings"
          value={overview.totalRecordings}
          subtitle="All lesson recordings"
          icon={<FileText className="w-5 h-5" />}
          gradient="stat-gradient-recordings"
        />
        <KPICard
          title="Templates"
          value={overview.totalTemplates}
          subtitle="Saved board layouts"
          icon={<LayoutDashboard className="w-5 h-5" />}
          gradient="stat-gradient-sparkles"
        />
        <KPICard
          title="Growth Rate"
          value={overview.totalUsers > 0 ? `${Math.round((overview.recentUsers / overview.totalUsers) * 100)}%` : '0%'}
          subtitle="30-day user growth"
          icon={<TrendingUp className="w-5 h-5" />}
          gradient="stat-gradient-video"
        />
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Tier */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Users by Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usersByTier.map((item) => {
                const pct = overview.totalUsers > 0 ? (item.count / overview.totalUsers) * 100 : 0;
                const colors: Record<string, string> = {
                  FREE: 'bg-emerald-500',
                  PRO: 'bg-cyan-500',
                  AGENCY: 'bg-amber-500',
                };
                return (
                  <div key={item.tier}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">{item.tier}</span>
                      <span className="text-sm text-gray-500">{item.count} users ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colors[item.tier] || 'bg-gray-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {usersByTier.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No users yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rooms by Subject */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-600" />
              Rooms by Subject
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roomsBySubject.map((item) => {
                const pct = overview.totalRooms > 0 ? (item.count / overview.totalRooms) * 100 : 0;
                const colors: Record<string, string> = {
                  MATH: 'bg-emerald-500',
                  SCIENCE: 'bg-teal-500',
                  LANGUAGE: 'bg-cyan-500',
                  GENERAL: 'bg-lime-500',
                };
                return (
                  <div key={item.subject}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700 capitalize">{item.subject.toLowerCase()}</span>
                      <span className="text-sm text-gray-500">{item.count} rooms ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colors[item.subject] || 'bg-gray-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {roomsBySubject.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No rooms yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// Users Tab — User Management
// ============================================================
function UsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', tier: 'FREE' });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search,
        tier: tierFilter,
      });
      const res = await authFetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, tierFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Add user
  async function handleAddUser() {
    try {
      const res = await authFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        toast({ title: 'User created', description: `${newUser.email} added successfully.` });
        setShowAddDialog(false);
        setNewUser({ email: '', name: '', tier: 'FREE' });
        loadUsers();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to create user.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
  }

  // Update user tier
  async function handleUpdateUser() {
    if (!editUser) return;
    try {
      const res = await authFetch(`/api/admin/users/${editUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ tier: editUser.tier, name: editUser.name, isAdmin: editUser.isAdmin }),
      });
      if (res.ok) {
        toast({ title: 'User updated', description: `${editUser.email} updated successfully.` });
        setEditUser(null);
        loadUsers();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to update user.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
  }

  // Delete user
  async function handleDeleteUser() {
    if (!deleteUser) return;
    try {
      const res = await authFetch(`/api/admin/users/${deleteUser.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'User deleted', description: `${deleteUser.email} has been removed.` });
        setDeleteUser(null);
        loadUsers();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || 'Failed to delete user.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
  }

  function getInitials(name: string | null, email: string) {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email[0].toUpperCase();
  }

  function getTierBadge(tier: string) {
    const variants: Record<string, { bg: string; text: string }> = {
      FREE: { bg: 'bg-gray-100', text: 'text-gray-700' },
      PRO: { bg: 'bg-cyan-50', text: 'text-cyan-700' },
      AGENCY: { bg: 'bg-amber-50', text: 'text-amber-700' },
    };
    const v = variants[tier] || variants.FREE;
    return <Badge variant="secondary" className={`${v.bg} ${v.text} border-0`}>{tier}</Badge>;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by email or name..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
              <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v === 'ALL' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Tiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Tiers</SelectItem>
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="AGENCY">Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Create a new user account on the platform.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-email">Email</Label>
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="user@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-name">Name (optional)</Label>
                    <Input
                      id="new-name"
                      placeholder="John Doe"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-tier">Tier</Label>
                    <Select value={newUser.tier} onValueChange={(v) => setNewUser({ ...newUser, tier: v })}>
                      <SelectTrigger id="new-tier">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FREE">Free</SelectItem>
                        <SelectItem value="PRO">Pro</SelectItem>
                        <SelectItem value="AGENCY">Agency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                  <Button className="gradient-primary text-white" onClick={handleAddUser} disabled={!newUser.email}>
                    Create User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No users found</p>
              {search && <p className="text-sm mt-1">Try a different search term</p>}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="w-12"></TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="hidden sm:table-cell">Role</TableHead>
                      <TableHead className="hidden md:table-cell">Rooms</TableHead>
                      <TableHead className="hidden lg:table-cell">Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs font-medium bg-emerald-50 text-emerald-700">
                              {getInitials(user.name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{user.name || 'No name'}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getTierBadge(user.tier)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {user.isAdmin ? (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-0">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">User</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-gray-600">{user._count.rooms}</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditUser({ ...user })}
                              title="Edit user"
                            >
                              <Edit className="w-3.5 h-3.5 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteUser(user)}
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Change user details, tier, or admin status.</DialogDescription>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-emerald-50 text-emerald-700">
                    {getInitials(editUser.name, editUser.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{editUser.email}</p>
                  <p className="text-xs text-gray-500">ID: {editUser.id.slice(0, 8)}...</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="edit-name">Display Name</Label>
                <Input
                  id="edit-name"
                  value={editUser.name || ''}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value || null })}
                  placeholder="Enter display name"
                />
              </div>
              <div className="space-y-2">
                <Label>Subscription Tier</Label>
                <Select value={editUser.tier} onValueChange={(v) => setEditUser({ ...editUser, tier: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        Free ($0/mo)
                      </span>
                    </SelectItem>
                    <SelectItem value="PRO">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-500" />
                        Pro ($10/mo)
                      </span>
                    </SelectItem>
                    <SelectItem value="AGENCY">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Agency ($39/mo)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">
                  Changing the tier here updates the database directly. If the user has a Stripe subscription, it will not be affected.
                </p>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Admin Access</Label>
                  <p className="text-xs text-gray-500">Full platform management permissions</p>
                </div>
                <button
                  onClick={() => setEditUser({ ...editUser, isAdmin: !editUser.isAdmin })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editUser.isAdmin ? 'bg-emerald-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editUser.isAdmin ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Rooms</p>
                  <p className="text-sm font-semibold">{editUser._count.rooms}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Templates</p>
                  <p className="text-sm font-semibold">{editUser._count.templates}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sub-tutors</p>
                  <p className="text-sm font-semibold">{editUser._count.subTutors}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Invites Sent</p>
                  <p className="text-sm font-semibold">{editUser._count.sentInvites}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button className="gradient-primary text-white" onClick={handleUpdateUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => { if (!open) setDeleteUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteUser?.email}</strong>? This will permanently remove the user and all their data including rooms, templates, and usage logs. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDeleteUser}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// Rooms Tab — Room Management
// ============================================================
function RoomsTab() {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [closeRoomId, setCloseRoomId] = useState<string | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        search,
        subject: subjectFilter,
      });
      const res = await authFetch(`/api/admin/rooms?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, subjectFilter]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  async function handleToggleRoom(roomId: string, currentActive: boolean) {
    try {
      const res = await authFetch('/api/admin/rooms', {
        method: 'PATCH',
        body: JSON.stringify({ roomId, isActive: !currentActive }),
      });
      if (res.ok) {
        toast({
          title: currentActive ? 'Room Closed' : 'Room Opened',
          description: `Room has been ${currentActive ? 'deactivated' : 'activated'}.`,
        });
        loadRooms();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
  }

  async function handleDeleteRoom() {
    if (!deleteRoomId) return;
    try {
      const res = await authFetch(`/api/admin/rooms?roomId=${deleteRoomId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Room Deleted', description: 'Room and all its data have been removed.' });
        setDeleteRoomId(null);
        loadRooms();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Network error', variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search rooms or tutors..."
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={subjectFilter} onValueChange={(v) => { setSubjectFilter(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Subjects</SelectItem>
                <SelectItem value="MATH">Math</SelectItem>
                <SelectItem value="SCIENCE">Science</SelectItem>
                <SelectItem value="LANGUAGE">Language</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Rooms Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DoorOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No rooms found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead>Room</TableHead>
                      <TableHead>Tutor</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Participants</TableHead>
                      <TableHead className="hidden lg:table-cell">Pages</TableHead>
                      <TableHead className="hidden lg:table-cell">Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-8 rounded-full"
                              style={{ backgroundColor: room.brandingColor || '#059669' }}
                            />
                            <div>
                              <p className="font-mono text-xs text-gray-900">{room.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{room.tutor.name || 'No name'}</p>
                          <p className="text-xs text-gray-500">{room.tutor.email}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize border-0">
                            {room.subject.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {room.isActive ? (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-0">
                              Closed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-gray-600">{room._count.participants}</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-gray-600">{room._count.pages}</span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-gray-500">
                            {new Date(room.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 px-3 text-xs ${
                                room.isActive
                                  ? 'text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              onClick={() => handleToggleRoom(room.id, room.isActive)}
                            >
                              {room.isActive ? (
                                <>
                                  <Ban className="w-3.5 h-3.5 mr-1" />
                                  Close
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5 mr-1" />
                                  Open
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setDeleteRoomId(room.id)}
                              title="Delete room"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Room Confirmation */}
      <AlertDialog open={!!deleteRoomId} onOpenChange={(open) => { if (!open) setDeleteRoomId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this room? This will permanently remove the room, all its whiteboard pages, participant records, and recordings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDeleteRoom}
            >
              Delete Room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// KPI Card Component
// ============================================================
function KPICard({ title, value, subtitle, icon, gradient }: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <Card className="card-hover overflow-hidden">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg ${gradient} flex items-center justify-center text-white`}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
