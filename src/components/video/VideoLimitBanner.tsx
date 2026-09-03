// ============================================================
// VideoLimitBanner — Soft-stop in-lesson banner
// ============================================================
// Shown at the top of the room when video minutes are running low
// or exhausted. Non-intrusive bar — not a modal.
//   - 80%+ used: amber warning with upgrade CTA
//   - 100% reached: blue info banner, whiteboard + AI keep working
// ============================================================

'use client';

import { useAppStore } from '@/store/app-store';
import { AlertTriangle, Info, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShallow } from 'zustand/react/shallow'

export default function VideoLimitBanner() {
  const videoLimited = useAppStore((s) => s.videoLimited);
  const videoApproachingLimit = useAppStore((s) => s.videoApproachingLimit);
  const videoMinutesUsed = useAppStore((s) => s.videoMinutesUsed);
  const videoMinutesLimit = useAppStore((s) => s.videoMinutesLimit);
  const openPaywall = useAppStore((s) => s.openPaywall);

  // Don't show for unlimited tiers or when not in a room
  if (videoMinutesLimit === Infinity) return null;
  if (!videoLimited && !videoApproachingLimit) return null;

  const handleUpgrade = () => openPaywall('Video minutes limit');

  // --- At 100%: soft-stop info banner ---
  if (videoLimited) {
    return (
      <div className="relative z-40 flex items-center gap-3 px-4 py-2 bg-blue-50 border-b border-blue-200 text-blue-800 text-sm">
        <Info className="w-4 h-4 shrink-0 text-blue-500" />
        <span className="flex-1">
          Your weekly video limit has been reached ({videoMinutesUsed}/{videoMinutesLimit} min).{' '}
          <span className="font-medium">The whiteboard and AI tools continue to work.</span>
        </span>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 h-7 px-3 text-xs font-medium border-blue-300 text-blue-700 hover:bg-blue-100"
          onClick={handleUpgrade}
        >
          Upgrade
          <ArrowUpRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    );
  }

  // --- At 80%: amber approaching-limit warning ---
  const remaining = Math.max(0, Math.floor(videoMinutesLimit - videoMinutesUsed));
  return (
    <div className="relative z-40 flex items-center gap-3 px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm">
      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
      <span className="flex-1">
        You've used {videoMinutesUsed} of {videoMinutesLimit} free video minutes this week.
        {remaining > 0 && ` ${remaining} minute${remaining !== 1 ? 's' : ''} remaining.`}
      </span>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 h-7 px-3 text-xs font-medium border-amber-300 text-amber-700 hover:bg-amber-100"
        onClick={handleUpgrade}
      >
        Upgrade to Pro
        <ArrowUpRight className="w-3 h-3 ml-1" />
      </Button>
    </div>
  );
}
