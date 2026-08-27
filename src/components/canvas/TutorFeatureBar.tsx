// ============================================================
// TutorFeatureBar — Feature Toggles for the Tutor (Updated)
// ============================================================
// Floating bar below the main toolbar with:
//   - Think Timer presets (30s, 1m, 2m, 5m)
//   - Spotlight mode toggle
//   - LaTeX mode toggle
//   - Focus mode toggle
//   - Split-screen mode
//   - Curtain / Reveal mode
//   - Quick panel launchers for key tools
// ============================================================

'use client';

import React from 'react';
import { Editor } from '@tldraw/tldraw';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Timer,
  Eye,
  Type,
  EyeOff,
  Hand,
  Columns2,
  Square,
  PanelRightClose,
  Circle,
  Video,
  Mic,
  StickyNote,
  BarChart3,
  Atom,
  MapPin,
  BookOpenText,
  ClipboardList,
  Loader,
  Dna,
  FlaskConical,
  CircleDot,
  Goal,
  Trophy,
  Volleyball,
  // TableTennis not available in lucide-react, use Dumbbell instead
  Dumbbell as TableTennis,
  Activity,
  Apple,
  SmilePlus,
  HeartPulse,
  Palette,
  Music,
  Grid3X3,
  BarChart3 as FileBarChart2,
} from 'lucide-react';

interface TutorFeatureBarProps {
  editor: Editor | null;
}

export default function TutorFeatureBar({ editor }: TutorFeatureBarProps) {
  const store = useAppStore();
  const isTutor = store.room.isTutor;
  const {
    spotlightMode, focusMode, latexMode, presenterUserId,
    participants, splitScreenMode, curtainMode,
  } = store.room;

  if (!isTutor) return null;

  return (
    <div
      className="flex flex-col items-center gap-1 p-1.5 bg-card/80 border rounded-xl shadow-lg backdrop-blur-sm max-h-[calc(100vh-200px)] overflow-y-auto"
      role="toolbar"
      aria-label="Tutor feature controls"
    >
      {/* Timer Presets */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-xs font-mono"
            onClick={() => store.startThinkTimer(30)} aria-label="Start 30 second timer">30s</Button>
        </TooltipTrigger>
        <TooltipContent side="right">Think Timer: 30s</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-xs font-mono"
            onClick={() => store.startThinkTimer(60)} aria-label="Start 1 minute timer">1m</Button>
        </TooltipTrigger>
        <TooltipContent side="right">Think Timer: 1m</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-xs font-mono"
            onClick={() => store.startThinkTimer(120)} aria-label="Start 2 minute timer">2m</Button>
        </TooltipTrigger>
        <TooltipContent side="right">Think Timer: 2m</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-xs font-mono"
            onClick={() => store.startThinkTimer(300)} aria-label="Start 5 minute timer">5m</Button>
        </TooltipTrigger>
        <TooltipContent side="right">Think Timer: 5m</TooltipContent>
      </Tooltip>

      <Separator className="my-1 w-6" />

      {/* Spotlight Mode */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={spotlightMode ? 'default' : 'ghost'} size="icon" className="w-8 h-8"
            onClick={store.toggleSpotlightMode} aria-label="Spotlight mode">
            <Eye className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{spotlightMode ? 'Disable Spotlight' : 'Spotlight Mode'}</TooltipContent>
      </Tooltip>

      {/* Focus Mode */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={focusMode ? 'default' : 'ghost'} size="icon" className="w-8 h-8"
            onClick={store.toggleFocusMode} aria-label="Focus mode">
            {focusMode ? <EyeOff className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{focusMode ? 'Disable Focus' : 'Focus Mode'}</TooltipContent>
      </Tooltip>

      {/* LaTeX Mode */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={latexMode ? 'default' : 'ghost'} size="icon" className="w-8 h-8"
            onClick={store.toggleLatexMode} aria-label="LaTeX input">
            <Type className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{latexMode ? 'Close LaTeX' : 'LaTeX Input'}</TooltipContent>
      </Tooltip>

      {/* Split-Screen Mode */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={splitScreenMode ? 'default' : 'ghost'} size="icon" className="w-8 h-8"
            onClick={store.toggleSplitScreenMode} aria-label="Split-screen mode">
            <Columns2 className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{splitScreenMode ? 'Exit Split-Screen' : 'Split-Screen'}</TooltipContent>
      </Tooltip>

      {/* Curtain / Reveal Mode */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={curtainMode ? 'default' : 'ghost'} size="icon" className="w-8 h-8"
            onClick={store.toggleCurtainMode} aria-label="Curtain reveal mode">
            {curtainMode ? <PanelRightClose className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{curtainMode ? 'Remove Curtains' : 'Reveal Curtain'}</TooltipContent>
      </Tooltip>

      {/* Recording indicator (architectural - LiveKit not connected) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={() => store.setRecording(!store.room.isRecording)} aria-label="Toggle recording">
            <Video className={`w-3.5 h-3.5 ${store.room.isRecording ? 'text-red-500' : ''}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{store.room.isRecording ? 'Stop Recording' : 'Start Recording'}</TooltipContent>
      </Tooltip>

      {/* Give/Revoke Control */}
      {participants.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant={presenterUserId !== null ? 'default' : 'ghost'} size="icon" className="w-8 h-8"
              onClick={() => store.setPresenter(presenterUserId ? null : participants[0]?.id || null)}
              aria-label={presenterUserId ? 'Revoke control' : 'Give control'}>
              <Hand className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{presenterUserId ? 'Revoke Control' : 'Give Control'}</TooltipContent>
        </Tooltip>
      )}

      <Separator className="my-1 w-6" />

      {/* Quick Panel Launchers */}
      <SectionDot label="Math" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleFractionManip} aria-label="Fraction manipulatives">
            <Circle className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Fractions</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleUnitConverter} aria-label="Unit converter">
            <FlaskConical className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Convert</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleStatsChart} aria-label="Statistics charts">
            <BarChart3 className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Stats</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleStepReveal} aria-label="Step reveal">
            <Loader className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Steps</TooltipContent>
      </Tooltip>

      <SectionDot label="Science" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.togglePeriodicTable} aria-label="Periodic table">
            <Atom className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Periodic Table</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.togglePunnettSquare} aria-label="Punnett square">
            <Dna className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Punnett Sq.</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleLabReport} aria-label="Lab report template">
            <FileBarChart2 className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Lab Report</TooltipContent>
      </Tooltip>

      <SectionDot label="ELA" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleEssayBuilder} aria-label="Essay builder">
            <BookOpenText className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Essay</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.togglePartsOfSpeech} aria-label="Parts of speech">
            <StickyNote className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">POS</TooltipContent>
      </Tooltip>

      <SectionDot label="History" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleMapPanel} aria-label="Map overlays">
            <MapPin className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Maps</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleTimelinePanel} aria-label="Timeline builder">
            <BookOpenText className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Timeline</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleDBQWorkspace} aria-label="DBQ workspace">
            <ClipboardList className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">DBQ</TooltipContent>
      </Tooltip>

      <SectionDot label="General" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleQuickPoll} aria-label="Quick poll">
            <BarChart3 className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Poll</TooltipContent>
      </Tooltip>

      <SectionDot label="PE" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleSportsPlay} aria-label="Sports Play">
            <CircleDot className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Sports Play</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleWorkoutPlan} aria-label="Workout Plan">
            <ClipboardList className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Workout Plan</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleFitnessTracker} aria-label="Fitness Tracker">
            <Activity className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Fitness Tracker</TooltipContent>
      </Tooltip>

      <SectionDot label="Health" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleFoodLabel} aria-label="Food Label">
            <Apple className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Food Label</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleMoodJournal} aria-label="Wellness">
            <SmilePlus className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Wellness</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleBodySystems} aria-label="Anatomy">
            <HeartPulse className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Anatomy</TooltipContent>
      </Tooltip>

      <SectionDot label="Arts" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleColorTheory} aria-label="Color Theory">
            <Palette className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Color</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleArtCompare} aria-label="Art Compare">
            <Columns2 className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Compare</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.toggleStaffNotation} aria-label="Staff Notation">
            <Music className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Music</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="w-8 h-8"
            onClick={store.togglePerspectiveGrid} aria-label="Perspective Grid">
            <Grid3X3 className="w-3.5 h-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Grid</TooltipContent>
      </Tooltip>
    </div>
  );
}

function SectionDot({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 mt-1">
      <span className="text-[9px] font-medium text-muted-foreground leading-none">{label}</span>
    </div>
  );
}
