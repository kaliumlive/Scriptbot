export const dynamic = 'force-dynamic'
import { NextRequest } from 'next/server'
import { validateAgentRequest, agentUnauthorized } from '@/lib/utils/agent-guard'
import { createClient } from '@/lib/supabase/server'
import { downloadAndExtractVideo } from '@/lib/video/extractor'
import { tagFramesWithVision } from '@/lib/agents/vision-tagger'
import fs from 'fs'

export async function POST(request: NextRequest) {
  if (!validateAgentRequest(request)) return agentUnauthorized()

  const { jobId, videoUrl, bRollNotes } = await request.json()

  if (!jobId || !videoUrl || !bRollNotes) {
    return Response.json({ error: 'Missing jobId, videoUrl, or bRollNotes' }, { status: 400 })
  }

  const supabase = await createClient()

  // We immediately return a 200 to acknowledge the agent has started.
  // The actual heavy lifting is fired asynchronously.
  async function runRepurposeJob() {
    try {
      await supabase.from('video_repurpose_jobs').update({ status: 'extracting_frames' }).eq('id', jobId)

      // 1. Download & Extract
      const extraction = await downloadAndExtractVideo(videoUrl, 0.5) // Every 2 sec

      await supabase.from('video_repurpose_jobs').update({ status: 'analyzing_frames' }).eq('id', jobId)

      // 2. Tag with Vision
      const taggedMoments = await tagFramesWithVision(extraction, bRollNotes)

      // 3. Save outcomes
      await supabase.from('video_repurpose_jobs').update({ 
        status: 'completed',
        key_moments: taggedMoments 
      }).eq('id', jobId)

      // Cleanup tmp
      fs.rmSync(extraction.framesDir, { recursive: true, force: true })

    } catch (error) {
      console.error('Video Repurposer Job failed:', error)
      await supabase.from('video_repurpose_jobs').update({ 
        status: 'failed',
        error_message: String(error)
      }).eq('id', jobId)
    }
  }

  // Fire and forget
  runRepurposeJob()

  return Response.json({ status: 'processing', agent: 'video-repurposer', jobId })
}
