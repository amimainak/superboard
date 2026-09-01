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
} from 'lucide-react'
import './whiteboard.css'

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
  gridType: 'dot' | 'line'
  onToggleGrid: () => void
  onToggleSnap: () => void
  onToggleGridType: () => void
  onTogglePresentation: () => void
  onSearch: () => void
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
  onTogglePresentation,
  onSearch,
  canExport = true,
  canUndo = true,
  canRedo = true,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const moreBtnRef = useRef<HTMLButtonElement>(null)
  const menuPanelRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: -9999, right: 0 })

  useEffect(() => {
    if (!menuOpen || !moreBtnRef.current) return
    const rect = moreBtnRef.current.getBoundingClientRect()
    let top = rect.bottom + 6
    let right = window.innerWidth - rect.right
    // Clamp to viewport
    if (top + 400 > window.innerHeight) {
      top = rect.top - 6 - Math.min(400, window.innerHeight - 16)
      if (top < 8) top = 8
    }
    if (right < 8) right = 8
    setMenuPos({ top, right })
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
            style={{ position: 'fixed', top: menuPos.top, right: menuPos.right }}
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
              <MenuItem label={`Grid: ${gridType === 'dot' ? 'Dots' : 'Lines'}`} isDark={isDark} onClick={() => { onToggleGridType(); setMenuOpen(false) }} />
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
