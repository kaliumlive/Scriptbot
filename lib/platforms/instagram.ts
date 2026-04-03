import { createAdminClient } from '@/lib/supabase/admin'

interface InstagramMediaItem {
    id: string
    caption?: string
    media_type?: string
    media_product_type?: string
    permalink?: string
    timestamp?: string
}

interface ImportResult {
    importedPosts: number
    scannedPosts: number
}

export async function importInstagramPublishedPosts(brandId: string, limit: number = 100): Promise<ImportResult> {
    const supabase = createAdminClient()

    const { data: connection } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('brand_id', brandId)
        .eq('platform', 'instagram')
        .eq('is_active', true)
        .single()

    if (!connection?.access_token || !connection?.external_account_id) {
        return { importedPosts: 0, scannedPosts: 0 }
    }

    const existingResult = await supabase
        .from('published_posts')
        .select('platform_post_id')
        .eq('brand_id', brandId)
        .eq('platform', 'instagram')

    const existingIds = new Set(
        (existingResult.data ?? [])
            .map((row: { platform_post_id: string | null }) => row.platform_post_id)
            .filter(Boolean)
    )

    const collected: InstagramMediaItem[] = []
    let nextUrl: string | null =
        `https://graph.facebook.com/v19.0/${connection.external_account_id}/media?` +
        new URLSearchParams({
            fields: 'id,caption,media_type,media_product_type,permalink,timestamp',
            limit: String(Math.min(limit, 100)),
            access_token: connection.access_token,
        }).toString()

    while (nextUrl && collected.length < limit) {
        const response: Response = await fetch(nextUrl)
        const payload = await response.json() as { data?: InstagramMediaItem[]; paging?: { next?: string } }

        if (!response.ok) {
            throw new Error(`Instagram media import failed: ${JSON.stringify(payload)}`)
        }

        const items = payload.data ?? []
        collected.push(...items)

        const next: string | undefined = payload.paging?.next
        nextUrl = typeof next === 'string' && collected.length < limit ? next : null
    }

    const rowsToInsert = collected
        .filter((item) => item.id && !existingIds.has(item.id))
        .map((item) => ({
            brand_id: brandId,
            platform: 'instagram',
            platform_post_id: item.id,
            platform_post_url: item.permalink ?? null,
            published_at: item.timestamp ?? new Date().toISOString(),
        }))

    if (rowsToInsert.length > 0) {
        const { error } = await supabase.from('published_posts').insert(rowsToInsert)
        if (error) {
            throw new Error(`Failed to save imported Instagram posts: ${error.message}`)
        }
    }

    return {
        importedPosts: rowsToInsert.length,
        scannedPosts: collected.length,
    }
}

export async function getInstagramMetrics(brandId: string, platformPostId: string) {
    const supabase = createAdminClient()

    const { data: connection } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('brand_id', brandId)
        .eq('platform', 'instagram')
        .single()

    if (!connection?.access_token) {
        throw new Error('Instagram connection not found or expired.')
    }

    const accessToken = connection.access_token

    try {
        const mediaRes = await fetch(
            `https://graph.facebook.com/v19.0/${platformPostId}?fields=like_count,comments_count,media_type&access_token=${accessToken}`
        )
        const mediaData = await mediaRes.json()
        const isVideo = mediaData.media_type === 'VIDEO' || mediaData.media_type === 'REELS'

        const metricsToFetch = ['reach', 'impressions', 'saved']
        if (isVideo) {
            metricsToFetch.push('plays')
            metricsToFetch.push('video_views')
        }

        const insightsRes = await fetch(
            `https://graph.facebook.com/v19.0/${platformPostId}/insights?metric=${metricsToFetch.join(',')}&period=lifetime&access_token=${accessToken}`
        )
        const insightsData = await insightsRes.json()

        const metrics: Record<string, number> = {
            likes: mediaData.like_count || 0,
            comments: mediaData.comments_count || 0,
            shares: 0,
            saves: 0,
            reach: 0,
            impressions: 0,
            views: 0,
        }

        if (insightsData.data) {
            insightsData.data.forEach((m: { name: string; values: Array<{ value: number }> }) => {
                const value = m.values?.[0]?.value || 0
                if (m.name === 'reach') metrics.reach = value
                if (m.name === 'impressions') metrics.impressions = value
                if (m.name === 'saved') metrics.saves = value
                if (m.name === 'video_views' || m.name === 'plays') {
                    metrics.views = Math.max(metrics.views, value)
                }
            })
        }

        return metrics
    } catch (error) {
        console.error('Error fetching IG metrics:', error)
        return { likes: 0, comments: 0, shares: 0, saves: 0, reach: 0, impressions: 0, views: 0 }
    }
}
