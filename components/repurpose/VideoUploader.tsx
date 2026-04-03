'use client'

import { useState } from 'react'
import { Video, Loader2, CheckCircle2, Link2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function VideoUploader({ brandId }: { brandId: string }) {
  const [videoUrl, setVideoUrl] = useState('')
  const [notes, setNotes] = useState('Hook moment\nProduct close-up\nHands on keyboard')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const router = useRouter()

  const handleUpload = async () => {
    if (!videoUrl.trim()) return
    setIsSubmitting(true)
    setStatus('Creating repurpose job...')

    try {
      const response = await fetch('/api/video/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId,
          videoUrl: videoUrl.trim(),
          bRollNotes: notes
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
        })
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Failed to start repurposer')
      }

      setStatus('Repurpose job started. Refreshing drafts...')
      setTimeout(() => {
        router.refresh()
        setVideoUrl('')
        setStatus(null)
      }, 2000)
    } catch (err) {
      console.error(err)
      setStatus(err instanceof Error ? err.message : 'Error starting repurposer')
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <Video className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <p className="text-zinc-200 text-sm font-semibold mb-1">Repurpose a public video URL</p>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Paste a YouTube link or direct MP4 URL. Scriptbot will create a real repurpose job instead of the old mock flow.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Video URL</span>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3">
            <Link2 className="w-4 h-4 text-zinc-600 shrink-0" />
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-transparent py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
        </label>

        <label className="block">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">What to look for</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
          />
        </label>
      </div>

      <button
        onClick={handleUpload}
        disabled={isSubmitting || !videoUrl.trim()}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        {isSubmitting ? 'Starting repurposer...' : 'Start repurpose job'}
      </button>

      {status && (
        <p className="text-xs text-zinc-400">{status}</p>
      )}
    </div>
  )
}
