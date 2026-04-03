import { createAdminClient } from '@/lib/supabase/admin'

export async function getTikTokMetrics(brandId: string, platformPostId: string) {
    const supabase = createAdminClient()

    const { data: connection } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('brand_id', brandId)
        .eq('platform', 'tiktok')
        .single()

    if (!connection?.access_token) {
        throw new Error('TikTok connection not found or expired.')
    }

    const accessToken = connection.access_token

    try {
        const res = await fetch('https://open.tiktokapis.com/v2/video/query/?fields=id,like_count,comment_count,share_count,view_count', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filters: { video_ids: [platformPostId] } }),
        })

        const data = await res.json()
        const video = data.data?.videos?.[0]

        return {
            likes: video?.like_count || 0,
            comments: video?.comment_count || 0,
            shares: video?.share_count || 0,
            saves: 0,
            reach: 0,
            impressions: 0,
            views: video?.view_count || 0,
        }
    } catch (error) {
        console.error('Error fetching TikTok metrics:', error)
        return { likes: 0, comments: 0, shares: 0, saves: 0, reach: 0, impressions: 0, views: 0 }
    }
}
