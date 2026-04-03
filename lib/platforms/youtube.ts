import { createAdminClient } from '@/lib/supabase/admin'

interface ImportResult {
    importedPosts: number
    scannedPosts: number
}

interface YouTubePlaylistItem {
    snippet?: {
        title?: string
        publishedAt?: string
        resourceId?: { videoId?: string }
    }
    contentDetails?: { videoPublishedAt?: string }
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

    const channelsRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    })
    const channelsData = await channelsRes.json()

    if (!channelsRes.ok) {
        throw new Error(`YouTube channel import failed: ${JSON.stringify(channelsData)}`)
    }

    const uploadsPlaylistId = channelsData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
    if (!uploadsPlaylistId) return { importedPosts: 0, scannedPosts: 0 }

    const existingResult = await supabase
        .from('published_posts')
        .select('platform_post_id')
        .eq('brand_id', brandId)
        .eq('platform', 'youtube')

    const existingIds = new Set(
        (existingResult.data ?? [])
            .map((row: { platform_post_id: string | null }) => row.platform_post_id)
            .filter(Boolean)
    )

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

    const rowsToInsert = collected
        .map((item) => {
            const videoId = item.snippet?.resourceId?.videoId
            if (!videoId || existingIds.has(videoId)) return null
            return {
                brand_id: brandId,
                platform: 'youtube',
                platform_post_id: videoId,
                platform_post_url: `https://www.youtube.com/watch?v=${videoId}`,
                published_at: item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt || new Date().toISOString(),
            }
        })
        .filter(Boolean) as Array<Record<string, string>>

    if (rowsToInsert.length > 0) {
        const { error } = await supabase.from('published_posts').insert(rowsToInsert)
        if (error) throw new Error(`Failed to save imported YouTube posts: ${error.message}`)
    }

    return { importedPosts: rowsToInsert.length, scannedPosts: collected.length }
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
    if (new Date(connection.token_expires_at) < new Date()) {
        try { accessToken = await refreshYouTubeToken(connection.refresh_token, brandId) }
        catch (e) { console.error('YouTube refresh token failed:', e); throw e }
    }

    try {
        const res = await fetch(`https://youtube.googleapis.com/youtube/v3/videos?part=statistics&id=${platformPostId}`, {
            headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        })
        const data = await res.json()
        const stats = data.items?.[0]?.statistics

        return {
            likes: parseInt(stats?.likeCount || '0', 10),
            comments: parseInt(stats?.commentCount || '0', 10),
            shares: 0,
            saves: parseInt(stats?.favoriteCount || '0', 10),
            reach: 0,
            impressions: 0,
            views: parseInt(stats?.viewCount || '0', 10),
        }
    } catch (error) {
        console.error('Error fetching YouTube metrics:', error)
        return { likes: 0, comments: 0, shares: 0, saves: 0, reach: 0, impressions: 0, views: 0 }
    }
}
