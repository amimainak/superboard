// ============================================================
// SessionControls — Tutor-only session management controls
// ============================================================
// Fixed top-left, below SessionTimer. Houses:
//   - Focus Mode (Bring All to Me) — viewport sync
//   - Pen Freeze — lock student drawing
//   - Private Scratchpad — hidden tutor canvas
//   - Accessibility settings — font, contrast, color-blind mode
// ============================================================

'use client';

import React, { useState } from 'react';
import { useAppStore, type AccessibilityMode, type ColorBlindMode } from '@/store/app-store';
import {
  Eye,
  Lock,
  NotebookPen,
  Accessibility,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type Props = {
  isTutor: boolean;
};

export default function SessionControls({ isTutor }: Props) {
  if (!isTutor) return null;

  return (
    <div className="fixed top-16 left-3 z-40 flex flex-col gap-1.5">
      <FocusModeButton />
      <PenFreezeButton />
      <ScratchpadButton />
      <AccessibilityPopover />
    </div>
  );
}

// ============================================================
// Focus Mode (Bring All to Me)
// ============================================================
function FocusModeButton() {
  const focusMode = useAppStore((s) => s.room.focusMode);
  const toggleFocusMode = useAppStore((s) => s.toggleFocusMode);
  const isTutor = useAppStore((s) => s.room.isTutor);

  if (!isTutor) return null;

  return (
    <Button
      variant={focusMode ? 'default' : 'outline'}
      size="sm"
      className={cn(
        'gap-1.5 rounded-full text-xs font-medium shadow-sm transition-all',
        focusMode
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
          : 'bg-white/90 hover:bg-white text-gray-700 border-gray-200'
      )}
      onClick={toggleFocusMode}
      aria-label={focusMode ? 'Disable focus mode' : 'Enable focus mode — bring all students to your view'}
      title={focusMode ? 'Focus Mode ON — students see your viewport' : 'Focus Mode OFF — click to bring all students to your view'}
    >
      <Eye className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Focus</span>
    </Button>
  );
}

// ============================================================
// Pen Freeze
// ============================================================
function PenFreezeButton() {
  const penFreeze = useAppStore((s) => s.room.penFreeze);
  const togglePenFreeze = useAppStore((s) => s.togglePenFreeze);
  const isTutor = useAppStore((s) => s.room.isTutor);

  if (!isTutor) return null;

  return (
    <Button
      variant={penFreeze ? 'default' : 'outline'}
      size="sm"
      className={cn(
        'gap-1.5 rounded-full text-xs font-medium shadow-sm transition-all',
        penFreeze
          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
          : 'bg-white/90 hover:bg-white text-gray-700 border-gray-200'
      )}
      onClick={togglePenFreeze}
      aria-label={penFreeze ? 'Unfreeze student pens' : 'Freeze student pens — disable drawing'}
      title={penFreeze ? 'Pen Freeze ON — students cannot draw' : 'Pen Freeze OFF — click to lock student drawing'}
    >
      <Lock className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Freeze</span>
    </Button>
  );
}

// ============================================================
// Private Scratchpad
// ============================================================
function ScratchpadButton() {
  const scratchpadOpen = useAppStore((s) => s.room.scratchpadOpen);
  const toggleScratchpad = useAppStore((s) => s.toggleScratchpad);
  const isTutor = useAppStore((s) => s.room.isTutor);

  if (!isTutor) return null;

  return (
    <Button
      variant={scratchpadOpen ? 'default' : 'outline'}
      size="sm"
      className={cn(
        'gap-1.5 rounded-full text-xs font-medium shadow-sm transition-all',
        scratchpadOpen
          ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-600/30'
          : 'bg-white/90 hover:bg-white text-gray-700 border-gray-200'
      )}
      onClick={toggleScratchpad}
      aria-label={scratchpadOpen ? 'Close scratchpad — return to whiteboard' : 'Open scratchpad — private tutor notes'}
      title={scratchpadOpen ? 'Scratchpad ON — students cannot see this page' : 'Scratchpad OFF — click to open private workspace'}
    >
      <NotebookPen className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Scratchpad</span>
    </Button>
  );
}

// ============================================================
// Accessibility Settings Popover
// ============================================================
function AccessibilityPopover() {
  const isTutor = useAppStore((s) => s.room.isTutor);
  const [open, setOpen] = useState(false);

  if (!isTutor) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-full text-xs font-medium shadow-sm bg-white/90 hover:bg-white text-gray-700 border-gray-200"
          aria-label="Accessibility settings"
          title="Accessibility — font, contrast, color-blind modes"
        >
          <Accessibility className="w-3.5 h-3.5" />
          <ChevronDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-64 rounded-xl p-3">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">Accessibility</p>

          {/* Accessibility Mode */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Display Mode</p>
            <div className="grid grid-cols-2 gap-1">
              <ModeOption
                label="Normal"
                mode="normal"
                type="accessibility"
                active={useAppStore((s) => s.accessibilityMode) === 'normal'}
              />
              <ModeOption
                label="Dyslexia Font"
                mode="dyslexia"
                type="accessibility"
                active={useAppStore((s) => s.accessibilityMode) === 'dyslexia'}
              />
              <ModeOption
                label="High Contrast"
                mode="high-contrast"
                type="accessibility"
                active={useAppStore((s) => s.accessibilityMode) === 'high-contrast'}
              />
              <ModeOption
                label="Large Text"
                mode="large-text"
                type="accessibility"
                active={useAppStore((s) => s.accessibilityMode) === 'large-text'}
              />
            </div>
          </div>

          <Separator />

          {/* Color Blind Mode */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Color-Blind Mode</p>
            <div className="grid grid-cols-2 gap-1">
              <ModeOption
                label="Normal"
                mode="none"
                type="colorblind"
                active={useAppStore((s) => s.colorBlindMode) === 'none'}
              />
              <ModeOption
                label="Protanopia"
                mode="protanopia"
                type="colorblind"
                active={useAppStore((s) => s.colorBlindMode) === 'protanopia'}
              />
              <ModeOption
                label="Deuteranopia"
                mode="deuteranopia"
                type="colorblind"
                active={useAppStore((s) => s.colorBlindMode) === 'deuteranopia'}
              />
              <ModeOption
                label="Tritanopia"
                mode="tritanopia"
                type="colorblind"
                active={useAppStore((s) => s.colorBlindMode) === 'tritanopia'}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================
// Mode option button
// ============================================================
function ModeOption({
  label,
  mode,
  type,
  active,
}: {
  label: string;
  mode: string;
  type: 'accessibility' | 'colorblind';
  active: boolean;
}) {
  const setMode = () => {
    const store = useAppStore.getState();
    if (type === 'accessibility') {
      store.setAccessibilityMode(mode as AccessibilityMode);
    } else {
      store.setColorBlindMode(mode as ColorBlindMode);
    }
  };

  return (
    <button
      type="button"
      onClick={setMode}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
      )}
    >
      {active && <Check className="w-3 h-3" />}
      {label}
    </button>
  );
}
