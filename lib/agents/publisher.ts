import { createAdminClient } from '@/lib/supabase/admin'
import { postToYouTube } from '../platforms/youtube'
import { postToInstagram } from '../platforms/instagram'
import { postToTikTok } from '../platforms/tiktok'
import { postToTwitter } from '../platforms/twitter'

const PLATFORM_PUBLISHERS = {
    youtube: postToYouTube,
    instagram: postToInstagram,
    tiktok: postToTikTok,
    twitter: postToTwitter,
}

export async function runPublisher(brandId?: string) {
    const supabase = createAdminClient()

    // 1. Find posts due for publishing
    const query = supabase
        .from('scheduled_posts')
        .select('*, content_drafts(*)')
        .eq('status', 'scheduled')
        .lte('scheduled_at', new Date().toISOString())

    if (brandId) query.eq('brand_id', brandId)

    const { data: posts } = await query

    if (!posts || posts.length === 0) return { publishedCount: 0 }

    let publishedCount = 0

    for (const post of posts) {
        try {
            const publishFn = PLATFORM_PUBLISHERS[post.platform as keyof typeof PLATFORM_PUBLISHERS]
            if (!publishFn) throw new Error(`Publisher for ${post.platform} not implemented`)

            const result = await publishFn(post.brand_id, post.draft_id) as { platform_post_id: string; platform_post_url: string } | undefined

            if (!result) throw new Error(`Publisher for ${post.platform} returned no result`)

            // 2. Mark as published
            await supabase.from('scheduled_posts').update({ status: 'published' }).eq('id', post.id)

            await supabase.from('published_posts').insert({
                brand_id: post.brand_id,
                scheduled_post_id: post.id,
                draft_id: post.draft_id,
                platform: post.platform,
                platform_post_id: result.platform_post_id,
                platform_post_url: result.platform_post_url,
            })

            publishedCount++
        } catch (err) {
            console.error(`Publisher: failed for post ${post.id}:`, err)
            await supabase.from('scheduled_posts').update({
                status: 'failed',
                last_error: err instanceof Error ? err.message : String(err)
            }).eq('id', post.id)
        }
    }

    return { publishedCount }
}
