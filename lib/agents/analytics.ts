import { createAdminClient } from '@/lib/supabase/admin'
import { getInstagramMetrics } from '../platforms/instagram'
import { getYouTubeMetrics } from '../platforms/youtube'
import { getTikTokMetrics } from '../platforms/tiktok'
import { generateWithGroq } from '../ai/groq'
import { importConnectedPostHistory } from '../platforms/history-sync'

interface PlatformMetrics {
    likes?: number
    comments?: number
    shares?: number
    saves?: number
    reach?: number
    impressions?: number
    views?: number
    [key: string]: number | undefined
}

interface PublishedPostRecord {
    id: string
    platform: string
    platform_post_id: string
}

interface AnalyticsSummary {
    post: PublishedPostRecord
    stats: PlatformMetrics
}

const PLATFORM_METRICS: Record<string, (brandId: string, postId: string) => Promise<Record<string, number>>> = {
    instagram: getInstagramMetrics,
    youtube: getYouTubeMetrics,
    tiktok: getTikTokMetrics,
}

export async function runAnalytics(brandId: string) {
    const supabase = createAdminClient()
    const historySync = await importConnectedPostHistory(brandId)

    // 1. Get published posts for the brand
    const { data: posts } = await supabase
        .from('published_posts')
        .select('*')
        .eq('brand_id', brandId)
        .order('published_at', { ascending: false })

    if (!posts || posts.length === 0) {
        return {
            snapshotsCreated: 0,
            importedPosts: historySync.importedPosts,
            scannedPosts: historySync.scannedPosts,
            platformImports: historySync.platforms,
        }
    }

    let snapshotsCreated = 0
    const allStats: AnalyticsSummary[] = []

    for (const post of posts as PublishedPostRecord[]) {
        const metricsFn = PLATFORM_METRICS[post.platform as keyof typeof PLATFORM_METRICS]
        if (!metricsFn) {
            continue
        }

        try {
            const stats = await metricsFn(brandId, post.platform_post_id)
            if (stats) {
                await supabase.from('analytics_snapshots').insert({
                    brand_id: brandId,
                    published_post_id: post.id,
                    platform: post.platform,
                    likes: stats.likes || 0,
                    comments: stats.comments || 0,
                    shares: stats.shares || 0,
                    saves: stats.saves || 0,
                    reach: stats.reach || 0,
                    impressions: stats.impressions || 0,
                    views: stats.views || 0,
                    snapshot_at: new Date().toISOString()
                })
                allStats.push({ post, stats })
                snapshotsCreated++
            }
        } catch (err) {
            console.error(`Analytics: failed for post ${post.id}:`, err)
        }
    }

    // 2. Generate AI insights for the brand dashboard
    if (allStats.length > 0) {
        const insightsPrompt = `
        As an Agency Performance Lead, analyze these recent post metrics for brand ${brandId}:
        ${JSON.stringify(allStats.map(s => ({ platform: s.post.platform, ...s.stats })))}
        
        Provide a 2-sentence strategic "Command Center" insight. 
        Focus on what's working (e.g. content types) and one actionable advice (e.g. "double down on reels").
        Keep it concise and professional.
        `
        const ai_insights = await generateWithGroq(insightsPrompt)

        // Persist to the latest snapshot so the UI can retrieve it
        const latestSnapshotId = allStats[0].post.id
        await supabase
            .from('analytics_snapshots')
            .update({ ai_insights })
            .eq('published_post_id', latestSnapshotId)

        return {
            snapshotsCreated,
            importedPosts: historySync.importedPosts,
            scannedPosts: historySync.scannedPosts,
            platformImports: historySync.platforms,
            ai_insights
        }
    }

    return {
        snapshotsCreated,
        importedPosts: historySync.importedPosts,
        scannedPosts: historySync.scannedPosts,
        platformImports: historySync.platforms,
    }
}
