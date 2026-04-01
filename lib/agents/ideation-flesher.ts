/**
 * Ideation Flesher Agent
 *
 * Takes a raw user topic/idea and "fleshes it out" into a 
 * complete script + storyboard beat-by-beat.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { generateWithGroq } from '@/lib/ai/groq'
import { buildVoiceSystemPrompt } from '@/lib/brand/voice'
import type { BrandVoiceProfile } from '@/lib/brand/voice'
import { STORY_STRUCTURES } from '@/lib/storytelling/structures'

export interface FleshingResult extends Idea {
  script: string
  storyboard: Array<{
    text: string
    visual: string
    style: 'cinematic' | 'mograph' | 'talking-head' | 'movie-clip'
    movie_reference?: string
    youtube_search_query?: string
    audio_cue?: string
    duration: number
  }>
}

export interface Idea {
  title: string
  concept: string
  hook: string
  hashtags: string[]
}

export async function runIdeationFlesher(brandId: string, topic: string): Promise<FleshingResult> {
  const supabase = createAdminClient()

  // 1. Get Brand and Voice
  const { data: brand } = await supabase.from('brands').select('*').eq('id', brandId).single()
  const { data: voiceProfile } = await supabase.from('brand_voice_profiles').select('*').eq('brand_id', brandId).single()

  if (!brand) throw new Error('Brand not found')

  const systemPrompt = voiceProfile
    ? buildVoiceSystemPrompt(voiceProfile as BrandVoiceProfile)
    : `You are a high-end content strategist for a professional creator in the ${brand.niche} niche.`

  // 2. Build the "Flesh Out" prompt
  const structuresList = STORY_STRUCTURES.map(s => `- ${s.id}: ${s.name} (${s.description})`).join('\n')

  const prompt = `
USER TOPIC/IDEA: "${topic}"

Your task is to take this raw idea and turn it into a high-performance video script with a granular AUDIO-VISUAL STORYBOARD.

1. Pick the best STORY STRUCTURE from this list:
${structuresList}

2. Write a script that hits the hook, build-up, value, and payoff.

3. Create the STORYBOARD. Every 1-2 sentences in the script must be a "beat" in the storyboard.
Each beat needs:
- text: The spoken words.
- visual: Clear direction (e.g. "Mograph: Floating quote with glow effect", "B-roll: POV walking through studio").
- style: cinematic | mograph | talking-head | movie-clip.
- movie_reference: If 'style' is 'movie-clip', suggest a specific, iconic scene (e.g. "The Interstellar docking scene").
- youtube_search_query: A precise search query to find the visual on YouTube. For movie clips, add "scene" and be very specific. For SFX, add "SFX". 
- audio_cue: Specific sound effect or music transition (e.g., "Deep braam sound", "Lofi beat drops").
- duration: Approx seconds (2-5s).

OUTPUT FORMAT (JSON ONLY):
{
  "title": "...",
  "concept": "...",
  "story_structure_id": "...",
  "hook": "...",
  "script": "...",
  "storyboard": [
    { "text": "...", "visual": "...", "style": "...", "movie_reference": "...", "youtube_search_query": "...", "audio_cue": "...", "duration": 3 }
  ],
  "hashtags": ["...", "..."]
}

RULES:
- Be authentic to the creator's voice.
- Visuals should be BOLD and premium.
- ALWAYS use iconic movie clips for emotional hooks (e.g., Use a sad Interstellar scene if the hook is about a deep regret).
- Use mographs for technical explanations.
- FOR MOVIE CLIPS: Ensure the search query focuses on the raw scene, not commentary.
`

  const raw = await generateWithGroq(prompt, systemPrompt)
  
  let result: FleshingResult
  try {
    const clean = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    result = JSON.parse(clean)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Failed to parse Agent output')
    result = JSON.parse(match[0])
  }

  // 3. Save as a Draft
  await supabase.from('content_drafts').insert({
    brand_id: brandId,
    title: result.title,
    content_type: 'short_video',
    script: result.script,
    hook: result.hook,
    storyboard: result.storyboard,
    hashtags: result.hashtags,
    status: 'draft'
  })

  return result
}

export async function runTopicBrainstormer(brandId: string): Promise<Idea[]> {
  const supabase = createAdminClient()
  const { data: brand } = await supabase.from('brands').select('*').eq('id', brandId).single()
  const { data: voiceProfile } = await supabase.from('brand_voice_profiles').select('*').eq('brand_id', brandId).single()

  if (!brand) throw new Error('Brand not found')

  const systemPrompt = voiceProfile
    ? buildVoiceSystemPrompt(voiceProfile as BrandVoiceProfile)
    : `You are a high-end content strategist for a professional creator in the ${brand.niche} niche.`

  const prompt = `
Generate 5 high-performance content ideas for a short-form video creator.
NICHE: ${brand.niche}
GOAL: High engagement, authority building, and viral potential.

The ideas should be specific, not generic. Use "hooks" that grab attention in the first 3 seconds.

OUTPUT FORMAT (JSON ONLY):
{
  "ideas": [
    {
      "title": "...",
      "concept": "...",
      "hook": "...",
      "hashtags": ["...", "..."]
    }
  ]
}
`

  const raw = await generateWithGroq(prompt, systemPrompt)
  try {
    const clean = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    const result = JSON.parse(clean)
    return result.ideas
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Failed to parse Brainstormer output')
    const result = JSON.parse(match[0])
    return result.ideas
  }
}
