'use client'

import React from 'react'
import { Clapperboard, Video, Box, ExternalLink, Music, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Beat {
  text: string
  visual: string
  style: 'cinematic' | 'mograph' | 'talking-head' | 'movie-clip'
  movie_reference?: string
  youtube_search_query?: string
  audio_cue?: string
  duration: number
}

interface StoryboarderProps {
  beats: Beat[]
  className?: string
}

const StyleIcon = ({ style }: { style: Beat['style'] }) => {
  switch (style) {
    case 'cinematic': return <Video className="w-3 h-3" />
    case 'mograph': return <Box className="w-3 h-3" />
    case 'movie-clip': return <Clapperboard className="w-3 h-3" />
    default: return <Video className="w-3 h-3" />
  }
}

const StyleBadge = ({ style }: { style: Beat['style'] }) => {
  const styles = {
    cinematic: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    mograph: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'talking-head': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'movie-clip': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  }

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
      styles[style]
    )}>
      <StyleIcon style={style} />
      {style.replace('-', ' ')}
    </div>
  )
}

export default function Storyboarder({ beats, className }: StoryboarderProps) {
  if (!beats || beats.length === 0) return null

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Clapperboard className="w-3.5 h-3.5" />
          Audio-Visual Storyboard
        </h3>
        <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-medium">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {beats.reduce((acc, b) => acc + (b.duration || 0), 0).toFixed(1)}s Total</span>
          <span className="flex items-center gap-1"><Music className="w-3 h-3" /> Sync Mode: Enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {beats.map((beat, i) => (
          <div 
            key={i}
            className="group relative bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4 hover:border-zinc-700/50 transition-all hover:bg-zinc-900/60"
          >
            <div className="absolute -left-2 top-4 w-5 h-5 bg-zinc-800 border border-zinc-700 rounded-md flex items-center justify-center text-[10px] font-bold text-zinc-500 group-hover:text-zinc-300 transition-colors">
              {i + 1}
            </div>
            
            <div className="ml-4 grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Script Text */}
              <div className="md:col-span-6">
                <p className="text-sm text-zinc-200 leading-relaxed font-medium">
                  &ldquo;{beat.text}&rdquo;
                </p>
                {beat.audio_cue && (
                   <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      <Music className="w-3 h-3 text-indigo-400" />
                      {beat.audio_cue}
                   </div>
                )}
              </div>

              {/* Visual Cue */}
              <div className="md:col-span-6 flex flex-col justify-between items-end gap-3 text-right">
                <div className="space-y-2 flex flex-col items-end">
                  <StyleBadge style={beat.style} />
                  <p className="text-[11px] text-zinc-400 font-semibold leading-tight italic max-w-[200px]">
                    {beat.visual}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {(beat.youtube_search_query || beat.movie_reference) && (
                    <a 
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                        (beat.youtube_search_query || (beat.movie_reference + ' scene')) + 
                        (beat.style === 'movie-clip' ? ' "official clip" -review -reaction -recap -essay -breakdown -tribute -fan -edit -comparison' : '')
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] transition-all border font-bold uppercase tracking-widest",
                        beat.style === 'movie-clip' 
                          ? "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30" 
                          : "bg-zinc-800/50 hover:bg-indigo-500/10 text-zinc-400 hover:text-indigo-400 border-zinc-700/50 hover:border-indigo-500/30"
                      )}
                    >
                      <ExternalLink className="w-3 h-3" />
                      {beat.style === 'movie-clip' ? 'Source Movie Clip' : 'Find Asset'}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
