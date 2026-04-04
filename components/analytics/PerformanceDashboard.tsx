'use client'

import {
  BarChart3, TrendingUp, Eye, Heart, Bookmark,
  ArrowUpRight, ArrowDownRight, Zap, PlayCircle, ExternalLink,
  Copy, ImageOff, MessageCircle, Film, Trophy, ChevronDown
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'

interface PostData {
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
}

interface PerformanceDashboardProps {
  stats: {
    totalReach: number
    totalEngagement: number
    totalViews: number
    totalPosts: number
    growthRate: number
    reachTrend: number
    engagementTrend: number
    postTrend: number
  }
  posts: PostData[]
  aiInsight?: string
}

const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; glow: string }> = {
  youtube:   { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20',    dot: 'bg-red-500',    glow: 'shadow-red-500/20' },
  instagram: { bg: 'bg-pink-500/10',   text: 'text-pink-400',   border: 'border-pink-500/20',   dot: 'bg-gradient-to-br from-pink-500 to-purple-500', glow: 'shadow-pink-500/20' },
  tiktok:    { bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   border: 'border-cyan-500/20',   dot: 'bg-cyan-500',   glow: 'shadow-cyan-500/20' },
  twitter:   { bg: 'bg-sky-500/10',    text: 'text-sky-400',    border: 'border-sky-500/20',    dot: 'bg-sky-500',    glow: 'shadow-sky-500/20' },
  linkedin:  { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20',   dot: 'bg-blue-500',   glow: 'shadow-blue-500/20' },
}

const MEDIA_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  VIDEO:          { label: 'Video',    icon: Film },
  REELS:          { label: 'Reel',     icon: PlayCircle },
  IMAGE:          { label: 'Photo',    icon: ImageOff },
  CAROUSEL_ALBUM: { label: 'Carousel', icon: Copy },
  video:          { label: 'Video',    icon: Film },
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function engagementOf(p: PostData) {
  return p.likes + p.comments + p.saves
}

function PlatformBadge({ platform }: { platform: string }) {
  const c = PLATFORM_COLORS[platform] ?? { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700', dot: 'bg-zinc-500', glow: '' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {platform}
    </span>
  )
}

function ThumbnailCell({ post }: { post: PostData }) {
  const [imgError, setImgError] = useState(false)
  const isVideo = post.media_type === 'VIDEO' || post.media_type === 'REELS' || post.media_type === 'video'

  if (post.thumbnail_url && !imgError) {
    return (
      <div className="relative w-16 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800 border border-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" onError={() => setImgError(true)} />
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
              <PlayCircle className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-16 h-10 rounded-lg shrink-0 bg-zinc-800/80 border border-white/5 flex items-center justify-center">
      {isVideo ? <Film className="w-4 h-4 text-zinc-600" /> : <ImageOff className="w-4 h-4 text-zinc-600" />}
    </div>
  )
}

// ── Platform stat card ────────────────────────────────────────────────────────
function PlatformStatCard({
  platform, postCount, totalEngagement, totalViews, totalReach, avgEngagement, topPost
}: {
  platform: string
  postCount: number
  totalEngagement: number
  totalViews: number
  totalReach: number
  avgEngagement: number
  topPost: PostData | null
}) {
  const c = PLATFORM_COLORS[platform] ?? { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700', dot: 'bg-zinc-500', glow: '' }
  const showViews = platform === 'youtube' || totalViews > 0
  const showReach = platform === 'instagram' || totalReach > 0

  return (
    <div className={`relative rounded-2xl border ${c.border} ${c.bg} p-5 space-y-4 overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
          <span className={`text-sm font-black capitalize ${c.text} tracking-wide`}>{platform}</span>
        </div>
        <span className="text-zinc-500 text-xs font-semibold">{postCount} posts</span>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Engagement</div>
          <div className="text-xl font-bold text-white tabular-nums">{fmt(totalEngagement)}</div>
        </div>
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Avg / post</div>
          <div className="text-xl font-bold text-white tabular-nums">{fmt(Math.round(avgEngagement))}</div>
        </div>
        {showViews && (
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Views</div>
            <div className="text-xl font-bold text-white tabular-nums">{fmt(totalViews)}</div>
          </div>
        )}
        {showReach && (
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Reach</div>
            <div className="text-xl font-bold text-white tabular-nums">{totalReach > 0 ? fmt(totalReach) : <span className="text-zinc-600 text-sm">–</span>}</div>
          </div>
        )}
      </div>

      {/* Top post */}
      {topPost && (
        <div className={`rounded-xl border ${c.border} bg-black/20 p-3 space-y-1`}>
          <div className="flex items-center gap-1 mb-1">
            <Trophy className={`w-3 h-3 ${c.text}`} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${c.text}`}>Top Post</span>
          </div>
          <p className="text-white text-xs font-semibold leading-snug line-clamp-2">
            {topPost.title || topPost.platform_post_id.slice(0, 20)}
          </p>
          <div className={`text-[10px] ${c.text} font-bold`}>
            {fmt(engagementOf(topPost))} engagement
            {topPost.views > 0 && ` · ${fmt(topPost.views)} views`}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Cross-post comparison row ─────────────────────────────────────────────────
function CrossPostRow({ group }: { group: PostData[] }) {
  const title = group[0].title || group[0].platform_post_id.slice(0, 30)
  const thumb = group.find(p => p.thumbnail_url)

  return (
    <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4 space-y-3">
      {/* Title + thumbnail */}
      <div className="flex items-center gap-3">
        {thumb?.thumbnail_url && (
          <div className="w-14 h-9 rounded-lg overflow-hidden shrink-0 border border-white/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb.thumbnail_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Copy className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Cross-Posted</span>
          </div>
          <p className="text-zinc-100 text-sm font-semibold leading-snug line-clamp-1">{title}</p>
        </div>
      </div>

      {/* Per-platform comparison */}
      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${group.length}, 1fr)` }}>
        {group.map(post => {
          const c = PLATFORM_COLORS[post.platform] ?? { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700', dot: 'bg-zinc-500', glow: '' }
          const eng = engagementOf(post)
          const maxEng = Math.max(...group.map(engagementOf))
          const isWinner = eng === maxEng && maxEng > 0

          return (
            <div key={post.id} className={`rounded-xl border p-3 relative ${isWinner ? `${c.border} ${c.bg}` : 'border-white/5 bg-zinc-900/40'}`}>
              {isWinner && (
                <div className={`absolute -top-2 left-3 flex items-center gap-1 ${c.bg} ${c.border} border rounded-full px-2 py-0.5`}>
                  <Trophy className={`w-2.5 h-2.5 ${c.text}`} />
                  <span className={`text-[9px] font-black ${c.text} uppercase`}>Best</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 mb-2 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                <span className={`text-[10px] font-bold capitalize ${c.text}`}>{post.platform}</span>
              </div>
              <div className="space-y-1 text-xs tabular-nums">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Likes</span>
                  <span className="text-zinc-200 font-semibold">{fmt(post.likes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Comments</span>
                  <span className="text-zinc-200 font-semibold">{fmt(post.comments)}</span>
                </div>
                {post.views > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Views</span>
                    <span className="text-zinc-200 font-semibold">{fmt(post.views)}</span>
                  </div>
                )}
                {post.reach > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Reach</span>
                    <span className="text-zinc-200 font-semibold">{fmt(post.reach)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-white/5">
                  <span className="text-zinc-500">Total</span>
                  <span className={`font-black ${isWinner ? c.text : 'text-zinc-300'}`}>{fmt(eng)}</span>
                </div>
              </div>
              {post.platform_post_url && (
                <a href={post.platform_post_url} target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
                  <ExternalLink className="w-2.5 h-2.5" />
                  View post
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PerformanceDashboard({ stats, posts, aiInsight }: PerformanceDashboardProps) {
  const [expandedCaption, setExpandedCaption] = useState<string | null>(null)
  const [showAllPosts, setShowAllPosts] = useState(false)
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'likes' | 'views' | 'reach' | 'engagement'>('engagement')

  const platforms = useMemo(() => [...new Set(posts.map(p => p.platform))], [posts])

  // Per-platform aggregated stats
  const platformStats = useMemo(() => {
    const map: Record<string, { posts: number; engagement: number; views: number; reach: number; topPost: PostData | null }> = {}
    for (const post of posts) {
      if (!map[post.platform]) map[post.platform] = { posts: 0, engagement: 0, views: 0, reach: 0, topPost: null }
      const eng = engagementOf(post)
      map[post.platform].posts++
      map[post.platform].engagement += eng
      map[post.platform].views += post.views
      map[post.platform].reach += post.reach
      if (!map[post.platform].topPost || eng > engagementOf(map[post.platform].topPost!)) {
        map[post.platform].topPost = post
      }
    }
    return map
  }, [posts])

  // Cross-post groups: collect posts that share the same title across platforms
  const crossPostGroups = useMemo(() => {
    const groupMap = new Map<string, PostData[]>()
    for (const post of posts) {
      if (post.crossPostedTo.length > 0 && post.title) {
        const key = post.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
        if (!key) continue
        const existing = groupMap.get(key) || []
        if (!existing.find(p => p.id === post.id)) {
          groupMap.set(key, [...existing, post])
        }
      }
    }
    return [...groupMap.values()].filter(g => g.length > 1)
  }, [posts])

  // Filtered + sorted posts
  const filteredPosts = useMemo(() => {
    let result = platformFilter === 'all' ? posts : posts.filter(p => p.platform === platformFilter)
    return [...result].sort((a, b) => {
      if (sortBy === 'date')       return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      if (sortBy === 'likes')      return b.likes - a.likes
      if (sortBy === 'views')      return b.views - a.views
      if (sortBy === 'reach')      return b.reach - a.reach
      if (sortBy === 'engagement') return engagementOf(b) - engagementOf(a)
      return 0
    })
  }, [posts, platformFilter, sortBy])

  const PAGE_SIZE = 25
  const visiblePosts = showAllPosts ? filteredPosts : filteredPosts.slice(0, PAGE_SIZE)

  return (
    <div className="space-y-8">

      {/* ── Stats Summary ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Views',   value: fmt(stats.totalViews || 0),          icon: PlayCircle, color: 'text-violet-400', trend: stats.engagementTrend, },
          { label: 'Total Reach',   value: stats.totalReach > 0 ? fmt(stats.totalReach) : '—', icon: Eye, color: 'text-blue-400', trend: stats.reachTrend, },
          { label: 'Engagement',    value: fmt(stats.totalEngagement),           icon: Heart,      color: 'text-rose-400',   trend: stats.engagementTrend, },
          { label: 'Total Posts',   value: stats.totalPosts.toString(),          icon: BarChart3,  color: 'text-amber-400',  trend: stats.postTrend, },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="w-12 h-12" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{stat.label}</span>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stat.trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend >= 0 ? '+' : ''}{stat.trend}%
              </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight tabular-nums">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* ── AI Insight ───────────────────────────────────────────────────── */}
      {aiInsight && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -m-4 w-24 h-24 bg-indigo-500/20 blur-3xl rounded-full" />
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Agency Lead Intelligence</h3>
              <p className="text-zinc-500 text-xs">Strategic summary based on cross-platform data</p>
            </div>
          </div>
          <p className="text-zinc-200 text-base leading-relaxed italic max-w-3xl">&ldquo;{aiInsight}&rdquo;</p>
        </motion.div>
      )}

      {/* ── Platform Comparison ──────────────────────────────────────────── */}
      {platforms.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-500" />
            <h2 className="text-white font-bold">Platform Breakdown</h2>
            <span className="text-zinc-600 text-xs ml-1">— compare performance across connected platforms</span>
          </div>
          <div className={`grid gap-4 ${platforms.length === 1 ? 'grid-cols-1 max-w-sm' : platforms.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
            {platforms.map(platform => {
              const s = platformStats[platform]
              if (!s) return null
              return (
                <motion.div key={platform} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                  <PlatformStatCard
                    platform={platform}
                    postCount={s.posts}
                    totalEngagement={s.engagement}
                    totalViews={s.views}
                    totalReach={s.reach}
                    avgEngagement={s.posts > 0 ? s.engagement / s.posts : 0}
                    topPost={s.topPost}
                  />
                </motion.div>
              )
            })}
          </div>

          {/* Engagement rate comparison bar */}
          {platforms.length > 1 && (() => {
            const maxEng = Math.max(...platforms.map(p => platformStats[p]?.engagement || 0))
            return maxEng > 0 ? (
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 space-y-3">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Engagement by platform</p>
                {platforms.map(platform => {
                  const s = platformStats[platform]
                  if (!s) return null
                  const c = PLATFORM_COLORS[platform] ?? { dot: 'bg-zinc-500', text: 'text-zinc-400' }
                  const pct = maxEng > 0 ? (s.engagement / maxEng) * 100 : 0
                  return (
                    <div key={platform} className="flex items-center gap-3">
                      <span className={`text-xs font-bold capitalize w-20 shrink-0 ${c.text}`}>{platform}</span>
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full ${c.dot}`}
                        />
                      </div>
                      <span className="text-zinc-300 text-xs font-bold tabular-nums w-14 text-right">{fmt(s.engagement)}</span>
                    </div>
                  )
                })}
              </div>
            ) : null
          })()}
        </div>
      )}

      {/* ── Cross-Post Performance ───────────────────────────────────────── */}
      {crossPostGroups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4 text-amber-400" />
            <h2 className="text-white font-bold">Cross-Post Performance</h2>
            <span className="text-zinc-600 text-xs ml-1">— same content tracked on multiple platforms</span>
          </div>
          <div className="space-y-3">
            {crossPostGroups.map((group, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <CrossPostRow group={group} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Post Feed ────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-zinc-500" />
            <h2 className="text-white font-bold">All Content</h2>
            <span className="text-zinc-600 text-xs">{filteredPosts.length} posts</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Platform filter */}
            <div className="flex items-center gap-1 bg-zinc-900/60 border border-white/5 rounded-xl p-1">
              <button onClick={() => setPlatformFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${platformFilter === 'all' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                All
              </button>
              {platforms.map(p => {
                const c = PLATFORM_COLORS[p] ?? { text: 'text-zinc-400' }
                return (
                  <button key={p} onClick={() => setPlatformFilter(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${platformFilter === p ? `bg-zinc-700 ${c.text}` : 'text-zinc-500 hover:text-zinc-300'}`}>
                    {p}
                  </button>
                )
              })}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none bg-zinc-900/60 border border-white/5 rounded-xl text-xs font-bold text-zinc-300 pl-3 pr-8 py-2 cursor-pointer focus:outline-none hover:bg-zinc-800/60 transition-colors"
              >
                <option value="engagement">Top Engagement</option>
                <option value="likes">Most Liked</option>
                <option value="views">Most Viewed</option>
                <option value="reach">Most Reach</option>
                <option value="date">Newest First</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden">
          {filteredPosts.length === 0 ? (
            <div className="p-16 text-center">
              <BarChart3 className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">No posts tracked yet.</p>
              <p className="text-zinc-600 text-xs mt-1">Click <span className="text-zinc-400 font-semibold">Sync Platforms</span> to import your post history.</p>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="px-6 py-3 border-b border-white/5 grid text-[10px] font-black uppercase tracking-widest text-zinc-600"
                style={{ gridTemplateColumns: '4rem 1fr 9rem 7rem 7rem 6rem' }}>
                <div />
                <div>Content</div>
                <div>Platform</div>
                <div className="text-right">Engagement</div>
                <div className="text-right">Views / Reach</div>
                <div className="text-right">Published</div>
              </div>

              <div className="divide-y divide-white/[0.03]">
                {visiblePosts.map((post, i) => {
                  const eng = engagementOf(post)
                  const mediaLabel = post.media_type ? MEDIA_TYPE_LABELS[post.media_type] : null
                  const isExpanded = expandedCaption === post.id
                  const captionPreview = post.caption
                    ? post.caption.split('\n').filter(Boolean).slice(0, 2).join(' ').slice(0, 120)
                    : null
                  const heroValue = post.views > 0 ? post.views : post.reach > 0 ? post.reach : null
                  const heroLabel = post.views > 0 ? 'views' : post.reach > 0 ? 'reach' : null

                  return (
                    <motion.div key={post.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.4) }}
                      className="group px-6 py-3.5 hover:bg-white/[0.015] transition-colors grid items-center gap-4"
                      style={{ gridTemplateColumns: '4rem 1fr 9rem 7rem 7rem 6rem' }}>

                      {/* Thumbnail */}
                      <ThumbnailCell post={post} />

                      {/* Title + caption */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {mediaLabel && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-800/60 border border-white/5 px-2 py-0.5 rounded-full">
                              <mediaLabel.icon className="w-2.5 h-2.5" />
                              {mediaLabel.label}
                            </span>
                          )}
                          {post.crossPostedTo.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              <Copy className="w-2.5 h-2.5" />
                              +{post.crossPostedTo.join(', ')}
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-100 font-semibold text-sm leading-snug truncate group-hover:text-white transition-colors">
                          {post.title || <span className="text-zinc-500 italic">{post.platform} · {post.platform_post_id.slice(0, 12)}</span>}
                        </p>
                        {captionPreview && (
                          <p className={`text-zinc-500 text-xs leading-relaxed mt-0.5 ${!isExpanded ? 'line-clamp-1' : ''}`}>
                            {isExpanded ? post.caption : captionPreview}
                            {post.caption && post.caption.length > 120 && (
                              <button onClick={() => setExpandedCaption(isExpanded ? null : post.id)}
                                className="ml-1.5 text-zinc-400 hover:text-white font-medium transition-colors">
                                {isExpanded ? 'less' : '…more'}
                              </button>
                            )}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-zinc-700 text-[10px] font-mono">
                            {post.platform_post_id.slice(0, 14)}{post.platform_post_id.length > 14 ? '…' : ''}
                          </span>
                          {post.platform_post_url && (
                            <a href={post.platform_post_url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors">
                              <ExternalLink className="w-2.5 h-2.5" />View
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Platform */}
                      <div><PlatformBadge platform={post.platform} /></div>

                      {/* Engagement breakdown */}
                      <div className="text-right space-y-0.5">
                        <div className="text-white font-bold text-sm tabular-nums">{fmt(eng)}</div>
                        <div className="flex items-center justify-end gap-2 text-[10px] text-zinc-500 tabular-nums">
                          <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5 text-rose-500/50" />{fmt(post.likes)}</span>
                          <span className="flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5 text-blue-500/50" />{fmt(post.comments)}</span>
                          <span className="flex items-center gap-0.5"><Bookmark className="w-2.5 h-2.5 text-amber-500/50" />{fmt(post.saves)}</span>
                        </div>
                      </div>

                      {/* Views / Reach */}
                      <div className="text-right">
                        {heroValue !== null ? (
                          <>
                            <div className="text-white font-bold text-sm tabular-nums">{fmt(heroValue)}</div>
                            <div className="text-zinc-500 text-[10px] uppercase font-bold">{heroLabel}</div>
                          </>
                        ) : (
                          <span className="text-zinc-700 text-xs">—</span>
                        )}
                      </div>

                      {/* Date */}
                      <div className="text-right">
                        <span className="text-zinc-500 text-[11px]">
                          {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                        </span>
                      </div>

                    </motion.div>
                  )
                })}
              </div>

              {/* Show more */}
              {filteredPosts.length > PAGE_SIZE && !showAllPosts && (
                <div className="px-6 py-4 border-t border-white/5 text-center">
                  <button onClick={() => setShowAllPosts(true)}
                    className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/60 border border-white/5 rounded-xl px-5 py-2.5 transition-colors">
                    <ChevronDown className="w-3.5 h-3.5" />
                    Show all {filteredPosts.length} posts ({filteredPosts.length - PAGE_SIZE} more)
                  </button>
                </div>
              )}
              {showAllPosts && filteredPosts.length > PAGE_SIZE && (
                <div className="px-6 py-4 border-t border-white/5 text-center">
                  <p className="text-zinc-600 text-xs">Showing all {filteredPosts.length} posts</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  )
}
