// ============================================================
// Superboard — Top Bar (Minimalist)
// Clean, light top bar with collapsible actions menu
// ============================================================

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Sun,
  Moon,
  Download,
  Pen,
  Undo2,
  Redo2,
  MoreHorizontal,
  ZoomIn,
  ZoomOut,
  Maximize,
  Search,
  LayoutTemplate,
  Users,
  Library,
  FunctionSquare,
  Timer,
  StickyNote,
} from 'lucide-react'
import './whiteboard.css'

// ============================================================
// Shared dropdown positioning helper — prevents menus from
// extending below the viewport or under the right-side panel.
// Returns { top, right, maxHeight } so the menu can scroll
// internally if it's still too tall.
// ============================================================
function computeDropdownPos(btnRect: DOMRect): { top: number; right: number; maxHeight: number } {
  const vpH = window.innerHeight
  const vpW = window.innerWidth
  const estimatedHeight = 400 // conservative estimate; actual content may be taller
  const spaceBelow = vpH - btnRect.bottom - 12
  const spaceAbove = btnRect.top - 12
  let top: number
  let maxHeight: number
  if (spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove) {
    // Open downward
    top = btnRect.bottom + 6
    maxHeight = Math.max(160, spaceBelow - 6)
  } else {
    // Open upward
    top = Math.max(8, btnRect.top - 6 - Math.min(spaceAbove, estimatedHeight))
    maxHeight = Math.max(160, btnRect.top - 6 - 8)
  }
  let right = vpW - btnRect.right
  if (right < 8) right = 8
  return { top, right, maxHeight }
}

interface TopBarProps {
  isDark: boolean
  onUndo: () => void
  onRedo: () => void
  onToggleDark: () => void
  onExportPng: () => void
  onExportSvg: () => void
  onExportJson: () => void
  onExportJpg: () => void
  onShowShortcuts: () => void
  onGroup: () => void
  onUngroup: () => void
  onToggleLock: () => void
  onSelectAll: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomFit: () => void
  onZoomReset: () => void
  onBringToFront: () => void
  onSendToBack: () => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPdfUpload: () => void
  onClearPage: () => void
  onAddPage: () => void
  currentTool: string
  currentPage: string
  zoom: number
  showGrid: boolean
  snapToGrid: boolean
  gridType: 'dot' | 'line' | 'isometric' | 'lined' | 'music-staff'
  onToggleGrid: () => void
  onToggleSnap: () => void
  onToggleGridType: () => void
  /** Phase 5: optional direct setter — when provided, replaces toggle with a dropdown */
  onSetGridType?: (type: 'dot' | 'line' | 'isometric' | 'lined' | 'music-staff') => void
  /** Phase 5: Insert LaTeX equation — when provided, shows an fx button in the top bar */
  onInsertLatex?: () => void
  /** Phase 5: Insert a sticky note — when provided, shows a sticky-note button in the top bar */
  onInsertSticky?: (kind?: 'observe' | 'vocabulary' | 'question' | 'important') => void
  onTogglePresentation: () => void
  onSearch: () => void
  /** Templates — opens the rich SaveAsTemplateModal */
  onSaveAsTemplate?: () => void
  /** Templates — opens MyTemplatesPanel */
  onMyTemplates?: () => void
  /** Templates — opens CommunityTemplatesPanel */
  onCommunityTemplates?: () => void
  /** When false, export menu items (PNG, JPEG, SVG, JSON) are disabled with a tooltip */
  canExport?: boolean
  /** Disable undo when nothing to undo */
  canUndo?: boolean
  /** Disable redo when nothing to redo */
  canRedo?: boolean
}

export function TopBar({
  isDark,
  onUndo,
  onRedo,
  onToggleDark,
  onExportPng,
  onExportSvg,
  onExportJson,
  onExportJpg,
  onShowShortcuts,
  onGroup,
  onUngroup,
  onToggleLock,
  onSelectAll,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoomReset,
  onBringToFront,
  onSendToBack,
  onFileUpload,
  onPdfUpload,
  onClearPage,
  onAddPage,
  currentTool,
  currentPage,
  zoom,
  showGrid,
  snapToGrid,
  gridType,
  onToggleGrid,
  onToggleSnap,
  onToggleGridType,
  onSetGridType,
  onInsertLatex,
  onInsertSticky,
  onTogglePresentation,
  onSearch,
  onSaveAsTemplate,
  onMyTemplates,
  onCommunityTemplates,
  canExport = true,
  canUndo = true,
  canRedo = true,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const moreBtnRef = useRef<HTMLButtonElement>(null)
  const menuPanelRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number; maxHeight?: number }>({ top: -9999, right: 0 })

  useEffect(() => {
    if (!menuOpen || !moreBtnRef.current) return
    const rect = moreBtnRef.current.getBoundingClientRect()
    setMenuPos(computeDropdownPos(rect))
  }, [menuOpen])

  // Close menu on click outside (no full-viewport backdrop that blocks other UI)
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      const panel = menuPanelRef.current
      const btn = moreBtnRef.current
      if (
        panel && !panel.contains(e.target as Node) &&
        btn && !btn.contains(e.target as Node)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const ToolLabel: Record<string, string> = {
    select: 'Select',
    hand: 'Hand',
    draw: 'Pen',
    highlighter: 'Highlight',
    eraser: 'Stroke Eraser',
    'eraser-object': 'Object Eraser',
    arrow: 'Arrow',
    text: 'Text',
    sticky: 'Sticky',
    image: 'Image',
    pdf: 'PDF',
    frame: 'Frame',
    laser: 'Laser',
    line: 'Line',
    rectangle: 'Rectangle',
    ellipse: 'Ellipse',
    diamond: 'Diamond',
    triangle: 'Triangle',
  }

  return (
    <header
      className={`wb-top-bar wb-top-bar-${isDark ? 'dark' : 'light'}`}
      role="banner"
    >
      {/* Logo — minimal */}
      <div className="wb-logo" aria-label="Superboard logo">
        <Pen size={13} color="white" />
      </div>

      {/* Thin divider */}
      <div className={`wb-sep-v wb-sep-v-${isDark ? 'dark' : 'light'}`} aria-hidden="true" />

      {/* Undo / Redo — always visible, prominent */}
      <Ico title="Undo" isDark={isDark} onClick={onUndo} ariaLabel="Undo" disabled={!canUndo}>
        <Undo2 size={14} />
      </Ico>
      <Ico title="Redo" isDark={isDark} onClick={onRedo} ariaLabel="Redo" disabled={!canRedo}>
        <Redo2 size={14} />
      </Ico>

      {/* Tool name — subtle (hidden on mobile) */}
      <span className={`wb-tool-label wb-tool-label-${isDark ? 'dark' : 'light'} wb-top-bar-hide-mobile`}>
        {ToolLabel[currentTool] || currentTool}
      </span>

      {/* Page name (hidden on mobile) */}
      <span className={`wb-page-name wb-page-name-${isDark ? 'dark' : 'light'} wb-top-bar-hide-mobile`}>
        {currentPage}
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Zoom — compact (hidden on mobile, use pinch) */}
      <div className="wb-top-bar-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <Ico title="Zoom Out" isDark={isDark} onClick={onZoomOut} ariaLabel="Zoom out">
          <ZoomOut size={14} />
        </Ico>
        <button
          onClick={onZoomReset}
          className={`wb-zoom-btn wb-zoom-btn-${isDark ? 'dark' : 'light'}`}
          aria-label={`Zoom ${zoom}%, click to reset`}
        >
          {zoom}%
        </button>
        <Ico title="Zoom In" isDark={isDark} onClick={onZoomIn} ariaLabel="Zoom in">
          <ZoomIn size={14} />
        </Ico>
      </div>

      {/* Right actions — minimal icons */}
      <Ico title="Search board (Ctrl+K)" isDark={isDark} onClick={onSearch} ariaLabel="Search board">
        <Search size={14} />
      </Ico>

      {/* Phase 5: Always-visible fx (LaTeX) button in the top toolbar */}
      {onInsertLatex && (
        <Ico title="Insert equation (LaTeX)" isDark={isDark} onClick={onInsertLatex} ariaLabel="Insert equation">
          <FunctionSquare size={14} />
        </Ico>
      )}

      {/* Phase 5: Sticky notes dropdown */}
      {onInsertSticky && (
        <StickyNotesMenu isDark={isDark} onInsert={onInsertSticky} />
      )}

      {/* Templates dropdown — only render if at least one callback is wired */}
      {(onSaveAsTemplate || onMyTemplates || onCommunityTemplates) && (
        <TemplatesMenu
          isDark={isDark}
          onSaveAsTemplate={onSaveAsTemplate}
          onMyTemplates={onMyTemplates}
          onCommunityTemplates={onCommunityTemplates}
        />
      )}

      <div className="wb-top-bar-hide-mobile">
        <Ico title="Presentation" isDark={isDark} onClick={onTogglePresentation} ariaLabel="Toggle presentation mode">
          <Maximize size={14} />
        </Ico>
      </div>

      <div className="wb-top-bar-hide-mobile">
        <Ico
          title={isDark ? 'Light mode' : 'Dark mode'}
          isDark={isDark}
          onClick={onToggleDark}
          ariaLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? <Sun size={14} /> : <Moon size={14} />}
        </Ico>
      </div>

      {/* More menu — groups all secondary actions */}
      <div style={{ position: 'relative' }}>
        <button
          ref={moreBtnRef}
          title="More"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="More options"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className={[
            'wb-ico',
            `wb-ico-${isDark ? 'dark' : 'light'}`,
          ].join(' ')}
        >
          <MoreHorizontal size={14} />
        </button>
        {menuOpen && menuPos.top > -100 && (
          <div
            ref={menuPanelRef}
            className={`wb-menu-panel wb-menu-panel-${isDark ? 'dark' : 'light'}`}
            role="menu"
            aria-label="Actions menu"
            onMouseDown={(e) => e.stopPropagation()}
            style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, maxHeight: menuPos.maxHeight ?? undefined, overflowY: menuPos.maxHeight ? 'auto' : undefined }}
          >
              {/* Page — most visible at top */}
              <div className={`wb-menu-section-label wb-menu-section-label-${isDark ? 'dark' : 'light'}`}>
                Page
              </div>
              <MenuItem label="Add Page" isDark={isDark} onClick={() => { onAddPage(); setMenuOpen(false) }} />
              <MenuItem label="Clear Page" isDark={isDark} shortcut="Del" onClick={() => { onClearPage(); setMenuOpen(false) }} />
              {/* File */}
              <div className={`wb-menu-section-label wb-menu-section-label-${isDark ? 'dark' : 'light'}`}>
                File
              </div>
              <MenuItem label="Upload Image" isDark={isDark} onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = (ev) => {
                  const file = (ev.target as HTMLInputElement).files?.[0]
                  if (file && onFileUpload) {
                    const dt = new DataTransfer()
                    dt.items.add(file)
                    input.files = dt.files
                    onFileUpload({ target: input } as React.ChangeEvent<HTMLInputElement>)
                  }
                  setMenuOpen(false)
                }
                input.click()
              }} />
              <MenuItem label="Upload PDF" isDark={isDark} onClick={() => {
                onPdfUpload()
                setMenuOpen(false)
              }} />
              <MenuItem label={canExport ? 'Export as PNG' : 'Export as PNG (Pro)'} isDark={isDark} onClick={canExport ? () => { onExportPng(); setMenuOpen(false) } : () => setMenuOpen(false)} disabled={!canExport} />
              <MenuItem label={canExport ? 'Export as JPEG' : 'Export as JPEG (Pro)'} isDark={isDark} onClick={canExport ? () => { onExportJpg(); setMenuOpen(false) } : () => setMenuOpen(false)} disabled={!canExport} />
              <MenuItem label={canExport ? 'Export as SVG' : 'Export as SVG (Pro)'} isDark={isDark} onClick={canExport ? () => { onExportSvg(); setMenuOpen(false) } : () => setMenuOpen(false)} disabled={!canExport} />
              <MenuItem label={canExport ? 'Export as JSON' : 'Export as JSON (Pro)'} isDark={isDark} onClick={canExport ? () => { onExportJson(); setMenuOpen(false) } : () => setMenuOpen(false)} disabled={!canExport} />
              {/* Edit */}
              <div className={`wb-menu-section-label wb-menu-section-label-${isDark ? 'dark' : 'light'}`}>
                Edit
              </div>
              <MenuItem label="Select All" isDark={isDark} shortcut="Ctrl+A" onClick={() => { onSelectAll(); setMenuOpen(false) }} />
              <MenuItem label="Group" isDark={isDark} shortcut="Ctrl+G" onClick={() => { onGroup(); setMenuOpen(false) }} />
              <MenuItem label="Ungroup" isDark={isDark} shortcut="Ctrl+⇧G" onClick={() => { onUngroup(); setMenuOpen(false) }} />
              <MenuItem label="Lock / Unlock" isDark={isDark} shortcut="⇧L" onClick={() => { onToggleLock(); setMenuOpen(false) }} />
              <MenuItem label="Bring to Front" isDark={isDark} onClick={() => { onBringToFront(); setMenuOpen(false) }} />
              <MenuItem label="Send to Back" isDark={isDark} onClick={() => { onSendToBack(); setMenuOpen(false) }} />
              {/* View */}
              <div className={`wb-menu-section-label wb-menu-section-label-${isDark ? 'dark' : 'light'}`}>
                View
              </div>
              <MenuItem label={showGrid ? 'Hide Grid' : 'Show Grid'} isDark={isDark} onClick={() => { onToggleGrid(); setMenuOpen(false) }} />
              <MenuItem label={snapToGrid ? 'Disable Snap' : 'Enable Snap'} isDark={isDark} onClick={() => { onToggleSnap(); setMenuOpen(false) }} />
              {/* Phase 5: Grid type — dropdown if onSetGridType is provided, else legacy toggle */}
              {onSetGridType ? (
                <>
                  <div className={`wb-menu-section-label wb-menu-section-label-${isDark ? 'dark' : 'light'}`} style={{ paddingLeft: 12, paddingTop: 4, fontSize: 9, opacity: 0.6 }}>
                    Grid type
                  </div>
                  {([
                    { id: 'dot', label: 'Dots' },
                    { id: 'line', label: 'Square Grid' },
                    { id: 'isometric', label: 'Isometric' },
                    { id: 'lined', label: 'Lined (Notebook)' },
                    { id: 'music-staff', label: 'Music Staff' },
                  ] as const).map(opt => (
                    <MenuItem
                      key={opt.id}
                      label={`${gridType === opt.id ? '● ' : '  '}${opt.label}`}
                      isDark={isDark}
                      onClick={() => { onSetGridType(opt.id); setMenuOpen(false) }}
                    />
                  ))}
                </>
              ) : (
                <MenuItem label={`Grid: ${gridType === 'dot' ? 'Dots' : 'Lines'}`} isDark={isDark} onClick={() => { onToggleGridType(); setMenuOpen(false) }} />
              )}
              <MenuItem label="Zoom to Fit" isDark={isDark} shortcut="⇧1" onClick={() => { onZoomFit(); setMenuOpen(false) }} />
              {/* Help */}
              <div className={`wb-menu-section-label wb-menu-section-label-${isDark ? 'dark' : 'light'}`}>
                Help
              </div>
              <MenuItem label="Keyboard Shortcuts" isDark={isDark} shortcut="Ctrl+/" onClick={() => { onShowShortcuts(); setMenuOpen(false) }} />
            </div>
        )}
      </div>
    </header>
  )
}

// ---- Minimal Icon Button ----
function Ico({
  children,
  title,
  isDark,
  onClick,
  active,
  disabled,
  ariaLabel,
  ariaExpanded,
  ariaHaspopup,
}: {
  children: React.ReactNode
  title: string
  isDark: boolean
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  ariaLabel: string
  ariaExpanded?: boolean
  ariaHaspopup?: 'menu' | 'dialog' | 'true' | 'false'
}) {
  return (
    <button
      title={title}
      onClick={disabled ? undefined : onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      aria-disabled={disabled || undefined}
      className={[
        'wb-ico',
        `wb-ico-${isDark ? 'dark' : 'light'}`,
        active ? `wb-ico-active wb-ico-active-${isDark ? 'dark' : 'light'}` : '',
        disabled ? 'wb-ico-disabled' : '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ---- Menu Item ----
function MenuItem({
  label,
  isDark,
  shortcut,
  onClick,
  disabled,
}: {
  label: string
  isDark: boolean
  shortcut?: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      role="menuitem"
      aria-label={shortcut ? `${label} (${shortcut})` : label}
      aria-disabled={disabled || undefined}
      title={disabled ? 'Upgrade to Pro to unlock exports' : undefined}
      className={`wb-menu-item wb-menu-item-${isDark ? 'dark' : 'light'}`}
      style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
    >
      <span>{label}</span>
      {shortcut && (
        <span className={`wb-menu-shortcut wb-menu-shortcut-${isDark ? 'dark' : 'light'}`}>
          {shortcut}
        </span>
      )}
    </button>
  )
}

// ============================================================
// Templates Menu — dropdown for Save/My/Community template actions
// Wired into TopBar so users can discover the rich Phase 2 modals
// without needing to know the Ctrl+Shift+S / Ctrl+Shift+T shortcuts.
// ============================================================
function TemplatesMenu({
  isDark,
  onSaveAsTemplate,
  onMyTemplates,
  onCommunityTemplates,
}: {
  isDark: boolean
  onSaveAsTemplate?: () => void
  onMyTemplates?: () => void
  onCommunityTemplates?: () => void
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; right: number; maxHeight?: number }>({ top: -9999, right: 0 })

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return
      if (panelRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleToggle = useCallback(() => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPos(computeDropdownPos(r))
    setOpen((v) => !v)
  }, [])

  const run = (fn?: () => void) => {
    setOpen(false)
    if (fn) fn()
  }

  const itemCls = `wb-menu-item wb-menu-item-${isDark ? 'dark' : 'light'}`

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        title="Templates"
        onClick={handleToggle}
        aria-label="Templates"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`wb-ico-btn wb-ico-btn-${isDark ? 'dark' : 'light'}`}
        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid transparent', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', color: isDark ? '#cbd5e1' : '#475569' }}
      >
        <LayoutTemplate size={14} />
      </button>
      {open && (
        <div
          ref={panelRef}
          role="menu"
          className={`wb-menu wb-menu-${isDark ? 'dark' : 'light'}`}
          style={{
            position: 'fixed',
            top: pos.top,
            right: pos.right,
            minWidth: 240,
            maxHeight: pos.maxHeight ?? undefined,
            overflowY: pos.maxHeight ? 'auto' : undefined,
            zIndex: 9999,
            padding: '4px',
            borderRadius: 8,
            boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.45)' : '0 8px 24px rgba(0,0,0,0.12)',
            background: isDark ? '#0f172a' : '#ffffff',
            border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
          }}
        >
          <div style={{ padding: '4px 8px', fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: isDark ? '#64748b' : '#94a3b8' }}>Templates</div>
          {onSaveAsTemplate && (
            <button role="menuitem" className={itemCls} onClick={() => run(onSaveAsTemplate)}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <LayoutTemplate size={13} /> Save Current as Template
              </span>
              <span className={`wb-menu-shortcut wb-menu-shortcut-${isDark ? 'dark' : 'light'}`}>Ctrl+Shift+S</span>
            </button>
          )}
          {onMyTemplates && (
            <button role="menuitem" className={itemCls} onClick={() => run(onMyTemplates)}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Users size={13} /> My Templates
              </span>
              <span className={`wb-menu-shortcut wb-menu-shortcut-${isDark ? 'dark' : 'light'}`}>Ctrl+Shift+T</span>
            </button>
          )}
          {onCommunityTemplates && (
            <button role="menuitem" className={itemCls} onClick={() => run(onCommunityTemplates)}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Library size={13} /> Community Templates
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Sticky Notes Menu — Phase 5
// Dropdown to insert pre-made sticky notes:
//   • "I observe / I think / I learned" (K-5 science, all subjects)
//   • "Key Vocabulary" (any subject)
//   • "Question" (any subject)
//   • "Important" (any subject)
// Each creates a sticky text element at viewport center with preset content.
// ============================================================
function StickyNotesMenu({
  isDark,
  onInsert,
}: {
  isDark: boolean
  onInsert: (kind?: 'observe' | 'vocabulary' | 'question' | 'important') => void
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; right: number; maxHeight?: number }>({ top: -9999, right: 0 })

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return
      if (panelRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleToggle = useCallback(() => {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    setPos(computeDropdownPos(r))
    setOpen((v) => !v)
  }, [])

  const run = (kind: 'observe' | 'vocabulary' | 'question' | 'important') => {
    setOpen(false)
    onInsert(kind)
  }

  const itemCls = `wb-menu-item wb-menu-item-${isDark ? 'dark' : 'light'}`

  const options: Array<{ kind: 'observe' | 'vocabulary' | 'question' | 'important'; label: string; icon: string }> = [
    { kind: 'observe', label: 'I observe / I think / I learned', icon: '👁' },
    { kind: 'vocabulary', label: 'Key Vocabulary', icon: '📖' },
    { kind: 'question', label: 'Question', icon: '?' },
    { kind: 'important', label: 'Important', icon: '!' },
  ]

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        title="Sticky Notes"
        onClick={handleToggle}
        aria-label="Sticky Notes"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`wb-ico-btn wb-ico-btn-${isDark ? 'dark' : 'light'}`}
        style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid transparent', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', color: isDark ? '#cbd5e1' : '#475569' }}
      >
        <StickyNote size={14} />
      </button>
      {open && (
        <div
          ref={panelRef}
          role="menu"
          className={`wb-menu wb-menu-${isDark ? 'dark' : 'light'}`}
          style={{
            position: 'fixed',
            top: pos.top,
            right: pos.right,
            minWidth: 240,
            maxHeight: pos.maxHeight ?? undefined,
            overflowY: pos.maxHeight ? 'auto' : undefined,
            zIndex: 9999,
            padding: '4px',
            borderRadius: 8,
            boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.45)' : '0 8px 24px rgba(0,0,0,0.12)',
            background: isDark ? '#0f172a' : '#ffffff',
            border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'),
          }}
        >
          <div style={{ padding: '4px 8px', fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: isDark ? '#64748b' : '#94a3b8' }}>Sticky Notes</div>
          {options.map(opt => (
            <button key={opt.kind} role="menuitem" className={itemCls} onClick={() => run(opt.kind)}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13 }}>{opt.icon}</span> {opt.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
