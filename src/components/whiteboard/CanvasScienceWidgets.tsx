'use client'

import React, { lazy, Suspense, useState, useCallback, useRef, useEffect } from 'react'
import type { WidgetElement } from '@/lib/whiteboard/types'
import { useWhiteboardStore } from '@/lib/whiteboard/store'
import { useConfigUpdater } from './shared/widgetUtils'

// ============================================================
// On-Canvas Science Widgets
// Phase 3: Interactive canvas widgets + legacy panel wrappers
// ============================================================

interface CanvasScienceWidgetProps {
  element: WidgetElement
  isDark: boolean
}

const ws = (isDark: boolean) => ({
  bg: isDark ? '#0f172a' : '#ffffff',
  surface: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
  border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
  text: isDark ? '#94a3b8' : '#64748b',
  bright: isDark ? '#e2e8f0' : '#1e293b',
  accent: '#34d399',
})

// ============================================================
// NEW PHASE 3 INTERACTIVE SCIENCE WIDGETS
// ============================================================

// ---- 1. States of Matter (K-5) ----
export function CanvasStatesOfMatter({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const temperature = (raw.temperature as number) ?? 25
  const substance = (raw.substance as string) || 'water'
  const s = ws(isDark)

  const phasePoints: Record<string, { melt: number; boil: number }> = { water: { melt: 0, boil: 100 }, iron: { melt: 1538, boil: 2862 }, oxygen: { melt: -218, boil: -183 }, ethanol: { melt: -114, boil: 78 } }
  const pp = phasePoints[substance] || phasePoints.water
  const phase = temperature < pp.melt ? 'solid' : temperature < pp.boil ? 'liquid' : 'gas'
  const phaseColors: Record<string, string> = { solid: '#60a5fa', liquid: '#3b82f6', gas: '#f59e0b' }
  const phaseEmojis: Record<string, string> = { solid: '🧊', liquid: '💧', gas: '💨' }

  // Generate particle positions
  const particles = useRef(Array.from({ length: 30 }, function() {
    return { x: 10 + Math.random() * 330, y: 10 + Math.random() * 180, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 }
  })).current

  const speed = phase === 'solid' ? 0.02 : phase === 'liquid' ? 0.3 : 1.2
  const jitter = phase === 'gas' ? 4 : phase === 'liquid' ? 1 : 0.1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>🧪 States of Matter</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {Object.keys(phasePoints).map(function(sub) {
          return (
            <button key={sub} onClick={function() { updateConfig({ substance: sub, temperature: 25 }) }}
              style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', background: substance === sub ? 'rgba(5,150,105,0.15)' : s.surface, border: substance === sub ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + s.border, color: substance === sub ? '#34d399' : s.text }}>
              {sub}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 8px', background: s.surface, borderRadius: 6, border: '1px solid ' + s.border }}>
        <span style={{ fontSize: 10, color: s.text }}>🌡️</span>
        <input type="range" min={-250} max={3000} value={temperature} onChange={function(e) { updateConfig({ temperature: Number(e.target.value) }) }} style={{ flex: 1, cursor: 'pointer' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: s.bright, minWidth: 50, textAlign: 'right' }}>{temperature}°C</span>
      </div>
      <div style={{ flex: 1, position: 'relative', background: s.surface, borderRadius: 8, overflow: 'hidden', border: '1px solid ' + s.border, minHeight: 200 }}>
        <svg width="100%" height="100%">
          {particles.map(function(p, i) {
            var nx = p.x + p.vx * speed * 10
            var ny = p.y + p.vy * speed * 10
            if (nx < 5 || nx > 345) p.vx *= -1
            if (ny < 5 || ny > 185) p.vy *= -1
            p.x = Math.max(5, Math.min(345, nx))
            p.y = Math.max(5, Math.min(185, ny))
            p.vx += (Math.random() - 0.5) * jitter * 0.1
            p.vy += (Math.random() - 0.5) * jitter * 0.1
            return <circle key={i} cx={p.x + (Math.random() - 0.5) * jitter} cy={p.y + (Math.random() - 0.5) * jitter} r={phase === 'gas' ? 3 : 5} fill={phaseColors[phase]} opacity={0.8} />
          })}
        </svg>
        <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 20 }}>{phaseEmojis[phase]}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: phaseColors[phase], textTransform: 'uppercase' }}>{phase}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, fontSize: 10 }}>
        <span style={{ color: '#60a5fa', fontWeight: 600 }}>Melting: {pp.melt}°C</span>
        <span style={{ color: '#f59e0b', fontWeight: 600 }}>Boiling: {pp.boil}°C</span>
      </div>
    </div>
  )
}

// ---- 2. Food Chain (K-5) ----
export function CanvasFoodChain({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  var organisms: string[] = (raw.organisms as string[]) || ['🌿 Grass', '🐛 Grasshopper', '🐸 Frog', '🐍 Snake', '🦅 Eagle']
  const s = ws(isDark)
  var roles = ['Producer', 'Primary Consumer', 'Secondary Consumer', 'Tertiary Consumer', 'Apex Predator']
  var roleColors = ['#22c55e', '#34d399', '#f59e0b', '#f97316', '#ef4444']

  function setOrganism(i: number, v: string) { var nc = [...organisms]; nc[i] = v; updateConfig({ organisms: nc }) }
  function addOrganism() { updateConfig({ organisms: [...organisms, '?? New'] }) }
  function removeOrganism() { if (organisms.length > 2) updateConfig({ organisms: organisms.slice(0, -1) }) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>🔗 Food Chain</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
        {organisms.map(function(org, i) {
          return (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 60, textAlign: 'right', fontSize: 8, fontWeight: 600, color: roleColors[Math.min(i, roleColors.length - 1)] }}>{roles[Math.min(i, roles.length - 1)]}</div>
                <input value={org} onChange={function(e) { setOrganism(i, e.target.value) }} style={{ width: 140, padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, textAlign: 'center', border: '1px solid ' + roleColors[Math.min(i, roleColors.length - 1)] + '44', background: roleColors[Math.min(i, roleColors.length - 1)] + '11', color: s.bright, outline: 'none' }} />
              </div>
              {i < organisms.length - 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 2, height: 8, background: s.accent }} />
                  <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '6px solid ' + s.accent }} />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
      <div style={{ fontSize: 9, color: s.text, textAlign: 'center' }}>↑ Energy flows up · Arrows = "is eaten by"</div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        <button onClick={addOrganism} style={{ padding: '3px 10px', borderRadius: 5, fontSize: 10, cursor: 'pointer', background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>+ Level</button>
        <button onClick={removeOrganism} style={{ padding: '3px 10px', borderRadius: 5, fontSize: 10, cursor: 'pointer', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>- Level</button>
      </div>
    </div>
  )
}

// ---- 3. Animal Habitats (K-5) ----
export function CanvasAnimalHabitats({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  var matches: Record<string, string> = (raw.matches as Record<string, string>) || {}
  var s = ws(isDark)

  var habitats = [
    { id: 'ocean', label: '🌊 Ocean', animals: ['Whale', 'Dolphin', 'Shark', 'Seahorse', 'Jellyfish'] },
    { id: 'forest', label: '🌲 Forest', animals: ['Deer', 'Bear', 'Owl', 'Fox', 'Squirrel'] },
    { id: 'desert', label: '🏜️ Desert', animals: ['Camel', 'Rattlesnake', 'Scorpion', 'Lizard', 'Roadrunner'] },
    { id: 'arctic', label: '❄️ Arctic', animals: ['Polar Bear', 'Penguin', 'Seal', 'Arctic Fox', 'Walrus'] },
    { id: 'grassland', label: '🌾 Grassland', animals: ['Lion', 'Zebra', 'Elephant', 'Giraffe', 'Cheetah'] },
  ]

  var score = 0
  habitats.forEach(function(h) {
    if (h.animals.includes(matches[h.id] || '')) score++
  })

  function setMatch(habitatId: string, animal: string) { updateConfig({ matches: { ...matches, [habitatId]: animal } }) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>🌍 Animal Habitats</div>
      <div style={{ fontSize: 10, color: s.text }}>Match each animal to its correct habitat</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, overflowY: 'auto' }}>
        {habitats.map(function(h) {
          var match = matches[h.id] || ''
          var correct = match && h.animals.includes(match)
          return (
            <div key={h.id} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '4px 8px', background: s.surface, borderRadius: 6, border: '1px solid ' + (correct ? '#34d39944' : s.border) }}>
              <span style={{ fontSize: 13, minWidth: 100 }}>{h.label}</span>
              <select value={match} onChange={function(e) { setMatch(h.id, e.target.value) }} style={{ flex: 1, padding: '3px 6px', borderRadius: 4, fontSize: 10, border: '1px solid ' + s.border, background: s.bg, color: s.bright, outline: 'none' }}>
                <option value=''>Choose...</option>
                {habitats.flatMap(function(hh) { return hh.animals }).filter(function(v, i, a) { return a.indexOf(v) === i }).map(function(a) {
                  return <option key={a} value={a}>{a}</option>
                })}
              </select>
              {match && <span style={{ fontSize: 12 }}>{correct ? '✅' : '❌'}</span>}
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: score === habitats.length ? '#34d399' : s.text, textAlign: 'center' }}>
        {score}/{habitats.length} correct {score === habitats.length && '🎉 Perfect!'}
      </div>
    </div>
  )
}

// ---- 4. Plant Life Cycle (K-5) ----
export function CanvasPlantLifeCycle({ element, isDark }: CanvasScienceWidgetProps) {
  const raw = element.config || {}
  const activeStep = (raw.activeStep as number) ?? 0
  const s = ws(isDark)

  var steps = [
    { label: 'Seed', emoji: '🫘', desc: 'A seed contains the embryo of a new plant and stored food.' },
    { label: 'Sprout', emoji: '🌱', desc: 'With water and warmth, the seed germinates and pushes out roots and a shoot.' },
    { label: 'Seedling', emoji: '🌿', desc: 'The seedling grows leaves and starts photosynthesis using sunlight.' },
    { label: 'Adult Plant', emoji: '🪴', desc: 'The mature plant grows flowers to attract pollinators.' },
    { label: 'Flower/Fruit', emoji: '🌸', desc: 'Pollinated flowers develop into fruits containing new seeds.' },
    { label: 'New Seeds', emoji: '🌰', desc: 'Seeds disperse and the cycle begins again!' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>🌱 Plant Life Cycle</div>
      <div style={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        {steps.map(function(st, i) {
          return (
            <button key={i} onClick={function() { useWhiteboardStore.getState().updateElement(element.id, { config: { ...raw, activeStep: i } } as Partial<WidgetElement>) }}
              style={{ padding: '6px 8px', borderRadius: 8, fontSize: 10, fontWeight: activeStep === i ? 700 : 500, cursor: 'pointer', background: activeStep === i ? 'rgba(5,150,105,0.15)' : s.surface, border: activeStep === i ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + s.border, color: activeStep === i ? '#34d399' : s.text, textAlign: 'center' }}>
              <div style={{ fontSize: 20 }}>{st.emoji}</div>
              <div>{st.label}</div>
            </button>
          )
        })}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, background: s.surface, borderRadius: 10, border: '1px solid ' + s.border }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{steps[activeStep].emoji}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: s.bright, marginBottom: 6 }}>{steps[activeStep].label}</div>
        <div style={{ fontSize: 11, color: s.text, textAlign: 'center', lineHeight: 1.5, maxWidth: 300 }}>{steps[activeStep].desc}</div>
      </div>
      <div style={{ fontSize: 9, color: s.text, textAlign: 'center' }}>Click each stage to learn more · Cycle repeats!</div>
    </div>
  )
}

// ---- 5. Sink or Float (K-5) ----
export function CanvasSinkOrFloat({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  var selectedObj = (raw.selectedObj as string) || ''
  var selectedLiq = (raw.selectedLiq as string) || 'water'
  var revealed = (raw.revealed as boolean) ?? false
  var s = ws(isDark)

  var objects = [
    { name: 'Wood', emoji: '🪵', density: 0.6 },
    { name: 'Ice', emoji: '🧊', density: 0.92 },
    { name: 'Apple', emoji: '🍎', density: 0.85 },
    { name: 'Coin', emoji: '🪙', density: 8.9 },
    { name: 'Cork', emoji: '🫙', density: 0.24 },
    { name: 'Marble', emoji: '🔮', density: 2.7 },
    { name: 'Rubber Ball', emoji: '🏀', density: 1.1 },
    { name: 'Plastic', emoji: '🧴', density: 0.95 },
  ]
  var liquids = [
    { name: 'Water', density: 1.0, color: '#3b82f6' },
    { name: 'Oil', density: 0.8, color: '#f59e0b' },
    { name: 'Honey', density: 1.4, color: '#d97706' },
    { name: 'Mercury', density: 13.5, color: '#94a3b8' },
  ]

  var obj = objects.find(function(o) { return o.name === selectedObj })
  var liq = liquids.find(function(l) { return l.name === selectedLiq }) || liquids[0]
  var result = obj && liq ? obj.density < liq.density ? 'float' : 'sink' : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>🌊 Sink or Float?</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {objects.map(function(o) {
          return (
            <button key={o.name} onClick={function() { updateConfig({ selectedObj: o.name, revealed: false }) }} style={{ padding: '3px 7px', borderRadius: 5, fontSize: 10, cursor: 'pointer', background: selectedObj === o.name ? 'rgba(5,150,105,0.15)' : s.surface, border: selectedObj === o.name ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + s.border, color: selectedObj === o.name ? '#34d399' : s.text }}>{o.emoji} {o.name}</button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: s.text }}>Liquid:</span>
        {liquids.map(function(l) {
          return (
            <button key={l.name} onClick={function() { updateConfig({ selectedLiq: l.name, revealed: false }) }} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer', background: selectedLiq === l.name ? l.color + '22' : s.surface, border: selectedLiq === l.name ? '1px solid ' + l.color + '44' : '1px solid ' + s.border, color: selectedLiq === l.name ? l.color : s.text }}>{l.name} ({l.density})</button>
          )
        })}
      </div>
      <div style={{ flex: 1, position: 'relative', background: s.surface, borderRadius: 8, overflow: 'hidden', border: '1px solid ' + s.border, minHeight: 140 }}>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', background: liq.color + '22', borderRadius: '0 0 7px 7px' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: liq.color + '66' }} />
        </div>
        {obj && (
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: revealed ? (result === 'float' ? '72%' : '10%') : '40%', fontSize: 32, transition: 'bottom 0.5s ease' }}>{obj.emoji}</div>
        )}
        {!obj && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.text, fontSize: 11 }}>Select an object</div>}
      </div>
      {obj && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={function() { updateConfig({ revealed: !revealed }) }} style={{ padding: '5px 16px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: revealed ? (result === 'float' ? 'rgba(5,150,105,0.15)' : 'rgba(239,68,68,0.1)') : 'rgba(5,150,105,0.12)', border: revealed ? '1px solid ' + (result === 'float' ? 'rgba(5,150,105,0.3)' : 'rgba(239,68,68,0.3)') : '1px solid rgba(5,150,105,0.3)', color: revealed ? (result === 'float' ? '#34d399' : '#f87171') : '#34d399' }}>
            {revealed ? (result === 'float' ? '🟢 It Floats!' : '🔴 It Sinks!') : '🔮 Predict & Reveal'}
          </button>
          <span style={{ fontSize: 9, color: s.text }}>Density: obj {obj.density} vs liquid {liq.density}</span>
        </div>
      )}
    </div>
  )
}

// ---- 6. Scientific Method (6-8) ----
export function CanvasScientificMethod({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  var steps: string[] = (raw.steps as string[]) || ['', '', '', '', '', '']
  var activeStep = (raw.activeStep as number) ?? 0
  var s = ws(isDark)

  var labels = ['❓ Question', '💡 Hypothesis', '🔬 Experiment', '📊 Data', '🔍 Analysis', '📝 Conclusion']
  var colors = ['#f59e0b', '#34d399', '#60a5fa', '#a855f7', '#f97316', '#ef4444']

  function setStep(i: number, v: string) { var ns = [...steps]; ns[i] = v; updateConfig({ steps: ns }) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>🔬 Scientific Method</div>
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {labels.map(function(l, i) {
          return (
            <button key={i} onClick={function() { updateConfig({ activeStep: i }) }} style={{ padding: '3px 6px', borderRadius: 4, fontSize: 9, fontWeight: activeStep === i ? 700 : 500, cursor: 'pointer', background: activeStep === i ? colors[i] + '22' : s.surface, border: activeStep === i ? '1px solid ' + colors[i] + '44' : '1px solid ' + s.border, color: activeStep === i ? colors[i] : s.text }}>{l}</button>
          )
        })}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.map(function(step, i) {
          return (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: '100%', minHeight: 40, borderRadius: 3, background: colors[i] + (i === activeStep ? '88' : '22'), flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: colors[i], marginBottom: 2 }}>{i + 1}. {labels[i].replace(/^[^\s]+\s/, '')}</div>
                <textarea value={step} onChange={function(e) { setStep(i, e.target.value) }} placeholder={'Write your ' + labels[i].replace(/^[^\s]+\s/, '').toLowerCase() + '...'} rows={i === activeStep ? 3 : 1} style={{ width: '100%', padding: '4px 8px', borderRadius: 4, fontSize: 10, border: '1px solid ' + (i === activeStep ? colors[i] + '44' : s.border), background: s.surface, color: s.bright, outline: 'none', resize: 'vertical', fontFamily: 'system-ui, sans-serif' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- 7. Data Collection (6-8) ----
export function CanvasDataCollection({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  var headers: string[] = (raw.headers as string[]) || ['Trial', 'Height (cm)', 'Time (s)']
  var rows: string[][] = (raw.rows as string[][]) || [['1', '10', '1.4'], ['2', '20', '2.1'], ['3', '30', '2.6']]
  var chartType = (raw.chartType as string) || 'bar'
  var s = ws(isDark)

  function setHeader(i: number, v: string) { var nh = [...headers]; nh[i] = v; updateConfig({ headers: nh }) }
  function setCell(r: number, c: number, v: string) { var nr = rows.map(function(row) { return [...row] }); nr[r][c] = v; updateConfig({ rows: nr }) }
  function addRow() { updateConfig({ rows: [...rows, Array(headers.length).fill('')] }) }
  function removeRow() { if (rows.length > 1) updateConfig({ rows: rows.slice(0, -1) }) }

  // Parse numeric column for chart
  var numCol = headers.findIndex(function(h) { return h.match(/\d|value|height|time|temp|mass/i) }) || 1
  var chartData = rows.map(function(r) { return parseFloat(r[numCol] || '0') }).filter(function(n) { return !isNaN(n) })
  var maxV = Math.max.apply(null, chartData.concat([1]))
  var barW = 320

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>📊 Data Collection</div>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
        {['bar', 'line', 'scatter'].map(function(t) {
          return (
            <button key={t} onClick={function() { updateConfig({ chartType: t }) }} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, textTransform: 'capitalize', cursor: 'pointer', background: chartType === t ? 'rgba(5,150,105,0.15)' : s.surface, border: chartType === t ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + s.border, color: chartType === t ? '#34d399' : s.text }}>{t}</button>
          )
        })}
      </div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid ' + s.border }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {headers.map(function(h, i) {
              return <div key={i} style={{ padding: '2px 4px', fontSize: 9, fontWeight: 700, color: s.accent, borderBottom: '1px solid ' + s.border, background: s.accent + '11' }}><input value={h} onChange={function(e) { setHeader(i, e.target.value) }} style={{ width: 60, fontSize: 9, border: 'none', background: 'transparent', color: s.accent, outline: 'none', fontWeight: 700 }} /></div>
            })}
          </div>
          {rows.map(function(row, ri) {
            return (
              <div key={ri} style={{ display: 'flex', flexDirection: 'column' }}>
                {row.map(function(cell, ci) {
                  return <div key={ci} style={{ padding: '2px 4px', borderBottom: '1px solid ' + s.border }}><input value={cell} onChange={function(e) { setCell(ri, ci, e.target.value) }} style={{ width: 50, fontSize: 10, border: 'none', background: 'transparent', color: s.bright, outline: 'none', textAlign: 'center' }} /></div>
                })}
              </div>
            )
          })}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        <button onClick={addRow} style={{ padding: '3px 10px', borderRadius: 5, fontSize: 10, cursor: 'pointer', background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>+ Row</button>
        <button onClick={removeRow} style={{ padding: '3px 10px', borderRadius: 5, fontSize: 10, cursor: 'pointer', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>- Row</button>
      </div>
      <svg width={barW} height={80} style={{ background: s.surface, borderRadius: 6, border: '1px solid ' + s.border }}>
        {chartData.map(function(v, i) {
          var bw = barW / chartData.length
          var bh = (v / maxV) * 65
          if (chartType === 'bar') return <rect key={i} x={i * bw + 2} y={75 - bh} width={bw - 4} height={bh} fill={s.accent + '88'} stroke={s.accent} strokeWidth={1} rx={2} />
          if (chartType === 'line' && i > 0) {
            var prevBh = (chartData[i - 1] / maxV) * 65
            return <line key={i} x1={(i - 1) * bw + bw / 2} y1={75 - prevBh} x2={i * bw + bw / 2} y2={75 - bh} stroke={s.accent} strokeWidth={2} />
          }
          if (chartType === 'scatter') return <circle key={i} cx={i * bw + bw / 2} cy={75 - bh} r={4} fill={s.accent} />
          return null
        })}
      </svg>
    </div>
  )
}

// ---- 8. Magnetism (6-8) ----
export function CanvasMagnetism({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  var magnets: Array<{ x: number; polarity: string }> = (raw.magnets as Array<{ x: number; polarity: string }>) || [{ x: 120, polarity: 'N-S' }, { x: 280, polarity: 'N-S' }]
  var s = ws(isDark)

  function updateMagnet(i: number, patch: Partial<{ x: number; polarity: string }>) {
    var nm = magnets.map(function(m, j) { return j === i ? { ...m, ...patch } : m })
    updateConfig({ magnets: nm })
  }

  function addMagnet() { updateConfig({ magnets: [...magnets, { x: 200, polarity: 'N-S' }] }) }
  function removeMagnet() { if (magnets.length > 1) updateConfig({ magnets: magnets.slice(0, -1) }) }

  // Generate simple field line visualization
  function fieldLines() {
    var lines: Array<{ x1: number; y1: number; x2: number; y2: number; color: string }> = []
    magnets.forEach(function(m, i) {
      var next = magnets[i + 1]
      if (!next) return
      var attract = (m.polarity === 'N-S' && next.polarity === 'N-S' && m.x < next.x) || (m.polarity === 'S-N' && next.polarity === 'S-N' && m.x < next.x)
      for (var dy = -3; dy <= 3; dy++) {
        lines.push({ x1: m.x, y1: 100 + dy * 18, x2: next.x, y2: 100 + dy * 18, color: attract ? '#34d399' : '#f87171' })
      }
    })
    return lines
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>🧲 Magnetism</div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={addMagnet} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer', background: 'rgba(5,150,105,0.12)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>+ Magnet</button>
          <button onClick={removeMagnet} style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>- Magnet</button>
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 9 }}>
          <span style={{ color: '#34d399' }}>● Attract</span>
          <span style={{ color: '#f87171' }}>● Repel</span>
        </div>
      </div>
      <svg width="100%" height={200} style={{ background: s.surface, borderRadius: 8, border: '1px solid ' + s.border }}>
        {fieldLines().map(function(l, i) {
          return <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.color} strokeWidth={1} opacity={0.5} strokeDasharray="4,4" />
        })}
        {magnets.map(function(m, i) {
          var isNS = m.polarity === 'N-S'
          return (
            <g key={i}>
              <rect x={m.x - 30} y={80} width={30} height={40} fill="#ef4444" rx={4} />
              <rect x={m.x} y={80} width={30} height={40} fill="#3b82f6" rx={4} />
              <text x={m.x - 15} y={104} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">{isNS ? 'N' : 'S'}</text>
              <text x={m.x + 15} y={104} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">{isNS ? 'S' : 'N'}</text>
              <input type="range" min={40} max={360} value={m.x} onChange={function(e) { updateMagnet(i, { x: Number(e.target.value) }) }} style={{ cursor: 'pointer', position: 'absolute' as const, left: (m.x - 30) + 'px', top: '140px', width: '60px' }} />
              <text x={m.x} y={170} textAnchor="middle" fontSize={8} fill={s.text}>drag</text>
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: 4 }}>
        {magnets.map(function(m, i) {
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
              <span style={{ color: s.text }}>M{i + 1}:</span>
              <button onClick={function() { updateMagnet(i, { polarity: m.polarity === 'N-S' ? 'S-N' : 'N-S' }) }} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, cursor: 'pointer', background: s.surface, border: '1px solid ' + s.border, color: s.bright }}>Flip</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- 9. Periodic Trends (9-12) ----
export function CanvasPeriodicTrends({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  var trend = (raw.trend as string) || 'electronegativity'
  var selectedElement = (raw.selectedElement as string) || 'Na'
  var s = ws(isDark)

  // Simplified periodic trend data (selected elements)
  var elements: Array<{ sym: string; z: number; en: number; ar: number; ie: number }> = [
    { sym: 'Li', z: 3, en: 0.98, ar: 152, ie: 520 }, { sym: 'Be', z: 4, en: 1.57, ar: 112, ie: 900 },
    { sym: 'B', z: 5, en: 2.04, ar: 87, ie: 801 }, { sym: 'C', z: 6, en: 2.55, ar: 77, ie: 1086 },
    { sym: 'N', z: 7, en: 3.04, ar: 75, ie: 1402 }, { sym: 'O', z: 8, en: 3.44, ar: 73, ie: 1314 },
    { sym: 'F', z: 9, en: 3.98, ar: 72, ie: 1681 }, { sym: 'Na', z: 11, en: 0.93, ar: 186, ie: 496 },
    { sym: 'Mg', z: 12, en: 1.31, ar: 160, ie: 738 }, { sym: 'Al', z: 13, en: 1.61, ar: 143, ie: 578 },
    { sym: 'Si', z: 14, en: 1.90, ar: 117, ie: 786 }, { sym: 'P', z: 15, en: 2.19, ar: 110, ie: 1012 },
    { sym: 'S', z: 16, en: 2.58, ar: 104, ie: 1000 }, { sym: 'Cl', z: 17, en: 3.16, ar: 99, ie: 1251 },
    { sym: 'K', z: 19, en: 0.82, ar: 227, ie: 419 }, { sym: 'Ca', z: 20, en: 1.00, ar: 197, ie: 590 },
    { sym: 'Br', z: 35, en: 2.96, ar: 114, ie: 1140 }, { sym: 'I', z: 53, en: 2.66, ar: 133, ie: 1008 },
  ]

  var getVal = function(el: typeof elements[0]) { return trend === 'electronegativity' ? el.en : trend === 'atomic-radius' ? el.ar : el.ie }
  var trendLabel = trend === 'electronegativity' ? 'Electronegativity' : trend === 'atomic-radius' ? 'Atomic Radius (pm)' : 'Ionization Energy (kJ/mol)'
  var trendColor = trend === 'electronegativity' ? '#34d399' : trend === 'atomic-radius' ? '#f59e0b' : '#f87171'

  var sortedByZ = elements.slice().sort(function(a, b) { return a.z - b.z })
  var vals = sortedByZ.map(getVal)
  var minV = Math.min.apply(null, vals)
  var maxV = Math.max.apply(null, vals)
  var svgW = 380, svgH = 160, pad = 35

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>📊 Periodic Trends</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {['electronegativity', 'atomic-radius', 'ionization-energy'].map(function(t) {
          return (
            <button key={t} onClick={function() { updateConfig({ trend: t }) }} style={{ padding: '3px 8px', borderRadius: 5, fontSize: 9, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', background: trend === t ? trendColor + '22' : s.surface, border: trend === t ? '1px solid ' + trendColor + '44' : '1px solid ' + s.border, color: trend === t ? trendColor : s.text }}>{t.replace('-', ' ')}</button>
          )
        })}
      </div>
      <svg width={svgW} height={svgH} style={{ background: s.surface, borderRadius: 8, border: '1px solid ' + s.border }}>
        <line x1={pad} y1={svgH - pad} x2={svgW - 10} y2={svgH - pad} stroke={s.border} />
        <line x1={pad} y1={10} x2={pad} y2={svgH - pad} stroke={s.border} />
        <text x={svgW / 2} y={svgH - 5} textAnchor="middle" fontSize={8} fill={s.text}>Atomic Number →</text>
        <text x={5} y={svgH / 2} textAnchor="middle" fontSize={7} fill={s.text} transform={'rotate(-90,5,' + svgH / 2 + ')'}>{trendLabel}</text>
        {sortedByZ.map(function(el, i) {
          var x = pad + (i / (sortedByZ.length - 1)) * (svgW - pad - 20)
          var y = svgH - pad - ((getVal(el) - minV) / (maxV - minV || 1)) * (svgH - pad * 2 - 10)
          return (
            <g key={el.sym} onClick={function() { updateConfig({ selectedElement: el.sym }) }} style={{ cursor: 'pointer' }}>
              <circle cx={x} cy={y} r={selectedElement === el.sym ? 7 : 4} fill={selectedElement === el.sym ? trendColor : trendColor + '88'} stroke={selectedElement === el.sym ? '#fff' : 'none'} strokeWidth={2} />
              <text x={x} y={y - 10} textAnchor="middle" fontSize={7} fill={s.bright} fontWeight={selectedElement === el.sym ? 700 : 400}>{el.sym}</text>
            </g>
          )
        })}
      </svg>
      {elements.find(function(e) { return e.sym === selectedElement }) && function() {
        var el = elements.find(function(e) { return e.sym === selectedElement })!
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, fontSize: 10 }}>
            {[['EN', el.en], ['AR', el.ar + ' pm'], ['IE', el.ie + ' kJ']].map(function(item, i) {
              return (
                <div key={i} style={{ padding: '4px 8px', background: s.surface, borderRadius: 4, border: '1px solid ' + s.border, textAlign: 'center' }}>
                  <div style={{ color: s.text, fontSize: 8 }}>{item[0]}</div>
                  <div style={{ color: s.bright, fontWeight: 700 }}>{item[1]}</div>
                </div>
              )
            })}
          </div>
        )
      }()}
    </div>
  )
}

// ---- 10. Stoichiometry (9-12) ----
export function CanvasStoichiometry({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  var equation = (raw.equation as string) || '2H2 + O2 → 2H2O'
  var knownSubstance = (raw.knownSubstance as string) || 'H2'
  var knownMoles = (raw.knownMoles as number) ?? 2
  var s = ws(isDark)

  function parseEquation(eq: string) {
    var parts = eq.split('→').map(function(s) { return s.trim() })
    var reactants = parts[0].split('+').map(function(s) { return s.trim() })
    var products = parts[1] ? parts[1].split('+').map(function(s) { return s.trim() }) : []
    function parseFormula(f: string) {
      var m = f.match(/^(\d*)([A-Za-z\d]+)$/)
      return { coeff: parseInt(m ? m[1] : '1') || 1, formula: m ? m[2] : f }
    }
    return { reactants: reactants.map(parseFormula), products: products.map(parseFormula) }
  }

  var parsed = parseEquation(equation)
  var allSubs = parsed.reactants.concat(parsed.products)
  var knownEntry = allSubs.find(function(s) { return s.formula === knownSubstance })
  var knownCoeff = knownEntry ? knownEntry.coeff : 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>⚗️ Stoichiometry</div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: s.text }}>Equation:</span>
        <input value={equation} onChange={function(e) { updateConfig({ equation: e.target.value }) }} style={{ flex: 1, padding: '4px 8px', borderRadius: 5, fontSize: 11, border: '1px solid ' + s.border, background: s.surface, color: s.bright, outline: 'none', fontFamily: 'monospace' }} />
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: s.text }}>Known:</span>
        <select value={knownSubstance} onChange={function(e) { updateConfig({ knownSubstance: e.target.value }) }} style={{ padding: '3px 6px', borderRadius: 4, fontSize: 10, border: '1px solid ' + s.border, background: s.surface, color: s.bright, outline: 'none' }}>
          {allSubs.map(function(sub) { return <option key={sub.formula} value={sub.formula}>{sub.formula}</option> })}
        </select>
        <span style={{ fontSize: 10, color: s.text }}>Moles:</span>
        <input type="number" value={knownMoles} onChange={function(e) { updateConfig({ knownMoles: Number(e.target.value) }) }} step={0.5} style={{ width: 60, padding: '3px 6px', borderRadius: 4, fontSize: 11, border: '1px solid ' + s.border, background: s.surface, color: s.bright, outline: 'none', textAlign: 'center' }} />
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color: s.text }}>Calculated Quantities:</div>
      <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
        {allSubs.map(function(sub, i) {
          var moles = knownEntry ? (knownMoles * sub.coeff / knownCoeff) : 0
          var isReactant = i < parsed.reactants.length
          return (
            <div key={sub.formula} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', background: sub.formula === knownSubstance ? 'rgba(5,150,105,0.1)' : s.surface, borderRadius: 5, border: '1px solid ' + (sub.formula === knownSubstance ? 'rgba(5,150,105,0.3)' : s.border) }}>
              <span style={{ fontSize: 11, color: s.bright, fontWeight: 600 }}>{sub.coeff}{sub.formula}</span>
              <span style={{ fontSize: 9, color: s.text }}>{isReactant ? 'reactant' : 'product'}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: sub.formula === knownSubstance ? '#34d399' : s.bright, fontFamily: 'monospace' }}>{moles.toFixed(2)} mol</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---- 11. Meiosis (9-12) ----
export function CanvasMeiosis({ element, isDark }: CanvasScienceWidgetProps) {
  const raw = element.config || {}
  const step = (raw.step as number) ?? 0
  const s = ws(isDark)

  var steps = [
    { title: 'Interphase', desc: 'DNA replicates. Each chromosome copies itself forming sister chromatids.', cells: [['║║', '║║']] },
    { title: 'Prophase I', desc: 'Homologous chromosomes pair up. Crossing over exchanges genetic material.', cells: [['╬║', '║╬']] },
    { title: 'Metaphase I', desc: 'Homologous pairs line up at the center of the cell.', cells: [['╬║', '║╬']] },
    { title: 'Anaphase I', desc: 'Homologous chromosomes separate to opposite poles.', cells: [['╬', '║'], ['║', '╬']] },
    { title: 'Telophase I', desc: 'Two haploid cells form. Each has half the chromosomes.', cells: [['╬', '║'], ['║', '╬']] },
    { title: 'Meiosis II Begins', desc: 'Sister chromatids separate (like mitosis but in haploid cells).', cells: [['╬', '║'], ['║', '╬']] },
    { title: 'Meiosis II Complete', desc: 'Four genetically unique haploid cells are produced!', cells: [['╬'], ['║'], ['║'], ['╬']] },
  ]

  var current = steps[step]
  var cellColors = ['#34d399', '#f59e0b', '#60a5fa', '#c084fc']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>🧬 Meiosis</div>
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {steps.map(function(st, i) {
          return (
            <button key={i} onClick={function() { useWhiteboardStore.getState().updateElement(element.id, { config: { ...raw, step: i } } as Partial<WidgetElement>) }} style={{ padding: '3px 6px', borderRadius: 4, fontSize: 8, fontWeight: step === i ? 700 : 500, cursor: 'pointer', background: step === i ? 'rgba(5,150,105,0.15)' : s.surface, border: step === i ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + s.border, color: step === i ? '#34d399' : s.text }}>{i + 1}</button>
          )
        })}
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: s.accent }}>{current.title}</div>
          <div style={{ fontSize: 11, color: s.text, lineHeight: 1.5 }}>{current.desc}</div>
          <div style={{ fontSize: 9, color: s.text, padding: '4px 8px', background: s.surface, borderRadius: 4, border: '1px solid ' + s.border }}>
            <b>Key difference from mitosis:</b> Homologous chromosomes pair up and separate in Meiosis I, creating genetic diversity through crossing over.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
          {current.cells.map(function(row, ri) {
            return (
              <div key={ri} style={{ display: 'flex', gap: 4 }}>
                {row.map(function(ch, ci) {
                  return (
                    <div key={ci} style={{ width: 44, height: 44, borderRadius: 8, background: cellColors[(ri * 2 + ci) % cellColors.length] + '22', border: '1px solid ' + cellColors[(ri * 2 + ci) % cellColors.length] + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: cellColors[(ri * 2 + ci) % cellColors.length] }}>{ch}</div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ---- 12. Wave Interference (9-12) ----
export function CanvasWaveInterference({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  var freq = (raw.freq as number) ?? 3
  var separation = (raw.separation as number) ?? 120
  var s = ws(isDark)

  var svgW = 400, svgH = 280
  var cx = svgW / 2, cy = svgH / 2
  var src1 = { x: cx - separation / 2, y: 60 }
  var src2 = { x: cx + separation / 2, y: 60 }

  // Generate interference pattern
  var patterns: Array<{ x: number; y: number; color: string }> = []
  for (var px = 0; px < svgW; px += 6) {
    for (var py = 80; py < svgH; py += 6) {
      var d1 = Math.sqrt((px - src1.x) ** 2 + (py - src1.y) ** 2)
      var d2 = Math.sqrt((px - src2.x) ** 2 + (py - src2.y) ** 2)
      var wave1 = Math.sin(d1 * freq * 0.1)
      var wave2 = Math.sin(d2 * freq * 0.1)
      var combined = (wave1 + wave2) / 2
      if (combined > 0.3) patterns.push({ x: px, y: py, color: '#34d399' })
      else if (combined < -0.3) patterns.push({ x: px, y: py, color: '#f87171' })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>🌊 Wave Interference</div>
      <svg width={svgW} height={svgH} style={{ background: s.surface, borderRadius: 8, border: '1px solid ' + s.border }}>
        <rect x={0} y={80} width={svgW} height={svgH - 80} fill={isDark ? '#0f172a' : '#f8fafc'} />
        {patterns.map(function(p, i) {
          return <rect key={i} x={p.x} y={p.y} width={5} height={5} fill={p.color} opacity={0.6} rx={1} />
        })}
        <circle cx={src1.x} cy={src1.y} r={8} fill="#34d399" stroke="#fff" strokeWidth={2} />
        <circle cx={src2.x} cy={src2.y} r={8} fill="#34d399" stroke="#fff" strokeWidth={2} />
        <text x={src1.x} y={src1.y - 14} textAnchor="middle" fontSize={8} fill={s.bright}>S1</text>
        <text x={src2.x} y={src2.y - 14} textAnchor="middle" fontSize={8} fill={s.bright}>S2</text>
      </svg>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flex: 1 }}>
          <span style={{ fontSize: 10, color: s.text }}>Frequency:</span>
          <input type="range" min={1} max={8} value={freq} onChange={function(e) { updateConfig({ freq: Number(e.target.value) }) }} style={{ flex: 1, cursor: 'pointer' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: s.bright }}>{freq}</span>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flex: 1 }}>
          <span style={{ fontSize: 10, color: s.text }}>Separation:</span>
          <input type="range" min={40} max={300} value={separation} onChange={function(e) { updateConfig({ separation: Number(e.target.value) }) }} style={{ flex: 1, cursor: 'pointer' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 9 }}>
        <span style={{ color: '#34d399' }}>● Constructive (in phase)</span>
        <span style={{ color: '#f87171' }}>● Destructive (out of phase)</span>
      </div>
    </div>
  )
}

// ============================================================
// NEW PHASE 3 SCIENCE CANVAS WIDGETS (BATCH 2)
// ============================================================

// ---- CanvasSimpleMachines (K-5) ----
export function CanvasSimpleMachines({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const selected = (raw.selected as number) ?? -1
  const s = ws(isDark)

  const machines = [
    { name: 'Lever', icon: '⚖️', color: '#f59e0b', ma: 'MA = effort arm / load arm', examples: ['Seesaw', 'Crowbar', 'Scissors'], desc: 'A rigid bar that pivots on a fulcrum. Pushing down on one side lifts the other.' },
    { name: 'Pulley', icon: '🔄', color: '#3b82f6', ma: 'MA = number of ropes', examples: ['Flag pole', 'Elevator', 'Blinds'], desc: 'A wheel with a groove for a rope. Changes direction of force or multiplies it.' },
    { name: 'Wheel & Axle', icon: '⚙️', color: '#8b5cf6', ma: 'MA = wheel radius / axle radius', examples: ['Car wheel', 'Doorknob', 'Bicycle'], desc: 'Two circular objects joined together. The larger wheel turns the smaller axle.' },
    { name: 'Inclined Plane', icon: '📐', color: '#22c55e', ma: 'MA = length / height', examples: ['Ramp', 'Stairs', 'Slide'], desc: 'A flat surface tilted at an angle. Reduces the force needed to lift objects.' },
    { name: 'Wedge', icon: '🔺', color: '#ef4444', ma: 'MA = length / width', examples: ['Axe', 'Nail', 'Knife'], desc: 'Two inclined planes back-to-back. Splits or cuts materials apart.' },
    { name: 'Screw', icon: '🔩', color: '#ec4899', ma: 'MA = 2πr / pitch', examples: ['Jar lid', 'Drill', 'Vice'], desc: 'An inclined plane wrapped around a cylinder. Turns rotational force into linear force.' },
  ]

  const m = selected >= 0 ? machines[selected] : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>⚙️ Simple Machines</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        {machines.map(function(machine, i) {
          return (
            <button key={machine.name} onClick={function() { updateConfig({ selected: selected === i ? -1 : i }) }}
              style={{ padding: '8px 4px', borderRadius: 6, cursor: 'pointer', textAlign: 'center',
                background: selected === i ? machine.color + '22' : s.surface,
                border: selected === i ? '1px solid ' + machine.color + '66' : '1px solid ' + s.border,
                transition: 'all 0.15s' }}>
              <div style={{ fontSize: 22 }}>{machine.icon}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: selected === i ? machine.color : s.text, marginTop: 2 }}>{machine.name}</div>
            </button>
          )
        })}
      </div>
      {m && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, padding: 8, background: s.surface, borderRadius: 8, border: '1px solid ' + s.border, overflow: 'auto' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: m.color }}>{m.icon} {m.name}</div>
          <div style={{ fontSize: 10, color: s.text, lineHeight: 1.5 }}>{m.desc}</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: s.bright }}>Mechanical Advantage:</div>
          <div style={{ padding: '4px 8px', background: m.color + '15', borderRadius: 4, fontSize: 11, fontWeight: 600, color: m.color, fontFamily: 'monospace', border: '1px solid ' + m.color + '33' }}>{m.ma}</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: s.bright }}>Real-World Examples:</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {m.examples.map(function(ex) {
              return <span key={ex} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, background: m.color + '15', color: m.color, border: '1px solid ' + m.color + '33' }}>{ex}</span>
            })}
          </div>
          <svg width="100%" height={80} viewBox="0 0 200 80">
            {selected === 0 && <g><line x1="30" y1="60" x2="170" y2="60" stroke={s.border} strokeWidth={2} /><polygon points="95,55 105,55 100,60" fill={m.color} /><rect x="50" y="40" width="30" height="20" rx={2} fill={m.color + '44'} stroke={m.color} /><line x1="150" y1="20" x2="150" y2="60" stroke={m.color} strokeWidth={2} /><circle cx="150" cy="18" r={6} fill={m.color} /><text x="100" y="75" textAnchor="middle" fontSize={8} fill={s.text}>Fulcrum</text></g>}
            {selected === 1 && <g><circle cx="100" cy="30" r="18" fill="none" stroke={m.color} strokeWidth={2} /><circle cx="100" cy="30" r="4" fill={m.color} /><path d="M 82 30 Q 70 50 82 55" fill="none" stroke={s.text} strokeWidth={1.5} /><rect x="90" y="48" width="20" height="16" rx={2} fill={m.color + '44'} stroke={m.color} /></g>}
            {selected === 2 && <g><circle cx="100" cy="40" r="25" fill="none" stroke={m.color} strokeWidth={2} /><circle cx="100" cy="40" r="8" fill={m.color + '33'} stroke={m.color} /><line x1="92" y1="40" x2="108" y2="40" stroke={s.bright} strokeWidth={1.5} /><line x1="100" y1="15" x2="100" y2="65" stroke={s.bright} strokeWidth={1.5} /></g>}
            {selected === 3 && <g><polygon points="20,65 180,65 180,25" fill={m.color + '22'} stroke={m.color} strokeWidth={2} /><rect x="140" y="15" width="20" height="12" rx={2} fill={m.color + '44'} stroke={m.color} /><line x1="150" y1="27" x2="150" y2="65" stroke={s.text} strokeWidth={1} strokeDasharray="3,3" /><text x="100" y="78" textAnchor="middle" fontSize={8} fill={s.text}>h</text></g>}
            {selected === 4 && <g><polygon points="40,65 100,20 160,65" fill={m.color + '22'} stroke={m.color} strokeWidth={2} /><line x1="100" y1="65" x2="100" y2="25" stroke={s.bright} strokeWidth={1} strokeDasharray="3,3" /></g>}
            {selected === 5 && <g><rect x="85" y="10" width="30" height="55" rx={4} fill={m.color + '22'} stroke={m.color} strokeWidth={2} /><path d="M 85 18 Q 100 14 115 18 Q 115 22 100 26 Q 85 22 85 18" fill="none" stroke={m.color} strokeWidth={1.5} /><path d="M 85 28 Q 100 24 115 28 Q 115 32 100 36 Q 85 32 85 28" fill="none" stroke={m.color} strokeWidth={1.5} /><path d="M 85 38 Q 100 34 115 38 Q 115 42 100 46 Q 85 42 85 38" fill="none" stroke={m.color} strokeWidth={1.5} /></g>}
          </svg>
        </div>
      )}
      {!m && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: s.text }}>Click a machine above to explore</div>}
    </div>
  )
}

// ---- CanvasSolarSystem (K-5, 3-5) ----
export function CanvasSolarSystem({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const selected = (raw.selected as number) ?? -1
  const speed = (raw.speed as number) ?? 1
  const s = ws(isDark)

  const planets = [
    { name: 'Mercury', color: '#a1a1aa', radius: 4, orbit: 32, size: '4,879 km', dist: '57.9M km', days: '88 days', fact: 'Smallest planet, closest to Sun' },
    { name: 'Venus', color: '#fbbf24', radius: 6, orbit: 48, size: '12,104 km', dist: '108.2M km', days: '225 days', fact: 'Hottest planet (900°F), spins backwards' },
    { name: 'Earth', color: '#3b82f6', radius: 6, orbit: 66, size: '12,756 km', dist: '149.6M km', days: '365 days', fact: 'Only known planet with liquid water & life' },
    { name: 'Mars', color: '#ef4444', radius: 5, orbit: 82, size: '6,792 km', dist: '227.9M km', days: '687 days', fact: 'Called the Red Planet, has the tallest volcano' },
    { name: 'Jupiter', color: '#f97316', radius: 12, orbit: 105, size: '142,984 km', dist: '778.6M km', days: '12 years', fact: 'Largest planet, Great Red Spot storm' },
    { name: 'Saturn', color: '#eab308', radius: 10, orbit: 128, size: '120,536 km', dist: '1.4B km', days: '29 years', fact: 'Beautiful rings made of ice & rock' },
    { name: 'Uranus', color: '#67e8f9', radius: 8, orbit: 148, size: '51,118 km', dist: '2.9B km', days: '84 years', fact: 'Rotates on its side, ice giant' },
    { name: 'Neptune', color: '#6366f1', radius: 7, orbit: 165, size: '49,528 km', dist: '4.5B km', days: '165 years', fact: 'Windiest planet, deep blue color' },
  ]

  const p = selected >= 0 ? planets[selected] : null
  const angle = (Date.now() / 1000 * speed * 0.3) % (Math.PI * 2)
  const cx = 195
  const cy = 185

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>🪐 Solar System</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 8px', background: s.surface, borderRadius: 6, border: '1px solid ' + s.border }}>
        <span style={{ fontSize: 10, color: s.text }}>Speed:</span>
        <input type="range" min={0} max={5} step={0.5} value={speed} onChange={function(e) { updateConfig({ speed: Number(e.target.value) }) }} style={{ flex: 1, cursor: 'pointer' }} />
        <span style={{ fontSize: 10, fontWeight: 600, color: s.bright }}>{speed}x</span>
      </div>
      <svg width={390} height={370} style={{ background: isDark ? '#020617' : '#f0f9ff', borderRadius: 8, border: '1px solid ' + s.border }}>
        {/* Sun */}
        <circle cx={cx} cy={cy} r={16} fill="#fbbf24" />
        <circle cx={cx} cy={cy} r={20} fill="#fbbf24" opacity={0.2} />
        {/* Orbits */}
        {planets.map(function(pl, i) {
          return <circle key={i} cx={cx} cy={cy} r={pl.orbit} fill="none" stroke={s.border} strokeWidth={0.5} strokeDasharray="2,2" />
        })}
        {/* Planets */}
        {planets.map(function(pl, i) {
          var a = angle * (1 + i * 0.4)
          var px = cx + Math.cos(a) * pl.orbit
          var py = cy + Math.sin(a) * pl.orbit * 0.55
          return <g key={i}>
            <circle cx={px} cy={py} r={pl.radius} fill={pl.color} stroke={selected === i ? '#fff' : 'none'} strokeWidth={selected === i ? 2 : 0} style={{ cursor: 'pointer' }} onClick={function() { updateConfig({ selected: selected === i ? -1 : i }) }} />
            {i === 5 && <ellipse cx={px} cy={py} rx={pl.radius + 6} ry={3} fill="none" stroke={pl.color} strokeWidth={1.5} opacity={0.7} />}
            {selected === i && <text x={px} y={py - pl.radius - 4} textAnchor="middle" fontSize={7} fill="#fff" fontWeight={600}>{pl.name}</text>}
          </g>
        })}
      </svg>
      {p && (
        <div style={{ padding: 8, background: s.surface, borderRadius: 8, border: '1px solid ' + s.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>{p.name}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, fontSize: 9 }}>
            <div><span style={{ color: s.text }}>Diameter:</span> <span style={{ color: s.bright, fontWeight: 600 }}>{p.size}</span></div>
            <div><span style={{ color: s.text }}>Distance:</span> <span style={{ color: s.bright, fontWeight: 600 }}>{p.dist}</span></div>
            <div><span style={{ color: s.text }}>Orbit:</span> <span style={{ color: s.bright, fontWeight: 600 }}>{p.days}</span></div>
          </div>
          <div style={{ marginTop: 4, fontSize: 9, color: '#34d399', fontStyle: 'italic' }}>{p.fact}</div>
        </div>
      )}
    </div>
  )
}

// ---- CanvasWaterCycle (3-5, 6-8) ----
export function CanvasWaterCycle({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const selected = (raw.selected as string) ?? ''
  const s = ws(isDark)

  const stages = [
    { id: 'evaporation', label: 'Evaporation', icon: '☀️', color: '#f59e0b', x: 280, y: 60, desc: 'The Sun heats water in oceans, lakes, and rivers, turning it into water vapor (gas). This invisible gas rises into the atmosphere.' },
    { id: 'transpiration', label: 'Transpiration', icon: '🌱', color: '#22c55e', x: 60, y: 60, desc: 'Plants release water vapor through tiny openings in their leaves called stomata. A large tree can release hundreds of gallons per day!' },
    { id: 'condensation', label: 'Condensation', icon: '☁️', color: '#94a3b8', x: 170, y: 30, desc: 'As water vapor rises, it cools and changes back into tiny water droplets, forming clouds. This happens when warm air meets cooler air.' },
    { id: 'precipitation', label: 'Precipitation', icon: '🌧️', color: '#3b82f6', x: 170, y: 160, desc: 'When cloud droplets combine and become too heavy, they fall as rain, snow, sleet, or hail. Gravity pulls them back to Earth.' },
    { id: 'collection', label: 'Collection', icon: '🌊', color: '#06b6d4', x: 170, y: 260, desc: 'Water collects in oceans, rivers, lakes, and underground. This water will eventually evaporate again, continuing the endless cycle.' },
  ]

  var stg = stages.find(function(s) { return s.id === selected })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>💧 Water Cycle</div>
      <svg width={390} height={310} style={{ background: isDark ? '#0c1425' : '#f0f9ff', borderRadius: 8, border: '1px solid ' + s.border }}>
        {/* Mountains */}
        <polygon points="20,310 120,180 220,310" fill={isDark ? '#1e293b' : '#e2e8f0'} />
        <polygon points="180,310 310,160 440,310" fill={isDark ? '#1e293b' : '#cbd5e1'} />
        {/* Water body */}
        <ellipse cx={320} cy={295} rx={120} ry={25} fill="#3b82f622" stroke="#3b82f6" strokeWidth={1} />
        {/* Sun */}
        <circle cx={360} cy={40} r={22} fill="#fbbf24" opacity={0.8} />
        {/* Cloud */}
        <ellipse cx={170} cy={50} rx={50} ry={20} fill={isDark ? '#334155' : '#e2e8f0'} />
        <ellipse cx={150} cy={45} rx={30} ry={18} fill={isDark ? '#334155' : '#e2e8f0'} />
        <ellipse cx={190} cy={45} rx={30} ry={18} fill={isDark ? '#334155' : '#e2e8f0'} />
        {/* Arrows showing flow */}
        <defs>
          <marker id={'wc-arrow'} markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#34d399" /></marker>
        </defs>
        {/* Evaporation arrow up */}
        <path d="M 300 270 Q 310 180 290 80" fill="none" stroke="#f59e0b" strokeWidth={1.5} markerEnd={'url(#wc-arrow)'} strokeDasharray="4,3" />
        {/* Transpiration arrow up */}
        <path d="M 80 170 Q 90 120 130 60" fill="none" stroke="#22c55e" strokeWidth={1.5} markerEnd={'url(#wc-arrow)'} strokeDasharray="4,3" />
        {/* Condensation arrow across */}
        <path d="M 200 50 Q 220 55 250 60" fill="none" stroke="#94a3b8" strokeWidth={1.5} markerEnd={'url(#wc-arrow)'} />
        {/* Precipitation arrow down */}
        <path d="M 170 75 L 170 150" fill="none" stroke="#3b82f6" strokeWidth={1.5} markerEnd={'url(#wc-arrow)'} strokeDasharray="4,3" />
        {/* Rain drops */}
        {['155,165', '170,155', '185,168', '160,185', '175,178'].map(function(pos, i) {
          var parts = pos.split(',')
          return <text key={i} x={Number(parts[0])} y={Number(parts[1])} fontSize={8} fill="#3b82f6" opacity={0.6}>💧</text>
        })}
        {/* Collection arrow */}
        <path d="M 170 270 Q 200 285 240 290" fill="none" stroke="#06b6d4" strokeWidth={1.5} markerEnd={'url(#wc-arrow)'} />
        {/* Stage labels */}
        {stages.map(function(stage) {
          return <g key={stage.id} style={{ cursor: 'pointer' }} onClick={function() { updateConfig({ selected: selected === stage.id ? '' : stage.id }) }}>
            <circle cx={stage.x} cy={stage.y} r={14} fill={selected === stage.id ? stage.color + '44' : isDark ? '#0f172a' : '#ffffff'} stroke={selected === stage.id ? stage.color : s.border} strokeWidth={1.5} />
            <text x={stage.x} y={stage.y + 4} textAnchor="middle" fontSize={12}>{stage.icon}</text>
            <text x={stage.x} y={stage.y + 22} textAnchor="middle" fontSize={7} fill={selected === stage.id ? stage.color : s.text} fontWeight={600}>{stage.label}</text>
          </g>
        })}
        {/* Tree */}
        <rect x={70} y={175} width={6} height={30} fill="#92400e" />
        <circle cx={73} cy={168} r={15} fill="#22c55e44" stroke="#22c55e" strokeWidth={1} />
      </svg>
      {stg && (
        <div style={{ padding: 8, background: stg.color + '11', borderRadius: 8, border: '1px solid ' + stg.color + '33' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: stg.color, marginBottom: 3 }}>{stg.icon} {stg.label}</div>
          <div style={{ fontSize: 10, color: s.text, lineHeight: 1.5 }}>{stg.desc}</div>
        </div>
      )}
    </div>
  )
}

// ---- CanvasRockCycle (6-8) ----
export function CanvasRockCycle({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const selected = (raw.selected as string) ?? ''
  const s = ws(isDark)

  const rockTypes = [
    {
      id: 'igneous', label: 'Igneous', color: '#ef4444', x: 195, y: 30,
      examples: ['Granite', 'Basalt', 'Obsidian', 'Pumice', 'Rhyolite'],
      formation: 'Formed from cooled and solidified magma or lava. Intrusive (slow cooling = large crystals like granite) or extrusive (fast cooling = small/no crystals like basalt).',
      processes: 'Melting → Magma → Cooling & Crystallization',
    },
    {
      id: 'sedimentary', label: 'Sedimentary', color: '#f59e0b', x: 50, y: 250,
      examples: ['Sandstone', 'Limestone', 'Shale', 'Conglomerate', 'Coal'],
      formation: 'Formed from compressed and cemented sediments (rock fragments, minerals, organic matter). Layers build up over millions of years under pressure.',
      processes: 'Weathering & Erosion → Compaction → Cementation',
    },
    {
      id: 'metamorphic', label: 'Metamorphic', color: '#8b5cf6', x: 340, y: 250,
      examples: ['Marble', 'Slate', 'Quartzite', 'Schist', 'Gneiss'],
      formation: 'Formed when existing rocks are changed by extreme heat and pressure deep underground. The rock does NOT melt — its mineral structure rearranges.',
      processes: 'Heat + Pressure → Recrystallization → Banding/Foliation',
    },
  ]

  const transitions = [
    { from: 'igneous', to: 'sedimentary', label: 'Weathering & Erosion', color: '#f59e0b', path: 'M 145,65 Q 60,130 75,220' },
    { from: 'sedimentary', to: 'metamorphic', label: 'Heat & Pressure', color: '#8b5cf6', path: 'M 130,265 Q 195,310 275,265' },
    { from: 'metamorphic', to: 'igneous', label: 'Melting', color: '#ef4444', path: 'M 320,220 Q 310,100 240,55' },
    { from: 'sedimentary', to: 'igneous', label: 'Melting & Cooling', color: '#ef4444', path: 'M 90,220 Q 90,30 155,40' },
    { from: 'metamorphic', to: 'sedimentary', label: 'Weathering', color: '#f59e0b', path: 'M 290,270 Q 195,320 115,270' },
    { from: 'igneous', to: 'metamorphic', label: 'Heat & Pressure', color: '#8b5cf6', path: 'M 240,50 Q 340,50 355,220' },
  ]

  var sel = rockTypes.find(function(r) { return r.id === selected })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>🪨 Rock Cycle</div>
      <svg width={390} height={310} style={{ background: s.surface, borderRadius: 8, border: '1px solid ' + s.border }}>
        <defs>
          <marker id={'rc-arrow-' + 1} markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#34d399" /></marker>
        </defs>
        {/* Transition arrows */}
        {transitions.map(function(t, i) {
          return <g key={i}>
            <path d={t.path} fill="none" stroke={t.color} strokeWidth={1.5} opacity={0.5} strokeDasharray="4,3" />
            <text x={195} y={155 + i * 18} textAnchor="middle" fontSize={7} fill={t.color} fontWeight={500}>{t.label}</text>
          </g>
        })}
        {/* Rock type nodes */}
        {rockTypes.map(function(rock) {
          return <g key={rock.id} style={{ cursor: 'pointer' }} onClick={function() { updateConfig({ selected: selected === rock.id ? '' : rock.id }) }}>
            <polygon points={rock.id === 'igneous' ? '195,10 245,60 145,60' : rock.id === 'sedimentary' ? '50,220 100,270 0,270' : '340,220 390,270 290,270'}
              fill={selected === rock.id ? rock.color + '33' : rock.color + '15'}
              stroke={selected === rock.id ? rock.color : rock.color + '66'} strokeWidth={2} />
            <text x={rock.x} y={rock.y + (rock.id === 'igneous' ? 25 : -15)} textAnchor="middle" fontSize={11} fontWeight={700} fill={rock.color}>{rock.label}</text>
          </g>
        })}
      </svg>
      {sel && (
        <div style={{ padding: 8, background: sel.color + '11', borderRadius: 8, border: '1px solid ' + sel.color + '33', overflow: 'auto' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: sel.color, marginBottom: 3 }}>{sel.label} Rock</div>
          <div style={{ fontSize: 9, color: s.text, lineHeight: 1.4, marginBottom: 4 }}>{sel.formation}</div>
          <div style={{ fontSize: 9, fontWeight: 600, color: s.bright, marginBottom: 2 }}>Process: {sel.processes}</div>
          <div style={{ fontSize: 9, fontWeight: 600, color: s.bright }}>Examples:</div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {sel!.examples.map(function(ex) {
              return <span key={ex} style={{ padding: '1px 6px', borderRadius: 3, fontSize: 8, background: sel!.color + '15', color: sel!.color }}>{ex}</span>
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ---- CanvasObservationJournal (K-5, 3-5) ----
export function CanvasObservationJournal({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  var entries: Array<Record<string, string>> = (raw.entries as Array<Record<string, string>>) || []
  var formData: Record<string, string> = (raw.formData as Record<string, string>) || { date: '', location: '', weather: '', observations: '' }
  const activeTab = (raw.activeTab as string) || 'form'
  const s = ws(isDark)

  var inputStyle: React.CSSProperties = { padding: '4px 8px', borderRadius: 4, fontSize: 10, border: '1px solid ' + s.border, background: s.surface, color: s.bright, width: '100%', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>📓 Observation Journal</div>
      <div style={{ display: 'flex', gap: 4 }}>
        {[['form', '📝 New Entry'], ['list', '📋 Entries']].map(function(tab) {
          var id = tab[0] as string, label = tab[1] as string
          return <button key={id} onClick={function() { updateConfig({ activeTab: id }) }}
            style={{ flex: 1, padding: '5px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer', textAlign: 'center',
              background: activeTab === id ? 'rgba(5,150,105,0.15)' : s.surface,
              border: activeTab === id ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + s.border,
              color: activeTab === id ? '#34d399' : s.text }}>
            {label} {id === 'list' ? '(' + entries.length + ')' : ''}
          </button>
        })}
      </div>
      {activeTab === 'form' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1 }}><label style={{ fontSize: 9, color: s.text, fontWeight: 600 }}>📅 Date</label><input type="date" value={formData.date} onChange={function(e) { updateConfig({ formData: { ...formData, date: e.target.value } }) }} style={inputStyle} /></div>
            <div style={{ flex: 1 }}><label style={{ fontSize: 9, color: s.text, fontWeight: 600 }}>📍 Location</label><input type="text" placeholder="e.g. School garden" value={formData.location} onChange={function(e) { updateConfig({ formData: { ...formData, location: e.target.value } }) }} style={inputStyle} /></div>
          </div>
          <div><label style={{ fontSize: 9, color: s.text, fontWeight: 600 }}>🌤️ Weather</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {['☀️ Sunny', '⛅ Cloudy', '🌧️ Rainy', '❄️ Snowy', '💨 Windy'].map(function(w) {
                var emoji = w.split(' ')[0]
                return <button key={w} onClick={function() { updateConfig({ formData: { ...formData, weather: emoji } }) }}
                  style={{ padding: '3px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
                    background: formData.weather === emoji ? 'rgba(5,150,105,0.15)' : s.surface,
                    border: formData.weather === emoji ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + s.border }}>{w}</button>
              })}
            </div>
          </div>
          <div style={{ flex: 1 }}><label style={{ fontSize: 9, color: s.text, fontWeight: 600 }}>🔍 Observations</label>
            <textarea placeholder="What did you observe? Describe using your 5 senses..." value={formData.observations} onChange={function(e) { updateConfig({ formData: { ...formData, observations: e.target.value } }) }}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
          </div>
          <button onClick={function() {
            if (!formData.observations.trim()) return
            var newEntries = [{ ...formData, id: Date.now().toString() }, ...entries]
            updateConfig({ entries: newEntries, formData: { date: '', location: '', weather: '', observations: '' } })
          }} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(5,150,105,0.2)', border: '1px solid rgba(5,150,105,0.4)', color: '#34d399' }}>
            ✚ Save Entry
          </button>
        </div>
      )}
      {activeTab === 'list' && (
        <div style={{ flex: 1, overflow: 'auto', maxHeight: 350 }}>
          {entries.length === 0 && <div style={{ textAlign: 'center', padding: 20, fontSize: 11, color: s.text }}>No observations yet. Start your first entry!</div>}
          {entries.map(function(entry, i) {
            return (
              <div key={entry.id || i} style={{ padding: 8, marginBottom: 4, background: s.surface, borderRadius: 6, border: '1px solid ' + s.border }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: s.bright }}>{entry.weather || '📅'} {entry.date}</span>
                  <button onClick={function() { var ne = entries.filter(function(_, j) { return j !== i }); updateConfig({ entries: ne }) }} style={{ fontSize: 9, color: '#f87171', cursor: 'pointer', background: 'none', border: 'none' }}>✕</button>
                </div>
                {entry.location && <div style={{ fontSize: 9, color: s.text, marginBottom: 2 }}>📍 {entry.location}</div>}
                <div style={{ fontSize: 10, color: s.text, lineHeight: 1.4 }}>{entry.observations}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---- CanvasLabReportTemplate (6-8, 9-12) ----
export function CanvasLabReportTemplate({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const activeTab = (raw.activeTab as number) ?? 0
  var report: Record<string, string> = (raw.report as Record<string, string>) || {}
  const s = ws(isDark)

  const sections = [
    { key: 'title', label: '📋 Title', placeholder: 'Enter lab title (e.g. "Effect of Temperature on Solubility")' },
    { key: 'hypothesis', label: '💡 Hypothesis', placeholder: 'If... then... because... (Make a testable prediction)' },
    { key: 'materials', label: '🧪 Materials', placeholder: 'List all materials and equipment needed\n• Beaker (250 mL)\n• Thermometer\n• ...' },
    { key: 'procedure', label: '📝 Procedure', placeholder: 'Step-by-step instructions\n1. Gather materials\n2. Measure 100 mL of water\n3. ...' },
    { key: 'data', label: '📊 Data', placeholder: 'Record your measurements and observations\nTrial 1: ...\nTrial 2: ...\nTrial 3: ...' },
    { key: 'analysis', label: '📈 Analysis', placeholder: 'What patterns do you see? Calculate averages, identify trends, and note any anomalies.' },
    { key: 'conclusion', label: '🎯 Conclusion', placeholder: 'Was your hypothesis supported? What did you learn? What would you do differently?' },
  ]

  const sec = sections[activeTab]
  var inputStyle: React.CSSProperties = { padding: '6px 8px', borderRadius: 5, fontSize: 10, border: '1px solid ' + s.border, background: s.surface, color: s.bright, width: '100%', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', lineHeight: 1.5 }

  var filledCount = sections.filter(function(sec) { return (report[sec.key] || '').trim().length > 0 }).length
  var progress = Math.round(filledCount / sections.length * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>🔬 Lab Report</div>
        <div style={{ fontSize: 9, color: s.text }}>{filledCount}/{sections.length} sections ({progress}%)</div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 4, borderRadius: 2, background: s.surface, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: progress + '%', background: progress === 100 ? '#22c55e' : '#34d399', borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {sections.map(function(sec, i) {
          var filled = (report[sec.key] || '').trim().length > 0
          return <button key={sec.key} onClick={function() { updateConfig({ activeTab: i }) }}
            style={{ padding: '3px 6px', borderRadius: 4, fontSize: 8, cursor: 'pointer',
              background: activeTab === i ? 'rgba(5,150,105,0.15)' : s.surface,
              border: activeTab === i ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + s.border,
              color: activeTab === i ? '#34d399' : s.text, fontWeight: activeTab === i ? 700 : 400 }}>
            {filled && '✓ '}{sec.label.split(' ')[1]}
          </button>
        })}
      </div>
      {/* Active section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: s.bright }}>{sec.label}</div>
        {sec.key === 'title' ? (
          <input type="text" value={report.title || ''} placeholder={sec.placeholder} onChange={function(e) { updateConfig({ report: { ...report, title: e.target.value } }) }} style={{ ...inputStyle, fontSize: 14, fontWeight: 700 }} />
        ) : (
          <textarea value={report[sec.key] || ''} placeholder={sec.placeholder} onChange={function(e) { updateConfig({ report: { ...report, [sec.key]: e.target.value } }) }}
            style={{ ...inputStyle, flex: 1, minHeight: 200, resize: 'vertical' }} />
        )}
      </div>
    </div>
  )
}

// ---- CanvasWeatherPatterns (6-8) ----
export function CanvasWeatherPatterns({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const selected = (raw.selected as string) ?? ''
  const s = ws(isDark)

  const patterns = [
    { id: 'cold-front', label: 'Cold Front', icon: '🧊', color: '#3b82f6', symbol: 'Triangles along line',
      desc: 'A cold air mass pushes into a warmer air mass. Cold air is denser, so it slides under warm air, forcing it upward rapidly. This causes towering cumulonimbus clouds, heavy rain, thunderstorms, and sometimes severe weather.',
      effects: ['Thunderstorms', 'Heavy rain', 'Temperature drop', 'Wind shift', 'Clearing behind front'],
      svgIcon: <g><line x1="20" y1="50" x2="180" y2="50" stroke="#3b82f6" strokeWidth={3} /><polygon points="50,50 55,35 60,50" fill="#3b82f6" /><polygon points="90,50 95,35 100,50" fill="#3b82f6" /><polygon points="130,50 135,35 140,50" fill="#3b82f6" /></g> },
    { id: 'warm-front', label: 'Warm Front', icon: '🔥', color: '#ef4444', symbol: 'Semi-circles along line',
      desc: 'A warm air mass advances into a cooler air mass. Warm air gradually rises over the cold air, creating widespread layered clouds. Precipitation is usually light to moderate and spread over a large area.',
      effects: ['Light rain', 'Overcast skies', 'Gradual warming', 'Fog possible', 'Steady precipitation'],
      svgIcon: <g><line x1="20" y1="50" x2="180" y2="50" stroke="#ef4444" strokeWidth={3} /><path d="M 50 50 A 8 8 0 0 0 66 50" fill="#ef4444" /><path d="M 90 50 A 8 8 0 0 0 106 50" fill="#ef4444" /><path d="M 130 50 A 8 8 0 0 0 146 50" fill="#ef4444" /></g> },
    { id: 'stationary-front', label: 'Stationary Front', icon: '⏸️', color: '#a855f7', symbol: 'Alternating triangles and semi-circles',
      desc: 'When a cold front and warm front meet but neither advances. They stall in place, sometimes for days. This can cause prolonged periods of clouds and precipitation.',
      effects: ['Extended rain', 'Cloudy days', 'Temperature steady', 'Flooding risk', 'Eventual movement'],
      svgIcon: <g><line x1="20" y1="50" x2="180" y2="50" stroke="#a855f7" strokeWidth={3} /><polygon points="50,50 55,35 60,50" fill="#3b82f6" /><path d="M 80 50 A 8 8 0 0 0 96 50" fill="#ef4444" /><polygon points="110,50 115,35 120,50" fill="#3b82f6" /><path d="M 140 50 A 8 8 0 0 0 156 50" fill="#ef4444" /></g> },
    { id: 'high-pressure', label: 'High Pressure', icon: '⬆️', color: '#22c55e', symbol: 'H with circular isobars',
      desc: 'A high-pressure system has air that is sinking and spreading outward. Sinking air warms and prevents cloud formation. Brings clear, calm, and generally pleasant weather.',
      effects: ['Clear skies', 'Calm winds', 'Dry weather', 'Temperature extremes', 'Fair weather'],
      svgIcon: <g><text x={100} y={35} textAnchor="middle" fontSize={28} fontWeight={700} fill="#22c55e">H</text><circle cx={100} cy={50} r={30} fill="none" stroke="#22c55e" strokeWidth={1} opacity={0.4} /><circle cx={100} cy={50} r={20} fill="none" stroke="#22c55e" strokeWidth={1} opacity={0.3} /></g> },
    { id: 'low-pressure', label: 'Low Pressure', icon: '⬇️', color: '#f59e0b', symbol: 'L with circular isobars',
      desc: 'A low-pressure system has rising air that cools and condenses, forming clouds and precipitation. The Coriolis effect creates counterclockwise winds (Northern Hemisphere). Often brings storms.',
      effects: ['Clouds', 'Precipitation', 'Strong winds', 'Storms', 'Unstable weather'],
      svgIcon: <g><text x={100} y={35} textAnchor="middle" fontSize={28} fontWeight={700} fill="#f59e0b">L</text><circle cx={100} cy={50} r={30} fill="none" stroke="#f59e0b" strokeWidth={1} opacity={0.4} /><circle cx={100} cy={50} r={20} fill="none" stroke="#f59e0b" strokeWidth={1} opacity={0.3} /></g> },
    { id: 'precipitation', label: 'Precipitation Types', icon: '🌧️', color: '#06b6d4', symbol: 'Various weather symbols',
      desc: 'Precipitation forms when water droplets in clouds combine and become heavy enough to fall. The type depends on temperature: rain (above 32°F), snow (below 32°F), sleet (frozen raindrops), hail (ice layers in thunderstorms).',
      effects: ['💧 Rain: liquid water', '❄️ Snow: ice crystals', '🧊 Sleet: frozen drops', '🏀 Hail: ice balls', '🌫️ Drizzle: fine drops'],
      svgIcon: <g><text x={30} y={55} fontSize={20}>💧</text><text x={70} y={55} fontSize={20}>❄️</text><text x={110} y={55} fontSize={20}>🌧️</text><text x={150} y={55} fontSize={20}>🌩️</text></g> },
  ]

  var pat = patterns.find(function(p) { return p.id === selected })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>🌤️ Weather Patterns</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        {patterns.map(function(p) {
          return (
            <button key={p.id} onClick={function() { updateConfig({ selected: selected === p.id ? '' : p.id }) }}
              style={{ padding: '6px 4px', borderRadius: 6, cursor: 'pointer', textAlign: 'center',
                background: selected === p.id ? p.color + '22' : s.surface,
                border: selected === p.id ? '1px solid ' + p.color + '66' : '1px solid ' + s.border }}>
              <div style={{ fontSize: 18 }}>{p.icon}</div>
              <div style={{ fontSize: 8, fontWeight: 600, color: selected === p.id ? p.color : s.text, marginTop: 1 }}>{p.label}</div>
            </button>
          )
        })}
      </div>
      {pat && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto' }}>
          {/* Symbol display */}
          <div style={{ background: s.surface, borderRadius: 8, border: '1px solid ' + s.border, padding: 8 }}>
            <div style={{ fontSize: 9, color: s.text, marginBottom: 4 }}>Weather Map Symbol:</div>
            <svg width={200} height={70} viewBox="0 0 200 70" style={{ display: 'block', margin: '0 auto' }}>{pat.svgIcon}</svg>
            <div style={{ fontSize: 8, color: s.text, textAlign: 'center', marginTop: 2 }}>{pat.symbol}</div>
          </div>
          <div style={{ fontSize: 10, color: s.text, lineHeight: 1.5 }}>{pat.desc}</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: s.bright }}>Effects:</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {pat!.effects.map(function(ef) {
              return <span key={ef} style={{ padding: '2px 6px', borderRadius: 4, fontSize: 8, background: pat!.color + '15', color: pat!.color, border: '1px solid ' + pat!.color + '33' }}>{ef}</span>
            })}
          </div>
        </div>
      )}
      {!pat && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: s.text }}>Click a weather pattern above to learn more</div>}
    </div>
  )
}

// ---- CanvasRotationalMotion (9-12) ----
export function CanvasRotationalMotion({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const force = (raw.force as number) ?? 10
  const armLength = (raw.armLength as number) ?? 50
  const mass = (raw.mass as number) ?? 2
  const radius = (raw.radius as number) ?? 30
  const paused = (raw.paused as boolean) ?? false
  const s = ws(isDark)

  var torque = force * armLength / 100
  var momentOfInertia = mass * (radius / 100) * (radius / 100)
  var angularAccel = momentOfInertia > 0 ? torque / momentOfInertia : 0
  var omega = angularAccel * 2
  var angle = (Date.now() / 1000) * omega

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>🔄 Rotational Motion</div>
      {/* Rotating object SVG */}
      <svg width={390} height={180} style={{ background: s.surface, borderRadius: 8, border: '1px solid ' + s.border }}>
        {/* Pivot point */}
        <circle cx={195} cy={90} r={4} fill={s.bright} />
        {/* Rotating arm with mass */}
        <g transform={"rotate(" + (paused ? 0 : angle % 360) + ", 195, 90)"}>
          <line x1={195} y1={90} x2={195 + radius * 2.5} y2={90} stroke={s.bright} strokeWidth={2} />
          <circle cx={195 + radius * 2.5} cy={90} r={8 + mass * 2} fill="#34d399" opacity={0.8} stroke="#34d399" strokeWidth={1} />
          <text x={195 + radius * 2.5} y={90 + 4} textAnchor="middle" fontSize={7} fill="#fff" fontWeight={600}>{mass}kg</text>
        </g>
        {/* Force arrow */}
        <g transform={"rotate(" + ((paused ? 0 : angle % 360) + 90) + ", " + (195 + radius * 2.5) + ", 90)"}>
          <line x1={195 + radius * 2.5} y1={90} x2={195 + radius * 2.5 + force * 1.5} y2={90} stroke="#f59e0b" strokeWidth={2} markerEnd="url(#rm-arrow)" />
        </g>
        <defs><marker id="rm-arrow" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#f59e0b" /></marker></defs>
        {/* Torque arc */}
        <path d="M 210 90 A 15 15 0 0 1 195 75" fill="none" stroke="#f59e0b" strokeWidth={1.5} />
        <text x={218} y={78} fontSize={8} fill="#f59e0b" fontWeight={600}>τ</text>
        {/* Labels */}
        <text x={10} y={15} fontSize={9} fill={s.text}>r = {radius} cm</text>
        <text x={10} y={30} fontSize={9} fill={s.text}>F = {force} N</text>
      </svg>
      {/* Sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: s.text, minWidth: 55 }}>Force (N):</span>
          <input type="range" min={1} max={50} value={force} onChange={function(e) { updateConfig({ force: Number(e.target.value) }) }} style={{ flex: 1, cursor: 'pointer' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: s.bright, minWidth: 30 }}>{force}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: s.text, minWidth: 55 }}>Arm (cm):</span>
          <input type="range" min={10} max={100} value={armLength} onChange={function(e) { updateConfig({ armLength: Number(e.target.value) }) }} style={{ flex: 1, cursor: 'pointer' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: s.bright, minWidth: 30 }}>{armLength}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: s.text, minWidth: 55 }}>Mass (kg):</span>
          <input type="range" min={0.5} max={10} step={0.5} value={mass} onChange={function(e) { updateConfig({ mass: Number(e.target.value) }) }} style={{ flex: 1, cursor: 'pointer' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: s.bright, minWidth: 30 }}>{mass}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: s.text, minWidth: 55 }}>Radius (cm):</span>
          <input type="range" min={10} max={80} value={radius} onChange={function(e) { updateConfig({ radius: Number(e.target.value) }) }} style={{ flex: 1, cursor: 'pointer' }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: s.bright, minWidth: 30 }}>{radius}</span>
        </div>
      </div>
      {/* Physics values */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, padding: 8, background: s.surface, borderRadius: 6, border: '1px solid ' + s.border }}>
        <div><div style={{ fontSize: 8, color: s.text }}>Torque (τ)</div><div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', fontFamily: 'monospace' }}>{torque.toFixed(2)} N·m</div></div>
        <div><div style={{ fontSize: 8, color: s.text }}>Moment of Inertia (I)</div><div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace' }}>{momentOfInertia.toFixed(3)} kg·m²</div></div>
        <div><div style={{ fontSize: 8, color: s.text }}>Angular Accel (α)</div><div style={{ fontSize: 13, fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>{angularAccel.toFixed(1)} rad/s²</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 9, padding: '0 8px' }}>
        <div style={{ color: s.text }}>τ = r × F = {torque.toFixed(2)} N·m</div>
        <div style={{ color: s.text }}>I = mr² = {momentOfInertia.toFixed(3)} kg·m²</div>
        <div style={{ color: s.text }}>α = τ / I = {angularAccel.toFixed(1)} rad/s²</div>
        <div style={{ color: s.text }}>ω ≈ α·t = {omega.toFixed(1)} rad/s</div>
      </div>
    </div>
  )
}

// ---- CanvasDimensionalAnalysis (9-12) ----
export function CanvasDimensionalAnalysis({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const raw = element.config || {}
  const inputValue = (raw.inputValue as string) || ''
  const inputUnit = (raw.inputUnit as string) || 'km'
  const targetUnit = (raw.targetUnit as string) || 'm'
  const s = ws(isDark)

  var conversions: Record<string, Record<string, { factor: number; label: string }>> = {
    'km': { 'm': { factor: 1000, label: '1 km = 1000 m' }, 'cm': { factor: 100000, label: '1 km = 100,000 cm' }, 'mm': { factor: 1000000, label: '1 km = 1,000,000 mm' }, 'mi': { factor: 0.6214, label: '1 km = 0.6214 mi' }, 'ft': { factor: 3280.84, label: '1 km = 3280.84 ft' }, 'in': { factor: 39370.1, label: '1 km = 39,370.1 in' } },
    'm': { 'km': { factor: 0.001, label: '1 m = 0.001 km' }, 'cm': { factor: 100, label: '1 m = 100 cm' }, 'mm': { factor: 1000, label: '1 m = 1000 mm' }, 'mi': { factor: 0.0006214, label: '1 m = 0.0006214 mi' }, 'ft': { factor: 3.28084, label: '1 m = 3.28084 ft' }, 'in': { factor: 39.3701, label: '1 m = 39.3701 in' } },
    'cm': { 'm': { factor: 0.01, label: '1 cm = 0.01 m' }, 'mm': { factor: 10, label: '1 cm = 10 mm' }, 'km': { factor: 0.00001, label: '1 cm = 0.00001 km' }, 'in': { factor: 0.393701, label: '1 cm = 0.393701 in' }, 'ft': { factor: 0.0328084, label: '1 cm = 0.0328084 ft' } },
    'mm': { 'cm': { factor: 0.1, label: '1 mm = 0.1 cm' }, 'm': { factor: 0.001, label: '1 mm = 0.001 m' }, 'km': { factor: 0.000001, label: '1 mm = 0.000001 km' }, 'in': { factor: 0.0393701, label: '1 mm = 0.0393701 in' } },
    'mi': { 'km': { factor: 1.60934, label: '1 mi = 1.60934 km' }, 'm': { factor: 1609.34, label: '1 mi = 1609.34 m' }, 'ft': { factor: 5280, label: '1 mi = 5280 ft' }, 'yd': { factor: 1760, label: '1 mi = 1760 yd' } },
    'ft': { 'm': { factor: 0.3048, label: '1 ft = 0.3048 m' }, 'in': { factor: 12, label: '1 ft = 12 in' }, 'mi': { factor: 0.0001894, label: '1 ft = 0.0001894 mi' }, 'cm': { factor: 30.48, label: '1 ft = 30.48 cm' } },
    'in': { 'cm': { factor: 2.54, label: '1 in = 2.54 cm' }, 'ft': { factor: 0.08333, label: '1 in = 0.08333 ft' }, 'm': { factor: 0.0254, label: '1 in = 0.0254 m' }, 'mm': { factor: 25.4, label: '1 in = 25.4 mm' } },
    'g': { 'kg': { factor: 0.001, label: '1 g = 0.001 kg' }, 'mg': { factor: 1000, label: '1 g = 1000 mg' }, 'lb': { factor: 0.00220462, label: '1 g = 0.00220462 lb' }, 'oz': { factor: 0.035274, label: '1 g = 0.035274 oz' } },
    'kg': { 'g': { factor: 1000, label: '1 kg = 1000 g' }, 'mg': { factor: 1000000, label: '1 kg = 1,000,000 mg' }, 'lb': { factor: 2.20462, label: '1 kg = 2.20462 lb' }, 'oz': { factor: 35.274, label: '1 kg = 35.274 oz' } },
    'lb': { 'kg': { factor: 0.453592, label: '1 lb = 0.453592 kg' }, 'g': { factor: 453.592, label: '1 lb = 453.592 g' }, 'oz': { factor: 16, label: '1 lb = 16 oz' } },
    'L': { 'mL': { factor: 1000, label: '1 L = 1000 mL' }, 'gal': { factor: 0.264172, label: '1 L = 0.264172 gal' }, 'qt': { factor: 1.05669, label: '1 L = 1.05669 qt' }, 'cup': { factor: 4.22675, label: '1 L = 4.22675 cups' } },
    'mL': { 'L': { factor: 0.001, label: '1 mL = 0.001 L' }, 'gal': { factor: 0.000264, label: '1 mL = 0.000264 gal' }, 'fl oz': { factor: 0.033814, label: '1 mL = 0.033814 fl oz' } },
    'gal': { 'L': { factor: 3.78541, label: '1 gal = 3.78541 L' }, 'qt': { factor: 4, label: '1 gal = 4 qt' }, 'cup': { factor: 16, label: '1 gal = 16 cups' } },
    'hr': { 'min': { factor: 60, label: '1 hr = 60 min' }, 's': { factor: 3600, label: '1 hr = 3600 s' }, 'day': { factor: 0.041667, label: '1 hr = 0.041667 day' } },
    'min': { 's': { factor: 60, label: '1 min = 60 s' }, 'hr': { factor: 0.016667, label: '1 min = 0.016667 hr' }, 'day': { factor: 0.000694, label: '1 min = 0.000694 day' } },
    's': { 'min': { factor: 0.016667, label: '1 s = 0.016667 min' }, 'hr': { factor: 0.000278, label: '1 s = 0.000278 hr' }, 'ms': { factor: 1000, label: '1 s = 1000 ms' } },
  }

  var allUnits = Object.keys(conversions)
  var targetOptions = (conversions[inputUnit] || {})
  var conv = targetOptions[targetUnit]
  var numInput = parseFloat(inputValue)
  var result = (!isNaN(numInput) && conv) ? (numInput * conv.factor) : null

  var inputStyle: React.CSSProperties = { padding: '4px 8px', borderRadius: 4, fontSize: 11, border: '1px solid ' + s.border, background: s.surface, color: s.bright, outline: 'none', fontFamily: 'monospace' }
  var selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }

  // Build chain visualization
  var chainSteps: Array<{ num: string; fromUnit: string; toUnit: string; factor: string; result: string; cancelFrom: boolean; cancelTo: boolean }> = []
  if (!isNaN(numInput) && conv) {
    chainSteps.push({
      num: inputValue, fromUnit: inputUnit, toUnit: '', factor: '', result: '',
      cancelFrom: false, cancelTo: true
    })
    chainSteps.push({
      num: '', fromUnit: '', toUnit: '', factor: conv.label,
      result: '', cancelFrom: conv.label.includes(inputUnit), cancelTo: conv.label.includes(targetUnit)
    })
    chainSteps.push({
      num: result !== null ? (Number.isInteger(result) ? result.toString() : result.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')) : '', fromUnit: '', toUnit: targetUnit, factor: '', result: '', cancelFrom: false, cancelTo: false
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, height: '100%', padding: 8, background: s.bg, borderRadius: 8, boxSizing: 'border-box', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>📐 Dimensional Analysis</div>
      {/* Input row */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: 8, background: s.surface, borderRadius: 6, border: '1px solid ' + s.border }}>
        <input type="text" value={inputValue} onChange={function(e) { updateConfig({ inputValue: e.target.value }) }} placeholder="Enter value" style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
        <select value={inputUnit} onChange={function(e) { updateConfig({ inputUnit: e.target.value, targetUnit: Object.keys(conversions[e.target.value] || {})[0] || '' }) }} style={selectStyle}>
          {allUnits.map(function(u) { return <option key={u} value={u}>{u}</option> })}
        </select>
        <span style={{ fontSize: 14, fontWeight: 700, color: s.bright }}>→</span>
        <select value={targetUnit} onChange={function(e) { updateConfig({ targetUnit: e.target.value }) }} style={selectStyle}>
          {Object.keys(targetOptions).map(function(u) { return <option key={u} value={u}>{u}</option> })}
        </select>
      </div>
      {/* Chain visualization */}
      {result !== null && (
        <div style={{ padding: 12, background: 'rgba(5,150,105,0.08)', borderRadius: 8, border: '1px solid rgba(5,150,105,0.2)' }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: s.text, marginBottom: 8 }}>Step-by-step conversion with unit cancellation:</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', fontFamily: 'monospace', fontSize: 13 }}>
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>{inputValue}</span>
            <span style={{ color: chainSteps[0].cancelTo ? '#f87171' : s.bright, textDecoration: chainSteps[0].cancelTo ? 'line-through' : 'none' }}>{inputUnit}</span>
            <span style={{ color: s.text }}>×</span>
            <span style={{ padding: '2px 6px', background: s.surface, borderRadius: 4, border: '1px solid ' + s.border }}>
              <span style={{ color: chainSteps[1].cancelFrom ? '#f87171' : '#34d399', textDecoration: chainSteps[1].cancelFrom ? 'line-through' : 'none' }}>{conv.label.split(' = ')[1]?.split(' ')[0] || ''}</span>
              <span style={{ color: s.text, margin: '0 2px' }}>/</span>
              <span style={{ color: chainSteps[1].cancelTo ? '#f87171' : '#34d399', textDecoration: chainSteps[1].cancelTo ? 'line-through' : 'none' }}>{conv.label.split(' = ')[0]}</span>
            </span>
            <span style={{ color: s.text }}>=</span>
            <span style={{ color: '#34d399', fontWeight: 700 }}>{Number.isInteger(result) ? result : result.toFixed(4)}</span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>{targetUnit}</span>
          </div>
          {/* Canceled units explanation */}
          <div style={{ marginTop: 8, fontSize: 9, color: '#f87171' }}>
            <span style={{ textDecoration: 'line-through' }}>{inputUnit}</span> cancels out
          </div>
        </div>
      )}
      {result !== null && (
        <div style={{ padding: 12, background: s.surface, borderRadius: 8, border: '1px solid ' + s.border, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: s.text, marginBottom: 4 }}>Result</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>{Number.isInteger(result) ? result : result.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}</div>
          <div style={{ fontSize: 12, color: s.text }}>{targetUnit}</div>
        </div>
      )}
      {/* Quick reference */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: s.text, marginBottom: 4 }}>Common conversions:</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, fontSize: 8 }}>
          {['1 km = 1000 m', '1 mi = 1.609 km', '1 in = 2.54 cm', '1 lb = 0.454 kg', '1 gal = 3.785 L', '1 hr = 60 min', '1 ft = 12 in', '1 kg = 1000 g', '1 L = 1000 mL', '1 day = 24 hr'].map(function(c) {
            return <div key={c} style={{ padding: '2px 6px', color: s.text, background: s.surface, borderRadius: 3 }}>{c}</div>
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// LEGACY: Lazy-loaded panel wrappers (existing science widgets)
// ============================================================

const PhysicsFormulaCalc = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.PhysicsFormulaCalculator })))
const WaveSim = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.WaveSimulator })))
const PendulumSim = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.PendulumSimulator })))
const ScienceUnitConv = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.ScienceUnitConverter })))
const ProjectileSim = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.ProjectileMotionSimulator })))
const OhmsLaw = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.OhmsLawCalculator })))
const CircuitDiag = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.CircuitDiagramBuilder })))
const FreeBodyDiag = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.FreeBodyDiagramBuilder })))
const RayDiag = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.RayDiagramOptics })))
const EnergyBar = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.EnergyBarCharts })))
const InteractiveGraph = lazy(() => import('../room/widgets/physics/PhysicsUtilities').then(m => ({ default: m.InteractiveGraphingTool })))

const PhScale = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.PhScaleVisualizer })))
const SciNotation = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.ScientificNotationConverter })))
const PeriodicTable = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.PeriodicTableExplorer })))
const EqBalancer = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.ChemicalEquationBalancer })))
const MolarMass = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.MolarMassCalculator })))
const LewisDot = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.LewisDotStructureBuilder })))
const VSEPR = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.MolecularGeometryVSEPR })))
const GasLaws = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.GasLawsSimulator })))
const Titration = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.AcidBaseTitration })))
const IonFormation = lazy(() => import('../room/widgets/chemistry/ChemistryUtilities').then(m => ({ default: m.IonFormationVisualizer })))

const PunnettSquare = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.PunnettSquareCalculator })))
const CellDiagram = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.CellDiagramExplorer })))
const Taxonomy = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.TaxonomyClassifier })))
const BodySystems = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.BodySystemsExplorer })))
const FoodWeb = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.EcologyFoodWeb })))
const DNAStructure = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.DNAStructureViewer })))
const NaturalSelection = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.NaturalSelectionSim })))
const CellDivision = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.CellDivisionAnimator })))
const PhotoResp = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.PhotosynthesisRespiration })))
const HumanBody = lazy(() => import('../room/widgets/biology/BiologyUtilities').then(m => ({ default: m.HumanBodyInteractive })))

const RockCycle = lazy(() => import('../room/widgets/earthscience/EarthScienceUtilities').then(m => ({ default: m.RockCycleDiagram })))
const PlateTectonics = lazy(() => import('../room/widgets/earthscience/EarthScienceUtilities').then(m => ({ default: m.PlateTectonicsMap })))
const WeatherMap = lazy(() => import('../room/widgets/earthscience/EarthScienceUtilities').then(m => ({ default: m.WeatherMapReader })))
const WaterCarbon = lazy(() => import('../room/widgets/earthscience/EarthScienceUtilities').then(m => ({ default: m.WaterCarbonCycle })))
const SolarSystem = lazy(() => import('../room/widgets/earthscience/EarthScienceUtilities').then(m => ({ default: m.SolarSystemScale })))
const Topographic = lazy(() => import('../room/widgets/earthscience/EarthScienceUtilities').then(m => ({ default: m.TopographicMapTool })))

const SCIENCE_PANEL_MAP: Record<string, React.LazyExoticComponent<React.ComponentType<{ isDark: boolean }>>> = {
  'phys-formula-calc': PhysicsFormulaCalc,
  'phys-wave-sim': WaveSim,
  'phys-pendulum-sim': PendulumSim,
  'phys-unit-converter': ScienceUnitConv,
  'phys-projectile-sim': ProjectileSim,
  'phys-ohms-law': OhmsLaw,
  'phys-circuit-diagram': CircuitDiag,
  'phys-free-body-diagram': FreeBodyDiag,
  'phys-ray-diagram': RayDiag,
  'phys-energy-bar-charts': EnergyBar,
  'phys-interactive-graphing': InteractiveGraph,
  'chem-ph-scale': PhScale, 'chem-sci-notation': SciNotation, 'chem-periodic-table': PeriodicTable,
  'chem-equation-balancer': EqBalancer, 'chem-molar-mass': MolarMass, 'chem-lewis-dot': LewisDot,
  'chem-vsepr': VSEPR, 'chem-gas-laws': GasLaws, 'chem-titration': Titration, 'chem-ion-formation': IonFormation,
  'bio-punnett-square': PunnettSquare, 'bio-cell-diagram': CellDiagram, 'bio-taxonomy': Taxonomy,
  'bio-body-systems': BodySystems, 'bio-food-web': FoodWeb, 'bio-dna-structure': DNAStructure,
  'bio-natural-selection': NaturalSelection, 'bio-cell-division': CellDivision, 'bio-photosynthesis-resp': PhotoResp,
  'bio-human-body': HumanBody,
  'earth-rock-cycle': RockCycle, 'earth-plate-tectonics': PlateTectonics, 'earth-weather-map': WeatherMap,
  'earth-water-carbon-cycle': WaterCarbon, 'earth-solar-system': SolarSystem, 'earth-topographic-map': Topographic,
}

// ============================================================
// Phase 5: CanvasPhScale — L3 upgrade of the pH Scale Visualizer
// Wraps the existing PhScaleVisualizer but persists the pH value to
// element.config so it survives reloads and template snapshots.
// ============================================================
const PH_EXAMPLES: Array<{ ph: number; label: string }> = [
  { ph: 1, label: 'Stomach acid' },
  { ph: 2, label: 'Lemon juice' },
  { ph: 3, label: 'Cola' },
  { ph: 5, label: 'Coffee' },
  { ph: 7, label: 'Water' },
  { ph: 7.4, label: 'Blood' },
  { ph: 9, label: 'Baking soda' },
  { ph: 12, label: 'Bleach' },
]

export function CanvasPhScale({ element, isDark }: CanvasScienceWidgetProps) {
  const updateConfig = useConfigUpdater(element.id)
  const cfg = element.config as { ph?: number }
  const ph = cfg.ph ?? 7

  const setPh = useCallback((newPh: number) => {
    updateConfig({ ph: Math.round(newPh * 10) / 10 })
  }, [updateConfig])

  const concentration = Math.pow(10, -ph)
  const classification = ph < 6.5 ? 'Acidic' : ph > 7.5 ? 'Basic' : 'Neutral'

  const formatConc = (c: number): string => {
    if (c === 0) return '0'
    const exp = Math.floor(Math.log10(c))
    const mantissa = c / Math.pow(10, exp)
    return mantissa.toFixed(1) + ' × 10^' + exp + ' M'
  }

  const barW = 320
  const barH = 24
  const barX = 10
  const barY = 10

  const svgRef = useRef<SVGSVGElement>(null)
  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - barX
    const newPh = Math.max(0, Math.min(14, (x / barW) * 14))
    setPh(newPh)
  }, [setPh])

  const s = {
    border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    text: isDark ? '#94a3b8' : '#475569',
    bright: isDark ? '#e2e8f0' : '#1e293b',
  }

  return (
    <div style={{ padding: 8, fontFamily: 'inherit' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: s.bright, marginBottom: 4 }}>pH Scale</div>
      <svg ref={svgRef} width={barW + barX * 2} height={barH + 60} onClick={handleClick} style={{ display: 'block', marginBottom: 4, cursor: 'pointer' }}>
        <defs>
          <linearGradient id="phGradCanvas" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="14%" stopColor="#f97316" />
            <stop offset="29%" stopColor="#eab308" />
            <stop offset="43%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#14b8a6" />
            <stop offset="57%" stopColor="#0ea5e9" />
            <stop offset="71%" stopColor="#3b82f6" />
            <stop offset="86%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <rect x={barX} y={barY} width={barW} height={barH} rx={4} fill="url(#phGradCanvas)" stroke={s.border} strokeWidth={0.5} />
        {Array.from({ length: 15 }, (_, i) => {
          const x = barX + (i / 14) * barW
          return (
            <g key={i}>
              <line x1={x} y1={barY + barH} x2={x} y2={barY + barH + 4} stroke={s.text} strokeWidth={0.5} />
              <text x={x} y={barY + barH + 12} textAnchor="middle" fontSize={7} fill={s.text}>{i}</text>
            </g>
          )
        })}
        <polygon
          points={(barX + (ph / 14) * barW) + ',' + (barY - 2) + ' ' +
                  (barX + (ph / 14) * barW - 4) + ',' + (barY - 8) + ' ' +
                  (barX + (ph / 14) * barW + 4) + ',' + (barY - 8)}
          fill={isDark ? '#e2e8f0' : '#1e293b'}
        />
        <line x1={barX + (ph / 14) * barW} y1={barY} x2={barX + (ph / 14) * barW} y2={barY + barH}
          stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={1.5} />
        {PH_EXAMPLES.map((ex, i) => {
          const x = barX + (ex.ph / 14) * barW
          return (
            <g key={i} onClick={(e) => { e.stopPropagation(); setPh(ex.ph) }} style={{ cursor: 'pointer' }}>
              <circle cx={x} cy={barY + barH + 22} r={3} fill={isDark ? '#34d399' : '#059669'} />
              <text x={x} y={barY + barH + 34} textAnchor="middle" fontSize={6} fill={s.text}
                transform={'rotate(-35,' + x + ',' + (barY + barH + 34) + ')'}>{ex.label}</text>
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 10, color: s.text }}>
        <span>pH: <strong style={{ color: s.bright }}>{ph}</strong></span>
        <span>[H+]: <strong style={{ color: s.bright }}>{formatConc(concentration)}</strong></span>
        <span>Classification: <strong style={{ color: classification === 'Acidic' ? '#ef4444' : classification === 'Basic' ? '#a855f7' : '#14b8a6' }}>{classification}</strong></span>
      </div>
    </div>
  )
}

export const CanvasScienceWidgetRenderer = React.memo(function CanvasScienceWidgetRenderer({ element, isDark }: CanvasScienceWidgetProps) {
  // Phase 5: pH Scale has its own config-syncing canvas widget
  if (element.widgetKind === 'chem-ph-scale') {
    return <CanvasPhScale element={element} isDark={isDark} />
  }
  const PanelComponent = SCIENCE_PANEL_MAP[element.widgetKind]
  if (!PanelComponent) {
    return <div style={{ padding: 12, color: '#f87171', fontSize: 12 }}>Unknown science widget: {element.widgetKind}</div>
  }
  const bg = isDark ? '#0f172a' : '#ffffff'
  const text = isDark ? '#e2e8f0' : '#1e293b'
  return (
    <div style={{ width: '100%', height: '100%', background: bg, color: text, overflow: 'auto', borderRadius: 8, padding: 8, boxSizing: 'border-box' }}>
      <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5, fontSize: 11 }}>Loading...</div>}>
        <PanelComponent isDark={isDark} />
      </Suspense>
    </div>
  )
})

// ---- Default configs ----

export function getScienceWidgetDefaultConfig(kind: string): Record<string, unknown> {
  switch (kind) {
    case 'chem-ph-scale': return { ph: 7 } // Phase 5: pH now persists via config
    case 'earth-states-matter': return { temperature: 25, substance: 'water' }
    case 'bio-food-chain': return { organisms: ['🌿 Grass', '🐛 Grasshopper', '🐸 Frog', '🐍 Snake', '🦅 Eagle'] }
    case 'earth-animal-habitats': return { matches: {} }
    case 'bio-plant-life-cycle': return { activeStep: 0 }
    case 'earth-sink-float': return { selectedObj: '', selectedLiq: 'water', revealed: false }
    case 'earth-scientific-method': return { steps: ['', '', '', '', '', ''], activeStep: 0 }
    case 'earth-data-collection': return { headers: ['Trial', 'Height (cm)', 'Time (s)'], rows: [['1', '10', '1.4'], ['2', '20', '2.1'], ['3', '30', '2.6']], chartType: 'bar' }
    case 'phys-magnetism': return { magnets: [{ x: 120, polarity: 'N-S' }, { x: 280, polarity: 'N-S' }] }
    case 'chem-periodic-trends': return { trend: 'electronegativity', selectedElement: 'Na' }
    case 'chem-stoichiometry': return { equation: '2H2 + O2 → 2H2O', knownSubstance: 'H2', knownMoles: 2 }
    case 'bio-meiosis': return { step: 0 }
    case 'phys-wave-interference': return { freq: 3, separation: 120 }
    // Batch 2 new widgets
    case 'sci-simple-machines': return { selected: -1 }
    case 'sci-solar-system': return { selected: -1, speed: 1 }
    case 'sci-water-cycle': return { selected: '' }
    case 'sci-rock-cycle': return { selected: '' }
    case 'sci-observation-journal': return { entries: [], formData: { date: '', location: '', weather: '', observations: '' }, activeTab: 'form' }
    case 'sci-lab-report': return { activeTab: 0, report: {} }
    case 'sci-weather-patterns': return { selected: '' }
    case 'phys-rotational-motion': return { force: 10, armLength: 50, mass: 2, radius: 30, paused: false }
    case 'sci-dimensional-analysis': return { inputValue: '', inputUnit: 'km', targetUnit: 'm' }
    default: return {}
  }
}

// ---- Default sizes ----

export function getScienceWidgetDefaultSize(kind: string): { width: number; height: number } {
  switch (kind) {
    case 'earth-states-matter': return { width: 400, height: 450 }
    case 'bio-food-chain': return { width: 440, height: 500 }
    case 'earth-animal-habitats': return { width: 400, height: 500 }
    case 'bio-plant-life-cycle': return { width: 400, height: 450 }
    case 'earth-sink-float': return { width: 380, height: 420 }
    case 'earth-scientific-method': return { width: 400, height: 550 }
    case 'earth-data-collection': return { width: 440, height: 520 }
    case 'phys-magnetism': return { width: 440, height: 480 }
    case 'chem-periodic-trends': return { width: 500, height: 560 }
    case 'chem-stoichiometry': return { width: 440, height: 500 }
    case 'bio-meiosis': return { width: 440, height: 520 }
    case 'phys-wave-interference': return { width: 440, height: 480 }
    // Batch 2 new widgets
    case 'sci-simple-machines': return { width: 440, height: 520 }
    case 'sci-solar-system': return { width: 440, height: 580 }
    case 'sci-water-cycle': return { width: 440, height: 520 }
    case 'sci-rock-cycle': return { width: 440, height: 520 }
    case 'sci-observation-journal': return { width: 440, height: 540 }
    case 'sci-lab-report': return { width: 440, height: 540 }
    case 'sci-weather-patterns': return { width: 440, height: 520 }
    case 'phys-rotational-motion': return { width: 440, height: 540 }
    case 'sci-dimensional-analysis': return { width: 440, height: 560 }
    case 'chem-periodic-table': return { width: 580, height: 500 }
    case 'phys-wave-sim': return { width: 450, height: 400 }
    case 'phys-pendulum-sim': return { width: 400, height: 450 }
    case 'phys-projectile-sim': return { width: 450, height: 450 }
    case 'phys-circuit-diagram': return { width: 450, height: 450 }
    case 'phys-free-body-diagram': return { width: 400, height: 400 }
    case 'phys-ray-diagram': return { width: 450, height: 400 }
    case 'phys-energy-bar-charts': return { width: 420, height: 400 }
    case 'phys-interactive-graphing': return { width: 450, height: 450 }
    case 'chem-gas-laws': return { width: 450, height: 480 }
    case 'chem-titration': return { width: 450, height: 500 }
    case 'chem-vsepr': return { width: 400, height: 420 }
    case 'chem-lewis-dot': return { width: 400, height: 400 }
    case 'bio-food-web': return { width: 450, height: 450 }
    case 'bio-dna-structure': return { width: 400, height: 450 }
    case 'bio-cell-division': return { width: 420, height: 480 }
    case 'bio-human-body': return { width: 400, height: 500 }
    case 'earth-plate-tectonics': return { width: 480, height: 400 }
    case 'earth-topographic-map': return { width: 450, height: 420 }
    case 'earth-solar-system': return { width: 450, height: 400 }
    default: return { width: 380, height: 400 }
  }
}

// ---- Labels ----

export const SCIENCE_WIDGET_KIND_LABELS: Record<string, string> = {
  // Existing
  'phys-formula-calc': 'Physics Formula Calculator', 'phys-wave-sim': 'Wave Simulator', 'phys-pendulum-sim': 'Pendulum Simulator',
  'phys-unit-converter': 'Science Unit Converter', 'phys-projectile-sim': 'Projectile Motion Simulator', 'phys-ohms-law': "Ohm's Law Calculator",
  'phys-circuit-diagram': 'Circuit Diagram Builder', 'phys-free-body-diagram': 'Free Body Diagram Builder', 'phys-ray-diagram': 'Ray Diagram Optics',
  'phys-energy-bar-charts': 'Energy Bar Charts', 'phys-interactive-graphing': 'Interactive Graphing Tool',
  'chem-ph-scale': 'pH Scale Visualizer', 'chem-sci-notation': 'Scientific Notation Converter', 'chem-periodic-table': 'Periodic Table Explorer',
  'chem-equation-balancer': 'Chemical Equation Balancer', 'chem-molar-mass': 'Molar Mass Calculator', 'chem-lewis-dot': 'Lewis Dot Structure Builder',
  'chem-vsepr': 'Molecular Geometry (VSEPR)', 'chem-gas-laws': 'Gas Laws Simulator', 'chem-titration': 'Acid-Base Titration',
  'chem-ion-formation': 'Ion Formation Visualizer',
  'bio-punnett-square': 'Punnett Square Calculator', 'bio-cell-diagram': 'Cell Diagram Explorer', 'bio-taxonomy': 'Taxonomy Classifier',
  'bio-body-systems': 'Body Systems Explorer', 'bio-food-web': 'Ecology Food Web', 'bio-dna-structure': 'DNA Structure Viewer',
  'bio-natural-selection': 'Natural Selection Sim', 'bio-cell-division': 'Cell Division Animator', 'bio-photosynthesis-resp': 'Photosynthesis & Respiration',
  'bio-human-body': 'Human Body Interactive',
  'earth-rock-cycle': 'Rock Cycle Diagram', 'earth-plate-tectonics': 'Plate Tectonics Map', 'earth-weather-map': 'Weather Map Reader',
  'earth-water-carbon-cycle': 'Water & Carbon Cycle', 'earth-solar-system': 'Solar System Scale', 'earth-topographic-map': 'Topographic Map Tool',
  // Phase 3 new
  'earth-states-matter': 'States of Matter', 'bio-food-chain': 'Food Chain', 'earth-animal-habitats': 'Animal Habitats',
  'bio-plant-life-cycle': 'Plant Life Cycle', 'earth-sink-float': 'Sink or Float',
  'earth-scientific-method': 'Scientific Method', 'earth-data-collection': 'Data Collection',
  'phys-magnetism': 'Magnetism', 'chem-periodic-trends': 'Periodic Trends',
  'chem-stoichiometry': 'Stoichiometry', 'bio-meiosis': 'Meiosis', 'phys-wave-interference': 'Wave Interference',
  // Batch 2 new widgets
  'sci-simple-machines': 'Simple Machines Explorer', 'sci-solar-system': 'Solar System',
  'sci-water-cycle': 'Water Cycle', 'sci-rock-cycle': 'Rock Cycle',
  'sci-observation-journal': 'Observation Journal', 'sci-lab-report': 'Lab Report Template',
  'sci-weather-patterns': 'Weather Patterns', 'phys-rotational-motion': 'Rotational Motion',
  'sci-dimensional-analysis': 'Dimensional Analysis',
}
