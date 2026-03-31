'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SeedBrandButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function seed() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/seed-brand', { method: 'POST' })
      const data = await res.json()
      if (data.status === 'ok' && data.brandId) {
        router.push(`/brands/${data.brandId}`)
      } else if (res.status === 409 && data.brandId) {
        router.push(`/brands/${data.brandId}`)
      } else {
        setError(data.error ?? 'Something went wrong')
        setLoading(false)
      }
    } catch {
      setError('Network error')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={seed}
        disabled={loading}
        className="flex items-center gap-2 bg-zinc-50 text-zinc-950 text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 mx-auto"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? 'Importing…' : 'Import kalium.wav profile'}
      </button>
      {error && <p className="text-xs text-red-400 mt-3">{error}</p>}
    </div>
  )
}
