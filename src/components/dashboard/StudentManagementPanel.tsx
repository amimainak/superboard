// ============================================================
// Student Management Panel
// ============================================================
// Agency owners can view, add, import, deactivate, and reactivate
// students from their roster. Used inside AgencyAdminPanel.
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import type { StudentRow } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  Upload,
  UserCheck,
  UserX,
  Trash2,
  RefreshCw,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function StudentManagementPanel({ agencyUserId }: { agencyUserId: string }) {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 20;

  // Add student dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Import dialog
  const [importOpen, setImportOpen] = useState(false);
  const [importCsv, setImportCsv] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    reactivated: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Action confirmations
  const [confirmAction, setConfirmAction] = useState<{ type: string; studentId: string; studentName: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadStudents = useCallback(() => {
    if (!agencyUserId) return;
    setLoading(true);
    authFetch(
      `/api/agency/students?status=${statusFilter}&page=${page}&limit=${limit}`
    )
      .then((res) => res.json())
      .then((data) => {
        setStudents(data.students || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [agencyUserId, statusFilter, page]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleAddStudent = async () => {
    const email = addEmail.trim().toLowerCase();
    const name = addName.trim();
    if (!email || !name) return;

    setAddError('');
    setAddSuccess(null);
    setAddLoading(true);

    try {
      const res = await authFetch('/api/agency/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAddError(data.message || data.error || 'Failed to add student');
        return;
      }

      setAddSuccess(
        data.reactivated
          ? `${name} (${email}) has been reactivated.`
          : `${name} (${email}) has been added to your roster.`
      );
      setAddEmail('');
      setAddName('');
      loadStudents();
    } catch {
      setAddError('Network error. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importCsv.trim()) return;

    setImportLoading(true);
    setImportResult(null);

    try {
      const res = await authFetch('/api/agency/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: importCsv }),
      });
      const data = await res.json();

      if (!res.ok) {
        setImportResult({
          imported: 0,
          reactivated: 0,
          failed: 0,
          errors: [data.message || data.error || 'Import failed'],
        });
        return;
      }

      setImportResult({
        imported: data.imported || 0,
        reactivated: data.reactivated || 0,
        failed: data.failed || 0,
        errors: data.errors || [],
      });
      setImportCsv('');
      loadStudents();
    } catch {
      setImportResult({
        imported: 0,
        reactivated: 0,
        failed: 0,
        errors: ['Network error. Please try again.'],
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleToggleActive = async (studentId: string, currentIsActive: boolean) => {
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/agency/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentIsActive }),
      });
      if (res.ok) {
        loadStudents();
      }
    } catch {
      /* silent */
    }
    setActionLoading(false);
    setConfirmAction(null);
  };

  const handleDelete = async (studentId: string) => {
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/agency/students/${studentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadStudents();
      }
    } catch {
      /* silent */
    }
    setActionLoading(false);
    setConfirmAction(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-sm text-muted-foreground">Loading students...</span>
      </div>
    );
  }

  const activeCount = statusFilter === 'all' ? null : totalCount;

  return (
    <div className="space-y-5">
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px] rounded-xl h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          {activeCount !== null && (
            <span className="text-xs text-muted-foreground">{activeCount} students</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Add Single Student */}
          <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) { setAddError(''); setAddSuccess(null); } }}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-md shadow-emerald-500/20 text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg">Register Student</DialogTitle>
                <DialogDescription>Add a student to your agency roster.</DialogDescription>
              </DialogHeader>
              {addSuccess ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-sm text-emerald-800">{addSuccess}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email</Label>
                    <Input
                      type="email"
                      placeholder="student@example.com"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Full Name</Label>
                    <Input
                      placeholder="John Doe"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
                      className="rounded-xl"
                    />
                  </div>
                  {addError && (
                    <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{addError}</p>
                  )}
                  <Button
                    className="w-full rounded-xl gradient-primary border-0 text-white font-semibold"
                    onClick={handleAddStudent}
                    disabled={addLoading || !addEmail.trim() || !addName.trim()}
                  >
                    {addLoading ? 'Registering...' : 'Register Student'}
                  </Button>
                </div>
              )}
              {addSuccess && (
                <Button variant="outline" className="w-full mt-2" onClick={() => { setAddSuccess(null); }}>
                  Add Another
                </Button>
              )}
            </DialogContent>
          </Dialog>

          {/* Bulk Import */}
          <Dialog open={importOpen} onOpenChange={(open) => { setImportOpen(open); if (!open) { setImportResult(null); setImportCsv(''); } }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Bulk Import
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg">Bulk Import Students</DialogTitle>
                <DialogDescription>Paste CSV data with one student per line: email,name</DialogDescription>
              </DialogHeader>
              {importResult ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-2">
                    <p className="text-sm font-medium text-emerald-800">
                      Import complete
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-2xl font-bold text-emerald-600">{importResult.imported}</p>
                        <p className="text-xs text-emerald-700">Imported</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{importResult.reactivated}</p>
                        <p className="text-xs text-blue-700">Reactivated</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                        <p className="text-xs text-red-700">Failed</p>
                      </div>
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 max-h-40 overflow-y-auto">
                      <p className="text-xs font-medium text-amber-800 mb-1">Errors:</p>
                      {importResult.errors.map((err, i) => (
                        <p key={i} className="text-xs text-amber-700">{err}</p>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => setImportResult(null)}>
                    Import More
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    className="w-full h-40 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder={"john@example.com,John Doe\njane@example.com,Jane Smith\nalice@example.com,Alice Johnson"}
                    value={importCsv}
                    onChange={(e) => setImportCsv(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: one student per line, email and name separated by a comma.
                    Duplicate active emails will be skipped.
                  </p>
                  <Button
                    className="w-full rounded-xl gradient-primary border-0 text-white font-semibold"
                    onClick={handleImport}
                    disabled={importLoading || !importCsv.trim()}
                  >
                    {importLoading ? 'Importing...' : 'Import Students'}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Student Table */}
      {students.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Users className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-muted-foreground font-medium">No students found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {statusFilter === 'active'
              ? 'Register your first student to get started'
              : statusFilter === 'inactive'
              ? 'No deactivated students'
              : 'Add students to your roster'}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Student</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Lessons</th>
                <th className="text-right px-4 py-3 font-semibold">Last Seen</th>
                <th className="text-right px-4 py-3 font-semibold">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {student.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px] rounded-full border-0">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] rounded-full text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {student.lessonsAttended || 0}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                    {student.lastSeen
                      ? new Date(student.lastSeen).toLocaleDateString()
                      : '\u2014'}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                    {new Date(student.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {confirmAction?.studentId === student.id ? (
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-xs text-red-500 mr-1">Sure?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs px-2"
                          disabled={actionLoading}
                          onClick={() => {
                            if (confirmAction.type === 'deactivate' || confirmAction.type === 'reactivate') {
                              handleToggleActive(student.id, student.isActive);
                            } else {
                              handleDelete(student.id);
                            }
                          }}
                        >
                          {actionLoading ? '...' : 'Yes'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs px-2"
                          onClick={() => setConfirmAction(null)}
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 justify-end">
                        {student.isActive ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-muted-foreground hover:text-amber-600"
                            title="Deactivate"
                            onClick={() =>
                              setConfirmAction({
                                type: 'deactivate',
                                studentId: student.id,
                                studentName: student.name,
                              })
                            }
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-muted-foreground hover:text-emerald-600"
                            title="Reactivate"
                            onClick={() =>
                              setConfirmAction({
                                type: 'reactivate',
                                studentId: student.id,
                                studentName: student.name,
                              })
                            }
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground hover:text-red-600"
                          title="Remove"
                          onClick={() =>
                            setConfirmAction({
                              type: 'delete',
                              studentId: student.id,
                              studentName: student.name,
                            })
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
