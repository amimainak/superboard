// ============================================================
// GeneralToolkit — General-Purpose Subject Toolkit
// ============================================================

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app-store';
import type { AIAction } from '@/types';
import {
  Lock,
  Pen,
  StickyNote,
  ImagePlus,
  Shapes,
  Star,
  Heart,
  Lightbulb,
  Map,
  Clock,
  TimerReset,
  FileText,
  BrainCircuit,
} from 'lucide-react';

interface GeneralToolkitProps {
  editor: unknown;
}

const STANDARD_TOOLS = [
  { id: 'pen-fine', icon: Pen, label: 'Fine Pen' },
  { id: 'sticky-note', icon: StickyNote, label: 'Sticky Note' },
  { id: 'image-upload', icon: ImagePlus, label: 'Upload Image' },
  { id: 'shapes-library', icon: Shapes, label: 'Shapes Library' },
  { id: 'star-stamp', icon: Star, label: 'Star Stamp' },
  { id: 'heart-stamp', icon: Heart, label: 'Heart Stamp' },
] as const;

const SPECIAL_TOOLS = [
  { id: 'map-overlays', icon: Map, label: 'Map Overlays' },
  { id: 'timeline-builder', icon: Clock, label: 'Timeline Builder' },
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
];

export default function GeneralToolkit({ editor: _editor }: GeneralToolkitProps) {
  const tier = useAppStore((s) => s.tier);
  const openPaywall = useAppStore((s) => s.openPaywall);
  const isPremium = tier === 'PRO' || tier === 'AGENCY';

  const handleStandardTool = (toolId: string) => {
    // TODO: Activate standard tool via tldraw editor
    console.log('Standard tool:', toolId);
  };

  const handleMapOverlays = () => {
    // TODO: Open map overlay panel
    console.log('Map overlays');
  };

  const handleTimelineBuilder = () => {
    // TODO: Create timeline axis on canvas
    console.log('Timeline builder');
  };

  const handlePremiumFeature = (featureId: AIAction) => {
    if (!isPremium) {
      openPaywall(featureId);
      return;
    }
    // TODO: Dispatch AI action
    console.log('AI Feature:', featureId);
  };

  return (
    <div className="flex flex-col gap-1">
      {/* ---- Standard Tools ---- */}
      <SectionLabel>Tools</SectionLabel>
      {STANDARD_TOOLS.map((tool) => (
        <Tooltip key={tool.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => handleStandardTool(tool.id)}
            >
              <tool.icon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{tool.label}</TooltipContent>
        </Tooltip>
      ))}

      <Separator className="my-1 w-8" />

      {/* ---- Special Tools ---- */}
      <SectionLabel>Special</SectionLabel>
      {SPECIAL_TOOLS.map((tool) => (
        <Tooltip key={tool.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={
                tool.id === 'map-overlays'
                  ? handleMapOverlays
                  : handleTimelineBuilder
              }
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

// ---- Reusable Sub-components ----

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-center mt-1 mb-0.5">
      {children}
    </span>
  );
}

function LockOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <Lock className="w-3 h-3 text-muted-foreground" />
    </div>
  );
}
