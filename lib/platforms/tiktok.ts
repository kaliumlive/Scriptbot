import { createClient } from '@/lib/supabase/server'

export async function postToTikTok(brandId: string, draftId: string) {
    const supabase = await createClient()

    const { data: connection, error } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('brand_id', brandId)
        .eq('platform', 'tiktok')
        .single()

    if (error || !connection) throw new Error('TikTok connection not found')

    console.log(`Posting to TikTok for brand ${brandId}: ${draftId}`)

    return {
        platform_post_id: `tt_${Math.random().toString(36).substring(7)}`,
        platform_post_url: `https://tiktok.com/video/mock`,
    }
}

export async function getTikTokMetrics(_postId: string, _brandId: string) {
    return { likes: 0, views: 0, shares: 0 }
}
