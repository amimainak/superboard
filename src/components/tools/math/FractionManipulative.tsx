'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Editor } from '@tldraw/tldraw';
import { X, PieChart, Plus, Minus, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

interface FractionManipulativeProps {
  editor: unknown;
  onClose?: () => void;
}

interface Fraction {
  numerator: number;
  denominator: number;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function simplify(f: Fraction): Fraction {
  if (f.numerator === 0) return { numerator: 0, denominator: 1 };
  const g = gcd(Math.abs(f.numerator), f.denominator);
  return { numerator: f.numerator / g, denominator: f.denominator / g };
}

function toFraction(mixed: { whole: number; num: number; den: number }): Fraction {
  const sign = mixed.whole < 0 ? -1 : 1;
  return simplify({
    numerator: sign * (Math.abs(mixed.whole) * mixed.den + mixed.num),
    denominator: mixed.den,
  });
};

function toMixed(f: Fraction): { whole: number; num: number; den: number } {
  const sign = f.numerator < 0 ? -1 : 1;
  const absNum = Math.abs(f.numerator);
  const whole = Math.floor(absNum / f.denominator);
  const remainder = absNum % f.denominator;
  return { whole: sign * whole, num: remainder, den: f.denominator };
}

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export default function FractionManipulative({ editor, onClose }: FractionManipulativeProps) {
  const [fractions, setFractions] = useState<Fraction[]>([
    { numerator: 1, denominator: 2 },
    { numerator: 1, denominator: 3 },
  ]);
  const [displayMode, setDisplayMode] = useState<'bar' | 'circle'>('bar');
  const [mixedMode, setMixedMode] = useState(false);
  const [mixedValues, setMixedValues] = useState([
    { whole: 0, num: 1, den: 2 },
    { whole: 0, num: 1, den: 3 },
  ]);

  const currentFractions = mixedMode
    ? mixedValues.map(m => toFraction(m))
    : fractions;

  const addFraction = useCallback(() => {
    if (mixedMode) {
      setMixedValues(prev => [...prev, { whole: 0, num: 1, den: 2 }]);
    } else {
      setFractions(prev => [...prev, { numerator: 1, denominator: 2 }]);
    }
  }, [mixedMode]);

  const removeFraction = useCallback((index: number) => {
    if (mixedMode) {
      setMixedValues(prev => prev.filter((_, i) => i !== index));
    } else {
      setFractions(prev => prev.filter((_, i) => i !== index));
    }
  }, [mixedMode]);

  const updateFraction = useCallback((index: number, field: 'numerator' | 'denominator', value: number) => {
    setFractions(prev => prev.map((f, i) => i === index ? { ...f, [field]: Math.max(field === 'denominator' ? 1 : 0, value) } : f));
  }, []);

  const updateMixed = useCallback((index: number, field: 'whole' | 'num' | 'den', value: number) => {
    setMixedValues(prev => prev.map((m, i) => i === index ? { ...m, [field]: Math.max(field === 'den' ? 1 : 0, value) } : m));
  }, []);

  // Sum of fractions
  const sum = useMemo(() => {
    if (currentFractions.length === 0) return { numerator: 0, denominator: 1 };
    const lcm = (a: number, b: number) => (a * b) / gcd(a, b);
    let commonDen = currentFractions[0].denominator;
    currentFractions.forEach(f => { commonDen = lcm(commonDen, f.denominator); });
    let totalNum = 0;
    currentFractions.forEach(f => { totalNum += f.numerator * (commonDen / f.denominator); });
    return simplify({ numerator: totalNum, denominator: commonDen });
  }, [currentFractions]);

  // Equivalent fractions
  const equivalents = useMemo(() => {
    return currentFractions.map(f => {
      const s = simplify(f);
      const eqs: Fraction[] = [];
      for (let m = 2; m <= 6; m++) {
        if (s.denominator * m <= 24) {
          eqs.push({ numerator: s.numerator * m, denominator: s.denominator * m });
        }
      }
      return { original: s, equivalents: eqs };
    });
  }, [currentFractions]);

  const addToBoard = useCallback(() => {
    const ed = editor as Editor | null;
    if (!ed) return;
    const center = ed.getCurrentPageBounds()?.center || { x: 400, y: 300 };
    const startX = center.x - 200;
    const startY = center.y - 100;
    const barW = 280;
    const barH = 40;
    const shapes: any[] = [];

    shapes.push({
      id: `shape:frac-title-${Date.now()}` as any,
      type: 'text' as const,
      x: startX,
      y: startY - 40,
      props: { text: 'Fraction Visualization', size: 'l', font: 'sans' },
    });

    currentFractions.forEach((f, i) => {
      const y = startY + i * (barH + 50);
      const s = simplify(f);
      const portion = Math.abs(s.numerator) / s.denominator;

      // Label
      shapes.push({
        id: `shape:frac-label-${i}-${Date.now()}` as any,
        type: 'text' as const,
        x: startX,
        y: y - 18,
        props: { text: `${s.numerator}/${s.denominator}`, size: 'm', font: 'mono' },
      });

      // Background bar
      shapes.push({
        id: `shape:frac-bg-${i}-${Date.now()}` as any,
        type: 'geo' as const,
        x: startX,
        y,
        props: { geo: 'rectangle', w: barW, h: barH, color: '#e5e7eb', fill: 'solid' },
      });

      // Filled bar
      shapes.push({
        id: `shape:frac-fill-${i}-${Date.now()}` as any,
        type: 'geo' as const,
        x: startX,
        y,
        props: { geo: 'rectangle', w: barW * portion, h: barH, color: COLORS[i % COLORS.length], fill: 'solid' },
      });

      // Division lines
      for (let j = 1; j < f.denominator; j++) {
        shapes.push({
          id: `shape:frac-div-${i}-${j}-${Date.now()}` as any,
          type: 'line' as const,
          x: startX + (barW / f.denominator) * j,
          y,
          props: { points: [{ x: 0, y: 0 }, { x: 0, y: barH }], color: '#9ca3af', size: 'xs' },
        });
      }
    });

    // Sum
    const sumY = startY + currentFractions.length * (barH + 50) + 10;
    shapes.push({
      id: `shape:frac-sum-label-${Date.now()}` as any,
      type: 'text' as const,
      x: startX,
      y: sumY,
      props: { text: `Sum = ${sum.numerator}/${sum.denominator}`, size: 'm', font: 'mono', color: '#dc2626' },
    });

    ed.createShapes(shapes);
  }, [editor, currentFractions, sum]);

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
      <Card className="shadow-xl border-2 border-blue-200 bg-white/97 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-blue-700 flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Fraction Manipulative
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant={displayMode === 'bar' ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setDisplayMode('bar')}
            >
              <BarChart3 className="w-3 h-3 mr-1" /> Bars
            </Badge>
            <Badge
              variant={displayMode === 'circle' ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setDisplayMode('circle')}
            >
              <PieChart className="w-3 h-3 mr-1" /> Circles
            </Badge>
            <div className="ml-auto flex items-center gap-1.5">
              <input type="checkbox" checked={mixedMode} onChange={e => setMixedMode(e.target.checked)} className="rounded" />
              <Label className="text-xs text-muted-foreground">Mixed Numbers</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Fraction inputs */}
          {(mixedMode ? mixedValues : currentFractions).map((f, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg border bg-gray-50">
                <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                {mixedMode ? (
                  <>
                    <div className="w-12">
                      <Input type="number" value={mixedValues[i].whole} onChange={e => updateMixed(i, 'whole', parseInt(e.target.value) || 0)} className="h-8 text-sm text-center" />
                      <div className="text-[9px] text-center text-muted-foreground">whole</div>
                    </div>
                    <div className="text-sm font-bold text-gray-400">+</div>
                    <div className="w-10">
                      <Input type="number" value={mixedValues[i].num} onChange={e => updateMixed(i, 'num', parseInt(e.target.value) || 0)} className="h-8 text-sm text-center" />
                    </div>
                    <div className="text-sm font-bold text-gray-400">/</div>
                    <div className="w-10">
                      <Input type="number" value={mixedValues[i].den} onChange={e => updateMixed(i, 'den', Math.max(1, parseInt(e.target.value) || 1))} className="h-8 text-sm text-center" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12">
                      <Input type="number" value={fractions[i].numerator} onChange={e => updateFraction(i, 'numerator', parseInt(e.target.value) || 0)} className="h-8 text-sm text-center" />
                    </div>
                    <div className="text-sm font-bold text-gray-400">/</div>
                    <div className="w-12">
                      <Input type="number" value={fractions[i].denominator} onChange={e => updateFraction(i, 'denominator', Math.max(1, parseInt(e.target.value) || 1))} className="h-8 text-sm text-center" />
                    </div>
                    <div className="text-[10px] text-muted-foreground ml-1">
                      = {simplify(currentFractions[i]).numerator}/{simplify(currentFractions[i]).denominator}
                    </div>
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => removeFraction(i)}>
                  <Minus className="w-3 h-3" />
                </Button>
              </div>
            );
          })}

          <Button onClick={addFraction} variant="outline" size="sm" className="w-full border-blue-300 text-blue-700">
            <Plus className="w-4 h-4 mr-1.5" /> Add Fraction
          </Button>

          {/* Visual display */}
          <div className="space-y-3 p-3 rounded-lg bg-gray-50 border">
            {currentFractions.map((f, i) => {
              const s = simplify(f);
              const color = COLORS[i % COLORS.length];
              const portion = Math.min(Math.abs(s.numerator) / s.denominator, 1);

              if (displayMode === 'bar') {
                return (
                  <div key={i} className="space-y-1">
                    <div className="text-xs font-mono font-semibold" style={{ color }}>{s.numerator}/{s.denominator}</div>
                    <div className="h-8 w-full bg-gray-200 rounded-sm overflow-hidden relative">
                      <div
                        className="h-full rounded-sm transition-all duration-300"
                        style={{ width: `${portion * 100}%`, backgroundColor: color }}
                      />
                      {/* Division lines */}
                      {Array.from({ length: f.denominator - 1 }, (_, j) => (
                        <div
                          key={j}
                          className="absolute top-0 bottom-0 w-px bg-white/70"
                          style={{ left: `${((j + 1) / f.denominator) * 100}%` }}
                        />
                      ))}
                    </div>
                    {equivalents[i] && equivalents[i].equivalents.length > 0 && (
                      <div className="text-[10px] text-muted-foreground">
                        ≡ {equivalents[i].equivalents.map(e => `${e.numerator}/${e.denominator}`).join(', ')}
                      </div>
                    )}
                  </div>
                );
              } else {
                // Circle mode
                const r = 35;
                const circumference = 2 * Math.PI * r;
                const dashArray = `${portion * circumference} ${circumference}`;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <svg width={r * 2 + 4} height={r * 2 + 4} className="flex-shrink-0">
                      <circle cx={r + 2} cy={r + 2} r={r} fill="#f3f4f6" stroke="#e5e7eb" strokeWidth={1} />
                      <circle
                        cx={r + 2} cy={r + 2} r={r}
                        fill="none"
                        stroke={color}
                        strokeWidth={r * 2}
                        strokeDasharray={dashArray}
                        strokeDashoffset={circumference / 4}
                        transform={`rotate(-90 ${r + 2} ${r + 2})`}
                        className="transition-all duration-300"
                      />
                      {/* Division lines */}
                      {Array.from({ length: f.denominator }, (_, j) => {
                        const angle = (j / f.denominator) * 360 - 90;
                        const rad = (angle * Math.PI) / 180;
                        return (
                          <line
                            key={j}
                            x1={r + 2}
                            y1={r + 2}
                            x2={r + 2 + r * Math.cos(rad)}
                            y2={r + 2 + r * Math.sin(rad)}
                            stroke="#9ca3af"
                            strokeWidth={0.5}
                          />
                        );
                      })}
                    </svg>
                    <div className="space-y-0.5">
                      <div className="text-xs font-mono font-semibold" style={{ color }}>{s.numerator}/{s.denominator}</div>
                      {equivalents[i] && equivalents[i].equivalents.length > 0 && (
                        <div className="text-[10px] text-muted-foreground">
                          ≡ {equivalents[i].equivalents.map(e => `${e.numerator}/${e.denominator}`).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            })}
          </div>

          {/* Sum */}
          {currentFractions.length >= 2 && (
            <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
              <div className="text-xs font-semibold text-blue-800">Sum</div>
              <div className="text-sm font-mono font-bold text-blue-700">{sum.numerator}/{sum.denominator}</div>
              {Math.abs(sum.numerator) >= sum.denominator && (
                <div className="text-xs text-blue-600 mt-0.5">
                  = {toMixed(sum).whole !== 0 ? `${toMixed(sum).whole} ` : ''}
                  {toMixed(sum).num > 0 ? `${toMixed(sum).num}/${toMixed(sum).den}` : ''}
                </div>
              )}
            </div>
          )}

          <Button onClick={addToBoard} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-1.5" /> Add to Board
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
