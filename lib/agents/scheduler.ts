import { createClient } from '@/lib/supabase/server'
import { addDays, setHours, setMinutes } from 'date-fns'

export async function runScheduler(brandId: string) {
    const supabase = await createClient()

    const { data: drafts } = await supabase
        .from('content_drafts')
        .select('*')
        .eq('brand_id', brandId)
        .eq('status', 'approved')

    if (!drafts || drafts.length === 0) return { scheduledCount: 0 }

    for (const draft of drafts) {
        const nextSlot = addDays(new Date(), 1)
        const scheduledAt = setMinutes(setHours(nextSlot, 9), 0)

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
