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
        {btns.slice(0, 2).map(b => (
          <button key={b.key} onClick={() => { setMode(b.key); setTimeout(handleConvert, 0) }} style={s.btn(mode === b.key)}>{b.label}</button>
        ))}
        {btns.slice(2).map(b => (
          <button key={b.key} onClick={() => { setMode(b.key); setTimeout(handleConvert, 0) }} style={s.btn(mode === b.key)}>{b.label}</button>
        ))}
        {isOp && (
          <button style={{ ...s.btn(false), marginLeft: 'auto' }} onClick={handleConvert}>Go</button>
        )}
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

/* ============================================================
   Lewis Dot Structure Builder (Grades 8-12)
   ============================================================ */
const LEWIS_ELEMENTS = [
  { sym: 'H', name: 'Hydrogen', val: 1, z: 1 },
  { sym: 'He', name: 'Helium', val: 2, z: 2 },
  { sym: 'Li', name: 'Lithium', val: 1, z: 3 },
  { sym: 'Be', name: 'Beryllium', val: 2, z: 4 },
  { sym: 'B', name: 'Boron', val: 3, z: 5 },
  { sym: 'C', name: 'Carbon', val: 4, z: 6 },
  { sym: 'N', name: 'Nitrogen', val: 5, z: 7 },
  { sym: 'O', name: 'Oxygen', val: 6, z: 8 },
  { sym: 'F', name: 'Fluorine', val: 7, z: 9 },
  { sym: 'Ne', name: 'Neon', val: 8, z: 10 },
  { sym: 'Na', name: 'Sodium', val: 1, z: 11 },
  { sym: 'Mg', name: 'Magnesium', val: 2, z: 12 },
  { sym: 'Al', name: 'Aluminum', val: 3, z: 13 },
  { sym: 'Si', name: 'Silicon', val: 4, z: 14 },
  { sym: 'P', name: 'Phosphorus', val: 5, z: 15 },
  { sym: 'S', name: 'Sulfur', val: 6, z: 16 },
  { sym: 'Cl', name: 'Chlorine', val: 7, z: 17 },
  { sym: 'Ar', name: 'Argon', val: 8, z: 18 },
  { sym: 'K', name: 'Potassium', val: 1, z: 19 },
  { sym: 'Ca', name: 'Calcium', val: 2, z: 20 },
  { sym: 'Br', name: 'Bromine', val: 7, z: 35 },
  { sym: 'Kr', name: 'Krypton', val: 8, z: 36 },
]

interface LewisMolecule {
  label: string
  central: string
  terminals: { sym: string; count: number; bonds: number }[]
  lonePairsCentral: number
}

const LEWIS_EXAMPLES: LewisMolecule[] = [
  { label: 'H2O', central: 'O', terminals: [{ sym: 'H', count: 2, bonds: 1 }], lonePairsCentral: 2 },
  { label: 'CO2', central: 'C', terminals: [{ sym: 'O', count: 2, bonds: 2 }], lonePairsCentral: 0 },
  { label: 'NH3', central: 'N', terminals: [{ sym: 'H', count: 3, bonds: 1 }], lonePairsCentral: 1 },
  { label: 'CH4', central: 'C', terminals: [{ sym: 'H', count: 4, bonds: 1 }], lonePairsCentral: 0 },
  { label: 'O2', central: 'O', terminals: [{ sym: 'O', count: 1, bonds: 2 }], lonePairsCentral: 2 },
  { label: 'N2', central: 'N', terminals: [{ sym: 'N', count: 1, bonds: 3 }], lonePairsCentral: 1 },
]

function getElemData(sym: string) {
  return LEWIS_ELEMENTS.find(e => e.sym === sym) || LEWIS_ELEMENTS[0]
}

export function LewisDotStructureBuilder({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [element, setElement] = useState('O')
  const [mode, setMode] = useState<'atom' | 'molecule'>('atom')
  const [exampleIdx, setExampleIdx] = useState(0)

  const currentElement = getElemData(element)
  const ex = LEWIS_EXAMPLES[exampleIdx]

  const getDots = (valence: number) => {
    const positions = [
      { x: 0, y: -1 },   // top
      { x: 1, y: 0 },    // right
      { x: 0, y: 1 },    // bottom
      { x: -1, y: 0 },   // left
    ]
    const dots: { x: number; y: number; paired: boolean }[] = []
    for (let i = 0; i < valence; i++) {
      const side = Math.floor(i / 2)
      const pos = positions[side % 4]
      const isSecond = i % 2 === 1
      dots.push({
        x: pos.x + (isSecond ? pos.x * 0.3 : 0),
        y: pos.y + (isSecond ? pos.y * 0.3 : 0),
        paired: isSecond,
      })
    }
    return dots
  }

  const renderAtomDots = (cx: number, cy: number, sym: string, scale: number, showDots: boolean, lonePairs: number, usedBonds: number) => {
    const elem = getElemData(sym)
    const totalDots = elem.val
    const bondingElectrons = usedBonds * 2
    const loneElectrons = totalDots - bondingElectrons
    const dots = getDots(loneElectrons > 0 ? loneElectrons : 0)
    return (
      <g key={sym + '-' + cx}>
        <circle cx={cx} cy={cy} r={18 * scale} fill={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'} stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'} strokeWidth={1} />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontSize={14 * scale} fontWeight={700} fill={s.bright}>{sym}</text>
        {showDots && dots.map((d, i) => (
          <circle key={i} cx={cx + d.x * 22 * scale} cy={cy + d.y * 22 * scale} r={2.5 * scale} fill={d.paired ? '#34d399' : '#60a5fa'} />
        ))}
      </g>
    )
  }

  const renderBond = (x1: number, y1: number, x2: number, y2: number, count: number) => {
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy)
    const nx = -dy / (len || 1) * 3
    const ny = dx / (len || 1) * 3
    const lines = []
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * 3
      lines.push(
        <line key={i} x1={x1 + nx * offset} y1={y1 + ny * offset} x2={x2 + nx * offset} y2={y2 + ny * offset} stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={1.5} />
      )
    }
    return lines
  }

  const totalValence = mode === 'molecule'
    ? getElemData(ex.central).val + ex.terminals.reduce((sum, t) => sum + getElemData(t.sym).val * t.count, 0)
    : currentElement.val

  const totalBonds = mode === 'molecule'
    ? ex.terminals.reduce((sum, t) => sum + t.bonds * t.count, 0)
    : 0

  const lonePairsCount = mode === 'molecule'
    ? Math.floor((totalValence - totalBonds * 2) / 2)
    : Math.floor(currentElement.val / 2)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={() => setMode('atom')} style={s.btn(mode === 'atom')}>Single Atom</button>
        <button onClick={() => setMode('molecule')} style={s.btn(mode === 'molecule')}>Molecule</button>
      </div>

      {mode === 'atom' && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: s.text }}>Element:</span>
          <select value={element} onChange={e => setElement(e.target.value)} style={s.input}>
            {LEWIS_ELEMENTS.map(el => (
              <option key={el.sym} value={el.sym}>{el.sym} ({el.name}) — {el.val} valence e⁻</option>
            ))}
          </select>
        </div>
      )}

      {mode === 'molecule' && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: s.text }}>Example:</span>
          {LEWIS_EXAMPLES.map((m, i) => (
            <button key={m.label} onClick={() => setExampleIdx(i)} style={s.btn(i === exampleIdx)}>{m.label}</button>
          ))}
        </div>
      )}

      <svg viewBox="0 0 200 200" width="100%" style={{ maxHeight: 200 }}>
        {mode === 'atom' ? (
          renderAtomDots(100, 100, element, 1.5, true, 0, 0)
        ) : (
          (() => {
            const cx = 100
            const cy = 100
            const r = 50
            const tLen = ex.terminals.length === 1 && ex.terminals[0].count === 1
            const elems = []
            if (tLen) {
              const t = ex.terminals[0]
              elems.push(renderAtomDots(cx, cy, ex.central, 1, true, ex.lonePairsCentral, t.bonds))
              elems.push(renderBond(cx, cy, cx + r * 1.2, cy, t.bonds))
              elems.push(renderAtomDots(cx + r * 1.2, cy, t.sym, 1, true, 0, t.bonds))
            } else {
              elems.push(renderAtomDots(cx, cy, ex.central, 1, true, ex.lonePairsCentral, ex.terminals.reduce((s2, t2) => s2 + t2.bonds, 0)))
              let idx = 0
              const total = ex.terminals.reduce((s2, t2) => s2 + t2.count, 0)
              ex.terminals.forEach(t => {
                for (let i = 0; i < t.count; i++) {
                  const angle = (2 * Math.PI * idx / total) - Math.PI / 2
                  const tx = cx + r * Math.cos(angle)
                  const ty = cy + r * Math.sin(angle)
                  elems.push(renderBond(cx, cy, tx, ty, t.bonds))
                  elems.push(renderAtomDots(tx, ty, t.sym, 0.85, true, 0, t.bonds))
                  idx++
                }
              })
            }
            return elems
          })()
        )}
      </svg>

      <div style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 6, padding: '6px 8px', fontSize: 10, color: s.text }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total valence electrons:</span><span style={{ color: s.bright, fontWeight: 600 }}>{totalValence}</span></div>
        {mode === 'molecule' && <>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bonds:</span><span style={{ color: s.bright, fontWeight: 600 }}>{totalBonds}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Lone pairs:</span><span style={{ color: s.bright, fontWeight: 600 }}>{lonePairsCount}</span></div>
        </>}
        {mode === 'atom' && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Lone pairs:</span><span style={{ color: s.bright, fontWeight: 600 }}>{lonePairsCount}</span></div>}
      </div>
    </div>
  )
}

/* ============================================================
   Molecular Geometry VSEPR (Grades 9-12)
   ============================================================ */
const VSEPR_DATA = [
  { formula: 'CH4', geometry: 'Tetrahedral', hybridization: 'sp³', lonePairs: 0, bondAngle: '109.5°', polarity: 'Nonpolar', atoms: [{ sym: 'C', x: 100, y: 100, r: 14, color: '#374151' }, { sym: 'H', x: 60, y: 65, r: 10, color: '#9ca3af' }, { sym: 'H', x: 140, y: 65, r: 10, color: '#9ca3af' }, { sym: 'H', x: 60, y: 135, r: 10, color: '#9ca3af' }, { sym: 'H', x: 140, y: 135, r: 10, color: '#9ca3af' }], bonds: [[0,1,1],[0,2,1],[0,3,1],[0,4,1]] },
  { formula: 'NH3', geometry: 'Trigonal Pyramidal', hybridization: 'sp³', lonePairs: 1, bondAngle: '107°', polarity: 'Polar', atoms: [{ sym: 'N', x: 100, y: 100, r: 14, color: '#2563eb' }, { sym: 'H', x: 60, y: 65, r: 10, color: '#9ca3af' }, { sym: 'H', x: 140, y: 65, r: 10, color: '#9ca3af' }, { sym: 'H', x: 100, y: 145, r: 10, color: '#9ca3af' }], bonds: [[0,1,1],[0,2,1],[0,3,1]] },
  { formula: 'H2O', geometry: 'Bent', hybridization: 'sp³', lonePairs: 2, bondAngle: '104.5°', polarity: 'Polar', atoms: [{ sym: 'O', x: 100, y: 100, r: 14, color: '#dc2626' }, { sym: 'H', x: 60, y: 80, r: 10, color: '#9ca3af' }, { sym: 'H', x: 140, y: 80, r: 10, color: '#9ca3af' }], bonds: [[0,1,1],[0,2,1]] },
  { formula: 'CO2', geometry: 'Linear', hybridization: 'sp', lonePairs: 0, bondAngle: '180°', polarity: 'Nonpolar', atoms: [{ sym: 'C', x: 100, y: 100, r: 14, color: '#374151' }, { sym: 'O', x: 35, y: 100, r: 12, color: '#dc2626' }, { sym: 'O', x: 165, y: 100, r: 12, color: '#dc2626' }], bonds: [[0,1,2],[0,2,2]] },
  { formula: 'BF3', geometry: 'Trigonal Planar', hybridization: 'sp²', lonePairs: 0, bondAngle: '120°', polarity: 'Nonpolar', atoms: [{ sym: 'B', x: 100, y: 100, r: 13, color: '#f59e0b' }, { sym: 'F', x: 100, y: 40, r: 11, color: '#22c55e' }, { sym: 'F', x: 48, y: 130, r: 11, color: '#22c55e' }, { sym: 'F', x: 152, y: 130, r: 11, color: '#22c55e' }], bonds: [[0,1,1],[0,2,1],[0,3,1]] },
  { formula: 'SF6', geometry: 'Octahedral', hybridization: 'sp³d²', lonePairs: 0, bondAngle: '90° / 180°', polarity: 'Nonpolar', atoms: [{ sym: 'S', x: 100, y: 100, r: 14, color: '#eab308' }, { sym: 'F', x: 100, y: 40, r: 11, color: '#22c55e' }, { sym: 'F', x: 100, y: 160, r: 11, color: '#22c55e' }, { sym: 'F', x: 45, y: 100, r: 11, color: '#22c55e' }, { sym: 'F', x: 155, y: 100, r: 11, color: '#22c55e' }, { sym: 'F', x: 65, y: 60, r: 11, color: '#22c55e' }, { sym: 'F', x: 135, y: 140, r: 11, color: '#22c55e' }], bonds: [[0,1,1],[0,2,1],[0,3,1],[0,4,1],[0,5,1],[0,6,1]] },
  { formula: 'XeF4', geometry: 'Square Planar', hybridization: 'sp³d²', lonePairs: 2, bondAngle: '90° / 180°', polarity: 'Nonpolar', atoms: [{ sym: 'Xe', x: 100, y: 100, r: 15, color: '#7c3aed' }, { sym: 'F', x: 100, y: 40, r: 11, color: '#22c55e' }, { sym: 'F', x: 100, y: 160, r: 11, color: '#22c55e' }, { sym: 'F', x: 40, y: 100, r: 11, color: '#22c55e' }, { sym: 'F', x: 160, y: 100, r: 11, color: '#22c55e' }], bonds: [[0,1,1],[0,2,1],[0,3,1],[0,4,1]] },
  { formula: 'PCl5', geometry: 'Trigonal Bipyramidal', hybridization: 'sp³d', lonePairs: 0, bondAngle: '90° / 120° / 180°', polarity: 'Nonpolar', atoms: [{ sym: 'P', x: 100, y: 95, r: 14, color: '#f97316' }, { sym: 'Cl', x: 100, y: 35, r: 12, color: '#22c55e' }, { sym: 'Cl', x: 100, y: 155, r: 12, color: '#22c55e' }, { sym: 'Cl', x: 50, y: 70, r: 12, color: '#22c55e' }, { sym: 'Cl', x: 150, y: 70, r: 12, color: '#22c55e' }, { sym: 'Cl', x: 100, y: 165, r: 12, color: '#22c55e' }], bonds: [[0,1,1],[0,2,1],[0,3,1],[0,4,1],[0,5,1]] },
]

export function MolecularGeometryVSEPR({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [idx, setIdx] = useState(0)
  const d = VSEPR_DATA[idx]

  const renderBondLine = (x1: number, y1: number, x2: number, y2: number, count: number, bondIdx: number) => {
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.sqrt(dx * dx + dy * dy) || 1
    const nx = -dy / len * 3
    const ny = dx / len * 3
    const lines = []
    for (let i = 0; i < count; i++) {
      const off = (i - (count - 1) / 2) * 3
      lines.push(
        <line key={bondIdx + '-' + i} x1={x1 + nx * off} y1={y1 + ny * off} x2={x2 + nx * off} y2={y2 + ny * off} stroke={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)'} strokeWidth={2} />
      )
    }
    return lines
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {VSEPR_DATA.map((v, i) => (
          <button key={v.formula} onClick={() => setIdx(i)} style={s.btn(i === idx)}>{v.formula}</button>
        ))}
      </div>

      <svg viewBox="0 0 200 200" width="100%" style={{ maxHeight: 200 }}>
        {d.bonds.map((b, i) => renderBondLine(d.atoms[b[0]].x, d.atoms[b[0]].y, d.atoms[b[1]].x, d.atoms[b[1]].y, b[2], i))}
        {d.atoms.map((a, i) => (
          <g key={i}>
            <circle cx={a.x} cy={a.y} r={a.r} fill={a.color} opacity={0.85} />
            <circle cx={a.x} cy={a.y} r={a.r} fill="none" stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} strokeWidth={0.5} />
            <text x={a.x} y={a.y + 1} textAnchor="middle" dominantBaseline="central" fontSize={a.r > 13 ? 10 : 8} fontWeight={700} fill="white">{a.sym}</text>
          </g>
        ))}
      </svg>

      <div style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 6, padding: '6px 8px', fontSize: 10, color: s.text }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: s.bright, marginBottom: 4 }}>{d.formula} — {d.geometry}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Hybridization:</span><span style={{ color: s.bright, fontWeight: 600 }}>{d.hybridization}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Bond angle(s):</span><span style={{ color: s.bright, fontWeight: 600 }}>{d.bondAngle}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Lone pairs:</span><span style={{ color: s.bright, fontWeight: 600 }}>{d.lonePairs}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Polarity:</span><span style={{ color: d.polarity === 'Polar' ? '#f87171' : '#34d399', fontWeight: 600 }}>{d.polarity}</span></div>
      </div>
    </div>
  )
}

/* ============================================================
   Gas Laws Simulator (Grades 9-12)
   ============================================================ */
export function GasLawsSimulator({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const R = 0.08206

  const [pressure, setPressure] = useState(1.0)
  const [volume, setVolume] = useState(22.4)
  const [temperature, setTemperature] = useState(273.15)
  const [moles, setMoles] = useState(1.0)
  const [locked, setLocked] = useState<Set<string>>(new Set(['P']))

  const toggleLock = (v: string) => {
    setLocked(prev => {
      const next = new Set(prev)
      if (next.has(v)) {
        if (next.size <= 3) return prev
        next.delete(v)
      } else {
        next.add(v)
      }
      return next
    })
  }

  const calcUnlocked = () => {
    if (locked.size !== 3) return null
    const unlocked = ['P', 'V', 'T', 'n'].find(v => !locked.has(v))
    if (!unlocked) return null
    if (unlocked === 'P') return { key: 'P' as const, val: moles * R * temperature / volume }
    if (unlocked === 'V') return { key: 'V' as const, val: moles * R * temperature / pressure }
    if (unlocked === 'T') return { key: 'T' as const, val: pressure * volume / (moles * R) }
    return { key: 'n' as const, val: pressure * volume / (R * temperature) }
  }

  const result = calcUnlocked()

  const getDisplayVal = (key: string) => {
    if (result && result.key === key && result.val > 0 && isFinite(result.val)) {
      return parseFloat(result.val.toFixed(4))
    }
    return key === 'P' ? pressure : key === 'V' ? volume : key === 'T' ? temperature : moles
  }

  const displayP = getDisplayVal('P')
  const displayV = getDisplayVal('V')
  const displayT = getDisplayVal('T')
  const displayN = getDisplayVal('n')

  const particles = useMemo(() => {
    const pts: { x: number; y: number; vx: number; vy: number }[] = []
    const count = Math.min(Math.round(displayN * 15), 60)
    for (let i = 0; i < count; i++) {
      pts.push({ x: Math.random() * 160 + 10, y: Math.random() * 100 + 10, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2 })
    }
    return pts
  }, [Math.round(displayN * 15)])

  const tempFrac = Math.min(1, Math.max(0, (displayT - 100) / 800))
  const particleColor = isDark
    ? 'rgba(' + Math.round(59 + tempFrac * 196) + ',' + Math.round(130 - tempFrac * 80) + ',' + Math.round(246 - tempFrac * 200) + ',0.8)'
    : 'rgba(' + Math.round(37 + tempFrac * 200) + ',' + Math.round(99 - tempFrac * 60) + ',' + Math.round(235 - tempFrac * 200) + ',0.7)'

  const pistonY = Math.min(140, Math.max(40, 140 - (displayV - 5) * 2.5))

  const applyScenario = (scenario: string) => {
    if (scenario === 'boyle') {
      setPressure(2.0); setVolume(11.2); setTemperature(273.15); setMoles(1.0)
      setLocked(new Set(['T', 'n', 'V']))
    } else {
      setPressure(1.0); setVolume(22.4); setTemperature(546.3); setMoles(1.0)
      setLocked(new Set(['P', 'n', 'V']))
    }
  }

  const sliders: { label: string; key: string; val: number; displayVal: number; min: number; max: number; step: number; unit: string; setter: (v: number) => void }[] = [
    { label: 'Pressure (P)', key: 'P', val: pressure, displayVal: displayP, min: 0.1, max: 10, step: 0.1, unit: 'atm', setter: setPressure },
    { label: 'Volume (V)', key: 'V', val: volume, displayVal: displayV, min: 1, max: 100, step: 0.5, unit: 'L', setter: setVolume },
    { label: 'Temperature (T)', key: 'T', val: temperature, displayVal: displayT, min: 100, max: 1000, step: 5, unit: 'K', setter: setTemperature },
    { label: 'Moles (n)', key: 'n', val: moles, displayVal: displayN, min: 0.1, max: 5, step: 0.1, unit: 'mol', setter: setMoles },
  ]


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => applyScenario('boyle')} style={s.btn(false)}>Boyle’s Law (P↑V↓)</button>
        <button onClick={() => applyScenario('charles')} style={s.btn(false)}>Charles’s Law (T↑V↑)</button>
      </div>

      <svg viewBox="0 0 180 160" width="100%" style={{ maxHeight: 160, background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(240,240,255,0.3)', borderRadius: 6 }}>
        {/* Container walls */}
        <rect x={20} y={pistonY} width={140} height={145 - pistonY} fill={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(200,210,255,0.15)'} stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} strokeWidth={1.5} />
        {/* Piston */}
        <rect x={15} y={pistonY - 6} width={150} height={8} rx={2} fill={isDark ? '#475569' : '#94a3b8'} stroke={isDark ? '#64748b' : '#64748b'} strokeWidth={1} />
        {/* Piston handle */}
        <rect x={82} y={pistonY - 18} width={16} height={14} rx={2} fill={isDark ? '#334155' : '#cbd5e1'} stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth={1} />
        {/* Particles */}
        {particles.map((p, i) => (
          <circle key={i} cx={Math.min(155, Math.max(25, p.x))} cy={Math.min(140, Math.max(pistonY + 5, p.y))} r={3} fill={particleColor}>
            <animate attributeName="cx" values={Math.min(155, Math.max(25, p.x)) + ';' + Math.min(155, Math.max(25, p.x + p.vx * 10)) + ';' + Math.min(155, Math.max(25, p.x))} dur={(2 - tempFrac).toFixed(1) + 's'} repeatCount="indefinite" />
            <animate attributeName="cy" values={Math.min(140, Math.max(pistonY + 5, p.y)) + ';' + Math.min(140, Math.max(pistonY + 5, p.y + p.vy * 10)) + ';' + Math.min(140, Math.max(pistonY + 5, p.y))} dur={(2 - tempFrac).toFixed(1) + 's'} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>

      {/* Real-time PV Diagram */}
      <div style={{ borderRadius: 4, background: s.bg, border: '1px solid ' + s.border, padding: '6px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: s.bright, marginBottom: 4 }}>{'PV Diagram (real-time)'}</div>
        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: s.text }}>
          <span>P = <b style={{ color: s.bright }}>{displayP.toFixed(2)} atm</b></span>
          <span>V = <b style={{ color: s.bright }}>{displayV.toFixed(2)} L</b></span>
          <span>PV = <b style={{ color: '#34d399' }}>{(displayP * displayV).toFixed(2)} atm*L</b></span>
        </div>
        <div style={{ fontSize: 9, color: s.text, marginTop: 4, opacity: 0.7 }}>Lock 3 variables and adjust the 4th. Green value is auto-calculated.</div>
      </div>

      {sliders.map(sl => {
        const isLocked = locked.has(sl.key)
        const isComputed = result && result.key === sl.key
        return (
          <div key={sl.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
            <span style={{ color: s.text, width: 105, flexShrink: 0 }}>{sl.label}</span>
            <input type="range" min={sl.min} max={sl.max} step={sl.step} value={isLocked ? Math.min(sl.max, Math.max(sl.min, sl.displayVal)) : sl.val}
              onChange={e => { if (!isLocked) sl.setter(parseFloat(e.target.value)) }}
              style={{ flex: 1, accentColor: '#34d399', opacity: isLocked ? 0.4 : 1 }} />
            <span style={{ color: isComputed ? '#34d399' : s.bright, fontWeight: 600, width: 55, textAlign: 'right', fontSize: 10 }}>{parseFloat(sl.displayVal.toFixed(2))} {sl.unit}</span>
            <button onClick={() => toggleLock(sl.key)} style={{ ...s.btn(isLocked), minWidth: 18, textAlign: 'center', fontSize: 12, fontWeight: 700 }}>{isLocked ? '🔒' : '🔓'}</button>
          </div>
        )
      })}

      <div style={{ fontSize: 9, color: s.text, opacity: 0.7 }}>
        PV = nRT | R = 0.08206 L·atm/(mol·K) | Lock 3 variables, adjust the 4th
      </div>
    </div>
  )
}

/* ============================================================
   Acid-Base Titration (Grades 9-12)
   ============================================================ */
export function AcidBaseTitration({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [acidConc, setAcidConc] = useState(0.1)
  const [acidVol, setAcidVol] = useState(25)
  const [baseConc, setBaseConc] = useState(0.1)
  const [baseAdded, setBaseAdded] = useState(0)

  const equivVol = (acidConc * acidVol) / baseConc
  const totalVol = acidVol + baseAdded
  const molesAcidInit = acidConc * acidVol / 1000
  const molesBaseAdded = baseConc * baseAdded / 1000

  const calcPH = () => {
    if (baseAdded === 0) {
      const ha = acidConc
      return -Math.log10(ha)
    }
    if (Math.abs(baseAdded - equivVol) < 0.5) {
      return 7.0
    }
    if (baseAdded < equivVol) {
      const excess = molesAcidInit - molesBaseAdded
      const conc = excess / (totalVol / 1000)
      return -Math.log10(Math.max(1e-14, conc))
    }
    const excess = molesBaseAdded - molesAcidInit
    const conc = excess / (totalVol / 1000)
    const poh = -Math.log10(Math.max(1e-14, conc))
    return 14 - poh
  }

  const pH = calcPH()

  const pHColor = (val: number) => {
    const clamped = Math.max(0, Math.min(14, val))
    if (clamped < 3) return '#ef4444'
    if (clamped < 5) return '#f97316'
    if (clamped < 6.5) return '#eab308'
    if (clamped < 7.5) return '#22c55e'
    if (clamped < 9) return '#06b6d4'
    if (clamped < 11) return '#3b82f6'
    return '#7c3aed'
  }

  const curvePoints = useMemo(() => {
    const pts: { x: number; y: number }[] = []
    const steps = 60
    const maxVol = equivVol * 2
    for (let i = 0; i <= steps; i++) {
      const bv = (i / steps) * maxVol
      let ph: number
      if (bv === 0) {
        ph = -Math.log10(acidConc)
      } else if (Math.abs(bv - equivVol) < maxVol / steps * 0.5) {
        ph = 7.0
      } else if (bv < equivVol) {
        const ma = acidConc * acidVol / 1000
        const mb = baseConc * bv / 1000
        const excess = ma - mb
        const conc = excess / ((acidVol + bv) / 1000)
        ph = -Math.log10(Math.max(1e-14, conc))
      } else {
        const ma = acidConc * acidVol / 1000
        const mb = baseConc * bv / 1000
        const excess = mb - ma
        const conc = excess / ((acidVol + bv) / 1000)
        ph = 14 + Math.log10(Math.max(1e-14, conc))
      }
      ph = Math.max(0, Math.min(14, ph))
      pts.push({ x: bv, y: ph })
    }
    return pts
  }, [acidConc, acidVol, baseConc])

  const maxX = equivVol * 2
  const svgW = 280
  const svgH = 160
  const pad = { l: 30, r: 10, t: 10, b: 25 }
  const plotW = svgW - pad.l - pad.r
  const plotH = svgH - pad.t - pad.b

  const toSVGX = (vol: number) => pad.l + (vol / maxX) * plotW
  const toSVGY = (ph: number) => pad.t + plotH - (ph / 14) * plotH

  const pathD = curvePoints.map((p, i) => (i === 0 ? 'M' : 'L') + toSVGX(p.x).toFixed(1) + ' ' + toSVGY(p.y).toFixed(1)).join(' ')
  const currentX = toSVGX(Math.min(baseAdded, maxX))
  const currentY = toSVGY(Math.max(0, Math.min(14, pH)))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
          <span style={{ color: s.text }}>Acid (M):</span>
          <input type="number" value={acidConc} onChange={e => setAcidConc(Math.max(0.001, parseFloat(e.target.value) || 0.1))} step={0.01} min={0.001} max={2} style={{ ...s.input, width: 60 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
          <span style={{ color: s.text }}>Acid vol (mL):</span>
          <input type="number" value={acidVol} onChange={e => setAcidVol(Math.max(1, parseFloat(e.target.value) || 25))} step={1} min={1} max={100} style={{ ...s.input, width: 50 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
          <span style={{ color: s.text }}>Base (M):</span>
          <input type="number" value={baseConc} onChange={e => setBaseConc(Math.max(0.001, parseFloat(e.target.value) || 0.1))} step={0.01} min={0.001} max={2} style={{ ...s.input, width: 60 }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={() => setBaseAdded(prev => Math.min(prev + 1, equivVol * 2))} style={{ ...s.btn(false), padding: '4px 10px', fontSize: 11, fontWeight: 600, background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>+1 mL</button>
        <button onClick={() => setBaseAdded(prev => Math.min(prev + 5, equivVol * 2))} style={{ ...s.btn(false), padding: '4px 10px', fontSize: 11, fontWeight: 600, background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>+5 mL</button>
        <button onClick={() => setBaseAdded(0)} style={s.btn(false)}>Reset</button>
        <span style={{ fontSize: 10, color: s.text, marginLeft: 4 }}>Added: <strong style={{ color: s.bright }}>{baseAdded.toFixed(1)} mL</strong> / Equiv: <strong style={{ color: s.bright }}>{equivVol.toFixed(1)} mL</strong></span>
      </div>

      <svg viewBox={'0 0 ' + svgW + ' ' + svgH} width="100%" style={{ maxHeight: 160, pointerEvents: 'none' as const }}>
        {/* Grid lines */}
        {[0, 2, 4, 6, 8, 10, 12, 14].map(ph => (
          <g key={'grid-' + ph}>
            <line x1={pad.l} y1={toSVGY(ph)} x2={svgW - pad.r} y2={toSVGY(ph)} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} strokeWidth={0.5} />
            <text x={pad.l - 4} y={toSVGY(ph) + 3} textAnchor="end" fontSize={7} fill={s.text}>{ph}</text>
          </g>
        ))}
        {/* pH 7 line */}
        <line x1={pad.l} y1={toSVGY(7)} x2={svgW - pad.r} y2={toSVGY(7)} stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'} strokeWidth={0.5} strokeDasharray="3,3" />
        {/* Curve */}
        <path d={pathD} fill="none" stroke="#34d399" strokeWidth={2} />
        {/* Equivalence point marker */}
        <line x1={toSVGX(equivVol)} y1={pad.t} x2={toSVGX(equivVol)} y2={pad.t + plotH} stroke={isDark ? 'rgba(251,191,36,0.4)' : 'rgba(217,119,6,0.3)'} strokeWidth={1} strokeDasharray="4,2" />
        <text x={toSVGX(equivVol)} y={pad.t + plotH + 12} textAnchor="middle" fontSize={7} fill={isDark ? '#fbbf24' : '#d97706'}>eq. pt.</text>
        {/* Current point */}
        <circle cx={currentX} cy={currentY} r={4} fill={pHColor(pH)} stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={1.5} />
        {/* Axes labels */}
        <text x={svgW / 2} y={svgH - 2} textAnchor="middle" fontSize={7} fill={s.text}>Volume base (mL)</text>
      </svg>

      <div style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 6, padding: '6px 8px', display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: pHColor(pH), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{parseFloat(pH.toFixed(1))}</div>
        <div style={{ fontSize: 10, color: s.text, lineHeight: 1.6 }}>
          <div>pH: <strong style={{ color: s.bright }}>{parseFloat(pH.toFixed(2))}</strong></div>
          <div>Status: <strong style={{ color: pH < 7 ? '#f87171' : pH > 7 ? '#60a5fa' : '#34d399' }}>{baseAdded < equivVol - 0.5 ? 'Before equivalence' : Math.abs(baseAdded - equivVol) < 0.5 ? 'At equivalence' : 'Past equivalence'}</strong></div>
          <div>Total volume: <strong style={{ color: s.bright }}>{totalVol.toFixed(1)} mL</strong></div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Ion Formation Visualizer (Grades 6-8)
   ============================================================ */
const ION_ELEMENTS = [
  { sym: 'Na', z: 11, name: 'Sodium', config: '2-8-1', ionConfig: '2-8', charge: '+1', loses: 1, color: '#f59e0b' },
  { sym: 'Mg', z: 12, name: 'Magnesium', config: '2-8-2', ionConfig: '2-8', charge: '+2', loses: 2, color: '#a3a3a3' },
  { sym: 'Al', z: 13, name: 'Aluminum', config: '2-8-3', ionConfig: '2-8', charge: '+3', loses: 3, color: '#a8a29e' },
  { sym: 'K', z: 19, name: 'Potassium', config: '2-8-8-1', ionConfig: '2-8-8', charge: '+1', loses: 1, color: '#c084fc' },
  { sym: 'Ca', z: 20, name: 'Calcium', config: '2-8-8-2', ionConfig: '2-8-8', charge: '+2', loses: 2, color: '#86efac' },
  { sym: 'Fe', z: 26, name: 'Iron', config: '2-8-14-2', ionConfig: '2-8-14', charge: '+2', loses: 2, color: '#fb923c' },
  { sym: 'Cu', z: 29, name: 'Copper', config: '2-8-18-1', ionConfig: '2-8-18', charge: '+1', loses: 1, color: '#f97316' },
  { sym: 'Zn', z: 30, name: 'Zinc', config: '2-8-18-2', ionConfig: '2-8-18', charge: '+2', loses: 2, color: '#a1a1aa' },
  { sym: 'Cl', z: 17, name: 'Chlorine', config: '2-8-7', ionConfig: '2-8-8', charge: '-1', loses: -1, color: '#22c55e' },
  { sym: 'O', z: 8, name: 'Oxygen', config: '2-6', ionConfig: '2-8', charge: '-2', loses: -2, color: '#ef4444' },
  { sym: 'N', z: 7, name: 'Nitrogen', config: '2-5', ionConfig: '2-8', charge: '-3', loses: -3, color: '#3b82f6' },
  { sym: 'F', z: 9, name: 'Fluorine', config: '2-7', ionConfig: '2-8', charge: '-1', loses: -1, color: '#10b981' },
  { sym: 'S', z: 16, name: 'Sulfur', config: '2-8-6', ionConfig: '2-8-8', charge: '-2', loses: -2, color: '#eab308' },
]

function drawShell(cx: number, cy: number, maxElectrons: number, totalElectrons: number, highlightCount: number, isGain: boolean, isDark: boolean) {
  const r = 18 + maxElectrons * 1.5
  const elements: React.ReactNode[] = []
  const electronsToShow = Math.min(totalElectrons, 16)
  const startHighlight = isGain ? totalElectrons - Math.abs(highlightCount) : totalElectrons - Math.abs(highlightCount)

  elements.push(
    <circle key={'shell-' + cx + '-' + cy} cx={cx} cy={cy} r={r} fill="none" stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'} strokeWidth={0.8} strokeDasharray="3,2" />
  )

  for (let i = 0; i < electronsToShow; i++) {
    const angle = (2 * Math.PI * i / electronsToShow) - Math.PI / 2
    const ex = cx + r * Math.cos(angle)
    const ey = cy + r * Math.sin(angle)
    const isHighlighted = highlightCount !== 0 && ((isGain && i >= startHighlight) || (!isGain && i >= startHighlight))
    elements.push(
      <circle key={'e-' + cx + '-' + i} cx={ex} cy={ey} r={3} fill={isHighlighted
        ? (isGain ? '#34d399' : '#f87171')
        : (isDark ? '#94a3b8' : '#64748b')
      } stroke={isHighlighted ? (isGain ? '#059669' : '#dc2626') : 'none'} strokeWidth={isHighlighted ? 1 : 0} />
    )
  }
  return elements
}

export function IonFormationVisualizer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [elemIdx, setElemIdx] = useState(0)
  const elem = ION_ELEMENTS[elemIdx]
  const shells = elem.config.split('-').map(Number)
  const ionShells = elem.ionConfig.split('-').map(Number)
  const isGain = elem.loses < 0
  const electronChange = Math.abs(elem.loses)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {ION_ELEMENTS.map((el, i) => (
          <button key={el.sym} onClick={() => setElemIdx(i)} style={s.btn(i === elemIdx)}>{el.sym}</button>
        ))}
      </div>

      <svg viewBox="0 0 320 140" width="100%" style={{ maxHeight: 160 }}>
        {/* Neutral atom */}
        <g>
          <text x={80} y={12} textAnchor="middle" fontSize={9} fontWeight={600} fill={s.bright}>Neutral Atom</text>
          <circle cx={80} cy={75} r={14} fill={elem.color} opacity={0.2} stroke={elem.color} strokeWidth={1} />
          <text x={80} y={76} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700} fill={elem.color}>{elem.sym}</text>
          <text x={80} y={95} textAnchor="middle" fontSize={8} fill={s.text}>{elem.name}</text>
          {shells.map((count, si) => drawShell(80, 75, si === 0 ? 2 : 8, count, si === shells.length - 1 ? electronChange : 0, isGain, isDark))}
        </g>

        {/* Arrow */}
        <g>
          <line x1={155} y1={75} x2={185} y2={75} stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={2} markerEnd="url(#arrowIon)" />
          <defs>
            <marker id="arrowIon" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill={isDark ? '#e2e8f0' : '#1e293b'} />
            </marker>
          </defs>
          <text x={170} y={65} textAnchor="middle" fontSize={8} fill={s.text}>{isGain ? 'gains ' + electronChange + ' e⁻' : 'loses ' + electronChange + ' e⁻'}</text>
        </g>

        {/* Ion */}
        <g>
          <text x={250} y={12} textAnchor="middle" fontSize={9} fontWeight={600} fill={s.bright}>Ion</text>
          <circle cx={250} cy={75} r={14} fill={elem.color} opacity={0.35} stroke={elem.color} strokeWidth={1.5} />
          <text x={250} y={76} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700} fill={elem.color}>{elem.sym}</text>
          <text x={266} y={68} textAnchor="middle" fontSize={10} fontWeight={800} fill={elem.charge.startsWith('+') ? '#f87171' : '#60a5fa'}>{elem.charge}</text>
          <text x={250} y={95} textAnchor="middle" fontSize={8} fill={s.text}>{elem.sym + elem.charge + ' ion'}</text>
          {ionShells.map((count, si) => drawShell(250, 75, si === 0 ? 2 : 8, count, 0, false, isDark))}
        </g>
      </svg>

      <div style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 6, padding: '6px 8px', fontSize: 10, color: s.text }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Electron config (neutral):</span><span style={{ color: s.bright, fontWeight: 600 }}>{elem.config}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Electron config (ion):</span><span style={{ color: s.bright, fontWeight: 600 }}>{elem.ionConfig}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Charge:</span><span style={{ color: elem.charge.startsWith('+') ? '#f87171' : '#60a5fa', fontWeight: 700 }}>{elem.charge}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Process:</span><span style={{ color: s.bright }}>{elem.name} {isGain ? 'gains' : 'loses'} {electronChange} electron{electronChange > 1 ? 's' : ''} to form {elem.sym}{elem.charge}</span></div>
      </div>
    </div>
  )
}
