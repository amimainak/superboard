// ============================================================
// JoinLinkTab — generate / regenerate / revoke the student's join URL
// ============================================================

'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Link as LinkIcon, Copy, Check, RefreshCw, Trash2, AlertCircle, Mail, Loader2 } from 'lucide-react'
import { authFetch } from '@/lib/auth-fetch'
import { useToast } from '@/hooks/use-toast'
import type { StudentProfile } from '../StudentProfilePanel'

interface Props {
  student: StudentProfile
  onUpdated: () => void
}

function formatGeneratedAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Generated just now'
  if (mins < 60) return `Generated ${mins}m ago`
  if (hrs < 24) return `Generated ${hrs}h ago`
  return `Generated ${days}d ago`
}

export function JoinLinkTab({ student, onUpdated }: Props) {
  const { toast } = useToast()
  const [token, setToken] = useState<string | null>(student.hasJoinToken ? '' : null) // '' means "exists but unknown"
  const [generatedAt, setGeneratedAt] = useState<string | null>(student.joinTokenGeneratedAt)
  const [busy, setBusy] = useState<'generate' | 'revoke' | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)
  const [confirmRevoke, setConfirmRevoke] = useState(false)

  // Build the full URL only when we have a token
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const joinUrl = token && token.length > 0 ? `${origin}/join/${token}` : null

  const handleGenerate = async () => {
    setBusy('generate')
    try {
      const res = await authFetch(`/api/student/${student.id}/join-token`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to generate')
      const data = await res.json()
      setToken(data.token)
      setGeneratedAt(data.generatedAt)
      toast({ title: 'Join link generated', description: 'Copy it and send it to the student.' })
      onUpdated()
    } catch {
      toast({ title: 'Failed to generate link', variant: 'destructive' })
    } finally {
      setBusy(null)
      setConfirmRegenerate(false)
    }
  }

  const handleRevoke = async () => {
    setBusy('revoke')
    try {
      const res = await authFetch(`/api/student/${student.id}/join-token`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to revoke')
      setToken(null)
      setGeneratedAt(null)
      toast({ title: 'Join link revoked', description: 'The student will need a new link to join lessons.' })
      onUpdated()
    } catch {
      toast({ title: 'Failed to revoke link', variant: 'destructive' })
    } finally {
      setBusy(null)
      setConfirmRevoke(false)
    }
  }

  const handleCopy = async () => {
    if (!joinUrl) return
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: 'Copy failed — long-press to copy manually', variant: 'destructive' })
    }
  }

  const handleEmailParent = () => {
    if (!joinUrl || !student.parentEmail) return
    const subject = encodeURIComponent(`${student.name || 'Your'} Superboard lesson link`)
    const body = encodeURIComponent(
      `Hi ${student.parentName || 'there'},\n\n` +
      `Here's ${student.name || 'your child'}'s personal link for joining online lessons on Superboard:\n\n` +
      `${joinUrl}\n\n` +
      `Just click this link when it's time for the lesson — no account needed.\n\n` +
      `Best,\nYour tutor`
    )
    window.location.href = `mailto:${student.parentEmail}?subject=${subject}&body=${body}`
  }

  // ---- State 1: No link yet ----
  if (!token) {
    return (
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <LinkIcon className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold mb-1">
            {student.name ? `${student.name} doesn't have a join link yet.` : 'No join link yet.'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
            A join link is a personal URL that lets {student.name || 'the student'} enter your active lesson without
            creating an account or typing their email. They just click — they&apos;re in.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={busy !== null}
            className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-md shadow-emerald-500/20 gap-1.5"
          >
            {busy === 'generate' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
            {busy === 'generate' ? 'Generating...' : `Generate ${student.name || 'Student'}'s Join Link`}
          </Button>

          <div className="mt-6 pt-6 border-t border-gray-100 text-left max-w-md mx-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">How it works</p>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• You click Generate — we create a unique URL just for {student.name || 'the student'}.</li>
              <li>• You send them the URL (text, email, whatever you use).</li>
              <li>• When you start a lesson, they click the URL — they&apos;re in.</li>
              <li>• You can regenerate or revoke the link any time.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ---- State 2: Link active ----
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-emerald-500" />
              {student.name || 'Student'}&apos;s Join Link
            </h3>
            <Badge className="bg-emerald-100 text-emerald-700 text-[10px] rounded-full border-0">Active</Badge>
          </div>

          {/* The URL */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-xs text-gray-700 overflow-hidden">
              <div className="truncate">{joinUrl || 'Loading...'}</div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl h-9 px-3 flex-shrink-0"
              onClick={handleCopy}
              disabled={!joinUrl}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="ml-1 text-xs">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-[11px] text-muted-foreground">{formatGeneratedAgo(generatedAt)}</p>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl h-8 text-xs gap-1.5"
                onClick={() => setConfirmRegenerate(true)}
                disabled={busy !== null}
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl h-8 text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => setConfirmRevoke(true)}
                disabled={busy !== null}
              >
                <Trash2 className="w-3 h-3" />
                Revoke
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send to parent */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-3">Send to {student.name || 'student'}</h3>
          {student.parentEmail ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5"
              onClick={handleEmailParent}
            >
              <Mail className="w-3.5 h-3.5" />
              Email to {student.parentName || 'parent'} ({student.parentEmail})
            </Button>
          ) : (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Add a parent email in the <strong>Profile</strong> tab to enable one-click email. For now, copy the link above and send it via your preferred channel.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What the student sees */}
      <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-3">What {student.name || 'the student'} sees when they click</h3>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li>• <strong>If you have an active lesson</strong> → they land in the board immediately.</li>
            <li>• <strong>If no lesson is active</strong> → a waiting screen with a &ldquo;Try again&rdquo; button.</li>
            <li>• <strong>If you&apos;ve deactivated them</strong> → an &ldquo;account paused&rdquo; message.</li>
            <li>• <strong>If you regenerate or revoke</strong> → the old link shows &ldquo;no longer valid&rdquo;.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Regenerate confirm */}
      <Dialog open={confirmRegenerate} onOpenChange={setConfirmRegenerate}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Regenerate join link?</DialogTitle>
            <DialogDescription>
              The current link will stop working immediately. {student.name || 'The student'} will need the new URL next time. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setConfirmRegenerate(false)}>Cancel</Button>
            <Button
              className="rounded-xl gradient-primary border-0 text-white"
              onClick={handleGenerate}
              disabled={busy === 'generate'}
            >
              {busy === 'generate' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirm */}
      <Dialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg">Revoke join link?</DialogTitle>
            <DialogDescription>
              The link will stop working immediately. {student.name || 'The student'} won&apos;t be able to join lessons until you generate a new link. You can do that at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setConfirmRevoke(false)}>Cancel</Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={handleRevoke}
              disabled={busy === 'revoke'}
            >
              {busy === 'revoke' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Revoke link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
