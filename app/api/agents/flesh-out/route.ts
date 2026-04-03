import { NextResponse } from 'next/server'
import { runIdeationFlesher } from '@/lib/agents/ideation-flesher'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const brandId = body?.brandId
    const topic = body?.topic

    if (!brandId || !topic) {
      return NextResponse.json({ error: 'Missing brandId or topic' }, { status: 400 })
    }

    const result = await runIdeationFlesher(brandId, topic)

    return NextResponse.json(result)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in Ideation Flesher API:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
