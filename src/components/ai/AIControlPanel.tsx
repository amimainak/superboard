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
import { CREDIT_COSTS } from '@/types';
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
  GraduationCap,
  MessageSquare,
  Target,
  ClipboardCheck,
  BookMarked,
  Layers,
  Star,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

// ---- Types ----

interface AIFeatureDef {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  creditCost: number;
  proOnly?: boolean;
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
        description: 'Generate interactive quizzes (1 credit)',
        icon: Sparkles,
        creditCost: 1,
      },
      {
        id: 'WORKSHEET',
        label: 'Worksheet Generator',
        description: 'Create printable worksheets (2 credits)',
        icon: FileSpreadsheet,
        creditCost: 2,
      },
      {
        id: 'HANDWRITING_TO_MATH',
        label: 'Handwriting to LaTeX',
        description: 'Convert handwritten equations (3 credits)',
        icon: PenTool,
        creditCost: 3,
      },
      {
        id: 'PLOT_GRAPH',
        label: 'Smart Graph Plotter',
        description: 'Plot functions from equations (3 credits)',
        icon: LineChart,
        creditCost: 3,
      },
      {
        id: 'PERFECT_SHAPE',
        label: 'Shape Perfection',
        description: 'Perfect hand-drawn shapes (2 credits)',
        icon: Shapes,
        creditCost: 2,
      },
      {
        id: 'STEP_BY_STEP_SOLVER',
        label: 'Step-by-Step Solver',
        description: 'Solve problems with full working (3 credits)',
        icon: HelpCircle,
        creditCost: 3,
        proOnly: true,
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
        description: 'Generate scientific diagrams (3 credits)',
        icon: Atom,
        creditCost: 3,
      },
      {
        id: 'CHEMICAL_BALANCER',
        label: 'Chemical Equation Balancer',
        description: 'Balance chemical equations (1 credit)',
        icon: TestTube,
        creditCost: 1,
      },
      {
        id: 'LAB_SUMMARY',
        label: 'Lab Report Summary',
        description: 'Summarize lab notes (1 credit)',
        icon: FileText,
        creditCost: 1,
      },
      {
        id: 'WORD_PROBLEM_BUILDER',
        label: 'Word Problem Builder',
        description: 'Create science word problems (5 credits)',
        icon: Target,
        creditCost: 5,
        proOnly: true,
      },
      {
        id: 'FORMATIVE_ASSESSMENT',
        label: 'Formative Assessment',
        description: 'Create MCQ + short answer tests (5 credits)',
        icon: ClipboardCheck,
        creditCost: 5,
        proOnly: true,
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
        description: 'Check and correct grammar (1 credit)',
        icon: SpellCheck,
        creditCost: 1,
      },
      {
        id: 'VOCAB_QUIZ',
        label: 'Vocabulary Quiz',
        description: 'Generate vocabulary quizzes (1 credit)',
        icon: Type,
        creditCost: 1,
      },
      {
        id: 'PHONICS_HELPER',
        label: 'Phonics Helper',
        description: 'Interactive phonics aid (1 credit)',
        icon: Volume2,
        creditCost: 1,
      },
      {
        id: 'FLASHCARD_GENERATOR',
        label: 'Flashcard Generator',
        description: 'Create 10 study flashcards (3 credits)',
        icon: Layers,
        creditCost: 3,
        proOnly: true,
      },
      {
        id: 'RUBRIC_GENERATOR',
        label: 'Rubric Generator',
        description: 'Create 4-level grading rubrics (5 credits)',
        icon: BookMarked,
        creditCost: 5,
        proOnly: true,
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
        description: 'Summarize board content (1 credit)',
        icon: Lightbulb,
        creditCost: 1,
      },
      {
        id: 'OUTLINE',
        label: 'Outline Generator',
        description: 'Create structured outlines (1 credit)',
        icon: List,
        creditCost: 1,
      },
      {
        id: 'TIMELINE_GENERATOR',
        label: 'Timeline Generator',
        description: 'Generate visual timelines (1 credit)',
        icon: Clock,
        creditCost: 1,
      },
      {
        id: 'LESSON_PLAN',
        label: 'Lesson Plan',
        description: 'Standards-aligned lesson plans (5 credits)',
        icon: GraduationCap,
        creditCost: 5,
        proOnly: true,
      },
      {
        id: 'STUDENT_FEEDBACK',
        label: 'Student Feedback',
        description: 'Constructive feedback writing (3 credits)',
        icon: MessageSquare,
        creditCost: 3,
        proOnly: true,
      },
      {
        id: 'DIFFERENTIATED_INSTRUCTION',
        label: 'Differentiated Instruction',
        description: '3-tier activities (5 credits)',
        icon: Star,
        creditCost: 5,
        proOnly: true,
      },
    ],
  },
];

// ============================================================
// Component
// ============================================================

export default function AIControlPanel() {
  const tier = useAppStore((s) => s.tier);
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
            Smart Features
          </SheetTitle>
          <SheetDescription>
            Toggle smart features on or off. Disabled features are hidden from the toolbar.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="px-5 py-4 space-y-6">
            {/* ---- Master toggle ---- */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-2">
                <Puzzle className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Enable All Smart Features</p>
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
                            <div className="flex items-center gap-1.5">
                              <Label
                                htmlFor={`toggle-${feature.id}`}
                                className="text-sm font-medium cursor-pointer truncate block"
                              >
                                {feature.label}
                              </Label>
                              {feature.proOnly && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                                  Pro
                                </span>
                              )}
                            </div>
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
