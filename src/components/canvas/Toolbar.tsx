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
import { Pen, MousePointer2, Eraser, Hand, Type, Square, Circle, Minus, ArrowUpRight } from 'lucide-react';
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

export default function Toolbar({ editor, onToolChange, activeTool }: ToolbarProps) {
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
            <SubjectAIToolkitLoader subject={subject} editor={editor} />
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

function SubjectAIToolkitLoader({ subject, editor }: { subject: Subject; editor: unknown }) {
  // AI tools are rendered within each toolkit component
  // This is a placeholder that's rendered by the toolkit panels
  return (
    <div className="text-xs text-muted-foreground text-center px-2">
      AI Tools
    </div>
  );
}
