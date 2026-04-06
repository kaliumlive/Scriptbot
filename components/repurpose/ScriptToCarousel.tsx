'use client'

import { useState } from 'react'
import { FileText, Loader2, Sparkles, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ScriptToCarousel({ brandId }: { brandId: string }) {
  const [script, setScript] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const router = useRouter()

  const steps = [
    'Reading your script...',
    'Identifying key beats...',
    'Writing slides in your voice...',
    'Saving carousel draft...',
  ]

  const handleGenerate = async () => {
    if (!script.trim() || loading) return
    setLoading(true)
    setError(null)
    setStep(0)

    const interval = setInterval(() => {
      setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 1800)

    try {
      const res = await fetch('/api/repurpose/script-to-carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, script: script.trim() }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      clearInterval(interval)
      setScript('')
      router.refresh() // reload page to show new draft in Recent Drafts
    } catch (err) {
      clearInterval(interval)
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('rate_limit_exceeded') || msg.includes('429')) {
        const retryMatch = msg.match(/try again in (\d+m\d+s|\d+h\d+m|\d+\.\d+s)/i)
        setError(retryMatch
          ? `Groq token limit reached. Try again in ${retryMatch[1]}.`
          : 'Groq token limit reached. Try again in a few minutes.')
      } else {
        setError('Failed to generate carousel. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <p className="text-zinc-200 text-sm font-semibold mb-1">Script → Carousel</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Paste any script. The agent breaks it into punchy swipe slides in your voice.
          </p>
        </div>
      </div>

      {/* Textarea */}
      <label className="block">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Your script</span>
        <textarea
          value={script}
          onChange={e => setScript(e.target.value)}
          disabled={loading}
          rows={7}
          placeholder={"Paste your short-form script here...\n\nExample:\nI used to copy every producer I admired. Exact same plugins, same sample packs, same mixing chain. My tracks sounded clean but they felt like nobody. Here's what changed that."}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 resize-none disabled:opacity-50"
        />
      </label>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-3 py-1">
          <Loader2 className="w-4 h-4 text-violet-400 animate-spin shrink-0" />
          <p className="text-xs text-zinc-400 animate-pulse">{steps[step]}</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleGenerate}
        disabled={loading || !script.trim()}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
        ) : (
          <><Sparkles className="w-4 h-4" /> Generate Carousel</>
        )}
      </button>
    </div>
  )
}
