// ============================================================
// useCredits Hook
// ============================================================
// Fetches current period usage from the backend and provides
// real-time credit tracking for the UsageBar component.
// Accepts an optional userId — if provided, passes it to the API.
// ============================================================

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import type { Tier } from '@/types';

interface UsageData {
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  videoMinutesUsed: number;
  videoMinutesLimit: number;
  recordingsUsed: number;
  recordingsLimit: number;
}

export function useCredits(userId?: string | null) {
  const { tier, setUsage, aiCreditsUsed, aiCreditsLimit, videoMinutesUsed, videoMinutesLimit } =
    useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`/api/usage/current?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }
      const data: UsageData = await response.json();
      setUsage(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId, setUsage]);

  useEffect(() => {
    fetchUsage();
    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, [fetchUsage]);

  const refresh = useCallback(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    tier,
    aiCreditsUsed,
    aiCreditsLimit,
    videoMinutesUsed,
    videoMinutesLimit,
    loading,
    error,
    refresh,
    aiCreditsRemaining: aiCreditsLimit === Infinity ? Infinity : aiCreditsLimit - aiCreditsUsed,
    aiCreditsExhausted:
      aiCreditsLimit !== Infinity && aiCreditsUsed >= aiCreditsLimit,
    videoMinutesExhausted:
      videoMinutesLimit !== Infinity && videoMinutesUsed >= videoMinutesLimit,
  };
}
