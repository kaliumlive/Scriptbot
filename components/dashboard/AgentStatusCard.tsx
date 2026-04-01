'use client'
import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Play, Loader2 } from 'lucide-react'

interface AgentLog {
  status: string
  started_at: string
  duration_ms?: number
  items_processed?: number
  error_message?: string
}

interface AgentStatusCardProps {
  name: string
  agentKey: string
  frequency: string
  description: string
  lastRun?: AgentLog | null
  brandId?: string
}

export default function AgentStatusCard({
  name,
  agentKey,
  frequency,
  description,
  lastRun,
  brandId,
}: AgentStatusCardProps) {
  const [mounted, setMounted] = useState(false)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const status = lastRun?.status ?? 'idle'

  async function handleRun() {
    if (!brandId || running) return
    setRunning(true)
    setRunResult(null)
    try {
      const res = await fetch('/api/run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentKey, brandId }),
      })
      setRunResult(res.ok ? 'success' : 'error')
    } catch {
      setRunResult('error')
    } finally {
      setRunning(false)
    }
  }

  const dotColor = running
    ? 'bg-violet-400 animate-pulse'
    : runResult === 'success'
      ? 'bg-emerald-400'
      : runResult === 'error'
        ? 'bg-red-400'
        : status === 'complete'
          ? 'bg-emerald-400'
          : status === 'running'
            ? 'bg-amber-400 animate-pulse'
            : status === 'failed'
              ? 'bg-red-400'
              : 'bg-zinc-700'

  const cardBorder = running
    ? 'border-violet-500/25 bg-violet-500/[0.04]'
    : runResult === 'success'
      ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
      : runResult === 'error'
        ? 'border-red-500/20 bg-red-500/[0.03]'
        : status === 'running'
          ? 'border-amber-500/20 bg-amber-500/[0.03]'
          : status === 'failed'
            ? 'border-red-500/15 bg-red-500/[0.03]'
            : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.03]'

  return (
    <div className={cn('rounded-xl p-4 border transition-all duration-150 group cursor-default', cardBorder)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('w-1.5 h-1.5 rounded-full shrink-0 mt-px', dotColor)} />
          <span className="text-xs font-semibold text-zinc-200 truncate">{name}</span>
        </div>
        {brandId && (
          <button
            onClick={handleRun}
            disabled={running}
            title={`Run ${name}`}
            className={cn(
              'shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150 cursor-pointer',
              running
                ? 'bg-violet-500/20 text-violet-400'
                : 'bg-white/[0.04] text-zinc-700 hover:bg-violet-500/20 hover:text-violet-400 opacity-0 group-hover:opacity-100'
            )}
          >
            {running ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
          </button>
        )}
      </div>

      <p className="text-[11px] text-zinc-600 leading-snug mb-3">{description}</p>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-zinc-800 font-mono">{frequency}</span>
        <div className="text-[10px] tabular-nums">
          {running ? (
            <span className="text-violet-500">running…</span>
          ) : runResult === 'success' ? (
            <span className="text-emerald-500">done ✓</span>
          ) : runResult === 'error' ? (
            <span className="text-red-500">failed</span>
          ) : lastRun && mounted ? (
            <span className={cn(
              status === 'complete' ? 'text-emerald-700' :
              status === 'failed' ? 'text-red-500' : 'text-amber-600'
            )}>
              {new Date(lastRun.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {lastRun.duration_ms != null && ` · ${(lastRun.duration_ms / 1000).toFixed(1)}s`}
              {lastRun.items_processed != null && lastRun.items_processed > 0 && ` · ${lastRun.items_processed}`}
            </span>
          ) : lastRun && !mounted ? (
            <span className="text-zinc-800 opacity-0">loading…</span>
          ) : (
            <span className="text-zinc-800">never run</span>
          )}
        </div>
      </div>
    </div>
  )
}
