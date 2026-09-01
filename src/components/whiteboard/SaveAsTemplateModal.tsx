// ============================================================
// Save as Template Modal (Phase 2A)
// ============================================================
// Opens from TopBar button or Ctrl+Shift+S.
// Extracts widget elements + canvas settings, saves to backend.
// ============================================================

'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { extractTemplateSnapshot } from '@/lib/template-snapshot'
import { authFetch } from '@/lib/auth-fetch'
import { subjectMeta } from '@/lib/subject-meta'
import type { Subject } from '@/types'
import { GRADE_BANDS } from '@/lib/validations'
import {
  X,
  Save,
  Tag,
  Eye,
  EyeOff,
  Loader2,
  Check,
  LayoutTemplate,
} from 'lucide-react'

interface SaveAsTemplateModalProps {
  open: boolean
  onClose: () => void
  /** If editing an existing template, pass its ID and current values */
  editTemplate?: {
    id: string
    name: string
    description: string
    subject: string
    gradeBand: string
    tags: string[]
    isPublic: boolean
  }
  onSuccess?: () => void
}

const SUBJECTS = ['GENERAL', 'MATH', 'SCIENCE', 'LANGUAGE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'ENGLISH'] as const

export function SaveAsTemplateModal({
  open,
  onClose,
  editTemplate,
  onSuccess,
}: SaveAsTemplateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState<string>('GENERAL')
  const [gradeBand, setGradeBand] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  // Count widget elements
  const elements = useWhiteboardStore((s) => s.elements)
  const isDark = useWhiteboardStore((s) => s.isDark)
  const showGrid = useWhiteboardStore((s) => s.showGrid)
  const gridSize = useWhiteboardStore((s) => s.gridSize)
  const gridType = useWhiteboardStore((s) => s.gridType)
  const snapToGrid = useWhiteboardStore((s) => s.snapToGrid)

  const widgetCount = elements.filter((el) => el.type === 'widget').length

  // Populate fields when editing
  useEffect(() => {
    if (editTemplate) {
      setName(editTemplate.name)
      setDescription(editTemplate.description || '')
      setSubject(editTemplate.subject)
      setGradeBand(editTemplate.gradeBand)
      setTags(editTemplate.tags)
      setIsPublic(editTemplate.isPublic)
    } else {
      setName('')
      setDescription('')
      setSubject('GENERAL')
      setGradeBand('')
      setTags([])
      setIsPublic(false)
    }
    setError('')
    setSaved(false)
  }, [editTemplate, open])

  // Auto-focus name input
  useEffect(() => {
    if (open) setTimeout(() => nameRef.current?.focus(), 100)
  }, [open])

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag])
      setTagInput('')
    }
  }, [tagInput, tags])

  const handleRemoveTag = useCallback((tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }, [tags])

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      setError('Template name is required')
      return
    }
    if (widgetCount === 0 && !editTemplate) {
      setError('Add at least one widget to the canvas before saving a template')
      return
    }

    setSaving(true)
    setError('')

    try {
      // Build snapshot
      const snapshot = extractTemplateSnapshot({
        elements,
        isDark,
        showGrid,
        gridSize,
        gridType,
        snapToGrid,
      })

      if (editTemplate) {
        // Update existing template
        const res = await authFetch(`/api/room/templates/${editTemplate.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || undefined,
            subject,
            gradeBand,
            tags,
            isPublic,
            snapshot,
          }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to update template')
        }
      } else {
        // Create new template
        const res = await authFetch('/api/room/templates', {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || undefined,
            subject,
            gradeBand,
            tags,
            isPublic,
            snapshot,
          }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to save template')
        }
      }

      setSaved(true)
      onSuccess?.()
      setTimeout(() => onClose(), 800)
    } catch (err: any) {
      setError(err.message || 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }, [
    name, description, subject, gradeBand, tags, isPublic, elements,
    isDark, showGrid, gridSize, gridType, snapToGrid, widgetCount,
    editTemplate, onSuccess, onClose,
  ])

  if (!open) return null

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div
        className="template-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 520, width: 'calc(100% - 2rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
              <LayoutTemplate className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editTemplate ? 'Edit Template' : 'Save as Template'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Widget count info */}
        {!editTemplate && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-gray-50 text-xs text-gray-500 flex items-center gap-2">
            <LayoutTemplate className="w-3.5 h-3.5" />
            {widgetCount} widget{widgetCount !== 1 ? 's' : ''} on canvas will be saved.
            Freehand drawings are not included.
          </div>
        )}

        {/* Name */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Template Name *</label>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
            placeholder="e.g., Algebra Review Board"
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            maxLength={100}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
          />
        </div>

        {/* Description */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly describe what this template is for..."
            className="w-full h-20 px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            maxLength={500}
          />
        </div>

        {/* Subject + Grade Band row */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{subjectMeta[s]?.label || s}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Grade Band</label>
            <select
              value={gradeBand}
              onChange={(e) => setGradeBand(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="">Any grade</option>
              {GRADE_BANDS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            <Tag className="w-3 h-3 inline mr-1" />
            Tags (up to 10)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
              placeholder="Add a tag..."
              className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              maxLength={30}
            />
            <button
              onClick={handleAddTag}
              className="h-9 px-3 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors"
            >
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium"
                >
                  {tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-emerald-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Public toggle */}
        <div className="flex items-center justify-between py-3 px-3 rounded-xl bg-gray-50 mb-4">
          <div className="flex items-center gap-2">
            {isPublic ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
            <div>
              <p className="text-sm font-medium text-gray-700">Make Public</p>
              <p className="text-[11px] text-gray-400">Other users can find and use this template</p>
            </div>
          </div>
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`w-10 h-6 rounded-full transition-colors relative ${isPublic ? 'bg-emerald-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isPublic ? 'left-5' : 'left-1'}`} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`h-10 px-5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all ${
              saved
                ? 'bg-emerald-600'
                : 'gradient-primary shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30'
            }`}
          >
            {saved ? (
              <><Check className="w-4 h-4" /> Saved</>
            ) : saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> {editTemplate ? 'Update' : 'Save Template'}</>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        .template-modal-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 150ms ease;
        }
        .template-modal {
          background: white; border-radius: 20px; padding: 24px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
          animation: slideUp 200ms ease;
          max-height: 90vh; overflow-y: auto;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
