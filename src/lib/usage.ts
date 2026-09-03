// ============================================================
// Tier & Usage Utilities
// ============================================================
// Server-side helpers for checking tier limits and usage.
// All gating logic MUST be server-side.
// ============================================================

import { db } from '@/lib/db';
import type { Tier, FeatureFlag } from '@/types';
import { TIER_LIMITS, isAgencyTier } from '@/types';

/**
 * Check if a user's tier has access to a specific feature.
 */
export function hasFeature(tier: Tier, feature: FeatureFlag): boolean {
  // Handle legacy AGENCY tier — treat as AGENCY_STANDARD
  const effectiveTier = tier === 'AGENCY' ? 'AGENCY_STANDARD' : tier;
  if (!(effectiveTier in TIER_LIMITS)) return false;
  return TIER_LIMITS[effectiveTier as keyof typeof TIER_LIMITS].features[feature];
}

/**
 * Get the current or create a new usage log for the given period.
 * Free tier: period resets Monday 00:00 UTC.
 * Pro/Agency: period resets on billing cycle date (first of month).
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
      estimatedAiSpendCents: 0,
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
  const effectiveTier = tier === 'AGENCY' ? 'AGENCY_STANDARD' : tier;
  const limit = TIER_LIMITS[effectiveTier as keyof typeof TIER_LIMITS]?.videoMinutesPerWeek ?? Infinity;

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
  const effectiveTier = tier === 'AGENCY' ? 'AGENCY_STANDARD' : tier;

  let limit: number;
  if (effectiveTier === 'FREE') {
    limit = TIER_LIMITS.FREE.aiCreditsPerWeek;
  } else {
    // PRO and all agency tiers use aiCreditsPerMonth (now capped, not infinite)
    const config = TIER_LIMITS[effectiveTier as keyof typeof TIER_LIMITS];
    limit = 'aiCreditsPerMonth' in config ? config.aiCreditsPerMonth : Infinity;
  }

  // Agency shared credit cap: for sub-tutors, check aggregate usage
  // across all sub-tutors under the same agency owner
  if (isAgencyTier(effectiveTier)) {
    const agencyOwner = await db.user.findUnique({
      where: { id: userId },
      select: { parentAgencyId: true },
    });
    const agencyId = agencyOwner?.parentAgencyId || userId;

    if (agencyId !== userId) {
      // This is a sub-tutor — check agency-wide aggregate AI usage
      const agencyOwnerLog = await getCurrentUsageLog(agencyId, effectiveTier);
      const subTutors = await db.user.findMany({
        where: { parentAgencyId: agencyId },
        select: { id: true },
      });
      const subTutorIds = subTutors.map((t) => t.id);
      const subTutorLogs = await db.usageLog.findMany({
        where: { userId: { in: subTutorIds } },
      });
      const aggregateUsed = agencyOwnerLog.aiCreditsUsed
        + subTutorLogs.reduce((sum, log) => sum + log.aiCreditsUsed, 0);
      const aggregateCost = agencyOwnerLog.estimatedAiSpendCents
        + subTutorLogs.reduce((sum, log) => sum + (log.estimatedAiSpendCents || 0), 0);

      return {
        allowed: limit === Infinity || aggregateUsed < limit,
        creditsUsed: aggregateUsed,
        creditsLimit: limit,
        aiCostCents: aggregateCost,
        isAgencyShared: true,
      };
    }
  }

  return {
    allowed: limit === Infinity || usageLog.aiCreditsUsed < limit,
    creditsUsed: usageLog.aiCreditsUsed,
    creditsLimit: limit,
    aiCostCents: usageLog.estimatedAiSpendCents ?? 0,
  };
}

/**
 * Increment AI credit usage by a variable amount.
 * Uses CREDIT_COSTS map — different actions cost different credits.
 */
export async function incrementAICredits(userId: string, tier: Tier, cost: number = 1, costCents: number = 0) {
  const usageLog = await getCurrentUsageLog(userId, tier);
  const result = await db.usageLog.update({
    where: { id: usageLog.id },
    data: {
      aiCreditsUsed: { increment: cost },
      ...(costCents > 0 ? { estimatedAiSpendCents: { increment: costCents } } : {}),
    },
  });

  // Also track monthly AI spend on the user record for soft throttle
  // Note: monthlyAiBudgetCents not present in current User schema; tracked via UsageLog instead.

  return result;
}

// Check if user is over their AI cost budget (for soft throttle)
// Note: monthlyAiBudgetCents is not present on the User schema in the current
// database. Soft throttle is therefore based on the current period's
// estimatedAiSpendCents aggregated from UsageLog.
export async function isOverAIBudget(userId: string, tier: Tier): Promise<boolean> {
  if (tier === 'FREE') return false;
  const usageLog = await getCurrentUsageLog(userId, tier);
  const monthlySpendCents = usageLog.estimatedAiSpendCents ?? 0;
  // Pro: $3/month budget (300 cents) before soft throttle
  if (tier === 'PRO') return monthlySpendCents > 300;
  // Agency: $15/month budget (1500 cents) per sub-tutor before soft throttle
  if (isAgencyTier(tier)) return monthlySpendCents > 1500;
  return false;
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
 * Note: UsageLog has no `recordingsUsed` column in the current schema, so
 * we report 0 usage and rely on the tier limit alone for the gate.
 */
export async function checkRecordingLimit(userId: string, tier: Tier) {
  const _usageLog = await getCurrentUsageLog(userId, tier);
  const effectiveTier = tier === 'AGENCY' ? 'AGENCY_STANDARD' : tier;
  const limit = TIER_LIMITS[effectiveTier as keyof typeof TIER_LIMITS]?.recordingsPerMonth ?? 0;
  const recordingsUsed = 0;

  return {
    allowed: limit === Infinity || recordingsUsed < limit,
    recordingsUsed,
    recordingsLimit: limit,
  };
}

/**
 * Increment recording count.
 * Note: UsageLog has no `recordingsUsed` column in the current schema;
 * this is a no-op until the schema is extended.
 */
export async function incrementRecordings(userId: string, tier: Tier) {
  const usageLog = await getCurrentUsageLog(userId, tier);
  return usageLog;
}

/**
 * Estimate agency cost based on total hours and tier.
 * AGENCY_PREMIUM rate: $2/hr, all others: $3/hr.
 */
export function getEstimatedAgencyCost(totalHours: number, tier: string): number {
  const rate = tier === 'AGENCY_PREMIUM' ? 2 : 3;
  return totalHours * rate;
}
