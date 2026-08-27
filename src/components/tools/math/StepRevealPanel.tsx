'use client';

import React, { useState, useCallback } from 'react';
import { Editor } from '@tldraw/tldraw';
import { X, ListOrdered, Plus, Trash2, Eye, EyeOff, Lightbulb, CheckCircle2, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StepRevealPanelProps {
  editor: unknown;
  onClose?: () => void;
}

interface Step {
  id: string;
  text: string;
  latex: string;
  revealed: boolean;
  guess: string;
  isCorrect: boolean | null;
}

export default function StepRevealPanel({ editor, onClose }: StepRevealPanelProps) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [newText, setNewText] = useState('');
  const [newLatex, setNewLatex] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [guessingStepId, setGuessingStepId] = useState<string | null>(null);

  const addStep = useCallback(() => {
    if (!newText.trim()) return;
    const step: Step = {
      id: `step-${Date.now()}` as any,
      text: newText.trim(),
      latex: newLatex.trim(),
      revealed: false,
      guess: '',
      isCorrect: null,
    };
    setSteps(prev => [...prev, step]);
    setNewText('');
    setNewLatex('');
  }, [newText, newLatex]);

  const removeStep = useCallback((id: string) => {
    setSteps(prev => prev.filter(s => s.id !== id));
  }, []);

  const revealNext = useCallback(() => {
    setSteps(prev =>
      prev.map((s, i) => {
        if (i === prev.findIndex(st => !st.revealed)) {
          return { ...s, revealed: true };
        }
        return s;
      })
    );
  }, []);

  const revealAll = useCallback(() => {
    setSteps(prev => prev.map(s => ({ ...s, revealed: true })));
  }, []);

  const hideAll = useCallback(() => {
    setSteps(prev => prev.map(s => ({ ...s, revealed: false, isCorrect: null, guess: '' })));
  }, []);

  const startGuessing = useCallback((stepId: string) => {
    setGuessingStepId(stepId);
    setGuessInput('');
  }, []);

  const submitGuess = useCallback(() => {
    if (!guessingStepId || !guessInput.trim()) return;
    const step = steps.find(s => s.id === guessingStepId);
    if (!step) return;
    // Simple comparison: check if guess contains key words from step text
    const stepWords = step.text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const guessWords = guessInput.toLowerCase().split(/\s+/);
    const matchCount = guessWords.filter(gw => stepWords.some(sw => gw.includes(sw) || sw.includes(gw))).length;
    const isCorrect = matchCount >= Math.min(2, stepWords.length);

    setSteps(prev =>
      prev.map(s =>
        s.id === guessingStepId ? { ...s, revealed: true, guess: guessInput, isCorrect } : s
      )
    );
    setGuessingStepId(null);
    setGuessInput('');
  }, [guessingStepId, guessInput, steps]);

  const revealedCount = steps.filter(s => s.revealed).length;

  const addToBoard = useCallback(() => {
    const ed = editor as Editor | null;
    if (!ed || steps.length === 0) return;
    const center = ed.getCurrentPageBounds()?.center || { x: 400, y: 300 };
    const startX = center.x - 200;
    const startY = center.y - 150;
    const stepH = 50;
    const shapes: any[] = [];

    shapes.push({
      id: `shape:sr-title-${Date.now()}` as any,
      type: 'text' as const,
      x: startX,
      y: startY - 40,
      props: { text: 'Step-by-Step Solution', size: 'l', font: 'sans' },
    });

    steps.forEach((step, i) => {
      const y = startY + i * stepH;

      // Step number badge
      shapes.push({
        id: `shape:sr-num-${step.id}-${Date.now()}` as any,
        type: 'text' as const,
        x: startX,
        y,
        props: { text: `Step ${i + 1}`, size: 's', font: 'sans', color: '#2563eb' },
      });

      // Step text
      shapes.push({
        id: `shape:sr-text-${step.id}-${Date.now()}` as any,
        type: 'text' as const,
        x: startX + 60,
        y,
        props: { text: step.text, size: 'm', font: 'sans' },
      });

      // LaTeX
      if (step.latex) {
        shapes.push({
          id: `shape:sr-latex-${step.id}-${Date.now()}` as any,
          type: 'text' as const,
          x: startX + 60,
          y: y + 18,
          props: { text: step.latex, size: 'm', font: 'mono', color: '#7c3aed' },
        });
      }

      // Connector arrow
      if (i < steps.length - 1) {
        shapes.push({
          id: `shape:sr-arrow-${step.id}-${Date.now()}` as any,
          type: 'arrow' as const,
          x: startX + 280,
          y: y + stepH - 10,
          props: {
            start: { type: 'point', x: 0, y: 0 },
            end: { type: 'point', x: 0, y: 10 },
            color: '#d1d5db', size: 's', arrowheadEnd: 'arrow',
          },
        });
      }
    });

    ed.createShapes(shapes);
  }, [editor, steps]);

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
      <Card className="shadow-xl border-2 border-indigo-200 bg-white/97 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
              <ListOrdered className="w-4 h-4" />
              Step-by-Step Reveal
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          {steps.length > 0 && (
            <div className="text-[10px] text-muted-foreground">
              {revealedCount} of {steps.length} steps revealed
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add step form */}
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Step Description</Label>
              <Textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="Describe this step..." className="min-h-[48px] text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">LaTeX (optional)</Label>
              <Input value={newLatex} onChange={e => setNewLatex(e.target.value)} placeholder="e.g. 2x + 3 = 7" className="h-8 text-sm font-mono" />
            </div>
            <Button onClick={addStep} disabled={!newText.trim()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-1.5" /> Add Step
            </Button>
          </div>

          {/* Guessing input */}
          {guessingStepId && (
            <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3 space-y-2">
              <div className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> Guess the next step!
              </div>
              <div className="flex gap-2">
                <Input value={guessInput} onChange={e => setGuessInput(e.target.value)} placeholder="Type your answer..." className="h-8 text-sm" onKeyDown={e => e.key === 'Enter' && submitGuess()} />
                <Button onClick={submitGuess} className="bg-amber-600 hover:bg-amber-700 text-white" size="sm">
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Reveal controls */}
          {steps.length > 0 && revealedCount < steps.length && (
            <div className="flex gap-2">
              <Button onClick={revealNext} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                <Eye className="w-4 h-4 mr-1.5" /> Reveal Next Step
              </Button>
              <Button onClick={revealAll} variant="outline" size="sm" className="border-indigo-300 text-indigo-700">
                All
              </Button>
              <Button onClick={hideAll} variant="outline" size="sm" className="border-gray-300 text-gray-600">
                <EyeOff className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Steps list */}
          {steps.length > 0 && (
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div
                    key={step.id}
                    className={`rounded-lg border p-3 space-y-1 transition-all ${
                      !step.revealed ? 'bg-gray-100 border-gray-200' :
                      step.isCorrect === true ? 'bg-green-50 border-green-300' :
                      step.isCorrect === false ? 'bg-red-50 border-red-300' :
                      'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] border-indigo-300 text-indigo-700">
                        Step {i + 1}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {!step.revealed && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startGuessing(step.id)}>
                            <Lightbulb className="w-3 h-3 text-amber-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeStep(step.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {step.revealed ? (
                      <>
                        <div className="text-xs">{step.text}</div>
                        {step.latex && (
                          <div className="text-xs font-mono text-purple-700 bg-purple-50 rounded px-2 py-1">{step.latex}</div>
                        )}
                        {step.guess && (
                          <div className={`text-[10px] mt-1 ${step.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            Student guess: "{step.guess}" {step.isCorrect ? '✓' : '✗'}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hidden — click lightbulb to guess</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {steps.length === 0 && (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Add steps to create a step-by-step solution. Students can guess before revealing.
            </div>
          )}

          <Button onClick={addToBoard} disabled={steps.length === 0} variant="outline" className="w-full border-indigo-300 text-indigo-700">
            <Plus className="w-4 h-4 mr-1.5" /> Add to Board
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
