// ============================================================
// ScienceToolkit — Science Subject Toolkit
// ============================================================

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { SectionLabel, LockOverlay } from './ToolkitShared';
import { useAppStore } from '@/store/app-store';
import type { AIAction } from '@/types';
import {
  Beaker,
  FlaskConical,
  ArrowRight,
  LineChart,
  Atom,
  TestTubeDiagonal,
  Microscope,
  Sparkles,
  FileText,
  GitBranch,
  Lightbulb,
  Cpu,
} from 'lucide-react';

interface ScienceToolkitProps {
  editor: unknown;
}

const VECTOR_ARROWS = [
  {
    id: 'velocity-arrow',
    label: 'Velocity Arrow',
    color: 'text-red-500',
    strokeColor: '#ef4444',
  },
  {
    id: 'force-arrow',
    label: 'Force Arrow',
    color: 'text-blue-500',
    strokeColor: '#3b82f6',
  },
] as const;

const LAB_DIAGRAMS = [
  { id: 'beaker', icon: Beaker, label: 'Beaker' },
  { id: 'flask', icon: FlaskConical, label: 'Erlenmeyer Flask' },
  { id: 'test-tube', icon: TestTubeDiagonal, label: 'Test Tube' },
  { id: 'circuit-simple', icon: Cpu, label: 'Simple Circuit' },
  { id: 'circuit-parallel', icon: GitBranch, label: 'Parallel Circuit' },
] as const;

const PREMIUM_FEATURES: {
  id: AIAction;
  icon: React.ElementType;
  label: string;
  description: string;
}[] = [
  {
    id: 'DIAGRAM_GENERATOR',
    icon: Sparkles,
    label: 'Smart Diagram Generator',
    description: 'Generate science diagrams from text',
  },
  {
    id: 'CHEMICAL_BALANCER',
    icon: Atom,
    label: 'Smart Chemical Equation Balancer',
    description: 'Balance chemical equations automatically',
  },
  {
    id: 'LAB_SUMMARY',
    icon: FileText,
    label: 'Smart Lab Summary',
    description: 'Summarize lab notes into a report',
  },
];

export default function ScienceToolkit({ editor: _editor }: ScienceToolkitProps) {
  const tier = useAppStore((s) => s.tier);
  const openPaywall = useAppStore((s) => s.openPaywall);
  const isPremium = tier === 'PRO' || tier === 'AGENCY';

  const handleVectorArrow = (arrowId: string, strokeColor: string) => {
    // TODO: Stamp a pre-colored arrow onto the canvas via tldraw editor
  };

  const handleLabDiagram = (diagramId: string) => {
    // TODO: Drag-and-drop lab diagram SVG onto canvas
  };

  const handleGraphPaper = () => {
    // TODO: Toggle graph paper background
  };

  const handlePremiumFeature = (featureId: AIAction) => {
    if (!isPremium) {
      openPaywall(featureId);
      return;
    }
    // TODO: Dispatch AI action
  };

  return (
    <div className="flex flex-col gap-1">
      {/* ---- Vector Arrows ---- */}
      <SectionLabel>Vector Arrows</SectionLabel>
      {VECTOR_ARROWS.map((arrow) => (
        <Tooltip key={arrow.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => handleVectorArrow(arrow.id, arrow.strokeColor)}
            >
              <ArrowRight className={`w-4 h-4 ${arrow.color}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: arrow.strokeColor }}
              />
              {arrow.label}
            </span>
          </TooltipContent>
        </Tooltip>
      ))}

      <Separator className="my-1 w-8" />

      {/* ---- Lab Diagrams (Drag & Drop) ---- */}
      <SectionLabel>Lab Diagrams</SectionLabel>
      {LAB_DIAGRAMS.map((diagram) => (
        <Tooltip key={diagram.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => handleLabDiagram(diagram.id)}
            >
              <diagram.icon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{diagram.label}</TooltipContent>
        </Tooltip>
      ))}

      <Separator className="my-1 w-8" />

      {/* ---- Graph Paper Background ---- */}
      <SectionLabel>Background</SectionLabel>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9"
            onClick={handleGraphPaper}
          >
            <LineChart className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Graph Paper</TooltipContent>
      </Tooltip>

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
