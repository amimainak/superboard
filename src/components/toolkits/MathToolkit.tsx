// ============================================================
// MathToolkit — Mathematics Subject Toolkit
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
  Grid3X3,
  Triangle,
  Pentagon,
  Hexagon,
  Circle,
  Ruler,
  Compass,
  GraduationCap,
  PenTool,
  Sparkles,
  FileSpreadsheet,
  LineChart,
  BookOpen,
  Notebook,
} from 'lucide-react';

interface MathToolkitProps {
  editor: unknown;
}

const BACKGROUNDS = [
  { id: 'blank', icon: Notebook, label: 'Blank' },
  { id: 'dot-grid', icon: Grid3X3, label: 'Dot Grid' },
  { id: 'isometric', icon: Triangle, label: 'Isometric' },
  { id: 'graph-paper', icon: LineChart, label: 'Graph Paper' },
  { id: 'elementary-lined', icon: BookOpen, label: 'Elementary Lined' },
] as const;

const GEOMETRY_SHAPES = [
  { id: 'equilateral-triangle', icon: Triangle, label: 'Equilateral Triangle' },
  { id: 'right-triangle', icon: Triangle, label: 'Right Triangle' },
  { id: 'square', icon: Grid3X3, label: 'Square' },
  { id: 'regular-pentagon', icon: Pentagon, label: 'Regular Pentagon' },
  { id: 'regular-hexagon', icon: Hexagon, label: 'Regular Hexagon' },
  { id: 'circle-shape', icon: Circle, label: 'Circle' },
] as const;

const OVERLAY_TOOLS = [
  { id: 'ruler', icon: Ruler, label: 'Ruler Overlay' },
  { id: 'protractor', icon: Compass, label: 'Protractor Overlay' },
] as const;

const PREMIUM_FEATURES: { id: AIAction; icon: React.ElementType; label: string; description: string }[] = [
  {
    id: 'HANDWRITING_TO_MATH',
    icon: PenTool,
    label: 'Handwriting → LaTeX',
    description: 'Convert handwritten math to LaTeX',
  },
  {
    id: 'PERFECT_SHAPE',
    icon: Sparkles,
    label: 'AI Shape Perfection',
    description: 'Perfect your hand-drawn shapes',
  },
  {
    id: 'PLOT_GRAPH',
    icon: LineChart,
    label: 'AI Graph Plotter',
    description: 'Plot functions from equations',
  },
  {
    id: 'WORKSHEET',
    icon: FileSpreadsheet,
    label: 'AI Worksheet Generator',
    description: 'Generate math worksheets',
  },
];

export default function MathToolkit({ editor: _editor }: MathToolkitProps) {
  const tier = useAppStore((s) => s.tier);
  const openPaywall = useAppStore((s) => s.openPaywall);
  const isPremium = tier === 'PRO' || tier === 'AGENCY';

  const handleBackgroundToggle = (bgId: string) => {
    // TODO: Implement background switching via tldraw editor
    console.log('Background toggle:', bgId);
  };

  const handleGeometryShape = (shapeId: string) => {
    // TODO: Stamp geometry shape onto canvas via tldraw editor
    console.log('Geometry shape:', shapeId);
  };

  const handleOverlay = (overlayId: string) => {
    // TODO: Toggle ruler/protractor SVG overlay
    console.log('Overlay toggle:', overlayId);
  };

  const handlePremiumFeature = (featureId: AIAction) => {
    if (!isPremium) {
      openPaywall(featureId);
      return;
    }
    // TODO: Dispatch AI action
    console.log('AI Feature:', featureId);
  };

  const handleGeoGebra = () => {
    if (!isPremium) {
      openPaywall('geogebra');
      return;
    }
    // TODO: Open GeoGebra integration
    console.log('Open GeoGebra');
  };

  return (
    <div className="flex flex-col gap-1">
      {/* ---- Background Toggles ---- */}
      <SectionLabel>Backgrounds</SectionLabel>
      {BACKGROUNDS.map((bg) => (
        <Tooltip key={bg.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => handleBackgroundToggle(bg.id)}
            >
              <bg.icon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{bg.label}</TooltipContent>
        </Tooltip>
      ))}

      <Separator className="my-1 w-8" />

      {/* ---- Basic Geometry Shapes ---- */}
      <SectionLabel>Geometry</SectionLabel>
      {GEOMETRY_SHAPES.map((shape) => (
        <Tooltip key={shape.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => handleGeometryShape(shape.id)}
            >
              <shape.icon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{shape.label}</TooltipContent>
        </Tooltip>
      ))}

      <Separator className="my-1 w-8" />

      {/* ---- Ruler / Protractor Overlays ---- */}
      <SectionLabel>Overlays</SectionLabel>
      {OVERLAY_TOOLS.map((tool) => (
        <Tooltip key={tool.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => handleOverlay(tool.id)}
            >
              <tool.icon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{tool.label}</TooltipContent>
        </Tooltip>
      ))}

      <Separator className="my-1 w-8" />

      {/* ---- Premium Features ---- */}
      <SectionLabel>AI &amp; Premium</SectionLabel>

      {/* GeoGebra Integration */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={handleGeoGebra}
              disabled={!isPremium}
            >
              <GraduationCap className="w-4 h-4" />
            </Button>
            {!isPremium && <LockOverlay />}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">GeoGebra Integration</TooltipContent>
      </Tooltip>

      {/* AI Premium Features */}
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
