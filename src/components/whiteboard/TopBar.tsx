'use client'

import React from 'react'
import {
  Download,
  Sun,
  Moon,
  Keyboard,
  Group,
  Ungroup,
  Lock,
  Unlock,
  ZoomIn,
  ZoomOut,
  Expand,
  Upload,
  Image,
  FileJson,
  FileType,
  ArrowUpToLine,
  ArrowDownToLine,
  Pen,
  Frame,
  Magnet,
  Grid3X3,
  BorderAll,
  Eye,
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
}: TopBarProps) {
  const [exportOpen, setExportOpen] = React.useState(false)

  const ToolLabel: Record<string, string> = {
    select: 'Select',
    hand: 'Hand',
    draw: 'Draw',
    eraser: 'Eraser',
    arrow: 'Arrow',
    text: 'Text',
    note: 'Note',
    geo: 'Shape',
    line: 'Line',
    frame: 'Frame',
    highlight: 'Highlight',
    laser: 'Laser',
    zoom: 'Zoom',
    asset: 'Media',
    embed: 'Embed',
  }

  return (
    <header
      className="top-bar"
      style={{
        height: '44px',
        minHeight: '44px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: '4px',
        borderBottom: '1px solid var(--color-border)',
        background: isDark ? '#1a1a2e' : '#ffffff',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'linear-gradient(135deg, #059669, #0891b2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Pen size={14} color="white" />
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: isDark ? '#e5e7eb' : '#111827',
            letterSpacing: '-0.02em',
          }}
        >
          Whiteboard
        </span>
      </div>

      {/* Divider */}
      <Divider />

      {/* Current Tool Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: 6,
          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
          fontSize: 12,
          color: isDark ? '#9ca3af' : '#6b7280',
        }}
      >
        <span>{ToolLabel[currentTool] || currentTool}</span>
      </div>

      {/* Page indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: 6,
          fontSize: 12,
          color: isDark ? '#9ca3af' : '#6b7280',
        }}
      >
        <Frame size={12} />
        <span>{currentPage}</span>
      </div>

      {/* Divider */}
      <Divider />

      {/* File Upload */}
      <label style={{ cursor: 'pointer' }}>
        <input
          type="file"
          accept="image/*,video/*,.pdf"
          multiple
          onChange={onFileUpload}
          style={{ display: 'none' }}
        />
        <IconButton title="Upload Image/Video" isDark={isDark}>
          <Upload size={16} />
        </IconButton>
      </label>

      {/* Divider */}
      <Divider />

      {/* Zoom Controls */}
      <IconButton title="Zoom Out" isDark={isDark} onClick={onZoomOut}>
        <ZoomOut size={16} />
      </IconButton>
      <button
        onClick={onZoomReset}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 600,
          color: isDark ? '#e5e7eb' : '#374151',
          minWidth: 42,
          textAlign: 'center',
        }}
      >
        {zoom}%
      </button>
      <IconButton title="Zoom In" isDark={isDark} onClick={onZoomIn}>
        <ZoomIn size={16} />
      </IconButton>
      <IconButton title="Zoom to Fit" isDark={isDark} onClick={onZoomFit}>
        <Expand size={16} />
      </IconButton>

      {/* Divider */}
      <Divider />

      {/* Grid Controls */}
      <IconButton
        title={showGrid ? 'Hide Grid' : 'Show Grid'}
        isDark={isDark}
        onClick={onToggleGrid}
        active={showGrid}
      >
        <Eye size={16} />
      </IconButton>
      <IconButton
        title={snapToGrid ? 'Disable Snap to Grid' : 'Enable Snap to Grid'}
        isDark={isDark}
        onClick={onToggleSnap}
        active={snapToGrid}
      >
        <Magnet size={16} />
      </IconButton>
      <IconButton
        title={`Grid: ${gridType === 'dot' ? 'Dots' : 'Lines'} (click to switch)`}
        isDark={isDark}
        onClick={onToggleGridType}
      >
        {gridType === 'dot' ? <Grid3X3 size={16} /> : <BorderAll size={16} />}
      </IconButton>

      {/* Divider */}
      <Divider />

      {/* Group/Ungroup */}
      <IconButton title="Group (Ctrl+G)" isDark={isDark} onClick={onGroup}>
        <Group size={16} />
      </IconButton>
      <IconButton title="Ungroup (Ctrl+Shift+G)" isDark={isDark} onClick={onUngroup}>
        <Ungroup size={16} />
      </IconButton>

      {/* Lock */}
      <IconButton title="Toggle Lock (Shift+L)" isDark={isDark} onClick={onToggleLock}>
        <Lock size={16} />
      </IconButton>

      {/* Z-Order */}
      <IconButton title="Bring to Front" isDark={isDark} onClick={onBringToFront}>
        <ArrowUpToLine size={16} />
      </IconButton>
      <IconButton title="Send to Back" isDark={isDark} onClick={onSendToBack}>
        <ArrowDownToLine size={16} />
      </IconButton>

      {/* Divider */}
      <Divider />

      {/* Export */}
      <div style={{ position: 'relative' }}>
        <IconButton
          title="Export"
          isDark={isDark}
          onClick={() => setExportOpen(!exportOpen)}
        >
          <Download size={16} />
        </IconButton>
        {exportOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setExportOpen(false)} />
            <div
              className="export-dropdown"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 4,
                background: isDark ? '#1f2937' : '#ffffff',
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                borderRadius: 8,
                padding: 4,
                zIndex: 1001,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: 160,
              }}
            >
              <DropdownItem label="Export as PNG" icon={<Image size={14} />} isDark={isDark} onClick={() => { onExportPng(); setExportOpen(false) }} />
              <DropdownItem label="Export as JPEG" icon={<Image size={14} />} isDark={isDark} onClick={() => { onExportJpg(); setExportOpen(false) }} />
              <DropdownItem label="Export as SVG" icon={<FileType size={14} />} isDark={isDark} onClick={() => { onExportSvg(); setExportOpen(false) }} />
              <DropdownItem label="Export as JSON" icon={<FileJson size={14} />} isDark={isDark} onClick={() => { onExportJson(); setExportOpen(false) }} />
            </div>
          </>
        )}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right side actions */}
      <IconButton title="Keyboard Shortcuts (Ctrl+/)" isDark={isDark} onClick={onShowShortcuts}>
        <Keyboard size={16} />
      </IconButton>

      <IconButton
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        isDark={isDark}
        onClick={onToggleDark}
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </IconButton>
    </header>
  )
}

function IconButton({
  children,
  title,
  isDark,
  onClick,
}: {
  children: React.ReactNode
  title: string
  isDark: boolean
  onClick?: () => void
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        border: 'none',
        background: 'transparent',
        color: isDark ? '#d1d5db' : '#4b5563',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
        e.currentTarget.style.color = isDark ? '#f3f4f6' : '#111827'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = isDark ? '#d1d5db' : '#4b5563'
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return (
    <div
      style={{
        width: 1,
        height: 20,
        background: 'var(--color-border)',
        margin: '0 4px',
        flexShrink: 0,
      }}
    />
  )
}

function DropdownItem({
  label,
  icon,
  isDark,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  isDark: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '6px 10px',
        borderRadius: 6,
        border: 'none',
        background: 'transparent',
        color: isDark ? '#e5e7eb' : '#374151',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 500,
        transition: 'background 0.15s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {icon}
      {label}
    </button>
  )
}
