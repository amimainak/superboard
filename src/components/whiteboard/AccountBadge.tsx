// ============================================================
// Superboard — Account Badge (Fix #7)
// Small user-context chip shown in the whiteboard top bar.
// - Avatar (first letter of name) or "G" for guest
// - User name or "Guest"
// - Account tier pill (Free / Pro / Agency)
// - Click → /dashboard when signed in, /login when guest
// ============================================================

'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { Tier } from '@/types'

interface AccountBadgeProps {
  isDark: boolean
}

interface BadgeState {
  name: string
  tier: Tier
  isGuest: boolean
}

const AVATAR_COLORS = [
  '#3b82f6', '#059669', '#a855f7', '#f59e0b',
  '#ec4899', '#06b6d4', '#ef4444', '#8b5cf6',
]

function colorForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function tierLabel(tier: Tier): string {
  switch (tier) {
    case 'PRO':
      return 'Pro'
    case 'AGENCY':
    case 'AGENCY_STANDARD':
    case 'AGENCY_PREMIUM':
      return 'Agency'
    case 'FREE':
    default:
      return 'Free'
  }
}

function tierClass(tier: Tier, isGuest: boolean): string {
  if (isGuest) return 'account-tier-guest'
  if (tier === 'PRO') return 'account-tier-pro'
  if (tier === 'AGENCY' || tier === 'AGENCY_STANDARD' || tier === 'AGENCY_PREMIUM') {
    return 'account-tier-agency'
  }
  return 'account-tier-free'
}

export function AccountBadge({ isDark }: AccountBadgeProps) {
  const router = useRouter()
  const [state, setState] = useState<BadgeState>({
    name: 'Guest',
    tier: 'FREE',
    isGuest: true,
  })

  useEffect(() => {
    let mounted = true

    async function loadUser() {
      try {
        const supabase = getSupabaseBrowserClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!mounted) return

        if (!user) {
          setState({ name: 'Guest', tier: 'FREE', isGuest: true })
          return
        }

        // Try to load profile (for tier + display name)
        let tier: Tier = 'FREE'
        let name =
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          (user.email ?? '').split('@')[0] ||
          'User'

        try {
          const res = await fetch(`/api/auth/profile?userId=${user.id}`)
          if (res.ok) {
            const data = await res.json()
            if (data.tier) tier = data.tier as Tier
            if (data.name) name = data.name
            else if (data.displayName) name = data.displayName
          }
        } catch {
          // Ignore profile errors — fall back to auth metadata
        }

        if (!mounted) return
        setState({ name, tier, isGuest: false })
      } catch {
        // Supabase env vars may be missing in dev — fall back to guest
        if (!mounted) return
        setState({ name: 'Guest', tier: 'FREE', isGuest: true })
      }
    }

    loadUser()
    return () => {
      mounted = false
    }
  }, [])

  const initial = state.isGuest ? 'G' : (state.name.charAt(0).toUpperCase() || 'U')
  const avatarColor = state.isGuest ? '#94a3b8' : colorForName(state.name)
  const href = state.isGuest ? '/login' : '/dashboard'

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push(href)
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className={[
        'account-badge',
        isDark ? 'account-badge-dark' : '',
      ].join(' ')}
      aria-label={
        state.isGuest
          ? 'Guest user — sign in to save your work'
          : `${state.name} — ${tierLabel(state.tier)} account — open dashboard`
      }
      title={
        state.isGuest
          ? 'Sign in to save your work'
          : `${state.name} · ${tierLabel(state.tier)} — Open dashboard`
      }
    >
      <span
        className="account-badge-avatar"
        style={{ background: avatarColor }}
        aria-hidden="true"
      >
        {initial}
      </span>
      <span className="account-badge-name">
        {state.isGuest ? 'Guest' : state.name}
      </span>
      <span
        className={`account-tier-pill ${tierClass(state.tier, state.isGuest)}`}
      >
        {state.isGuest ? 'Sign In' : tierLabel(state.tier)}
      </span>
    </a>
  )
}
