// ============================================================
// GeoGebraPanel — GeoGebra Integration Panel
// ============================================================
// Lazy loaded with next/dynamic and ssr: false.
// Slides out from the right using shadcn Sheet.
// Contains a div with id="geogebra-applet" where the GeoGebra applet mounts.
// Includes function input, parameter sliders (a, b, c), and a Plot button.
// ============================================================

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GraduationCap,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildGeoGebraCommand, type GeoGebraCommand } from '@/lib/geogebra';

// ---- Types ----

export interface GeoGebraPanelProps {
  /** Controls whether the panel is open */
  open: boolean;
  /** Callback when panel should close */
  onOpenChange: (open: boolean) => void;
}

interface PlottedItem {
  id: string;
  expression: string;
  label: string;
  color: string;
}

// ---- Constants ----

const PLOT_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

const PRESET_FUNCTIONS = [
  { label: 'Quadratic', template: 'a*x^2 + b*x + c' },
  { label: 'Cubic', template: 'a*x^3 + b*x^2 + c*x + d' },
  { label: 'Sine', template: 'a*sin(b*x + c)' },
  { label: 'Cosine', template: 'a*cos(b*x + c)' },
  { label: 'Exponential', template: 'a*exp(b*x) + c' },
  { label: 'Logarithmic', template: 'a*ln(b*x) + c' },
  { label: 'Square Root', template: 'a*sqrt(b*x + c)' },
  { label: 'Absolute Value', template: 'a*abs(b*x + c)' },
  { label: 'Custom', template: '' },
];

// ============================================================
// Component
// ============================================================

export default function GeoGebraPanel({ open, onOpenChange }: GeoGebraPanelProps) {
  // ---- Applet state ----
  const appletRef = useRef<HTMLDivElement>(null);
  const [appletLoaded, setAppletLoaded] = useState(false);

  // ---- Function input ----
  const [expression, setExpression] = useState('a*x^2 + b*x + c');
  const [preset, setPreset] = useState('Quadratic');

  // ---- Parameter sliders (a, b, c, d) ----
  const [paramA, setParamA] = useState(1);
  const [paramB, setParamB] = useState(0);
  const [paramC, setParamC] = useState(0);
  const [paramD, setParamD] = useState(0);

  // ---- Plotted items history ----
  const [plottedItems, setPlottedItems] = useState<PlottedItem[]>([]);
  const [isPlotting, setIsPlotting] = useState(false);
  const colorIndexRef = useRef(0);

  // ---- Effect: Initialize GeoGebra applet when panel opens ----
  useEffect(() => {
    if (!open || !appletRef.current) return;

    // TODO: Initialize actual GeoGebra applet
    // The GeoGebra API requires loading the GeoGebra apps script:
    //
    // Option 1: GeoGebra Apps API (recommended)
    //   <script src="https://www.geogebra.org/apps/deployggb.js"></script>
    //   Then call:
    //   const ggbApp = new GGBApplet({
    //     appName: "graphing",
    //     width: containerWidth,
    //     height: containerHeight,
    //     showToolBar: false,
    //     showMenuBar: false,
    //     showAlgebraInput: true,
    //     showResetIcon: true,
    //     enableLabelDrags: true,
    //     enableShiftDragZoom: true,
    //     enableRightClick: true,
    //     showToolBarHelp: false,
    //     errorDialogsActive: false,
    //     useBrowserForJS: false,
    //     appletOnLoad: () => setAppletLoaded(true),
    //   }, true);
    //   ggbApp.inject('geogebra-applet');
    //
    // Option 2: GeoGebra Math Apps Embedding API
    //   Use <iframe> with material_id or direct URL
    //
    // For now, show a placeholder.
    // Simulate a brief load
    const timer = setTimeout(() => setAppletLoaded(true), 800);
    return () => clearTimeout(timer);
  }, [open]);

  // ---- Handle preset selection ----
  const handlePresetChange = useCallback((value: string) => {
    setPreset(value);
    const preset = PRESET_FUNCTIONS.find((p) => p.label === value);
    if (preset && preset.template) {
      setExpression(preset.template);
    }
  }, []);

  // ---- Build the final expression with current parameter values ----
  const buildFinalExpression = useCallback(() => {
    return expression
      .replace(/\ba\b/g, String(paramA))
      .replace(/\bb\b/g, String(paramB))
      .replace(/\bc\b/g, String(paramC))
      .replace(/\bd\b/g, String(paramD));
  }, [expression, paramA, paramB, paramC, paramD]);

  // ---- Plot button handler ----
  const handlePlot = useCallback(() => {
    if (!expression.trim()) return;

    setIsPlotting(true);
    const finalExpr = buildFinalExpression();
    const color = PLOT_COLORS[colorIndexRef.current % PLOT_COLORS.length];
    colorIndexRef.current += 1;

    const label = `f${plottedItems.length + 1}`;

    // Build GeoGebra command
    const command: GeoGebraCommand = {
      type: 'plot_function',
      expression: finalExpr,
      label,
      color,
    };

    // TODO: Execute via GeoGebra API
    // const applet = (window as any).ggbApplet;
    // if (applet) {
    //   applet.evalCommand(`${label}: ${finalExpr}`);
    //   applet.setColor(label, hexToRGB(color));
    //   applet.setLabelStyle(label, 1);
    // }

    const cmdStr = buildGeoGebraCommand(command);

    // Add to plotted items
    const newItem: PlottedItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      expression: finalExpr,
      label,
      color,
    };
    setPlottedItems((prev) => [...prev, newItem]);
    setIsPlotting(false);
  }, [expression, buildFinalExpression, plottedItems.length]);

  // ---- Clear all plots ----
  const handleClearAll = useCallback(() => {
    // TODO: Clear GeoGebra applet
    // const applet = (window as any).ggbApplet;
    // if (applet) {
    //   applet.setRepaintingActive(false);
    //   applet.clearAll();
    //   applet.setRepaintingActive(true);
    // }
    setPlottedItems([]);
    colorIndexRef.current = 0;
  }, []);

  // ---- Remove single plot ----
  const handleRemovePlot = useCallback((id: string) => {
    setPlottedItems((prev) => prev.filter((p) => p.id !== id));
    // TODO: Remove specific object from GeoGebra applet
    // const applet = (window as any).ggbApplet;
    // if (applet) {
    //   applet.deleteObject(label);
    // }
  }, []);

  // ---- Reset params ----
  const handleResetParams = useCallback(() => {
    setParamA(1);
    setParamB(0);
    setParamC(0);
    setParamD(0);
  }, []);

  // Determine which sliders are needed based on expression
  const needsParamA = /\ba\b/.test(expression);
  const needsParamB = /\bb\b/.test(expression);
  const needsParamC = /\bc\b/.test(expression);
  const needsParamD = /\bd\b/.test(expression);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-5 pt-5 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            GeoGebra Graphing
          </SheetTitle>
          <SheetDescription>
            Plot mathematical functions with interactive parameter sliders.
            Visualize equations for your students in real time.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="px-5 py-4 space-y-5">
            {/* ---- GeoGebra Applet Area ---- */}
            <div className="space-y-2">
              <Label>Graph View</Label>
              <div
                id="geogebra-applet"
                ref={appletRef}
                className={cn(
                  'w-full h-64 rounded-lg border bg-background overflow-hidden relative',
                  'flex items-center justify-center'
                )}
              >
                {!appletLoaded ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs">Loading GeoGebra...</span>
                  </div>
                ) : (
                  /*
                    TODO: Replace this placeholder with the actual GeoGebra applet.
                    Once the applet is injected, it will render inside this div.
                    The placeholder below shows a simple coordinate grid preview.
                  */
                  <div className="absolute inset-0">
                    {/* Grid background */}
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern
                          id="geogebra-grid"
                          width="40"
                          height="40"
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d="M 40 0 L 0 0 0 40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="0.5"
                            className="text-muted-foreground/20"
                          />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#geogebra-grid)" />
                      {/* Axes */}
                      <line
                        x1="50%" y1="0"
                        x2="50%" y2="100%"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-muted-foreground/40"
                      />
                      <line
                        x1="0" y1="50%"
                        x2="100%" y2="50%"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-muted-foreground/40"
                      />
                    </svg>

                    {/* Plotted function overlays (placeholder curves) */}
                    {plottedItems.map((item) => (
                      <div
                        key={item.id}
                        className="absolute top-2 left-3 flex items-center gap-1.5"
                      >
                        <span
                          className="w-3 h-0.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[10px] font-mono text-foreground/70">
                          {item.label}: {item.expression}
                        </span>
                      </div>
                    ))}

                    {/* Center placeholder label */}
                    {plottedItems.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground/50">
                          GeoGebra Applet Placeholder
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* ---- Function Input ---- */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="geogebra-preset">Function Preset</Label>
                <Select value={preset} onValueChange={handlePresetChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_FUNCTIONS.map((p) => (
                      <SelectItem key={p.label} value={p.label}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="geogebra-expression">
                  Function Expression{' '}
                  <span className="text-muted-foreground font-normal">(use a, b, c, d as parameters)</span>
                </Label>
                <Input
                  id="geogebra-expression"
                  value={expression}
                  onChange={(e) => {
                    setExpression(e.target.value);
                    // If custom expression, set preset to "Custom"
                    const matchPreset = PRESET_FUNCTIONS.find(
                      (p) => p.template === e.target.value && p.label !== 'Custom'
                    );
                    if (!matchPreset) setPreset('Custom');
                  }}
                  placeholder="e.g., a*x^2 + b*x + c"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <Separator />

            {/* ---- Parameter Sliders ---- */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Parameters</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={handleResetParams}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </div>

              {/* Parameter A */}
              {needsParamA && (
                <ParamSlider
                  label="a"
                  value={paramA}
                  onChange={setParamA}
                  min={-10}
                  max={10}
                  step={0.1}
                />
              )}

              {/* Parameter B */}
              {needsParamB && (
                <ParamSlider
                  label="b"
                  value={paramB}
                  onChange={setParamB}
                  min={-10}
                  max={10}
                  step={0.1}
                />
              )}

              {/* Parameter C */}
              {needsParamC && (
                <ParamSlider
                  label="c"
                  value={paramC}
                  onChange={setParamC}
                  min={-10}
                  max={10}
                  step={0.1}
                />
              )}

              {/* Parameter D */}
              {needsParamD && (
                <ParamSlider
                  label="d"
                  value={paramD}
                  onChange={setParamD}
                  min={-10}
                  max={10}
                  step={0.1}
                />
              )}

              {!needsParamA && !needsParamB && !needsParamC && !needsParamD && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No parameters detected. Use a, b, c, d in your expression to enable sliders.
                </p>
              )}
            </div>

            <Separator />

            {/* ---- Plot Actions ---- */}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handlePlot}
                disabled={isPlotting || !expression.trim()}
              >
                {isPlotting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Plotting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Plot Function
                  </>
                )}
              </Button>
              {plottedItems.length > 0 && (
                <Button variant="outline" onClick={handleClearAll}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>

            {/* ---- Plotted Items List ---- */}
            {plottedItems.length > 0 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  Plotted Functions ({plottedItems.length})
                </Label>
                <div className="space-y-1.5">
                  {plottedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2 group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-mono text-xs truncate">
                          {item.label}(x) = {item.expression}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemovePlot(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// Sub-components
// ============================================================

/** A labeled parameter slider row */
function ParamSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium font-mono">{label}</span>
        <span className="text-xs font-mono text-muted-foreground tabular-nums bg-muted px-1.5 py-0.5 rounded">
          {value.toFixed(1)}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/60">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
