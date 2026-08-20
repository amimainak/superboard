// Supabase-backed performance persistence for whiteboard tutoring
// Tracks student answers, computes mastery, and provides spaced-repetition ordering.
// All data stored in Supabase `student_mastery` table.

export interface ExerciseMastery {
  correct: number
  total: number
  lastSeen: number
  lastCorrect: boolean
}

export interface WidgetProgress {
  widgetKind: string
  totalAttempted: number
  totalCorrect: number
  accuracy: number
  exerciseCount: number
  masteredCount: number
}

type RoomMasteryMap = Record<string, Record<string, ExerciseMastery>>

// Client-side cache to avoid excessive API calls
const cache = new Map<string, RoomMasteryMap>()
const CACHE_TTL = 10_000 // 10 seconds
const cacheTimestamps = new Map<string, number>()

function isCacheValid(roomId: string): boolean {
  const ts = cacheTimestamps.get(roomId)
  if (!ts) return false
  return Date.now() - ts < CACHE_TTL
}

function setCache(roomId: string, data: RoomMasteryMap): void {
  cache.set(roomId, data)
  cacheTimestamps.set(roomId, Date.now())
}

function getCache(roomId: string): RoomMasteryMap {
  return cache.get(roomId) || {}
}

/**
 * Load mastery data from Supabase.
 */
async function loadMastery(roomId: string, widgetKind?: string): Promise<RoomMasteryMap> {
  const params = new URLSearchParams({ roomId })
  if (widgetKind) params.set('widgetKind', widgetKind)

  try {
    const res = await fetch('/api/lang/mastery?' + params.toString())
    if (!res.ok) return {}
    const json = await res.json()
    const result: RoomMasteryMap = {}

    const rows = json.mastery || []
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i]
      if (!result[row.widget_kind]) result[row.widget_kind] = {}
      result[row.widget_kind][row.exercise_id] = {
        correct: row.correct || 0,
        total: row.total || 0,
        lastSeen: row.lastSeen || 0,
        lastCorrect: row.lastCorrect || false,
      }
    }
    return result
  } catch {
    return {}
  }
}

/**
 * Record a student's answer to an exercise.
 */
export async function recordAnswer(params: {
  roomId: string
  widgetKind: string
  exerciseId: string
  correct: boolean
  userId?: string
}): Promise<void> {
  const { roomId, widgetKind, exerciseId, correct, userId } = params

  // Fire and forget — POST to API
  fetch('/api/lang/mastery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, widgetKind, exerciseId, correct, userId }),
  }).catch(function() { /* network error — ignore */ })

  // Update local cache optimistically
  var cached = getCache(roomId)
  if (!cached[widgetKind]) cached[widgetKind] = {}
  var widgetData = cached[widgetKind]
  var existing = widgetData[exerciseId]

  if (existing) {
    existing.correct += correct ? 1 : 0
    existing.total += 1
    existing.lastSeen = Date.now()
    existing.lastCorrect = correct
  } else {
    widgetData[exerciseId] = {
      correct: correct ? 1 : 0,
      total: 1,
      lastSeen: Date.now(),
      lastCorrect: correct,
    }
  }
  setCache(roomId, cached)
}

/**
 * Get mastery data for a specific widget kind.
 */
export async function getMastery(params: {
  roomId: string
  widgetKind: string
}): Promise<Record<string, ExerciseMastery>> {
  const { roomId, widgetKind } = params

  if (isCacheValid(roomId)) {
    var cachedData = getCache(roomId)
    return cachedData[widgetKind] || {}
  }

  const data = await loadMastery(roomId, widgetKind)
  // Merge into cache
  var existingData = getCache(roomId)
  var keys = Object.keys(data)
  for (var i = 0; i < keys.length; i++) {
    var wk = keys[i]
    if (!existingData[wk]) existingData[wk] = {}
    var exercises = data[wk]
    var exKeys = Object.keys(exercises)
    for (var j = 0; j < exKeys.length; j++) {
      existingData[wk][exKeys[j]] = exercises[exKeys[j]]
    }
  }
  setCache(roomId, existingData)
  return existingData[widgetKind] || {}
}

/**
 * Get a spaced repetition queue: returns exercise IDs sorted by priority.
 */
export async function getSpacedRepetitionQueue(params: {
  roomId: string
  widgetKind: string
  allExerciseIds: string[]
}): Promise<string[]> {
  const { roomId, widgetKind, allExerciseIds } = params
  const mastery = await getMastery({ roomId, widgetKind })

  return [...allExerciseIds].sort(function (a, b) {
    const ma = mastery[a]
    const mb = mastery[b]

    const aSeen = ma !== undefined ? 1 : 0
    const bSeen = mb !== undefined ? 1 : 0
    if (aSeen !== bSeen) return aSeen - bSeen

    if (!ma && !mb) return 0
    if (!ma) return -1
    if (!mb) return 1

    if (ma.lastCorrect !== mb.lastCorrect) {
      return ma.lastCorrect ? 1 : -1
    }

    if (ma.lastSeen !== mb.lastSeen) {
      return ma.lastSeen - mb.lastSeen
    }

    const aAcc = ma.total > 0 ? ma.correct / ma.total : 1
    const bAcc = mb.total > 0 ? mb.correct / mb.total : 1
    return aAcc - bAcc
  })
}

/**
 * Get overall progress summary for all widgets in a room.
 */
export async function getProgressSummary(roomId: string): Promise<Record<string, WidgetProgress>> {
  const data = await loadMastery(roomId)
  const result: Record<string, WidgetProgress> = {}

  var wKeys = Object.keys(data)
  for (var w = 0; w < wKeys.length; w++) {
    var widgetKind = wKeys[w]
    var exercises = data[widgetKind]
    var totalAttempted = 0
    var totalCorrect = 0
    var masteredCount = 0

    var eKeys = Object.keys(exercises)
    for (var e = 0; e < eKeys.length; e++) {
      var em = exercises[eKeys[e]]
      totalAttempted += em.total
      totalCorrect += em.correct
      var acc = em.total > 0 ? em.correct / em.total : 0
      if (em.correct >= 3 && acc >= 0.7) {
        masteredCount++
      }
    }

    var exerciseCount = eKeys.length
    var accuracy = totalAttempted > 0 ? totalCorrect / totalAttempted : 0

    result[widgetKind] = {
      widgetKind,
      totalAttempted,
      totalCorrect,
      accuracy,
      exerciseCount,
      masteredCount,
    }
  }

  return result
}

/**
 * Clear all data for a room.
 */
export async function clearRoomData(roomId: string): Promise<void> {
  fetch('/api/lang/mastery?roomId=' + roomId, {
    method: 'DELETE',
  }).catch(function() { /* ignore */ })

  cache.delete(roomId)
  cacheTimestamps.delete(roomId)
}
