// ============================================================
// Toolbar — Dynamic Subject Toolkit Switcher
// ============================================================
// Reads the `subject` state and renders three columns:
// Core Tools (always visible), Subject Shapes/Assets,
// and Subject AI Tools.
//
// Mobile: Horizontal floating bar at bottom with core tools
//         + a "More" sheet that expands the rest.
// Desktop: Vertical sidebar (original layout).
// ============================================================

'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/store/app-store';
import type { Subject } from '@/types';
import { Pen, MousePointer2, Eraser, Hand, Type, Square, Circle, Minus, ArrowUpRight, Sparkles, Brain, BookOpen, FlaskConical, Languages, PenTool, MoreHorizontal, Shapes, GraduationCap, Target, ClipboardCheck, BookMarked, Layers, HelpCircle, Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
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
const SUBJECT_AI_TOOLS: Record<Subject, { id: string; icon: React.ElementType; label: string; action: string; creditCost: number; proOnly?: boolean }[]> = {
  MATH: [
    { id: 'handwriting-to-math', icon: PenTool, label: 'Handwriting to Math', action: 'HANDWRITING_TO_MATH', creditCost: 3 },
    { id: 'shape-perfect', icon: Brain, label: 'Shape Perfect', action: 'PERFECT_SHAPE', creditCost: 2 },
    { id: 'plot-graph', icon: FlaskConical, label: 'Smart Graph Plotter', action: 'PLOT_GRAPH', creditCost: 3 },
    { id: 'quiz', icon: BookOpen, label: 'Math Quiz', action: 'QUIZ', creditCost: 1 },
    { id: 'worksheet', icon: Sparkles, label: 'Worksheet', action: 'WORKSHEET', creditCost: 2 },
    { id: 'step-solver', icon: HelpCircle, label: 'Step-by-Step Solver', action: 'STEP_BY_STEP_SOLVER', creditCost: 3, proOnly: true },
  ],
  SCIENCE: [
    { id: 'diagram-gen', icon: Brain, label: 'Diagram Generator', action: 'DIAGRAM_GENERATOR', creditCost: 3 },
    { id: 'chem-balance', icon: FlaskConical, label: 'Equation Balancer', action: 'CHEMICAL_BALANCER', creditCost: 1 },
    { id: 'lab-summary', icon: BookOpen, label: 'Lab Summary', action: 'LAB_SUMMARY', creditCost: 1 },
    { id: 'quiz', icon: BookOpen, label: 'Science Quiz', action: 'QUIZ', creditCost: 1 },
    { id: 'worksheet', icon: Sparkles, label: 'Worksheet', action: 'WORKSHEET', creditCost: 2 },
    { id: 'word-problems', icon: Target, label: 'Word Problems', action: 'WORD_PROBLEM_BUILDER', creditCost: 5, proOnly: true },
    { id: 'formative-assess', icon: ClipboardCheck, label: 'Formative Assessment', action: 'FORMATIVE_ASSESSMENT', creditCost: 5, proOnly: true },
  ],
  LANGUAGE: [
    { id: 'grammar', icon: PenTool, label: 'Grammar Highlight', action: 'GRAMMAR', creditCost: 1 },
    { id: 'vocab-quiz', icon: BookOpen, label: 'Vocab Quiz', action: 'VOCAB_QUIZ', creditCost: 1 },
    { id: 'essay-outline', icon: Brain, label: 'Essay Outliner', action: 'OUTLINE', creditCost: 1 },
    { id: 'phonics', icon: Languages, label: 'Phonics Helper', action: 'PHONICS_HELPER', creditCost: 1 },
    { id: 'worksheet', icon: Sparkles, label: 'Worksheet', action: 'WORKSHEET', creditCost: 2 },
    { id: 'flashcards', icon: Layers, label: 'Flashcards', action: 'FLASHCARD_GENERATOR', creditCost: 3, proOnly: true },
    { id: 'rubric', icon: BookMarked, label: 'Rubric Generator', action: 'RUBRIC_GENERATOR', creditCost: 5, proOnly: true },
  ],
  GENERAL: [
    { id: 'timeline', icon: BookOpen, label: 'Timeline Generator', action: 'TIMELINE_GENERATOR', creditCost: 1 },
    { id: 'summarizer', icon: Brain, label: 'Concept Summarizer', action: 'CONCEPT_SUMMARIZER', creditCost: 1 },
    { id: 'quiz', icon: BookOpen, label: 'Quiz', action: 'QUIZ', creditCost: 1 },
    { id: 'worksheet', icon: Sparkles, label: 'Worksheet', action: 'WORKSHEET', creditCost: 2 },
    { id: 'lesson-plan', icon: GraduationCap, label: 'Lesson Plan', action: 'LESSON_PLAN', creditCost: 5, proOnly: true },
    { id: 'feedback', icon: MessageSquare, label: 'Student Feedback', action: 'STUDENT_FEEDBACK', creditCost: 3, proOnly: true },
    { id: 'differentiated', icon: Star, label: 'Differentiated Instruction', action: 'DIFFERENTIATED_INSTRUCTION', creditCost: 5, proOnly: true },
  ],
};

export default function Toolbar({ editor, onToolChange, activeTool }: ToolbarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Mobile floating toolbar
  if (isMobile) {
    return <MobileToolbar editor={editor} onToolChange={onToolChange} activeTool={activeTool} mobileExpanded={mobileExpanded} setMobileExpanded={setMobileExpanded} />;
  }

  // Desktop vertical toolbar (original layout)
  return <DesktopToolbar editor={editor} onToolChange={onToolChange} activeTool={activeTool} />;
}

// ============================================================
// Mobile Toolbar — horizontal floating bar at the bottom
// ============================================================
function MobileToolbar({
  editor,
  onToolChange,
  activeTool,
  mobileExpanded,
  setMobileExpanded,
}: {
  editor: unknown | null;
  onToolChange?: (tool: string) => void;
  activeTool?: string;
  mobileExpanded: boolean;
  setMobileExpanded: (v: boolean) => void;
}) {
  const subject = useAppStore((s) => s.room.subject);
  const isTutor = useAppStore((s) => s.room.isTutor);
  const aiFeaturesEnabled = useAppStore((s) => s.aiFeaturesEnabled);
  const tier = useAppStore((s) => s.tier);

  // Core tools always shown in the bottom bar
  const mobileCoreTools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'draw', icon: Pen, label: 'Draw' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'rectangle', icon: Shapes, label: 'Shapes' },
  ];

  // All core tools for the "More" sheet
  const allCoreTools = [
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

  const handleToolSelect = (toolId: string) => {
    onToolChange?.(toolId);
    setMobileExpanded(false);
  };

  // AI tools for the sheet
  const hasAIAccess = tier === 'PRO' || tier === 'AGENCY';
  const aiTools = SUBJECT_AI_TOOLS[subject].filter(
    (tool) => aiFeaturesEnabled[tool.id] !== false
  );

  return (
    <>
      {/* Floating bottom bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 px-2 py-1.5 bg-card border rounded-2xl shadow-lg" role="toolbar" aria-label="Drawing tools">
        {mobileCoreTools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? 'default' : 'ghost'}
            size="icon"
            className="w-10 h-10 rounded-xl"
            onClick={() => handleToolSelect(tool.id)}
            aria-label={tool.label}
          >
            <tool.icon className="w-4.5 h-4.5" />
          </Button>
        ))}
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-xl"
          onClick={() => setMobileExpanded(true)}
          aria-label="More tools"
        >
          <MoreHorizontal className="w-4.5 h-4.5" />
        </Button>
      </div>

      {/* "More" sheet — all tools + subject + AI */}
      <Sheet open={mobileExpanded} onOpenChange={setMobileExpanded}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[60vh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle>All Tools</SheetTitle>
            <SheetDescription>Core drawing and shape tools</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-5 gap-2 px-4 pb-2">
            {allCoreTools.map((tool) => (
              <ToolButton key={tool.id} tool={tool} activeTool={activeTool} onToolChange={handleToolSelect} />
            ))}
          </div>

          <Separator className="my-3" />

          {/* Subject-specific shapes */}
          <div className="px-4 pb-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Subject Tools</p>
            <SubjectToolkitLoader subject={subject} editor={editor} />
          </div>

          {/* AI tools (tutor only) */}
          {isTutor && (
            <>
              <Separator className="my-3" />
              <div className="px-4 pb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  AI Tools {hasAIAccess ? '' : '(Pro)'}
                </p>
                {!hasAIAccess ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-primary"
                    onClick={() => { useAppStore.getState().openPaywall('aiTools'); setMobileExpanded(false); }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Unlock AI Tools
                  </Button>
                ) : aiTools.length === 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-primary"
                    onClick={() => { useAppStore.getState().toggleAIPanel(); setMobileExpanded(false); }}
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Control Panel
                  </Button>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
                    {aiTools.map((tool) => (
                      <Button
                        key={tool.id}
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 rounded-xl text-primary"
                        onClick={() => {
                          const store = useAppStore.getState();
                          if (!store.aiPanelOpen) store.toggleAIPanel();
                          setMobileExpanded(false);
                        }}
                        aria-label={tool.label}
                      >
                        <tool.icon className="w-4.5 h-4.5" />
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ============================================================
// Desktop Toolbar — original vertical sidebar
// ============================================================
function DesktopToolbar({ editor, onToolChange, activeTool }: ToolbarProps) {
  const subject = useAppStore((s) => s.room.subject);
  const isTutor = useAppStore((s) => s.room.isTutor);
  const aiFeaturesEnabled = useAppStore((s) => s.aiFeaturesEnabled);
  const tier = useAppStore((s) => s.tier);

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
    <div className="flex flex-col items-center gap-1 p-2 bg-card border rounded-xl shadow-lg" role="toolbar" aria-label="Drawing and subject tools">
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
                aria-label={tool.label}
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

// Shared: render a single tool button (used in mobile grid)
function ToolButton({
  tool,
  activeTool,
  onToolChange,
}: {
  tool: { id: string; icon: React.ElementType; label: string };
  activeTool?: string;
  onToolChange: (tool: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant={activeTool === tool.id ? 'default' : 'ghost'}
        size="icon"
        className="w-10 h-10 rounded-xl"
        onClick={() => onToolChange(tool.id)}
        aria-label={tool.label}
      >
        <tool.icon className="w-4.5 h-4.5" />
      </Button>
      <span className="text-[10px] text-muted-foreground leading-none">{tool.label}</span>
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
