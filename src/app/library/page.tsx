// ============================================================
// /library — Board Library page (private to tutor)
// ============================================================
import { createClient } from '@/lib/supabase/server'
import { BoardLibrary } from '@/components/library/BoardLibrary'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirect=/library')

  // Detect dark mode from cookie
  const isDark = false // Server-side default; client will adjust

  return <BoardLibrary isDark={isDark} />
}
