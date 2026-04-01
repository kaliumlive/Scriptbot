import { createClient } from '@/lib/supabase/server'

export async function postToInstagram(brandId: string, draftId: string) {
    const supabase = await createClient()

    const { data: connection } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('brand_id', brandId)
        .eq('platform', 'instagram')
        .single()

    if (!connection?.access_token || !connection?.external_account_id) {
        throw new Error('Instagram Business account not connected.')
    }

    const { data: draft } = await supabase
        .from('content_drafts')
        .select('*')
        .eq('id', draftId)
        .single()

    if (!draft) throw new Error('Draft not found.')

    const igId = connection.external_account_id
    const accessToken = connection.access_token
    const caption = `${draft.title}\n\n${draft.script}\n\n${(draft.hashtags || []).join(' ')}`

    // Find the media URL (Try repurpose job first, then slides, then a placeholder)
    let mediaUrl = ''
    let mediaType: 'REELS' | 'IMAGE' = 'REELS'

    const { data: job } = await supabase
        .from('video_repurpose_jobs')
        .select('video_storage_path')
        .eq('draft_id', draftId)
        .single()

    if (job?.video_storage_path) {
        // Construct public URL from storage (assuming Supabase)
        const { data: publicData } = supabase.storage
          .from('videos')
          .getPublicUrl(job.video_storage_path)
        mediaUrl = publicData.publicUrl
        mediaType = 'REELS'
    } else if (draft.carousel_slides?.length > 0) {
        mediaUrl = draft.carousel_slides[0].image_url
        mediaType = 'IMAGE'
    }

    if (!mediaUrl) {
        // Placeholder if no media found (for testing/agent-only flows)
        mediaUrl = 'https://picsum.photos/1080/1920' 
        mediaType = 'IMAGE'
    }

    console.log(`Publishing to IG (${mediaType}): ${mediaUrl}`)

    // 1. Create Media Container
    const containerParams = new URLSearchParams({
        access_token: accessToken,
        caption,
        ...(mediaType === 'REELS' ? { video_url: mediaUrl, media_type: 'REELS' } : { image_url: mediaUrl })
    })

    const containerRes = await fetch(
        `https://graph.facebook.com/v19.0/${igId}/media?${containerParams.toString()}`,
        { method: 'POST' }
    )
    const containerData = await containerRes.json()
    if (!containerRes.ok) throw new Error(`IG Container Error: ${JSON.stringify(containerData)}`)

    const creationId = containerData.id

    // 2. Poll for processing (if video)
    if (mediaType === 'REELS') {
        let status = 'IN_PROGRESS'
        let attempts = 0
        while (status !== 'FINISHED' && attempts < 10) {
            await new Promise(r => setTimeout(r, 10000)) // 10s
            const statusRes = await fetch(
                `https://graph.facebook.com/v19.0/${creationId}?fields=status_code&access_token=${accessToken}`
            )
            const statusData = await statusRes.json()
            status = statusData.status_code
            if (status === 'ERROR') throw new Error('IG Media processing failed')
            attempts++
        }
    }

    // 3. Publish Media
    const publishRes = await fetch(
        `https://graph.facebook.com/v19.0/${igId}/media_publish?` +
        new URLSearchParams({ creation_id: creationId, access_token: accessToken }).toString(),
        { method: 'POST' }
    )
    const publishData = await publishRes.json()
    if (!publishRes.ok) throw new Error(`IG Publish Error: ${JSON.stringify(publishData)}`)

    // Log completion for debugging
    console.log(`Instagram publication complete for brand ${brandId}. Post ID: ${publishData.id}`)
    return {
        platform_post_id: publishData.id,
        platform_post_url: `https://www.instagram.com/reels/${publishData.id}/`
    }
}

export async function getInstagramMetrics() {
    return { likes: 0, views: 0, shares: 0 }
}
