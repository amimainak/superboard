// ============================================================
// ResourceLibraryPanel — Shared resource library for agencies
// ============================================================
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { subjectMeta } from '@/lib/subject-meta';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FolderOpen,
  Plus,
  Search,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  File,
  Image,
  BookOpen,
  GraduationCap,
  LayoutTemplate,
  Loader2,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface Resource {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subject: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  uploadedByTutorId: string;
}

interface UploadForm {
  name: string;
  description: string;
  category: string;
  subject: string;
  fileUrl: string;
}

const CATEGORIES = [
  { value: 'general', label: 'General', icon: FolderOpen },
  { value: 'worksheet', label: 'Worksheet', icon: FileSpreadsheet },
  { value: 'reference', label: 'Reference', icon: BookOpen },
  { value: 'exam', label: 'Exam', icon: GraduationCap },
  { value: 'template', label: 'Template', icon: LayoutTemplate },
] as const;

const EMPTY_FORM: UploadForm = {
  name: '',
  description: '',
  category: 'general',
  subject: 'MATH',
  fileUrl: '',
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function fileIcon(fileType: string | null) {
  const type = (fileType || '').toLowerCase();
  if (type.includes('pdf') || type.includes('doc')) return FileText;
  if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg') || type.includes('gif') || type.includes('webp') || type.includes('svg')) return Image;
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
  return File;
}

function getCategoryIcon(category: string) {
  return CATEGORIES.find((c) => c.value === category)?.icon || FolderOpen;
}

function inferFileTypeFromUrl(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('.pdf')) return 'application/pdf';
  if (lower.includes('.png') || lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.gif') || lower.includes('.webp') || lower.includes('.svg')) return 'image';
  if (lower.includes('.doc')) return 'document';
  if (lower.includes('.xls') || lower.includes('.csv')) return 'spreadsheet';
  return 'general';
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
type Props = { userId: string; agencyId?: string };

export function ResourceLibraryPanel({ userId }: Props) {
  const { toast } = useToast();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [form, setForm] = useState<UploadForm>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ---- Fetch ----
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch(`/api/resources?limit=100`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setResources(data.resources || []);
    } catch {
      toast({ title: 'Failed to load resources', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // ---- Filter ----
  const filtered = resources.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !(r.description || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (subjectFilter !== 'all' && r.subject !== subjectFilter) return false;
    return true;
  });

  // ---- Upload ----
  const handleUpload = async () => {
    if (!form.name.trim() || !form.fileUrl.trim()) {
      toast({ title: 'Please fill in name and file URL', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const detectedType = inferFileTypeFromUrl(form.fileUrl);
      const res = await authFetch('/api/resources', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          fileType: detectedType,
          fileSize: 0,
        }),
      });
      if (!res.ok) throw new Error('Failed to upload');
      toast({ title: 'Resource uploaded!', description: form.name });
      setForm(EMPTY_FORM);
      setUploadOpen(false);
      fetchResources();
    } catch {
      toast({ title: 'Failed to upload resource', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  // ---- Delete ----
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await authFetch(`/api/resources/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast({ title: 'Resource deleted' });
      setDeleteTarget(null);
      fetchResources();
    } catch {
      toast({ title: 'Failed to delete resource', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  // ---- Download ----
  const handleDownload = async (resource: Resource) => {
    try {
      await authFetch(`/api/resources/${resource.id}`, { method: 'PATCH' });
    } catch { /* silent */ }
    window.open(resource.fileUrl, '_blank', 'noopener,noreferrer');
  };

  // ---- Loading ----
  if (loading) {
    return (
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-emerald-500" />
            Resource Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-gray-50 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-gray-200 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---- Render ----
  return (
    <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-violet-600" />
            </div>
            Resource Library
            {resources.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs font-medium">
                {resources.length}
              </Badge>
            )}
          </CardTitle>

          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm gap-2"
              >
                <Plus className="w-4 h-4" />
                Upload Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" />
                  Upload Resource
                </DialogTitle>
                <DialogDescription>Share a resource with your agency team.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1 block">Name *</Label>
                  <Input
                    placeholder="e.g. Algebra Formulas Cheat Sheet"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1 block">Description</Label>
                  <Textarea
                    placeholder="Brief description..."
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    className="rounded-xl min-h-[70px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1 block">Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1 block">Subject</Label>
                    <Select value={form.subject} onValueChange={(v) => setForm((p) => ({ ...p, subject: v }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(subjectMeta).map(([key, meta]) => (
                          <SelectItem key={key} value={key}>{meta.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1 block">File URL *</Label>
                  <Input
                    placeholder="https://example.com/resource.pdf"
                    value={form.fileUrl}
                    onChange={(e) => setForm((p) => ({ ...p, fileUrl: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm gap-2"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Upload Resource
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {resources.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">No resources yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Upload your first resource to share with your team.
            </p>
            <Button
              onClick={() => setUploadOpen(true)}
              className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 text-sm gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Upload Resource
            </Button>
          </div>
        ) : (
          <>
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-xl pl-9 h-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[130px] rounded-xl h-9 text-sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-[130px] rounded-xl h-9 text-sm">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {Object.entries(subjectMeta).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>{meta.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resource Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-8">
                <Filter className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No resources match your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {filtered.map((resource) => {
                  const FIcon = fileIcon(resource.fileType);
                  const CatIcon = getCategoryIcon(resource.category);
                  const meta = subjectMeta[resource.subject] || subjectMeta.GENERAL;
                  const isOwner = resource.uploadedByTutorId === userId;
                  const catLabel = CATEGORIES.find((c) => c.value === resource.category)?.label || resource.category;

                  return (
                    <div
                      key={resource.id}
                      className="group rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-emerald-50/30 hover:border-emerald-200/60 p-4 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <FIcon className="w-5 h-5 text-emerald-600" />
                        </div>
                        {isOwner && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-opacity"
                            onClick={() => setDeleteTarget(resource)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
                        {resource.name}
                      </h4>
                      {resource.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {resource.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 rounded-full font-medium">
                          {meta.label}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-full font-medium">
                          {catLabel}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {resource.downloadCount}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-emerald-600 hover:bg-emerald-100"
                          onClick={() => handleDownload(resource)}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white border-0"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
