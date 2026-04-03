import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { chatWithAgencyLead } from '@/lib/agents/agency-lead'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: brands } = await supabase.from('brands').select('id').limit(1)
  const defaultBrandId = brands?.[0]?.id

  if (!defaultBrandId) {
    return Response.json({ error: 'No brand found' }, { status: 400 })
  }

  const { message, history, brandId: bodyBrandId } = await request.json()

  if (!message) {
    return Response.json({ error: 'Message is required' }, { status: 400 })
  }

  try {
    const brandId = bodyBrandId || defaultBrandId
    const response = await chatWithAgencyLead(brandId, message, history || [])
    return Response.json({ response })
  } catch (error) {
    console.error('Agency Lead Chat Error:', error)
    return Response.json({ error: 'Failed to chat with lead' }, { status: 500 })
  }
}

