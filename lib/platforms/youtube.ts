import { createClient } from '@/lib/supabase/server'

export async function postToYouTube(brandId: string, draftId: string) {
    const supabase = await createClient()

    const { data: connection, error } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('brand_id', brandId)
        .eq('platform', 'youtube')
        .single()

    if (error || !connection) throw new Error('YouTube connection not found')

    if (new Date(connection.token_expires_at) < new Date()) {
        await refreshYouTubeToken(connection.refresh_token, brandId)
    }

    const { data: draft } = await supabase
        .from('content_drafts')
        .select('*')
        .eq('id', draftId)
        .single()

    if (!draft) throw new Error('Draft not found')

    console.log(`Uploading to YouTube for brand ${brandId}: ${draft.title}`)

    return {
        platform_post_id: `yt_${Math.random().toString(36).substring(7)}`,
        platform_post_url: `https://youtube.com/watch?v=mock`,
    }
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

    const supabase = await createClient()
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

export async function getYouTubeMetrics(_postId: string, _brandId: string) {
    return { likes: 0, views: 0, shares: 0 }
}
