'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { WaitingRoom } from '@/components/room/widgets'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const sbAny = (sb: any) => sb as any

export default function WaitingRoomPage() {
  const params = useParams()
  const roomId = params.roomId as string
  const [subject, setSubject] = useState('Session')
  const [tutorName, setTutorName] = useState<string | null>(null)
  const [brandingLogo, setBrandingLogo] = useState<string | null>(null)
  const [brandingColor, setBrandingColor] = useState<string | null>(null)

  useEffect(() => {
    const loadRoom = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data } = await sbAny(supabase)
        .from('Room')
        .select('subject, tutorId, brandingLogo, brandingColor')
        .eq('id', roomId)
        .single()

      if (data) {
        setSubject(data.subject || 'Session')
        setBrandingLogo(data.brandingLogo)
        setBrandingColor(data.brandingColor)

        // Fetch tutor name
        if (data.tutorId) {
          const { data: tutor } = await sbAny(supabase)
            .from('User')
            .select('name, email')
            .eq('id', data.tutorId)
            .single()
          if (tutor) {
            setTutorName(tutor.name || tutor.email?.split('@')[0] || null)
          }
        }
      }
    }
    loadRoom()
  }, [roomId])

  return (
    <WaitingRoom
      roomId={roomId}
      roomSubject={subject}
      tutorName={tutorName}
      brandingLogo={brandingLogo}
      brandingColor={brandingColor}
    />
  )
}