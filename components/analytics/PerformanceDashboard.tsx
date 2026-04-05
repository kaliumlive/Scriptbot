'use client'

import {
  BarChart3, TrendingUp, Eye, Heart, Bookmark, ArrowUpRight, ArrowDownRight,
  Zap, PlayCircle, ExternalLink, Copy, ImageOff, MessageCircle, Film,
  Trophy, ChevronDown, Link2, X, Search, Users, Video, Activity
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, AreaChart, Area, Legend,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChannelStats {
  platform: string
  username: string | null
  displayName: string | null
  followers: number | null
  posts: number | null
  totalViews: number | null
  profilePictureUrl: string | null
}

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
  linkedPostIds: string[]
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
  channelStats: ChannelStats[]
  brandId: string
  aiInsight?: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; hex: string }> = {
  youtube:   { bg: 'bg-red-500/10',   text: 'text-red-400',   border: 'border-red-500/20',   dot: 'bg-red-500',    hex: '#f87171' },
  instagram: { bg: 'bg-pink-500/10',  text: 'text-pink-400',  border: 'border-pink-500/20',  dot: 'bg-pink-500',   hex: '#f472b6' },
  tiktok:    { bg: 'bg-cyan-500/10',  text: 'text-cyan-400',  border: 'border-cyan-500/20',  dot: 'bg-cyan-500',   hex: '#22d3ee' },
  twitter:   { bg: 'bg-sky-500/10',   text: 'text-sky-400',   border: 'border-sky-500/20',   dot: 'bg-sky-500',    hex: '#38bdf8' },
  linkedin:  { bg: 'bg-blue-500/10',  text: 'text-blue-400',  border: 'border-blue-500/20',  dot: 'bg-blue-500',   hex: '#60a5fa' },
}
const DEFAULT_COLOR = { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700', dot: 'bg-zinc-500', hex: '#71717a' }

const MEDIA_TYPE_ICONS: Record<string, React.ElementType> = {
  VIDEO: Film, REELS: PlayCircle, IMAGE: ImageOff, CAROUSEL_ALBUM: Copy, video: Film,
  SHORT: PlayCircle,
}
const MEDIA_TYPE_LABELS: Record<string, string> = {
  VIDEO: 'Video', REELS: 'Reel', IMAGE: 'Photo', CAROUSEL_ALBUM: 'Carousel', video: 'Video',
  SHORT: 'Short',
}

type ContentCategory = 'shortform' | 'carousel' | 'longform' | 'photo'

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  shortform: '⚡ Short-form',
  carousel:  '🎠 Carousel',
  longform:  '🎬 Long-form',
  photo:     '📷 Photo',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}
function eng(p: PostData) { return p.likes + p.comments + p.saves }
function pc(platform: string) { return PLATFORM_COLORS[platform] ?? DEFAULT_COLOR }

function getContentCategory(post: PostData): ContentCategory {
  const mt = (post.media_type ?? '').toUpperCase()
  // Explicit carousel
  if (mt === 'CAROUSEL_ALBUM') return 'carousel'
  // Instagram Reels / TikTok = always short-form
  if (mt === 'REELS' || post.platform === 'tiktok') return 'shortform'
  // Photo
  if (mt === 'IMAGE' || mt === 'FEED') return 'photo'
  // YouTube / Instagram video: detect Shorts by URL pattern or #shorts hashtag
  if (mt === 'VIDEO' || mt === 'video') {
    const url   = post.platform_post_url?.toLowerCase() ?? ''
    const title = post.title?.toLowerCase() ?? ''
    const cap   = post.caption?.toLowerCase() ?? ''
    if (url.includes('/shorts/') || title.includes('#shorts') || cap.includes('#shorts')) return 'shortform'
    return 'longform'
  }
  return 'longform'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: string }) {
  const c = pc(platform)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {platform}
    </span>
  )
}

function Thumb({ post, size = 'md' }: { post: PostData; size?: 'sm' | 'md' }) {
  const [err, setErr] = useState(false)
  const isVideo = post.media_type === 'VIDEO' || post.media_type === 'REELS' || post.media_type === 'video'
  const dim = size === 'sm' ? 'w-12 h-8' : 'w-16 h-10'
  if (post.thumbnail_url && !err) {
    return (
      <div className={`relative ${dim} rounded-lg overflow-hidden shrink-0 bg-zinc-800 border border-white/5`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" onError={() => setErr(true)} />
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
              <PlayCircle className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
        )}
      </div>
    )
  }
  return (
    <div className={`${dim} rounded-lg shrink-0 bg-zinc-800/80 border border-white/5 flex items-center justify-center`}>
      {isVideo ? <Film className="w-3.5 h-3.5 text-zinc-600" /> : <ImageOff className="w-3.5 h-3.5 text-zinc-600" />}
    </div>
  )
}

// ── Custom recharts tooltip ───────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-3 shadow-2xl text-xs">
      {label && <p className="text-zinc-400 font-bold mb-1.5">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }} className="font-semibold capitalize">{p.name}</span>
          <span className="text-white font-bold tabular-nums">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Charts Section ────────────────────────────────────────────────────────────

function ChartsSection({ posts, platforms, platformStats }: {
  posts: PostData[]
  platforms: string[]
  platformStats: Record<string, { posts: number; engagement: number; views: number; reach: number; topPost: PostData | null }>
}) {
  // 1. Engagement over time (monthly buckets, per platform)
  const timelineData = useMemo(() => {
    const map = new Map<string, Record<string, number | string>>()
    for (const post of posts) {
      const d = new Date(post.published_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      if (!map.has(key)) map.set(key, { month: label })
      const entry = map.get(key)!
      entry[post.platform] = ((entry[post.platform] as number) || 0) + eng(post)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v)
  }, [posts])

  // 2. Platform comparison: engagement + views side by side
  const platformChartData = useMemo(() =>
    platforms.map(p => ({
      platform: p.charAt(0).toUpperCase() + p.slice(1),
      Engagement: platformStats[p]?.engagement || 0,
      Views: platformStats[p]?.views || 0,
    })), [platforms, platformStats])

  // 3. Top 10 posts by engagement
  const topPostsData = useMemo(() =>
    [...posts].sort((a, b) => eng(b) - eng(a)).slice(0, 10).map(post => ({
      name: (post.title || post.platform_post_id.slice(0, 20)).slice(0, 32),
      engagement: eng(post),
      platform: post.platform,
    })), [posts])

  const hasTimeline = timelineData.length > 1

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-zinc-500" />
        <h2 className="text-white font-bold">Performance Charts</h2>
      </div>

      <div className={`grid gap-4 ${platforms.length > 1 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>

        {/* Platform comparison */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Engagement vs Views by Platform</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={platformChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="platform" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#71717a', paddingTop: 8 }} />
              <Bar dataKey="Engagement" radius={[4, 4, 0, 0]}>
                {platformChartData.map((entry, i) => (
                  <Cell key={i} fill={pc(entry.platform.toLowerCase()).hex} fillOpacity={0.85} />
                ))}
              </Bar>
              <Bar dataKey="Views" radius={[4, 4, 0, 0]}>
                {platformChartData.map((entry, i) => (
                  <Cell key={i} fill={pc(entry.platform.toLowerCase()).hex} fillOpacity={0.35} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top 10 posts */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Top 10 Posts by Engagement</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topPostsData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 9 }} width={120} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="engagement" radius={[0, 4, 4, 0]}>
                {topPostsData.map((entry, i) => (
                  <Cell key={i} fill={pc(entry.platform).hex} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement over time */}
      {hasTimeline && (
        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Engagement Over Time</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timelineData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                {platforms.map(p => (
                  <linearGradient key={p} id={`grad-${p}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={pc(p).hex} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={pc(p).hex} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#71717a', paddingTop: 8 }} />
              {platforms.map(p => (
                <Area key={p} type="monotone" dataKey={p} name={p.charAt(0).toUpperCase() + p.slice(1)}
                  stroke={pc(p).hex} strokeWidth={2}
                  fill={`url(#grad-${p})`} dot={false} activeDot={{ r: 4, fill: pc(p).hex }} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ── Channel Card ──────────────────────────────────────────────────────────────

function ChannelCard({ ch }: { ch: ChannelStats }) {
  const c = pc(ch.platform)
  const followerLabel = ch.platform === 'youtube' ? 'subscribers' : 'followers'
  return (
    <div className={`flex items-center gap-4 rounded-2xl border ${c.border} ${c.bg} p-4`}>
      <div className={`w-14 h-14 rounded-full shrink-0 border-2 ${c.border} overflow-hidden bg-zinc-800 flex items-center justify-center`}>
        {ch.profilePictureUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={ch.profilePictureUrl} alt="" className="w-full h-full object-cover" />
          : <span className={`text-xl font-black ${c.text}`}>{ch.platform[0].toUpperCase()}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="mb-0.5"><PlatformBadge platform={ch.platform} /></div>
        <p className="text-white font-bold text-sm truncate">{ch.displayName || ch.username || ch.platform}</p>
        {ch.username && ch.displayName && <p className={`text-xs ${c.text} truncate`}>{ch.username.startsWith('@') ? ch.username : `@${ch.username}`}</p>}
        <div className="flex flex-wrap gap-3 mt-1.5">
          {ch.followers !== null && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Users className="w-3 h-3" />
              <span className="font-bold text-zinc-200">{fmt(ch.followers)}</span> {followerLabel}
            </span>
          )}
          {ch.posts !== null && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Video className="w-3 h-3" />
              <span className="font-bold text-zinc-200">{fmt(ch.posts)}</span> {ch.platform === 'youtube' ? 'videos' : 'posts'}
            </span>
          )}
          {ch.totalViews !== null && ch.totalViews > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
              <Eye className="w-3 h-3" />
              <span className="font-bold text-zinc-200">{fmt(ch.totalViews)}</span> total views
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Link Modal ────────────────────────────────────────────────────────────────

function LinkModal({ post, allPosts, existingLinks, onClose, onLinked }: {
  post: PostData
  allPosts: PostData[]
  existingLinks: string[]
  onClose: () => void
  onLinked: () => void
}) {
  const [search, setSearch] = useState('')
  const [linking, setLinking] = useState<string | null>(null)
  const [unlinking, setUnlinking] = useState<string | null>(null)

  const sourceCategory = getContentCategory(post)
  const canLink = sourceCategory === 'shortform'

  const otherPlatformPosts = useMemo(() =>
    allPosts
      .filter(p => p.platform !== post.platform && p.id !== post.id)
      // Only short-form posts can be linked — must be same category
      .filter(p => canLink && getContentCategory(p) === 'shortform')
      .filter(p => !search || (p.title || p.platform_post_id).toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()),
    [allPosts, post, search, canLink]
  )

  const handleLink = async (targetId: string) => {
    setLinking(targetId)
    try {
      await fetch('/api/posts/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIdA: post.id, postIdB: targetId }),
      })
      onLinked(); onClose()
    } finally { setLinking(null) }
  }

  const handleUnlink = async (targetId: string) => {
    setUnlinking(targetId)
    try {
      await fetch('/api/posts/link', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIdA: post.id, postIdB: targetId }),
      })
      onLinked(); onClose()
    } finally { setUnlinking(null) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-lg flex flex-col shadow-2xl"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/5 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link2 className="w-4 h-4 text-indigo-400" />
              <h3 className="text-white font-bold">Link to another platform</h3>
            </div>
            <p className="text-zinc-500 text-xs">
              Connect <span className="text-zinc-300 font-medium">{(post.title || post.platform_post_id).slice(0, 40)}</span> to the same short-form content on another platform.{' '}
              <span className="text-indigo-500/70">Reels · Shorts · TikToks only.</span>
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 shrink-0 mt-0.5"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <input type="text" placeholder="Search by title..." value={search} onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-zinc-600 outline-none flex-1" autoFocus />
          </div>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-white/[0.04]">
          {!canLink
            ? <div className="p-10 text-center text-zinc-600 text-sm">Only <span className="text-zinc-400 font-semibold">short-form content</span> can be linked across platforms.<br /><span className="text-xs mt-1 block">Reels, Shorts, and TikToks only.</span></div>
            : otherPlatformPosts.length === 0
            ? <div className="p-10 text-center text-zinc-600 text-sm">{search ? 'No matching short-form posts found' : 'No short-form posts on other platforms to link'}</div>
            : otherPlatformPosts.map(target => {
                const isLinked = existingLinks.includes(target.id)
                const isProcessing = linking === target.id || unlinking === target.id
                return (
                  <div key={target.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.025] transition-colors">
                    <Thumb post={target} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <PlatformBadge platform={target.platform} />
                        <span className="text-zinc-600 text-[10px]">
                          {new Date(target.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-zinc-200 text-xs font-semibold truncate">{target.title || target.platform_post_id.slice(0, 32)}</p>
                      <p className="text-zinc-600 text-[10px] tabular-nums">
                        {fmt(eng(target))} engagement{target.views > 0 ? ` · ${fmt(target.views)} views` : ''}
                      </p>
                    </div>
                    <button onClick={() => isLinked ? handleUnlink(target.id) : handleLink(target.id)} disabled={isProcessing}
                      className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                        isLinked
                          ? 'border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
                          : 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20'
                      }`}>
                      {isProcessing ? '…' : isLinked ? 'Unlink' : 'Link'}
                    </button>
                  </div>
                )
              })
          }
        </div>
        <div className="p-3 border-t border-white/5">
          <button onClick={onClose} className="w-full text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors py-1">Close</button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Cross-Post Row ────────────────────────────────────────────────────────────

function CrossPostRow({ group }: { group: PostData[] }) {
  const title = group[0].title || group[0].platform_post_id.slice(0, 30)
  const thumb = group.find(p => p.thumbnail_url)
  const maxEng = Math.max(...group.map(eng))
  return (
    <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-4 space-y-3">
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
          <p className="text-zinc-100 text-sm font-semibold line-clamp-1">{title}</p>
        </div>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${group.length}, 1fr)` }}>
        {group.map(post => {
          const c = pc(post.platform)
          const postEng = eng(post)
          const isWinner = postEng === maxEng && maxEng > 0
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
                <div className="flex justify-between"><span className="text-zinc-500">Likes</span><span className="text-zinc-200 font-semibold">{fmt(post.likes)}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Comments</span><span className="text-zinc-200 font-semibold">{fmt(post.comments)}</span></div>
                {post.views > 0 && <div className="flex justify-between"><span className="text-zinc-500">Views</span><span className="text-zinc-200 font-semibold">{fmt(post.views)}</span></div>}
                {post.reach > 0 && <div className="flex justify-between"><span className="text-zinc-500">Reach</span><span className="text-zinc-200 font-semibold">{fmt(post.reach)}</span></div>}
                <div className="flex justify-between pt-1 border-t border-white/5">
                  <span className="text-zinc-500">Total</span>
                  <span className={`font-black ${isWinner ? c.text : 'text-zinc-300'}`}>{fmt(postEng)}</span>
                </div>
              </div>
              {post.platform_post_url && (
                <a href={post.platform_post_url} target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
                  <ExternalLink className="w-2.5 h-2.5" />View post
                </a>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PerformanceDashboard({ stats, posts, channelStats, aiInsight }: PerformanceDashboardProps) {
  const router = useRouter()
  const [expandedCaption, setExpandedCaption] = useState<string | null>(null)
  const [showAllPosts, setShowAllPosts] = useState(false)
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<ContentCategory | 'all'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'likes' | 'views' | 'reach' | 'engagement'>('engagement')
  const [linkingPost, setLinkingPost] = useState<PostData | null>(null)

  const platforms = useMemo(() => [...new Set(posts.map(p => p.platform))], [posts])
  const postById = useMemo(() => new Map(posts.map(p => [p.id, p])), [posts])

  const platformStats = useMemo(() => {
    const map: Record<string, { posts: number; engagement: number; views: number; reach: number; topPost: PostData | null }> = {}
    for (const post of posts) {
      if (!map[post.platform]) map[post.platform] = { posts: 0, engagement: 0, views: 0, reach: 0, topPost: null }
      const e = eng(post)
      map[post.platform].posts++
      map[post.platform].engagement += e
      map[post.platform].views += post.views
      map[post.platform].reach += post.reach
      if (!map[post.platform].topPost || e > eng(map[post.platform].topPost!)) map[post.platform].topPost = post
    }
    return map
  }, [posts])

  const crossPostGroups = useMemo(() => {
    const seen = new Set<string>()
    const groups: PostData[][] = []
    for (const post of posts) {
      if (seen.has(post.id) || post.linkedPostIds.length === 0) continue
      const group: PostData[] = [post]
      seen.add(post.id)
      for (const linkedId of post.linkedPostIds) {
        const linked = postById.get(linkedId)
        if (linked && !seen.has(linked.id)) { group.push(linked); seen.add(linked.id) }
      }
      if (group.length > 1) groups.push(group)
    }
    return groups
  }, [posts, postById])

  const filteredPosts = useMemo(() => {
    let result = platformFilter === 'all' ? posts : posts.filter(p => p.platform === platformFilter)
    if (categoryFilter !== 'all') result = result.filter(p => getContentCategory(p) === categoryFilter)
    return [...result].sort((a, b) => {
      if (sortBy === 'date')       return new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
      if (sortBy === 'likes')      return b.likes - a.likes
      if (sortBy === 'views')      return b.views - a.views
      if (sortBy === 'reach')      return b.reach - a.reach
      if (sortBy === 'engagement') return eng(b) - eng(a)
      return 0
    })
  }, [posts, platformFilter, categoryFilter, sortBy])

  // Count by category for badge counts
  const categoryCounts = useMemo(() => {
    const base = platformFilter === 'all' ? posts : posts.filter(p => p.platform === platformFilter)
    const counts: Record<ContentCategory | 'all', number> = { all: base.length, shortform: 0, carousel: 0, longform: 0, photo: 0 }
    for (const p of base) counts[getContentCategory(p)]++
    return counts
  }, [posts, platformFilter])

  const PAGE_SIZE = 25
  const visiblePosts = showAllPosts ? filteredPosts : filteredPosts.slice(0, PAGE_SIZE)
  const allViewsZero = posts.length > 0 && posts.every(p => p.views === 0)
  const handleLinked = useCallback(() => { router.refresh() }, [router])

  return (
    <div className="space-y-8">

      {/* ── Channels ───────────────────────────────────────────────────── */}
      {channelStats.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-500" />
            <h2 className="text-white font-bold">Your Channels</h2>
          </div>
          <div className={`grid gap-4 ${channelStats.length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-1 md:grid-cols-2'}`}>
            {channelStats.map(ch => (
              <motion.div key={ch.platform} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <ChannelCard ch={ch} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Views',  value: stats.totalViews > 0 ? fmt(stats.totalViews) : '—',      icon: PlayCircle, trend: stats.engagementTrend },
          { label: 'Total Reach',  value: stats.totalReach > 0 ? fmt(stats.totalReach) : '—',      icon: Eye,        trend: stats.reachTrend },
          { label: 'Engagement',   value: fmt(stats.totalEngagement),                              icon: Heart,      trend: stats.engagementTrend },
          { label: 'Total Posts',  value: stats.totalPosts.toString(),                             icon: BarChart3,  trend: stats.postTrend },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="w-12 h-12" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{stat.label}</span>
              {stat.trend !== 0 && (
                <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stat.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend > 0 ? '+' : ''}{stat.trend}%
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-white tracking-tight tabular-nums">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Views notice ───────────────────────────────────────────────── */}
      {allViewsZero && (
        <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/15 rounded-2xl px-5 py-3">
          <Eye className="w-4 h-4 text-blue-400 shrink-0" />
          <p className="text-blue-300/80 text-xs leading-relaxed">
            Views showing — because the analytics snapshot hasn&apos;t run since your last platform reconnect.
            Click <span className="text-blue-200 font-semibold">Sync Platforms</span> to refresh view counts.
          </p>
        </div>
      )}

      {/* ── AI Insight ─────────────────────────────────────────────────── */}
      {aiInsight && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -m-4 w-24 h-24 bg-indigo-500/20 blur-3xl rounded-full" />
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
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

      {/* ── Platform Breakdown ─────────────────────────────────────────── */}
      {platforms.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-500" />
            <h2 className="text-white font-bold">Platform Breakdown</h2>
          </div>
          <div className={`grid gap-4 ${platforms.length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-1 md:grid-cols-2'}`}>
            {platforms.map(platform => {
              const s = platformStats[platform]; if (!s) return null
              const c = pc(platform)
              return (
                <motion.div key={platform} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border ${c.border} ${c.bg} p-5 space-y-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                      <span className={`text-sm font-black capitalize ${c.text}`}>{platform}</span>
                    </div>
                    <span className="text-zinc-500 text-xs">{s.posts} posts tracked</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Total Engagement</div>
                      <div className="text-xl font-bold text-white tabular-nums">{fmt(s.engagement)}</div></div>
                    <div><div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Avg / post</div>
                      <div className="text-xl font-bold text-white tabular-nums">{fmt(Math.round(s.engagement / s.posts))}</div></div>
                    {(platform === 'youtube' || s.views > 0) && (
                      <div><div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Views</div>
                        <div className="text-xl font-bold text-white tabular-nums">{fmt(s.views)}</div></div>
                    )}
                    {(platform === 'instagram' || s.reach > 0) && (
                      <div><div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-0.5">Reach</div>
                        <div className="text-xl font-bold text-white tabular-nums">
                          {s.reach > 0 ? fmt(s.reach) : <span className="text-zinc-600 text-sm">—</span>}
                        </div></div>
                    )}
                  </div>
                  {s.topPost && (
                    <div className={`rounded-xl border ${c.border} bg-black/20 p-3`}>
                      <div className="flex items-center gap-1 mb-1">
                        <Trophy className={`w-3 h-3 ${c.text}`} />
                        <span className={`text-[9px] font-black uppercase tracking-widest ${c.text}`}>Top Post</span>
                      </div>
                      <p className="text-white text-xs font-semibold line-clamp-2">{s.topPost.title || s.topPost.platform_post_id.slice(0, 24)}</p>
                      <div className={`text-[10px] ${c.text} font-bold mt-1`}>
                        {fmt(eng(s.topPost))} engagement{s.topPost.views > 0 ? ` · ${fmt(s.topPost.views)} views` : ''}
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {platforms.length > 1 && (() => {
            const maxE = Math.max(...platforms.map(p => platformStats[p]?.engagement || 0))
            return maxE > 0 ? (
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 space-y-3">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Engagement by platform</p>
                {platforms.map(platform => {
                  const s = platformStats[platform]; if (!s) return null
                  const c = pc(platform)
                  return (
                    <div key={platform} className="flex items-center gap-3">
                      <span className={`text-xs font-bold capitalize w-20 shrink-0 ${c.text}`}>{platform}</span>
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(s.engagement / maxE) * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full rounded-full ${c.dot}`} />
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

      {/* ── Performance Charts ──────────────────────────────────────────── */}
      {posts.length > 0 && (
        <ChartsSection posts={posts} platforms={platforms} platformStats={platformStats} />
      )}

      {/* ── Cross-Post Performance ─────────────────────────────────────── */}
      {crossPostGroups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Copy className="w-4 h-4 text-amber-400" />
            <h2 className="text-white font-bold">Cross-Post Performance</h2>
            <span className="text-zinc-600 text-xs ml-1">— same content on multiple platforms</span>
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

      {/* ── All Posts ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-zinc-500" />
            <h2 className="text-white font-bold">All Posts</h2>
            <span className="text-zinc-600 text-xs">{filteredPosts.length} total</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Platform filter */}
            <div className="flex items-center gap-1 bg-zinc-900/60 border border-white/5 rounded-xl p-1">
              <button onClick={() => setPlatformFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${platformFilter === 'all' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                All
              </button>
              {platforms.map(p => {
                const c = pc(p)
                return (
                  <button key={p} onClick={() => setPlatformFilter(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${platformFilter === p ? `bg-zinc-700 ${c.text}` : 'text-zinc-500 hover:text-zinc-300'}`}>
                    {p}
                  </button>
                )
              })}
            </div>
            {/* Content type filter */}
            <div className="flex items-center gap-1 bg-zinc-900/60 border border-white/5 rounded-xl p-1">
              {(['all', 'shortform', 'carousel', 'longform', 'photo'] as const).map(cat => {
                const label = cat === 'all' ? 'All types' : CATEGORY_LABELS[cat]
                const count = categoryCounts[cat]
                const active = categoryFilter === cat
                return (
                  <button key={cat} onClick={() => { setCategoryFilter(cat); setShowAllPosts(false) }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${active ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    {label}{count > 0 && cat !== 'all' ? <span className="ml-1 opacity-50">{count}</span> : null}
                  </button>
                )
              })}
            </div>
            <div className="relative">
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="appearance-none bg-zinc-900/60 border border-white/5 rounded-xl text-xs font-bold text-zinc-300 pl-3 pr-8 py-2 cursor-pointer focus:outline-none hover:bg-zinc-800/60 transition-colors">
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

        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden">
          {filteredPosts.length === 0 ? (
            <div className="p-16 text-center">
              <BarChart3 className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-500 text-sm">No posts yet. Click <span className="text-zinc-400 font-semibold">Sync Platforms</span> to import.</p>
            </div>
          ) : (
            <>
              <div className="px-6 py-3 border-b border-white/5 grid text-[10px] font-black uppercase tracking-widest text-zinc-600"
                style={{ gridTemplateColumns: '4rem 1fr 8rem 7rem 7rem 5rem' }}>
                <div /><div>Content</div><div>Platform</div>
                <div className="text-right">Engagement</div><div className="text-right">Views / Reach</div>
                <div className="text-right">Published</div>
              </div>

              <div className="divide-y divide-white/[0.03]">
                {visiblePosts.map((post, i) => {
                  const postEng = eng(post)
                  const MediaIcon = post.media_type ? MEDIA_TYPE_ICONS[post.media_type] : null
                  const mediaLabel = post.media_type ? MEDIA_TYPE_LABELS[post.media_type] : null
                  const isExpanded = expandedCaption === post.id
                  const captionPreview = post.caption
                    ? post.caption.split('\n').filter(Boolean).slice(0, 2).join(' ').slice(0, 120) : null
                  const heroValue = post.views > 0 ? post.views : post.reach > 0 ? post.reach : null
                  const heroLabel = post.views > 0 ? 'views' : post.reach > 0 ? 'reach' : null
                  const isLinked = post.linkedPostIds.length > 0

                  return (
                    <motion.div key={post.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.4) }}
                      className="group px-6 py-3.5 hover:bg-white/[0.015] transition-colors grid items-center gap-3"
                      style={{ gridTemplateColumns: '4rem 1fr 8rem 7rem 7rem 5rem' }}>

                      <Thumb post={post} />

                      {/* Content + inline link button */}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          {MediaIcon && mediaLabel && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-800/60 border border-white/5 px-2 py-0.5 rounded-full">
                              <MediaIcon className="w-2.5 h-2.5" />{mediaLabel}
                            </span>
                          )}
                          {isLinked && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              <Copy className="w-2.5 h-2.5" />+{post.crossPostedTo.join(', ')}
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-100 font-semibold text-sm leading-snug truncate group-hover:text-white transition-colors">
                          {post.title || <span className="text-zinc-500 italic">{post.platform} · {post.platform_post_id.slice(0, 14)}</span>}
                        </p>
                        {captionPreview && (
                          <p className={`text-zinc-500 text-xs leading-relaxed mt-0.5 ${!isExpanded ? 'line-clamp-1' : ''}`}>
                            {isExpanded ? post.caption : captionPreview}
                            {post.caption && post.caption.length > 120 && (
                              <button onClick={() => setExpandedCaption(isExpanded ? null : post.id)}
                                className="ml-1 text-zinc-400 hover:text-white font-medium transition-colors">
                                {isExpanded ? 'less' : '…more'}
                              </button>
                            )}
                          </p>
                        )}
                        {/* Post ID + View + Link button — all inline */}
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
                          <button onClick={() => setLinkingPost(post)}
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                              isLinked
                                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20'
                                : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20'
                            }`}>
                            <Link2 className="w-2.5 h-2.5" />
                            {isLinked ? 'Linked' : 'Link'}
                          </button>
                        </div>
                      </div>

                      <div><PlatformBadge platform={post.platform} /></div>

                      <div className="text-right space-y-0.5">
                        <div className="text-white font-bold text-sm tabular-nums">{fmt(postEng)}</div>
                        <div className="flex items-center justify-end gap-2 text-[10px] text-zinc-500 tabular-nums">
                          <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5 text-rose-500/50" />{fmt(post.likes)}</span>
                          <span className="flex items-center gap-0.5"><MessageCircle className="w-2.5 h-2.5 text-blue-500/50" />{fmt(post.comments)}</span>
                          <span className="flex items-center gap-0.5"><Bookmark className="w-2.5 h-2.5 text-amber-500/50" />{fmt(post.saves)}</span>
                          {post.shares > 0 && (
                            <span className="flex items-center gap-0.5"><ArrowUpRight className="w-2.5 h-2.5 text-green-500/50" />{fmt(post.shares)}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        {heroValue !== null
                          ? <><div className="text-white font-bold text-sm tabular-nums">{fmt(heroValue)}</div>
                              <div className="text-zinc-500 text-[10px] uppercase font-bold">{heroLabel}</div></>
                          : <span className="text-zinc-700 text-xs">—</span>
                        }
                      </div>

                      <div className="text-right">
                        <span className="text-zinc-500 text-[11px]">
                          {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                        </span>
                      </div>

                    </motion.div>
                  )
                })}
              </div>

              {filteredPosts.length > PAGE_SIZE && !showAllPosts && (
                <div className="px-6 py-4 border-t border-white/5 text-center">
                  <button onClick={() => setShowAllPosts(true)}
                    className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/60 border border-white/5 rounded-xl px-5 py-2.5 transition-colors">
                    <ChevronDown className="w-3.5 h-3.5" />
                    Show all {filteredPosts.length} posts ({filteredPosts.length - PAGE_SIZE} more)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Link Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {linkingPost && (
          <LinkModal
            post={linkingPost}
            allPosts={posts}
            existingLinks={linkingPost.linkedPostIds}
            onClose={() => setLinkingPost(null)}
            onLinked={handleLinked}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
