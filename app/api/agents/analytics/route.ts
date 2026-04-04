export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { validateAgentRequest, agentUnauthorized } from '@/lib/utils/agent-guard'
import { runAnalytics } from '@/lib/agents/analytics'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  if (!validateAgentRequest(request)) return agentUnauthorized()
  const body = await request.json().catch(() => ({}))
  const { brandId } = body as { brandId?: string }

  try {
    if (brandId && typeof brandId === 'string') {
      const result = await runAnalytics(brandId)
      return Response.json({ status: 'ok', agent: 'analytics', brandsProcessed: 1, ...result })
    }

    // No brandId — run for all brands (scheduler mode)
    const supabase = createAdminClient()
    const { data: brands } = await supabase.from('brands').select('id')
    if (!brands?.length) return Response.json({ status: 'ok', agent: 'analytics', brandsProcessed: 0 })

    for (const brand of brands) {
      await runAnalytics(brand.id)
    }
    return Response.json({ status: 'ok', agent: 'analytics', brandsProcessed: brands.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analytics agent failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
