'use client'
import { useState } from 'react'
import { Mic, Plus, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface VoiceLearnerPanelProps {
  brandId: string
  hasStyleGuide: boolean
}

export default function VoiceLearnerPanel({ brandId, hasStyleGuide }: VoiceLearnerPanelProps) {
  const [urls, setUrls] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  function updateUrl(index: number, value: string) {
    setUrls(prev => prev.map((u, i) => (i === index ? value : u)))
  }

  function addUrl() {
    setUrls(prev => [...prev, ''])
  }

  function removeUrl(index: number) {
    setUrls(prev => prev.filter((_, i) => i !== index))
  }

  async function runVoiceLearner() {
    const validUrls = urls.filter(u => u.trim().startsWith('http'))
    if (!validUrls.length) {
      setResult({ ok: false, message: 'Add at least one YouTube URL' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'voice-learner', brandId, youtubeUrls: validUrls }),
      })
      const data = await res.json()

      if (data.status === 'ok') {
        setResult({
          ok: true,
          message: `Processed ${data.processed} video${data.processed !== 1 ? 's' : ''}. Style guide updated.`,
        })
      } else {
        setResult({ ok: false, message: data.error ?? 'Something went wrong' })
      }
    } catch {
      setResult({ ok: false, message: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Mic className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-medium text-zinc-200">Voice Learner</span>
        {hasStyleGuide && (
          <span className="text-[10px] text-green-400 bg-green-400/10 rounded px-1.5 py-0.5 ml-auto">
            style guide active
          </span>
        )}
      </div>

      <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
        Paste YouTube URLs from your channel. The agent will transcribe them, extract your voice patterns,
        and generate a style guide that all writing agents will use.
      </p>

      <div className="space-y-2 mb-3">
        {urls.map((url, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={e => updateUrl(i, e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
            />
            {urls.length > 1 && (
              <button
                onClick={() => removeUrl(i)}
                className="p-2 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={addUrl}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add another
        </button>

        <button
          onClick={runVoiceLearner}
          disabled={loading}
          className="ml-auto flex items-center gap-2 bg-zinc-50 text-zinc-950 text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Analyzing…
            </>
          ) : (
            'Run Voice Learner'
          )}
        </button>
      </div>

      {result && (
        <div className={`mt-3 flex items-start gap-2 text-xs rounded-lg px-3 py-2.5 ${
          result.ok
            ? 'bg-green-400/10 text-green-400 border border-green-400/20'
            : 'bg-red-400/10 text-red-400 border border-red-400/20'
        }`}>
          {result.ok
            ? <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            : <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          }
          {result.message}
        </div>
      )}
    </div>
  )
}
