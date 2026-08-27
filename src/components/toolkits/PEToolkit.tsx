// ============================================================
// PEToolkit — Physical Education Subject Toolkit
// ============================================================

'use client';

import React from 'react';
import { SectionLabel } from './ToolkitShared';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app-store';
import {
  CircleDot,
  Goal,
  Trophy,
  Volleyball,
  Swords,
  ClipboardList,
  Activity,
} from 'lucide-react';

interface PEToolkitProps {
  editor: unknown;
}

const SPORTS_FIELDS = [
  { id: 'basketball', icon: CircleDot, label: 'Basketball' },
  { id: 'soccer', icon: Goal, label: 'Soccer' },
  { id: 'football', icon: Trophy, label: 'Football' },
  { id: 'volleyball', icon: Volleyball, label: 'Volleyball' },
  { id: 'tennis', icon: Swords, label: 'Tennis' },
] as const;

export default function PEToolkit({ editor: _editor }: PEToolkitProps) {
  const handleSportsField = () => {
    useAppStore.getState().toggleSportsPlay();
  };

  const handleWorkoutPlan = () => {
    useAppStore.getState().toggleWorkoutPlan();
  };

  const handleFitnessTracker = () => {
    useAppStore.getState().toggleFitnessTracker();
  };

  return (
    <div className="flex flex-col gap-1">
      {/* ---- Backgrounds ---- */}
      <SectionLabel>Backgrounds</SectionLabel>

      <Separator className="my-1 w-8" />

      {/* ---- Sports Fields ---- */}
      <SectionLabel>Sports Fields</SectionLabel>
      {SPORTS_FIELDS.map((field) => (
        <Tooltip key={field.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={handleSportsField}
            >
              <field.icon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{field.label}</TooltipContent>
        </Tooltip>
      ))}

      <Separator className="my-1 w-8" />

      {/* ---- Exercises ---- */}
      <SectionLabel>Exercises</SectionLabel>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9"
            onClick={handleWorkoutPlan}
          >
            <ClipboardList className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Workout Plan</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9"
            onClick={handleFitnessTracker}
          >
            <Activity className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Fitness Tracker</TooltipContent>
      </Tooltip>
    </div>
  );
}
