import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithAgencyLead } from '@/lib/agents/agency-lead'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message, history, brandId: bodyBrandId } = await request.json()

    if (!message) {
        return Response.json({ error: 'Message is required' }, { status: 400 })
    }

    try {
        const brandId = bodyBrandId || '253b5cdf-1bcc-4d59-973a-b51da740dfdb'
        const response = await chatWithAgencyLead(brandId, message, history || [])
        return Response.json({ response })
    } catch (error) {
        console.error('Agency Lead Chat Error:', error)
        return Response.json({ error: 'Failed to chat with lead' }, { status: 500 })
    }
}
