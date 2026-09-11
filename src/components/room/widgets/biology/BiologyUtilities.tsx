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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: P1 = {geneLetter}{p1a1 ? geneLetter.toUpperCase() : geneLetter.toLowerCase()} × P2 = {geneLetter}{p2a1 ? geneLetter.toUpperCase() : geneLetter.toLowerCase()}</div>
          <div>Step 2: Law of Segregation — each parent passes ONE allele</div>
          <div>Step 3: Gametes: P1 → {p1a1 ? geneLetter.toUpperCase() : geneLetter.toLowerCase()}, {p1a2 ? geneLetter.toUpperCase() : geneLetter.toLowerCase()} | P2 → {p2a1 ? geneLetter.toUpperCase() : geneLetter.toLowerCase()}, {p2a2 ? geneLetter.toUpperCase() : geneLetter.toLowerCase()}</div>
          <div>Step 4: Cross in 2×2 grid (see square above)</div>
          <div>Step 5: Count genotypes from grid</div>
          <div>Step 6: Phenotype: {dominantName} (dominant) vs {recessiveName} (recessive)</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Law of Segregation: each parent passes ONE allele. The 3:1 ratio in Bb×Bb is the signature of complete dominance (Mendel, 1865).
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Cell type: {cellType} ({cellType === 'plant' ? 'has cell wall + chloroplasts' : 'no cell wall, no chloroplasts'})</div>
          <div>Step 2: {selected ? 'Selected: ' + selected + ' — ' + (ORGANELLE_DATA[selected]?.desc || 'click to learn more') : 'Click an organelle to see its function'}</div>
          <div>Step 3: Nucleus = control center (DNA storage)</div>
          <div>Step 4: Mitochondria = energy production (ATP)</div>
          <div>Step 5: {cellType === 'plant' ? 'Chloroplasts = photosynthesis (unique to plants)' : 'No chloroplasts (animal cells)'}</div>
          <div>Step 6: Structure follows function — each organelle has a specific job</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Plants have cell walls + chloroplasts. Both have nucleus (DNA), mitochondria (energy), ribosomes (protein). Structure follows function.
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Organism: {selectedExample ? EXAMPLE_ORGANISMS[selectedExample]?.label : 'Custom input'}</div>
          <div>Step 2: Domain = {customLevels[0]}</div>
          <div>Step 3: Kingdom = {customLevels[1]}</div>
          <div>Step 4: Phylum = {customLevels[2]}</div>
          <div>Step 5: Class = {customLevels[3]}</div>
          <div>Step 6: Order = {customLevels[4]}, Family = {customLevels[5]}</div>
          <div>Step 7: Genus = {customLevels[6]}, Species = {customLevels[7]}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Domain → Kingdom → Phylum → Class → Order → Family → Genus → Species. Each level groups by shared characteristics.
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Selected system: <b>{active ? active.name : '?'}</b> {active ? '' : '(click a system above)'}</div>
          <div>Step 2: Main organs: {active ? active.organs.join(', ') : '?'}</div>
          <div>Step 3: Function: {active ? active.function : '?'}</div>
          <div>Step 4: Fun fact: {active ? active.funFact : '?'}</div>
          <div>Step 5: Find connections to OTHER systems (e.g., {active ? active.name + ' ↔ circulatory/nervous' : '?'})</div>
          <div>Step 6: No system works alone — they're all <b>interconnected</b></div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Systems work together: circulatory transports oxygen from respiratory, nutrients from digestive. No system works alone.
      </div>
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Ecosystem: <b>{data.label}</b> | Selected: <b>{selectedOrg ? orgMap[selectedOrg]?.name : 'none'}</b> {selectedOrg ? '(' + LEVEL_LABELS[orgMap[selectedOrg].level] + ')' : '(click an organism)'}</div>
          <div>Step 2: Producers ({data.organisms.filter(o => o.level === 'producer').length}): {data.organisms.filter(o => o.level === 'producer').map(o => o.name).join(', ')}</div>
          <div>Step 3: Primary consumers ({data.organisms.filter(o => o.level === 'primary').length}): {data.organisms.filter(o => o.level === 'primary').map(o => o.name).join(', ')}</div>
          <div>Step 4: Secondary consumers ({data.organisms.filter(o => o.level === 'secondary').length}): {data.organisms.filter(o => o.level === 'secondary').map(o => o.name).join(', ')}</div>
          <div>Step 5: Arrows show energy FLOW direction {selectedOrg ? '— ' + orgMap[selectedOrg]?.name + ' has ' + relatedConns.length + ' connection(s)' : ''}</div>
          <div>Step 6: Only ~10% transfers per level — limits chain length</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Energy flows one direction: sun → producers → consumers → decomposers. Only ~10% transfers per level — why food chains are short.
      </div>
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Input sequence: {seq.length > 20 ? seq.slice(0, 20) + '...' : seq}</div>
          <div>Step 2: {mode === 'none' ? 'Click Replicate or Transcribe' : mode === 'replicate' ? 'Replication mode: building complementary strand' : 'Transcription mode: building mRNA (T→U)'}</div>
          <div>Step 3: Base pairing: A↔T, G↔C {mode === 'transcribe' ? '(T→U in RNA)' : ''}</div>
          <div>Step 4: {mode === 'replicate' ? 'Result: see complement strand above' : mode === 'transcribe' ? 'Result: see mRNA strand above' : 'Result will appear here'}</div>
          <div>Step 5: Amino acids link → protein</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Central Dogma: DNA → RNA → Protein. Base pairing (A-T, G-C) ensures faithful copying. One wrong base = mutation.
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Generation <b>{gen}</b> | Population: <b>{bugs.length}</b> | Environment hue: <b>{envHue}°</b></div>
          <div>Step 2: Trait stats — Mean: <b>{meanHue.toFixed(0)}°</b>, Avg fitness: <b>{meanFitness.toFixed(0)}</b>/360, Best: <b>{bestFit.toFixed(0)}</b>/360</div>
          <div>Step 3: Bugs closer to env hue {envHue}° = better camouflage = survive</div>
          <div>Step 4: Click "Next Generation" — top 15 survive + 5 mutated offspring (pop resets to 20)</div>
          <div>Step 5: Favorable color (near {envHue}°) becomes MORE common each generation</div>
          <div>Step 6: No goal — just what works in environment hue <b>{envHue}°</b></div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Variation exists → environment selects → favorable traits spread. No goal — just what works in that environment.
      </div>
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Mode: {mode} ({mode === 'mitosis' ? 'produces 2 identical cells' : 'produces 4 different cells'})</div>
          <div>Step 2: Current phase: {MITOSIS_PHASES[step]?.name || MEIOSIS_PHASES[step]?.name || 'Unknown'} (step {step + 1})</div>
          <div>Step 3: {step >= 1 ? 'Prophase: chromosomes condense ✓' : 'Next: Prophase — chromosomes condense'}</div>
          <div>Step 4: {step >= 2 ? 'Metaphase: chromosomes align ✓' : 'Next: Metaphase — align at center'}</div>
          <div>Step 5: {step >= 3 ? 'Anaphase: chromatids separate ✓' : 'Next: Anaphase — separate to poles'}</div>
          <div>Step 6: {mode === 'mitosis' ? 'Result: 2 identical diploid cells' : 'Result: 4 different haploid cells'}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Mitosis: 1→2 identical (growth). Meiosis: 1→4 different (sperm/egg). Meiosis shuffles genetics — why siblings differ.
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Photosynthesis: 6CO₂ + 6H₂O + <b>{lightIntensity}%</b> light → C₆H₁₂O₆ + 6O₂</div>
          <div>Step 2: Selected part: <b>{selPart ? selPart.label : '?'}</b> {selPart ? '— ' + selPart.desc : '(click any part in either diagram)'}</div>
          <div>Step 3: Chloroplasts capture light energy (intensity: <b>{lightIntensity}%</b>) in chlorophyll</div>
          <div>Step 4: Water is split → oxygen released, hydrogen used</div>
          <div>Step 5: CO₂ is fixed into glucose (Calvin cycle)</div>
          <div>Step 6: Respiration: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP</div>
          <div>Step 7: They're OPPOSITES — the energy <b>cycle of life</b></div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Photosynthesis stores energy (6CO₂+6H₂O+light→glucose+6O₂). Respiration releases it (reverse). They're the energy cycle of life.
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Selected: <b>{selPart ? selPart.name : '?'}</b> {selPart ? '(' + selPart.system + ')' : '(click a body part on the figure)'}</div>
          <div>Step 2: Function: {selPart ? selPart.function : '?'}</div>
          <div>Step 3: Fun fact: {selPart ? selPart.fact : '?'}</div>
          <div>Step 4: Find where exchange happens (e.g., lungs for O₂/CO₂, intestines for nutrients)</div>
          <div>Step 5: Homeostasis = maintaining stable internal conditions</div>
          <div>Step 6: Feedback loops: sensor → control center → <b>effector</b></div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Homeostasis keeps internal conditions stable. When one system fails, others compensate — until they can't.
      </div>
</div>
  )
}

// ============================================================
// 11. HabitatSorter (K-5)
// ============================================================

const HABITATS = [
  { id: 'forest', name: 'Forest', emoji: '🌳', color: '#16a34a' },
  { id: 'ocean', name: 'Ocean', emoji: '🌊', color: '#0284c7' },
  { id: 'desert', name: 'Desert', emoji: '🏜️', color: '#d97706' },
  { id: 'arctic', name: 'Arctic', emoji: '❄️', color: '#0891b2' },
]

const ANIMALS = [
  { id: 'fish', name: 'Fish', emoji: '🐟', habitat: 'ocean', hint: 'Gills breathe underwater; fins swim' },
  { id: 'frog', name: 'Frog', emoji: '🐸', habitat: 'forest', hint: 'Moist skin, lays eggs in ponds' },
  { id: 'bird', name: 'Bird', emoji: '🐦', habitat: 'forest', hint: 'Builds nests in trees' },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', habitat: 'forest', hint: 'Burrows in soil, eats plants' },
  { id: 'deer', name: 'Deer', emoji: '🦌', habitat: 'forest', hint: 'Long legs to run, eats leaves' },
  { id: 'bear', name: 'Bear', emoji: '🐻', habitat: 'forest', hint: 'Thick fur, dens in woods' },
  { id: 'camel', name: 'Camel', emoji: '🐫', habitat: 'desert', hint: 'Humps store fat, needs little water' },
  { id: 'snake', name: 'Snake', emoji: '🐍', habitat: 'desert', hint: 'Scales hold moisture, burrows in sand' },
  { id: 'penguin', name: 'Penguin', emoji: '🐧', habitat: 'arctic', hint: 'Thick fat and feathers for cold' },
  { id: 'shark', name: 'Shark', emoji: '🦈', habitat: 'ocean', hint: 'Gills, streamlined body, sharp teeth' },
  { id: 'squirrel', name: 'Squirrel', emoji: '🐿️', habitat: 'forest', hint: 'Climbs trees, gathers nuts' },
  { id: 'butterfly', name: 'Butterfly', emoji: '🦋', habitat: 'forest', hint: 'Lays eggs on leaves, drinks nectar' },
]

export function HabitatSorter({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [placements, setPlacements] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [lastPlacement, setLastPlacement] = useState<{ animal: string; habitat: string; correct: boolean; correctHabitat: string } | null>(null)

  const sortedCount = Object.keys(placements).length
  const correctCount = Object.entries(placements).filter(([aid, hid]) => ANIMALS.find(a => a.id === aid)?.habitat === hid).length
  const selectedAnimal = ANIMALS.find(a => a.id === selected)

  const handleAnimalClick = (aid: string) => {
    if (placements[aid]) return
    setSelected(selected === aid ? null : aid)
  }

  const handleHabitatClick = (hid: string) => {
    if (!selected) return
    const animal = ANIMALS.find(a => a.id === selected)
    if (!animal) return
    const correct = animal.habitat === hid
    setPlacements({ ...placements, [selected]: hid })
    setLastPlacement({ animal: animal.name, habitat: HABITATS.find(h => h.id === hid)?.name || hid, correct, correctHabitat: HABITATS.find(h => h.id === animal.habitat)?.name || animal.habitat })
    setSelected(null)
  }

  const reset = () => {
    setPlacements({})
    setSelected(null)
    setLastPlacement(null)
  }

  return (
    <div style={{ fontSize: 11, color: s.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 10, flexWrap: 'wrap', gap: 4 }}>
        <span>Sorted: <b style={{ color: s.bright }}>{sortedCount}/12</b></span>
        <span>✓ <b style={{ color: '#22c55e' }}>{correctCount}</b> | ✗ <b style={{ color: '#ef4444' }}>{sortedCount - correctCount}</b></span>
        <button onClick={reset} style={s.btn(false)}>Reset</button>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: s.text, marginBottom: 3 }}>Animals — click to select</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
          {ANIMALS.map(a => {
            const placed = placements[a.id]
            const correct = placed && placed === a.habitat
            const wrong = placed && placed !== a.habitat
            const isSelected = selected === a.id
            return (
              <button key={a.id} onClick={() => handleAnimalClick(a.id)} disabled={!!placed} style={{
                padding: '4px 2px', fontSize: 10, cursor: placed ? 'default' : 'pointer',
                background: correct ? 'rgba(34,197,94,0.2)' : wrong ? 'rgba(239,68,68,0.2)' : isSelected ? 'rgba(167,139,250,0.2)' : s.bg,
                border: '1px solid ' + (correct ? 'rgba(34,197,94,0.5)' : wrong ? 'rgba(239,68,68,0.5)' : isSelected ? 'rgba(167,139,250,0.5)' : s.border),
                color: s.bright, borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <span style={{ fontSize: 18 }}>{a.emoji}</span>
                <span style={{ fontSize: 8, opacity: placed ? 0.5 : 1 }}>{a.name}{correct ? ' ✓' : wrong ? ' ✗' : ''}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: s.text, marginBottom: 3 }}>{selectedAnimal ? `Click a habitat for ${selectedAnimal.name}` : 'Habitats — select an animal first'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
          {HABITATS.map(h => {
            const placedHere = Object.entries(placements).filter(([, hid]) => hid === h.id).map(([aid]) => ANIMALS.find(a => a.id === aid)!)
            return (
              <button key={h.id} onClick={() => handleHabitatClick(h.id)} disabled={!selected} style={{
                padding: 4, cursor: selected ? 'pointer' : 'default',
                background: s.bg, border: '1px solid ' + (selected ? h.color : s.border),
                borderRadius: 4, opacity: selected ? 1 : 0.6, textAlign: 'left',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: h.color }}>{h.emoji} {h.name}</div>
                <div style={{ fontSize: 12, marginTop: 2, minHeight: 16, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {placedHere.length === 0 ? <span style={{ fontSize: 9, opacity: 0.4 }}>—</span> : placedHere.map(a => {
                    const correct = a.habitat === h.id
                    return <span key={a.id} style={{ fontSize: 14, opacity: correct ? 1 : 0.5 }} title={a.name + (correct ? ' ✓' : ' ✗')}>{a.emoji}<span style={{ fontSize: 8 }}>{correct ? '✓' : '✗'}</span></span>
                  })}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Sorted <b>{sortedCount}/12</b> animals into habitats</div>
        <div>Step 2: Correct: <b style={{ color: '#22c55e' }}>{correctCount}</b> | Incorrect: <b style={{ color: '#ef4444' }}>{sortedCount - correctCount}</b></div>
        <div>Step 3: {selectedAnimal ? <>Placing <b>{selectedAnimal.name}</b> — think: where does it find food and shelter?</> : 'Click an animal, then click a habitat'}</div>
        <div>Step 4: {selectedAnimal ? <>{selectedAnimal.name}: {selectedAnimal.hint}</> : 'Each habitat has unique climate and resources'}</div>
        <div>Step 5: {lastPlacement ? <>Last: <b>{lastPlacement.animal}</b> → {lastPlacement.habitat} {lastPlacement.correct ? '✓' : '✗ (correct: ' + lastPlacement.correctHabitat + ')'}</> : 'Start sorting!'}</div>
        <div>Step 6: Animals are adapted to their habitat — body parts help them survive there</div>
      </div>

      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> A habitat gives an animal what it needs — food, water, shelter, and the right climate. Body parts (adaptations) match the habitat: fur for cold, gills for water, humps for deserts.
      </div>
    </div>
  )
}

// ============================================================
// 12. LifeCycleBuilder (K-5)
// ============================================================

const LIFE_CYCLES: Record<string, { name: string; stages: { id: string; name: string; emoji: string }[] }> = {
  Frog: {
    name: 'Frog',
    stages: [
      { id: 'egg', name: 'Egg', emoji: '🥚' },
      { id: 'tadpole', name: 'Tadpole', emoji: '🐟' },
      { id: 'froglet', name: 'Froglet', emoji: '🐸' },
      { id: 'frog', name: 'Adult Frog', emoji: '🐸' },
    ],
  },
  Butterfly: {
    name: 'Butterfly',
    stages: [
      { id: 'egg', name: 'Egg', emoji: '🥚' },
      { id: 'caterpillar', name: 'Caterpillar', emoji: '🐛' },
      { id: 'chrysalis', name: 'Chrysalis', emoji: '🟤' },
      { id: 'butterfly', name: 'Butterfly', emoji: '🦋' },
    ],
  },
  Plant: {
    name: 'Plant',
    stages: [
      { id: 'seed', name: 'Seed', emoji: '🌰' },
      { id: 'sprout', name: 'Sprout', emoji: '🌱' },
      { id: 'seedling', name: 'Seedling', emoji: '🌿' },
      { id: 'adult', name: 'Adult Plant', emoji: '🌳' },
      { id: 'flower', name: 'Flower', emoji: '🌸' },
      { id: 'fruit', name: 'Fruit', emoji: '🍎' },
    ],
  },
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp
  }
  return a
}

export function LifeCycleBuilder({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [cycleName, setCycleName] = useState<string>('Frog')
  const [shuffled, setShuffled] = useState(() => shuffle(LIFE_CYCLES.Frog.stages))
  const [placed, setPlaced] = useState<string[]>([])
  const [lastAction, setLastAction] = useState<'correct' | 'wrong' | null>(null)
  const [wrongId, setWrongId] = useState<string | null>(null)

  const cycle = LIFE_CYCLES[cycleName]
  const totalStages = cycle.stages.length
  const placedCount = placed.length
  const currentStageName = placedCount < totalStages ? cycle.stages[placedCount].name : null
  const complete = placedCount === totalStages

  const selectCycle = (name: string) => {
    setCycleName(name)
    setShuffled(shuffle(LIFE_CYCLES[name].stages))
    setPlaced([])
    setLastAction(null)
    setWrongId(null)
  }

  const handleStageClick = (stageId: string) => {
    if (placed.includes(stageId) || complete) return
    const expectedId = cycle.stages[placedCount].id
    if (stageId === expectedId) {
      setPlaced([...placed, stageId])
      setLastAction('correct')
      setWrongId(null)
    } else {
      setLastAction('wrong')
      setWrongId(stageId)
      setTimeout(() => setWrongId(null), 500)
    }
  }

  const reset = () => {
    setShuffled(shuffle(LIFE_CYCLES[cycleName].stages))
    setPlaced([])
    setLastAction(null)
    setWrongId(null)
  }

  return (
    <div style={{ fontSize: 11, color: s.text }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
        {Object.keys(LIFE_CYCLES).map(name => (
          <button key={name} onClick={() => selectCycle(name)} style={s.btn(cycleName === name)}>{name}</button>
        ))}
        <button onClick={reset} style={s.btn(false)}>Shuffle</button>
      </div>

      <div style={{ padding: 6, background: s.bg, borderRadius: 4, border: '1px solid ' + s.border, marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: s.text, marginBottom: 4 }}>Build the Life Cycle</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, justifyContent: 'center' }}>
          {cycle.stages.map((stage, i) => {
            const placedIdx = placed.indexOf(stage.id)
            const isPlaced = placedIdx !== -1
            const isNext = !isPlaced && i === placedCount
            return (
              <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <div style={{
                  padding: '4px 5px', borderRadius: 4, minWidth: 44, textAlign: 'center',
                  background: isPlaced ? 'rgba(34,197,94,0.2)' : isNext ? 'rgba(167,139,250,0.15)' : 'transparent',
                  border: '1px solid ' + (isPlaced ? 'rgba(34,197,94,0.5)' : isNext ? 'rgba(167,139,250,0.4)' : s.border),
                }}>
                  <div style={{ fontSize: 18 }}>{isPlaced || isNext ? stage.emoji : '❓'}</div>
                  <div style={{ fontSize: 8, color: isPlaced ? '#22c55e' : isNext ? '#a78bfa' : s.text }}>{isPlaced ? stage.name : isNext ? 'next' : '?'}</div>
                </div>
                {i < cycle.stages.length - 1 && <span style={{ color: s.text, fontSize: 10 }}>→</span>}
              </div>
            )
          })}
          {complete && <span style={{ color: '#22c55e', fontSize: 14, marginLeft: 2 }} title="cycle repeats">↻</span>}
        </div>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: s.text, marginBottom: 3 }}>Click stages in order</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
          {shuffled.map(stage => {
            const isPlaced = placed.includes(stage.id)
            const isWrong = wrongId === stage.id
            return (
              <button key={stage.id} onClick={() => handleStageClick(stage.id)} disabled={isPlaced || complete} style={{
                padding: '6px 2px', fontSize: 10, cursor: isPlaced || complete ? 'default' : 'pointer',
                background: isPlaced ? 'rgba(34,197,94,0.15)' : isWrong ? 'rgba(239,68,68,0.3)' : s.bg,
                border: '1px solid ' + (isPlaced ? 'rgba(34,197,94,0.4)' : isWrong ? 'rgba(239,68,68,0.6)' : s.border),
                color: s.bright, borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center',
                transform: isWrong ? 'translateX(-3px)' : 'none',
                transition: 'transform 0.1s',
                opacity: isPlaced ? 0.4 : 1,
              }}>
                <span style={{ fontSize: 18 }}>{stage.emoji}</span>
                <span style={{ fontSize: 8 }}>{stage.name}</span>
                {isPlaced && <span style={{ fontSize: 9, color: '#22c55e' }}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Life cycle: <b>{cycleName}</b></div>
        <div>Step 2: Stages placed: <b>{placedCount}/{totalStages}</b></div>
        <div>Step 3: Current stage: <b>{currentStageName || '✓ complete'}</b></div>
        <div>Step 4: {lastAction === 'correct' ? '✓ Correct! That comes next in the cycle.' : lastAction === 'wrong' ? '✗ Wrong — try again. Think about what comes BEFORE this stage.' : 'Click stages in order from start to finish'}</div>
        <div>Step 5: {complete ? 'Complete! The cycle repeats — adults lay eggs to start over.' : 'Next: think about what the previous stage turns INTO'}</div>
        <div>Step 6: Life cycles are circular — the adult produces eggs/seeds, starting the cycle again</div>
      </div>

      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Metamorphosis (frog, butterfly) is a complete body transformation. Plants have a cyclical life — seeds grow into plants that make more seeds. The cycle never ends.
      </div>
    </div>
  )
}

// ============================================================
// 13. BasicNeedsSorter (K-5)
// ============================================================

const BASIC_NEEDS = [
  { id: 'food', name: 'Food', emoji: '🍎', color: '#ef4444', desc: 'Energy & nutrients' },
  { id: 'water', name: 'Water', emoji: '💧', color: '#0284c7', desc: 'Hydration' },
  { id: 'air', name: 'Air', emoji: '💨', color: '#06b6d4', desc: 'Oxygen to breathe' },
  { id: 'shelter', name: 'Shelter', emoji: '🏠', color: '#8b5cf6', desc: 'Protection' },
  { id: 'sunlight', name: 'Sunlight', emoji: '☀️', color: '#f59e0b', desc: 'Energy for plants' },
]

const NEED_ITEMS = [
  { id: 'apple', name: 'Apple', emoji: '🍎', need: 'food' },
  { id: 'water_bottle', name: 'Water Bottle', emoji: '💧', need: 'water' },
  { id: 'hamburger', name: 'Hamburger', emoji: '🍔', need: 'food' },
  { id: 'ac', name: 'Air Conditioner', emoji: '❄️', need: 'shelter' },
  { id: 'sunlight', name: 'Sunlight', emoji: '☀️', need: 'sunlight' },
  { id: 'house', name: 'House', emoji: '🏠', need: 'shelter' },
  { id: 'oxygen', name: 'Oxygen', emoji: '💨', need: 'air' },
  { id: 'sweater', name: 'Sweater', emoji: '🧥', need: 'shelter' },
  { id: 'tree', name: 'Tree', emoji: '🌳', need: 'air' },
  { id: 'blanket', name: 'Blanket', emoji: '🛏️', need: 'shelter' },
  { id: 'rain', name: 'Rain', emoji: '🌧️', need: 'water' },
  { id: 'soil', name: 'Soil', emoji: '🌱', need: 'food' },
]

export function BasicNeedsSorter({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [placements, setPlacements] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [lastPlacement, setLastPlacement] = useState<{ item: string; need: string; correct: boolean; correctNeed: string } | null>(null)

  const sortedCount = Object.keys(placements).length
  const correctCount = Object.entries(placements).filter(([iid, nid]) => NEED_ITEMS.find(i => i.id === iid)?.need === nid).length
  const selectedItem = NEED_ITEMS.find(i => i.id === selected)

  const handleItemClick = (iid: string) => {
    if (placements[iid]) return
    setSelected(selected === iid ? null : iid)
  }

  const handleNeedClick = (nid: string) => {
    if (!selected) return
    const item = NEED_ITEMS.find(i => i.id === selected)
    if (!item) return
    const correct = item.need === nid
    setPlacements({ ...placements, [selected]: nid })
    setLastPlacement({ item: item.name, need: BASIC_NEEDS.find(n => n.id === nid)?.name || nid, correct, correctNeed: BASIC_NEEDS.find(n => n.id === item.need)?.name || item.need })
    setSelected(null)
  }

  const reset = () => {
    setPlacements({})
    setSelected(null)
    setLastPlacement(null)
  }

  return (
    <div style={{ fontSize: 11, color: s.text }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 10, flexWrap: 'wrap', gap: 4 }}>
        <span>Sorted: <b style={{ color: s.bright }}>{sortedCount}/12</b></span>
        <span>✓ <b style={{ color: '#22c55e' }}>{correctCount}</b> | ✗ <b style={{ color: '#ef4444' }}>{sortedCount - correctCount}</b></span>
        <button onClick={reset} style={s.btn(false)}>Reset</button>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: s.text, marginBottom: 3 }}>Items — click to select</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
          {NEED_ITEMS.map(it => {
            const placed = placements[it.id]
            const correct = placed && placed === it.need
            const wrong = placed && placed !== it.need
            const isSelected = selected === it.id
            return (
              <button key={it.id} onClick={() => handleItemClick(it.id)} disabled={!!placed} style={{
                padding: '4px 2px', fontSize: 9, cursor: placed ? 'default' : 'pointer',
                background: correct ? 'rgba(34,197,94,0.2)' : wrong ? 'rgba(239,68,68,0.2)' : isSelected ? 'rgba(167,139,250,0.2)' : s.bg,
                border: '1px solid ' + (correct ? 'rgba(34,197,94,0.5)' : wrong ? 'rgba(239,68,68,0.5)' : isSelected ? 'rgba(167,139,250,0.5)' : s.border),
                color: s.bright, borderRadius: 3, display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <span style={{ fontSize: 16 }}>{it.emoji}</span>
                <span style={{ fontSize: 7, opacity: placed ? 0.5 : 1 }}>{it.name}</span>
                {placed && <span style={{ fontSize: 8 }}>{correct ? '✓' : '✗'}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: s.text, marginBottom: 3 }}>{selectedItem ? `Click a need for ${selectedItem.name}` : 'Basic Needs — select an item first'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2 }}>
          {BASIC_NEEDS.map(n => {
            const placedHere = Object.entries(placements).filter(([, nid]) => nid === n.id).map(([iid]) => NEED_ITEMS.find(i => i.id === iid)!)
            return (
              <button key={n.id} onClick={() => handleNeedClick(n.id)} disabled={!selected} style={{
                padding: 3, cursor: selected ? 'pointer' : 'default',
                background: s.bg, border: '1px solid ' + (selected ? n.color : s.border),
                borderRadius: 4, opacity: selected ? 1 : 0.6, textAlign: 'center',
              }}>
                <div style={{ fontSize: 16 }}>{n.emoji}</div>
                <div style={{ fontSize: 8, fontWeight: 700, color: n.color }}>{n.name}</div>
                <div style={{ fontSize: 11, minHeight: 14, marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                  {placedHere.length === 0 ? <span style={{ fontSize: 8, opacity: 0.4 }}>—</span> : placedHere.map(i => {
                    const correct = i.need === n.id
                    return <span key={i.id} style={{ fontSize: 13, opacity: correct ? 1 : 0.5 }}>{i.emoji}</span>
                  })}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Sorted <b>{sortedCount}/12</b> items into need categories</div>
        <div>Step 2: Correct: <b style={{ color: '#22c55e' }}>{correctCount}</b> | Need to re-sort: <b style={{ color: '#ef4444' }}>{sortedCount - correctCount}</b></div>
        <div>Step 3: {selectedItem ? <>Placing "<b>{selectedItem.name}</b>" — which basic need does it satisfy?</> : 'Click an item, then click a need category'}</div>
        <div>Step 4: 5 basic needs: Food (energy), Water (hydration), Air (oxygen), Shelter (protection), Sunlight (energy for plants)</div>
        <div>Step 5: {lastPlacement ? <>Last: <b>{lastPlacement.item}</b> → {lastPlacement.need} {lastPlacement.correct ? '✓' : '✗ (correct: ' + lastPlacement.correctNeed + ')'}</> : 'Start sorting!'}</div>
        <div>Step 6: Without any one of these needs, living things cannot survive</div>
      </div>

      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> All living things have the same basic needs — food, water, air, shelter, and energy. Different organisms meet these needs in different ways, but no need can be skipped.
      </div>
    </div>
  )
}

// ============================================================
// 14. TraitInheritanceExplorer (K-5)
// ============================================================

const TRAITS = [
  { id: 'eye', name: 'Eye Color', domName: 'Brown', domColor: '#8B4513', recName: 'Blue', recColor: '#3b82f6' },
  { id: 'hair', name: 'Hair Color', domName: 'Brown', domColor: '#6b4423', recName: 'Blonde', recColor: '#fde047' },
  { id: 'flower', name: 'Flower Color', domName: 'Purple', domColor: '#a855f7', recName: 'White', recColor: '#e5e7eb' },
  { id: 'seed', name: 'Seed Shape', domName: 'Round', domColor: '#22c55e', recName: 'Wrinkled', recColor: '#84cc16' },
]

type Geno = 'BB' | 'Bb' | 'bb'

function cycleGeno(g: Geno): Geno {
  return g === 'BB' ? 'Bb' : g === 'Bb' ? 'bb' : 'BB'
}

function genoPheno(g: Geno, dom: string, rec: string): string {
  return g === 'bb' ? rec : dom
}

function allelesOf(g: Geno): ('B' | 'b')[] {
  return g === 'BB' ? ['B', 'B'] : g === 'bb' ? ['b', 'b'] : ['B', 'b']
}

export function TraitInheritanceExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [traitIdx, setTraitIdx] = useState(0)
  const [p1Geno, setP1Geno] = useState<Geno>('Bb')
  const [p2Geno, setP2Geno] = useState<Geno>('bb')
  const [offspring, setOffspring] = useState<{ a1: 'B' | 'b'; a2: 'B' | 'b' } | null>(null)

  const trait = TRAITS[traitIdx]
  const p1Phenotype = genoPheno(p1Geno, trait.domName, trait.recName)
  const p2Phenotype = genoPheno(p2Geno, trait.domName, trait.recName)
  const p1Alleles = allelesOf(p1Geno)
  const p2Alleles = allelesOf(p2Geno)

  const selectTrait = (i: number) => {
    setTraitIdx(i)
    setOffspring(null)
  }

  const makeOffspring = () => {
    const a1 = p1Alleles[Math.floor(Math.random() * 2)]
    const a2 = p2Alleles[Math.floor(Math.random() * 2)]
    setOffspring({ a1, a2 })
  }

  const offspringGeno: Geno | null = offspring ? (
    (offspring.a1 === 'B' && offspring.a2 === 'B') ? 'BB'
      : (offspring.a1 === 'b' && offspring.a2 === 'b') ? 'bb'
        : 'Bb'
  ) : null
  const offspringPheno = offspringGeno ? genoPheno(offspringGeno, trait.domName, trait.recName) : null
  const dominance = offspringGeno ? (offspringGeno === 'bb' ? 0 : 1) : null

  const AlleleCircle = ({ allele, size = 16 }: { allele: 'B' | 'b'; size?: number }) => (
    <span style={{ width: size, height: size, borderRadius: '50%', background: allele === 'B' ? trait.domColor : trait.recColor, border: '1px solid rgba(0,0,0,0.25)', display: 'inline-block', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)' }} />
  )

  const GenoDisplay = ({ g }: { g: Geno }) => (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      <AlleleCircle allele={g[0] === 'B' ? 'B' : 'b'} />
      <AlleleCircle allele={g[1] === 'B' ? 'B' : 'b'} />
    </span>
  )

  return (
    <div style={{ fontSize: 11, color: s.text }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
        {TRAITS.map((t, i) => (
          <button key={t.id} onClick={() => selectTrait(i)} style={s.btn(traitIdx === i)}>{t.name}</button>
        ))}
      </div>

      {/* Parents */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[{ label: 'Parent 1', geno: p1Geno, setGeno: setP1Geno, pheno: p1Phenotype },
          { label: 'Parent 2', geno: p2Geno, setGeno: setP2Geno, pheno: p2Phenotype }].map((p, i) => (
          <div key={i} style={{ flex: 1, padding: 6, background: s.bg, borderRadius: 4, border: '1px solid ' + s.border, textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: s.text }}>{p.label}</div>
            <div style={{ marginTop: 3 }}><GenoDisplay g={p.geno} /></div>
            <div style={{ fontSize: 10, color: s.bright, marginTop: 2 }}>{p.pheno}</div>
            <div style={{ fontSize: 8, color: s.text, marginTop: 1 }}>({p.geno})</div>
            <button onClick={() => { setOffspring(null); p.setGeno(cycleGeno(p.geno)) }} style={{ ...s.btn(false), marginTop: 4, fontSize: 9 }}>Change alleles</button>
          </div>
        ))}
      </div>

      {/* Picture Punnett square */}
      <div style={{ padding: 6, background: s.bg, borderRadius: 4, border: '1px solid ' + s.border, marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: s.text, marginBottom: 4 }}>Picture Punnett — all 4 possible offspring</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', gap: 3, justifyContent: 'center', alignItems: 'center' }}>
          <div></div>
          <div style={{ textAlign: 'center' }}><AlleleCircle allele={p2Alleles[0]} /></div>
          <div style={{ textAlign: 'center' }}><AlleleCircle allele={p2Alleles[1]} /></div>
          <div style={{ textAlign: 'center' }}><AlleleCircle allele={p1Alleles[0]} /></div>
          <div style={{ textAlign: 'center', padding: 3, borderRadius: 3, background: 'rgba(167,139,250,0.06)', border: '1px solid ' + s.border }}>
            <span style={{ display: 'inline-flex', gap: 1 }}><AlleleCircle allele={p1Alleles[0]} size={13} /><AlleleCircle allele={p2Alleles[0]} size={13} /></span>
          </div>
          <div style={{ textAlign: 'center', padding: 3, borderRadius: 3, background: 'rgba(167,139,250,0.06)', border: '1px solid ' + s.border }}>
            <span style={{ display: 'inline-flex', gap: 1 }}><AlleleCircle allele={p1Alleles[0]} size={13} /><AlleleCircle allele={p2Alleles[1]} size={13} /></span>
          </div>
          <div style={{ textAlign: 'center' }}><AlleleCircle allele={p1Alleles[1]} /></div>
          <div style={{ textAlign: 'center', padding: 3, borderRadius: 3, background: 'rgba(167,139,250,0.06)', border: '1px solid ' + s.border }}>
            <span style={{ display: 'inline-flex', gap: 1 }}><AlleleCircle allele={p1Alleles[1]} size={13} /><AlleleCircle allele={p2Alleles[0]} size={13} /></span>
          </div>
          <div style={{ textAlign: 'center', padding: 3, borderRadius: 3, background: 'rgba(167,139,250,0.06)', border: '1px solid ' + s.border }}>
            <span style={{ display: 'inline-flex', gap: 1 }}><AlleleCircle allele={p1Alleles[1]} size={13} /><AlleleCircle allele={p2Alleles[1]} size={13} /></span>
          </div>
        </div>
        <div style={{ fontSize: 8, color: s.text, marginTop: 4, textAlign: 'center' }}>Top row = Parent 2 alleles | Left col = Parent 1 alleles</div>
      </div>

      {/* Make Offspring */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 6, alignItems: 'center' }}>
        <button onClick={makeOffspring} style={{ ...s.btn(true), padding: '4px 8px', fontSize: 11 }}>🎲 Make Offspring</button>
        {offspring && (
          <div style={{ flex: 1, padding: 6, background: 'rgba(34,197,94,0.1)', borderRadius: 4, border: '1px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-flex', gap: 1 }}>
              <AlleleCircle allele={offspring.a1} />
              <AlleleCircle allele={offspring.a2} />
            </span>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#22c55e' }}>Offspring</div>
              <div style={{ fontSize: 10, color: s.bright }}>{offspringPheno}</div>
              <div style={{ fontSize: 8, color: s.text }}>({offspringGeno})</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Trait: <b>{trait.name}</b> | Parent 1: {p1Phenotype} ({p1Geno}) | Parent 2: {p2Phenotype} ({p2Geno})</div>
        <div>Step 2: Each parent gives ONE allele to the offspring (random which one)</div>
        <div>Step 3: Parent 1 gives: <b>{offspring ? offspring.a1 : '?'}</b> | Parent 2 gives: <b>{offspring ? offspring.a2 : '?'}</b></div>
        <div>Step 4: Offspring genotype: <b>{offspringGeno || '— click "Make Offspring"'}</b></div>
        <div>Step 5: Offspring phenotype: <b>{offspringPheno || '—'}</b> {dominance !== null ? (dominance > 0 ? '(dominant allele shows)' : '(both recessive → recessive shows)') : ''}</div>
        <div>Step 6: Dominant alleles mask recessive ones — that's why traits can "skip" generations</div>
      </div>

      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Parents pass alleles to offspring — one from each. Dominant alleles always show; recessive alleles hide until two copies meet. This is heredity, Mendel's great discovery.
      </div>
    </div>
  )
}

// ============================================================
// 15. FoodChainBuilder (K-5)
// ============================================================

const FOOD_CHAIN_HABITATS: Record<string, { name: string; emoji: string; organisms: { id: string; name: string; emoji: string; role: string; hint: string }[] }> = {
  Forest: {
    name: 'Forest', emoji: '🌳',
    organisms: [
      { id: 'tree', name: 'Tree', emoji: '🌳', role: 'Producer', hint: 'Makes food from sunlight' },
      { id: 'rabbit', name: 'Rabbit', emoji: '🐰', role: 'Primary Consumer', hint: 'Eats plants (herbivore)' },
      { id: 'fox', name: 'Fox', emoji: '🦊', role: 'Secondary Consumer', hint: 'Eats rabbits (carnivore)' },
      { id: 'eagle', name: 'Eagle', emoji: '🦅', role: 'Tertiary Consumer', hint: 'Top predator (eats foxes)' },
    ],
  },
  Ocean: {
    name: 'Ocean', emoji: '🌊',
    organisms: [
      { id: 'algae', name: 'Algae', emoji: '🌿', role: 'Producer', hint: 'Makes food from sunlight' },
      { id: 'fish', name: 'Small Fish', emoji: '🐟', role: 'Primary Consumer', hint: 'Eats algae (herbivore)' },
      { id: 'squid', name: 'Squid', emoji: '🦑', role: 'Secondary Consumer', hint: 'Eats small fish' },
      { id: 'shark', name: 'Shark', emoji: '🦈', role: 'Tertiary Consumer', hint: 'Top predator' },
    ],
  },
  Grassland: {
    name: 'Grassland', emoji: '🌾',
    organisms: [
      { id: 'grass', name: 'Grass', emoji: '🌾', role: 'Producer', hint: 'Makes food from sunlight' },
      { id: 'zebra', name: 'Zebra', emoji: '🦓', role: 'Primary Consumer', hint: 'Eats grass (herbivore)' },
      { id: 'cheetah', name: 'Cheetah', emoji: '🐆', role: 'Secondary Consumer', hint: 'Eats zebras (carnivore)' },
      { id: 'lion', name: 'Lion', emoji: '🦁', role: 'Tertiary Consumer', hint: 'Top predator' },
    ],
  },
  Pond: {
    name: 'Pond', emoji: '🪷',
    organisms: [
      { id: 'weed', name: 'Pond Weed', emoji: '🌿', role: 'Producer', hint: 'Makes food from sunlight' },
      { id: 'tadpole', name: 'Tadpole', emoji: '🐸', role: 'Primary Consumer', hint: 'Eats pond weed' },
      { id: 'frog', name: 'Frog', emoji: '🐸', role: 'Secondary Consumer', hint: 'Eats tadpoles/insects' },
      { id: 'heron', name: 'Heron', emoji: '🦩', role: 'Tertiary Consumer', hint: 'Top predator (eats frogs)' },
    ],
  },
}

export function FoodChainBuilder({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [habitatName, setHabitatName] = useState<string>('Forest')
  const [shuffled, setShuffled] = useState(() => shuffle(FOOD_CHAIN_HABITATS.Forest.organisms))
  const [placed, setPlaced] = useState<string[]>([])
  const [lastOrganism, setLastOrganism] = useState<{ name: string; role: string } | null>(null)
  const [wrongId, setWrongId] = useState<string | null>(null)

  const habitat = FOOD_CHAIN_HABITATS[habitatName]
  const totalOrganisms = habitat.organisms.length
  const placedCount = placed.length
  const chainComplete = placedCount === totalOrganisms
  const nextExpected = !chainComplete ? habitat.organisms[placedCount] : null

  const selectHabitat = (name: string) => {
    setHabitatName(name)
    setShuffled(shuffle(FOOD_CHAIN_HABITATS[name].organisms))
    setPlaced([])
    setLastOrganism(null)
    setWrongId(null)
  }

  const handleOrganismClick = (orgId: string) => {
    if (placed.includes(orgId) || chainComplete) return
    const expectedId = habitat.organisms[placedCount].id
    if (orgId === expectedId) {
      const org = habitat.organisms.find(o => o.id === orgId)!
      setPlaced([...placed, orgId])
      setLastOrganism({ name: org.name, role: org.role })
      setWrongId(null)
    } else {
      setWrongId(orgId)
      setTimeout(() => setWrongId(null), 500)
    }
  }

  const reset = () => {
    setShuffled(shuffle(habitat.organisms))
    setPlaced([])
    setLastOrganism(null)
    setWrongId(null)
  }

  return (
    <div style={{ fontSize: 11, color: s.text }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
        {Object.keys(FOOD_CHAIN_HABITATS).map(name => (
          <button key={name} onClick={() => selectHabitat(name)} style={s.btn(habitatName === name)}>{FOOD_CHAIN_HABITATS[name].emoji} {name}</button>
        ))}
        <button onClick={reset} style={s.btn(false)}>Shuffle</button>
      </div>

      {/* Vertical chain display */}
      <div style={{ padding: 6, background: s.bg, borderRadius: 4, border: '1px solid ' + s.border, marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: s.text, marginBottom: 4 }}>Energy Flow Chain</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 3 }}>
            <span style={{ fontSize: 16 }}>☀️</span>
            <span style={{ fontSize: 9, color: s.bright }}>Sun (energy)</span>
          </div>
          <span style={{ color: s.text, fontSize: 11 }}>↓</span>
          {placed.map((orgId, i) => {
            const org = habitat.organisms.find(o => o.id === orgId)!
            return (
              <div key={orgId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 3 }}>
                  <span style={{ fontSize: 16 }}>{org.emoji}</span>
                  <span style={{ fontSize: 10, color: s.bright }}>{org.name}</span>
                  <span style={{ fontSize: 7, color: s.text }}>({org.role})</span>
                </div>
                {i < placed.length - 1 && <span style={{ color: s.text, fontSize: 11 }}>↓</span>}
              </div>
            )
          })}
          {!chainComplete && placed.length > 0 && <span style={{ color: s.text, fontSize: 11 }}>↓</span>}
          {!chainComplete ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', border: '1px dashed ' + s.border, borderRadius: 3 }}>
              <span style={{ fontSize: 16 }}>❓</span>
              <span style={{ fontSize: 9, color: s.text }}>Next: {nextExpected?.role}</span>
            </div>
          ) : (
            <div style={{ fontSize: 10, color: '#22c55e', marginTop: 4, fontWeight: 700 }}>✓ Chain complete!</div>
          )}
        </div>
      </div>

      {/* Shuffled organisms */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: s.text, marginBottom: 3 }}>Click organisms in order: producer first</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
          {shuffled.map(org => {
            const isPlaced = placed.includes(org.id)
            const isWrong = wrongId === org.id
            return (
              <button key={org.id} onClick={() => handleOrganismClick(org.id)} disabled={isPlaced || chainComplete} style={{
                padding: '4px 2px', fontSize: 10, cursor: isPlaced || chainComplete ? 'default' : 'pointer',
                background: isPlaced ? 'rgba(34,197,94,0.1)' : isWrong ? 'rgba(239,68,68,0.3)' : s.bg,
                border: '1px solid ' + (isPlaced ? 'rgba(34,197,94,0.3)' : isWrong ? 'rgba(239,68,68,0.6)' : s.border),
                color: s.bright, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 3,
                transform: isWrong ? 'translateX(-3px)' : 'none',
                transition: 'transform 0.1s',
                opacity: isPlaced ? 0.4 : 1,
              }}>
                <span style={{ fontSize: 16 }}>{org.emoji}</span>
                <span style={{ fontSize: 9 }}>{org.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Habitat: <b>{habitatName}</b></div>
        <div>Step 2: Chain built: <b>{placedCount}/{totalOrganisms}</b> organisms</div>
        <div>Step 3: {lastOrganism ? <>Added: <b>{lastOrganism.name}</b> ({lastOrganism.role})</> : 'Start with the PRODUCER (a plant)'}</div>
        <div>Step 4: {nextExpected ? <>Next needed: {nextExpected.role} ({nextExpected.hint})</> : 'Complete!'}</div>
        <div>Step 5: {chainComplete ? 'Energy flows: Sun → Plant → Herbivore → Carnivore' : 'Order matters: energy flows from sun to producer to consumer'}</div>
        <div>Step 6: Each link eats the one below — remove one and the chain breaks</div>
      </div>

      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Energy from the sun is captured by plants (producers) and passes up the chain as animals eat each other. Producers make their own food; consumers must eat other organisms to survive.
      </div>
    </div>
  )
}