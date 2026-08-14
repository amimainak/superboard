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
  MoreHorizontal,
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react'
import './whiteboard.css'

interface TopBarProps {
  isDark: boolean
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
}

export function TopBar({
  isDark,
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
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const moreBtnRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })

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

  const ToolLabel: Record<string, string> = {
    select: 'Select',
    hand: 'Hand',
    draw: 'Pen',
    highlighter: 'Highlight',
    eraser: 'Eraser',
    arrow: 'Arrow',
    text: 'Text',
    sticky: 'Sticky',
    image: 'Image',
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

      {/* Tool name — subtle */}
      <span className={`wb-tool-label wb-tool-label-${isDark ? 'dark' : 'light'}`}>
        {ToolLabel[currentTool] || currentTool}
      </span>

      {/* Page name */}
      <span className={`wb-page-name wb-page-name-${isDark ? 'dark' : 'light'}`}>
        {currentPage}
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Zoom — compact */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
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

      {/* Thin divider */}
      <div className={`wb-sep-v wb-sep-v-${isDark ? 'dark' : 'light'}`} aria-hidden="true" />

      {/* Right actions — minimal icons */}
      <Ico title="Presentation" isDark={isDark} onClick={onTogglePresentation} ariaLabel="Toggle presentation mode">
        <Maximize size={14} />
      </Ico>

      <Ico
        title={isDark ? 'Light mode' : 'Dark mode'}
        isDark={isDark}
        onClick={onToggleDark}
        ariaLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
      </Ico>

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
        {menuOpen && (
          <>
            <div className="wb-menu-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
            <div
              className={`wb-menu-panel wb-menu-panel-${isDark ? 'dark' : 'light'}`}
              role="menu"
              aria-label="Actions menu"
              style={{ position: 'fixed', top: menuPos.top, right: menuPos.right }}
            >
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
              <MenuItem label="Export as PNG" isDark={isDark} onClick={() => { onExportPng(); setMenuOpen(false) }} />
              <MenuItem label="Export as JPEG" isDark={isDark} onClick={() => { onExportJpg(); setMenuOpen(false) }} />
              <MenuItem label="Export as SVG" isDark={isDark} onClick={() => { onExportSvg(); setMenuOpen(false) }} />
              <MenuItem label="Export as JSON" isDark={isDark} onClick={() => { onExportJson(); setMenuOpen(false) }} />
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
          </>
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
  ariaLabel,
  ariaExpanded,
  ariaHaspopup,
}: {
  children: React.ReactNode
  title: string
  isDark: boolean
  onClick?: () => void
  active?: boolean
  ariaLabel: string
  ariaExpanded?: boolean
  ariaHaspopup?: 'menu' | 'dialog' | 'true' | 'false'
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHaspopup}
      className={[
        'wb-ico',
        `wb-ico-${isDark ? 'dark' : 'light'}`,
        active ? `wb-ico-active wb-ico-active-${isDark ? 'dark' : 'light'}` : '',
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
}: {
  label: string
  isDark: boolean
  shortcut?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      role="menuitem"
      aria-label={shortcut ? `${label} (${shortcut})` : label}
      className={`wb-menu-item wb-menu-item-${isDark ? 'dark' : 'light'}`}
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
