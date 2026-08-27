// ============================================================
// ArtsToolkit — Arts & Music Subject Toolkit
// ============================================================

'use client';

import React from 'react';
import { SectionLabel } from './ToolkitShared';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/app-store';
import {
  Palette,
  Columns2,
  Music,
  Grid3X3,
} from 'lucide-react';

interface ArtsToolkitProps {
  editor: unknown;
}

export default function ArtsToolkit({ editor: _editor }: ArtsToolkitProps) {
  const handleColorTheory = () => {
    useAppStore.getState().toggleColorTheory();
  };

  const handleArtCompare = () => {
    useAppStore.getState().toggleArtCompare();
  };

  const handleStaffNotation = () => {
    useAppStore.getState().toggleStaffNotation();
  };

  const handlePerspectiveGrid = () => {
    useAppStore.getState().togglePerspectiveGrid();
  };

  return (
    <div className="flex flex-col gap-1">
      {/* ---- Color & Design ---- */}
      <SectionLabel>Color &amp; Design</SectionLabel>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9"
            onClick={handleColorTheory}
          >
            <Palette className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Color Theory</TooltipContent>
      </Tooltip>

      <Separator className="my-1 w-8" />

      {/* ---- Comparison ---- */}
      <SectionLabel>Comparison</SectionLabel>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9"
            onClick={handleArtCompare}
          >
            <Columns2 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Art Compare</TooltipContent>
      </Tooltip>

      <Separator className="my-1 w-8" />

      {/* ---- Music ---- */}
      <SectionLabel>Music</SectionLabel>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9"
            onClick={handleStaffNotation}
          >
            <Music className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Staff Notation</TooltipContent>
      </Tooltip>

      <Separator className="my-1 w-8" />

      {/* ---- Drawing ---- */}
      <SectionLabel>Drawing</SectionLabel>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9"
            onClick={handlePerspectiveGrid}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Perspective Grid</TooltipContent>
      </Tooltip>
    </div>
  );
}
