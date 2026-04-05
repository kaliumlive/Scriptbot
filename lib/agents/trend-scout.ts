/**
 * Trend Scout Agent
 *
 * Finds cultural conversations, tensions, and moments happening in the creator's
 * space that THIS specific creator — with their worldview, story, and unpopular
 * beliefs — could authentically weigh in on.
 *
 * NOT a topic aggregator. Not "what's trending." A conversation finder for a
 * specific human with a specific perspective.
 *
 * GitHub Actions trigger: every 4 hours
 */

import { generateWithGroq } from '@/lib/ai/groq'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseLLMJson } from '@/lib/utils'
import type { BrandVoiceProfile } from '@/lib/brand/voice'

interface TrendItem {
  conversation: string        // The actual debate/tension/shift happening right now
  creator_angle: string       // How THIS creator's specific story/belief connects to it
  content_opportunity: string // The specific take only they could make
  emotional_territory: string // What emotion it unlocks: anger, nostalgia, relief, pride, curiosity
  format: string              // short_video | carousel | long_video | thread
  why_now: string             // Why this conversation is alive right now (1 sentence)
}

export async function runTrendScout(brandId?: string): Promise<{
  brandsProcessed: number
  reportsCreated: number
  error?: string
}> {
  const supabase = createAdminClient()

  const query = supabase
    .from('brands')
    .select('id, name, niche, platforms, competitor_handles')

  const { data: brands, error } = brandId
    ? await query.eq('id', brandId)
    : await query

  if (error || !brands?.length) {
    return { brandsProcessed: 0, reportsCreated: 0, error: error?.message ?? `No brands found` }
  }

  let totalReports = 0

  for (const brand of brands) {
    const platforms = (brand.platforms as string[]) ?? ['instagram', 'tiktok', 'youtube']
    const niche = brand.niche ?? 'music production'

    // Load voice profile to anchor trend finding to THIS creator
    const { data: rawVoice } = await supabase
      .from('brand_voice_profiles')
      .select('*')
      .eq('brand_id', brand.id)
      .single()
    const voice = rawVoice as BrandVoiceProfile | null

    // Build creator identity context for the prompt
    const identityLines: string[] = []
    if (voice?.worldview) identityLines.push(`WORLDVIEW: ${voice.worldview}`)
    if (voice?.unpopular_belief) identityLines.push(`UNPOPULAR BELIEF: ${voice.unpopular_belief}`)
    if (voice?.unlearned) identityLines.push(`SOMETHING THEY UNLEARNED: ${voice.unlearned}`)
    if (voice?.click_moment) identityLines.push(`DEFINING MOMENT: ${voice.click_moment}`)
    if (voice?.known_for) identityLines.push(`KNOWN FOR: ${voice.known_for}`)
    if (voice?.building_toward) identityLines.push(`BUILDING TOWARD: ${voice.building_toward}`)
    if (voice?.ideal_viewer) identityLines.push(`IDEAL FAN: ${voice.ideal_viewer}`)
    if (voice?.hard_period) identityLines.push(`HARD PERIOD THEY LIVED: ${voice.hard_period}`)

    const hasIdentity = identityLines.length >= 2

    for (const platform of platforms) {
      try {
        const prompt = `You are a cultural intelligence scout for a specific creator — not a generic trend aggregator.

CREATOR: ${brand.name}
SPACE: ${niche}
PLATFORM: ${platform}
${hasIdentity ? `\nCREATOR IDENTITY:\n${identityLines.join('\n')}` : `\nNICHE: ${niche}`}

Your job is to find 5 CONVERSATIONS happening right now in the ${niche} world on ${platform} that this creator has a genuine, personal, specific stake in.

A CONVERSATION is:
- A debate people are having (e.g., "Is sample-based music still real production?")
- A tension the community feels (e.g., "Producers feel invisible behind the artists they make famous")
- A belief shift underway (e.g., "People are rejecting the 'grind 10,000 hours' myth")
- A cultural moment or reaction (e.g., "Everyone's talking about X going viral and what it means")
- A frustration or fear the audience carries silently

NOT a conversation:
- "How to mix better" (tutorial)
- "Best plugins in 2025" (gear listicle)
- "Day in the life of a producer" (format, not a conversation)
- "Top 5 tips for X" (advice content)

${hasIdentity ? `For each conversation, explain HOW THIS SPECIFIC CREATOR — with their particular story, beliefs, and lived experience — could authentically and credibly weigh in. What angle would only THEY have?` : `For each conversation, suggest the specific angle a creator in this space could authentically take.`}

Return ONLY a JSON array:
[
  {
    "conversation": "The actual debate or tension in 1-2 sentences",
    "creator_angle": "${hasIdentity ? `How this creator's specific story/belief gives them a unique stake in this conversation` : `The specific angle that would make this feel personal and authentic`}",
    "content_opportunity": "The exact take or statement they could make — specific, not generic",
    "emotional_territory": "One word or short phrase: what emotion this unlocks (e.g., 'quiet anger', 'earned pride', 'relief', 'nostalgia', 'vindication')",
    "format": "short_video | carousel | long_video | thread",
    "why_now": "Why this conversation is alive on ${platform} right now"
  }
]`

        const rawText = await generateWithGroq(prompt)
        const trends = parseLLMJson<TrendItem[]>(rawText)

        if (!Array.isArray(trends) || trends.length === 0) {
          console.error(`TrendScout: Invalid data for ${platform}`, rawText)
          continue
        }

        const { error: insertError } = await supabase.from('trend_reports').insert({
          brand_id: brand.id,
          platform,
          niche,
          trends,
          report_date: new Date().toISOString().split('T')[0],
        })

        if (insertError) {
          console.error(`TrendScout: Insert failed for ${platform}: ${insertError.message}`)
          continue
        }
        totalReports++
      } catch (err) {
        console.error(`TrendScout: Error processing ${platform} for brand ${brand.id}:`, err)
        continue
      }
    }
  }

  return { brandsProcessed: brands.length, reportsCreated: totalReports }
}
