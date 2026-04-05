import { createAdminClient } from '@/lib/supabase/admin'

interface InstagramMediaItem {
    id: string
    caption?: string
    media_type?: string
    media_product_type?: string
    media_url?: string
    thumbnail_url?: string
    permalink?: string
    timestamp?: string
}

interface ImportResult {
    importedPosts: number
    scannedPosts: number
}

/** Derive a human-readable title from an Instagram caption (first non-empty line, max 120 chars) */
function titleFromCaption(caption?: string, mediaType?: string): string {
    if (caption) {
        const firstLine = caption
            .split('\n')
            .map((l) => l.trim())
            .find((l) => l.length > 0)
        if (firstLine) return firstLine.slice(0, 120)
    }
    if (mediaType === 'VIDEO') return 'Instagram Video'
    if (mediaType === 'REELS') return 'Instagram Reel'
    if (mediaType === 'CAROUSEL_ALBUM') return 'Instagram Carousel'
    return 'Instagram Post'
}

/** Best thumbnail URL for an Instagram media item */
function thumbnailFor(item: InstagramMediaItem): string | null {
    // Videos & Reels: thumbnail_url is the cover frame
    if (item.thumbnail_url) return item.thumbnail_url
    // Images & Carousels: media_url is the actual image
    if (item.media_url) return item.media_url
    return null
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

    if (!connection?.access_token) {
        return { importedPosts: 0, scannedPosts: 0 }
    }

    const accessToken = connection.access_token

    // Fetch existing post IDs to skip duplicates, but also collect those with null titles for backfill
    const existingResult = await supabase
        .from('published_posts')
        .select('platform_post_id, title')
        .eq('brand_id', brandId)
        .eq('platform', 'instagram')

    const existingIds = new Set(
        (existingResult.data ?? [])
            .map((row: { platform_post_id: string | null }) => row.platform_post_id)
            .filter(Boolean)
    )
    const needsBackfill = new Set(
        (existingResult.data ?? [])
            .filter((row: { platform_post_id: string | null; title: string | null }) => row.platform_post_id && !row.title)
            .map((row: { platform_post_id: string | null }) => row.platform_post_id)
    )

    // Use Instagram Business Login API (graph.instagram.com)
    // me/media works with the user access token directly
    const collected: InstagramMediaItem[] = []
    let nextUrl: string | null =
        `https://graph.instagram.com/me/media?` +
        new URLSearchParams({
            fields: 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp',
            limit: String(Math.min(limit, 100)),
            access_token: accessToken,
        }).toString()

    while (nextUrl && collected.length < limit) {
        const response: Response = await fetch(nextUrl)
        const payload = await response.json() as { data?: InstagramMediaItem[]; paging?: { next?: string } }

        if (!response.ok) {
            console.error(`[Instagram] Media import failed:`, JSON.stringify(payload))
            throw new Error(`Instagram media import failed: ${JSON.stringify(payload)}`)
        }

        const items = payload.data ?? []
        collected.push(...items)

        const next: string | undefined = payload.paging?.next
        nextUrl = typeof next === 'string' && collected.length < limit ? next : null
    }

    let importedPosts = 0

    // Insert brand-new posts
    const newItems = collected.filter((item) => item.id && !existingIds.has(item.id))
    if (newItems.length > 0) {
        const rowsToInsert = newItems.map((item) => ({
            brand_id: brandId,
            platform: 'instagram',
            platform_post_id: item.id,
            platform_post_url: item.permalink ?? null,
            published_at: item.timestamp ?? new Date().toISOString(),
            title: titleFromCaption(item.caption, item.media_type),
            caption: item.caption ?? null,
            media_type: item.media_product_type ?? item.media_type ?? null,
            thumbnail_url: thumbnailFor(item),
        }))

        const { error } = await supabase.from('published_posts').insert(rowsToInsert)
        if (error) throw new Error(`Failed to save imported Instagram posts: ${error.message}`)
        importedPosts = rowsToInsert.length
    }

    // Backfill metadata for existing posts that were imported before these columns existed
    const backfillItems = collected.filter((item) => item.id && needsBackfill.has(item.id))
    for (const item of backfillItems) {
        await supabase
            .from('published_posts')
            .update({
                title: titleFromCaption(item.caption, item.media_type),
                caption: item.caption ?? null,
                media_type: item.media_product_type ?? item.media_type ?? null,
                thumbnail_url: thumbnailFor(item),
            })
            .eq('brand_id', brandId)
            .eq('platform', 'instagram')
            .eq('platform_post_id', item.id)
    }

    // Always refresh thumbnail URLs for ALL fetched posts (Instagram CDN URLs expire ~7 days)
    // Only refresh posts that aren't brand new (already handled above)
    const refreshItems = collected.filter(
        (item) => item.id && existingIds.has(item.id) && !needsBackfill.has(item.id)
    )
    for (const item of refreshItems) {
        const freshThumb = thumbnailFor(item)
        if (freshThumb) {
            await supabase
                .from('published_posts')
                .update({ thumbnail_url: freshThumb })
                .eq('brand_id', brandId)
                .eq('platform', 'instagram')
                .eq('platform_post_id', item.id)
        }
    }

    return {
        importedPosts,
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
        // Fetch basic post metadata (likes, comments, media_type)
        const mediaRes = await fetch(
            `https://graph.instagram.com/v21.0/${platformPostId}?fields=like_count,comments_count,media_type&access_token=${accessToken}`
        )
        const mediaData = await mediaRes.json()
        const isVideo = mediaData.media_type === 'VIDEO' || mediaData.media_type === 'REELS'

        // Fetch insights
        const metricsToFetch = ['reach', 'saved']
        if (isVideo) {
            metricsToFetch.push('video_views')
            metricsToFetch.push('plays')
        } else {
            metricsToFetch.push('impressions')
        }

        const insightsRes = await fetch(
            `https://graph.instagram.com/v21.0/${platformPostId}/insights?metric=${metricsToFetch.join(',')}&period=lifetime&access_token=${accessToken}`
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
            insightsData.data.forEach((m: { name: string; values?: Array<{ value: number }>; value?: number }) => {
                // Instagram API can return value directly or in values[0]
                const value = m.value ?? m.values?.[0]?.value ?? 0
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
        console.error('[Instagram] Error fetching metrics:', error)
        return { likes: 0, comments: 0, shares: 0, saves: 0, reach: 0, impressions: 0, views: 0 }
    }
}

export interface ChannelStats {
    platform: string
    username: string | null
    displayName: string | null
    followers: number | null
    posts: number | null
    totalViews: number | null
    profilePictureUrl: string | null
}

export async function getInstagramChannelStats(brandId: string): Promise<ChannelStats | null> {
    const supabase = createAdminClient()
    const { data: connections } = await supabase
        .from('platform_connections')
        .select('access_token')
        .eq('brand_id', brandId)
        .eq('platform', 'instagram')
        .eq('is_active', true)
        .limit(1)

    const token = connections?.[0]?.access_token
    if (!token) return null

    const res = await fetch(
        `https://graph.instagram.com/me?fields=id,username,name,followers_count,media_count,profile_picture_url&access_token=${token}`
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.error) return null

    return {
        platform: 'instagram',
        username: data.username || null,
        displayName: data.name || null,
        followers: typeof data.followers_count === 'number' ? data.followers_count : null,
        posts: typeof data.media_count === 'number' ? data.media_count : null,
        totalViews: null,
        profilePictureUrl: data.profile_picture_url || null,
    }
}
