import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { postIdA, postIdB } = await request.json() as { postIdA: string; postIdB: string }
    if (!postIdA || !postIdB || postIdA === postIdB) {
      return Response.json({ error: 'Invalid post IDs' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verify both posts exist and belong to the same brand
    const { data: posts } = await supabase
      .from('published_posts')
      .select('id, brand_id')
      .in('id', [postIdA, postIdB])

    if (!posts || posts.length !== 2) {
      return Response.json({ error: 'Posts not found' }, { status: 404 })
    }
    if (posts[0].brand_id !== posts[1].brand_id) {
      return Response.json({ error: 'Posts belong to different brands' }, { status: 400 })
    }

    // Store with alphabetical ordering so (A,B) and (B,A) map to the same row
    const a = postIdA < postIdB ? postIdA : postIdB
    const b = postIdA < postIdB ? postIdB : postIdA

    await supabase.from('post_links').upsert(
      { brand_id: posts[0].brand_id, post_id_a: a, post_id_b: b },
      { onConflict: 'post_id_a,post_id_b', ignoreDuplicates: true }
    )

    return Response.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to link posts'
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { postIdA, postIdB } = await request.json() as { postIdA: string; postIdB: string }
    if (!postIdA || !postIdB) {
      return Response.json({ error: 'Invalid post IDs' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const a = postIdA < postIdB ? postIdA : postIdB
    const b = postIdA < postIdB ? postIdB : postIdA

    await supabase.from('post_links').delete()
      .eq('post_id_a', a)
      .eq('post_id_b', b)

    return Response.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to unlink posts'
    return Response.json({ error: msg }, { status: 500 })
  }
}
