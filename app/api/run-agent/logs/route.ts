import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId') || '253b5cdf-1bcc-4d59-973a-b51da740dfdb'
    const limit = parseInt(searchParams.get('limit') || '5')

    try {
        const { data: logs, error } = await supabase
            .from('agent_logs')
            .select('id, agent_name, status, started_at')
            .eq('brand_id', brandId)
            .order('started_at', { ascending: false })
            .limit(limit)

        if (error) throw error

        return Response.json({ logs })
    } catch (error) {
        console.error('Agent Logs Error:', error)
        return Response.json({ error: 'Failed to fetch agent logs' }, { status: 500 })
    }
}
