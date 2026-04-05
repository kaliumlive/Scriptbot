import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import RunAnalyticsButton from '@/components/analytics/RunAnalyticsButton'
import PerformanceDashboard from '@/components/analytics/PerformanceDashboard'
import { AlertCircle, Layers } from 'lucide-react'
import Link from 'next/link'
import { hasRealSupabaseServiceRoleKey } from '@/lib/utils/app-origin'
import { getInstagramChannelStats } from '@/lib/platforms/instagram'
import { getYouTubeChannelStats } from '@/lib/platforms/youtube'
import type { ChannelStats } from '@/lib/platforms/instagram'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: brands } = await supabase.from('brands').select('id, name, handle').limit(1)
  const brand = brands?.[0]
  const brandId = brand?.id

  if (!brandId) return <div className="p-6 text-zinc-400">Brand not found</div>

  // Fetch everything in parallel
  const [
    { data: allPosts },
    { data: allSnapshots },
    { count: totalPostsCount },
    { data: activeConnections },
    { data: postLinks },
  ] = await Promise.all([
    supabase
      .from('published_posts')
      .select('*')
      .eq('brand_id', brandId)
      .order('published_at', { ascending: false })
      .limit(500),
    supabase
      .from('analytics_snapshots')
      .select('*')
      .eq('brand_id', brandId)
      .order('snapshot_at', { ascending: false }),
    supabase
      .from('published_posts')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId),
    supabase
      .from('platform_connections')
      .select('platform')
      .eq('brand_id', brandId)
      .eq('is_active', true),
    // post_links may not exist yet if migration hasn't run — that's fine
    Promise.resolve(
      createAdminClient()
        .from('post_links')
        .select('post_id_a, post_id_b')
        .eq('brand_id', brandId)
    ).then(r => ({ data: r.data ?? [] })).catch(() => ({ data: [] })),
  ])

  // Fetch channel stats for each connected platform (best-effort, never crash)
  const channelStats: ChannelStats[] = []
  for (const conn of activeConnections ?? []) {
    try {
      if (conn.platform === 'instagram') {
        const s = await getInstagramChannelStats(brandId)
        if (s) channelStats.push(s)
      } else if (conn.platform === 'youtube') {
        const s = await getYouTubeChannelStats(brandId)
        if (s) channelStats.push(s)
      }
    } catch { /* ignore — channel stats are non-critical */ }
  }

  type SnapshotRecord = {
    published_post_id: string
    likes: number
    comments: number
    reach: number
    shares: number
    saves: number
    views: number
    impressions: number
    ai_insights?: string
  }

  // Build latest + previous snapshots per post
  const latestSnapshots = new Map<string, SnapshotRecord>()
  const previousSnapshots = new Map<string, SnapshotRecord>()
  allSnapshots?.forEach((s: SnapshotRecord) => {
    if (!latestSnapshots.has(s.published_post_id)) {
      latestSnapshots.set(s.published_post_id, s)
    } else if (!previousSnapshots.has(s.published_post_id)) {
      previousSnapshots.set(s.published_post_id, s)
    }
  })

  // Aggregate totals
  const aggregateStats = {
    totalReach: 0, totalEngagement: 0, totalViews: 0,
    totalPosts: totalPostsCount || 0, growthRate: 0,
    reachTrend: 0, engagementTrend: 0, postTrend: 0,
  }
  let previousReach = 0
  let previousEngagement = 0

  latestSnapshots.forEach((s) => {
    aggregateStats.totalReach += s.reach || 0
    aggregateStats.totalViews += s.views || 0
    aggregateStats.totalEngagement += (s.likes || 0) + (s.comments || 0) + (s.shares || 0) + (s.saves || 0)
  })
  previousSnapshots.forEach((s) => {
    previousReach += s.reach || 0
    previousEngagement += (s.likes || 0) + (s.comments || 0) + (s.shares || 0) + (s.saves || 0)
  })

  const currentReach = aggregateStats.totalReach
  const currentEngagement = aggregateStats.totalEngagement
  aggregateStats.reachTrend = previousReach > 0
    ? Number((((currentReach - previousReach) / previousReach) * 100).toFixed(1)) : 0
  aggregateStats.engagementTrend = previousEngagement > 0
    ? Number((((currentEngagement - previousEngagement) / previousEngagement) * 100).toFixed(1)) : 0
  aggregateStats.growthRate = aggregateStats.reachTrend

  type PostRecord = {
    id: string
    platform: string
    platform_post_id?: string
    platform_post_url?: string
    title?: string
    caption?: string
    media_type?: string
    thumbnail_url?: string
    published_at?: string
    created_at: string
  }

  type EnrichedPost = {
    id: string
    platform: string
    platform_post_id: string
    platform_post_url: string | null
    title: string | null
    caption: string | null
    media_type: string | null
    thumbnail_url: string | null
    likes: number
    comments: number
    shares: number
    saves: number
    reach: number
    views: number
    impressions: number
    published_at: string
    crossPostedTo: string[]
    linkedPostIds: string[]
  }

  type PostWithoutCross = Omit<EnrichedPost, 'crossPostedTo' | 'linkedPostIds'>

  // Build enriched post data
  const postsData: PostWithoutCross[] = (allPosts ?? []).map((post: PostRecord) => {
    const s = latestSnapshots.get(post.id) || { likes: 0, comments: 0, reach: 0, shares: 0, saves: 0, views: 0, impressions: 0 }
    return {
      id: post.id,
      platform: post.platform,
      platform_post_id: post.platform_post_id || '',
      platform_post_url: post.platform_post_url || null,
      title: post.title || null,
      caption: post.caption || null,
      media_type: post.media_type || null,
      thumbnail_url: post.thumbnail_url || null,
      likes: s.likes || 0,
      comments: s.comments || 0,
      shares: s.shares || 0,
      saves: s.saves || 0,
      reach: s.reach || 0,
      views: s.views || 0,
      impressions: s.impressions || 0,
      published_at: post.published_at || post.created_at,
    }
  })

  // Build cross-post map — combines auto-detection (title match) + manual links

  function normalizeTitle(title: string): string {
    return title.toLowerCase()
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ').trim()
  }

  const postById = new Map(postsData.map(p => [p.id, p]))

  // Auto: group by normalized title
  const titleGroups = new Map<string, PostWithoutCross[]>()
  for (const post of postsData) {
    if (!post.title) continue
    const key = normalizeTitle(post.title)
    if (!key) continue
    titleGroups.set(key, [...(titleGroups.get(key) || []), post])
  }

  const crossPostMap = new Map<string, string[]>()   // postId → other platforms
  const linkedPostsMap = new Map<string, string[]>() // postId → linked postIds

  for (const group of titleGroups.values()) {
    if (group.length > 1) {
      const platforms = group.map(p => p.platform)
      for (const post of group) {
        crossPostMap.set(post.id, platforms.filter(pl => pl !== post.platform))
        linkedPostsMap.set(post.id, group.filter(p => p.id !== post.id).map(p => p.id))
      }
    }
  }

  // Manual links: merge into the same maps
  for (const link of (postLinks as { post_id_a: string; post_id_b: string }[] | null) ?? []) {
    const postA = postById.get(link.post_id_a)
    const postB = postById.get(link.post_id_b)
    if (!postA || !postB) continue

    // Cross-platform list
    const aList = crossPostMap.get(link.post_id_a) || []
    if (!aList.includes(postB.platform)) crossPostMap.set(link.post_id_a, [...aList, postB.platform])
    const bList = crossPostMap.get(link.post_id_b) || []
    if (!bList.includes(postA.platform)) crossPostMap.set(link.post_id_b, [...bList, postA.platform])

    // Linked post IDs
    const aLinked = linkedPostsMap.get(link.post_id_a) || []
    if (!aLinked.includes(link.post_id_b)) linkedPostsMap.set(link.post_id_a, [...aLinked, link.post_id_b])
    const bLinked = linkedPostsMap.get(link.post_id_b) || []
    if (!bLinked.includes(link.post_id_a)) linkedPostsMap.set(link.post_id_b, [...bLinked, link.post_id_a])
  }

  const enrichedPosts: EnrichedPost[] = postsData.map((post: PostWithoutCross) => ({
    ...post,
    crossPostedTo: crossPostMap.get(post.id) || [],
    linkedPostIds: linkedPostsMap.get(post.id) || [],
  }))

  // Only show the AI insight if it's a real generated insight (not just placeholder text)
  const rawInsight = allSnapshots?.find((s: SnapshotRecord) => s.ai_insights)?.ai_insights
  const aiInsight = rawInsight && !rawInsight.includes('Sync Platforms') ? rawInsight : undefined

  const activePlatformNames = activeConnections?.map((c: { platform: string }) => c.platform) || []
  const hasServiceRoleKey = hasRealSupabaseServiceRoleKey()
  const showNoConnectionsState = activePlatformNames.length === 0
  const showNoPostsState = !showNoConnectionsState && aggregateStats.totalPosts === 0

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 min-h-screen bg-[#050505]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Autonomous Intelligence</span>
          </div>
          <h1 className="text-4xl font-extrabold text-zinc-50 tracking-tighter sm:text-5xl">
            Performance <span className="text-zinc-500">Command Center</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-3 max-w-xl leading-relaxed">
            Real-time engagement tracking across connected platforms. Sync Platforms imports post history and refreshes analytics.
          </p>
        </div>
        <RunAnalyticsButton brandId={brandId} />
      </div>

      {!hasServiceRoleKey && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 ring-1 ring-amber-500/30">
          <AlertCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-black text-amber-200 uppercase tracking-[0.1em] mb-1">Backend Config Blocking Sync</h2>
            <p className="text-sm text-amber-100/90 leading-relaxed">
              SUPABASE_SERVICE_ROLE_KEY is missing or matches the anon key. Analytics imports will not be reliable.
            </p>
          </div>
        </div>
      )}

      {showNoConnectionsState && (
        <div className="flex items-start justify-between gap-6 bg-zinc-900/70 border border-white/5 rounded-3xl p-6">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">No platforms connected</h2>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Connect Instagram or YouTube first, then click Sync Platforms to import your post history.
            </p>
          </div>
          <Link href="/settings/connections"
            className="shrink-0 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-colors">
            Open Connections
          </Link>
        </div>
      )}

      {showNoPostsState && (
        <div className="flex items-start gap-3 bg-zinc-900/70 border border-white/5 rounded-3xl p-6">
          <AlertCircle className="w-5 h-5 text-indigo-300 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-bold text-white">No imported posts yet</h2>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Connected: {activePlatformNames.join(', ')}. Click <strong className="text-zinc-200">Sync Platforms</strong> to import post history.
            </p>
          </div>
        </div>
      )}

      <PerformanceDashboard
        stats={aggregateStats}
        posts={enrichedPosts}
        channelStats={channelStats}
        brandId={brandId}
        aiInsight={aiInsight}
      />
    </div>
  )
}
