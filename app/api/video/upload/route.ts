export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAgentStart, logAgentComplete, logAgentError } from '@/lib/utils/agent-logger'

interface UploadPayload {
  brandId?: string
  videoUrl?: string
  bRollNotes?: string[]
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as UploadPayload
  const brandId = body.brandId?.trim()
  const videoUrl = body.videoUrl?.trim()
  const bRollNotes = Array.isArray(body.bRollNotes)
    ? body.bRollNotes.map((note) => note.trim()).filter(Boolean)
    : []

  if (!brandId || !videoUrl) {
    return Response.json({ error: 'brandId and videoUrl are required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id')
    .eq('id', brandId)
    .single()

  if (brandError || !brand) {
    return Response.json({ error: 'Brand not found' }, { status: 404 })
  }

  const { data: job, error: jobError } = await supabase
    .from('video_repurpose_jobs')
    .insert({
      brand_id: brandId,
      source_type: 'url',
      source_url: videoUrl,
      status: 'pending',
    })
    .select('id')
    .single()

  if (jobError || !job) {
    return Response.json({ error: jobError?.message || 'Failed to create job' }, { status: 500 })
  }

  const logId = await logAgentStart('video-repurposer', brandId)
  const startedAt = Date.now()
  void (async () => {
    try {
      const { runVideoRepurposer } = await import('@/lib/agents/video-repurposer')
      await runVideoRepurposer(brandId, job.id)
      await logAgentComplete(logId, startedAt, 1)
    } catch (error) {
      await logAgentError(logId, startedAt, error instanceof Error ? error.message : String(error))
      await supabase
        .from('video_repurpose_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : String(error),
        })
        .eq('id', job.id)
    }
  })()

  return Response.json({
    status: 'processing',
    jobId: job.id,
    queuedNotes: bRollNotes.length,
  })
}
