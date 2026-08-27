// ============================================================
// AnswerKeyModal — Private Answer Key Popup (TUTOR ONLY)
// ============================================================
// Dialog that shows the answer key for a generated quiz or worksheet.
// SECURITY: Server-side verification via /api/ai/answer-key endpoint.
// The modal calls the server to verify tutor status before displaying answers.
// Shows question number, correct answer, and explanation.
// ============================================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  BookOpen,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuizAnswer } from '@/types';

// ---- Types ----

interface AnswerKeyModalProps {
  /** Controls whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onOpenChange: (open: boolean) => void;
  /** Title of the quiz/worksheet this key is for */
  title?: string;
  /** Array of answer entries */
  answers: QuizAnswer[];
}

// ============================================================
// Component
// ============================================================

export default function AnswerKeyModal({
  open,
  onOpenChange,
  title = 'Quiz',
  answers,
}: AnswerKeyModalProps) {
  const isTutor = useAppStore((s) => s.room.isTutor);
  const [copied, setCopied] = React.useState(false);
  const [showAllExplanations, setShowAllExplanations] = React.useState(true);

  // ---- Server-side tutor verification before displaying answers ----
  const [serverVerified, setServerVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (open && isTutor) {
      // Verify tutor status server-side before showing answer keys
      setVerifying(true);
      setServerVerified(false);
      const roomId = useAppStore.getState().room.roomId;
      if (!roomId) {
        setVerifying(false);
        return;
      }
      fetch('/api/ai/answer-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      })
        .then((res) => {
          if (res.ok) {
            setServerVerified(true);
          } else {
            setServerVerified(false);
          }
        })
        .catch(() => setServerVerified(false))
        .finally(() => setVerifying(false));
    } else if (!open) {
      setServerVerified(false);
    }
  }, [open, isTutor]);

  // ---- Copy all answers to clipboard ---- (hook must be before conditional return)
  const handleCopyAll = React.useCallback(async () => {
    const text = answers
      .map(
        (a, idx) =>
          `Q${idx + 1}: ${a.correctAnswer}${a.explanation ? ` — ${a.explanation}` : ''}`
      )
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy to clipboard');
    }
  }, [answers]);

  // ---- Security gate: students cannot see ----
  // Client-side check (convenience) + server-side verification required
  if (!isTutor) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh]">
        {verifying ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-muted-foreground">Verifying tutor access...</span>
          </div>
        ) : !serverVerified ? (
          <div className="flex items-center justify-center py-12 text-center">
            <ShieldCheck className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-sm text-muted-foreground">Unable to verify tutor access. Answer keys are hidden for security.</p>
          </div>
        ) : (<>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Answer Key
            </DialogTitle>
            {/* TUTOR ONLY badge — highly visible */}
            <Badge variant="destructive" className="animate-pulse font-bold tracking-wide">
              <ShieldCheck className="w-3 h-3 mr-1" />
              TUTOR ONLY
            </Badge>
          </div>
          <DialogDescription className="flex items-center gap-2">
            <EyeOff className="w-3.5 h-3.5" />
            This answer key is only visible to tutors. Students cannot access this view.
            <br />
            <span className="text-xs">{title} — {answers.length} question{answers.length !== 1 ? 's' : ''}</span>
          </DialogDescription>
        </DialogHeader>

        {/* ---- Toggle explanations ---- */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setShowAllExplanations(!showAllExplanations)}
          >
            {showAllExplanations ? (
              <>
                <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                Hide Explanations
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 mr-1.5" />
                Show Explanations
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={handleCopyAll}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copy All
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* ---- Answer list ---- */}
        <ScrollArea className="max-h-[50vh] pr-2">
          <div className="space-y-3">
            {answers.map((answer, idx) => (
              <div
                key={answer.questionId}
                className={cn(
                  'rounded-lg border p-3 transition-colors',
                  'bg-muted/20 hover:bg-muted/40'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Question number badge */}
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Correct answer */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                        Answer:
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {answer.correctAnswer}
                      </span>
                    </div>

                    {/* Explanation (collapsible) */}
                    {answer.explanation && showAllExplanations && (
                      <div className="mt-1.5 ml-0 flex items-start gap-1.5">
                        <Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {answer.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {answers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No answers available yet. Generate a quiz or worksheet first.
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Tutor-only view — verified server-side
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
        </>) }
      </DialogContent>
    </Dialog>
  );
}
