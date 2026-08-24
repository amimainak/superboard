'use client'

import { useState, useCallback } from 'react'

/**
 * Shared hook for collapsible toolkit sections.
 * Tracks which sections are collapsed and provides toggle/isCollapsed helpers.
 */
export function useCollapsibleSections() {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggle = useCallback((id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const isCollapsed = useCallback((id: string) => collapsed.has(id), [collapsed])

  return { isCollapsed, toggle }
}
