// ============================================================
// QuestionBankPanel — Browse and add questions to canvas
// ============================================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Eye,
  EyeOff,
  Loader2,
  GraduationCap,
  FlaskConical,
  Languages,
  Target,
} from 'lucide-react';

interface QuestionItem {
  id: string;
  subject: string;
  gradeBand: string;
  topic: string;
  difficulty: number;
  curriculum?: string | null;
  standardCode?: string | null;
  stem: string;
  answerKey: string;
  questionType: string;
  tags?: string | null;
  estimatedTimeSec?: number | null;
  testPrepCategory?: { id: string; name: string; testType: string } | null;
}

interface QuestionBankPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCanvas?: (text: string) => void;
  isTutor: boolean;
}

const SUBJECT_FILTERS = [
  { id: 'ALL', label: 'All', icon: BookOpen },
  { id: 'MATH', label: 'Math', icon: GraduationCap },
  { id: 'SCIENCE', label: 'Science', icon: FlaskConical },
  { id: 'LANGUAGE', label: 'Language', icon: Languages },
  { id: 'GENERAL', label: 'Social Studies', icon: Target },
  { id: 'ESL', label: 'ESL', icon: Languages },
  { id: 'TEST_PREP', label: 'Test Prep', icon: Target },
];

const GRADE_BANDS = ['K-2', '3-5', '6-8', '9-12'];
const DIFFICULTY_LABELS = ['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Advanced'];
const DIFFICULTY_COLORS = ['', 'bg-emerald-100 text-emerald-800', 'bg-blue-100 text-blue-800', 'bg-amber-100 text-amber-800', 'bg-red-100 text-red-800', 'bg-purple-100 text-purple-800'];

export default function QuestionBankPanel({ open, onOpenChange, onAddToCanvas, isTutor }: QuestionBankPanelProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('offset', String(page * limit));
      if (search) params.set('search', search);
      if (subjectFilter !== 'ALL') params.set('subject', subjectFilter);
      if (gradeFilter) params.set('gradeBand', gradeFilter);

      const res = await fetch(`/api/questions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('[QuestionBank] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, subjectFilter, gradeFilter, page]);

  useEffect(() => {
    if (open) {
      setPage(0);
      fetchQuestions();
    }
  }, [open, fetchQuestions]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [search, subjectFilter, gradeFilter]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[480px] p-0 flex flex-col">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-4 h-4" />
            Question Bank
          </SheetTitle>
          <SheetDescription className="text-xs">
            Browse {total.toLocaleString()} questions across subjects and grade levels.
            {total > 0 && ` Showing ${page * limit + 1}–${Math.min((page + 1) * limit, total)} of ${total}`}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-2 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>

          {/* Subject Filters */}
          <div className="flex flex-wrap gap-1">
            {SUBJECT_FILTERS.map((f) => (
              <Button
                key={f.id}
                variant={subjectFilter === f.id ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-2.5 text-xs rounded-full"
                onClick={() => setSubjectFilter(f.id)}
              >
                <f.icon className="w-3 h-3 mr-1" />
                {f.label}
              </Button>
            ))}
          </div>

          {/* Grade Band Filters */}
          <div className="flex gap-1">
            <Button
              variant={gradeFilter === null ? 'default' : 'outline'}
              size="sm"
              className="h-7 px-2.5 text-xs rounded-full"
              onClick={() => setGradeFilter(null)}
            >
              All Grades
            </Button>
            {GRADE_BANDS.map((g) => (
              <Button
                key={g}
                variant={gradeFilter === g ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-2.5 text-xs rounded-full"
                onClick={() => setGradeFilter(g)}
              >
                {g}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Question List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading questions...</span>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No questions found. Try adjusting your filters.
              </div>
            ) : (
              questions.map((q) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  isTutor={isTutor}
                  isExpanded={expandedId === q.id}
                  onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  onAddToCanvas={onAddToCanvas}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-center gap-2 p-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {Math.ceil(total / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={(page + 1) * limit >= total}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// Question Card
// ============================================================

function QuestionCard({
  question: q,
  isTutor,
  isExpanded,
  onToggle,
  onAddToCanvas,
}: {
  question: QuestionItem;
  isTutor: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onAddToCanvas?: (text: string) => void;
}) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <button
        type="button"
        className="w-full text-left p-3 space-y-1.5"
        onClick={onToggle}
      >
        {/* Header row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {q.gradeBand}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {q.questionType.replace('_', ' ')}
          </Badge>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${DIFFICULTY_COLORS[q.difficulty] || ''}`}>
            {DIFFICULTY_LABELS[q.difficulty]}
          </Badge>
          {q.curriculum && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {q.curriculum}
            </Badge>
          )}
          {q.testPrepCategory && (
            <Badge className="text-[10px] px-1.5 py-0 bg-purple-600 text-white">
              {q.testPrepCategory.testType}
            </Badge>
          )}
        </div>

        {/* Topic */}
        <p className="text-[11px] font-medium text-muted-foreground">{q.topic}</p>

        {/* Stem preview */}
        <p className="text-sm leading-relaxed line-clamp-2">
          {q.stem}
        </p>

        {/* Expand indicator */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {isExpanded ? 'Hide details' : 'Show details'}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 space-y-2 border-t mt-0">
          <div className="pt-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Full Question:</p>
            <p className="text-sm whitespace-pre-wrap">{q.stem}</p>
          </div>

          {isTutor && (
            <div>
              <p className="text-xs font-medium text-emerald-700 mb-1">Answer:</p>
              <p className="text-sm bg-emerald-50 dark:bg-emerald-950 rounded p-2">{q.answerKey}</p>
            </div>
          )}

          {q.standardCode && (
            <p className="text-[11px] text-muted-foreground">
              Standard: {q.standardCode}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => onAddToCanvas?.(q.stem)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add to Canvas
            </Button>
            {isTutor && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => onAddToCanvas?.(`Q: ${q.stem}\n\nA: ${q.answerKey}`)}
              >
                <Eye className="w-3 h-3 mr-1" />
                Add with Answer
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
