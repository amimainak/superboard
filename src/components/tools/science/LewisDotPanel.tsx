'use client';
import React, { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Atom, Circle, Link } from 'lucide-react';

interface Props { editor?: unknown; }

type BondType = 'single' | 'double' | 'triple';

interface ElementInfo {
  symbol: string;
  valenceElectrons: number;
  name: string;
}

const ELEMENT_SUGGESTIONS: ElementInfo[] = [
  { symbol: 'H', valenceElectrons: 1, name: 'Hydrogen' },
  { symbol: 'C', valenceElectrons: 4, name: 'Carbon' },
  { symbol: 'N', valenceElectrons: 5, name: 'Nitrogen' },
  { symbol: 'O', valenceElectrons: 6, name: 'Oxygen' },
  { symbol: 'F', valenceElectrons: 7, name: 'Fluorine' },
  { symbol: 'P', valenceElectrons: 5, name: 'Phosphorus' },
  { symbol: 'S', valenceElectrons: 6, name: 'Sulfur' },
  { symbol: 'Cl', valenceElectrons: 7, name: 'Chlorine' },
];

const DOT_POSITIONS = [
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
];

export default function LewisDotPanel({ editor: _editor }: Props) {
  const store = useAppStore();
  const [symbol, setSymbol] = useState('');
  const [valenceElectrons, setValenceElectrons] = useState(0);
  const [bondType, setBondType] = useState<BondType>('single');
  const [octetCheck, setOctetCheck] = useState<string | null>(null);

  if (!store.room.lewisDotOpen) return null;

  const selectElement = (el: ElementInfo) => {
    setSymbol(el.symbol);
    setValenceElectrons(el.valenceElectrons);
    setOctetCheck(null);
  };

  const checkOctet = () => {
    if (!symbol.trim()) return;
    const needed = symbol.trim() === 'H' || symbol.trim() === 'He' ? 2 : 8;
    const bondCount = bondType === 'single' ? 2 : bondType === 'double' ? 4 : 6;
    const totalElectrons = valenceElectrons + bondCount;
    if (totalElectrons === needed) {
      setOctetCheck('complete');
    } else if (totalElectrons < needed) {
      setOctetCheck('incomplete');
    } else {
      setOctetCheck('exceeded');
    }
  };

  const electrons = DOT_POSITIONS.slice(0, valenceElectrons);
  const cx = 60;
  const cy = 60;
  const radius = 36;

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 260, maxHeight: 480, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Lewis Dot Builder</span>
        <button onClick={() => store.toggleLewisDot()} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X style={{ width: 14, height: 14 }} /></button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }}>
          <Atom style={{ width: 14, height: 14, color: '#d97706', flexShrink: 0 }} />
          <input
            value={symbol}
            onChange={e => { setSymbol(e.target.value); setOctetCheck(null); }}
            placeholder='Element...'
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, outline: 'none', color: '#374151', fontWeight: 600, textTransform: 'uppercase', width: 48 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, border: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>e&#8315;</span>
          <input
            type='number'
            value={valenceElectrons || ''}
            onChange={e => { setValenceElectrons(parseInt(e.target.value) || 0); setOctetCheck(null); }}
            placeholder='0'
            min={0}
            max={8}
            style={{ width: 32, border: 'none', background: 'transparent', fontSize: 13, outline: 'none', color: '#374151', fontWeight: 600, textAlign: 'center', fontFamily: 'monospace' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {ELEMENT_SUGGESTIONS.map(el => (
          <button
            key={el.symbol}
            onClick={() => selectElement(el)}
            style={{ padding: '3px 8px', borderRadius: 6, border: symbol.toUpperCase() === el.symbol ? '1.5px solid #d97706' : '1px solid #e5e7eb', background: symbol.toUpperCase() === el.symbol ? '#fffbeb' : '#f9fafb', color: symbol.toUpperCase() === el.symbol ? '#d97706' : '#6b7280', fontSize: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'monospace' }}
            title={el.name}
          >
            {el.symbol}<span style={{ fontWeight: 400, marginLeft: 2, fontSize: 9 }}>({el.valenceElectrons})</span>
          </button>
        ))}
      </div>

      {symbol.trim() && valenceElectrons > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <svg width='120' height='120' viewBox='0 0 120 120'>
            <circle cx={cx} cy={cy} r={radius} fill='none' stroke='#d1d5db' strokeWidth='1' strokeDasharray='4 2' />
            <text x={cx} y={cy + 5} textAnchor='middle' fontSize='20' fontWeight='bold' fill='#374151'>{symbol.toUpperCase()}</text>
            {electrons.map((pos, i) => {
              const ex = cx + pos.x * radius;
              const ey = cy + pos.y * radius;
              return <circle key={i} cx={ex} cy={ey} r={4} fill='#d97706' />;
            })}
          </svg>
        </div>
      )}

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <Link style={{ width: 12, height: 12, color: '#d97706' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 }}>Bond Type</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {([['single', 'Single (2e⁻)'], ['double', 'Double (4e⁻)'], ['triple', 'Triple (6e⁻)']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setBondType(id)}
              style={{ flex: 1, padding: '4px 6px', borderRadius: 6, border: bondType === id ? '1.5px solid #d97706' : '1px solid #e5e7eb', background: bondType === id ? '#fffbeb' : '#f9fafb', color: bondType === id ? '#d97706' : '#6b7280', fontSize: 9, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={checkOctet}
        disabled={!symbol.trim() || valenceElectrons === 0}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 0', borderRadius: 8, border: 'none', background: symbol.trim() && valenceElectrons > 0 ? '#d97706' : '#d1d5db', color: '#fff', fontSize: 12, fontWeight: 600, cursor: symbol.trim() && valenceElectrons > 0 ? 'pointer' : 'not-allowed', transition: 'background 0.15s', marginBottom: 4 }}
      >
        <Circle style={{ width: 12, height: 12 }} /> Check Octet
      </button>

      {octetCheck && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px', borderRadius: 6, background: octetCheck === 'complete' ? '#f0fdf4' : octetCheck === 'incomplete' ? '#fffbeb' : '#fef2f2', border: `1px solid ${octetCheck === 'complete' ? '#bbf7d0' : octetCheck === 'incomplete' ? '#fde68a' : '#fecaca'}` }}>
          <Atom style={{ width: 14, height: 14, color: octetCheck === 'complete' ? '#16a34a' : octetCheck === 'incomplete' ? '#d97706' : '#ef4444' }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: octetCheck === 'complete' ? '#16a34a' : octetCheck === 'incomplete' ? '#d97706' : '#ef4444' }}>
            {octetCheck === 'complete' ? 'Octet rule satisfied!' : octetCheck === 'incomplete' ? 'Incomplete octet — add more electrons or bonds.' : 'Electrons exceeded octet.'}
          </span>
        </div>
      )}
    </div>
  );
}
