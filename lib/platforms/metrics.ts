import { createAdminClient } from '@/lib/supabase/admin'
import { getInstagramMetrics } from './instagram'

export async function syncPlatformMetrics(brandId: string) {
    const supabase = createAdminClient()

    // 1. Get all published posts for this brand
    const { data: posts, error: postsError } = await supabase
        .from('published_posts')
        .select('*')
        .eq('brand_id', brandId)
    
    if (postsError || !posts) {
        console.error('Error fetching published posts:', postsError)
        return
    }

    const results = []

    // 2. Fetch metrics for each post
    for (const post of posts) {
        let metrics = null

        if (post.platform === 'instagram' && post.platform_post_id) {
            metrics = await getInstagramMetrics(brandId, post.platform_post_id)
        }

        if (metrics) {
            // 3. Save snapshot
            const { error: snapshotError } = await supabase
                .from('analytics_snapshots')
                .insert({
                    brand_id: brandId,
                    published_post_id: post.id,
                    platform: post.platform,
                    likes: metrics.likes || 0,
                    comments: metrics.comments || 0,
                    shares: metrics.shares || 0,
                    saves: metrics.saves || 0,
                    reach: metrics.reach || 0,
                    impressions: metrics.impressions || 0,
                    views: metrics.views || 0,
                    snapshot_at: new Date().toISOString()
                })
            
            if (snapshotError) {
                console.error(`Error saving snapshot for post ${post.id}:`, snapshotError)
            } else {
                results.push({ post_id: post.id, metrics })
            }
        }
    }

    return results
}

export async function getGlobalMetrics(brandId: string) {
    const supabase = createAdminClient()

    // Get the latest snapshot for each post
    const { data, error } = await supabase
        .from('analytics_snapshots')
        .select('*')
        .eq('brand_id', brandId)
        .order('snapshot_at', { ascending: false })
    
    if (error || !data) return null

    // Group by published_post_id and take the first (latest)
    const latestSnapshots = new Map()
    data.forEach(s => {
        if (!latestSnapshots.has(s.published_post_id)) {
            latestSnapshots.set(s.published_post_id, s)
        }
    })

    const totals = {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        reach: 0
    }

    latestSnapshots.forEach(s => {
        totals.likes += s.likes || 0
        totals.comments += s.comments || 0
        totals.shares += s.shares || 0
        totals.views += s.views || 0
        totals.reach += s.reach || 0
    })

    return totals
}
