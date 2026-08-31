'use client';
import React, { useState, useCallback, useMemo } from 'react';

/* ------------------------------------------------------------------
   FractionBarPanel – Fraction bar visualization for K-5
   • Horizontal bars split into equal parts
   • Click segments to shade (set numerator)
   • Shows equivalent fractions
   • Compare mode: two bars with <, =, >
   ------------------------------------------------------------------ */

const DENOMINATORS = [2, 3, 4, 5, 6, 8, 10, 12] as const;

// Color palette for shaded segments
const SHADE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

// Simplify a fraction using GCD
function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}
function simplify(n: number, d: number): [number, number] {
  if (n === 0) return [0, 1];
  const g = gcd(n, d);
  return [n / g, d / g];
}

// Build a single fraction bar
function FractionBar({
  numerator, denominator, onSegmentClick, isDark, barColor, height = 44
}: {
  numerator: number; denominator: number;
  onSegmentClick?: (idx: number) => void;
  isDark: boolean; barColor?: string; height?: number;
}) {
  const bg = isDark ? '#1e293b' : '#f1f5f9';
  const border = isDark ? '#334155' : '#cbd5e1';
  const shaded = barColor || SHADE_COLORS[0];
  const gap = 3;
  // Pre-compute label visibility to avoid <= in JSX (Turbopack parser compat)
  const showLabel = denominator < 9;

  return (
    <div style={{ display: 'flex', width: '100%', height, borderRadius: 8, overflow: 'hidden', border: `2px solid ${border}` }}>
      {Array.from({ length: denominator }).map((_, i) => (
        <div key={i} onClick={() => onSegmentClick?.(i)}
          style={{
            flex: 1,
            background: i < numerator ? shaded : bg,
            borderRight: i < denominator - 1 ? `${gap}px solid ${isDark ? '#0f172a' : '#ffffff'}` : 'none',
            cursor: onSegmentClick ? 'pointer' : 'default',
            transition: 'background 0.15s',
            position: 'relative',
          }}>
          {/* Tiny segment label */}
          {showLabel && (
            <span style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: i < numerator ? '#fff' : (isDark ? '#64748b' : '#94a3b8'), pointerEvents: 'none' }}>
              {'1/' + denominator}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export function FractionBarPanel({ isDark }: { isDark: boolean }) {
  // Theme
  const bg = isDark ? '#0f172a' : '#ffffff';
  const text = isDark ? '#e2e8f0' : '#1e293b';
  const muted = isDark ? '#64748b' : '#94a3b8';
  const cardBg = isDark ? '#1e293b' : '#f8fafc';
  const border = isDark ? '#334155' : '#e2e8f0';

  // Primary fraction state
  const [denominator, setDenominator] = useState(4);
  const [numerator, setNumerator] = useState(3);

  // Compare mode state
  const [compareMode, setCompareMode] = useState(false);
  const [denom2, setDenom2] = useState(8);
  const [num2, setNum2] = useState(5);

  // ---- Click a segment to shade/unshade ----
  const handleSegmentClick = useCallback((idx: number) => {
    // Toggle: if clicking a shaded segment, unshade from that index onward
    if (idx < numerator) {
      setNumerator(idx);
    } else {
      setNumerator(idx + 1);
    }
  }, [numerator]);

  const handleSegmentClick2 = useCallback((idx: number) => {
    if (idx < num2) {
      setNum2(idx);
    } else {
      setNum2(idx + 1);
    }
  }, [num2]);

  // ---- Clamp numerator when denominator changes ----
  const handleDenomChange = useCallback((d: number) => {
    setDenominator(d);
    setNumerator((prev) => Math.min(prev, d));
  }, []);
  const handleDenom2Change = useCallback((d: number) => {
    setDenom2(d);
    setNum2((prev) => Math.min(prev, d));
  }, []);

  // ---- Equivalent fractions ----
  const equivalents = useMemo(() => {
    if (numerator === 0) return [];
    const [sn, sd] = simplify(numerator, denominator);
    const result: [number, number][] = [];
    for (let m = 1; sd * m <= 12; m++) {
      if (sd * m === denominator) continue; // skip original
      result.push([sn * m, sd * m]);
    }
    return result;
  }, [numerator, denominator]);

  // ---- Comparison symbol ----
  const compareSymbol = useMemo((): string => {
    const left = numerator * denom2;
    const right = num2 * denominator;
    if (left < right) return '<';
    if (left > right) return '>';
    return '=';
  }, [numerator, denominator, num2, denom2]);

  // ---- Render ----
  return (
    <div style={{ background: bg, color: text, padding: 16, borderRadius: 12, fontFamily: 'system-ui, sans-serif', minHeight: 380 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>Fraction Bars</span>
        <button onClick={() => setCompareMode(!compareMode)}
          style={{ padding: '4px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: `1px solid ${border}`, background: compareMode ? (isDark ? '#3b82f6' : '#dbeafe') : cardBg, color: text, cursor: 'pointer' }}>
          {compareMode ? 'Exit Compare' : 'Compare'}
        </button>
      </div>

      {/* ========== PRIMARY FRACTION ========== */}
      {/* Large fraction display */}
      <div style={{ textAlign: 'center', margin: '8px 0 6px' }}>
        <span style={{ fontSize: 48, fontWeight: 800, color: SHADE_COLORS[0], lineHeight: 1 }}>
          {numerator}<span style={{ color: muted, fontWeight: 400 }}>/</span>{denominator}
        </span>
      </div>

      {/* Denominator selector */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: muted, alignSelf: 'center', marginRight: 4 }}>Parts:</span>
        {DENOMINATORS.map((d) => (
          <button key={d} onClick={() => handleDenomChange(d)}
            style={{ padding: '2px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: `1px solid ${border}`, background: denominator === d ? SHADE_COLORS[0] : cardBg, color: denominator === d ? '#fff' : text, cursor: 'pointer' }}>
            {d}
          </button>
        ))}
      </div>

      {/* Fraction bar */}
      <FractionBar numerator={numerator} denominator={denominator} onSegmentClick={handleSegmentClick} isDark={isDark} barColor={SHADE_COLORS[0]} />

      {/* Equivalent fractions row */}
      {equivalents.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <span style={{ fontSize: 11, color: muted, fontWeight: 600 }}>Equivalent fractions:</span>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{numerator}/{denominator}</span>
            <span style={{ color: muted }}>=</span>
            {equivalents.map(([n, d], i) => (
              <React.Fragment key={`${n}-${d}`}>
                <span style={{ fontSize: 15, fontWeight: 600, color: SHADE_COLORS[(i + 1) % SHADE_COLORS.length] }}>
                  {n}/{d}
                </span>
                {i < equivalents.length - 1 && <span style={{ color: muted }}>=</span>}
              </React.Fragment>
            ))}
          </div>
          {/* Mini equivalent bars */}
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {equivalents.slice(0, 3).map(([n, d], i) => (
              <div key={`bar-${n}-${d}`} style={{ flex: 1 }}>
                <FractionBar numerator={n} denominator={d} isDark={isDark} barColor={SHADE_COLORS[(i + 1) % SHADE_COLORS.length]} height={20} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== COMPARE MODE ========== */}
      {compareMode && (
        <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: cardBg, border: `1px solid ${border}` }}>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: muted, alignSelf: 'center', marginRight: 4 }}>Compare parts:</span>
            {DENOMINATORS.map((d) => (
              <button key={d} onClick={() => handleDenom2Change(d)}
                style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${border}`, background: denom2 === d ? SHADE_COLORS[1] : (isDark ? '#0f172a' : '#fff'), color: denom2 === d ? '#fff' : text, cursor: 'pointer' }}>
                {d}
              </button>
            ))}
          </div>

          {/* Second fraction display */}
          <div style={{ textAlign: 'center', margin: '4px 0 8px' }}>
            <span style={{ fontSize: 36, fontWeight: 700, color: SHADE_COLORS[1] }}>
              {num2}<span style={{ color: muted, fontWeight: 400 }}>/</span>{denom2}
            </span>
          </div>

          {/* Two bars side by side with symbol */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <FractionBar numerator={numerator} denominator={denominator} isDark={isDark} barColor={SHADE_COLORS[0]} height={40} />
            </div>
            <span style={{ fontSize: 32, fontWeight: 800, color: isDark ? '#fbbf24' : '#d97706', minWidth: 24, textAlign: 'center' }}>
              {compareSymbol}
            </span>
            <div style={{ flex: 1 }}>
              <FractionBar numerator={num2} denominator={denom2} onSegmentClick={handleSegmentClick2} isDark={isDark} barColor={SHADE_COLORS[1]} height={40} />
            </div>
          </div>
        </div>
      )}

      {/* Hint */}
      <p style={{ margin: '10px 0 0', fontSize: 11, color: muted }}>Click segments to shade/unshade. Change denominator to explore equivalents.</p>
    </div>
  );
}
