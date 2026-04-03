'use client'
import { useState } from 'react'
import { Play, Loader2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const PIPELINE_AGENTS = ['trend-scout', 'idea-generator', 'content-writer']

export default function RunAllAgentsButton({ brandId }: { brandId: string }) {
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [currentAgent, setCurrentAgent] = useState('')

  async function handleRunAll() {
    setState('running')
    try {
      for (const agent of PIPELINE_AGENTS) {
        setCurrentAgent(agent.replace(/-/g, ' '))
        const res = await fetch('/api/run-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent, brandId }),
        })
        if (!res.ok) {
          setState('error')
          return
        }
      }
      setState('done')
      setTimeout(() => setState('idle'), 4000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    } finally {
      setCurrentAgent('')
    }
  }

  return (
    <button
      onClick={handleRunAll}
      disabled={state === 'running'}
      data-testid="run-pipeline-button"
      className={cn(
        'flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all duration-150 cursor-pointer',
        state === 'idle'
          ? 'bg-violet-500/10 border-violet-500/25 text-violet-400 hover:bg-violet-500/20 hover:border-violet-500/40'
          : state === 'running'
            ? 'bg-violet-500/10 border-violet-500/25 text-violet-400 cursor-not-allowed'
            : state === 'done'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
      )}
    >
      {state === 'idle' && <Play className="w-3 h-3 fill-current" />}
      {state === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
      {state === 'done' && <CheckCircle className="w-3 h-3" />}
      {state === 'error' && <span className="w-3 h-3 text-red-400">✕</span>}

      {state === 'idle' && 'Run pipeline'}
      {state === 'running' && currentAgent}
      {state === 'done' && 'Pipeline done'}
      {state === 'error' && 'Failed'}
    </button>
  )
}
