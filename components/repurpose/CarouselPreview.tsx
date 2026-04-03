'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Edit3, Send, Check } from 'lucide-react'
import Image from 'next/image'

interface Slide {
  title: string
  content: string
  image_url?: string
  imageUrl?: string
}

interface CarouselDraft {
  id: string
  brand_id: string
  title?: string | null
  created_at: string
  status: string
  carousel_slides?: Slide[] | null
}

export default function CarouselPreview({ draft }: { draft: CarouselDraft }) {
  const slides: Slide[] = draft.carousel_slides || []
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isApproving, setIsApproving] = useState(false)
  const [isApproved, setIsApproved] = useState(draft.status === 'approved' || draft.status === 'scheduled')

  const handleApprove = async () => {
    setIsApproving(true)
    // Mock approve/schedule
    try {
      const response = await fetch('/api/run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'scheduler',
          brandId: draft.brand_id
        })
      })
      if (!response.ok) throw new Error('Failed to run scheduler')
      setIsApproved(true)
    } finally {
      setIsApproving(false)
    }
  }

  if (slides.length === 0) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="flex flex-col md:flex-row">
        {/* Preview Area */}
        <div className="flex-1 bg-black p-8 flex items-center justify-center min-h-[400px] relative group">
          <div className="w-[300px] h-[300px] bg-zinc-900 rounded-lg shadow-2xl flex flex-col p-6 text-center border border-zinc-800">
            {(slides[currentSlide].image_url || slides[currentSlide].imageUrl) && (
              <div className="w-full h-32 bg-zinc-800 rounded mb-4 overflow-hidden">
                <Image
                  src={slides[currentSlide].image_url || slides[currentSlide].imageUrl || ''}
                  alt=""
                  width={512}
                  height={256}
                  className="w-full h-full object-cover opacity-50"
                />
              </div>
            )}
            <h4 className="text-xl font-bold text-white mb-2 leading-tight">{slides[currentSlide].title}</h4>
            <p className="text-sm text-zinc-400 line-clamp-3">{slides[currentSlide].content}</p>
            <div className="mt-auto text-[10px] text-zinc-600 font-bold uppercase tracking-widest italic">
              Slide {currentSlide + 1} of {slides.length}
            </div>
          </div>

          <button
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            className="absolute left-4 p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
            className="absolute right-4 p-2 bg-zinc-800/80 rounded-full hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Controls Area */}
        <div className="w-full md:w-72 p-6 border-t md:border-t-0 md:border-l border-zinc-800 bg-zinc-900/50 flex flex-col">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-zinc-200 mb-1">{draft.title || 'Untitled Draft'}</h3>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
              Generated {new Date(draft.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-2 mt-auto">
            <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-300 text-xs font-semibold hover:bg-zinc-700 transition-colors">
              <Edit3 className="w-3.5 h-3.5" /> Edit Slides
            </button>
            <button
              onClick={handleApprove}
              disabled={isApproved || isApproving}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${isApproved
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
                }`}
            >
              {isApproving ? 'Scheduling...' : isApproved ? <><Check className="w-3.5 h-3.5" /> Scheduled</> : <><Send className="w-3.5 h-3.5" /> Approve & Schedule</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
