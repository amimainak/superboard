'use client';

import React, { useState, useCallback, useMemo } from 'react';
// Editor type was from @tldraw/tldraw which is no longer installed — using a generic type
type Editor = { getAllShapes: () => unknown[]; getCamera: () => { x: number; y: number; z: number }; setCamera: (x: number, y: number, z: number) => void; getCurrentPageBounds: () => { x: number; y: number; w: number; h: number; center: { x: number; y: number } } | null; createShapes: (shapes: unknown[]) => void; };
import { X, Ruler, Plus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UnitConverterProps {
  editor: unknown;
  onClose?: () => void;
}

interface UnitDef {
  label: string;
  short: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

const CATEGORIES: Record<string, { label: string; base: string; units: Record<string, UnitDef> }> = {
  length: {
    label: 'Length',
    base: 'm',
    units: {
      mm: { label: 'Millimeter', short: 'mm', toBase: v => v / 1000, fromBase: v => v * 1000 },
      cm: { label: 'Centimeter', short: 'cm', toBase: v => v / 100, fromBase: v => v * 100 },
      m: { label: 'Meter', short: 'm', toBase: v => v, fromBase: v => v },
      km: { label: 'Kilometer', short: 'km', toBase: v => v * 1000, fromBase: v => v / 1000 },
      in: { label: 'Inch', short: 'in', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
      ft: { label: 'Foot', short: 'ft', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
      yd: { label: 'Yard', short: 'yd', toBase: v => v * 0.9144, fromBase: v => v / 0.9144 },
      mi: { label: 'Mile', short: 'mi', toBase: v => v * 1609.344, fromBase: v => v / 1609.344 },
    },
  },
  weight: {
    label: 'Weight',
    base: 'kg',
    units: {
      mg: { label: 'Milligram', short: 'mg', toBase: v => v / 1e6, fromBase: v => v * 1e6 },
      g: { label: 'Gram', short: 'g', toBase: v => v / 1000, fromBase: v => v * 1000 },
      kg: { label: 'Kilogram', short: 'kg', toBase: v => v, fromBase: v => v },
      lb: { label: 'Pound', short: 'lb', toBase: v => v * 0.453592, fromBase: v => v / 0.453592 },
      oz: { label: 'Ounce', short: 'oz', toBase: v => v * 0.0283495, fromBase: v => v / 0.0283495 },
      ton: { label: 'Metric Ton', short: 't', toBase: v => v * 1000, fromBase: v => v / 1000 },
    },
  },
  volume: {
    label: 'Volume',
    base: 'L',
    units: {
      mL: { label: 'Milliliter', short: 'mL', toBase: v => v / 1000, fromBase: v => v * 1000 },
      L: { label: 'Liter', short: 'L', toBase: v => v, fromBase: v => v },
      gal: { label: 'Gallon (US)', short: 'gal', toBase: v => v * 3.78541, fromBase: v => v / 3.78541 },
      qt: { label: 'Quart', short: 'qt', toBase: v => v * 0.946353, fromBase: v => v / 0.946353 },
      cup: { label: 'Cup', short: 'cup', toBase: v => v * 0.236588, fromBase: v => v / 0.236588 },
      floz: { label: 'Fluid Ounce', short: 'fl oz', toBase: v => v * 0.0295735, fromBase: v => v / 0.0295735 },
    },
  },
  temperature: {
    label: 'Temperature',
    base: 'C',
    units: {
      C: { label: 'Celsius', short: '°C', toBase: v => v, fromBase: v => v },
      F: { label: 'Fahrenheit', short: '°F', toBase: v => (v - 32) * (5 / 9), fromBase: v => v * (9 / 5) + 32 },
      K: { label: 'Kelvin', short: 'K', toBase: v => v - 273.15, fromBase: v => v + 273.15 },
    },
  },
};

type CategoryKey = keyof typeof CATEGORIES;

export default function UnitConverter({ editor, onClose }: UnitConverterProps) {
  const [category, setCategory] = useState<CategoryKey>('length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('ft');
  const [value, setValue] = useState('1');
  const [animProgress, setAnimProgress] = useState(0);

  const convert = useCallback((val: number, from: string, to: string, cat: CategoryKey): number => {
    if (cat === 'temperature') {
      const baseVal = CATEGORIES.temperature.units[from].toBase(val);
      return CATEGORIES.temperature.units[to].fromBase(baseVal);
    }
    const baseVal = CATEGORIES[cat].units[from].toBase(val);
    return CATEGORIES[cat].units[to].fromBase(baseVal);
  }, []);

  const convertedValue = useMemo(() => {
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return convert(num, fromUnit, toUnit, category);
  }, [value, fromUnit, toUnit, category, convert]);

  const handleCategoryChange = useCallback((cat: CategoryKey) => {
    setCategory(cat);
    const unitKeys = Object.keys(CATEGORIES[cat].units);
    setFromUnit(unitKeys[0]);
    setToUnit(unitKeys.length > 1 ? unitKeys[1] : unitKeys[0]);
    setAnimProgress(0);
    // Trigger animation
    requestAnimationFrame(() => setAnimProgress(1));
  }, []);

  const handleSwap = useCallback(() => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    if (convertedValue !== null) {
      setValue(convertedValue.toFixed(6).replace(/\.?0+$/, ''));
    }
  }, [toUnit, fromUnit, convertedValue, convert]);

  // Number line scale
  const numberLineScale = useMemo(() => {
    if (convertedValue === null || !parseFloat(value)) return { from: 0, to: 1, ticks: [] };
    const num = Math.abs(parseFloat(value));
    const conv = Math.abs(convertedValue);
    const max = Math.max(num, conv) * 1.2;
    const min = 0;
    const step = max <= 10 ? 1 : max <= 100 ? 10 : max <= 1000 ? 100 : Math.pow(10, Math.floor(Math.log10(max)));
    const ticks: number[] = [];
    for (let t = min; t <= max; t += step) ticks.push(t);
    return { from: min, to: max, ticks };
  }, [value, convertedValue, convert]);

  const addToBoard = useCallback(() => {
    const ed = editor as Editor | null;
    if (!ed || convertedValue === null) return;
    const bounds = ed.getCurrentPageBounds();
    const center = bounds ? { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h / 2 } : { x: 400, y: 300 };
    const shapes: any[] = [];

    const fromDef = CATEGORIES[category].units[fromUnit];
    const toDef = CATEGORIES[category].units[toUnit];

    shapes.push({
      id: `shape:uc-title-${Date.now()}` as any,
      type: 'text' as const,
      x: center.x - 150,
      y: center.y - 60,
      props: { text: `Unit Conversion: ${value} ${fromDef.short} = ${convertedValue.toFixed(4)} ${toDef.short}`, size: 'l', font: 'sans' },
    });

    // Number line
    const nlY = center.y;
    const nlStartX = center.x - 200;
    const nlW = 400;
    shapes.push({
      id: `shape:uc-nl-${Date.now()}` as any,
      type: 'line' as const,
      x: nlStartX,
      y: nlY,
      props: { points: [{ x: 0, y: 0 }, { x: nlW, y: 0 }], color: '#374151', size: 'm' },
    });

    const num = parseFloat(value);
    const conv = convertedValue;
    const maxVal = Math.max(Math.abs(num), Math.abs(conv)) * 1.2;
    if (maxVal > 0) {
      // From value marker
      const fromX = nlStartX + (Math.abs(num) / maxVal) * nlW;
      shapes.push({
        id: `shape:uc-from-mark-${Date.now()}` as any,
        type: 'ellipse' as const,
        x: fromX - 5,
        y: nlY - 5,
        props: { w: 10, h: 10, color: '#3b82f6', fill: 'solid' },
      });
      shapes.push({
        id: `shape:uc-from-label-${Date.now()}` as any,
        type: 'text' as const,
        x: fromX - 20,
        y: nlY + 10,
        props: { text: `${value} ${fromDef.short}`, size: 's', font: 'sans', color: '#3b82f6' },
      });

      // To value marker
      const toX = nlStartX + (Math.abs(conv) / maxVal) * nlW;
      shapes.push({
        id: `shape:uc-to-mark-${Date.now()}` as any,
        type: 'ellipse' as const,
        x: toX - 5,
        y: nlY - 5,
        props: { w: 10, h: 10, color: '#059669', fill: 'solid' },
      });
      shapes.push({
        id: `shape:uc-to-label-${Date.now()}` as any,
        type: 'text' as const,
        x: toX - 30,
        y: nlY + 10,
        props: { text: `${conv.toFixed(2)} ${toDef.short}`, size: 's', font: 'sans', color: '#059669' },
      });
    }

    ed.createShapes(shapes);
  }, [editor, value, fromUnit, toUnit, category, convertedValue]);

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
      <Card className="shadow-xl border-2 border-teal-200 bg-white/97 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-teal-700 flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Unit Converter
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          {/* Category selector */}
          <div className="flex gap-1.5 mt-2">
            {(Object.keys(CATEGORIES) as CategoryKey[]).map(cat => (
              <Badge
                key={cat}
                variant={category === cat ? 'default' : 'outline'}
                className="cursor-pointer text-xs flex-1 justify-center"
                onClick={() => handleCategoryChange(cat)}
              >
                {CATEGORIES[cat].label}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Conversion inputs */}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs font-medium">Value</Label>
              <Input
                type="number"
                value={value}
                onChange={e => { setValue(e.target.value); setAnimProgress(0); requestAnimationFrame(() => setAnimProgress(1)); }}
                className="h-10 text-lg font-mono text-center"
              />
            </div>
            <div className="w-28 space-y-1">
              <Label className="text-xs font-medium">From</Label>
              <Select value={fromUnit} onValueChange={v => { setFromUnit(v); setAnimProgress(0); requestAnimationFrame(() => setAnimProgress(1)); }}>
                <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES[category].units).map(([key, def]) => (
                    <SelectItem key={key} value={key}>{def.short} — {def.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Swap button */}
          <div className="flex justify-center">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-teal-300" onClick={handleSwap}>
              <ArrowRight className="w-4 h-4 text-teal-600" style={{ transform: 'rotate(90deg)' }} />
            </Button>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs font-medium">Result</Label>
              <div className="h-10 rounded-md border bg-gray-50 flex items-center justify-center text-lg font-mono font-bold text-teal-700">
                {convertedValue !== null ? convertedValue.toFixed(6).replace(/\.?0+$/, '') : '—'}
              </div>
            </div>
            <div className="w-28 space-y-1">
              <Label className="text-xs font-medium">To</Label>
              <Select value={toUnit} onValueChange={v => { setToUnit(v); setAnimProgress(0); requestAnimationFrame(() => setAnimProgress(1)); }}>
                <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORIES[category].units).map(([key, def]) => (
                    <SelectItem key={key} value={key}>{def.short} — {def.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Number line visualization */}
          {convertedValue !== null && parseFloat(value) !== 0 && (
            <div className="rounded-lg bg-gray-50 p-3 border">
              <div className="text-[10px] font-semibold text-gray-500 mb-2">Number Line</div>
              <svg viewBox="0 0 380 60" className="w-full">
                {/* Base line */}
                <line x1="10" y1="25" x2="370" y2="25" stroke="#9ca3af" strokeWidth={1.5} />
                {/* Tick marks */}
                {numberLineScale.ticks.map((t, i) => {
                  const x = 10 + (t / numberLineScale.to) * 360;
                  return (
                    <g key={i}>
                      <line x1={x} y1="20" x2={x} y2="30" stroke="#d1d5db" strokeWidth={1} />
                      <text x={x} y="42" textAnchor="middle" className="text-[7px] fill-gray-400">{t}</text>
                    </g>
                  );
                })}
                {/* From value */}
                {(() => {
                  const num = Math.abs(parseFloat(value));
                  const x = 10 + (num / numberLineScale.to) * 360;
                  return (
                    <g>
                      <circle cx={x} cy="25" r="5" fill="#3b82f6" />
                      <text x={x} y="14" textAnchor="middle" className="text-[8px] fill-blue-600 font-bold">{value}</text>
                    </g>
                  );
                })()}
                {/* To value */}
                {(() => {
                  const conv = Math.abs(convertedValue);
                  const x = 10 + (conv / numberLineScale.to) * 360;
                  return (
                    <g>
                      <circle cx={x} cy="25" r="5" fill="#059669" />
                      <text x={x} y="14" textAnchor="middle" className="text-[8px] fill-emerald-600 font-bold">{convertedValue.toFixed(2)}</text>
                    </g>
                  );
                })()}
              </svg>
            </div>
          )}

          {/* All conversions table */}
          {convertedValue !== null && (
            <div className="rounded-lg bg-gray-50 p-3 border">
              <div className="text-[10px] font-semibold text-gray-500 mb-1">Quick Reference</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px]">
                {Object.entries(CATEGORIES[category].units).map(([key, def]) => {
                  const val = convert(parseFloat(value) || 0, fromUnit, key, category);
                  return (
                    <div key={key} className={`flex justify-between ${key === toUnit ? 'font-bold text-teal-700' : 'text-gray-600'}`}>
                      <span>{def.short}</span>
                      <span>{val.toFixed(4).replace(/\.?0+$/, '')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button onClick={addToBoard} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
            <Plus className="w-4 h-4 mr-1.5" /> Add to Board
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
