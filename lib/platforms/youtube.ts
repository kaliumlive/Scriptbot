import { createAdminClient } from '@/lib/supabase/admin'

interface ImportResult {
    importedPosts: number
    scannedPosts: number
}

interface YouTubeThumbnail {
    url?: string
    width?: number
    height?: number
}

interface YouTubePlaylistItem {
    snippet?: {
        title?: string
        publishedAt?: string
        resourceId?: { videoId?: string }
        thumbnails?: {
            maxres?: YouTubeThumbnail
            standard?: YouTubeThumbnail
            high?: YouTubeThumbnail
            medium?: YouTubeThumbnail
            default?: YouTubeThumbnail
        }
    }
    contentDetails?: { videoPublishedAt?: string }
}

/** Detect YouTube Shorts by title hashtag — duration-based detection would need extra API call */
function isYouTubeShort(title: string, _videoId: string): boolean {
    const t = title.toLowerCase()
    return t.includes('#shorts') || t.includes('#short') || t.includes('#ytshorts')
}

/** Pick the best available thumbnail URL from YouTube's thumbnail object */
function bestYouTubeThumbnail(thumbnails?: NonNullable<YouTubePlaylistItem['snippet']>['thumbnails']): string | null {
    if (!thumbnails) return null
    return (
        thumbnails.maxres?.url ||
        thumbnails.standard?.url ||
        thumbnails.high?.url ||
        thumbnails.medium?.url ||
        thumbnails.default?.url ||
        null
    )
}

export async function importYouTubePublishedPosts(brandId: string, limit: number = 100): Promise<ImportResult> {
    const supabase = createAdminClient()

    const { data: connection } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('brand_id', brandId)
        .eq('platform', 'youtube')
        .eq('is_active', true)
        .single()

    if (!connection?.access_token) {
        return { importedPosts: 0, scannedPosts: 0 }
    }

    let accessToken = connection.access_token
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
        accessToken = await refreshYouTubeToken(connection.refresh_token, brandId)
    }

    // Fetch the uploads playlist ID for this channel
    const channelsRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
    const channelsData = await channelsRes.json()

    if (!channelsRes.ok) {
        throw new Error(`YouTube channel import failed: ${JSON.stringify(channelsData)}`)
    }

    const uploadsPlaylistId = channelsData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
    if (!uploadsPlaylistId) return { importedPosts: 0, scannedPosts: 0 }

    // Fetch existing post IDs to skip duplicates, and those with null titles for backfill
    const existingResult = await supabase
        .from('published_posts')
        .select('platform_post_id, title')
        .eq('brand_id', brandId)
        .eq('platform', 'youtube')

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

    // Fetch playlist items — include snippet for title & thumbnails
    const collected: YouTubePlaylistItem[] = []
    let pageToken = ''

    while (collected.length < limit) {
        const params = new URLSearchParams({
            part: 'snippet,contentDetails',
            playlistId: uploadsPlaylistId,
            maxResults: String(Math.min(50, limit - collected.length)),
        })
        if (pageToken) params.set('pageToken', pageToken)

        const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`, {
            headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        })
        const payload = await response.json()

        if (!response.ok) throw new Error(`YouTube playlist import failed: ${JSON.stringify(payload)}`)

        const items = (payload.items as YouTubePlaylistItem[] | undefined) ?? []
        collected.push(...items)

        pageToken = payload.nextPageToken ?? ''
        if (!pageToken) break
    }

    let importedPosts = 0

    // Insert brand-new posts
    const newItems = collected.filter((item) => {
        const videoId = item.snippet?.resourceId?.videoId
        return videoId && !existingIds.has(videoId)
    })

    if (newItems.length > 0) {
        const rowsToInsert = newItems
            .map((item) => {
                const videoId = item.snippet?.resourceId?.videoId
                if (!videoId) return null
                const title = item.snippet?.title || 'YouTube Video'
                const isShort = isYouTubeShort(title, videoId)
                return {
                    brand_id: brandId,
                    platform: 'youtube',
                    platform_post_id: videoId,
                    platform_post_url: isShort
                        ? `https://www.youtube.com/shorts/${videoId}`
                        : `https://www.youtube.com/watch?v=${videoId}`,
                    published_at:
                        item.contentDetails?.videoPublishedAt ||
                        item.snippet?.publishedAt ||
                        new Date().toISOString(),
                    title,
                    media_type: isShort ? 'SHORT' : 'video',
                    thumbnail_url: bestYouTubeThumbnail(item.snippet?.thumbnails),
                }
            })
            .filter(Boolean) as Array<Record<string, string | null>>

        const { error } = await supabase.from('published_posts').insert(rowsToInsert)
        if (error) throw new Error(`Failed to save imported YouTube posts: ${error.message}`)
        importedPosts = rowsToInsert.length
    }

    // Backfill metadata for existing posts that were imported before title/thumbnail columns existed
    const backfillItems = collected.filter((item) => {
        const videoId = item.snippet?.resourceId?.videoId
        return videoId && needsBackfill.has(videoId)
    })

    for (const item of backfillItems) {
        const videoId = item.snippet?.resourceId?.videoId
        if (!videoId) continue
        const title = item.snippet?.title || 'YouTube Video'
        const isShort = isYouTubeShort(title, videoId)
        await supabase
            .from('published_posts')
            .update({
                title,
                media_type: isShort ? 'SHORT' : 'video',
                platform_post_url: isShort
                    ? `https://www.youtube.com/shorts/${videoId}`
                    : `https://www.youtube.com/watch?v=${videoId}`,
                thumbnail_url: bestYouTubeThumbnail(item.snippet?.thumbnails),
            })
            .eq('brand_id', brandId)
            .eq('platform', 'youtube')
            .eq('platform_post_id', videoId)
    }

    // YouTube thumbnails are stable (i.ytimg.com) but still refresh on sync
    // to pick up any re-uploaded thumbnails
    const refreshItems = collected.filter((item) => {
        const videoId = item.snippet?.resourceId?.videoId
        return videoId && existingIds.has(videoId) && !needsBackfill.has(videoId)
    })

    for (const item of refreshItems) {
        const videoId = item.snippet?.resourceId?.videoId
        if (!videoId) continue
        const freshThumb = bestYouTubeThumbnail(item.snippet?.thumbnails)
        if (freshThumb) {
            await supabase
                .from('published_posts')
                .update({ thumbnail_url: freshThumb })
                .eq('brand_id', brandId)
                .eq('platform', 'youtube')
                .eq('platform_post_id', videoId)
        }
    }

    return { importedPosts, scannedPosts: collected.length }
}

async function refreshYouTubeToken(refreshToken: string, brandId: string) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        body: new URLSearchParams({
            client_id: process.env.YOUTUBE_CLIENT_ID!,
            client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    })

    const tokens = await response.json()
    if (!response.ok) throw new Error('Failed to refresh YouTube token')

    const supabase = createAdminClient()
    await supabase
        .from('platform_connections')
        .update({
            access_token: tokens.access_token,
            token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('brand_id', brandId)
        .eq('platform', 'youtube')

    return tokens.access_token
}

export async function getYouTubeMetrics(brandId: string, platformPostId: string) {
    const supabase = createAdminClient()

    const { data: connection } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('brand_id', brandId)
        .eq('platform', 'youtube')
        .single()

    if (!connection?.access_token) {
        throw new Error('YouTube connection not found or expired.')
    }

    let accessToken = connection.access_token
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
        try {
            accessToken = await refreshYouTubeToken(connection.refresh_token, brandId)
        } catch (e) {
            console.error('[YouTube] Refresh token failed:', e)
            throw e
        }
    }

    try {
        const res = await fetch(
            `https://youtube.googleapis.com/youtube/v3/videos?part=statistics&id=${platformPostId}`,
            { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }
        )
        const data = await res.json()
        const stats = data.items?.[0]?.statistics

        return {
            likes: parseInt(stats?.likeCount || '0', 10),
            comments: parseInt(stats?.commentCount || '0', 10),
            shares: 0,
            saves: parseInt(stats?.favoriteCount || '0', 10),
            reach: 0,       // YouTube API does not expose reach without YouTube Analytics OAuth scope
            impressions: 0, // Same — not available via basic Data API
            views: parseInt(stats?.viewCount || '0', 10),
        }
    } catch (error) {
        console.error('[YouTube] Error fetching metrics:', error)
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

export async function getYouTubeChannelStats(brandId: string): Promise<ChannelStats | null> {
    const supabase = createAdminClient()
    const { data: connection } = await supabase
        .from('platform_connections')
        .select('access_token, refresh_token, token_expires_at')
        .eq('brand_id', brandId)
        .eq('platform', 'youtube')
        .eq('is_active', true)
        .single()

    if (!connection?.access_token) return null

    let accessToken = connection.access_token
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
        accessToken = await refreshYouTubeToken(connection.refresh_token, brandId)
    }

    const res = await fetch(
        'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
        { headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const channel = data.items?.[0]
    if (!channel) return null

    const stats = channel.statistics || {}
    return {
        platform: 'youtube',
        username: channel.snippet?.customUrl || null,
        displayName: channel.snippet?.title || null,
        followers: stats.hiddenSubscriberCount ? null : parseInt(stats.subscriberCount || '0', 10),
        posts: parseInt(stats.videoCount || '0', 10),
        totalViews: parseInt(stats.viewCount || '0', 10),
        profilePictureUrl: channel.snippet?.thumbnails?.default?.url || null,
    }
}
