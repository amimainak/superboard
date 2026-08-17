'use client'

import React, { useState, useMemo } from 'react'

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