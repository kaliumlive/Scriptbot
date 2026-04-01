'use client'

import { BarChart3, TrendingUp, Eye, Heart, Share2, Bookmark, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

interface PostMetric {
    id: string
    platform: string
    title: string
    likes: number
    comments: number
    shares: number
    saves: number
    reach: number
    views: number
    published_at: string
}

interface PerformanceDashboardProps {
    stats: {
        totalReach: number
        totalEngagement: number
        totalPosts: number
        growthRate: number
    }
    recentPosts: PostMetric[]
    aiInsight?: string
}

export default function PerformanceDashboard({ stats, recentPosts, aiInsight }: PerformanceDashboardProps) {
    return (
        <div className="space-y-8">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Reach', value: stats.totalReach.toLocaleString(), icon: Eye, color: 'text-blue-400', trend: '+12.4%', up: true },
                    { label: 'Engagement', value: stats.totalEngagement.toLocaleString(), icon: Heart, color: 'text-rose-400', trend: '+8.2%', up: true },
                    { label: 'Growth Rate', value: `${stats.growthRate}%`, icon: TrendingUp, color: 'text-emerald-400', trend: '+2.1%', up: true },
                    { label: 'Total Posts', value: stats.totalPosts.toString(), icon: BarChart3, color: 'text-amber-400', trend: '0%', up: true },
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

            {/* AI Insight Hero */}
            {aiInsight && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 -m-4 w-24 h-24 bg-indigo-500/20 blur-3xl rounded-full" />
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
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

            {/* Recent Posts Table */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-white font-bold">Recent Post Performance</h3>
                    <button className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">View All Posts</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest border-b border-white/5">
                                <th className="px-6 py-4">Content</th>
                                <th className="px-6 py-4 text-center">Platform</th>
                                <th className="px-6 py-4 text-center">Engagement</th>
                                <th className="px-6 py-4 text-center">Reach</th>
                                <th className="px-6 py-4 text-right">Published</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {recentPosts.map((post) => (
                                <tr key={post.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-zinc-200 font-medium text-sm group-hover:text-white transition-colors capitalize">{post.title || 'Untitled Post'}</span>
                                            <span className="text-zinc-500 text-xs mt-1 truncate max-w-xs cursor-default">ID: {post.id.slice(0, 8)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 capitalize border border-zinc-700">
                                            {post.platform}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-4">
                                            <div className="flex items-center gap-1.5 text-zinc-400">
                                                <Heart className="w-3.5 h-3.5 text-rose-500/60" />
                                                <span className="text-xs tabular-nums">{post.likes}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-zinc-400">
                                                <Share2 className="w-3.5 h-3.5 text-blue-500/60" />
                                                <span className="text-xs tabular-nums">{post.shares}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-zinc-400">
                                                <Bookmark className="w-3.5 h-3.5 text-amber-500/60" />
                                                <span className="text-xs tabular-nums">{post.saves}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2 text-zinc-200">
                                            <Eye className="w-3.5 h-3.5 text-zinc-500" />
                                            <span className="text-sm font-medium tabular-nums">{post.reach.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-zinc-500 text-xs tabular-nums">
                                        {new Date(post.published_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {recentPosts.length === 0 && (
                        <div className="p-12 text-center text-zinc-500 text-sm italic">
                            No posts tracked yet. Sync your platforms to see performance data.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
