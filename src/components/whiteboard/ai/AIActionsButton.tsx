'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { extractTextFromElements, inferSubject } from '@/lib/ai/extract-text'
import GenerateSimilarPanel from './GenerateSimilarPanel'
import ReadingLevelPanel from './ReadingLevelPanel'
import DraftFeedbackPanel from './DraftFeedbackPanel'

export type AIAction = 'generate_similar' | 'adapt_reading_level' | 'check_work'

type DropdownState = null | 'open' | AIAction

export default function AIActionsButton() {
  const elements = useWhiteboardStore(s => s.elements)
  const selectedIds = useWhiteboardStore(s => s.selectedIds)
  const addElement = useWhiteboardStore(s => s.addElement)
  const currentPageIndex = useWhiteboardStore(s => s.currentPageIndex)
  const camera = useWhiteboardStore(s => s.camera)
  const isDark = useWhiteboardStore(s => s.isDark)
  const [dropdown, setDropdown] = useState<DropdownState>(null)
  const [content, setContent] = useState<{ text: string; subject: string; sourceBounds: { x: number; y: number; w: number; h: number } | null } | null>(null)
  const btnRef = useRef<HTMLDivElement>(null)

  const selectedElements = selectedIds.length > 0
    ? elements.filter(el => selectedIds.includes(el.id) && el.pageIndex === currentPageIndex)
    : []

  const hasTextContent = selectedElements.some(
    el => el.type === 'text' || el.type === 'sticky' || (el.type === 'widget' && el.widgetKind)
  )

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdown) return
    const handler = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setDropdown(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdown])

  const prepareContent = useCallback(() => {
    const extracted = extractTextFromElements(selectedElements)
    if (!extracted) return null
    const subject = inferSubject(extracted.text)
    // Get bounding box of selected elements
    let sourceBounds: { x: number; y: number; w: number; h: number } | null = null
    if (selectedElements.length > 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const el of selectedElements) {
        minX = Math.min(minX, el.x)
        minY = Math.min(minY, el.y)
        maxX = Math.max(maxX, el.x + (el.width || 200))
        maxY = Math.max(maxY, el.y + (el.height || 100))
      }
      sourceBounds = { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
    }
    return { text: extracted.text, subject, sourceBounds }
  }, [selectedElements])

  const handleAction = useCallback((action: AIAction) => {
    const c = prepareContent()
    if (!c) return
    setContent(c)
    setDropdown(action)
  }, [prepareContent])

  const handleClose = useCallback(() => {
    setDropdown(null)
  }, [])

  const handleAddToCanvas = useCallback((text: string) => {
    const bounds = content?.sourceBounds
    const x = bounds ? bounds.x + bounds.w + 40 : (camera.x + 100) / camera.zoom
    const y = bounds ? bounds.y : (camera.y + 100) / camera.zoom
    addElement({
      id: crypto.randomUUID(),
      type: 'text',
      x, y,
      width: 300, height: 80,
      rotation: 0, opacity: 1,
      strokeColor: 'transparent',
      fillColor: isDark ? '#1e293b' : '#ffffff',
      strokeWidth: 1,
      locked: false,
      pageIndex: currentPageIndex,
      text,
      fontSize: 16,
      fontFamily: 'Inter',
      textAlign: 'left' as const,
      autoSize: true,
    })
  }, [addElement, camera, content, currentPageIndex, isDark])

  if (!selectedIds.length || !hasTextContent) return null

  const bg = isDark ? '#1e293b' : '#ffffff'
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  const textCol = isDark ? '#f1f5f9' : '#0f172a'
  const subCol = isDark ? '#94a3b8' : '#64748b'
  const hoverBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'

  return (
    <div ref={btnRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setDropdown(dropdown === 'open' ? null : 'open')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 8,
          background: 'linear-gradient(135deg, #059669, #0891b2)',
          color: '#fff', fontSize: 13, fontWeight: 600,
          border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        AI Tools
      </button>

      {dropdown === 'open' && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
          background: bg, border: '1px solid ' + border,
          borderRadius: 10, padding: 4, minWidth: 240,
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 1000,
        }}>
          <DropdownItem
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>}
            label="Generate Similar"
            desc="Create 3 practice variations"
            onClick={() => handleAction('generate_similar')}
            textCol={textCol} subCol={subCol} hoverBg={hoverBg}
          />
          <DropdownItem
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>}
            label="Adapt Reading Level"
            desc="Simplify, bullets, or advance"
            onClick={() => handleAction('adapt_reading_level')}
            textCol={textCol} subCol={subCol} hoverBg={hoverBg}
          />
          <DropdownItem
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
            label="Check Work"
            desc="AI-powered feedback review"
            onClick={() => handleAction('check_work')}
            textCol={textCol} subCol={subCol} hoverBg={hoverBg}
          />
        </div>
      )}

      {dropdown === 'generate_similar' && content && (
        <GenerateSimilarPanel
          content={content.text}
          subject={content.subject}
          isDark={isDark}
          onClose={handleClose}
          onAddToCanvas={handleAddToCanvas}
        />
      )}

      {dropdown === 'adapt_reading_level' && content && (
        <ReadingLevelPanel
          content={content.text}
          isDark={isDark}
          onClose={handleClose}
          onAddToCanvas={handleAddToCanvas}
        />
      )}

      {dropdown === 'check_work' && content && (
        <DraftFeedbackPanel
          content={content.text}
          isDark={isDark}
          onClose={handleClose}
        />
      )}
    </div>
  )
}

function DropdownItem({ icon, label, desc, onClick, textCol, subCol, hoverBg }: {
  icon: React.ReactNode
  label: string
  desc: string
  onClick: () => void
  textCol: string
  subCol: string
  hoverBg: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 8, border: 'none',
        background: 'transparent', cursor: 'pointer', width: '100%',
        textAlign: 'left', transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = hoverBg}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <span style={{ color: '#059669', display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: textCol, lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: 11, color: subCol, lineHeight: 1.3 }}>{desc}</div>
      </span>
    </button>
  )
}