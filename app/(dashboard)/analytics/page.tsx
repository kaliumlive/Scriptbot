import { createClient } from '@/lib/supabase/server'
import RunAnalyticsButton from '@/components/analytics/RunAnalyticsButton'
import PerformanceDashboard from '@/components/analytics/PerformanceDashboard'
import { AlertCircle, Layers } from 'lucide-react'
import Link from 'next/link'
import { hasRealSupabaseServiceRoleKey } from '@/lib/utils/app-origin'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: brands } = await supabase.from('brands').select('id, name, handle').limit(1)
  const brand = brands?.[0]
  const brandId = brand?.id

  if (!brandId) return <div className="p-6 text-zinc-400">Brand not found</div>

  // 1. Fetch latest published posts for the table
  const { data: recentPosts } = await supabase
    .from('published_posts')
    .select('*')
    .eq('brand_id', brandId)
    .order('published_at', { ascending: false })
    .limit(10)

  const [{ data: allSnapshots }, { count: totalPostsCount }, { data: activeConnections }] = await Promise.all([
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
  ])

  // 2. Fetch recent post snapshots for the table
  const recentPostIds = recentPosts?.map((p: { id: string }) => p.id) || []
  const { data: recentSnapshots } = await supabase
    .from('analytics_snapshots')
    .select('*')
    .in('published_post_id', recentPostIds)
    .order('snapshot_at', { ascending: false })

  type SnapshotRecord = {
    published_post_id: string
    likes: number
    comments: number
    reach: number
    shares: number
    saves: number
    views: number
  }

  const latestSnapshots = new Map<string, SnapshotRecord>()
  const previousSnapshots = new Map<string, SnapshotRecord>()
  allSnapshots?.forEach((s: SnapshotRecord) => {
    if (!latestSnapshots.has(s.published_post_id)) {
      latestSnapshots.set(s.published_post_id, s)
    } else if (!previousSnapshots.has(s.published_post_id)) {
      previousSnapshots.set(s.published_post_id, s)
    }
  })

  const latestRecentSnapshots = new Map<string, SnapshotRecord>()
  recentSnapshots?.forEach((s: SnapshotRecord) => {
    if (!latestRecentSnapshots.has(s.published_post_id)) {
      latestRecentSnapshots.set(s.published_post_id, s)
    }
  })

  // 3. Aggregate stats
  const aggregateStats = {
    totalReach: 0,
    totalEngagement: 0,
    totalPosts: totalPostsCount || 0,
    growthRate: 0,
    reachTrend: 0,
    engagementTrend: 0,
    postTrend: 0,
  }

  let previousReach = 0
  let previousEngagement = 0

  const recentPostsData = recentPosts?.map((post: { id: string, platform: string, platform_post_id?: string, title?: string, published_at?: string, created_at: string }) => {
    const s = latestRecentSnapshots.get(post.id) || { likes: 0, comments: 0, reach: 0, shares: 0, saves: 0, views: 0 }
    const likes = s.likes || 0
    const comments = s.comments || 0
    const reach = s.reach || 0
    const shares = s.shares || 0
    const saves = s.saves || 0

    return {
      id: post.id,
      platform: post.platform,
      title: post.title || `${post.platform} post ${post.platform_post_id?.slice(0, 8) || post.id.slice(0, 8)}`,
      likes,
      comments,
      shares,
      saves,
      reach,
      views: s.views || 0,
      published_at: post.published_at || post.created_at
    }
  }) || []

  latestSnapshots.forEach((s) => {
    aggregateStats.totalReach += s.reach || 0
    aggregateStats.totalEngagement += (s.likes || 0) + (s.comments || 0) + (s.shares || 0) + (s.saves || 0)
  })

  previousSnapshots.forEach((s) => {
    previousReach += s.reach || 0
    previousEngagement += (s.likes || 0) + (s.comments || 0) + (s.shares || 0) + (s.saves || 0)
  })

  const currentReach = aggregateStats.totalReach
  const currentEngagement = aggregateStats.totalEngagement
  aggregateStats.reachTrend = previousReach > 0
    ? Number((((currentReach - previousReach) / previousReach) * 100).toFixed(1))
    : 0
  aggregateStats.engagementTrend = previousEngagement > 0
    ? Number((((currentEngagement - previousEngagement) / previousEngagement) * 100).toFixed(1))
    : 0
  aggregateStats.growthRate = aggregateStats.reachTrend
  aggregateStats.postTrend = 0

  // Get AI insight from the latest global snapshot or most recent post insight
  const aiInsight = allSnapshots?.[0]?.ai_insights || "Your autonomous agency is tracking performance. Sync Platforms will import connected post history and refresh your latest metrics."
  const activePlatformNames = activeConnections?.map((connection: { platform: string }) => connection.platform) || []
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
            Real-time engagement tracking across connected platforms. Sync Platforms imports supported post history first, then refreshes analytics snapshots for the tracked posts.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <RunAnalyticsButton brandId={brandId} />
        </div>
      </div>

      {!hasServiceRoleKey && (
        <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 ring-1 ring-amber-500/30">
          <AlertCircle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-black text-amber-200 uppercase tracking-[0.1em] mb-1">Backend Config Blocking Sync</h2>
            <p className="text-sm text-amber-100/90 leading-relaxed">
              `SUPABASE_SERVICE_ROLE_KEY` is missing or matches the anon key. Analytics imports and background snapshots will not be reliable until that is fixed.
            </p>
          </div>
        </div>
      )}

      {showNoConnectionsState && (
        <div className="flex items-start justify-between gap-6 bg-zinc-900/70 border border-white/5 rounded-3xl p-6">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white">No platforms connected</h2>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Analytics is wired correctly, but there is nothing to import yet. Connect Instagram or YouTube first. Historical import currently runs for Instagram and YouTube; TikTok and LinkedIn still need their backfill implementation.
            </p>
          </div>
          <Link
            href="/settings/connections"
            className="shrink-0 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
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
              Connected platforms: {activePlatformNames.join(', ')}. Click <strong className="text-zinc-200">Sync Platforms</strong> to import post history, then refresh analytics snapshots for those posts.
            </p>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <PerformanceDashboard 
        stats={aggregateStats}
        recentPosts={recentPostsData}
        aiInsight={aiInsight}
      />
    </div>
  )
}
