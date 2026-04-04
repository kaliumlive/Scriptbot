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
import { parseLLMJson } from '@/lib/utils'

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
  platforms: string[]
}, voiceProfile: BrandVoiceProfile | null, existingTitles: string[]): string {
  // Build rich experience context from voice profile
  const experienceLines: string[] = []
  if (voiceProfile?.worldview) experienceLines.push(`WORLDVIEW: ${voiceProfile.worldview}`)
  if (voiceProfile?.click_moment) experienceLines.push(`DEFINING MOMENT: ${voiceProfile.click_moment}`)
  if (voiceProfile?.unlearned) experienceLines.push(`UNLEARNED: ${voiceProfile.unlearned}`)
  if (voiceProfile?.building_toward) experienceLines.push(`BUILDING TOWARD: ${voiceProfile.building_toward}`)
  if (voiceProfile?.known_for) experienceLines.push(`KNOWN FOR: ${voiceProfile.known_for}`)
  if (voiceProfile?.unpopular_belief) experienceLines.push(`UNPOPULAR BELIEF: ${voiceProfile.unpopular_belief}`)
  if (voiceProfile?.hard_period) experienceLines.push(`HARD PERIOD: ${voiceProfile.hard_period}`)
  if (voiceProfile?.sacrifices) experienceLines.push(`HOW THEY OPERATE: ${voiceProfile.sacrifices}`)
  if (voiceProfile?.ideal_viewer) experienceLines.push(`IDEAL VIEWER: ${voiceProfile.ideal_viewer}`)
  if (voiceProfile?.desired_feeling) experienceLines.push(`DESIRED FEELING: ${voiceProfile.desired_feeling}`)

  const avoidTitles = existingTitles.length
    ? `\nALREADY COVERED (do not repeat these topics):\n${existingTitles.slice(0, 15).map(t => `- ${t}`).join('\n')}`
    : ''

  return `You are generating content ideas for a creator. Ideas MUST come from their lived experience and personal perspective — not generic advice or tutorials.

CREATOR: ${brand.name}
PLATFORMS: ${brand.platforms.join(', ')}

CREATOR CONTEXT:
${experienceLines.join('\n')}

STYLE:
${voiceProfile?.style_guide ? voiceProfile.style_guide.slice(0, 600) : voiceProfile?.natural_tone ?? ''}
${avoidTitles}

Generate exactly 7 content ideas. Each must be rooted in something the creator actually experienced, noticed, or has a real opinion on. No generic tips, no tutorials, no listicles about "X ways to improve your mix."

Good examples of the right direction:
- "Why I stopped listening to my mentors" (personal turning point)
- "The mix I almost deleted" (real story, specific moment)
- "What feedback from [artist] actually changed" (experience-based insight)
- "Why I apply Indian scales when Western ones 'work fine'" (honest perspective)

Bad examples (do NOT generate these):
- "5 tips for better mixing"
- "How to use a compressor"
- "Best free VSTs in 2025"
- "A day in the life of a music producer"

Return ONLY a JSON array, no markdown:
[
  {
    "title": "short punchy title",
    "concept": "1-2 sentences — what real experience or observation drives this",
    "hook": "first line that stops the scroll — specific, not generic",
    "story_structure_id": "one of: lesson|breakthrough|hot_take|comparison|day_in_life|behind_scenes|hero_journey|myth_busting|reaction",
    "target_platforms": ["instagram", "tiktok"],
    "content_type": "short_video",
    "auto_approve": true
  }
]

Rules:
- Every idea must be something only THIS creator could make — tied to their specific story
- content_type: short_video | carousel | thread | long_video | reel
- auto_approve true only when it clearly fits their voice and experience
- NEVER: ${voiceProfile?.never_do ?? 'generic tutorials, CTAs, motivational framing'}
`
}

export async function runIdeaGenerator(brandId?: string): Promise<{
  brandsProcessed: number
  ideasCreated: number
  error?: string
}> {
  const supabase = createAdminClient()

  // Get brands to process
  const q = supabase.from('brands').select('id, name, platforms')
  const { data: brands, error: brandsError } = brandId ? await q.eq('id', brandId) : await q

  if (brandsError || !brands?.length) {
    return { brandsProcessed: 0, ideasCreated: 0, error: brandsError?.message ?? 'No active brands found' }
  }

  let totalIdeas = 0

  for (const brand of brands) {
    try {
      // Get voice profile
      const { data: voiceProfile } = await supabase
        .from('brand_voice_profiles')
        .select('*')
        .eq('brand_id', brand.id)
        .single()

      // Get existing idea titles to avoid repetition
      const { data: existingIdeas } = await supabase
        .from('content_ideas')
        .select('title')
        .eq('brand_id', brand.id)
        .order('created_at', { ascending: false })
        .limit(30)

      const existingTitles = (existingIdeas ?? []).map((i: { title: string }) => i.title)

      const voiceSystemPrompt = voiceProfile
        ? buildVoiceSystemPrompt(voiceProfile as BrandVoiceProfile)
        : undefined

      const prompt = buildIdeaPrompt(
        {
          name: brand.name,
          platforms: (brand.platforms as string[]) ?? ['instagram', 'tiktok'],
        },
        voiceProfile as BrandVoiceProfile | null,
        existingTitles
      )

      const raw = await generateWithGroq(prompt, voiceSystemPrompt)

      // Parse ideas
      const ideas = parseLLMJson<GeneratedIdea[]>(raw)
      if (!Array.isArray(ideas) || ideas.length === 0) {
        console.error(`IdeaGenerator: Failed to parse ideas for brand ${brand.id}`, raw)
        continue
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
