'use client';

import { useAppStore } from '@/store/app-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Image as ImageIcon, LogOut } from 'lucide-react';
import Link from 'next/link';
import type { Subject } from '@/types';

const SUBJECT_LABELS: Record<Subject, string> = {
  MATH: 'Mathematics',
  SCIENCE: 'Science',
  LANGUAGE: 'Language Arts',
  GENERAL: 'General',
};

type Props = {
  onEndLesson?: () => void;
};

/**
 * Validate a URL is safe for use in img src.
 * Only allows https:// URLs from allowed domains.
 * Prevents javascript: and data: URI XSS vectors.
 */
function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow HTTPS
    if (parsed.protocol !== 'https:') return false;
    // Block javascript: and data: URIs
    if (url.startsWith('javascript:') || url.startsWith('data:')) return false;
    return true;
  } catch {
    return false;
  }
}

export default function BrandedHeader({ onEndLesson }: Props) {
  const branding = useAppStore((s) => s.room.branding);
  const subject = useAppStore((s) => s.room.subject);
  const isTutor = useAppStore((s) => s.room.isTutor);

  const hasAgencyBranding = !!(branding.logoUrl || branding.agencyName);
  const safeLogoUrl = branding.logoUrl && isValidImageUrl(branding.logoUrl)
    ? branding.logoUrl
    : null;

  return (
    <header className="flex items-center justify-between h-12 px-4 border-b bg-white shrink-0">
      {/* Left: Back + Logo + Name */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Dashboard back link — visible only to tutors */}
        {isTutor && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 -ml-1 text-muted-foreground hover:text-foreground rounded-lg"
            asChild
          >
            <Link href="/">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </Button>
        )}
        {hasAgencyBranding && safeLogoUrl ? (
          <img
            src={safeLogoUrl}
            alt=""
            width={28}
            height={28}
            loading="lazy"
            className="size-7 rounded-md object-contain"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="size-7 rounded-md bg-primary/10 flex items-center justify-center">
            <ImageIcon className="size-4 text-primary" />
          </div>
        )}

        <span className="text-sm font-semibold truncate">
          {hasAgencyBranding ? branding.agencyName ?? 'Superboard' : 'Superboard'}
        </span>

        <Badge variant="secondary" className="hidden sm:inline-flex text-[11px]">
          {SUBJECT_LABELS[subject]}
        </Badge>
      </div>

      {/* Right: End Lesson (tutor only) */}
      {isTutor && onEndLesson && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={onEndLesson}
        >
          <LogOut className="size-3.5" />
          End Lesson
        </Button>
      )}
    </header>
  );
}
