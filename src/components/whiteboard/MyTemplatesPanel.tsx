// ============================================================
// My Templates Panel (Phase 2A)
// ============================================================
// Grid of template cards with search/filter, edit/duplicate/delete,
// and "Start from Template" → creates new room with widgets.
// ============================================================

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { authFetch } from '@/lib/auth-fetch'
import { subjectMeta } from '@/lib/subject-meta'
import type { TemplateFull } from '@/types'
import { GRADE_BANDS } from '@/lib/validations'
import {
  Search,
  Plus,
  MoreHorizontal,
  Play,
  Copy,
  Pencil,
  Trash2,
  Globe,
  Lock,
  LayoutTemplate,
  Loader2,
  X,
  Filter,
} from 'lucide-react'

const SUBJECTS = ['GENERAL', 'MATH', 'SCIENCE', 'LANGUAGE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'ENGLISH'] as const

interface MyTemplatesPanelProps {
  open: boolean
  onClose: () => void
  onSaveNew: () => void
  onEditTemplate: (template: TemplateFull) => void
}

export function MyTemplatesPanel({ open, onClose, onSaveNew, onEditTemplate }: MyTemplatesPanelProps) {
  const [templates, setTemplates] = useState<TemplateFull[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (subjectFilter) params.set('subject', subjectFilter)
      if (gradeFilter) params.set('gradeBand', gradeFilter)
      const res = await authFetch(`/api/room/templates?${params}`)
      const data = await res.json()
      setTemplates(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch templates:', err)
    }
    setLoading(false)
  }, [search, subjectFilter, gradeFilter])

  useEffect(() => {
    if (open) fetchTemplates()
  }, [open, fetchTemplates])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this template? This cannot be undone.')) return
    setActionLoading(id)
    try {
      await authFetch(`/api/room/templates/${id}`, { method: 'DELETE' })
      setTemplates((t) => t.filter((t) => t.id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
    }
    setActionLoading(null)
    setMenuOpenId(null)
  }, [])

  const handleDuplicate = useCallback(async (id: string) => {
    setActionLoading(id)
    try {
      const res = await authFetch(`/api/room/templates/${id}`, { method: 'POST' })
      if (res.ok) {
        fetchTemplates()
      }
    } catch (err) {
      console.error('Duplicate failed:', err)
    }
    setActionLoading(null)
    setMenuOpenId(null)
  }, [fetchTemplates])

  const handleStartFromTemplate = useCallback(async (id: string) => {
    setActionLoading(id)
    try {
      const res = await authFetch('/api/room/from-template', {
        method: 'POST',
        body: JSON.stringify({ templateId: id }),
      })
      const data = await res.json()
      if (data.roomId) {
        window.location.href = `/room/${data.roomId}`
        return
      }
      throw new Error(data.error || 'Failed to create room')
    } catch (err: any) {
      alert(err.message || 'Failed to start from template')
    }
    setActionLoading(null)
  }, [])

  const handleTogglePublic = useCallback(async (t: TemplateFull) => {
    setActionLoading(t.id)
    try {
      await authFetch(`/api/room/templates/${t.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublic: !t.isPublic }),
      })
      setTemplates((ts) =>
        ts.map((x) => (x.id === t.id ? { ...x, isPublic: !t.isPublic } : x))
      )
    } catch (err) {
      console.error('Toggle public failed:', err)
    }
    setActionLoading(null)
    setMenuOpenId(null)
  }, [])

  if (!open) return null

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div
        className="template-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
              <LayoutTemplate className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Templates</h2>
              <p className="text-xs text-gray-400">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSaveNew}
              className="h-9 px-3.5 rounded-xl gradient-primary text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Save Current
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex gap-1.5">
            <Filter className="w-4 h-4 text-gray-400 mt-2.5" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="h-9 px-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-emerald-500 transition-all"
            >
              <option value="">All Subjects</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{subjectMeta[s]?.label || s}</option>
              ))}
            </select>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="h-9 px-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-emerald-500 transition-all"
            >
              <option value="">All Grades</option>
              {GRADE_BANDS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Template Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <LayoutTemplate className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No templates yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Add widgets to your canvas and save the layout as a template.
            </p>
            <button
              onClick={onSaveNew}
              className="h-9 px-4 rounded-xl gradient-primary text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Save Current Board
            </button>
          </div>
        ) : (
          <div className="template-grid">
            {templates.map((t) => {
              const meta = subjectMeta[t.subject] || subjectMeta.GENERAL
              const isActioning = actionLoading === t.id
              const widgetCount = (t.snapshot as any)?.widgets?.length ?? 0

              return (
                <div key={t.id} className="template-card">
                  {/* Card top — icon + subject + menu */}
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-9 h-9 rounded-lg ${meta.gradient} flex items-center justify-center shadow-sm`}>
                      <meta.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex items-center gap-1">
                      {t.isPublic ? (
                        <Globe className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-gray-300" />
                      )}
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpenId(menuOpenId === t.id ? null : t.id)}
                          className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          {isActioning ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" /> : <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />}
                        </button>
                        {menuOpenId === t.id && (
                          <div className="template-menu">
                            <button onClick={() => { setMenuOpenId(null); onEditTemplate(t) }}>
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button onClick={() => handleDuplicate(t.id)}>
                              <Copy className="w-3.5 h-3.5" /> Duplicate
                            </button>
                            <button onClick={() => handleTogglePublic(t)}>
                              {t.isPublic ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                              {t.isPublic ? 'Make Private' : 'Make Public'}
                            </button>
                            <hr />
                            <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:!bg-red-50">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Name + description */}
                  <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-0.5 line-clamp-2">{t.name}</h3>
                  {t.description && (
                    <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 mb-2">{t.description}</p>
                  )}

                  {/* Meta row */}
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-3">
                    <span>{meta.label}</span>
                    {t.gradeBand && <span>· {t.gradeBand}</span>}
                    <span>· {widgetCount} widget{widgetCount !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Tags */}
                  {t.tags && t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {t.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium">
                          {tag}
                        </span>
                      ))}
                      {t.tags.length > 3 && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px]">+{t.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Use Template button */}
                  <button
                    onClick={() => handleStartFromTemplate(t.id)}
                    disabled={isActioning}
                    className="w-full h-8 rounded-lg text-xs font-semibold gradient-primary text-white flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/15 hover:shadow-emerald-500/25 transition-all disabled:opacity-50"
                  >
                    <Play className="w-3 h-3" /> Start from Template
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .template-modal-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 150ms ease;
        }
        .template-panel {
          background: white; border-radius: 20px; padding: 24px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
          animation: slideUp 200ms ease;
          width: calc(100% - 2rem); max-width: 900px;
          max-height: 85vh; display: flex; flex-direction: column;
        }
        .template-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 12px; overflow-y: auto; flex: 1; padding-right: 4px;
        }
        .template-card {
          border: 1px solid #f0f0f0; border-radius: 14px; padding: 14px;
          display: flex; flex-direction: column; transition: all 200ms;
          background: white;
        }
        .template-card:hover {
          border-color: #a7f3d0; box-shadow: 0 4px 12px rgba(5,150,105,0.06);
        }
        .template-menu {
          position: absolute; right: 0; top: 100%; z-index: 50;
          background: white; border: 1px solid #e5e7eb; border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          padding: 4px; min-width: 140px;
        }
        .template-menu button {
          display: flex; align-items: center; gap: 8px; width: 100%;
          padding: 7px 10px; border-radius: 7px; font-size: 12px; color: #374151;
          background: none; border: none; cursor: pointer; text-align: left;
        }
        .template-menu button:hover { background: #f3f4f6; }
        .template-menu hr { border: none; border-top: 1px solid #f0f0f0; margin: 3px 0; }
        .line-clamp-2 {
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}