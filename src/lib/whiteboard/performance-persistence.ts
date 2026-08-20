// localStorage-based performance persistence for whiteboard tutoring
// Tracks student answers, computes mastery, and provides spaced-repetition ordering.

export interface ExerciseMastery {
  correct: number
  total: number
  lastSeen: number // timestamp
  lastCorrect: boolean
}

export interface WidgetProgress {
  widgetKind: string
  totalAttempted: number
  totalCorrect: number
  accuracy: number // 0-1
  exerciseCount: number // unique exercises attempted
  masteredCount: number // exercises with 3+ correct and accuracy >= 0.7
}

type RoomData = Record<string, Record<string, ExerciseMastery>>;

function storageKey(roomId: string): string {
  return `wb-perf-${roomId}`;
}

function loadRoomData(roomId: string): RoomData {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(storageKey(roomId));
    if (!raw) return {};
    return JSON.parse(raw) as RoomData;
  } catch {
    return {};
  }
}

function saveRoomData(roomId: string, data: RoomData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(roomId), JSON.stringify(data));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/**
 * Record a student's answer to an exercise.
 */
export function recordAnswer(params: {
  roomId: string
  widgetKind: string
  exerciseId: string
  correct: boolean
}): void {
  const { roomId, widgetKind, exerciseId, correct } = params;
  const data = loadRoomData(roomId);

  const widgetData = (data[widgetKind] ??= {});

  const existing = widgetData[exerciseId];

  if (existing) {
    existing.correct += correct ? 1 : 0;
    existing.total += 1;
    existing.lastSeen = Date.now();
    existing.lastCorrect = correct;
  } else {
    widgetData[exerciseId] = {
      correct: correct ? 1 : 0,
      total: 1,
      lastSeen: Date.now(),
      lastCorrect: correct,
    };
  }

  saveRoomData(roomId, data);
}

/**
 * Get mastery data for a specific widget kind.
 */
export function getMastery(params: {
  roomId: string
  widgetKind: string
}): Record<string, ExerciseMastery> {
  const { roomId, widgetKind } = params;
  const data = loadRoomData(roomId);
  return data[widgetKind] ?? {};
}

/**
 * Get a spaced repetition queue: returns exercise IDs sorted by priority.
 *
 * Priority order:
 *  1. Not-yet-seen items first
 *  2. Wrong items before right
 *  3. Older lastSeen first
 *  4. Lower accuracy first
 */
export function getSpacedRepetitionQueue(params: {
  roomId: string
  widgetKind: string
  allExerciseIds: string[]
}): string[] {
  const { roomId, widgetKind, allExerciseIds } = params;
  const mastery = getMastery({ roomId, widgetKind });

  return [...allExerciseIds].sort((a, b) => {
    const ma = mastery[a];
    const mb = mastery[b];

    // 1) Not-seen items first
    const aSeen = ma !== undefined ? 1 : 0;
    const bSeen = mb !== undefined ? 1 : 0;
    if (aSeen !== bSeen) return aSeen - bSeen;

    // If both unseen, maintain original relative order (stable-ish)
    if (!ma && !mb) return 0;
    if (!ma) return -1;
    if (!mb) return 1;

    // 2) Wrong items before right (last incorrect answer → higher priority)
    if (ma.lastCorrect !== mb.lastCorrect) {
      return ma.lastCorrect ? 1 : -1; // incorrect first
    }

    // 3) Older lastSeen first
    if (ma.lastSeen !== mb.lastSeen) {
      return ma.lastSeen - mb.lastSeen;
    }

    // 4) Lower accuracy first
    const aAcc = ma.total > 0 ? ma.correct / ma.total : 1;
    const bAcc = mb.total > 0 ? mb.correct / mb.total : 1;
    return aAcc - bAcc;
  });
}

/**
 * Get overall progress summary for all widgets in a room.
 */
export function getProgressSummary(roomId: string): Record<string, WidgetProgress> {
  const data = loadRoomData(roomId);
  const result: Record<string, WidgetProgress> = {};

  for (const [widgetKind, exercises] of Object.entries(data)) {
    let totalAttempted = 0;
    let totalCorrect = 0;
    let masteredCount = 0;

    for (const em of Object.values(exercises)) {
      totalAttempted += em.total;
      totalCorrect += em.correct;
      const acc = em.total > 0 ? em.correct / em.total : 0;
      if (em.correct >= 3 && acc >= 0.7) {
        masteredCount++;
      }
    }

    const exerciseCount = Object.keys(exercises).length;
    const accuracy = totalAttempted > 0 ? totalCorrect / totalAttempted : 0;

    result[widgetKind] = {
      widgetKind,
      totalAttempted,
      totalCorrect,
      accuracy,
      exerciseCount,
      masteredCount,
    };
  }

  return result;
}

/**
 * Clear all data for a room.
 */
export function clearRoomData(roomId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(storageKey(roomId));
  } catch {
    // silently ignore
  }
}
