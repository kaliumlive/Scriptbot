import { createAdminClient } from '@/lib/supabase/admin'

function getNextScheduledSlot() {
    const nextSlot = new Date()
    nextSlot.setDate(nextSlot.getDate() + 1)
    nextSlot.setHours(9, 0, 0, 0)
    return nextSlot
}

export async function runScheduler(brandId: string) {
    const supabase = createAdminClient()

    const { data: drafts } = await supabase
        .from('content_drafts')
        .select('*')
        .eq('brand_id', brandId)
        .eq('status', 'approved')

    if (!drafts || drafts.length === 0) return { scheduledCount: 0 }

    for (const draft of drafts) {
        const scheduledAt = getNextScheduledSlot()

        const platforms = draft.platforms || ['youtube']

        for (const platform of platforms) {
            await supabase.from('scheduled_posts').insert({
                brand_id: brandId,
                draft_id: draft.id,
                platform,
                scheduled_at: scheduledAt.toISOString(),
                status: 'scheduled'
            })
        }

        await supabase.from('content_drafts').update({ status: 'scheduled' }).eq('id', draft.id)
    }

    return { scheduledCount: drafts.length }
}
