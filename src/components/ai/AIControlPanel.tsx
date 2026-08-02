// ============================================================
// AIControlPanel — Sidebar modal with toggle switches for AI features
// ============================================================
// Slides in from the right using shadcn Sheet.
// Groups features by subject (Math, Science, Language, General).
// Toggling a feature OFF hides it from the main toolbar.
// ============================================================

'use client';

import React from 'react';
import { useAppStore } from '@/store/app-store';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Subject } from '@/types';
import {
  Calculator,
  FlaskConical,
  BookOpen,
  Puzzle,
  PenTool,
  Sparkles,
  LineChart,
  FileSpreadsheet,
  FileText,
  SpellCheck,
  List,
  Atom,
  TestTube,
  Type,
  Volume2,
  Clock,
  Lightbulb,
  Shapes,
  type LucideIcon,
} from 'lucide-react';

// ---- Types ----

interface AIFeatureDef {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface SubjectGroup {
  subject: Subject;
  label: string;
  icon: LucideIcon;
  features: AIFeatureDef[];
}

// ---- Feature definitions grouped by subject ----

const SUBJECT_FEATURES: SubjectGroup[] = [
  {
    subject: 'MATH',
    label: 'Mathematics',
    icon: Calculator,
    features: [
      {
        id: 'QUIZ',
        label: 'Quiz Generator',
        description: 'Generate interactive quizzes from any math topic',
        icon: Sparkles,
      },
      {
        id: 'WORKSHEET',
        label: 'Worksheet Generator',
        description: 'Create printable math worksheets with problems',
        icon: FileSpreadsheet,
      },
      {
        id: 'HANDWRITING_TO_MATH',
        label: 'Handwriting → LaTeX',
        description: 'Convert handwritten equations to clean LaTeX',
        icon: PenTool,
      },
      {
        id: 'PLOT_GRAPH',
        label: 'AI Graph Plotter',
        description: 'Plot functions from equations',
        icon: LineChart,
      },
      {
        id: 'PERFECT_SHAPE',
        label: 'Shape Perfection',
        description: 'Perfect hand-drawn geometric shapes',
        icon: Shapes,
      },
    ],
  },
  {
    subject: 'SCIENCE',
    label: 'Science',
    icon: FlaskConical,
    features: [
      {
        id: 'DIAGRAM_GENERATOR',
        label: 'Diagram Generator',
        description: 'Generate scientific diagrams from descriptions',
        icon: Atom,
      },
      {
        id: 'CHEMICAL_BALANCER',
        label: 'Chemical Equation Balancer',
        description: 'Balance chemical equations automatically',
        icon: TestTube,
      },
      {
        id: 'LAB_SUMMARY',
        label: 'Lab Report Summary',
        description: 'Summarize lab notes and observations',
        icon: FileText,
      },
    ],
  },
  {
    subject: 'LANGUAGE',
    label: 'Language Arts',
    icon: BookOpen,
    features: [
      {
        id: 'GRAMMAR',
        label: 'Grammar Checker',
        description: 'Check and correct grammar on the whiteboard',
        icon: SpellCheck,
      },
      {
        id: 'VOCAB_QUIZ',
        label: 'Vocabulary Quiz',
        description: 'Generate vocabulary quizzes from context',
        icon: Type,
      },
      {
        id: 'PHONICS_HELPER',
        label: 'Phonics Helper',
        description: 'Interactive phonics and pronunciation aid',
        icon: Volume2,
      },
    ],
  },
  {
    subject: 'GENERAL',
    label: 'General',
    icon: Puzzle,
    features: [
      {
        id: 'SUMMARY',
        label: 'Concept Summarizer',
        description: 'Summarize whiteboard content into key points',
        icon: Lightbulb,
      },
      {
        id: 'OUTLINE',
        label: 'Outline Generator',
        description: 'Create structured outlines from notes',
        icon: List,
      },
      {
        id: 'TIMELINE_GENERATOR',
        label: 'Timeline Generator',
        description: 'Generate visual timelines from events',
        icon: Clock,
      },
    ],
  },
];

// ============================================================
// Component
// ============================================================

export default function AIControlPanel() {
  const aiPanelOpen = useAppStore((s) => s.aiPanelOpen);
  const toggleAIPanel = useAppStore((s) => s.toggleAIPanel);
  const aiFeaturesEnabled = useAppStore((s) => s.aiFeaturesEnabled);
  const toggleAIFeature = useAppStore((s) => s.toggleAIFeature);

  return (
    <Sheet open={aiPanelOpen} onOpenChange={(open) => {
      if (!open) toggleAIPanel();
    }}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-5 pt-5 pb-0">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Features
          </SheetTitle>
          <SheetDescription>
            Toggle AI features on or off. Disabled features are hidden from the toolbar.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="px-5 py-4 space-y-6">
            {/* ---- Master toggle ---- */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Enable All AI Features</p>
                  <p className="text-xs text-muted-foreground">Quick toggle for all features</p>
                </div>
              </div>
              <Switch
                checked={allEnabled(aiFeaturesEnabled)}
                onCheckedChange={(checked) => {
                  const allFeatureIds = SUBJECT_FEATURES.flatMap((g) =>
                    g.features.map((f) => f.id)
                  );
                  allFeatureIds.forEach((id) => toggleAIFeature(id, checked));
                }}
              />
            </div>

            {/* ---- Per-subject groups ---- */}
            {SUBJECT_FEATURES.map((group, groupIdx) => (
              <div key={group.subject}>
                {groupIdx > 0 && <Separator className="mb-5" />}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10">
                    <group.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{group.label}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {group.features.length} feature{group.features.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  {group.features.map((feature) => {
                    const isEnabled = aiFeaturesEnabled[feature.id] !== false; // default on
                    const FeatureIcon = feature.icon;
                    return (
                      <div
                        key={feature.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FeatureIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <Label
                              htmlFor={`toggle-${feature.id}`}
                              className="text-sm font-medium cursor-pointer truncate block"
                            >
                              {feature.label}
                            </Label>
                            <p className="text-[11px] text-muted-foreground leading-tight truncate">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          id={`toggle-${feature.id}`}
                          checked={isEnabled}
                          onCheckedChange={(checked) => {
                            toggleAIFeature(feature.id, checked);
                          }}
                          className="shrink-0 ml-2"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ---- Helpers ----

function allEnabled(features: Record<string, boolean>): boolean {
 const allIds = SUBJECT_FEATURES.flatMap((g) => g.features.map((f) => f.id));
  return allIds.every((id) => features[id] !== false);
}
