import { cn } from '@/lib/utils'

interface AgentLog {
  status: string
  started_at: string
  completed_at?: string
  duration_ms?: number
  items_processed?: number
}

interface AgentStatusCardProps {
  name: string
  agentKey: string
  frequency: string
  description: string
  lastRun?: AgentLog | null
}

export default function AgentStatusCard({ name, frequency, description, lastRun }: AgentStatusCardProps) {
  const status = lastRun?.status ?? 'idle'

  return (
    <div className={cn(
      'rounded-xl p-3.5 border transition-all duration-150',
      status === 'running'
        ? 'bg-amber-500/5 border-amber-500/20'
        : status === 'failed'
          ? 'bg-red-500/5 border-red-500/15'
          : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]'
    )}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0 mt-0.5',
            status === 'complete' && 'bg-emerald-400',
            status === 'running' && 'bg-amber-400 animate-pulse',
            status === 'failed' && 'bg-red-400',
            status === 'idle' && 'bg-zinc-700'
          )} />
          <span className="text-xs font-medium text-zinc-300 truncate">{name}</span>
        </div>
        <span className="text-[10px] text-zinc-700 shrink-0 tabular-nums">{frequency}</span>
      </div>

      <p className="text-[11px] text-zinc-600 leading-snug mb-2.5">{description}</p>

      <div className="text-[10px] tabular-nums">
        {lastRun ? (
          <span className={cn(
            status === 'complete' ? 'text-emerald-600' :
            status === 'failed' ? 'text-red-500' : 'text-amber-600'
          )}>
            {status === 'running' ? 'running…' : new Date(lastRun.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {lastRun.duration_ms != null && status !== 'running' && ` · ${(lastRun.duration_ms / 1000).toFixed(1)}s`}
            {lastRun.items_processed != null && lastRun.items_processed > 0 && ` · ${lastRun.items_processed} items`}
          </span>
        ) : (
          <span className="text-zinc-800">never run</span>
        )}
      </div>
    </div>
  )
}
