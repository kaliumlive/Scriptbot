import { createAdminClient } from '@/lib/supabase/admin'

export async function logAgentStart(agentName: string, brandId?: string): Promise<string> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('agent_logs')
    .insert({
      agent_name: agentName,
      brand_id: brandId ?? null,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  return data?.id ?? ''
}

export async function logAgentComplete(
  logId: string,
  startedAt: number,
  itemsProcessed: number,
  tokensUsed?: number,
  metadata?: Record<string, unknown>
) {
  if (!logId) return
  const supabase = createAdminClient()
  await supabase
    .from('agent_logs')
    .update({
      status: 'complete',
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
      items_processed: itemsProcessed,
      tokens_used: tokensUsed ?? 0,
      metadata: metadata ?? {},
    })
    .eq('id', logId)
}

export async function logAgentError(logId: string, startedAt: number, error: string) {
  if (!logId) return
  const supabase = createAdminClient()
  await supabase
    .from('agent_logs')
    .update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
      error_message: error,
    })
    .eq('id', logId)
}
