// ============================================================
// Lesson Builder Modal (Milestone 2 — Lesson Builder)
// ============================================================
// Compose a sequenced lesson from widgets. Saved as a LessonPlan
// record (JSON `steps` array of LessonStep objects).
//
// Layout:
//   - Left column: ordered Step List with up/down reorder + delete
//   - Right column: Step Editor (title, instructions, widget picker,
//     duration, default config auto-filled from getDefaultWidgetConfig)
//   - Top: Lesson metadata (title, subject, grade band, tags, public)
//   - Bottom: Save / Load Existing buttons
//
// Opens from the TopBar More menu (Ctrl+Shift+L).
// ============================================================

'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { authFetch } from '@/lib/auth-fetch'
import { subjectMeta } from '@/lib/subject-meta'
import { GRADE_BANDS } from '@/lib/validations'
import { getDefaultWidgetConfig } from '@/components/whiteboard/CanvasWidgets'
import { WIDGET_KIND_LABELS } from '@/components/whiteboard/CanvasWidgets'
import { generateId } from '@/lib/whiteboard/utils'
import type { LessonPlanFull, LessonPlanRow, LessonStep } from '@/types'
import {
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Loader2,
  Check,
  ListChecks,
  Search,
  Play,
  FolderOpen,
  Pencil,
  Clock,
  GripVertical,
  Tag,
  Eye,
  EyeOff,
} from 'lucide-react'

const SUBJECTS = ['GENERAL', 'MATH', 'SCIENCE', 'LANGUAGE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'ENGLISH'] as const

interface LessonBuilderProps {
  open: boolean
  onClose: () => void
  /** If provided, pre-load this lesson for editing. */
  editLesson?: LessonPlanFull | null
  /** Called after the user saves (new or existing). */
  onSaved?: (lesson: LessonPlanFull) => void
  /** Called when the user clicks "Play Lesson". */
  onPlay?: (lesson: LessonPlanFull) => void
}

function makeBlankStep(): LessonStep {
  // Default to the first known widget kind so the editor always has
  // something selected. (We pick 'math-fraction-circle' because it's
  // safe, common, and exists in WIDGET_KIND_LABELS.)
  const fallbackKind = 'math-fraction-circle'
  const kind = WIDGET_KIND_LABELS[fallbackKind] ? fallbackKind : Object.keys(WIDGET_KIND_LABELS)[0] || fallbackKind
  return {
    id: generateId(),
    title: '',
    instructions: '',
    widgetKind: kind,
    widgetConfig: getDefaultWidgetConfig(kind),
    duration: undefined,
  }
}

export function LessonBuilder({ open, onClose, editLesson, onSaved, onPlay }: LessonBuilderProps) {
  // ---- Lesson metadata ----
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState<string>('GENERAL')
  const [gradeBand, setGradeBand] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(false)

  // ---- Steps state ----
  const [steps, setSteps] = useState<LessonStep[]>([])
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null) // tracks existing lesson plan being edited

  // ---- UI state ----
  const [widgetSearch, setWidgetSearch] = useState('')
  const [widgetPickerOpen, setWidgetPickerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  const selectedStep = useMemo(
    () => steps.find((s) => s.id === selectedStepId) ?? null,
    [steps, selectedStepId]
  )

  // ---- Initialize from editLesson on open ----
  useEffect(() => {
    if (!open) return
    if (editLesson) {
      setTitle(editLesson.title)
      setDescription(editLesson.description || '')
      setSubject(editLesson.subject)
      setGradeBand(editLesson.gradeBand)
      setTags(editLesson.tags)
      setIsPublic(editLesson.isPublic)
      setSteps(Array.isArray(editLesson.steps) ? editLesson.steps.map((s) => ({ ...s })) : [])
      setEditingId(editLesson.id)
      setSelectedStepId(editLesson.steps[0]?.id ?? null)
    } else {
      setTitle('')
      setDescription('')
      setSubject('GENERAL')
      setGradeBand('')
      setTags([])
      setIsPublic(false)
      const blank = makeBlankStep()
      setSteps([blank])
      setSelectedStepId(blank.id)
      setEditingId(null)
    }
    setError('')
    setSaved(false)
  }, [editLesson, open])

  // ---- Auto-focus title on open ----
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => titleRef.current?.focus(), 120)
      return () => clearTimeout(t)
    }
  }, [open])

  // ---- Step mutations ----
  const updateStep = useCallback((id: string, patch: Partial<LessonStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const addStep = useCallback(() => {
    const blank = makeBlankStep()
    setSteps((prev) => [...prev, blank])
    setSelectedStepId(blank.id)
  }, [])

  const deleteStep = useCallback((id: string) => {
    setSteps((prev) => {
      const next = prev.filter((s) => s.id !== id)
      if (next.length === 0) {
        const blank = makeBlankStep()
        setSelectedStepId(blank.id)
        return [blank]
      }
      if (id === selectedStepId) setSelectedStepId(next[0].id)
      return next
    })
  }, [selectedStepId])

  const moveStep = useCallback((id: string, dir: -1 | 1) => {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id)
      if (idx === -1) return prev
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const next = prev.slice()
      const [moved] = next.splice(idx, 1)
      next.splice(newIdx, 0, moved)
      return next
    })
  }, [])

  // ---- Widget picker (filtered by search) ----
  const widgetOptions = useMemo(() => {
    const q = widgetSearch.trim().toLowerCase()
    const all = Object.entries(WIDGET_KIND_LABELS).map(([kind, label]) => ({ kind, label }))
    if (!q) return all.sort((a, b) => a.label.localeCompare(b.label))
    return all
      .filter(({ kind, label }) => label.toLowerCase().includes(q) || kind.toLowerCase().includes(q))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [widgetSearch])

  const pickWidget = useCallback((kind: string) => {
    if (!selectedStepId) return
    const cfg = getDefaultWidgetConfig(kind)
    updateStep(selectedStepId, { widgetKind: kind, widgetConfig: cfg })
    setWidgetPickerOpen(false)
    setWidgetSearch('')
  }, [selectedStepId, updateStep])

  // ---- Tag handlers ----
  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag) && tags.length < 20) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }, [tagInput, tags])

  const handleRemoveTag = useCallback((tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }, [tags])

  // ---- Save handler ----
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setError('Lesson title is required')
      return
    }
    if (steps.length === 0) {
      setError('Add at least one step before saving')
      return
    }
    // Validate each step has a widget kind + title
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].widgetKind) {
        setError(`Step ${i + 1} is missing a widget`)
        return
      }
      if (!steps[i].title.trim()) {
        setError(`Step ${i + 1} is missing a title`)
        return
      }
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        subject,
        gradeBand,
        tags,
        isPublic,
        steps,
      }
      const res = editingId
        ? await authFetch(`/api/lessons/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await authFetch('/api/lessons', { method: 'POST', body: JSON.stringify(payload) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Failed to ${editingId ? 'update' : 'create'} lesson`)
      }
      const data = (await res.json()) as LessonPlanFull
      setEditingId(data.id)
      setSaved(true)
      onSaved?.(data)
      // Auto-close after a short delay only when creating new
      if (!editingId) {
        setTimeout(() => onClose(), 800)
      } else {
        // Reset saved indicator after 1.2s when updating
        setTimeout(() => setSaved(false), 1200)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save lesson plan')
    } finally {
      setSaving(false)
    }
  }, [title, description, subject, gradeBand, tags, isPublic, steps, editingId, onSaved, onClose])

  if (!open) return null

  return (
    <div className="lesson-builder-overlay" onClick={onClose}>
      <div className="lesson-builder" onClick={(e) => e.stopPropagation()}>
        {/* ============================================================
            Header
            ============================================================ */}
        <div className="lb-header">
          <div className="lb-header-title">
            <div className="lb-header-icon">
              <ListChecks className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="lb-title">
                {editingId ? 'Edit Lesson Plan' : 'Lesson Builder'}
              </h2>
              <p className="lb-subtitle">
                {steps.length} step{steps.length !== 1 ? 's' : ''} · {editingId ? 'Updating existing lesson' : 'Compose a new sequenced lesson'}
              </p>
            </div>
          </div>
          <div className="lb-header-actions">
            <button
              onClick={() => setShowLoadDialog(true)}
              className="lb-btn-secondary"
              title="Load an existing lesson plan"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Load
            </button>
            {editingId && onPlay && (
              <button
                onClick={() => onPlay({ ...(editLesson as LessonPlanFull), ...{ id: editingId, title, description: description || null, subject, gradeBand, tags, isPublic, steps } } as LessonPlanFull)}
                className="lb-btn-play"
                title="Play this lesson"
              >
                <Play className="w-3.5 h-3.5" /> Play Lesson
              </button>
            )}
            <button onClick={onClose} className="lb-icon-btn" aria-label="Close lesson builder">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* ============================================================
            Lesson Metadata
            ============================================================ */}
        <div className="lb-metadata">
          <div className="lb-meta-row">
            <div className="lb-field-grow">
              <label className="lb-label">Lesson Title *</label>
              <input
                ref={titleRef}
                value={title}
                onChange={(e) => { setTitle(e.target.value); setError('') }}
                placeholder="e.g., Introduction to Linear Equations"
                className="lb-input"
                maxLength={200}
              />
            </div>
            <div className="lb-field-small">
              <label className="lb-label">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="lb-select"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{subjectMeta[s]?.label || s}</option>
                ))}
              </select>
            </div>
            <div className="lb-field-small">
              <label className="lb-label">Grade Band</label>
              <select
                value={gradeBand}
                onChange={(e) => setGradeBand(e.target.value)}
                className="lb-select"
              >
                <option value="">Any grade</option>
                {GRADE_BANDS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="lb-meta-row">
            <div className="lb-field-grow">
              <label className="lb-label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the lesson objective, audience, and outcomes..."
                className="lb-textarea"
                rows={2}
                maxLength={2000}
              />
            </div>
          </div>

          <div className="lb-meta-row">
            <div className="lb-field-grow">
              <label className="lb-label">
                <Tag className="w-3 h-3 inline mr-1" />
                Tags (up to 20)
              </label>
              <div className="lb-tag-input-row">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                  placeholder="Add a tag and press Enter..."
                  className="lb-input"
                  maxLength={30}
                />
                <button onClick={handleAddTag} className="lb-btn-secondary">Add</button>
              </div>
              {tags.length > 0 && (
                <div className="lb-tag-chips">
                  {tags.map((tag) => (
                    <span key={tag} className="lb-tag-chip">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} aria-label={`Remove ${tag}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="lb-field-small">
              <label className="lb-label">Visibility</label>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className="lb-toggle-row"
                aria-pressed={isPublic}
              >
                {isPublic ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                <span className="lb-toggle-text">
                  <span className="lb-toggle-title">{isPublic ? 'Public' : 'Private'}</span>
                  <span className="lb-toggle-sub">{isPublic ? 'Others can browse & use' : 'Only you can see it'}</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================
            Step List (left) + Step Editor (right)
            ============================================================ */}
        <div className="lb-body">
          {/* ---- Step List (left) ---- */}
          <aside className="lb-step-list" aria-label="Lesson steps">
            <div className="lb-step-list-header">
              <span className="lb-step-list-title">Steps</span>
              <button onClick={addStep} className="lb-btn-add-step" aria-label="Add step">
                <Plus className="w-3.5 h-3.5" /> Add Step
              </button>
            </div>
            <div className="lb-step-list-items">
              {steps.length === 0 && (
                <div className="lb-step-list-empty">
                  No steps yet.<br />Click "Add Step" to begin.
                </div>
              )}
              {steps.map((s, i) => {
                const isSelected = s.id === selectedStepId
                const label = WIDGET_KIND_LABELS[s.widgetKind] || s.widgetKind
                return (
                  <div
                    key={s.id}
                    className={`lb-step-row ${isSelected ? 'lb-step-row-active' : ''}`}
                    onClick={() => setSelectedStepId(s.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedStepId(s.id) } }}
                  >
                    <div className="lb-step-row-grip" aria-hidden="true">
                      <GripVertical className="w-3 h-3 text-gray-300" />
                    </div>
                    <div className="lb-step-row-index">{i + 1}</div>
                    <div className="lb-step-row-body">
                      <div className="lb-step-row-title">{s.title.trim() || <span className="lb-step-row-placeholder">Untitled step</span>}</div>
                      <div className="lb-step-row-meta">
                        <span className="lb-step-row-widget">{label}</span>
                        {typeof s.duration === 'number' && (
                          <span className="lb-step-row-duration">
                            <Clock className="w-2.5 h-2.5" /> {s.duration}m
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="lb-step-row-actions">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveStep(s.id, -1) }}
                        disabled={i === 0}
                        className="lb-step-row-btn"
                        aria-label="Move step up"
                        title="Move up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveStep(s.id, 1) }}
                        disabled={i === steps.length - 1}
                        className="lb-step-row-btn"
                        aria-label="Move step down"
                        title="Move down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteStep(s.id) }}
                        className="lb-step-row-btn lb-step-row-btn-danger"
                        aria-label="Delete step"
                        title="Delete step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>

          {/* ---- Step Editor (right) ---- */}
          <section className="lb-step-editor" aria-label="Step editor">
            {!selectedStep ? (
              <div className="lb-step-editor-empty">
                <ListChecks className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500">Select a step to edit</p>
                <p className="text-xs text-gray-400 mt-1">Or click "Add Step" to create a new one.</p>
              </div>
            ) : (
              <>
                {/* Title */}
                <div className="lb-field">
                  <label className="lb-label">Step Title *</label>
                  <input
                    value={selectedStep.title}
                    onChange={(e) => updateStep(selectedStep.id, { title: e.target.value })}
                    placeholder={`e.g., Step ${steps.findIndex((s) => s.id === selectedStep.id) + 1}: Hook & Warm-up`}
                    className="lb-input"
                    maxLength={200}
                  />
                </div>

                {/* Instructions */}
                <div className="lb-field">
                  <label className="lb-label">Instructions (shown when this step plays)</label>
                  <textarea
                    value={selectedStep.instructions}
                    onChange={(e) => updateStep(selectedStep.id, { instructions: e.target.value })}
                    placeholder="What should the tutor say or do at this step? What's the key teaching moment?"
                    className="lb-textarea lb-textarea-tall"
                    rows={5}
                    maxLength={5000}
                  />
                  <div className="lb-hint">{selectedStep.instructions.length}/5000 characters</div>
                </div>

                {/* Widget picker */}
                <div className="lb-field">
                  <label className="lb-label">Widget for this step</label>
                  <button
                    onClick={() => setWidgetPickerOpen((v) => !v)}
                    className="lb-widget-picker-btn"
                    aria-haspopup="listbox"
                    aria-expanded={widgetPickerOpen}
                  >
                    <div>
                      <div className="lb-widget-picker-label">
                        {WIDGET_KIND_LABELS[selectedStep.widgetKind] || selectedStep.widgetKind}
                      </div>
                      <div className="lb-widget-picker-kind">{selectedStep.widgetKind}</div>
                    </div>
                    <span className="lb-widget-picker-change">Change widget ▾</span>
                  </button>

                  {widgetPickerOpen && (
                    <div className="lb-widget-picker-dropdown" role="listbox">
                      <div className="lb-widget-search">
                        <Search className="w-3.5 h-3.5 text-gray-400" />
                        <input
                          autoFocus
                          value={widgetSearch}
                          onChange={(e) => setWidgetSearch(e.target.value)}
                          placeholder="Search 120+ widgets..."
                          className="lb-widget-search-input"
                        />
                      </div>
                      <div className="lb-widget-options">
                        {widgetOptions.length === 0 && (
                          <div className="lb-widget-options-empty">No widgets match "{widgetSearch}"</div>
                        )}
                        {widgetOptions.slice(0, 200).map(({ kind, label }) => (
                          <button
                            key={kind}
                            onClick={() => pickWidget(kind)}
                            className={`lb-widget-option ${kind === selectedStep.widgetKind ? 'lb-widget-option-active' : ''}`}
                            role="option"
                            aria-selected={kind === selectedStep.widgetKind}
                          >
                            <div className="lb-widget-option-label">{label}</div>
                            <div className="lb-widget-option-kind">{kind}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="lb-hint">
                    Default widget config auto-loaded. Switching widgets resets to that widget's defaults.
                  </div>
                </div>

                {/* Duration */}
                <div className="lb-field lb-field-inline">
                  <label className="lb-label">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Estimated duration (minutes, optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={600}
                    value={selectedStep.duration ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? undefined : Math.max(0, Math.min(600, Number(e.target.value)))
                      updateStep(selectedStep.id, { duration: v })
                    }}
                    placeholder="—"
                    className="lb-input lb-input-narrow"
                  />
                </div>

                {/* Config preview (read-only JSON — informational) */}
                <details className="lb-config-preview">
                  <summary>Widget config (advanced)</summary>
                  <pre className="lb-config-json">{JSON.stringify(selectedStep.widgetConfig, null, 2)}</pre>
                </details>
              </>
            )}
          </section>
        </div>

        {/* ============================================================
            Footer (error + Save)
            ============================================================ */}
        {error && (
          <div className="lb-error">{error}</div>
        )}
        <div className="lb-footer">
          <div className="lb-footer-hint">
            <span>Tip: Press <kbd>Ctrl+Shift+L</kbd> to open this panel any time.</span>
          </div>
          <div className="lb-footer-actions">
            <button onClick={onClose} className="lb-btn-ghost">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`lb-btn-primary ${saved ? 'lb-btn-primary-saved' : ''}`}
            >
              {saved ? (
                <><Check className="w-4 h-4" /> Saved</>
              ) : saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> {editingId ? 'Update Lesson' : 'Save Lesson'}</>
              )}
            </button>
          </div>
        </div>

        {/* ============================================================
            Load Existing Lesson dialog
            ============================================================ */}
        {showLoadDialog && (
          <LoadLessonDialog
            onClose={() => setShowLoadDialog(false)}
            onLoad={(lesson) => {
              setShowLoadDialog(false)
              // populate fields
              setTitle(lesson.title)
              setDescription(lesson.description || '')
              setSubject(lesson.subject)
              setGradeBand(lesson.gradeBand)
              setTags(lesson.tags)
              setIsPublic(lesson.isPublic)
              setSteps(lesson.steps.map((s) => ({ ...s })))
              setEditingId(lesson.id)
              setSelectedStepId(lesson.steps[0]?.id ?? null)
            }}
          />
        )}
      </div>

      <style jsx>{`
        .lesson-builder-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          animation: lbFadeIn 150ms ease;
          padding: 16px;
        }
        .lesson-builder {
          background: #fff; border-radius: 20px;
          box-shadow: 0 25px 60px -12px rgba(0,0,0,0.25);
          animation: lbSlideUp 220ms ease;
          width: 100%; max-width: 1100px;
          max-height: calc(100vh - 32px);
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        @keyframes lbFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lbSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        /* Header */
        .lb-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 22px; border-bottom: 1px solid #f1f5f9;
        }
        .lb-header-title { display: flex; align-items: center; gap: 12px; }
        .lb-header-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(16,185,129,0.25);
        }
        .lb-title { font-size: 17px; font-weight: 700; color: #0f172a; margin: 0; }
        .lb-subtitle { font-size: 12px; color: #94a3b8; margin: 2px 0 0; }
        .lb-header-actions { display: flex; align-items: center; gap: 8px; }

        /* Buttons */
        .lb-icon-btn {
          padding: 6px; border-radius: 8px; border: none; background: transparent;
          cursor: pointer; transition: background 150ms;
        }
        .lb-icon-btn:hover { background: #f1f5f9; }
        .lb-btn-secondary {
          display: inline-flex; align-items: center; gap: 6px;
          height: 32px; padding: 0 12px; border-radius: 8px;
          font-size: 12px; font-weight: 600; color: #475569;
          background: #f1f5f9; border: 1px solid #e2e8f0; cursor: pointer;
          transition: all 150ms;
        }
        .lb-btn-secondary:hover { background: #e2e8f0; }
        .lb-btn-play {
          display: inline-flex; align-items: center; gap: 6px;
          height: 32px; padding: 0 12px; border-radius: 8px;
          font-size: 12px; font-weight: 600; color: #fff;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none; cursor: pointer;
          box-shadow: 0 4px 10px rgba(16,185,129,0.25);
          transition: all 150ms;
        }
        .lb-btn-play:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(16,185,129,0.35); }

        /* Metadata */
        .lb-metadata {
          padding: 16px 22px; border-bottom: 1px solid #f1f5f9;
          background: #fafbfc;
        }
        .lb-meta-row { display: flex; gap: 12px; margin-bottom: 10px; }
        .lb-meta-row:last-child { margin-bottom: 0; }
        .lb-field-grow { flex: 1; min-width: 0; }
        .lb-field-small { width: 180px; flex-shrink: 0; }
        .lb-label {
          display: block; font-size: 11px; font-weight: 600;
          color: #64748b; margin-bottom: 5px; text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .lb-input, .lb-select, .lb-textarea {
          width: 100%; padding: 8px 11px;
          border: 1px solid #e2e8f0; border-radius: 8px;
          font-size: 13px; color: #0f172a; background: #fff;
          transition: border-color 150ms, box-shadow 150ms;
          outline: none;
          font-family: inherit;
        }
        .lb-input:focus, .lb-select:focus, .lb-textarea:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.12);
        }
        .lb-textarea { resize: vertical; min-height: 60px; }
        .lb-textarea-tall { min-height: 110px; }
        .lb-input-narrow { width: 100px; }
        .lb-tag-input-row { display: flex; gap: 6px; }
        .lb-tag-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
        .lb-tag-chip {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 8px; border-radius: 999px;
          background: #ecfdf5; color: #047857; font-size: 11px; font-weight: 600;
        }
        .lb-tag-chip button {
          background: none; border: none; cursor: pointer;
          display: inline-flex; padding: 0; color: #10b981;
        }
        .lb-tag-chip button:hover { color: #047857; }
        .lb-toggle-row {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 8px 10px; border-radius: 8px;
          background: #f8fafc; border: 1px solid #e2e8f0;
          text-align: left; cursor: pointer; transition: background 150ms;
        }
        .lb-toggle-row:hover { background: #f1f5f9; }
        .lb-toggle-text { display: flex; flex-direction: column; }
        .lb-toggle-title { font-size: 12px; font-weight: 600; color: #0f172a; }
        .lb-toggle-sub { font-size: 10px; color: #94a3b8; }

        /* Body (steps + editor) */
        .lb-body {
          flex: 1; min-height: 0;
          display: grid; grid-template-columns: 320px 1fr;
          gap: 0;
        }
        .lb-step-list {
          border-right: 1px solid #f1f5f9; background: #fafbfc;
          display: flex; flex-direction: column; min-height: 0;
        }
        .lb-step-list-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px 10px; border-bottom: 1px solid #f1f5f9;
        }
        .lb-step-list-title {
          font-size: 11px; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .lb-btn-add-step {
          display: inline-flex; align-items: center; gap: 4px;
          height: 28px; padding: 0 10px; border-radius: 6px;
          font-size: 11px; font-weight: 600; color: #fff;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none; cursor: pointer; transition: all 150ms;
          box-shadow: 0 2px 6px rgba(16,185,129,0.2);
        }
        .lb-btn-add-step:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(16,185,129,0.3); }
        .lb-step-list-items { flex: 1; overflow-y: auto; padding: 8px; }
        .lb-step-list-empty {
          text-align: center; padding: 32px 16px;
          font-size: 12px; color: #94a3b8; line-height: 1.7;
        }
        .lb-step-row {
          display: flex; align-items: stretch; gap: 6px;
          padding: 10px 10px; margin-bottom: 4px;
          border-radius: 9px; cursor: pointer; border: 1px solid transparent;
          transition: background 120ms, border-color 120ms;
        }
        .lb-step-row:hover { background: #f1f5f9; }
        .lb-step-row-active {
          background: #ecfdf5; border-color: #a7f3d0;
        }
        .lb-step-row-grip {
          display: flex; align-items: center; padding-right: 2px;
        }
        .lb-step-row-index {
          width: 22px; height: 22px; border-radius: 50%;
          background: #e2e8f0; color: #475569;
          font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 1px;
        }
        .lb-step-row-active .lb-step-row-index {
          background: #10b981; color: #fff;
        }
        .lb-step-row-body { flex: 1; min-width: 0; }
        .lb-step-row-title {
          font-size: 13px; font-weight: 600; color: #0f172a;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .lb-step-row-placeholder { color: #94a3b8; font-weight: 500; font-style: italic; }
        .lb-step-row-meta {
          display: flex; align-items: center; gap: 8px;
          margin-top: 3px; font-size: 10.5px; color: #94a3b8;
        }
        .lb-step-row-widget {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;
        }
        .lb-step-row-duration {
          display: inline-flex; align-items: center; gap: 3px;
          padding: 1px 6px; border-radius: 999px;
          background: #f1f5f9; color: #475569;
        }
        .lb-step-row-actions {
          display: flex; align-items: center; gap: 1px; opacity: 0;
          transition: opacity 120ms;
        }
        .lb-step-row:hover .lb-step-row-actions,
        .lb-step-row-active .lb-step-row-actions { opacity: 1; }
        .lb-step-row-btn {
          width: 24px; height: 24px; border-radius: 5px;
          display: inline-flex; align-items: center; justify-content: center;
          border: none; background: transparent; cursor: pointer;
          color: #64748b; transition: all 120ms;
        }
        .lb-step-row-btn:hover { background: #fff; color: #0f172a; }
        .lb-step-row-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .lb-step-row-btn-danger:hover { color: #dc2626; background: #fef2f2; }

        /* Step editor */
        .lb-step-editor {
          padding: 22px 24px; overflow-y: auto; min-height: 0;
          display: flex; flex-direction: column; gap: 16px;
          background: #fff;
        }
        .lb-step-editor-empty {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center; color: #94a3b8;
          text-align: center; padding: 40px;
        }
        .lb-field { display: flex; flex-direction: column; }
        .lb-field-inline {
          flex-direction: row; align-items: center; gap: 12px;
        }
        .lb-field-inline .lb-label { margin-bottom: 0; }
        .lb-hint {
          font-size: 11px; color: #94a3b8; margin-top: 5px;
        }

        /* Widget picker */
        .lb-widget-picker-btn {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; padding: 11px 14px; border-radius: 10px;
          border: 1px solid #e2e8f0; background: #fff;
          cursor: pointer; text-align: left; transition: all 150ms;
        }
        .lb-widget-picker-btn:hover { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.08); }
        .lb-widget-picker-label { font-size: 13px; font-weight: 600; color: #0f172a; }
        .lb-widget-picker-kind {
          font-size: 11px; color: #94a3b8; margin-top: 2px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .lb-widget-picker-change {
          font-size: 11px; font-weight: 600; color: #10b981;
          background: #ecfdf5; padding: 4px 9px; border-radius: 999px;
          flex-shrink: 0;
        }
        .lb-widget-picker-dropdown {
          margin-top: 6px; border: 1px solid #e2e8f0; border-radius: 10px;
          background: #fff; box-shadow: 0 12px 32px -8px rgba(0,0,0,0.18);
          overflow: hidden; max-height: 320px; display: flex; flex-direction: column;
        }
        .lb-widget-search {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 12px; border-bottom: 1px solid #f1f5f9;
        }
        .lb-widget-search-input {
          flex: 1; border: none; outline: none;
          font-size: 13px; color: #0f172a; background: transparent;
        }
        .lb-widget-options { overflow-y: auto; }
        .lb-widget-options-empty {
          padding: 24px; text-align: center; font-size: 12px; color: #94a3b8;
        }
        .lb-widget-option {
          display: block; width: 100%; padding: 9px 12px;
          border: none; background: none; cursor: pointer;
          text-align: left; transition: background 100ms;
        }
        .lb-widget-option:hover { background: #f8fafc; }
        .lb-widget-option-active { background: #ecfdf5; }
        .lb-widget-option-active:hover { background: #d1fae5; }
        .lb-widget-option-label { font-size: 12.5px; font-weight: 600; color: #0f172a; }
        .lb-widget-option-kind {
          font-size: 10.5px; color: #94a3b8; margin-top: 2px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }

        /* Config preview */
        .lb-config-preview {
          border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px;
          font-size: 11px; color: #64748b;
        }
        .lb-config-preview summary {
          cursor: pointer; font-weight: 600; color: #475569;
        }
        .lb-config-json {
          margin: 8px 0 0; padding: 10px; background: #f8fafc;
          border-radius: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px; color: #334155; overflow-x: auto; max-height: 200px;
        }

        /* Error + footer */
        .lb-error {
          margin: 0 22px; padding: 9px 12px; border-radius: 8px;
          background: #fef2f2; color: #dc2626; font-size: 12px;
        }
        .lb-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 22px; border-top: 1px solid #f1f5f9; background: #fafbfc;
        }
        .lb-footer-hint {
          font-size: 11px; color: #94a3b8;
        }
        .lb-footer-hint kbd {
          background: #f1f5f9; border: 1px solid #e2e8f0; border-bottom-width: 2px;
          border-radius: 4px; padding: 1px 5px; font-size: 10px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .lb-footer-actions { display: flex; gap: 8px; }
        .lb-btn-ghost {
          height: 38px; padding: 0 16px; border-radius: 10px;
          font-size: 13px; font-weight: 600; color: #64748b;
          background: transparent; border: none; cursor: pointer;
          transition: background 150ms;
        }
        .lb-btn-ghost:hover { background: #f1f5f9; }
        .lb-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          height: 38px; padding: 0 18px; border-radius: 10px;
          font-size: 13px; font-weight: 700; color: #fff;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none; cursor: pointer;
          box-shadow: 0 6px 14px rgba(16,185,129,0.25);
          transition: all 150ms;
        }
        .lb-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(16,185,129,0.35);
        }
        .lb-btn-primary:disabled { opacity: 0.7; cursor: default; }
        .lb-btn-primary-saved { background: #10b981; }

        @media (max-width: 720px) {
          .lb-body { grid-template-columns: 1fr; }
          .lb-step-list { max-height: 280px; border-right: none; border-bottom: 1px solid #f1f5f9; }
          .lb-meta-row { flex-direction: column; gap: 10px; }
          .lb-field-small { width: 100%; }
        }
      `}</style>
    </div>
  )
}

// ============================================================
// Load Existing Lesson dialog (inline sub-component)
// ============================================================
function LoadLessonDialog({
  onClose,
  onLoad,
}: {
  onClose: () => void
  onLoad: (lesson: LessonPlanFull) => void
}) {
  const [lessons, setLessons] = useState<LessonPlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fetchingId, setFetchingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    authFetch('/api/lessons')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (Array.isArray(data)) setLessons(data)
        else setError('Unexpected response from server')
      })
      .catch(() => setError('Failed to load lesson plans'))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleOpen = useCallback(async (id: string) => {
    setFetchingId(id)
    setError('')
    try {
      const res = await authFetch(`/api/lessons/${id}`)
      if (!res.ok) throw new Error('Failed to load lesson')
      const data = (await res.json()) as LessonPlanFull
      onLoad(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load lesson plan')
    } finally {
      setFetchingId(null)
    }
  }, [onLoad])

  return (
    <div className="lb-load-overlay" onClick={onClose}>
      <div className="lb-load-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="lb-load-header">
          <div>
            <h3 className="lb-load-title">Load Existing Lesson</h3>
            <p className="lb-load-subtitle">{lessons.length} saved lesson{lessons.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="lb-icon-btn" aria-label="Close">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        {loading && (
          <div className="lb-load-body">
            <div className="lb-load-loading"><Loader2 className="w-5 h-5 animate-spin text-emerald-500" /> Loading...</div>
          </div>
        )}
        {error && <div className="lb-error">{error}</div>}
        {!loading && !error && lessons.length === 0 && (
          <div className="lb-load-body">
            <div className="lb-load-empty">
              <ListChecks className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-sm font-medium text-gray-500">No saved lessons yet</p>
              <p className="text-xs text-gray-400 mt-1">Build your first lesson and save it.</p>
            </div>
          </div>
        )}
        {!loading && lessons.length > 0 && (
          <div className="lb-load-body">
            <div className="lb-load-list">
              {lessons.map((l) => {
                const meta = subjectMeta[l.subject] || subjectMeta.GENERAL
                return (
                  <button
                    key={l.id}
                    onClick={() => handleOpen(l.id)}
                    disabled={fetchingId !== null}
                    className="lb-load-item"
                  >
                    <div className={`lb-load-item-icon ${meta.gradient}`}>
                      <meta.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="lb-load-item-body">
                      <div className="lb-load-item-title">
                        {l.title}
                        {l.isPublic && <Eye className="w-3 h-3 text-emerald-500 ml-1" />}
                      </div>
                      <div className="lb-load-item-meta">
                        <span>{meta.label}</span>
                        {l.gradeBand && <span>· {l.gradeBand}</span>}
                        <span>· Updated {new Date(l.updatedAt).toLocaleDateString()}</span>
                      </div>
                      {l.description && (
                        <div className="lb-load-item-desc">{l.description}</div>
                      )}
                    </div>
                    {fetchingId === l.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    ) : (
                      <Pencil className="w-3.5 h-3.5 text-gray-300" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <style jsx>{`
          .lb-load-overlay {
            position: absolute; inset: 0; z-index: 50;
            background: rgba(255,255,255,0.6); backdrop-filter: blur(2px);
            display: flex; align-items: center; justify-content: center;
            padding: 24px;
          }
          .lb-load-dialog {
            background: #fff; border-radius: 16px;
            box-shadow: 0 16px 40px -12px rgba(0,0,0,0.18);
            width: 100%; max-width: 560px; max-height: 540px;
            display: flex; flex-direction: column; overflow: hidden;
            border: 1px solid #e2e8f0;
          }
          .lb-load-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
          }
          .lb-load-title { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0; }
          .lb-load-subtitle { font-size: 11px; color: #94a3b8; margin: 2px 0 0; }
          .lb-load-body { flex: 1; overflow-y: auto; padding: 12px; }
          .lb-load-loading, .lb-load-empty {
            display: flex; flex-direction: column; align-items: center;
            padding: 32px; color: #94a3b8; font-size: 13px;
          }
          .lb-load-list { display: flex; flex-direction: column; gap: 6px; }
          .lb-load-item {
            display: flex; align-items: center; gap: 12px;
            padding: 12px; border-radius: 10px; border: 1px solid transparent;
            background: none; cursor: pointer; text-align: left;
            transition: all 120ms;
          }
          .lb-load-item:hover { background: #f8fafc; border-color: #e2e8f0; }
          .lb-load-item:disabled { opacity: 0.5; cursor: default; }
          .lb-load-item-icon {
            width: 36px; height: 36px; border-radius: 9px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
          }
          .lb-load-item-body { flex: 1; min-width: 0; }
          .lb-load-item-title {
            display: flex; align-items: center;
            font-size: 13.5px; font-weight: 600; color: #0f172a;
          }
          .lb-load-item-meta {
            font-size: 11px; color: #94a3b8; margin-top: 2px;
            display: flex; gap: 4px; flex-wrap: wrap;
          }
          .lb-load-item-desc {
            font-size: 11px; color: #64748b; margin-top: 4px;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          }
        `}</style>
      </div>
    </div>
  )
}
