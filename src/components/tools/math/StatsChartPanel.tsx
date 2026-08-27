'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Editor } from '@tldraw/tldraw';
import { X, BarChart3, Plus, Trash2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface StatsChartPanelProps {
  editor: unknown;
  onClose?: () => void;
}

interface DataRow {
  id: string;
  label: string;
  value: number;
}

function calcMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function calcMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calcMode(values: number[]): number | null {
  if (values.length === 0) return null;
  const freq = new Map<number, number>();
  values.forEach(v => freq.set(v, (freq.get(v) || 0) + 1));
  let maxFreq = 0;
  let mode: number | null = null;
  freq.forEach((count, val) => {
    if (count > maxFreq) { maxFreq = count; mode = val; }
  });
  return maxFreq > 1 ? mode : null;
}

function calcRange(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values) - Math.min(...values);
}

const CHART_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

export default function StatsChartPanel({ editor, onClose }: StatsChartPanelProps) {
  const [rows, setRows] = useState<DataRow[]>([
    { id: 'r1', label: 'A', value: 12 },
    { id: 'r2', label: 'B', value: 28 },
    { id: 'r3', label: 'C', value: 19 },
    { id: 'r4', label: 'D', value: 35 },
  ]);
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');

  const values = useMemo(() => rows.map(r => r.value), [rows]);
  const mean = useMemo(() => calcMean(values), [values]);
  const median = useMemo(() => calcMedian(values), [values]);
  const mode = useMemo(() => calcMode(values), [values]);
  const range = useMemo(() => calcRange(values), [values]);

  const maxVal = useMemo(() => Math.max(...values, 1), [values]);
  const chartW = 340;
  const chartH = 160;
  const barW = Math.max(20, Math.min(60, (chartW - 40) / rows.length - 8));

  const addRow = useCallback(() => {
    if (!newLabel.trim()) return;
    setRows(prev => [...prev, { id: `r-${Date.now()}` as any, label: newLabel.trim(), value: parseFloat(newValue) || 0 }]);
    setNewLabel('');
    setNewValue('');
  }, [newLabel, newValue]);

  const removeRow = useCallback((id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateRow = useCallback((id: string, field: 'label' | 'value', val: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: field === 'value' ? parseFloat(val) || 0 : val } : r));
  }, []);

  const addToBoard = useCallback(() => {
    const ed = editor as Editor | null;
    if (!ed || rows.length === 0) return;
    const center = ed.getCurrentPageBounds()?.center || { x: 400, y: 300 };
    const startX = center.x - 180;
    const startY = center.y - 120;
    const shapes: any[] = [];

    // Title
    shapes.push({
      id: `shape:sc-title-${Date.now()}` as any,
      type: 'text' as const,
      x: startX,
      y: startY - 30,
      props: { text: 'Data & Statistics', size: 'l', font: 'sans' },
    });

    // Stats summary
    shapes.push({
      id: `shape:sc-stats-${Date.now()}` as any,
      type: 'text' as const,
      x: startX,
      y: startY - 10,
      props: {
        text: `Mean: ${mean.toFixed(2)}  |  Median: ${median.toFixed(2)}  |  Mode: ${mode !== null ? mode : 'none'}  |  Range: ${range}`,
        size: 's', font: 'mono', color: '#6b7280',
      },
    });

    // Chart bars
    const barW = 40;
    const maxVal = Math.max(...values, 1);
    rows.forEach((row, i) => {
      const h = (row.value / maxVal) * 140;
      const x = startX + i * (barW + 12);
      const y = startY + 160 - h;

      shapes.push({
        id: `shape:sc-bar-${row.id}-${Date.now()}` as any,
        type: 'geo' as const,
        x, y,
        props: { geo: 'rectangle', w: barW, h, color: CHART_COLORS[i % CHART_COLORS.length], fill: 'solid' },
      });
      shapes.push({
        id: `shape:sc-bar-label-${row.id}-${Date.now()}` as any,
        type: 'text' as const,
        x, y: startY + 165,
        props: { text: row.label, size: 'xs', font: 'sans' },
      });
      shapes.push({
        id: `shape:sc-bar-val-${row.id}-${Date.now()}` as any,
        type: 'text' as const,
        x: x + 5, y: y - 15,
        props: { text: String(row.value), size: 's', font: 'mono' },
      });
    });

    // Baseline
    shapes.push({
      id: `shape:sc-baseline-${Date.now()}` as any,
      type: 'line' as const,
      x: startX,
      y: startY + 160,
      props: { points: [{ x: 0, y: 0 }, { x: rows.length * (barW + 12), y: 0 }], color: '#374151', size: 'm' },
    });

    ed.createShapes(shapes);
  }, [editor, rows, values, mean, median, mode, range]);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 80,
    right: 20,
    zIndex: 1001,
    width: 460,
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto',
  };

  return (
    <div style={panelStyle}>
      <Card className="shadow-xl border-2 border-orange-200 bg-white/97 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-orange-700 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Statistics & Charts
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 mt-1">
            <Badge variant={chartType === 'bar' ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => setChartType('bar')}>
              <BarChart3 className="w-3 h-3 mr-1" /> Bar
            </Badge>
            <Badge variant={chartType === 'line' ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => setChartType('line')}>
              <TrendingUp className="w-3 h-3 mr-1" /> Line
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Stats summary */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Mean', value: mean.toFixed(2), color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'Median', value: median.toFixed(2), color: 'bg-green-50 text-green-700 border-green-200' },
              { label: 'Mode', value: mode !== null ? String(mode) : 'None', color: 'bg-purple-50 text-purple-700 border-purple-200' },
              { label: 'Range', value: String(range), color: 'bg-amber-50 text-amber-700 border-amber-200' },
            ].map(stat => (
              <div key={stat.label} className={`rounded-md p-2 text-center border ${stat.color}`}>
                <div className="text-[9px] font-medium opacity-70">{stat.label}</div>
                <div className="text-sm font-bold font-mono">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Chart SVG */}
          <div className="rounded-lg bg-gray-50 p-3 border">
            <svg viewBox={`0 0 ${chartW} ${chartH + 20}`} className="w-full">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = chartH - pct * chartH + 10;
                return (
                  <g key={i}>
                    <line x1="30" y1={y} x2={chartW} y2={y} stroke="#f3f4f6" strokeWidth={1} />
                    <text x="25" y={y + 3} textAnchor="end" className="text-[7px] fill-gray-400">
                      {Math.round(pct * maxVal)}
                    </text>
                  </g>
                );
              })}

              {chartType === 'bar' ? (
                // Bar chart
                rows.map((row, i) => {
                  const x = 35 + i * ((chartW - 45) / rows.length);
                  const bw = (chartW - 45) / rows.length - 6;
                  const bh = (row.value / maxVal) * chartH;
                  const by = chartH - bh + 10;
                  return (
                    <g key={row.id}>
                      <rect x={x} y={by} width={bw} height={bh} rx={2} fill={CHART_COLORS[i % CHART_COLORS.length]} opacity={0.85} />
                      <text x={x + bw / 2} y={by - 4} textAnchor="middle" className="text-[8px] fill-gray-700 font-bold">{row.value}</text>
                      <text x={x + bw / 2} y={chartH + 18} textAnchor="middle" className="text-[8px] fill-gray-500">{row.label}</text>
                    </g>
                  );
                })
              ) : (
                // Line chart
                <>
                  <polyline
                    points={rows.map((row, i) => {
                      const x = 35 + i * ((chartW - 45) / (rows.length - 1 || 1)) + ((chartW - 45) / (rows.length - 1 || 1)) / 2;
                      const y = chartH - (row.value / maxVal) * chartH + 10;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none" stroke="#3b82f6" strokeWidth={2}
                  />
                  {rows.map((row, i) => {
                    const x = 35 + i * ((chartW - 45) / (rows.length - 1 || 1)) + ((chartW - 45) / (rows.length - 1 || 1)) / 2;
                    const y = chartH - (row.value / maxVal) * chartH + 10;
                    return (
                      <g key={row.id}>
                        <circle cx={x} cy={y} r={4} fill="#3b82f6" stroke="white" strokeWidth={2} />
                        <text x={x} y={y - 8} textAnchor="middle" className="text-[8px] fill-gray-700 font-bold">{row.value}</text>
                        <text x={x} y={chartH + 18} textAnchor="middle" className="text-[8px] fill-gray-500">{row.label}</text>
                      </g>
                    );
                  })}
                </>
              )}
            </svg>
          </div>

          {/* Data table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs h-8 w-20">Label</TableHead>
                <TableHead className="text-xs h-8">Value</TableHead>
                <TableHead className="text-xs h-8 w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="p-1">
                    <Input value={row.label} onChange={e => updateRow(row.id, 'label', e.target.value)} className="h-7 text-xs" />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input type="number" value={row.value} onChange={e => updateRow(row.id, 'value', e.target.value)} className="h-7 text-xs font-mono" />
                  </TableCell>
                  <TableCell className="p-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRow(row.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="p-1">
                  <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Label" className="h-7 text-xs" />
                </TableCell>
                <TableCell className="p-1">
                  <Input type="number" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Value" className="h-7 text-xs font-mono" />
                </TableCell>
                <TableCell className="p-1">
                  <Button onClick={addRow} disabled={!newLabel.trim()} size="icon" className="h-6 w-6 bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Button onClick={addToBoard} disabled={rows.length === 0} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
            <Plus className="w-4 h-4 mr-1.5" /> Add to Board
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
