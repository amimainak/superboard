'use client';

import { useCredits } from '@/hooks/useCredits';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Video, ArrowUpRight } from 'lucide-react';

export default function UsageBar() {
  const tier = useAppStore((s) => s.tier);
  const openPaywall = useAppStore((s) => s.openPaywall);

  const {
    aiCreditsUsed,
    aiCreditsLimit,
    aiCreditsExhausted,
    videoMinutesUsed,
    videoMinutesLimit,
    videoMinutesExhausted,
    loading,
  } = useCredits();

  // Hidden entirely for AGENCY tier (unlimited)
  if (tier === 'AGENCY') return null;

  // Don't render while data is loading to avoid flash of zeros
  if (loading) return null;

  const aiPct =
    aiCreditsLimit === Infinity
      ? 0
      : Math.min((aiCreditsUsed / aiCreditsLimit) * 100, 100);
  const videoPct =
    videoMinutesLimit === Infinity
      ? 0
      : Math.min((videoMinutesUsed / videoMinutesLimit) * 100, 100);

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none">
      <div className="mx-auto max-w-3xl px-3 pb-3 pointer-events-auto">
        <div className="rounded-xl border bg-white shadow-lg px-4 py-2.5 flex items-center gap-5 text-xs">
          {/* Smart Credits */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Sparkles className="size-3.5 shrink-0 text-primary" />
            {aiCreditsExhausted ? (
              <Button
                variant="destructive"
                size="sm"
                className="h-6 px-2.5 text-xs font-semibold gap-1"
                onClick={() => openPaywall('Smart Credits exhausted')}
              >
                Upgrade
                <ArrowUpRight className="size-3" />
              </Button>
            ) : (
              <>
                <span className="whitespace-nowrap text-muted-foreground">
                  Smart Credits: {aiCreditsUsed}/{aiCreditsLimit === Infinity ? '∞' : aiCreditsLimit}
                </span>
                <Progress
                  value={aiPct}
                  className="h-1.5 w-20"
                />
              </>
            )}
          </div>

          {/* Separator */}
          <div className="h-4 w-px bg-border" />

          {/* Video minutes */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Video className="size-3.5 shrink-0 text-primary" />
            {videoMinutesExhausted ? (
              <Button
                variant="destructive"
                size="sm"
                className="h-6 px-2.5 text-xs font-semibold gap-1"
                onClick={() => openPaywall('Video minutes exhausted')}
              >
                Upgrade
                <ArrowUpRight className="size-3" />
              </Button>
            ) : (
              <>
                <span className="whitespace-nowrap text-muted-foreground">
                  Video: {videoMinutesUsed}/{videoMinutesLimit === Infinity ? '∞' : videoMinutesLimit} min
                </span>
                <Progress
                  value={videoPct}
                  className="h-1.5 w-20"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
