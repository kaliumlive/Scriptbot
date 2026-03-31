export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { validateAgentRequest, agentUnauthorized } from '@/lib/utils/agent-guard'
import { runTrendScout } from '@/lib/agents/trend-scout'
import { logAgentStart, logAgentComplete, logAgentError } from '@/lib/utils/agent-logger'

export async function POST(request: NextRequest) {
  if (!validateAgentRequest(request)) return agentUnauthorized()

  const body = await request.json().catch(() => ({}))
  const { brandId } = body as { brandId?: string }

  const startedAt = Date.now()
  const logId = await logAgentStart('trend-scout', brandId)

  try {
    const result = await runTrendScout(brandId)
    await logAgentComplete(logId, startedAt, result.reportsCreated)
    return Response.json({ status: 'ok', agent: 'trend-scout', ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await logAgentError(logId, startedAt, message)
    return Response.json({ status: 'error', error: message }, { status: 500 })
  }
}
