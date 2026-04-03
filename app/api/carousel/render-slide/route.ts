import { NextRequest } from 'next/server'
import { renderSlides } from '@/lib/carousel/renderer'

export async function POST(request: NextRequest) {
  const { brandId, slides } = await request.json().catch(() => ({}))

  if (!brandId || typeof brandId !== 'string' || !Array.isArray(slides) || slides.length === 0) {
    return Response.json({ error: 'brandId and slides are required' }, { status: 400 })
  }

  try {
    const imageUrls = await renderSlides(slides, brandId)
    return Response.json({ status: 'ok', imageUrls })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Slide rendering failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
