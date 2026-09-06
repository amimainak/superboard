// ============================================================
// RecapPanel — Session recap review panel
// ============================================================
// Shows all session recaps for the tutor. Tutor can:
//   • View the auto-generated draft (topics, strengths, growth areas)
//   • Edit the structured data or narrative
//   • Approve (makes it available for term reports)
//   • Dismiss (hides from the list)
// ============================================================

'use client'

import { useEffect, useState, useCallback } from 'react'
import { authFetch } from '@/lib/auth-fetch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClipboardList, Check, X, Loader2, Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Recap {
  id: string
  roomId: string
  studentId: string | null
  topics: string[]
  strengths: string[]
  growthAreas: string[]
  nextSteps: string | null
  narrative: string | null
  aiGenerated: boolean
  status: string
  createdAt: string
  updatedAt: string
}

export function RecapPanel() {
  const { toast } = useToast()
  const [recaps, setRecaps] = useState<Recap[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Recap | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchRecaps = useCallback(async () => {
    try {
      const res = await authFetch('/api/recaps/list')
      if (!res.ok) return
      const data = await res.json()
      setRecaps(data.recaps || [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchRecaps().finally(() => setLoading(false))
  }, [fetchRecaps])

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const res = await authFetch(`/api/recaps/${editing.roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topics: editing.topics,
          strengths: editing.strengths,
          growthAreas: editing.growthAreas,
          nextSteps: editing.nextSteps,
          narrative: editing.narrative,
          status: editing.status,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Recap saved' })
      setEditing(null)
      fetchRecaps()
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (recap: Recap) => {
    try {
      const res = await authFetch(`/api/recaps/${recap.roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Recap approved', description: 'Available for term reports.' })
      fetchRecaps()
    } catch {
      toast({ title: 'Failed', variant: 'destructive' })
    }
  }

  const handleDismiss = async (recap: Recap) => {
    try {
      const res = await authFetch(`/api/recaps/${recap.roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Recap dismissed' })
      fetchRecaps()
    } catch {
      toast({ title: 'Failed', variant: 'destructive' })
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

  const statusConfig: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700' },
    dismissed: { label: 'Dismissed', cls: 'bg-gray-100 text-gray-500' },
  }

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-emerald-500" />
          Session Recaps
          {recaps.length > 0 && <Badge variant="secondary" className="ml-1 text-xs">{recaps.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recaps.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recaps yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Recaps are auto-generated after each lesson. End a lesson to create one.</p>
          </div>
        ) : (
          recaps.map((recap) => {
            const isExpanded = expandedId === recap.id
            const isEditing = editing?.id === recap.id
            const sc = statusConfig[recap.status] || statusConfig.draft
            return (
              <div key={recap.id} className="rounded-xl border border-border overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : recap.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {new Date(recap.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {recap.topics.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">{recap.topics.slice(0, 3).join(', ')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {recap.aiGenerated && <Sparkles className="w-3.5 h-3.5 text-purple-500" />}
                    <Badge className={`text-[10px] rounded-full border-0 ${sc.cls}`}>{sc.label}</Badge>
                  </div>
                </button>

                {/* Expanded view */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border bg-muted/10">
                    {isEditing ? (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Topics (comma-separated)</Label>
                          <Input
                            value={editing.topics.join(', ')}
                            onChange={(e) => setEditing({ ...editing, topics: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                            className="rounded-xl h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Strengths (comma-separated)</Label>
                          <Input
                            value={editing.strengths.join(', ')}
                            onChange={(e) => setEditing({ ...editing, strengths: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                            className="rounded-xl h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Growth areas (comma-separated)</Label>
                          <Input
                            value={editing.growthAreas.join(', ')}
                            onChange={(e) => setEditing({ ...editing, growthAreas: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                            className="rounded-xl h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Next steps</Label>
                          <Textarea
                            value={editing.nextSteps || ''}
                            onChange={(e) => setEditing({ ...editing, nextSteps: e.target.value })}
                            className="rounded-xl text-sm min-h-[60px]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Narrative</Label>
                          <Textarea
                            value={editing.narrative || ''}
                            onChange={(e) => setEditing({ ...editing, narrative: e.target.value })}
                            className="rounded-xl text-sm min-h-[80px]"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="rounded-xl gap-1.5" onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Save
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditing(null)}>Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {recap.narrative && (
                          <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
                            <p className="text-xs font-medium text-purple-700 mb-1 flex items-center gap-1">
                              {recap.aiGenerated && <Sparkles className="w-3 h-3" />} Narrative
                            </p>
                            <p className="text-xs text-purple-900 leading-relaxed">{recap.narrative}</p>
                          </div>
                        )}
                        {recap.topics.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Topics</p>
                            <div className="flex flex-wrap gap-1">
                              {recap.topics.map((t, i) => <Badge key={i} variant="secondary" className="text-[10px] rounded-full">{t}</Badge>)}
                            </div>
                          </div>
                        )}
                        {recap.strengths.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Strengths</p>
                            <ul className="text-xs space-y-0.5">
                              {recap.strengths.map((s, i) => <li key={i} className="text-emerald-700">• {s}</li>)}
                            </ul>
                          </div>
                        )}
                        {recap.growthAreas.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Growth Areas</p>
                            <ul className="text-xs space-y-0.5">
                              {recap.growthAreas.map((s, i) => <li key={i} className="text-amber-700">• {s}</li>)}
                            </ul>
                          </div>
                        )}
                        {recap.nextSteps && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Next Steps</p>
                            <p className="text-xs text-slate-600">{recap.nextSteps}</p>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          {recap.status === 'draft' && (
                            <>
                              <Button size="sm" className="rounded-xl gap-1.5 text-xs" onClick={() => handleApprove(recap)}>
                                <Check className="w-3.5 h-3.5" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => setEditing(recap)}>Edit</Button>
                              <Button size="sm" variant="ghost" className="rounded-xl text-xs text-muted-foreground" onClick={() => handleDismiss(recap)}>
                                <X className="w-3.5 h-3.5" /> Dismiss
                              </Button>
                            </>
                          )}
                          {recap.status === 'approved' && (
                            <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => setEditing(recap)}>Edit</Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
