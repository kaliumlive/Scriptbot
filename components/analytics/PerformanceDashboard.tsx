'use client'

import {
  BarChart3, TrendingUp, Eye, Heart, Share2, Bookmark,
  ArrowUpRight, ArrowDownRight, Zap, PlayCircle, ExternalLink,
  Copy, ImageOff, MessageCircle, Film
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

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

const PLATFORM_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  youtube:   { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/20',    dot: 'bg-red-500' },
  instagram: { bg: 'bg-pink-500/10',   text: 'text-pink-400',   border: 'border-pink-500/20',   dot: 'bg-gradient-to-br from-pink-500 to-purple-500' },
  tiktok:    { bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   border: 'border-cyan-500/20',   dot: 'bg-cyan-500' },
  twitter:   { bg: 'bg-sky-500/10',    text: 'text-sky-400',    border: 'border-sky-500/20',    dot: 'bg-sky-500' },
  linkedin:  { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/20',   dot: 'bg-blue-500' },
}

const MEDIA_TYPE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  VIDEO:           { label: 'Video',     icon: Film },
  REELS:           { label: 'Reel',      icon: PlayCircle },
  IMAGE:           { label: 'Photo',     icon: ImageOff },
  CAROUSEL_ALBUM:  { label: 'Carousel',  icon: Copy },
  video:           { label: 'Video',     icon: Film },
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function PlatformBadge({ platform }: { platform: string }) {
  const c = PLATFORM_COLORS[platform] ?? { bg: 'bg-zinc-800', text: 'text-zinc-400', border: 'border-zinc-700', dot: 'bg-zinc-500' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {platform}
    </span>
  )
}

function ThumbnailCell({ post }: { post: PostData }) {
  const [imgError, setImgError] = useState(false)
  const c = PLATFORM_COLORS[post.platform] ?? { dot: 'bg-zinc-700' }
  const isVideo = post.media_type === 'VIDEO' || post.media_type === 'REELS' || post.media_type === 'video'

  if (post.thumbnail_url && !imgError) {
    return (
      <div className="relative w-16 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-800 border border-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.thumbnail_url}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
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
    <div className={`w-16 h-10 rounded-lg shrink-0 bg-zinc-800/80 border border-white/5 flex items-center justify-center`}>
      {isVideo
        ? <Film className="w-4 h-4 text-zinc-600" />
        : <ImageOff className="w-4 h-4 text-zinc-600" />
      }
    </div>
  )
}

export default function PerformanceDashboard({ stats, posts, aiInsight }: PerformanceDashboardProps) {
  const [expandedCaption, setExpandedCaption] = useState<string | null>(null)
  const totalViews = stats.totalViews || 0

  return (
    <div className="space-y-8">

      {/* ── Stats Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Views',
            value: fmt(totalViews),
            icon: PlayCircle,
            color: 'text-violet-400',
            trend: `${stats.engagementTrend >= 0 ? '+' : ''}${stats.engagementTrend}%`,
            up: stats.engagementTrend >= 0,
          },
          {
            label: 'Total Reach',
            value: fmt(stats.totalReach),
            icon: Eye,
            color: 'text-blue-400',
            trend: `${stats.reachTrend >= 0 ? '+' : ''}${stats.reachTrend}%`,
            up: stats.reachTrend >= 0,
          },
          {
            label: 'Engagement',
            value: fmt(stats.totalEngagement),
            icon: Heart,
            color: 'text-rose-400',
            trend: `${stats.engagementTrend >= 0 ? '+' : ''}${stats.engagementTrend}%`,
            up: stats.engagementTrend >= 0,
          },
          {
            label: 'Total Posts',
            value: stats.totalPosts.toString(),
            icon: BarChart3,
            color: 'text-amber-400',
            trend: `${stats.postTrend >= 0 ? '+' : ''}${stats.postTrend}%`,
            up: stats.postTrend >= 0,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon className="w-12 h-12" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{stat.label}</span>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight tabular-nums">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* ── AI Insight ────────────────────────────────────────────────────── */}
      {aiInsight && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden"
        >
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
          <p className="text-zinc-200 text-base leading-relaxed italic max-w-3xl">
            &ldquo;{aiInsight}&rdquo;
          </p>
        </motion.div>
      )}

      {/* ── Post Feed ─────────────────────────────────────────────────────── */}
      <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold">Content Being Tracked</h3>
            <p className="text-zinc-500 text-xs mt-0.5">{posts.length} posts imported across all connected platforms</p>
          </div>
          <TrendingUp className="w-4 h-4 text-zinc-600" />
        </div>

        {posts.length === 0 ? (
          <div className="p-16 text-center">
            <BarChart3 className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">No posts tracked yet.</p>
            <p className="text-zinc-600 text-xs mt-1">Click <span className="text-zinc-400 font-semibold">Sync Platforms</span> to import your post history.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {posts.map((post, i) => {
              const isPrimary = post.views > 0 ? 'views' : post.reach > 0 ? 'reach' : 'engagement'
              const primaryValue = isPrimary === 'views' ? post.views : isPrimary === 'reach' ? post.reach : post.likes + post.comments + post.saves
              const primaryLabel = isPrimary === 'views' ? 'Views' : isPrimary === 'reach' ? 'Reach' : 'Engagement'
              const mediaLabel = post.media_type ? MEDIA_TYPE_LABELS[post.media_type] : null
              const isExpanded = expandedCaption === post.id
              const captionPreview = post.caption
                ? post.caption.split('\n').filter(Boolean).slice(0, 2).join(' ').slice(0, 140)
                : null
              const isCrossPosted = post.crossPostedTo.length > 0

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
                  className="group px-6 py-4 hover:bg-white/[0.015] transition-colors"
                >
                  <div className="flex items-start gap-4">

                    {/* Thumbnail */}
                    <ThumbnailCell post={post} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <PlatformBadge platform={post.platform} />
                        {mediaLabel && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-800/60 border border-white/5 px-2 py-0.5 rounded-full">
                            <mediaLabel.icon className="w-2.5 h-2.5" />
                            {mediaLabel.label}
                          </span>
                        )}
                        {isCrossPosted && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            <Copy className="w-2.5 h-2.5" />
                            Also on {post.crossPostedTo.join(', ')}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <p className="text-zinc-100 font-semibold text-sm leading-snug truncate group-hover:text-white transition-colors">
                        {post.title || (
                          <span className="text-zinc-500 italic">
                            {post.platform} · {post.platform_post_id.slice(0, 12)}
                          </span>
                        )}
                      </p>

                      {/* Caption preview */}
                      {captionPreview && (
                        <div className="mt-1">
                          <p className={`text-zinc-500 text-xs leading-relaxed ${!isExpanded ? 'line-clamp-1' : ''}`}>
                            {isExpanded ? post.caption : captionPreview}
                            {post.caption && post.caption.length > 140 && (
                              <button
                                onClick={() => setExpandedCaption(isExpanded ? null : post.id)}
                                className="ml-1.5 text-zinc-400 hover:text-white font-medium transition-colors"
                              >
                                {isExpanded ? 'less' : '...more'}
                              </button>
                            )}
                          </p>
                        </div>
                      )}

                      {/* Post ID + link — so user can verify what's being tracked */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-zinc-600 text-[10px] font-mono">
                          ID: {post.platform_post_id.slice(0, 16)}{post.platform_post_id.length > 16 ? '…' : ''}
                        </span>
                        {post.platform_post_url && (
                          <a
                            href={post.platform_post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            View post
                          </a>
                        )}
                        <span className="text-zinc-700 text-[10px]">
                          {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="shrink-0 flex items-center gap-5 ml-2">
                      {/* Hero metric — views for YouTube, reach for Instagram */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-white tabular-nums">{fmt(primaryValue)}</div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{primaryLabel}</div>
                      </div>

                      {/* Engagement breakdown */}
                      <div className="flex flex-col gap-1 text-xs text-zinc-400 tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-3 h-3 text-rose-500/50" />
                          <span>{fmt(post.likes)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageCircle className="w-3 h-3 text-blue-500/50" />
                          <span>{fmt(post.comments)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Bookmark className="w-3 h-3 text-amber-500/50" />
                          <span>{fmt(post.saves)}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      {posts.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 px-1">
          <span className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest">Platforms tracked:</span>
          {[...new Set(posts.map((p) => p.platform))].map((platform) => (
            <PlatformBadge key={platform} platform={platform} />
          ))}
          {posts.some((p) => p.crossPostedTo.length > 0) && (
            <span className="text-zinc-600 text-[11px]">
              · <span className="text-amber-400 font-semibold">{posts.filter((p) => p.crossPostedTo.length > 0).length}</span> cross-posted pieces detected
            </span>
          )}
        </div>
      )}
    </div>
  )
}
