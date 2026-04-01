export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { validateAgentRequest, agentUnauthorized } from '@/lib/utils/agent-guard'
import { runPublisher } from '@/lib/agents/publisher'
import { logAgentStart, logAgentComplete, logAgentError } from '@/lib/utils/agent-logger'

export async function POST(request: NextRequest) {
  if (!validateAgentRequest(request)) return agentUnauthorized()
  
  const body = await request.json().catch(() => ({}))
  const { brandId } = body as { brandId?: string }

  const startedAt = Date.now()
  const logId = await logAgentStart('publisher', brandId)

  try {
    const result = await runPublisher(brandId)
    await logAgentComplete(logId, startedAt, result.publishedCount)
    return Response.json({ status: 'ok', agent: 'publisher', ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await logAgentError(logId, startedAt, message)
    return Response.json({ status: 'error', error: message }, { status: 500 })
  }
}
