// ============================================================
// ProfileTab — editable parent contact, consent, grade, notes
// ============================================================

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, GraduationCap, Save, Plus, X, Shield } from 'lucide-react'
import { authFetch } from '@/lib/auth-fetch'
import { useToast } from '@/hooks/use-toast'
import type { StudentProfile } from '../StudentProfilePanel'

interface Props {
  student: StudentProfile
  onUpdated: () => void
}

function formatConsentAgo(iso: string | null): string {
  if (!iso) return 'Never recorded'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'Updated today'
  if (days === 1) return 'Updated yesterday'
  if (days < 7) return `Updated ${days} days ago`
  if (days < 30) return `Updated ${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? 's' : ''} ago`
  return `Updated ${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? 's' : ''} ago`
}

export function ProfileTab({ student, onUpdated }: Props) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [newSubject, setNewSubject] = useState('')

  // Form state
  const [parentName, setParentName] = useState(student.parentName ?? '')
  const [parentEmail, setParentEmail] = useState(student.parentEmail ?? '')
  const [parentPhone, setParentPhone] = useState(student.parentPhone ?? '')
  const [gradeLevel, setGradeLevel] = useState(student.gradeLevel ?? '')
  const [subjects, setSubjects] = useState<string[]>(student.subjects)
  const [notes, setNotes] = useState(student.notes ?? '')
  const [consentPhoto, setConsentPhoto] = useState(student.consentPhoto)
  const [consentVideo, setConsentVideo] = useState(student.consentVideo)
  const [consentRecording, setConsentRecording] = useState(student.consentRecording)
  const [consentMarketing, setConsentMarketing] = useState(student.consentMarketing)

  // Sync if student prop changes (e.g. after refetch)
  useEffect(() => {
    setParentName(student.parentName ?? '')
    setParentEmail(student.parentEmail ?? '')
    setParentPhone(student.parentPhone ?? '')
    setGradeLevel(student.gradeLevel ?? '')
    setSubjects(student.subjects)
    setNotes(student.notes ?? '')
    setConsentPhoto(student.consentPhoto)
    setConsentVideo(student.consentVideo)
    setConsentRecording(student.consentRecording)
    setConsentMarketing(student.consentMarketing)
  }, [student])

  const addSubject = () => {
    const s = newSubject.trim()
    if (!s || subjects.includes(s)) return
    setSubjects([...subjects, s])
    setNewSubject('')
  }

  const removeSubject = (s: string) => {
    setSubjects(subjects.filter((x) => x !== s))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await authFetch(`/api/student/${student.id}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentName, parentEmail, parentPhone,
          gradeLevel, subjects, notes,
          consentPhoto, consentVideo, consentRecording, consentMarketing,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save')
      }
      toast({ title: 'Profile saved', description: 'Changes applied successfully.' })
      onUpdated()
    } catch (e: unknown) {
      toast({ title: 'Save failed', description: e instanceof Error ? e.message : 'Please try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Parent / Guardian */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            Parent / Guardian
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name</Label>
              <Input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Linda Chen" className="rounded-xl h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email</Label>
              <Input value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="linda@example.com" type="email" className="rounded-xl h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Phone</Label>
              <Input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="+1 415 555 0142" className="rounded-xl h-9 text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Context */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
            Academic Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Grade level</Label>
            <Input value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} placeholder="Grade 5 / Year 6 / K" className="rounded-xl h-9 text-sm max-w-xs" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Subjects</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {subjects.map((s) => (
                <Badge key={s} variant="secondary" className="rounded-full pl-2.5 pr-1 py-0.5 text-xs gap-1">
                  {s}
                  <button onClick={() => removeSubject(s)} className="hover:text-red-600 ml-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubject())}
                  placeholder="Add subject"
                  className="rounded-full h-7 text-xs w-28"
                />
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-full" onClick={addSubject} disabled={!newSubject.trim()}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Free-form notes about this student — learning style, preferences, things to remember..."
              className="rounded-xl text-sm min-h-[100px] resize-y"
              maxLength={10000}
            />
            <p className="text-[11px] text-muted-foreground">{notes.length.toLocaleString()} / 10,000 characters</p>
          </div>
        </CardContent>
      </Card>

      {/* Consent */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              Consent
            </CardTitle>
            <span className="text-[11px] text-muted-foreground">{formatConsentAgo(student.consentAt)}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <ConsentRow
            label="Photo"
            description="May appear in Superboard marketing photos"
            checked={consentPhoto}
            onChecked={setConsentPhoto}
          />
          <Separator />
          <ConsentRow
            label="Video"
            description="May be in recorded lessons"
            checked={consentVideo}
            onChecked={setConsentVideo}
          />
          <Separator />
          <ConsentRow
            label="Recording"
            description="Lessons may be recorded for review"
            checked={consentRecording}
            onChecked={setConsentRecording}
          />
          <Separator />
          <ConsentRow
            label="Marketing"
            description="Parent may receive promotional emails"
            checked={consentMarketing}
            onChecked={setConsentMarketing}
          />
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-md shadow-emerald-500/20 gap-1.5"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}

function ConsentRow({ label, description, checked, onChecked }: {
  label: string
  description: string
  checked: boolean
  onChecked: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChecked} />
    </div>
  )
}
