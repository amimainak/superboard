// ============================================================
// CanvasOverlays — Floating Widgets Over the Tldraw Canvas
// ============================================================
// Renders all overlay widgets on top of the whiteboard:
//   - Think Timer (countdown widget)
//   - Student Reactions (emoji feedback)
//   - Spotlight indicator
//   - Presenter control bar
//   - LaTeX input bar
// These are positioned absolutely over the Tldraw canvas.
// ============================================================

'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tldraw/tldraw';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Timer,
  Play,
  Pause,
  Square,
  Eye,
  Hand,
  Type,
  X,
  Sparkles,
  Check,
  HelpCircle,
  Brain,
  Flame,
  ThumbsUp,
} from 'lucide-react';

// Lazy load new tool overlays
const DiacriticalToolbar = dynamic(() => import('@/components/tools/shared/DiacriticalToolbar'), { ssr: false });
const AnnotationLayerPanel = dynamic(() => import('@/components/tools/english-reading/AnnotationLayerPanel'), { ssr: false });
const FluencyTimerWidget = dynamic(() => import('@/components/tools/english-reading/FluencyTimerWidget'), { ssr: false });
const RubricOverlay = dynamic(() => import('@/components/tools/english-reading/RubricOverlay'), { ssr: false });
const ClozeBuilderPanel = dynamic(() => import('@/components/tools/foreign-language/ClozeBuilderPanel'), { ssr: false });
const FlashcardModeWidget = dynamic(() => import('@/components/tools/foreign-language/FlashcardModeWidget'), { ssr: false });
const TranslationToggle = dynamic(() => import('@/components/tools/foreign-language/TranslationToggle'), { ssr: false });
const SentenceRearrangePanel = dynamic(() => import('@/components/tools/general-tutoring/SentenceRearrangePanel'), { ssr: false });
// Math tool overlays
const FractionManipulative = dynamic(() => import('@/components/tools/math/FractionManipulative'), { ssr: false });
const UnitConverter = dynamic(() => import('@/components/tools/math/UnitConverter'), { ssr: false });
const StatsChartPanel = dynamic(() => import('@/components/tools/math/StatsChartPanel'), { ssr: false });
const StepRevealPanel = dynamic(() => import('@/components/tools/math/StepRevealPanel'), { ssr: false });
// Science tool overlays
const PeriodicTablePanel = dynamic(() => import('@/components/tools/science/PeriodicTablePanel'), { ssr: false });
const LabReportTemplate = dynamic(() => import('@/components/tools/science/LabReportTemplate'), { ssr: false });
// History tool overlays
const PunnettSquarePanel = dynamic(() => import('@/components/tools/history/PunnettSquarePanel'), { ssr: false });
const MapPanel = dynamic(() => import('@/components/tools/history/MapPanel'), { ssr: false });
const TimelinePanel = dynamic(() => import('@/components/tools/history/TimelinePanel'), { ssr: false });
const CauseEffectPanel = dynamic(() => import('@/components/tools/history/CauseEffectPanel'), { ssr: false });
const DBQWorkspace = dynamic(() => import('@/components/tools/history/DBQWorkspace'), { ssr: false });
// English tool overlays
const EssayBuilder = dynamic(() => import('@/components/tools/english/EssayBuilder'), { ssr: false });
const PartsOfSpeechPanel = dynamic(() => import('@/components/tools/english/PartsOfSpeechPanel'), { ssr: false });
// General tool overlays
const QuickPollWidget = dynamic(() => import('@/components/tools/general/QuickPollWidget'), { ssr: false });
// ELA tool overlays
const TextMarkupPanel = dynamic(() => import('@/components/tools/english-reading/TextMarkupPanel'), { ssr: false });
const StandardsTrackerPanel = dynamic(() => import('@/components/tools/english-reading/StandardsTrackerPanel'), { ssr: false });
const PhonemeGraphemePanel = dynamic(() => import('@/components/tools/english-reading/PhonemeGraphemePanel'), { ssr: false });
const PeerReviewPanel = dynamic(() => import('@/components/tools/english-reading/PeerReviewPanel'), { ssr: false });
// Math tool overlays
const CoordPlanePanel = dynamic(() => import('@/components/tools/math/CoordPlanePanel'), { ssr: false });
const ProofBuilderPanel = dynamic(() => import('@/components/tools/math/ProofBuilderPanel'), { ssr: false });
const BarModelPanel = dynamic(() => import('@/components/tools/math/BarModelPanel'), { ssr: false });
const NumberLinePanel = dynamic(() => import('@/components/tools/math/NumberLinePanel'), { ssr: false });
// Science tool overlays
const DiagramTemplatesPanel = dynamic(() => import('@/components/tools/science/DiagramTemplatesPanel'), { ssr: false });
const LewisDotPanel = dynamic(() => import('@/components/tools/science/LewisDotPanel'), { ssr: false });
// History tool overlays
const GovFlowchartPanel = dynamic(() => import('@/components/tools/history/GovFlowchartPanel'), { ssr: false });
const SupplyDemandPanel = dynamic(() => import('@/components/tools/history/SupplyDemandPanel'), { ssr: false });
// Foreign Language tool overlays
const PronunciationComparePanel = dynamic(() => import('@/components/tools/foreign-language/PronunciationComparePanel'), { ssr: false });
const ImageVocabPanel = dynamic(() => import('@/components/tools/foreign-language/ImageVocabPanel'), { ssr: false });
// General Tutoring tool overlays
const StudentPortfolioPanel = dynamic(() => import('@/components/tools/general-tutoring/StudentPortfolioPanel'), { ssr: false });
const MultiStudentPanel = dynamic(() => import('@/components/tools/general-tutoring/MultiStudentPanel'), { ssr: false });
const StickerRewardPanel = dynamic(() => import('@/components/tools/general-tutoring/StickerRewardPanel'), { ssr: false });
const AIMisconceptionPanel = dynamic(() => import('@/components/tools/general-tutoring/AIMisconceptionPanel'), { ssr: false });
// PE tool overlays
const SportsPlayPanel = dynamic(() => import('@/components/tools/pe/SportsPlayPanel'), { ssr: false });
const WorkoutPlanPanel = dynamic(() => import('@/components/tools/pe/WorkoutPlanPanel'), { ssr: false });
const FitnessTrackerPanel = dynamic(() => import('@/components/tools/pe/FitnessTrackerPanel'), { ssr: false });
// Health tool overlays
const FoodLabelPanel = dynamic(() => import('@/components/tools/health/FoodLabelPanel'), { ssr: false });
const MoodJournalPanel = dynamic(() => import('@/components/tools/health/MoodJournalPanel'), { ssr: false });
const BodySystemsPanel = dynamic(() => import('@/components/tools/health/BodySystemsPanel'), { ssr: false });
// Arts tool overlays
const ColorTheoryPanel = dynamic(() => import('@/components/tools/arts/ColorTheoryPanel'), { ssr: false });
const ArtComparePanel = dynamic(() => import('@/components/tools/arts/ArtComparePanel'), { ssr: false });
const StaffNotationPanel = dynamic(() => import('@/components/tools/arts/StaffNotationPanel'), { ssr: false });
const PerspectiveGridPanel = dynamic(() => import('@/components/tools/arts/PerspectiveGridPanel'), { ssr: false });
import { renderLatex } from '@/lib/katex';

interface CanvasOverlaysProps {
  editorRef: React.RefObject<Editor | null>;
}

export default function CanvasOverlays({ editorRef }: CanvasOverlaysProps) {
  const editor = editorRef.current;
  return (
    <>
      <ThinkTimerWidget />
      <ReactionBar editor={editor} />
      <SpotlightIndicator />
      <PresenterControlBar />
      <LatexInputBar editor={editor} />
      {/* New tool overlays */}
      <DiacriticalToolbar />
      <AnnotationLayerPanel />
      <FluencyTimerWidget />
      <RubricOverlay />
      <ClozeBuilderPanel editor={editor} />
      <FlashcardModeWidget />
      <TranslationToggle />
      <SentenceRearrangePanel editor={editor} />
      {/* Math tool panels */}
      <FractionManipulative editor={editor} />
      <UnitConverter editor={editor} />
      <StatsChartPanel editor={editor} />
      <StepRevealPanel editor={editor} />
      {/* Science tool panels */}
      <PeriodicTablePanel editor={editor} />
      <LabReportTemplate editor={editor} />
      {/* History tool panels */}
      <PunnettSquarePanel editor={editor} />
      <MapPanel editor={editor} />
      <TimelinePanel editor={editor} />
      <CauseEffectPanel editor={editor} />
      <DBQWorkspace editor={editor} />
      {/* English tool panels */}
      <EssayBuilder editor={editor} />
      <PartsOfSpeechPanel editor={editor} />
      {/* General tool panels */}
      <QuickPollWidget editor={editor} />
      {/* ELA tool panels */}
      <TextMarkupPanel editor={editor} />
      <StandardsTrackerPanel editor={editor} />
      <PhonemeGraphemePanel editor={editor} />
      <PeerReviewPanel editor={editor} />
      {/* Math tool panels */}
      <CoordPlanePanel editor={editor} />
      <ProofBuilderPanel editor={editor} />
      <BarModelPanel editor={editor} />
      <NumberLinePanel editor={editor} />
      {/* Science tool panels */}
      <DiagramTemplatesPanel editor={editor} />
      <LewisDotPanel editor={editor} />
      {/* History tool panels */}
      <GovFlowchartPanel editor={editor} />
      <SupplyDemandPanel editor={editor} />
      {/* Foreign Language tool panels */}
      <PronunciationComparePanel editor={editor} />
      <ImageVocabPanel editor={editor} />
      {/* General Tutoring tool panels */}
      <StudentPortfolioPanel editor={editor} />
      <MultiStudentPanel editor={editor} />
      <StickerRewardPanel editor={editor} />
      <AIMisconceptionPanel editor={editor} />
      {/* PE tool panels */}
      <SportsPlayPanel editor={editor} />
      <WorkoutPlanPanel editor={editor} />
      <FitnessTrackerPanel editor={editor} />
      {/* Health tool panels */}
      <FoodLabelPanel editor={editor} />
      <MoodJournalPanel editor={editor} />
      <BodySystemsPanel editor={editor} />
      {/* Arts tool panels */}
      <ColorTheoryPanel editor={editor} />
      <ArtComparePanel editor={editor} />
      <StaffNotationPanel editor={editor} />
      <PerspectiveGridPanel editor={editor} />
    </>
  );
}

// ============================================================
// Think Timer — Countdown Timer Widget
// ============================================================
function ThinkTimerWidget() {
  const { room, startThinkTimer, stopThinkTimer, tickThinkTimer } = useAppStore();
  const isTutor = room.isTutor;
  const { thinkTimerActive, thinkTimerSeconds, thinkTimerTotal } = room;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick every second when timer is active
  useEffect(() => {
    if (thinkTimerActive && thinkTimerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        tickThinkTimer();
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [thinkTimerActive, tickThinkTimer]);

  if (!thinkTimerActive && thinkTimerSeconds === 0) return null;

  const progress = thinkTimerTotal > 0 ? thinkTimerSeconds / thinkTimerTotal : 0;
  const isLow = thinkTimerSeconds <= 10 && thinkTimerSeconds > 0;
  const isDone = thinkTimerActive && thinkTimerSeconds === 0;

  // Auto-stop when done
  useEffect(() => {
    if (isDone) stopThinkTimer();
  }, [isDone, stopThinkTimer]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          borderRadius: 12,
          background: isLow
            ? 'rgba(239, 68, 68, 0.15)'
            : 'rgba(255, 255, 255, 0.95)',
          border: `1px solid ${isLow ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0,0,0,0.1)'}`,
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Timer
          style={{ width: 18, height: 18, color: isLow ? '#ef4444' : '#6366f1' }}
        />
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: 24,
            fontWeight: 700,
            color: isLow ? '#ef4444' : '#1f2937',
            minWidth: 60,
            textAlign: 'center',
          }}
        >
          {Math.floor(thinkTimerSeconds / 60)}:{String(thinkTimerSeconds % 60).padStart(2, '0')}
        </span>
        {/* Progress bar */}
        <div
          style={{
            width: 100,
            height: 4,
            borderRadius: 2,
            background: 'rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              borderRadius: 2,
              background: isLow ? '#ef4444' : '#6366f1',
              transition: 'width 1s linear',
            }}
          />
        </div>
        {isTutor && (
          <button
            onClick={stopThinkTimer}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: 'none',
              background: 'rgba(0,0,0,0.05)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Stop timer"
          >
            <Square style={{ width: 12, height: 12, color: '#6b7280' }} />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Student Reaction Bar — Emoji Feedback
// ============================================================
const REACTION_OPTIONS = [
  { emoji: '\u2705', label: 'Got it', icon: Check },
  { emoji: '\u2753', label: 'Confused', icon: HelpCircle },
  { emoji: '\uD83E\uDDE0', label: 'Thinking', icon: Brain },
  { emoji: '\uD83D\uDD25', label: 'Great!', icon: Flame },
  { emoji: '\uD83D\uDC4D', label: 'Nice', icon: ThumbsUp },
];

function ReactionBar({ editor }: { editor: Editor | null }) {
  const { room, addReaction, clearReactions } = useAppStore();
  const isTutor = room.isTutor;
  const { reactions } = room;
  const userId = room.userId || 'anonymous';
  const userName = room.userName || 'Student';

  const handleReaction = useCallback(
    (emoji: string) => {
      // Get viewport center for reaction position
      let x = 400;
      let y = 300;
      if (editor) {
        const bounds = editor.getCurrentPageBounds();
        if (bounds) {
          x = bounds.center.x;
          y = bounds.center.y;
        }
      }
      addReaction({ emoji, userId, userName, x: x + (Math.random() - 0.5) * 200, y: y + (Math.random() - 0.5) * 100 });
    },
    [editor, userId, userName, addReaction]
  );

  // Clear old reactions (older than 5 seconds)
  useEffect(() => {
    const now = Date.now();
    const stale = reactions.filter((r) => now - r.createdAt > 5000);
    if (stale.length > 0) {
      clearReactions();
    }
  }, [reactions, clearReactions]);

  return (
    <>
      {/* Reaction buttons */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          gap: 4,
          padding: '4px 8px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(0,0,0,0.1)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        {REACTION_OPTIONS.map(({ emoji, label }) => (
          <Tooltip key={emoji}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleReaction(emoji)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.15s',
                }}
                onMouseDown={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1.3)';
                }}
                onMouseUp={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1)';
                }}
                aria-label={`React: ${label}`}
              >
                {emoji}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Rendered reactions on canvas */}
      {reactions.map((reaction) => {
        const age = (Date.now() - reaction.createdAt) / 1000;
        const opacity = age < 3.5 ? 1 : Math.max(0, 1 - (age - 3.5) / 1.5);
        const scale = age < 0.3 ? 0.5 + (age / 0.3) * 0.5 : 1;
        return (
          <div
            key={reaction.id}
            style={{
              position: 'absolute',
              left: `${Math.min(80, Math.max(10, (reaction.x / 2000) * 100))}%`,
              top: `${Math.min(80, Math.max(10, (reaction.y / 1500) * 100))}%`,
              zIndex: 999,
              pointerEvents: 'none',
              fontSize: 32,
              opacity,
              transform: `scale(${scale})`,
              transition: 'opacity 0.3s, transform 0.2s',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            }}
            aria-hidden="true"
          >
            {reaction.emoji}
            <div
              style={{
                fontSize: 10,
                textAlign: 'center',
                color: '#6b7280',
                fontWeight: 500,
                marginTop: -4,
              }}
            >
              {reaction.userName}
            </div>
          </div>
        );
      })}
    </>
  );
}

// ============================================================
// Spotlight Indicator — Shows when follow-me mode is active
// ============================================================
function SpotlightIndicator() {
  const { room } = useAppStore();
  const isTutor = room.isTutor;
  const { spotlightMode } = room;

  if (!spotlightMode) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        right: 16,
        zIndex: 1000,
        padding: '6px 12px',
        borderRadius: 8,
        background: 'rgba(99, 102, 241, 0.15)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        color: '#4338ca',
        pointerEvents: isTutor ? 'auto' : 'none',
      }}
    >
      <Eye style={{ width: 14, height: 14 }} />
      Spotlight Mode
      {isTutor && (
        <button
          onClick={() => useAppStore.getState().toggleSpotlightMode()}
          style={{
            marginLeft: 4,
            width: 20,
            height: 20,
            borderRadius: 4,
            border: 'none',
            background: 'rgba(99, 102, 241, 0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Disable spotlight"
        >
          <X style={{ width: 12, height: 12 }} />
        </button>
      )}
    </div>
  );
}

// ============================================================
// Presenter Control Bar — Tutor can give/take draw control
// ============================================================
function PresenterControlBar() {
  const { room, setPresenter } = useAppStore();
  const isTutor = room.isTutor;
  const { presenterUserId, participants } = room;

  if (!isTutor || participants.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        padding: '6px 12px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid rgba(0,0,0,0.1)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <Hand style={{ width: 14, height: 14, color: '#6366f1' }} />
      <span style={{ fontWeight: 600, color: '#374151' }}>
        {presenterUserId ? 'Control:' : 'Give control:'}
      </span>
      {/* Tutor button */}
      <button
        onClick={() => setPresenter(null)}
        style={{
          padding: '4px 8px',
          borderRadius: 6,
          border: presenterUserId === null ? '1px solid #6366f1' : '1px solid transparent',
          background: presenterUserId === null ? 'rgba(99,102,241,0.1)' : 'transparent',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 500,
          color: presenterUserId === null ? '#4338ca' : '#6b7280',
        }}
      >
        You
      </button>
      {/* Student buttons */}
      {participants.map((p) => (
        <button
          key={p.id}
          onClick={() => setPresenter(p.id === presenterUserId ? null : p.id)}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: p.id === presenterUserId ? '1px solid #6366f1' : '1px solid transparent',
            background: p.id === presenterUserId ? 'rgba(99,102,241,0.1)' : 'transparent',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 500,
            color: p.id === presenterUserId ? '#4338ca' : '#6b7280',
          }}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// LaTeX Input Bar — Inline LaTeX rendering
// ============================================================
function LatexInputBar({ editor }: { editor: Editor | null }) {
  const { room, toggleLatexMode } = useAppStore();
  const { latexMode } = room;
  const [input, setInput] = React.useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (latexMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [latexMode]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || !editor) return;

      try {
        const html = renderLatex(input.trim(), false);
        // Create a text shape with the rendered LaTeX
        // Tldraw text doesn't support HTML, so we create an embed-like annotation
        const bounds = editor.getCurrentPageBounds();
        if (bounds) {
          editor.createShapes([
            {
              type: 'text',
              x: bounds.center.x - 50,
              y: bounds.center.y - 20,
              text: `[LaTeX] ${input.trim()}`,
              style: { italic: true, color: '#4338ca' },
            } as any,
          ] as any);
        }
        setInput('');
        toggleLatexMode();
      } catch (err) {
        console.error('[LaTeX] Error:', err);
      }
    },
    [input, editor, toggleLatexMode]
  );

  if (!latexMode) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 140,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.97)',
        border: '2px solid #6366f1',
        boxShadow: '0 8px 24px rgba(99,102,241,0.15)',
      }}
    >
      <Type style={{ width: 16, height: 16, color: '#6366f1' }} />
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type LaTeX (e.g. \\frac{1}{2})"
          style={{
            width: 280,
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid rgba(0,0,0,0.1)',
            fontSize: 14,
            fontFamily: 'monospace',
            outline: 'none',
          }}
          aria-label="LaTeX input"
        />
        <button
          type="submit"
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            border: 'none',
            background: '#6366f1',
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Insert
        </button>
      </form>
      <button
        onClick={() => { setInput(''); toggleLatexMode(); }}
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          border: 'none',
          background: 'rgba(0,0,0,0.05)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X style={{ width: 14, height: 14 }} />
      </button>
      {/* Live preview */}
      {input.trim() && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            right: 0,
            padding: '8px 12px',
            background: 'rgba(255,255,255,0.98)',
            borderRadius: '10px 10px 0 0',
            borderTop: '1px solid rgba(0,0,0,0.05)',
          }}
          dangerouslySetInnerHTML={{ __html: renderLatex(input.trim(), true) }}
        />
      )}
    </div>
  );
}
