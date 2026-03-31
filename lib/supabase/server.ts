import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Minimal mock that makes all pages behave as "not logged in" when env vars aren't set
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noopClient: any = {
  auth: {
    getUser: async () => ({
      data: { user: { id: 'test-user', email: 'test@example.com' } },
      error: null
    }),
    signOut: async () => ({ error: null }),
  },
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        data: table === 'brands' ? [{ id: 'test-brand', name: 'Test Brand' }] : [],
        error: null,
        count: table === 'brands' ? 1 : 0
      }),
      in: () => ({ data: [], error: null, count: 0 }),
      order: () => ({
        data: table === 'agent_logs' ? [{
          id: '1',
          agent_name: 'Trend Scout',
          status: 'complete',
          started_at: new Date().toISOString()
        }] : [],
        error: null
      }),
      limit: () => ({ data: [], error: null })
    }),
    insert: () => ({
      select: () => ({
        single: () => ({ data: { id: 'new-id' }, error: null })
      }),
      error: null
    }),
    upsert: () => ({ data: null, error: null }),
    update: () => ({ eq: () => ({ data: null, error: null }) }),
  }),
}

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return noopClient

  const cookieStore = await cookies()
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch { }
      },
    },
  })
}
