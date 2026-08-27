'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Minus, ArrowRight, Hash } from 'lucide-react';

interface Props { editor?: unknown; }

type TickStyle = 'whole' | 'decimals' | 'fractions';

interface Jump {
  id: string;
  from: string;
  to: string;
  op: string;
}

export default function NumberLinePanel({ editor: _editor }: Props) {
  const store = useAppStore();
  const [rangeMin, setRangeMin] = useState('0');
  const [rangeMax, setRangeMax] = useState('10');
  const [stepSize, setStepSize] = useState('1');
  const [tickStyle, setTickStyle] = useState<TickStyle>('whole');
  const [jumps, setJumps] = useState<Jump[]>([]);
  const [jumpFrom, setJumpFrom] = useState('');
  const [jumpTo, setJumpTo] = useState('');
  const [jumpOp, setJumpOp] = useState('+');

  if (!store.room.numberLineOpen) return null;

  const addJump = () => {
    if (!jumpFrom.trim() || !jumpTo.trim()) return;
    setJumps(prev => [...prev, {
      id: `jump-${Date.now()}` as any,
      from: jumpFrom.trim(),
      to: jumpTo.trim(),
      op: jumpOp,
    }]);
    setJumpFrom('');
    setJumpTo('');
  };

  const removeJump = (id: string) => {
    setJumps(prev => prev.filter(j => j.id !== id));
  };

  const min = parseFloat(rangeMin) || 0;
  const max = parseFloat(rangeMax) || 10;
  const step = parseFloat(stepSize) || 1;

  const formatTick = (val: number): string => {
    if (tickStyle === 'decimals') return val.toFixed(1);
    if (tickStyle === 'fractions') {
      const denom = step;
      const whole = Math.floor(val / denom);
      const frac = val - whole * denom;
      if (Math.abs(frac) < 0.001) return `${whole}`;
      const gcd = gcdFn(Math.round(frac * 1000), Math.round(denom * 1000));
      const num = Math.round(frac * 1000) / gcd;
      const den = Math.round(denom * 1000) / gcd;
      return whole > 0 ? `${whole} ${num}/${den}` : `${num}/${den}`;
    }
    return `${val}`;
  };

  const gcdFn = (a: number, b: number): number => (b === 0 ? a : gcdFn(b, a % b));

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 260, maxHeight: 480, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Number Line</span>
        <button onClick={() => store.toggleNumberLine()} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width: 14, height: 14 }} /></button>
      </div>

      {/* Range inputs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Min</span>
          <input type='number' value={rangeMin} onChange={e => setRangeMin(e.target.value)} style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', color: '#374151', fontFamily: 'monospace', textAlign: 'center' }} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Max</span>
          <input type='number' value={rangeMax} onChange={e => setRangeMax(e.target.value)} style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', color: '#374151', fontFamily: 'monospace', textAlign: 'center' }} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', display: 'block', marginBottom: 2 }}>Step</span>
          <input type='number' value={stepSize} onChange={e => setStepSize(e.target.value)} step='0.25' style={{ width: '100%', padding: '4px 6px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', color: '#374151', fontFamily: 'monospace', textAlign: 'center' }} />
        </div>
      </div>

      {/* Tick mark style */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {([['whole', 'Whole Numbers'], ['decimals', 'Decimals'], ['fractions', 'Fractions']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTickStyle(id)}
            style={{ flex: 1, padding: '4px 6px', borderRadius: 6, border: tickStyle === id ? '1.5px solid #6366f1' : '1px solid #e5e7eb', background: tickStyle === id ? '#eef2ff' : '#f9fafb', color: tickStyle === id ? '#4338ca' : '#6b7280', fontSize: 9, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Mini preview */}
      <div style={{ borderRadius: 8, background: '#fafafa', border: '1px solid #e5e7eb', padding: '8px 4px', marginBottom: 8, overflow: 'hidden' }}>
        <svg width='240' height='40' viewBox='0 0 240 40' style={{ display: 'block', margin: '0 auto' }}>
          <line x1='4' y1='20' x2='236' y2='20' stroke='#9ca3af' strokeWidth='1.5' />
          <polygon points='236,20 230,17 230,23' fill='#9ca3af' />
          <polygon points='4,20 10,17 10,23' fill='#9ca3af' />
          {(() => {
            const ticks: React.ReactNode[] = [];
            const range = max - min;
            if (range <= 0) return ticks;
            const count = Math.min(Math.floor(range / step) + 1, 25);
            for (let i = 0; i <= count; i++) {
              const val = min + i * step;
              const x = 10 + (val - min) / range * 226;
              const isMajor = tickStyle === 'whole' ? Math.abs(val - Math.round(val)) < 0.001 : true;
              ticks.push(
                <g key={i}>
                  <line x1={x} y1={20} x2={x} y2={isMajor ? 28 : 24} stroke='#6b7280' strokeWidth={isMajor ? 1 : 0.5} />
                  {isMajor && <text x={x} y={37} textAnchor='middle' fontSize='7' fill='#6b7280'>{formatTick(val)}</text>}
                </g>
              );
            }
            return ticks;
          })()}
        </svg>
      </div>

      {/* Jump annotations */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ArrowRight style={{ width: 12, height: 12, color: '#6366f1' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Jump Annotations</span>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input value={jumpFrom} onChange={e => setJumpFrom(e.target.value)} placeholder='From' style={{ flex: 1, padding: '4px 6px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, outline: 'none', color: '#374151', fontFamily: 'monospace' }} />
          <select value={jumpOp} onChange={e => setJumpOp(e.target.value)} style={{ width: 36, padding: '4px 2px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, outline: 'none', color: '#374151', background: '#fff', textAlign: 'center' }}>
            <option value='+'>+</option>
            <option value='-'>-</option>
            <option value='×'>×</option>
          </select>
          <input value={jumpTo} onChange={e => setJumpTo(e.target.value)} placeholder='To/Amount' style={{ flex: 1, padding: '4px 6px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, outline: 'none', color: '#374151', fontFamily: 'monospace' }} />
          <button onClick={addJump} disabled={!jumpFrom.trim() || !jumpTo.trim()} style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: jumpFrom.trim() && jumpTo.trim() ? '#6366f1' : '#e5e7eb', color: '#fff', cursor: jumpFrom.trim() && jumpTo.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Plus size={12} />
          </button>
        </div>
        {jumps.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 60, overflowY: 'auto' }}>
            {jumps.map(j => (
              <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 4, background: '#eef2ff', border: '1px solid #c7d2fe' }}>
                <span style={{ fontSize: 10, color: '#4338ca', fontFamily: 'monospace', fontWeight: 500 }}>{j.from} {j.op} {j.to}</span>
                <button onClick={() => removeJump(j.id)} style={{ marginLeft: 'auto', width: 16, height: 16, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Minus style={{ width: 10, height: 10, color: '#818cf8' }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Draw button */}
      <button
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 0', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#4f46e5'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#6366f1'; }}
      >
        <Hash style={{ width: 12, height: 12 }} /> Draw on Canvas
      </button>
    </div>
  );
}

function Plus({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={className}>
      <line x1='12' y1='5' x2='12' y2='19' /><line x1='5' y1='12' x2='19' y2='12' />
    </svg>
  );
}
