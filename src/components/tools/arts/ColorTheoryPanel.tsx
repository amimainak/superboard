'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { X, Palette, Droplets } from 'lucide-react';

interface Props {
  editor?: unknown;
}

type HarmonyType = 'complementary' | 'analogous' | 'triadic' | 'split-complementary';

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function getHarmonyColors(h: number, s: number, l: number, type: HarmonyType): number[][] {
  switch (type) {
    case 'complementary': return [[h, s, l], [(h + 180) % 360, s, l]];
    case 'analogous': return [[h, s, l], [(h + 30) % 360, s, l], [(h + 330) % 360, s, l]];
    case 'triadic': return [[h, s, l], [(h + 120) % 360, s, l], [(h + 240) % 360, s, l]];
    case 'split-complementary': return [[h, s, l], [(h + 150) % 360, s, l], [(h + 210) % 360, s, l]];
    default: return [[h, s, l]];
  }
}

export default function ColorTheoryPanel({ editor }: Props) {
  const store = useAppStore();
  const isOpen = store.room.colorTheoryOpen;
  const toggle = store.toggleColorTheory;

  const [hue, setHue] = useState(200);
  const [saturation, setSaturation] = useState(70);
  const [lightness, setLightness] = useState(50);
  const [harmony, setHarmony] = useState<HarmonyType>('complementary');

  const currentHex = useMemo(() => hslToHex(hue, saturation, lightness), [hue, saturation, lightness]);
  const complementHex = useMemo(() => hslToHex((hue + 180) % 360, saturation, lightness), [hue, saturation, lightness]);

  const harmonyColors = useMemo(() => getHarmonyColors(hue, saturation, lightness, harmony), [hue, saturation, lightness, harmony]);

  const valueScale = useMemo(() => {
    return Array.from({ length: 9 }, (_, i) => {
      const l = 10 + i * 10;
      return { l, hex: hslToHex(hue, saturation, l) };
    });
  }, [hue, saturation]);

  if (!isOpen) return null;

  const sliderStyle = (value: number, color: string): React.CSSProperties => ({
    width: '100%', accentColor: color, cursor: 'pointer',
  });

  const labelStyle: React.CSSProperties = { fontSize: 10, color: '#6b7280', marginBottom: 2, display: 'flex', justifyContent: 'space-between' };

  const harmonyBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.1)', background: active ? '#8b5cf6' : 'white',
    color: active ? 'white' : '#374151', fontSize: 10, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  });

  return (
    <div style={{ position: 'absolute', top: 50, right: 16, zIndex: 1001, width: 320, maxHeight: 'calc(100vh - 60px)', overflowY: 'auto', borderRadius: 12, background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(0,0,0,0.1)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px 0 12px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Palette style={{ width: 14, height: 14, color: '#8b5cf6' }} />
          Color Theory
        </span>
        <button onClick={toggle} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div style={{ padding: '8px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Color preview */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <div style={{ width: 80, height: 64, borderRadius: 8, background: currentHex, border: '2px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{currentHex.toUpperCase()}</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>HSL({hue}, {saturation}%, {lightness}%)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9, color: '#9ca3af' }}>Complement:</span>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: complementHex, border: '1px solid rgba(0,0,0,0.1)' }} />
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#6b7280' }}>{complementHex.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* HSL sliders */}
        <div>
          <div style={labelStyle}><span>Hue</span><span style={{ fontFamily: 'monospace' }}>{hue}°</span></div>
          <input type="range" min={0} max={360} value={hue} onChange={(e) => setHue(parseInt(e.target.value))} style={sliderStyle(hue, `hsl(${hue}, 80%, 50%)`)} />
        </div>
        <div>
          <div style={labelStyle}><span>Saturation</span><span style={{ fontFamily: 'monospace' }}>{saturation}%</span></div>
          <input type="range" min={0} max={100} value={saturation} onChange={(e) => setSaturation(parseInt(e.target.value))} style={sliderStyle(saturation, '#8b5cf6')} />
        </div>
        <div>
          <div style={labelStyle}><span>Lightness</span><span style={{ fontFamily: 'monospace' }}>{lightness}%</span></div>
          <input type="range" min={0} max={100} value={lightness} onChange={(e) => setLightness(parseInt(e.target.value))} style={sliderStyle(lightness, '#8b5cf6')} />
        </div>

        {/* Color harmony presets */}
        <div>
          <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 500, marginBottom: 4 }}>Color Harmony</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {(['complementary', 'analogous', 'triadic', 'split-complementary'] as HarmonyType[]).map((h) => (
              <button key={h} onClick={() => setHarmony(h)} style={harmonyBtnStyle(harmony === h)}>
                {h.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {harmonyColors.map(([h, s, l], i) => {
              const hex = hslToHex(h, s, l);
              return (
                <div key={i} style={{ flex: 1, height: 32, borderRadius: 6, background: hex, border: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 8, fontFamily: 'monospace', color: l > 50 ? '#000' : '#fff', fontWeight: 600 }}>{hex.toUpperCase()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Value scale */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <Droplets style={{ width: 12, height: 12, color: '#8b5cf6' }} />
            <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 500 }}>Value Scale</span>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {valueScale.map((v) => (
              <div key={v.l} style={{ flex: 1, height: 28, borderRadius: 4, background: v.hex, border: '1px solid rgba(0,0,0,0.08)' }} title={`L${v.l}: ${v.hex}`} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
            <span style={{ fontSize: 8, color: '#9ca3af' }}>Dark</span>
            <span style={{ fontSize: 8, color: '#9ca3af' }}>Light</span>
          </div>
        </div>
      </div>
    </div>
  );
}
