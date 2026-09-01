// ============================================================
// Community Templates Browser (Phase 2B)
// ============================================================
// Browse public templates from all users. Filter by subject/grade/search,
// sort, "Use This Template" → copy → new room, author attribution.
// No approval workflow — publishing is instant.
// ============================================================

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { authFetch } from '@/lib/auth-fetch'
import { subjectMeta } from '@/lib/subject-meta'
import { GRADE_BANDS } from '@/lib/validations'
import {
  Search,
  Globe,
  Play,
  Loader2,
  X,
  Filter,
  Users,
  Clock,
  LayoutTemplate,
} from 'lucide-react'

const SUBJECTS = ['GENERAL', 'MATH', 'SCIENCE', 'LANGUAGE', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'ENGLISH'] as const

interface CommunityTemplate {
  id: string
  name: string
  description: string | null
  subject: string
  gradeBand: string
  tags: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
  authorName: string | null
}

interface CommunityTemplatesPanelProps {
  open: boolean
  onClose: () => void
}

export function CommunityTemplatesPanel({ open, onClose }: CommunityTemplatesPanelProps) {
  const [templates, setTemplates] = useState<CommunityTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [total, setTotal] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (subjectFilter) params.set('subject', subjectFilter)
      if (gradeFilter) params.set('gradeBand', gradeFilter)
      if (sort) params.set('sort', sort)
      params.set('limit', '60')
      const res = await authFetch(`/api/room/templates/community?${params}`)
      const data = await res.json()
      setTemplates(data.templates || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Failed to fetch community templates:', err)
    }
    setLoading(false)
  }, [search, subjectFilter, gradeFilter, sort])

  useEffect(() => {
    if (open) fetchTemplates()
  }, [open, fetchTemplates])

  const handleUseTemplate = useCallback(async (id: string) => {
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
      alert(err.message || 'Failed to use template')
    }
    setActionLoading(null)
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Community Templates</h2>
              <p className="text-xs text-gray-400">{total} public template{total !== 1 ? 's' : ''} shared by educators</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search community templates..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>
          <Filter className="w-4 h-4 text-gray-400 mt-2.5" />
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="h-9 px-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-violet-500 transition-all"
          >
            <option value="">All Subjects</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{subjectMeta[s]?.label || s}</option>
            ))}
          </select>
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="h-9 px-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-violet-500 transition-all"
          >
            <option value="">All Grades</option>
            {GRADE_BANDS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 px-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:border-violet-500 transition-all"
          >
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
          </select>
        </div>

        {/* Template Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No community templates yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Be the first to share a template publicly!
            </p>
          </div>
        ) : (
          <div className="template-grid">
            {templates.map((t) => {
              const meta = subjectMeta[t.subject] || subjectMeta.GENERAL
              const isActioning = actionLoading === t.id
              const widgetCount = 0 // snapshot not included in listing

              return (
                <div key={t.id} className="template-card">
                  {/* Card top */}
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-9 h-9 rounded-lg ${meta.gradient} flex items-center justify-center shadow-sm`}>
                      <meta.icon className="w-4 h-4 text-white" />
                    </div>
                    <Globe className="w-3.5 h-3.5 text-violet-400" />
                  </div>

                  {/* Name + description */}
                  <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-0.5 line-clamp-2">{t.name}</h3>
                  {t.description && (
                    <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 mb-2">{t.description}</p>
                  )}

                  {/* Author + meta */}
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mb-2">
                    <span className="font-medium text-gray-500">{t.authorName || 'Anonymous'}</span>
                    <span>·</span>
                    <span>{meta.label}</span>
                    {t.gradeBand && <span>· {t.gradeBand}</span>}
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1 text-[10px] text-gray-300 mb-3">
                    <Clock className="w-3 h-3" />
                    {new Date(t.updatedAt).toLocaleDateString()}
                  </div>

                  {/* Tags */}
                  {t.tags && t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {t.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 text-[10px] font-medium">
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
                    onClick={() => handleUseTemplate(t.id)}
                    disabled={isActioning}
                    className="w-full h-8 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white flex items-center justify-center gap-1.5 shadow-sm shadow-violet-500/15 hover:shadow-violet-500/25 transition-all disabled:opacity-50"
                  >
                    {isActioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    Use This Template
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
          border-color: #ddd6fe; box-shadow: 0 4px 12px rgba(139,92,246,0.06);
        }
        .line-clamp-2 {
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}