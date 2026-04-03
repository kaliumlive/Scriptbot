import { createClient } from '@/lib/supabase/server'
import RunAnalyticsButton from '@/components/analytics/RunAnalyticsButton'
import PerformanceDashboard from '@/components/analytics/PerformanceDashboard'
import { Layers } from 'lucide-react'

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

  const [{ data: allSnapshots }, { count: totalPostsCount }] = await Promise.all([
    supabase
      .from('analytics_snapshots')
      .select('*')
      .eq('brand_id', brandId)
      .order('snapshot_at', { ascending: false }),
    supabase
      .from('published_posts')
      .select('id', { count: 'exact', head: true })
      .eq('brand_id', brandId),
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

      {/* Main Dashboard Content */}
      <PerformanceDashboard 
        stats={aggregateStats}
        recentPosts={recentPostsData}
        aiInsight={aiInsight}
      />
    </div>
  )
}
