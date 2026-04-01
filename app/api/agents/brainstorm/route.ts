import { NextRequest, NextResponse } from 'next/server'
import { runTopicBrainstormer } from '@/lib/agents/ideation-flesher'

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await req.json()
    if (!brandId) return NextResponse.json({ error: 'Brand ID required' }, { status: 400 })

    const ideas = await runTopicBrainstormer(brandId)
    return NextResponse.json({ ideas })
  } catch (error) {
    console.error('Brainstorm Agent Error:', error)
    return NextResponse.json({ error: 'Agent failed to brainstorm' }, { status: 500 })
  }
}
