// ============================================================
// HealthToolkit — Health & Wellness Subject Toolkit
// ============================================================

'use client';

import React from 'react';
import { SectionLabel } from './ToolkitShared';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app-store';
import {
  Apple,
  SmilePlus,
  HeartPulse,
} from 'lucide-react';

interface HealthToolkitProps {
  editor: unknown;
}

export default function HealthToolkit({ editor: _editor }: HealthToolkitProps) {
  const handleFoodLabel = () => {
    useAppStore.getState().toggleFoodLabel();
  };

  const handleMoodJournal = () => {
    useAppStore.getState().toggleMoodJournal();
  };

  const handleBodySystems = () => {
    useAppStore.getState().toggleBodySystems();
  };

  return (
    <div className="flex flex-col gap-1">
      {/* ---- Nutrition ---- */}
      <SectionLabel>Nutrition</SectionLabel>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9"
            onClick={handleFoodLabel}
          >
            <Apple className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Food Label</TooltipContent>
      </Tooltip>

      <Separator className="my-1 w-8" />

      {/* ---- Wellness ---- */}
      <SectionLabel>Wellness</SectionLabel>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9"
            onClick={handleMoodJournal}
          >
            <SmilePlus className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Mood Journal</TooltipContent>
      </Tooltip>

      <Separator className="my-1 w-8" />

      {/* ---- Anatomy ---- */}
      <SectionLabel>Anatomy</SectionLabel>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9"
            onClick={handleBodySystems}
          >
            <HeartPulse className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Body Systems</TooltipContent>
      </Tooltip>
    </div>
  );
}
