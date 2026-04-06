/**
 * Idea Generator Agent
 *
 * Generates FAN-ATTRACTING content ideas — not tutorial content.
 *
 * THE CORE DISTINCTION:
 *   Fan content  → makes someone want to follow THIS person (opinions, stories, worldview)
 *   Tutorial content → teaches skills (attracts students who follow the TOPIC, not the person)
 *
 * Every idea must be rooted in something the creator actually experienced, believes, or
 * has a specific, earned perspective on. If a random stranger could make the same video,
 * it's the wrong idea.
 *
 * GitHub Actions trigger: daily 6AM UTC
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { generateWithGroq } from '@/lib/ai/groq'
import { buildVoiceSystemPrompt } from '@/lib/brand/voice'
import type { BrandVoiceProfile } from '@/lib/brand/voice'
import { buildKnowledgeInjection, buildContentPillarsInjection } from '@/lib/brand/knowledge'
import { parseLLMJson } from '@/lib/utils'

interface GeneratedIdea {
  title: string
  concept: string
  hook: string
  story_structure_id: string
  target_platforms: string[]
  content_type: string
  idea_type: 'fan_content' | 'tutorial_content' // used to filter out tutorials
}

function buildIdeaPrompt(
  brand: { name: string; platforms: string[] },
  voiceProfile: BrandVoiceProfile | null,
  recentConversations: string[],
  existingTitles: string[],
  contentPillars: string[],
  offLimitsTopics: string,
  examplePosts: string[]
): string {
  // Build creator identity context
  const identityLines: string[] = []
  if (voiceProfile?.worldview) identityLines.push(`WORLDVIEW: ${voiceProfile.worldview}`)
  if (voiceProfile?.click_moment) identityLines.push(`DEFINING MOMENT: ${voiceProfile.click_moment}`)
  if (voiceProfile?.unlearned) identityLines.push(`SOMETHING THEY UNLEARNED: ${voiceProfile.unlearned}`)
  if (voiceProfile?.unpopular_belief) identityLines.push(`UNPOPULAR BELIEF: ${voiceProfile.unpopular_belief}`)
  if (voiceProfile?.hard_period) identityLines.push(`HARD PERIOD: ${voiceProfile.hard_period}`)
  if (voiceProfile?.known_for) identityLines.push(`KNOWN FOR: ${voiceProfile.known_for}`)
  if (voiceProfile?.building_toward) identityLines.push(`BUILDING TOWARD: ${voiceProfile.building_toward}`)
  if (voiceProfile?.ideal_viewer) identityLines.push(`IDEAL FAN: ${voiceProfile.ideal_viewer}`)
  if (voiceProfile?.desired_feeling) identityLines.push(`DESIRED FEELING: ${voiceProfile.desired_feeling}`)
  if (voiceProfile?.sacrifices) identityLines.push(`HOW THEY OPERATE: ${voiceProfile.sacrifices}`)

  const avoidTitles = existingTitles.length
    ? `\nALREADY COVERED — do NOT repeat these:\n${existingTitles.slice(0, 20).map(t => `- ${t}`).join('\n')}`
    : ''

  const conversationsContext = recentConversations.length
    ? `\nCURRENT CONVERSATIONS in their space (use as inspiration for the creator's personal angle — do NOT just make content about the trend itself):\n${recentConversations.map(c => `- ${c}`).join('\n')}`
    : ''

  const pillarsContext = buildContentPillarsInjection(contentPillars, offLimitsTopics, examplePosts)
  const knowledgeContext = buildKnowledgeInjection(false)

  return `You are generating content ideas for a creator who wants to build FANS, not a student base.

CREATOR: ${brand.name}
PLATFORMS: ${brand.platforms.join(', ')}

CREATOR IDENTITY:
${identityLines.length >= 2 ? identityLines.join('\n') : `Niche creator building a personal brand. Generate ideas rooted in personal experience, strong opinions, and honest perspective — not educational content.`}
${pillarsContext ? `\n${pillarsContext}` : ''}
${conversationsContext}
${avoidTitles}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT CRAFT RULES (apply to every idea):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${knowledgeContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE MOST IMPORTANT RULE — READ CAREFULLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FAN CONTENT (generate ONLY these):
→ Makes someone want to follow THIS specific person
→ Based on: personal stories, strong opinions, worldview, earned perspective, vulnerable moments
→ Test: "Could a random person in this niche make the exact same video?" If YES, it's wrong.
→ Examples:
   - "Why I almost quit after [specific moment]" — personal story
   - "My honest take on [contested thing in the space]" — opinion
   - "The belief I held for 3 years that was completely wrong" — worldview shift
   - "Why I rejected [common advice everyone follows]" — earned contrarian view
   - "What [specific experience] taught me about [bigger truth]" — insight from story

TUTORIAL CONTENT (NEVER generate these — these attract students, not fans):
→ "How to [skill]", "X tips for [result]", "Best [tools/plugins/gear]"
→ "A day in the life" (format, not a conversation)
→ Any advice a Wikipedia article could give
→ Content where the creator's identity is irrelevant
→ Examples of what NOT to generate:
   ✗ "5 mixing tips for beginners"
   ✗ "How to use reverb correctly"
   ✗ "Best free VSTs in 2025"
   ✗ "How I built my studio setup"
   ✗ "What I use to make beats"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate exactly 8 content ideas. Spread across these TYPES:
- 3× opinion/hot take ideas (creator's specific, polarizing beliefs)
- 2× personal story ideas (specific moments from their life/journey)
- 2× worldview/perspective ideas (how they see the world differently)
- 1× cultural commentary idea (their take on something happening in their space)

Return ONLY a JSON array, no markdown:
[
  {
    "title": "punchy, specific title — not generic",
    "concept": "1-2 sentences — what real experience, belief, or observation drives this. Be specific.",
    "hook": "the exact first line that stops the scroll — specific and tied to this creator's story, not a generic setup",
    "story_structure_id": "one of: lesson|breakthrough|hot_take|comparison|behind_scenes|hero_journey|myth_busting|confession|reaction",
    "target_platforms": ["instagram", "tiktok"],
    "content_type": "short_video | reel | carousel | thread | long_video",
    "idea_type": "fan_content"
  }
]

Rules:
- Every idea must pass the test: "Only THIS creator can make this video — no one else"
- Every hook must be specific and story-grounded, not a question or generic promise
- idea_type must ALWAYS be "fan_content" — if you generate tutorial content, you've failed the task
- NEVER generate: ${voiceProfile?.never_do ?? 'tutorials, how-to lists, gear reviews, generic motivational content'}
- Natural tone: ${voiceProfile?.natural_tone ?? 'direct, confident, specific'}
`
}

export async function runIdeaGenerator(brandId?: string): Promise<{
  brandsProcessed: number
  ideasCreated: number
  error?: string
}> {
  const supabase = createAdminClient()

  const q = supabase.from('brands').select('id, name, platforms, content_pillars, off_limits_topics, example_posts')
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

      // Get recent trend conversations to use as context (not as topics to copy)
      // Use creator_angle and content_opportunity — the personal-angle fields from new trend scout
      const { data: recentTrends } = await supabase
        .from('trend_reports')
        .select('trends')
        .eq('brand_id', brand.id)
        .order('report_date', { ascending: false })
        .limit(3)

      const recentConversations: string[] = []
      for (const report of recentTrends ?? []) {
        const trends = report.trends as Array<{
          conversation?: string
          creator_angle?: string
          content_opportunity?: string
          // legacy fields from old trend scout
          topic?: string
          angle?: string
        }>
        if (!Array.isArray(trends)) continue
        for (const t of trends.slice(0, 2)) {
          // New trend scout format
          if (t.conversation) {
            recentConversations.push(t.content_opportunity ?? t.creator_angle ?? t.conversation)
          } else if (t.topic) {
            // Legacy format — skip generic tutorial topics
            const topic = t.topic.toLowerCase()
            const isTutorial = ['how to', 'tips', 'guide', 'beginner', 'best plugins', 'tools', 'gear', 'setup', 'improve your'].some(s => topic.includes(s))
            if (!isTutorial) {
              recentConversations.push(t.angle ?? t.topic)
            }
          }
        }
      }

      const voiceSystemPrompt = voiceProfile
        ? buildVoiceSystemPrompt(voiceProfile as BrandVoiceProfile)
        : undefined

      const contentPillars = (brand.content_pillars as string[]) ?? []
      const offLimitsTopics = (brand.off_limits_topics as string) ?? ''
      const examplePosts = (brand.example_posts as string[]) ?? []

      const prompt = buildIdeaPrompt(
        {
          name: brand.name,
          platforms: (brand.platforms as string[]) ?? ['instagram', 'tiktok'],
        },
        voiceProfile as BrandVoiceProfile | null,
        recentConversations,
        existingTitles,
        contentPillars,
        offLimitsTopics,
        examplePosts
      )

      const raw = await generateWithGroq(prompt, voiceSystemPrompt)
      const ideas = parseLLMJson<GeneratedIdea[]>(raw)

      if (!Array.isArray(ideas) || ideas.length === 0) {
        console.error(`IdeaGenerator: Failed to parse ideas for brand ${brand.id}`, raw)
        continue
      }

      // Hard filter: reject anything that slipped through as tutorial content
      const fanIdeas = ideas.filter(idea => {
        if (idea.idea_type === 'tutorial_content') return false
        const title = idea.title.toLowerCase()
        const isTutorial = ['how to ', 'tips for', 'best ', 'top ', 'guide to', 'tutorial', 'improve your', 'learn how'].some(s => title.startsWith(s) || title.includes(s))
        return !isTutorial
      })

      if (fanIdeas.length === 0) {
        console.warn(`IdeaGenerator: All ideas filtered as tutorials for brand ${brand.id}. Skipping batch.`)
        continue
      }

      const rows = fanIdeas.map(idea => ({
        brand_id: brand.id,
        title: idea.title,
        concept: idea.concept,
        hook: idea.hook,
        story_structure_id: idea.story_structure_id,
        target_platforms: idea.target_platforms,
        content_type: idea.content_type,
        // Ideas always start as 'idea' — user approves manually or via Generate Script flow
        status: 'idea',
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
