'use client'

import React, { useState } from 'react'
import IdeaInput from '@/components/ideate/IdeaInput'
import Storyboarder from '@/components/dashboard/Storyboarder'
import { Sparkles, ArrowLeft, Send, CheckCircle2, Lightbulb, Loader2 } from 'lucide-react'
import Link from 'next/link'

import type { FleshingResult, Idea } from '@/lib/agents/ideation-flesher'

export default function IdeateClient({ brandId }: { brandId: string }) {
  const [result, setResult] = useState<FleshingResult | null>(null)
  const [brainstorming, setBrainstorming] = useState(false)
  const [suggestedIdeas, setSuggestedIdeas] = useState<Idea[] | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  const handleComplete = (data: FleshingResult) => {
    setResult(data)
  }

  const handleBrainstorm = async () => {
    setBrainstorming(true)
    setSuggestedIdeas(null)
    try {
      const res = await fetch('/api/agents/brainstorm', {
        method: 'POST',
        body: JSON.stringify({ brandId })
      })
      const data = await res.json()
      setSuggestedIdeas(data.ideas)
    } catch (error) {
      console.error(error)
    } finally {
      setBrainstorming(false)
    }
  }

  const selectIdea = (idea: Idea) => {
    setSelectedTopic(idea.title + ": " + idea.concept)
    setSuggestedIdeas(null)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50 tracking-tight flex items-center gap-2">
            Ideation Agency
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Transform messy thoughts into high-performance visual scripts
          </p>
        </div>
        
        {(result || suggestedIdeas || selectedTopic) && (
          <button 
            onClick={() => {
              setResult(null)
              setSuggestedIdeas(null)
              setSelectedTopic(null)
            }}
            className="text-xs font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Start Over
          </button>
        )}
      </div>

      {!result ? (
        <div className="py-12">
          {suggestedIdeas ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  AI Suggested Topics
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestedIdeas.map((idea, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectIdea(idea)}
                    className="p-5 text-left bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-indigo-500/50 hover:bg-zinc-800/50 transition-all group"
                  >
                    <h4 className="text-zinc-100 font-bold mb-2 group-hover:text-indigo-400 transition-colors">{idea.title}</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2 mb-3">{idea.concept}</p>
                    <div className="flex gap-2">
                      {idea.hashtags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] text-zinc-600">#{tag}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              <IdeaInput 
                brandId={brandId} 
                initialTopic={selectedTopic || ''} 
                onComplete={(data: FleshingResult) => handleComplete(data)} 
              />
              
              {!selectedTopic && (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-px w-32 bg-zinc-800"></div>
                  <button
                    onClick={handleBrainstorm}
                    disabled={brainstorming}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm font-medium"
                  >
                    {brainstorming ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Lightbulb className="w-4 h-4" />
                    )}
                    {brainstorming ? 'Agent is brainstorming...' : 'I have no ideas (Ask the Agency)'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {/* Header Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                  Agent Result
                </div>
                {result.hashtags?.map((tag: string) => (
                  <span key={tag} className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">#{tag}</span>
                ))}
              </div>

              <h2 className="text-3xl font-black text-zinc-50 leading-tight mb-4">
                {result.title}
              </h2>

              <p className="text-zinc-400 text-sm italic leading-relaxed max-w-2xl">
                &ldquo;{result.concept}&rdquo;
              </p>

              <div className="flex items-center gap-4 mt-8">
                <Link 
                  href="/repurpose"
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-bold transition-all border border-zinc-700/50"
                >
                  View All Drafts
                </Link>
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4" />
                  Auto-Saved to Cloud
                </div>
              </div>
            </div>
          </div>

          {/* Storyboard Section */}
          <div className="grid grid-cols-1 gap-8">
            <Storyboarder beats={result.storyboard} />
          </div>

          {/* Navigation/Actions */}
          <div className="flex justify-end pt-8 border-t border-zinc-900">
             <button className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-xl shadow-indigo-600/20">
                Sync to Production
                <Send className="w-4 h-4" />
             </button>
          </div>
        </div>
      )}
    </div>
  )
}
