'use client'

import React, { useState, useMemo, useCallback, useRef } from 'react'

/* ============================================================
   Shared Styles
   ============================================================ */
const styles = (isDark: boolean) => ({
  bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
  text: isDark ? '#94a3b8' : '#475569',
  bright: isDark ? '#e2e8f0' : '#1e293b',
  input: {
    padding: '3px 6px', borderRadius: 4, fontSize: 11,
    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none' as const,
  },
  btn: (active: boolean) => ({
    padding: '2px 6px', borderRadius: 3, fontSize: 10, cursor: 'pointer' as const,
    background: active ? 'rgba(5,150,105,0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
    border: active ? '1px solid rgba(5,150,105,0.3)' : '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'),
    color: active ? '#34d399' : (isDark ? '#94a3b8' : '#475569'),
  }),
})

/* ============================================================
   Element Data (118 elements)
   ============================================================ */
type Cat = 'metal' | 'nonmetal' | 'metalloid' | 'noble'

interface Elem {
  n: number; s: string; m: number; nm: string; cat: Cat
  r: number; c: number; ec: string; ic: string
}

const ELEMENTS: Elem[] = [
  // Period 1
  { n:1,  s:'H',  m:1.008,  nm:'Hydrogen',    cat:'nonmetal',  r:1, c:1,  ec:'1s1',              ic:'+1, -1' },
  { n:2,  s:'He', m:4.003,  nm:'Helium',      cat:'noble',     r:1, c:18, ec:'1s2',              ic:'0' },
  // Period 2
  { n:3,  s:'Li', m:6.941,  nm:'Lithium',     cat:'metal',     r:2, c:1,  ec:'1s2 2s1',          ic:'+1' },
  { n:4,  s:'Be', m:9.012,  nm:'Beryllium',   cat:'metal',     r:2, c:2,  ec:'1s2 2s2',          ic:'+2' },
  { n:5,  s:'B',  m:10.81,  nm:'Boron',       cat:'metalloid', r:2, c:13, ec:'1s2 2s2 2p1',      ic:'+3' },
  { n:6,  s:'C',  m:12.011, nm:'Carbon',      cat:'nonmetal',  r:2, c:14, ec:'1s2 2s2 2p2',      ic:'+4, -4' },
  { n:7,  s:'N',  m:14.007, nm:'Nitrogen',    cat:'nonmetal',  r:2, c:15, ec:'1s2 2s2 2p3',      ic:'-3, +5' },
  { n:8,  s:'O',  m:15.999, nm:'Oxygen',      cat:'nonmetal',  r:2, c:16, ec:'1s2 2s2 2p4',      ic:'-2' },
  { n:9,  s:'F',  m:18.998, nm:'Fluorine',    cat:'nonmetal',  r:2, c:17, ec:'1s2 2s2 2p5',      ic:'-1' },
  { n:10, s:'Ne', m:20.180, nm:'Neon',        cat:'noble',     r:2, c:18, ec:'1s2 2s2 2p6',      ic:'0' },
  // Period 3
  { n:11, s:'Na', m:22.990, nm:'Sodium',      cat:'metal',     r:3, c:1,  ec:'[Ne] 3s1',          ic:'+1' },
  { n:12, s:'Mg', m:24.305, nm:'Magnesium',   cat:'metal',     r:3, c:2,  ec:'[Ne] 3s2',          ic:'+2' },
  { n:13, s:'Al', m:26.982, nm:'Aluminum',    cat:'metal',     r:3, c:13, ec:'[Ne] 3s2 3p1',      ic:'+3' },
  { n:14, s:'Si', m:28.086, nm:'Silicon',     cat:'metalloid', r:3, c:14, ec:'[Ne] 3s2 3p2',      ic:'+4, -4' },
  { n:15, s:'P',  m:30.974, nm:'Phosphorus',  cat:'nonmetal',  r:3, c:15, ec:'[Ne] 3s2 3p3',      ic:'-3, +3, +5' },
  { n:16, s:'S',  m:32.065, nm:'Sulfur',      cat:'nonmetal',  r:3, c:16, ec:'[Ne] 3s2 3p4',      ic:'-2, +4, +6' },
  { n:17, s:'Cl', m:35.453, nm:'Chlorine',    cat:'nonmetal',  r:3, c:17, ec:'[Ne] 3s2 3p5',      ic:'-1, +5, +7' },
  { n:18, s:'Ar', m:39.948, nm:'Argon',       cat:'noble',     r:3, c:18, ec:'[Ne] 3s2 3p6',      ic:'0' },
  // Period 4
  { n:19, s:'K',  m:39.098, nm:'Potassium',   cat:'metal',     r:4, c:1,  ec:'[Ar] 4s1',          ic:'+1' },
  { n:20, s:'Ca', m:40.078, nm:'Calcium',     cat:'metal',     r:4, c:2,  ec:'[Ar] 4s2',          ic:'+2' },
  { n:21, s:'Sc', m:44.956, nm:'Scandium',    cat:'metal',     r:4, c:3,  ec:'[Ar] 3d1 4s2',      ic:'+3' },
  { n:22, s:'Ti', m:47.867, nm:'Titanium',    cat:'metal',     r:4, c:4,  ec:'[Ar] 3d2 4s2',      ic:'+2, +3, +4' },
  { n:23, s:'V',  m:50.942, nm:'Vanadium',    cat:'metal',     r:4, c:5,  ec:'[Ar] 3d3 4s2',      ic:'+2, +3, +5' },
  { n:24, s:'Cr', m:51.996, nm:'Chromium',    cat:'metal',     r:4, c:6,  ec:'[Ar] 3d5 4s1',      ic:'+2, +3, +6' },
  { n:25, s:'Mn', m:54.938, nm:'Manganese',   cat:'metal',     r:4, c:7,  ec:'[Ar] 3d5 4s2',      ic:'+2, +4, +7' },
  { n:26, s:'Fe', m:55.845, nm:'Iron',        cat:'metal',     r:4, c:8,  ec:'[Ar] 3d6 4s2',      ic:'+2, +3' },
  { n:27, s:'Co', m:58.933, nm:'Cobalt',      cat:'metal',     r:4, c:9,  ec:'[Ar] 3d7 4s2',      ic:'+2, +3' },
  { n:28, s:'Ni', m:58.693, nm:'Nickel',      cat:'metal',     r:4, c:10, ec:'[Ar] 3d8 4s2',      ic:'+2' },
  { n:29, s:'Cu', m:63.546, nm:'Copper',      cat:'metal',     r:4, c:11, ec:'[Ar] 3d10 4s1',     ic:'+1, +2' },
  { n:30, s:'Zn', m:65.380, nm:'Zinc',        cat:'metal',     r:4, c:12, ec:'[Ar] 3d10 4s2',     ic:'+2' },
  { n:31, s:'Ga', m:69.723, nm:'Gallium',     cat:'metal',     r:4, c:13, ec:'[Ar] 3d10 4s2 4p1', ic:'+3' },
  { n:32, s:'Ge', m:72.630, nm:'Germanium',   cat:'metalloid', r:4, c:14, ec:'[Ar] 3d10 4s2 4p2', ic:'+4' },
  { n:33, s:'As', m:74.922, nm:'Arsenic',     cat:'metalloid', r:4, c:15, ec:'[Ar] 3d10 4s2 4p3', ic:'-3, +3, +5' },
  { n:34, s:'Se', m:78.971, nm:'Selenium',    cat:'nonmetal',  r:4, c:16, ec:'[Ar] 3d10 4s2 4p4', ic:'-2, +4, +6' },
  { n:35, s:'Br', m:79.904, nm:'Bromine',     cat:'nonmetal',  r:4, c:17, ec:'[Ar] 3d10 4s2 4p5', ic:'-1, +5' },
  { n:36, s:'Kr', m:83.798, nm:'Krypton',     cat:'noble',     r:4, c:18, ec:'[Ar] 3d10 4s2 4p6', ic:'0' },
  // Period 5
  { n:37, s:'Rb', m:85.468, nm:'Rubidium',    cat:'metal',     r:5, c:1,  ec:'', ic:'+1' },
  { n:38, s:'Sr', m:87.620, nm:'Strontium',   cat:'metal',     r:5, c:2,  ec:'', ic:'+2' },
  { n:39, s:'Y',  m:88.906, nm:'Yttrium',     cat:'metal',     r:5, c:3,  ec:'', ic:'+3' },
  { n:40, s:'Zr', m:91.224, nm:'Zirconium',   cat:'metal',     r:5, c:4,  ec:'', ic:'+4' },
  { n:41, s:'Nb', m:92.906, nm:'Niobium',     cat:'metal',     r:5, c:5,  ec:'', ic:'+5' },
  { n:42, s:'Mo', m:95.950, nm:'Molybdenum',  cat:'metal',     r:5, c:6,  ec:'', ic:'+6' },
  { n:43, s:'Tc', m:98.000, nm:'Technetium',  cat:'metal',     r:5, c:7,  ec:'', ic:'+7' },
  { n:44, s:'Ru', m:101.070,nm:'Ruthenium',   cat:'metal',     r:5, c:8,  ec:'', ic:'+3' },
  { n:45, s:'Rh', m:102.906,nm:'Rhodium',     cat:'metal',     r:5, c:9,  ec:'', ic:'+3' },
  { n:46, s:'Pd', m:106.420,nm:'Palladium',   cat:'metal',     r:5, c:10, ec:'', ic:'+2' },
  { n:47, s:'Ag', m:107.868,nm:'Silver',      cat:'metal',     r:5, c:11, ec:'', ic:'+1' },
  { n:48, s:'Cd', m:112.414,nm:'Cadmium',     cat:'metal',     r:5, c:12, ec:'', ic:'+2' },
  { n:49, s:'In', m:114.818,nm:'Indium',      cat:'metal',     r:5, c:13, ec:'', ic:'+3' },
  { n:50, s:'Sn', m:118.710,nm:'Tin',         cat:'metal',     r:5, c:14, ec:'', ic:'+2, +4' },
  { n:51, s:'Sb', m:121.760,nm:'Antimony',    cat:'metalloid', r:5, c:15, ec:'', ic:'+3, +5' },
  { n:52, s:'Te', m:127.600,nm:'Tellurium',   cat:'metalloid', r:5, c:16, ec:'', ic:'-2, +4, +6' },
  { n:53, s:'I',  m:126.904,nm:'Iodine',      cat:'nonmetal',  r:5, c:17, ec:'', ic:'-1, +5, +7' },
  { n:54, s:'Xe', m:131.294,nm:'Xenon',       cat:'noble',     r:5, c:18, ec:'', ic:'0' },
  // Period 6 (main table, no lanthanides)
  { n:55, s:'Cs', m:132.905,nm:'Cesium',      cat:'metal',     r:6, c:1,  ec:'', ic:'+1' },
  { n:56, s:'Ba', m:137.328,nm:'Barium',      cat:'metal',     r:6, c:2,  ec:'', ic:'+2' },
  { n:72, s:'Hf', m:178.490,nm:'Hafnium',     cat:'metal',     r:6, c:4,  ec:'', ic:'+4' },
  { n:73, s:'Ta', m:180.948,nm:'Tantalum',    cat:'metal',     r:6, c:5,  ec:'', ic:'+5' },
  { n:74, s:'W',  m:183.840,nm:'Tungsten',    cat:'metal',     r:6, c:6,  ec:'', ic:'+6' },
  { n:75, s:'Re', m:186.207,nm:'Rhenium',     cat:'metal',     r:6, c:7,  ec:'', ic:'+7' },
  { n:76, s:'Os', m:190.230,nm:'Osmium',      cat:'metal',     r:6, c:8,  ec:'', ic:'+4' },
  { n:77, s:'Ir', m:192.217,nm:'Iridium',     cat:'metal',     r:6, c:9,  ec:'', ic:'+3' },
  { n:78, s:'Pt', m:195.085,nm:'Platinum',    cat:'metal',     r:6, c:10, ec:'', ic:'+2, +4' },
  { n:79, s:'Au', m:196.967,nm:'Gold',        cat:'metal',     r:6, c:11, ec:'', ic:'+1, +3' },
  { n:80, s:'Hg', m:200.592,nm:'Mercury',     cat:'metal',     r:6, c:12, ec:'', ic:'+1, +2' },
  { n:81, s:'Tl', m:204.380,nm:'Thallium',    cat:'metal',     r:6, c:13, ec:'', ic:'+1, +3' },
  { n:82, s:'Pb', m:207.200,nm:'Lead',        cat:'metal',     r:6, c:14, ec:'', ic:'+2, +4' },
  { n:83, s:'Bi', m:208.980,nm:'Bismuth',     cat:'metal',     r:6, c:15, ec:'', ic:'+3' },
  { n:84, s:'Po', m:209.000,nm:'Polonium',    cat:'metal',     r:6, c:16, ec:'', ic:'+2, +4' },
  { n:85, s:'At', m:210.000,nm:'Astatine',    cat:'metalloid', r:6, c:17, ec:'', ic:'-1' },
  { n:86, s:'Rn', m:222.000,nm:'Radon',       cat:'noble',     r:6, c:18, ec:'', ic:'0' },
  // Period 7 (main table, no actinides)
  { n:87, s:'Fr', m:223.000,nm:'Francium',    cat:'metal',     r:7, c:1,  ec:'', ic:'+1' },
  { n:88, s:'Ra', m:226.000,nm:'Radium',      cat:'metal',     r:7, c:2,  ec:'', ic:'+2' },
  { n:104,s:'Rf', m:267.000,nm:'Rutherfordium',cat:'metal',    r:7, c:4,  ec:'', ic:'+4' },
  { n:105,s:'Db', m:268.000,nm:'Dubnium',     cat:'metal',     r:7, c:5,  ec:'', ic:'+5' },
  { n:106,s:'Sg', m:269.000,nm:'Seaborgium',  cat:'metal',     r:7, c:6,  ec:'', ic:'+6' },
  { n:107,s:'Bh', m:270.000,nm:'Bohrium',     cat:'metal',     r:7, c:7,  ec:'', ic:'+7' },
  { n:108,s:'Hs', m:269.000,nm:'Hassium',     cat:'metal',     r:7, c:8,  ec:'', ic:'+8' },
  { n:109,s:'Mt', m:278.000,nm:'Meitnerium',  cat:'metal',     r:7, c:9,  ec:'', ic:'' },
  { n:110,s:'Ds', m:281.000,nm:'Darmstadtium',cat:'metal',     r:7, c:10, ec:'', ic:'' },
  { n:111,s:'Rg', m:282.000,nm:'Roentgenium', cat:'metal',     r:7, c:11, ec:'', ic:'' },
  { n:112,s:'Cn', m:285.000,nm:'Copernicium', cat:'metal',     r:7, c:12, ec:'', ic:'' },
  { n:113,s:'Nh', m:286.000,nm:'Nihonium',    cat:'metal',     r:7, c:13, ec:'', ic:'' },
  { n:114,s:'Fl', m:289.000,nm:'Flerovium',   cat:'metal',     r:7, c:14, ec:'', ic:'' },
  { n:115,s:'Mc', m:290.000,nm:'Moscovium',   cat:'metal',     r:7, c:15, ec:'', ic:'' },
  { n:116,s:'Lv', m:293.000,nm:'Livermorium', cat:'metal',     r:7, c:16, ec:'', ic:'' },
  { n:117,s:'Ts', m:294.000,nm:'Tennessine',  cat:'metalloid', r:7, c:17, ec:'', ic:'' },
  { n:118,s:'Og', m:294.000,nm:'Oganesson',   cat:'noble',     r:7, c:18, ec:'', ic:'' },
  // Lanthanides (row 9)
  { n:57, s:'La', m:138.905,nm:'Lanthanum',   cat:'metal', r:9, c:3,  ec:'', ic:'+3' },
  { n:58, s:'Ce', m:140.116,nm:'Cerium',      cat:'metal', r:9, c:4,  ec:'', ic:'+3, +4' },
  { n:59, s:'Pr', m:140.908,nm:'Praseodymium',cat:'metal', r:9, c:5,  ec:'', ic:'+3' },
  { n:60, s:'Nd', m:144.242,nm:'Neodymium',   cat:'metal', r:9, c:6,  ec:'', ic:'+3' },
  { n:61, s:'Pm', m:145.000,nm:'Promethium',  cat:'metal', r:9, c:7,  ec:'', ic:'+3' },
  { n:62, s:'Sm', m:150.360,nm:'Samarium',    cat:'metal', r:9, c:8,  ec:'', ic:'+3' },
  { n:63, s:'Eu', m:151.964,nm:'Europium',    cat:'metal', r:9, c:9,  ec:'', ic:'+2, +3' },
  { n:64, s:'Gd', m:157.250,nm:'Gadolinium',  cat:'metal', r:9, c:10, ec:'', ic:'+3' },
  { n:65, s:'Tb', m:158.925,nm:'Terbium',     cat:'metal', r:9, c:11, ec:'', ic:'+3' },
  { n:66, s:'Dy', m:162.500,nm:'Dysprosium',  cat:'metal', r:9, c:12, ec:'', ic:'+3' },
  { n:67, s:'Ho', m:164.930,nm:'Holmium',     cat:'metal', r:9, c:13, ec:'', ic:'+3' },
  { n:68, s:'Er', m:167.259,nm:'Erbium',      cat:'metal', r:9, c:14, ec:'', ic:'+3' },
  { n:69, s:'Tm', m:168.934,nm:'Thulium',     cat:'metal', r:9, c:15, ec:'', ic:'+3' },
  { n:70, s:'Yb', m:173.054,nm:'Ytterbium',   cat:'metal', r:9, c:16, ec:'', ic:'+2, +3' },
  { n:71, s:'Lu', m:174.967,nm:'Lutetium',    cat:'metal', r:9, c:17, ec:'', ic:'+3' },
  // Actinides (row 10)
  { n:89, s:'Ac', m:227.000,nm:'Actinium',    cat:'metal', r:10, c:3,  ec:'', ic:'+3' },
  { n:90, s:'Th', m:232.038,nm:'Thorium',     cat:'metal', r:10, c:4,  ec:'', ic:'+4' },
  { n:91, s:'Pa', m:231.036,nm:'Protactinium',cat:'metal', r:10, c:5,  ec:'', ic:'+4, +5' },
  { n:92, s:'U',  m:238.029,nm:'Uranium',     cat:'metal', r:10, c:6,  ec:'', ic:'+4, +6' },
  { n:93, s:'Np', m:237.000,nm:'Neptunium',   cat:'metal', r:10, c:7,  ec:'', ic:'+4, +6' },
  { n:94, s:'Pu', m:244.000,nm:'Plutonium',   cat:'metal', r:10, c:8,  ec:'', ic:'+4, +6' },
  { n:95, s:'Am', m:243.000,nm:'Americium',   cat:'metal', r:10, c:9,  ec:'', ic:'+3' },
  { n:96, s:'Cm', m:247.000,nm:'Curium',      cat:'metal', r:10, c:10, ec:'', ic:'+3' },
  { n:97, s:'Bk', m:247.000,nm:'Berkelium',   cat:'metal', r:10, c:11, ec:'', ic:'+3' },
  { n:98, s:'Cf', m:251.000,nm:'Californium', cat:'metal', r:10, c:12, ec:'', ic:'+3' },
  { n:99, s:'Es', m:252.000,nm:'Einsteinium', cat:'metal', r:10, c:13, ec:'', ic:'+3' },
  { n:100,s:'Fm', m:257.000,nm:'Fermium',     cat:'metal', r:10, c:14, ec:'', ic:'+3' },
  { n:101,s:'Md', m:258.000,nm:'Mendelevium', cat:'metal', r:10, c:15, ec:'', ic:'+3' },
  { n:102,s:'No', m:259.000,nm:'Nobelium',    cat:'metal', r:10, c:16, ec:'', ic:'+3' },
  { n:103,s:'Lr', m:266.000,nm:'Lawrencium',  cat:'metal', r:10, c:17, ec:'', ic:'+3' },
]

/* ============================================================
   Shared Helpers
   ============================================================ */

/** Parse a chemical formula like H2O, Ca(OH)2, Al2(SO4)3 */
function parseFormula(formula: string): Record<string, number> {
  const counts: Record<string, number> = {}
  let i = 0
  function readNumber(): number {
    let s = ''
    while (i < formula.length && formula[i] >= '0' && formula[i] <= '9') {
      s += formula[i]; i++
    }
    return s.length > 0 ? parseInt(s, 10) : 1
  }
  function parse(): Record<string, number> {
    const out: Record<string, number> = {}
    while (i < formula.length) {
      if (formula[i] === '(') {
        i++ // skip (
        const inner = parse()
        if (i < formula.length && formula[i] === ')') i++ // skip )
        const mult = readNumber()
        for (const el in inner) out[el] = (out[el] || 0) + inner[el] * mult
      } else if (formula[i] === ')') {
        break
      } else if (formula[i] >= 'A' && formula[i] <= 'Z') {
        let el = formula[i]; i++
        while (i < formula.length && formula[i] >= 'a' && formula[i] <= 'z') { el += formula[i]; i++ }
        const num = readNumber()
        out[el] = (out[el] || 0) + num
      } else {
        i++ // skip whitespace or unexpected chars
      }
    }
    return out
  }
  const result = parse()
  for (const el in result) counts[el] = result[el]
  return counts
}

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b)
  while (b) { const t = b; b = a % b; a = t }
  return a
}

function gcdArr(arr: number[]): number {
  return arr.reduce((g, v) => gcd(g, v))
}

/** Atomic weights for molar mass calculations */
const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008, He: 4.003, Li: 6.941, Be: 9.012, B: 10.81,
  C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.180,
  Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.086, P: 30.974,
  S: 32.065, Cl: 35.453, Ar: 39.948, K: 39.098, Ca: 40.078,
  Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938,
  Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.380,
  Ga: 69.723, Ge: 72.630, As: 74.922, Se: 78.971, Br: 79.904,
  Kr: 83.798, Rb: 85.468, Sr: 87.620, Y: 88.906, Zr: 91.224,
  Nb: 92.906, Mo: 95.950, Ru: 101.070, Rh: 102.906, Pd: 106.420,
  Ag: 107.868, Cd: 112.414, In: 114.818, Sn: 118.710, I: 126.904,
  Ba: 137.328, Au: 196.967, Hg: 200.592, Pb: 207.200, U: 238.029,
}

function catTextColor(cat: Cat): string {
  switch (cat) {
    case 'metal': return '#3b82f6'
    case 'nonmetal': return '#22c55e'
    case 'metalloid': return '#f97316'
    case 'noble': return '#a855f7'
    default: return '#94a3b8'
  }
}

function catColor(cat: Cat, isDark: boolean): string {
  const a = isDark ? '0.6' : '0.45'
  switch (cat) {
    case 'metal': return 'rgba(59,130,246,' + a + ')'
    case 'nonmetal': return 'rgba(34,197,94,' + a + ')'
    case 'metalloid': return 'rgba(249,115,22,' + a + ')'
    case 'noble': return 'rgba(168,85,247,' + a + ')'
    default: return 'rgba(100,100,100,' + a + ')'
  }
}

function catLabel(cat: Cat): string {
  switch (cat) {
    case 'metal': return 'Metal'
    case 'nonmetal': return 'Nonmetal'
    case 'metalloid': return 'Metalloid'
    case 'noble': return 'Noble Gas'
    default: return 'Unknown'
  }
}

/** Render a chemical formula with subscripts as JSX */
function renderFormula(formula: string, coeff: number, isDark: boolean): React.ReactNode {
  const parts: React.ReactNode[] = []
  let key = 0
  if (coeff > 1) { parts.push(<span key={key++} style={{ fontWeight: 600, color: isDark ? '#34d399' : '#059669' }}>{coeff}</span>); parts.push(<span key={key++}>{' '}</span>) }
  let idx = 0
  while (idx < formula.length) {
    if (formula[idx] >= 'A' && formula[idx] <= 'Z') {
      let el = formula[idx]; idx++
      while (idx < formula.length && formula[idx] >= 'a' && formula[idx] <= 'z') { el += formula[idx]; idx++ }
      parts.push(<span key={key++}>{el}</span>)
    } else if (formula[idx] >= '0' && formula[idx] <= '9') {
      let num = ''
      while (idx < formula.length && formula[idx] >= '0' && formula[idx] <= '9') { num += formula[idx]; idx++ }
      parts.push(<span key={key++} style={{ fontSize: 9 }}>{num}</span>)
    } else if (formula[idx] === '(' || formula[idx] === ')') {
      parts.push(<span key={key++}>{formula[idx]}</span>); idx++
    } else { idx++ }
  }
  return <span>{parts}</span>
}

/* ============================================================
   1. PeriodicTableExplorer
   ============================================================ */
export function PeriodicTableExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [selected, setSelected] = useState<Elem | null>(null)

  const CW = 30 // cell width
  const CH = 30 // cell height
  const GAP = 14 // gap before lanthanides/actinides
  const totalW = 18 * CW
  const totalH = 9 * CH + GAP

  function rowToY(row: number): number {
    if (row <= 7) return (row - 1) * CH
    return (row - 2) * CH + GAP
  }

  const selElem = selected
    ? ELEMENTS.find(e => e.n === selected.n) || null
    : null

  return (
    <div>
      <div style={{ overflowX: 'auto', overflowY: 'hidden', marginBottom: 6 }}>
        <svg width={totalW} height={totalH} style={{ display: 'block' }}>
          {/* Lanthanide/Actinide placeholder cells */}
          <rect x={2 * CW + 1} y={5 * CH + 1} width={CW - 2} height={CH - 2} rx={3}
            fill={isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.15)'}
            stroke={s.border} strokeWidth={0.5} />
          <text x={2 * CW + CW / 2} y={5 * CH + CH / 2 - 2} textAnchor="middle" fontSize={6} fill={s.text}>57-71</text>
          <text x={2 * CW + CW / 2} y={5 * CH + CH / 2 + 6} textAnchor="middle" fontSize={5} fill={s.text}>Ln</text>

          <rect x={2 * CW + 1} y={6 * CH + 1} width={CW - 2} height={CH - 2} rx={3}
            fill={isDark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.15)'}
            stroke={s.border} strokeWidth={0.5} />
          <text x={2 * CW + CW / 2} y={6 * CH + CH / 2 - 2} textAnchor="middle" fontSize={6} fill={s.text}>89-103</text>
          <text x={2 * CW + CW / 2} y={6 * CH + CH / 2 + 6} textAnchor="middle" fontSize={5} fill={s.text}>An</text>

          {/* Element cells */}
          {ELEMENTS.map((el) => {
            const x = (el.c - 1) * CW
            const y = rowToY(el.r)
            const isSel = selElem && selElem.n === el.n
            return (
              <g key={el.n} onClick={() => setSelected(el)} style={{ cursor: 'pointer' }}>
                <rect x={x + 1} y={y + 1} width={CW - 2} height={CH - 2} rx={3}
                  fill={isSel ? 'rgba(5,150,105,0.3)' : catColor(el.cat, isDark)}
                  stroke={isSel ? 'rgba(5,150,105,0.7)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)')}
                  strokeWidth={isSel ? 1.5 : 0.5} />
                <text x={x + 4} y={y + 10} fontSize={6} fill={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'}>{el.n}</text>
                <text x={x + CW / 2} y={y + CH / 2 + 5} textAnchor="middle" fontSize={9} fontWeight={600} fill={s.bright}>{el.s}</text>
              </g>
            )
          })}

          {/* Row labels for lanthanides/actinides */}
          <text x={2} y={rowToY(9) + CH / 2 + 3} fontSize={6} fill={s.text}>Ln</text>
          <text x={2} y={rowToY(10) + CH / 2 + 3} fontSize={6} fill={s.text}>An</text>
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        {([['metal','Metal'],['nonmetal','Nonmetal'],['metalloid','Metalloid'],['noble','Noble Gas']] as [Cat,string][]).map(([cat, label]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: s.text }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: catColor(cat, isDark) }} />
            {label}
          </div>
        ))}
      </div>

      {/* Detail Panel */}
      {selElem && (
        <div style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 6, padding: '8px 10px', position: 'relative' }}>
          <button onClick={() => setSelected(null)} style={{
            position: 'absolute', top: 4, right: 6, background: 'none', border: 'none',
            color: s.text, cursor: 'pointer', fontSize: 12, lineHeight: 1, padding: '2px 4px'
          }}>x</button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', fontSize: 11 }}>
            <div><span style={{ color: s.text }}>Name:</span> <span style={{ color: s.bright, fontWeight: 600 }}>{selElem.nm}</span></div>
            <div><span style={{ color: s.text }}>Symbol:</span> <span style={{ color: s.bright, fontWeight: 600 }}>{selElem.s}</span></div>
            <div><span style={{ color: s.text }}>Atomic #:</span> <span style={{ color: s.bright }}>{selElem.n}</span></div>
            <div><span style={{ color: s.text }}>Mass:</span> <span style={{ color: s.bright }}>{selElem.m} u</span></div>
            <div><span style={{ color: s.text }}>Category:</span> <span style={{ color: catTextColor(selElem.cat), fontWeight: 500 }}>{catLabel(selElem.cat)}</span></div>
            <div><span style={{ color: s.text }}>Ion Charge:</span> <span style={{ color: s.bright }}>{selElem.ic || 'N/A'}</span></div>
            <div style={{ gridColumn: '1 / -1' }}><span style={{ color: s.text }}>Electron Config:</span> <span style={{ color: s.bright }}>{selElem.ec || 'N/A'}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   2. ChemicalEquationBalancer
   ============================================================ */

function balanceEquation(
  reactants: string[], products: string[]
): number[] | null {
  const parsedR = reactants.map(f => parseFormula(f))
  const parsedP = products.map(f => parseFormula(f))
  const elements = new Set<string>()
  parsedR.forEach(f => Object.keys(f).forEach(e => elements.add(e)))
  parsedP.forEach(f => Object.keys(f).forEach(e => elements.add(e)))
  const elArr = [...elements]
  if (elArr.length === 0) return null

  const total = reactants.length + products.length
  const MAX = 20

  function search(idx: number, coeffs: number[]): number[] | null {
    if (idx === total - 1) {
      // Try to compute the last coefficient from constraints
      let lastCoeff: number | null = null
      const lastFormula = parsedP[products.length - 1]
      for (const el of elArr) {
        let left = 0
        for (let i = 0; i < reactants.length; i++) left += coeffs[i] * (parsedR[i][el] || 0)
        let right = 0
        for (let j = 0; j < products.length - 1; j++) right += coeffs[reactants.length + j] * (parsedP[j][el] || 0)
        const needed = left - right
        const lastCount = lastFormula[el] || 0
        if (lastCount === 0) {
          if (needed !== 0) return null
          continue
        }
        if (needed <= 0 || needed % lastCount !== 0) return null
        const c = needed / lastCount
        if (lastCoeff === null) lastCoeff = c
        else if (lastCoeff !== c) return null
      }
      if (lastCoeff === null) lastCoeff = 1
      if (lastCoeff < 1 || lastCoeff > MAX || !Number.isInteger(lastCoeff)) return null

      // Verify full balance
      const full = [...coeffs, lastCoeff]
      for (const el of elArr) {
        let l = 0, r = 0
        for (let i = 0; i < reactants.length; i++) l += full[i] * (parsedR[i][el] || 0)
        for (let j = 0; j < products.length; j++) r += full[reactants.length + j] * (parsedP[j][el] || 0)
        if (l !== r) return null
      }
      // Normalize by GCD
      const g = gcdArr(full)
      return full.map(c => c / g)
    }
    for (let c = 1; c <= MAX; c++) {
      const result = search(idx + 1, [...coeffs, c])
      if (result) return result
    }
    return null
  }

  return search(0, [])
}

export function ChemicalEquationBalancer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [reactStr, setReactStr] = useState('H2 + O2')
  const [prodStr, setProdStr] = useState('H2O')
  const [result, setResult] = useState<number[] | null>(null)
  const [attempted, setAttempted] = useState(false)

  const reactants = useMemo(() => reactStr.split('+').map(f => f.trim()).filter(Boolean), [reactStr])
  const products = useMemo(() => prodStr.split('+').map(f => f.trim()).filter(Boolean), [prodStr])

  const handleBalance = useCallback(() => {
    setResult(balanceEquation(reactants, products))
    setAttempted(true)
  }, [reactants, products])

  // Element counts before and after
  const beforeCounts = useMemo(() => {
    const counts: Record<string, { l: number; r: number }> = {}
    const els = new Set<string>()
    reactants.forEach(f => { const p = parseFormula(f); Object.keys(p).forEach(e => els.add(e)) })
    products.forEach(f => { const p = parseFormula(f); Object.keys(p).forEach(e => els.add(e)) })
    els.forEach(el => {
      let l = 0, r = 0
      reactants.forEach(f => { l += (parseFormula(f)[el] || 0) })
      products.forEach(f => { r += (parseFormula(f)[el] || 0) })
      counts[el] = { l, r }
    })
    return counts
  }, [reactants, products])

  const afterCounts = useMemo(() => {
    if (!result) return null
    const counts: Record<string, { l: number; r: number }> = {}
    const els = new Set<string>()
    const allParsed = [
      ...reactants.map(f => parseFormula(f)),
      ...products.map(f => parseFormula(f))
    ]
    allParsed.forEach(p => Object.keys(p).forEach(e => els.add(e)))
    els.forEach(el => {
      let l = 0, r = 0
      reactants.forEach((f, i) => { l += result[i] * (parseFormula(f)[el] || 0) })
      products.forEach((f, j) => { r += result[reactants.length + j] * (parseFormula(f)[el] || 0) })
      counts[el] = { l, r }
    })
    return counts
  }, [result, reactants, products])

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 58 }}>Reactants:</span>
          <input style={{ ...s.input, flex: 1, minWidth: 0 }} value={reactStr} onChange={e => { setReactStr(e.target.value); setResult(null); setAttempted(false) }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 58 }}>Products:</span>
          <input style={{ ...s.input, flex: 1, minWidth: 0 }} value={prodStr} onChange={e => { setProdStr(e.target.value); setResult(null); setAttempted(false) }} />
        </div>
        <button style={{ ...s.btn(false), alignSelf: 'flex-start' }} onClick={handleBalance}>Balance</button>
      </div>

      {/* Balanced equation */}
      {result && (
        <div style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 6, padding: '6px 8px', marginBottom: 6 }}>
          <div style={{ fontSize: 10, color: s.text, marginBottom: 3 }}>Balanced Equation:</div>
          <div style={{ fontSize: 12, color: s.bright, fontWeight: 500 }}>
            {reactants.map((f, i) => (
              <span key={i}>{i > 0 ? ' + ' : ''}{renderFormula(f, result[i], isDark)}</span>
            ))}
            <span style={{ margin: '0 6px', color: s.text }}>{'\u2192'}</span>
            {products.map((f, i) => (
              <span key={i}>{i > 0 ? ' + ' : ''}{renderFormula(f, result[reactants.length + i], isDark)}</span>
            ))}
          </div>
        </div>
      )}

      {/* Before/After counts */}
      {beforeCounts && Object.keys(beforeCounts).length > 0 && (
        <div style={{ fontSize: 9, color: s.text }}>
          <div style={{ marginBottom: 2, fontWeight: 600, color: s.bright, fontSize: 10 }}>Element Counts:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 1fr', gap: '1px 6px', alignItems: 'center' }}>
            <div /> <div style={{ textAlign: 'center', fontSize: 8, opacity: 0.7 }}>Reactants</div> <div style={{ textAlign: 'center', fontSize: 8, opacity: 0.7 }}>Products</div>
            {Object.keys(beforeCounts).map(el => {
              const before = beforeCounts[el]
              const after = afterCounts ? afterCounts[el] : null
              const displayL = after ? after.l : before.l
              const displayR = after ? after.r : before.r
              const balanced = displayL === displayR
              return (
                <React.Fragment key={el}>
                  <div style={{ fontWeight: 600, color: s.bright }}>{el}</div>
                  <div style={{ color: balanced ? (isDark ? '#34d399' : '#059669') : (isDark ? '#f87171' : '#dc2626') }}>{displayL}</div>
                  <div style={{ color: balanced ? (isDark ? '#34d399' : '#059669') : (isDark ? '#f87171' : '#dc2626') }}>{displayR}</div>
                </React.Fragment>
              )
            })}
          </div>
          {!attempted && (
            <div style={{ marginTop: 3, fontSize: 8, opacity: 0.6 }}>Click Balance to see if equation can be balanced</div>
          )}
          {attempted && result === null && reactants.length > 0 && products.length > 0 && (
            <div style={{ marginTop: 3, color: isDark ? '#f87171' : '#dc2626', fontSize: 9 }}>Could not balance (coefficients may exceed 20, or equation is invalid)</div>
          )}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   3. PhScaleVisualizer
   ============================================================ */

const PH_EXAMPLES = [
  { ph: 1, label: 'Stomach acid' },
  { ph: 2, label: 'Lemon juice' },
  { ph: 3, label: 'Cola' },
  { ph: 5, label: 'Coffee' },
  { ph: 7, label: 'Water' },
  { ph: 7.4, label: 'Blood' },
  { ph: 9, label: 'Baking soda' },
  { ph: 12, label: 'Bleach' },
]

export function PhScaleVisualizer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [ph, setPh] = useState(7)
  const svgRef = useRef<SVGSVGElement>(null)

  const barW = 320
  const barH = 24
  const barX = 10
  const barY = 10

  const concentration = Math.pow(10, -ph)
  const classification = ph < 6.5 ? 'Acidic' : ph > 7.5 ? 'Basic' : 'Neutral'

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - barX
    const newPh = Math.max(0, Math.min(14, (x / barW) * 14))
    setPh(Math.round(newPh * 10) / 10)
  }, [])

  const formatConc = (c: number): string => {
    if (c === 0) return '0'
    const exp = Math.floor(Math.log10(c))
    const mantissa = c / Math.pow(10, exp)
    return mantissa.toFixed(1) + ' x 10^' + exp + ' M'
  }

  return (
    <div>
      <svg ref={svgRef} width={barW + barX * 2} height={barH + 60} onClick={handleClick} style={{ display: 'block', marginBottom: 4 }}>
        <defs>
          <linearGradient id="phGrad" x1="0%" y1="0%" x2="100%" y2="0%">
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
        {/* Bar */}
        <rect x={barX} y={barY} width={barW} height={barH} rx={4} fill="url(#phGrad)"
          stroke={s.border} strokeWidth={0.5} />
        {/* Tick marks */}
        {Array.from({ length: 15 }, (_, i) => {
          const x = barX + (i / 14) * barW
          return (
            <g key={i}>
              <line x1={x} y1={barY + barH} x2={x} y2={barY + barH + 4} stroke={s.text} strokeWidth={0.5} />
              <text x={x} y={barY + barH + 12} textAnchor="middle" fontSize={7} fill={s.text}>{i}</text>
            </g>
          )
        })}
        {/* Current pH marker */}
        <polygon
          points={(barX + (ph / 14) * barW) + ',' + (barY - 2) + ' ' +
                  (barX + (ph / 14) * barW - 4) + ',' + (barY - 8) + ' ' +
                  (barX + (ph / 14) * barW + 4) + ',' + (barY - 8)}
          fill={isDark ? '#e2e8f0' : '#1e293b'}
        />
        <line x1={barX + (ph / 14) * barW} y1={barY} x2={barX + (ph / 14) * barW} y2={barY + barH}
          stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={1.5} />
        {/* Example markers */}
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

      {/* Info panel */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: s.text }}>pH:</span>
          <input type="number" min={0} max={14} step={0.1} value={ph}
            onChange={e => setPh(Math.max(0, Math.min(14, parseFloat(e.target.value) || 0)))}
            style={{ ...s.input, width: 52 }} />
        </div>
        <div style={{ fontSize: 11, color: s.bright }}>
          <span style={{ color: s.text }}>[H+]: </span>{formatConc(concentration)}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 10,
          background: ph < 6.5 ? 'rgba(239,68,68,0.15)' : ph > 7.5 ? 'rgba(99,102,241,0.15)' : 'rgba(34,197,94,0.15)',
          color: ph < 6.5 ? '#f87171' : ph > 7.5 ? '#818cf8' : '#4ade80',
        }}>
          {classification}
        </div>
      </div>

      {/* Examples as clickable chips */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {PH_EXAMPLES.map((ex, i) => (
          <button key={i} onClick={() => setPh(ex.ph)} style={{
            ...s.btn(ph === ex.ph), fontSize: 9, display: 'flex', alignItems: 'center', gap: 3
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: ph === ex.ph ? '#34d399' : s.text, opacity: ph === ex.ph ? 1 : 0.4 }} />
            {ex.label} ({ex.ph})
          </button>
        ))}
      </div>
    </div>
  )
}

/* ============================================================
   4. ScientificNotationConverter
   ============================================================ */

function parseNumberInput(str: string): number | null {
  str = str.trim()
  if (!str) return null
  // Try native parse (handles 3.5e6, 3500000, 0.00045, etc.)
  const n = Number(str)
  if (!isNaN(n) && isFinite(n)) return n
  // Try "3.5 x 10^6" or "3.5 * 10^6" or "3.5\u00d710^6"
  const match = str.match(/^([\d.]+)\s*[x\*\u00d7]\s*10\^?([+-]?\d+)$/)
  if (match) return parseFloat(match[1]) * Math.pow(10, parseInt(match[2], 10))
  return null
}

function toSciNotation(n: number): { mantissa: number; exponent: number; str: string } {
  if (n === 0) return { mantissa: 0, exponent: 0, str: '0' }
  const exp = Math.floor(Math.log10(Math.abs(n)))
  const mantissa = n / Math.pow(10, exp)
  return {
    mantissa: parseFloat(mantissa.toFixed(6)),
    exponent: exp,
    str: parseFloat(mantissa.toFixed(6)) + ' x 10^' + exp
  }
}

function toStandardStr(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return n.toLocaleString()
  return n.toPrecision(10)
}

export function ScientificNotationConverter({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [input1, setInput1] = useState('')
  const [input2, setInput2] = useState('')
  const [result, setResult] = useState<{ value: number; sci: string; std: string; steps: string[] } | null>(null)
  const [mode, setMode] = useState<'sci' | 'std' | 'add' | 'sub' | 'mul' | 'div'>('sci')

  const handleConvert = useCallback(() => {
    const n = parseNumberInput(input1)
    if (n === null) { setResult({ value: 0, sci: 'Error', std: 'Error', steps: ['Invalid number input'] }); return }

    if (mode === 'sci') {
      const sci = toSciNotation(n)
      const steps = [
        'Input: ' + input1,
        'Value: ' + n,
        'Place decimal after first non-zero digit',
        'Count places moved: ' + sci.exponent + (sci.exponent >= 0 ? ' places left' : ' places right'),
        'Result: ' + sci.str,
      ]
      setResult({ value: n, sci: sci.str, std: toStandardStr(n), steps })
    } else if (mode === 'std') {
      const sci = toSciNotation(n)
      const steps = [
        'Input: ' + input1,
        'Scientific: ' + sci.str,
        'Move decimal ' + Math.abs(sci.exponent) + ' places ' + (sci.exponent >= 0 ? 'right' : 'left'),
        'Result: ' + toStandardStr(n),
      ]
      setResult({ value: n, sci: sci.str, std: toStandardStr(n), steps })
    } else {
      const n2 = parseNumberInput(input2)
      if (n2 === null) { setResult({ value: 0, sci: 'Error', std: 'Error', steps: ['Invalid second number'] }); return }
      let val = 0
      let opSymbol = ''
      switch (mode) {
        case 'add': val = n + n2; opSymbol = '+'; break
        case 'sub': val = n - n2; opSymbol = '-'; break
        case 'mul': val = n * n2; opSymbol = '\u00d7'; break
        case 'div': val = n2 !== 0 ? n / n2 : NaN; opSymbol = '\u00f7'; break
      }
      const sci = toSciNotation(val)
      const steps = [
        'Operation: ' + n + ' ' + opSymbol + ' ' + n2,
        'Result (standard): ' + toStandardStr(val),
        'Result (scientific): ' + sci.str,
      ]
      setResult({ value: val, sci: sci.str, std: toStandardStr(val), steps })
    }
  }, [input1, input2, mode])

  const btns: { key: typeof mode; label: string }[] = [
    { key: 'sci', label: 'To Scientific' },
    { key: 'std', label: 'To Standard' },
    { key: 'add', label: 'Add (+)' },
    { key: 'sub', label: 'Subtract (-)' },
    { key: 'mul', label: 'Multiply (\u00d7)' },
    { key: 'div', label: 'Divide (\u00f7)' },
  ]

  const isOp = mode === 'add' || mode === 'sub' || mode === 'mul' || mode === 'div'

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 38 }}>Number:</span>
          <input style={{ ...s.input, flex: 1, minWidth: 0 }} value={input1}
            onChange={e => setInput1(e.target.value)} placeholder="e.g. 3500000 or 3.5e6" />
        </div>
        {isOp && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: s.text, minWidth: 38 }}>Number 2:</span>
            <input style={{ ...s.input, flex: 1, minWidth: 0 }} value={input2}
              onChange={e => setInput2(e.target.value)} placeholder="Second number" />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 6 }}>
        {btns.map(b => (
          <button key={b.key} onClick={() => setMode(b.key)} style={s.btn(mode === b.key)}>{b.label}</button>
        ))}
        <button style={{ ...s.btn(false), marginLeft: 'auto' }} onClick={handleConvert}>Go</button>
      </div>

      {result && (
        <div style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 6, padding: '6px 8px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: s.bright, marginBottom: 3 }}>Result:</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, fontSize: 11, marginBottom: 4 }}>
            <div><span style={{ color: s.text, fontSize: 9 }}>Scientific: </span><span style={{ color: s.bright }}>{result.sci}</span></div>
            <div><span style={{ color: s.text, fontSize: 9 }}>Standard: </span><span style={{ color: s.bright }}>{result.std}</span></div>
          </div>
          <div style={{ fontSize: 9, color: s.text, borderTop: '1px solid ' + s.border, paddingTop: 4 }}>
            {result.steps.map((step, i) => (
              <div key={i} style={{ marginBottom: 1 }}>{i + 1}. {step}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   5. MolarMassCalculator
   ============================================================ */

interface MolarBreakdown {
  element: string
  count: number
  atomicWeight: number
  subtotal: number
}

export function MolarMassCalculator({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [formula, setFormula] = useState('H2O')
  const [result, setResult] = useState<{ total: number; breakdown: MolarBreakdown[] } | null>(null)

  const handleCalc = useCallback(() => {
    if (!formula.trim()) return
    const parsed = parseFormula(formula)
    const breakdown: MolarBreakdown[] = []
    let total = 0
    const entries = Object.entries(parsed)
    for (const [el, count] of entries) {
      const w = ATOMIC_WEIGHTS[el]
      if (w === undefined) {
        setResult({ total: 0, breakdown: [{ element: el, count, atomicWeight: 0, subtotal: 0 }] })
        return
      }
      const sub = count * w
      breakdown.push({ element: el, count, atomicWeight: w, subtotal: sub })
      total += sub
    }
    setResult({ total: parseFloat(total.toFixed(3)), breakdown })
  }, [formula])

  // Auto-calculate on mount and formula change with a small debounce
  React.useEffect(() => { handleCalc() }, [formula, handleCalc])

  const hasError = result && result.breakdown.some(b => b.atomicWeight === 0)

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: s.text, minWidth: 42 }}>Formula:</span>
        <input style={{ ...s.input, flex: 1, minWidth: 0 }} value={formula}
          onChange={e => setFormula(e.target.value)} placeholder="e.g. Ca(OH)2, C6H12O6" />
      </div>

      {result && !hasError && (
        <div style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 6, padding: '6px 8px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: s.bright, marginBottom: 4 }}>
            {parseFloat(result.total.toFixed(3))} g/mol
          </div>
          <div style={{ fontSize: 10, color: s.text }}>
            {result.breakdown.map((b, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                <span>{renderFormula(b.element, b.count, isDark)}</span>
                <span style={{ color: s.bright }}>{b.count} x {b.atomicWeight} = {parseFloat(b.subtotal.toFixed(3))}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasError && (
        <div style={{ fontSize: 10, color: isDark ? '#f87171' : '#dc2626' }}>
          Unknown element: {result.breakdown.find(b => b.atomicWeight === 0)?.element}
        </div>
      )}

      <div style={{ fontSize: 9, color: s.text, marginTop: 6, opacity: 0.6 }}>
        Supports parentheses: Ca(OH)2, Al2(SO4)3, Fe2(SO4)3
      </div>
    </div>
  )
}
