import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Lazy-initialised Supabase browser client.
 * Safe to import during SSR / build — the client is only created
 * when this function is first *called* in the browser.
 */
export function getSupabaseBrowserClient() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      // During build / SSR with missing env vars, return a stub that
      // throws only when actually used (not at module-eval time).
      throw new Error(
        'Supabase environment variables are missing. ' +
        'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
      )
    }
    _client = createBrowserClient<Database>(url, key)
  }
  return _client
}
