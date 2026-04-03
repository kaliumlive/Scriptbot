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
    throw new Error('Twitter publishing is not implemented yet. Add the X posting flow before enabling the publisher.')
}

export async function getTwitterMetrics(_postId: string, _brandId: string) {
    return { likes: 0, views: 0, shares: 0 }
}
