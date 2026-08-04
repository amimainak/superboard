// ============================================================
// Toolbar — Dynamic Subject Toolkit Switcher
// ============================================================
// Reads the `subject` state and renders three columns:
// Core Tools (always visible), Subject Shapes/Assets,
// and Subject AI Tools.
// ============================================================

'use client';

import React from 'react';
import { useAppStore } from '@/store/app-store';
import type { Subject } from '@/types';
import { Pen, MousePointer2, Eraser, Hand, Type, Square, Circle, Minus, ArrowUpRight, Sparkles, Brain, BookOpen, FlaskConical, Languages, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import dynamic from 'next/dynamic';

// Lazy load subject toolkits for performance
const MathToolkit = dynamic(() => import('@/components/toolkits/MathToolkit'), { ssr: false });
const ScienceToolkit = dynamic(() => import('@/components/toolkits/ScienceToolkit'), { ssr: false });
const LanguageToolkit = dynamic(() => import('@/components/toolkits/LanguageToolkit'), { ssr: false });
const GeneralToolkit = dynamic(() => import('@/components/toolkits/GeneralToolkit'), { ssr: false });

interface ToolbarProps {
  editor: unknown | null; // Tldraw Editor instance
  onToolChange?: (tool: string) => void;
  activeTool?: string;
}

// AI feature definitions per subject (Blueprint §4.2)
const SUBJECT_AI_TOOLS: Record<Subject, { id: string; icon: React.ElementType; label: string; action: string }[]> = {
  MATH: [
    { id: 'handwriting-to-math', icon: PenTool, label: 'Handwriting to Math', action: 'HANDWRITING_TO_MATH' },
    { id: 'shape-perfect', icon: Brain, label: 'Shape Perfect', action: 'PERFECT_SHAPE' },
    { id: 'plot-graph', icon: FlaskConical, label: 'AI Graph Plotter', action: 'PLOT_GRAPH' },
    { id: 'quiz', icon: BookOpen, label: 'Math Quiz', action: 'QUIZ' },
    { id: 'worksheet', icon: Sparkles, label: 'Worksheet', action: 'WORKSHEET' },
  ],
  SCIENCE: [
    { id: 'diagram-gen', icon: Brain, label: 'Diagram Generator', action: 'DIAGRAM_GENERATOR' },
    { id: 'chem-balance', icon: FlaskConical, label: 'Equation Balancer', action: 'CHEMICAL_BALANCER' },
    { id: 'lab-summary', icon: BookOpen, label: 'Lab Summary', action: 'LAB_SUMMARY' },
    { id: 'quiz', icon: BookOpen, label: 'Science Quiz', action: 'QUIZ' },
    { id: 'worksheet', icon: Sparkles, label: 'Worksheet', action: 'WORKSHEET' },
  ],
  LANGUAGE: [
    { id: 'grammar', icon: PenTool, label: 'Grammar Highlight', action: 'GRAMMAR' },
    { id: 'vocab-quiz', icon: BookOpen, label: 'Vocab Quiz', action: 'VOCAB_QUIZ' },
    { id: 'essay-outline', icon: Brain, label: 'Essay Outliner', action: 'OUTLINE' },
    { id: 'phonics', icon: Languages, label: 'Phonics Helper', action: 'PHONICS_HELPER' },
    { id: 'worksheet', icon: Sparkles, label: 'Worksheet', action: 'WORKSHEET' },
  ],
  GENERAL: [
    { id: 'timeline', icon: BookOpen, label: 'Timeline Generator', action: 'TIMELINE_GENERATOR' },
    { id: 'summarizer', icon: Brain, label: 'Concept Summarizer', action: 'CONCEPT_SUMMARIZER' },
    { id: 'quiz', icon: BookOpen, label: 'Quiz', action: 'QUIZ' },
    { id: 'worksheet', icon: Sparkles, label: 'Worksheet', action: 'WORKSHEET' },
  ],
};

export default function Toolbar({ editor, onToolChange, activeTool }: ToolbarProps) {
  const subject = useAppStore((s) => s.room.subject);
  const isTutor = useAppStore((s) => s.room.isTutor);
  const aiFeaturesEnabled = useAppStore((s) => s.aiFeaturesEnabled);
  const tier = useAppStore((s) => s.tier);
  const toggleAIPanel = useAppStore((s) => s.toggleAIPanel);

  const coreTools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'hand', icon: Hand, label: 'Pan' },
    { id: 'draw', icon: Pen, label: 'Draw' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'ellipse', icon: Circle, label: 'Ellipse' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'arrow', icon: ArrowUpRight, label: 'Arrow' },
  ];

  return (
    <div className="flex flex-col items-center gap-1 p-2 bg-card border rounded-xl shadow-lg">
      {/* Column 1: Core Tools — always visible */}
      <div className="flex flex-col gap-1">
        {coreTools.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant={activeTool === tool.id ? 'default' : 'ghost'}
                size="icon"
                className="w-9 h-9"
                onClick={() => onToolChange?.(tool.id)}
              >
                <tool.icon className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{tool.label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator className="my-1 w-8" />

      {/* Column 2: Subject-Specific Shapes/Assets */}
      <div className="flex flex-col gap-1">
        <SubjectToolkitLoader subject={subject} editor={editor} />
      </div>

      {/* Column 3: Subject AI Tools (Tutor only, Premium only) */}
      {isTutor && (
        <>
          <Separator className="my-1 w-8" />
          <div className="flex flex-col gap-1">
            <SubjectAIToolkitLoader subject={subject} tier={tier} aiFeaturesEnabled={aiFeaturesEnabled} />
          </div>
        </>
      )}
    </div>
  );
}

function SubjectToolkitLoader({ subject, editor }: { subject: Subject; editor: unknown }) {
  switch (subject) {
    case 'MATH':
      return <MathToolkit editor={editor} />;
    case 'SCIENCE':
      return <ScienceToolkit editor={editor} />;
    case 'LANGUAGE':
      return <LanguageToolkit editor={editor} />;
    case 'GENERAL':
      return <GeneralToolkit editor={editor} />;
    default:
      return <GeneralToolkit editor={editor} />;
  }
}

function SubjectAIToolkitLoader({
  subject,
  tier,
  aiFeaturesEnabled,
}: {
  subject: Subject;
  tier: string;
  aiFeaturesEnabled: Record<string, boolean>;
}) {
  // Filter to only show enabled AI features
  const tools = SUBJECT_AI_TOOLS[subject].filter(
    (tool) => aiFeaturesEnabled[tool.id] !== false
  );

  // If the user is free tier, show the AI panel button instead of individual tools
  const hasAIAccess = tier === 'PRO' || tier === 'AGENCY';

  if (!hasAIAccess) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-primary"
            onClick={() => useAppStore.getState().openPaywall('aiTools')}
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <span className="flex items-center gap-1">
            AI Tools (Pro)
          </span>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (tools.length === 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-primary"
            onClick={() => useAppStore.getState().toggleAIPanel()}
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">AI Control Panel</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <>
      {tools.map((tool) => (
        <Tooltip key={tool.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 text-primary"
              onClick={() => {
                // Open AI panel with this action pre-selected
                const store = useAppStore.getState();
                if (!store.aiPanelOpen) store.toggleAIPanel();
              }}
            >
              <tool.icon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{tool.label}</TooltipContent>
        </Tooltip>
      ))}
    </>
  );
}
