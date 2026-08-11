// ============================================================
// InvoicePanel — Invoice management for agencies
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  Receipt,
  Plus,
  Loader2,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Send,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface Invoice {
  id: string;
  invoiceNumber: string;
  description: string | null;
  student: { id: string; name: string; email: string } | null;
  amountCents: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  lessonHours: number;
  ratePerHourCents: number;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  paidAt: string | null;
  paidAmountCents: number | null;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StudentOption {
  id: string;
  name: string;
  email: string;
}

interface InvoiceForm {
  studentId: string;
  ratePerHour: number;
  hours: number;
  periodStart: string;
  periodEnd: string;
  notes: string;
  dueDate: string;
}

const STATUS_OPTIONS = ['ALL', 'DRAFT', 'SENT', 'PAID', 'OVERDUE'] as const;

const EMPTY_FORM: InvoiceForm = {
  studentId: '',
  ratePerHour: 50,
  hours: 1,
  periodStart: '',
  periodEnd: '',
  notes: '',
  dueDate: '',
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function statusBadge(status: Invoice['status']) {
  const map: Record<Invoice['status'], { cls: string; label: string }> = {
    DRAFT: {
      cls: 'bg-gray-100 text-gray-600 hover:bg-gray-100 text-[10px] px-2 py-0 rounded-full font-medium',
      label: 'Draft',
    },
    SENT: {
      cls: 'bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] px-2 py-0 rounded-full font-medium',
      label: 'Sent',
    },
    PAID: {
      cls: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-[10px] px-2 py-0 rounded-full font-medium',
      label: 'Paid',
    },
    OVERDUE: {
      cls: 'bg-red-100 text-red-600 hover:bg-red-100 text-[10px] px-2 py-0 rounded-full font-medium',
      label: 'Overdue',
    },
    CANCELLED: {
      cls: 'bg-gray-100 text-gray-400 hover:bg-gray-100 text-[10px] px-2 py-0 rounded-full font-medium',
      label: 'Cancelled',
    },
  };
  const { cls, label } = map[status];
  return <Badge className={cls}>{label}</Badge>;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatPeriodLabel(start: string | null, end: string | null): string {
  if (!start && !end) return '—';
  const s = start ? new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '?';
  const e = end ? new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '?';
  return `${s} – ${e}`;
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
type Props = { userId: string; agencyId?: string };

export function InvoicePanel({ userId }: Props) {
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<InvoiceForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  // Action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ---- Fetch invoices ----
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/invoices?limit=100');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch {
      toast({ title: 'Failed to load invoices', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // ---- Fetch students ----
  const fetchStudents = useCallback(async () => {
    try {
      const res = await authFetch('/api/agency/students?status=active&limit=200');
      if (!res.ok) return;
      const data = await res.json();
      setStudents((data.students || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email,
      })));
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchStudents();
  }, [fetchInvoices, fetchStudents]);

  // ---- Stats ----
  const totalInvoiced = invoices.filter((i) => i.status !== 'CANCELLED').reduce((s, i) => s + i.amountCents, 0);
  const totalPaid = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.amountCents, 0);
  const outstanding = invoices.filter((i) => i.status === 'SENT').reduce((s, i) => s + i.amountCents, 0);
  const overdue = invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.amountCents, 0);

  // ---- Filter ----
  const filtered = statusFilter === 'ALL'
    ? invoices
    : invoices.filter((i) => i.status === statusFilter);

  // ---- Auto-calculate ----
  const calculatedTotal = (form.ratePerHour || 0) * (form.hours || 0);
  const calculatedCents = Math.round(calculatedTotal * 100);

  // ---- Create ----
  const handleCreate = async () => {
    if (!form.studentId || !form.periodStart || !form.periodEnd || !form.dueDate) {
      toast({ title: 'Please fill in student, period dates, and due date', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const res = await authFetch('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          studentId: form.studentId,
          amountCents: calculatedCents,
          lessonHours: form.hours,
          ratePerHourCents: Math.round(form.ratePerHour * 100),
          billingPeriodStart: new Date(form.periodStart).toISOString(),
          billingPeriodEnd: new Date(form.periodEnd).toISOString(),
          dueDate: new Date(form.dueDate).toISOString(),
          notes: form.notes || null,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(body || 'Failed to create invoice');
      }
      toast({ title: 'Invoice created!', description: `${formatCurrency(calculatedCents)}` });
      setForm(EMPTY_FORM);
      setCreateOpen(false);
      fetchInvoices();
    } catch (err: any) {
      toast({ title: 'Failed to create invoice', description: err?.message || '', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  // ---- Mark sent ----
  const handleMarkSent = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await authFetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'SENT' }),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Invoice marked as sent' });
      fetchInvoices();
    } catch {
      toast({ title: 'Failed to update invoice', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Mark paid ----
  const handleMarkPaid = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await authFetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ markPaid: true }),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Invoice marked as paid' });
      fetchInvoices();
    } catch {
      toast({ title: 'Failed to update invoice', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Download receipt ----
  const handleDownload = (invoice: Invoice) => {
    const periodLabel = formatPeriodLabel(invoice.billingPeriodStart, invoice.billingPeriodEnd);
    const text = `
================================
       INVOICE RECEIPT
================================

Invoice #: ${invoice.invoiceNumber}
Student:   ${invoice.student?.name || 'N/A'}
Period:    ${periodLabel}
Due Date:  ${formatDate(invoice.dueDate)}

Hours:     ${invoice.lessonHours}
Rate:      ${formatCurrency(invoice.ratePerHourCents)}

--------------------------------
TOTAL:     ${formatCurrency(invoice.amountCents)}
================================

Status:    ${invoice.status}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}

Generated by SuperBoard
    `;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- Loading ----
  if (loading) {
    return (
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-500" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-xl bg-muted/50 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-12 mb-2" />
                <div className="h-5 bg-gray-200 rounded w-20" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---- Stats Cards ----
  const stats = [
    { label: 'Total Invoiced', value: formatCurrency(totalInvoiced), icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Paid', value: formatCurrency(totalPaid), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Outstanding', value: formatCurrency(outstanding), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Overdue', value: formatCurrency(overdue), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  // ---- Render ----
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-blue-600" />
            </div>
            Invoices
            {invoices.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs font-medium">
                {invoices.length}
              </Badge>
            )}
          </CardTitle>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" />
                  Create Invoice
                </DialogTitle>
                <DialogDescription>Generate a new invoice for a student.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1 block">Student *</Label>
                  <Select value={form.studentId} onValueChange={(v) => setForm((p) => ({ ...p, studentId: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select student" /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-1 block">Rate / Hour ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.ratePerHour}
                      onChange={(e) => setForm((p) => ({ ...p, ratePerHour: parseFloat(e.target.value) || 0 }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-1 block">Hours</Label>
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={form.hours}
                      onChange={(e) => setForm((p) => ({ ...p, hours: parseFloat(e.target.value) || 0 }))}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-700">Calculated Total</span>
                  <span className="text-lg font-bold text-emerald-700">{formatCurrency(calculatedCents)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-1 block">Period Start *</Label>
                    <Input
                      type="date"
                      value={form.periodStart}
                      onChange={(e) => setForm((p) => ({ ...p, periodStart: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-1 block">Period End *</Label>
                    <Input
                      type="date"
                      value={form.periodEnd}
                      onChange={(e) => setForm((p) => ({ ...p, periodEnd: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1 block">Due Date *</Label>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-1 block">Notes</Label>
                  <Textarea
                    placeholder="Additional notes..."
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    className="rounded-xl min-h-[60px]"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Invoice
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {stats.map((stat) => (
            <div key={stat.label} className={`rounded-xl p-3 ${stat.bg}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</span>
              </div>
              <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-card-foreground">No invoices yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first invoice.</p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </Button>
          </div>
        ) : (
          <>
            {/* Status filter */}
            <div className="flex items-center gap-1.5 mb-4 flex-wrap">
              {STATUS_OPTIONS.map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? 'default' : 'outline'}
                  size="sm"
                  className={`rounded-lg text-[11px] h-7 px-2.5 ${statusFilter === s ? 'gradient-primary border-0 text-white' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No invoices match this filter.</p>
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden max-h-[360px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold text-xs">Invoice #</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-xs hidden sm:table-cell">Student</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-xs">Amount</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-xs">Status</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-xs hidden md:table-cell">Period</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-xs hidden lg:table-cell">Due Date</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inv) => (
                      <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-medium">{inv.invoiceNumber}</span>
                        </td>
                        <td className="px-4 py-3 text-xs hidden sm:table-cell">
                          <div>
                            <p className="font-medium">{inv.student?.name || '—'}</p>
                            <p className="text-[10px] text-muted-foreground">{inv.student?.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-xs">{formatCurrency(inv.amountCents)}</td>
                        <td className="px-4 py-3">{statusBadge(inv.status)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                          {formatPeriodLabel(inv.billingPeriodStart, inv.billingPeriodEnd)}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{formatDate(inv.dueDate)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {inv.status === 'DRAFT' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[11px] text-blue-600 hover:bg-blue-50"
                                disabled={actionLoading === inv.id}
                                onClick={() => handleMarkSent(inv.id)}
                              >
                                {actionLoading === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                                Send
                              </Button>
                            )}
                            {(inv.status === 'SENT' || inv.status === 'OVERDUE') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-[11px] text-emerald-600 hover:bg-emerald-50"
                                disabled={actionLoading === inv.id}
                                onClick={() => handleMarkPaid(inv.id)}
                              >
                                {actionLoading === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                                Paid
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 rounded-lg hover:bg-gray-100"
                              title="Download receipt"
                              onClick={() => handleDownload(inv)}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
