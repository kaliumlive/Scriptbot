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

  // 1. Fetch latest published posts
  const { data: posts } = await supabase
    .from('published_posts')
    .select('*')
    .eq('brand_id', brandId)
    .order('published_at', { ascending: false })
    .limit(10)

  // 2. Fetch latest snapshot for each post to compute dashboard stats efficiently
  const postIds = posts?.map((p: { id: string }) => p.id) || []
  const { data: snapshots } = await supabase
    .from('analytics_snapshots')
    .select('*')
    .in('published_post_id', postIds)
    .order('snapshot_at', { ascending: false })

  // Deduplicate to get the latest snapshot per post
  const latestSnapshots = new Map<string, { published_post_id: string, likes: number, comments: number, reach: number, shares: number, saves: number, views: number }>()
  snapshots?.forEach((s: { published_post_id: string, likes: number, comments: number, reach: number, shares: number, saves: number, views: number }) => {
    if (!latestSnapshots.has(s.published_post_id)) {
      latestSnapshots.set(s.published_post_id, s)
    }
  })

  // 3. Aggregate stats
  const aggregateStats = {
    totalReach: 0,
    totalEngagement: 0,
    totalPosts: posts?.length || 0,
    growthRate: 15.2, // Placeholder until historical comparison is implemented
  }

  const recentPostsData = posts?.map((post: { id: string, platform: string, title: string, published_at?: string, created_at: string }) => {
    const s = latestSnapshots.get(post.id) || { likes: 0, comments: 0, reach: 0, shares: 0, saves: 0, views: 0 }
    const likes = s.likes || 0
    const comments = s.comments || 0
    const reach = s.reach || 0
    const shares = s.shares || 0
    const saves = s.saves || 0

    aggregateStats.totalReach += reach
    aggregateStats.totalEngagement += (likes + comments + shares + saves)

    return {
      id: post.id,
      platform: post.platform,
      title: post.title || 'Untitled Post',
      likes,
      comments,
      shares,
      saves,
      reach,
      views: s.views || 0,
      published_at: post.published_at || post.created_at
    }
  }) || []

  // Get AI insight from the latest global snapshot or most recent post insight
  const aiInsight = snapshots?.[0]?.ai_insights || "Your autonomous agency is tracking performance. Click 'Sync Platforms' to generate a fresh strategy update."

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
            Real-time engagement tracking across all connected platforms. Your AI agents are continuously monitoring metrics to optimize your content strategy.
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
