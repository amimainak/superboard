'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'

interface AutoSaveIndicatorProps {
  /** 'saved' | 'saving' | 'error' | 'unsaved' */
  status: string
}

export function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
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
    <div className="auto-save-indicator" style={{
      position: 'absolute',
      bottom: 52,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '3px 10px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 500,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(4px)',
      color: config.color,
      transition: 'opacity 0.2s ease',
      opacity: visible ? 1 : 0,
      pointerEvents: 'none',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: config.dot,
      }} />
      {config.label}
    </div>
  )
}
