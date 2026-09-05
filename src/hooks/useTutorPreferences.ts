// ============================================================
// useTutorPreferences — fetch tutor's feature toggles
// ============================================================
// Returns the tutor's preferences (normalized with defaults) and
// a loading flag. Refetches when `enabled` changes (default: true).
//
// Used by OverviewTab and BoardLibrary to gate the "Start Lesson"
// buttons behind their respective preference toggles.
// ============================================================

'use client'

import { useEffect, useState } from 'react'
import { authFetch } from '@/lib/auth-fetch'

export interface TutorPreferences {
  startLessonFromProfile: boolean
  startLessonFromLibrary: boolean
}

const DEFAULTS: TutorPreferences = {
  startLessonFromProfile: true,
  startLessonFromLibrary: true,
}

export function useTutorPreferences(enabled = true) {
  const [prefs, setPrefs] = useState<TutorPreferences>(DEFAULTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    authFetch('/api/user/preferences')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        if (data?.preferences) {
          setPrefs({ ...DEFAULTS, ...data.preferences })
        }
      })
      .catch(() => {
        // Silent — defaults are used on error
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [enabled])

  return { prefs, loading }
}
