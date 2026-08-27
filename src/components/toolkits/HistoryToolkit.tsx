// ============================================================
// HistoryToolkit — History & Social Studies Subject Toolkit
// ============================================================

'use client';

import React from 'react';
import { SectionLabel, LockOverlay } from './ToolkitShared';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app-store';
import type { AIAction } from '@/types';
import {
  Map,
  Clock,
  GitBranch,
  FileText,
  Dna,
  TimerReset,
  BrainCircuit,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface HistoryToolkitProps {
  editor: unknown;
}

const HISTORY_TOOLS = [
  { id: 'map-overlays', icon: Map, label: 'Map Overlays', storeAction: 'toggleMapPanel' as const },
  { id: 'timeline-builder', icon: Clock, label: 'Timeline Builder', storeAction: 'toggleTimelinePanel' as const },
  { id: 'cause-effect', icon: GitBranch, label: 'Cause & Effect', storeAction: 'toggleCauseEffectPanel' as const },
  { id: 'dbq-workspace', icon: FileText, label: 'DBQ Workspace', storeAction: 'toggleDBQWorkspace' as const },
] as const;

const SCIENCE_TOOLS_INLINE = [
  { id: 'punnett-square', icon: Dna, label: 'Punnett Square', storeAction: 'togglePunnettSquare' as const },
] as const;

const PREMIUM_FEATURES: {
  id: AIAction;
  icon: React.ElementType;
  label: string;
  description: string;
}[] = [
  {
    id: 'TIMELINE_GENERATOR',
    icon: TimerReset,
    label: 'Smart Timeline Generator',
    description: 'Generate historical timelines from topics',
  },
  {
    id: 'CONCEPT_SUMMARIZER',
    icon: BrainCircuit,
    label: 'Smart Concept Summarizer',
    description: 'Summarize whiteboard content into key concepts',
  },
  {
    id: 'QUIZ',
    icon: BookOpen,
    label: 'History Quiz',
    description: 'Generate history quizzes from topics',
  },
];

export default function HistoryToolkit({ editor: _editor }: HistoryToolkitProps) {
  const tier = useAppStore((s) => s.tier);
  const openPaywall = useAppStore((s) => s.openPaywall);
  const isPremium = tier === 'PRO' || tier === 'AGENCY';

  const handleHistoryTool = (storeAction: 'toggleMapPanel' | 'toggleTimelinePanel' | 'toggleCauseEffectPanel' | 'toggleDBQWorkspace' | 'togglePunnettSquare') => {
    const store = useAppStore.getState();
    (store as unknown as Record<string, () => void>)[storeAction]();
  };

  const handlePremiumFeature = (featureId: AIAction) => {
    if (!isPremium) {
      openPaywall(featureId);
      return;
    }
    const store = useAppStore.getState();
    if (!store.aiPanelOpen) store.toggleAIPanel();
  };

  return (
    <div className="flex flex-col gap-1">
      {/* ---- History Tools ---- */}
      <SectionLabel>History</SectionLabel>
      {HISTORY_TOOLS.map((tool) => (
        <Tooltip key={tool.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => handleHistoryTool(tool.storeAction)}
            >
              <tool.icon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{tool.label}</TooltipContent>
        </Tooltip>
      ))}

      <Separator className="my-1 w-8" />

      {/* ---- Science-Cross Tools (Genetics) ---- */}
      <SectionLabel>Genetics</SectionLabel>
      {SCIENCE_TOOLS_INLINE.map((tool) => (
        <Tooltip key={tool.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => handleHistoryTool(tool.storeAction)}
            >
              <tool.icon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{tool.label}</TooltipContent>
        </Tooltip>
      ))}

      <Separator className="my-1 w-8" />

      {/* ---- Premium AI Features ---- */}
      <SectionLabel>Smart &amp; Premium</SectionLabel>
      {PREMIUM_FEATURES.map((feature) => (
        <Tooltip key={feature.id}>
          <TooltipTrigger asChild>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9"
                onClick={() => handlePremiumFeature(feature.id)}
                disabled={!isPremium}
              >
                <feature.icon className="w-4 h-4" />
              </Button>
              {!isPremium && <LockOverlay />}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            {feature.label}
            {!isPremium && ' (Pro)'}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
