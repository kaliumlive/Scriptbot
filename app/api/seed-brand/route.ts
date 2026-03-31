export const dynamic = 'force-dynamic'
/**
 * One-time seed endpoint — creates the kalium.wav brand + voice profile
 * from the Hippocratic gate intake done in chat.
 * Only works if the authenticated user has no brands yet.
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(_request: NextRequest) {
  const supabase = await createClient()
  // Auth disabled — check if any brand exists already
  const { data: existing } = await supabase
    .from('brands')
    .select('id')
    .limit(1)

  if (existing?.length) {
    return Response.json({ error: 'Brand already exists', brandId: existing[0].id }, { status: 409 })
  }

  // Create brand
  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      name: 'kalium.wav',
      handle: 'kalium.wav',
      niche: 'music production, sound design',
      tone_of_voice: 'formal-casual, direct, technically grounded, no hype',
      platforms: ['instagram', 'tiktok', 'youtube'],
      hashtag_sets: [['musicproduction', 'sounddesign', 'beatmaking', 'producer']],
      competitor_handles: [],
      audience_timezone: 'UTC',
      is_active: true,
    })
    .select('id')
    .single()

  if (brandError || !brand) {
    return Response.json({ error: brandError?.message ?? 'Failed to create brand' }, { status: 500 })
  }

  // Create voice profile
  const { error: voiceError } = await supabase
    .from('brand_voice_profiles')
    .insert({
      brand_id: brand.id,
      // Discovery answers from Hippocratic gate
      worldview: 'Music production knowledge should come from real feedback from experienced artists, not just formal education. School teaches theory; artists teach what actually works.',
      building_toward: 'A page that becomes lucrative for creative work — freelance and skill-based opportunities. Being known as skilled with good ideas, not chasing metrics.',
      unlearned: 'Sound engineering degree — but learned more from feedback from experienced artists than from school. Technical knowledge is a starting point, not the destination.',
      click_moment: 'Receiving feedback from experienced artists that changed how I work. The gap between what school teaches and what actually matters in practice.',
      sacrifices: 'Only posts when an idea genuinely bugs them enough to share. Quality over frequency — nothing goes out until it feels finished.',
      never_do: 'Will not make content I would not want to make for myself. Will not post unfinished work. Will not post factually incorrect content. CTAs are not a priority.',
      natural_tone: 'Formal-casual hybrid. Technical terms drop naturally when no simpler word exists — not for effect. Short, direct sentences. Honest about uncertainty, does not fake expertise.',
      personal_phrases: ['not sure', 'no idea', 'product of overthinking'],
      not_my_voice_phrases: ['follow for more', 'drop a comment', 'smash that like button', 'let that sink in', 'this changed everything'],
      respected_creators: ['Chloe Shih', 'Adrian Per', 'Gawx'],
      proud_content_reason: 'When the effort is visible and it resonates with followers who notice the design and editing quality.',
      content_cringe: 'People who have no idea what to post and just post anything hoping it works.',
      delete_triggers: 'If it feels unfinished, or something said is factually incorrect.',
      ideal_viewer: 'Music producers, sound designers, artists who value real craft over shortcuts.',
      desired_feeling: 'Walks away having learned something specific, or seen something they have not seen done that way before.',
      five_year_vision: 'Known as skilled with good ideas. Page generates real creative opportunities. Possibly a multi-page rebrand (music, edits, etc.) depending on how the audience evolves.',
      known_for: 'Good ideas, visible craft, applying Indian musical elements naturally, honest takes on production process.',
      // Inferred voice patterns
      formality_level: 'formal-casual',
      avg_sentence_length: 'short',
      uses_technical_terms: true,
      term_drop_style: 'Uses technical terms naturally when no simpler word exists — never to impress',
      filler_patterns: [],
      common_sentence_starters: ['The thing is', 'What actually', 'I noticed', 'The reason', 'Most people'],
      // Style guide pre-written from intake
      style_guide: `STYLE GUIDE — kalium.wav

1. SENTENCE STRUCTURE
Short sentences. One idea per sentence. When a sentence needs to be long, break it with a dash — not a comma chain. Lead with the point, not the setup. Never bury the insight at the end.

2. WORD CHOICE
Technical vocabulary drops naturally when it is the most precise word available, not to signal knowledge. "Transient shaper" is fine. "Sonic landscape" is not. Avoid adjectives that do not add information. No superlatives ("amazing", "incredible", "game-changing"). Honest uncertainty is normal — "not sure", "no idea", "might be wrong" are acceptable.

3. RHYTHM
Think out loud, but edited. It should feel like someone figured something out and is telling you before they forget it. Pauses are earned. No filler transitions ("so basically", "at the end of the day"). Gets to the point in the first two lines or it is not ready to post.

4. PERSONALITY
Curious without performing curiosity. Confident in craft, openly uncertain about everything else. Does not chase validation. Indian musical elements appear naturally — they are part of the toolkit, not a theme. Posts feel like they annoyed the creator enough to make them.

5. NEVER DO
- No CTAs unless the content genuinely ends with one naturally
- No motivational framing ("your beats WILL improve")
- No manufactured relatability ("we've all been there")
- No wrap-up summaries that restate what was just said
- Never fake hype or inject excitement that was not in the original thought
- Do not add "follow for more" or "let me know in the comments" unless the creator explicitly requests it`,
      last_updated: new Date().toISOString(),
    })

  if (voiceError) {
    return Response.json({ error: voiceError.message }, { status: 500 })
  }

  return Response.json({ status: 'ok', brandId: brand.id })
}
