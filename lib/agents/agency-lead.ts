import { createAdminClient } from '@/lib/supabase/admin'
import { chatWithGroq } from '../ai/groq'

export interface AgencyContext {
    brandName: string
    niche: string
    recentDrafts: { title: string, status: string, created_at: string }[]
    recentLogs: { agent_name: string, status: string, started_at: string }[]
    latestAnalytics: { reach: number, likes: number, comments: number } | null
    connectedPlatforms: string[]
}

export async function getAgencyLeadContext(brandId: string): Promise<AgencyContext> {
    const supabase = createAdminClient()

    const { data: brand } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single()

    const { data: drafts } = await supabase
        .from('content_drafts')
        .select('title, status, created_at')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })
        .limit(3)

    const { data: logs } = await supabase
        .from('agent_logs')
        .select('agent_name, status, started_at')
        .eq('brand_id', brandId)
        .order('started_at', { ascending: false })
        .limit(5)

    const { data: snapshots } = await supabase
        .from('analytics_snapshots')
        .select('*')
        .eq('brand_id', brandId)
        .order('snapshot_at', { ascending: false })
        .limit(1)

    const { data: connections } = await supabase
        .from('platform_connections')
        .select('platform')
        .eq('brand_id', brandId)

    return {
        brandName: brand?.name || 'Unknown Brand',
        niche: brand?.niche || 'General',
        recentDrafts: drafts || [],
        recentLogs: logs || [],
        latestAnalytics: snapshots?.[0] || null,
        connectedPlatforms: connections?.map(c => c.platform) || []
    }
}

export async function chatWithAgencyLead(brandId: string, message: string, history: { role: 'user' | 'assistant', content: string }[]) {
    const context = await getAgencyLeadContext(brandId)
    
    const systemPrompt = `
    You are the Agency Lead at Scriptbot, a premier autonomous content agency for solo creators.
    Your job is to manage the user's brand and coordinate other agents (Trend Scout, Idea Generator, Video Repurposer).
    
    Current Brand Context:
    - Name: ${context.brandName}
    - Niche: ${context.niche}
    - Connected Platforms: ${context.connectedPlatforms.join(', ')}
    
    Agency Status:
    - Recent Drafts: ${JSON.stringify(context.recentDrafts)}
    - Recent Agent Activity: ${JSON.stringify(context.recentLogs)}
    
    Latest Performance:
    ${context.latestAnalytics ? `Reach: ${context.latestAnalytics.reach}, Engagement: ${context.latestAnalytics.likes + context.latestAnalytics.comments}` : 'No analytics data yet.'}
    
    Instructions:
    1. Be professional, strategic, and encouraging.
    2. Reference the current drafts or recent activity if relevant.
    3. If the user asks for ideas, recommend they use the "Ideate" section or ask you to trigger the Idea Generator.
    4. Keep responses concise (2-3 sentences mostly).
    5. You are the "Boss" and "Partner" to the creator.
    `

    const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
    ]

    const response = await chatWithGroq(messages as any)

    return response
}
