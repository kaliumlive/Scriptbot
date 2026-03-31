import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AgentStatusCard from '@/components/dashboard/AgentStatusCard'
import { TrendingUp, FileText, Clock, CheckCircle2, ArrowRight, Zap } from 'lucide-react'

const AGENTS = [
  { name: 'Trend Scout',      key: 'trend-scout',      frequency: 'Every 4h',  description: 'Finds trending topics in your niche' },
  { name: 'Idea Generator',   key: 'idea-generator',   frequency: 'Daily 6AM', description: 'Turns trends into content concepts' },
  { name: 'Content Writer',   key: 'content-writer',   frequency: 'Daily 8AM', description: 'Writes scripts in your voice' },
  { name: 'Voice Learner',    key: 'voice-learner',    frequency: 'On demand', description: 'Learns from your existing videos' },
  { name: 'Video Repurposer', key: 'video-repurposer', frequency: 'On demand', description: 'Video → carousels + captions' },
  { name: 'Scheduler',        key: 'scheduler',        frequency: 'Daily 8AM', description: 'Queues posts at optimal times' },
  { name: 'Publisher',        key: 'publisher',        frequency: 'Hourly',    description: 'Posts to all platforms' },
  { name: 'Analytics',        key: 'analytics',        frequency: 'Weekly',    description: 'Insights from your performance' },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  // Auth disabled — fetch all brands
  const { data: brands } = await supabase.from('brands').select('id, name, handle')
  const brandIds = brands?.map((b: { id: string }) => b.id) ?? []
  const hasBrand = brandIds.length > 0
  const brand = brands?.[0]

  let stats = { ideas: 0, drafts: 0, scheduled: 0, published: 0 }
  if (hasBrand) {
    const [ideas, drafts, scheduled, published] = await Promise.all([
      supabase.from('content_ideas').select('id', { count: 'exact', head: true }).in('brand_id', brandIds).eq('status', 'idea'),
      supabase.from('content_drafts').select('id', { count: 'exact', head: true }).in('brand_id', brandIds).eq('status', 'draft'),
      supabase.from('scheduled_posts').select('id', { count: 'exact', head: true }).in('brand_id', brandIds).eq('status', 'scheduled'),
      supabase.from('published_posts').select('id', { count: 'exact', head: true }).in('brand_id', brandIds),
    ])
    stats = { ideas: ideas.count ?? 0, drafts: drafts.count ?? 0, scheduled: scheduled.count ?? 0, published: published.count ?? 0 }
  }

  const { data: recentLogs } = await supabase
    .from('agent_logs').select('*').order('started_at', { ascending: false }).limit(8)

  return (
    <div className="min-h-full bg-grid">
      <div className="p-8 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-50 tracking-tight">
              {brand ? (brand.handle ? `@${brand.handle}` : brand.name) : 'Dashboard'}
            </h1>
            <p className="text-zinc-600 text-sm mt-1">Agents running autonomously · 24/7</p>
          </div>
          {hasBrand && (
            <Link href="/pipeline" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 glass rounded-lg px-3 py-2 transition-all duration-200">
              Open pipeline <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Setup CTA */}
        {!hasBrand && (
          <div className="mb-8 relative overflow-hidden rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] p-6">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/15 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-zinc-200 font-medium text-sm">Your profile is ready to import</p>
                  <p className="text-zinc-500 text-xs mt-0.5">Brand voice intake already done — one click to activate</p>
                </div>
              </div>
              <Link href="/brands" className="shrink-0 flex items-center gap-1.5 bg-violet-500 hover:bg-violet-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors duration-200">
                Import <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Ideas',     value: stats.ideas,     icon: TrendingUp,   accent: 'text-sky-400',     bg: 'bg-sky-500/10',     ring: 'border-sky-500/20' },
            { label: 'Drafts',    value: stats.drafts,    icon: FileText,     accent: 'text-amber-400',   bg: 'bg-amber-500/10',   ring: 'border-amber-500/20' },
            { label: 'Scheduled', value: stats.scheduled, icon: Clock,        accent: 'text-violet-400',  bg: 'bg-violet-500/10',  ring: 'border-violet-500/20' },
            { label: 'Published', value: stats.published, icon: CheckCircle2, accent: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'border-emerald-500/20' },
          ].map(stat => (
            <div key={stat.label} className="glass-hover rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-widest">{stat.label}</span>
                <div className={`w-7 h-7 rounded-lg ${stat.bg} border ${stat.ring} flex items-center justify-center`}>
                  <stat.icon className={`w-3.5 h-3.5 ${stat.accent}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-zinc-50 tabular-nums tracking-tight">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Agents */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest">Agents</h2>
            <span className="text-[11px] text-zinc-800">GitHub Actions · auto-scheduled</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {AGENTS.map(agent => (
              <AgentStatusCard
                key={agent.key}
                name={agent.name}
                agentKey={agent.key}
                frequency={agent.frequency}
                description={agent.description}
                lastRun={recentLogs?.find((l: { agent_name: string }) => l.agent_name === agent.key) ?? null}
              />
            ))}
          </div>
        </div>

        {/* Activity */}
        {recentLogs && recentLogs.length > 0 && (
          <div>
            <h2 className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">Activity</h2>
            <div className="glass rounded-xl overflow-hidden">
              {recentLogs.map((log: {
                id: string; agent_name: string; status: string;
                error_message?: string; started_at: string; duration_ms?: number; items_processed?: number
              }, i: number) => (
                <div key={log.id} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    log.status === 'complete' ? 'bg-emerald-400' :
                    log.status === 'failed' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'
                  }`} />
                  <span className="text-sm text-zinc-400 flex-1 min-w-0 capitalize">{log.agent_name.replace(/-/g, ' ')}</span>
                  {log.items_processed != null && log.items_processed > 0 && (
                    <span className="text-xs text-zinc-700">{log.items_processed} items</span>
                  )}
                  {log.duration_ms != null && (
                    <span className="text-xs text-zinc-700 tabular-nums">{(log.duration_ms / 1000).toFixed(1)}s</span>
                  )}
                  <span className="text-xs text-zinc-800 tabular-nums shrink-0">
                    {new Date(log.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
