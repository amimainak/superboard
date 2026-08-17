'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [timezone, setTimezone] = useState('')
  const [brandingColor, setBrandingColor] = useState('#059669')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      const { data: profile } = await (supabase as any)
        .from('User')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setName(profile.name || '')
        setBio(profile.bio || '')
        setTimezone(profile.timezone || '')
        setBrandingColor(profile.brandingColor || '#059669')
      }
      setLoading(false)
    }
    loadProfile()
  }, [router, supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          bio: bio.slice(0, 280),
          timezone,
          brandingColor,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Failed to save profile:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0f172a', color: '#94a3b8',
    }}>Loading...</div>
  )

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a', color: '#e2e8f0',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Profile Settings</h1>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Avatar placeholder */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: `linear-gradient(135deg, ${brandingColor}, #0891b2)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, color: '#fff',
            }}>
              {(name || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{name || 'Unnamed'}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Tutor Account</div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              Display Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0', fontSize: 14, outline: 'none',
              }}
            />
          </div>

          {/* Bio */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              Bio (max 280 chars)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              rows={3}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0', fontSize: 14, outline: 'none', resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ fontSize: 11, color: '#475569', marginTop: 4, textAlign: 'right' }}>
              {bio.length}/280
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              Timezone
            </label>
            <input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. Asia/Kolkata"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0', fontSize: 14, outline: 'none',
              }}
            />
          </div>

          {/* Branding Color */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
              Branding Color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="color"
                value={brandingColor}
                onChange={(e) => setBrandingColor(e.target.value)}
                style={{ width: 40, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#94a3b8' }}>{brandingColor}</span>
            </div>
          </div>

          {/* Save button */}
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 24px', borderRadius: 8,
              background: saved ? 'rgba(34,197,94,0.2)' : 'rgba(5,150,105,0.2)',
              border: saved ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(5,150,105,0.3)',
              color: saved ? '#4ade80' : '#34d399',
              fontSize: 14, fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            style={{
              padding: '10px 20px', borderRadius: 8,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#fca5a5', fontSize: 13, cursor: 'pointer',
              marginTop: 8,
            }}
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}