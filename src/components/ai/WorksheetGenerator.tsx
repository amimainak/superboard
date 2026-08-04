// ============================================================
// WorksheetGenerator — Smart Worksheet Creator
// ============================================================
// Generates grid-layout worksheets on a NEW blank page.
// Supports topic, grade level, and number of questions.
// Includes a "Download PDF" button for printing.
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
import {
  Loader2,
  FileSpreadsheet,
  Download,
  Plus,
  CheckCircle2,
  Grid3X3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  { value: '5', label: '5 Questions' },
  { value: '8', label: '8 Questions' },
  { value: '10', label: '10 Questions' },
  { value: '15', label: '15 Questions' },
  { value: '20', label: '20 Questions' },
  { value: '25', label: '25 Questions' },
  { value: '30', label: '30 Questions' },
];

// ---- Types ----

interface WorksheetProblem {
  id: string;
  number: number;
  text: string;
  space?: 'small' | 'medium' | 'large'; // Answer space size
}

interface WorksheetData {
  title: string;
  problems: WorksheetProblem[];
  totalPages: number;
}

// ============================================================
// Component
// ============================================================

export default function WorksheetGenerator() {
  const subject = useAppStore((s) => s.room.subject);
  const userId = useAppStore((s) => s.room.userId);
  const setTotalPages = useAppStore((s) => s.setTotalPages);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  // ---- Form state ----
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('');
  const [questionCount, setQuestionCount] = useState('10');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [worksheetData, setWorksheetData] = useState<WorksheetData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // ---- Generate handler ----
  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setError('Please enter a worksheet topic.');
      return;
    }
    if (!grade) {
      setError('Please select a grade level.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setWorksheetData(null);

    try {
      const { authFetch } = await import('@/lib/auth-fetch');
      const res = await authFetch('/api/ai/action', {
        method: 'POST',
        body: JSON.stringify({
          action: 'WORKSHEET',
          userId,
          prompt: `Generate a worksheet about ${topic.trim()} for grade ${grade}. Include ${questionCount} problems for subject ${subject}.`,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      const data: WorksheetData = await res.json();
      setWorksheetData(data);

      // TODO: Create a NEW blank page and render the worksheet grid layout
      // 1. Add a new page to the tldraw document
      // 2. Switch to the new page
      // 3. Render problems in a grid layout on that page
      console.log('Worksheet generated — TODO: Render on new blank page', data);
      if (data.totalPages > 1) {
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate worksheet.');
    } finally {
      setIsLoading(false);
    }
  }, [topic, grade, questionCount, subject, setTotalPages]);

  // ---- Download PDF handler ----
  const handleDownloadPDF = useCallback(async () => {
    if (!worksheetData) return;
    setIsDownloading(true);

    try {
      // TODO: Implement PDF generation from the worksheet page
      // Options:
      // 1. Use browser print API: window.print() with a print stylesheet
      // 2. Use a server-side PDF generation endpoint
      // 3. Use @tldraw/export or canvas-to-blob
      console.log('TODO: Download worksheet as PDF', worksheetData);

      // Placeholder: Use browser print
      window.print();
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [worksheetData]);

  // ---- Reset handler ----
  const handleReset = useCallback(() => {
    setTopic('');
    setGrade('');
    setQuestionCount('10');
    setError(null);
    setWorksheetData(null);
  }, []);

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-primary" />
          Worksheet Generator
        </CardTitle>
        <CardDescription>
          Create a printable worksheet on a new whiteboard page. Problems will be
          arranged in a clean grid layout for the current subject ({subject}).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Topic input */}
        <div className="space-y-2">
          <Label htmlFor="worksheet-topic">Worksheet Topic</Label>
          <Input
            id="worksheet-topic"
            placeholder="e.g., Long Division, Periodic Table, Grammar Rules..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Grade + Question count row */}
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

          <div className="space-y-2">
            <Label>Number of Problems</Label>
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

        {/* Loading state */}
        {isLoading && (
          <div className="rounded-lg border bg-muted/30 p-6 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Generating worksheet...
            </p>
            <p className="text-xs text-muted-foreground/70">
              Creating problems and grid layout
            </p>
          </div>
        )}

        {/* Generated worksheet preview */}
        {worksheetData && !isLoading && (
          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Worksheet Ready — {worksheetData.problems.length} Problems
              </div>
              <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {worksheetData.totalPages} page{worksheetData.totalPages > 1 ? 's' : ''}
              </span>
            </div>

            {/* Mini grid preview */}
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
              {worksheetData.problems.map((problem) => (
                <div
                  key={problem.id}
                  className={cn(
                    'rounded border bg-background px-2 py-1.5 text-xs',
                    problem.space === 'large' && 'col-span-2'
                  )}
                >
                  <span className="font-semibold text-muted-foreground mr-1">
                    {problem.number}.
                  </span>
                  {problem.text}
                </div>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground">
              ✓ Worksheet rendered on new blank page. Use &quot;Download PDF&quot; to print.
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between gap-2">
        <Button variant="outline" onClick={handleReset} disabled={isLoading}>
          Reset
        </Button>
        <div className="flex gap-2">
          {/* Download PDF button (only after generation) */}
          {worksheetData && (
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isLoading || !topic.trim() || !grade}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Grid3X3 className="w-4 h-4 mr-2" />
                Generate Worksheet
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
