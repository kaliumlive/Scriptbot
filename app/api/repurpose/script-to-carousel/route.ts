export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateWithGroq } from '@/lib/ai/groq'
import { buildVoiceSystemPrompt } from '@/lib/brand/voice'
import type { BrandVoiceProfile } from '@/lib/brand/voice'

interface Slide {
  title: string
  body: string
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { brandId, script } = body as { brandId?: string; script?: string }

  if (!brandId || !script?.trim()) {
    return Response.json({ error: 'brandId and script are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: brand } = await supabase.from('brands').select('*').eq('id', brandId).single()
  if (!brand) return Response.json({ error: 'Brand not found' }, { status: 404 })

  const { data: voiceProfile } = await supabase
    .from('brand_voice_profiles')
    .select('*')
    .eq('brand_id', brandId)
    .single()

  const systemPrompt = voiceProfile
    ? buildVoiceSystemPrompt(voiceProfile as BrandVoiceProfile)
    : `You are a content strategist writing carousel slides for a creator in the ${brand.niche} niche.`

  const prompt = `
You are converting a short-form video script into a carousel post (Instagram/TikTok swipe).

SCRIPT:
"""
${script.trim()}
"""

TASK:
Break this script into 5–8 carousel slides. Each slide is a single idea — one thought, one punchy line, one beat.

Rules:
- Slide 1 = the hook. Must make someone stop and swipe. Not a title, not a summary — a statement that creates curiosity or tension.
- Middle slides = the value. Each slide contains ONE insight, moment, or turn from the script. Short and punchy.
- Last slide = the payoff or conclusion. The earned release. No CTA, no "follow me", no "smash the like button".
- Write in the exact voice of the script. Don't soften it, don't make it generic.
- Slide titles: short, 2–6 words, punchy. Not a bullet headline.
- Slide body: 1–3 short sentences max. Each sentence on its own line if it reads better that way.
- No filler transitions like "so basically", "at the end of the day", "let that sink in".
- Never add hashtags.

Return ONLY valid JSON — no markdown, no explanation:
{
  "title": "short post title for internal reference",
  "slides": [
    { "title": "...", "body": "..." },
    ...
  ]
}
`

  let raw: string
  try {
    raw = await generateWithGroq(prompt, systemPrompt)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: msg }, { status: 500 })
  }

  // Parse JSON — strip markdown fences if present
  const jsonStr = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  let parsed: { title: string; slides: Slide[] }
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    return Response.json({ error: 'Agent returned invalid JSON', raw }, { status: 500 })
  }

  const slides = (parsed.slides || []).map((s: Slide) => ({
    title: s.title ?? '',
    content: s.body ?? '',
  }))

  if (slides.length === 0) {
    return Response.json({ error: 'No slides generated' }, { status: 500 })
  }

  // Save as a content draft
  const { data: draft, error: insertError } = await supabase
    .from('content_drafts')
    .insert({
      brand_id: brandId,
      title: parsed.title || 'Script → Carousel',
      content_type: 'carousel',
      status: 'draft',
      script: script.trim(),
      carousel_slides: slides,
    })
    .select('id, title, carousel_slides, created_at, status, brand_id')
    .single()

  if (insertError || !draft) {
    return Response.json({ error: insertError?.message || 'Failed to save draft' }, { status: 500 })
  }

  return Response.json({ draft })
}
