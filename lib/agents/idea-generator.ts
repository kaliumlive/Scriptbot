/**
 * Idea Generator Agent
 *
 * Reads the latest trend reports for each active brand, combines them with
 * the brand's voice profile, and uses Groq to generate 5-10 content ideas.
 * Auto-approves ideas that fit the brand's voice well.
 *
 * GitHub Actions trigger: daily 6AM UTC
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { generateWithGroq } from '@/lib/ai/groq'
import { buildVoiceSystemPrompt } from '@/lib/brand/voice'
import type { BrandVoiceProfile } from '@/lib/brand/voice'

interface TrendReport {
  id: string
  platform: string
  niche: string
  trends: TrendItem[]
}

interface TrendItem {
  topic: string
  angle?: string
  format?: string
  why_trending?: string
}

interface GeneratedIdea {
  title: string
  concept: string
  hook: string
  story_structure_id: string
  target_platforms: string[]
  content_type: string
  auto_approve: boolean
}

function buildIdeaPrompt(brand: {
  name: string
  niche: string
  platforms: string[]
}, trendReports: TrendReport[], voiceProfile: BrandVoiceProfile | null): string {
  const trendsText = trendReports.length
    ? trendReports.map(r =>
        `[${r.platform.toUpperCase()}] ${r.trends.slice(0, 3).map(t => `"${t.topic}"${t.angle ? ' — ' + t.angle : ''}`).join(' | ')}`
      ).join('\n')
    : 'No trend data available — generate evergreen ideas based on the niche.'

  const voiceContext = voiceProfile?.style_guide
    ? `\nCREATOR VOICE:\n${voiceProfile.style_guide.slice(0, 500)}`
    : voiceProfile?.natural_tone
      ? `\nCREATOR VOICE: ${voiceProfile.natural_tone}`
      : ''

  return `You are a content strategist generating ideas for a social media creator.

BRAND: ${brand.name}
NICHE: ${brand.niche}
PLATFORMS: ${brand.platforms.join(', ')}${voiceContext}

CURRENT TRENDS:
${trendsText}

Generate exactly 7 content ideas. Each idea should ride a trend OR be evergreen wisdom for the niche. Vary the content types (short_video, carousel, thread, long_video).

Return ONLY a JSON array, no markdown:
[
  {
    "title": "short punchy title",
    "concept": "1-2 sentence description of what the content covers",
    "hook": "the first line/sentence that stops the scroll",
    "story_structure_id": "one of: lesson|breakthrough|hot_take|comparison|day_in_life|behind_scenes|hero_journey|myth_busting|reaction|tutorial",
    "target_platforms": ["instagram", "tiktok"],
    "content_type": "short_video",
    "auto_approve": true
  }
]

Rules:
- hook must be specific and attention-grabbing, not generic
- content_type: short_video | carousel | thread | long_video | reel
- auto_approve: true for ideas that clearly fit the brand voice, false for experimental ones
- Do NOT include ideas the creator has flagged as off-limits${voiceProfile?.never_do ? ': ' + voiceProfile.never_do : ''}
`
}

export async function runIdeaGenerator(brandId?: string): Promise<{
  brandsProcessed: number
  ideasCreated: number
  error?: string
}> {
  const supabase = createAdminClient()

  // Get brands to process
  const q = supabase.from('brands').select('id, name, niche, platforms')
  const { data: brands, error: brandsError } = brandId ? await q.eq('id', brandId) : await q

  if (brandsError || !brands?.length) {
    return { brandsProcessed: 0, ideasCreated: 0, error: brandsError?.message ?? 'No active brands found' }
  }

  let totalIdeas = 0

  for (const brand of brands) {
    try {
      // Get latest trend reports (last 24h)
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: trendReports } = await supabase
        .from('trend_reports')
        .select('id, platform, niche, trends')
        .eq('brand_id', brand.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5)

      // Get voice profile
      const { data: voiceProfile } = await supabase
        .from('brand_voice_profiles')
        .select('*')
        .eq('brand_id', brand.id)
        .single()

      const voiceSystemPrompt = voiceProfile
        ? buildVoiceSystemPrompt(voiceProfile as BrandVoiceProfile)
        : undefined

      const prompt = buildIdeaPrompt(
        {
          name: brand.name,
          niche: brand.niche ?? 'music production',
          platforms: (brand.platforms as string[]) ?? ['instagram', 'tiktok'],
        },
        (trendReports ?? []) as TrendReport[],
        voiceProfile as BrandVoiceProfile | null
      )

      const raw = await generateWithGroq(prompt, voiceSystemPrompt)

      // Parse ideas
      let ideas: GeneratedIdea[]
      try {
        const clean = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
        ideas = JSON.parse(clean)
      } catch {
        const match = raw.match(/\[[\s\S]*\]/)
        if (!match) { console.error(`IdeaGenerator: failed to parse ideas for brand ${brand.id}`); continue }
        ideas = JSON.parse(match[0])
      }

      // Insert ideas
      const rows = ideas.map(idea => ({
        brand_id: brand.id,
        title: idea.title,
        concept: idea.concept,
        hook: idea.hook,
        story_structure_id: idea.story_structure_id,
        target_platforms: idea.target_platforms,
        content_type: idea.content_type,
        status: idea.auto_approve ? 'approved' : 'idea',
        source: 'ai',
      }))

      const { data: inserted } = await supabase.from('content_ideas').insert(rows).select('id')
      totalIdeas += inserted?.length ?? 0
    } catch (err) {
      console.error(`IdeaGenerator: error for brand ${brand.id}:`, err)
    }
  }

  return { brandsProcessed: brands.length, ideasCreated: totalIdeas }
}
