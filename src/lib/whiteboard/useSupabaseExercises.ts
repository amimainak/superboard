// ============================================================
// useSupabaseExercises — Fetches language exercises from Supabase
// Falls back to static data if the API is unreachable.
// Used by all exercise-based language widgets.
// ============================================================

'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

export interface SupabaseExercise {
  id: string
  widget_kind: string
  discriminator: string
  difficulty: string
  band: string
  question: string
  options: string[]
  correctIndex: number
  explanations: string[]
  baseSentence: string | null
  passage: string | null
}

export interface SupabaseVocabCard {
  id: string
  word: string
  definition: string
  example: string
  pos: string
  level: string
}

interface UseExercisesOptions {
  widgetKind: string
  discriminator?: string[]
  difficulty?: string
  band?: string
  staticFallback?: () => any[]  // returns the static data array
  enabled?: boolean
}

interface UseVocabOptions {
  pos?: string[]
  level?: string
  staticFallback?: () => any[]
  enabled?: boolean
}

/**
 * Fetches exercises from Supabase API with static fallback.
 */
export function useSupabaseExercises(options: UseExercisesOptions) {
  const { widgetKind, discriminator, difficulty, band, staticFallback, enabled = true } = options
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fromSupabase, setFromSupabase] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(function () {
    if (!enabled || fetchedRef.current) {
      if (!enabled) setLoading(false)
      return
    }
    fetchedRef.current = true

    let cancelled = false
    const params = new URLSearchParams({ widgetKind })
    if (difficulty && difficulty !== 'all') params.set('difficulty', difficulty)
    if (band && band !== 'all') params.set('band', band)
    if (discriminator && discriminator.length > 0) {
      params.set('discriminator', discriminator.join(','))
    }

    fetch('/api/lang/exercises?' + params.toString())
      .then(function (res) {
        if (!res.ok) throw new Error('API error')
        return res.json()
      })
      .then(function (json) {
        if (cancelled) return
        if (json.exercises && json.exercises.length > 0) {
          setExercises(json.exercises)
          setFromSupabase(true)
        } else if (staticFallback) {
          setExercises(staticFallback())
          setFromSupabase(false)
        } else {
          setExercises([])
        }
      })
      .catch(function () {
        if (cancelled) return
        // Fallback to static data
        if (staticFallback) {
          setExercises(staticFallback())
        }
        setFromSupabase(false)
      })
      .finally(function () {
        if (!cancelled) setLoading(false)
      })

    return function () { cancelled = true }
  }, [widgetKind, discriminator?.join(','), difficulty, band, enabled])

  // Shuffle helper (Fisher-Yates)
  const shuffle = useCallback(function (arr: any[]) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp
    }
    return a
  }, [])

  // Get by ID
  const getById = useCallback(function (id: string) {
    return exercises.find(function (e: any) { return e.id === id })
  }, [exercises])

  // Filter helper
  const filter = useCallback(function (filters: { discriminator?: string[]; difficulty?: string; band?: string }) {
    let result = exercises
    if (filters.discriminator && filters.discriminator.length > 0) {
      result = result.filter(function (e: any) { return filters.discriminator!.includes(e.discriminator || e.rule || e.type || e.category) })
    }
    if (filters.difficulty && filters.difficulty !== 'all') {
      result = result.filter(function (e: any) { return e.difficulty === filters.difficulty })
    }
    if (filters.band && filters.band !== 'all') {
      result = result.filter(function (e: any) { return e.band === filters.band })
    }
    return result
  }, [exercises])

  return { exercises, loading, fromSupabase, shuffle, getById, filter }
}

/**
 * Fetches vocab cards from Supabase API with static fallback.
 */
export function useSupabaseVocab(options: UseVocabOptions) {
  const { pos, level, staticFallback, enabled = true } = options
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fromSupabase, setFromSupabase] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(function () {
    if (!enabled || fetchedRef.current) {
      if (!enabled) setLoading(false)
      return
    }
    fetchedRef.current = true

    let cancelled = false
    const params = new URLSearchParams()
    if (pos && pos.length > 0) params.set('pos', pos.join(','))
    if (level && level !== 'all') params.set('level', level)

    fetch('/api/lang/vocab?' + params.toString())
      .then(function (res) {
        if (!res.ok) throw new Error('API error')
        return res.json()
      })
      .then(function (json) {
        if (cancelled) return
        if (json.cards && json.cards.length > 0) {
          setCards(json.cards)
          setFromSupabase(true)
        } else if (staticFallback) {
          setCards(staticFallback())
          setFromSupabase(false)
        } else {
          setCards([])
        }
      })
      .catch(function () {
        if (cancelled) return
        if (staticFallback) {
          setCards(staticFallback())
        }
        setFromSupabase(false)
      })
      .finally(function () {
        if (!cancelled) setLoading(false)
      })

    return function () { cancelled = true }
  }, [pos?.join(','), level, enabled])

  const shuffle = useCallback(function (arr: any[]) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp
    }
    return a
  }, [])

  return { cards, loading, fromSupabase, shuffle }
}
