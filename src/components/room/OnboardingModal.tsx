'use client'

import React, { useState, useEffect } from 'react'
import { playSuccessSound } from '@/lib/whiteboard/sound'

// ============================================================
// OnboardingModal — 3-step first-visit onboarding for SuperBoard.
// Fix #3: appears once per browser (localStorage flag).
// ============================================================

const STORAGE_KEY = 'superboard_onboarding_complete'

const SUBJECTS: { label: string; icon: string; color: string }[] = [
  { label: 'Math Tools', icon: '🧮', color: '#3b82f6' },
  { label: 'Physics', icon: '⚡', color: '#f59e0b' },
  { label: 'Chemistry', icon: '⚛️', color: '#10b981' },
  { label: 'Biology', icon: '🌱', color: '#22c55e' },
  { label: 'Language', icon: '📖', color: '#ec4899' },
  { label: 'Statistics', icon: '📊', color: '#06b6d4' },
  { label: 'Earth Science', icon: '🌍', color: '#84cc16' },
  { label: 'Arts & Music', icon: '🎨', color: '#a855f7' },
  { label: 'Classroom', icon: '⏱️', color: '#ef4444' },
]

const STEPS: { icon: string; title: string; description: string }[] = [
  {
    icon: '🎯',
    title: 'Pick a Subject',
    description: 'Choose from 9 subject toolkits — Math, Physics, Chemistry, Biology, Language, Statistics, Earth Science, Arts, and Classroom. Click one to explore widgets.',
  },
  {
    icon: '➕',
    title: 'Add a Widget',
    description: 'Click "+ Add to Board" on any widget to place it on your canvas. Widgets stay interactive — perfect for live demonstrations.',
  },
  {
    icon: '🔗',
    title: 'Share with Students',
    description: 'Use the Share button to invite students to your whiteboard. They can watch, draw, and interact in real time.',
  },
]

interface OnboardingModalProps {
  /** Optional override to force-show the modal (e.g. for a help menu). */
  forceOpen?: boolean
  /** Optional callback when the modal is dismissed or completed. */
  onClose?: () => void
}

export function OnboardingModal({ forceOpen, onClose }: OnboardingModalProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (forceOpen) {
      setOpen(true)
      setStep(0)
      return
    }
    if (typeof window === 'undefined') return
    try {
      const done = window.localStorage.getItem(STORAGE_KEY)
      if (!done) setOpen(true)
    } catch {
      /* localStorage unavailable */
    }
  }, [forceOpen])

  const dismiss = () => {
    setOpen(false)
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY, 'true')
      } catch {
        /* ignore */
      }
    }
    // Task 42 / Fix #29 — success chime when onboarding completes
    // (muted by default; only fires if the user has opted in via settings).
    if (step === STEPS.length - 1) {
      playSuccessSound()
    }
    onClose?.()
  }

  const skip = dismiss
  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      dismiss()
    }
  }

  if (!open) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  // Theme-aware colors
  const cardBg = '#0f172a'
  const cardBorder = 'rgba(255,255,255,0.1)'
  const textColor = '#e2e8f0'
  const mutedColor = '#94a3b8'
  const accentBg = 'rgba(99,102,241,0.15)'
  const accentBorder = 'rgba(99,102,241,0.4)'
  const accentText = '#818cf8'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        padding: 16,
      }}
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: cardBg,
          border: '1px solid ' + cardBorder,
          borderRadius: 12,
          padding: 24,
          maxWidth: 480,
          width: '100%',
          color: textColor,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: i <= step ? accentText : 'rgba(255,255,255,0.1)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>

        {/* Icon */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: accentBg,
            border: '1px solid ' + accentBorder,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            marginBottom: 16,
          }}
        >
          {current.icon}
        </div>

        {/* Title + description */}
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: textColor }}>
          {current.title}
        </h2>
        <p style={{ fontSize: 13, lineHeight: 1.6, margin: '0 0 20px', color: mutedColor }}>
          {current.description}
        </p>

        {/* Step-specific visual */}
        {step === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
            {SUBJECTS.map((s) => (
              <div
                key={s.label}
                style={{
                  padding: '10px 6px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  color: mutedColor,
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div style={{ marginBottom: 20, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>📊</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: textColor }}>Sample Widget</div>
              <div style={{ fontSize: 10, color: mutedColor, marginTop: 2 }}>Try the button below</div>
            </div>
            <span style={{ padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>
              + Add to Board
            </span>
          </div>
        )}

        {step === 2 && (
          <div style={{ marginBottom: 20, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>👥</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: textColor }}>Invite Students</div>
              <div style={{ fontSize: 10, color: mutedColor, marginTop: 2, fontFamily: 'monospace' }}>superboard.app/room/abc123</div>
            </div>
            <span style={{ padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
              Copy Link
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={skip}
            style={{
              background: 'transparent',
              border: 'none',
              color: mutedColor,
              fontSize: 12,
              cursor: 'pointer',
              padding: '8px 4px',
            }}
          >
            Skip
          </button>
          <button
            onClick={next}
            style={{
              padding: '8px 20px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: accentText,
              border: 'none',
              color: '#0f172a',
              cursor: 'pointer',
            }}
          >
            {isLast ? 'Get Started' : 'Next'} →
          </button>
        </div>

        {/* Step counter */}
        <div style={{ fontSize: 10, color: mutedColor, textAlign: 'center', marginTop: 12 }}>
          Step {step + 1} of {STEPS.length}
        </div>
      </div>
    </div>
  )
}
