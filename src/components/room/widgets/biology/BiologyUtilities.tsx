'use client'

import React, { useState, useMemo, useRef } from 'react'

// ============================================================
// Shared style helper
// ============================================================

const styles = (isDark: boolean) => ({
  bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
  text: isDark ? '#94a3b8' : '#475569',
  bright: isDark ? '#e2e8f0' : '#1e293b',
  input: {
    padding: '3px 6px',
    borderRadius: 4,
    fontSize: 11,
    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    color: isDark ? '#e2e8f0' : '#1e293b',
    outline: 'none' as const,
  },
  btn: (active: boolean) => ({
    padding: '2px 6px',
    borderRadius: 3,
    fontSize: 10,
    cursor: 'pointer' as const,
    background: active ? 'rgba(5,150,105,0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
    border: active ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
    color: active ? '#34d399' : (isDark ? '#94a3b8' : '#475569'),
  }),
})

// ============================================================
// 1. PunnettSquareCalculator
// ============================================================

const ALLELE_LETTERS = ['A', 'B', 'T', 'G', 'R', 'Y']

export function PunnettSquareCalculator({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [geneLetter, setGeneLetter] = useState('B')
  const [p1a1, setP1a1] = useState(true) // true = uppercase (dominant)
  const [p1a2, setP1a2] = useState(false)
  const [p2a1, setP2a1] = useState(true)
  const [p2a2, setP2a2] = useState(false)
  const [dominantName, setDominantName] = useState('Brown eyes')
  const [recessiveName, setRecessiveName] = useState('Blue eyes')

  const dom = geneLetter
  const rec = geneLetter.toLowerCase()

  const p1 = [p1a1 ? dom : rec, p1a2 ? dom : rec]
  const p2 = [p2a1 ? dom : rec, p2a2 ? dom : rec]

  const grid = useMemo(() => [
    [p1[0] + p2[0], p1[0] + p2[1]],
    [p1[1] + p2[0], p1[1] + p2[1]],
  ], [p1[0], p1[1], p2[0], p2[1]])

  const normalize = (g: string) => {
    const a = g[0].toUpperCase() + g[1].toUpperCase()
    const b = g[0].toLowerCase() + g[1].toLowerCase()
    if (g === a) return g
    if (g === b) return g
    if (g[0] === g[0].toUpperCase()) return g[0] + g[1]
    return g[1] + g[0]
  }

  const normalized = grid.map(r => r.map(normalize))

  const counts: Record<string, number> = {}
  normalized.forEach(r => r.forEach(c => { counts[c] = (counts[c] || 0) + 1 }))

  const ratioEntries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const genotypeRatio = ratioEntries.map(([g, c]) => c + ' ' + g).join(' : ')

  let domCount = 0
  let recCount = 0
  normalized.forEach(r => r.forEach(c => {
    if (c[0] === c[0].toUpperCase() || c[1] === c[1].toUpperCase()) domCount++
    else recCount++
  }))

  const g = gcd(domCount, recCount)
  const phenotypeRatio = (domCount / g) + ' ' + dominantName + ' : ' + (recCount / g) + ' ' + recessiveName

  function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b)
  }

  const cellColor = (geno: string) => {
    const n = normalize(geno)
    if (n[0] === n[0].toUpperCase() && n[1] === n[1].toUpperCase()) return isDark ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.2)'
    if (n[0] === n[0].toLowerCase() && n[1] === n[1].toLowerCase()) return isDark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.2)'
    return isDark ? 'rgba(234,179,8,0.25)' : 'rgba(234,179,8,0.2)'
  }

  const cellBorder = (geno: string) => {
    const n = normalize(geno)
    if (n[0] === n[0].toUpperCase() && n[1] === n[1].toUpperCase()) return 'rgba(34,197,94,0.5)'
    if (n[0] === n[0].toLowerCase() && n[1] === n[1].toLowerCase()) return 'rgba(239,68,68,0.5)'
    return 'rgba(234,179,8,0.5)'
  }

  const dd = (val: boolean, setter: (v: boolean) => void) => (
    <select value={val ? '1' : '0'} onChange={e => setter(e.target.value === '1')} style={s.input}>
      <option value="1">{dom} (dominant)</option>
      <option value="0">{rec} (recessive)</option>
    </select>
  )

  return (
    <div style={{ fontSize: 11, color: s.text }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, color: s.bright, fontSize: 10 }}>Gene:</span>
        <select value={geneLetter} onChange={e => setGeneLetter(e.target.value)} style={s.input}>
          {ALLELE_LETTERS.map(l => <option key={l} value={l}>{l}/{l.toLowerCase()}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 100px' }}>
          <div style={{ fontWeight: 600, fontSize: 10, color: s.bright, marginBottom: 3 }}>Parent 1</div>
          <div style={{ display: 'flex', gap: 3 }}>{dd(p1a1, setP1a1)}{dd(p1a2, setP1a2)}</div>
        </div>
        <div style={{ flex: '1 1 100px' }}>
          <div style={{ fontWeight: 600, fontSize: 10, color: s.bright, marginBottom: 3 }}>Parent 2</div>
          <div style={{ display: 'flex', gap: 3 }}>{dd(p2a1, setP2a1)}{dd(p2a2, setP2a2)}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: 9, color: s.text }}>Dominant trait: </span>
          <input value={dominantName} onChange={e => setDominantName(e.target.value)} style={s.input} />
        </div>
        <div>
          <span style={{ fontSize: 9, color: s.text }}>Recessive trait: </span>
          <input value={recessiveName} onChange={e => setRecessiveName(e.target.value)} style={s.input} />
        </div>
      </div>

      {/* Punnett Square */}
      <div style={{ display: 'inline-block', borderCollapse: 'collapse' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr>
              <td style={{ padding: '4px 8px', borderBottom: '1px solid ' + s.border, borderRight: '1px solid ' + s.border }}></td>
              <td colSpan={1} style={{ padding: '4px 12px', borderBottom: '1px solid ' + s.border, textAlign: 'center', fontWeight: 700, color: s.bright, fontSize: 13 }}>{p2[0]}</td>
              <td colSpan={1} style={{ padding: '4px 12px', borderBottom: '1px solid ' + s.border, textAlign: 'center', fontWeight: 700, color: s.bright, fontSize: 13 }}>{p2[1]}</td>
            </tr>
          </thead>
          <tbody>
            {[0, 1].map(r => (
              <tr key={r}>
                <td style={{ padding: '4px 8px', borderRight: '1px solid ' + s.border, fontWeight: 700, color: s.bright, fontSize: 13, textAlign: 'center' }}>{p1[r]}</td>
                {[0, 1].map(c => {
                  const geno = normalized[r][c]
                  return (
                    <td key={c} style={{
                      padding: '6px 14px', textAlign: 'center', fontWeight: 700, fontSize: 14,
                      background: cellColor(geno),
                      border: '1px solid ' + cellBorder(geno),
                      color: s.bright,
                    }}>{geno}</td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 8, padding: '6px 8px', background: s.bg, borderRadius: 4, border: '1px solid ' + s.border }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: s.bright, marginBottom: 3 }}>Genotype Ratio</div>
        <div style={{ fontSize: 11, color: s.text, marginBottom: 4 }}>{genotypeRatio}</div>
        <div style={{ fontSize: 10, fontWeight: 600, color: s.bright, marginBottom: 3 }}>Phenotype Ratio</div>
        <div style={{ fontSize: 11, color: s.text }}>{phenotypeRatio}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 9 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: isDark ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.3)', display: 'inline-block' }}></span> Homozygous Dominant</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: isDark ? 'rgba(234,179,8,0.4)' : 'rgba(234,179,8,0.3)', display: 'inline-block' }}></span> Heterozygous</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: isDark ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.3)', display: 'inline-block' }}></span> Homozygous Recessive</span>
      </div>
    </div>
  )
}

// ============================================================
// 2. CellDiagramExplorer
// ============================================================

type CellType = 'plant' | 'animal'

const ORGANELLE_DATA: Record<string, { desc: string; color: string }> = {
  nucleus: { desc: 'The control center of the cell. Contains DNA (genetic material) and coordinates cell activities like growth, metabolism, and reproduction.', color: '#8b5cf6' },
  'cell membrane': { desc: 'A thin, flexible barrier that surrounds the cell. It controls what enters and leaves the cell, providing protection and support.', color: '#f59e0b' },
  cytoplasm: { desc: 'A jelly-like fluid inside the cell that fills the space between organelles. It is where many chemical reactions take place.', color: '#06b6d4' },
  mitochondria: { desc: 'The "powerhouse of the cell." Converts glucose and oxygen into ATP (energy) through cellular respiration.', color: '#ef4444' },
  er: { desc: 'A network of membranes involved in protein and lipid synthesis. Rough ER has ribosomes; smooth ER makes lipids and detoxifies chemicals.', color: '#ec4899' },
  ribosomes: { desc: 'Tiny structures that make proteins. They read mRNA instructions and assemble amino acids into protein chains.', color: '#14b8a6' },
  golgi: { desc: 'The "shipping center" of the cell. Modifies, packages, and sorts proteins and lipids for delivery to their destinations.', color: '#f97316' },
  vacuole: { desc: 'A storage organelle that holds water, nutrients, and waste. Plant cells have one large vacuole; animal cells have several small ones.', color: '#3b82f6' },
  'cell wall': { desc: 'A rigid outer layer found only in plant cells. Made of cellulose, it provides structural support and protection.', color: '#84cc16' },
  chloroplasts: { desc: 'Found only in plant cells. Site of photosynthesis — they capture sunlight and convert it into glucose (food) and oxygen.', color: '#22c55e' },
}

const PLANT_ORGANELLES = ['cell wall', 'cell membrane', 'cytoplasm', 'nucleus', 'mitochondria', 'er', 'ribosomes', 'golgi', 'vacuole', 'chloroplasts']
const ANIMAL_ORGANELLES = ['cell membrane', 'cytoplasm', 'nucleus', 'mitochondria', 'er', 'ribosomes', 'golgi', 'vacuole']

export function CellDiagramExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [cellType, setCellType] = useState<CellType>('animal')
  const [selected, setSelected] = useState<string | null>(null)

  const organelleList = cellType === 'plant' ? PLANT_ORGANELLES : ANIMAL_ORGANELLES
  const isHighlight = (name: string) => selected === name
  const highlightStroke = isDark ? '#34d399' : '#059669'
  const normalStroke = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)'
  const strokeWidth = 1.5

  const fillBase = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
  const cellFill = isDark ? 'rgba(56,189,248,0.06)' : 'rgba(56,189,248,0.08)'

  return (
    <div style={{ fontSize: 11, color: s.text }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <button onClick={() => { setCellType('animal'); setSelected(null) }} style={s.btn(cellType === 'animal')}>Animal Cell</button>
        <button onClick={() => { setCellType('plant'); setSelected(null) }} style={s.btn(cellType === 'plant')}>Plant Cell</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: '0 0 220px' }}>
          <svg viewBox="0 0 400 300" width="220" height="165">
            {cellType === 'plant' ? (
              // Plant cell
              <>
                {/* Cell wall */}
                <rect x="20" y="15" width="360" height="270" rx="8" ry="8"
                  fill={isHighlight('cell wall') ? 'rgba(132,204,22,0.2)' : fillBase}
                  stroke={isHighlight('cell wall') ? highlightStroke : normalStroke}
                  strokeWidth={isHighlight('cell wall') ? 3 : strokeWidth} />
                {/* Cell membrane */}
                <rect x="30" y="25" width="340" height="250" rx="6" ry="6"
                  fill={cellFill}
                  stroke={isHighlight('cell membrane') ? highlightStroke : normalStroke}
                  strokeWidth={isHighlight('cell membrane') ? 2.5 : strokeWidth} />
                {/* Cytoplasm is the cell fill - shown via membrane rect */}
                {/* Large vacuole */}
                <ellipse cx="200" cy="150" rx="110" ry="85"
                  fill={isHighlight('vacuole') ? 'rgba(59,130,246,0.2)' : isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.1)'}
                  stroke={isHighlight('vacuole') ? highlightStroke : normalStroke}
                  strokeWidth={isHighlight('vacuole') ? 2.5 : strokeWidth} />
                <text x="200" y="154" textAnchor="middle" fontSize="10" fill={s.text}>Vacuole</text>
                {/* Nucleus */}
                <ellipse cx="100" cy="120" rx="38" ry="32"
                  fill={isHighlight('nucleus') ? 'rgba(139,92,246,0.25)' : isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.15)'}
                  stroke={isHighlight('nucleus') ? highlightStroke : normalStroke}
                  strokeWidth={isHighlight('nucleus') ? 2.5 : strokeWidth} />
                <circle cx="100" cy="115" r="10"
                  fill={isDark ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.25)'}
                  stroke={normalStroke} strokeWidth={0.5} />
                <text x="100" y="132" textAnchor="middle" fontSize="9" fill={s.bright}>Nucleus</text>
                {/* Chloroplasts */}
                {[[300, 80, 28, 14], [310, 200, 26, 13], [280, 250, 24, 12], [140, 240, 25, 13], [330, 140, 22, 11]].map(([cx, cy, rx, ry], i) => (
                  <ellipse key={'chl' + i} cx={cx} cy={cy} rx={rx} ry={ry}
                    fill={isHighlight('chloroplasts') ? 'rgba(34,197,94,0.35)' : isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.2)'}
                    stroke={isHighlight('chloroplasts') ? highlightStroke : normalStroke}
                    strokeWidth={isHighlight('chloroplasts') ? 2.5 : 0.8} />
                ))}
                {isHighlight('chloroplasts') && <text x="310" y="67" textAnchor="middle" fontSize="8" fill={highlightStroke}>Chloroplasts</text>}
                {/* Mitochondria */}
                {[[250, 80], [80, 220], [320, 240]].map(([cx, cy], i) => (
                  <ellipse key={'mito' + i} cx={cx} cy={cy} rx="16" ry="8"
                    fill={isHighlight('mitochondria') ? 'rgba(239,68,68,0.3)' : isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.15)'}
                    stroke={isHighlight('mitochondria') ? highlightStroke : normalStroke}
                    strokeWidth={isHighlight('mitochondria') ? 2.5 : 0.8} />
                ))}
                {isHighlight('mitochondria') && <text x="250" y="66" textAnchor="middle" fontSize="8" fill={highlightStroke}>Mitochondria</text>}
                {/* ER */}
                <path d="M 130 95 Q 150 85 160 95 Q 170 105 185 95 Q 195 85 205 95"
                  fill="none" stroke={isHighlight('er') ? highlightStroke : isDark ? 'rgba(236,72,153,0.4)' : 'rgba(236,72,153,0.5)'}
                  strokeWidth={isHighlight('er') ? 2.5 : 1.2} />
                <path d="M 130 105 Q 150 95 160 105 Q 170 115 185 105 Q 195 95 205 105"
                  fill="none" stroke={isHighlight('er') ? highlightStroke : isDark ? 'rgba(236,72,153,0.4)' : 'rgba(236,72,153,0.5)'}
                  strokeWidth={isHighlight('er') ? 2.5 : 1.2} />
                {isHighlight('er') && <text x="165" y="82" textAnchor="middle" fontSize="8" fill={highlightStroke}>ER</text>}
                {/* Ribosomes (dots on ER and scattered) */}
                {[[145, 98], [170, 100], [195, 98], [145, 108], [170, 110], [195, 108], [260, 160], [120, 180], [340, 100]].map(([cx, cy], i) => (
                  <circle key={'ribo' + i} cx={cx} cy={cy} r="2"
                    fill={isHighlight('ribosomes') ? highlightStroke : isDark ? 'rgba(20,184,166,0.5)' : 'rgba(20,184,166,0.6)'} />
                ))}
                {isHighlight('ribosomes') && <text x="260" y="154" textAnchor="middle" fontSize="8" fill={highlightStroke}>Ribosomes</text>}
                {/* Golgi */}
                <path d="M 300 160 Q 320 150 340 160" fill="none" stroke={isHighlight('golgi') ? highlightStroke : isDark ? 'rgba(249,115,22,0.4)' : 'rgba(249,115,22,0.5)'} strokeWidth={isHighlight('golgi') ? 2.5 : 1.2} />
                <path d="M 300 168 Q 320 158 340 168" fill="none" stroke={isHighlight('golgi') ? highlightStroke : isDark ? 'rgba(249,115,22,0.4)' : 'rgba(249,115,22,0.5)'} strokeWidth={isHighlight('golgi') ? 2.5 : 1.2} />
                <path d="M 300 176 Q 320 166 340 176" fill="none" stroke={isHighlight('golgi') ? highlightStroke : isDark ? 'rgba(249,115,22,0.4)' : 'rgba(249,115,22,0.5)'} strokeWidth={isHighlight('golgi') ? 2.5 : 1.2} />
                {isHighlight('golgi') && <text x="320" y="148" textAnchor="middle" fontSize="8" fill={highlightStroke}>Golgi Body</text>}
              </>
            ) : (
              // Animal cell
              <>
                {/* Cell membrane (outer boundary) */}
                <ellipse cx="200" cy="150" rx="180" ry="130"
                  fill={cellFill}
                  stroke={isHighlight('cell membrane') ? highlightStroke : normalStroke}
                  strokeWidth={isHighlight('cell membrane') ? 2.5 : strokeWidth} />
                {/* Nucleus */}
                <ellipse cx="190" cy="140" rx="42" ry="36"
                  fill={isHighlight('nucleus') ? 'rgba(139,92,246,0.25)' : isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.15)'}
                  stroke={isHighlight('nucleus') ? highlightStroke : normalStroke}
                  strokeWidth={isHighlight('nucleus') ? 2.5 : strokeWidth} />
                <circle cx="190" cy="134" r="11"
                  fill={isDark ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.25)'}
                  stroke={normalStroke} strokeWidth={0.5} />
                <text x="190" y="153" textAnchor="middle" fontSize="9" fill={s.bright}>Nucleus</text>
                {/* Mitochondria */}
                {[[100, 80], [300, 90], [120, 230], [290, 210]].map(([cx, cy], i) => (
                  <ellipse key={'mito' + i} cx={cx} cy={cy} rx="18" ry="9"
                    transform={'rotate(' + (i * 30) + ' ' + cx + ' ' + cy + ')'}
                    fill={isHighlight('mitochondria') ? 'rgba(239,68,68,0.3)' : isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.15)'}
                    stroke={isHighlight('mitochondria') ? highlightStroke : normalStroke}
                    strokeWidth={isHighlight('mitochondria') ? 2.5 : 0.8} />
                ))}
                {isHighlight('mitochondria') && <text x="100" y="64" textAnchor="middle" fontSize="8" fill={highlightStroke}>Mitochondria</text>}
                {/* ER */}
                <path d="M 240 120 Q 260 108 275 120 Q 290 132 310 120 Q 325 108 340 120"
                  fill="none" stroke={isHighlight('er') ? highlightStroke : isDark ? 'rgba(236,72,153,0.4)' : 'rgba(236,72,153,0.5)'}
                  strokeWidth={isHighlight('er') ? 2.5 : 1.2} />
                <path d="M 240 130 Q 260 118 275 130 Q 290 142 310 130 Q 325 118 340 130"
                  fill="none" stroke={isHighlight('er') ? highlightStroke : isDark ? 'rgba(236,72,153,0.4)' : 'rgba(236,72,153,0.5)'}
                  strokeWidth={isHighlight('er') ? 2.5 : 1.2} />
                {isHighlight('er') && <text x="290" y="105" textAnchor="middle" fontSize="8" fill={highlightStroke}>ER</text>}
                {/* Ribosomes */}
                {[[255, 123], [280, 125], [305, 123], [255, 133], [280, 135], [305, 133], [80, 150], [320, 180], [150, 240]].map(([cx, cy], i) => (
                  <circle key={'ribo' + i} cx={cx} cy={cy} r="2"
                    fill={isHighlight('ribosomes') ? highlightStroke : isDark ? 'rgba(20,184,166,0.5)' : 'rgba(20,184,166,0.6)'} />
                ))}
                {isHighlight('ribosomes') && <text x="80" y="142" textAnchor="middle" fontSize="8" fill={highlightStroke}>Ribosomes</text>}
                {/* Golgi */}
                <path d="M 80 170 Q 100 158 120 170" fill="none" stroke={isHighlight('golgi') ? highlightStroke : isDark ? 'rgba(249,115,22,0.4)' : 'rgba(249,115,22,0.5)'} strokeWidth={isHighlight('golgi') ? 2.5 : 1.2} />
                <path d="M 80 179 Q 100 167 120 179" fill="none" stroke={isHighlight('golgi') ? highlightStroke : isDark ? 'rgba(249,115,22,0.4)' : 'rgba(249,115,22,0.5)'} strokeWidth={isHighlight('golgi') ? 2.5 : 1.2} />
                <path d="M 80 188 Q 100 176 120 188" fill="none" stroke={isHighlight('golgi') ? highlightStroke : isDark ? 'rgba(249,115,22,0.4)' : 'rgba(249,115,22,0.5)'} strokeWidth={isHighlight('golgi') ? 2.5 : 1.2} />
                {isHighlight('golgi') && <text x="100" y="153" textAnchor="middle" fontSize="8" fill={highlightStroke}>Golgi</text>}
                {/* Small vacuoles */}
                {[[300, 190, 20, 14], [130, 200, 16, 11]].map(([cx, cy, rx, ry], i) => (
                  <ellipse key={'vac' + i} cx={cx} cy={cy} rx={rx} ry={ry}
                    fill={isHighlight('vacuole') ? 'rgba(59,130,246,0.25)' : isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.1)'}
                    stroke={isHighlight('vacuole') ? highlightStroke : normalStroke}
                    strokeWidth={isHighlight('vacuole') ? 2.5 : 0.8} />
                ))}
                {isHighlight('vacuole') && <text x="300" y="174" textAnchor="middle" fontSize="8" fill={highlightStroke}>Vacuoles</text>}
              </>
            )}
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 10, color: s.bright, marginBottom: 4 }}>Organelles</div>
          <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {organelleList.map(name => (
              <div key={name} onClick={() => setSelected(selected === name ? null : name)}
                style={{ padding: '3px 6px', borderRadius: 3, cursor: 'pointer', fontSize: 10, background: selected === name ? 'rgba(5,150,105,0.12)' : 'transparent', border: '1px solid ' + (selected === name ? 'rgba(5,150,105,0.25)' : 'transparent'), color: selected === name ? '#34d399' : s.text, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: ORGANELLE_DATA[name].color, flexShrink: 0, display: 'inline-block' }}></span>
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </div>
            ))}
          </div>
          {selected && ORGANELLE_DATA[selected] && (
            <div style={{ marginTop: 6, padding: '6px 8px', background: s.bg, borderRadius: 4, border: '1px solid ' + s.border, fontSize: 10, lineHeight: 1.4 }}>
              <div style={{ fontWeight: 600, color: s.bright, marginBottom: 2 }}>{selected.charAt(0).toUpperCase() + selected.slice(1)}</div>
              <div>{ORGANELLE_DATA[selected].desc}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 3. TaxonomyClassifier
// ============================================================

const TAXONOMY_LEVELS = ['Domain', 'Kingdom', 'Phylum', 'Class', 'Order', 'Family', 'Genus', 'Species']

const EXAMPLE_ORGANISMS: Record<string, { label: string; levels: string[] }> = {
  human: { label: 'Human', levels: ['Eukarya', 'Animalia', 'Chordata', 'Mammalia', 'Primates', 'Hominidae', 'Homo', 'sapiens'] },
  dog: { label: 'Dog', levels: ['Eukarya', 'Animalia', 'Chordata', 'Mammalia', 'Carnivora', 'Canidae', 'Canis', 'familiaris'] },
  rose: { label: 'Rose', levels: ['Eukarya', 'Plantae', 'Magnoliophyta', 'Magnoliopsida', 'Rosales', 'Rosaceae', 'Rosa', 'rubiginosa'] },
  mushroom: { label: 'Mushroom', levels: ['Eukarya', 'Fungi', 'Basidiomycota', 'Agaricomycetes', 'Agaricales', 'Agaricaceae', 'Agaricus', 'bisporus'] },
}

export function TaxonomyClassifier({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [selectedExample, setSelectedExample] = useState<string | null>('human')
  const [customLevels, setCustomLevels] = useState<string[]>(EXAMPLE_ORGANISMS.human.levels)

  const handleSelectExample = (key: string) => {
    setSelectedExample(key)
    setCustomLevels([...EXAMPLE_ORGANISMS[key].levels])
  }

  const handleLevelChange = (idx: number, val: string) => {
    setSelectedExample(null)
    const next = [...customLevels]
    next[idx] = val
    setCustomLevels(next)
  }

  const binomial = customLevels[6] + ' ' + customLevels[7]

  return (
    <div style={{ fontSize: 11, color: s.text }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 8, flexWrap: 'wrap' }}>
        {Object.entries(EXAMPLE_ORGANISMS).map(([key, org]) => (
          <button key={key} onClick={() => handleSelectExample(key)} style={s.btn(selectedExample === key)}>{org.label}</button>
        ))}
        <button onClick={() => { setSelectedExample(null); setCustomLevels(['', '', '', '', '', '', '', '']) }} style={s.btn(selectedExample === null)}>Custom</button>
      </div>

      {/* Breadcrumb / Tree visualization */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0, marginBottom: 8 }}>
        {TAXONOMY_LEVELS.map((level, i) => (
          <React.Fragment key={level}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
              <div style={{
                padding: '3px 6px', borderRadius: 3, fontSize: 9, fontWeight: 600,
                background: (i === 6 || i === 7) ? 'rgba(5,150,105,0.12)' : s.bg,
                border: '1px solid ' + ((i === 6 || i === 7) ? 'rgba(5,150,105,0.25)' : s.border),
                color: (i === 6 || i === 7) ? '#34d399' : s.text,
                whiteSpace: 'nowrap',
              }}>{level}</div>
              {i < 7 && <div style={{ width: 1, height: 8, background: s.border, marginTop: 1 }}></div>}
            </div>
            {i < 7 && (
              <div style={{
                width: 12, height: 1, marginTop: -14,
                background: s.border,
              }}></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Input fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px', marginBottom: 8 }}>
        {TAXONOMY_LEVELS.map((level, i) => (
          <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: (i === 6 || i === 7) ? '#34d399' : s.text, minWidth: 52, textAlign: 'right' }}>{level}</span>
            <input value={customLevels[i]} onChange={e => handleLevelChange(i, e.target.value)} style={{ ...s.input, flex: 1, minWidth: 0 }} />
          </div>
        ))}
      </div>

      {/* Binomial nomenclature */}
      <div style={{ padding: '6px 8px', background: 'rgba(5,150,105,0.08)', borderRadius: 4, border: '1px solid rgba(5,150,105,0.2)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: s.bright }}>Binomial Nomenclature:</span>
        <span style={{ fontWeight: 700, color: '#34d399', fontSize: 13 }}>
          <span style={{ fontStyle: 'italic' }}>{customLevels[6]}</span>{' '}<span style={{ fontStyle: 'italic' }}>{customLevels[7]}</span>
        </span>
      </div>
    </div>
  )
}

// ============================================================
// 4. BodySystemsExplorer
// ============================================================

interface BodySystem {
  id: string
  name: string
  organs: string[]
  function: string
  funFact: string
  icon: 'heart' | 'lungs' | 'stomach' | 'brain' | 'bone' | 'muscle' | 'shield' | 'gland'
}

const BODY_SYSTEMS: BodySystem[] = [
  {
    id: 'circulatory', name: 'Circulatory', organs: ['Heart', 'Blood vessels', 'Blood'],
    function: 'The circulatory system transports oxygen, nutrients, and hormones throughout the body. It also removes carbon dioxide and other waste products from cells.',
    funFact: 'If you laid out all your blood vessels end to end, they would stretch over 60,000 miles — enough to circle the Earth more than twice!',
    icon: 'heart',
  },
  {
    id: 'respiratory', name: 'Respiratory', organs: ['Lungs', 'Trachea', 'Diaphragm'],
    function: 'The respiratory system brings oxygen into the body and removes carbon dioxide. Gas exchange happens in tiny air sacs called alveoli in the lungs.',
    funFact: 'Your lungs process about 2,400 gallons of air every day. The surface area of your lungs is roughly the same as a tennis court!',
    icon: 'lungs',
  },
  {
    id: 'digestive', name: 'Digestive', organs: ['Stomach', 'Small intestine', 'Large intestine', 'Liver'],
    function: 'The digestive system breaks down food into nutrients the body can absorb. It includes both mechanical digestion (chewing) and chemical digestion (enzymes).',
    funFact: 'Your small intestine is about 20 feet long! Food typically takes 24 to 72 hours to travel through your entire digestive system.',
    icon: 'stomach',
  },
  {
    id: 'nervous', name: 'Nervous', organs: ['Brain', 'Spinal cord', 'Nerves'],
    function: 'The nervous system controls and coordinates body activities. It detects changes in the environment, processes information, and sends signals to respond.',
    funFact: 'Your brain uses about 20% of your body\'s total energy, even though it only makes up about 2% of your body weight!',
    icon: 'brain',
  },
  {
    id: 'skeletal', name: 'Skeletal', organs: ['Bones', 'Joints', 'Skull', 'Spine'],
    function: 'The skeletal system provides structure and support for the body. It protects internal organs, enables movement, and stores minerals like calcium.',
    funFact: 'Babies are born with about 270 bones, but many fuse together as they grow. Adults have only 206 bones!',
    icon: 'bone',
  },
  {
    id: 'muscular', name: 'Muscular', organs: ['Skeletal muscles', 'Smooth muscles', 'Cardiac muscle'],
    function: 'The muscular system enables body movement and helps maintain posture. Muscles also produce heat and protect internal organs.',
    funFact: 'You have over 600 muscles in your body. The strongest muscle (by weight) is the masseter — the jaw muscle used for chewing!',
    icon: 'muscle',
  },
  {
    id: 'immune', name: 'Immune', organs: ['Lymph nodes', 'Spleen', 'White blood cells', 'Thymus'],
    function: 'The immune system defends the body against pathogens like bacteria, viruses, and parasites. It uses white blood cells and antibodies to identify and destroy invaders.',
    funFact: 'Your immune system has a “memory” — once it fights off an illness, it remembers how to defeat it if it returns!',
    icon: 'shield',
  },
  {
    id: 'endocrine', name: 'Endocrine', organs: ['Pituitary gland', 'Thyroid', 'Adrenal glands', 'Pancreas'],
    function: 'The endocrine system uses hormones to regulate growth, metabolism, mood, and reproduction. Glands release hormones directly into the bloodstream.',
    funFact: 'The pituitary gland is only the size of a pea, but it is called the “master gland” because it controls many other glands in the body!',
    icon: 'gland',
  },
]

function SystemIcon({ icon, isDark, color }: { icon: string; isDark: boolean; color: string }) {
  const stroke = color
  const fill = isDark ? 'transparent' : 'transparent'
  const sw = 1.5

  switch (icon) {
    case 'heart':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw}>
          <path d="M12 21 C12 21 3 14 3 8.5 C3 5.4 5.4 3 8.5 3 C10.2 3 11.8 3.8 12 5 C12.2 3.8 13.8 3 15.5 3 C18.6 3 21 5.4 21 8.5 C21 14 12 21 12 21Z" />
        </svg>
      )
    case 'lungs':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw}>
          <path d="M12 3 L12 21" />
          <path d="M12 5 C8 5 4 8 4 12 C4 16 7 19 10 19 C11 19 12 18 12 17" />
          <path d="M12 5 C16 5 20 8 20 12 C20 16 17 19 14 19 C13 19 12 18 12 17" />
          <path d="M9 2 L15 2" />
        </svg>
      )
    case 'stomach':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw}>
          <path d="M6 6 C6 4 8 2 12 2 C16 2 20 4 20 10 C20 16 16 22 10 22 C8 22 6 20 6 18 C6 16 7 15 8 14 C6 13 6 10 6 6Z" />
        </svg>
      )
    case 'brain':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw}>
          <path d="M12 22 C6 22 2 18 2 13 C2 10 3 8 5 7 C5 4 8 2 11 2 C13 2 14 3 15 4 C16 3 18 2 20 4 C22 6 22 9 20 11 C21 13 21 15 20 17 C22 18 22 21 19 22 Z" />
          <path d="M12 5 L12 22" />
          <path d="M6 12 C9 12 12 11 12 11" />
          <path d="M18 12 C15 12 12 11 12 11" />
        </svg>
      )
    case 'bone':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw}>
          <path d="M7 3 C5 3 3 4.5 3 6.5 C3 8 4 9 5 9.5 L8 12 L5 14.5 C4 15 3 16 3 17.5 C3 19.5 5 21 7 21 C8.5 21 10 20 10 18.5 L12 15 L14 18.5 C14 20 15.5 21 17 21 C19 21 21 19.5 21 17.5 C21 16 20 15 19 14.5 L16 12 L19 9.5 C20 9 21 8 21 6.5 C21 4.5 19 3 17 3 C15.5 3 14 4 14 5.5 L12 9 L10 5.5 C10 4 8.5 3 7 3Z" />
        </svg>
      )
    case 'muscle':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw}>
          <path d="M8 4 C6 4 4 6 4 10 L4 14 C4 18 6 20 8 20 L16 20 C18 20 20 18 20 14 L20 10 C20 6 18 4 16 4 Z" />
          <path d="M8 4 L10 10 L14 10 L16 4" />
          <path d="M10 10 L8 20" />
          <path d="M14 10 L16 20" />
        </svg>
      )
    case 'shield':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw}>
          <path d="M12 2 L3 6 L3 12 C3 17 7 21 12 22 C17 21 21 17 21 12 L21 6 Z" />
              <path d="M9 12 L11 14 L15 10" />
        </svg>
      )
    case 'gland':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw}>
          <circle cx="12" cy="12" r="4" />
          <circle cx="5" cy="7" r="3" />
          <circle cx="19" cy="7" r="3" />
          <circle cx="5" cy="17" r="3" />
          <circle cx="19" cy="17" r="3" />
          <line x1="9" y1="10" x2="7" y2="9" />
          <line x1="15" y1="10" x2="17" y2="9" />
          <line x1="9" y1="14" x2="7" y2="15" />
          <line x1="15" y1="14" x2="17" y2="15" />
        </svg>
      )
    default:
      return null
  }
}

const SYSTEM_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#f5f5f4', '#f97316', '#14b8a6', '#ec4899']

function SystemDiagram({ systemId, isDark }: { systemId: string; isDark: boolean }) {
  const c = isDark ? 'rgba(148,163,184,' : 'rgba(71,85,105,'
  const sw = 1.2
  const diagrams: Record<string, React.ReactNode> = {
    circulatory: (
      <svg viewBox='0 0 200 120' style={{ width: '100%', borderRadius: 4, background: isDark ? 'rgba(239,68,68,0.03)' : 'rgba(239,68,68,0.02)' }}>
        <path d='M100 15 L100 105' stroke={c + '0.3)'} strokeWidth={sw} strokeDasharray='4 3' />
        <ellipse cx={100} cy={60} rx={40} ry={35} fill='none' stroke={c + '0.4)'} strokeWidth={sw} />
        <path d='M100 25 L65 40' stroke='#ef4444' strokeWidth={2} markerEnd='url(#arrBS)' />
        <path d='M100 95 L140 75' stroke='#3b82f6' strokeWidth={2} markerEnd='url(#arrBS)' />
        <circle cx={100} cy={20} r={8} fill='rgba(239,68,68,0.15)' stroke='#ef4444' strokeWidth={1.5} />
        <text x={100} y={23} textAnchor='middle' fontSize={6} fill='#ef4444' fontWeight={600}>Heart</text>
        <text x={50} y={38} fontSize={7} fill={c + '0.7)'}>O₂-rich</text>
        <text x={145} y={72} fontSize={7} fill={c + '0.7)'}>O₂-poor</text>
        <text x={130} y={65} fontSize={7} fill={c + '0.7)'}>Lungs</text>
        <text x={55} y={95} fontSize={7} fill={c + '0.7)'}>Body</text>
        <defs><marker id='arrBS' markerWidth='5' markerHeight='4' refX='4' refY='2' orient='auto'><polygon points='0 0, 5 2, 0 4' fill={c + '0.5)'} /></marker></defs>
      </svg>
    ),
    respiratory: (
      <svg viewBox='0 0 200 120' style={{ width: '100%', borderRadius: 4, background: isDark ? 'rgba(59,130,246,0.03)' : 'rgba(59,130,246,0.02)' }}>
        <path d='M60 15 C60 15 40 30 40 55 C40 80 55 95 60 100' fill='none' stroke={c + '0.4)'} strokeWidth={1.5} />
        <path d='M140 15 C140 15 160 30 160 55 C160 80 145 95 140 100' fill='none' stroke={c + '0.4)'} strokeWidth={1.5} />
        <path d='M60 100 C60 100 80 85 100 85 C120 85 140 100 140 100' fill='none' stroke={c + '0.3)'} strokeWidth={sw} />
        <path d='M100 15 L100 85' stroke={c + '0.2)'} strokeWidth={sw} strokeDasharray='3 2' />
        <text x={100} y={110} textAnchor='middle' fontSize={7} fill={c + '0.6)'}>Trachea → Bronchi → Bronchioles → Alveoli</text>
        <text x={30} y={60} fontSize={7} fill={c + '0.7)'}>O₂ in</text>
        <text x={150} y={60} fontSize={7} fill={c + '0.7)'}>CO₂ out</text>
      </svg>
    ),
    digestive: (
      <svg viewBox='0 0 200 120' style={{ width: '100%', borderRadius: 4, background: isDark ? 'rgba(245,158,11,0.03)' : 'rgba(245,158,11,0.02)' }}>
        <ellipse cx={45} cy={40} rx={20} ry={25} fill='none' stroke={c + '0.4)'} strokeWidth={1.5} />
        <text x={45} y={43} textAnchor='middle' fontSize={7} fill={c + '0.7)'}>Mouth</text>
        <rect x={80} y={30} width={12} height={30} rx={4} fill='none' stroke={c + '0.4)'} strokeWidth={1.5} />
        <text x={86} y={48} textAnchor='middle' fontSize={6} fill={c + '0.6)'}>Eso.</text>
        <ellipse cx={125} cy={45} rx={18} ry={20} fill='none' stroke={c + '0.4)'} strokeWidth={1.5} />
        <text x={125} y={48} textAnchor='middle' fontSize={7} fill={c + '0.7)'}>Stomach</text>
        <path d='M143 50 C155 50 165 55 170 60 L170 80 C170 90 160 95 150 95' fill='none' stroke={c + '0.3)'} strokeWidth={1.5} />
        <text x={165} y={75} fontSize={6} fill={c + '0.6)'}>S.I.</text>
        <rect x={100} y={90} width={60} height={15} rx={4} fill='none' stroke={c + '0.4)'} strokeWidth={1.5} />
        <text x={130} y={101} textAnchor='middle' fontSize={7} fill={c + '0.7)'}>L. Intestine</text>
        <path d='M57 55 L68 45' stroke={c + '0.3)'} strokeWidth={1} markerEnd='url(#arrBD)' />
      </svg>
    ),
    nervous: (
      <svg viewBox='0 0 200 120' style={{ width: '100%', borderRadius: 4, background: isDark ? 'rgba(139,92,246,0.03)' : 'rgba(139,92,246,0.02)' }}>
        <ellipse cx={100} cy={25} rx={25} ry={18} fill='rgba(139,92,246,0.08)' stroke='#8b5cf6' strokeWidth={1.5} />
        <text x={100} y={28} textAnchor='middle' fontSize={8} fill='#8b5cf6' fontWeight={600}>Brain</text>
        <path d='M100 43 L100 55' stroke='#8b5cf6' strokeWidth={2} />
        <rect x={85} y={55} width={30} height={8} rx={3} fill='none' stroke={c + '0.4)'} strokeWidth={1} />
        <text x={100} y={62} textAnchor='middle' fontSize={6} fill={c + '0.6)'}>Spinal Cord</text>
        <path d='M85 63 L50 80' stroke={c + '0.3)'} strokeWidth={1} />
        <path d='M115 63 L150 80' stroke={c + '0.3)'} strokeWidth={1} />
        <circle cx={50} cy={85} r={8} fill='rgba(139,92,246,0.06)' stroke={c + '0.3)'} strokeWidth={1} />
        <circle cx={150} cy={85} r={8} fill='rgba(139,92,246,0.06)' stroke={c + '0.3)'} strokeWidth={1} />
        <text x={50} y={100} textAnchor='middle' fontSize={6} fill={c + '0.6)'}>Nerves</text>
        <text x={150} y={100} textAnchor='middle' fontSize={6} fill={c + '0.6)'}>Nerves</text>
      </svg>
    ),
    skeletal: (
      <svg viewBox='0 0 200 120' style={{ width: '100%', borderRadius: 4, background: isDark ? 'rgba(245,245,244,0.03)' : 'rgba(0,0,0,0.01)' }}>
        <ellipse cx={100} cy={18} rx={15} ry={12} fill='none' stroke={c + '0.3)'} strokeWidth={1.5} />
        <rect x={88} y={28} width={24} height={10} rx={3} fill='none' stroke={c + '0.3)'} strokeWidth={1.5} />
        <path d='M88 38 L80 70 L75 110' fill='none' stroke={c + '0.3)'} strokeWidth={4} strokeLinecap='round' />
        <path d='M112 38 L120 70 L125 110' fill='none' stroke={c + '0.3)'} strokeWidth={4} strokeLinecap='round' />
        <rect x={75} y={65} width={50} height={40} rx={3} fill='none' stroke={c + '0.3)'} strokeWidth={1.5} />
        <circle cx={90} cy={78} r={4} fill='none' stroke={c + '0.4)'} strokeWidth={1} />
        <circle cx={110} cy={78} r={4} fill='none' stroke={c + '0.4)'} strokeWidth={1} />
        <text x={90} y={95} textAnchor='middle' fontSize={5} fill={c + '0.6)'}>Joints</text>
      </svg>
    ),
    muscular: (
      <svg viewBox='0 0 200 120' style={{ width: '100%', borderRadius: 4, background: isDark ? 'rgba(249,115,22,0.03)' : 'rgba(249,115,22,0.02)' }}>
        <path d='M80 30 L85 60 L75 110' fill='none' stroke={c + '0.4)'} strokeWidth={8} strokeLinecap='round' opacity={0.5} />
        <path d='M120 30 L115 60 L125 110' fill='none' stroke={c + '0.4)'} strokeWidth={8} strokeLinecap='round' opacity={0.5} />
        <path d='M80 50 L120 50' fill='none' stroke={c + '0.3)'} strokeWidth={6} strokeLinecap='round' opacity={0.4} />
        <text x={100} y={80} textAnchor='middle' fontSize={8} fill={c + '0.7)'}>Biceps</text>
        <path d='M80 90 L120 90' fill='none' stroke={c + '0.3)'} strokeWidth={6} strokeLinecap='round' opacity={0.4} />
        <text x={100} y={105} textAnchor='middle' fontSize={8} fill={c + '0.7)'}>Quadriceps</text>
      </svg>
    ),
    immune: (
      <svg viewBox='0 0 200 120' style={{ width: '100%', borderRadius: 4, background: isDark ? 'rgba(20,184,166,0.03)' : 'rgba(20,184,166,0.02)' }}>
        <circle cx={60} cy={40} r={12} fill='rgba(20,184,166,0.1)' stroke='#14b8a6' strokeWidth={1.5} />
        <text x={60} y={43} textAnchor='middle' fontSize={6} fill='#14b8a6' fontWeight={600}>WBC</text>
        <circle cx={120} cy={40} r={8} fill='rgba(239,68,68,0.15)' stroke='#ef4444' strokeWidth={1} />
        <text x={120} y={43} textAnchor='middle' fontSize={6} fill='#ef4444'>Path.</text>
        <path d='M72 40 L112 40' stroke='#14b8a6' strokeWidth={1.5} strokeDasharray='3 2' />
        <path d='M120 48 L120 70' stroke='#ef4444' strokeWidth={1} strokeDasharray='2 2' />
        <circle cx={120} cy={80} r={5} fill='none' stroke='#ef4444' strokeWidth={1} opacity={0.5} />
        <text x={120} y={95} textAnchor='middle' fontSize={6} fill={c + '0.6)'}>Antibodies mark invaders</text>
        <circle cx={40} cy={70} r={6} fill='rgba(20,184,166,0.08)' stroke={c + '0.3)'} strokeWidth={1} />
        <text x={40} y={85} textAnchor='middle' fontSize={6} fill={c + '0.5)'}>T-cell</text>
        <circle cx={160} cy={70} r={6} fill='rgba(20,184,166,0.08)' stroke={c + '0.3)'} strokeWidth={1} />
        <text x={160} y={85} textAnchor='middle' fontSize={6} fill={c + '0.5)'}>B-cell</text>
      </svg>
    ),
    endocrine: (
      <svg viewBox='0 0 200 120' style={{ width: '100%', borderRadius: 4, background: isDark ? 'rgba(236,72,153,0.03)' : 'rgba(236,72,153,0.02)' }}>
        <circle cx={60} cy={30} r={8} fill='rgba(236,72,153,0.1)' stroke='#ec4899' strokeWidth={1} />
        <text x={60} y={33} textAnchor='middle' fontSize={6} fill='#ec4899'>Hypo.</text>
        <path d='M68 30 L80 30 L80 50 L90 55' stroke={c + '0.3)'} strokeWidth={1} strokeDasharray='3 2' />
        <text x={90} y={50} fontSize={6} fill={c + '0.6)'}>TSH</text>
        <circle cx={100} cy={60} r={8} fill='rgba(236,72,153,0.1)' stroke='#ec4899' strokeWidth={1} />
        <text x={100} y={63} textAnchor='middle' fontSize={6} fill='#ec4899'>Thyroid</text>
        <path d='M108 60 L140 60' stroke={c + '0.3)'} strokeWidth={1} strokeDasharray='3 2' />
        <text x={120} y={57} fontSize={6} fill={c + '0.5)'}>T3/T4</text>
        <circle cx={150} cy={60} r={6} fill='none' stroke={c + '0.3)'} strokeWidth={1} />
        <text x={150} y={75} textAnchor='middle' fontSize={6} fill={c + '0.6)'}>Target</text>
        <circle cx={60} cy={90} r={8} fill='rgba(236,72,153,0.1)' stroke='#ec4899' strokeWidth={1} />
        <text x={60} y={93} textAnchor='middle' fontSize={6} fill='#ec4899'>Adrenal</text>
        <circle cx={140} cy={90} r={8} fill='rgba(236,72,153,0.1)' stroke='#ec4899' strokeWidth={1} />
        <text x={140} y={93} textAnchor='middle' fontSize={6} fill='#ec4899'>Pancreas</text>
        <text x={100} y={112} textAnchor='middle' fontSize={7} fill={c + '0.6)'}>Hormones = chemical messengers in the blood</text>
      </svg>
    ),
  }
  return diagrams[systemId] || null
}

export function BodySystemsExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [selected, setSelected] = useState<string | null>(null)

  const active = BODY_SYSTEMS.find(sys => sys.id === selected)

  return (
    <div style={{ fontSize: 11, color: s.text }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginBottom: selected ? 8 : 0 }}>
        {BODY_SYSTEMS.map((sys, i) => (
          <div key={sys.id} onClick={() => setSelected(selected === sys.id ? null : sys.id)}
            style={{
              padding: '5px 7px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              background: selected === sys.id ? 'rgba(5,150,105,0.1)' : s.bg,
              border: '1px solid ' + (selected === sys.id ? 'rgba(5,150,105,0.25)' : s.border),
              color: selected === sys.id ? '#34d399' : s.bright, fontSize: 10, fontWeight: selected === sys.id ? 600 : 500,
            }}>
            <SystemIcon icon={sys.icon} isDark={isDark} color={SYSTEM_COLORS[i]} />
            {sys.name}
          </div>
        ))}
      </div>
      {active && (
        <div style={{ padding: '8px', background: s.bg, borderRadius: 4, border: '1px solid ' + s.border, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: s.bright, marginBottom: 4 }}>{active.name} System</div>
          {active.id && <SystemDiagram systemId={active.id} isDark={isDark} />}
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 10, color: s.bright }}>Key Organs: </span>
            <span style={{ fontSize: 10 }}>{active.organs.join(', ')}</span>
          </div>
          <div style={{ marginBottom: 6, fontSize: 10 }}>{active.function}</div>
          <div style={{ padding: '5px 7px', background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)', borderRadius: 3, border: '1px solid rgba(245,158,11,0.15)' }}>
            <span style={{ fontWeight: 600, fontSize: 9, color: '#f59e0b' }}>Fun Fact: </span>
            <span style={{ fontSize: 10 }}>{active.funFact}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 5. EcologyFoodWeb
// ============================================================

type EcoSystem = 'forest' | 'ocean' | 'grassland' | 'desert'

type EcoOrganism = {
  id: string
  name: string
  level: 'producer' | 'primary' | 'secondary' | 'decomposer'
  x: number
  y: number
}

type EcoConnection = {
  from: string
  to: string
}

interface EcoData {
  label: string
  organisms: EcoOrganism[]
  connections: EcoConnection[]
}

const ECOSYSTEMS: Record<EcoSystem, EcoData> = {
  forest: {
    label: 'Forest',
    organisms: [
      { id: 'grass', name: 'Grass', level: 'producer', x: 80, y: 220 },
      { id: 'oak', name: 'Oak Tree', level: 'producer', x: 180, y: 210 },
      { id: 'rabbit', name: 'Rabbit', level: 'primary', x: 60, y: 130 },
      { id: 'deer', name: 'Deer', level: 'primary', x: 160, y: 140 },
      { id: 'squirrel', name: 'Squirrel', level: 'primary', x: 260, y: 120 },
      { id: 'frog', name: 'Frog', level: 'primary', x: 320, y: 140 },
      { id: 'snake', name: 'Snake', level: 'secondary', x: 200, y: 60 },
      { id: 'hawk', name: 'Hawk', level: 'secondary', x: 340, y: 50 },
      { id: 'fox', name: 'Fox', level: 'secondary', x: 100, y: 50 },
      { id: 'fungi', name: 'Fungi', level: 'decomposer', x: 350, y: 220 },
    ],
    connections: [
      { from: 'grass', to: 'rabbit' }, { from: 'grass', to: 'deer' },
      { from: 'oak', to: 'squirrel' }, { from: 'oak', to: 'deer' },
      { from: 'rabbit', to: 'fox' }, { from: 'rabbit', to: 'snake' },
      { from: 'squirrel', to: 'hawk' }, { from: 'frog', to: 'snake' },
      { from: 'deer', to: 'hawk' },
      { from: 'rabbit', to: 'fungi' }, { from: 'deer', to: 'fungi' },
    ],
  },
  ocean: {
    label: 'Ocean',
    organisms: [
      { id: 'phyto', name: 'Phytoplankton', level: 'producer', x: 80, y: 220 },
      { id: 'kelp', name: 'Kelp', level: 'producer', x: 200, y: 220 },
      { id: 'zoop', name: 'Zooplankton', level: 'primary', x: 60, y: 140 },
      { id: 'smallfish', name: 'Small Fish', level: 'primary', x: 170, y: 140 },
      { id: 'crab', name: 'Crab', level: 'primary', x: 280, y: 140 },
      { id: 'squid', name: 'Squid', level: 'primary', x: 350, y: 150 },
      { id: 'largefish', name: 'Large Fish', level: 'secondary', x: 140, y: 60 },
      { id: 'seal', name: 'Seal', level: 'secondary', x: 260, y: 50 },
      { id: 'shark', name: 'Shark', level: 'secondary', x: 350, y: 60 },
      { id: 'bacteria', name: 'Bacteria', level: 'decomposer', x: 350, y: 220 },
    ],
    connections: [
      { from: 'phyto', to: 'zoop' }, { from: 'phyto', to: 'smallfish' },
      { from: 'kelp', to: 'crab' }, { from: 'kelp', to: 'smallfish' },
      { from: 'zoop', to: 'smallfish' }, { from: 'zoop', to: 'squid' },
      { from: 'smallfish', to: 'largefish' }, { from: 'smallfish', to: 'seal' },
      { from: 'squid', to: 'shark' }, { from: 'crab', to: 'shark' },
      { from: 'largefish', to: 'shark' },
      { from: 'smallfish', to: 'bacteria' }, { from: 'squid', to: 'bacteria' },
    ],
  },
  grassland: {
    label: 'Grassland',
    organisms: [
      { id: 'grass_g', name: 'Grass', level: 'producer', x: 100, y: 220 },
      { id: 'wildflower', name: 'Wildflower', level: 'producer', x: 250, y: 220 },
      { id: 'grasshopper', name: 'Grasshopper', level: 'primary', x: 70, y: 140 },
      { id: 'rabbit_g', name: 'Rabbit', level: 'primary', x: 170, y: 140 },
      { id: 'mouse', name: 'Mouse', level: 'primary', x: 280, y: 140 },
      { id: 'snake_g', name: 'Snake', level: 'secondary', x: 130, y: 60 },
      { id: 'hawk_g', name: 'Hawk', level: 'secondary', x: 250, y: 50 },
      { id: 'coyote', name: 'Coyote', level: 'secondary', x: 350, y: 60 },
      { id: 'bacteria_g', name: 'Bacteria', level: 'decomposer', x: 350, y: 220 },
    ],
    connections: [
      { from: 'grass_g', to: 'grasshopper' }, { from: 'grass_g', to: 'rabbit_g' },
      { from: 'wildflower', to: 'grasshopper' }, { from: 'wildflower', to: 'mouse' },
      { from: 'grasshopper', to: 'snake_g' }, { from: 'grasshopper', to: 'hawk_g' },
      { from: 'rabbit_g', to: 'coyote' }, { from: 'rabbit_g', to: 'hawk_g' },
      { from: 'mouse', to: 'snake_g' }, { from: 'mouse', to: 'coyote' },
      { from: 'snake_g', to: 'hawk_g' },
      { from: 'rabbit_g', to: 'bacteria_g' }, { from: 'mouse', to: 'bacteria_g' },
    ],
  },
  desert: {
    label: 'Desert',
    organisms: [
      { id: 'cactus', name: 'Cactus', level: 'producer', x: 100, y: 220 },
      { id: 'sage', name: 'Sagebrush', level: 'producer', x: 250, y: 220 },
      { id: 'grasshopper_d', name: 'Grasshopper', level: 'primary', x: 70, y: 140 },
      { id: 'lizard', name: 'Lizard', level: 'primary', x: 180, y: 140 },
      { id: 'mouse_d', name: 'Mouse', level: 'primary', x: 290, y: 140 },
      { id: 'snake_d', name: 'Snake', level: 'secondary', x: 120, y: 60 },
      { id: 'hawk_d', name: 'Hawk', level: 'secondary', x: 250, y: 50 },
      { id: 'coyote_d', name: 'Coyote', level: 'secondary', x: 350, y: 60 },
      { id: 'bacteria_d', name: 'Bacteria', level: 'decomposer', x: 350, y: 220 },
    ],
    connections: [
      { from: 'cactus', to: 'grasshopper_d' }, { from: 'cactus', to: 'lizard' },
      { from: 'sage', to: 'grasshopper_d' }, { from: 'sage', to: 'mouse_d' },
      { from: 'grasshopper_d', to: 'lizard' }, { from: 'grasshopper_d', to: 'snake_d' },
      { from: 'lizard', to: 'hawk_d' }, { from: 'lizard', to: 'snake_d' },
      { from: 'mouse_d', to: 'snake_d' }, { from: 'mouse_d', to: 'coyote_d' },
      { from: 'snake_d', to: 'hawk_d' }, { from: 'snake_d', to: 'coyote_d' },
      { from: 'lizard', to: 'bacteria_d' }, { from: 'mouse_d', to: 'bacteria_d' },
    ],
  },
}

const LEVEL_COLORS: Record<string, string> = {
  producer: '#22c55e',
  primary: '#3b82f6',
  secondary: '#ef4444',
  decomposer: '#a855f7',
}

const LEVEL_LABELS: Record<string, string> = {
  producer: 'Producers',
  primary: 'Primary Consumers',
  secondary: 'Secondary Consumers',
  decomposer: 'Decomposers',
}

export function EcologyFoodWeb({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [ecosystem, setEcosystem] = useState<EcoSystem>('forest')
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)

  const data = ECOSYSTEMS[ecosystem]
  const orgMap: Record<string, EcoOrganism> = {}
  data.organisms.forEach(o => { orgMap[o.id] = o })

  const relatedConns = selectedOrg
    ? data.connections.filter(c => c.from === selectedOrg || c.to === selectedOrg)
    : []

  const isRelated = (conn: EcoConnection) => {
    if (!selectedOrg) return false
    return conn.from === selectedOrg || conn.to === selectedOrg
  }

  const arrowColor = (conn: EcoConnection) => {
    if (isRelated(conn)) return isDark ? '#34d399' : '#059669'
    return isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)'
  }

  const arrowWidth = (conn: EcoConnection) => isRelated(conn) ? 2 : 1

  return (
    <div style={{ fontSize: 11, color: s.text }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 8, flexWrap: 'wrap' }}>
        {(['forest', 'ocean', 'grassland', 'desert'] as EcoSystem[]).map(eco => (
          <button key={eco} onClick={() => { setEcosystem(eco); setSelectedOrg(null) }} style={s.btn(ecosystem === eco)}>
            {ECOSYSTEMS[eco].label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 9, flexWrap: 'wrap' }}>
        {Object.entries(LEVEL_LABELS).map(([key, label]) => (
          <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: LEVEL_COLORS[key], display: 'inline-block' }}></span>
            {label}
          </span>
        ))}
      </div>

      {/* Food Web SVG */}
      <svg viewBox="0 0 420 260" width="100%" height="200" style={{ marginBottom: 6 }}>
        <defs>
          <marker id="arrowhead" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)'} />
          </marker>
          <marker id="arrowhead-active" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill={isDark ? '#34d399' : '#059669'} />
          </marker>
        </defs>
        {/* Connections (arrows) */}
        {data.connections.map((conn, i) => {
          const fromOrg = orgMap[conn.from]
          const toOrg = orgMap[conn.to]
          if (!fromOrg || !toOrg) return null
          const related = isRelated(conn)
          return (
            <line key={'conn-' + i}
              x1={fromOrg.x} y1={fromOrg.y}
              x2={toOrg.x} y2={toOrg.y}
              stroke={arrowColor(conn)}
              strokeWidth={arrowWidth(conn)}
              markerEnd={related ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
            />
          )
        })}
        {/* Organisms */}
        {data.organisms.map(org => {
          const isSelected = selectedOrg === org.id
          const isConn = selectedOrg && data.connections.some(c => (c.from === selectedOrg && c.to === org.id) || (c.to === selectedOrg && c.from === org.id))
          const r = isSelected ? 26 : (isConn ? 24 : 22)
          const col = LEVEL_COLORS[org.level]
          return (
            <g key={org.id} onClick={() => setSelectedOrg(isSelected ? null : org.id)} style={{ cursor: 'pointer' }}>
              <circle cx={org.x} cy={org.y} r={r}
                fill={isDark ? (isSelected ? 'rgba(5,150,105,0.2)' : 'rgba(255,255,255,0.04)') : (isSelected ? 'rgba(5,150,105,0.12)' : 'rgba(0,0,0,0.03)')}
                stroke={isSelected ? (isDark ? '#34d399' : '#059669') : (isConn ? (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)') : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)'))}
                strokeWidth={isSelected ? 2.5 : 1.2}
              />
              <circle cx={org.x} cy={org.y - r + 5} r="3" fill={col} opacity={0.7} />
              <text x={org.x} y={org.y + 3} textAnchor="middle" fontSize="8" fill={isSelected ? (isDark ? '#34d399' : '#059669') : s.bright} fontWeight={isSelected ? 700 : 400}>
                {org.name}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Selected organism info */}
      {selectedOrg && orgMap[selectedOrg] && (
        <div style={{ padding: '6px 8px', background: s.bg, borderRadius: 4, border: '1px solid ' + s.border, fontSize: 10 }}>
          <div style={{ fontWeight: 600, color: s.bright, marginBottom: 2 }}>{orgMap[selectedOrg].name} ({LEVEL_LABELS[orgMap[selectedOrg].level]})</div>
          {relatedConns.length > 0 && (
            <div style={{ color: s.text, lineHeight: 1.5 }}>
              {relatedConns.filter(c => c.from === selectedOrg).map(c => (
                <div key={c.to}>Eaten by: {orgMap[c.to].name}</div>
              ))}
              {relatedConns.filter(c => c.to === selectedOrg).map(c => (
                <div key={c.from}>Eats: {orgMap[c.from].name}</div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 4, fontSize: 9, color: s.text, opacity: 0.6 }}>Click organism again or another to change selection</div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 6. DNAStructureViewer
// ============================================================

const BASE_COLORS: Record<string, string> = { A: '#ef4444', T: '#3b82f6', G: '#22c55e', C: '#eab308' }
const COMPLEMENT: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' }

export function DNAStructureViewer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [seq, setSeq] = useState('ATGCGATCATAG')
  const [mode, setMode] = useState<'none' | 'replicate' | 'transcribe'>('none')

  const validSeq = seq.toUpperCase().replace(/[^ATGC]/g, '').slice(0, 20)
  const complementStrand = validSeq.split('').map(b => COMPLEMENT[b] || 'N').join('')
  const mrnaStrand = complementStrand.replace(/T/g, 'U')

  const displayStrand = mode === 'none' ? null : mode === 'replicate' ? complementStrand : mrnaStrand
  const displayLabel = mode === 'replicate' ? 'Complement (3\'→5\')' : mode === 'transcribe' ? 'mRNA (5\'→3\')' : ''

  const maxBases = 16
  const visibleSeq = validSeq.slice(0, maxBases)
  const svgW = 480
  const svgH = 180

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: s.text, fontWeight: 600 }}>Sequence:</span>
        <input
          style={s.input}
          value={seq}
          onChange={e => setSeq(e.target.value.toUpperCase())}
          maxLength={20}
          placeholder="ATGCGATCATAG"
        />
        <button style={s.btn(mode === 'replicate')} onClick={() => setMode(mode === 'replicate' ? 'none' : 'replicate')}>Replicate</button>
        <button style={s.btn(mode === 'transcribe')} onClick={() => setMode(mode === 'transcribe' ? 'none' : 'transcribe')}>Transcribe</button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 9, color: s.text }}>
        {Object.entries(BASE_COLORS).map(([base, col]) => (
          <span key={base} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: col, display: 'inline-block' }} />
            {base}
          </span>
        ))}
      </div>

      {/* SVG Double Helix */}
      <svg viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ width: '100%', borderRadius: 4, border: '1px solid ' + s.border, background: s.bg }}>
        {/* Backbone strands as sinusoidal curves */}
        {visibleSeq.split('').map((base, i) => {
          const x = 30 + i * (svgW - 60) / Math.max(visibleSeq.length - 1, 1)
          const yTop = 30 + 10 * Math.sin(i * 0.8)
          const yBot = 130 - 10 * Math.sin(i * 0.8)
          const col = BASE_COLORS[base] || '#666'
          const compBase = COMPLEMENT[base] || 'N'
          const compCol = BASE_COLORS[compBase] || '#666'

          return (
            <g key={i}>
              {/* Hydrogen bond (dashed) */}
              <line x1={x} y1={yTop + 8} x2={x} y2={yBot - 8} stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'} strokeWidth={1} strokeDasharray="2 2" />
              {/* Top base */}
              <circle cx={x} cy={yTop} r={7} fill={col} opacity={0.85} />
              <text x={x} y={yTop + 3.5} textAnchor="middle" fontSize={8} fill="#fff" fontWeight={700}>{base}</text>
              {/* Bottom base */}
              <circle cx={x} cy={yBot} r={7} fill={compCol} opacity={0.85} />
              <text x={x} y={yBot + 3.5} textAnchor="middle" fontSize={8} fill="#fff" fontWeight={700}>{compBase}</text>
              {/* Backbone connectors */}
              {i < visibleSeq.length - 1 && (
                <>
                  <path d={'M' + x + ',' + yTop + ' Q' + (x + (svgW - 60) / Math.max(visibleSeq.length - 1, 1) / 2) + ',' + (yTop - 5) + ' ' + (x + (svgW - 60) / Math.max(visibleSeq.length - 1, 1)) + ',' + (30 + 10 * Math.sin((i + 1) * 0.8))} stroke={isDark ? 'rgba(148,163,184,0.3)' : 'rgba(71,85,105,0.3)'} strokeWidth={2} fill="none" />
                  <path d={'M' + x + ',' + yBot + ' Q' + (x + (svgW - 60) / Math.max(visibleSeq.length - 1, 1) / 2) + ',' + (yBot + 5) + ' ' + (x + (svgW - 60) / Math.max(visibleSeq.length - 1, 1)) + ',' + (130 - 10 * Math.sin((i + 1) * 0.8))} stroke={isDark ? 'rgba(148,163,184,0.3)' : 'rgba(71,85,105,0.3)'} strokeWidth={2} fill="none" />
                </>
              )}
              {/* 5' and 3' labels */}
              {i === 0 && <text x={x - 16} y={yTop + 4} fontSize={8} fill={s.text} fontWeight={600}>5'</text>}
              {i === 0 && <text x={x - 16} y={yBot + 4} fontSize={8} fill={s.text} fontWeight={600}>3'</text>}
              {i === visibleSeq.length - 1 && <text x={x + 12} y={yTop + 4} fontSize={8} fill={s.text} fontWeight={600}>3'</text>}
              {i === visibleSeq.length - 1 && <text x={x + 12} y={yBot + 4} fontSize={8} fill={s.text} fontWeight={600}>5'</text>}
            </g>
          )
        })}
        {/* Strand labels */}
        <text x={10} y={14} fontSize={9} fill={s.bright} fontWeight={600}>Sense (5'→3')</text>
        <text x={10} y={170} fontSize={9} fill={s.bright} fontWeight={600}>Antisense (3'→5')</text>
        {displayStrand && (
          <text x={svgW / 2} y={14} fontSize={9} fill="#34d399" fontWeight={600} textAnchor="middle">{displayLabel}: {displayStrand}</text>
        )}
      </svg>

      {/* Sequence display */}
      <div style={{ marginTop: 6, fontSize: 10, color: s.text, lineHeight: 1.6 }}>
        <div><span style={{ fontWeight: 600, color: s.bright }}>Input:</span> {validSeq}</div>
        {mode === 'replicate' && <div><span style={{ fontWeight: 600, color: '#34d399' }}>Complement:</span> {complementStrand}</div>}
        {mode === 'transcribe' && <div><span style={{ fontWeight: 600, color: '#34d399' }}>mRNA:</span> {mrnaStrand}</div>}
        {mode === 'none' && <div style={{ opacity: 0.5 }}>Click Replicate or Transcribe to see the result</div>}
      </div>
    </div>
  )
}

// ============================================================
// 7. NaturalSelectionSim
// ============================================================

interface Bug {
  id: number
  hue: number
  sat: number
  x: number
  y: number
}

function randomBug(id: number, envHue: number): Bug {
  const hue = (id * 37 + Math.random() * 360) % 360
  return { id, hue, sat: 60 + Math.random() * 30, x: 10 + Math.random() * 380, y: 20 + Math.random() * 140 }
}

export function NaturalSelectionSim({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [envHue, setEnvHue] = useState(200)
  const [gen, setGen] = useState(0)
  const [bugs, setBugs] = useState<Bug[]>(() => Array.from({ length: 20 }, (_, i) => randomBug(i, 200)))

  const nextGen = () => {
    const scored = bugs.map(b => {
      const dist = Math.abs(((b.hue - envHue + 540) % 360) - 180)
      return { ...b, fitness: 360 - dist }
    }).sort((a, b) => (b as any).fitness - (a as any).fitness)

    const survivors = scored.slice(0, 15)
    const offspring: Bug[] = []
    let nextId = 100 + gen * 20
    while (offspring.length < 5) {
      const parent = survivors[Math.floor(Math.random() * survivors.length)]
      const mutHue = (parent.hue + (Math.random() - 0.5) * 40 + 360) % 360
      offspring.push({ id: nextId++, hue: mutHue, sat: parent.sat, x: 10 + Math.random() * 380, y: 20 + Math.random() * 140 })
    }
    setBugs([...survivors.map(b => ({ ...b, x: 10 + Math.random() * 380, y: 20 + Math.random() * 140 })), ...offspring])
    setGen(gen + 1)
  }

  const reset = () => {
    setGen(0)
    setBugs(Array.from({ length: 20 }, (_, i) => randomBug(i, envHue)))
  }

  // Trait distribution bar chart
  const buckets = Array.from({ length: 12 }, () => 0)
  bugs.forEach(b => {
    const idx = Math.min(11, Math.floor(b.hue / 30))
    buckets[idx]++
  })
  const maxBucket = Math.max(...buckets, 1)

  const envColor = 'hsl(' + envHue + ',50%,40%)'
  const envColorLight = 'hsl(' + envHue + ',50%,30%)'

  const meanHue = bugs.length > 0 ? bugs.reduce((s2, b) => s2 + b.hue, 0) / bugs.length : 0
  const meanFitness = bugs.length > 0 ? bugs.reduce((s2, b) => {
    const dist = Math.abs(((b.hue - envHue + 540) % 360) - 180)
    return s2 + (360 - dist)
  }, 0) / bugs.length : 0
  const bestFit = bugs.length > 0 ? Math.max(...bugs.map(b => {
    const dist = Math.abs(((b.hue - envHue + 540) % 360) - 180)
    return 360 - dist
  })) : 0

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
        <button style={s.btn(false)} onClick={nextGen}>Next Generation</button>
        <button style={s.btn(false)} onClick={reset}>Reset</button>
        <span style={{ fontSize: 10, color: s.text }}>Generation: <b style={{ color: s.bright }}>{gen}</b></span>
        <span style={{ fontSize: 9, color: s.text }}>Pop: <b style={{ color: s.bright }}>{bugs.length}</b></span>
      </div>

      {/* Environment slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 9, color: s.text, fontWeight: 600 }}>Environment:</span>
        <input
          type="range" min={0} max={360} value={envHue}
          onChange={e => setEnvHue(Number(e.target.value))}
          style={{ flex: 1, height: 6, cursor: 'pointer', accentColor: envColor }}
        />
        <span style={{ width: 14, height: 14, borderRadius: 3, background: envColor, display: 'inline-block' }} />
      </div>

      {/* Bug field */}
      <svg viewBox="0 0 400 180" style={{ width: '100%', borderRadius: 4, border: '1px solid ' + s.border, background: envColorLight }}>
        {bugs.map(b => {
          const dist = Math.abs(((b.hue - envHue + 540) % 360) - 180)
          const fitness = 360 - dist
          const opacity = 0.4 + (fitness / 360) * 0.6
          const bugColor = 'hsl(' + b.hue + ',' + b.sat + '%,55%)'
          return (
            <g key={b.id}>
              <circle cx={b.x} cy={b.y} r={6} fill={bugColor} stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} strokeWidth={0.5} opacity={opacity} />
              {/* Little legs */}
              <line x1={b.x - 3} y1={b.y + 5} x2={b.x - 6} y2={b.y + 10} stroke={bugColor} strokeWidth={1} opacity={opacity} />
              <line x1={b.x + 3} y1={b.y + 5} x2={b.x + 6} y2={b.y + 10} stroke={bugColor} strokeWidth={1} opacity={opacity} />
              <line x1={b.x - 2} y1={b.y + 5} x2={b.x - 5} y2={b.y + 11} stroke={bugColor} strokeWidth={1} opacity={opacity} />
              <line x1={b.x + 2} y1={b.y + 5} x2={b.x + 5} y2={b.y + 11} stroke={bugColor} strokeWidth={1} opacity={opacity} />
            </g>
          )
        })}
        <text x={10} y={174} fontSize={8} fill={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'}>Opacity = camouflage fitness</text>
      </svg>

      {/* Trait distribution bar chart */}
      <div style={{ marginTop: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 600, color: s.bright, marginBottom: 3 }}>Trait Distribution (hue)</div>
        <svg viewBox="0 0 400 50" style={{ width: '100%' }}>
          {buckets.map((count, i) => {
            const barH = Math.max(2, (count / maxBucket) * 40)
            const x = i * 33 + 2
            const barColor = 'hsl(' + (i * 30 + 15) + ',70%,55%)'
            return (
              <g key={i}>
                <rect x={x} y={46 - barH} width={28} height={barH} fill={barColor} rx={2} opacity={0.8} />
                {count > 0 && <text x={x + 14} y={44 - barH} textAnchor="middle" fontSize={7} fill={s.text}>{count}</text>}
              </g>
            )
          })}
          {/* Environment indicator */}
          <line x1={envHue / 360 * 400} y1={0} x2={envHue / 360 * 400} y2={50} stroke={isDark ? '#f87171' : '#dc2626'} strokeWidth={1.5} strokeDasharray="3 2" />
          <text x={envHue / 360 * 400} y={8} textAnchor="middle" fontSize={7} fill={isDark ? '#f87171' : '#dc2626'}>ENV</text>
        </svg>
      </div>

      {/* Generation statistics */}
      <div style={{ display: 'flex', gap: 12, fontSize: 9, color: s.text, borderTop: '1px solid ' + s.border, paddingTop: 4, marginTop: 4, flexWrap: 'wrap' }}>
        <span>Mean trait: <b style={{ color: s.bright }}>{meanHue.toFixed(0)}{'\u00B0'}</b></span>
        <span>Avg fitness: <b style={{ color: s.bright }}>{meanFitness.toFixed(0)}</b>/360</span>
        <span>Best fitness: <b style={{ color: '#34d399' }}>{bestFit.toFixed(0)}</b>/360</span>
      </div>
      <div style={{ fontSize: 8, color: s.text, opacity: 0.6, marginTop: 4 }}>Red dashed line = environment hue. Bugs closer in hue survive better.</div>
    </div>
  )
}

// ============================================================
// 8. CellDivisionAnimator
// ============================================================

interface PhaseInfo {
  name: string
  desc: string
  chromosomes: number
  split: boolean
  splitPhase2: boolean
  nucleusShape: string
  spindleVisible: boolean
  paired: boolean
}

const MITOSIS_PHASES: PhaseInfo[] = [
  { name: 'Interphase', desc: 'DNA replicates. Cell grows and prepares for division. Chromosomes are duplicated but not yet visible as distinct structures.', chromosomes: 4, split: false, splitPhase2: false, nucleusShape: 'circle', spindleVisible: false, paired: false },
  { name: 'Prophase', desc: 'Chromatin condenses into visible chromosomes. Spindle fibers begin to form. Nuclear envelope starts to break down.', chromosomes: 4, split: false, splitPhase2: false, nucleusShape: 'circle', spindleVisible: true, paired: true },
  { name: 'Metaphase', desc: 'Chromosomes line up at the cell equator (metaphase plate). Spindle fibers attach to centromeres.', chromosomes: 4, split: false, splitPhase2: false, nucleusShape: 'none', spindleVisible: true, paired: true },
  { name: 'Anaphase', desc: 'Sister chromatids separate and move to opposite poles. Spindle fibers shorten.', chromosomes: 8, split: false, splitPhase2: false, nucleusShape: 'none', spindleVisible: true, paired: false },
  { name: 'Telophase', desc: 'Chromatids arrive at poles. Nuclear envelopes reform. Chromosomes decondense.', chromosomes: 8, split: true, splitPhase2: false, nucleusShape: 'circle', spindleVisible: false, paired: false },
  { name: 'Cytokinesis', desc: 'The cytoplasm divides, producing two genetically identical daughter cells.', chromosomes: 4, split: true, splitPhase2: false, nucleusShape: 'circle', spindleVisible: false, paired: false },
]

const MEIOSIS_PHASES: PhaseInfo[] = [
  { name: 'Interphase I', desc: 'DNA replicates. Each chromosome now consists of two sister chromatids.', chromosomes: 4, split: false, splitPhase2: false, nucleusShape: 'circle', spindleVisible: false, paired: false },
  { name: 'Prophase I', desc: 'Homologous chromosomes pair up (synapsis). Crossing over occurs, exchanging genetic material.', chromosomes: 4, split: false, splitPhase2: false, nucleusShape: 'circle', spindleVisible: true, paired: true },
  { name: 'Metaphase I', desc: 'Homologous pairs line up at the equator. Spindle fibers attach to centromeres.', chromosomes: 4, split: false, splitPhase2: false, nucleusShape: 'none', spindleVisible: true, paired: true },
  { name: 'Anaphase I', desc: 'Homologous chromosomes separate and move to opposite poles. Sister chromatids remain together.', chromosomes: 4, split: false, splitPhase2: false, nucleusShape: 'none', spindleVisible: true, paired: false },
  { name: 'Telophase I', desc: 'Chromosomes arrive at poles. Two haploid cells form. No DNA replication occurs before meiosis II.', chromosomes: 2, split: true, splitPhase2: false, nucleusShape: 'circle', spindleVisible: false, paired: false },
  { name: 'Prophase II', desc: 'Chromosomes re-condense in both cells. Spindle fibers form again.', chromosomes: 2, split: true, splitPhase2: true, nucleusShape: 'circle', spindleVisible: true, paired: true },
  { name: 'Metaphase II', desc: 'Chromosomes line up at the equator in both cells.', chromosomes: 2, split: true, splitPhase2: true, nucleusShape: 'none', spindleVisible: true, paired: true },
  { name: 'Anaphase II', desc: 'Sister chromatids finally separate and move to poles.', chromosomes: 4, split: true, splitPhase2: true, nucleusShape: 'none', spindleVisible: true, paired: false },
  { name: 'Telophase II', desc: 'Four haploid daughter cells form, each with unique genetic combinations.', chromosomes: 4, split: true, splitPhase2: true, nucleusShape: 'circle', spindleVisible: false, paired: false },
]

function drawChromosome(x: number, y: number, color: string, paired: boolean, dark: boolean) {
  const armLen = 10
  if (paired) {
    return (
      <g>
        {/* Sister chromatid 1 */}
        <line x1={x - armLen} y1={y - armLen} x2={x} y2={y} stroke={color} strokeWidth={2.5} />
        <line x1={x + armLen} y1={y - armLen} x2={x} y2={y} stroke={color} strokeWidth={2.5} />
        <line x1={x - armLen} y1={y + armLen} x2={x} y2={y} stroke={color} strokeWidth={2.5} />
        <line x1={x + armLen} y1={y + armLen} x2={x} y2={y} stroke={color} strokeWidth={2.5} />
        {/* Sister chromatid 2 (offset) */}
        <line x1={x - armLen + 2} y1={y - armLen} x2={x + 2} y2={y} stroke={color} strokeWidth={2.5} opacity={0.5} />
        <line x1={x + armLen + 2} y1={y - armLen} x2={x + 2} y2={y} stroke={color} strokeWidth={2.5} opacity={0.5} />
        <line x1={x - armLen + 2} y1={y + armLen} x2={x + 2} y2={y} stroke={color} strokeWidth={2.5} opacity={0.5} />
        <line x1={x + armLen + 2} y1={y + armLen} x2={x + 2} y2={y} stroke={color} strokeWidth={2.5} opacity={0.5} />
        {/* Centromere */}
        <circle cx={x + 1} cy={y} r={1.5} fill={dark ? '#e2e8f0' : '#1e293b'} />
      </g>
    )
  }
  return (
    <g>
      <line x1={x - armLen} y1={y - armLen} x2={x} y2={y} stroke={color} strokeWidth={2.5} />
      <line x1={x + armLen} y1={y - armLen} x2={x} y2={y} stroke={color} strokeWidth={2.5} />
      <line x1={x - armLen} y1={y + armLen} x2={x} y2={y} stroke={color} strokeWidth={2.5} />
      <line x1={x + armLen} y1={y + armLen} x2={x} y2={y} stroke={color} strokeWidth={2.5} />
      <circle cx={x} cy={y} r={1.5} fill={dark ? '#e2e8f0' : '#1e293b'} />
    </g>
  )
}

export function CellDivisionAnimator({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [mode, setMode] = useState<'mitosis' | 'meiosis'>('mitosis')
  const phases = mode === 'mitosis' ? MITOSIS_PHASES : MEIOSIS_PHASES
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const playRef = useRef<NodeJS.Timeout | null>(null)
  const phase = phases[step]

  const prev = () => setStep(Math.max(0, step - 1))
  const next = () => setStep(Math.min(phases.length - 1, step + 1))

  const playAll = () => {
    if (playing) {
      if (playRef.current) clearTimeout(playRef.current)
      setPlaying(false)
      return
    }
    setPlaying(true)
    setStep(0)
  }

  React.useEffect(() => {
    if (!playing) return
    playRef.current = setTimeout(() => {
      if (step < phases.length - 1) {
        setStep(step + 1)
      } else {
        setPlaying(false)
      }
    }, 1500)
    return () => { if (playRef.current) clearTimeout(playRef.current) }
  }, [playing, step, phases.length])

  const chrColors = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b', '#ec4899', '#06b6d4', '#f97316']

  const cellR = 60
  const svgW = 460
  const svgH = 160

  return (
    <div>
      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        <button style={s.btn(mode === 'mitosis')} onClick={() => { setMode('mitosis'); setStep(0) }}>Mitosis</button>
        <button style={s.btn(mode === 'meiosis')} onClick={() => { setMode('meiosis'); setStep(0) }}>Meiosis</button>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: s.text }}>{phase.name} ({step + 1}/{phases.length})</span>
      </div>

      {/* SVG visualization */}
      <svg viewBox={'0 0 ' + svgW + ' ' + svgH} style={{ width: '100%', borderRadius: 4, border: '1px solid ' + s.border, background: s.bg }}>
        <defs>
          <marker id="arrowM" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill={isDark ? 'rgba(148,163,184,0.4)' : 'rgba(71,85,105,0.4)'} />
          </marker>
        </defs>

        {/* Cell 1 (left) */}
        <g transform={phase.split ? 'translate(-20,0) scale(0.8)' : ''}>
          <ellipse cx={130} cy={80} rx={cellR} ry={cellR * 0.8} fill={isDark ? 'rgba(56,189,248,0.06)' : 'rgba(14,116,144,0.06)'} stroke={isDark ? 'rgba(56,189,248,0.2)' : 'rgba(14,116,144,0.2)'} strokeWidth={1.5} />

          {/* Nucleus */}
          {phase.nucleusShape === 'circle' && (
            <ellipse cx={130} cy={80} rx={35} ry={30} fill={isDark ? 'rgba(56,189,248,0.1)' : 'rgba(14,116,144,0.1)'} stroke={isDark ? 'rgba(56,189,248,0.3)' : 'rgba(14,116,144,0.3)'} strokeWidth={1} strokeDasharray="3 2" />
          )}

          {/* Spindle fibers */}
          {phase.spindleVisible && (
            <>
              <line x1={130 - 45} y1={80} x2={130 + 45} y2={80} stroke={isDark ? 'rgba(148,163,184,0.2)' : 'rgba(71,85,105,0.2)'} strokeWidth={0.5} />
              <line x1={80} y1={55} x2={130} y2={75} stroke={isDark ? 'rgba(148,163,184,0.15)' : 'rgba(71,85,105,0.15)'} strokeWidth={0.5} markerEnd="url(#arrowM)" />
              <line x1={80} y1={105} x2={130} y2={85} stroke={isDark ? 'rgba(148,163,184,0.15)' : 'rgba(71,85,105,0.15)'} strokeWidth={0.5} markerEnd="url(#arrowM)" />
              <line x1={180} y1={55} x2={130} y2={75} stroke={isDark ? 'rgba(148,163,184,0.15)' : 'rgba(71,85,105,0.15)'} strokeWidth={0.5} markerEnd="url(#arrowM)" />
              <line x1={180} y1={105} x2={130} y2={85} stroke={isDark ? 'rgba(148,163,184,0.15)' : 'rgba(71,85,105,0.15)'} strokeWidth={0.5} markerEnd="url(#arrowM)" />
            </>
          )}

          {/* Chromosomes */}
          {Array.from({ length: Math.min(phase.chromosomes, 8) }, (_, i) => {
            const row = Math.floor(i / 4)
            const col = i % 4
            const cx = 110 + col * 14
            const cy = 70 + row * 20
            const color = chrColors[i % chrColors.length]
            return <g key={i}>{drawChromosome(cx, cy, color, phase.paired, isDark)}</g>
          })}
        </g>

        {/* Cell 2 (for split / meiosis II) */}
        {phase.split && (
          <g transform={phase.splitPhase2 ? 'translate(20,0) scale(0.8)' : ''}>
            <ellipse cx={330} cy={80} rx={cellR} ry={cellR * 0.8} fill={isDark ? 'rgba(56,189,248,0.06)' : 'rgba(14,116,144,0.06)'} stroke={isDark ? 'rgba(56,189,248,0.2)' : 'rgba(14,116,144,0.2)'} strokeWidth={1.5} />
            {phase.nucleusShape === 'circle' && (
              <ellipse cx={330} cy={80} rx={35} ry={30} fill={isDark ? 'rgba(56,189,248,0.1)' : 'rgba(14,116,144,0.1)'} stroke={isDark ? 'rgba(56,189,248,0.3)' : 'rgba(14,116,144,0.3)'} strokeWidth={1} strokeDasharray="3 2" />
            )}
            {phase.spindleVisible && (
              <line x1={285} y1={80} x2={375} y2={80} stroke={isDark ? 'rgba(148,163,184,0.2)' : 'rgba(71,85,105,0.2)'} strokeWidth={0.5} />
            )}
            {Array.from({ length: Math.min(Math.ceil(phase.chromosomes / (mode === 'meiosis' && phase.splitPhase2 ? 2 : 2)), 4) }, (_, i) => {
              const cx = 315 + (i % 4) * 12
              const cy = 72 + Math.floor(i / 4) * 16
              const color = chrColors[(i + 2) % chrColors.length]
              return <g key={i}>{drawChromosome(cx, cy, color, phase.paired, isDark)}</g>
            })}
          </g>
        )}

        {/* Cytokinesis arrow for meiosis showing 4 cells */}
        {mode === 'meiosis' && step === phases.length - 1 && (
          <text x={svgW / 2} y={150} textAnchor="middle" fontSize={9} fill="#34d399" fontWeight={600}>4 haploid daughter cells (n)</text>
        )}
        {mode === 'mitosis' && step === phases.length - 1 && (
          <text x={svgW / 2} y={150} textAnchor="middle" fontSize={9} fill="#34d399" fontWeight={600}>2 identical diploid daughter cells (2n)</text>
        )}
      </svg>

      {/* Phase info */}
      <div style={{ marginTop: 6, padding: '6px 8px', background: s.bg, borderRadius: 4, border: '1px solid ' + s.border, fontSize: 10 }}>
        <div style={{ fontWeight: 600, color: s.bright, marginBottom: 2 }}>{phase.name}</div>
        <div style={{ color: s.text, lineHeight: 1.5, marginBottom: 4 }}>{phase.desc}</div>
        <div style={{ display: 'flex', gap: 12, fontSize: 9, color: s.text }}>
          <span>Chromosomes visible: <strong style={{ color: s.bright }}>{phase.chromosomes}</strong></span>
          <span>Nucleus: <strong style={{ color: s.bright }}>{phase.nucleusShape}</strong></span>
          <span>Spindle: <strong style={{ color: s.bright }}>{phase.spindleVisible ? 'visible' : 'not visible'}</strong></span>
        </div>
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <button style={s.btn(false)} onClick={prev} disabled={step === 0}>Prev</button>
        <button style={s.btn(false)} onClick={next} disabled={step === phases.length - 1}>Next</button>
        <button style={{ ...s.btn(playing), padding: '3px 10px' }} onClick={playAll}>{playing ? 'Pause' : 'Play All'}</button>
        <div style={{ display: 'flex', gap: 2, flex: 1, alignItems: 'center' }}>
          {phases.map((_, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              style={{
                flex: 1, height: 4, borderRadius: 2, cursor: 'pointer',
                background: i === step ? '#34d399' : i < step ? (isDark ? 'rgba(52,211,153,0.3)' : 'rgba(5,150,105,0.2)') : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 9. PhotosynthesisRespiration
// ============================================================

const PHOTOSYNTHESIS_PARTS = [
  { id: 'sun', label: 'Sunlight', x: 30, y: 55, desc: 'The sun provides light energy that drives photosynthesis. Light is absorbed by chlorophyll in the chloroplasts.' },
  { id: 'co2', label: 'CO2', x: 100, y: 25, desc: 'Carbon dioxide enters the leaf through stomata. It provides the carbon atoms needed to build glucose molecules.' },
  { id: 'h2o_in', label: 'H2O', x: 100, y: 85, desc: 'Water is absorbed by roots and transported to leaves. It provides electrons and hydrogen ions for the light reactions.' },
  { id: 'chloroplast', label: 'Chloroplast', x: 170, y: 55, desc: 'The chloroplast is the organelle where photosynthesis occurs. It contains chlorophyll and is the site of both light-dependent and light-independent reactions.' },
  { id: 'glucose', label: 'C6H12O6', x: 245, y: 35, desc: 'Glucose is the sugar produced by photosynthesis. It stores chemical energy that can be used by the plant or consumed by other organisms.' },
  { id: 'o2', label: 'O2', x: 245, y: 85, desc: 'Oxygen is released as a byproduct of photosynthesis. It comes from the splitting of water molecules during the light reactions.' },
]

const RESPIRATION_PARTS = [
  { id: 'glucose_r', label: 'C6H12O6', x: 100, y: 25, desc: 'Glucose from food is broken down during cellular respiration to release stored chemical energy.' },
  { id: 'o2_r', label: 'O2', x: 100, y: 85, desc: 'Oxygen is required as the final electron acceptor in the electron transport chain. It combines with hydrogen to form water.' },
  { id: 'mitochondria', label: 'Mitochondria', x: 170, y: 55, desc: 'The mitochondrion is the powerhouse of the cell. It is where cellular respiration occurs, producing ATP through glycolysis, the Krebs cycle, and electron transport chain.' },
  { id: 'co2_r', label: 'CO2', x: 245, y: 25, desc: 'Carbon dioxide is produced as a waste product when glucose is broken down. It is exhaled from the lungs.' },
  { id: 'h2o_r', label: 'H2O', x: 245, y: 65, desc: 'Water is produced when oxygen combines with hydrogen ions at the end of the electron transport chain.' },
  { id: 'atp', label: 'ATP', x: 245, y: 100, desc: 'ATP (adenosine triphosphate) is the energy currency of the cell. Each glucose molecule produces about 36-38 ATP molecules.' },
]

export function PhotosynthesisRespiration({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [selected, setSelected] = useState<string | null>(null)
  const [lightIntensity, setLightIntensity] = useState(70)

  const selPart = [...PHOTOSYNTHESIS_PARTS, ...RESPIRATION_PARTS].find(p => p.id === selected)

  const sunGlow = isDark
    ? 'rgba(251,191,36,' + (0.1 + lightIntensity / 300) + ')'
    : 'rgba(245,158,11,' + (0.1 + lightIntensity / 300) + ')'
  const arrowColor = isDark ? 'rgba(148,163,184,0.4)' : 'rgba(71,85,105,0.4)'
  const arrowActive = '#34d399'

  return (
    <div>
      {/* Light intensity slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 9, color: s.text, fontWeight: 600 }}>Light Intensity:</span>
        <input type="range" min={0} max={100} value={lightIntensity} onChange={e => setLightIntensity(Number(e.target.value))} style={{ flex: 1, height: 6, cursor: 'pointer', accentColor: '#f59e0b' }} />
        <span style={{ fontSize: 10, color: s.bright }}>{lightIntensity}%</span>
      </div>

      {/* Side by side SVGs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {/* Photosynthesis */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#22c55e', marginBottom: 3, textAlign: 'center' }}>Photosynthesis</div>
          <svg viewBox="0 0 290 120" style={{ width: '100%', borderRadius: 4, border: '1px solid ' + s.border, background: s.bg }}>
            {/* Sun glow */}
            <circle cx={30} cy={55} r={20 + lightIntensity / 5} fill={sunGlow} />
            <circle cx={30} cy={55} r={14} fill="#fbbf24" opacity={0.6 + lightIntensity / 300} />
            {/* Rays */}
            {[0, 60, 120, 180, 240, 300].map(angle => {
              const rad = angle * Math.PI / 180
              const x1 = 30 + 16 * Math.cos(rad)
              const y1 = 55 + 16 * Math.sin(rad)
              const x2 = 30 + (20 + lightIntensity / 5) * Math.cos(rad)
              const y2 = 55 + (20 + lightIntensity / 5) * Math.sin(rad)
              return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fbbf24" strokeWidth={1} opacity={0.4 + lightIntensity / 300} />
            })}

            {/* Arrows */}
            <line x1={45} y1={55} x2={85} y2={30} stroke={arrowColor} strokeWidth={1.5} markerEnd="url(#arrPR)" />
            <line x1={45} y1={55} x2={85} y2={85} stroke={arrowColor} strokeWidth={1.5} markerEnd="url(#arrPR)" />
            <line x1={120} y1={30} x2={150} y2={50} stroke={arrowColor} strokeWidth={1.5} markerEnd="url(#arrPR)" />
            <line x1={120} y1={85} x2={150} y2={60} stroke={arrowColor} strokeWidth={1.5} markerEnd="url(#arrPR)" />
            <line x1={195} y1={50} x2={225} y2={35} stroke={arrowColor} strokeWidth={1.5} markerEnd="url(#arrPR)" />
            <line x1={195} y1={60} x2={225} y2={85} stroke={arrowColor} strokeWidth={1.5} markerEnd="url(#arrPR)" />

            <defs>
              <marker id="arrPR" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill={arrowColor} /></marker>
            </defs>

            {/* Parts */}
            {PHOTOSYNTHESIS_PARTS.map(p => {
              const isSun = p.id === 'sun'
              const isSelected = selected === p.id
              const isChloroplast = p.id === 'chloroplast'
              return (
                <g key={p.id} onClick={() => setSelected(selected === p.id ? null : p.id)} style={{ cursor: 'pointer' }}>
                  {!isSun && !isChloroplast && (
                    <rect x={p.x - 20} y={p.y - 10} width={40} height={20} rx={6} fill={isSelected ? 'rgba(34,197,94,0.2)' : s.bg} stroke={isSelected ? '#22c55e' : s.border} strokeWidth={isSelected ? 1.5 : 1} />
                  )}
                  {isChloroplast && (
                    <ellipse cx={p.x} cy={p.y} rx={24} ry={16} fill={isSelected ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)'} stroke={isSelected ? '#22c55e' : 'rgba(34,197,94,0.3)'} strokeWidth={1.5} />
                  )}
                  <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize={8} fill={isSelected ? '#22c55e' : s.bright} fontWeight={isSelected ? 700 : 500}>{p.label}</text>
                </g>
              )
            })}

            {/* Equation */}
            <text x={145} y={112} textAnchor="middle" fontSize={7} fill={s.text}>6CO2 + 6H2O + light → C6H12O6 + 6O2</text>
          </svg>
        </div>

        {/* Respiration */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#f97316', marginBottom: 3, textAlign: 'center' }}>Cellular Respiration</div>
          <svg viewBox="0 0 290 120" style={{ width: '100%', borderRadius: 4, border: '1px solid ' + s.border, background: s.bg }}>
            {/* Arrows */}
            <line x1={120} y1={30} x2={148} y2={50} stroke={arrowColor} strokeWidth={1.5} markerEnd="url(#arrRR)" />
            <line x1={120} y1={85} x2={148} y2={60} stroke={arrowColor} strokeWidth={1.5} markerEnd="url(#arrRR)" />
            <line x1={195} y1={50} x2={225} y2={28} stroke={arrowColor} strokeWidth={1.5} markerEnd="url(#arrRR)" />
            <line x1={195} y1={55} x2={225} y2={65} stroke={arrowColor} strokeWidth={1.5} markerEnd="url(#arrRR)" />
            <line x1={195} y1={60} x2={225} y2={100} stroke={arrowColor} strokeWidth={1.5} markerEnd="url(#arrRR)" />

            <defs>
              <marker id="arrRR" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto"><polygon points="0 0, 6 2, 0 4" fill={arrowColor} /></marker>
            </defs>

            {/* Parts */}
            {RESPIRATION_PARTS.map(p => {
              const isSelected = selected === p.id
              const isMito = p.id === 'mitochondria'
              return (
                <g key={p.id} onClick={() => setSelected(selected === p.id ? null : p.id)} style={{ cursor: 'pointer' }}>
                  {!isMito && (
                    <rect x={p.x - 20} y={p.y - 10} width={40} height={20} rx={6} fill={isSelected ? 'rgba(249,115,22,0.2)' : s.bg} stroke={isSelected ? '#f97316' : s.border} strokeWidth={isSelected ? 1.5 : 1} />
                  )}
                  {isMito && (
                    <ellipse cx={p.x} cy={p.y} rx={24} ry={16} fill={isSelected ? 'rgba(249,115,22,0.2)' : 'rgba(249,115,22,0.1)'} stroke={isSelected ? '#f97316' : 'rgba(249,115,22,0.3)'} strokeWidth={1.5} />
                  )}
                  <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize={8} fill={isSelected ? '#f97316' : s.bright} fontWeight={isSelected ? 700 : 500}>{p.label}</text>
                </g>
              )
            })}

            {/* Equation */}
            <text x={145} y={112} textAnchor="middle" fontSize={7} fill={s.text}>C6H12O6 + 6O2 → 6CO2 + 6H2O + ATP</text>
          </svg>
        </div>
      </div>

      {/* Connecting arrows between the two diagrams */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
        <svg viewBox="0 0 200 16" style={{ width: 120 }}>
          <text x={10} y={8} fontSize={7} fill={s.text}>C6H12O6 + O2</text>
          <line x1={65} y1={8} x2={95} y2={8} stroke={arrowActive} strokeWidth={1} strokeDasharray="3 2" />
          <text x={98} y={8} fontSize={7} fill={arrowActive}>↔</text>
          <line x1={112} y1={8} x2={142} y2={8} stroke={arrowActive} strokeWidth={1} strokeDasharray="3 2" />
          <text x={145} y={8} fontSize={7} fill={s.text}>CO2 + H2O</text>
        </svg>
      </div>

      {/* Info panel */}
      {selPart && (
        <div style={{ marginTop: 4, padding: '6px 8px', background: s.bg, borderRadius: 4, border: '1px solid ' + s.border, fontSize: 10 }}>
          <div style={{ fontWeight: 600, color: s.bright, marginBottom: 2 }}>{selPart.label}</div>
          <div style={{ color: s.text, lineHeight: 1.5 }}>{selPart.desc}</div>
        </div>
      )}
      {!selPart && (
        <div style={{ marginTop: 4, fontSize: 9, color: s.text, opacity: 0.5, textAlign: 'center' }}>Click on any part to learn more</div>
      )}

      {/* Light effect note */}
      <div style={{ marginTop: 4, fontSize: 8, color: s.text, opacity: 0.6 }}>
        Light intensity affects the rate of photosynthesis. Higher light = more energy for the light reactions.
      </div>
    </div>
  )
}

// ============================================================
// 10. HumanBodyInteractive
// ============================================================

const BODY_PARTS = [
  { id: 'brain', name: 'Brain', system: 'Nervous System', x: 120, y: 28, r: 12, function: 'Controls all body functions, processes sensory information, and is the center of thought, memory, and emotion. Contains ~86 billion neurons.', fact: 'Your brain uses about 20% of your body\'s total energy despite being only 2% of body weight!' },
  { id: 'heart', name: 'Heart', system: 'Cardiovascular System', x: 132, y: 88, r: 9, function: 'Pumps blood throughout the body, delivering oxygen and nutrients to cells and removing waste products. Beats about 100,000 times per day.', fact: 'Your heart pumps about 2,000 gallons of blood every day — enough to fill a swimming pool in a year!' },
  { id: 'lungs', name: 'Lungs', system: 'Respiratory System', x: 102, y: 82, r: 10, function: 'Facilitate gas exchange — oxygen enters the blood and carbon dioxide is expelled. Contains about 300 million alveoli.', fact: 'If you spread out all the alveoli in your lungs, they would cover an area the size of a tennis court!' },
  { id: 'stomach', name: 'Stomach', system: 'Digestive System', x: 128, y: 125, r: 10, function: 'Breaks down food using hydrochloric acid and enzymes. Can hold about 1 liter of food and takes 2-4 hours to empty.', fact: 'Your stomach produces a new lining every 3-4 days to protect itself from its own acid!' },
  { id: 'liver', name: 'Liver', system: 'Digestive System', x: 148, y: 118, r: 10, function: 'Detoxifies chemicals, produces bile for fat digestion, stores glycogen, and synthesizes proteins. Performs over 500 different functions.', fact: 'Your liver is the only organ that can regenerate itself — it can regrow to full size from just 25%!' },
  { id: 'kidneys', name: 'Kidneys', system: 'Urinary System', x: 118, y: 155, r: 8, function: 'Filter blood to remove waste products and excess water, producing urine. Regulate electrolyte balance and blood pressure.', fact: 'Your kidneys filter about 200 liters of blood daily but produce only about 1-2 liters of urine!' },
]

export function HumanBodyInteractive({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [selected, setSelected] = useState<string | null>(null)
  const selPart = BODY_PARTS.find(p => p.id === selected)

  return (
    <div>
      <div style={{ display: 'flex', gap: 6 }}>
        {/* Body SVG */}
        <svg viewBox="0 0 240 280" style={{ width: 180, flexShrink: 0, borderRadius: 4, border: '1px solid ' + s.border, background: s.bg }}>
          {/* Body silhouette - head */}
          <ellipse cx={120} cy={30} rx={18} ry={22} fill={isDark ? 'rgba(148,163,184,0.08)' : 'rgba(71,85,105,0.06)'} stroke={isDark ? 'rgba(148,163,184,0.2)' : 'rgba(71,85,105,0.15)'} strokeWidth={1.5} />
          {/* Neck */}
          <rect x={113} y={50} width={14} height={12} rx={4} fill={isDark ? 'rgba(148,163,184,0.06)' : 'rgba(71,85,105,0.04)'} stroke={isDark ? 'rgba(148,163,184,0.15)' : 'rgba(71,85,105,0.1)'} strokeWidth={1} />
          {/* Torso */}
          <path d="M95,62 L145,62 L150,90 L148,170 L140,175 L100,175 L92,170 L90,90 Z" fill={isDark ? 'rgba(148,163,184,0.06)' : 'rgba(71,85,105,0.04)'} stroke={isDark ? 'rgba(148,163,184,0.15)' : 'rgba(71,85,105,0.1)'} strokeWidth={1.5} />
          {/* Arms */}
          <path d="M95,65 L72,100 L65,150" fill="none" stroke={isDark ? 'rgba(148,163,184,0.15)' : 'rgba(71,85,105,0.1)'} strokeWidth={6} strokeLinecap="round" />
          <path d="M145,65 L168,100 L175,150" fill="none" stroke={isDark ? 'rgba(148,163,184,0.15)' : 'rgba(71,85,105,0.1)'} strokeWidth={6} strokeLinecap="round" />
          {/* Legs */}
          <path d="M105,175 L100,240 L95,270" fill="none" stroke={isDark ? 'rgba(148,163,184,0.15)' : 'rgba(71,85,105,0.1)'} strokeWidth={7} strokeLinecap="round" />
          <path d="M135,175 L140,240 L145,270" fill="none" stroke={isDark ? 'rgba(148,163,184,0.15)' : 'rgba(71,85,105,0.1)'} strokeWidth={7} strokeLinecap="round" />

          {/* Hotspots */}
          {BODY_PARTS.map(p => {
            const isSelected = selected === p.id
            const pulseR = isSelected ? p.r + 4 + 2 * Math.sin(Date.now() / 300) : p.r
            return (
              <g key={p.id} onClick={() => setSelected(selected === p.id ? null : p.id)} style={{ cursor: 'pointer' }}>
                {isSelected && (
                  <circle cx={p.x} cy={p.y} r={pulseR + 4} fill={isDark ? 'rgba(52,211,153,0.08)' : 'rgba(5,150,105,0.06)'} />
                )}
                <circle cx={p.x} cy={p.y} r={pulseR} fill={isSelected ? 'rgba(52,211,153,0.25)' : 'rgba(52,211,153,0.1)'} stroke={isSelected ? '#34d399' : 'rgba(52,211,153,0.3)'} strokeWidth={isSelected ? 2 : 1} />
                <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize={7} fill={isSelected ? '#34d399' : s.bright} fontWeight={isSelected ? 700 : 500}>{p.name}</text>
              </g>
            )
          })}
        </svg>

        {/* Info panel */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {selPart ? (
            <div style={{ padding: 8, background: s.bg, borderRadius: 4, border: '1px solid ' + (selected ? 'rgba(52,211,153,0.3)' : s.border), height: '100%' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#34d399', marginBottom: 2 }}>{selPart.name}</div>
              <div style={{ fontSize: 9, color: s.text, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{selPart.system}</div>
              <div style={{ fontSize: 10, color: s.bright, marginBottom: 6, lineHeight: 1.5 }}>{selPart.function}</div>
              <div style={{ padding: '6px 8px', background: isDark ? 'rgba(52,211,153,0.06)' : 'rgba(5,150,105,0.04)', borderRadius: 4, border: '1px solid rgba(52,211,153,0.15)' }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: '#34d399', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Fun Fact</div>
                <div style={{ fontSize: 10, color: s.text, lineHeight: 1.5 }}>{selPart.fact}</div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 8, background: s.bg, borderRadius: 4, border: '1px solid ' + s.border, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 10, color: s.text, opacity: 0.5, textAlign: 'center' }}>Click a body part to learn about it</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}