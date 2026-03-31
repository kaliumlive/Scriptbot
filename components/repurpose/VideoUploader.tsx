'use client'

import { useState } from 'react'
import { Video, Upload, Loader2, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function VideoUploader({ brandId }: { brandId: string }) {
  const [isUploading, setIsUploading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const router = useRouter()

  const handleUpload = async () => {
    setIsUploading(true)
    setStatus('Analyzing video with Gemini Vision...')

    try {
      // Mock upload and trigger agent
      const response = await fetch('/api/run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentType: 'video-repurposer',
          data: {
            brandId,
            videoUrl: 'https://mock-storage.com/video.mp4' // In real app, first upload to Supabase
          }
        })
      })

      if (!response.ok) throw new Error('Failed to start repuposer')

      setStatus('Carousel draft created successfully!')
      setTimeout(() => {
        router.refresh()
        setIsUploading(false)
        setStatus(null)
      }, 2000)
    } catch (err) {
      console.error(err)
      setStatus('Error starting repurposer')
      setIsUploading(false)
    }
  }

  return (
    <div
      onClick={!isUploading ? handleUpload : undefined}
      className={`bg-zinc-900 border border-dashed border-zinc-700 rounded-xl p-8 text-center transition-colors ${!isUploading ? 'hover:border-zinc-600 cursor-pointer' : 'opacity-80'}`}
    >
      {isUploading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
          <p className="text-zinc-300 text-sm font-medium mb-1">{status}</p>
        </div>
      ) : status?.includes('success') ? (
        <div className="flex flex-col items-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-3" />
          <p className="text-zinc-300 text-sm font-medium mb-1">{status}</p>
        </div>
      ) : (
        <>
          <Video className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-300 text-sm font-medium mb-1">Upload video</p>
          <p className="text-zinc-500 text-xs text-balance">MP4, MOV up to 500MB</p>
          <p className="text-zinc-600 text-xs mt-2 uppercase tracking-tight font-semibold">Native Browser Processing</p>
        </>
      )}
    </div>
  )
}
