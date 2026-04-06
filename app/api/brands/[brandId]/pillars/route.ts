export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface PillarsPayload {
  content_pillars?: string[]
  off_limits_topics?: string
  example_posts?: string[]
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const { brandId } = await params
  const body = (await request.json().catch(() => ({}))) as PillarsPayload

  if (!brandId) {
    return Response.json({ error: 'brandId is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: brand, error: brandError } = await supabase
    .from('brands')
    .select('id')
    .eq('id', brandId)
    .single()

  if (brandError || !brand) {
    return Response.json({ error: 'Brand not found' }, { status: 404 })
  }

  const updates: Partial<PillarsPayload> = {}
  if (Array.isArray(body.content_pillars)) {
    updates.content_pillars = body.content_pillars.map(p => p.trim()).filter(Boolean)
  }
  if (typeof body.off_limits_topics === 'string') {
    updates.off_limits_topics = body.off_limits_topics.trim()
  }
  if (Array.isArray(body.example_posts)) {
    updates.example_posts = body.example_posts.map(p => p.trim()).filter(Boolean)
  }

  const { data, error } = await supabase
    .from('brands')
    .update(updates)
    .eq('id', brandId)
    .select('id, content_pillars, off_limits_topics, example_posts')
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ brand: data })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const { brandId } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('brands')
    .select('id, content_pillars, off_limits_topics, example_posts')
    .eq('id', brandId)
    .single()

  if (error || !data) {
    return Response.json({ error: 'Brand not found' }, { status: 404 })
  }

  return Response.json({ brand: data })
}
