import { createClient } from '@/lib/supabase/server'

export async function postToLinkedIn(brandId: string, draftId: string) {
    const supabase = await createClient()

    const { data: connection, error } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('brand_id', brandId)
        .eq('platform', 'linkedin')
        .single()

    if (error || !connection) throw new Error('LinkedIn connection not found')

    if (new Date(connection.token_expires_at) < new Date()) {
        await refreshLinkedInToken(connection.refresh_token, brandId)
    }

    const { data: draft } = await supabase
        .from('content_drafts')
        .select('*')
        .eq('id', draftId)
        .single()

    if (!draft) throw new Error('Draft not found')

    console.log(`Posting to LinkedIn for brand ${brandId}: ${draft.title}`)

    return {
        platform_post_id: `li_${Math.random().toString(36).substring(7)}`,
        platform_post_url: `https://linkedin.com/posts/mock`,
    }
}

async function refreshLinkedInToken(refreshToken: string, brandId: string) {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: process.env.LINKEDIN_CLIENT_ID!,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
    })

    const tokens = await response.json()
    if (!response.ok) throw new Error('Failed to refresh LinkedIn token')

    const supabase = await createClient()
    await supabase
        .from('platform_connections')
        .update({
            access_token: tokens.access_token,
            token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq('brand_id', brandId)
        .eq('platform', 'linkedin')

    return tokens.access_token
}

export async function getLinkedInMetrics(_postId: string, _brandId: string) {
    return { likes: 0, views: 0, shares: 0 }
}
