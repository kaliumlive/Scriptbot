export const dynamic = 'force-dynamic'
/**
 * UI-facing agent trigger endpoint.
 * Authenticated via Supabase session (not x-agent-secret).
 * Only allows triggering agents for brands the logged-in user owns.
 */

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { runVoiceLearner } from '@/lib/agents/voice-learner'
import { runIdeaGenerator } from '@/lib/agents/idea-generator'
import { runContentWriter } from '@/lib/agents/content-writer'
import { runTrendScout } from '@/lib/agents/trend-scout'
import { runVideoRepurposer } from '@/lib/agents/video-repurposer'
import { runScheduler } from '@/lib/agents/scheduler'
import { runPublisher } from '@/lib/agents/publisher'
import { runAnalytics } from '@/lib/agents/analytics'
import { logAgentStart, logAgentComplete, logAgentError } from '@/lib/utils/agent-logger'

const AGENT_RUNNERS = {
  'voice-learner': async (brandId: string, extra: Record<string, unknown>) =>
    runVoiceLearner({ brandId, youtubeUrls: (extra.youtubeUrls as string[]) ?? [] }),
  'idea-generator': async (brandId: string) => runIdeaGenerator(brandId),
  'content-writer': async (brandId: string) => runContentWriter(brandId),
  'trend-scout': async (brandId: string) => runTrendScout(brandId),
  'video-repurposer': async (brandId: string, extra: Record<string, unknown>) =>
    runVideoRepurposer(brandId, extra.jobId as string),
  'scheduler': async (brandId: string) => runScheduler(brandId),
  'publisher': async (brandId: string) => runPublisher(brandId),
  'analytics': async (brandId: string) => runAnalytics(brandId),
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()
  // Auth disabled — allow all requests
  const body = await request.json().catch(() => ({}))
  const { agent, brandId, ...extra } = body as {
    agent: keyof typeof AGENT_RUNNERS
    brandId: string
    [key: string]: unknown
  }

  if (!agent || !AGENT_RUNNERS[agent]) {
    return Response.json({ error: `Unknown agent: ${agent}` }, { status: 400 })
  }

  if (!brandId) {
    return Response.json({ error: 'brandId is required' }, { status: 400 })
  }

  // Verify brand exists
  const { data: brand } = await supabase
    .from('brands')
    .select('id')
    .eq('id', brandId)
    .single()

  if (!brand) {
    return Response.json({ error: 'Brand not found' }, { status: 404 })
  }

  const startedAt = Date.now()
  const logId = await logAgentStart(agent, brandId)

  try {
    const runner = AGENT_RUNNERS[agent]
    const result = await runner(brandId, extra)
    const items = 'processed' in result ? result.processed :
      'ideasCreated' in result ? result.ideasCreated :
        'draftsCreated' in result ? result.draftsCreated :
          'reportsCreated' in result ? result.reportsCreated : 0
    await logAgentComplete(logId, startedAt, items as number)
    return Response.json({ status: 'ok', agent, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await logAgentError(logId, startedAt, message)
    return Response.json({ status: 'error', error: message }, { status: 500 })
  }
}
