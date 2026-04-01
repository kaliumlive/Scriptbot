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

    for (const platform of platforms.slice(0, 3)) {
      try {
        const prompt = `What are the top 5 trending content topics and formats for ${niche} creators on ${platform} in ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}?

For each trend return:
- topic: the trend title
- angle: the specific angle that's working
- format: content format (short_video, carousel, live, etc.)
- why_trending: 1 sentence on why this is resonating

Return ONLY a JSON array, no markdown:
[{"topic":"...","angle":"...","format":"...","why_trending":"..."}]`

        const rawText = await generateWithGroq(prompt)

        let trends: Array<{topic: string; angle: string; format: string; why_trending: string}>
        try {
          const clean = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '')
          trends = JSON.parse(clean)
        } catch {
          const match = rawText.match(/\[[\s\S]*\]/)
          if (!match) throw new Error(`Parse failed for ${platform}. Raw: ${rawText.slice(0, 200)}`)
          trends = JSON.parse(match[0])
        }

        const { error: insertError } = await supabase.from('trend_reports').insert({
          brand_id: brand.id,
          platform,
          niche,
          trends,
          report_date: new Date().toISOString().split('T')[0],
        })

        if (insertError) throw new Error(`Insert failed: ${insertError.message}`)
        totalReports++
      } catch (err) {
        return { brandsProcessed: 0, reportsCreated: 0, error: String(err) }
      }
    }
  }

  return { brandsProcessed: brands.length, reportsCreated: totalReports }
}
// 01 Apr 2026 06:07:20
