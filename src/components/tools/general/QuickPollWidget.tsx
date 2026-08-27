'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Editor } from '@tldraw/tldraw';
import { X, BarChart3, Plus, Play, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface QuickPollWidgetProps {
  editor: unknown;
  onClose?: () => void;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

const POLL_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4'];

export default function QuickPollWidget({ editor, onClose }: QuickPollWidgetProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOption[]>([
    { id: 'opt-1', text: '', votes: 0 },
    { id: 'opt-2', text: '', votes: 0 },
  ]);
  const [pollActive, setPollActive] = useState(false);
  const [pollComplete, setPollComplete] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [studentVote, setStudentVote] = useState<string | null>(null);

  const totalVotes = useMemo(() => options.reduce((sum, o) => sum + o.votes, 0), [options]);
  const maxVotes = useMemo(() => Math.max(...options.map(o => o.votes), 1), [options]);

  const addOption = useCallback(() => {
    if (options.length >= 6) return;
    setOptions(prev => [...prev, { id: `opt-${Date.now()}` as any, text: '', votes: 0 }]);
  }, [options.length]);

  const removeOption = useCallback((id: string) => {
    if (options.length <= 2) return;
    setOptions(prev => prev.filter(o => o.id !== id));
  }, [options.length]);

  const updateOption = useCallback((id: string, text: string) => {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, text } : o));
  }, []);

  const startPoll = useCallback(() => {
    if (!question.trim() || options.some(o => !o.text.trim())) return;
    setPollActive(true);
    setPollComplete(false);
    setStudentVote(null);
    setOptions(prev => prev.map(o => ({ ...o, votes: 0 })));
  }, [question, options]);

  const submitVote = useCallback(() => {
    if (!selectedOption) return;
    setOptions(prev => prev.map(o => o.id === selectedOption ? { ...o, votes: o.votes + 1 } : o));
    setStudentVote(selectedOption);
    setPollComplete(true);
  }, [selectedOption]);

  const resetPoll = useCallback(() => {
    setPollActive(false);
    setPollComplete(false);
    setStudentVote(null);
    setSelectedOption(null);
    setOptions(prev => prev.map(o => ({ ...o, votes: 0 })));
  }, []);

  const addToBoard = useCallback(() => {
    const ed = editor as Editor | null;
    if (!ed || !question.trim()) return;
    const center = ed.getCurrentPageBounds()?.center || { x: 400, y: 300 };
    const startX = center.x - 200;
    const startY = center.y - 150;
    const shapes: any[] = [];

    shapes.push({
      id: `shape:poll-title-${Date.now()}` as any,
      type: 'text' as const,
      x: startX,
      y: startY - 30,
      props: { text: question, size: 'l', font: 'sans' },
    });

    const barMaxW = 300;
    options.forEach((opt, i) => {
      const y = startY + 20 + i * 50;
      const pct = totalVotes > 0 ? opt.votes / totalVotes : 0;

      shapes.push({
        id: `shape:poll-label-${opt.id}-${Date.now()}` as any,
        type: 'text' as const,
        x: startX,
        y,
        props: { text: opt.text, size: 'm', font: 'sans' },
      });

      // Bar background
      shapes.push({
        id: `shape:poll-barbg-${opt.id}-${Date.now()}` as any,
        type: 'geo' as const,
        x: startX,
        y: y + 18,
        props: { geo: 'rectangle', w: barMaxW, h: 18, color: '#e5e7eb', fill: 'solid' },
      });

      // Bar fill
      shapes.push({
        id: `shape:poll-barfill-${opt.id}-${Date.now()}` as any,
        type: 'geo' as const,
        x: startX,
        y: y + 18,
        props: { geo: 'rectangle', w: barMaxW * pct, h: 18, color: POLL_COLORS[i % POLL_COLORS.length], fill: 'solid' },
      });

      // Percentage
      shapes.push({
        id: `shape:poll-pct-${opt.id}-${Date.now()}` as any,
        type: 'text' as const,
        x: startX + barMaxW + 8,
        y: y + 18,
        props: { text: `${Math.round(pct * 100)}% (${opt.votes})`, size: 's', font: 'mono', color: '#6b7280' },
      });
    });

    if (totalVotes > 0) {
      shapes.push({
        id: `shape:poll-total-${Date.now()}` as any,
        type: 'text' as const,
        x: startX,
        y: startY + 20 + options.length * 50 + 5,
        props: { text: `Total votes: ${totalVotes}`, size: 's', font: 'sans', color: '#9ca3af' },
      });
    }

    ed.createShapes(shapes);
  }, [editor, question, options, totalVotes]);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 1001,
    width: 440,
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto',
  };

  return (
    <div style={panelStyle}>
      <Card className="shadow-xl border-2 border-violet-200 bg-white/97 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-violet-700 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Quick Poll
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Setup phase */}
          {!pollActive && (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Question</Label>
                <Input
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="What is your favorite color?"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Options ({options.length}/6)</Label>
                {options.map((opt, i) => (
                  <div key={opt.id} className="flex gap-1.5">
                    <div className="w-5 h-8 flex items-center justify-center text-xs font-bold text-gray-400">{String.fromCharCode(65 + i)}</div>
                    <Input
                      value={opt.text}
                      onChange={e => updateOption(opt.id, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className="h-8 text-sm flex-1"
                    />
                    {options.length > 2 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeOption(opt.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <Button variant="outline" size="sm" onClick={addOption} className="text-xs border-violet-300 text-violet-700">
                    <Plus className="w-3 h-3 mr-1" /> Add Option
                  </Button>
                )}
              </div>
              <Button onClick={startPoll} disabled={!question.trim() || options.some(o => !o.text.trim())} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                <Play className="w-4 h-4 mr-1.5" /> Start Poll
              </Button>
            </div>
          )}

          {/* Voting phase */}
          {pollActive && !pollComplete && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-center">{question}</div>
              <RadioGroup value={selectedOption || ''} onValueChange={setSelectedOption}>
                {options.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-2 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                    <RadioGroupItem value={opt.id} id={opt.id} />
                    <Label htmlFor={opt.id} className="flex-1 text-sm cursor-pointer">{opt.text}</Label>
                    <Badge variant="outline" className="text-[10px] text-gray-400">{String.fromCharCode(65 + i)}</Badge>
                  </div>
                ))}
              </RadioGroup>
              <Button onClick={submitVote} disabled={!selectedOption} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Submit Vote
              </Button>
            </div>
          )}

          {/* Results phase */}
          {pollComplete && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-center">{question}</div>
              {studentVote && (
                <div className="text-center text-xs text-violet-600">
                  You voted: {options.find(o => o.id === studentVote)?.text}
                </div>
              )}

              {/* Bar chart */}
              <div className="space-y-2">
                {options.map((opt, i) => {
                  const pct = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
                  const color = POLL_COLORS[i % POLL_COLORS.length];
                  return (
                    <div key={opt.id} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{opt.text}</span>
                        <span className="text-gray-500">{Math.round(pct)}% ({opt.votes})</span>
                      </div>
                      <div className="h-5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center text-xs text-muted-foreground">Total: {totalVotes} vote{totalVotes !== 1 ? 's' : ''}</div>

              <div className="flex gap-2">
                <Button onClick={resetPoll} variant="outline" className="flex-1 border-violet-300 text-violet-700">
                  <RotateCcw className="w-4 h-4 mr-1.5" /> New Poll
                </Button>
                <Button onClick={() => { setPollComplete(false); setStudentVote(null); setSelectedOption(null); setOptions(prev => prev.map(o => ({ ...o, votes: 0 }))); }} variant="outline" className="flex-1 border-gray-300">
                  <Play className="w-4 h-4 mr-1.5" /> Vote Again
                </Button>
              </div>
            </div>
          )}

          <Button onClick={addToBoard} disabled={!question.trim()} variant="outline" className="w-full border-violet-300 text-violet-700">
            <Plus className="w-4 h-4 mr-1.5" /> Add to Board
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
