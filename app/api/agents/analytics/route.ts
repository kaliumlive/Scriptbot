export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { validateAgentRequest, agentUnauthorized } from '@/lib/utils/agent-guard'
import { runAnalytics } from '@/lib/agents/analytics'

export async function POST(request: NextRequest) {
  if (!validateAgentRequest(request)) return agentUnauthorized()
  const { brandId } = await request.json().catch(() => ({}))

  if (!brandId || typeof brandId !== 'string') {
    return Response.json({ error: 'brandId is required' }, { status: 400 })
  }

  try {
    const result = await runAnalytics(brandId)
    return Response.json({ status: 'ok', agent: 'analytics', ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analytics agent failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
