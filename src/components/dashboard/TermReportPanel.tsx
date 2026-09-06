// ============================================================
// TermReportPanel — Generate + list term reports
// ============================================================

'use client'

import { useEffect, useState, useCallback } from 'react'
import { authFetch } from '@/lib/auth-fetch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { FileBarChart, Plus, Loader2, Download, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TermReport {
  id: string
  studentId: string
  startDate: string
  endDate: string
  lessonsCount: number
  subjectsCovered: string[]
  consentRecorded: boolean
  sentToParent: boolean
  createdAt: string
}

interface StudentOption {
  id: string
  name: string | null
  email: string
}

export function TermReportPanel() {
  const { toast } = useToast()
  const [reports, setReports] = useState<TermReport[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Default date range: last 3 months
  const now = new Date()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
  const [form, setForm] = useState({
    studentId: '',
    startDate: threeMonthsAgo.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
    consent: false,
  })

  const fetchAll = useCallback(async () => {
    try {
      const [reportsRes, studentsRes] = await Promise.all([
        authFetch('/api/term-reports/list'),
        authFetch('/api/agency/students?status=active&limit=200'),
      ])
      const reportsData = await reportsRes.json()
      const studentsData = await studentsRes.json()
      setReports(reportsData.reports || [])
      setStudents(studentsData.students || [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchAll().finally(() => setLoading(false))
  }, [fetchAll])

  const handleGenerate = async () => {
    if (!form.studentId) {
      toast({ title: 'Please pick a student', variant: 'destructive' })
      return
    }
    if (!form.consent) {
      toast({ title: 'You must confirm consent to generate a report', variant: 'destructive' })
      return
    }
    setGenerating(true)
    try {
      const res = await authFetch('/api/term-reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: form.studentId,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate + 'T23:59:59').toISOString(),
          consentRecorded: form.consent,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || err.message || 'Failed')
      }
      const { report } = await res.json()
      toast({ title: 'Term report generated!', description: `${report.lessonsCount} lessons compiled.` })
      setCreateOpen(false)
      setForm({ ...form, studentId: '', consent: false })
      fetchAll()
    } catch (e: unknown) {
      toast({ title: 'Failed to generate', description: e instanceof Error ? e.message : '', variant: 'destructive' })
    } finally {
      setGenerating(false)
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
            <FileBarChart className="w-5 h-5 text-blue-500" />
            Term Reports
            {reports.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{reports.length}</Badge>}
          </CardTitle>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl gradient-primary border-0 text-white text-xs gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Generate
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><FileBarChart className="w-5 h-5 text-blue-500" /> Generate Term Report</DialogTitle>
                <DialogDescription>Compiles approved session recaps into a branded PDF.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Student</Label>
                  <Select value={form.studentId} onValueChange={v => setForm({ ...form, studentId: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pick a student" /></SelectTrigger>
                    <SelectContent>
                      {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name || s.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Start date</Label>
                    <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="rounded-xl h-9 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">End date</Label>
                    <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="rounded-xl h-9 text-sm" />
                  </div>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <label className="flex items-start gap-2 text-xs cursor-pointer">
                    <Checkbox checked={form.consent} onCheckedChange={v => setForm({ ...form, consent: v === true })} className="mt-0.5" />
                    <span className="text-amber-900 leading-relaxed">
                      <strong>Consent required.</strong> I confirm I have the parent&apos;s permission to compile this report about the student.
                    </span>
                  </label>
                </div>
                <div className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>Only <strong>approved</strong> session recaps in this date range will be included. Approve recaps in the Recaps tab first.</span>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button className="rounded-xl gradient-primary border-0 text-white gap-1.5" onClick={handleGenerate} disabled={generating}>
                  {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileBarChart className="w-3.5 h-3.5" />}
                  {generating ? 'Generating...' : 'Generate report'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <FileBarChart className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No term reports yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Approve session recaps first, then generate a report.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map(report => {
              const student = students.find(s => s.id === report.studentId)
              return (
                <div key={report.id} className="rounded-xl border border-border p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileBarChart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{student?.name || 'Student'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(report.startDate).toLocaleDateString()} – {new Date(report.endDate).toLocaleDateString()} · {report.lessonsCount} lessons
                    </p>
                  </div>
                  {report.sentToParent && <Badge className="bg-emerald-100 text-emerald-700 text-[10px] rounded-full border-0">Sent</Badge>}
                  <a
                    href={`/api/term-reports/${report.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-blue-600"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
