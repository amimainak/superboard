'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'

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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Selected: {selectedRock ? selectedRock.name + ' rock' : selectedProcess ? selectedProcess.label.replace(/\n/g, ' ') + ' process' : '? — click a rock box or arrow'}</div>
          <div>Step 2: {selectedRock ? 'How it forms: ' + selectedRock.forms : selectedProcess ? selectedProcess.desc : 'Igneous — forms from cooling magma/lava'}</div>
          <div>Step 3: {selectedProcess ? 'Path: ' + selectedProcess.from + ' → ' + selectedProcess.to : 'Weathering breaks rock into sediments'}</div>
          <div>Step 4: Heat and pressure (no melting) → Metamorphic rock</div>
          <div>Step 5: Extreme heat melts rock back into magma</div>
          <div>Step 6: {selectedRock ? 'Examples: ' + selectedRock.examples : "The cycle repeats — Earth's crust recycles endlessly"}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> The cycle never stops: igneous → sedimentary → metamorphic → magma → igneous. Earth's crust has recycled for 4 billion years.
      </div>
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Selected: {b ? b.type + ' boundary (' + b.id + ')' : '? — click a colored boundary line'}</div>
          <div>Step 2: Type: {b ? b.type : 'Convergent / Divergent / Transform'}</div>
          <div>Step 3: {b ? 'What happens: ' + b.what : "Earth's crust = plates floating on the mantle"}</div>
          <div>Step 4: Convergent → mountains/volcanoes; Divergent → new crust; Transform → earthquakes</div>
          <div>Step 5: Subduction = one plate dives under another (oceanic under continental)</div>
          <div>Step 6: {b ? 'Example: ' + b.example : 'Ring of Fire = subduction zones around Pacific'}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Convergent: mountains/volcanoes. Divergent: new crust. Transform: earthquakes. Ring of Fire = 75% of Earth's volcanoes.
      </div>
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: {feat ? 'Selected: ' + feat.label + ' (' + feat.id + ')' : 'Click a weather feature on the map'}</div>
          <div>Step 2: {feat ? feat.desc : 'H = high pressure (clear), L = low (storms)'}</div>
          <div>Step 3: {feat && feat.id === 'coldfront' ? '★ Cold front active — sudden storms (blue triangles)' : 'Cold fronts: sudden storms (blue triangles)'}</div>
          <div>Step 4: {feat && feat.id === 'warmfront' ? '★ Warm front active — gradual rain (red semicircles)' : 'Warm fronts: gradual rain (red semicircles)'}</div>
          <div>Step 5: {feat && (feat.id === 'highP' || feat.id === 'lowP') ? '★ ' + feat.label + ' — wind flows from H to L' : 'Wind flows from High to Low pressure'}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> High pressure = sinking air (clear). Low = rising air (storms). Cold fronts: sudden storms. Warm fronts: gradual rain.
      </div>
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Cycle: {tab} | Selected: {sel ? sel.label : '? — click a process or reservoir'}</div>
          <div>Step 2: {tab === 'water' ? 'Path: Evaporation → Condensation → Precipitation → Runoff' : 'Path: Atmosphere → Photosynthesis → Organisms → Respiration → Atmosphere'}</div>
          <div>Step 3: {sel ? 'Selected step: ' + sel.desc : (tab === 'water' ? 'Transpiration — plants release water vapor' : 'Combustion — burning fossil fuels releases CO₂')}</div>
          <div>Step 4: {tab === 'water' ? 'Solar energy drives evaporation' : 'Photosynthesis ↔ respiration balance CO₂'}</div>
          <div>Step 5: Both are CLOSED cycles — nothing is lost (conservation of matter)</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Water: evaporation → condensation → precipitation → repeat. Closed system — dinosaur water is in your glass. Carbon cycles between air, oceans, rocks, life.
      </div>
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: View: {view === 'size' ? 'Relative Size' : 'Relative Distance'} | Selected: {planet ? planet.name : '? — click a planet'}</div>
          <div>Step 2: {planet ? planet.name + ' — ' + planet.distance + ' million km from Sun, ' + planet.diameter.toLocaleString() + ' km diameter' : 'Inner planets (Mercury–Mars) — rocky, close to Sun'}</div>
          <div>Step 3: {planet ? 'Group: ' + (['Mercury', 'Venus', 'Earth', 'Mars'].includes(planet.name) ? 'Inner (rocky/terrestrial)' : 'Outer (gas/ice giant)') : 'Outer planets (Jupiter–Neptune) — gas/ice giants, far'}</div>
          <div>Step 4: Kepler's Law: T² ∝ r³ — farther = slower orbit</div>
          <div>Step 5: {planet ? 'Fun fact: ' + planet.fact : 'Gravity decreases with distance² (inverse square)'}</div>
          <div>Step 6: This is why outer planets orbit slowly</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Kepler's Third Law: T² ∝ r³. Farther planets orbit slower. Mercury: 88 days. Neptune: 165 years. Newton proved this from gravity.
      </div>
</div>
  )
}

// ============================================================
// 6. Topographic Map Tool (Grades 6-8)
// ============================================================

type TerrainPreset = 'mountain' | 'valley' | 'river'

const PRESET_CONTOURS: Record<TerrainPreset, { elevation: number; rx: number; ry: number; color: string; cx: number; cy: number }[]> = {
  mountain: [
    { elevation: 100, rx: 180, ry: 70, color: '#22c55e', cx: 280, cy: 130 },
    { elevation: 200, rx: 150, ry: 58, color: '#4ade80', cx: 280, cy: 130 },
    { elevation: 300, rx: 118, ry: 44, color: '#a3e635', cx: 280, cy: 130 },
    { elevation: 400, rx: 86, ry: 32, color: '#fbbf24', cx: 280, cy: 130 },
    { elevation: 500, rx: 56, ry: 20, color: '#f59e0b', cx: 280, cy: 130 },
    { elevation: 600, rx: 28, ry: 10, color: '#92400e', cx: 280, cy: 130 },
  ],
  valley: [
    // Peak 1 (left)
    { elevation: 100, rx: 120, ry: 55, color: '#22c55e', cx: 170, cy: 130 },
    { elevation: 200, rx: 95, ry: 42, color: '#4ade80', cx: 170, cy: 130 },
    { elevation: 300, rx: 70, ry: 30, color: '#a3e635', cx: 170, cy: 130 },
    { elevation: 400, rx: 45, ry: 18, color: '#fbbf24', cx: 170, cy: 130 },
    { elevation: 450, rx: 22, ry: 9, color: '#f59e0b', cx: 170, cy: 130 },
    // Peak 2 (right)
    { elevation: 100, rx: 120, ry: 55, color: '#22c55e', cx: 390, cy: 130 },
    { elevation: 200, rx: 95, ry: 42, color: '#4ade80', cx: 390, cy: 130 },
    { elevation: 300, rx: 70, ry: 30, color: '#a3e635', cx: 390, cy: 130 },
    { elevation: 400, rx: 45, ry: 18, color: '#fbbf24', cx: 390, cy: 130 },
    { elevation: 450, rx: 22, ry: 9, color: '#f59e0b', cx: 390, cy: 130 },
  ],
  river: [
    { elevation: 100, rx: 180, ry: 70, color: '#22c55e', cx: 280, cy: 130 },
    { elevation: 200, rx: 150, ry: 58, color: '#4ade80', cx: 280, cy: 130 },
    { elevation: 300, rx: 118, ry: 44, color: '#a3e635', cx: 280, cy: 130 },
    { elevation: 400, rx: 86, ry: 32, color: '#fbbf24', cx: 280, cy: 130 },
    { elevation: 500, rx: 56, ry: 20, color: '#f59e0b', cx: 280, cy: 130 },
    { elevation: 600, rx: 28, ry: 10, color: '#92400e', cx: 280, cy: 130 },
  ],
}

function getElevationForPreset(px: number, py: number, preset: TerrainPreset): number {
  if (preset === 'mountain' || preset === 'river') {
    const cx = 280
    const cy = 130
    const dx = px - cx
    const dy = (py - cy) * (70 / 180)
    const dist = Math.sqrt(dx * dx + dy * dy)
    const maxDist = 180
    if (dist > maxDist) return 50
    const ratio = dist / maxDist
    const elev = 650 - ratio * 600
    return Math.round(elev / 50) * 50
  }
  // Valley: two peaks
  const peak1 = { x: 170, y: 130, maxR: 120 }
  const peak2 = { x: 390, y: 130, maxR: 120 }
  const d1 = Math.sqrt(Math.pow(px - peak1.x, 2) + Math.pow((py - peak1.y) * (55 / 120), 2))
  const d2 = Math.sqrt(Math.pow(px - peak2.x, 2) + Math.pow((py - peak2.y) * (55 / 120), 2))
  const e1 = d1 <= peak1.maxR ? Math.round((500 - (d1 / peak1.maxR) * 450) / 50) * 50 : 50
  const e2 = d2 <= peak2.maxR ? Math.round((500 - (d2 / peak2.maxR) * 450) / 50) * 50 : 50
  return Math.max(e1, e2, 50)
}

const PRESET_LABELS: { id: TerrainPreset; label: string; desc: string }[] = [
  { id: 'mountain', label: 'Mountain', desc: 'Concentric contours showing a peak. Close contours = steep slope.' },
  { id: 'valley', label: 'Valley', desc: 'Two ridges with a low saddle between them. Click between peaks to see lower elevation.' },
  { id: 'river', label: 'River Valley', desc: 'Mountain terrain with a river cutting through. Contours form V-shapes pointing upstream.' },
]

export function TopographicMapTool({ isDark }: ToolProps) {
  const [preset, setPreset] = useState<TerrainPreset>('mountain')
  const [clickPoint, setClickPoint] = useState<{ x: number; y: number; elev: number } | null>(null)
  const [crossSection, setCrossSection] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [startPt, setStartPt] = useState<{ x: number; y: number } | null>(null)
  const v = s(isDark)
  const contours = PRESET_CONTOURS[preset]

  const handlePresetChange = (p: TerrainPreset) => {
    setPreset(p)
    setClickPoint(null)
    setCrossSection(null)
    setDrawing(false)
    setStartPt(null)
  }

  const getElev = (px: number, py: number) => getElevationForPreset(px, py, preset)

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (drawing) return
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const viewBox = svg.viewBox.baseVal
    const scaleX = viewBox.width / rect.width
    const scaleY = viewBox.height / rect.height
    const px = (e.clientX - rect.left) * scaleX
    const py = (e.clientY - rect.top) * scaleY
    setClickPoint({ x: px, y: py, elev: getElev(px, py) })
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
      pts.push({ x: px, elev: getElev(px, py) })
    }
    return pts
  }, [crossSection, preset])

  const presetInfo = PRESET_LABELS.find(p => p.id === preset)

  return (
    <div>
      {/* Preset buttons */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {PRESET_LABELS.map(p => (
          <button key={p.id}
            onClick={() => handlePresetChange(p.id)}
            style={{
              padding: '3px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer' as const,
              background: preset === p.id ? 'rgba(5,150,105,0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
              border: '1px solid ' + (preset === p.id ? 'rgba(5,150,105,0.3)' : v.border),
              color: preset === p.id ? '#34d399' : v.bright, fontWeight: preset === p.id ? 600 : 400,
            }}>
            {p.label}
          </button>
        ))}
      </div>
      {presetInfo && (
        <div style={{ fontSize: 9, color: v.text, marginBottom: 6, padding: '4px 8px', borderRadius: 4, background: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}>
          {presetInfo.desc}
        </div>
      )}

      <svg viewBox="0 0 560 260" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: v.bg, cursor: drawing ? 'crosshair' : 'pointer' }} onClick={handleMapClick} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
        <text x={280} y={18} fontSize={12} fontWeight={700} fill={v.bright} textAnchor="middle">Topographic Map — Click for elevation, drag for cross-section</text>

        {/* Contour lines */}
        {contours.map(c => (
          <g key={c.elevation + '-' + c.cx}>
            <ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={c.elevation === 100 ? (isDark ? c.color + '10' : c.color + '15') : 'none'} stroke={c.color + (isDark ? '80' : '99')} strokeWidth={1.2} />
            <text x={c.cx + c.rx - 10} y={c.cy - 4} fontSize={8} fill={c.color + 'bb'}>{c.elevation}m</text>
          </g>
        ))}

        {/* River overlay for river preset */}
        {preset === 'river' && (
          <g>
            <path d="M180 260 C220 200 240 180 260 160 C280 140 300 120 310 100 C320 80 350 50 400 30" fill="none" stroke="#3b82f6" strokeWidth={3} opacity={0.7} />
            <path d="M180 260 C220 200 240 180 260 160 C280 140 300 120 310 100 C320 80 350 50 400 30" fill="none" stroke="#93c5fd" strokeWidth={1} opacity={0.5} strokeDasharray="4 3" />
            <text x={340} y={55} fontSize={9} fill="#3b82f6" fontWeight={600} transform="rotate(-30 340 55)">River</text>
            {/* V-shape contour notches pointing upstream */}
            <path d="M240 190 L248 183 L256 190" fill="none" stroke="#3b82f6" strokeWidth={1} opacity={0.6} />
            <path d="M275 155 L283 148 L291 155" fill="none" stroke="#3b82f6" strokeWidth={1} opacity={0.6} />
          </g>
        )}

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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Terrain: {preset} preset | {clickPoint ? 'point at (' + clickPoint.x.toFixed(0) + ', ' + clickPoint.y.toFixed(0) + ') → ~' + clickPoint.elev + 'm' : 'no point selected'}</div>
          <div>Step 2: {crossSection ? 'Cross-section drawn: (' + crossSection.x1.toFixed(0) + ',' + crossSection.y1.toFixed(0) + ') → (' + crossSection.x2.toFixed(0) + ',' + crossSection.y2.toFixed(0) + ')' : 'Click on the map for elevation, drag to draw a cross-section'}</div>
          <div>Step 3: {presetInfo ? presetInfo.desc : 'Close contour lines = steep slope'}</div>
          <div>Step 4: Wide spacing = gentle slope</div>
          <div>Step 5: V-shapes point upstream (river preset)</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Contour lines = equal elevation. Close lines = steep. V-shapes point upstream. Reading contours = seeing 3D from 2D.
      </div>
</div>
  )
}

// ============================================================
// 7. Weather Observation Tool (Grades K-5)
// ============================================================

type Sky = 'sunny' | 'cloudy' | 'rainy' | 'snowy'
type Wind = 'calm' | 'breezy' | 'windy'
type Precip = 'none' | 'light' | 'heavy'

interface Observation {
  day: number
  sky: Sky
  temp: number
  wind: Wind
  precip: Precip
}

const SKY_OPTIONS: { id: Sky; label: string; icon: string; color: string }[] = [
  { id: 'sunny', label: 'Sunny', icon: '☀', color: '#fbbf24' },
  { id: 'cloudy', label: 'Cloudy', icon: '☁', color: '#94a3b8' },
  { id: 'rainy', label: 'Rainy', icon: '🌧', color: '#60a5fa' },
  { id: 'snowy', label: 'Snowy', icon: '❄', color: '#cbd5e1' },
]

const WIND_OPTIONS: { id: Wind; label: string; icon: string }[] = [
  { id: 'calm', label: 'Calm', icon: '🍃' },
  { id: 'breezy', label: 'Breezy', icon: '🌬' },
  { id: 'windy', label: 'Windy', icon: '💨' },
]

const PRECIP_OPTIONS: { id: Precip; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'light', label: 'Light' },
  { id: 'heavy', label: 'Heavy' },
]

const skyIcon = (sky: Sky) => SKY_OPTIONS.find(o => o.id === sky)?.icon ?? '?'
const skyColor = (sky: Sky) => SKY_OPTIONS.find(o => o.id === sky)?.color ?? '#94a3b8'

export function WeatherObservationTool({ isDark }: ToolProps) {
  const v = s(isDark)
  const [sky, setSky] = useState<Sky>('sunny')
  const [temp, setTemp] = useState(20)
  const [wind, setWind] = useState<Wind>('calm')
  const [precip, setPrecip] = useState<Precip>('none')
  const [days, setDays] = useState<Observation[]>([])

  const saveObservation = () => {
    if (days.length >= 7) return
    setDays([...days, { day: days.length + 1, sky, temp, wind, precip }])
  }

  const resetWeek = () => setDays([])

  const avgTemp = days.length > 0 ? days.reduce((a, b) => a + b.temp, 0) / days.length : 0
  const trend = useMemo(() => {
    if (days.length < 2) return 'not enough days yet'
    const first = days.slice(0, Math.ceil(days.length / 2)).reduce((a, b) => a + b.temp, 0) / Math.ceil(days.length / 2)
    const last = days.slice(Math.floor(days.length / 2)).reduce((a, b) => a + b.temp, 0) / Math.ceil(days.length / 2)
    const diff = last - first
    if (diff > 2) return 'getting WARMER (↑ ' + diff.toFixed(1) + '°C)'
    if (diff < -2) return 'getting COLDER (↓ ' + Math.abs(diff).toFixed(1) + '°C)'
    return 'stable (change ' + diff.toFixed(1) + '°C)'
  }, [days])

  const rainCount = days.filter(d => d.precip !== 'none').length
  const skyCount = (sky: Sky) => days.filter(d => d.sky === sky).length
  const mostCommonSky = days.length > 0
    ? SKY_OPTIONS.reduce((a, b) => skyCount(b.id) > skyCount(a.id) ? b : a, SKY_OPTIONS[0])
    : null

  return (
    <div>
      {/* Current observation card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, background: v.bg, border: '1px solid ' + v.border, marginBottom: 8 }}>
        <div style={{ fontSize: 32 }}>{skyIcon(sky)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: v.text }}>Day {days.length + 1} of 7</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: skyColor(sky) }}>{temp.toFixed(0)}°C</div>
          <div style={{ fontSize: 10, color: v.text }}>{wind} · precip: {precip}</div>
        </div>
      </div>

      {/* Sky selector */}
      <div style={{ fontSize: 10, fontWeight: 700, color: v.text, marginBottom: 4 }}>SKY CONDITION</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
        {SKY_OPTIONS.map(o => (
          <button key={o.id} onClick={() => setSky(o.id)} style={{ padding: '6px 2px', borderRadius: 6, fontSize: 10, fontWeight: sky === o.id ? 700 : 500, border: '1px solid ' + (sky === o.id ? o.color : v.border), background: sky === o.id ? o.color + '20' : v.bg, color: sky === o.id ? o.color : v.text, cursor: 'pointer' }}>
            <div style={{ fontSize: 14 }}>{o.icon}</div>
            {o.label}
          </button>
        ))}
      </div>

      {/* Temperature slider */}
      <div style={{ fontSize: 10, fontWeight: 700, color: v.text, marginBottom: 4 }}>TEMPERATURE: {temp}°C</div>
      <input type="range" min={-10} max={40} step={1} value={temp} onChange={e => setTemp(parseInt(e.target.value))} style={{ width: '100%', marginBottom: 8 }} />

      {/* Wind + Precipitation */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: v.text, marginBottom: 4 }}>WIND</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
            {WIND_OPTIONS.map(o => (
              <button key={o.id} onClick={() => setWind(o.id)} style={{ padding: '5px 2px', borderRadius: 5, fontSize: 9, fontWeight: wind === o.id ? 700 : 500, border: '1px solid ' + (wind === o.id ? '#22c55e' : v.border), background: wind === o.id ? 'rgba(34,197,94,0.12)' : v.bg, color: wind === o.id ? '#22c55e' : v.text, cursor: 'pointer' }}>
                <div style={{ fontSize: 12 }}>{o.icon}</div>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: v.text, marginBottom: 4 }}>PRECIPITATION</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
            {PRECIP_OPTIONS.map(o => (
              <button key={o.id} onClick={() => setPrecip(o.id)} style={{ padding: '5px 2px', borderRadius: 5, fontSize: 9, fontWeight: precip === o.id ? 700 : 500, border: '1px solid ' + (precip === o.id ? '#60a5fa' : v.border), background: precip === o.id ? 'rgba(96,165,250,0.12)' : v.bg, color: precip === o.id ? '#60a5fa' : v.text, cursor: 'pointer' }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button onClick={saveObservation} disabled={days.length >= 7} style={{ flex: 1, padding: '7px 0', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid rgba(34,197,94,0.4)', background: days.length >= 7 ? v.bg : 'rgba(34,197,94,0.12)', color: days.length >= 7 ? v.text : '#22c55e', cursor: days.length >= 7 ? 'not-allowed' : 'pointer' }}>
          {days.length >= 7 ? 'Week full ✓' : '+ Save Day ' + (days.length + 1)}
        </button>
        <button onClick={resetWeek} style={{ padding: '7px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid ' + v.border, background: v.bg, color: v.text, cursor: 'pointer' }}>↺ Reset</button>
      </div>

      {/* 7-day tracker */}
      <div style={{ fontSize: 10, fontWeight: 700, color: v.text, marginBottom: 4 }}>7-DAY TRACKER</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 8 }}>
        {Array.from({ length: 7 }).map((_, i) => {
          const d = days[i]
          return (
            <div key={i} style={{ padding: '4px 2px', borderRadius: 4, border: '1px solid ' + (d ? skyColor(d.sky) + '60' : v.border), background: d ? skyColor(d.sky) + '15' : v.bg, textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: v.text }}>D{i + 1}</div>
              <div style={{ fontSize: 12 }}>{d ? skyIcon(d.sky) : '—'}</div>
              <div style={{ fontSize: 8, color: d ? skyColor(d.sky) : v.text, fontWeight: 700 }}>{d ? d.temp + '°' : ''}</div>
            </div>
          )
        })}
      </div>

      {/* Pattern analysis */}
      {days.length >= 2 && (
        <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', marginBottom: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>📊 WEATHER PATTERN</div>
          <div style={{ fontSize: 11, color: v.bright, lineHeight: 1.6 }}>
            Avg temp: <b>{avgTemp.toFixed(1)}°C</b> · Trend: <b>{trend}</b><br />
            Rainy/snowy days: <b>{rainCount}/{days.length}</b> · Most common sky: <b>{mostCommonSky ? mostCommonSky.label : '—'}</b>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Today's pick — sky: {sky}, temp: {temp}°C, wind: {wind}, precip: {precip}</div>
        <div>Step 2: Saved {days.length} of 7 days — {days.length >= 7 ? 'week complete!' : (7 - days.length) + ' more to record'}</div>
        <div>Step 3: Average temperature so far: {avgTemp.toFixed(1)}°C</div>
        <div>Step 4: Trend analysis: {trend}</div>
        <div>Step 5: Precipitation days: {rainCount}/{days.length} — {rainCount > days.length / 2 ? 'a wet week' : rainCount > 0 ? 'some rain/snow' : 'dry week'}</div>
        <div>Step 6: Meteorologists track patterns over time to forecast future weather</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Weather is daily; climate is the average over years. A week of data shows a pattern; 30 years shows the climate.
      </div>
    </div>
  )
}

// ============================================================
// 8. Seasons Model (Grades K-5)
// ============================================================

export function SeasonsModel({ isDark }: ToolProps) {
  const v = s(isDark)
  const [angle, setAngle] = useState(0) // 0 = top (NH summer), 90 = right (autumn), 180 = bottom (NH winter), 270 = left (spring)
  const [playing, setPlaying] = useState(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setAngle(a => (a + dt * 30) % 360) // 12 sec per orbit
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [playing])

  // Orbit center = (200, 200), radius = 130
  const cx = 200 + 130 * Math.sin((angle * Math.PI) / 180)
  const cy = 200 - 130 * Math.cos((angle * Math.PI) / 180)

  // Determine season from angle (NH perspective)
  // 0° = top (June solstice — NH summer); 180° = bottom (Dec solstice — NH winter)
  // 90° = right (Sep equinox — autumn); 270° = left (Mar equinox — spring)
  const nhSeason = useMemo(() => {
    if (angle < 45 || angle >= 315) return 'Summer'
    if (angle < 135) return 'Autumn'
    if (angle < 225) return 'Winter'
    return 'Spring'
  }, [angle])
  const shSeason = nhSeason === 'Summer' ? 'Winter' : nhSeason === 'Winter' ? 'Summer' : nhSeason === 'Spring' ? 'Autumn' : 'Spring'

  // Tilt direction: at NH summer (angle 0), tilt leans toward Sun (right side of Earth faces Sun, which is at center)
  // The axis always points in same direction (toward "north star"). At angle 0 (top), tilt toward Sun = away from observer top
  // For visualization: tilt axis rotated. Northern hemisphere tilts toward sun at top, away at bottom.
  const tiltTowardSun = nhSeason === 'Summer' ? 'Northern' : nhSeason === 'Winter' ? 'Southern' : 'neither (equinox)'

  // Earth axis: always tilted 23.5° toward "up" in space. We rotate the axis by 0 (top), 180 (bottom) so the N pole faces toward/away from Sun
  // Visualize: at top (NH summer), N pole tilts TOWARD Sun (toward center) → axis line from upper-right to lower-left with N on upper-right (toward sun)
  // For simplicity: axis angle relative to vertical = 23.5°, and the sign depends on position
  // At top (angle 0): N pole points toward Sun → axis tilted so top-of-axis points to center (down-ish). We'll draw axis going through Earth with rotation.
  const axisRotation = angle // axis rotates with orbital position (always points same way in space, so as Earth moves around orbit, the visual orientation of the axis rotates too)
  const nhHeatColor = nhSeason === 'Summer' ? '#ef4444' : nhSeason === 'Winter' ? '#60a5fa' : '#a3e635'
  const shHeatColor = shSeason === 'Summer' ? '#ef4444' : shSeason === 'Winter' ? '#60a5fa' : '#a3e635'

  const handleDrag = (e: React.MouseEvent<SVGSVGElement>) => {
    if (playing) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * 400
    const py = ((e.clientY - rect.top) / rect.height) * 400
    // Compute angle from center (200, 200)
    const dx = px - 200
    const dy = 200 - py // y inverted
    const ang = (Math.atan2(dx, dy) * 180) / Math.PI
    setAngle((ang + 360) % 360)
  }

  return (
    <div>
      <svg viewBox="0 0 400 400" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(219,234,254,0.2)' }}>
        {/* Orbit path */}
        <circle cx={200} cy={200} r={130} fill="none" stroke={v.border} strokeWidth={1} strokeDasharray="4 3" />

        {/* Sun at center */}
        <circle cx={200} cy={200} r={28} fill="rgba(251,191,36,0.3)" stroke="#fbbf24" strokeWidth={1.5} />
        <circle cx={200} cy={200} r={18} fill="#fbbf24" />
        <text x={200} y={204} fontSize={11} fontWeight={700} fill="#1e293b" textAnchor="middle">Sun</text>

        {/* Sun rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(d => {
          const rad = (d * Math.PI) / 180
          return <line key={d} x1={200 + 30 * Math.cos(rad)} y1={200 + 30 * Math.sin(rad)} x2={200 + 40 * Math.cos(rad)} y2={200 + 40 * Math.sin(rad)} stroke="#fbbf24" strokeWidth={1.5} />
        })}

        {/* Season labels around orbit */}
        <text x={200} y={56} fontSize={11} fontWeight={700} fill="#ef4444" textAnchor="middle">☀ NH Summer</text>
        <text x={200} y={355} fontSize={11} fontWeight={700} fill="#60a5fa" textAnchor="middle">❄ NH Winter</text>
        <text x={345} y={204} fontSize={10} fontWeight={600} fill="#a3e635" textAnchor="middle">Autumn</text>
        <text x={55} y={204} fontSize={10} fontWeight={600} fill="#a3e635" textAnchor="middle">Spring</text>

        {/* Earth at orbit position */}
        <g transform={'translate(' + cx + ' ' + cy + ')'}>
          {/* Sunlight line from sun to earth */}
          <line x1={-(cx - 200)} y1={-(cy - 200)} x2={0} y2={0} stroke="rgba(251,191,36,0.4)" strokeWidth={1} strokeDasharray="3 2" />
          {/* Earth body — split into N (top) and S (bottom) hemispheres, colored by heat */}
          <circle cx={0} cy={0} r={18} fill={isDark ? 'rgba(30,58,95,0.6)' : 'rgba(147,197,253,0.4)'} stroke="#3b82f6" strokeWidth={1.5} />
          {/* N hemisphere arc */}
          <path d="M -18 0 A 18 18 0 0 1 18 0" fill={nhHeatColor + '50'} stroke={nhHeatColor} strokeWidth={1} />
          {/* S hemisphere arc */}
          <path d="M -18 0 A 18 18 0 0 0 18 0" fill={shHeatColor + '50'} stroke={shHeatColor} strokeWidth={1} />
          {/* Tilt axis (23.5°) — rotated based on position so it always points to "north star" direction */}
          <g transform={'rotate(' + axisRotation + ')'}>
            <line x1={-7} y1={-22} x2={7} y2={22} stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="2 2" />
            <text x={-7} y={-25} fontSize={8} fill="#fbbf24" textAnchor="middle">N</text>
            <text x={7} y={30} fontSize={8} fill="#fbbf24" textAnchor="middle">S</text>
          </g>
          <text x={0} y={42} fontSize={9} fontWeight={700} fill={v.bright} textAnchor="middle">Earth</text>
        </g>
      </svg>

      {/* Play/Pause + Drag hint */}
      <div style={{ display: 'flex', gap: 6, marginTop: 6, marginBottom: 6 }}>
        <button onClick={() => setPlaying(!playing)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid rgba(251,191,36,0.4)', background: playing ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.1)', color: '#fbbf24', cursor: 'pointer' }}>
          {playing ? '⏸ Pause orbit' : '▶ Animate orbit'}
        </button>
        <button onClick={() => { setAngle(0); setPlaying(false) }} style={{ padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid ' + v.border, background: v.bg, color: v.text, cursor: 'pointer' }}>↺ Reset</button>
      </div>
      <div style={{ fontSize: 10, color: v.text, opacity: 0.7, marginBottom: 6 }}>Click anywhere on the chart to drag Earth to a different orbit position.</div>

      {/* Season readout */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <div style={{ flex: 1, padding: 8, borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: v.text }}>Northern Hemisphere</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: nhHeatColor }}>{nhSeason}</div>
        </div>
        <div style={{ flex: 1, padding: 8, borderRadius: 6, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: v.text }}>Southern Hemisphere</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: shHeatColor }}>{shSeason}</div>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Earth's axis is tilted {23.5}° from vertical (shown as dashed yellow line)</div>
        <div>Step 2: Orbit angle = {angle.toFixed(0)}° — Earth position around the Sun</div>
        <div>Step 3: {tiltTowardSun} hemisphere tilts toward the Sun → more direct sunlight → {tiltTowardSun === 'neither (equinox)' ? 'equal day/night' : 'warmer = summer'}</div>
        <div>Step 4: Northern Hemisphere season: {nhSeason} · Southern Hemisphere: {shSeason}</div>
        <div>Step 5: Hemispheres have OPPOSITE seasons — when it's summer up north, it's winter down south</div>
        <div>Step 6: One full orbit = 1 year = 4 seasons. Distance to Sun barely changes; TILT causes seasons.</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Seasons are NOT caused by distance from the Sun. They're caused by Earth's 23.5° tilt. When your hemisphere leans toward the Sun, you get summer.
      </div>
    </div>
  )
}

// ============================================================
// 9. Rock Sorter (Grades K-5)
// ============================================================

type RockCat = 'igneous' | 'sedimentary' | 'metamorphic'

interface RockDef {
  id: string
  name: string
  cat: RockCat
  emoji: string
  color: string
}

const ROCKS_TO_SORT: RockDef[] = [
  { id: 'granite', name: 'Granite', cat: 'igneous', emoji: '🪨', color: '#f87171' },
  { id: 'basalt', name: 'Basalt', cat: 'igneous', emoji: '⚫', color: '#6b7280' },
  { id: 'obsidian', name: 'Obsidian', cat: 'igneous', emoji: '🖤', color: '#1f2937' },
  { id: 'sandstone', name: 'Sandstone', cat: 'sedimentary', emoji: '🟫', color: '#fbbf24' },
  { id: 'limestone', name: 'Limestone', cat: 'sedimentary', emoji: '⬜', color: '#e5e7eb' },
  { id: 'shale', name: 'Shale', cat: 'sedimentary', emoji: '🟧', color: '#a16207' },
  { id: 'marble', name: 'Marble', cat: 'metamorphic', emoji: '⚪', color: '#f3f4f6' },
  { id: 'slate', name: 'Slate', cat: 'metamorphic', emoji: '🟦', color: '#475569' },
  { id: 'gneiss', name: 'Gneiss', cat: 'metamorphic', emoji: '🔶', color: '#a855f7' },
]

const ROCK_CATS: { id: RockCat; name: string; color: string; key: string; feature: string }[] = [
  { id: 'igneous', name: 'Igneous', color: '#ef4444', key: 'Cooled magma/lava', feature: 'Formed when hot magma or lava cools and solidifies. May have visible crystals (granite) or be glassy (obsidian).' },
  { id: 'sedimentary', name: 'Sedimentary', color: '#f59e0b', key: 'Compressed layers', feature: 'Formed when sediments (sand, mud, shells) pile up in layers and get compressed over millions of years. Often has visible layers or fossils.' },
  { id: 'metamorphic', name: 'Metamorphic', color: '#8b5cf6', key: 'Heat + pressure', feature: 'Formed when existing rocks are baked and squeezed deep underground — they recrystallize without melting. Often banded or foliated.' },
]

export function RockSorter({ isDark }: ToolProps) {
  const v = s(isDark)
  const [selected, setSelected] = useState<string | null>(null)
  const [placed, setPlaced] = useState<Record<string, RockCat>>({})
  const [wrong, setWrong] = useState<string | null>(null)

  const handleRockClick = (id: string) => {
    if (placed[id]) return
    setSelected(selected === id ? null : id)
    setWrong(null)
  }

  const handleCatClick = (cat: RockCat) => {
    if (!selected) return
    const rock = ROCKS_TO_SORT.find(r => r.id === selected)
    if (!rock) return
    if (rock.cat === cat) {
      setPlaced({ ...placed, [selected]: cat })
      setSelected(null)
      setWrong(null)
    } else {
      setWrong(selected)
      setTimeout(() => setWrong(w => (w === selected ? null : w)), 600)
    }
  }

  const reset = () => { setPlaced({}); setSelected(null); setWrong(null) }
  const placedCount = Object.keys(placed).length
  const correctCount = Object.entries(placed).filter(([id, cat]) => ROCKS_TO_SORT.find(r => r.id === id)?.cat === cat).length
  const selectedRock = ROCKS_TO_SORT.find(r => r.id === selected)
  const activeCat = selectedRock ? ROCK_CATS.find(c => c.id === selectedRock.cat) : null

  return (
    <div>
      <div style={{ fontSize: 11, color: v.text, marginBottom: 6 }}>
        Sorted: <b style={{ color: '#22c55e' }}>{correctCount}/9</b> · Selected: <b style={{ color: '#a78bfa' }}>{selectedRock ? selectedRock.name : 'none'}</b>
      </div>

      {/* Rock grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 8 }}>
        {ROCKS_TO_SORT.map(r => {
          const isPlaced = !!placed[r.id]
          const isSelected = selected === r.id
          const isWrong = wrong === r.id
          return (
            <button
              key={r.id}
              onClick={() => handleRockClick(r.id)}
              disabled={isPlaced}
              style={{
                padding: '8px 2px',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: isSelected ? 700 : 500,
                border: '1.5px solid ' + (isSelected ? '#a78bfa' : isPlaced ? '#22c55e' : v.border),
                background: isPlaced ? 'rgba(34,197,94,0.15)' : isSelected ? 'rgba(167,139,250,0.12)' : v.bg,
                color: isPlaced ? '#22c55e' : isSelected ? '#a78bfa' : v.bright,
                cursor: isPlaced ? 'default' : 'pointer',
                transform: isWrong ? 'translateX(-3px)' : 'translateX(0)',
                transition: 'transform 0.1s',
                opacity: isPlaced ? 0.5 : 1,
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 2 }}>{r.emoji}</div>
              {r.name}
              {isPlaced && <div style={{ fontSize: 8, marginTop: 2 }}>✓</div>}
            </button>
          )
        })}
      </div>

      {/* Category targets */}
      <div style={{ fontSize: 10, fontWeight: 700, color: v.text, marginBottom: 4 }}>CLICK A CATEGORY TO SORT THE ROCK</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
        {ROCK_CATS.map(c => {
          const rocksInCat = ROCKS_TO_SORT.filter(r => placed[r.id] === c.id)
          return (
            <button
              key={c.id}
              onClick={() => handleCatClick(c.id)}
              disabled={!selected}
              style={{
                padding: '6px 2px',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 700,
                border: '1.5px solid ' + (selected ? c.color : v.border),
                background: selected ? c.color + '20' : v.bg,
                color: selected ? c.color : v.text,
                cursor: selected ? 'pointer' : 'not-allowed',
                opacity: selected ? 1 : 0.5,
              }}
            >
              {c.name}
              <div style={{ fontSize: 8, marginTop: 2, fontWeight: 500, opacity: 0.8 }}>{c.key}</div>
              <div style={{ fontSize: 9, marginTop: 2, color: '#22c55e' }}>{rocksInCat.length}/3</div>
            </button>
          )
        })}
      </div>

      <button onClick={reset} style={{ width: '100%', padding: '6px 0', borderRadius: 6, fontSize: 10, fontWeight: 600, border: '1px solid ' + v.border, background: v.bg, color: v.text, cursor: 'pointer', marginBottom: 6 }}>↺ Reset all</button>

      {/* Selected rock info */}
      {selectedRock && activeCat && (
        <div style={{ padding: '8px 10px', borderRadius: 6, background: activeCat.color + '15', border: '1px solid ' + activeCat.color + '50', marginBottom: 6 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: activeCat.color }}>{selectedRock.emoji} {selectedRock.name}</div>
          <div style={{ fontSize: 10, color: v.text, marginTop: 4 }}>Key feature of {activeCat.name} rocks: {activeCat.feature}</div>
        </div>
      )}

      {/* How It Works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Click a rock to select it — currently: {selectedRock ? selectedRock.name : 'none selected'}</div>
        <div>Step 2: Click a category — {selectedRock ? 'rock will be placed if correct, shake if wrong' : 'select a rock first'}</div>
        <div>Step 3: Igneous = cooled magma/lava (Granite, Basalt, Obsidian)</div>
        <div>Step 4: Sedimentary = compressed layers (Sandstone, Limestone, Shale)</div>
        <div>Step 5: Metamorphic = heat + pressure (Marble, Slate, Gneiss)</div>
        <div>Step 6: Progress: {placedCount}/9 placed · {correctCount} correct</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Every rock tells a story. Igneous = fire (magma). Sedimentary = layers (water/wind). Metamorphic = baked (heat + pressure). The rock cycle connects all three.
      </div>
    </div>
  )
}

// ============================================================
// 10. Layered Earth Cross-Section (Grades 6-8)
// ============================================================

const EARTH_LAYERS = [
  {
    id: 'crust',
    name: 'Crust',
    depthStart: 0,
    depthEnd: 70,
    color: '#22c55e',
    fill: 'rgba(34,197,94,0.4)',
    infoBg: 'rgba(34,197,94,0.08)',
    composition: 'Solid silicate rocks (basalt under oceans, granite under continents). Rich in oxygen and silicon.',
    temperature: '≈ 20°C (surface) to 400°C (base)',
    state: 'Solid (brittle)',
    facts: 'Thinnest layer. Continental crust is thicker (30-70 km) but lighter; oceanic crust is thinner (5-10 km) but denser.',
  },
  {
    id: 'mantle',
    name: 'Mantle',
    depthStart: 70,
    depthEnd: 2890,
    color: '#f59e0b',
    fill: 'rgba(245,158,11,0.4)',
    infoBg: 'rgba(245,158,11,0.08)',
    composition: 'Hot silicate rocks rich in iron and magnesium. Flows slowly like very thick syrup (asthenosphere).',
    temperature: '≈ 500°C to 4000°C',
    state: 'Solid (but flows over geologic time — plastic)',
    facts: 'Largest layer by volume (84% of Earth). Convection currents here drive plate tectonics.',
  },
  {
    id: 'outercore',
    name: 'Outer Core',
    depthStart: 2890,
    depthEnd: 5150,
    color: '#ef4444',
    fill: 'rgba(239,68,68,0.5)',
    infoBg: 'rgba(239,68,68,0.1)',
    composition: 'Liquid iron and nickel (molten metal).',
    temperature: '≈ 4000°C to 5400°C',
    state: 'LIQUID',
    facts: 'Motion of this liquid metal generates Earth\'s magnetic field via the dynamo effect. Without it, solar wind would strip our atmosphere.',
  },
  {
    id: 'innercore',
    name: 'Inner Core',
    depthStart: 5150,
    depthEnd: 6371,
    color: '#fbbf24',
    fill: 'rgba(251,191,36,0.7)',
    infoBg: 'rgba(251,191,36,0.12)',
    composition: 'Solid iron-nickel alloy.',
    temperature: '≈ 5400°C (as hot as the Sun\'s surface!)',
    state: 'SOLID (despite the heat — immense pressure keeps it solid)',
    facts: 'Earth\'s deepest layer. It spins slightly faster than the rest of Earth. About the size of the Moon.',
  },
]

export function LayeredEarthCrossSection({ isDark }: ToolProps) {
  const v = s(isDark)
  const [selected, setSelected] = useState<string | null>('crust')
  const layer = EARTH_LAYERS.find(l => l.id === selected)

  // SVG: half-circle (wedge) cross-section from 0 to 6371 km
  // Use a quarter circle, layers as concentric arcs
  const cx = 30, cy = 320, R = 280
  const totalDepth = 6371

  const layerRadius = (depth: number) => R - (depth / totalDepth) * R

  return (
    <div>
      <svg viewBox="0 0 380 360" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: isDark ? 'rgba(15,23,42,0.4)' : 'rgba(219,234,254,0.15)' }}>
        <text x={190} y={18} fontSize={12} fontWeight={700} fill={v.bright} textAnchor="middle">Earth's Interior (Cross-Section)</text>

        {/* Layers as concentric quarter-circles (from surface down) */}
        {[...EARTH_LAYERS].reverse().map(l => {
          const r = layerRadius(l.depthEnd)
          const isSel = selected === l.id
          return (
            <g key={l.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(l.id)}>
              <path
                d={'M ' + cx + ' ' + cy + ' L ' + (cx + r) + ' ' + cy + ' A ' + r + ' ' + r + ' 0 0 0 ' + cx + ' ' + (cy - r) + ' Z'}
                fill={isSel ? l.fill : l.fill.replace('0.4', '0.25').replace('0.5', '0.3').replace('0.7', '0.4')}
                stroke={isSel ? l.color : l.color + '60'}
                strokeWidth={isSel ? 2 : 1}
              />
            </g>
          )
        })}

        {/* Depth axis on left */}
        {EARTH_LAYERS.map(l => {
          const y = cy - layerRadius(l.depthEnd)
          return (
            <g key={'axis-' + l.id}>
              <line x1={cx - 2} y1={y} x2={cx + 2} y2={y} stroke={v.text} strokeWidth={1} />
              <text x={cx - 5} y={y + 3} fontSize={8} fill={v.text} textAnchor="end">{l.depthEnd} km</text>
            </g>
          )
        })}
        <text x={12} y={180} fontSize={9} fill={v.text} textAnchor="middle" transform="rotate(-90 12 180)">Depth (km)</text>

        {/* Layer labels on the wedge */}
        {EARTH_LAYERS.map(l => {
          const midDepth = (l.depthStart + l.depthEnd) / 2
          const r = layerRadius(midDepth)
          const ang = -Math.PI / 4 // midpoint angle of the quarter
          const x = cx + r * Math.cos(ang)
          const y = cy + r * Math.sin(ang)
          return (
            <g key={'label-' + l.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(l.id)}>
              <text x={x} y={y} fontSize={10} fontWeight={700} fill={selected === l.id ? l.color : v.bright} textAnchor="middle">{l.name}</text>
            </g>
          )
        })}

        {/* Surface label */}
        <text x={cx + R + 6} y={cy + 4} fontSize={9} fill={v.text}>Surface</text>
      </svg>

      {/* Layer info panel */}
      {layer && (
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: layer.infoBg, border: '1px solid ' + layer.color + '50' }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: layer.color, marginBottom: 4 }}>{layer.name} ({layer.depthStart}-{layer.depthEnd} km)</div>
          <div style={{ fontSize: 10, color: v.text, lineHeight: 1.6 }}>
            <div><b style={{ color: v.bright }}>Composition:</b> {layer.composition}</div>
            <div><b style={{ color: v.bright }}>Temperature:</b> {layer.temperature}</div>
            <div><b style={{ color: v.bright }}>State:</b> {layer.state}</div>
            <div style={{ marginTop: 4 }}><b style={{ color: v.bright }}>Key fact:</b> {layer.facts}</div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Selected layer: {layer ? layer.name + ' (' + layer.depthStart + '-' + layer.depthEnd + ' km)' : '? — click a layer'}</div>
        <div>Step 2: Composition: {layer ? layer.composition : '—'}</div>
        <div>Step 3: Temperature: {layer ? layer.temperature : '—'}</div>
        <div>Step 4: State: {layer ? layer.state : '—'}</div>
        <div>Step 5: Earth has 4 main layers — Crust (thin) → Mantle (thick) → Outer Core (liquid) → Inner Core (solid)</div>
        <div>Step 6: Heat increases with depth; pressure keeps inner core SOLID despite Sun-like temperatures</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> We've never drilled past the crust. Everything we know about the deep Earth comes from seismic waves — they bend, slow, and reflect off each layer like sonar.
      </div>
    </div>
  )
}

// ============================================================
// 11. Moon Phase Simulator (Grades 6-8)
// ============================================================

const MOON_PHASES = [
  { angle: 0, name: 'New Moon', illum: 0, emoji: '🌑' },
  { angle: 45, name: 'Waxing Crescent', illum: 25, emoji: '🌒' },
  { angle: 90, name: 'First Quarter', illum: 50, emoji: '🌓' },
  { angle: 135, name: 'Waxing Gibbous', illum: 75, emoji: '🌔' },
  { angle: 180, name: 'Full Moon', illum: 100, emoji: '🌕' },
  { angle: 225, name: 'Waning Gibbous', illum: 75, emoji: '🌖' },
  { angle: 270, name: 'Last Quarter', illum: 50, emoji: '🌗' },
  { angle: 315, name: 'Waning Crescent', illum: 25, emoji: '🌘' },
]

export function MoonPhaseSimulator({ isDark }: ToolProps) {
  const v = s(isDark)
  const [angle, setAngle] = useState(90) // moon orbit angle, 0 = between Earth and Sun (New Moon)
  const [playing, setPlaying] = useState(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setAngle(a => (a + dt * 25) % 360)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [playing])

  // Sun on left, Earth at center (200, 200), moon orbits at radius 120
  const sunX = 30, sunY = 200
  const earthX = 200, earthY = 200
  const orbitR = 130
  const moonX = earthX + orbitR * Math.cos((angle * Math.PI) / 180)
  const moonY = earthY + orbitR * Math.sin((angle * Math.PI) / 180)

  // Find phase
  const phase = MOON_PHASES.reduce((closest, p) => {
    const dc = Math.min(Math.abs(angle - p.angle), 360 - Math.abs(angle - p.angle))
    const cc = Math.min(Math.abs(angle - closest.angle), 360 - Math.abs(angle - closest.angle))
    return dc < cc ? p : closest
  }, MOON_PHASES[0])
  const illum = Math.round((1 - Math.cos((angle * Math.PI) / 180)) / 2 * 100)

  // Moon view (as seen from Earth): which side is lit
  // The sun lights the side of moon facing the sun. From Earth we see the side facing Earth.
  // When moon is at angle 0 (between sun and earth), we see the dark side → New Moon
  // When at angle 180 (opposite sun), we see the fully lit side → Full Moon
  // For SVG: draw moon circle, then mask with a "lit" half based on angle
  // Simpler: use the emoji + show illum %
  const isWaxing = angle > 0 && angle < 180

  const handleDrag = (e: React.MouseEvent<SVGSVGElement>) => {
    if (playing) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * 400
    const py = ((e.clientY - rect.top) / rect.height) * 400
    const dx = px - earthX
    const dy = py - earthY
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI
    setAngle((ang + 360) % 360)
  }

  // Build moon shadow path: lit fraction
  // Use two arcs: outer circle + inner ellipse for terminator
  // For waxing (right side lit): terminator ellipse from top to bottom with rx based on illumination
  // Simpler approach: draw the moon, then overlay a "dark" shape on the unlit side
  const moonR = 14
  const litFraction = (1 - Math.cos((angle * Math.PI) / 180)) / 2 // 0 (new) to 1 (full)
  // Terminator: an ellipse passing through top and bottom of moon
  // rx of terminator = moonR * |2*litFraction - 1|, with side based on phase
  const termRx = moonR * Math.abs(2 * litFraction - 1)
  const waxing = angle < 180 // waxing = lit side growing (right side lit from Earth view in N hemisphere)

  return (
    <div>
      <svg viewBox="0 0 400 320" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: isDark ? 'rgba(15,23,42,0.7)' : 'rgba(30,58,95,0.15)' }} onMouseMove={e => { if (e.buttons === 1) handleDrag(e) }} onClick={handleDrag}>
        <text x={200} y={20} fontSize={12} fontWeight={700} fill={v.bright} textAnchor="middle">Sun — Earth — Moon</text>

        {/* Sun (left) */}
        <circle cx={sunX} cy={sunY} r={20} fill="rgba(251,191,36,0.4)" stroke="#fbbf24" strokeWidth={1.5} />
        <circle cx={sunX} cy={sunY} r={12} fill="#fbbf24" />
        <text x={sunX} y={sunY + 35} fontSize={9} fill={v.text} textAnchor="middle">Sun</text>
        {/* Sun rays */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(d => {
          const rad = (d * Math.PI) / 180
          return <line key={d} x1={sunX + 22 * Math.cos(rad)} y1={sunY + 22 * Math.sin(rad)} x2={sunX + 30 * Math.cos(rad)} y2={sunY + 30 * Math.sin(rad)} stroke="#fbbf24" strokeWidth={1} />
        })}

        {/* Sunlight rays toward moon direction */}
        <line x1={sunX + 22} y1={sunY} x2={earthX - 25} y2={earthY} stroke="rgba(251,191,36,0.3)" strokeWidth={0.8} strokeDasharray="3 2" />

        {/* Moon orbit */}
        <circle cx={earthX} cy={earthY} r={orbitR} fill="none" stroke={v.border} strokeWidth={1} strokeDasharray="4 3" />

        {/* Earth (center) */}
        <circle cx={earthX} cy={earthY} r={16} fill="rgba(59,130,246,0.4)" stroke="#3b82f6" strokeWidth={1.5} />
        <text x={earthX} y={earthY + 4} fontSize={9} fontWeight={700} fill="#fff" textAnchor="middle">Earth</text>

        {/* Moon at orbit position */}
        <g transform={'translate(' + moonX + ' ' + moonY + ')'}>
          <circle cx={0} cy={0} r={moonR + 3} fill="rgba(255,255,255,0.05)" />
          {/* Full moon base */}
          <circle cx={0} cy={0} r={moonR} fill="#e5e7eb" stroke="#94a3b8" strokeWidth={0.5} />
          {/* Shadow overlay: dark side of moon */}
          {litFraction < 0.99 && (
            <path
              d={
                waxing
                  ? 'M 0 -' + moonR + ' A ' + moonR + ' ' + moonR + ' 0 0 0 0 ' + moonR + ' A ' + termRx + ' ' + moonR + ' 0 0 ' + (litFraction < 0.5 ? '0' : '1') + ' 0 -' + moonR + ' Z'
                  : 'M 0 -' + moonR + ' A ' + moonR + ' ' + moonR + ' 0 0 1 0 ' + moonR + ' A ' + termRx + ' ' + moonR + ' 0 0 ' + (litFraction < 0.5 ? '1' : '0') + ' 0 -' + moonR + ' Z'
              }
              fill="rgba(15,23,42,0.85)"
            />
          )}
          <text x={0} y={moonR + 14} fontSize={8} fill={v.text} textAnchor="middle">Moon</text>
        </g>
      </svg>

      <div style={{ display: 'flex', gap: 6, marginTop: 6, marginBottom: 6 }}>
        <button onClick={() => setPlaying(!playing)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid rgba(167,139,250,0.4)', background: playing ? 'rgba(167,139,250,0.2)' : 'rgba(167,139,250,0.1)', color: '#a78bfa', cursor: 'pointer' }}>
          {playing ? '⏸ Pause' : '▶ Animate Moon'}
        </button>
        <button onClick={() => { setAngle(0); setPlaying(false) }} style={{ padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid ' + v.border, background: v.bg, color: v.text, cursor: 'pointer' }}>↺ Reset</button>
      </div>
      <div style={{ fontSize: 10, color: v.text, opacity: 0.7, marginBottom: 6 }}>Drag on the chart to move the Moon around Earth.</div>

      {/* Phase readout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, background: v.bg, border: '1px solid ' + v.border, marginBottom: 6 }}>
        <div style={{ fontSize: 36 }}>{phase.emoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: v.bright }}>{phase.name}</div>
          <div style={{ fontSize: 10, color: v.text, marginTop: 2 }}>Orbit angle: {angle.toFixed(0)}° · Illuminated: {illum}%</div>
          <div style={{ height: 6, borderRadius: 3, background: v.border, marginTop: 4, overflow: 'hidden' }}>
            <div style={{ width: illum + '%', height: '100%', background: 'linear-gradient(90deg, #e5e7eb, #fbbf24)' }} />
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Moon orbit angle = {angle.toFixed(0)}° (0° = between Sun and Earth = New Moon)</div>
        <div>Step 2: Sun lights the half of the Moon facing it — we see only the lit half that faces Earth</div>
        <div>Step 3: Current phase: {phase.name} ({phase.emoji}) — {illum}% illuminated</div>
        <div>Step 4: {isWaxing ? 'Waxing — lit portion is GROWING (heading toward Full Moon)' : 'Waning — lit portion is SHRINKING (heading toward New Moon)'}</div>
        <div>Step 5: Cycle: New → Waxing Crescent → First Quarter → Waxing Gibbous → Full → Waning Gibbous → Last Quarter → Waning Crescent → New</div>
        <div>Step 6: One full cycle = ~29.5 days (a lunar month). Moon doesn't glow — it reflects sunlight.</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Half the Moon is always lit by the Sun. The PHASE we see depends on how much of that lit half faces Earth. The Moon doesn't change — our viewpoint does.
      </div>
    </div>
  )
}

// ============================================================
// 12. Eclipse Model (Grades 6-8)
// ============================================================

type EclipseType = 'solar' | 'lunar'

export function EclipseModel({ isDark }: ToolProps) {
  const v = s(isDark)
  const [type, setType] = useState<EclipseType>('solar')
  const [showTilt, setShowTilt] = useState(false)

  // Solar: Sun (left) → Moon → Earth (Moon between Sun and Earth)
  // Lunar: Sun (left) → Earth → Moon (Earth between Sun and Moon, Moon in Earth's shadow)
  // Geometry: viewBox 0 0 400 260
  const sunX = 50, sunY = 130
  const sunR = 22
  const isSolar = type === 'solar'

  // Bodies and positions
  // For solar: moon between sun and earth. Earth at right (350)
  // For lunar: earth in middle (200), moon at right (340)
  const earthPos = isSolar ? { x: 340, y: 130 } : { x: 200, y: 130 }
  const moonPos = isSolar ? { x: 200, y: 130 } : { x: 340, y: 130 }
  const earthR = 18
  const moonR = 10

  // If showTilt: moon Y position offset (orbital plane ~5° from ecliptic)
  const tiltOffset = showTilt ? (isSolar ? -28 : 28) : 0
  const actualMoonY = moonPos.y + tiltOffset

  // Shadow cone: from blocking body outward
  // Solar: Moon blocks Sun → shadow cone from Moon toward Earth
  // Lunar: Earth blocks Sun → shadow cone from Earth toward Moon
  const blocker = isSolar ? { x: moonPos.x, y: actualMoonY, r: moonR } : { x: earthPos.x, y: earthPos.y, r: earthR }
  const target = isSolar ? { x: earthPos.x, y: earthPos.y, r: earthR } : { x: moonPos.x, y: actualMoonY, r: moonR }

  // Umbra: dark central cone (apex past blocker)
  // Penumbra: lighter outer cone
  // Compute cone edges
  // Sun is wider than blocker, so umbra converges to a point at distance d = blockerR * dist(sun,blocker) / (sunR - blockerR)
  const sunBlockerDist = blocker.x - sunX
  const umbraLen = (sunR - blocker.r) > 0 ? blocker.r * sunBlockerDist / (sunR - blocker.r) : 1000
  const umbraApexX = blocker.x + umbraLen
  const umbraApexY = blocker.y // assumes aligned (no tilt)

  // Penumbra cone: opens wider from sun past blocker
  // Slope from sun edges through blocker edges outward
  const sunTopY = sunY - sunR
  const sunBotY = sunY + sunR
  const blockerTopY = blocker.y - blocker.r
  const blockerBotY = blocker.y + blocker.r
  // Extend line from sun edge through blocker edge to apex far right
  const farX = 400
  const penTopY_at = (x: number) => sunTopY + (blockerTopY - sunTopY) * ((x - sunX) / (blocker.x - sunX)) - (blockerTopY - sunTopY) * ((x - blocker.x) / (blocker.x - sunX)) * 0
  // Simpler: line through (sunX, sunTopY) and (blocker.x, blockerTopY); extend to farX
  const penTopAt = (x: number) => sunTopY + (blockerTopY - sunTopY) * (x - sunX) / (blocker.x - sunX)
  const penBotAt = (x: number) => sunBotY + (blockerBotY - sunBotY) * (x - sunX) / (blocker.x - sunX)

  // Umbra: line through (sunX, sunBotY) and (blocker.x, blockerTopY) at top; (sunX, sunTopY) and (blocker.x, blockerBotY) at bottom
  // These cross at apex (umbraApexX, umbraApexY)
  const umbraTopAt = (x: number) => sunBotY + (blockerTopY - sunBotY) * (x - sunX) / (blocker.x - sunX)
  const umbraBotAt = (x: number) => sunTopY + (blockerBotY - sunTopY) * (x - sunX) / (blocker.x - sunX)

  // Hit: if target is within umbra cone at target.x
  const targetInUmbra = !showTilt && target.y > umbraBotAt(target.x) && target.y < umbraTopAt(target.x) && target.x < umbraApexX
  const targetInPenumbra = !showTilt && target.y > penBotAt(target.x) && target.y < penTopAt(target.x)

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
        {(['solar', 'lunar'] as const).map(t => (
          <button key={t} onClick={() => setType(t)} style={{ flex: 1, padding: '7px 0', borderRadius: 6, fontSize: 11, fontWeight: type === t ? 700 : 500, border: '1px solid ' + (type === t ? 'rgba(251,191,36,0.4)' : v.border), background: type === t ? 'rgba(251,191,36,0.12)' : v.bg, color: type === t ? '#fbbf24' : v.text, cursor: 'pointer' }}>
            {t === 'solar' ? '☀ Solar Eclipse' : '🌕 Lunar Eclipse'}
          </button>
        ))}
      </div>

      <svg viewBox="0 0 400 260" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: isDark ? 'rgba(15,23,42,0.7)' : 'rgba(30,58,95,0.1)' }}>
        <text x={200} y={18} fontSize={11} fontWeight={700} fill={v.bright} textAnchor="middle">
          {isSolar ? 'Solar Eclipse: Moon blocks the Sun' : 'Lunar Eclipse: Earth blocks sunlight to Moon'}
        </text>

        {/* Sun */}
        <circle cx={sunX} cy={sunY} r={sunR} fill="rgba(251,191,36,0.4)" stroke="#fbbf24" strokeWidth={1.5} />
        <circle cx={sunX} cy={sunY} r={13} fill="#fbbf24" />
        <text x={sunX} y={sunY + 38} fontSize={9} fill={v.text} textAnchor="middle">Sun</text>

        {/* Penumbra (lighter shadow) */}
        <path
          d={'M ' + blocker.x + ' ' + (blocker.y - blocker.r) + ' L ' + farX + ' ' + penTopAt(farX) + ' L ' + farX + ' ' + penBotAt(farX) + ' L ' + blocker.x + ' ' + (blocker.y + blocker.r) + ' Z'}
          fill="rgba(120,113,108,0.15)"
        />
        {/* Umbra (dark shadow cone) */}
        {!showTilt && (
          <path
            d={'M ' + blocker.x + ' ' + (blocker.y - blocker.r) + ' L ' + umbraApexX + ' ' + umbraApexY + ' L ' + blocker.x + ' ' + (blocker.y + blocker.r) + ' Z'}
            fill="rgba(15,23,42,0.6)"
          />
        )}

        {/* Earth */}
        <circle cx={earthPos.x} cy={earthPos.y} r={earthR} fill="rgba(59,130,246,0.5)" stroke="#3b82f6" strokeWidth={1.5} />
        <text x={earthPos.x} y={earthPos.y + 4} fontSize={9} fontWeight={700} fill="#fff" textAnchor="middle">Earth</text>
        <text x={earthPos.x} y={earthPos.y + earthR + 14} fontSize={8} fill={v.text} textAnchor="middle">Earth</text>

        {/* Moon */}
        <circle cx={moonPos.x} cy={actualMoonY} r={moonR} fill={isSolar && targetInUmbra ? '#1f2937' : '#e5e7eb'} stroke="#94a3b8" strokeWidth={1} />
        <text x={moonPos.x} y={actualMoonY + moonR + 12} fontSize={8} fill={v.text} textAnchor="middle">Moon{showTilt ? ' (tilted orbit)' : ''}</text>

        {/* Orbital plane line (ecliptic) */}
        <line x1={50} y1={sunY} x2={380} y2={sunY} stroke="rgba(167,139,250,0.2)" strokeWidth={0.8} strokeDasharray="3 2" />
        {showTilt && (
          <text x={250} y={sunY - (isSolar ? 35 : 35)} fontSize={8} fill="#a78bfa" textAnchor="middle">Moon orbit tilted ~5°</text>
        )}

        {/* Outcome label */}
        <text x={200} y={245} fontSize={10} fontWeight={700} fill={targetInUmbra ? '#22c55e' : showTilt ? '#f59e0b' : '#94a3b8'} textAnchor="middle">
          {targetInUmbra
            ? (isSolar ? 'TOTAL ECLIPSE — Moon umbra hits Earth' : 'TOTAL LUNAR ECLIPSE — Moon in Earth\'s umbra')
            : showTilt
              ? 'NO ECLIPSE — Moon is above/below the shadow plane'
              : (isSolar ? 'Partial or no eclipse (geometry varies)' : 'Partial or no eclipse')}
        </text>
      </svg>

      <div style={{ display: 'flex', gap: 6, marginTop: 6, marginBottom: 6 }}>
        <button onClick={() => setShowTilt(!showTilt)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 10, fontWeight: 600, border: '1px solid ' + (showTilt ? 'rgba(167,139,250,0.4)' : v.border), background: showTilt ? 'rgba(167,139,250,0.12)' : v.bg, color: showTilt ? '#a78bfa' : v.text, cursor: 'pointer' }}>
          {showTilt ? '✓ Show orbital tilt ON' : 'Toggle orbital tilt (5°)'}
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, padding: 6, borderRadius: 6, background: v.bg, border: '1px solid ' + v.border, marginBottom: 6, fontSize: 10, color: v.text }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 12, height: 8, background: 'rgba(15,23,42,0.7)' }} /> Umbra (total shadow)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 12, height: 8, background: 'rgba(120,113,108,0.3)' }} /> Penumbra (partial)</div>
      </div>

      {/* How It Works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Eclipse type: {isSolar ? 'Solar (Moon between Sun and Earth)' : 'Lunar (Earth between Sun and Moon)'}</div>
        <div>Step 2: The blocking body casts two shadows — umbra (dark, total) and penumbra (lighter, partial)</div>
        <div>Step 3: Orbital tilt: {showTilt ? 'ON — Moon is off the Sun-Earth line' : 'OFF — perfect alignment'}</div>
        <div>Step 4: {showTilt ? 'No eclipse occurs because the Moon misses the shadow cone' : (targetInUmbra ? 'Target is inside the umbra → total eclipse' : 'Geometry varies — partial or no eclipse')}</div>
        <div>Step 5: Moon's orbit is tilted ~5° from Earth's orbit around the Sun → eclipses are RARE</div>
        <div>Step 6: {isSolar ? 'Solar eclipses happen 2-5× per year somewhere on Earth' : 'Lunar eclipses happen ~2-4× per year — visible from half the planet'}</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Eclipses don't happen every month because the Moon's orbit is tilted ~5°. Most months the Moon passes above or below the Sun-Earth line, missing the shadow cone entirely.
      </div>
    </div>
  )
}

// ============================================================
// 13. Atmospheric Lapse Rate (Grades 9-12)
// ============================================================

const ATMOSPHERE_LAYERS = [
  {
    id: 'troposphere',
    name: 'Troposphere',
    altStart: 0,
    altEnd: 12,
    tempStart: 15,
    tempEnd: -56,
    color: '#60a5fa',
    fill: 'rgba(96,165,250,0.15)',
    composition: '78% N₂, 21% O₂, trace gases, water vapor',
    lapseRate: -6.5,
    desc: 'Lowest layer where weather happens. Temperature DROPS with altitude (lapse rate ≈ -6.5°C/km). Holds 99% of water vapor and most of the atmosphere\'s mass.',
    facts: 'Mt. Everest (8.8 km) summit temp ≈ -25°C. Commercial jets fly near the top to save fuel and avoid weather.',
  },
  {
    id: 'stratosphere',
    name: 'Stratosphere',
    altStart: 12,
    altEnd: 50,
    tempStart: -56,
    tempEnd: -2,
    color: '#a78bfa',
    fill: 'rgba(167,139,250,0.15)',
    composition: 'Ozone (O₃) layer at 15-35 km absorbs UV',
    lapseRate: +1.4,
    desc: 'Temperature RISES with altitude because ozone absorbs UV radiation from the Sun, releasing heat. Stable air — no weather, no vertical mixing.',
    facts: 'The ozone layer protects life from UV-C and most UV-B. CFCs damaged it; the Montreal Protocol (1987) is healing it.',
  },
  {
    id: 'mesosphere',
    name: 'Mesosphere',
    altStart: 50,
    altEnd: 85,
    tempStart: -2,
    tempEnd: -90,
    color: '#22d3ee',
    fill: 'rgba(34,211,238,0.15)',
    composition: 'Thin air — same gases, much less dense',
    lapseRate: -2.5,
    desc: 'Temperature DROPS again — coldest place on Earth (-90°C). Where meteors burn up (shooting stars).',
    facts: 'Noctilucent clouds form here — ice crystals on meteor dust. Too high for balloons, too low for satellites — least studied layer.',
  },
  {
    id: 'thermosphere',
    name: 'Thermosphere',
    altStart: 85,
    altEnd: 600,
    tempStart: -90,
    tempEnd: 2000,
    color: '#f59e0b',
    fill: 'rgba(245,158,11,0.15)',
    composition: 'Very thin — atomic oxygen, helium, hydrogen',
    lapseRate: +2.0,
    desc: 'Temperature RISES dramatically (up to 2000°C) — absorbs high-energy X-rays and UV. But air is so thin you\'d freeze without a suit!',
    facts: 'International Space Station orbits here (~400 km). Auroras (Northern/Southern Lights) occur here — charged particles excite atoms.',
  },
]

export function AtmosphericLapseRate({ isDark }: ToolProps) {
  const v = s(isDark)
  const [selected, setSelected] = useState<string | null>('troposphere')
  const layer = ATMOSPHERE_LAYERS.find(l => l.id === selected)

  // SVG: x = altitude (0 to 600 km mapped to width), y = temperature (linear-ish)
  // viewBox 0 0 380 320; left axis = altitude (km), bottom = temp (°C)
  // Use log scale for altitude because thermosphere is 600km vs others 12-85
  const plotX = 40, plotY = 30, plotW = 320, plotH = 230
  const altMax = 600
  const tempMin = -100, tempMax = 2000

  // For visualization: use log altitude (so 0-12, 12-50, 50-85, 85-600 each get ~equal space)
  const altToY = (alt: number) => plotY + (Math.log(alt + 1) / Math.log(altMax + 1)) * plotH
  const tempToX = (temp: number) => plotX + ((temp - tempMin) / (tempMax - tempMin)) * plotW

  // Build polyline points
  const profilePoints = ATMOSPHERE_LAYERS.flatMap(l => [
    { alt: l.altStart, temp: l.tempStart },
    { alt: l.altEnd, temp: l.tempEnd },
  ])

  return (
    <div>
      <svg viewBox="0 0 380 320" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: isDark ? 'rgba(15,23,42,0.4)' : 'rgba(219,234,254,0.1)' }}>
        <text x={190} y={18} fontSize={11} fontWeight={700} fill={v.bright} textAnchor="middle">Atmospheric Temperature Profile</text>

        {/* Layer bands */}
        {ATMOSPHERE_LAYERS.map(l => {
          const y1 = altToY(l.altStart)
          const y2 = altToY(l.altEnd)
          const isSel = selected === l.id
          return (
            <g key={l.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(l.id)}>
              <rect x={plotX} y={y2} width={plotW} height={y1 - y2} fill={isSel ? l.fill.replace('0.15', '0.35') : l.fill} stroke="none" />
              <line x1={plotX} y1={y1} x2={plotX + plotW} y2={y1} stroke={v.border} strokeWidth={0.5} strokeDasharray="2 2" />
              <text x={plotX + 6} y={(y1 + y2) / 2 + 3} fontSize={10} fontWeight={isSel ? 700 : 500} fill={isSel ? l.color : v.bright}>{l.name}</text>
              <text x={plotX + 6} y={(y1 + y2) / 2 + 14} fontSize={8} fill={v.text}>{l.altStart}-{l.altEnd} km</text>
            </g>
          )
        })}

        {/* Axes */}
        <line x1={plotX} y1={plotY} x2={plotX} y2={plotY + plotH} stroke={v.border} strokeWidth={1} />
        <line x1={plotX} y1={plotY + plotH} x2={plotX + plotW} y2={plotY + plotH} stroke={v.border} strokeWidth={1} />

        {/* Y-axis labels (altitude) */}
        {[0, 12, 50, 85, 600].map(alt => {
          const y = altToY(alt)
          return (
            <g key={alt}>
              <line x1={plotX - 3} y1={y} x2={plotX} y2={y} stroke={v.border} strokeWidth={0.8} />
              <text x={plotX - 5} y={y + 3} fontSize={8} fill={v.text} textAnchor="end">{alt}</text>
            </g>
          )
        })}
        <text x={12} y={plotY + plotH / 2} fontSize={9} fill={v.text} textAnchor="middle" transform={'rotate(-90 12 ' + (plotY + plotH / 2) + ')'}>Altitude (km) — log scale</text>

        {/* X-axis labels (temperature) */}
        {[-100, 0, 200, 500, 1000, 2000].map(t => {
          const x = tempToX(t)
          if (x < plotX || x > plotX + plotW) return null
          return (
            <g key={t}>
              <line x1={x} y1={plotY + plotH} x2={x} y2={plotY + plotH + 3} stroke={v.border} strokeWidth={0.8} />
              <text x={x} y={plotY + plotH + 14} fontSize={8} fill={v.text} textAnchor="middle">{t}°</text>
            </g>
          )
        })}
        <text x={plotX + plotW / 2} y={plotY + plotH + 28} fontSize={9} fill={v.text} textAnchor="middle">Temperature (°C)</text>

        {/* Temperature profile polyline */}
        <polyline
          points={profilePoints.map(p => tempToX(p.temp) + ',' + altToY(p.alt)).join(' ')}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2}
        />
        {/* Points */}
        {profilePoints.map((p, i) => (
          <circle key={i} cx={tempToX(p.temp)} cy={altToY(p.alt)} r={2.5} fill="#ef4444" />
        ))}
      </svg>

      {/* Layer info */}
      {layer && (
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: layer.fill, border: '1px solid ' + layer.color + '50' }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: layer.color, marginBottom: 4 }}>{layer.name} ({layer.altStart}-{layer.altEnd} km)</div>
          <div style={{ fontSize: 10, color: v.text, lineHeight: 1.6 }}>
            <div><b style={{ color: v.bright }}>Composition:</b> {layer.composition}</div>
            <div><b style={{ color: v.bright }}>Temp range:</b> {layer.tempStart}°C → {layer.tempEnd}°C</div>
            <div><b style={{ color: v.bright }}>Lapse rate:</b> {layer.lapseRate > 0 ? '+' : ''}{layer.lapseRate}°C/km {layer.lapseRate > 0 ? '(temperature INCREASES with altitude)' : '(temperature DROPS with altitude)'}</div>
            <div style={{ marginTop: 4 }}><b style={{ color: v.bright }}>What happens:</b> {layer.desc}</div>
            <div style={{ marginTop: 2 }}><b style={{ color: v.bright }}>Did you know:</b> {layer.facts}</div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Selected layer: {layer ? layer.name : '? — click a band'}</div>
        <div>Step 2: Altitude range: {layer ? layer.altStart + '-' + layer.altEnd + ' km' : '—'}</div>
        <div>Step 3: Temperature change: {layer ? layer.tempStart + '°C → ' + layer.tempEnd + '°C (lapse rate ' + (layer.lapseRate > 0 ? '+' : '') + layer.lapseRate + '°C/km)' : '—'}</div>
        <div>Step 4: Troposphere: temp DROPS (air expands/cools as it rises); Stratosphere: temp RISES (ozone absorbs UV)</div>
        <div>Step 5: Mesosphere: drops again (no ozone heating); Thermosphere: rises (absorbs X-rays/UV — but air too thin to feel heat)</div>
        <div>Step 6: Standard atmosphere: -6.5°C/km in troposphere (air cools ~6.5°C per km climbed)</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Temperature zigzags with altitude — falling, rising, falling, rising. Each reversal is caused by a NEW heat source: ground (troposphere), ozone (stratosphere), no source (mesosphere), X-rays (thermosphere).
      </div>
    </div>
  )
}

// ============================================================
// 14. Coriolis Effect Simulator (Grades 9-12)
// ============================================================

type Hemisphere = 'north' | 'south'

interface Ball {
  x0: number
  y0: number
  vx0: number
  vy0: number
  path: { x: number; y: number }[]
  rotating: boolean
  hemisphere: Hemisphere
}

export function CoriolisEffectSimulator({ isDark }: ToolProps) {
  const v = s(isDark)
  const [rotating, setRotating] = useState(true)
  const [hemisphere, setHemisphere] = useState<Hemisphere>('north')
  const [ball, setBall] = useState<Ball | null>(null)
  const [launchDir, setLaunchDir] = useState<number>(0) // 0=up, 90=right, 180=down, 270=left (degrees)
  const [animTime, setAnimTime] = useState(0)
  const rafRef = useRef<number | null>(null)
  const animStartRef = useRef<number>(0)

  const cx = 200, cy = 200, R = 150
  const omega = rotating ? 0.4 : 0 // rotation rate (rad/sec) — simulated

  // Launch ball: start at center, travel in chosen direction
  const launch = () => {
    const speed = 80 // px/sec
    const rad = ((launchDir - 90) * Math.PI) / 180 // 0° = up means -y direction
    const vx = speed * Math.cos(rad)
    const vy = speed * Math.sin(rad)
    setBall({ x0: cx, y0: cy, vx0: vx, vy0: vy, path: [], rotating, hemisphere })
    setAnimTime(0)
    animStartRef.current = performance.now()
  }

  useEffect(() => {
    if (!ball) return
    const tick = (now: number) => {
      const t = (now - animStartRef.current) / 1000
      setAnimTime(t)
      if (t > 3.5) {
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [ball])

  // Compute ball position at time t (with Coriolis if rotating)
  // In rotating frame: position = p0 + v0*t + 0.5 * a_coriolis * t^2
  // Coriolis acceleration: a = -2 * omega × v
  // For 2D rotation about z-axis (omega = omega * z_hat), a = 2*omega * (vy, -vx) for one hemisphere, (-vy, vx) for other
  const computePos = (t: number) => {
    if (!ball) return { x: cx, y: cy }
    const sign = ball.hemisphere === 'north' ? -1 : 1 // Coriolis deflects right in N, left in S
    const om = ball.rotating ? 0.4 : 0
    // In inertial frame: position = p0 + v0*t (straight line)
    // In rotating frame (Earth-fixed), there's apparent Coriolis deflection
    // For simulation: ball travels straight in inertial frame; rotating frame observer sees curve
    // We'll directly simulate the curve as seen from rotating frame:
    // x(t) = x0 + vx0*t + sign * om * vy0 * t^2
    // y(t) = y0 + vy0*t - sign * om * vx0 * t^2
    const x = ball.x0 + ball.vx0 * t + sign * om * ball.vy0 * t * t
    const y = ball.y0 + ball.vy0 * t - sign * om * ball.vx0 * t * t
    return { x, y }
  }

  const ballPos = computePos(animTime)
  // Build path up to current time
  const pathPts: { x: number; y: number }[] = []
  for (let i = 0; i <= Math.min(20, Math.floor(animTime * 7)); i++) {
    const ti = (i / 20) * Math.min(animTime, 3.5)
    pathPts.push(computePos(ti))
  }

  // Disk rotation for visualization (background sector rotates if rotating)
  const diskAngle = (animTime * 0.4 * 180 / Math.PI) % 360

  const deflectionDir = !ball ? '—' : (ball.rotating ? (ball.hemisphere === 'north' ? 'RIGHT of motion' : 'LEFT of motion') : 'none (no rotation)')

  return (
    <div>
      <svg viewBox="0 0 400 380" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(219,234,254,0.15)' }}>
        <text x={200} y={18} fontSize={11} fontWeight={700} fill={v.bright} textAnchor="middle">View from {hemisphere === 'north' ? 'North' : 'South'} Pole</text>

        {/* Disk (rotating Earth) */}
        <circle cx={cx} cy={cy} r={R} fill={isDark ? 'rgba(30,58,95,0.4)' : 'rgba(147,197,253,0.2)'} stroke="#3b82f6" strokeWidth={1.5} />
        {/* Rotating sector (visual cue) */}
        <g transform={'rotate(' + (rotating ? diskAngle : 0) + ' ' + cx + ' ' + cy + ')'}>
          <path d={'M ' + cx + ' ' + cy + ' L ' + (cx + R) + ' ' + cy + ' A ' + R + ' ' + R + ' 0 0 0 ' + (cx + R * Math.cos(-Math.PI / 4)) + ' ' + (cy + R * Math.sin(-Math.PI / 4)) + ' Z'} fill="rgba(34,197,94,0.15)" />
          <line x1={cx} y1={cy} x2={cx + R} y2={cy} stroke="#22c55e" strokeWidth={1.5} />
          <line x1={cx} y1={cy} x2={cx + R * Math.cos(-Math.PI / 4)} y2={cy + R * Math.sin(-Math.PI / 4)} stroke="#22c55e" strokeWidth={1} strokeDasharray="3 2" />
        </g>

        {/* Center marker */}
        <circle cx={cx} cy={cy} r={3} fill="#fbbf24" />

        {/* Cardinal direction markers (fixed) */}
        <text x={cx} y={cy - R - 6} fontSize={9} fill={v.text} textAnchor="middle">{hemisphere === 'north' ? 'S' : 'N'}</text>
        <text x={cx} y={cy + R + 14} fontSize={9} fill={v.text} textAnchor="middle">{hemisphere === 'north' ? 'N' : 'S'}</text>
        <text x={cx - R - 8} y={cy + 4} fontSize={9} fill={v.text} textAnchor="end">W</text>
        <text x={cx + R + 8} y={cy + 4} fontSize={9} fill={v.text}>E</text>

        {/* Reference straight-line trajectory (when not rotating) */}
        {ball && !ball.rotating && (
          <line x1={ball.x0} y1={ball.y0} x2={ball.x0 + ball.vx0 * 3} y2={ball.y0 + ball.vy0 * 3} stroke="rgba(148,163,184,0.4)" strokeWidth={1} strokeDasharray="3 3" />
        )}

        {/* Ball path */}
        {pathPts.length > 1 && (
          <polyline points={pathPts.map(p => p.x + ',' + p.y).join(' ')} fill="none" stroke="#ef4444" strokeWidth={2} />
        )}

        {/* Ball */}
        {ball && animTime < 3.5 && (
          <circle cx={ballPos.x} cy={ballPos.y} r={5} fill="#ef4444" stroke="#fff" strokeWidth={1} />
        )}

        {/* Launch direction arrow */}
        {!ball && (
          <g transform={'translate(' + cx + ' ' + cy + ') rotate(' + launchDir + ')'}>
            <line x1={0} y1={0} x2={40} y2={0} stroke="#fbbf24" strokeWidth={2} markerEnd="url(#corArrow)" />
          </g>
        )}
        <defs>
          <marker id="corArrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#fbbf24" />
          </marker>
        </defs>

        <text x={200} y={370} fontSize={9} fill={v.text} textAnchor="middle">{rotating ? 'Disk is rotating (ω = 0.4 rad/s)' : 'Disk is stationary'}</text>
      </svg>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <button onClick={() => setRotating(!rotating)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 10, fontWeight: 700, border: '1px solid ' + (rotating ? 'rgba(34,197,94,0.4)' : v.border), background: rotating ? 'rgba(34,197,94,0.12)' : v.bg, color: rotating ? '#22c55e' : v.text, cursor: 'pointer' }}>
          {rotating ? '✓ Rotation ON' : 'Rotation OFF'}
        </button>
        {(['north', 'south'] as const).map(h => (
          <button key={h} onClick={() => setHemisphere(h)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 10, fontWeight: hemisphere === h ? 700 : 500, border: '1px solid ' + (hemisphere === h ? 'rgba(59,130,246,0.4)' : v.border), background: hemisphere === h ? 'rgba(59,130,246,0.12)' : v.bg, color: hemisphere === h ? '#3b82f6' : v.text, cursor: 'pointer' }}>
            {h === 'north' ? 'N Hemis' : 'S Hemis'}
          </button>
        ))}
      </div>

      {/* Launch direction picker */}
      <div style={{ fontSize: 10, fontWeight: 700, color: v.text, marginBottom: 4 }}>LAUNCH DIRECTION (from center):</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 4, marginBottom: 6 }}>
        {[{ d: 0, l: '↑ N' }, { d: 90, l: '→ E' }, { d: 180, l: '↓ S' }, { d: 270, l: '← W' }].map(o => (
          <button key={o.d} onClick={() => setLaunchDir(o.d)} style={{ padding: '5px 0', borderRadius: 5, fontSize: 10, fontWeight: launchDir === o.d ? 700 : 500, border: '1px solid ' + (launchDir === o.d ? '#fbbf24' : v.border), background: launchDir === o.d ? 'rgba(251,191,36,0.12)' : v.bg, color: launchDir === o.d ? '#fbbf24' : v.text, cursor: 'pointer' }}>
            {o.l}
          </button>
        ))}
      </div>

      <button onClick={launch} style={{ width: '100%', padding: '8px 0', borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.12)', color: '#ef4444', cursor: 'pointer', marginBottom: 6 }}>
        ⚡ Launch ball (dir: {launchDir}°)
      </button>

      {/* Deflection readout */}
      <div style={{ padding: '6px 10px', borderRadius: 6, background: v.bg, border: '1px solid ' + v.border, marginBottom: 6, fontSize: 11, color: v.bright }}>
        <b>Deflection:</b> <span style={{ color: '#ef4444' }}>{deflectionDir}</span> · Elapsed: <b>{animTime.toFixed(2)}s</b>
      </div>

      {/* How It Works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Rotation: {rotating ? 'ON (ω = 0.4 rad/s)' : 'OFF'} · Hemisphere: {hemisphere === 'north' ? 'Northern' : 'Southern'}</div>
        <div>Step 2: Launch direction: {launchDir}° · Ball speed: 80 px/s</div>
        <div>Step 3: {rotating ? 'In the rotating frame, the ball APPEARS to curve — this is the Coriolis effect' : 'On a non-rotating disk, the ball travels in a straight line'}</div>
        <div>Step 4: Deflection direction: {deflectionDir}</div>
        <div>Step 5: Coriolis acceleration: a = -2ω × v — perpendicular to velocity, magnitude scales with speed and rotation rate</div>
        <div>Step 6: This is why hurricanes spin counterclockwise in N hemisphere, clockwise in S hemisphere</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Nothing actually pushes the ball — it travels straight in space. But the ground rotates beneath it, so observers on Earth see a curve. Coriolis is an illusion of a rotating reference frame.
      </div>
    </div>
  )
}

// ============================================================
// 15. Seismograph Reader (Grades 9-12)
// ============================================================

export function SeismographReader({ isDark }: ToolProps) {
  const v = s(isDark)
  const [distance, setDistance] = useState(3000) // km from epicenter

  // P-wave speed ~ 8 km/s, S-wave speed ~ 4.5 km/s (in crust)
  const pVel = 8.0
  const sVel = 4.5
  const pArrival = distance / pVel // seconds
  const sArrival = distance / sVel
  const gap = sArrival - pArrival

  // Time window for seismogram: 0 to sArrival + 200s (capped)
  const timeMax = Math.min(sArrival + 200, 2500)
  const width = 320, height = 130
  const plotX = 40, plotY = 15, plotW = width - 50, plotH = height - 30
  const timeToX = (t: number) => plotX + (t / timeMax) * plotW

  // Generate seismogram wave: low noise before P, P-wave burst, then between, S-wave bigger burst
  const wavePoints: string[] = []
  const N = 200
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * timeMax
    let amp = 0
    // Background noise
    amp += 0.5 * Math.sin(t * 0.7) * 0.3
    if (t > pArrival) {
      const dt = t - pArrival
      amp += 1.5 * Math.exp(-dt / 80) * Math.sin(t * 1.3)
    }
    if (t > sArrival) {
      const dt = t - sArrival
      amp += 3.5 * Math.exp(-dt / 150) * Math.sin(t * 0.8)
    }
    const x = timeToX(t)
    const y = plotY + plotH / 2 - amp * (plotH / 8)
    wavePoints.push(x + ',' + y)
  }

  // Triangulation: need 3 stations; show example distances
  const stations = [
    { name: 'A', dist: distance, color: '#ef4444' },
    { name: 'B', dist: Math.round(distance * 0.7), color: '#22c55e' },
    { name: 'C', dist: Math.round(distance * 1.3), color: '#3b82f6' },
  ]

  // Triangulation map: 3 circles around stations
  const triCx = 80, triCy = 80
  const triStations = [
    { x: 40, y: 50, dist: distance, color: '#ef4444', name: 'A' },
    { x: 130, y: 50, dist: Math.round(distance * 0.7), color: '#22c55e', name: 'B' },
    { x: 85, y: 120, dist: Math.round(distance * 1.3), color: '#3b82f6', name: 'C' },
  ]
  // Map distance to radius for triangulation viz (scaled)
  const distToR = (d: number) => 18 + (d / 10000) * 35

  return (
    <div>
      {/* Distance slider */}
      <div style={{ fontSize: 10, fontWeight: 700, color: v.text, marginBottom: 4 }}>DISTANCE FROM EPICENTER: {distance} km</div>
      <input type="range" min={100} max={10000} step={100} value={distance} onChange={e => setDistance(parseInt(e.target.value))} style={{ width: '100%', marginBottom: 8 }} />

      <svg viewBox="0 0 380 140" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(0,0,0,0.03)' }}>
        <text x={190} y={12} fontSize={11} fontWeight={700} fill={v.bright} textAnchor="middle">Seismogram (amplitude vs time)</text>

        {/* Center line */}
        <line x1={plotX} y1={plotY + plotH / 2} x2={plotX + plotW} y2={plotY + plotH / 2} stroke={v.border} strokeWidth={0.5} />

        {/* P arrival marker */}
        <line x1={timeToX(pArrival)} y1={plotY} x2={timeToX(pArrival)} y2={plotY + plotH} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" />
        <text x={timeToX(pArrival)} y={plotY + 8} fontSize={9} fontWeight={700} fill="#3b82f6" textAnchor="middle">P</text>

        {/* S arrival marker */}
        <line x1={timeToX(sArrival)} y1={plotY} x2={timeToX(sArrival)} y2={plotY + plotH} stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" />
        <text x={timeToX(sArrival)} y={plotY + 8} fontSize={9} fontWeight={700} fill="#ef4444" textAnchor="middle">S</text>

        {/* Waveform */}
        <polyline points={wavePoints.join(' ')} fill="none" stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={1} />

        {/* X-axis */}
        <line x1={plotX} y1={plotY + plotH} x2={plotX + plotW} y2={plotY + plotH} stroke={v.border} strokeWidth={1} />
        {[0, pArrival, sArrival, timeMax].map((t, i) => (
          <g key={i}>
            <line x1={timeToX(t)} y1={plotY + plotH} x2={timeToX(t)} y2={plotY + plotH + 3} stroke={v.border} strokeWidth={0.8} />
            <text x={timeToX(t)} y={plotY + plotH + 12} fontSize={8} fill={v.text} textAnchor="middle">{t.toFixed(0)}s</text>
          </g>
        ))}
        <text x={plotX + plotW / 2} y={plotY + plotH + 24} fontSize={9} fill={v.text} textAnchor="middle">Time (seconds after earthquake)</text>
      </svg>

      {/* Arrival stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 6, marginBottom: 6 }}>
        <div style={{ padding: 8, borderRadius: 6, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: v.text }}>P-wave arrival</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>{pArrival.toFixed(0)}s</div>
          <div style={{ fontSize: 8, color: v.text }}>{pVel} km/s</div>
        </div>
        <div style={{ padding: 8, borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: v.text }}>S-wave arrival</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{sArrival.toFixed(0)}s</div>
          <div style={{ fontSize: 8, color: v.text }}>{sVel} km/s</div>
        </div>
        <div style={{ padding: 8, borderRadius: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: v.text }}>P-S gap</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fbbf24' }}>{gap.toFixed(0)}s</div>
          <div style={{ fontSize: 8, color: v.text }}>→ distance</div>
        </div>
      </div>

      {/* Triangulation map */}
      <div style={{ fontSize: 10, fontWeight: 700, color: v.text, marginBottom: 4 }}>📍 TRIANGULATION (3 stations find epicenter)</div>
      <svg viewBox="0 0 200 160" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: v.bg }}>
        {triStations.map(st => (
          <g key={st.name}>
            <circle cx={st.x} cy={st.y} r={distToR(st.dist)} fill="none" stroke={st.color + '60'} strokeWidth={1} strokeDasharray="3 2" />
            <circle cx={st.x} cy={st.y} r={4} fill={st.color} />
            <text x={st.x + 7} y={st.y - 5} fontSize={9} fontWeight={700} fill={st.color}>St {st.name}</text>
            <text x={st.x + 7} y={st.y + 6} fontSize={7} fill={v.text}>{st.dist} km</text>
          </g>
        ))}
        {/* Epicenter (intersection) */}
        <circle cx={85} cy={75} r={4} fill="#fbbf24" stroke="#fff" strokeWidth={1} />
        <text x={92} y={78} fontSize={9} fontWeight={700} fill="#fbbf24">Epicenter</text>
      </svg>

      {/* How It Works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Distance from epicenter: {distance} km (adjust slider)</div>
        <div>Step 2: P-wave (primary, compressional) travels at {pVel} km/s — arrives at {pArrival.toFixed(0)}s</div>
        <div>Step 3: S-wave (secondary, shear) travels at {sVel} km/s — arrives at {sArrival.toFixed(0)}s</div>
        <div>Step 4: P-S time gap = {gap.toFixed(0)}s — longer gap = farther from epicenter</div>
        <div>Step 5: Distance ≈ (gap × vP × vS) / (vS − vP) = {(gap * pVel * sVel / (sVel - pVel)).toFixed(0)} km</div>
        <div>Step 6: Three stations + their distances = three circles that intersect at ONE point = the epicenter</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> P-waves push-pull (compress); S-waves shake side-to-side (shear). S-waves can't pass through liquids — that's how we discovered Earth's liquid outer core.
      </div>
    </div>
  )
}

// ============================================================
// 16. Star Life Cycle Explorer (Grades 9-12)
// ============================================================

type StarType = 'main_sequence' | 'red_giant' | 'white_dwarf' | 'neutron_star' | 'black_hole'

const STAR_TYPES: { id: StarType; name: string; color: string; tempRange: string; lumRange: string; x: number; y: number; emoji: string }[] = [
  { id: 'main_sequence', name: 'Main Sequence', color: '#fbbf24', tempRange: '3,000-30,000 K', lumRange: '0.01-10⁶ L☉', x: 230, y: 165, emoji: '⭐' },
  { id: 'red_giant', name: 'Red Giant', color: '#ef4444', tempRange: '3,000-5,000 K', lumRange: '100-1000 L☉', x: 320, y: 50, emoji: '🔴' },
  { id: 'white_dwarf', name: 'White Dwarf', color: '#e5e7eb', tempRange: '8,000-40,000 K', lumRange: '0.001-0.01 L☉', x: 70, y: 240, emoji: '⚪' },
  { id: 'neutron_star', name: 'Neutron Star', color: '#60a5fa', tempRange: '~10⁶ K', lumRange: '~0.001 L☉', x: 50, y: 270, emoji: '🔵' },
  { id: 'black_hole', name: 'Black Hole', color: '#1f2937', tempRange: '—', lumRange: '0 (no light)', x: 50, y: 295, emoji: '⚫' },
]

const MASS_ENDSTATES: { min: number; max: number; end: StarType; note: string }[] = [
  { min: 0.1, max: 0.5, end: 'white_dwarf', note: 'Helium white dwarf (no red giant phase — too low mass to fuse helium)' },
  { min: 0.5, max: 8, end: 'white_dwarf', note: 'Red giant → planetary nebula → white dwarf (like our Sun)' },
  { min: 8, max: 25, end: 'neutron_star', note: 'Red supergiant → supernova → neutron star (pulsar)' },
  { min: 25, max: 50, end: 'black_hole', note: 'Red supergiant → supernova → black hole' },
]

export function StarLifeCycleExplorer({ isDark }: ToolProps) {
  const v = s(isDark)
  const [selected, setSelected] = useState<StarType | null>('main_sequence')
  const [mass, setMass] = useState(1.0)

  // Stellar lifespan: ~10^10 / M^2.5 years (main sequence)
  const lifespan = Math.pow(10, 10) / Math.pow(mass, 2.5)
  const lifespanText = lifespan > 1e9 ? (lifespan / 1e9).toFixed(2) + ' billion yrs' : lifespan > 1e6 ? (lifespan / 1e6).toFixed(2) + ' million yrs' : lifespan.toFixed(0) + ' yrs'

  // Predicted end state from mass
  const predictedEnd = MASS_ENDSTATES.find(m => mass >= m.min && mass < m.max) ?? MASS_ENDSTATES[MASS_ENDSTATES.length - 1]
  const predictedEndName = STAR_TYPES.find(t => t.id === predictedEnd.end)?.name ?? '?'

  // Life cycle path for the selected star type
  const lifecyclePath: Record<StarType, string[]> = {
    main_sequence: ['Molecular cloud', 'Protostar', 'Main Sequence (fuse H→He)', predictedEndName],
    red_giant: ['Main Sequence star', 'H fuel runs out', 'Core contracts; outer layers expand → Red Giant', 'Helium fusion → heavier elements'],
    white_dwarf: ['Low/medium mass star', 'Red giant phase', 'Outer layers ejected (planetary nebula)', 'Core cools → White Dwarf'],
    neutron_star: ['Massive star (8-25 M☉)', 'Red supergiant', 'Core collapse → Supernova', 'Core → Neutron Star (pulsar)'],
    black_hole: ['Very massive star (>25 M☉)', 'Red supergiant', 'Core collapse → Supernova', 'Gravity wins → Black Hole'],
  }

  const sel = STAR_TYPES.find(t => t.id === selected)

  return (
    <div>
      <svg viewBox="0 0 400 320" style={{ width: '100%', borderRadius: 8, border: '1px solid ' + v.border, background: isDark ? 'rgba(15,23,42,0.7)' : 'rgba(30,58,95,0.1)' }}>
        <text x={200} y={18} fontSize={11} fontWeight={700} fill={v.bright} textAnchor="middle">Hertzsprung-Russell Diagram</text>

        {/* Axes */}
        <line x1={40} y1={30} x2={40} y2={290} stroke={v.border} strokeWidth={1} />
        <line x1={40} y1={290} x2={370} y2={290} stroke={v.border} strokeWidth={1} />

        {/* X-axis: temperature (hot on left, cool on right — reversed) */}
        {[30000, 10000, 6000, 3000].map((t, i) => {
          const x = 40 + (i / 3) * 80 + 30
          return (
            <g key={t}>
              <line x1={x} y1={290} x2={x} y2={293} stroke={v.border} strokeWidth={0.8} />
              <text x={x} y={302} fontSize={8} fill={v.text} textAnchor="middle">{(t / 1000).toFixed(0)}k</text>
            </g>
          )
        })}
        <text x={205} y={315} fontSize={9} fill={v.text} textAnchor="middle">Temperature (K) ← hot | cool →</text>

        {/* Y-axis: luminosity (log scale) */}
        {[1e-4, 1e-2, 1, 1e2, 1e4, 1e6].map((l, i) => {
          const y = 290 - (i / 5) * 260
          const label = l >= 1 ? (l >= 100 ? '10^' + Math.log10(l).toFixed(0) : l.toFixed(0)) : ('10^' + Math.log10(l).toFixed(0))
          return (
            <g key={l}>
              <line x1={37} y1={y} x2={40} y2={y} stroke={v.border} strokeWidth={0.8} />
              <text x={35} y={y + 3} fontSize={7} fill={v.text} textAnchor="end">{label}</text>
            </g>
          )
        })}
        <text x={12} y={160} fontSize={9} fill={v.text} textAnchor="middle" transform="rotate(-90 12 160)">Luminosity (L☉) — log</text>

        {/* Main sequence diagonal band */}
        <line x1={80} y1={260} x2={350} y2={70} stroke="rgba(251,191,36,0.4)" strokeWidth={14} strokeLinecap="round" />
        <text x={270} y={150} fontSize={9} fontWeight={700} fill="#fbbf24" transform="rotate(-35 270 150)">Main Sequence</text>

        {/* Red giants region (top-right) */}
        <ellipse cx={320} cy={50} rx={45} ry={20} fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.4)" strokeWidth={1} />
        <text x={320} y={48} fontSize={8} fontWeight={600} fill="#ef4444" textAnchor="middle">Red Giants</text>

        {/* White dwarfs region (bottom-left) */}
        <ellipse cx={75} cy={245} rx={30} ry={15} fill="rgba(229,231,235,0.15)" stroke="rgba(229,231,235,0.4)" strokeWidth={1} />
        <text x={75} y={247} fontSize={7} fontWeight={600} fill="#e5e7eb" textAnchor="middle">White Dwarfs</text>

        {/* Star type markers */}
        {STAR_TYPES.map(t => {
          const isSel = selected === t.id
          return (
            <g key={t.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(t.id)}>
              <circle cx={t.x} cy={t.y} r={isSel ? 9 : 6} fill={t.color + (isSel ? '' : '99')} stroke={isSel ? '#fbbf24' : t.color} strokeWidth={isSel ? 2 : 0.5} />
              <text x={t.x + 12} y={t.y + 4} fontSize={9} fontWeight={isSel ? 700 : 500} fill={isSel ? '#fbbf24' : v.bright}>{t.name}</text>
            </g>
          )
        })}

        {/* Your mass position on main sequence */}
        {(() => {
          // Mass ~ luminosity for main sequence: L = M^3.5
          const lum = Math.pow(mass, 3.5)
          // Map lum (0.001 to 1e6) to y (260 to 30) on log scale
          const logL = Math.log10(Math.max(lum, 1e-4))
          const yMs = 260 - ((logL - (-4)) / 10) * 230
          // Map temperature from mass (higher mass = hotter)
          // Approx: T ~ M^0.5 (rough); map T (3000-30000) to x (350-80)
          const temp = Math.min(30000, Math.max(3000, 5800 * Math.pow(mass, 0.5)))
          const xMs = 350 - ((temp - 3000) / 27000) * 270
          return (
            <g>
              <circle cx={xMs} cy={yMs} r={5} fill="none" stroke="#22c55e" strokeWidth={2} />
              <text x={xMs} y={yMs - 10} fontSize={8} fontWeight={700} fill="#22c55e" textAnchor="middle">Your star ({mass}M☉)</text>
            </g>
          )
        })()}
      </svg>

      {/* Mass slider */}
      <div style={{ fontSize: 10, fontWeight: 700, color: v.text, marginBottom: 4 }}>STELLAR MASS: {mass.toFixed(2)} M☉ (solar masses)</div>
      <input type="range" min={0.1} max={50} step={0.1} value={mass} onChange={e => setMass(parseFloat(e.target.value))} style={{ width: '100%', marginBottom: 6 }} />

      {/* Predicted stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <div style={{ padding: 8, borderRadius: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
          <div style={{ fontSize: 9, color: v.text }}>Main sequence lifespan</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>{lifespanText}</div>
          <div style={{ fontSize: 8, color: v.text }}>≈ 10¹⁰ / M^2.5 yrs</div>
        </div>
        <div style={{ padding: 8, borderRadius: 6, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)' }}>
          <div style={{ fontSize: 9, color: v.text }}>Predicted end state</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>{predictedEndName}</div>
          <div style={{ fontSize: 8, color: v.text }}>{predictedEnd.note}</div>
        </div>
      </div>

      {/* Selected star type info */}
      {sel && (
        <div style={{ padding: '8px 10px', borderRadius: 6, background: sel.color === '#1f2937' ? v.bg : sel.color + '15', border: '1px solid ' + sel.color + '60', marginBottom: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: sel.color === '#1f2937' ? '#9ca3af' : sel.color, marginBottom: 4 }}>{sel.emoji} {sel.name}</div>
          <div style={{ fontSize: 10, color: v.text, lineHeight: 1.6 }}>
            <div><b style={{ color: v.bright }}>Temperature:</b> {sel.tempRange} · <b style={{ color: v.bright }}>Luminosity:</b> {sel.lumRange}</div>
            <div style={{ marginTop: 4, fontWeight: 700, color: v.bright }}>Life cycle path:</div>
            {lifecyclePath[sel.id].map((s, i) => (
              <div key={i} style={{ fontSize: 10, color: v.text }}>  {i + 1}. {s}</div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
        <div>Step 1: Selected star type: {sel ? sel.name : '? — click a star'}</div>
        <div>Step 2: Stellar mass = {mass.toFixed(2)} M☉ — this DETERMINES the star's fate</div>
        <div>Step 3: Main sequence lifespan: {lifespanText} (more massive = shorter life — burns fuel faster)</div>
        <div>Step 4: Luminosity ∝ M^3.5 — massive stars are SUPER bright (use up fuel fast)</div>
        <div>Step 5: Predicted end state: {predictedEndName} — {predictedEnd.note}</div>
        <div>Step 6: HR diagram plots luminosity vs temperature — main sequence is a diagonal; giants top-right; dwarfs bottom-left</div>
      </div>
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Mass is destiny. A star's mass at birth determines everything — its color, brightness, lifespan, and death. The Sun will live 10 billion years; a star 25× heavier lives only millions.
      </div>
    </div>
  )
}

