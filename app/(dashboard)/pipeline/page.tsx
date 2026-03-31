import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import KanbanBoard from '@/components/pipeline/KanbanBoard'

export default async function PipelinePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  // if (!user) redirect('/login') — auth disabled

  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, handle')
    .eq('user_id', user.id)
    .limit(1)
  const brand = brands?.[0]

  if (!brand) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="border border-dashed border-zinc-700 rounded-xl p-12 text-center">
          <h3 className="text-zinc-300 font-medium mb-2">No brand set up</h3>
          <p className="text-zinc-500 text-sm mb-6">
            Create a brand first to see your content pipeline
          </p>
          <Link
            href="/brands/new"
            className="bg-zinc-50 text-zinc-950 text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Create brand
          </Link>
        </div>
      </div>
    )
  }

  const [{ data: ideas }, { data: drafts }, { data: approved }, { data: published }] =
    await Promise.all([
      supabase
        .from('content_ideas')
        .select('*')
        .eq('brand_id', brand.id)
        .eq('status', 'idea')
        .order('created_at', { ascending: false }),
      supabase
        .from('content_drafts')
        .select('*')
        .eq('brand_id', brand.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false }),
      supabase
        .from('content_drafts')
        .select('*')
        .eq('brand_id', brand.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false }),
      supabase
        .from('published_posts')
        .select('*, content_drafts(title)')
        .eq('brand_id', brand.id)
        .order('published_at', { ascending: false })
        .limit(10),
    ])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-50">Pipeline</h1>
        <p className="text-zinc-400 text-sm mt-0.5">
          {brand.handle ? `@${brand.handle}` : brand.name} · Idea → Draft → Approved → Published
        </p>
      </div>
      <KanbanBoard
        brandId={brand.id}
        ideas={ideas ?? []}
        drafts={drafts ?? []}
        approved={approved ?? []}
        published={published ?? []}
      />
    </div>
  )
}
