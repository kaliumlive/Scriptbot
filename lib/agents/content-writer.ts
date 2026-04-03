/**
 * Content Writer Agent
 *
 * Picks up all approved content ideas (not yet drafted), writes full scripts/captions
 * in the creator's voice using their voice profile + hook database + story structures,
 * and inserts content_drafts rows including per-platform captions and storyboard beats.
 *
 * GitHub Actions trigger: daily 8AM UTC (after Idea Generator)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { generateWithGroq } from '@/lib/ai/groq'
import { buildVoiceSystemPrompt } from '@/lib/brand/voice'
import type { BrandVoiceProfile } from '@/lib/brand/voice'
import { HOOK_DATABASE } from '@/lib/hooks/database'
import { STORY_STRUCTURES } from '@/lib/storytelling/structures'
import { parseLLMJson } from '@/lib/utils'

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

interface StoryboardBeat {
  text: string
  visual: string
  style: 'cinematic' | 'mograph' | 'talking-head' | 'movie-clip'
  movie_reference?: string
  duration: number
}

interface GeneratedDraft {
  title?: string
  hook?: string
  build_up?: string
  value_section?: string
  payoff?: string
  script?: string
  hashtags?: string[]
  storyboard?: StoryboardBeat[]
  platform_captions?: Record<string, string>
}

function pickHookTemplate(): string {
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
  const platforms = idea.target_platforms?.length ? idea.target_platforms : ['instagram', 'tiktok']
  const isShortForm = ['short_video', 'reel'].includes(idea.content_type)
  const isCarousel = idea.content_type === 'carousel'
  const isThread = idea.content_type === 'thread'

  const platformCaptionRules = platforms.map(p => {
    if (p === 'instagram') return `instagram: Hook on line 1 (stops the scroll). 3-4 bullet insights. One "save this" soft CTA. Max 2,200 chars. 5-10 hashtags at end. NO emojis overload.`
    if (p === 'tiktok') return `tiktok: Conversational, spoken-word style opener. SEO-keyword dense (algorithm reads captions). 3-5 hyper-niche hashtags only. Under 300 chars. End with a question.`
    if (p === 'youtube') return `youtube: SEO title under 70 chars, then 2-para description: para 1 = value promise, para 2 = what they'll learn. Include timestamps if long-form.`
    if (p === 'twitter' || p === 'x') return `twitter: 280-char hook tweet only. No hashtags. Punchy ending. This is the opening tweet.`
    return `${p}: platform-appropriate caption, under 300 chars`
  }).join('\n')

  const voiceInstructions = voiceProfile
    ? `\nCREATOR VOICE:\nTONE: ${voiceProfile.natural_tone ?? 'Professional but direct'}\nPHRASES TO USE: ${voiceProfile.personal_phrases?.join(', ') ?? 'None'}\nNEVER WRITE: ${voiceProfile.not_my_voice_phrases?.join(', ') ?? 'None'}`
    : ''

  const structureGuide = structure
    ? `\nSTORY STRUCTURE (${structure.name}):\nVISUAL THEME: ${structure.visual_theme ?? 'Creator-style'}\n${structure.stages.map((s, i) => `${i + 1}. ${s.name}: ${s.purpose} (Visuals: ${s.visual_guidance ?? 'Follow theme'})`).join('\n')}`
    : ''

  const hookGuide = hookTemplate
    ? `\nHOOK TEMPLATE (riff on this, don't copy):\n"${hookTemplate}"`
    : ''

  return `Write content for this idea:

TITLE: ${idea.title}
CONCEPT: ${idea.concept}
ORIGINAL HOOK: ${idea.hook}
CONTENT TYPE: ${idea.content_type}
PLATFORMS: ${platforms.join(', ')}
${voiceInstructions}
${structureGuide}
${hookGuide}

Return ONLY this JSON, no markdown fences:
{
  "title": "final punchy title",
  "hook": "opening line that stops the scroll",
  "build_up": "setup that creates stakes or tension",
  "value_section": "the core teaching, story, or insight",
  "payoff": "the resolution or punchline that lands",
  "script": "complete script for the content piece",
  "storyboard": [
    {
      "text": "exact sentence or segment from the script",
      "visual": "detailed visual cue, e.g. 'Mograph: waveform animation synced to beat drop'",
      "style": "cinematic|mograph|talking-head|movie-clip",
      "movie_reference": "optional: iconic movie scene that matches the vibe, e.g. 'Inception - spinning top'",
      "duration": 3.0
    }
  ],
  "platform_captions": {
${platforms.map(p => `    "${p}": "caption for ${p} following its best practices"`).join(',\n')}
  },
  "hashtags": ["niche", "relevant", "hashtags"]
}

CAPTION BEST PRACTICES PER PLATFORM:
${platformCaptionRules}

WRITING RULES:
- ${isShortForm ? 'Script under 90 seconds spoken (≈150-180 words)' : 'Script can be comprehensive'}
- ${isCarousel ? 'script = slide text. build_up = slides 2-3, value_section = slides 4-7, payoff = final slide' : ''}
- ${isThread ? 'script = full thread. Each tweet separated by \\n---\\n' : ''}
- Every sentence earns its place. No filler, no "follow for more" energy.
- End with a thought or question, not a command.
- Storyboard should have one beat per 2-4 seconds of estimated content.
`
}

export async function runContentWriter(brandId?: string): Promise<{
  brandsProcessed: number
  draftsCreated: number
  error?: string
}> {
  const supabase = createAdminClient()

  const q = supabase.from('brands').select('id, name, niche, platforms')
  const { data: brands, error: brandsError } = brandId ? await q.eq('id', brandId) : await q

  if (brandsError || !brands?.length) {
    return { brandsProcessed: 0, draftsCreated: 0, error: brandsError?.message ?? 'No active brands' }
  }

  let totalDrafts = 0

  for (const brand of brands) {
    try {
      // Only pick up approved ideas that do NOT already have a draft
      const { data: ideas } = await supabase
        .from('content_ideas')
        .select('id, brand_id, title, concept, hook, story_structure_id, target_platforms, content_type')
        .eq('brand_id', brand.id)
        .eq('status', 'approved')

      if (!ideas?.length) {
        console.log(`ContentWriter: No approved ideas without drafts for brand ${brand.id}`)
        continue
      }

      const { data: voiceProfile } = await supabase
        .from('brand_voice_profiles')
        .select('*')
        .eq('brand_id', brand.id)
        .single()

      const systemPrompt = voiceProfile
        ? buildVoiceSystemPrompt(voiceProfile as BrandVoiceProfile)
        : `Write natural, direct content for a music producer creator. Short sentences. Technical terms used naturally. No hype language. No "follow for more" energy.`

      for (const idea of ideas as ContentIdea[]) {
        try {
          const hookTemplate = pickHookTemplate()
          const prompt = buildWritingPrompt(idea, hookTemplate, voiceProfile as BrandVoiceProfile | null)

          const raw = await generateWithGroq(prompt, systemPrompt)

          const draft = parseLLMJson<GeneratedDraft>(raw)

          if (!draft || typeof draft !== 'object' || !draft.script) {
            console.error(`ContentWriter: Parse/validation failed for idea ${idea.id}. Raw:`, raw.slice(0, 200))
            continue
          }

          const { data: inserted } = await supabase.from('content_drafts').insert({
            brand_id: brand.id,
            idea_id: idea.id,
            title: draft.title ?? idea.title,
            content_type: idea.content_type,
            script: draft.script,
            hook: draft.hook ?? '',
            build_up: draft.build_up ?? '',
            value_section: draft.value_section ?? '',
            payoff: draft.payoff ?? '',
            hashtags: draft.hashtags ?? [],
            storyboard: draft.storyboard ?? [],
            platform_captions: draft.platform_captions ?? {},
            status: 'draft',
          }).select('id').single()

          if (inserted) {
            await supabase.from('content_ideas').update({ status: 'drafted' }).eq('id', idea.id)
            totalDrafts++
            console.log(`ContentWriter: Created draft for idea "${idea.title}"`)
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          console.error(`ContentWriter: Error for idea ${idea.id}:`, message)
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`ContentWriter: Error for brand ${brand.id}:`, message)
    }
  }

  return { brandsProcessed: brands.length, draftsCreated: totalDrafts }
}
