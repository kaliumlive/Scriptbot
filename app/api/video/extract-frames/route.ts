import { NextRequest } from 'next/server'
import { extractFrames } from '@/lib/video/frame-extractor'

export async function POST(request: NextRequest) {
  const { brandId, videoUrl, count } = await request.json().catch(() => ({}))

  if (!brandId || typeof brandId !== 'string' || !videoUrl || typeof videoUrl !== 'string') {
    return Response.json({ error: 'brandId and videoUrl are required' }, { status: 400 })
  }

  try {
    const frames = await extractFrames(videoUrl, typeof count === 'number' ? count : 5, brandId)
    return Response.json({ status: 'ok', frames })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Frame extraction failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
