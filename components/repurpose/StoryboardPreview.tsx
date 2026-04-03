'use client'

import React, { useState } from 'react'
import { Clapperboard, Send, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import Storyboarder from '@/components/dashboard/Storyboarder'

interface StoryboardBeat {
  text: string
  visual: string
  style: 'cinematic' | 'mograph' | 'talking-head' | 'movie-clip'
  movie_reference?: string
  youtube_search_query?: string
  audio_cue?: string
  duration: number
}

interface StoryboardPreviewProps {
  draft: {
    id: string
    brand_id: string
    title?: string | null
    content_type?: string | null
    status: string
    script?: string | null
    storyboard?: StoryboardBeat[] | null
    platform_captions?: Record<string, string> | null
  }
}

export default function StoryboardPreview({ draft }: StoryboardPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isApproved, setIsApproved] = useState(draft.status === 'approved' || draft.status === 'scheduled')

  const handleApprove = async () => {
    setIsApproving(true)
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

  const storyboard = draft.storyboard || []
  const totalDuration = storyboard.reduce((acc, beat) => acc + (beat.duration || 0), 0)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl transition-all">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
               <Clapperboard className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 mb-1">{draft.title || 'Visual Script'}</h3>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                  {draft.content_type?.replace('_', ' ') || 'Short Video'}
                </span>
                <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
                <span className="text-[10px] text-zinc-500 font-medium">
                  {storyboard.length} Beats • {totalDuration.toFixed(1)}s
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <button 
               onClick={() => setIsExpanded(!isExpanded)}
               className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
             >
               {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
             </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-8 pt-8 border-t border-zinc-800/50 space-y-6 animate-in slide-in-from-top-2 duration-300">
             <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/30">
                <p className="text-zinc-400 text-xs leading-relaxed italic">
                  &ldquo;{draft.script?.substring(0, 200)}...&rdquo;
                </p>
             </div>
             
             <Storyboarder beats={storyboard} />
             
             {draft.platform_captions && Object.keys(draft.platform_captions).length > 0 && (
               <div className="pt-6 border-t border-zinc-800/50">
                 <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-4">Platform Captions</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {Object.entries(draft.platform_captions).map(([platform, caption]) => (
                     <div key={platform} className="bg-zinc-950 border border-zinc-800/50 rounded-xl overflow-hidden group/caption">
                       <div className="px-3 py-2 bg-white/[0.02] border-b border-zinc-800/50 flex items-center justify-between">
                         <span className={cn(
                           "text-[9px] uppercase font-bold tracking-widest",
                           platform === 'instagram' && 'text-pink-400',
                           platform === 'tiktok' && 'text-cyan-400',
                           platform === 'youtube' && 'text-red-400',
                           !['instagram', 'tiktok', 'youtube'].includes(platform) && 'text-zinc-400'
                         )}>
                           {platform}
                         </span>
                         <button 
                           onClick={() => {
                             navigator.clipboard.writeText(caption)
                             // Optional: add a toast bit here
                           }}
                           className="text-[10px] text-zinc-600 hover:text-zinc-300 font-medium transition-colors opacity-0 group-hover/caption:opacity-100"
                         >
                           Copy
                         </button>
                       </div>
                       <div className="p-3">
                         <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-4 group-hover/caption:line-clamp-none transition-all">
                           {caption}
                         </p>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleApprove}
                  disabled={isApproved || isApproving}
                  className={cn(
                    "flex items-center gap-2 py-2 px-6 rounded-xl text-xs font-bold transition-all",
                    isApproved
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'
                  )}
                >
                  {isApproving ? 'Scheduling...' : isApproved ? <><Check className="w-3.5 h-3.5" /> Scheduled</> : <><Send className="w-3.5 h-3.5" /> Approve & Post</>}
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  )
}
