'use client'

import React, { useState, useEffect } from 'react'
import { Sparkles, Loader2, BrainCircuit, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FleshingResult } from '@/lib/agents/ideation-flesher'

interface IdeaInputProps {
  brandId: string
  initialTopic?: string
  onComplete: (result: FleshingResult) => void
}

export default function IdeaInput({ brandId, initialTopic = '', onComplete }: IdeaInputProps) {
  const [topic, setTopic] = useState(initialTopic)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Update topic if initialTopic changes (e.g. from brainstorming)
  useEffect(() => {
    if (initialTopic) setTopic(initialTopic)
  }, [initialTopic])

  const steps = [
    "Analyzing your brand voice...",
    "Brainstorming angles...",
    "Drafting the high-retention script...",
    "Building the AV storyboard beats...",
    "Finalizing visual styles..."
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic || loading) return

    setLoading(true)
    setError(null)
    setStep(0)

    // Fake progress for better UX
    const interval = setInterval(() => {
      setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 2500)

    try {
      const res = await fetch('/api/agents/flesh-out', {
        method: 'POST',
        body: JSON.stringify({ brandId, topic })
      })
      const result = await res.json()
      if (result.error) throw new Error(result.error)

      clearInterval(interval)
      onComplete(result)
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : String(err)
      // Parse rate limit: extract retry time if present
      const retryMatch = msg.match(/try again in (\d+m\d+s|\d+h\d+m|\d+\.\d+s)/i)
      if (msg.includes('rate_limit_exceeded') || msg.includes('429')) {
        setError(retryMatch
          ? `Groq daily token limit reached. Try again in ${retryMatch[1]}.`
          : 'Groq daily token limit reached. Try again in a few minutes.')
      } else {
        setError('Agent failed to flesh out the idea. Please try again.')
      }
    } finally {
      setLoading(false)
      clearInterval(interval)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-focus-within:opacity-50"></div>
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4 text-zinc-400">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Ideation Flesher Agent</span>
            </div>
            
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              data-testid="ideate-topic-input"
              placeholder="Paste a raw topic, a link, or a messy thought... &ldquo;How to build a home studio on a budget of $500&rdquo;"
              className="w-full bg-transparent border-none focus:ring-0 text-zinc-100 placeholder:text-zinc-600 text-lg resize-none min-h-[120px] leading-relaxed"
              disabled={loading}
            />

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-900">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                  title="I'm feeling lucky"
                >
                  <Wand2 className="w-4 h-4" />
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !topic}
                data-testid="ideate-submit-button"
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/10",
                  loading 
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking...
                  </>
                ) : (
                  <>
                    Flesh it out
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="shrink-0">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative w-12 h-12 mb-6">
              <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-b-2 border-purple-500 animate-spin-slow"></div>
            </div>
            <p className="text-zinc-400 text-sm font-medium animate-pulse">
              {steps[step]}
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
