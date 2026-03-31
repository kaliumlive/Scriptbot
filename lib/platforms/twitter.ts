import { createClient } from '@/lib/supabase/server'

export async function postToTwitter(brandId: string, draftId: string) {
    const supabase = await createClient()

    const { data: connection, error } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('brand_id', brandId)
        .eq('platform', 'twitter')
        .single()

    if (error || !connection) throw new Error('Twitter connection not found')

    console.log(`Posting to Twitter for brand ${brandId}: ${draftId}`)

    return {
        platform_post_id: `tw_${Math.random().toString(36).substring(7)}`,
        platform_post_url: `https://twitter.com/status/mock`,
    }
}

export async function getTwitterMetrics(_postId: string, _brandId: string) {
    return { likes: 0, views: 0, shares: 0 }
}
