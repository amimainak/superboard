'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'

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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: {selElem ? 'Selected: ' + selElem.nm + ' (' + selElem.s + ')' : 'Click an element to explore'}</div>
          <div>Step 2: {selElem ? 'Atomic #: ' + selElem.n + ', Mass: ' + selElem.m + ' u' : 'Row = shells, Column = valence electrons'}</div>
          <div>Step 3: {selElem ? 'Category: ' + catLabel(selElem.cat) : 'Valence electrons determine chemistry'}</div>
          <div>Step 4: {selElem ? 'Electron config: ' + selElem.ec : 'Metals lose, nonmetals gain electrons'}</div>
          <div>Step 5: Noble gases (Group 18) = stable, full valence</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Same column = same valence electrons = similar chemistry. Period = electron shells. The table predicts behavior from position.
      </div>
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

  // Derived values for dynamic step display
  const unbalancedEls = Object.entries(beforeCounts)
    .filter(([_, c]) => c.l !== c.r)
    .map(([el]) => el)
  const balancedStr = result
    ? result.slice(0, reactants.length).map((c, i) => c + reactants[i]).join(' + ') +
      ' \u2192 ' +
      result.slice(reactants.length).map((c, i) => c + products[i]).join(' + ')
    : null

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 58 }}>Reactants:</span>
          <input style={{ ...s.input, flex: 1, minWidth: 0 }} aria-label="Reactants" value={reactStr} onChange={e => { setReactStr(e.target.value); setResult(null); setAttempted(false) }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 58 }}>Products:</span>
          <input style={{ ...s.input, flex: 1, minWidth: 0 }} aria-label="Products" value={prodStr} onChange={e => { setProdStr(e.target.value); setResult(null); setAttempted(false) }} />
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Equation: <b style={{ color: s.bright }}>{reactStr || '?'}</b> {'\u2192'} <b style={{ color: s.bright }}>{prodStr || '?'}</b></div>
          <div>Step 2: Reactants parsed: {reactants.length ? reactants.join(' + ') : '(none)'}</div>
          <div>Step 3: Products parsed: {products.length ? products.join(' + ') : '(none)'}</div>
          <div>Step 4: Atom counts (reactant | product): {Object.keys(beforeCounts).length ? Object.entries(beforeCounts).map(([el, c]) => el + ': ' + c.l + ' | ' + c.r).join(', ') : '\u2014'}</div>
          <div>Step 5: Unbalanced elements: {unbalancedEls.length ? unbalancedEls.join(', ') : (attempted && result ? 'none \u2014 balanced!' : '\u2014')}</div>
          <div>Step 6: After coefficients: {!attempted ? '(click Balance)' : afterCounts ? Object.entries(afterCounts).map(([el, c]) => el + ': ' + c.l + '=' + c.r).join(', ') : 'could not balance (coeff > 20)'}</div>
          <div>Step 7: Balanced: {balancedStr ? <b style={{ color: isDark ? '#34d399' : '#059669' }}>{balancedStr}</b> : (attempted ? 'no solution found' : 'click Balance')}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Conservation of Mass: atoms can't be created or destroyed. Start with 10 oxygen → end with 10. Balancing enforces this law.
      </div>
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
          <input type="number" aria-label="pH value" min={0} max={14} step={0.1} value={ph}
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
                {/* Dynamic step-by-step — updates with pH value */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: [H⁺] = {formatConc(concentration)}</div>
        <div>Step 2: pH = -log₁₀({formatConc(concentration)})</div>
        <div>Step 3: log₁₀ = {Math.log10(concentration).toFixed(2)}</div>
        <div>Step 4: pH = -({Math.log10(concentration).toFixed(2)}) = <b style={{ color: isDark ? '#34d399' : '#059669' }}>{ph.toFixed(1)}</b></div>
        <div>Step 5: {ph < 7 ? 'Acidic (pH &lt; 7)' : ph === 7 ? 'Neutral (pH = 7)' : 'Basic (pH &gt; 7)'}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> pH is logarithmic: each unit = 10× difference. pH 3 is 10× more acidic than pH 4. The scale compresses 14 orders of magnitude to 0-14.
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

  // Live preview of scientific notation from input1 (no button click required)
  const parsedNum = parseNumberInput(input1)
  const previewSci = parsedNum !== null ? toSciNotation(parsedNum) : null

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: s.text, minWidth: 38 }}>Number:</span>
          <input style={{ ...s.input, flex: 1, minWidth: 0 }} aria-label="First number" value={input1}
            onChange={e => setInput1(e.target.value)} placeholder="e.g. 3500000 or 3.5e6" />
        </div>
        {isOp && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: s.text, minWidth: 38 }}>Number 2:</span>
            <input style={{ ...s.input, flex: 1, minWidth: 0 }} aria-label="Second number" value={input2}
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Input: <b style={{ color: s.bright }}>{input1 || '?'}</b></div>
          <div>Step 2: Parsed value: {parsedNum === null ? (input1 ? '? (invalid)' : '(enter a number)') : parsedNum.toString()}</div>
          <div>Step 3: Move decimal after first non-zero digit {'\u2192'} mantissa: {previewSci ? previewSci.mantissa : '?'}</div>
          <div>Step 4: Exponent (places moved): {previewSci ? previewSci.exponent + (previewSci.exponent >= 0 ? ' (moved left \u2192 positive)' : ' (moved right \u2192 negative)') : '?'}</div>
          <div>Step 5: Scientific form: {previewSci ? previewSci.mantissa + ' \u00d7 10^' + previewSci.exponent : '?'}</div>
          <div>Step 6: Result: {result ? <b style={{ color: isDark ? '#34d399' : '#059669' }}>{result.sci}</b> : '(click a mode button)'}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> The exponent = how many places to move the decimal. Positive = right (big), negative = left (small). Handles very large/small numbers.
      </div>
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
        <input style={{ ...s.input, flex: 1, minWidth: 0 }} aria-label="Chemical formula" value={formula}
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
                {/* Dynamic step-by-step — updates with formula input */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Formula: {formula}</div>
        {result && !hasError ? (
          <>
            <div>Step 2: Parsed elements: {result.breakdown.map(b => b.element + '(' + b.count + ')').join(', ')}</div>
            {result.breakdown.map((b, i) => (
              <div key={i}>Step {3 + i}: {b.count} × {b.atomicWeight} = {parseFloat(b.subtotal.toFixed(3))} g/mol</div>
            ))}
            <div>Step {3 + result.breakdown.length}: Total = <b style={{ color: isDark ? '#34d399' : '#059669' }}>{parseFloat(result.total.toFixed(3))} g/mol</b></div>
          </>
        ) : (
          <div style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Enter a valid formula to see element-by-element breakdown</div>
        )}
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> One mole = 6.022×10²³ particles. Molar mass connects atomic scale to grams. For H₂O: 18g = 6.022×10²³ molecules.
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: {mode === 'atom' ? 'Element: ' + currentElement.name + ' (' + currentElement.sym + ', Z=' + currentElement.z + ')' : 'Molecule: ' + ex.label} — Total valence e⁻: <b style={{ color: s.bright }}>{totalValence}</b></div>
          <div>Step 2: {mode === 'atom' ? 'Valence electrons: ' + currentElement.val + ' (group number)' : 'Central atom: ' + ex.central + ' (least electronegative, never H)'}</div>
          <div>Step 3: {mode === 'atom' ? 'Draw ' + currentElement.val + ' dot(s) around symbol ' + currentElement.sym : 'Connect ' + ex.terminals.reduce((sum, t) => sum + t.count, 0) + ' terminal atom(s) with bonds = ' + (totalBonds * 2) + ' e⁻ shared'}</div>
          <div>Step 4: {mode === 'atom' ? 'Lone pairs: ' + lonePairsCount : 'Distribute remaining ' + (totalValence - totalBonds * 2) + ' e⁻ → ' + lonePairsCount + ' lone pair(s) on central ' + ex.central}</div>
          <div>Step 5: {mode === 'atom' ? 'Octet check: ' + currentElement.val + '/8' + (currentElement.val === 8 ? ' ✓' : currentElement.val === 2 ? ' (duet for H/He)' : '') : 'Octet on central ' + ex.central + ': ' + (totalBonds * 2 + lonePairsCount * 2) + '/8' + (totalBonds * 2 + lonePairsCount * 2 === 8 ? ' ✓' : '')}</div>
          <div>Step 6: {mode === 'atom' ? 'Single atom — bonding N/A' : 'Bond types: ' + ex.terminals.map(t => t.sym + ' ' + (t.bonds === 1 ? 'single' : t.bonds === 2 ? 'double' : 'triple')).join(', ')}</div>
          <div>Step 7: Verification: {totalValence} total e⁻ accounted for {mode === 'molecule' ? '(' + (totalBonds * 2) + ' bonding + ' + (lonePairsCount * 2) + ' lone)' : ''} {mode === 'molecule' && totalBonds * 2 + lonePairsCount * 2 === totalValence ? <b style={{ color: isDark ? '#34d399' : '#059669' }}>✓ matches</b> : ''}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Octet rule: atoms bond to get 8 valence electrons. Dots = valence electrons, lines = shared pairs. H wants 2, B wants 6 (exceptions).
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: {d ? 'Molecule: ' + d.formula + ' — ' + d.geometry : 'Select a molecule'}</div>
          <div>Step 2: {d ? 'See 3D structure above (' + d.hybridization + ', ' + d.bondAngle + ')' : 'Choose from CH4, NH3, H2O, etc.'}</div>
          <div>Step 3: Electron domains repel → maximum distance</div>
          <div>Step 4: 4 domains = tetrahedral (109.5°)</div>
          <div>Step 5: Lone pairs compress bond angles</div>
          <div>Step 6: Shape = arrangement of atoms (not electrons)</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Electron pairs repel → molecules maximize distance. 4 pairs = tetrahedral (109.5°). Lone pairs push harder than bonds.
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
            <input type="range" aria-label={`${sl.label} slider`} min={sl.min} max={sl.max} step={sl.step} value={isLocked ? Math.min(sl.max, Math.max(sl.min, sl.displayVal)) : sl.val}
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Variables: P = {displayP.toFixed(2)} atm, V = {displayV.toFixed(2)} L, T = {displayT.toFixed(2)} K, n = {displayN.toFixed(2)} mol</div>
          <div>Step 2: Locked: {locked.size === 3 ? [...locked].join(', ') + ' (computing ' + (result ? result.key : '?') + ')' : 'need 3 locked — currently ' + locked.size}</div>
          <div>Step 3: Gas constant R = {R} L·atm/(mol·K); Ideal gas law: PV = nRT</div>
          <div>Step 4: Substitute: ({displayP.toFixed(2)}) × ({displayV.toFixed(2)}) = ({displayN.toFixed(2)}) × ({R}) × ({displayT.toFixed(2)})</div>
          <div>Step 5: LHS (PV) = <b style={{ color: s.bright }}>{(displayP * displayV).toFixed(2)}</b> | RHS (nRT) = <b style={{ color: s.bright }}>{(displayN * R * displayT).toFixed(2)}</b></div>
          <div>Step 6: {result ? 'Computed ' + result.key + ' = ' : 'Lock exactly 3 variables to compute the 4th'}{result ? <b style={{ color: isDark ? '#34d399' : '#059669' }}>{parseFloat(result.val.toFixed(4))}</b> : ''}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Boyle: P↑ V↓ (squeeze balloon). Charles: T↑ V↑ (warm air rises). Ideal gas law PV=nRT ties them together.
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
          <input type="number" aria-label="Acid concentration in molarity" value={acidConc} onChange={e => setAcidConc(Math.max(0.001, parseFloat(e.target.value) || 0.1))} step={0.01} min={0.001} max={2} style={{ ...s.input, width: 60 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
          <span style={{ color: s.text }}>Acid vol (mL):</span>
          <input type="number" aria-label="Acid volume in milliliters" value={acidVol} onChange={e => setAcidVol(Math.max(1, parseFloat(e.target.value) || 25))} step={1} min={1} max={100} style={{ ...s.input, width: 50 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
          <span style={{ color: s.text }}>Base (M):</span>
          <input type="number" aria-label="Base concentration in molarity" value={baseConc} onChange={e => setBaseConc(Math.max(0.001, parseFloat(e.target.value) || 0.1))} step={0.01} min={0.001} max={2} style={{ ...s.input, width: 60 }} />
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Reaction: HA + BOH → BA + H₂O (acid + base → salt + water)</div>
          <div>Step 2: Acid: {acidConc.toFixed(2)} M × {acidVol.toFixed(0)} mL = {(molesAcidInit * 1000).toFixed(3)} mmol | Base added: {baseConc.toFixed(2)} M × {baseAdded.toFixed(1)} mL = {(molesBaseAdded * 1000).toFixed(3)} mmol</div>
          <div>Step 3: Equivalence volume (M₁V₁ = M₂V₂): <b style={{ color: s.bright }}>{equivVol.toFixed(2)} mL</b></div>
          <div>Step 4: Status: {baseAdded < equivVol - 0.5 ? 'before equivalence — excess acid, pH = ' + pH.toFixed(2) : Math.abs(baseAdded - equivVol) < 0.5 ? 'AT equivalence — pH ≈ 7' : 'past equivalence — excess base, pH = ' + pH.toFixed(2)}</div>
          <div>Step 5: {Math.abs(baseAdded - equivVol) < 0.5 ? 'Sudden pH jump at equivalence (steep curve)' : 'pH curve ' + (baseAdded < equivVol ? 'rising slowly (buffered)' : 'flattening (excess base)')}</div>
          <div>Step 6: Total volume: {totalVol.toFixed(1)} mL | Current pH: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{pH.toFixed(2)}</b></div>
          <div>Step 7: Indicator should change color near equivalence pH (≈7); current pH = {pH.toFixed(2)}</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> At equivalence point: moles acid = moles base. pH jumps sharply here. Indicators change color at this sudden shift.
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
                {/* Step-by-step derivation */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works</div>
          <div>Step 1: Element: <b style={{ color: s.bright }}>{elem.name} ({elem.sym}, Z={elem.z})</b> — electron config: {elem.config}</div>
          <div>Step 2: Valence electrons: {shells[shells.length - 1]} (outermost shell) — goal: noble gas config {elem.ionConfig}</div>
          <div>Step 3: {isGain ? 'Nonmetal — needs to GAIN electrons' : 'Metal — needs to LOSE electrons'}: {isGain ? 'gaining' : 'losing'} {electronChange} e⁻</div>
          <div>Step 4: Process: {elem.name} {isGain ? 'gains' : 'loses'} {electronChange} electron{electronChange > 1 ? 's' : ''} → ion config: {elem.ionConfig}</div>
          <div>Step 5: Charge: {isGain ? '+' + electronChange + ' extra e⁻ → ' + elem.charge : electronChange + ' fewer e⁻ → ' + elem.charge}</div>
          <div>Step 6: Result: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{elem.sym}{elem.charge} ion</b> — opposite charges attract → ionic bond</div>
      </div>
{/* Instructional insight */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Metals LOSE electrons (positive ions). Nonmetals GAIN electrons (negative ions). Opposite charges attract = ionic bond.
      </div>
</div>
  )
}

/* ============================================================
   17. StatesOfMatterExplorer (K-5)
   ============================================================ */

interface SoMParticle {
  hx: number; hy: number; phase: number
}

function somParticlePos(p: SoMParticle, temp: number, tick: number): { x: number; y: number } {
  const energy = Math.max(0.2, (temp + 50) / 50) // ~0.2 at -50°C, ~5 at 200°C
  if (temp < 0) {
    // Solid — vibrate tightly around home position
    const amp = 0.6 + energy * 0.5
    return {
      x: p.hx + Math.sin(tick * 0.4 + p.phase) * amp,
      y: p.hy + Math.cos(tick * 0.4 + p.phase * 1.3) * amp,
    }
  } else if (temp <= 100) {
    // Liquid — drift loosely, stay near lower half
    const t = tick * 0.05
    return {
      x: p.hx + Math.sin(t + p.phase) * 9 + Math.cos(t * 1.3 + p.phase) * 3,
      y: p.hy + Math.cos(t * 0.7 + p.phase * 1.5) * 5 + Math.sin(t * 1.7 + p.phase) * 2,
    }
  } else {
    // Gas — fly across whole container
    const t = tick * 0.08 * Math.min(3, energy)
    return {
      x: 150 + Math.sin(t + p.phase) * 85 + Math.cos(t * 1.7 + p.phase * 2) * 18,
      y: 85 + Math.cos(t * 1.2 + p.phase * 1.3) * 60 + Math.sin(t * 2.1 + p.phase) * 12,
    }
  }
}

export function StatesOfMatterExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [temp, setTemp] = useState(25)
  const [tick, setTick] = useState(0)

  // 3 cols × 4 rows = 12 particles in lower-middle of container
  const particles = useMemo<SoMParticle[]>(() => {
    const out: SoMParticle[] = []
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        out.push({
          hx: 90 + c * 60,
          hy: 50 + r * 28,
          phase: Math.random() * Math.PI * 2,
        })
      }
    }
    return out
  }, [])

  const tempRef = useRef(temp)
  tempRef.current = temp

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      if (now - last > 33) { // ~30fps
        setTick(t => t + 1)
        last = now
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const state: 'Solid' | 'Liquid' | 'Gas' = temp < 0 ? 'Solid' : temp <= 100 ? 'Liquid' : 'Gas'
  const waterForm = temp < 0 ? 'Ice' : temp <= 100 ? 'Water' : 'Steam'
  const energy = Math.max(0.2, (temp + 50) / 50)
  const energyLabel = energy < 1 ? 'low' : energy < 2.5 ? 'medium' : 'high'
  const stateColor = state === 'Solid' ? '#bae6fd' : state === 'Liquid' ? '#38bdf8' : '#cbd5e1'
  const motionDesc = state === 'Solid'
    ? 'vibrate in place — locked in a tight grid'
    : state === 'Liquid'
    ? 'slide past each other but stay close together'
    : 'fly freely and bounce off the walls'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox="0 0 300 190" width="100%" style={{ maxHeight: 200 }}>
        {/* Container */}
        <rect x={45} y={20} width={210} height={140} rx={6}
          fill={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}
          stroke={s.border} strokeWidth={1.5} />
        {/* Lid for gas state (escaping) */}
        {state === 'Gas' && (
          <g opacity={0.6}>
            <line x1={45} y1={20} x2={255} y2={20} stroke={s.border} strokeWidth={1} strokeDasharray="3 3" />
            <text x={150} y={14} textAnchor="middle" fontSize={7} fill={s.text}>particles escaping → gas fills any container</text>
          </g>
        )}
        {/* Liquid fill tint (subtle) */}
        {state === 'Liquid' && (
          <rect x={46} y={50} width={208} height={109} rx={4} fill="rgba(56,189,248,0.08)" />
        )}
        {/* Solid lattice hint (faint grid lines) */}
        {state === 'Solid' && (
          <g stroke={s.border} strokeWidth={0.4} opacity={0.5}>
            {[90, 150, 210].map(x => <line key={'vx'+x} x1={x} y1={40} x2={x} y2={155} />)}
            {[50, 78, 106, 134].map(y => <line key={'hy'+y} x1={50} y1={y} x2={250} y2={y} />)}
          </g>
        )}
        {/* Motion trails for gas particles */}
        {state === 'Gas' && particles.map((p, i) => {
          const pos = somParticlePos(p, temp, tick)
          const prev = somParticlePos(p, temp, tick - 3)
          return (
            <line key={'trail'+i} x1={prev.x} y1={prev.y} x2={pos.x} y2={pos.y}
              stroke={stateColor} strokeWidth={0.6} opacity={0.4} />
          )
        })}
        {/* Particles */}
        {particles.map((p, i) => {
          const pos = somParticlePos(p, temp, tick)
          return (
            <g key={i}>
              <circle cx={pos.x} cy={pos.y} r={state === 'Gas' ? 3 : 4}
                fill={stateColor} stroke={isDark ? '#0ea5e9' : '#0284c7'} strokeWidth={0.6} />
              {state === 'Solid' && (
                <circle cx={p.hx} cy={p.hy} r={1} fill={s.text} opacity={0.3} />
              )}
            </g>
          )
        })}
        {/* Thermometer */}
        <g transform="translate(270, 25)">
          <rect x={0} y={0} width={10} height={130} rx={5} fill={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'} stroke={s.border} strokeWidth={0.5} />
          <rect x={2} y={130 - Math.min(130, Math.max(0, (temp + 50) / 250 * 130))} width={6}
            height={Math.min(130, Math.max(0, (temp + 50) / 250 * 130))}
            fill={temp < 0 ? '#60a5fa' : temp <= 100 ? '#f87171' : '#ef4444'} />
          <text x={5} y={142} textAnchor="middle" fontSize={6} fill={s.text}>°C</text>
        </g>
        {/* State label */}
        <text x={150} y={178} textAnchor="middle" fontSize={12} fontWeight={700} fill={stateColor}>{state} — {waterForm}</text>
      </svg>

      {/* Temperature slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: s.text, minWidth: 38 }}>Temp</span>
        <input type="range" aria-label="Temperature in degrees Celsius" min={-50} max={200} step={1} value={temp}
          onChange={e => setTemp(parseInt(e.target.value, 10))}
          style={{ flex: 1, accentColor: stateColor }} />
        <span style={{ fontSize: 11, color: s.bright, minWidth: 42, textAlign: 'right' }}>{temp}°C</span>
      </div>

      {/* Quick presets */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {[
          { t: -20, label: 'Freezer ❄' },
          { t: 0, label: 'Melting 0°' },
          { t: 25, label: 'Room 25°' },
          { t: 100, label: 'Boiling 100°' },
          { t: 150, label: 'Steam 150°' },
        ].map(p => (
          <button key={p.label} onClick={() => setTemp(p.t)} style={s.btn(temp === p.t)}>{p.label}</button>
        ))}
      </div>

      {/* Dynamic step-by-step */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Temperature = <b style={{ color: s.bright }}>{temp}°C</b></div>
        <div>Step 2: At this temperature, particles have <b style={{ color: s.bright }}>{energyLabel}</b> kinetic energy (energy ≈ {energy.toFixed(1)})</div>
        <div>Step 3: Particles <b style={{ color: stateColor }}>{motionDesc}</b> → <b style={{ color: stateColor }}>{state.toUpperCase()}</b> state</div>
        <div>Step 4: For water: <b style={{ color: s.bright }}>{waterForm}</b> {temp < 0 ? '(below 0°C — frozen solid)' : temp <= 100 ? '(between 0°C and 100°C — liquid)' : '(above 100°C — boiled into vapor)'}</div>
        <div>Step 5: Add heat → particles move faster → eventually break free → becomes <b style={{ color: '#cbd5e1' }}>Gas</b></div>
        <div>Step 6: Remove heat → particles slow down → lock in place → becomes <b style={{ color: '#bae6fd' }}>Solid</b></div>
      </div>

      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Temperature measures how fast particles move (kinetic energy). The state of matter — solid, liquid, or gas — is just a result of how much energy the particles have. Same substance, different motion.
      </div>
    </div>
  )
}

/* ============================================================
   18. MixturesAndSolutions (K-5)
   ============================================================ */

const SPOON_SIZE = 5 // grams per click

export function MixturesAndSolutions({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [totalAdded, setTotalAdded] = useState(0)
  const [temp, setTemp] = useState(20)
  const [stirring, setStirring] = useState(false)
  const [stirTick, setStirTick] = useState(0)

  const waterVolume = 100 // mL
  const maxSolubility = useMemo(() => {
    // ~36g/100mL at 20°C; increases roughly linearly with temp
    return Math.max(0, 36 + (temp - 20) * 0.55)
  }, [temp])

  const dissolved = Math.min(totalAdded, maxSolubility)
  const undissolved = totalAdded - dissolved
  const concentration = dissolved / (waterVolume / 1000) // g/L
  const isSaturated = undissolved > 0

  // Stir animation
  useEffect(() => {
    if (!stirring) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      if (now - last > 50) {
        setStirTick(t => t + 1)
        last = now
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [stirring])

  // Auto-stop stirring after 3s
  useEffect(() => {
    if (!stirring) return
    const t = setTimeout(() => setStirring(false), 3000)
    return () => clearTimeout(t)
  }, [stirring, stirTick])

  const addSalt = () => setTotalAdded(v => Math.min(100, v + SPOON_SIZE))
  const reset = () => { setTotalAdded(0); setStirring(false) }

  // Visual: salt grains at bottom (each gram = 1 small dot, max ~30 shown)
  const grainCount = Math.min(30, Math.round(undissolved))
  const waterShade = dissolved / maxSolubility // 0 (clear) to 1 (saturated)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox="0 0 280 200" width="100%" style={{ maxHeight: 210 }}>
        {/* Beaker outline */}
        <path d="M 70 30 L 70 170 Q 70 180 80 180 L 200 180 Q 210 180 210 170 L 210 30"
          fill="none" stroke={s.bright} strokeWidth={2} strokeLinecap="round" />
        {/* Beaker rim */}
        <line x1={62} y1={30} x2={218} y2={30} stroke={s.bright} strokeWidth={2} strokeLinecap="round" />
        {/* Water */}
        <path d="M 72 60 L 72 168 Q 72 178 80 178 L 200 178 Q 208 178 208 168 L 208 60 Z"
          fill={`rgba(56,189,248,${0.15 + waterShade * 0.25})`} />
        {/* Water surface ripple */}
        <path d={`M 72 60 Q 105 ${58 + Math.sin(stirTick * 0.5) * 1.5}, 140 60 T 208 60`}
          fill="none" stroke="#7dd3fc" strokeWidth={1} opacity={0.8} />
        {/* Stir swirl */}
        {stirring && (
          <g opacity={0.6}>
            {[0, 1, 2, 3].map(i => {
              const ang = stirTick * 0.4 + i * Math.PI / 2
              const r = 25 + i * 8
              return (
                <ellipse key={i} cx={140} cy={120} rx={r} ry={r * 0.4}
                  fill="none" stroke="#7dd3fc" strokeWidth={0.8}
                  transform={`rotate(${(ang * 180 / Math.PI) % 360} 140 120)`} />
              )
            })}
          </g>
        )}
        {/* Undissolved salt grains at bottom */}
        {Array.from({ length: grainCount }).map((_, i) => {
          const row = Math.floor(i / 10)
          const col = i % 10
          const x = 90 + col * 11 + (row % 2 === 0 ? 0 : 5)
          const y = 168 - row * 5
          return <rect key={i} x={x} y={y} width={3} height={3} fill="#fbbf24" stroke="#f59e0b" strokeWidth={0.4} />
        })}
        {/* Salt pile label */}
        {undissolved > 0 && (
          <text x={140} y={195} textAnchor="middle" fontSize={7} fill="#fbbf24">
            {undissolved.toFixed(1)} g undissolved at bottom
          </text>
        )}
        {/* Temperature indicator */}
        <g transform="translate(225, 60)">
          <rect x={0} y={0} width={10} height={100} rx={4} fill={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'} stroke={s.border} strokeWidth={0.5} />
          <rect x={2} y={100 - (temp / 100) * 100} width={6} height={(temp / 100) * 100}
            fill={temp < 50 ? '#60a5fa' : '#f87171'} />
          <text x={5} y={112} textAnchor="middle" fontSize={6} fill={s.text}>{temp}°C</text>
        </g>
        {/* Volume tick */}
        <text x={210} y={65} textAnchor="end" fontSize={6} fill={s.text}>100mL</text>
      </svg>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button onClick={addSalt} style={s.btn(false)}>+ Add Salt ({SPOON_SIZE}g)</button>
        <button onClick={() => setStirring(true)} style={s.btn(stirring)}>Stir</button>
        <button onClick={reset} style={s.btn(false)}>Reset</button>
      </div>

      {/* Temperature slider + Heat toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: s.text, minWidth: 28 }}>Heat</span>
        <input type="range" aria-label="Heat temperature in degrees Celsius" min={5} max={90} step={1} value={temp}
          onChange={e => setTemp(parseInt(e.target.value, 10))}
          style={{ flex: 1, accentColor: '#f87171' }} />
        <span style={{ fontSize: 11, color: s.bright, minWidth: 36, textAlign: 'right' }}>{temp}°C</span>
      </div>

      {/* Live readout */}
      <div style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 6, padding: '5px 8px', fontSize: 10, color: s.text, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
        <div>Salt added: <b style={{ color: s.bright }}>{totalAdded.toFixed(1)} g</b></div>
        <div>Dissolved: <b style={{ color: '#38bdf8' }}>{dissolved.toFixed(1)} g</b></div>
        <div>Undissolved: <b style={{ color: '#fbbf24' }}>{undissolved.toFixed(1)} g</b></div>
        <div>Concentration: <b style={{ color: s.bright }}>{concentration.toFixed(1)} g/L</b></div>
        <div style={{ gridColumn: 'span 2' }}>Max solubility at {temp}°C: <b style={{ color: '#34d399' }}>{maxSolubility.toFixed(1)} g</b>{isSaturated ? ' — SATURATED' : ''}</div>
      </div>

      {/* Dynamic step-by-step */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Water volume = <b style={{ color: s.bright }}>{waterVolume} mL</b> (0.1 L), Temperature = <b style={{ color: s.bright }}>{temp}°C</b></div>
        <div>Step 2: Salt added: <b style={{ color: s.bright }}>{totalAdded.toFixed(1)} g</b></div>
        <div>Step 3: Max solubility at {temp}°C = <b style={{ color: '#34d399' }}>{maxSolubility.toFixed(1)} g</b> → <b style={{ color: '#38bdf8' }}>{dissolved.toFixed(1)} g</b> dissolved, <b style={{ color: '#fbbf24' }}>{undissolved.toFixed(1)} g</b> at bottom</div>
        <div>Step 4: Concentration = {dissolved.toFixed(1)} g ÷ 0.1 L = <b style={{ color: s.bright }}>{concentration.toFixed(1)} g/L</b></div>
        <div>Step 5: {isSaturated ? <span style={{ color: '#fbbf24' }}><b>SATURATED</b> — no more salt can dissolve at this temperature</span> : <span style={{ color: '#38bdf8' }}><b>UNSATURATED</b> — all salt dissolved, more could still dissolve</span>}</div>
        <div>Step 6: {temp > 50 ? 'Higher temperature → more salt can dissolve (heat the water to dissolve more)' : 'Heat the water to dissolve more — solubility increases with temperature'}</div>
      </div>

      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> In a solution, the dissolved substance breaks apart into tiny particles too small to see — that is why the water stays clear. When water is saturated, no more can dissolve, and the extra sinks to the bottom as a mixture, not a solution.
      </div>
    </div>
  )
}

/* ============================================================
   19. PropertiesOfMaterials (K-5)
   ============================================================ */

interface Material {
  id: string
  name: string
  icon: string
  color: string
  magnetic: boolean
  flexible: boolean
  transparent: boolean
  waterproof: boolean
}

const MATERIALS: Material[] = [
  { id: 'wood',    name: 'Wood',    icon: '🪵', color: '#a16207', magnetic: false, flexible: true,  transparent: false, waterproof: false },
  { id: 'metal',   name: 'Metal',   icon: '🔩', color: '#94a3b8', magnetic: true,  flexible: false, transparent: false, waterproof: true  },
  { id: 'glass',   name: 'Glass',   icon: '🪟', color: '#7dd3fc', magnetic: false, flexible: false, transparent: true,  waterproof: true  },
  { id: 'plastic', name: 'Plastic', icon: '🥤', color: '#f472b6', magnetic: false, flexible: true,  transparent: true,  waterproof: true  },
  { id: 'rubber',  name: 'Rubber',  icon: '🛞', color: '#1e293b', magnetic: false, flexible: true,  transparent: false, waterproof: true  },
  { id: 'fabric',  name: 'Fabric',  icon: '🧵', color: '#f87171', magnetic: false, flexible: true,  transparent: false, waterproof: false },
  { id: 'paper',   name: 'Paper',   icon: '📄', color: '#fde68a', magnetic: false, flexible: true,  transparent: false, waterproof: false },
  { id: 'stone',   name: 'Stone',   icon: '🪨', color: '#78716c', magnetic: false, flexible: false, transparent: false, waterproof: true  },
]

type PropKey = 'magnetic' | 'flexible' | 'transparent' | 'waterproof'
const PROP_LABELS: Record<PropKey, string> = {
  magnetic: 'Magnetic',
  flexible: 'Flexible',
  transparent: 'Transparent',
  waterproof: 'Waterproof',
}

export function PropertiesOfMaterials({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [selectedId, setSelectedId] = useState('metal')
  const [sortProp, setSortProp] = useState<'all' | PropKey>('all')

  // Allow tutor to TOGGLE a property on the selected material (interactive: hypothesis testing)
  const [overrides, setOverrides] = useState<Record<string, Partial<Record<PropKey, boolean>>>>({})
  const selected = MATERIALS.find(m => m.id === selectedId)!
  const getProp = (mat: Material, key: PropKey): boolean =>
    overrides[mat.id]?.[key] !== undefined ? overrides[mat.id]![key]! : mat[key]

  const toggleProp = (key: PropKey) => {
    setOverrides(prev => {
      const cur = prev[selectedId] || {}
      const baseVal = selected[key]
      const curVal = cur[key] !== undefined ? cur[key]! : baseVal
      return { ...prev, [selectedId]: { ...cur, [key]: !curVal } }
    })
  }

  const matches = (mat: Material): boolean =>
    sortProp === 'all' ? true : getProp(mat, sortProp)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Material grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {MATERIALS.map(m => {
          const sel = m.id === selectedId
          const visible = matches(m)
          return (
            <button key={m.id} onClick={() => setSelectedId(m.id)}
              style={{
                ...s.btn(sel),
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '4px 2px', fontSize: 9, opacity: visible ? 1 : 0.3,
                border: sel ? '2px solid #34d399' : '1px solid ' + s.border,
              }}>
              <span style={{ fontSize: 16 }}>{m.icon}</span>
              <span>{m.name}</span>
            </button>
          )
        })}
      </div>

      {/* Sort-by dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
        <span style={{ color: s.text }}>Sort by:</span>
        <select value={sortProp} onChange={e => setSortProp(e.target.value as 'all' | PropKey)} style={{ ...s.input, flex: 1 }}>
          <option value="all">All materials</option>
          <option value="magnetic">Magnetic only</option>
          <option value="flexible">Flexible only</option>
          <option value="transparent">Transparent only</option>
          <option value="waterproof">Waterproof only</option>
        </select>
        {sortProp !== 'all' && (
          <button onClick={() => setSortProp('all')} style={{ ...s.btn(false), fontSize: 9 }}>✕ Clear</button>
        )}
      </div>

      {/* Property toggles for selected material */}
      <div style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 6, padding: 6 }}>
        <div style={{ fontSize: 10, color: s.text, marginBottom: 4 }}>
          Properties of <b style={{ color: s.bright }}>{selected.name}</b> {selected.icon} — click to flip:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {(Object.keys(PROP_LABELS) as PropKey[]).map(key => {
            const val = getProp(selected, key)
            return (
              <button key={key} onClick={() => toggleProp(key)}
                style={{
                  ...s.btn(val),
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '4px 8px', fontSize: 10,
                  background: val ? 'rgba(5,150,105,0.15)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                  border: val ? '1px solid rgba(5,150,105,0.4)' : '1px solid ' + s.border,
                  color: val ? '#34d399' : s.text,
                }}>
                <span>{PROP_LABELS[key]}</span>
                <span style={{ fontWeight: 700 }}>{val ? 'YES' : 'NO'}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Dynamic step-by-step */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Selected material: <b style={{ color: s.bright }}>{selected.name}</b> {selected.icon}</div>
        <div>Step 2: Magnetic: <b style={{ color: getProp(selected, 'magnetic') ? '#34d399' : '#94a3b8' }}>{getProp(selected, 'magnetic') ? 'YES — attracted to magnets' : 'NO — not magnetic'}</b></div>
        <div>Step 3: Flexible: <b style={{ color: getProp(selected, 'flexible') ? '#34d399' : '#94a3b8' }}>{getProp(selected, 'flexible') ? 'YES — can bend without breaking' : 'NO — rigid'}</b></div>
        <div>Step 4: Transparent: <b style={{ color: getProp(selected, 'transparent') ? '#34d399' : '#94a3b8' }}>{getProp(selected, 'transparent') ? 'YES — light passes through' : 'NO — opaque (blocks light)'}</b></div>
        <div>Step 5: Waterproof: <b style={{ color: getProp(selected, 'waterproof') ? '#34d399' : '#94a3b8' }}>{getProp(selected, 'waterproof') ? 'YES — blocks water' : 'NO — absorbs or lets water through'}</b></div>
        <div>Step 6: {sortProp === 'all'
          ? 'Showing all 8 materials — choose "Sort by" to filter'
          : <>Filtering: only materials with <b style={{ color: '#34d399' }}>{PROP_LABELS[sortProp]} = YES</b> are highlighted</>}</div>
      </div>

      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Every material has a unique "fingerprint" of properties. Engineers and builders pick materials based on what a job needs: glass for windows (transparent), metal for magnets (magnetic), rubber for tires (flexible + waterproof).
      </div>
    </div>
  )
}

/* ============================================================
   20. ReversibleIrreversibleChanges (K-5)
   ============================================================ */

interface ChangeItem {
  id: string
  label: string
  icon: string
  correct: 'reversible' | 'irreversible'
  explanation: string
}

const CHANGES: ChangeItem[] = [
  { id: 'ice',     label: 'Ice melting',         icon: '🧊', correct: 'reversible',   explanation: 'Freeze the water again → ice. Same substance, just changed form.' },
  { id: 'wax',     label: 'Wax melting',         icon: '🕯️', correct: 'reversible',   explanation: 'Cool the wax → it hardens back. No new substance made.' },
  { id: 'wood',    label: 'Wood burning',        icon: '🔥', correct: 'irreversible', explanation: 'Wood becomes ash + smoke + gas. New substances — cannot reassemble.' },
  { id: 'egg',     label: 'Egg cooking',         icon: '🍳', correct: 'irreversible', explanation: 'Proteins uncurl and re-bond. A cooked egg cannot become raw again.' },
  { id: 'paper',   label: 'Paper tearing',       icon: '📄', correct: 'reversible',   explanation: 'Tape it back together — same paper, just in pieces (physical change).' },
  { id: 'salt',    label: 'Salt dissolving',     icon: '🧂', correct: 'reversible',   explanation: 'Evaporate the water → salt crystals come back. Same substance.' },
]

export function ReversibleIrreversibleChanges({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [placements, setPlacements] = useState<Record<string, 'reversible' | 'irreversible' | null>>({})
  const [pickedUp, setPickedUp] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  const sortedCount = Object.values(placements).filter(Boolean).length
  const correctCount = CHANGES.filter(c => placements[c.id] === c.correct).length

  const place = (col: 'reversible' | 'irreversible') => {
    if (!pickedUp) return
    setPlacements(prev => ({ ...prev, [pickedUp]: col }))
    setPickedUp(null)
  }
  const reset = () => { setPlacements({}); setPickedUp(null); setChecked(false) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Available changes */}
      <div style={{ fontSize: 10, color: s.text }}>
        {pickedUp ? <span style={{ color: '#34d399' }}>↑ Picked up: <b>{CHANGES.find(c => c.id === pickedUp)?.label}</b> — click a column to place</span> : 'Click a change to pick it up, then click a column to sort it:'}
      </div>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {CHANGES.map(c => {
          const placed = placements[c.id]
          const isPicked = pickedUp === c.id
          return (
            <button key={c.id}
              onClick={() => { if (placed && !checked) { setPlacements(prev => ({ ...prev, [c.id]: null })); setPickedUp(null) } else if (!placed) { setPickedUp(isPicked ? null : c.id); setChecked(false) } }}
              style={{
                ...s.btn(isPicked),
                padding: '3px 6px', fontSize: 9,
                opacity: placed ? 0.35 : 1,
                border: isPicked ? '2px solid #34d399' : '1px solid ' + s.border,
              }}>
              {c.icon} {c.label}
            </button>
          )
        })}
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {(['reversible', 'irreversible'] as const).map(col => (
          <button key={col} onClick={() => place(col)}
            style={{
              padding: 6, borderRadius: 6, textAlign: 'left',
              background: col === 'reversible' ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
              border: '1.5px dashed ' + (col === 'reversible' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'),
              cursor: pickedUp ? 'pointer' : 'default',
              minHeight: 90,
            }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: col === 'reversible' ? '#22c55e' : '#ef4444', marginBottom: 4 }}>
              {col === 'reversible' ? '↩ REVERSIBLE' : '✖ IRREVERSIBLE'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {CHANGES.filter(c => placements[c.id] === col).map(c => {
                const isCorrect = c.correct === col
                return (
                  <div key={c.id} style={{
                    padding: '2px 4px', borderRadius: 3, fontSize: 9,
                    background: checked
                      ? (isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.25)')
                      : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'),
                    color: checked && !isCorrect ? '#f87171' : (isDark ? '#e2e8f0' : '#1e293b'),
                    border: checked ? '1px solid ' + (isCorrect ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.5)') : '1px solid transparent',
                  }}>
                    {c.icon} {c.label}
                    {checked && (isCorrect ? ' ✓' : ' ✗')}
                  </div>
                )
              })}
            </div>
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => setChecked(true)} disabled={sortedCount < 6}
          style={{
            ...s.btn(checked),
            flex: 1, opacity: sortedCount < 6 ? 0.4 : 1, cursor: sortedCount < 6 ? 'not-allowed' : 'pointer',
          }}>
          {checked ? `✓ Checked: ${correctCount}/6 correct` : 'Check Answers'}
        </button>
        <button onClick={reset} style={s.btn(false)}>Reset</button>
      </div>

      {/* Explanations after check */}
      {checked && (
        <div style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 6, padding: 6, fontSize: 9, lineHeight: 1.5, color: s.text, maxHeight: 110, overflowY: 'auto' }}>
          {CHANGES.map(c => {
            const placed = placements[c.id]
            const ok = placed === c.correct
            return (
              <div key={c.id} style={{ marginBottom: 3 }}>
                <span style={{ color: ok ? '#34d399' : '#f87171' }}>{ok ? '✓' : '✗'}</span>
                <b style={{ color: s.bright }}> {c.label}</b> — {c.correct === 'reversible' ? 'Reversible' : 'Irreversible'}.
                <span style={{ color: s.text }}> {c.explanation}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Dynamic step-by-step */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Sorted <b style={{ color: s.bright }}>{sortedCount}/6</b> changes into columns</div>
        <div>Step 2: {checked
          ? <span><b style={{ color: correctCount >= 5 ? '#34d399' : '#fbbf24' }}>{correctCount} correct</b>, <b style={{ color: '#f87171' }}>{6 - correctCount} wrong</b></span>
          : 'Click <b>"Check Answers"</b> when all 6 are sorted'}</div>
        <div>Step 3: <b style={{ color: '#22c55e' }}>Reversible</b> = you can undo it (ice → water → ice again)</div>
        <div>Step 4: <b style={{ color: '#ef4444' }}>Irreversible</b> = you cannot undo it (wood → ash + smoke, cannot reassemble)</div>
        <div>Step 5: {checked
          ? 'See colored highlights ✓/✗ above and explanations below'
          : <span>Pick up a change, then think: <i>can I get the original back?</i></span>}</div>
        <div>Step 6: <b>Chemical changes</b> (burning, cooking) make NEW substances — usually irreversible. <b>Physical changes</b> (melting, tearing, dissolving) just change form — usually reversible.</div>
      </div>

      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> The key question is: "Did new substances form?" If yes, it is a chemical change and likely irreversible. If the substance is the same (just melted, torn, or dissolved), it is a physical change and usually reversible.
      </div>
    </div>
  )
}

/* ============================================================
   21. KitchenChemistry (K-5)
   ============================================================ */

interface KitchenReaction {
  id: string
  name: string
  icon: string
  reactants: string
  products: string
  explanation: string
  isChemicalChange: boolean
  beforeColor: string
  afterColor: string
  bubble: boolean
  duration: number // ms
}

const REACTIONS: KitchenReaction[] = [
  {
    id: 'bs-v',
    name: 'Baking soda + vinegar',
    icon: '🫧',
    reactants: 'NaHCO₃ (baking soda) + CH₃COOH (vinegar)',
    products: 'CO₂ gas + water + sodium acetate',
    explanation: 'Acid + base reaction releases carbon dioxide gas — the bubbles you see are CO₂ escaping.',
    isChemicalChange: true,
    beforeColor: '#fde68a',
    afterColor: '#fef3c7',
    bubble: true,
    duration: 2500,
  },
  {
    id: 'lj-bs',
    name: 'Lemon juice + baking soda',
    icon: '🍋',
    reactants: 'Citric acid (lemon) + NaHCO₃ (baking soda)',
    products: 'CO₂ gas + water + sodium citrate',
    explanation: 'Same acid-base reaction as vinegar — citric acid is also an acid that releases CO₂ with baking soda.',
    isChemicalChange: true,
    beforeColor: '#fef9c3',
    afterColor: '#fef3c7',
    bubble: true,
    duration: 2500,
  },
  {
    id: 'milk-lj',
    name: 'Milk + lemon juice',
    icon: '🥛',
    reactants: 'Milk proteins + citric acid (lemon)',
    products: 'Curdled milk solids (curds) + whey',
    explanation: 'Acid makes milk proteins (casein) uncurl and clump together — this is called denaturation.',
    isChemicalChange: true,
    beforeColor: '#fafafa',
    afterColor: '#fef3c7',
    bubble: false,
    duration: 3000,
  },
  {
    id: 'iodine-starch',
    name: 'Iodine + starch',
    icon: '🧪',
    reactants: 'Iodine solution + starch (bread/potato)',
    products: 'Iodine-starch complex (blue-black)',
    explanation: 'Iodine molecules slip inside the starch spiral, creating a deep blue-black color. This is a famous starch test!',
    isChemicalChange: true,
    beforeColor: '#d4a574',
    afterColor: '#1e1b4b',
    bubble: false,
    duration: 2000,
  },
  {
    id: 'rust',
    name: 'Steel wool + vinegar',
    icon: '🧶',
    reactants: 'Iron (steel wool) + acetic acid + oxygen',
    products: 'Iron oxide (rust) + water',
    explanation: 'Vinegar removes the protective coating on steel wool so iron reacts with oxygen → rust. This happens over hours, sped up here.',
    isChemicalChange: true,
    beforeColor: '#94a3b8',
    afterColor: '#b45309',
    bubble: false,
    duration: 3500,
  },
]

interface Bubble { x: number; y: number; r: number; vy: number; life: number }

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  }
}

export function KitchenChemistry({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [reactionId, setReactionId] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle')
  const [progress, setProgress] = useState(0) // 0..1
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [tickCount, setTickCount] = useState(0)

  const reaction = useMemo(() => REACTIONS.find(r => r.id === reactionId) || null, [reactionId])

  // Animation loop
  useEffect(() => {
    if (phase !== 'playing' || !reaction) return
    const start = performance.now()
    let raf = 0
    let lastBubble = start
    const loop = (now: number) => {
      const elapsed = now - start
      const p = Math.min(1, elapsed / reaction.duration)
      setProgress(p)
      setTickCount(t => t + 1)

      // Spawn bubbles
      if (reaction.bubble && now - lastBubble > 80 && p < 0.85) {
        setBubbles(prev => [...prev, {
          x: 100 + Math.random() * 80,
          y: 150 + Math.random() * 10,
          r: 2 + Math.random() * 3,
          vy: -20 - Math.random() * 30,
          life: 1,
        }].slice(-25))
        lastBubble = now
      }

      // Update bubbles
      setBubbles(prev => prev
        .map(b => ({ ...b, y: b.y + b.vy * 0.016, life: b.life - 0.02 }))
        .filter(b => b.life > 0 && b.y > 30)
      )

      if (p >= 1) {
        setPhase('done')
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase, reaction])

  const startReaction = (id: string) => {
    setReactionId(id)
    setPhase('playing')
    setProgress(0)
    setBubbles([])
  }
  const reset = () => {
    setReactionId(null)
    setPhase('idle')
    setProgress(0)
    setBubbles([])
  }

  // Current beaker color — interpolate before → after based on progress
  const currentColor = useMemo(() => {
    if (!reaction) return '#bae6fd'
    if (phase === 'idle') return '#bae6fd'
    if (phase === 'done') return reaction.afterColor
    // Interpolate
    const before = hexToRgb('#bae6fd')
    const after = hexToRgb(reaction.afterColor)
    const r = Math.round(before.r + (after.r - before.r) * progress)
    const g = Math.round(before.g + (after.g - before.g) * progress)
    const b = Math.round(before.b + (after.b - before.b) * progress)
    return `rgb(${r},${g},${b})`
  }, [reaction, phase, progress])

  // Wobble for curdling (milk+lemon)
  const wobble = reaction?.id === 'milk-lj' && phase === 'playing'
    ? Math.sin(tickCount * 0.4) * 2 * progress
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Reaction picker */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {REACTIONS.map(r => (
          <button key={r.id} onClick={() => startReaction(r.id)}
            style={{
              ...s.btn(reactionId === r.id && phase !== 'idle'),
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 6px', fontSize: 10, textAlign: 'left',
            }}>
            <span style={{ fontSize: 14 }}>{r.icon}</span>
            <span style={{ flex: 1 }}>{r.name}</span>
            {reactionId === r.id && phase === 'playing' && (
              <span style={{ fontSize: 8, color: '#34d399' }}>▶ playing…</span>
            )}
            {reactionId === r.id && phase === 'done' && (
              <span style={{ fontSize: 8, color: '#34d399' }}>✓ done</span>
            )}
          </button>
        ))}
      </div>

      {/* Beaker SVG */}
      <svg viewBox="0 0 280 200" width="100%" style={{ maxHeight: 210 }}>
        {/* Beaker outline */}
        <path d="M 90 30 L 90 170 Q 90 180 100 180 L 180 180 Q 190 180 190 170 L 190 30"
          fill="none" stroke={s.bright} strokeWidth={2} strokeLinecap="round" />
        <line x1={82} y1={30} x2={198} y2={30} stroke={s.bright} strokeWidth={2} strokeLinecap="round" />

        {/* Liquid fill (interpolated color) */}
        <path d={`M 92 60 L 92 168 Q 92 178 100 178 L 180 178 Q 188 178 188 168 L 188 60 Z`}
          fill={currentColor} opacity={reaction ? 0.85 : 0.3}
          transform={wobble ? `skewX(${wobble * 0.3})` : undefined} />

        {/* Surface ripple */}
        {reaction && (
          <path d={`M 92 60 Q 120 ${58 + Math.sin(tickCount * 0.3) * 1.5}, 140 60 T 188 60`}
            fill="none" stroke={isDark ? '#ffffff' : '#1e293b'} strokeWidth={0.8} opacity={0.4} />
        )}

        {/* Bubbles */}
        {bubbles.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r}
            fill="rgba(255,255,255,0.7)" stroke="rgba(255,255,255,0.9)" strokeWidth={0.5}
            opacity={b.life} />
        ))}

        {/* Progress bar */}
        {phase === 'playing' && (
          <g>
            <rect x={92} y={185} width={96} height={4} rx={2} fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
            <rect x={92} y={185} width={96 * progress} height={4} rx={2} fill="#34d399" />
          </g>
        )}

        {/* Idle hint */}
        {!reaction && (
          <text x={140} y={105} textAnchor="middle" fontSize={9} fill={s.text}>
            ← Pick a kitchen reaction
          </text>
        )}
        {phase === 'done' && (
          <text x={140} y={20} textAnchor="middle" fontSize={9} fill="#34d399" fontWeight={700}>
            ✓ Reaction complete — observe the result
          </text>
        )}
      </svg>

      {reaction && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10 }}>
          <span style={{ color: s.text }}>Color: <span style={{ color: s.bright }}>{phase === 'done' ? 'final' : phase === 'playing' ? 'changing…' : 'ready'}</span></span>
          <button onClick={reset} style={{ ...s.btn(false), fontSize: 9 }}>Reset</button>
        </div>
      )}

      {/* Dynamic step-by-step */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Reaction: <b style={{ color: s.bright }}>{reaction ? reaction.name : '(none selected — click a reaction above)'}</b></div>
        <div>Step 2: Reactants: <span style={{ color: s.text }}>{reaction ? reaction.reactants : '—'}</span></div>
        <div>Step 3: {phase === 'playing'
          ? <span style={{ color: '#34d399' }}><b>Reaction in progress</b> — {reaction?.bubble ? 'bubbles of CO₂ are forming and rising!' : 'color and texture are changing…'}</span>
          : phase === 'done'
          ? <span style={{ color: '#34d399' }}><b>Reaction finished</b> — observe the final products in the beaker</span>
          : 'Click a reaction above to start it'}</div>
        <div>Step 4: Products: <span style={{ color: s.text }}>{reaction ? reaction.products : '—'}</span></div>
        <div>Step 5: {reaction ? reaction.explanation : 'Each reaction makes new substances from the kitchen ingredients.'}</div>
        <div>Step 6: This is a <b style={{ color: reaction?.isChemicalChange ? '#a78bfa' : s.text }}>{reaction?.isChemicalChange ? 'CHEMICAL change' : 'physical change'}</b>{reaction?.isChemicalChange ? ' — new substances were made (cannot easily undo)' : ' — same substance, just different form'}</div>
      </div>

      {/* Insight */}
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Chemistry is everywhere — not just in labs! Bubbles mean a gas is forming (like CO₂). A color change (like iodine + starch turning blue-black) is a sign of a new substance. These are clues that a chemical reaction has happened.
      </div>
    </div>
  )
}

/* ============================================================
   End of K-5 Chemistry Widgets
   ============================================================ */

/* ============================================================
   Nuclear Chemistry Explorer (Grades 9-12) — Task ID 25
   ============================================================ */

const ISOTOPES = [
  { name: 'Carbon-14', symbol: '¹⁴C', halfLife: 5730, halfLifeUnit: 'yr', decayType: 'β⁻', equation: '¹⁴₆C → ¹⁴₇N + ⁰₋₁e', color: '#34d399' },
  { name: 'Uranium-238', symbol: '²³⁸U', halfLife: 4.5e9, halfLifeUnit: 'yr', decayType: 'α', equation: '²³⁸₉₂U → ²³⁴₉₀Th + ⁴₂He', color: '#f59e0b' },
  { name: 'Potassium-40', symbol: '⁴⁰K', halfLife: 1.25e9, halfLifeUnit: 'yr', decayType: 'β⁻', equation: '⁴⁰₁₉K → ⁴⁰₂₀Ca + ⁰₋₁e', color: '#a78bfa' },
  { name: 'Radon-222', symbol: '²²²Rn', halfLife: 3.8, halfLifeUnit: 'days', decayType: 'α', equation: '²²²₈₆Rn → ²¹⁸₈₄Po + ⁴₂He', color: '#ef4444' },
]

function formatTime(t: number, unit: string) {
  if (t >= 1e9) return (t / 1e9).toFixed(2) + ' billion ' + unit
  if (t >= 1e6) return (t / 1e6).toFixed(2) + ' million ' + unit
  if (t >= 1e3) return (t / 1e3).toFixed(2) + ' k ' + unit
  return t.toFixed(2) + ' ' + unit
}

export function NuclearChemistryExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [isoIdx, setIsoIdx] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [halfLives, setHalfLives] = useState(0)
  const [speed, setSpeed] = useState(1)

  const isotope = ISOTOPES[isoIdx]

  // Pre-sample decay times for 1000 atoms using exponential distribution.
  // In half-life units: t_decay = -ln(rand) / ln(2) so that ~50% remain at t=1 half-life.
  const decayTimes = useMemo(() => {
    const times: number[] = []
    for (let i = 0; i < 1000; i++) {
      const r = Math.random()
      times.push(-Math.log(Math.max(r, 0.0001)) / Math.log(2))
    }
    return times
  }, [isoIdx])

  const speedRef = useRef(speed)
  speedRef.current = speed

  useEffect(() => {
    if (!isRunning) return
    let raf = 0
    let last = performance.now()
    const tick = (t: number) => {
      const dt = (t - last) / 1000
      last = t
      setHalfLives(prev => Math.min(5, prev + dt * 0.2 * speedRef.current))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isRunning])

  // Stop the simulation once we reach 5 half-lives.
  useEffect(() => {
    if (halfLives >= 5 && isRunning) setIsRunning(false)
  }, [halfLives, isRunning])

  let remaining = 0
  for (let i = 0; i < 1000; i++) {
    if (decayTimes[i] > halfLives) remaining++
  }

  const timeElapsed = halfLives * isotope.halfLife
  const theoreticalN = 1000 * Math.pow(0.5, halfLives)

  const toggleRun = () => {
    if (halfLives >= 5) {
      setHalfLives(0)
      setIsRunning(true)
    } else {
      setIsRunning(!isRunning)
    }
  }
  const reset = () => {
    setIsRunning(false)
    setHalfLives(0)
  }
  const switchIso = (i: number) => {
    setIsoIdx(i)
    setHalfLives(0)
    setIsRunning(false)
  }

  // 40 cols × 25 rows = 1000 atoms
  const cellSize = 5
  const cols = 40
  const rows = 25
  const gridW = cols * cellSize
  const gridH = rows * cellSize

  // Decay-curve graph
  const curveW = 240
  const curveH = 70
  const pad = 8
  const plotW = curveW - 2 * pad
  const plotH = curveH - 2 * pad - 8
  const toX = (hl: number) => pad + (hl / 5) * plotW
  const toY = (n: number) => pad + plotH - (n / 1000) * plotH
  const curvePts: string[] = []
  for (let i = 0; i <= 50; i++) {
    const hl = (i / 50) * 5
    const n = 1000 * Math.pow(0.5, hl)
    curvePts.push((i === 0 ? 'M' : 'L') + toX(hl).toFixed(1) + ' ' + toY(n).toFixed(1))
  }
  const curvePath = curvePts.join(' ')

  const atoms: React.ReactNode[] = []
  for (let i = 0; i < 1000; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols
    const decayed = decayTimes[i] <= halfLives
    atoms.push(
      <rect key={i} x={col * cellSize + 0.5} y={row * cellSize + 0.5} width={cellSize - 1} height={cellSize - 1}
        fill={decayed ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)') : isotope.color}
        rx={0.5} />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {ISOTOPES.map((iso, i) => (
          <button key={iso.name} onClick={() => switchIso(i)} style={s.btn(i === isoIdx)}>{iso.symbol}</button>
        ))}
      </div>

      <div style={{ fontSize: 10, color: s.text, display: 'flex', justifyContent: 'space-between' }}>
        <span>Half-life: <b style={{ color: s.bright }}>{formatTime(isotope.halfLife, isotope.halfLifeUnit)}</b></span>
        <span>Decay: <b style={{ color: s.bright }}>{isotope.decayType}</b></span>
      </div>
      <div style={{ fontSize: 10, color: s.bright, background: s.bg, border: '1px solid ' + s.border, borderRadius: 4, padding: '4px 6px', textAlign: 'center' }}>
        {isotope.equation}
      </div>

      <svg viewBox={'0 0 ' + gridW + ' ' + gridH} width="100%" style={{ maxHeight: 130, background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.02)', borderRadius: 4 }}>
        {atoms}
      </svg>

      <svg viewBox={'0 0 ' + curveW + ' ' + curveH} width="100%" style={{ maxHeight: 80, background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', borderRadius: 4 }}>
        {[0, 1, 2, 3, 4, 5].map(hl => (
          <g key={'v-' + hl}>
            <line x1={toX(hl)} y1={pad} x2={toX(hl)} y2={pad + plotH} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} strokeWidth={0.5} />
            <text x={toX(hl)} y={curveH - 1} textAnchor="middle" fontSize={7} fill={s.text}>{hl}t½</text>
          </g>
        ))}
        {[0, 250, 500, 750, 1000].map(n => (
          <text key={'y-' + n} x={2} y={toY(n) + 3} fontSize={7} fill={s.text}>{n}</text>
        ))}
        <path d={curvePath} fill="none" stroke="#34d399" strokeWidth={1.5} />
        <circle cx={toX(halfLives)} cy={toY(remaining)} r={3} fill={isotope.color} stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={1} />
      </svg>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button onClick={toggleRun} style={{ ...s.btn(isRunning), padding: '4px 10px', fontWeight: 600 }}>
          {isRunning ? '⏸ Pause' : '▶ Start Decay'}
        </button>
        <button onClick={reset} style={s.btn(false)}>↺ Reset</button>
        <span style={{ fontSize: 10, color: s.text }}>Speed: <b style={{ color: s.bright }}>{speed.toFixed(1)}×</b></span>
        <input type="range" aria-label="Animation speed multiplier" min={0.5} max={5} step={0.5} value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} style={{ flex: 1, accentColor: '#34d399' }} />
      </div>

      <div style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 4, padding: '6px 8px', display: 'flex', gap: 12, fontSize: 10, color: s.text, flexWrap: 'wrap' }}>
        <span>Remaining: <b style={{ color: s.bright }}>{remaining}</b>/1000</span>
        <span>Decayed: <b style={{ color: s.bright }}>{1000 - remaining}</b></span>
        <span>%: <b style={{ color: s.bright }}>{(remaining / 10).toFixed(1)}%</b></span>
        <span>Time: <b style={{ color: s.bright }}>{formatTime(timeElapsed, isotope.halfLifeUnit)}</b></span>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Isotope: <b style={{ color: s.bright }}>{isotope.name} ({isotope.symbol})</b>, Half-life: {formatTime(isotope.halfLife, isotope.halfLifeUnit)}</div>
        <div>Step 2: Decay type: <b style={{ color: s.bright }}>{isotope.decayType}</b> — {isotope.equation}</div>
        <div>Step 3: Time elapsed: {formatTime(timeElapsed, isotope.halfLifeUnit)} = <b style={{ color: s.bright }}>{halfLives.toFixed(2)} half-lives</b></div>
        <div>Step 4: Atoms remaining: <b style={{ color: s.bright }}>{remaining}/1000</b> = {(remaining / 10).toFixed(1)}%</div>
        <div>Step 5: N = N₀ × (½)^(t/t½) = 1000 × (½)^{halfLives.toFixed(2)} = <b style={{ color: isDark ? '#34d399' : '#059669' }}>{Math.round(theoreticalN)}</b> (theory) vs {remaining} (sample)</div>
        <div>Step 6: After each half-life, HALF of the remaining atoms decay — exponential, not linear</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Half-life is constant for each isotope — radioactive decay is random at the single-atom level but perfectly predictable in bulk. Different isotopes have wildly different half-lives, which makes some ideal for dating ancient rocks (U-238) and others for medical tracers.
      </div>
    </div>
  )
}

/* ============================================================
   Thermochemistry Explorer — Hess's Law (Grades 9-12)
   ============================================================ */

const HESS_TARGETS = [
  {
    name: 'Formation of Methane',
    equation: 'C(s) + 2H₂(g) → CH₄(g)',
    deltaH: -74.8,
    species: { 'C': -1, 'H₂': -2, 'CH₄': 1 } as Record<string, number>,
  },
]

const HESS_REACTIONS = [
  {
    id: 'r1',
    eq: 'CH₄ + 2O₂ → CO₂ + 2H₂O',
    deltaH: -890.4,
    species: { 'CH₄': -1, 'O₂': -2, 'CO₂': 1, 'H₂O': 2 } as Record<string, number>,
  },
  {
    id: 'r2',
    eq: 'C + O₂ → CO₂',
    deltaH: -393.5,
    species: { 'C': -1, 'O₂': -1, 'CO₂': 1 } as Record<string, number>,
  },
  {
    id: 'r3',
    eq: 'H₂ + ½O₂ → H₂O',
    deltaH: -285.8,
    species: { 'H₂': -1, 'O₂': -0.5, 'H₂O': 1 } as Record<string, number>,
  },
]

export function ThermochemistryExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const target = HESS_TARGETS[0]
  const [flips, setFlips] = useState<boolean[]>([false, false, false])
  const [mults, setMults] = useState<number[]>([1, 1, 1])
  const [checked, setChecked] = useState(false)

  const combined: Record<string, number> = {}
  let runningDeltaH = 0
  HESS_REACTIONS.forEach((r, i) => {
    const factor = (flips[i] ? -1 : 1) * mults[i]
    runningDeltaH += r.deltaH * factor
    Object.entries(r.species).forEach(([sp, coef]) => {
      combined[sp] = (combined[sp] || 0) + coef * factor
    })
  })

  const allSpecies = Array.from(new Set<string>([...Object.keys(combined), ...Object.keys(target.species)]))
  const speciesMatch = allSpecies.every(sp => Math.abs((combined[sp] || 0) - (target.species[sp] || 0)) < 0.01)
  const matchesTarget = speciesMatch && Math.abs(runningDeltaH - target.deltaH) < 0.5

  const toggleFlip = (i: number) => {
    setFlips(prev => prev.map((f, j) => j === i ? !f : f))
    setChecked(false)
  }
  const cycleMult = (i: number) => {
    setMults(prev => prev.map((m, j) => j === i ? (m >= 3 ? 1 : m + 1) : m))
    setChecked(false)
  }

  const renderModifiedEq = (r: typeof HESS_REACTIONS[0], i: number) => {
    const factor = (flips[i] ? -1 : 1) * mults[i]
    let eq = r.eq
    if (flips[i]) {
      const parts = r.eq.split(' → ')
      eq = parts[1] + ' → ' + parts[0]
    }
    const prefix = mults[i] > 1 ? mults[i] + ' × (' : ''
    const suffix = mults[i] > 1 ? ')' : ''
    return { eq: prefix + eq + suffix, modDH: (r.deltaH * factor).toFixed(1) }
  }

  // Energy diagram dimensions
  const eW = 240, eH = 95
  const reactY = 18, prodY = 72

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 4, padding: '6px 8px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#a78bfa', marginBottom: 3 }}>Target Reaction</div>
        <div style={{ fontSize: 12, color: s.bright, fontWeight: 600 }}>{target.equation}</div>
        <div style={{ fontSize: 10, color: s.text, marginTop: 2 }}>ΔH = {checked || matchesTarget ? target.deltaH.toFixed(1) + ' kJ/mol' : '? kJ/mol (find it!)'}</div>
      </div>

      {/* Energy diagram illustrating Hess's Law (state function) */}
      <svg viewBox={'0 0 ' + eW + ' ' + eH} width="100%" style={{ maxHeight: 100, background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', borderRadius: 4 }}>
        <defs>
          <marker id="arrowGreenHess" markerWidth="7" markerHeight="6" refX="3.5" refY="3" orient="auto">
            <polygon points="0 0, 7 3, 0 6" fill="#34d399" />
          </marker>
          <marker id="arrowBlueHess" markerWidth="6" markerHeight="5" refX="3" refY="2.5" orient="auto">
            <polygon points="0 0, 6 2.5, 0 5" fill="#60a5fa" />
          </marker>
        </defs>
        {/* Reactants level */}
        <line x1={38} y1={reactY} x2={210} y2={reactY} stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={1.5} />
        <text x={215} y={reactY + 3} fontSize={9} fill={s.bright} fontWeight={600}>Reactants</text>
        <text x={35} y={reactY + 3} textAnchor="end" fontSize={8} fill={s.text}>C + 2H₂</text>
        {/* Products level */}
        <line x1={38} y1={prodY} x2={210} y2={prodY} stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={1.5} />
        <text x={215} y={prodY + 3} fontSize={9} fill={s.bright} fontWeight={600}>Products</text>
        <text x={35} y={prodY + 3} textAnchor="end" fontSize={8} fill={s.text}>CH₄</text>
        {/* Direct path */}
        <line x1={70} y1={reactY + 2} x2={70} y2={prodY - 3} stroke="#34d399" strokeWidth={2} markerEnd="url(#arrowGreenHess)" />
        <text x={62} y={(reactY + prodY) / 2 + 3} textAnchor="end" fontSize={8} fill="#34d399" fontWeight={600}>ΔH</text>
        <text x={62} y={(reactY + prodY) / 2 + 13} textAnchor="end" fontSize={7} fill={s.text}>direct</text>
        {/* Indirect path (3 steps) */}
        <line x1={155} y1={reactY + 2} x2={155} y2={38} stroke="#60a5fa" strokeWidth={1.5} markerEnd="url(#arrowBlueHess)" />
        <line x1={155} y1={42} x2={180} y2={42} stroke="#60a5fa" strokeWidth={1.5} markerEnd="url(#arrowBlueHess)" />
        <line x1={180} y1={45} x2={180} y2={prodY - 3} stroke="#60a5fa" strokeWidth={1.5} markerEnd="url(#arrowBlueHess)" />
        <text x={190} y={42} fontSize={7} fill="#60a5fa">via steps</text>
        {/* ΔH bracket on left */}
        <line x1={38} y1={reactY} x2={30} y2={reactY} stroke={s.bright} strokeWidth={1} />
        <line x1={30} y1={reactY} x2={30} y2={prodY} stroke={s.bright} strokeWidth={1} />
        <line x1={30} y1={prodY} x2={38} y2={prodY} stroke={s.bright} strokeWidth={1} />
        <text x={20} y={(reactY + prodY) / 2 + 3} textAnchor="middle" fontSize={8} fill={s.bright} fontWeight={600}>ΔH</text>
      </svg>
      <div style={{ fontSize: 9, color: s.text, opacity: 0.7 }}>Both paths reach the same ΔH — enthalpy is a state function.</div>

      {/* Reaction cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {HESS_REACTIONS.map((r, i) => {
          const mod = renderModifiedEq(r, i)
          return (
            <div key={r.id} style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 4, padding: '4px 6px' }}>
              <div style={{ fontSize: 10, color: s.bright, fontWeight: 500 }}>{r.eq}</div>
              <div style={{ fontSize: 9, color: s.text }}>ΔH = {r.deltaH} kJ/mol</div>
              <div style={{ display: 'flex', gap: 4, marginTop: 3, alignItems: 'center' }}>
                <button onClick={() => toggleFlip(i)} style={s.btn(flips[i])} title="Flip reaction (negates ΔH)">{flips[i] ? '↔ Flipped' : '→ Normal'}</button>
                <button onClick={() => cycleMult(i)} style={s.btn(mults[i] > 1)} title="Cycle multiplier">×{mults[i]}</button>
                <span style={{ fontSize: 10, color: s.bright, marginLeft: 'auto', fontWeight: 600 }}>ΔH = {mod.modDH}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={() => setChecked(true)} style={{ ...s.btn(false), padding: '4px 12px', fontWeight: 600, background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>Check Solution</button>
        <span style={{ fontSize: 11, color: s.bright, fontWeight: 600 }}>Running ΔH = {runningDeltaH.toFixed(1)} kJ/mol</span>
      </div>

      {checked && (
        <div style={{ padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: matchesTarget ? 'rgba(5,150,105,0.1)' : 'rgba(239,68,68,0.1)', border: '1px solid ' + (matchesTarget ? 'rgba(5,150,105,0.3)' : 'rgba(239,68,68,0.3)'), color: matchesTarget ? '#34d399' : '#f87171' }}>
          {matchesTarget
            ? '✓ Correct! Target ΔH = ' + target.deltaH.toFixed(1) + ' kJ/mol. The combined reactions produce the target.'
            : '✗ Not yet — keep flipping or multiplying reactions to match the target. Current net species: ' + allSpecies.map(sp => sp + '=' + (combined[sp] || 0)).join(', ')}
        </div>
      )}

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Target: <b style={{ color: s.bright }}>{target.equation}</b> (ΔH = {checked || matchesTarget ? target.deltaH.toFixed(1) : '?'} kJ/mol)</div>
        <div>Step 2: Available reactions: {HESS_REACTIONS.length} known (combustion of CH₄, C, and H₂)</div>
        <div>Step 3: Current combination: {HESS_REACTIONS.map((r, i) => (mults[i] > 1 ? mults[i] + '×' : '') + (flips[i] ? 'flip' : 'fwd')).join(' + ')}</div>
        <div>Step 4: Running ΔH = <b style={{ color: s.bright }}>{runningDeltaH.toFixed(1)} kJ/mol</b></div>
        <div>Step 5: {matchesTarget ? <span style={{ color: '#34d399' }}>Target achieved! ΔH = {runningDeltaH.toFixed(1)} kJ/mol ✓</span> : (checked ? <span style={{ color: '#f87171' }}>Not yet — keep manipulating reactions to match the target</span> : 'Click Check Solution to verify')}</div>
        <div>Step 6: Hess's Law: ΔH depends only on start and end states, not the path (state function)</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Enthalpy is a state function — like altitude, only the start and end matter, not the path taken. Hess's Law lets us find the ΔH of any reaction by combining known reactions, even reactions that can't be measured directly in the lab.
      </div>
    </div>
  )
}

/* ============================================================
   Electrochemistry Explorer — Galvanic Cell (Grades 9-12)
   ============================================================ */

const METALS = [
  { sym: 'Zn', ion: 'Zn²⁺', color: '#a1a1aa', ionColor: '#71717a', potential: -0.76, n: 2 },
  { sym: 'Cu', ion: 'Cu²⁺', color: '#f97316', ionColor: '#fb923c', potential: +0.34, n: 2 },
  { sym: 'Fe', ion: 'Fe²⁺', color: '#94a3b8', ionColor: '#cbd5e1', potential: -0.44, n: 2 },
  { sym: 'Ag', ion: 'Ag⁺', color: '#e2e8f0', ionColor: '#cbd5e1', potential: +0.80, n: 1 },
  { sym: 'Mg', ion: 'Mg²⁺', color: '#86efac', ionColor: '#22c55e', potential: -2.37, n: 2 },
]

export function ElectrochemistryExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [idxA, setIdxA] = useState(0)
  const [idxB, setIdxB] = useState(1)

  const mA = METALS[idxA]
  const mB = METALS[idxB]
  const same = idxA === idxB
  const anode = same ? mA : (mA.potential <= mB.potential ? mA : mB)
  const cathode = same ? mB : (mA.potential <= mB.potential ? mB : mA)
  const cellVoltage = same ? 0 : cathode.potential - anode.potential
  const isSpontaneous = cellVoltage > 0

  const [phase, setPhase] = useState(0)
  const phaseRef = useRef(0)
  useEffect(() => {
    if (!isSpontaneous) return
    let raf = 0
    let last = performance.now()
    const tick = (t: number) => {
      const dt = (t - last) / 1000
      last = t
      phaseRef.current = (phaseRef.current + dt * 0.4) % 1
      setPhase(phaseRef.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isSpontaneous])

  // Wire path: anode electrode top → up → across (through voltmeter) → down → cathode electrode top
  const wirePath = [
    { x: 75, y: 70 },
    { x: 75, y: 50 },
    { x: 205, y: 50 },
    { x: 205, y: 70 },
  ]
  const segLens: number[] = []
  let totalLen = 0
  for (let i = 0; i < wirePath.length - 1; i++) {
    const dx = wirePath[i + 1].x - wirePath[i].x
    const dy = wirePath[i + 1].y - wirePath[i].y
    const len = Math.sqrt(dx * dx + dy * dy)
    segLens.push(len)
    totalLen += len
  }
  const posOnWire = (p: number) => {
    const dist = p * totalLen
    let acc = 0
    for (let i = 0; i < wirePath.length - 1; i++) {
      if (acc + segLens[i] >= dist) {
        const t = (dist - acc) / segLens[i]
        return {
          x: wirePath[i].x + (wirePath[i + 1].x - wirePath[i].x) * t,
          y: wirePath[i].y + (wirePath[i + 1].y - wirePath[i].y) * t,
        }
      }
      acc += segLens[i]
    }
    return wirePath[wirePath.length - 1]
  }
  const electrons = [0, 0.25, 0.5, 0.75].map(off => posOnWire((phase + off) % 1))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: s.text }}>Metal 1:</span>
        <select value={idxA} onChange={e => setIdxA(parseInt(e.target.value))} style={{ ...s.input, padding: '2px 4px' }}>
          {METALS.map((m, i) => <option key={m.sym} value={i}>{m.sym} (E°={m.potential}V)</option>)}
        </select>
        <span style={{ fontSize: 10, color: s.text }}>Metal 2:</span>
        <select value={idxB} onChange={e => setIdxB(parseInt(e.target.value))} style={{ ...s.input, padding: '2px 4px' }}>
          {METALS.map((m, i) => <option key={m.sym} value={i}>{m.sym} (E°={m.potential}V)</option>)}
        </select>
      </div>

      <svg viewBox="0 0 280 200" width="100%" style={{ maxHeight: 200, background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderRadius: 4 }}>
        {/* Beaker 1 (left, anode) */}
        <path d="M 40 100 L 40 175 L 110 175 L 110 100" fill="none" stroke={s.bright} strokeWidth={1.5} />
        <line x1={36} y1={100} x2={114} y2={100} stroke={s.bright} strokeWidth={1.5} />
        <rect x={42} y={115} width={66} height={58} fill={anode.ionColor} opacity={0.25} />
        <text x={75} y={170} textAnchor="middle" fontSize={9} fill={isDark ? '#e2e8f0' : '#1e293b'} opacity={0.85}>{anode.ion} (aq)</text>
        <rect x={70} y={70} width={10} height={50} fill={anode.color} stroke={isDark ? '#0f172a' : '#1e293b'} strokeWidth={0.5} />
        <text x={75} y={62} textAnchor="middle" fontSize={11} fontWeight={700} fill={s.bright}>{anode.sym}</text>
        <text x={75} y={190} textAnchor="middle" fontSize={8} fill="#f87171" fontWeight={700}>ANODE (oxid)</text>

        {/* Beaker 2 (right, cathode) */}
        <path d="M 170 100 L 170 175 L 240 175 L 240 100" fill="none" stroke={s.bright} strokeWidth={1.5} />
        <line x1={166} y1={100} x2={244} y2={100} stroke={s.bright} strokeWidth={1.5} />
        <rect x={172} y={115} width={66} height={58} fill={cathode.ionColor} opacity={0.25} />
        <text x={205} y={170} textAnchor="middle" fontSize={9} fill={isDark ? '#e2e8f0' : '#1e293b'} opacity={0.85}>{cathode.ion} (aq)</text>
        <rect x={200} y={70} width={10} height={50} fill={cathode.color} stroke={isDark ? '#0f172a' : '#1e293b'} strokeWidth={0.5} />
        <text x={205} y={62} textAnchor="middle" fontSize={11} fontWeight={700} fill={s.bright}>{cathode.sym}</text>
        <text x={205} y={190} textAnchor="middle" fontSize={8} fill="#34d399" fontWeight={700}>CATHODE (red)</text>

        {/* Wire (top, through voltmeter) */}
        <polyline points={wirePath.map(p => p.x + ',' + p.y).join(' ')} fill="none" stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={1.5} />

        {/* Voltmeter */}
        <circle cx={140} cy={50} r={14} fill={isDark ? '#1e293b' : '#ffffff'} stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={1.5} />
        <text x={140} y={48} textAnchor="middle" fontSize={7} fill={s.text}>V</text>
        <text x={140} y={58} textAnchor="middle" fontSize={8} fontWeight={700} fill={isSpontaneous ? '#34d399' : '#f87171'}>{cellVoltage.toFixed(2)}V</text>

        {/* Salt bridge (U-tube over both beakers) */}
        <path d="M 97 115 L 97 30 Q 97 25 102 25 L 178 25 Q 183 25 183 30 L 183 115"
          fill="none" stroke={isDark ? '#a78bfa' : '#7c3aed'} strokeWidth={1.5} strokeDasharray="3,2" />
        <text x={140} y={20} textAnchor="middle" fontSize={8} fill="#a78bfa">salt bridge</text>

        {/* Animated electrons (blue dots) flowing anode → cathode */}
        {isSpontaneous && electrons.map((p, i) => (
          <g key={'e' + i}>
            <circle cx={p.x} cy={p.y} r={3.5} fill="#3b82f6" stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={0.5} />
            <text x={p.x} y={p.y + 2.5} textAnchor="middle" fontSize={6} fontWeight={700} fill="white">e⁻</text>
          </g>
        ))}

        {/* e⁻ flow direction label */}
        {isSpontaneous && (
          <text x={140} y={42} textAnchor="middle" fontSize={8} fill="#3b82f6" fontWeight={600}>e⁻ flow →</text>
        )}
        {same && (
          <text x={140} y={42} textAnchor="middle" fontSize={9} fill="#f87171" fontWeight={600}>Pick two different metals!</text>
        )}
      </svg>

      {/* Half-reactions summary */}
      <div style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 4, padding: '6px 8px', fontSize: 10, color: s.text, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ color: '#f87171', fontWeight: 600 }}>Anode (oxid): {anode.sym} → {anode.ion} + {anode.n}e⁻ &nbsp; E° = {anode.potential.toFixed(2)} V</div>
        <div style={{ color: '#34d399', fontWeight: 600 }}>Cathode (red): {cathode.ion} + {cathode.n}e⁻ → {cathode.sym} &nbsp; E° = {cathode.potential.toFixed(2)} V</div>
        <div style={{ borderTop: '1px solid ' + s.border, paddingTop: 3, marginTop: 3, color: s.bright, fontWeight: 700 }}>
          Overall: {anode.sym} + {cathode.ion} → {anode.ion} + {cathode.sym}
        </div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Anode (oxidation): <b style={{ color: '#f87171' }}>{anode.sym} → {anode.ion} + {anode.n}e⁻</b> (E° = {anode.potential.toFixed(2)} V)</div>
        <div>Step 2: Cathode (reduction): <b style={{ color: '#34d399' }}>{cathode.ion} + {cathode.n}e⁻ → {cathode.sym}</b> (E° = {cathode.potential.toFixed(2)} V)</div>
        <div>Step 3: E°cell = E°cathode − E°anode = {cathode.potential.toFixed(2)} − {anode.potential.toFixed(2)} = <b style={{ color: s.bright }}>{cellVoltage.toFixed(2)} V</b></div>
        <div>Step 4: {isSpontaneous ? <span style={{ color: '#34d399' }}>Spontaneous — cell produces electricity ✓</span> : <span style={{ color: '#f87171' }}>Non-spontaneous — needs external energy</span>}</div>
        <div>Step 5: Electrons flow from anode ({anode.sym}) through wire to cathode ({cathode.sym})</div>
        <div>Step 6: Salt bridge maintains charge balance — ions flow to keep compartments neutral</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> A galvanic cell converts chemical energy (spontaneous redox) into electrical energy. The metal with the more negative reduction potential is oxidized (loses electrons) at the anode; the one with the more positive potential is reduced at the cathode. Electrons always flow anode → cathode through the external wire.
      </div>
    </div>
  )
}

/* ============================================================
   Organic Functional Groups Explorer (Grades 9-12)
   ============================================================ */

type OrgAtom = { sym: string; x: number; y: number }
type OrgBond = { a: number; b: number; order: number }

const ORG_ATOM_COLORS: Record<string, string> = {
  C: '#1e293b',
  H: '#cbd5e1',
  O: '#ef4444',
  N: '#3b82f6',
}

function drawMolecule(atoms: OrgAtom[], bonds: OrgBond[], highlight: number[], isDark: boolean) {
  const bondColor = isDark ? '#cbd5e1' : '#475569'
  return (
    <g>
      {bonds.map((b, i) => {
        const a1 = atoms[b.a], a2 = atoms[b.b]
        const dx = a2.x - a1.x, dy = a2.y - a1.y
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const px = -dy / len * 3, py = dx / len * 3
        if (b.order === 1) {
          return <line key={'b' + i} x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y} stroke={bondColor} strokeWidth={1.5} />
        }
        if (b.order === 2) {
          return (
            <g key={'b' + i}>
              <line x1={a1.x + px} y1={a1.y + py} x2={a2.x + px} y2={a2.y + py} stroke={bondColor} strokeWidth={1.5} />
              <line x1={a1.x - px} y1={a1.y - py} x2={a2.x - px} y2={a2.y - py} stroke={bondColor} strokeWidth={1.5} />
            </g>
          )
        }
        // triple bond
        return (
          <g key={'b' + i}>
            <line x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y} stroke={bondColor} strokeWidth={1.5} />
            <line x1={a1.x + px} y1={a1.y + py} x2={a2.x + px} y2={a2.y + py} stroke={bondColor} strokeWidth={1.5} />
            <line x1={a1.x - px} y1={a1.y - py} x2={a2.x - px} y2={a2.y - py} stroke={bondColor} strokeWidth={1.5} />
          </g>
        )
      })}
      {atoms.map((a, i) => {
        const isHl = highlight.includes(i)
        const color = ORG_ATOM_COLORS[a.sym] || '#94a3b8'
        return (
          <g key={'a' + i}>
            {isHl && <circle cx={a.x} cy={a.y} r={13} fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="2,2" />}
            <circle cx={a.x} cy={a.y} r={9} fill={color} stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={0.5} />
            <text x={a.x} y={a.y + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill={a.sym === 'H' ? '#1e293b' : 'white'}>{a.sym}</text>
          </g>
        )
      })}
    </g>
  )
}

function drawBenzene(isDark: boolean) {
  const cx = 100, cy = 55, r = 26
  const verts: { x: number; y: number }[] = []
  for (let i = 0; i < 6; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 3
    verts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) })
  }
  return (
    <g>
      <polygon points={verts.map(v => v.x.toFixed(1) + ',' + v.y.toFixed(1)).join(' ')} fill="none" stroke={isDark ? '#cbd5e1' : '#475569'} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="2,2" />
      {verts.map((v, i) => (
        <g key={i}>
          <circle cx={v.x} cy={v.y} r={8} fill={ORG_ATOM_COLORS.C} stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={0.5} />
          <text x={v.x} y={v.y + 3} textAnchor="middle" fontSize={9} fontWeight={700} fill="white">C</text>
        </g>
      ))}
    </g>
  )
}

type FunctionalGroup = {
  name: string
  formula: string
  suffix: string
  example: string
  exampleFormula: string
  property: string
  atoms: OrgAtom[]
  bonds: OrgBond[]
  highlight: number[]
  special?: 'benzene'
}

const FUNCTIONAL_GROUPS: FunctionalGroup[] = [
  {
    name: 'Alcohol',
    formula: 'R—OH',
    suffix: '-ol',
    example: 'Ethanol',
    exampleFormula: 'CH₃CH₂OH',
    property: 'Polar, forms hydrogen bonds; soluble in water; oxidizes to aldehyde or acid',
    atoms: [
      { sym: 'C', x: 50, y: 50 },
      { sym: 'C', x: 90, y: 50 },
      { sym: 'O', x: 130, y: 50 },
      { sym: 'H', x: 160, y: 50 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 1 },
      { a: 2, b: 3, order: 1 },
    ],
    highlight: [2, 3],
  },
  {
    name: 'Aldehyde',
    formula: 'R—CHO',
    suffix: '-al',
    example: 'Ethanal',
    exampleFormula: 'CH₃CHO',
    property: 'Carbonyl at end of chain; reactive; oxidizes to carboxylic acid',
    atoms: [
      { sym: 'C', x: 50, y: 50 },
      { sym: 'C', x: 90, y: 50 },
      { sym: 'O', x: 120, y: 25 },
      { sym: 'H', x: 120, y: 75 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 2 },
      { a: 1, b: 3, order: 1 },
    ],
    highlight: [1, 2, 3],
  },
  {
    name: 'Ketone',
    formula: 'R—CO—R\'',
    suffix: '-one',
    example: 'Propanone',
    exampleFormula: 'CH₃COCH₃',
    property: 'Carbonyl in middle of chain; cannot oxidize further; polar',
    atoms: [
      { sym: 'C', x: 30, y: 50 },
      { sym: 'C', x: 75, y: 50 },
      { sym: 'C', x: 120, y: 50 },
      { sym: 'O', x: 75, y: 20 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 1 },
      { a: 1, b: 3, order: 2 },
    ],
    highlight: [1, 3],
  },
  {
    name: 'Carboxylic Acid',
    formula: 'R—COOH',
    suffix: '-oic acid',
    example: 'Ethanoic acid',
    exampleFormula: 'CH₃COOH',
    property: 'Weak acid (donates H⁺); sour taste; reacts with alcohols to form esters',
    atoms: [
      { sym: 'C', x: 45, y: 50 },
      { sym: 'C', x: 85, y: 50 },
      { sym: 'O', x: 115, y: 25 },
      { sym: 'O', x: 120, y: 70 },
      { sym: 'H', x: 150, y: 70 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 2 },
      { a: 1, b: 3, order: 1 },
      { a: 3, b: 4, order: 1 },
    ],
    highlight: [1, 2, 3, 4],
  },
  {
    name: 'Ester',
    formula: 'R—COO—R\'',
    suffix: '-oate',
    example: 'Methyl ethanoate',
    exampleFormula: 'CH₃COOCH₃',
    property: 'Fruity smell; formed from carboxylic acid + alcohol; used in flavorings',
    atoms: [
      { sym: 'C', x: 30, y: 50 },
      { sym: 'C', x: 70, y: 50 },
      { sym: 'O', x: 100, y: 25 },
      { sym: 'O', x: 105, y: 70 },
      { sym: 'C', x: 145, y: 70 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 2 },
      { a: 1, b: 3, order: 1 },
      { a: 3, b: 4, order: 1 },
    ],
    highlight: [1, 2, 3],
  },
  {
    name: 'Ether',
    formula: 'R—O—R\'',
    suffix: 'oxy-...ane',
    example: 'Dimethyl ether',
    exampleFormula: 'CH₃OCH₃',
    property: 'Oxygen between two carbons; flammable; once used as anesthetic',
    atoms: [
      { sym: 'C', x: 50, y: 50 },
      { sym: 'O', x: 90, y: 50 },
      { sym: 'C', x: 130, y: 50 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 1 },
    ],
    highlight: [1],
  },
  {
    name: 'Amine',
    formula: 'R—NH₂',
    suffix: '-amine',
    example: 'Methylamine',
    exampleFormula: 'CH₃NH₂',
    property: 'Weak base (accepts H⁺); fishy smell; found in amino acids',
    atoms: [
      { sym: 'C', x: 60, y: 50 },
      { sym: 'N', x: 100, y: 50 },
      { sym: 'H', x: 125, y: 30 },
      { sym: 'H', x: 125, y: 70 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 1 },
      { a: 1, b: 3, order: 1 },
    ],
    highlight: [1, 2, 3],
  },
  {
    name: 'Amide',
    formula: 'R—CONH₂',
    suffix: '-amide',
    example: 'Ethanamide',
    exampleFormula: 'CH₃CONH₂',
    property: 'Linkage in proteins (peptide bond); weak base; forms from acid + amine',
    atoms: [
      { sym: 'C', x: 40, y: 50 },
      { sym: 'C', x: 80, y: 50 },
      { sym: 'O', x: 110, y: 25 },
      { sym: 'N', x: 115, y: 75 },
      { sym: 'H', x: 145, y: 65 },
      { sym: 'H', x: 135, y: 90 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 1, b: 2, order: 2 },
      { a: 1, b: 3, order: 1 },
      { a: 3, b: 4, order: 1 },
      { a: 3, b: 5, order: 1 },
    ],
    highlight: [1, 2, 3],
  },
  {
    name: 'Alkene',
    formula: 'C=C',
    suffix: '-ene',
    example: 'Ethene',
    exampleFormula: 'CH₂=CH₂',
    property: 'Carbon-carbon double bond; unsaturated; undergoes addition reactions',
    atoms: [
      { sym: 'C', x: 80, y: 50 },
      { sym: 'C', x: 120, y: 50 },
    ],
    bonds: [
      { a: 0, b: 1, order: 2 },
    ],
    highlight: [0, 1],
  },
  {
    name: 'Alkyne',
    formula: 'C≡C',
    suffix: '-yne',
    example: 'Ethyne',
    exampleFormula: 'CH≡CH',
    property: 'Carbon-carbon triple bond; very reactive; linear geometry; used in welding',
    atoms: [
      { sym: 'C', x: 80, y: 50 },
      { sym: 'C', x: 120, y: 50 },
    ],
    bonds: [
      { a: 0, b: 1, order: 3 },
    ],
    highlight: [0, 1],
  },
  {
    name: 'Aromatic',
    formula: 'C₆H₆ (ring)',
    suffix: '-benzene',
    example: 'Benzene',
    exampleFormula: 'C₆H₆',
    property: 'Stable ring with delocalized π electrons; undergoes substitution, not addition',
    atoms: [],
    bonds: [],
    highlight: [],
    special: 'benzene',
  },
]

export function OrganicFunctionalGroupsExplorer({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [groupIdx, setGroupIdx] = useState(0)
  const group = FUNCTIONAL_GROUPS[groupIdx]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {FUNCTIONAL_GROUPS.map((g, i) => (
          <button key={g.name} onClick={() => setGroupIdx(i)} style={{ ...s.btn(i === groupIdx), fontSize: 9, padding: '2px 5px' }}>{g.name}</button>
        ))}
      </div>

      <svg viewBox="0 0 200 100" width="100%" style={{ maxHeight: 110, background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)', borderRadius: 4 }}>
        {group.special === 'benzene' ? drawBenzene(isDark) : drawMolecule(group.atoms, group.bonds, group.highlight, isDark)}
      </svg>

      <div style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 4, padding: '6px 8px', fontSize: 10, color: s.text, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div><span style={{ color: s.text }}>General formula: </span><b style={{ color: s.bright }}>{group.formula}</b></div>
        <div><span style={{ color: s.text }}>Example: </span><b style={{ color: s.bright }}>{group.example}</b> ({group.exampleFormula})</div>
        <div><span style={{ color: s.text }}>IUPAC suffix: </span><b style={{ color: '#a78bfa' }}>{group.suffix}</b></div>
        <div><span style={{ color: s.text }}>Property: </span>{group.property}</div>
      </div>

      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Functional group: <b style={{ color: s.bright }}>{group.name}</b></div>
        <div>Step 2: General formula: <b style={{ color: s.bright }}>{group.formula}</b></div>
        <div>Step 3: Example: <b style={{ color: s.bright }}>{group.example}</b> ({group.exampleFormula})</div>
        <div>Step 4: IUPAC suffix: <b style={{ color: '#a78bfa' }}>{group.suffix}</b></div>
        <div>Step 5: Key property: {group.property}</div>
        <div>Step 6: The functional group determines reactivity — molecules with the same group behave similarly</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Functional groups are the "reactive handles" of organic molecules. Just as a doorknob works the same regardless of the door, an —OH group behaves similarly whether it's on ethanol or glucose. Recognizing functional groups lets you predict how a molecule will react.
      </div>
    </div>
  )
}

/* ============================================================
   Atom Builder (Grades 6-8) — Task ID 24
   ============================================================ */
const ATOM_ELEMENTS = [
  { z: 1, sym: 'H', name: 'Hydrogen', shells: [1] },
  { z: 2, sym: 'He', name: 'Helium', shells: [2] },
  { z: 3, sym: 'Li', name: 'Lithium', shells: [2, 1] },
  { z: 4, sym: 'Be', name: 'Beryllium', shells: [2, 2] },
  { z: 5, sym: 'B', name: 'Boron', shells: [2, 3] },
  { z: 6, sym: 'C', name: 'Carbon', shells: [2, 4] },
  { z: 7, sym: 'N', name: 'Nitrogen', shells: [2, 5] },
  { z: 8, sym: 'O', name: 'Oxygen', shells: [2, 6] },
  { z: 9, sym: 'F', name: 'Fluorine', shells: [2, 7] },
  { z: 10, sym: 'Ne', name: 'Neon', shells: [2, 8] },
  { z: 11, sym: 'Na', name: 'Sodium', shells: [2, 8, 1] },
  { z: 12, sym: 'Mg', name: 'Magnesium', shells: [2, 8, 2] },
  { z: 13, sym: 'Al', name: 'Aluminum', shells: [2, 8, 3] },
  { z: 14, sym: 'Si', name: 'Silicon', shells: [2, 8, 4] },
  { z: 15, sym: 'P', name: 'Phosphorus', shells: [2, 8, 5] },
  { z: 16, sym: 'S', name: 'Sulfur', shells: [2, 8, 6] },
  { z: 17, sym: 'Cl', name: 'Chlorine', shells: [2, 8, 7] },
  { z: 18, sym: 'Ar', name: 'Argon', shells: [2, 8, 8] },
  { z: 19, sym: 'K', name: 'Potassium', shells: [2, 8, 8, 1] },
  { z: 20, sym: 'Ca', name: 'Calcium', shells: [2, 8, 8, 2] },
]

export function AtomBuilder({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [protons, setProtons] = useState(6)
  const [neutrons, setNeutrons] = useState(6)
  const [electrons, setElectrons] = useState(6)

  const element = protons >= 1 && protons <= 20 ? ATOM_ELEMENTS[protons - 1] : null
  const elementName = element ? element.name : (protons === 0 ? '(no element)' : 'Unknown (Z > 20)')
  const elementSym = element ? element.sym : (protons === 0 ? '—' : '?')

  // Electron shell distribution — fill 2, 8, 8, 2
  const shellFill = useMemo(() => {
    const caps = [2, 8, 8, 2]
    const fill = [0, 0, 0, 0]
    let remaining = Math.max(0, electrons)
    for (let i = 0; i < 4 && remaining > 0; i++) {
      const c = Math.min(caps[i], remaining)
      fill[i] = c
      remaining -= c
    }
    return fill
  }, [electrons])

  const charge = protons - electrons
  const chargeLabel = charge > 0 ? '+' + charge : charge < 0 ? String(charge) : '0'
  const isIon = charge !== 0
  const isCation = charge > 0
  const massNumber = protons + neutrons

  // Stability heuristic (simplified for MS): belt of stability for Z=1-20 is roughly n in [p-1, p+3]
  const isStable = protons >= 1 && neutrons >= Math.max(0, protons - 1) && neutrons <= protons + 3

  // Nucleus particles arranged in a Fermat spiral (golden angle packing)
  const nucleusParticles = useMemo(() => {
    const particles: { x: number; y: number; kind: 'p' | 'n' }[] = []
    let pCount = 0, nCount = 0, i = 0
    while (pCount < protons || nCount < neutrons) {
      let kind: 'p' | 'n'
      const pRatio = protons === 0 ? 1 : pCount / protons
      const nRatio = neutrons === 0 ? 1 : nCount / neutrons
      if (pCount >= protons) kind = 'n'
      else if (nCount >= neutrons) kind = 'p'
      else if (pRatio <= nRatio) kind = 'p'
      else kind = 'n'
      if (kind === 'p') pCount++; else nCount++
      const r = Math.sqrt(i) * 2.6
      const angle = i * 2.39996 // golden angle
      const x = 100 + r * Math.cos(angle)
      const y = 100 + r * Math.sin(angle)
      particles.push({ x, y, kind })
      i++
    }
    return particles
  }, [protons, neutrons])

  const counters: Array<{ label: string; value: number; set: React.Dispatch<React.SetStateAction<number>>; color: string; max: number }> = [
    { label: 'Protons (+)', value: protons, set: setProtons, color: '#f87171', max: 20 },
    { label: 'Neutrons (0)', value: neutrons, set: setNeutrons, color: '#94a3b8', max: 30 },
    { label: 'Electrons (−)', value: electrons, set: setElectrons, color: '#60a5fa', max: 30 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <svg viewBox="0 0 200 200" width="100%" style={{ maxHeight: 220 }}>
        {/* Element label above */}
        <text x={100} y={14} textAnchor="middle" fontSize={13} fontWeight={700} fill={s.bright}>{elementSym} — {elementName}</text>

        {/* Electron shells */}
        {shellFill.map((count, i) => {
          if (count === 0) return null
          const r = 32 + i * 22
          return (
            <g key={'shell-' + i}>
              <circle cx={100} cy={100} r={r} fill="none" stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'} strokeWidth={0.8} strokeDasharray="3,2" />
              {Array.from({ length: count }, (_, ei) => {
                const angle = (2 * Math.PI * ei / Math.max(count, 1)) - Math.PI / 2 + i * 0.4
                const ex = 100 + r * Math.cos(angle)
                const ey = 100 + r * Math.sin(angle)
                return <circle key={'e-' + i + '-' + ei} cx={ex} cy={ey} r={3} fill="#60a5fa" stroke="#1d4ed8" strokeWidth={0.5} />
              })}
            </g>
          )
        })}

        {/* Nucleus cluster */}
        {nucleusParticles.length > 0 && (
          <g>
            <circle cx={100} cy={100} r={Math.max(10, Math.sqrt(nucleusParticles.length) * 2.6 + 6)} fill="rgba(255,200,100,0.08)" />
            {nucleusParticles.map((p, i) => (
              <g key={'nuc-' + i}>
                <circle cx={p.x} cy={p.y} r={4.5} fill={p.kind === 'p' ? '#f87171' : '#94a3b8'} stroke={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} strokeWidth={0.4} />
                <text x={p.x} y={p.y + 0.5} textAnchor="middle" dominantBaseline="central" fontSize={5} fontWeight={800} fill="white">{p.kind === 'p' ? '+' : 'n'}</text>
              </g>
            ))}
          </g>
        )}
        {nucleusParticles.length === 0 && (
          <text x={100} y={104} textAnchor="middle" fontSize={9} fill={s.text}>add particles ↑</text>
        )}
      </svg>

      {/* Particle counters */}
      <div style={{ display: 'flex', gap: 4 }}>
        {counters.map((p, i) => (
          <div key={i} style={{ flex: 1, padding: '3px 4px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border, textAlign: 'center' }}>
            <div style={{ fontSize: 8, color: s.text }}>{p.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 2 }}>
              <button onClick={() => p.set(v => Math.max(0, Math.min(p.max, v - 1)))} style={{ ...s.btn(false), width: 18, padding: 0, fontWeight: 700 }}>−</button>
              <span style={{ fontSize: 13, fontWeight: 700, color: p.color, minWidth: 18 }}>{p.value}</span>
              <button onClick={() => p.set(v => Math.max(0, Math.min(p.max, v + 1)))} style={{ ...s.btn(false), width: 18, padding: 0, fontWeight: 700 }}>+</button>
            </div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', fontSize: 10 }}>
        <div style={{ padding: '2px 6px', borderRadius: 3, background: s.bg, border: '1px solid ' + s.border, color: s.text }}>
          Atomic # = <b style={{ color: s.bright }}>{protons}</b>
        </div>
        <div style={{ padding: '2px 6px', borderRadius: 3, background: s.bg, border: '1px solid ' + s.border, color: s.text }}>
          Mass # = <b style={{ color: s.bright }}>{massNumber}</b>
        </div>
        <div style={{ padding: '2px 6px', borderRadius: 3, background: isIon ? (isCation ? 'rgba(239,68,68,0.15)' : 'rgba(96,165,250,0.15)') : 'rgba(34,197,94,0.15)', border: '1px solid ' + (isIon ? (isCation ? 'rgba(239,68,68,0.3)' : 'rgba(96,165,250,0.3)') : 'rgba(34,197,94,0.3)'), color: isIon ? (isCation ? '#f87171' : '#60a5fa') : '#34d399' }}>
          Charge: <b>{chargeLabel}{isIon ? (isCation ? ' (cation)' : ' (anion)') : ' (neutral)'}</b>
        </div>
        <div style={{ padding: '2px 6px', borderRadius: 3, background: isStable ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', border: '1px solid ' + (isStable ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'), color: isStable ? '#34d399' : '#fbbf24' }}>
          {isStable ? '✓ Stable' : '⚠ Unstable (radioactive)'}
        </div>
      </div>

      {/* Quick preset buttons */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: s.text }}>Presets:</span>
        {[
          { sym: 'H', p: 1, n: 0, e: 1 },
          { sym: 'He', p: 2, n: 2, e: 2 },
          { sym: 'C-14', p: 6, n: 8, e: 6 },
          { sym: 'Na⁺', p: 11, n: 12, e: 10 },
          { sym: 'Cl⁻', p: 17, n: 18, e: 18 },
          { sym: 'Ca', p: 20, n: 20, e: 20 },
        ].map((preset, i) => (
          <button key={i} onClick={() => { setProtons(preset.p); setNeutrons(preset.n); setElectrons(preset.e) }} style={s.btn(false)}>{preset.sym}</button>
        ))}
      </div>

      {/* How It Works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Protons = <b style={{ color: '#f87171' }}>{protons}</b>, Neutrons = <b style={{ color: '#94a3b8' }}>{neutrons}</b>, Electrons = <b style={{ color: '#60a5fa' }}>{electrons}</b></div>
        <div>Step 2: Atomic # = protons = <b style={{ color: s.bright }}>{protons}</b> → Element: <b style={{ color: isDark ? '#34d399' : '#059669' }}>{elementName} ({elementSym})</b></div>
        <div>Step 3: Mass # = protons + neutrons = {protons} + {neutrons} = <b style={{ color: s.bright }}>{massNumber}</b></div>
        <div>Step 4: Charge = protons − electrons = {protons} − {electrons} = <b style={{ color: isIon ? (isCation ? '#f87171' : '#60a5fa') : '#34d399' }}>{chargeLabel}</b>{isIon ? (isCation ? ' → cation (lost e⁻)' : ' → anion (gained e⁻)') : ' → neutral atom'}</div>
        <div>Step 5: Electron shells: <b style={{ color: s.bright }}>{shellFill.filter(c => c > 0).join('-') || '(none)'}</b> (filled in 2, 8, 8, 2 order)</div>
        <div>Step 6: {isStable ? <span style={{ color: '#34d399' }}>✓ Stable isotope — neutron/proton ratio within the belt of stability</span> : <span style={{ color: '#fbbf24' }}>⚠ Unstable — neutron/proton ratio too extreme → this isotope is radioactive and will decay</span>}</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> The number of PROTONS defines the element — change protons and you change the element itself. Change ELECTRONS and you get an ION (same element, charged). Change NEUTRONS and you get an ISOTOPE (same element, different mass — some radioactive).
      </div>
    </div>
  )
}

/* ============================================================
   Conservation of Mass Balance (Grades 6-8) — Task ID 24
   ============================================================ */
type Species = { formula: string; atoms: Record<string, number> }
type ReactionMS = {
  name: string
  reactants: Species[]
  products: Species[]
  balanced: number[]
}

const REACTIONS_MS: ReactionMS[] = [
  {
    name: 'Water Formation',
    reactants: [
      { formula: 'H₂', atoms: { H: 2 } },
      { formula: 'O₂', atoms: { O: 2 } },
    ],
    products: [
      { formula: 'H₂O', atoms: { H: 2, O: 1 } },
    ],
    balanced: [2, 1, 2],
  },
  {
    name: 'Methane Combustion',
    reactants: [
      { formula: 'CH₄', atoms: { C: 1, H: 4 } },
      { formula: 'O₂', atoms: { O: 2 } },
    ],
    products: [
      { formula: 'CO₂', atoms: { C: 1, O: 2 } },
      { formula: 'H₂O', atoms: { H: 2, O: 1 } },
    ],
    balanced: [1, 2, 1, 2],
  },
  {
    name: 'Ammonia Synthesis',
    reactants: [
      { formula: 'N₂', atoms: { N: 2 } },
      { formula: 'H₂', atoms: { H: 2 } },
    ],
    products: [
      { formula: 'NH₃', atoms: { N: 1, H: 3 } },
    ],
    balanced: [1, 3, 2],
  },
]

export function ConservationOfMass({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [rxnIdx, setRxnIdx] = useState(0)
  const rxn = REACTIONS_MS[rxnIdx]
  const [coeffs, setCoeffs] = useState<number[]>(() => Array(REACTIONS_MS[0].reactants.length + REACTIONS_MS[0].products.length).fill(1))

  const selectReaction = (i: number) => {
    setRxnIdx(i)
    const r = REACTIONS_MS[i]
    setCoeffs(Array(r.reactants.length + r.products.length).fill(1))
  }

  // Count atoms per side
  const leftCounts: Record<string, number> = {}
  const rightCounts: Record<string, number> = {}
  rxn.reactants.forEach((sp, i) => {
    const c = coeffs[i] || 1
    Object.entries(sp.atoms).forEach(([el, n]) => { leftCounts[el] = (leftCounts[el] || 0) + c * n })
  })
  rxn.products.forEach((sp, i) => {
    const c = coeffs[rxn.reactants.length + i] || 1
    Object.entries(sp.atoms).forEach(([el, n]) => { rightCounts[el] = (rightCounts[el] || 0) + c * n })
  })

  const allElements = Array.from(new Set([...Object.keys(leftCounts), ...Object.keys(rightCounts)])).sort()
  const balanced = allElements.every(el => (leftCounts[el] || 0) === (rightCounts[el] || 0))

  const leftMass = Object.values(leftCounts).reduce((a, b) => a + b, 0)
  const rightMass = Object.values(rightCounts).reduce((a, b) => a + b, 0)
  const tilt = Math.max(-15, Math.min(15, (leftMass - rightMass) * 1.5))

  const setCoeff = (idx: number, delta: number) => {
    setCoeffs(prev => {
      const next = prev.slice()
      next[idx] = Math.max(1, Math.min(9, (next[idx] || 1) + delta))
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Reaction selector */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {REACTIONS_MS.map((r, i) => (
          <button key={i} onClick={() => selectReaction(i)} style={s.btn(i === rxnIdx)}>{r.name}</button>
        ))}
      </div>

      {/* Balance scale */}
      <svg viewBox="0 0 280 130" width="100%" style={{ maxHeight: 140 }}>
        {/* Fulcrum */}
        <polygon points="140,95 130,120 150,120" fill={isDark ? '#475569' : '#cbd5e1'} stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth={0.5} />
        <line x1={115} y1={120} x2={165} y2={120} stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth={2} />
        {/* Beam (tilted) */}
        <g transform={'rotate(' + tilt + ' 140 95)'}>
          <line x1={60} y1={95} x2={220} y2={95} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={3} strokeLinecap="round" />
          {/* Left pan */}
          <line x1={70} y1={95} x2={70} y2={75} stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth={0.8} />
          <line x1={50} y1={95} x2={70} y2={75} stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth={0.8} />
          <line x1={90} y1={95} x2={70} y2={75} stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth={0.8} />
          <path d={'M 50 75 Q 70 92 90 75'} fill={isDark ? 'rgba(96,165,250,0.3)' : 'rgba(59,130,246,0.2)'} stroke={isDark ? '#60a5fa' : '#3b82f6'} strokeWidth={1} />
          <text x={70} y={70} textAnchor="middle" fontSize={9} fontWeight={700} fill={s.bright}>Reactants</text>
          <text x={70} y={61} textAnchor="middle" fontSize={8} fill={s.text}>{leftMass} atoms</text>
          {/* Right pan */}
          <line x1={210} y1={95} x2={210} y2={75} stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth={0.8} />
          <line x1={190} y1={95} x2={210} y2={75} stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth={0.8} />
          <line x1={230} y1={95} x2={210} y2={75} stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth={0.8} />
          <path d={'M 190 75 Q 210 92 230 75'} fill={isDark ? 'rgba(52,211,153,0.3)' : 'rgba(16,185,129,0.2)'} stroke={isDark ? '#34d399' : '#10b981'} strokeWidth={1} />
          <text x={210} y={70} textAnchor="middle" fontSize={9} fontWeight={700} fill={s.bright}>Products</text>
          <text x={210} y={61} textAnchor="middle" fontSize={8} fill={s.text}>{rightMass} atoms</text>
        </g>
        {balanced && (
          <text x={140} y={18} textAnchor="middle" fontSize={11} fontWeight={700} fill="#34d399">✓ BALANCED</text>
        )}
        {!balanced && (
          <text x={140} y={18} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fbbf24">⚠ unbalanced — adjust coefficients</text>
        )}
      </svg>

      {/* Equation with adjustable coefficients */}
      <div style={{ background: s.bg, border: '1px solid ' + s.border, borderRadius: 6, padding: '6px 6px', fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
          {rxn.reactants.map((sp, i) => (
            <React.Fragment key={'r' + i}>
              {i > 0 && <span style={{ color: s.text, fontWeight: 700, alignSelf: 'center' }}>+</span>}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ display: 'flex', gap: 1 }}>
                  <button onClick={() => setCoeff(i, -1)} style={{ ...s.btn(false), width: 16, padding: 0, fontSize: 9, fontWeight: 700 }}>−</button>
                  <button onClick={() => setCoeff(i, +1)} style={{ ...s.btn(false), width: 16, padding: 0, fontSize: 9, fontWeight: 700 }}>+</button>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>
                  <span style={{ fontSize: 11, color: (coeffs[i] || 1) > 1 ? '#34d399' : s.text, marginRight: 1 }}>{coeffs[i] || 1}</span>{sp.formula}
                </span>
              </div>
            </React.Fragment>
          ))}
          <span style={{ color: s.text, fontWeight: 700, fontSize: 14, alignSelf: 'center', margin: '0 2px' }}>→</span>
          {rxn.products.map((sp, i) => {
            const idx = rxn.reactants.length + i
            return (
              <React.Fragment key={'p' + i}>
                {i > 0 && <span style={{ color: s.text, fontWeight: 700, alignSelf: 'center' }}>+</span>}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ display: 'flex', gap: 1 }}>
                    <button onClick={() => setCoeff(idx, -1)} style={{ ...s.btn(false), width: 16, padding: 0, fontSize: 9, fontWeight: 700 }}>−</button>
                    <button onClick={() => setCoeff(idx, +1)} style={{ ...s.btn(false), width: 16, padding: 0, fontSize: 9, fontWeight: 700 }}>+</button>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>
                    <span style={{ fontSize: 11, color: (coeffs[idx] || 1) > 1 ? '#34d399' : s.text, marginRight: 1 }}>{coeffs[idx] || 1}</span>{sp.formula}
                  </span>
                </div>
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Atom count comparison */}
      <div style={{ display: 'flex', gap: 4, fontSize: 10 }}>
        <div style={{ flex: 1, padding: '4px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: isDark ? '#60a5fa' : '#3b82f6', marginBottom: 2 }}>LEFT (Reactants)</div>
          {allElements.map(el => (
            <div key={el} style={{ display: 'flex', justifyContent: 'space-between', color: s.text }}>
              <span>{el}:</span>
              <span style={{ color: s.bright, fontWeight: 600 }}>{leftCounts[el] || 0}</span>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, padding: '4px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: isDark ? '#34d399' : '#10b981', marginBottom: 2 }}>RIGHT (Products)</div>
          {allElements.map(el => (
            <div key={el} style={{ display: 'flex', justifyContent: 'space-between', color: s.text }}>
              <span>{el}:</span>
              <span style={{ color: (leftCounts[el] || 0) === (rightCounts[el] || 0) ? '#34d399' : '#fbbf24', fontWeight: 600 }}>{rightCounts[el] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Reaction: <b style={{ color: s.bright }}>{rxn.name}</b></div>
        <div>Step 2: Left side: {rxn.reactants.map((sp, i) => (coeffs[i] || 1) + sp.formula).join(' + ')}</div>
        <div>Step 3: Right side: {rxn.products.map((sp, i) => (coeffs[rxn.reactants.length + i] || 1) + sp.formula).join(' + ')}</div>
        <div>Step 4: Left atoms: <b style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}>{allElements.map(el => (leftCounts[el] || 0) + ' ' + el).join(', ')}</b> | Right atoms: <b style={{ color: isDark ? '#34d399' : '#10b981' }}>{allElements.map(el => (rightCounts[el] || 0) + ' ' + el).join(', ')}</b></div>
        <div>Step 5: {balanced ? <span style={{ color: '#34d399', fontWeight: 700 }}>✓ BALANCED — atoms are conserved! Same count on both sides.</span> : <span style={{ color: '#fbbf24', fontWeight: 700 }}>⚠ UNBALANCED — adjust coefficients until atom counts match</span>}</div>
        <div>Step 6: Mass is conserved — same atoms, just rearranged (Lavoisier, 1789). Coefficients balance the equation without changing the identities of the substances.</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Atoms are not created or destroyed in chemical reactions — only rearranged. Bonds break and reform, but every atom present at the start is still there at the end. Coefficients let us "scale up" a reaction without changing what the substances are.
      </div>
    </div>
  )
}

/* ============================================================
   Density Column (Grades 6-8) — Task ID 24
   ============================================================ */
const LIQUIDS = [
  { id: 'honey', name: 'Honey', density: 1.42, color: '#d97706' },
  { id: 'cornSyrup', name: 'Corn Syrup', density: 1.38, color: '#f59e0b' },
  { id: 'dishSoap', name: 'Dish Soap', density: 1.06, color: '#22c55e' },
  { id: 'milk', name: 'Milk', density: 1.03, color: '#f1f5f9' },
  { id: 'water', name: 'Water', density: 1.00, color: '#60a5fa' },
  { id: 'oil', name: 'Vegetable Oil', density: 0.92, color: '#fbbf24' },
]

export function DensityColumn({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [added, setAdded] = useState<string[]>(['water', 'oil', 'honey'])

  const sortedLayers = useMemo(() => {
    return added
      .map(id => LIQUIDS.find(l => l.id === id))
      .filter((l): l is typeof LIQUIDS[number] => l !== undefined)
      .sort((a, b) => b.density - a.density)
  }, [added])

  const toggleLiquid = (id: string) => {
    setAdded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // Cylinder dimensions
  const cylX = 80
  const cylY = 12
  const cylW = 60
  const cylH = 175
  const layerH = sortedLayers.length > 0 ? cylH / sortedLayers.length : 0

  const addedNames = Array.from(new Set(added)).map(id => LIQUIDS.find(l => l.id === id)!.name)
  const addedDensities = Array.from(new Set(added)).map(id => {
    const l = LIQUIDS.find(x => x.id === id)!
    return l.name + ' ' + l.density.toFixed(2)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {/* Liquid selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
          <div style={{ fontSize: 9, color: s.text, fontWeight: 700 }}>Click to add/remove:</div>
          {LIQUIDS.map(l => {
            const isAdded = added.includes(l.id)
            return (
              <button key={l.id} onClick={() => toggleLiquid(l.id)} style={{
                ...s.btn(isAdded),
                display: 'flex', alignItems: 'center', gap: 4, padding: '3px 5px', textAlign: 'left',
              }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: l.color, border: '1px solid rgba(0,0,0,0.25)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 10 }}>{l.name}</span>
                <span style={{ fontSize: 9, color: s.text }}>{l.density.toFixed(2)}</span>
                <span style={{ fontSize: 10, color: isAdded ? '#34d399' : s.text, fontWeight: 700 }}>{isAdded ? '✓' : '+'}</span>
              </button>
            )
          })}
          <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
            <button onClick={() => setAdded(LIQUIDS.map(l => l.id))} style={{ ...s.btn(false), flex: 1, fontSize: 9 }}>All</button>
            <button onClick={() => setAdded([])} style={{ ...s.btn(false), flex: 1, fontSize: 9 }}>Clear</button>
          </div>
        </div>

        {/* Cylinder */}
        <svg viewBox="0 0 170 220" width="120" style={{ maxHeight: 220 }}>
          <defs>
            <clipPath id="cylClip">
              <rect x={cylX} y={cylY} width={cylW} height={cylH} rx={4} />
            </clipPath>
          </defs>
          {/* Layers */}
          <g clipPath="url(#cylClip)">
            {sortedLayers.map((l, i) => {
              const y = cylY + i * layerH
              return (
                <g key={l.id}>
                  <rect x={cylX} y={y} width={cylW} height={layerH + 0.5} fill={l.color} opacity={0.85} />
                  {i === 0 && <ellipse cx={cylX + cylW/2} cy={y + 3} rx={cylW/2 - 2} ry={3} fill="white" opacity={0.2} />}
                  <text x={cylX + cylW/2} y={y + layerH/2 + 1} textAnchor="middle" fontSize={8} fontWeight={700} fill="rgba(0,0,0,0.75)">{l.name.split(' ')[0]}</text>
                  <text x={cylX + cylW/2} y={y + layerH/2 + 11} textAnchor="middle" fontSize={7} fill="rgba(0,0,0,0.6)">{l.density.toFixed(2)}</text>
                </g>
              )
            })}
          </g>
          {/* Cylinder outline */}
          <rect x={cylX} y={cylY} width={cylW} height={cylH} rx={4} fill="none" stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1.5} />
          {/* Top ellipse for 3D effect */}
          <ellipse cx={cylX + cylW/2} cy={cylY} rx={cylW/2} ry={4} fill={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1} />
          {/* Density gradient arrow on side */}
          <line x1={cylX + cylW + 10} y1={cylY + 4} x2={cylX + cylW + 10} y2={cylY + cylH - 4} stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth={1} markerStart="url(#densArrTop)" markerEnd="url(#densArrBot)" />
          <defs>
            <marker id="densArrTop" markerWidth="6" markerHeight="6" refX="3" refY="0" orient="auto">
              <polygon points="0 5, 3 0, 6 5" fill={isDark ? '#64748b' : '#94a3b8'} />
            </marker>
            <marker id="densArrBot" markerWidth="6" markerHeight="6" refX="3" refY="5" orient="auto">
              <polygon points="0 0, 3 5, 6 0" fill={isDark ? '#64748b' : '#94a3b8'} />
            </marker>
          </defs>
          <text x={cylX + cylW + 14} y={cylY + 8} fontSize={7} fill={s.text} fontWeight={700}>Low</text>
          <text x={cylX + cylW + 14} y={cylY + cylH - 2} fontSize={7} fill={s.text} fontWeight={700}>High</text>
          <text x={cylX + cylW + 14} y={cylY + cylH/2 + 4} fontSize={6} fill={s.text} transform={'rotate(90 ' + (cylX + cylW + 14) + ' ' + (cylY + cylH/2 + 4) + ')'}>density →</text>
        </svg>
      </div>

      {/* How It Works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Liquids added: <b style={{ color: s.bright }}>{added.length === 0 ? 'none yet' : addedNames.join(', ')}</b></div>
        <div>Step 2: Densities: <b style={{ color: s.bright }}>{added.length === 0 ? '—' : addedDensities.join(', ')}</b> g/cm³</div>
        <div>Step 3: Auto-sorting by density (heaviest at bottom, lightest at top)...</div>
        <div>Step 4: Layer order (bottom → top): <b style={{ color: s.bright }}>{sortedLayers.length === 0 ? 'empty' : sortedLayers.map(l => l.name).join(' → ')}</b></div>
        <div>Step 5: {sortedLayers.length > 0 ? (sortedLayers[sortedLayers.length - 1].name + ' floats on top — least dense (' + sortedLayers[sortedLayers.length - 1].density.toFixed(2) + ' g/cm³) | ' + sortedLayers[0].name + ' sinks to bottom — most dense (' + sortedLayers[0].density.toFixed(2) + ' g/cm³)') : 'Add liquids to see them auto-layer'}</div>
        <div>Step 6: Density = mass ÷ volume — denser means more mass packed into the same space. Pour order doesn't matter; density always wins.</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> Density is an intensive property — it doesn't change with the amount. A drop of honey and a pool of honey both have the same density. That's why layering is predictable: denser sinks, less dense floats, regardless of pour order.
      </div>
    </div>
  )
}

/* ============================================================
   Phase Change Graph (Grades 6-8) — Task ID 24
   ============================================================ */
const PHASE_SEGMENTS = [
  { t0: 0, t1: 3, T0: -20, T1: 0, phase: 'Solid (ice)', color: '#60a5fa' },
  { t0: 3, t1: 7, T0: 0, T1: 0, phase: 'Melting', color: '#a78bfa' },
  { t0: 7, t1: 11, T0: 0, T1: 100, phase: 'Liquid (water)', color: '#3b82f6' },
  { t0: 11, t1: 16, T0: 100, T1: 100, phase: 'Boiling', color: '#f87171' },
  { t0: 16, t1: 20, T0: 100, T1: 120, phase: 'Gas (steam)', color: '#fbbf24' },
]
const PHASE_RATES = [14, 83.5, 104.5, 452, 10] // J/(g·min) for the 5 segments

function tempAtTime(t: number): number {
  for (const seg of PHASE_SEGMENTS) {
    if (t <= seg.t1) {
      const f = (t - seg.t0) / (seg.t1 - seg.t0)
      return seg.T0 + (seg.T1 - seg.T0) * f
    }
  }
  return 120
}
function phaseAtTime(t: number) {
  for (const seg of PHASE_SEGMENTS) {
    if (t <= seg.t1) return seg
  }
  return PHASE_SEGMENTS[PHASE_SEGMENTS.length - 1]
}
function energyAtTime(t: number): number {
  let e = 0
  for (let i = 0; i < PHASE_SEGMENTS.length; i++) {
    const seg = PHASE_SEGMENTS[i]
    if (t <= seg.t0) break
    const segEnd = Math.min(t, seg.t1)
    e += PHASE_RATES[i] * (segEnd - seg.t0)
  }
  return e
}

export function PhaseChangeGraph({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const rafRef = useRef<number | undefined>(undefined)
  const startRef = useRef<number>(0)
  const startTRef = useRef<number>(0)

  useEffect(() => {
    if (!playing) return
    startRef.current = performance.now()
    startTRef.current = time
    const tick = () => {
      const elapsed = (performance.now() - startRef.current) / 1000
      const newT = Math.min(20, startTRef.current + elapsed)
      setTime(newT)
      if (newT >= 20) {
        setPlaying(false)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])

  const temp = tempAtTime(time)
  const phase = phaseAtTime(time)
  const energy = energyAtTime(time)
  const isPlateau = phase.T0 === phase.T1
  const onMeltingPlateau = phase.phase === 'Melting'
  const onBoilingPlateau = phase.phase === 'Boiling'

  // Graph layout
  const gw = 240
  const gh = 125
  const gx = 32
  const gy = 12
  const tMin = -20, tMax = 120
  const timeToX = (t: number) => gx + (t / 20) * gw
  const tempToY = (T: number) => gy + gh - ((T - tMin) / (tMax - tMin)) * gh

  // Full curve path
  const curvePoints: { x: number; y: number }[] = []
  for (const seg of PHASE_SEGMENTS) {
    curvePoints.push({ x: timeToX(seg.t0), y: tempToY(seg.T0) })
    curvePoints.push({ x: timeToX(seg.t1), y: tempToY(seg.T1) })
  }
  const curvePath = curvePoints.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ')

  // Traveled path (solid) up to current time
  const traveledPath = (() => {
    if (time <= 0) return ''
    const pts: { x: number; y: number }[] = [{ x: timeToX(0), y: tempToY(PHASE_SEGMENTS[0].T0) }]
    for (const seg of PHASE_SEGMENTS) {
      if (time <= seg.t0) break
      const segEnd = Math.min(time, seg.t1)
      const f = (segEnd - seg.t0) / (seg.t1 - seg.t0)
      const T = seg.T0 + (seg.T1 - seg.T0) * f
      pts.push({ x: timeToX(segEnd), y: tempToY(T) })
    }
    return pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join(' ')
  })()

  // Filled area under traveled curve
  const filledPath = traveledPath ? traveledPath + ' L ' + timeToX(time).toFixed(1) + ' ' + tempToY(tMin).toFixed(1) + ' L ' + timeToX(0).toFixed(1) + ' ' + tempToY(tMin).toFixed(1) + ' Z' : ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => setPlaying(p => !p)} style={{ ...s.btn(playing), padding: '3px 8px' }}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button onClick={() => { setPlaying(false); setTime(0) }} style={s.btn(false)}>↺ Reset</button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 9, color: s.text }}>t:</span>
          <input type="range" aria-label="Time in seconds" min={0} max={20} step={0.1} value={time} onChange={e => { setPlaying(false); setTime(parseFloat(e.target.value)) }} style={{ flex: 1 }} />
        </div>
      </div>

      {/* Graph */}
      <svg viewBox="0 0 285 165" width="100%" style={{ maxHeight: 175 }}>
        {/* Grid lines (every 25°) */}
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={gx} y1={tempToY(v)} x2={gx + gw} y2={tempToY(v)} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} strokeWidth={0.5} />
            <text x={gx - 4} y={tempToY(v) + 3} textAnchor="end" fontSize={7} fill={s.text}>{v}</text>
          </g>
        ))}
        {/* Phase change reference lines */}
        <line x1={gx} y1={tempToY(0)} x2={gx + gw} y2={tempToY(0)} stroke="#22c55e" strokeWidth={0.8} strokeDasharray="3,2" opacity={0.6} />
        <line x1={gx} y1={tempToY(100)} x2={gx + gw} y2={tempToY(100)} stroke="#f87171" strokeWidth={0.8} strokeDasharray="3,2" opacity={0.6} />
        <text x={gx + gw - 2} y={tempToY(0) - 2} textAnchor="end" fontSize={7} fill="#22c55e" fontWeight={700}>0°C (melting)</text>
        <text x={gx + gw - 2} y={tempToY(100) - 2} textAnchor="end" fontSize={7} fill="#f87171" fontWeight={700}>100°C (boiling)</text>

        {/* Axes */}
        <text x={11} y={gy + gh / 2} textAnchor="middle" fontSize={8} fill={s.text} fontWeight={700} transform={'rotate(-90 11 ' + (gy + gh/2) + ')'}>Temp (°C)</text>
        <line x1={gx} y1={gy + gh} x2={gx + gw} y2={gy + gh} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1} />
        <line x1={gx} y1={gy} x2={gx} y2={gy + gh} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1} />
        {/* X ticks */}
        {[0, 5, 10, 15, 20].map(t => (
          <g key={t}>
            <line x1={timeToX(t)} y1={gy + gh} x2={timeToX(t)} y2={gy + gh + 3} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={0.5} />
            <text x={timeToX(t)} y={gy + gh + 12} textAnchor="middle" fontSize={7} fill={s.text}>{t}</text>
          </g>
        ))}
        <text x={gx + gw / 2} y={gy + gh + 22} textAnchor="middle" fontSize={8} fill={s.text} fontWeight={700}>Time (min)</text>

        {/* Filled area under traveled curve */}
        {filledPath && <path d={filledPath} fill={phase.color} opacity={0.15} />}

        {/* Full curve (faded dashed) */}
        <path d={curvePath} fill="none" stroke={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'} strokeWidth={1} strokeDasharray="2,2" />
        {/* Traveled curve (solid colored) */}
        {traveledPath && <path d={traveledPath} fill="none" stroke={phase.color} strokeWidth={2.2} />}

        {/* Current position marker */}
        <line x1={timeToX(time)} y1={gy} x2={timeToX(time)} y2={gy + gh} stroke={phase.color} strokeWidth={0.5} opacity={0.5} strokeDasharray="2,2" />
        <circle cx={timeToX(time)} cy={tempToY(temp)} r={4.5} fill={phase.color} stroke={isDark ? '#e2e8f0' : '#1e293b'} strokeWidth={1.5} />

        {/* Phase label */}
        <g>
          <rect x={gx + 4} y={gy + 4} width={100} height={13} rx={2} fill={phase.color} opacity={0.2} stroke={phase.color} strokeWidth={0.5} />
          <text x={gx + 8} y={gy + 13} fontSize={8} fontWeight={700} fill={phase.color}>{phase.phase}{isPlateau ? ' (plateau)' : ''}</text>
        </g>
      </svg>

      {/* Readouts */}
      <div style={{ display: 'flex', gap: 4, fontSize: 10 }}>
        <div style={{ flex: 1, padding: '3px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
          <div style={{ fontSize: 8, color: s.text }}>TIME</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>{time.toFixed(1)} min</div>
        </div>
        <div style={{ flex: 1, padding: '3px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
          <div style={{ fontSize: 8, color: s.text }}>TEMP</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: phase.color }}>{temp.toFixed(1)}°C</div>
        </div>
        <div style={{ flex: 1, padding: '3px 6px', borderRadius: 4, background: s.bg, border: '1px solid ' + s.border }}>
          <div style={{ fontSize: 8, color: s.text }}>ENERGY</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: s.bright }}>{energy.toFixed(0)} J/g</div>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Time = <b style={{ color: s.bright }}>{time.toFixed(1)}</b> min, Temperature = <b style={{ color: phase.color }}>{temp.toFixed(1)}°C</b></div>
        <div>Step 2: Current phase: <b style={{ color: phase.color }}>{phase.phase}</b></div>
        <div>Step 3: {isPlateau ? <span>PLATEAU — temperature holds at <b style={{ color: phase.color }}>{temp.toFixed(0)}°C</b> while energy goes into breaking bonds, NOT raising temperature</span> : <span>Temperature rising — heat goes into kinetic energy of molecules (moving faster)</span>}</div>
        <div>Step 4: {onMeltingPlateau ? 'Ice → Water: breaking solid bonds (latent heat of fusion ≈ 334 J/g)' : onBoilingPlateau ? 'Water → Steam: breaking liquid bonds (latent heat of vaporization ≈ 2260 J/g)' : 'Sensible heating — no phase change, just temperature change'}</div>
        <div>Step 5: Energy added so far: <b style={{ color: s.bright }}>{energy.toFixed(0)} J/g</b> (per gram of water)</div>
        <div>Step 6: The plateaus prove energy is needed to CHANGE state, not just raise temperature. The graph shape is the substance's "thermal fingerprint."</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> During a phase change, temperature holds steady even though heat keeps flowing in. That energy is the "cost" of breaking intermolecular bonds — invisible work happening at the molecular level. Different substances have different plateau lengths (latent heats), making the heating curve a unique signature.
      </div>
    </div>
  )
}

/* ============================================================
   Acid-Base Indicators (Grades 6-8) — Task ID 24
   ============================================================ */
const INDICATOR_SUBSTANCES = [
  { name: 'Lemon juice', ph: 2 },
  { name: 'Vinegar', ph: 3 },
  { name: 'Tomato juice', ph: 4 },
  { name: 'Black coffee', ph: 5 },
  { name: 'Milk', ph: 6.5 },
  { name: 'Pure water', ph: 7 },
  { name: 'Baking soda', ph: 9 },
  { name: 'Ammonia', ph: 11 },
  { name: 'Bleach', ph: 12 },
]

function rgb(c: number[]): string { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')' }

function universalIndicatorColor(ph: number): string {
  const stops = [
    { p: 0, c: [220, 38, 38] },
    { p: 2, c: [249, 115, 22] },
    { p: 4, c: [234, 179, 8] },
    { p: 6, c: [132, 204, 22] },
    { p: 7, c: [34, 197, 94] },
    { p: 8, c: [20, 184, 166] },
    { p: 10, c: [59, 130, 246] },
    { p: 12, c: [99, 102, 241] },
    { p: 14, c: [168, 85, 247] },
  ]
  if (ph <= 0) return rgb(stops[0].c)
  if (ph >= 14) return rgb(stops[stops.length - 1].c)
  for (let i = 0; i < stops.length - 1; i++) {
    if (ph >= stops[i].p && ph <= stops[i+1].p) {
      const f = (ph - stops[i].p) / (stops[i+1].p - stops[i].p)
      const c = [0, 1, 2].map(k => Math.round(stops[i].c[k] + (stops[i+1].c[k] - stops[i].c[k]) * f))
      return rgb(c)
    }
  }
  return rgb(stops[stops.length - 1].c)
}
function universalColorName(ph: number): string {
  if (ph < 2) return 'Red'
  if (ph < 4) return 'Orange'
  if (ph < 5.5) return 'Yellow'
  if (ph < 6.5) return 'Yellow-Green'
  if (ph < 7.5) return 'Green'
  if (ph < 9) return 'Teal'
  if (ph < 11) return 'Blue'
  if (ph < 13) return 'Indigo'
  return 'Violet'
}
function litmusColor(ph: number): string { return ph < 4.5 ? '#dc2626' : ph > 8.3 ? '#2563eb' : '#a855f7' }
function litmusName(ph: number): string { return ph < 4.5 ? 'Red' : ph > 8.3 ? 'Blue' : 'Purple' }
function phenolphthaleinColor(ph: number): string { return ph < 8.2 ? '#f8fafc' : ph > 10 ? '#ec4899' : '#f9a8d4' }
function phenolphthaleinName(ph: number): string { return ph < 8.2 ? 'Colorless' : ph > 10 ? 'Magenta' : 'Pink' }
function btbColor(ph: number): string { return ph < 6.0 ? '#eab308' : ph > 7.6 ? '#2563eb' : '#22c55e' }
function btbName(ph: number): string { return ph < 6.0 ? 'Yellow' : ph > 7.6 ? 'Blue' : 'Green' }
function methylOrangeColor(ph: number): string { return ph < 3.1 ? '#dc2626' : ph > 4.4 ? '#eab308' : '#f97316' }
function methylOrangeName(ph: number): string { return ph < 3.1 ? 'Red' : ph > 4.4 ? 'Yellow' : 'Orange' }

export function AcidBaseIndicators({ isDark }: { isDark: boolean }) {
  const s = styles(isDark)
  const [ph, setPh] = useState(2)
  const [substance, setSubstance] = useState('Lemon juice')

  const setSubstanceAndPh = (name: string, p: number) => {
    setSubstance(name)
    setPh(p)
  }
  const onSliderChange = (newPh: number) => {
    setPh(newPh)
    const match = INDICATOR_SUBSTANCES.find(x => Math.abs(x.ph - newPh) < 0.05)
    setSubstance(match ? match.name : 'Custom')
  }

  const classification = ph < 6.5 ? 'ACIDIC' : ph > 7.5 ? 'BASIC' : 'NEUTRAL'
  const classColor = ph < 6.5 ? '#f87171' : ph > 7.5 ? '#60a5fa' : '#34d399'

  const phenoSwatch = phenolphthaleinName(ph) === 'Colorless'
    ? 'repeating-linear-gradient(45deg, ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)') + ' 0 4px, ' + (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)') + ' 4px 8px)'
    : phenolphthaleinColor(ph)

  const indicators = [
    { name: 'Litmus', swatch: litmusColor(ph), label: litmusName(ph), range: '4.5 – 8.3' },
    { name: 'Phenolphthalein', swatch: phenoSwatch, label: phenolphthaleinName(ph), range: '8.2 – 10.0' },
    { name: 'Bromothymol Blue', swatch: btbColor(ph), label: btbName(ph), range: '6.0 – 7.6' },
    { name: 'Methyl Orange', swatch: methylOrangeColor(ph), label: methylOrangeName(ph), range: '3.1 – 4.4' },
    { name: 'Universal', swatch: universalIndicatorColor(ph), label: 'pH ' + ph.toFixed(1), range: '0 – 14 (full)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Substance selector */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {INDICATOR_SUBSTANCES.map(sub => (
          <button key={sub.name} onClick={() => setSubstanceAndPh(sub.name, sub.ph)} style={s.btn(substance === sub.name)}>{sub.name}</button>
        ))}
      </div>

      {/* pH slider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, color: s.text }}>pH:</span>
        <input type="range" aria-label="pH slider" min={0} max={14} step={0.1} value={ph} onChange={e => onSliderChange(parseFloat(e.target.value))} style={{ flex: 1 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: s.bright, minWidth: 28, textAlign: 'right' }}>{ph.toFixed(1)}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: classColor, padding: '1px 6px', borderRadius: 8, background: classColor + '22' }}>{classification}</span>
      </div>

      {/* Test tube with substance color */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <svg viewBox="0 0 40 100" width="30" style={{ maxHeight: 100 }}>
          <defs>
            <linearGradient id="tubeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
            </linearGradient>
          </defs>
          <path d="M 14 5 L 14 80 Q 14 92 20 92 Q 26 92 26 80 L 26 5 Z" fill="none" stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1.2} />
          <path d="M 15 25 L 15 80 Q 15 91 20 91 Q 25 91 25 80 L 25 25 Z" fill={universalIndicatorColor(ph)} opacity={0.85} />
          <path d="M 16 25 L 16 80 Q 16 90 20 90 L 20 25 Z" fill="url(#tubeGrad)" opacity={0.4} />
          <ellipse cx={20} cy={5} rx={6} ry={1.5} fill={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} stroke={isDark ? '#94a3b8' : '#475569'} strokeWidth={1} />
        </svg>
        <div style={{ flex: 1, fontSize: 10, color: s.text }}>
          <div style={{ fontSize: 12, color: s.bright, fontWeight: 700 }}>{substance}</div>
          <div>pH = <b style={{ color: s.bright }}>{ph.toFixed(1)}</b></div>
          <div>{ph < 7 ? 'Acidic — high [H⁺]' : ph > 7 ? 'Basic — high [OH⁻]' : 'Neutral — [H⁺] = [OH⁻]'}</div>
        </div>
      </div>

      {/* 5 Indicator strips */}
      <div style={{ display: 'flex', gap: 3 }}>
        {indicators.map(ind => (
          <div key={ind.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ fontSize: 8, color: s.text, textAlign: 'center', fontWeight: 600, minHeight: 18, lineHeight: 1.1 }}>{ind.name}</div>
            <div style={{ width: '100%', height: 38, borderRadius: 3, background: ind.swatch, border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'), boxShadow: 'inset 0 -4px 6px rgba(0,0,0,0.15)' }} />
            <div style={{ fontSize: 8, color: s.bright, fontWeight: 700, textAlign: 'center' }}>{ind.label}</div>
            <div style={{ fontSize: 7, color: s.text, textAlign: 'center' }}>{ind.range}</div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div style={{ marginTop: 6, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.6, background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'), color: isDark ? '#e2e8f0' : '#1e293b' }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 3 }}>How It Works — Step by Step</div>
        <div>Step 1: Substance: <b style={{ color: s.bright }}>{substance}</b> (pH = <b style={{ color: s.bright }}>{ph.toFixed(1)}</b>)</div>
        <div>Step 2: <b style={{ color: classColor }}>{classification}</b>{ph < 7 ? ' — more H⁺ than OH⁻' : ph > 7 ? ' — more OH⁻ than H⁺' : ' — H⁺ = OH⁻'}</div>
        <div>Step 3: Litmus → <b style={{ color: litmusColor(ph) }}>{litmusName(ph)}</b> (red in acid, blue in base, transition 4.5–8.3)</div>
        <div>Step 4: Phenolphthalein → <b style={{ color: phenolphthaleinName(ph) === 'Colorless' ? s.text : phenolphthaleinColor(ph) }}>{phenolphthaleinName(ph)}</b> (colorless in acid, pink in base, transition 8.2–10)</div>
        <div>Step 5: Universal indicator → <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: universalIndicatorColor(ph), verticalAlign: 'middle', border: '1px solid rgba(0,0,0,0.25)' }} /> <b>{universalColorName(ph)}</b> — covers full pH 0–14 range continuously</div>
        <div>Step 6: Indicators are weak acids/bases that change color when they lose or gain an H⁺ — different indicators switch at different pH ranges, so chemists pick the one that brackets the expected equivalence point.</div>
      </div>
      <div style={{ marginTop: 4, padding: '6px 8px', borderRadius: 4, fontSize: 11, lineHeight: 1.5, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
        💡 <b>Insight:</b> No single indicator works for all pH values — each flips color across a narrow "transition range." Universal indicator mixes several dyes so it works across the entire 0–14 scale, giving a rainbow readout of acidity.
      </div>
    </div>
  )
}

/* ============================================================
   End of MS (6-8) Chemistry Widgets — Task ID 24
   ============================================================ */
