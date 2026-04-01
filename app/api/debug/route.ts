export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = createAdminClient()
  const tables = ['brands', 'brand_voice_profiles', 'trend_reports', 'content_ideas', 'content_drafts', 'agent_logs', 'scheduled_posts', 'published_posts', 'platform_connections']
  const results: Record<string, unknown> = {}
  for (const table of tables) {
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true })
    results[table] = error ? `ERROR: ${error.message}` : count
  }
  return Response.json(results)
}
