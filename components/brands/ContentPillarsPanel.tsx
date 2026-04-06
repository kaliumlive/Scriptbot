'use client'

import { useState } from 'react'
import { Plus, X, Save, BookOpen, Loader2, Check, AlertTriangle } from 'lucide-react'

interface ContentPillarsPanelProps {
  brandId: string
  initialPillars?: string[]
  initialOffLimits?: string
  initialExamplePosts?: string[]
}

export default function ContentPillarsPanel({
  brandId,
  initialPillars = [],
  initialOffLimits = '',
  initialExamplePosts = [],
}: ContentPillarsPanelProps) {
  const [pillars, setPillars] = useState<string[]>(initialPillars)
  const [newPillar, setNewPillar] = useState('')
  const [offLimits, setOffLimits] = useState(initialOffLimits)
  const [examplePosts, setExamplePosts] = useState<string[]>(initialExamplePosts)
  const [newExample, setNewExample] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addPillar = () => {
    const trimmed = newPillar.trim()
    if (!trimmed || pillars.includes(trimmed)) return
    setPillars(prev => [...prev, trimmed])
    setNewPillar('')
    setSaved(false)
  }

  const removePillar = (pillar: string) => {
    setPillars(prev => prev.filter(p => p !== pillar))
    setSaved(false)
  }

  const addExample = () => {
    const trimmed = newExample.trim()
    if (!trimmed) return
    setExamplePosts(prev => [...prev, trimmed])
    setNewExample('')
    setSaved(false)
  }

  const removeExample = (idx: number) => {
    setExamplePosts(prev => prev.filter((_, i) => i !== idx))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/brands/${brandId}/pillars`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_pillars: pillars,
          off_limits_topics: offLimits,
          example_posts: examplePosts,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-6 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium text-zinc-200">Content Pillars</span>
        </div>
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
          Guides all AI agents
        </span>
      </div>

      <p className="text-xs text-zinc-500 leading-relaxed -mt-2">
        Tell the agents what topics you make content about — and what you refuse to touch.
        Every idea, script, and carousel will stay within these boundaries.
      </p>

      {/* Content Pillars */}
      <div className="space-y-3">
        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
          Your Content Pillars
        </label>

        {/* Existing pillars */}
        {pillars.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pillars.map(pillar => (
              <span
                key={pillar}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-300"
              >
                {pillar}
                <button
                  onClick={() => removePillar(pillar)}
                  className="hover:text-red-400 transition-colors"
                  aria-label={`Remove ${pillar}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {pillars.length === 0 && (
          <p className="text-xs text-zinc-600 italic">
            No pillars yet. Add the topics you want to build content around.
          </p>
        )}

        {/* Add pillar input */}
        <div className="flex gap-2">
          <input
            value={newPillar}
            onChange={e => setNewPillar(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addPillar()}
            placeholder="e.g. Music production, Music business, Creative process..."
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          />
          <button
            onClick={addPillar}
            disabled={!newPillar.trim()}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Off-limits topics */}
      <div className="space-y-2">
        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
          Off-Limits Topics
        </label>
        <textarea
          value={offLimits}
          onChange={e => { setOffLimits(e.target.value); setSaved(false) }}
          rows={3}
          placeholder="Topics you refuse to make content about. Agents will never generate ideas in these areas.&#10;&#10;Example: gear reviews, DAW comparisons, industry gossip, politics"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
        />
      </div>

      {/* Example posts */}
      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
            Example Content (Optional)
          </label>
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            Paste URLs or short descriptions of content you&apos;ve already made.
            Agents use these as style and topic reference — and avoid repeating them.
          </p>
        </div>

        {examplePosts.length > 0 && (
          <div className="space-y-2">
            {examplePosts.map((post, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
                <span className="text-xs text-zinc-400 flex-1 line-clamp-2 leading-relaxed">{post}</span>
                <button
                  onClick={() => removeExample(idx)}
                  className="text-zinc-600 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={newExample}
            onChange={e => setNewExample(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addExample()}
            placeholder="URL or description of a post you've made..."
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
          />
          <button
            onClick={addExample}
            disabled={!newExample.trim()}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 text-xs font-semibold hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
          saved
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-indigo-600 text-white hover:bg-indigo-500'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {saving ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
        ) : saved ? (
          <><Check className="w-3.5 h-3.5" /> Saved — agents updated</>
        ) : (
          <><Save className="w-3.5 h-3.5" /> Save Content Pillars</>
        )}
      </button>
    </div>
  )
}
