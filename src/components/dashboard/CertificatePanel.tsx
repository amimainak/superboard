// ============================================================
// CertificatePanel — Issue + list certificates
// ============================================================

'use client'

import { useEffect, useState, useCallback } from 'react'
import { authFetch } from '@/lib/auth-fetch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Award, Plus, Loader2, Download, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Certificate {
  id: string
  studentId: string | null
  studentName: string
  templateId: string
  title: string
  subtitle: string | null
  issuedAt: string
}

interface StudentOption {
  id: string
  name: string | null
  email: string
}

interface TemplateOption {
  id: string
  name: string
  description: string
  defaultTitle: string
  defaultSubtitle: string
}

const TEMPLATES: TemplateOption[] = [
  { id: 'milestone', name: 'Milestone', description: 'For reaching a lesson count milestone', defaultTitle: '10-Lesson Milestone', defaultSubtitle: 'Awarded for completing 10 lessons' },
  { id: 'mastery', name: 'Subject Mastery', description: 'For mastering a topic', defaultTitle: 'Subject Mastery', defaultSubtitle: 'Awarded for demonstrating mastery' },
  { id: 'streak', name: 'Streak', description: 'For a consistent lesson streak', defaultTitle: 'Lesson Streak', defaultSubtitle: 'Awarded for consistent practice' },
  { id: 'improvement', name: 'Most Improved', description: 'For notable improvement', defaultTitle: 'Most Improved', defaultSubtitle: 'Awarded for outstanding progress' },
  { id: 'term', name: 'End of Term', description: 'For completing a term', defaultTitle: 'End of Term Certificate', defaultSubtitle: 'Awarded for completing the term' },
]

export function CertificatePanel() {
  const { toast } = useToast()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [issuing, setIssuing] = useState(false)

  const [form, setForm] = useState({
    studentId: '',
    studentName: '',
    templateId: '',
    title: '',
    subtitle: '',
    photoUrl: '',
    photoConsent: false,
  })

  const fetchAll = useCallback(async () => {
    try {
      const [certsRes, studentsRes] = await Promise.all([
        authFetch('/api/certificates/list'),
        authFetch('/api/agency/students?status=active&limit=200'),
      ])
      const certsData = await certsRes.json()
      const studentsData = await studentsRes.json()
      setCertificates(certsData.certificates || [])
      setStudents(studentsData.students || [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchAll().finally(() => setLoading(false))
  }, [fetchAll])

  const handleTemplateChange = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId)
    setForm(prev => ({
      ...prev,
      templateId,
      title: template?.defaultTitle || '',
      subtitle: template?.defaultSubtitle || '',
    }))
  }

  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => s.id === studentId)
    setForm(prev => ({
      ...prev,
      studentId,
      studentName: student?.name || student?.email || '',
    }))
  }

  const handleIssue = async () => {
    if (!form.studentName.trim() || !form.templateId || !form.title.trim()) {
      toast({ title: 'Please fill in student, template, and title', variant: 'destructive' })
      return
    }
    if (form.photoUrl && !form.photoConsent) {
      toast({ title: 'Photo consent required when using a photo', variant: 'destructive' })
      return
    }
    setIssuing(true)
    try {
      const res = await authFetch('/api/certificates/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: form.studentId || undefined,
          studentName: form.studentName,
          templateId: form.templateId,
          title: form.title,
          subtitle: form.subtitle || null,
          photoUrl: form.photoUrl || null,
          photoConsent: form.photoConsent,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed')
      }
      const { certificate } = await res.json()
      toast({ title: 'Certificate issued!', description: certificate.title })
      setCreateOpen(false)
      setForm({ studentId: '', studentName: '', templateId: '', title: '', subtitle: '', photoUrl: '', photoConsent: false })
      fetchAll()
    } catch (e: unknown) {
      toast({ title: 'Failed to issue', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    } finally {
      setIssuing(false)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-2xl border border-border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Certificates
            {certificates.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{certificates.length}</Badge>}
          </CardTitle>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl gradient-primary border-0 text-white text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Issue
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" /> Issue Certificate</DialogTitle>
                <DialogDescription>Create a printable, branded certificate for a student.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Student</Label>
                  <Select value={form.studentId} onValueChange={handleStudentChange}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pick a student" /></SelectTrigger>
                    <SelectContent>
                      {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name || s.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Template</Label>
                  <Select value={form.templateId} onValueChange={handleTemplateChange}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pick a template" /></SelectTrigger>
                    <SelectContent>
                      {TEMPLATES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {form.templateId && (
                    <p className="text-[11px] text-muted-foreground">{TEMPLATES.find(t => t.id === form.templateId)?.description}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Title</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-xl h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Subtitle</Label>
                  <Input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} className="rounded-xl h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Student photo URL (optional)</Label>
                  <Input value={form.photoUrl} onChange={e => setForm({ ...form, photoUrl: e.target.value })} placeholder="https://..." className="rounded-xl h-9 text-sm" />
                </div>
                <label className="flex items-start gap-2 text-xs cursor-pointer">
                  <Checkbox checked={form.photoConsent} onCheckedChange={(v) => setForm({ ...form, photoConsent: v === true })} className="mt-0.5" />
                  <span className="text-muted-foreground leading-relaxed">
                    I have the parent&apos;s consent to use this student&apos;s photo on the certificate.
                    {!form.photoUrl && ' (Only required if a photo URL is provided.)'}
                  </span>
                </label>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button className="rounded-xl gradient-primary border-0 text-white gap-1.5" onClick={handleIssue} disabled={issuing}>
                  {issuing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />}
                  {issuing ? 'Issuing...' : 'Issue certificate'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {certificates.length === 0 ? (
          <div className="text-center py-8">
            <Award className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No certificates issued yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Click &ldquo;Issue&rdquo; to create your first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {certificates.map(cert => (
              <div key={cert.id} className="rounded-xl border border-border p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{cert.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{cert.studentName}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(cert.issuedAt).toLocaleDateString()}</p>
                </div>
                <a
                  href={`/api/certificates/${cert.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-emerald-600"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
