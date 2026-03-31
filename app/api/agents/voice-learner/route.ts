export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { validateAgentRequest, agentUnauthorized } from '@/lib/utils/agent-guard'
import { runVoiceLearner } from '@/lib/agents/voice-learner'
import { logAgentStart, logAgentComplete, logAgentError } from '@/lib/utils/agent-logger'

export async function POST(request: NextRequest) {
  if (!validateAgentRequest(request)) return agentUnauthorized()

  const body = await request.json().catch(() => ({}))
  const { brandId, youtubeUrls } = body as { brandId?: string; youtubeUrls?: string[] }

  if (!brandId || !Array.isArray(youtubeUrls) || !youtubeUrls.length) {
    return Response.json({ error: 'brandId and youtubeUrls[] are required' }, { status: 400 })
  }

  const startedAt = Date.now()
  const logId = await logAgentStart('voice-learner', brandId)

  try {
    const result = await runVoiceLearner({ brandId, youtubeUrls })
    await logAgentComplete(logId, startedAt, result.processed)
    return Response.json({ status: 'ok', agent: 'voice-learner', ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await logAgentError(logId, startedAt, message)
    return Response.json({ status: 'error', error: message }, { status: 500 })
  }
}
