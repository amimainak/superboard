'use client'

import React, { useState, useMemo } from 'react'

// ============================================================
// Shared style helper
// ============================================================

const s = (isDark: boolean) => ({
  bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
  text: isDark ? '#94a3b8' : '#475569',
  bright: isDark ? '#e2e8f0' : '#1e293b',
})

interface ToolProps { isDark: boolean }

// ============================================================
// 1. Rock Cycle Diagram (Grades 4-8)
// ============================================================

const ROCKS = [
  {
    id: 'igneous',
    name: 'Igneous',
    color: '#ef4444',
    fill: 'rgba(239,68,68,0.12)',
    desc: 'Igneous rocks form from cooled and solidified magma or lava. They can form underground (intrusive) or above ground (extrusive).',
    examples: 'Granite, Basalt, Obsidian, Pumice',
    forms: 'Magma cools slowly underground (intrusive) or lava cools quickly on the surface (extrusive).',
  },
  {
    id: 'sedimentary',
    name: 'Sedimentary',
    color: '#f59e0b',
    fill: 'rgba(245,158,11,0.12)',
    desc: 'Sedimentary rocks form from compacted and cemented layers of sediment (rock fragments, minerals, or organic material).',
    examples: 'Sandstone, Limestone, Shale, Conglomerate',
    forms: 'Weathering breaks rocks into pieces, which are carried by water/wind, deposited in layers, and compacted over time.',
  },
  {
    id: 'metamorphic',
    name: 'Metamorphic',
    color: '#8b5cf6',
    fill: 'rgba(139,92,246,0.12)',
    desc: 'Metamorphic rocks form when existing rocks are changed by extreme heat and pressure deep underground, without melting.',
    examples: 'Marble, Slate, Quartzite, Gneiss',
    forms: 'Existing rocks are squeezed and heated deep in Earth\'s crust, causing minerals to recrystallize into new forms.',
  },
]

const PROCESSES = [
  { id: 'melting', from: 'metamorphic', to: 'igneous', label: 'Melting &\nCooling', color: '#ef4444', desc: 'Rocks melt into magma when temperatures are extremely high deep in the Earth. When magma cools, it solidifies into igneous rock. Slow cooling = large crystals (granite). Fast cooling = small crystals (basalt).' },
  { id: 'weathering', from: 'igneous', to: 'sedimentary', label: 'Weathering &\nCompaction', color: '#f59e0b', desc: 'Weathering breaks igneous rocks into smaller pieces through wind, water, ice, and plant roots. These sediments are carried away, deposited in layers, and compacted together over millions of years to form sedimentary rock.' },
  { id: 'heatpressure', from: 'sedimentary', to: 'metamorphic', label: 'Heat &\nPressure', color: '#8b5cf6', desc: 'When sedimentary rocks are pushed deep underground by tectonic forces, extreme heat and pressure change them without melting. Minerals reorganize into new structures, creating metamorphic rock like marble from limestone.' },
  { id: 'reverse1', from: 'igneous', to: 'metamorphic', label: 'Heat &\nPressure', color: '#8b5cf6', desc: 'Igneous rocks like granite can be transformed into metamorphic rocks like gneiss when subjected to intense heat and pressure underground. The minerals recrystallize into bands and new structures.' },
  { id: 'reverse2', from: 'sedimentary', to: 'igneous', label: 'Melting &\nCooling', color: '#ef4444', desc: 'Sedimentary rocks can be pushed so deep that they melt completely into magma. When this magma cools and solidifies, it forms igneous rock, completing part of the rock cycle.' },
  { id: 'reverse3', from: 'metamorphic', to: 'sedimentary', label: 'Weathering &\nCompaction', color: '#f59e0b', desc: 'Metamorphic rocks exposed at the surface are weathered and eroded like any other rock. The resulting sediments can be compacted to form new sedimentary rock.' },
]

export function RockCycleDiagram({ isDark }: ToolProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const v = s(isDark)

  const rockPositions: Record<string, { cx: number; cy: number }> = {
    igneous: { cx: 300, cy: 70 },
    sedimentary: { cx: 100, cy: 260 },
    metamorphic: { cx: 500, cy: 260 },
  }

  const selectedRock = ROCKS.find(r => r.id === selected)
  const selectedProcess = PROCESSES.find(p => p.id === selected)

  const arrowPath = (fromId: string, toId: string, clockwise: boolean) => {
    const f = rockPositions[fromId]
    const t = rockPositions[toId]
    const mx = (f.cx + t.cx) / 2
    const my = (f.cy + t.cy) / 2
    const dx = t.cx - f.cx
    const dy = t.cy - f.cy
    const offset = clockwise ? 30 : -30
    const cx = mx + (-dy / Math.sqrt(dx * dx + dy * dy)) * offset
    const cy = my + (dx / Math.sqrt(dx * dx + dy * dy)) * offset
    return 'M ' + f.cx + ' ' + f.cy + ' Q ' + cx + ' ' + cy + ' ' + t.cx + ' ' + t.cy
  }

  return (
    <div>
      <svg viewBox="0 0 600 360" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: v.bg }}>
        {/* Arrows - clockwise (outer) */}
        {PROCESSES.slice(0, 3).map(p => (
          <g key={p.id}>
            <path d={arrowPath(p.from, p.to, true)} fill="none" stroke={selected === p.id ? p.color : v.border} strokeWidth={selected === p.id ? 3 : 1.5} style={{ cursor: 'pointer' }} onClick={() => setSelected(selected === p.id ? null : p.id)} />
            <text x={(rockPositions[p.from].cx + rockPositions[p.to].cx) / 2 + 50} y={(rockPositions[p.from].cy + rockPositions[p.to].cy) / 2} fontSize={10} fill={selected === p.id ? p.color : v.text} textAnchor="middle" style={{ cursor: 'pointer', pointerEvents: 'all' }} onClick={() => setSelected(selected === p.id ? null : p.id)}>{p.label}</text>
          </g>
        ))}
        {/* Arrows - counter-clockwise (inner) */}
        {PROCESSES.slice(3).map(p => (
          <g key={p.id}>
            <path d={arrowPath(p.from, p.to, false)} fill="none" stroke={selected === p.id ? p.color : v.border} strokeWidth={selected === p.id ? 3 : 1.5} strokeDasharray={selected === p.id ? 'none' : '4 3'} style={{ cursor: 'pointer' }} onClick={() => setSelected(selected === p.id ? null : p.id)} />
          </g>
        ))}
        {/* Rock boxes */}
        {ROCKS.map(r => {
          const pos = rockPositions[r.id]
          return (
            <g key={r.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(selected === r.id ? null : r.id)}>
              <rect x={pos.cx - 55} y={pos.cy - 22} width={110} height={44} rx={8} fill={selected === r.id ? r.fill : v.bg} stroke={selected === r.id ? r.color : v.border} strokeWidth={selected === r.id ? 2 : 1} />
              <text x={pos.cx} y={pos.cy + 4} fontSize={13} fontWeight={600} fill={selected === r.id ? r.color : v.bright} textAnchor="middle">{r.name}</text>
            </g>
          )
        })}
        {/* Title */}
        <text x={300} y={20} fontSize={14} fontWeight={700} fill={v.bright} textAnchor="middle">The Rock Cycle</text>
      </svg>
      {selectedRock && (
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: selectedRock.fill, border: '1px solid ' + selectedRock.color + '40' }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: selectedRock.color, marginBottom: 4 }}>{selectedRock.name} Rock</div>
          <div style={{ fontSize: 11, color: v.text, lineHeight: 1.5 }}>{selectedRock.desc}</div>
          <div style={{ fontSize: 11, color: v.text, marginTop: 4 }}><b style={{ color: v.bright }}>Examples:</b> {selectedRock.examples}</div>
          <div style={{ fontSize: 11, color: v.text, marginTop: 2 }}><b style={{ color: v.bright }}>How it forms:</b> {selectedRock.forms}</div>
        </div>
      )}
      {selectedProcess && (
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: v.bg, border: '1px solid ' + selectedProcess.color + '40' }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: selectedProcess.color, marginBottom: 4 }}>Process: {selectedProcess.label.replace(/\n/g, ' ')}</div>
          <div style={{ fontSize: 11, color: v.text, lineHeight: 1.5 }}>{selectedProcess.desc}</div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 2. Plate Tectonics Map (Grades 6-8)
// ============================================================

const BOUNDARIES = [
  { id: 'himalayas', type: 'Convergent', color: '#ef4444', path: 'M 370 110 Q 400 100 430 105 Q 460 95 490 100', what: 'Two continental plates collide. Neither subducts, so they crumple upward forming massive mountain ranges.', example: 'Himalayas — formed by the Indian Plate colliding with the Eurasian Plate. Still growing about 1cm/year!', x1: 420, y1: 97 },
  { id: 'midatlantic', type: 'Divergent', color: '#22c55e', path: 'M 195 60 Q 200 90 195 120 Q 190 150 195 180 Q 200 210 195 240 Q 190 265 195 290', what: 'Two plates move apart. Magma rises to fill the gap, creating new oceanic crust and a mid-ocean ridge.', example: 'Mid-Atlantic Ridge — the longest mountain range on Earth, running down the center of the Atlantic Ocean.', x1: 210, y1: 175 },
  { id: 'sanandreas', type: 'Transform', color: '#3b82f6', path: 'M 65 110 Q 80 130 75 150 Q 70 170 85 190', what: 'Two plates slide horizontally past each other. This causes frequent earthquakes along the fault line.', example: 'San Andreas Fault — where the Pacific Plate slides past the North American Plate in California.', x1: 90, y1: 150 },
  { id: 'andees', type: 'Convergent', color: '#ef4444', path: 'M 130 260 Q 145 280 140 310 Q 135 330 140 350', what: 'An oceanic plate subducts (dives under) a continental plate. The subducting plate melts, causing volcanoes.', example: 'Andes Mountains — formed by the Nazca Plate subducting beneath the South American Plate.', x1: 155, y1: 305 },
  { id: 'pacificring', type: 'Convergent', color: '#ef4444', path: 'M 440 170 Q 470 160 500 170 Q 530 180 555 175', what: 'The Pacific Plate subducts under surrounding plates, creating a ring of volcanoes and earthquakes.', example: 'Pacific Ring of Fire — 75% of Earth\'s volcanoes and 90% of earthquakes occur here.', x1: 495, y1: 172 },
  { id: 'eastafrica', type: 'Divergent', color: '#22c55e', path: 'M 340 195 Q 345 210 350 230 Q 348 250 350 265', what: 'A continental plate is splitting apart, forming a rift valley. Eventually this may create a new ocean.', example: 'East African Rift — where the African Plate is splitting into two. Lakes like Lake Tanganyika fill the valley.', x1: 360, y1: 230 },
]

const CONTINENTS = [
  { name: 'N. America', path: 'M 60 60 Q 100 45 155 55 Q 180 70 175 110 Q 170 150 140 170 Q 120 185 100 195 Q 80 190 65 170 Q 50 140 55 100 Q 55 75 60 60', fill: 'rgba(74,222,128,0.2)', stroke: 'rgba(74,222,128,0.5)' },
  { name: 'S. America', path: 'M 120 210 Q 140 200 160 210 Q 175 230 170 270 Q 160 310 145 340 Q 130 355 120 345 Q 110 320 105 280 Q 100 240 120 210', fill: 'rgba(74,222,128,0.2)', stroke: 'rgba(74,222,128,0.5)' },
  { name: 'Europe', path: 'M 280 55 Q 310 45 340 55 Q 355 65 350 85 Q 340 100 315 105 Q 290 100 280 85 Q 275 70 280 55', fill: 'rgba(74,222,128,0.2)', stroke: 'rgba(74,222,128,0.5)' },
  { name: 'Africa', path: 'M 300 115 Q 330 105 360 115 Q 380 140 375 180 Q 370 220 355 260 Q 340 290 320 300 Q 300 295 290 270 Q 280 230 285 190 Q 288 150 300 115', fill: 'rgba(74,222,128,0.2)', stroke: 'rgba(74,222,128,0.5)' },
  { name: 'Asia', path: 'M 350 40 Q 400 25 460 40 Q 510 55 530 80 Q 535 110 520 140 Q 500 160 470 165 Q 440 160 410 145 Q 380 130 360 110 Q 345 85 350 40', fill: 'rgba(74,222,128,0.2)', stroke: 'rgba(74,222,128,0.5)' },
  { name: 'Australia', path: 'M 460 240 Q 490 230 520 240 Q 540 255 535 275 Q 525 290 505 295 Q 480 292 465 278 Q 455 260 460 240', fill: 'rgba(74,222,128,0.2)', stroke: 'rgba(74,222,128,0.5)' },
  { name: 'Antarctica', path: 'M 150 355 Q 250 340 350 345 Q 450 350 530 355 Q 530 370 150 370 Z', fill: 'rgba(200,220,255,0.2)', stroke: 'rgba(200,220,255,0.4)' },
]

export function PlateTectonicsMap({ isDark }: ToolProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const v = s(isDark)
  const b = BOUNDARIES.find(x => x.id === selected)

  return (
    <div>
      <svg viewBox="0 0 600 390" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: v.bg }}>
        {/* Ocean background */}
        <rect x={0} y={0} width={600} height={390} rx={8} fill={isDark ? 'rgba(30,58,95,0.3)' : 'rgba(147,197,253,0.15)'} />
        {/* Title */}
        <text x={300} y={22} fontSize={13} fontWeight={700} fill={v.bright} textAnchor="middle">Plate Tectonics Map</text>
        {/* Continents */}
        {CONTINENTS.map(c => (
          <path key={c.name} d={c.path} fill={c.fill} stroke={c.stroke} strokeWidth={1.2} />
        ))}
        {/* Boundaries */}
        {BOUNDARIES.map(bd => (
          <g key={bd.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(selected === bd.id ? null : bd.id)}>
            <path d={bd.path} fill="none" stroke={selected === bd.id ? bd.color : bd.color + '99'} strokeWidth={selected === bd.id ? 3.5 : 2} strokeLinecap="round" />
          </g>
        ))}
        {/* Legend */}
        <rect x={440} y={300} width={150} height={75} rx={6} fill={isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)'} stroke={v.border} />
        <text x={455} y={316} fontSize={10} fontWeight={700} fill={v.bright}>Boundary Types</text>
        <line x1={450} y1={330} x2={475} y2={330} stroke="#ef4444" strokeWidth={2.5} />
        <text x={480} y={334} fontSize={9} fill={v.text}>Convergent</text>
        <line x1={450} y1={347} x2={475} y2={347} stroke="#22c55e" strokeWidth={2.5} />
        <text x={480} y={351} fontSize={9} fill={v.text}>Divergent</text>
        <line x1={450} y1={364} x2={475} y2={364} stroke="#3b82f6" strokeWidth={2.5} />
        <text x={480} y={368} fontSize={9} fill={v.text}>Transform</text>
      </svg>
      {b && (
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: v.bg, border: '1px solid ' + b.color + '40' }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: b.color, marginBottom: 4 }}>{b.type} Boundary</div>
          <div style={{ fontSize: 11, color: v.text, lineHeight: 1.5 }}>{b.what}</div>
          <div style={{ fontSize: 11, color: v.text, marginTop: 4 }}><b style={{ color: v.bright }}>Example:</b> {b.example}</div>
        </div>
      )}
      <div style={{ fontSize: 10, color: v.text, marginTop: 4, opacity: 0.7 }}>Click a colored boundary line to learn more.</div>
    </div>
  )
}

// ============================================================
// 3. Weather Map Reader (Grades 4-8)
// ============================================================

const WEATHER_FEATURES = [
  { id: 'coldfront', label: 'Cold Front', x: 150, y: 160, type: 'front' as const, color: '#3b82f6', desc: 'A cold front occurs when a cold air mass pushes into a warm air mass. The warm air is forced upward, causing clouds, rain, and sometimes thunderstorms. Cold fronts often bring a noticeable temperature drop and clearing skies behind them.' },
  { id: 'warmfront', label: 'Warm Front', x: 350, y: 200, type: 'front' as const, color: '#ef4444', desc: 'A warm front occurs when warm air advances over colder air. The warm air gradually rises above the cold air, producing widespread clouds and steady light rain. Temperatures rise slowly as the front passes.' },
  { id: 'highP', label: 'High Pressure', x: 230, y: 90, type: 'pressure' as const, color: '#22c55e', desc: 'High pressure systems bring clear, calm weather. Air sinks and warms, preventing cloud formation. Winds blow clockwise (in the Northern Hemisphere). High pressure usually means fair weather for days.' },
  { id: 'lowP', label: 'Low Pressure', x: 420, y: 110, type: 'pressure' as const, color: '#f59e0b', desc: 'Low pressure systems bring cloudy, wet, and stormy weather. Air rises and cools, forming clouds and precipitation. Winds blow counter-clockwise (Northern Hemisphere). Low pressure often means rain or storms.' },
  { id: 'rain', label: 'Rain Area', x: 280, y: 260, type: 'precip' as const, color: '#60a5fa', desc: 'This area shows precipitation (rain). Precipitation forms when water vapor in the air condenses into droplets that become heavy enough to fall. It often occurs near low pressure systems and fronts.' },
  { id: 'tempzone', label: 'Temperature Zone', x: 100, y: 60, type: 'temp' as const, color: '#fb923c', desc: 'Temperature zones show areas of different temperatures on a weather map. Colors range from blue (cold) to red (hot). These zones help meteorologists predict weather changes and track air masses.' },
]

export function WeatherMapReader({ isDark }: ToolProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const v = s(isDark)
  const feat = WEATHER_FEATURES.find(f => f.id === selected)

  return (
    <div>
      <svg viewBox="0 0 600 360" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: v.bg }}>
        <text x={300} y={22} fontSize={13} fontWeight={700} fill={v.bright} textAnchor="middle">Weather Map</text>

        {/* Temperature gradient background */}
        <defs>
          <linearGradient id="tempGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.15} />
          </linearGradient>
        </defs>
        <rect x={10} y={30} width={580} height={320} rx={6} fill="url(#tempGrad)" stroke={v.border} />

        {/* Grid lines */}
        {[80, 160, 240].map(y => (
          <line key={y} x1={10} y1={y} x2={590} y2={y} stroke={v.border} strokeWidth={0.5} strokeDasharray="4 4" />
        ))}
        {[150, 300, 450].map(x => (
          <line key={x} x1={x} y1={30} x2={x} y2={350} stroke={v.border} strokeWidth={0.5} strokeDasharray="4 4" />
        ))}

        {/* Cold front (blue line with triangles) */}
        <g style={{ cursor: 'pointer' }} onClick={() => setSelected('coldfront')}>
          <line x1={80} y1={130} x2={280} y2={190} stroke={selected === 'coldfront' ? '#3b82f6' : 'rgba(59,130,246,0.6)'} strokeWidth={3} />
          {[0, 1, 2, 3, 4].map(i => {
            const px = 80 + i * 50
            const py = 130 + i * 15
            return <polygon key={i} points={px + ',' + (py - 8) + ' ' + (px - 6) + ',' + (py + 4) + ' ' + (px + 6) + ',' + (py + 4)} fill={selected === 'coldfront' ? '#3b82f6' : 'rgba(59,130,246,0.6)'} />
          })}
        </g>

        {/* Warm front (red line with semicircles) */}
        <g style={{ cursor: 'pointer' }} onClick={() => setSelected('warmfront')}>
          <line x1={280} y1={170} x2={480} y2={220} stroke={selected === 'warmfront' ? '#ef4444' : 'rgba(239,68,68,0.6)'} strokeWidth={3} />
          {[0, 1, 2, 3, 4].map(i => {
            const px = 280 + i * 50
            const py = 170 + i * 12
            return <path key={i} d={'M ' + (px - 7) + ' ' + (py + 3) + ' A 7 7 0 0 1 ' + (px + 7) + ' ' + (py + 3)} fill={selected === 'warmfront' ? '#ef4444' : 'rgba(239,68,68,0.6)'} />
          })}
        </g>

        {/* High pressure center with isobars */}
        <g style={{ cursor: 'pointer' }} onClick={() => setSelected('highP')}>
          <circle cx={230} cy={90} r={30} fill="none" stroke={selected === 'highP' ? '#22c55e' : 'rgba(34,197,94,0.3)'} strokeWidth={1} strokeDasharray="3 3" />
          <circle cx={230} cy={90} r={50} fill="none" stroke={selected === 'highP' ? '#22c55e' : 'rgba(34,197,94,0.2)'} strokeWidth={0.8} strokeDasharray="3 3" />
          <text x={230} y={96} fontSize={22} fontWeight={700} fill={selected === 'highP' ? '#22c55e' : 'rgba(34,197,94,0.7)'} textAnchor="middle">H</text>
          <text x={230} y={65} fontSize={9} fill={selected === 'highP' ? '#22c55e' : v.text} textAnchor="middle">1024 mb</text>
        </g>

        {/* Low pressure center with isobars */}
        <g style={{ cursor: 'pointer' }} onClick={() => setSelected('lowP')}>
          <circle cx={420} cy={110} r={28} fill="none" stroke={selected === 'lowP' ? '#f59e0b' : 'rgba(245,158,11,0.3)'} strokeWidth={1} strokeDasharray="3 3" />
          <circle cx={420} cy={110} r={48} fill="none" stroke={selected === 'lowP' ? '#f59e0b' : 'rgba(245,158,11,0.2)'} strokeWidth={0.8} strokeDasharray="3 3" />
          <text x={420} y={116} fontSize={22} fontWeight={700} fill={selected === 'lowP' ? '#f59e0b' : 'rgba(245,158,11,0.7)'} textAnchor="middle">L</text>
          <text x={420} y={87} fontSize={9} fill={selected === 'lowP' ? '#f59e0b' : v.text} textAnchor="middle">998 mb</text>
        </g>

        {/* Precipitation area */}
        <g style={{ cursor: 'pointer' }} onClick={() => setSelected('rain')}>
          <ellipse cx={280} cy={260} rx={60} ry={35} fill={selected === 'rain' ? 'rgba(96,165,250,0.25)' : 'rgba(96,165,250,0.12)'} stroke={selected === 'rain' ? '#60a5fa' : 'rgba(96,165,250,0.3)'} strokeWidth={1} strokeDasharray="5 3" />
          {[240, 260, 280, 300, 320].map((x, i) => (
            <text key={i} x={x} y={265 + (i % 2) * 10} fontSize={10} fill={selected === 'rain' ? '#60a5fa' : 'rgba(96,165,250,0.5)'} textAnchor="middle">{'///'}</text>
          ))}
        </g>

        {/* Temperature zone labels */}
        <g style={{ cursor: 'pointer' }} onClick={() => setSelected('tempzone')}>
          <rect x={50} y={40} width={50} height={20} rx={4} fill={selected === 'tempzone' ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.15)'} stroke={selected === 'tempzone' ? '#3b82f6' : 'rgba(59,130,246,0.3)'} />
          <text x={75} y={54} fontSize={10} fontWeight={600} fill={selected === 'tempzone' ? '#60a5fa' : '#93c5fd'} textAnchor="middle">32F</text>
          <rect x={480} y={300} width={50} height={20} rx={4} fill={selected === 'tempzone' ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.15)'} stroke={selected === 'tempzone' ? '#ef4444' : 'rgba(239,68,68,0.3)'} />
          <text x={505} y={314} fontSize={10} fontWeight={600} fill={selected === 'tempzone' ? '#f87171' : '#fca5a5'} textAnchor="middle">85F</text>
        </g>

        {/* Mini legend */}
        <rect x={440} y={35} width={145} height={90} rx={5} fill={isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)'} stroke={v.border} />
        <text x={512} y={50} fontSize={9} fontWeight={700} fill={v.bright} textAnchor="middle">Map Legend</text>
        <line x1={450} y1={62} x2={475} y2={62} stroke="#3b82f6" strokeWidth={2.5} />
        <text x={480} y={66} fontSize={8} fill={v.text}>Cold Front</text>
        <line x1={450} y1={77} x2={475} y2={77} stroke="#ef4444" strokeWidth={2.5} />
        <text x={480} y={81} fontSize={8} fill={v.text}>Warm Front</text>
        <text x={460} y={95} fontSize={12} fontWeight={700} fill="#22c55e">H</text>
        <text x={480} y={95} fontSize={8} fill={v.text}>High Pressure</text>
        <text x={460} y={112} fontSize={12} fontWeight={700} fill="#f59e0b">L</text>
        <text x={480} y={112} fontSize={8} fill={v.text}>Low Pressure</text>
      </svg>
      {feat && (
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: v.bg, border: '1px solid ' + feat.color + '40' }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: feat.color, marginBottom: 4 }}>{feat.label}</div>
          <div style={{ fontSize: 11, color: v.text, lineHeight: 1.5 }}>{feat.desc}</div>
        </div>
      )}
      <div style={{ fontSize: 10, color: v.text, marginTop: 4, opacity: 0.7 }}>Click any feature on the map to learn about it.</div>
    </div>
  )
}

// ============================================================
// 4. Water & Carbon Cycle (Grades 3-8)
// ============================================================

const WATER_PROCESSES = [
  { id: 'ocean', label: 'Ocean', x: 300, y: 280, color: '#3b82f6', desc: 'The ocean holds about 97% of Earth\'s water. It is the main reservoir in the water cycle and the starting point for evaporation.' },
  { id: 'evaporation', label: 'Evaporation', x: 200, y: 170, color: '#60a5fa', desc: 'The Sun heats water in the ocean, causing it to change from liquid to water vapor (gas) and rise into the atmosphere. This is powered by solar energy.' },
  { id: 'condensation', label: 'Condensation', x: 400, y: 90, color: '#818cf8', desc: 'As water vapor rises, it cools and changes back into tiny liquid water droplets, forming clouds. This happens when warm moist air meets cooler air above.' },
  { id: 'precipitation', label: 'Precipitation', x: 480, y: 200, color: '#6366f1', desc: 'When cloud droplets combine and become too heavy to stay in the air, they fall as rain, snow, sleet, or hail. This returns water to Earth\'s surface.' },
  { id: 'runoff', label: 'Runoff', x: 150, y: 250, color: '#38bdf8', desc: 'Water flows over the ground surface, moving downhill due to gravity. Runoff collects in streams, rivers, and eventually flows back into the ocean, completing the cycle.' },
]

const CARBON_PROCESSES = [
  { id: 'atmosphere', label: 'Atmosphere (CO2)', x: 300, y: 50, color: '#94a3b8', desc: 'The atmosphere contains about 0.04% carbon dioxide. CO2 is a greenhouse gas that traps heat. Carbon moves in and out of the atmosphere through many processes.' },
  { id: 'photosynthesis', label: 'Photosynthesis', x: 130, y: 150, color: '#22c55e', desc: 'Plants absorb CO2 from the air and use sunlight to convert it into sugars (glucose) and oxygen. This removes carbon from the atmosphere and stores it in plant tissue.' },
  { id: 'organisms', label: 'Organisms', x: 130, y: 270, color: '#a3e635', desc: 'All living things contain carbon. Animals get carbon by eating plants or other animals. Carbon is passed through food chains and stored in bodies.' },
  { id: 'respiration', label: 'Respiration', x: 300, y: 220, color: '#f59e0b', desc: 'Animals and plants break down sugars for energy, releasing CO2 back into the atmosphere as a waste product. This is the reverse of photosynthesis.' },
  { id: 'oceanabsorb', label: 'Ocean Absorption', x: 470, y: 140, color: '#38bdf8', desc: 'The ocean absorbs about 25% of human-produced CO2. Dissolved CO2 forms carbonic acid, which is causing ocean acidification. The ocean is a major carbon sink.' },
  { id: 'fossilfuels', label: 'Fossil Fuels', x: 470, y: 270, color: '#78716c', desc: 'Coal, oil, and natural gas are made from ancient plants and animals buried millions of years ago. They store enormous amounts of carbon underground.' },
  { id: 'combustion', label: 'Combustion', x: 300, y: 340, color: '#ef4444', desc: 'Burning fossil fuels (in cars, power plants, factories) releases stored carbon back into the atmosphere as CO2. This is the main cause of increased CO2 levels and climate change.' },
]

export function WaterCarbonCycle({ isDark }: ToolProps) {
  const [tab, setTab] = useState<'water' | 'carbon'>('water')
  const [selected, setSelected] = useState<string | null>(null)
  const v = s(isDark)

  const items = tab === 'water' ? WATER_PROCESSES : CARBON_PROCESSES
  const sel = items.find(p => p.id === selected)

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
        {[{ id: 'water' as const, label: 'Water Cycle', color: '#3b82f6' }, { id: 'carbon' as const, label: 'Carbon Cycle', color: '#22c55e' }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelected(null) }} style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 11, fontWeight: tab === t.id ? 700 : 500, border: '1px solid ' + (tab === t.id ? t.color + '60' : v.border), background: tab === t.id ? t.color + '18' : v.bg, color: tab === t.id ? t.color : v.text, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'water' ? (
        <svg viewBox="0 0 600 340" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: v.bg }}>
          <text x={300} y={20} fontSize={13} fontWeight={700} fill={v.bright} textAnchor="middle">The Water Cycle</text>
          {/* Ocean */}
          <ellipse cx={300} cy={290} rx={220} ry={40} fill={isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.12)'} stroke={selected === 'ocean' ? '#3b82f6' : 'rgba(59,130,246,0.3)'} strokeWidth={selected === 'ocean' ? 2 : 1} style={{ cursor: 'pointer' }} onClick={() => setSelected('ocean')} />
          <text x={300} y={296} fontSize={12} fontWeight={600} fill={selected === 'ocean' ? '#60a5fa' : '#93c5fd'} textAnchor="middle" style={{ pointerEvents: 'all', cursor: 'pointer' }} onClick={() => setSelected('ocean')}>Ocean</text>
          {/* Evaporation arrows (up) */}
          <g style={{ cursor: 'pointer' }} onClick={() => setSelected('evaporation')}>
            <line x1={220} y1={260} x2={200} y2={190} stroke={selected === 'evaporation' ? '#60a5fa' : 'rgba(96,165,250,0.4)'} strokeWidth={2} markerEnd="url(#arrowBlue)" />
            <line x1={260} y1={255} x2={240} y2={190} stroke={selected === 'evaporation' ? '#60a5fa' : 'rgba(96,165,250,0.4)'} strokeWidth={2} />
            <text x={190} y={225} fontSize={10} fontWeight={600} fill={selected === 'evaporation' ? '#60a5fa' : '#93c5fd'} textAnchor="middle">Evaporation</text>
          </g>
          {/* Condensation cloud */}
          <g style={{ cursor: 'pointer' }} onClick={() => setSelected('condensation')}>
            <ellipse cx={380} cy={85} rx={70} ry={35} fill={isDark ? 'rgba(129,140,248,0.15)' : 'rgba(129,140,248,0.1)'} stroke={selected === 'condensation' ? '#818cf8' : 'rgba(129,140,248,0.3)'} strokeWidth={selected === 'condensation' ? 2 : 1} />
            <text x={380} y={82} fontSize={10} fontWeight={600} fill={selected === 'condensation' ? '#818cf8' : '#a5b4fc'} textAnchor="middle">Condensation</text>
            <text x={380} y={96} fontSize={9} fill={selected === 'condensation' ? '#818cf8' : '#a5b4fc'} textAnchor="middle">(Cloud Formation)</text>
          </g>
          {/* Precipitation arrows (down) */}
          <g style={{ cursor: 'pointer' }} onClick={() => setSelected('precipitation')}>
            {[440, 460, 480].map((x, i) => (
              <line key={i} x1={x} y1={115} x2={x - 10 + i * 5} y2={200} stroke={selected === 'precipitation' ? '#6366f1' : 'rgba(99,102,241,0.4)'} strokeWidth={1.5} strokeDasharray="4 3" />
            ))}
            <text x={480} y={170} fontSize={10} fontWeight={600} fill={selected === 'precipitation' ? '#6366f1' : '#a5b4fc'}>Precipitation</text>
          </g>
          {/* Runoff arrows */}
          <g style={{ cursor: 'pointer' }} onClick={() => setSelected('runoff')}>
            <path d="M 460 210 Q 400 240 300 265 Q 200 270 120 270" fill="none" stroke={selected === 'runoff' ? '#38bdf8' : 'rgba(56,189,248,0.4)'} strokeWidth={2} />
            <text x={220} y={248} fontSize={10} fontWeight={600} fill={selected === 'runoff' ? '#38bdf8' : '#7dd3fc'} textAnchor="middle">Surface Runoff</text>
          </g>
          {/* Sun */}
          <circle cx={100} cy={100} r={25} fill={isDark ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.15)'} stroke="rgba(251,191,36,0.5)" strokeWidth={1} />
          <text x={100} y={104} fontSize={16} textAnchor="middle">&#9728;</text>
        </svg>
      ) : (
        <svg viewBox="0 0 600 400" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: v.bg }}>
          <text x={300} y={20} fontSize={13} fontWeight={700} fill={v.bright} textAnchor="middle">The Carbon Cycle</text>
          {/* Atmosphere */}
          <g style={{ cursor: 'pointer' }} onClick={() => setSelected('atmosphere')}>
            <ellipse cx={300} cy={55} rx={100} ry={30} fill={isDark ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.08)'} stroke={selected === 'atmosphere' ? '#94a3b8' : 'rgba(148,163,184,0.3)'} strokeWidth={selected === 'atmosphere' ? 2 : 1} />
            <text x={300} y={52} fontSize={11} fontWeight={600} fill={selected === 'atmosphere' ? '#94a3b8' : '#cbd5e1'} textAnchor="middle">Atmosphere</text>
            <text x={300} y={66} fontSize={9} fill={selected === 'atmosphere' ? '#94a3b8' : '#cbd5e1'} textAnchor="middle">(CO2)</text>
          </g>
          {/* Photosynthesis (arrow from atmosphere to plants) */}
          <g style={{ cursor: 'pointer' }} onClick={() => setSelected('photosynthesis')}>
            <path d="M 210 70 Q 170 100 140 135" fill="none" stroke={selected === 'photosynthesis' ? '#22c55e' : 'rgba(34,197,94,0.4)'} strokeWidth={2} />
            <circle cx={130} cy={150} r={30} fill={isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)'} stroke={selected === 'photosynthesis' ? '#22c55e' : 'rgba(34,197,94,0.3)'} strokeWidth={selected === 'photosynthesis' ? 2 : 1} />
            <text x={130} y={147} fontSize={9} fontWeight={600} fill={selected === 'photosynthesis' ? '#22c55e' : '#86efac'} textAnchor="middle">Photo-</text>
            <text x={130} y={159} fontSize={9} fontWeight={600} fill={selected === 'photosynthesis' ? '#22c55e' : '#86efac'} textAnchor="middle">synthesis</text>
          </g>
          {/* Organisms */}
          <g style={{ cursor: 'pointer' }} onClick={() => setSelected('organisms')}>
            <circle cx={130} cy={270} r={30} fill={isDark ? 'rgba(163,230,53,0.12)' : 'rgba(163,230,53,0.08)'} stroke={selected === 'organisms' ? '#a3e635' : 'rgba(163,230,53,0.3)'} strokeWidth={selected === 'organisms' ? 2 : 1} />
            <text x={130} y={274} fontSize={10} fontWeight={600} fill={selected === 'organisms' ? '#a3e635' : '#bef264'} textAnchor="middle">Organisms</text>
            <path d="M 130 180 L 130 240" fill="none" stroke={selected === 'organisms' ? '#a3e635' : 'rgba(163,230,53,0.4)'} strokeWidth={1.5} />
          </g>
          {/* Respiration */}
          <g style={{ cursor: 'pointer' }} onClick={() => setSelected('respiration')}>
            <path d="M 160 250 Q 230 240 290 200 Q 310 160 300 85" fill="none" stroke={selected === 'respiration' ? '#f59e0b' : 'rgba(245,158,11,0.4)'} strokeWidth={2} strokeDasharray="5 3" />
            <circle cx={310} cy={210} r={22} fill={isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)'} stroke={selected === 'respiration' ? '#f59e0b' : 'rgba(245,158,11,0.3)'} strokeWidth={selected === 'respiration' ? 2 : 1} />
            <text x={310} y={207} fontSize={9} fontWeight={600} fill={selected === 'respiration' ? '#f59e0b' : '#fcd34d'} textAnchor="middle">Respi-</text>
            <text x={310} y={219} fontSize={9} fontWeight={600} fill={selected === 'respiration' ? '#f59e0b' : '#fcd34d'} textAnchor="middle">ration</text>
          </g>
          {/* Ocean absorption */}
          <g style={{ cursor: 'pointer' }} onClick={() => setSelected('oceanabsorb')}>
            <path d="M 390 65 Q 430 90 465 125" fill="none" stroke={selected === 'oceanabsorb' ? '#38bdf8' : 'rgba(56,189,248,0.4)'} strokeWidth={2} />
            <circle cx={475} cy={140} r={30} fill={isDark ? 'rgba(56,189,248,0.12)' : 'rgba(56,189,248,0.08)'} stroke={selected === 'oceanabsorb' ? '#38bdf8' : 'rgba(56,189,248,0.3)'} strokeWidth={selected === 'oceanabsorb' ? 2 : 1} />
            <text x={475} y={137} fontSize={9} fontWeight={600} fill={selected === 'oceanabsorb' ? '#38bdf8' : '#7dd3fc'} textAnchor="middle">Ocean</text>
            <text x={475} y={149} fontSize={9} fontWeight={600} fill={selected === 'oceanabsorb' ? '#38bdf8' : '#7dd3fc'} textAnchor="middle">Absorption</text>
          </g>
          {/* Fossil fuels */}
          <g style={{ cursor: 'pointer' }} onClick={() => setSelected('fossilfuels')}>
            <circle cx={475} cy={270} r={30} fill={isDark ? 'rgba(120,113,108,0.12)' : 'rgba(120,113,108,0.08)'} stroke={selected === 'fossilfuels' ? '#78716c' : 'rgba(120,113,108,0.3)'} strokeWidth={selected === 'fossilfuels' ? 2 : 1} />
            <text x={475} y={267} fontSize={9} fontWeight={600} fill={selected === 'fossilfuels' ? '#a8a29e' : '#d6d3d1'} textAnchor="middle">Fossil</text>
            <text x={475} y={279} fontSize={9} fontWeight={600} fill={selected === 'fossilfuels' ? '#a8a29e' : '#d6d3d1'} textAnchor="middle">Fuels</text>
          </g>
          {/* Combustion */}
          <g style={{ cursor: 'pointer' }} onClick={() => setSelected('combustion')}>
            <path d="M 450 248 Q 400 300 320 340 Q 300 345 300 85" fill="none" stroke={selected === 'combustion' ? '#ef4444' : 'rgba(239,68,68,0.4)'} strokeWidth={2} strokeDasharray="5 3" />
            <circle cx={300} cy={350} r={28} fill={isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)'} stroke={selected === 'combustion' ? '#ef4444' : 'rgba(239,68,68,0.3)'} strokeWidth={selected === 'combustion' ? 2 : 1} />
            <text x={300} y={354} fontSize={10} fontWeight={600} fill={selected === 'combustion' ? '#ef4444' : '#fca5a5'} textAnchor="middle">Combustion</text>
          </g>
        </svg>
      )}

      {sel && (
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: v.bg, border: '1px solid ' + sel.color + '40' }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: sel.color, marginBottom: 4 }}>{sel.label}</div>
          <div style={{ fontSize: 11, color: v.text, lineHeight: 1.5 }}>{sel.desc}</div>
        </div>
      )}
      <div style={{ fontSize: 10, color: v.text, marginTop: 4, opacity: 0.7 }}>Click any process or reservoir to learn about it.</div>
    </div>
  )
}

// ============================================================
// 5. Solar System Scale (Grades 3-8)
// ============================================================

const PLANETS = [
  { name: 'Mercury', distance: 57.9, diameter: 4879, color: '#a8a29e', fact: 'Mercury is the smallest planet and closest to the Sun. Despite being closest, it is NOT the hottest — Venus is!' },
  { name: 'Venus', distance: 108.2, diameter: 12104, color: '#fbbf24', fact: 'Venus is the hottest planet (900F/475C) due to its thick atmosphere. It spins backwards compared to most planets!' },
  { name: 'Earth', distance: 149.6, diameter: 12756, color: '#3b82f6', fact: 'Earth is the only known planet with liquid water on its surface and life. 70% of its surface is covered by water.' },
  { name: 'Mars', distance: 227.9, diameter: 6792, color: '#ef4444', fact: 'Mars is called the Red Planet due to iron oxide (rust) on its surface. It has the tallest volcano — Olympus Mons!' },
  { name: 'Jupiter', distance: 778.6, diameter: 142984, color: '#f97316', fact: 'Jupiter is the largest planet — over 1,300 Earths could fit inside it! The Great Red Spot is a storm larger than Earth.' },
  { name: 'Saturn', distance: 1433.5, diameter: 120536, color: '#eab308', fact: 'Saturn\'s beautiful rings are made of ice and rock. Saturn is so light it would float in water (if you had a big enough bathtub)!' },
  { name: 'Uranus', distance: 2872.5, diameter: 51118, color: '#67e8f9', fact: 'Uranus rotates on its side — it\'s tilted 98 degrees! Scientists think a huge object knocked it over long ago.' },
  { name: 'Neptune', distance: 4495.1, diameter: 49528, color: '#6366f1', fact: 'Neptune has the strongest winds of any planet — up to 1,200 mph! It takes 165 Earth years to orbit the Sun once.' },
]

export function SolarSystemScale({ isDark }: ToolProps) {
  const [view, setView] = useState<'size' | 'distance'>('size')
  const [selected, setSelected] = useState<number | null>(null)
  const v = s(isDark)
  const planet = selected !== null ? PLANETS[selected] : null

  const maxDiam = Math.max(...PLANETS.map(p => p.diameter))
  const maxDist = Math.max(...PLANETS.map(p => p.distance))

  return (
    <div>
      {/* View toggle */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
        {[{ id: 'size' as const, label: 'Relative Size' }, { id: 'distance' as const, label: 'Relative Distance' }].map(t => (
          <button key={t.id} onClick={() => { setView(t.id); setSelected(null) }} style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 11, fontWeight: view === t.id ? 700 : 500, border: '1px solid ' + (view === t.id ? 'rgba(251,191,36,0.4)' : v.border), background: view === t.id ? 'rgba(251,191,36,0.12)' : v.bg, color: view === t.id ? '#fbbf24' : v.text, cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {view === 'size' ? (
        <svg viewBox="0 0 600 200" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: v.bg }}>
          <text x={300} y={18} fontSize={12} fontWeight={700} fill={v.bright} textAnchor="middle">Relative Planet Sizes (logarithmic scale)</text>
          {/* Sun */}
          <circle cx={30} cy={100} r={22} fill={isDark ? 'rgba(251,191,36,0.25)' : 'rgba(251,191,36,0.15)'} stroke="rgba(251,191,36,0.5)" strokeWidth={1} />
          <text x={30} y={135} fontSize={8} fill={v.text} textAnchor="middle">Sun</text>
          {/* Planets */}
          {PLANETS.map((p, i) => {
            const logR = Math.log(p.diameter) / Math.log(maxDiam)
            const r = Math.max(4, logR * 32)
            const cx = 90 + i * 64
            const cy = 100
            return (
              <g key={p.name} style={{ cursor: 'pointer' }} onClick={() => setSelected(selected === i ? null : i)}>
                <circle cx={cx} cy={cy} r={r} fill={selected === i ? p.color + '40' : p.color + '20'} stroke={selected === i ? p.color : p.color + '60'} strokeWidth={selected === i ? 2 : 1} />
                {p.name === 'Saturn' && (
                  <ellipse cx={cx} cy={cy} rx={r + 10} ry={4} fill="none" stroke={p.color + '80'} strokeWidth={1.5} />
                )}
                <text x={cx} y={cy + r + 14} fontSize={8} fill={selected === i ? p.color : v.text} textAnchor="middle">{p.name}</text>
              </g>
            )
          })}
        </svg>
      ) : (
        <svg viewBox="0 0 600 140" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: v.bg }}>
          <text x={300} y={18} fontSize={12} fontWeight={700} fill={v.bright} textAnchor="middle">Relative Distances from Sun (scaled)</text>
          {/* Sun */}
          <circle cx={25} cy={65} r={12} fill={isDark ? 'rgba(251,191,36,0.3)' : 'rgba(251,191,36,0.2)'} stroke="rgba(251,191,36,0.6)" strokeWidth={1} />
          {/* Orbit line */}
          <line x1={25} y1={65} x2={585} y2={65} stroke={v.border} strokeWidth={0.5} strokeDasharray="3 3" />
          {/* Planets spaced by log distance */}
          {PLANETS.map((p, i) => {
            const logDist = Math.log(p.distance) / Math.log(maxDist)
            const cx = 55 + logDist * 520
            const r = Math.max(3, Math.log(p.diameter) / Math.log(maxDiam) * 8)
            return (
              <g key={p.name} style={{ cursor: 'pointer' }} onClick={() => setSelected(selected === i ? null : i)}>
                <circle cx={cx} cy={65} r={r} fill={selected === i ? p.color : p.color + '60'} stroke={selected === i ? p.color : p.color + '80'} strokeWidth={selected === i ? 2 : 1} />
                <text x={cx} y={90} fontSize={7} fill={selected === i ? p.color : v.text} textAnchor="middle" transform={'rotate(-35 ' + cx + ' 90)'}>{p.name}</text>
              </g>
            )
          })}
        </svg>
      )}

      {planet && (
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: v.bg, border: '1px solid ' + planet.color + '40' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: planet.color, marginBottom: 4 }}>{planet.name}</div>
          <div style={{ fontSize: 11, color: v.text, lineHeight: 1.6 }}>
            <b style={{ color: v.bright }}>Distance from Sun:</b> {planet.distance} million km<br />
            <b style={{ color: v.bright }}>Diameter:</b> {planet.diameter.toLocaleString()} km<br />
            <b style={{ color: v.bright }}>Fun Fact:</b> {planet.fact}
          </div>
        </div>
      )}
      <div style={{ fontSize: 10, color: v.text, marginTop: 4, opacity: 0.7 }}>Click a planet to see its details.</div>
    </div>
  )
}

// ============================================================
// 6. Topographic Map Tool (Grades 6-8)
// ============================================================

const CONTOUR_LINES = [
  { elevation: 100, rx: 180, ry: 70, color: '#22c55e' },
  { elevation: 200, rx: 150, ry: 58, color: '#4ade80' },
  { elevation: 300, rx: 118, ry: 44, color: '#a3e635' },
  { elevation: 400, rx: 86, ry: 32, color: '#fbbf24' },
  { elevation: 500, rx: 56, ry: 20, color: '#f59e0b' },
  { elevation: 600, rx: 28, ry: 10, color: '#92400e' },
]

const CONTOUR_CENTER = { x: 280, y: 130 }

function getElevation(px: number, py: number): number {
  const dx = px - CONTOUR_CENTER.x
  const dy = (py - CONTOUR_CENTER.y) * (70 / 180) // adjust for ellipse ratio
  const dist = Math.sqrt(dx * dx + dy * dy)
  const maxDist = 180
  if (dist > maxDist) return 50
  const ratio = dist / maxDist
  // Interpolate between 650 (center) and 50 (edge)
  const elev = 650 - ratio * 600
  return Math.round(elev / 50) * 50
}

export function TopographicMapTool({ isDark }: ToolProps) {
  const [clickPoint, setClickPoint] = useState<{ x: number; y: number; elev: number } | null>(null)
  const [crossSection, setCrossSection] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [startPt, setStartPt] = useState<{ x: number; y: number } | null>(null)
  const v = s(isDark)

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (drawing) return
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const viewBox = svg.viewBox.baseVal
    const scaleX = viewBox.width / rect.width
    const scaleY = viewBox.height / rect.height
    const px = (e.clientX - rect.left) * scaleX
    const py = (e.clientY - rect.top) * scaleY
    setClickPoint({ x: px, y: py, elev: getElevation(px, py) })
  }

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const viewBox = svg.viewBox.baseVal
    const scaleX = viewBox.width / rect.width
    const scaleY = viewBox.height / rect.height
    const px = (e.clientX - rect.left) * scaleX
    const py = (e.clientY - rect.top) * scaleY
    setDrawing(true)
    setStartPt({ x: px, y: py })
  }

  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawing || !startPt) { setDrawing(false); return }
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const viewBox = svg.viewBox.baseVal
    const scaleX = viewBox.width / rect.width
    const scaleY = viewBox.height / rect.height
    const px = (e.clientX - rect.left) * scaleX
    const py = (e.clientY - rect.top) * scaleY
    setCrossSection({ x1: startPt.x, y1: startPt.y, x2: px, y2: py })
    setDrawing(false)
    setStartPt(null)
  }

  const crossProfile = useMemo(() => {
    if (!crossSection) return []
    const pts: { x: number; elev: number }[] = []
    const steps = 60
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const px = crossSection.x1 + (crossSection.x2 - crossSection.x1) * t
      const py = crossSection.y1 + (crossSection.y2 - crossSection.y1) * t
      pts.push({ x: px, elev: getElevation(px, py) })
    }
    return pts
  }, [crossSection])

  return (
    <div>
      <svg viewBox="0 0 560 260" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: v.bg, cursor: drawing ? 'crosshair' : 'pointer' }} onClick={handleMapClick} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
        <text x={280} y={18} fontSize={12} fontWeight={700} fill={v.bright} textAnchor="middle">Topographic Map — Click for elevation, drag for cross-section</text>

        {/* Contour lines (outer to inner) */}
        {CONTOUR_LINES.map(c => (
          <g key={c.elevation}>
            <ellipse cx={CONTOUR_CENTER.x} cy={CONTOUR_CENTER.y} rx={c.rx} ry={c.ry} fill={c.elevation === 100 ? (isDark ? c.color + '10' : c.color + '15') : 'none'} stroke={c.color + (isDark ? '80' : '99')} strokeWidth={1.2} />
            <text x={CONTOUR_CENTER.x + c.rx - 10} y={CONTOUR_CENTER.y - 4} fontSize={8} fill={c.color + 'bb'}>{c.elevation}m</text>
          </g>
        ))}

        {/* Click point marker */}
        {clickPoint && (
          <g>
            <circle cx={clickPoint.x} cy={clickPoint.y} r={5} fill="none" stroke="#ef4444" strokeWidth={2} />
            <line x1={clickPoint.x - 7} y1={clickPoint.y} x2={clickPoint.x + 7} y2={clickPoint.y} stroke="#ef4444" strokeWidth={1.5} />
            <line x1={clickPoint.x} y1={clickPoint.y - 7} x2={clickPoint.x} y2={clickPoint.y + 7} stroke="#ef4444" strokeWidth={1.5} />
            <rect x={clickPoint.x + 10} y={clickPoint.y - 16} width={55} height={18} rx={4} fill={isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)'} stroke="rgba(239,68,68,0.3)" />
            <text x={clickPoint.x + 37} y={clickPoint.y - 3} fontSize={9} fontWeight={600} fill="#ef4444" textAnchor="middle">~{clickPoint.elev}m</text>
          </g>
        )}

        {/* Cross-section line */}
        {crossSection && (
          <line x1={crossSection.x1} y1={crossSection.y1} x2={crossSection.x2} y2={crossSection.y2} stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" />
        )}

        {/* Contour interval label */}
        <text x={20} y={248} fontSize={9} fill={v.text}>Contour interval: 100m</text>
      </svg>

      {/* Cross-section profile */}
      {crossProfile.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: v.bright, marginBottom: 4 }}>Elevation Profile (Cross-Section)</div>
          <svg viewBox="0 0 560 120" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: v.bg }}>
            {/* Axes */}
            <line x1={40} y1={10} x2={40} y2={100} stroke={v.border} strokeWidth={1} />
            <line x1={40} y1={100} x2={550} y2={100} stroke={v.border} strokeWidth={1} />
            <text x={20} y={60} fontSize={8} fill={v.text} textAnchor="middle" transform={'rotate(-90 20 60)'}>Elevation (m)</text>
            <text x={295} y={115} fontSize={8} fill={v.text} textAnchor="middle">Distance along line</text>

            {/* Y-axis labels */}
            {[100, 200, 300, 400, 500, 600].map(e => {
              const y = 100 - ((e - 50) / 650) * 85
              return (
                <g key={e}>
                  <line x1={37} y1={y} x2={43} y2={y} stroke={v.border} strokeWidth={0.5} />
                  <text x={33} y={y + 3} fontSize={7} fill={v.text} textAnchor="end">{e}</text>
                </g>
              )
            })}

            {/* Profile line */}
            <polyline
              points={crossProfile.map((pt, i) => {
                const x = 45 + (i / (crossProfile.length - 1)) * 500
                const y = 100 - ((pt.elev - 50) / 650) * 85
                return x + ',' + y
              }).join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={2}
            />
            {/* Fill under profile */}
            <polygon
              points={'45,100 ' + crossProfile.map((pt, i) => {
                const x = 45 + (i / (crossProfile.length - 1)) * 500
                const y = 100 - ((pt.elev - 50) / 650) * 85
                return x + ',' + y
              }).join(' ') + ' ' + (45 + 500) + ',100'}
              fill={isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.08)'}
              stroke="none"
            />
          </svg>
        </div>
      )}

      {clickPoint && !crossSection && (
        <div style={{ marginTop: 6, padding: '6px 10px', borderRadius: 6, background: v.bg, border: '1px solid ' + v.border, fontSize: 11, color: v.text }}>
          <b style={{ color: v.bright }}>Elevation:</b> approximately <b style={{ color: '#ef4444' }}>~{clickPoint.elev}m</b> at selected point. Drag on the map to draw a cross-section line.
        </div>
      )}
    </div>
  )
}
