// ============================================================
// LanguageToolkit — Language Arts Subject Toolkit
// ============================================================

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app-store';
import type { AIAction } from '@/types';
import {
  Highlighter,
  Underline,
  Brackets,
  Network,
  BookOpen,
  Notebook,
  PenTool,
  Languages,
  SpellCheck2,
  Lightbulb,
  FileText,
  Baby,
} from 'lucide-react';

interface LanguageToolkitProps {
  editor: unknown;
}

const HIGHLIGHTERS = [
  { id: 'highlight-yellow', label: 'Yellow Highlighter', color: 'bg-yellow-400', textColor: 'text-yellow-500' },
  { id: 'highlight-green', label: 'Green Highlighter', color: 'bg-green-400', textColor: 'text-green-500' },
  { id: 'highlight-pink', label: 'Pink Highlighter', color: 'bg-pink-400', textColor: 'text-pink-500' },
  { id: 'highlight-orange', label: 'Orange Highlighter', color: 'bg-orange-400', textColor: 'text-orange-500' },
] as const;

const ANNOTATION_TOOLS = [
  { id: 'brackets', icon: Brackets, label: 'Bracket Annotation' },
  { id: 'underline-tool', icon: Underline, label: 'Underline Annotation' },
] as const;

const SPECIAL_TOOLS = [
  { id: 'mind-map', icon: Network, label: 'Mind Map Nodes' },
] as const;

const BACKGROUNDS = [
  { id: 'wide-ruled', icon: BookOpen, label: 'Wide Ruled Paper' },
  { id: 'college-ruled', icon: Notebook, label: 'College Ruled Paper' },
  { id: 'elementary-dashed', icon: PenTool, label: 'Elementary Dashed Handwriting' },
] as const;

const PREMIUM_FEATURES: {
  id: AIAction;
  icon: React.ElementType;
  label: string;
  description: string;
}[] = [
  {
    id: 'GRAMMAR',
    icon: SpellCheck2,
    label: 'Smart Grammar Highlighter',
    description: 'Highlight grammar issues in text',
  },
  {
    id: 'VOCAB_QUIZ',
    icon: Languages,
    label: 'Smart Vocab Quiz',
    description: 'Generate vocabulary quizzes',
  },
  {
    id: 'OUTLINE',
    icon: FileText,
    label: 'Smart Essay Outliner',
    description: 'Generate essay outlines',
  },
  {
    id: 'PHONICS_HELPER',
    icon: Baby,
    label: 'Smart Phonics Helper',
    description: 'Phonics and early reading support',
  },
];

export default function LanguageToolkit({ editor: _editor }: LanguageToolkitProps) {
  const tier = useAppStore((s) => s.tier);
  const openPaywall = useAppStore((s) => s.openPaywall);
  const isPremium = tier === 'PRO' || tier === 'AGENCY';

  const handleHighlighter = (highlighterId: string) => {
    // TODO: Activate highlighter tool with the given color via tldraw editor
    console.log('Highlighter:', highlighterId);
  };

  const handleAnnotation = (toolId: string) => {
    // TODO: Activate annotation tool (brackets / underlines) via tldraw editor
    console.log('Annotation tool:', toolId);
  };

  const handleMindMap = () => {
    // TODO: Create connected mind map nodes on canvas
    console.log('Mind map nodes');
  };

  const handleBackgroundToggle = (bgId: string) => {
    // TODO: Switch background paper style
    console.log('Background toggle:', bgId);
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
      {/* ---- Highlighters ---- */}
      <SectionLabel>Highlighters</SectionLabel>
      {HIGHLIGHTERS.map((hl) => (
        <Tooltip key={hl.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => handleHighlighter(hl.id)}
            >
              <span
                className={`inline-block w-5 h-1.5 rounded-sm ${hl.color}`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <span className="flex items-center gap-1.5">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-sm ${hl.color}`}
              />
              {hl.label}
            </span>
          </TooltipContent>
        </Tooltip>
      ))}

      <Separator className="my-1 w-8" />

      {/* ---- Annotation Tools ---- */}
      <SectionLabel>Annotations</SectionLabel>
      {ANNOTATION_TOOLS.map((tool) => (
        <Tooltip key={tool.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => handleAnnotation(tool.id)}
            >
              <tool.icon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{tool.label}</TooltipContent>
        </Tooltip>
      ))}

      <Separator className="my-1 w-8" />

      {/* ---- Special Tools ---- */}
      <SectionLabel>Tools</SectionLabel>
      {SPECIAL_TOOLS.map((tool) => (
        <Tooltip key={tool.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => handleMindMap()}
            >
              <tool.icon className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{tool.label}</TooltipContent>
        </Tooltip>
      ))}

      <Separator className="my-1 w-8" />

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
