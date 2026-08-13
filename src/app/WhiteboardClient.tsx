'use client'

import { useCallback, useEffect, useState, useRef, useMemo } from 'react'
import { Tldraw, exportAs, Editor, TLComponents } from 'tldraw'
import 'tldraw/tldraw.css'

export default function WhiteboardClient() {
  const editorRef = useRef<Editor | null>(null)
  const [isDark, setIsDark] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [currentTool, setCurrentTool] = useState('select')
  const [currentPage, setCurrentPage] = useState('Page 1')
  const [zoom, setZoom] = useState(100)

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor
    editor.setCurrentTool('select')

    const removeListener = editor.store.listen(() => {
      try {
        setCurrentTool(editor.getCurrentToolId())
        const page = editor.getCurrentPage()
        setCurrentPage(page.name || 'Page 1')
        const cam = editor.getCamera()
        setZoom(Math.round(cam.zoom * 100))
      } catch {
        // ignore
      }
    })

    ;(editorRef.current as any)._cleanupListener = removeListener
  }, [])

  useEffect(() => {
    return () => {
      if (editorRef.current && (editorRef.current as any)._cleanupListener) {
        ;(editorRef.current as any)._cleanupListener()
      }
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setShowShortcuts(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Handle file drops
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    const editor = editorRef.current
    if (!editor) return
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        try {
          const point = editor.screenToPage({ x: e.clientX, y: e.clientY - 44 }) // offset for top bar
          await editor.putExternalContent({ type: 'file', file }, { point, select: true })
        } catch (err) {
          console.error('Failed to upload file:', err)
        }
      }
    }
  }, [])

  // File input handler
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const editor = editorRef.current
    if (!editor) return
    const files = Array.from(e.target.files || [])
    for (const file of files) {
      try {
        const center = editor.getViewportScreenBounds().center
        const point = editor.screenToPage(center)
        await editor.putExternalContent({ type: 'file', file }, { point, select: true })
      } catch (err) {
        console.error('Failed to upload file:', err)
      }
    }
    e.target.value = ''
  }, [])

  // Export
  const handleExport = useCallback((format: 'png' | 'svg' | 'jpeg') => {
    const editor = editorRef.current
    if (!editor) return
    const ids = [...editor.getCurrentPageShapeIds()]
    exportAs(editor, ids, { format, name: 'whiteboard-export', quality: 0.92 })
  }, [])

  const handleExportJson = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const snapshot = editor.getSnapshot()
    const json = JSON.stringify(snapshot, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'whiteboard-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  // Dark mode
  const handleToggleDark = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.setColorMode(isDark ? 'light' : 'dark')
    setIsDark(!isDark)
  }, [isDark])

  // Actions
  const handleGroup = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const selected = editor.getSelectedShapeIds()
    if (selected.length >= 2) editor.groupShapes(selected, { select: true })
  }, [])

  const handleUngroup = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.ungroupShapes(editor.getSelectedShapeIds(), { select: true })
  }, [])

  const handleToggleLock = useCallback(() => {
    editorRef.current?.toggleLock(editorRef.current.getSelectedShapeIds())
  }, [])

  const handleBringToFront = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.bringToFront(editor.getSelectedShapeIds())
  }, [])

  const handleSendToBack = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.sendToBack(editor.getSelectedShapeIds())
  }, [])

  const handleZoomIn = useCallback(() => editorRef.current?.zoomIn(), [])
  const handleZoomOut = useCallback(() => editorRef.current?.zoomOut(), [])
  const handleZoomFit = useCallback(() => editorRef.current?.zoomToFit(), [])
  const handleZoomReset = useCallback(() => editorRef.current?.resetZoom(), [])

  // Build custom TopPanel component
  const components = useMemo<TLComponents>(() => ({
    TopPanel: () => (
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <TopBar
          isDark={isDark}
          onToggleDark={handleToggleDark}
          onExportPng={() => handleExport('png')}
          onExportSvg={() => handleExport('svg')}
          onExportJson={handleExportJson}
          onExportJpg={() => handleExport('jpeg')}
          onShowShortcuts={() => setShowShortcuts(true)}
          onGroup={handleGroup}
          onUngroup={handleUngroup}
          onToggleLock={handleToggleLock}
          onSelectAll={() => editorRef.current?.selectAll()}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomFit={handleZoomFit}
          onZoomReset={handleZoomReset}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
          onFileUpload={handleFileUpload}
          currentTool={currentTool}
          currentPage={currentPage}
          zoom={zoom}
        />
      </div>
    ),
  }), [isDark, currentTool, currentPage, zoom])

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Tldraw
        onMount={handleMount}
        components={components}
        options={{
          maxPages: 50,
          maxShapesPerPage: 10000,
          snapThreshold: 8,
          spacebarPanning: true,
          rightClickPanning: true,
          enableToolbarKeyboardShortcuts: true,
          zoomToFitPadding: 64,
          createTextOnCanvasDoubleClick: true,
          selectLockedShapes: false,
        }}
      />

      {showShortcuts && (
        <ShortcutsDialog onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  )
}

// ─── Inline TopBar (avoids module resolution issues) ───
function TopBar({
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
}: {
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
}) {
  const [exportOpen, setExportOpen] = useState(false)

  const toolLabels: Record<string, string> = {
    select: 'Select', hand: 'Hand', draw: 'Draw', eraser: 'Eraser',
    arrow: 'Arrow', text: 'Text', note: 'Note', geo: 'Shape',
    line: 'Line', frame: 'Frame', highlight: 'Highlight', laser: 'Laser',
    zoom: 'Zoom', asset: 'Media', embed: 'Embed',
  }

  return (
    <header
      style={{
        height: 44,
        minHeight: 44,
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: 2,
        background: isDark ? '#1e1e2e' : '#ffffff',
        borderBottom: `1px solid ${isDark ? '#2d2d3d' : '#e5e7eb'}`,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        zIndex: 10000,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 6 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 5,
          background: 'linear-gradient(135deg, #059669, #0891b2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 10L6 2L10 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: 13, color: isDark ? '#e5e7eb' : '#111827', letterSpacing: '-0.02em' }}>
          Whiteboard
        </span>
      </div>

      <Sep isDark={isDark} />

      {/* Tool badge */}
      <Badge isDark={isDark}>{toolLabels[currentTool] || currentTool}</Badge>
      <Badge isDark={isDark} icon>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginRight: 3 }}>
          <rect x="0.5" y="0.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1"/>
        </svg>
        {currentPage}
      </Badge>

      <Sep isDark={isDark} />

      {/* Upload */}
      <label style={{ cursor: 'pointer' }}>
        <input type="file" accept="image/*,video/*,.pdf" multiple onChange={onFileUpload} style={{ display: 'none' }} />
        <Btn title="Upload Image/Video" isDark={isDark}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 10v2a2 2 0 002 2h8a2 2 0 002-2v-2M7 2v8m0 0l-2-2m2 2l2-2M2 6l3-3 3 3M8 6l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Btn>
      </label>

      <Sep isDark={isDark} />

      {/* Zoom */}
      <Btn title="Zoom Out" isDark={isDark} onClick={onZoomOut}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <path d="M5 7h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </Btn>
      <button onClick={onZoomReset} style={{
        border: 'none', background: 'none', cursor: 'pointer', padding: '2px 5px',
        borderRadius: 4, fontSize: 11, fontWeight: 600, color: isDark ? '#d1d5db' : '#374151',
      }}>{zoom}%</button>
      <Btn title="Zoom In" isDark={isDark} onClick={onZoomIn}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          <path d="M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
      </Btn>
      <Btn title="Zoom to Fit" isDark={isDark} onClick={onZoomFit}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 6V3h3M14 6V3h-3M2 10v3h3M14 10v3h-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Btn>

      <Sep isDark={isDark} />

      {/* Arrange */}
      <Btn title="Group (Ctrl+G)" isDark={isDark} onClick={onGroup}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
      </Btn>
      <Btn title="Ungroup (Ctrl+Shift+G)" isDark={isDark} onClick={onUngroup}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="10" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="1" y="10" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <rect x="10" y="10" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M6.5 3h3M3 6.5v3M12.5 3h-3M13 6.5v3M6.5 13h3M3 9.5v-3M12.5 13h-3M13 9.5v-3" stroke="currentColor" strokeWidth="0.6"/>
        </svg>
      </Btn>
      <Btn title="Toggle Lock (Shift+L)" isDark={isDark} onClick={onToggleLock}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
        </svg>
      </Btn>
      <Btn title="Bring to Front" isDark={isDark} onClick={onBringToFront}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 12V6l8-4v10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 12l-2 1v-10l2-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Btn>
      <Btn title="Send to Back" isDark={isDark} onClick={onSendToBack}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 4v10l8 4V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 4l-2-1v10l2 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Btn>

      <Sep isDark={isDark} />

      {/* Export */}
      <div style={{ position: 'relative' }}>
        <Btn title="Export" isDark={isDark} onClick={() => setExportOpen(!exportOpen)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8m0 0L5 7m3 3l3-3M3 11v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Btn>
        {exportOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setExportOpen(false)} />
            <div style={{
              position: 'absolute', top: '100%', left: 0, marginTop: 4,
              background: isDark ? '#2d2d3d' : '#ffffff',
              border: `1px solid ${isDark ? '#3d3d4d' : '#e5e7eb'}`,
              borderRadius: 8, padding: 4, zIndex: 10001,
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)', minWidth: 170,
            }}>
              <DropItem isDark={isDark} onClick={() => { onExportPng(); setExportOpen(false) }}>Export as PNG</DropItem>
              <DropItem isDark={isDark} onClick={() => { onExportJpg(); setExportOpen(false) }}>Export as JPEG</DropItem>
              <DropItem isDark={isDark} onClick={() => { onExportSvg(); setExportOpen(false) }}>Export as SVG</DropItem>
              <DropItem isDark={isDark} onClick={() => { onExportJson(); setExportOpen(false) }}>Export as JSON</DropItem>
            </div>
          </>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Right */}
      <Btn title="Keyboard Shortcuts (Ctrl+/)" isDark={isDark} onClick={onShowShortcuts}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="4" width="14" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M4 7v2M6 6.5v3M8 7.5v1M10 6v3M12 6.5v3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        </svg>
      </Btn>
      <Btn title={isDark ? 'Light Mode' : 'Dark Mode'} isDark={isDark} onClick={onToggleDark}>
        {isDark ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8.5A5.5 5.5 0 117.5 3a4 4 0 005.5 5.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </Btn>
    </header>
  )
}

function Sep({ isDark }: { isDark: boolean }) {
  return <div style={{ width: 1, height: 20, background: isDark ? '#3d3d4d' : '#e5e7eb', margin: '0 4px', flexShrink: 0 }} />
}

function Btn({ children, title, isDark, onClick }: { children: React.ReactNode; title: string; isDark: boolean; onClick?: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 30, height: 30, borderRadius: 6, border: 'none',
        background: hover ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)') : 'transparent',
        color: isDark ? '#d1d5db' : '#4b5563', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.12s, color 0.12s',
      }}
    >
      {children}
    </button>
  )
}

function Badge({ children, isDark, icon }: { children: React.ReactNode; isDark: boolean; icon?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 3,
      padding: '2px 7px', borderRadius: 5,
      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      fontSize: 11, fontWeight: 500, color: isDark ? '#9ca3af' : '#6b7280',
    }}>
      {children}
    </div>
  )
}

function DropItem({ children, isDark, onClick }: { children: React.ReactNode; isDark: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', width: '100%', padding: '6px 10px',
        borderRadius: 6, border: 'none',
        background: hover ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent',
        color: isDark ? '#e5e7eb' : '#374151', cursor: 'pointer',
        fontSize: 13, fontWeight: 500, textAlign: 'left',
        transition: 'background 0.12s',
      }}
    >
      {children}
    </button>
  )
}

// ─── Inline ShortcutsDialog ───
function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const sections = [
    { title: 'Tools', items: [
      ['V', 'Select'], ['H', 'Hand / Pan'], ['D', 'Draw'], ['E', 'Eraser'],
      ['A', 'Arrow'], ['L', 'Line'], ['T', 'Text'], ['N', 'Sticky Note'],
      ['R', 'Rectangle'], ['O', 'Ellipse'], ['F', 'Frame'], ['K', 'Laser'],
      ['Shift+D', 'Highlight'], ['Ctrl+U', 'Insert Media'],
    ]},
    { title: 'Actions', items: [
      ['Ctrl+Z', 'Undo'], ['Ctrl+Shift+Z', 'Redo'], ['Ctrl+D', 'Duplicate'],
      ['Ctrl+G', 'Group'], ['Ctrl+Shift+G', 'Ungroup'], ['Ctrl+A', 'Select All'],
      ['Delete', 'Delete'], ['Ctrl+C', 'Copy'], ['Ctrl+X', 'Cut'], ['Ctrl+V', 'Paste'],
    ]},
    { title: 'View', items: [
      ['Ctrl+=', 'Zoom In'], ['Ctrl+-', 'Zoom Out'], ['Shift+0', 'Zoom 100%'],
      ['Shift+1', 'Zoom to Fit'], ['Shift+2', 'Zoom to Selection'],
      ['Space', 'Pan Canvas'], ['Alt+←/→', 'Prev/Next Page'],
    ]},
    { title: 'Arrange', items: [
      ['Alt+A', 'Align Left'], ['Alt+H', 'Align Center'], [']', 'Bring Front'],
      ['[', 'Send Back'], ['Shift+L', 'Toggle Lock'], ['Shift+.', 'Rotate CW'],
    ]},
    { title: 'Export', items: [
      ['Ctrl+Shift+C', 'Export SVG'], ['Ctrl+/', 'Shortcuts'], ['Shift+F', 'Flatten to Image'],
    ]},
  ]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 20000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: 16, width: 480, maxHeight: '80vh',
          overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>Keyboard Shortcuts</h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9ca3af' }}>Press Ctrl + / to toggle</p>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, border: '1px solid #e5e7eb',
            background: '#f9fafb', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#6b7280',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ padding: '12px 20px 20px' }}>
          {sections.map(s => (
            <div key={s.title} style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669', marginBottom: 6 }}>{s.title}</h3>
              {s.items.map(([keys, action]) => (
                <div key={keys} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>{action}</span>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {keys.split('+').map((k, i) => (
                      <span key={i} style={{ display: 'flex', gap: 2 }}>
                        <kbd style={{
                          padding: '1px 5px', borderRadius: 4,
                          border: '1px solid #d1d5db', background: '#f9fafb',
                          fontSize: 10, fontWeight: 600, color: '#374151', fontFamily: 'monospace',
                        }}>{k.trim()}</kbd>
                        {i < keys.split('+').length - 1 && <span style={{ color: '#9ca3af', fontSize: 10 }}>+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
