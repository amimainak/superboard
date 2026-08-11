// ============================================================
// OnboardingWizard — Multi-step first-time tutor onboarding
// ============================================================
// Shown to tutors who have no rooms yet. Guides them through
// setting up their profile, choosing a subject, and creating
// their first lesson room.
// ============================================================
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { subjectMeta } from '@/lib/subject-meta';
import type { Subject } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
  ArrowRight,
  Plus,
  Loader2,
  User,
} from 'lucide-react';

// ----------------------------------------------------------------
// Props
// ----------------------------------------------------------------
export interface OnboardingWizardProps {
  userId: string;
  userEmail: string;
  userName: string | null;
  onComplete: (roomId: string) => void;
  onSkip: () => void;
}

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------

/** Avatar color options — 6 distinct hues */
const AVATAR_COLORS = [
  { name: 'Emerald', value: '#10b981', ring: 'ring-emerald-500' },
  { name: 'Teal', value: '#14b8a6', ring: 'ring-teal-500' },
  { name: 'Cyan', value: '#06b6d4', ring: 'ring-cyan-500' },
  { name: 'Sky', value: '#0ea5e9', ring: 'ring-sky-500' },
  { name: 'Violet', value: '#8b5cf6', ring: 'ring-violet-500' },
  { name: 'Rose', value: '#f43f5e', ring: 'ring-rose-500' },
] as const;

/** Subject-specific tool descriptions for Step 2 */
const SUBJECT_TOOLS: Record<Subject, string[]> = {
  MATH: [
    'GeoGebra interactive graphs',
    'Handwriting-to-math conversion',
    'Auto shape perfecting',
    'AI quiz & worksheet generators',
  ],
  SCIENCE: [
    'Chemical equation balancer',
    'Lab report summarizer',
    'Diagram generator',
    'AI quiz & worksheet generators',
  ],
  LANGUAGE: [
    'Grammar checker & corrector',
    'Vocabulary quiz generator',
    'Phonics helper',
    'Timeline generator',
  ],
  GENERAL: [
    'Free-form whiteboard',
    'AI concept summarizer',
    'Quiz & worksheet generators',
    'Outline creator',
  ],
  MUSIC: [
    'AI quiz & worksheet generators',
    'Concept summarizer',
    'Free-form whiteboard',
    'Lesson plan creator',
  ],
  CODING: [
    'AI quiz & worksheet generators',
    'Concept summarizer',
    'Step-by-step solver',
    'Free-form whiteboard',
  ],
  TEST_PREP: [
    'AI quiz & worksheet generators',
    'Flashcard generator',
    'Formative assessments',
    'Rubric generator',
  ],
  ART: [
    'Diagram generator',
    'AI concept summarizer',
    'Free-form whiteboard',
    'Lesson plan creator',
  ],
  ESL: [
    'Phonics helper',
    'Vocabulary quiz generator',
    'Grammar checker',
    'AI flashcard generator',
  ],
};

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export default function OnboardingWizard({
  userId,
  userEmail,
  userName,
  onComplete,
  onSkip,
}: OnboardingWizardProps) {
  // ---- Wizard state ----
  const [step, setStep] = useState(0); // 0-indexed: 0, 1, 2
  const [isAnimating, setIsAnimating] = useState(false);
  const [animDirection, setAnimDirection] = useState<'forward' | 'back'>('forward');

  // ---- Step 1 state ----
  const [displayName, setDisplayName] = useState(userName ?? '');
  const [selectedColor, setSelectedColor] = useState<string>(AVATAR_COLORS[0].value);

  // ---- Step 2 state ----
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // ---- Async state ----
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for managing animation transitions
  const contentRef = useRef<HTMLDivElement>(null);

  // Pre-fill display name from userName prop when it arrives
  useEffect(() => {
    if (userName && !displayName) {
      setDisplayName(userName);
    }
  }, [userName, displayName]);

  // ---- Navigation helpers ----

  /** Advance to the next step with animation */
  const goNext = useCallback(() => {
    if (isAnimating || step >= 2) return;
    setAnimDirection('forward');
    setIsAnimating(true);
    // Short delay so the CSS transition fires
    setTimeout(() => {
      setStep((s) => s + 1);
      setIsAnimating(false);
    }, 200);
  }, [isAnimating, step]);

  /** Go back to the previous step with animation */
  const goBack = useCallback(() => {
    if (isAnimating || step <= 0) return;
    setAnimDirection('back');
    setIsAnimating(true);
    setTimeout(() => {
      setStep((s) => s - 1);
      setIsAnimating(false);
    }, 200);
  }, [isAnimating, step]);

  // ---- Validation ----

  const isStep1Valid = displayName.trim().length >= 2;
  const isStep2Valid = selectedSubject !== null;

  // ---- Submit handler ----

  const handleCreateLesson = useCallback(async () => {
    if (!selectedSubject || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Save display name via profile endpoint
      if (displayName.trim()) {
        await authFetch('/api/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify({ name: displayName.trim() }),
        });
      }

      // 2. Create the first room
      const res = await authFetch('/api/room', {
        method: 'POST',
        body: JSON.stringify({
          tutorId: userId,
          subject: selectedSubject,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Failed to create room (${res.status})`);
      }

      const room = (await res.json()) as { id: string };
      onComplete(room.id);
    } catch (err: any) {
      console.error('[OnboardingWizard] Error creating lesson:', err);
      setError(err.message ?? 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  }, [displayName, selectedSubject, userId, isSubmitting, onComplete]);

  // ---- Step transition animation classes ----

  const getTransitionClasses = () => {
    if (isAnimating) {
      return animDirection === 'forward'
        ? 'translate-x-8 opacity-0'
        : '-translate-x-8 opacity-0';
    }
    return 'translate-x-0 opacity-100';
  };

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-white via-teal-50/30 to-emerald-50/40 overflow-y-auto">
      {/* Max-width centered container */}
      <div className="w-full max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* ---- Logo / Branding ---- */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            SuperBoard
          </span>
        </div>

        {/* ---- Progress Indicator (3 dots) ---- */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={
                `h-2.5 rounded-full transition-all duration-300 ${
                  i < step
                    ? 'w-8 bg-emerald-500'
                    : i === step
                      ? 'w-8 bg-emerald-500'
                      : 'w-2.5 bg-gray-200'
                }`
              }
              aria-label={`Step ${i + 1} ${i < step ? '(completed)' : i === step ? '(current)' : '(upcoming)'}`}
            />
          ))}
        </div>

        {/* ---- Step Content (animated) ---- */}
        <div
          ref={contentRef}
          className={`transition-all duration-200 ease-in-out ${getTransitionClasses()}`}
        >
          {/* ============================================================ */}
          {/* STEP 1: Welcome & Profile                                   */}
          {/* ============================================================ */}
          {step === 0 && (
            <Card className="border-0 shadow-lg shadow-emerald-900/5">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl text-gray-900">
                  Welcome to SuperBoard! 🎉
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Let&apos;s set up your tutor profile to get started.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium text-gray-700">
                    Display Name
                  </Label>
                  <Input
                    id="displayName"
                    placeholder="e.g. Ms. Johnson"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-11 text-base"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400">
                    This is how your students will see you.
                  </p>
                </div>

                {/* Avatar Color Picker */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Pick Your Color
                  </Label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {AVATAR_COLORS.map((color) => {
                      const isSelected = selectedColor === color.value;
                      return (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setSelectedColor(color.value)}
                          className={
                            `relative h-10 w-10 rounded-full transition-all duration-150 ${
                              isSelected
                                ? `ring-2 ${color.ring} ring-offset-2 scale-110`
                                : 'hover:scale-105'
                            }`
                          }
                          style={{ backgroundColor: color.value }}
                          aria-label={`Select ${color.name} color`}
                          aria-pressed={isSelected}
                        >
                          {isSelected && (
                            <Check
                              className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-sm"
                              strokeWidth={3}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Avatar Preview */}
                <div className="flex items-center justify-center pt-2">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full text-white text-xl font-bold shadow-md"
                    style={{ backgroundColor: selectedColor }}
                  >
                    {displayName.trim()
                      ? displayName.trim().charAt(0).toUpperCase()
                      : <User className="h-7 w-7" />}
                  </div>
                </div>

                {/* Error for step 1 */}
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* ============================================================ */}
          {/* STEP 2: Choose Your Subject                                */}
          {/* ============================================================ */}
          {step === 1 && (
            <Card className="border-0 shadow-lg shadow-emerald-900/5">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl text-gray-900">
                  Choose Your Subject
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Select the primary subject you&apos;ll be teaching.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Subject Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(subjectMeta) as Subject[]).map((subject) => {
                    const meta = subjectMeta[subject];
                    const Icon = meta.icon;
                    const isSelected = selectedSubject === subject;
                    const tools = SUBJECT_TOOLS[subject];

                    return (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => setSelectedSubject(subject)}
                        className={
                          `group relative text-left rounded-xl border-2 p-4 transition-all duration-150 ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/60 shadow-md shadow-emerald-900/5'
                              : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                          }`
                        }
                      >
                        {/* Selected checkmark badge */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </div>
                        )}

                        {/* Icon + Label */}
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={
                              `flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                isSelected
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-100 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                              }`
                            }
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="font-semibold text-gray-900">
                            {meta.label}
                          </span>
                        </div>

                        {/* Tools list */}
                        <ul className="space-y-1">
                          {tools.map((tool) => (
                            <li
                              key={tool}
                              className="text-xs text-gray-500 flex items-center gap-1.5"
                            >
                              <span className={
                                `h-1 w-1 rounded-full shrink-0 ${
                                  isSelected ? 'bg-emerald-500' : 'bg-gray-300'
                                }`
                              } />
                              {tool}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>

                {error && (
                  <p className="text-sm text-red-500 text-center pt-1">{error}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* ============================================================ */}
          {/* STEP 3: Confirmation & Create First Lesson                */}
          {/* ============================================================ */}
          {step === 2 && (
            <Card className="border-0 shadow-lg shadow-emerald-900/5">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl text-gray-900">
                  You&apos;re All Set! 🚀
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Here&apos;s a summary of your profile.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Summary Card */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-5 space-y-4">
                  {/* Profile row */}
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white text-lg font-bold shadow-sm"
                      style={{ backgroundColor: selectedColor }}
                    >
                      {displayName.trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {displayName.trim()}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {userEmail}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-200" />

                  {/* Subject row */}
                  {selectedSubject && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
                        {React.createElement(subjectMeta[selectedSubject].icon, {
                          className: 'h-5 w-5',
                        })}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Subject</p>
                        <p className="font-medium text-gray-900">
                          {subjectMeta[selectedSubject].label}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={handleCreateLesson}
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/10 transition-all hover:shadow-lg hover:shadow-emerald-900/15"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating your lesson&hellip;
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5" />
                      Create Your First Lesson
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* Error message */}
                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                {/* Skip link */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={onSkip}
                    disabled={isSubmitting}
                    className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Skip for now, go to dashboard
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ---- Navigation Buttons ---- */}
        <div className="flex items-center justify-between mt-6 px-1">
          {/* Back button (hidden on first step) */}
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={step === 0 || isAnimating || isSubmitting}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {/* Step label */}
          <span className="text-sm text-gray-400 font-medium">
            {step + 1} of 3
          </span>

          {/* Next button (changes label on last step) */}
          {step < 2 ? (
            <Button
              onClick={goNext}
              disabled={
                (step === 0 && !isStep1Valid) ||
                (step === 1 && !isStep2Valid) ||
                isAnimating ||
                isSubmitting
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            /* Spacer to keep layout balanced on step 3 */
            <div className="w-[80px]" />
          )}
        </div>

        {/* ---- Global Skip (visible on steps 0 & 1) ---- */}
        {step < 2 && (
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={onSkip}
              disabled={isSubmitting}
              className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              Skip setup, go to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
