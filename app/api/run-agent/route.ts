export const dynamic = 'force-dynamic'
/**
 * UI-facing agent trigger endpoint.
 * Uses direct server execution so the dashboard can trigger agents without
 * pulling heavy agent dependencies into unrelated requests.
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAgentStart, logAgentComplete, logAgentError } from '@/lib/utils/agent-logger'

type AgentResult = Record<string, unknown>
type AgentExtra = Record<string, unknown>
type AgentRunner = (brandId: string, extra: AgentExtra) => Promise<AgentResult>

const AGENT_RUNNERS: Record<string, AgentRunner> = {
  pipeline: async (brandId) => {
    const { runPipeline } = await import('@/lib/agents/pipeline')
    return runPipeline(brandId)
  },
  'voice-learner': async (brandId, extra) => {
    const { runVoiceLearner } = await import('@/lib/agents/voice-learner')
    return runVoiceLearner({ brandId, youtubeUrls: (extra.youtubeUrls as string[]) ?? [] })
  },
  'idea-generator': async (brandId) => {
    const { runIdeaGenerator } = await import('@/lib/agents/idea-generator')
    return runIdeaGenerator(brandId)
  },
  'content-writer': async (brandId) => {
    const { runContentWriter } = await import('@/lib/agents/content-writer')
    return runContentWriter(brandId)
  },
  'trend-scout': async (brandId) => {
    const { runTrendScout } = await import('@/lib/agents/trend-scout')
    return runTrendScout(brandId)
  },
  'video-repurposer': async (brandId, extra) => {
    const { runVideoRepurposer } = await import('@/lib/agents/video-repurposer')
    const jobId = typeof extra.jobId === 'string' ? extra.jobId : ''
    if (!jobId) throw new Error('jobId is required for video repurposer')
    return runVideoRepurposer(brandId, jobId)
  },
  scheduler: async (brandId) => {
    const { runScheduler } = await import('@/lib/agents/scheduler')
    return runScheduler(brandId)
  },
  publisher: async (brandId) => {
    const { runPublisher } = await import('@/lib/agents/publisher')
    return runPublisher(brandId)
  },
  analytics: async (brandId) => {
    const { runAnalytics } = await import('@/lib/agents/analytics')
    return runAnalytics(brandId)
  },
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

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

  if (session?.user?.id) {
    const { data: ownedBrand, error } = await supabase
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .eq('user_id', session.user.id)
      .single()

    if (error || !ownedBrand) {
      return Response.json({ error: 'Brand not found for this user' }, { status: 403 })
    }
  } else {
    const admin = createAdminClient()
    const { data: brandExists, error } = await admin
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .single()

    if (error || !brandExists) {
      return Response.json({ error: 'Brand not found' }, { status: 404 })
    }
  }

  const startedAt = Date.now()
  const logId = await logAgentStart(agent, brandId)

  try {
    const runner = AGENT_RUNNERS[agent]
    const result = (await runner(brandId, extra)) as Record<string, unknown>
    const items = 'processed' in result ? Number(result.processed) :
      'ideasCreated' in result ? Number(result.ideasCreated) :
        'draftsCreated' in result ? Number(result.draftsCreated) :
          'reportsCreated' in result ? Number(result.reportsCreated) : 
            'publishedCount' in result ? Number(result.publishedCount) : 
              agent === 'pipeline' ? 1 : 0
    
    await logAgentComplete(logId, startedAt, items)
    return Response.json({ status: 'ok', agent, ...result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    await logAgentError(logId, startedAt, message)
    return Response.json({ status: 'error', error: message }, { status: 500 })
  }
}
