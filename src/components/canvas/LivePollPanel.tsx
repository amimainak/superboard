// ============================================================
// LivePollPanel — In-session live polling
// ============================================================
// Floating button (bottom-right) toggles the poll panel.
// Data synced via Yjs Map (key: 'live-poll') storing:
//   { question, options, votes: Record<optionIndex, count>, isActive }
// Tutor: create poll, see real-time vote counts, close poll.
// Student: vote, see results only after poll is closed.
// ============================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Plus,
  X,
  Send,
  CheckCircle,
  Loader2,
  Users,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface PollData {
  question: string;
  options: string[];
  votes: Record<string, number>; // option index as string -> count
  isActive: boolean;
}

interface YMapLike {
  get: (key: string) => any;
  set: (key: string, value: any) => void;
  observe: (callback: (event: any) => void) => void;
  unobserve: (callback: (event: any) => void) => void;
  toJSON: () => Record<string, any>;
}

interface YDocLike {
  getMap: (name: string) => YMapLike;
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------
type Props = {
  ydoc: YDocLike | null;
  isTutor: boolean;
};

export default function LivePollPanel({ ydoc, isTutor }: Props) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [poll, setPoll] = useState<PollData | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  // Create poll form
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [creating, setCreating] = useState(false);

  // ---- Get Yjs map ----
  const pollMap = ydoc?.getMap('live-poll') as YMapLike | undefined;

  // ---- Read poll from Yjs ----
  const readPoll = useCallback(() => {
    if (!pollMap) return;
    try {
      const raw = pollMap.get('poll') as string | null;
      if (raw) {
        const parsed = JSON.parse(raw) as PollData;
        setPoll(parsed);
      } else {
        setPoll(null);
        setHasVoted(false);
        setSelectedOption(null);
      }
    } catch {
      // corrupted data
    }
  }, [pollMap]);

  // ---- Observe Yjs changes ----
  useEffect(() => {
    if (!pollMap) return;
    readPoll();
    const handler = () => readPoll();
    pollMap.observe(handler);
    return () => {
      pollMap.unobserve(handler);
    };
  }, [pollMap, readPoll]);

  // ---- Create poll ----
  const handleCreate = () => {
    const validOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || validOptions.length < 2) {
      toast({
        title: 'Please add a question and at least 2 options',
        variant: 'destructive',
      });
      return;
    }

    const votes: Record<string, number> = {};
    validOptions.forEach((_, i) => {
      votes[String(i)] = 0;
    });

    const newPoll: PollData = {
      question: question.trim(),
      options: validOptions,
      votes,
      isActive: true,
    };

    setCreating(true);
    try {
      pollMap?.set('poll', JSON.stringify(newPoll));
      setShowCreate(false);
      setQuestion('');
      setOptions(['', '']);
      toast({ title: 'Poll created!', description: 'Students can now vote.' });
    } catch {
      toast({ title: 'Failed to create poll', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  // ---- Vote ----
  const handleVote = (optionIndex: number) => {
    if (!poll || !pollMap || hasVoted || !poll.isActive) return;

    try {
      const updated = { ...poll };
      updated.votes = { ...updated.votes };
      const key = String(optionIndex);
      updated.votes[key] = (updated.votes[key] || 0) + 1;

      pollMap.set('poll', JSON.stringify(updated));
      setHasVoted(true);
      setSelectedOption(optionIndex);
    } catch {
      toast({ title: 'Failed to submit vote', variant: 'destructive' });
    }
  };

  // ---- Close poll ----
  const handleClosePoll = () => {
    if (!poll || !pollMap) return;
    try {
      const updated = { ...poll, isActive: false };
      pollMap.set('poll', JSON.stringify(updated));
      toast({ title: 'Poll closed', description: 'Results are now visible.' });
    } catch {
      toast({ title: 'Failed to close poll', variant: 'destructive' });
    }
  };

  // ---- Add/Remove option ----
  const addOption = () => {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  // ---- Results calculation ----
  const getTotalVotes = () => {
    if (!poll?.votes) return 0;
    return Object.values(poll.votes).reduce((s, v) => s + v, 0);
  };

  const getOptionVotes = (index: number) => {
    if (!poll?.votes) return 0;
    return poll.votes[String(index)] || 0;
  };

  const totalVotes = getTotalVotes();
  const showResults = poll ? !poll.isActive : false;

  // Whether there's an active or recently-closed poll (for badge)
  const hasPoll = poll !== null;

  return (
    <>
      {/* Floating Toggle Button — bottom-right */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-20 right-4 z-40 w-11 h-11 rounded-full shadow-lg border
          flex items-center justify-center transition-all duration-200
          ${isOpen
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/25'
            : hasPoll && poll?.isActive
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/30 animate-pulse'
              : 'bg-white/90 text-gray-700 border-gray-200 backdrop-blur-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
          }
        `}
        title={isOpen ? 'Close poll panel' : 'Open poll panel'}
      >
        {isOpen ? <ChevronDown className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
      </button>

      {/* Floating Panel */}
      {isOpen && (
        <div className="fixed bottom-32 right-4 z-40 w-80 max-h-[70vh] bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden flex flex-col">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Live Poll
              {poll?.isActive ? (
                <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 rounded-full font-medium animate-pulse">
                  Live
                </Badge>
              ) : poll ? (
                <Badge className="bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0 rounded-full font-medium">
                  Closed
                </Badge>
              ) : null}
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Users className="w-3 h-3" />
                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
              </span>
              {isTutor && poll?.isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs h-7 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleClosePoll}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Close
                </Button>
              )}
            </div>
          </div>

          {/* Panel Body — scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* ---- No active poll ---- */}
            {!poll && !showCreate && (
              <div className="text-center py-6">
                <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                {isTutor ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">Create a poll for students to vote on.</p>
                    <Button
                      onClick={() => setShowCreate(true)}
                      className="rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Create Poll
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Waiting for a poll from your tutor...</p>
                )}
              </div>
            )}

            {/* ---- Create Poll Form (tutor only) ---- */}
            {isTutor && showCreate && !poll && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-1 block">Question</Label>
                  <Input
                    placeholder="What is the capital of France?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-700 block">Options (2-6)</Label>
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{String.fromCharCode(65 + i)}</span>
                      <Input
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const next = [...options];
                          next[i] = e.target.value;
                          setOptions(next);
                        }}
                        className="rounded-xl text-sm"
                      />
                      {options.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 hover:text-red-500"
                          onClick={() => removeOption(i)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {options.length < 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-emerald-600 hover:bg-emerald-50"
                      onClick={addOption}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Option
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex-1 rounded-xl gradient-primary border-0 text-white font-semibold shadow-lg shadow-emerald-500/25 text-xs"
                  >
                    {creating && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    <Send className="w-3 h-3 mr-1" />
                    Start Poll
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* ---- Active / Closed Poll ---- */}
            {poll && (
              <div className="space-y-3">
                {/* Question */}
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-900">{poll.question}</p>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {poll.options.map((option, i) => {
                    const votes = getOptionVotes(i);
                    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    const isSelected = selectedOption === i;

                    // Find max for winner highlighting (only after close)
                    const maxVotes = showResults
                      ? Math.max(...poll.options.map((_, j) => getOptionVotes(j)))
                      : 0;
                    const isWinner = showResults && votes > 0 && votes === maxVotes;

                    // Student: hide vote counts while poll is open
                    const showVoteCounts = showResults || isTutor;

                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={hasVoted || !poll.isActive}
                        className={`
                          w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden
                          ${isSelected
                            ? 'border-emerald-300 bg-emerald-50'
                            : showResults && isWinner
                              ? 'border-amber-300 bg-amber-50'
                              : 'border-gray-100 bg-gray-50/50 hover:bg-emerald-50/30 hover:border-emerald-200/60'
                          }
                          ${!poll.isActive || hasVoted ? 'cursor-default' : 'cursor-pointer'}
                        `}
                        onClick={() => handleVote(i)}
                      >
                        {/* Results bar */}
                        {showVoteCounts && totalVotes > 0 && (
                          <div
                            className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                              isWinner && showResults ? 'bg-amber-100/60' : 'bg-emerald-100/40'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        )}

                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSelected
                                ? 'bg-emerald-500 text-white'
                                : showResults && isWinner
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-gray-200 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + i)}
                            </span>
                            <span className="text-sm font-medium truncate">{option}</span>
                          </div>
                          {showVoteCounts && (
                            <span className="text-xs font-semibold text-muted-foreground shrink-0 ml-2">
                              {percentage}% ({votes})
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {hasVoted && poll.isActive && (
                  <p className="text-[11px] text-center text-muted-foreground">
                    You&apos;ve submitted your vote. Waiting for others...
                  </p>
                )}

                {isTutor && showResults && (
                  <div className="pt-2 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl text-xs"
                      onClick={() => {
                        pollMap?.set('poll', null);
                        setPoll(null);
                        setHasVoted(false);
                        setSelectedOption(null);
                      }}
                    >
                      Create New Poll
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Collapse handle */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="shrink-0 flex items-center justify-center py-2 border-t border-gray-100 text-muted-foreground hover:text-gray-700 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
