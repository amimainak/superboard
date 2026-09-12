// ============================================================
// Lesson Player (Milestone 2 — Lesson Builder)
// ============================================================
// Floating bottom bar that walks the tutor through a LessonPlan
// step-by-step. For each step:
//   - (Optionally clears the canvas first.)
//   - Adds the step's widget to the canvas via the existing
//     addToBoard pattern (uses useWhiteboardStore.addElement +
//     getDefaultWidgetConfig + getWidgetDefaultSize).
//   - Adds a TextElement with the step's instructions next to it.
//   - Shows step counter, Next/Prev buttons, instructions overlay,
//     and a "Lesson Complete!" banner at the end.
// ============================================================

'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { getDefaultWidgetConfig, getWidgetDefaultSize } from '@/components/whiteboard/CanvasWidgets'
import { generateId } from '@/lib/whiteboard/utils'
import type { LessonPlanFull, LessonStep } from '@/types'
import type { WidgetElement, TextElement } from '@/lib/whiteboard/types'
import {
  Play,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  RotateCcw,
  Layers,
  Eye,
  StickyNote,
} from 'lucide-react'

interface LessonPlayerProps {
  open: boolean
  lesson: LessonPlanFull | null
  onClose: () => void
}

export function LessonPlayer({ open, lesson, onClose }: LessonPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [keepPrevious, setKeepPrevious] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [lessonNotes, setLessonNotes] = useState('')

  // ---- Whiteboard store hooks ----
  const addElement = useWhiteboardStore((s) => s.addElement)
  const clearCurrentPage = useWhiteboardStore((s) => s.clearCurrentPage)
  const pushHistory = useWhiteboardStore((s) => s.pushHistory)
  const isDark = useWhiteboardStore((s) => s.isDark)
  const camera = useWhiteboardStore((s) => s.camera)
  const currentPageIndex = useWhiteboardStore((s) => s.currentPageIndex)

  // Reset state when lesson changes or opens
  useEffect(() => {
    if (open && lesson) {
      setCurrentIndex(0)
      setStarted(false)
      setFinished(false)
      setLessonNotes('')
      setShowConfirmClear(true) // ask before starting
    } else if (!open) {
      setStarted(false)
      setFinished(false)
      setShowConfirmClear(false)
    }
  }, [open, lesson?.id])

  const steps = lesson?.steps ?? []
  const totalSteps = steps.length
  const currentStep: LessonStep | null = currentIndex < totalSteps ? steps[currentIndex] : null

  // ---- Add step widget + instructions to the canvas ----
  const placeStepOnCanvas = useCallback((step: LessonStep) => {
    const size = getWidgetDefaultSize(step.widgetKind)
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    // Center of viewport, in canvas coords
    const cx = (vw / 2 - camera.x) / camera.zoom
    const cy = ((vh / 2 - 60) - camera.y) / camera.zoom
    // Offset widget slightly left-of-center so instructions can sit on the right
    const widgetX = cx - (size.width / 2) - 100
    const widgetY = cy - (size.height / 2)

    pushHistory()
    const widget: WidgetElement = {
      id: generateId(),
      type: 'widget',
      widgetKind: step.widgetKind,
      config: step.widgetConfig && Object.keys(step.widgetConfig).length > 0
        ? step.widgetConfig
        : getDefaultWidgetConfig(step.widgetKind),
      x: widgetX,
      y: widgetY,
      width: size.width,
      height: size.height,
      rotation: 0,
      opacity: 1,
      strokeColor: isDark ? '#334155' : '#e2e8f0',
      fillColor: isDark ? '#0f172a' : '#ffffff',
      strokeWidth: 1,
      locked: false,
      pageIndex: currentPageIndex,
    }
    addElement(widget)

    // Optional instructions text element placed to the right of the widget
    if (step.instructions && step.instructions.trim()) {
      const instr: TextElement = {
        id: generateId(),
        type: 'text',
        x: widgetX + size.width + 24,
        y: widgetY,
        width: 280,
        height: 200,
        rotation: 0,
        opacity: 1,
        strokeColor: 'transparent',
        fillColor: isDark ? '#e2e8f0' : '#0f172a',
        strokeWidth: 0,
        text: `${step.title}\n\n${step.instructions.trim()}`,
        fontSize: 14,
        fontFamily: 'inherit',
        textAlign: 'left',
        fontWeight: '600',
        autoSize: false,
        locked: false,
        pageIndex: currentPageIndex,
      }
      addElement(instr)
    }
  }, [addElement, camera.x, camera.y, camera.zoom, currentPageIndex, isDark, pushHistory])

  // ---- Begin the lesson (clear canvas, place step 1) ----
  const handleStart = useCallback(() => {
    if (!lesson || totalSteps === 0) return
    setShowConfirmClear(false)
    setStarted(true)
    setCurrentIndex(0)
    setFinished(false)
    // Clear canvas (with the implicit confirmation from the dialog)
    pushHistory()
    clearCurrentPage()
    // Place step 1
    setTimeout(() => placeStepOnCanvas(steps[0]), 50)
  }, [lesson, totalSteps, pushHistory, clearCurrentPage, placeStepOnCanvas, steps])

  // ---- Advance to next step ----
  const handleNext = useCallback(() => {
    if (!lesson || currentIndex >= totalSteps - 1) {
      setFinished(true)
      return
    }
    const nextIdx = currentIndex + 1
    if (!keepPrevious) {
      // Clear before placing next step (single history push so undo restores prior state)
      pushHistory()
      clearCurrentPage()
      setTimeout(() => placeStepOnCanvas(steps[nextIdx]), 50)
    } else {
      placeStepOnCanvas(steps[nextIdx])
    }
    setCurrentIndex(nextIdx)
  }, [lesson, currentIndex, totalSteps, keepPrevious, pushHistory, clearCurrentPage, placeStepOnCanvas, steps])

  // ---- Go back to previous step (does NOT clear — just rewinds the counter) ----
  const handlePrev = useCallback(() => {
    if (currentIndex <= 0) return
    setCurrentIndex((i) => Math.max(0, i - 1))
    setFinished(false)
  }, [currentIndex])

  // ---- Restart from step 1 ----
  const handleRestart = useCallback(() => {
    setShowConfirmClear(true)
    setStarted(false)
    setFinished(false)
    setCurrentIndex(0)
  }, [])

  // ---- Keyboard: Arrow Left/Right when player is open ----
  useEffect(() => {
    if (!open || !started || finished) return
    const handler = (e: KeyboardEvent) => {
      // Don't interfere with typing in form fields
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, started, finished, handleNext, handlePrev, onClose])

  if (!open || !lesson) return null

  const progressPct = totalSteps > 0 ? Math.round(((currentIndex + (finished ? 1 : 0)) / totalSteps) * 100) : 0

  return (
    <>
      {/* ============================================================
          Confirm-clear dialog at start / restart
          ============================================================ */}
      {showConfirmClear && (
        <div className="lp-confirm-overlay" role="dialog" aria-modal="true" aria-label="Start lesson">
          <div className="lp-confirm-dialog">
            <div className="lp-confirm-icon">
              <Play className="w-5 h-5 text-white" />
            </div>
            <h3 className="lp-confirm-title">Play &ldquo;{lesson.title}&rdquo;?</h3>
            <p className="lp-confirm-text">
              This will <strong>clear your current canvas</strong> and walk you through{' '}
              <strong>{totalSteps} step{totalSteps !== 1 ? 's' : ''}</strong>.
              You can navigate with the arrow keys or the buttons in the player bar.
            </p>
            <div className="lp-confirm-actions">
              <button onClick={onClose} className="lp-btn-ghost">Cancel</button>
              <button onClick={handleStart} className="lp-btn-primary">
                <Play className="w-4 h-4" /> Start Lesson
              </button>
            </div>
          </div>
          <style jsx>{`
            .lp-confirm-overlay {
              position: fixed; inset: 0; z-index: 10001;
              background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
              display: flex; align-items: center; justify-content: center;
              padding: 16px; animation: lpFade 150ms ease;
            }
            .lp-confirm-dialog {
              background: #fff; border-radius: 16px;
              padding: 28px 26px; max-width: 420px; width: 100%;
              text-align: center;
              box-shadow: 0 24px 48px -12px rgba(0,0,0,0.2);
              animation: lpSlide 200ms ease;
            }
            .lp-confirm-icon {
              width: 48px; height: 48px; border-radius: 14px; margin: 0 auto 14px;
              background: linear-gradient(135deg, #10b981, #059669);
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 8px 20px rgba(16,185,129,0.25);
            }
            .lp-confirm-title { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
            .lp-confirm-text { font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 20px; }
            .lp-confirm-text strong { color: #0f172a; }
            .lp-confirm-actions { display: flex; gap: 10px; justify-content: center; }
            .lp-btn-ghost {
              height: 38px; padding: 0 16px; border-radius: 10px;
              font-size: 13px; font-weight: 600; color: #64748b;
              background: #f1f5f9; border: none; cursor: pointer;
            }
            .lp-btn-ghost:hover { background: #e2e8f0; }
            .lp-btn-primary {
              display: inline-flex; align-items: center; gap: 8px;
              height: 38px; padding: 0 18px; border-radius: 10px;
              font-size: 13px; font-weight: 700; color: #fff;
              background: linear-gradient(135deg, #10b981, #059669);
              border: none; cursor: pointer;
              box-shadow: 0 6px 14px rgba(16,185,129,0.3);
            }
            .lp-btn-primary:hover { transform: translateY(-1px); }
            @keyframes lpFade { from { opacity: 0; } to { opacity: 1; } }
            @keyframes lpSlide { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
        </div>
      )}

      {/* ============================================================
          Step instructions overlay (top-center, dismissible)
          ============================================================ */}
      {started && !finished && currentStep && showInstructions && (currentStep.instructions?.trim() || currentStep.title) && (
        <div className="lp-instructions-overlay" role="status" aria-live="polite">
          <div className="lp-instructions-card">
            <div className="lp-instructions-header">
              <div className="lp-instructions-step-badge">Step {currentIndex + 1} of {totalSteps}</div>
              <button
                onClick={() => setShowInstructions(false)}
                className="lp-instructions-close"
                aria-label="Hide instructions"
                title="Hide"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {currentStep.title && (
              <h4 className="lp-instructions-title">{currentStep.title}</h4>
            )}
            {currentStep.instructions?.trim() && (
              <p className="lp-instructions-text">{currentStep.instructions}</p>
            )}
            {typeof currentStep.duration === 'number' && (
              <div className="lp-instructions-duration">~ {currentStep.duration} min</div>
            )}
          </div>
          <style jsx>{`
            .lp-instructions-overlay {
              position: fixed; top: 70px; left: 50%; transform: translateX(-50%);
              z-index: 10000; width: calc(100% - 32px); max-width: 560px;
              animation: lpFade 200ms ease;
            }
            .lp-instructions-card {
              background: #fff; border-radius: 12px; padding: 14px 18px;
              box-shadow: 0 12px 32px -8px rgba(0,0,0,0.18);
              border: 1px solid #e2e8f0;
            }
            .lp-instructions-header {
              display: flex; align-items: center; justify-content: space-between;
              margin-bottom: 6px;
            }
            .lp-instructions-step-badge {
              font-size: 10px; font-weight: 700; text-transform: uppercase;
              letter-spacing: 0.06em; color: #10b981;
              background: #ecfdf5; padding: 3px 8px; border-radius: 999px;
            }
            .lp-instructions-close {
              width: 22px; height: 22px; border-radius: 5px;
              display: inline-flex; align-items: center; justify-content: center;
              border: none; background: transparent; color: #94a3b8; cursor: pointer;
            }
            .lp-instructions-close:hover { background: #f1f5f9; color: #0f172a; }
            .lp-instructions-title {
              font-size: 15px; font-weight: 700; color: #0f172a;
              margin: 0 0 6px;
            }
            .lp-instructions-text {
              font-size: 13px; color: #475569; line-height: 1.55; margin: 0;
              white-space: pre-wrap;
            }
            .lp-instructions-duration {
              margin-top: 8px; font-size: 11px; color: #94a3b8;
            }
          `}</style>
        </div>
      )}

      {/* ============================================================
          "Lesson Complete!" banner (replaces the player bar)
          ============================================================ */}
      {started && finished && (
        <div className="lp-complete-overlay" role="dialog" aria-modal="true" aria-label="Lesson complete">
          <div className="lp-complete-card">
            <div className="lp-complete-icon">
              <Check className="w-7 h-7 text-white" />
            </div>
            <h3 className="lp-complete-title">Lesson Complete! 🎉</h3>
            <p className="lp-complete-subtitle">
              You walked through all {totalSteps} step{totalSteps !== 1 ? 's' : ''} of &ldquo;{lesson.title}&rdquo;.
            </p>

            <label className="lp-complete-notes-label">
              <StickyNote className="w-3.5 h-3.5 inline mr-1" />
              Session notes (optional)
            </label>
            <textarea
              value={lessonNotes}
              onChange={(e) => setLessonNotes(e.target.value)}
              placeholder="What worked? What to follow up on next time? Anything to remember?"
              className="lp-complete-notes"
              rows={4}
              maxLength={2000}
            />

            <div className="lp-complete-actions">
              <button onClick={handleRestart} className="lp-btn-ghost">
                <RotateCcw className="w-3.5 h-3.5" /> Restart
              </button>
              <button onClick={onClose} className="lp-btn-primary">
                <Check className="w-4 h-4" /> Done
              </button>
            </div>
          </div>
          <style jsx>{`
            .lp-complete-overlay {
              position: fixed; inset: 0; z-index: 10001;
              background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
              display: flex; align-items: center; justify-content: center;
              padding: 16px; animation: lpFade 150ms ease;
            }
            .lp-complete-card {
              background: #fff; border-radius: 18px;
              padding: 32px 28px; max-width: 460px; width: 100%;
              text-align: center;
              box-shadow: 0 24px 48px -12px rgba(0,0,0,0.22);
              animation: lpSlide 220ms ease;
            }
            .lp-complete-icon {
              width: 64px; height: 64px; border-radius: 18px; margin: 0 auto 16px;
              background: linear-gradient(135deg, #10b981, #059669);
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 12px 28px rgba(16,185,129,0.3);
            }
            .lp-complete-title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
            .lp-complete-subtitle { font-size: 13px; color: #64748b; margin: 0 0 20px; line-height: 1.5; }
            .lp-complete-notes-label {
              display: block; font-size: 11px; font-weight: 600;
              color: #475569; text-align: left; margin-bottom: 6px;
              text-transform: uppercase; letter-spacing: 0.04em;
            }
            .lp-complete-notes {
              width: 100%; padding: 10px 12px; border-radius: 10px;
              border: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;
              font-family: inherit; resize: vertical; outline: none;
              margin-bottom: 20px;
            }
            .lp-complete-notes:focus {
              border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12);
            }
            .lp-complete-actions {
              display: flex; gap: 10px; justify-content: center;
            }
          `}</style>
        </div>
      )}

      {/* ============================================================
          Floating bottom player bar
          ============================================================ */}
      {started && !finished && currentStep && (
        <div className="lp-bar" role="region" aria-label="Lesson player">
          {/* Progress bar (top edge) */}
          <div className="lp-progress-track">
            <div className="lp-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>

          <div className="lp-bar-inner">
            {/* Left: step info */}
            <div className="lp-bar-left">
              <div className="lp-bar-lesson-title" title={lesson.title}>{lesson.title}</div>
              <div className="lp-bar-step-info">
                <span className="lp-bar-step-num">Step {currentIndex + 1} of {totalSteps}</span>
                {currentStep.title && (
                  <>
                    <span className="lp-bar-sep">·</span>
                    <span className="lp-bar-step-title" title={currentStep.title}>{currentStep.title}</span>
                  </>
                )}
              </div>
            </div>

            {/* Center: nav */}
            <div className="lp-bar-center">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="lp-nav-btn"
                aria-label="Previous step"
                title="Previous (←)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowInstructions((v) => !v)}
                className="lp-icon-btn"
                aria-label={showInstructions ? 'Hide instructions' : 'Show instructions'}
                title={showInstructions ? 'Hide instructions' : 'Show instructions'}
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="lp-nav-btn lp-nav-btn-primary"
                aria-label={currentIndex === totalSteps - 1 ? 'Finish lesson' : 'Next step'}
                title={currentIndex === totalSteps - 1 ? 'Finish (→)' : 'Next (→)'}
              >
                {currentIndex === totalSteps - 1 ? (
                  <><Check className="w-4 h-4" /> Finish</>
                ) : (
                  <><ChevronRight className="w-4 h-4" /> Next</>
                )}
              </button>
            </div>

            {/* Right: options */}
            <div className="lp-bar-right">
              <label className="lp-toggle" title="When off, the canvas clears between steps. When on, widgets accumulate.">
                <input
                  type="checkbox"
                  checked={keepPrevious}
                  onChange={(e) => setKeepPrevious(e.target.checked)}
                />
                <Layers className="w-3.5 h-3.5" />
                <span>Keep widgets</span>
              </label>
              <button
                onClick={handleRestart}
                className="lp-icon-btn"
                aria-label="Restart lesson"
                title="Restart"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="lp-icon-btn lp-icon-btn-danger"
                aria-label="Close player"
                title="Close player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <style jsx>{`
            .lp-bar {
              position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
              z-index: 10000;
              width: calc(100% - 32px); max-width: 880px;
              background: #fff; border-radius: 14px;
              box-shadow: 0 16px 40px -8px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04);
              overflow: hidden;
              animation: lpBarIn 220ms ease;
            }
            @keyframes lpBarIn { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }
            .lp-progress-track {
              height: 3px; background: #f1f5f9; width: 100%;
            }
            .lp-progress-fill {
              height: 100%; background: linear-gradient(90deg, #10b981, #059669);
              transition: width 250ms ease;
            }
            .lp-bar-inner {
              display: flex; align-items: center; justify-content: space-between;
              padding: 10px 14px; gap: 12px;
            }
            .lp-bar-left { flex: 1; min-width: 0; }
            .lp-bar-lesson-title {
              font-size: 12px; font-weight: 700; color: #0f172a;
              overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
            }
            .lp-bar-step-info {
              display: flex; align-items: center; gap: 6px; margin-top: 2px;
              font-size: 11px; color: #94a3b8;
            }
            .lp-bar-step-num { font-weight: 600; color: #10b981; }
            .lp-bar-sep { color: #cbd5e1; }
            .lp-bar-step-title {
              overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;
            }

            .lp-bar-center { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
            .lp-nav-btn {
              height: 34px; min-width: 34px; padding: 0 8px;
              border-radius: 8px; border: 1px solid #e2e8f0;
              background: #fff; color: #475569; cursor: pointer;
              display: inline-flex; align-items: center; justify-content: center; gap: 4px;
              font-size: 12px; font-weight: 600;
              transition: all 120ms;
            }
            .lp-nav-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
            .lp-nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
            .lp-nav-btn-primary {
              background: linear-gradient(135deg, #10b981, #059669);
              color: #fff; border-color: transparent;
              padding: 0 14px;
              box-shadow: 0 4px 10px rgba(16,185,129,0.25);
            }
            .lp-nav-btn-primary:hover:not(:disabled) {
              transform: translateY(-1px);
              box-shadow: 0 6px 14px rgba(16,185,129,0.35);
              background: linear-gradient(135deg, #10b981, #059669);
            }
            .lp-icon-btn {
              width: 32px; height: 32px; border-radius: 7px;
              border: 1px solid #e2e8f0; background: #fff; color: #64748b;
              cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
              transition: all 120ms;
            }
            .lp-icon-btn:hover { background: #f8fafc; color: #0f172a; }
            .lp-icon-btn-danger:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }

            .lp-bar-right {
              display: flex; align-items: center; gap: 8px; flex-shrink: 0;
            }
            .lp-toggle {
              display: inline-flex; align-items: center; gap: 5px;
              font-size: 11px; font-weight: 600; color: #475569;
              cursor: pointer; user-select: none;
              padding: 6px 9px; border-radius: 7px; border: 1px solid #e2e8f0;
              background: #fff;
              transition: background 120ms;
            }
            .lp-toggle:hover { background: #f8fafc; }
            .lp-toggle input { margin: 0; cursor: pointer; }

            @media (max-width: 640px) {
              .lp-bar-left { display: none; }
              .lp-bar-inner { justify-content: center; }
              .lp-toggle span { display: none; }
            }
          `}</style>
        </div>
      )}
    </>
  )
}
