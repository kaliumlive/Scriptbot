import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Fallback placeholders allow build to succeed without env vars — auth will correctly fail at runtime without real keys
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  )
}
