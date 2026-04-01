/**
 * Trend Scout Agent
 *
 * Uses Gemini 1.5 Pro with Google Search grounding to find top trending topics
 * for a brand's niche across each platform. Writes results to trend_reports.
 *
 * GitHub Actions trigger: every 4 hours
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase/admin'

export async function runTrendScout(brandId?: string): Promise<{
  brandsProcessed: number
  reportsCreated: number
  error?: string
}> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { brandsProcessed: 0, reportsCreated: 0, error: 'GEMINI_API_KEY not configured' }
  }

  const supabase = createAdminClient()

  const query = supabase
    .from('brands')
    .select('id, name, niche, platforms, competitor_handles')

  const { data: brands, error } = brandId
    ? await query.eq('id', brandId)
    : await query

  if (error || !brands?.length) {
    return { brandsProcessed: 0, reportsCreated: 0, error: error?.message ?? `No brands found (brandId: ${brandId ?? 'none'})` }
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  // Use Gemini with grounding for real-time trend data
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    tools: [{ googleSearch: {} } as never],
  })

  let totalReports = 0
  const diagnostics: string[] = []

  for (const brand of brands) {
    const platforms = (brand.platforms as string[]) ?? ['instagram', 'tiktok', 'youtube']
    const niche = brand.niche ?? 'music production'
    diagnostics.push(`brand=${brand.name} platforms=${JSON.stringify(platforms)} niche=${niche}`)

    for (const platform of platforms.slice(0, 3)) {
      // Limit to 3 platforms to stay within Gemini free tier
      try {
        const prompt = `What are the top 5 trending content topics and formats for ${niche} creators on ${platform} RIGHT NOW in ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}?

For each trend, return:
- topic: the trend title
- angle: the specific angle that's working (not just the topic, but HOW creators are approaching it)
- format: content format (short_video, carousel, live, etc.)
- why_trending: 1 sentence on why this is hitting right now

Return ONLY a JSON array, no markdown:
[
  {
    "topic": "trend title",
    "angle": "the specific working angle",
    "format": "short_video",
    "why_trending": "why this is resonating now"
  }
]`

        const result = await model.generateContent(prompt)
        const rawText = result.response.text().trim()

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

  return { brandsProcessed: brands.length, reportsCreated: totalReports, diagnostics }
}
// 01 Apr 2026 06:07:20
