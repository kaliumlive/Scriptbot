/**
 * Content Writer Agent
 *
 * Picks up all approved content ideas, writes full scripts/captions in the
 * creator's voice using their voice profile + hook database + story structures,
 * and inserts content_drafts rows.
 *
 * GitHub Actions trigger: daily 8AM UTC (after Idea Generator)
 */

import { createClient } from '@/lib/supabase/server'
import { generateWithGroq } from '@/lib/ai/groq'
import { buildVoiceSystemPrompt } from '@/lib/brand/voice'
import type { BrandVoiceProfile } from '@/lib/brand/voice'
import { HOOK_DATABASE } from '@/lib/hooks/database'
import { STORY_STRUCTURES } from '@/lib/storytelling/structures'

interface ContentIdea {
  id: string
  brand_id: string
  title: string
  concept: string
  hook: string
  story_structure_id: string
  target_platforms: string[]
  content_type: string
}

function pickHookTemplate(contentType: string, storyStructureId: string): string {
  const candidates = HOOK_DATABASE.filter(t =>
    t.mass_appeal ||
    t.category === 'burning-question' ||
    t.category === 'pain-point'
  )
  const template = candidates[Math.floor(Math.random() * candidates.length)] ?? HOOK_DATABASE[0]
  return template.template
}

function getStoryStructure(id: string) {
  return STORY_STRUCTURES.find(s => s.id === id) ?? STORY_STRUCTURES[0]
}

function buildWritingPrompt(idea: ContentIdea, hookTemplate: string, voiceProfile: BrandVoiceProfile | null): string {
  const structure = getStoryStructure(idea.story_structure_id)
  const platforms = idea.target_platforms ?? ['instagram', 'tiktok']
  const isShortForm = ['short_video', 'reel'].includes(idea.content_type)
  const isCarousel = idea.content_type === 'carousel'
  const isThread = idea.content_type === 'thread'

  const platformInstructions = platforms.map(p => {
    if (p === 'twitter' || p === 'x') return '- Twitter/X: thread of 4-6 tweets, first tweet is the hook'
    if (p === 'linkedin') return '- LinkedIn: professional framing, 3-4 paragraphs, story-driven'
    if (p === 'instagram') return '- Instagram: hook + value + soft CTA in caption'
    if (p === 'tiktok') return '- TikTok: spoken script only, conversational, < 60 seconds'
    if (p === 'youtube') return '- YouTube: longer script, intro + content + outro'
    return `- ${p}: platform-appropriate format`
  }).join('\n')

  const structureGuide = structure
    ? `\nSTORY STRUCTURE (${structure.name}):\n${structure.stages.map((s, i) => `${i + 1}. ${s.name}: ${s.purpose}`).join('\n')}`
    : ''

  const hookGuide = hookTemplate
    ? `\nHOOK TEMPLATE TO RIFF ON:\n"${hookTemplate}"\n(adapt this to the specific topic — don't copy verbatim)`
    : ''

  return `Write content for this idea:

TITLE: ${idea.title}
CONCEPT: ${idea.concept}
ORIGINAL HOOK IDEA: ${idea.hook}
CONTENT TYPE: ${idea.content_type}
PLATFORMS: ${platforms.join(', ')}
${structureGuide}
${hookGuide}

OUTPUT FORMAT — return ONLY this JSON, no markdown:
{
  "title": "final title",
  "hook": "the opening line/hook",
  "build_up": "the setup that creates tension or stakes",
  "value_section": "the main content / teaching / story",
  "payoff": "the resolution, insight, or punchline",
  "script": "full script or caption text (the complete piece)",
  "b_roll_notes": "visual direction notes if applicable",
  "hashtags": ["relevant", "hashtags"],
  "platform_versions": {
${platforms.map(p => `    "${p}": "platform-specific version of the content"`).join(',\n')}
  }
}

RULES:
- Write in the creator's exact voice (see system prompt)
- ${isShortForm ? 'Keep script under 90 seconds spoken (≈180 words)' : ''}
- ${isCarousel ? 'script = slide text only, build_up = slide 2-3, value_section = slides 4-7, payoff = final slide' : ''}
- ${isThread ? 'script = full thread, each tweet separated by \\n---\\n' : ''}
- No empty motivational filler. Every sentence must earn its place.
- End with a thought, not a command. No "follow for more" energy.
${platformInstructions}
`
}

export async function runContentWriter(brandId?: string): Promise<{
  brandsProcessed: number
  draftsCreated: number
  error?: string
}> {
  const supabase = await createClient()

  // Get brands
  const brandsQuery = supabase.from('brands').select('id, name, niche, platforms').eq('is_active', true)
  if (brandId) brandsQuery.eq('id', brandId)
  const { data: brands, error: brandsError } = await brandsQuery

  if (brandsError || !brands?.length) {
    return { brandsProcessed: 0, draftsCreated: 0, error: brandsError?.message ?? 'No active brands' }
  }

  let totalDrafts = 0

  for (const brand of brands) {
    try {
      // Get approved ideas that don't have drafts yet
      const { data: ideas } = await supabase
        .from('content_ideas')
        .select('id, brand_id, title, concept, hook, story_structure_id, target_platforms, content_type')
        .eq('brand_id', brand.id)
        .eq('status', 'approved')

      if (!ideas?.length) continue

      // Get voice profile
      const { data: voiceProfile } = await supabase
        .from('brand_voice_profiles')
        .select('*')
        .eq('brand_id', brand.id)
        .single()

      const systemPrompt = voiceProfile
        ? buildVoiceSystemPrompt(voiceProfile as BrandVoiceProfile)
        : `Write natural, direct content for a music producer creator. Short sentences. Technical terms used naturally. No hype language.`

      for (const idea of ideas as ContentIdea[]) {
        try {
          const hookTemplate = pickHookTemplate(idea.content_type, idea.story_structure_id)
          const prompt = buildWritingPrompt(idea, hookTemplate, voiceProfile as BrandVoiceProfile | null)

          const raw = await generateWithGroq(prompt, systemPrompt)

          let draft: {
            title: string
            hook: string
            build_up: string
            value_section: string
            payoff: string
            script: string
            b_roll_notes?: string
            hashtags: string[]
            platform_versions: Record<string, string>
          }

          try {
            const clean = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
            draft = JSON.parse(clean)
          } catch {
            const match = raw.match(/\{[\s\S]*\}/)
            if (!match) {
              console.error(`ContentWriter: parse error for idea ${idea.id}`)
              continue
            }
            draft = JSON.parse(match[0])
          }

          // Insert draft
          const { data: inserted } = await supabase.from('content_drafts').insert({
            brand_id: brand.id,
            idea_id: idea.id,
            title: draft.title ?? idea.title,
            content_type: idea.content_type,
            script: draft.script,
            hook: draft.hook,
            build_up: draft.build_up,
            value_section: draft.value_section,
            payoff: draft.payoff,
            hashtags: draft.hashtags ?? [],
            platforms: idea.target_platforms ?? [],
            b_roll_notes: draft.b_roll_notes ?? null,
            status: 'draft',
          }).select('id').single()

          if (inserted) {
            // Mark idea as drafted
            await supabase.from('content_ideas').update({ status: 'drafted' }).eq('id', idea.id)
            totalDrafts++
          }
        } catch (err) {
          console.error(`ContentWriter: error writing draft for idea ${idea.id}:`, err)
        }
      }
    } catch (err) {
      console.error(`ContentWriter: error for brand ${brand.id}:`, err)
    }
  }

  return { brandsProcessed: brands.length, draftsCreated: totalDrafts }
}
