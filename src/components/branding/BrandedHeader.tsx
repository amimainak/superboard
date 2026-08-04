'use client';

import { useAppStore } from '@/store/app-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, LogOut } from 'lucide-react';
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

export default function BrandedHeader({ onEndLesson }: Props) {
  const branding = useAppStore((s) => s.room.branding);
  const subject = useAppStore((s) => s.room.subject);
  const isTutor = useAppStore((s) => s.room.isTutor);

  const hasAgencyBranding = !!(branding.logoUrl || branding.agencyName);

  return (
    <header className="flex items-center justify-between h-12 px-4 border-b bg-white shrink-0">
      {/* Left: Logo + Name */}
      <div className="flex items-center gap-2.5 min-w-0">
        {hasAgencyBranding && branding.logoUrl ? (
          <img
            src={branding.logoUrl}
            alt=""
            className="size-7 rounded-md object-contain"
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
