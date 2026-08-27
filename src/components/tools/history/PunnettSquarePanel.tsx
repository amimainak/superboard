'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Editor } from '@tldraw/tldraw';
import { X, Dna, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface PunnettSquarePanelProps {
  editor: unknown;
  onClose?: () => void;
}

interface GenotypeCell {
  genotype: string;
  isDominant: boolean;
}

export default function PunnettSquarePanel({ editor, onClose }: PunnettSquarePanelProps) {
  const [parent1, setParent1] = useState('Aa');
  const [parent2, setParent2] = useState('Aa');
  const [isDihybrid, setIsDihybrid] = useState(false);
  const [trait1P1, setTrait1P1] = useState('Aa');
  const [trait1P2, setTrait1P2] = useState('Aa');
  const [trait2P1, setTrait2P1] = useState('Bb');
  const [trait2P2, setTrait2P2] = useState('Bb');

  const getAlleles = (genotype: string): string[] => {
    const chars = genotype.replace(/\s/g, '').split('');
    return chars;
  };

  const isGenotypeDominant = (genotype: string): boolean => {
    const upper = genotype.toUpperCase();
    return genotype[0] === upper[0] || genotype[1] === upper[1];
  };

  const normalizeGenotype = (a1: string, a2: string): string => {
    const pairs: string[] = [];
    for (let i = 0; i < a1.length; i++) {
      const c1 = a1[i];
      const c2 = a2[i];
      if (c1 === c1.toUpperCase() || c2 === c2.toUpperCase()) {
        const upper = c1 === c1.toUpperCase() ? c1 : c2;
        const lower = c1 === c1.toLowerCase() ? c1 : c2;
        pairs.push(upper + lower);
      } else {
        pairs.push(c1 + c2);
      }
    }
    return pairs.join(' ');
  };

  // Monohybrid cross grid
  const monohybridGrid = useMemo(() => {
    const alleles1 = getAlleles(parent1);
    const alleles2 = getAlleles(parent2);
    if (alleles1.length !== 2 || alleles2.length !== 2) return null;

    const grid: GenotypeCell[][] = [];
    for (let r = 0; r < 2; r++) {
      const row: GenotypeCell[] = [];
      for (let c = 0; c < 2; c++) {
        const genotype = normalizeGenotype(alleles2[r], alleles1[c]);
        row.push({ genotype, isDominant: isGenotypeDominant(genotype.replace(/\s/g, '')) });
      }
      grid.push(row);
    }
    return grid;
  }, [parent1, parent2]);

  // Dihybrid cross grid
  const dihybridGrid = useMemo(() => {
    const a1 = getAlleles(trait1P1);
    const a2 = getAlleles(trait1P2);
    const b1 = getAlleles(trait2P1);
    const b2 = getAlleles(trait2P2);
    if (a1.length !== 2 || a2.length !== 2 || b1.length !== 2 || b2.length !== 2) return null;

    const gametes1: string[] = [a1[0] + b1[0], a1[0] + b1[1], a1[1] + b1[0], a1[1] + b1[1]];
    const gametes2: string[] = [a2[0] + b2[0], a2[0] + b2[1], a2[1] + b2[0], a2[1] + b2[1]];

    const grid: GenotypeCell[][] = [];
    for (let r = 0; r < 4; r++) {
      const row: GenotypeCell[] = [];
      for (let c = 0; c < 4; c++) {
        const g1 = gametes2[r].split('');
        const g2 = gametes1[c].split('');
        const genotype = normalizeGenotype(g2.join(''), g1.join(''));
        row.push({ genotype, isDominant: isGenotypeDominant(genotype.replace(/\s/g, '')) });
      }
      grid.push(row);
    }
    return { grid, gametes1, gametes2 };
  }, [trait1P1, trait1P2, trait2P1, trait2P2]);

  // Calculate ratios
  const ratios = useMemo(() => {
    if (isDihybrid) {
      if (!dihybridGrid) return { genotype: '', phenotype: '' };
      const allGenotypes = dihybridGrid.grid.flat().map(c => c.genotype);
      const counts = new Map<string, number>();
      allGenotypes.forEach(g => counts.set(g, (counts.get(g) || 0) + 1));
      const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
      const gcd = entries.reduce((acc, [, v]) => gcdFn(acc, v), entries[0]?.[1] || 1);
      const genotypeRatio = entries.map(([, v]) => v / gcd).join(' : ');
      const dominantCount = dihybridGrid.grid.flat().filter(c => c.isDominant).length;
      const recessiveCount = dihybridGrid.grid.flat().length - dominantCount;
      const g2 = gcdFn(dominantCount, recessiveCount);
      return {
        genotype: genotypeRatio,
        phenotype: `${dominantCount / g2} dominant : ${recessiveCount / g2} recessive`,
      };
    } else {
      if (!monohybridGrid) return { genotype: '', phenotype: '' };
      const allGenotypes = monohybridGrid.flat().map(c => c.genotype);
      const counts = new Map<string, number>();
      allGenotypes.forEach(g => counts.set(g, (counts.get(g) || 0) + 1));
      const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
      const gcd = entries.reduce((acc, [, v]) => gcdFn(acc, v), entries[0]?.[1] || 1);
      const genotypeRatio = entries.map(([, v]) => v / gcd).join(' : ');
      const dominantCount = monohybridGrid.flat().filter(c => c.isDominant).length;
      const recessiveCount = monohybridGrid.flat().length - dominantCount;
      const g2 = gcdFn(dominantCount, recessiveCount);
      return {
        genotype: genotypeRatio,
        phenotype: `${dominantCount / g2} dominant : ${recessiveCount / g2} recessive`,
      };
    }
  }, [isDihybrid, monohybridGrid, dihybridGrid]);

  const gcdFn = (a: number, b: number): number => (b === 0 ? a : gcdFn(b, a % b));

  const addToBoard = useCallback(() => {
    const ed = editor as Editor | null;
    if (!ed) return;
    const center = ed.getCurrentPageBounds()?.center || { x: 400, y: 300 };
    const cellSize = 80;
    const offsetX = center.x - (isDihybrid ? cellSize * 2 : cellSize);
    const offsetY = center.y - (isDihybrid ? cellSize * 2 : cellSize);
    const size = isDihybrid ? 4 : 2;

    const shapes: any[] = [];

    // Title
    shapes.push({
      id: `shape:ps-title-${Date.now()}` as any,
      type: 'text' as const,
      x: offsetX - 20,
      y: offsetY - 50,
      props: {
        text: isDihybrid
          ? `Dihybrid Cross: ${trait1P1}${trait2P1} × ${trait1P2}${trait2P2}`
          : `Monohybrid Cross: ${parent1} × ${parent2}`,
        size: 'l',
        font: 'sans',
      },
    });

    // Grid lines
    for (let i = 0; i <= size; i++) {
      shapes.push({
        id: `shape:ps-hline-${i}-${Date.now()}` as any,
        type: 'line' as const,
        x: offsetX,
        y: offsetY + i * cellSize,
        props: {
          points: [{ x: 0, y: 0 }, { x: size * cellSize, y: 0 }],
          color: '#374151',
          size: 'm',
        },
      });
      shapes.push({
        id: `shape:ps-vline-${i}-${Date.now()}` as any,
        type: 'line' as const,
        x: offsetX + i * cellSize,
        y: offsetY,
        props: {
          points: [{ x: 0, y: 0 }, { x: 0, y: size * cellSize }],
          color: '#374151',
          size: 'm',
        },
      });
    }

    // Cell texts
    const grid = isDihybrid ? dihybridGrid?.grid : monohybridGrid;
    if (grid) {
      grid.forEach((row, r) => {
        row.forEach((cell, c) => {
          shapes.push({
            id: `shape:ps-cell-${r}-${c}-${Date.now()}` as any,
            type: 'text' as const,
            x: offsetX + c * cellSize + 10,
            y: offsetY + r * cellSize + cellSize / 2 - 10,
            props: {
              text: cell.genotype,
              size: 'm',
              font: 'mono',
              color: cell.isDominant ? '#059669' : '#d97706',
            },
          });
        });
      });
    }

    // Ratios
    shapes.push({
      id: `shape:ps-ratios-${Date.now()}` as any,
      type: 'text' as const,
      x: offsetX,
      y: offsetY + size * cellSize + 20,
      props: {
        text: `Genotype: ${ratios.genotype}  |  Phenotype: ${ratios.phenotype}`,
        size: 's',
        font: 'sans',
        color: '#6b7280',
      },
    });

    ed.createShapes(shapes);
  }, [editor, isDihybrid, parent1, parent2, trait1P1, trait1P2, trait2P1, trait2P2, monohybridGrid, dihybridGrid, ratios]);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 1001,
    width: 420,
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto',
  };

  return (
    <div style={panelStyle}>
      <Card className="shadow-xl border-2 border-emerald-200 bg-white/97 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
              <Dna className="w-4 h-4" />
              Punnett Square Builder
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Switch checked={isDihybrid} onCheckedChange={setIsDihybrid} />
            <Label className="text-xs text-muted-foreground">Dihybrid Cross (4×4)</Label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isDihybrid ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Parent 1</Label>
                  <Input value={parent1} onChange={e => setParent1(e.target.value)} placeholder="e.g. Aa" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Parent 2</Label>
                  <Input value={parent2} onChange={e => setParent2(e.target.value)} placeholder="e.g. Aa" className="h-8 text-sm" />
                </div>
              </div>
              {monohybridGrid && (
                <>
                  <div className="flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {parent1} × {parent2}
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 h-8 text-xs p-0"></TableHead>
                        {getAlleles(parent1).map((a, i) => (
                          <TableHead key={i} className="h-8 text-xs text-center p-0 font-bold text-emerald-700">{a}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monohybridGrid.map((row, r) => (
                        <TableRow key={r}>
                          <TableCell className="font-bold text-xs text-center p-0 text-emerald-700">
                            {getAlleles(parent2)[r]}
                          </TableCell>
                          {row.map((cell, c) => (
                            <TableCell
                              key={c}
                              className={`text-center text-sm font-mono font-semibold p-0 h-10 ${
                                cell.isDominant
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {cell.genotype}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Parent 1 Trait 1</Label>
                  <Input value={trait1P1} onChange={e => setTrait1P1(e.target.value)} placeholder="Aa" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Parent 1 Trait 2</Label>
                  <Input value={trait2P1} onChange={e => setTrait2P1(e.target.value)} placeholder="Bb" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Parent 2 Trait 1</Label>
                  <Input value={trait1P2} onChange={e => setTrait1P2(e.target.value)} placeholder="Aa" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Parent 2 Trait 2</Label>
                  <Input value={trait2P2} onChange={e => setTrait2P2(e.target.value)} placeholder="Bb" className="h-8 text-sm" />
                </div>
              </div>
              {dihybridGrid && (
                <>
                  <div className="flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {trait1P1}{trait2P1} × {trait1P2}{trait2P2}
                  </div>
                  <div className="overflow-x-auto">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16 h-6 text-[10px] p-0"></TableHead>
                          {dihybridGrid.gametes1.map((g, i) => (
                            <TableHead key={i} className="h-6 text-[10px] text-center p-0 font-bold text-emerald-700">{g}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dihybridGrid.grid.map((row, r) => (
                          <TableRow key={r}>
                            <TableCell className="font-bold text-[10px] text-center p-0 text-emerald-700">
                              {dihybridGrid.gametes2[r]}
                            </TableCell>
                            {row.map((cell, c) => (
                              <TableCell
                                key={c}
                                className={`text-center text-[10px] font-mono font-semibold p-0.5 h-8 ${
                                  cell.isDominant
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {cell.genotype}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </>
          )}

          {/* Ratios */}
          <div className="rounded-lg bg-gray-50 p-3 space-y-1 border">
            <div className="text-xs font-semibold text-gray-600">Ratios</div>
            <div className="text-xs text-gray-700">
              <span className="font-medium">Genotype:</span> {ratios.genotype || '—'}
            </div>
            <div className="text-xs text-gray-700">
              <span className="font-medium">Phenotype:</span> {ratios.phenotype || '—'}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-300" />
              <span className="text-gray-600">Dominant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />
              <span className="text-gray-600">Recessive</span>
            </div>
          </div>

          <Button onClick={addToBoard} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-1.5" /> Add to Board
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
