// ============================================================
// Tier & Usage Utilities
// ============================================================
// Server-side helpers for checking tier limits and usage.
// All gating logic MUST be server-side.
// ============================================================

import { db } from '@/lib/db';
import type { Tier, FeatureFlag } from '@/types';
import { TIER_LIMITS } from '@/types';

/**
 * Check if a user's tier has access to a specific feature.
 */
export function hasFeature(tier: Tier, feature: FeatureFlag): boolean {
  return TIER_LIMITS[tier].features[feature];
}

/**
 * Get the current or create a new usage log for the given period.
 * Free tier: period resets Monday 00:00 UTC.
 * Pro/Agency: period resets on billing cycle date.
 */
export async function getCurrentUsageLog(userId: string, tier: Tier) {
  const now = new Date();
  const periodStart = getPeriodStart(now, tier);

  // Try to find existing usage log for this period
  const existing = await db.usageLog.findUnique({
    where: {
      userId_periodStartDate: {
        userId,
        periodStartDate: periodStart,
      },
    },
  });

  if (existing) return existing;

  // Create new usage log for the period
  return db.usageLog.create({
    data: {
      userId,
      periodStartDate: periodStart,
      videoMinutesUsed: 0,
      aiCreditsUsed: 0,
      recordingsUsed: 0,
    },
  });
}

/**
 * Get the start of the current usage period.
 * Free tier: Monday 00:00 UTC.
 * Pro/Agency: First day of the month (simplified).
 */
function getPeriodStart(date: Date, tier: Tier): Date {
  if (tier === 'FREE') {
    // Find the most recent Monday
    const d = new Date(date);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    d.setUTCDate(diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  // Pro/Agency: Reset on billing cycle (first of month)
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  return d;
}

/**
 * Check if the user has remaining video minutes.
 * Returns { allowed: boolean, minutesUsed: number, minutesLimit: number }
 */
export async function checkVideoLimit(userId: string, tier: Tier) {
  const usageLog = await getCurrentUsageLog(userId, tier);
  const limit = TIER_LIMITS[tier].videoMinutesPerWeek;

  return {
    allowed: limit === Infinity || usageLog.videoMinutesUsed < limit,
    minutesUsed: usageLog.videoMinutesUsed,
    minutesLimit: limit,
  };
}

/**
 * Check if the user has remaining AI credits.
 * Returns { allowed: boolean, creditsUsed: number, creditsLimit: number }
 */
export async function checkAICreditLimit(userId: string, tier: Tier) {
  const usageLog = await getCurrentUsageLog(userId, tier);
  const limit =
    tier === 'FREE'
      ? TIER_LIMITS.FREE.aiCreditsPerWeek
      : tier === 'PRO'
        ? TIER_LIMITS.PRO.aiCreditsPerMonth
        : Infinity;

  return {
    allowed: limit === Infinity || usageLog.aiCreditsUsed < limit,
    creditsUsed: usageLog.aiCreditsUsed,
    creditsLimit: limit,
  };
}

/**
 * Increment AI credit usage by 1.
 */
export async function incrementAICredits(userId: string, tier: Tier) {
  const usageLog = await getCurrentUsageLog(userId, tier);
  return db.usageLog.update({
    where: { id: usageLog.id },
    data: { aiCreditsUsed: { increment: 1 } },
  });
}

/**
 * Increment video minutes used.
 */
export async function incrementVideoMinutes(userId: string, minutes: number, tier: Tier) {
  const usageLog = await getCurrentUsageLog(userId, tier);
  return db.usageLog.update({
    where: { id: usageLog.id },
    data: { videoMinutesUsed: { increment: minutes } },
  });
}

/**
 * Check recording limit for the tier.
 */
export async function checkRecordingLimit(userId: string, tier: Tier) {
  const usageLog = await getCurrentUsageLog(userId, tier);
  const limit = TIER_LIMITS[tier].recordingsPerMonth;

  return {
    allowed: limit === Infinity || usageLog.recordingsUsed < limit,
    recordingsUsed: usageLog.recordingsUsed,
    recordingsLimit: limit,
  };
}

/**
 * Increment recording count.
 */
export async function incrementRecordings(userId: string, tier: Tier) {
  const usageLog = await getCurrentUsageLog(userId, tier);
  return db.usageLog.update({
    where: { id: usageLog.id },
    data: { recordingsUsed: { increment: 1 } },
  });
}
