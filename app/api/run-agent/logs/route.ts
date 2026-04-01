import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    let brandId = searchParams.get('brandId')
    
    if (!brandId) {
        const { data: brands } = await supabase.from('brands').select('id').limit(1)
        brandId = brands?.[0]?.id || ''
    }

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
