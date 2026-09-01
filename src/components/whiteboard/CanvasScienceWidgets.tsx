'use client'

import React, { lazy, Suspense, useState, useCallback, useRef, useEffect } from 'react'
import type { WidgetElement } from '@/lib/whiteboard/types'
import { useWhiteboardStore } from '@/lib/whiteboard/store'

// ============================================================
// On-Canvas Science Widgets
// Phase 3: Interactive canvas widgets + legacy panel wrappers
// ============================================================

interface CanvasScienceWidgetProps {
  element: WidgetElement
  isDark: boolean
}

function useConfigUpdater(elementId: string) {
  const updateElement = useWhiteboardStore((s) => s.updateElement)
  const pendingRef = useRef<Record<string, unknown>>({})
  const rafRef = useRef<number>(0)
  const updateConfig = useCallback((patch: Record<string, unknown>) => {
    Object.assign(pendingRef.current, patch)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      updateElement(elementId, { config: { ...pendingRef.current } } as Partial<WidgetElement>)
      pendingRef.current = {}
    })
  }, [updateElement, elementId])
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])
  return updateConfig
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
              <input type="range" min={40} max={360} value={m.x} onChange={function(e) { updateMagnet(i, { x: Number(e.target.value) }) }} y={140} x={m.x - 30} width={60} style={{ cursor: 'pointer' }} />
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

export const CanvasScienceWidgetRenderer = React.memo(function CanvasScienceWidgetRenderer({ element, isDark }: CanvasScienceWidgetProps) {
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
}
