'use client';
import React, { useState, useRef, useCallback, useMemo } from 'react';

/* ------------------------------------------------------------------
   NumberLineEnhanced – Interactive number line for K-5
   • Place / drag / delete colored dots on 0–N number line
   • Add forward (+2,+3,+5,+10) or backward jump arcs
   • Works in dark and light modes
   ------------------------------------------------------------------ */

// ---------- types ----------
interface Dot {
  id: number;
  value: number;
  color: string;
}

interface Jump {
  id: number;
  from: number;
  to: number;
  color: string;
}

// ---------- constants ----------
const DOT_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const JUMP_SIZES = [2, 3, 5, 10] as const;
const JUMP_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

// Layout constants for the SVG number line
const SVG_W = 780;
const SVG_H = 280;
const PAD_X = 40;
const LINE_Y = 170;

export function NumberLineEnhanced({ isDark }: { isDark: boolean }) {
  // State
  const [dots, setDots] = useState<Dot[]>([]);
  const [jumps, setJumps] = useState<Jump[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [range, setRange] = useState(20);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const idCounter = useRef(0);
  const svgRef = useRef<SVGSVGElement>(null);

  // Theme helpers
  const bg = isDark ? '#0f172a' : '#ffffff';
  const text = isDark ? '#e2e8f0' : '#1e293b';
  const muted = isDark ? '#64748b' : '#94a3b8';
  const cardBg = isDark ? '#1e293b' : '#f8fafc';
  const border = isDark ? '#334155' : '#e2e8f0';

  // Scale a number value to SVG x-coordinate
  const xScale = useCallback((v: number) => PAD_X + (v / range) * (SVG_W - PAD_X * 2), [range]);

  // Inverse: SVG x → number value
  const xInverse = useCallback((x: number) => Math.round(((x - PAD_X) / (SVG_W - PAD_X * 2)) * range), [range]);

  // Clamp helper
  const clamp = useCallback((v: number) => Math.max(0, Math.min(range, v)), [range]);

  // ---- Place a dot when clicking on the number line ----
  const handleLineClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingId !== null) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * SVG_W;
    const val = clamp(xInverse(svgX));
    if (val < 0 || val > range) return;
    const color = DOT_COLORS[idCounter.current % DOT_COLORS.length];
    idCounter.current += 1;
    setDots((prev) => [...prev, { id: idCounter.current, value: val, color }]);
    setSelectedId(idCounter.current);
  }, [clamp, draggingId, range, xInverse]);

  // ---- Dot hit-test ----
  const dotAt = useCallback((clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const svgX = ((clientX - rect.left) / rect.width) * SVG_W;
    for (let i = dots.length - 1; i >= 0; i--) {
      if (Math.abs(xScale(dots[i].value) - svgX) < 12) return dots[i];
    }
    return null;
  }, [dots, xScale]);

  // ---- Drag start on a dot ----
  const handleDotDown = useCallback((e: React.MouseEvent, dot: Dot) => {
    e.stopPropagation();
    setSelectedId(dot.id);
    setDraggingId(dot.id);
  }, []);

  // ---- Drag move ----
  const handleSvgMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingId === null) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * SVG_W;
    const val = clamp(xInverse(svgX));
    setDots((prev) => prev.map((d) => (d.id === draggingId ? { ...d, value: val } : d)));
  }, [clamp, draggingId, xInverse]);

  // ---- Drag end ----
  const handleSvgUp = useCallback(() => setDraggingId(null), []);

  // ---- Keyboard delete ----
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId !== null) {
          setDots((prev) => prev.filter((d) => d.id !== selectedId));
          setSelectedId(null);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId]);

  // ---- Add a jump from the last dot (or 0) ----
  const addJump = useCallback((size: number, backward: boolean) => {
    const fromDot = dots.length > 0 ? dots[dots.length - 1] : null;
    const from = fromDot ? fromDot.value : 0;
    const to = backward ? clamp(from - size) : clamp(from + size);
    if (to === from) return;
    const idx = JUMP_SIZES.indexOf(size as typeof JUMP_SIZES[number]);
    const color = JUMP_COLORS[idx >= 0 ? idx : 0];
    idCounter.current += 1;
    setJumps((prev) => [...prev, { id: idCounter.current, from, to, color }]);
    // Also place a dot at the landing
    const dotColor = DOT_COLORS[idCounter.current % DOT_COLORS.length];
    idCounter.current += 1;
    setDots((prev) => [...prev, { id: idCounter.current, value: to, color: dotColor }]);
    setSelectedId(idCounter.current);
  }, [clamp, dots]);

  // ---- Clear all ----
  const clearAll = useCallback(() => {
    setDots([]);
    setJumps([]);
    setSelectedId(null);
  }, []);

  // ---- Build jump arc SVG path ----
  const jumpPath = useCallback((j: Jump) => {
    const x1 = xScale(j.from);
    const x2 = xScale(j.to);
    const isBackward = j.to < j.from;
    const h = 40;
    const dir = isBackward ? 1 : -1;
    // Cubic bezier arc
    return `M ${x1} ${LINE_Y} C ${x1} ${LINE_Y + dir * h}, ${x2} ${LINE_Y + dir * h}, ${x2} ${LINE_Y}`;
  }, [xScale]);

  // Memoize tick marks
  const ticks = useMemo(() => {
    const step = range <= 10 ? 1 : range <= 50 ? 2 : 5;
    const arr: { v: number; x: number }[] = [];
    for (let v = 0; v <= range; v += step) arr.push({ v, x: xScale(v) });
    return arr;
  }, [range, xScale]);

  // ---- Render ----
  return (
    <div style={{ background: bg, color: text, padding: 16, borderRadius: 12, fontFamily: 'system-ui, sans-serif', minHeight: 420 }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>🔢 Number Line</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: muted }}>Range:</span>
          {[10, 20, 50, 100].map((r) => (
            <button key={r} onClick={() => { setRange(r); setDots([]); setJumps([]); setSelectedId(null); }}
              style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, border: `1px solid ${border}`, background: range === r ? (isDark ? '#3b82f6' : '#dbeafe') : cardBg, color: text, cursor: 'pointer' }}>
              0–{r}
            </button>
          ))}
        </div>
      </div>

      {/* SVG number line */}
      <svg ref={svgRef} width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ background: cardBg, borderRadius: 10, border: `1px solid ${border}`, display: 'block', cursor: draggingId !== null ? 'grabbing' : 'crosshair', userSelect: 'none' }}
        onClick={handleLineClick} onMouseMove={handleSvgMove} onMouseUp={handleSvgUp} onMouseLeave={handleSvgUp}>

        {/* Main line */}
        <line x1={PAD_X - 10} y1={LINE_Y} x2={SVG_W - PAD_X + 10} y2={LINE_Y} stroke={muted} strokeWidth={2} />

        {/* Tick marks & labels */}
        {ticks.map((t) => (
          <g key={t.v}>
            <line x1={t.x} y1={LINE_Y - 8} x2={t.x} y2={LINE_Y + 8} stroke={muted} strokeWidth={1.5} />
            <text x={t.x} y={LINE_Y + 24} textAnchor="middle" fill={text} fontSize={12} fontFamily="system-ui">{t.v}</text>
          </g>
        ))}

        {/* Jump arcs */}
        {jumps.map((j) => {
          const isBackward = j.to < j.from;
          const mid = (xScale(j.from) + xScale(j.to)) / 2;
          const labelY = isBackward ? LINE_Y + 58 : LINE_Y - 20;
          return (
            <g key={j.id}>
              <path d={jumpPath(j)} fill="none" stroke={j.color} strokeWidth={2.5} strokeDasharray="6 3" />
              {/* Arrow head at end */}
              <circle cx={xScale(j.to)} cy={LINE_Y} r={4} fill={j.color} opacity={0.5} />
              {/* Jump label */}
              <text x={mid} y={labelY} textAnchor="middle" fill={j.color} fontSize={13} fontWeight={700} fontFamily="system-ui">
                {j.to > j.from ? '+' : ''}{j.to - j.from}
              </text>
            </g>
          );
        })}

        {/* Dots */}
        {dots.map((d) => (
          <g key={d.id}>
            {/* Selection ring */}
            {selectedId === d.id && <circle cx={xScale(d.value)} cy={LINE_Y} r={12} fill="none" stroke={d.color} strokeWidth={2} strokeDasharray="3 2" />}
            <circle cx={xScale(d.value)} cy={LINE_Y} r={8} fill={d.color} stroke={isDark ? '#0f172a' : '#fff'} strokeWidth={2}
              style={{ cursor: 'grab', filter: draggingId === d.id ? 'drop-shadow(0 2px 4px rgba(0,0,0,.4))' : 'none' }}
              onMouseDown={(e) => handleDotDown(e, d)} />
            {/* Value label on dot */}
            <text x={xScale(d.value)} y={LINE_Y - 18} textAnchor="middle" fill={d.color} fontSize={11} fontWeight={700} fontFamily="system-ui">{d.value}</text>
          </g>
        ))}
      </svg>

      {/* Jump buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: muted, marginRight: 2 }}>Jumps:</span>
        {JUMP_SIZES.map((size, i) => (
          <React.Fragment key={size}>
            <button onClick={() => addJump(size, false)}
              style={{ padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', background: JUMP_COLORS[i], color: '#fff', cursor: 'pointer' }}>
              +{size}
            </button>
            <button onClick={() => addJump(size, true)}
              style={{ padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: `1px solid ${JUMP_COLORS[i]}`, background: 'transparent', color: JUMP_COLORS[i], cursor: 'pointer' }}>
              –{size}
            </button>
          </React.Fragment>
        ))}
        <button onClick={clearAll}
          style={{ marginLeft: 'auto', padding: '4px 14px', borderRadius: 8, fontSize: 12, border: `1px solid ${border}`, background: cardBg, color: muted, cursor: 'pointer' }}>
          Clear All
        </button>
      </div>

      {/* Hint */}
      <p style={{ margin: '8px 0 0', fontSize: 11, color: muted }}>Click line to place a dot · Drag dots to move · Select + Delete to remove</p>
    </div>
  );
}
