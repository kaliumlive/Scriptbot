import { createClient } from '@/lib/supabase/server'
import { BarChart2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: brands } = await supabase.from('brands').select('id').limit(1)
  const brand = brands?.[0]

  const { data: posts } = brand
    ? await supabase
        .from('published_posts')
        .select('id, platform, platform_post_id, platform_post_url, published_at, title, thumbnail_url, caption')
        .eq('brand_id', brand.id)
        .order('published_at', { ascending: false })
        .limit(50)
    : { data: [] }

  return (
    <div className="p-7 max-w-3xl mx-auto">
      <div className="mb-7">
        <h1 className="text-xl font-bold text-zinc-50 tracking-tight font-display">Post History</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Posts imported from connected accounts · Analytics agent pulls metrics for each
        </p>
      </div>

      {!posts || posts.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-12 text-center">
          <BarChart2 className="w-8 h-8 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-zinc-400 font-medium mb-2">No posts imported yet</h3>
          <p className="text-zinc-600 text-sm max-w-sm mx-auto mb-6">
            Connect your Instagram account and run the Analytics agent to import your post history.
          </p>
          <Link
            href="/settings/connections"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2 hover:bg-violet-500/20 transition-colors cursor-pointer"
          >
            Connect accounts
          </Link>
        </div>
      ) : (
        <div className="space-y-1.5">
          {(posts as {
            id: string
            platform: string
            platform_post_id: string
            platform_post_url?: string | null
            published_at: string
            title?: string | null
            thumbnail_url?: string | null
            caption?: string | null
          }[]).map(post => (
            <div
              key={post.id}
              className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3 hover:border-white/[0.1] transition-colors"
            >
              {/* Thumbnail */}
              {post.thumbnail_url ? (
                <img
                  src={post.thumbnail_url}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover shrink-0 bg-zinc-800"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-zinc-800 shrink-0" />
              )}

              {/* Platform badge */}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                post.platform === 'instagram'
                  ? 'text-pink-400 bg-pink-500/10 border-pink-500/20'
                  : post.platform === 'youtube'
                    ? 'text-red-400 bg-red-500/10 border-red-500/20'
                    : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
              }`}>
                {post.platform.toUpperCase()}
              </span>

              {/* Title / caption / fallback ID */}
              <div className="flex-1 min-w-0">
                {post.title ? (
                  <p className="text-xs text-zinc-300 truncate font-medium">{post.title}</p>
                ) : post.caption ? (
                  <p className="text-xs text-zinc-400 truncate">{post.caption}</p>
                ) : (
                  <p className="text-xs text-zinc-600 font-mono truncate">{post.platform_post_id}</p>
                )}
              </div>

              <span className="text-xs text-zinc-700 tabular-nums shrink-0">
                {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>

              {post.platform_post_url && (
                <a
                  href={post.platform_post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-zinc-700 hover:text-zinc-400 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
