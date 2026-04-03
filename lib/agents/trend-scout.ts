/**
 * Trend Scout Agent
 *
 * Uses Gemini 1.5 Pro with Google Search grounding to find top trending topics
 * for a brand's niche across each platform. Writes results to trend_reports.
 *
 * GitHub Actions trigger: every 4 hours
 */

import { generateWithGroq } from '@/lib/ai/groq'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseLLMJson } from '@/lib/utils'

interface TrendItem {
  topic: string
  angle: string
  format: string
  why_trending: string
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

    for (const platform of platforms) {
      try {
        const prompt = `Analyze the current state of ${platform} for ${niche} creators in ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
Identify the top 5 trending content topics, psychological triggers, or specific formats that are currently viral or high-growth.

For each trend return:
- topic: clear, descriptive title
- angle: the specific perspective or "hook" that's working right now
- format: the visual format (e.g., short_video, photo_carousel, long_form, live_stream)
- why_trending: 1-2 sentences on the audience psychology or algorithm shift driving this.

Return ONLY a JSON array:
[{"topic":"...","angle":"...","format":"...","why_trending":"..."}]`

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
// 01 Apr 2026 06:07:20
