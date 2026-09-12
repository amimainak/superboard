// ============================================================
// sound.ts — Minimal Web Audio sound design (Task 42 / Fix #29).
// All sounds are muted by default. Toggle via
// `localStorage['superboard_sound'] = 'on'` or the setSoundEnabled()
// helper.
// ============================================================

type SoundKind = 'click' | 'success' | 'notify'

let _audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (_audioCtx) return _audioCtx
  const w = window as typeof window & {
    AudioContext?: typeof AudioContext
    webkitAudioContext?: typeof AudioContext
  }
  const AC = w.AudioContext ?? w.webkitAudioContext
  if (!AC) return null
  try {
    _audioCtx = new AC()
  } catch {
    return null
  }
  return _audioCtx
}

function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem('superboard_sound') === 'on'
  } catch {
    return false
  }
}

export function setSoundEnabled(on: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem('superboard_sound', on ? 'on' : 'off')
  } catch {
    /* ignore */
  }
}

export function isSoundCurrentlyEnabled(): boolean {
  return isSoundEnabled()
}

function playSound(kind: SoundKind): void {
  if (!isSoundEnabled()) return
  const ctx = getAudioCtx()
  if (!ctx) return
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => { /* ignore */ })
  }
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)

  if (kind === 'click') {
    // Short click — 500Hz, 50ms, low volume
    osc.type = 'sine'
    osc.frequency.setValueAtTime(500, now)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)
    osc.start(now)
    osc.stop(now + 0.06)
  } else if (kind === 'success') {
    // Two-tone rising chime — C5 then E5
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(523.25, now)
    osc.frequency.setValueAtTime(659.25, now + 0.12)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
    osc.start(now)
    osc.stop(now + 0.3)
  } else if (kind === 'notify') {
    // Soft notification — A4 then A5
    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.setValueAtTime(880, now + 0.1)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)
    osc.start(now)
    osc.stop(now + 0.26)
  }
}

/** Subtle click — fires when a widget is added to the board. */
export function playClickSound(): void { playSound('click') }
/** Rising two-tone chime — fires when onboarding completes. */
export function playSuccessSound(): void { playSound('success') }
/** Soft two-tone notification — fires when a student joins the room. */
export function playNotifySound(): void { playSound('notify') }
