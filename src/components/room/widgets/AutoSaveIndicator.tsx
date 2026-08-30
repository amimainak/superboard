'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

interface AutoSaveIndicatorProps {
  /** 'saved' | 'saving' | 'error' | 'unsaved' */
  status: string
}

export function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
  const isDark = useWhiteboardStore((s) => s.isDark)
  const visibleRef = useRef(false)
  const subscribers = useRef(new Set<() => void>())

  const visible = useSyncExternalStore(
    (callback) => {
      subscribers.current.add(callback)
      return () => { subscribers.current.delete(callback) }
    },
    () => visibleRef.current,
  )

  useEffect(() => {
    visibleRef.current = true
    subscribers.current.forEach((cb) => cb())
    const timer = setTimeout(() => {
      visibleRef.current = false
      subscribers.current.forEach((cb) => cb())
    }, 2000)
    return () => clearTimeout(timer)
  }, [status])

  if (!visible && status === 'saved') return null

  const config = {
    saved: { color: '#22c55e', label: 'Saved', dot: 'rgba(34,197,94,0.5)' },
    saving: { color: '#f59e0b', label: 'Saving...', dot: 'rgba(245,158,11,0.5)' },
    error: { color: '#ef4444', label: 'Save failed', dot: 'rgba(239,68,68,0.5)' },
    unsaved: { color: '#f59e0b', label: 'Unsaved changes', dot: 'rgba(245,158,11,0.5)' },
  }[status] || { color: '#64748b', label: status, dot: 'rgba(100,116,139,0.3)' }

  return (
    <div className={"auto-save-indicator" + (isDark ? '' : ' auto-save-indicator-light')} style={{
      opacity: visible ? 1 : 0,
    }}>
      <span className="auto-save-dot" style={{ background: config.dot }} />
      {config.label}
    </div>
  )
}
