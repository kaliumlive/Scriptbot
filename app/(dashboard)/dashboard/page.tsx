import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import AgentStatusCard from '@/components/dashboard/AgentStatusCard'
import RunAllAgentsButton from '@/components/dashboard/RunAllAgentsButton'
import {
  TrendingUp, FileText, CheckCircle2,
  ArrowRight, ChevronRight, Wifi
} from 'lucide-react'

const AGENTS = [
  { name: 'Trend Scout',      key: 'trend-scout',      frequency: 'Every 4h',  description: 'Finds trending topics in your niche' },
  { name: 'Idea Generator',   key: 'idea-generator',   frequency: 'Daily 6AM', description: 'Turns trends into content concepts' },
  { name: 'Content Writer',   key: 'content-writer',   frequency: 'Daily 8AM', description: 'Writes copy in your voice' },
  { name: 'Voice Learner',    key: 'voice-learner',    frequency: 'On demand', description: 'Learns your style from videos' },
  { name: 'Video Repurposer', key: 'video-repurposer', frequency: 'On demand', description: 'Video → carousels + captions' },
  { name: 'Analytics',        key: 'analytics',        frequency: 'Weekly',    description: 'Surfaces performance insights' },
]

const FLOW = [
  { label: 'Trends',   agent: 'Scout',     from: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20' },
  { label: 'Ideas',    agent: 'Generator', from: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20' },
  { label: 'Copy',     agent: 'Writer',    from: 'bg-fuchsia-500/10', text: 'text-fuchsia-400', border: 'border-fuchsia-500/20' },
  { label: 'Queue',    agent: 'Scheduler', from: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  { label: 'Posted',   agent: 'Publisher', from: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
]

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: brands } = await supabase.from('brands').select('id, name, handle, niche')
  const brandIds = brands?.map((b: { id: string }) => b.id) ?? []
  const hasBrand = brandIds.length > 0
  const brand = brands?.[0]

  let stats = { ideas: 0, drafts: 0, published: 0 }
  if (hasBrand) {
    const [ideas, drafts, published] = await Promise.all([
      supabase.from('content_ideas').select('id', { count: 'exact', head: true }).in('brand_id', brandIds).eq('status', 'idea'),
      supabase.from('content_drafts').select('id', { count: 'exact', head: true }).in('brand_id', brandIds).eq('status', 'draft'),
      supabase.from('published_posts').select('id', { count: 'exact', head: true }).in('brand_id', brandIds),
    ])
    stats = {
      ideas: ideas.count ?? 0,
      drafts: drafts.count ?? 0,
      published: published.count ?? 0,
    }
  }

  // Fetch last run per agent key (one query per agent — lightweight, no DISTINCT ON needed)
  const agentKeys = AGENTS.map(a => a.key)
  const lastRunResults = await Promise.all(
    agentKeys.map(key =>
      supabase
        .from('agent_logs')
        .select('*')
        .eq('agent_name', key)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    )
  )
  const agentLogMap = Object.fromEntries(
    agentKeys.map((key, i) => [key, lastRunResults[i].data ?? null])
  )

  const { data: recentLogs } = await supabase
    .from('agent_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-full bg-[#09090b]">
      <div className="p-7 max-w-[1100px] mx-auto">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-zinc-50 tracking-tight leading-none mb-1.5 font-display">
              {brand
                ? (brand.handle ? `@${brand.handle}` : brand.name)
                : 'Dashboard'}
            </h1>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-500">
                <Wifi className="w-3 h-3" />
                Agents live
              </span>
              <span className="text-zinc-800 text-xs">·</span>
              <span className="text-xs text-zinc-600">GitHub Actions · 24/7</span>
              {brand?.niche && (
                <>
                  <span className="text-zinc-800 text-xs">·</span>
                  <span className="text-xs text-zinc-600">{brand.niche}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/pipeline"
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2 transition-colors cursor-pointer"
            >
              Pipeline <ArrowRight className="w-3 h-3" />
            </Link>
            {hasBrand && brand && (
              <RunAllAgentsButton brandId={brand.id} />
            )}
          </div>
        </div>

        {/* ── Setup CTA ── */}
        {!hasBrand && (
          <div className="mb-8 relative overflow-hidden rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] p-5">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/15 via-transparent to-transparent pointer-events-none" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="text-zinc-200 font-semibold text-sm mb-0.5">Your profile is ready to import</p>
                <p className="text-zinc-500 text-xs">Brand voice intake done — one click to activate agents</p>
              </div>
              <Link
                href="/brands"
                className="shrink-0 flex items-center gap-1.5 bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Import <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* ── Agentic pipeline flow ── */}
        <div className="mb-7">
          <p className="text-[10px] font-semibold text-zinc-700 uppercase tracking-widest mb-3">Pipeline flow</p>
          <div className="flex items-center gap-0">
            {FLOW.map((step, i) => (
              <div key={step.label} className="flex items-center flex-1 min-w-0">
                <div className={`flex-1 flex flex-col items-center px-3 py-2.5 rounded-xl border ${step.border} ${step.from} min-w-0`}>
                  <span className={`text-xs font-bold ${step.text} truncate`}>{step.label}</span>
                  <span className="text-[10px] text-zinc-700 mt-0.5 truncate">{step.agent}</span>
                </div>
                {i < FLOW.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-800 shrink-0 mx-0.5" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          {[
            { label: 'Ideas',     value: stats.ideas,     icon: TrendingUp,   accent: 'text-sky-400',     bg: 'bg-sky-500/10',     ring: 'border-sky-500/20',     href: '/pipeline' },
            { label: 'Drafts',    value: stats.drafts,    icon: FileText,     accent: 'text-violet-400',  bg: 'bg-violet-500/10',  ring: 'border-violet-500/20',  href: '/pipeline' },
            { label: 'Published', value: stats.published, icon: CheckCircle2, accent: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'border-emerald-500/20', href: '/analytics' },
          ].map(stat => (
            <Link key={stat.label} href={stat.href} className="block group cursor-pointer">
              <div className="bg-white/[0.02] border border-white/[0.07] rounded-xl p-4 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-150">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold text-zinc-700 uppercase tracking-widest">{stat.label}</span>
                  <div className={`w-7 h-7 rounded-lg ${stat.bg} border ${stat.ring} flex items-center justify-center`}>
                    <stat.icon className={`w-3.5 h-3.5 ${stat.accent}`} />
                  </div>
                </div>
                <div className="text-[32px] font-bold text-zinc-50 tabular-nums leading-none tracking-tight font-display">
                  {stat.value}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Agents ── */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-zinc-700 uppercase tracking-widest">Agents</p>
            <span className="text-[10px] text-zinc-800">hover any card to run manually</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {AGENTS.map(agent => (
              <AgentStatusCard
                key={agent.key}
                name={agent.name}
                agentKey={agent.key}
                frequency={agent.frequency}
                description={agent.description}
                lastRun={agentLogMap[agent.key] ?? null}
                brandId={brand?.id}
              />
            ))}
          </div>
        </div>

        {/* ── Activity ── */}
        {recentLogs && recentLogs.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-zinc-700 uppercase tracking-widest mb-3">Recent activity</p>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
              {recentLogs.map((log: {
                id: string
                agent_name: string
                status: string
                error_message?: string
                started_at: string
                duration_ms?: number
                items_processed?: number
              }, i: number) => (
                <div
                  key={log.id}
                  className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? 'border-t border-white/[0.04]' : ''}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    log.status === 'complete' ? 'bg-emerald-500' :
                    log.status === 'failed' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'
                  }`} />
                  <span className="text-[13px] text-zinc-400 flex-1 min-w-0 capitalize truncate">
                    {log.agent_name.replace(/-/g, ' ')}
                  </span>
                  {log.error_message && (
                    <span className="text-[11px] text-red-400 truncate max-w-[180px]">{log.error_message}</span>
                  )}
                  {log.items_processed != null && log.items_processed > 0 && (
                    <span className="text-[11px] text-zinc-700 shrink-0">{log.items_processed} items</span>
                  )}
                  {log.duration_ms != null && (
                    <span className="text-[11px] text-zinc-700 tabular-nums shrink-0">
                      {(log.duration_ms / 1000).toFixed(1)}s
                    </span>
                  )}
                  <span className="text-[11px] text-zinc-800 tabular-nums shrink-0">
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
