// ============================================================
// QuizGenerator — Interactive Quiz Generator
// ============================================================
// Allows tutors to generate quizzes from a topic/context.
// Shows loading spinner while processing (optimistic UI).
// On success, the quiz data is emitted for rendering as sticky notes.
// ============================================================

'use client';

import React, { useState, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, HelpCircle, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuizData, QuizQuestion } from '@/types';

// ---- Constants ----

const GRADE_OPTIONS = [
  { value: 'K', label: 'Kindergarten' },
  { value: '1', label: '1st Grade' },
  { value: '2', label: '2nd Grade' },
  { value: '3', label: '3rd Grade' },
  { value: '4', label: '4th Grade' },
  { value: '5', label: '5th Grade' },
  { value: '6', label: '6th Grade' },
  { value: '7', label: '7th Grade' },
  { value: '8', label: '8th Grade' },
  { value: '9', label: '9th Grade' },
  { value: '10', label: '10th Grade' },
  { value: '11', label: '11th Grade' },
  { value: '12', label: '12th Grade' },
];

const QUESTION_COUNT_OPTIONS = [
  { value: '3', label: '3 Questions' },
  { value: '5', label: '5 Questions' },
  { value: '8', label: '8 Questions' },
  { value: '10', label: '10 Questions' },
  { value: '15', label: '15 Questions' },
  { value: '20', label: '20 Questions' },
];

// ============================================================
// Component
// ============================================================

export default function QuizGenerator() {
  const subject = useAppStore((s) => s.room.subject);
  const userId = useAppStore((s) => s.room.userId);
  const isTutor = useAppStore((s) => s.room.isTutor);

  // ---- Form state ----
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('');
  const [questionCount, setQuestionCount] = useState('5');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizData | null>(null);

  // ---- Generate handler ----
  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setError('Please enter a quiz topic.');
      return;
    }
    if (!grade) {
      setError('Please select a grade level.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setGeneratedQuiz(null);

    try {
      const { authFetch } = await import('@/lib/auth-fetch');
      const res = await authFetch('/api/ai/action', {
        method: 'POST',
        body: JSON.stringify({
          action: 'QUIZ',
          userId,
          prompt: `Generate a quiz about ${topic.trim()} for grade ${grade}. Include ${questionCount} questions for subject ${subject}.`,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      const data: QuizData = await res.json();
      setGeneratedQuiz(data);

      // TODO: Dispatch quiz data to tldraw canvas as sticky notes
      // Example: for each question, create a sticky note at a grid position
      // on the current page.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz.');
    } finally {
      setIsLoading(false);
    }
  }, [topic, grade, questionCount, subject]);

  // ---- Reset handler ----
  const handleReset = useCallback(() => {
    setTopic('');
    setGrade('');
    setQuestionCount('5');
    setError(null);
    setGeneratedQuiz(null);
  }, []);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          Quiz Generator
        </CardTitle>
        <CardDescription>
          Generate an interactive quiz. Questions will appear as sticky notes on the
          whiteboard for the current subject ({subject}).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Topic input */}
        <div className="space-y-2">
          <Label htmlFor="quiz-topic">Quiz Topic / Context</Label>
          <Input
            id="quiz-topic"
            placeholder="e.g., Fractions, Photosynthesis, World War II..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Grade level */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Grade Level</Label>
            <Select value={grade} onValueChange={setGrade} disabled={isLoading}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {GRADE_OPTIONS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Question count */}
          <div className="space-y-2">
            <Label>Number of Questions</Label>
            <Select
              value={questionCount}
              onValueChange={setQuestionCount}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_COUNT_OPTIONS.map((q) => (
                  <SelectItem key={q.value} value={q.value}>
                    {q.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Loading state — optimistic UI (greyed out) */}
        {isLoading && (
          <div className="rounded-lg border bg-muted/30 p-6 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Generating quiz questions...
            </p>
            <p className="text-xs text-muted-foreground/70">
              This may take a few seconds
            </p>
          </div>
        )}

        {/* Generated quiz preview */}
        {generatedQuiz && !isLoading && (
          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <StickyNote className="w-4 h-4 text-primary" />
              Quiz Generated — {generatedQuiz.publicQuestions.length} Questions
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {generatedQuiz.publicQuestions.map((q: QuizQuestion, idx: number) => (
                <div
                  key={q.id}
                  className="rounded-md bg-background border px-3 py-2 text-sm"
                >
                  <span className="font-medium text-muted-foreground mr-1.5">
                    Q{idx + 1}.
                  </span>
                  {q.text}
                  {q.options && (
                    <div className="mt-1.5 ml-5 text-xs text-muted-foreground space-y-0.5">
                      {q.options.map((opt, optIdx) => (
                        <p key={optIdx}>
                          {String.fromCharCode(65 + optIdx)}) {opt}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              ✓ Questions will be placed as sticky notes on the whiteboard.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between gap-2">
        <Button variant="outline" onClick={handleReset} disabled={isLoading}>
          Reset
        </Button>
        <Button onClick={handleGenerate} disabled={isLoading || !topic.trim() || !grade}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Quiz
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
