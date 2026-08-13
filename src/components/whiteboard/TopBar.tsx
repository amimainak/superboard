// ============================================================
// Superboard — Top Bar (Minimalist)
// Clean, light top bar with collapsible actions menu
// ============================================================

'use client'

import React from 'react'
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
      className="top-bar"
      style={{
        height: '40px',
        minHeight: '40px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        gap: 2,
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        background: isDark ? '#0d1117' : '#ffffff',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {/* Logo — minimal */}
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          background: 'linear-gradient(135deg, #059669, #0891b2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Pen size={13} color="white" />
      </div>

      {/* Thin divider */}
      <div style={{ width: 1, height: 18, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', margin: '0 6px', flexShrink: 0 }} />

      {/* Tool name — subtle */}
      <span style={{ fontSize: 12, fontWeight: 500, color: isDark ? '#9ca3af' : '#9ca3af', flexShrink: 0 }}>
        {ToolLabel[currentTool] || currentTool}
      </span>

      {/* Page name */}
      <span style={{ fontSize: 11, color: isDark ? '#4b5563' : '#c0c4cc', flexShrink: 0, marginLeft: 4 }}>
        {currentPage}
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Zoom — compact */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <Ico title="Zoom Out" isDark={isDark} onClick={onZoomOut}>
          <ZoomOut size={14} />
        </Ico>
        <button
          onClick={onZoomReset}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: '0 4px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            color: isDark ? '#9ca3af' : '#6b7280',
            minWidth: 36,
            textAlign: 'center',
            lineHeight: '20px',
          }}
        >
          {zoom}%
        </button>
        <Ico title="Zoom In" isDark={isDark} onClick={onZoomIn}>
          <ZoomIn size={14} />
        </Ico>
      </div>

      {/* Thin divider */}
      <div style={{ width: 1, height: 18, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', margin: '0 4px', flexShrink: 0 }} />

      {/* Right actions — minimal icons */}
      <Ico title="Presentation" isDark={isDark} onClick={onTogglePresentation}>
        <Maximize size={14} />
      </Ico>

      <Ico title={isDark ? 'Light mode' : 'Dark mode'} isDark={isDark} onClick={onToggleDark}>
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
      </Ico>

      {/* More menu — groups all secondary actions */}
      <div style={{ position: 'relative' }}>
        <Ico title="More" isDark={isDark} onClick={() => setMenuOpen(!menuOpen)}>
          <MoreHorizontal size={14} />
        </Ico>
        {menuOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setMenuOpen(false)} />
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 6,
                background: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: 10,
                padding: 6,
                zIndex: 1001,
                boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)',
                minWidth: 200,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              {/* File */}
              <MenuSection label="File" isDark={isDark}>
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
              </MenuSection>
              {/* Edit */}
              <MenuSection label="Edit" isDark={isDark}>
                <MenuItem label="Select All" isDark={isDark} shortcut="Ctrl+A" onClick={() => { onSelectAll(); setMenuOpen(false) }} />
                <MenuItem label="Group" isDark={isDark} shortcut="Ctrl+G" onClick={() => { onGroup(); setMenuOpen(false) }} />
                <MenuItem label="Ungroup" isDark={isDark} shortcut="Ctrl+⇧G" onClick={() => { onUngroup(); setMenuOpen(false) }} />
                <MenuItem label="Lock / Unlock" isDark={isDark} shortcut="⇧L" onClick={() => { onToggleLock(); setMenuOpen(false) }} />
                <MenuItem label="Bring to Front" isDark={isDark} onClick={() => { onBringToFront(); setMenuOpen(false) }} />
                <MenuItem label="Send to Back" isDark={isDark} onClick={() => { onSendToBack(); setMenuOpen(false) }} />
              </MenuSection>
              {/* View */}
              <MenuSection label="View" isDark={isDark}>
                <MenuItem label={showGrid ? 'Hide Grid' : 'Show Grid'} isDark={isDark} onClick={() => { onToggleGrid(); setMenuOpen(false) }} />
                <MenuItem label={snapToGrid ? 'Disable Snap' : 'Enable Snap'} isDark={isDark} onClick={() => { onToggleSnap(); setMenuOpen(false) }} />
                <MenuItem label={`Grid: ${gridType === 'dot' ? 'Dots' : 'Lines'}`} isDark={isDark} onClick={() => { onToggleGridType(); setMenuOpen(false) }} />
                <MenuItem label="Zoom to Fit" isDark={isDark} shortcut="⇧1" onClick={() => { onZoomFit(); setMenuOpen(false) }} />
              </MenuSection>
              {/* Help */}
              <MenuSection label="Help" isDark={isDark}>
                <MenuItem label="Keyboard Shortcuts" isDark={isDark} shortcut="Ctrl+/" onClick={() => { onShowShortcuts(); setMenuOpen(false) }} />
              </MenuSection>
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
}: {
  children: React.ReactNode
  title: string
  isDark: boolean
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        border: 'none',
        background: active
          ? isDark ? 'rgba(5,150,105,0.15)' : 'rgba(5,150,105,0.08)'
          : 'transparent',
        color: active
          ? '#059669'
          : isDark ? '#9ca3af' : '#6b7280',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.12s ease',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
          e.currentTarget.style.color = isDark ? '#e5e7eb' : '#374151'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = isDark ? '#9ca3af' : '#6b7280'
        }
      }}
    >
      {children}
    </button>
  )
}

// ---- Menu Section ----
function MenuSection({
  label,
  isDark,
  children,
}: {
  label: string
  isDark: boolean
  children: React.ReactNode
}) {
  return (
    <>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: isDark ? '#4b5563' : '#9ca3af',
          padding: '6px 10px 3px',
        }}
      >
        {label}
      </div>
      {children}
    </>
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
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '5px 10px',
        borderRadius: 6,
        border: 'none',
        background: 'transparent',
        color: isDark ? '#d1d5db' : '#374151',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 400,
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <span>{label}</span>
      {shortcut && (
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: isDark ? '#4b5563' : '#9ca3af' }}>
          {shortcut}
        </span>
      )}
    </button>
  )
}
