'use client';

import { useState } from 'react';

type DiagramType = 'Free Body Diagram' | 'Circuit Simple' | 'Ray Diagram' | 'Energy Flow' | 'Force Diagram';

type ForceVector = {
  id: number;
  direction: 'up' | 'down' | 'left' | 'right';
  label: string;
};

const DIAGRAM_TYPES: DiagramType[] = [
  'Free Body Diagram',
  'Circuit Simple',
  'Ray Diagram',
  'Energy Flow',
  'Force Diagram',
];

const FORCE_LABELS: Record<ForceVector['direction'], string> = {
  up: 'N',
  down: 'mg',
  left: 'f',
  right: 'F',
};

interface Props {
  isDark: boolean;
}

function getStyles(isDark: boolean) {
  return {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '10px',
    },
    label: {
      fontSize: '12px',
      fontWeight: 600,
      color: isDark ? '#e2e8f0' : '#1e293b',
      marginBottom: '4px',
    },
    select: {
      width: '100%',
      padding: '6px 10px',
      borderRadius: '6px',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      color: isDark ? '#e2e8f0' : '#1e293b',
      fontSize: '13px',
      outline: 'none',
    },
    canvas: {
      width: '300px',
      height: '200px',
      borderRadius: '8px',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      overflow: 'hidden' as const,
      position: 'relative' as const,
    },
    controls: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '6px',
    },
    btn: {
      padding: '5px 10px',
      borderRadius: '6px',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      color: isDark ? '#e2e8f0' : '#1e293b',
      fontSize: '12px',
      cursor: 'pointer',
      transition: 'background-color 0.15s',
    },
    btnActive: {
      backgroundColor: 'rgba(5,150,105,0.15)',
      borderColor: '#10b981',
    },
    btnAccent: {
      padding: '7px 14px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: '#10b981',
      color: '#ffffff',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
    },
    btnClear: {
      padding: '7px 14px',
      borderRadius: '6px',
      border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
      backgroundColor: 'transparent',
      color: isDark ? '#64748b' : '#94a3b8',
      fontSize: '13px',
      cursor: 'pointer',
    },
    bottomRow: {
      display: 'flex',
      gap: '8px',
      marginTop: '4px',
    },
    muted: isDark ? '#64748b' : '#94a3b8',
    text: isDark ? '#e2e8f0' : '#1e293b',
    accent: '#34d399',
    border: isDark ? '#334155' : '#e2e8f0',
  };
}

function FreeBodyDiagram({ forces, s }: { forces: ForceVector[]; s: ReturnType<typeof getStyles> }) {
  const cx = 150;
  const cy = 100;
  const boxW = 60;
  const boxH = 60;
  const arrowLen = 50;
  const dirs: Array<{ dir: ForceVector['direction']; x1: number; y1: number; x2: number; y2: number; tx: number; ty: number }> = [
    { dir: 'up', x1: cx, y1: cy - boxH / 2, x2: cx, y2: cy - boxH / 2 - arrowLen, tx: cx + 8, ty: cy - boxH / 2 - arrowLen + 6 },
    { dir: 'down', x1: cx, y1: cy + boxH / 2, x2: cx, y2: cy + boxH / 2 + arrowLen, tx: cx + 8, ty: cy + boxH / 2 + arrowLen - 4 },
    { dir: 'left', x1: cx - boxW / 2, y1: cy, x2: cx - boxW / 2 - arrowLen, y2: cy, tx: cx - boxW / 2 - arrowLen + 6, ty: cy - 8 },
    { dir: 'right', x1: cx + boxW / 2, y1: cy, x2: cx + boxW / 2 + arrowLen, y2: cy, tx: cx + boxW / 2 + arrowLen - 6, ty: cy - 8 },
  ];
  const activeDirs = new Set(forces.map((f) => f.direction));
  const countByDir = (dir: string) => forces.filter((f) => f.direction === dir).length;

  return (
    <svg width={300} height={200}>
      <rect x={cx - boxW / 2} y={cy - boxH / 2} width={boxW} height={boxH} rx={4} fill={s.accent} fillOpacity={0.12} stroke={s.accent} strokeWidth={2} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={13} fill={s.text} fontWeight={600}>m</text>
      {dirs.map((d) => {
        if (!activeDirs.has(d.dir)) return null;
        const cnt = countByDir(d.dir);
        const offset = cnt - 1;
        const perpOffset = (offset - (cnt - 1) / 2) * 14;
        let ax1 = d.x1;
        let ay1 = d.y1;
        let ax2 = d.x2;
        let ay2 = d.y2;
        let atx = d.tx;
        let aty = d.ty;
        if (d.dir === 'up' || d.dir === 'down') {
          ax1 += perpOffset;
          ax2 += perpOffset;
          atx += perpOffset;
        } else {
          ay1 += perpOffset;
          ay2 += perpOffset;
          aty += perpOffset;
        }
        return (
          <g key={`${d.dir}-${offset}`}>
            <line x1={ax1} y1={ay1} x2={ax2} y2={ay2} stroke={s.accent} strokeWidth={2.5} />
            <polygon
              points={d.dir === 'up'
                ? `${ax2},${ay2 - 6} ${ax2 - 5},${ay2 + 2} ${ax2 + 5},${ay2 + 2}`
                : d.dir === 'down'
                ? `${ax2},${ay2 + 6} ${ax2 - 5},${ay2 - 2} ${ax2 + 5},${ay2 - 2}`
                : d.dir === 'left'
                ? `${ax2 - 6},${ay2} ${ax2 + 2},${ay2 - 5} ${ax2 + 2},${ay2 + 5}`
                : `${ax2 + 6},${ay2} ${ax2 - 2},${ay2 - 5} ${ax2 - 2},${ay2 + 5}`}
              fill={s.accent}
            />
            <text x={atx} y={aty} fontSize={11} fill={s.text} fontWeight={600}>{FORCE_LABELS[d.dir]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function CircuitDiagram({ batteryOn, resistorOn, switchOn, s }: {
  batteryOn: boolean; resistorOn: boolean; switchOn: boolean; s: ReturnType<typeof getStyles>;
}) {
  const stroke = batteryOn ? s.accent : s.muted;
  const rStroke = resistorOn ? s.accent : s.muted;
  const swStroke = switchOn ? s.accent : s.muted;
  const active = batteryOn || resistorOn || switchOn;
  const wireColor = active ? '#334155' : s.muted;

  return (
    <svg width={300} height={200}>
      <rect x={60} y={30} width={180} height={140} rx={6} fill="none" stroke={wireColor} strokeWidth={1.5} strokeDasharray={batteryOn || resistorOn || switchOn ? 'none' : '4 3'} />
      {/* Battery - left side */}
      <line x1={60} y1={80} x2={60} y2={120} stroke={stroke} strokeWidth={3} />
      <line x1={50} y1={87} x2={70} y2={87} stroke={stroke} strokeWidth={2} />
      <line x1={55} y1={95} x2={65} y2={95} stroke={stroke} strokeWidth={3} />
      <line x1={50} y1={103} x2={70} y2={103} stroke={stroke} strokeWidth={2} />
      <text x={60} y={128} textAnchor="middle" fontSize={9} fill={s.muted}>BAT</text>
      {/* Resistor - top */}
      <polyline points="100,30 108,22 120,38 132,22 144,38 156,22 168,38 176,30" fill="none" stroke={rStroke} strokeWidth={2} />
      <text x={138} y={18} textAnchor="middle" fontSize={9} fill={s.muted}>R</text>
      {/* Switch - right side */}
      <circle cx={240} cy={82} r={3} fill={swStroke} />
      <circle cx={240} cy={118} r={3} fill={swStroke} />
      <line x1={240} y1={82} x2={240} y2={118} stroke={wireColor} strokeWidth={1.5} strokeDasharray={switchOn ? 'none' : '3 3'} />
      {switchOn ? (
        <line x1={240} y1={85} x2={240} y2={115} stroke={swStroke} strokeWidth={2.5} />
      ) : (
        <line x1={240} y1={85} x2={258} y2={95} stroke={swStroke} strokeWidth={2.5} />
      )}
      <text x={254} y={104} fontSize={9} fill={s.muted}>SW</text>
      {/* Indicator dots */}
      {batteryOn && <circle cx={60} cy={170} r={4} fill={s.accent} />}
      {resistorOn && <circle cx={138} cy={170} r={4} fill={s.accent} />}
      {switchOn && <circle cx={216} cy={170} r={4} fill={s.accent} />}
      {!batteryOn && !resistorOn && !switchOn && (
        <text x={150} y={106} textAnchor="middle" fontSize={11} fill={s.muted}>Click toggles below</text>
      )}
    </svg>
  );
}

function PlaceholderDiagram({ label, s }: { label: string; s: ReturnType<typeof getStyles> }) {
  return (
    <svg width={300} height={200}>
      <rect x={40} y={40} width={220} height={120} rx={8} fill={s.accent} fillOpacity={0.06} stroke={s.border} strokeWidth={1} strokeDasharray="6 4" />
      <text x={150} y={95} textAnchor="middle" fontSize={14} fill={s.muted} fontWeight={500}>{label}</text>
      <text x={150} y={115} textAnchor="middle" fontSize={11} fill={s.muted}>Coming soon</text>
    </svg>
  );
}

export default function ScienceDiagramBuilder({ isDark }: Props) {
  const [diagramType, setDiagramType] = useState<DiagramType>('Free Body Diagram');
  const [forces, setForces] = useState<ForceVector[]>([]);
  const [nextId, setNextId] = useState(1);
  const [batteryOn, setBatteryOn] = useState(false);
  const [resistorOn, setResistorOn] = useState(false);
  const [switchOn, setSwitchOn] = useState(false);

  const s = getStyles(isDark);

  const addForce = (direction: ForceVector['direction']) => {
    setForces((prev) => [...prev, { id: nextId, direction, label: FORCE_LABELS[direction] }]);
    setNextId((n) => n + 1);
  };

  const handleClear = () => {
    setForces([]);
    setBatteryOn(false);
    setResistorOn(false);
    setSwitchOn(false);
    setNextId(1);
  };

  const handleDiagramChange = (type: DiagramType) => {
    setDiagramType(type);
    handleClear();
  };

  const arrowBtns: Array<{ dir: ForceVector['direction']; symbol: string }> = [
    { dir: 'up', symbol: '^ Up' },
    { dir: 'down', symbol: 'v Down' },
    { dir: 'left', symbol: '< Left' },
    { dir: 'right', symbol: '> Right' },
  ];

  return (
    <div style={s.container}>
      <div>
        <div style={s.label}>Diagram Type</div>
        <select
          style={s.select}
          value={diagramType}
          onChange={(e) => handleDiagramChange(e.target.value as DiagramType)}
        >
          {DIAGRAM_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div style={s.canvas}>
        {diagramType === 'Free Body Diagram' && (
          <FreeBodyDiagram forces={forces} s={s} />
        )}
        {diagramType === 'Circuit Simple' && (
          <CircuitDiagram batteryOn={batteryOn} resistorOn={resistorOn} switchOn={switchOn} s={s} />
        )}
        {diagramType === 'Ray Diagram' && <PlaceholderDiagram label="Ray Diagram" s={s} />}
        {diagramType === 'Energy Flow' && <PlaceholderDiagram label="Energy Flow" s={s} />}
        {diagramType === 'Force Diagram' && <PlaceholderDiagram label="Force Diagram" s={s} />}
      </div>

      {diagramType === 'Free Body Diagram' && (
        <div style={s.controls}>
          {arrowBtns.map((b) => (
            <button
              key={b.dir}
              style={{
                ...s.btn,
                ...(forces.some((f) => f.direction === b.dir) ? s.btnActive : {}),
              }}
              onClick={() => addForce(b.dir)}
            >
              {b.symbol}
            </button>
          ))}
        </div>
      )}

      {diagramType === 'Circuit Simple' && (
        <div style={s.controls}>
          {([['Battery', batteryOn, setBatteryOn], ['Resistor', resistorOn, setResistorOn], ['Switch', switchOn, setSwitchOn]] as const).map(([label, on, toggle]) => (
            <button
              key={label}
              style={{ ...s.btn, ...(on ? s.btnActive : {}) }}
              onClick={() => toggle(!on)}
            >
              {label} {on ? 'ON' : 'OFF'}
            </button>
          ))}
        </div>
      )}

      <div style={s.bottomRow}>
        <button style={s.btnClear} onClick={handleClear}>Clear</button>
        <button style={s.btnAccent}>Add to Board</button>
      </div>
    </div>
  );
}
