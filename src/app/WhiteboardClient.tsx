'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { Tldraw, exportAs, exportToString, copyAs, Editor } from 'tldraw'
import 'tldraw/tldraw.css'
import { TopBar } from './TopBar'
import { ShortcutsDialog } from './ShortcutsDialog'

export default function WhiteboardClient() {
  const editorRef = useRef<Editor | null>(null)
  const [isDark, setIsDark] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [currentTool, setCurrentTool] = useState('select')
  const [currentPage, setCurrentPage] = useState('Page 1')
  const [zoom, setZoom] = useState(100)

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor

    // Enable snapping
    editor.user.updateUserPreferences({
      colorScheme: 'light',
      snapMode: 'all',
    })

    editor.setCurrentTool('select')

    // Listen for tool changes
    const toolChangeUnsubscribe = editor.on('change-event', () => {
      setCurrentTool(editor.getCurrentToolId())
      const page = editor.getCurrentPage()
      setCurrentPage(page.name || 'Page 1')
      const cam = editor.getCamera()
      setZoom(Math.round(cam.zoom * 100))
    })

    return () => {
      toolChangeUnsubscribe()
    }
  }, [])

  // Listen for keyboard shortcut to toggle shortcuts dialog
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

  // Handle file drops for image upload
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    const editor = editorRef.current
    if (!editor) return

    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        try {
          const point = editor.screenToPage({ x: e.clientX, y: e.clientY })
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

  // Export functions
  const handleExportPng = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const ids = [...editor.getCurrentPageShapeIds()]
    exportAs(editor, ids, { format: 'png', name: 'whiteboard-export' })
  }, [])

  const handleExportSvg = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const ids = [...editor.getCurrentPageShapeIds()]
    exportAs(editor, ids, { format: 'svg', name: 'whiteboard-export' })
  }, [])

  const handleExportJson = useCallback(async () => {
    const editor = editorRef.current
    if (!editor) return
    const json = await exportToString(editor, [...editor.getCurrentPageShapeIds()], 'json')
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'whiteboard-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleExportJpg = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const ids = [...editor.getCurrentPageShapeIds()]
    exportAs(editor, ids, { format: 'jpeg', name: 'whiteboard-export', quality: 0.92 })
  }, [])

  // Dark mode toggle
  const handleToggleDark = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.setColorMode(isDark ? 'light' : 'dark')
    setIsDark(!isDark)
  }, [isDark])

  // Group/Ungroup
  const handleGroup = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const selected = editor.getSelectedShapeIds()
    if (selected.length >= 2) {
      editor.groupShapes(selected, { select: true })
    }
  }, [])

  const handleUngroup = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const selected = editor.getSelectedShapeIds()
    editor.ungroupShapes(selected, { select: true })
  }, [])

  // Lock/Unlock
  const handleToggleLock = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    const selected = editor.getSelectedShapeIds()
    editor.toggleLock(selected)
  }, [])

  // Select All
  const handleSelectAll = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.selectAll()
  }, [])

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    const editor = editorRef.current
    editor?.zoomIn()
  }, [])

  const handleZoomOut = useCallback(() => {
    const editor = editorRef.current
    editor?.zoomOut()
  }, [])

  const handleZoomFit = useCallback(() => {
    const editor = editorRef.current
    editor?.zoomToFit()
  }, [])

  const handleZoomReset = useCallback(() => {
    const editor = editorRef.current
    editor?.resetZoom()
  }, [])

  // Bring to front / send to back
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

  return (
    <div
      className="whiteboard-root"
      style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <TopBar
        isDark={isDark}
        onToggleDark={handleToggleDark}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onExportJson={handleExportJson}
        onExportJpg={handleExportJpg}
        onShowShortcuts={() => setShowShortcuts(true)}
        onGroup={handleGroup}
        onUngroup={handleUngroup}
        onToggleLock={handleToggleLock}
        onSelectAll={handleSelectAll}
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

      <div style={{ flex: 1, position: 'relative' }}>
        <Tldraw
          onMount={handleMount}
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
            actionShortcutsLocation: 'swap',
          }}
          components={{
            // Use default components — they already include all tools
            // We override nothing so tldraw shows its full toolbar
          }}
        />
      </div>

      {showShortcuts && (
        <ShortcutsDialog onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  )
}
