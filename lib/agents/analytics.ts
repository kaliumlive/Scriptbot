import { createAdminClient } from '@/lib/supabase/admin'
import { getYouTubeMetrics } from '../platforms/youtube'
import { getLinkedInMetrics } from '../platforms/linkedin'
import { getInstagramMetrics } from '../platforms/instagram'
import { getTikTokMetrics } from '../platforms/tiktok'
import { getTwitterMetrics } from '../platforms/twitter'
import { generateWithGroq } from '../ai/groq'

const PLATFORM_METRICS = {
    youtube: getYouTubeMetrics,
    linkedin: getLinkedInMetrics,
    instagram: getInstagramMetrics,
    tiktok: getTikTokMetrics,
    twitter: getTwitterMetrics,
}

export async function runAnalytics(brandId: string) {
    const supabase = createAdminClient()

    // 1. Get published posts for the brand
    const { data: posts } = await supabase
        .from('published_posts')
        .select('*')
        .eq('brand_id', brandId)
        .order('published_at', { ascending: false })
        .limit(20)

    if (!posts || posts.length === 0) return { snapshotsCreated: 0 }

    let snapshotsCreated = 0

    for (const post of posts) {
        const metricsFn = PLATFORM_METRICS[post.platform as keyof typeof PLATFORM_METRICS]
        if (!metricsFn) continue

        try {
            const stats = await metricsFn(post.platform_post_id, post.brand_id)

            // 2. Generate AI insights every few snapshots or for specific posts
            const insightsPrompt = `Analyze these metrics for a ${post.platform} post: ${JSON.stringify(stats)}. 
      Provide 1 sentence of constructive feedback.`
            const insights = await generateWithGroq(insightsPrompt)

            await supabase.from('analytics_snapshots').insert({
                brand_id: brandId,
                published_post_id: post.id,
                platform: post.platform,
                ...stats,
                ai_insights: insights,
            })

            snapshotsCreated++
        } catch (err) {
            console.error(`Analytics: failed for post ${post.id}:`, err)
        }
    }

    return { snapshotsCreated }
}
