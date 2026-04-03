'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContentIdea  { id: string; title: string; hook?: string; content_type?: string; created_at: string }
interface ContentDraft { id: string; title?: string; content_type: string; hook?: string; created_at: string }
interface PublishedPost { id: string; platform: string; published_at: string; content_drafts?: { title?: string } | null }

interface KanbanBoardProps {
  brandId: string
  ideas: ContentIdea[]
  drafts: ContentDraft[]
  approved: ContentDraft[]
  published: PublishedPost[]
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  short_video: 'Short video', reel: 'Reel', carousel: 'Carousel',
  thread: 'Thread', long_video: 'Long video',
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'text-pink-400', tiktok: 'text-zinc-300',
  twitter: 'text-sky-400', x: 'text-sky-400',
  youtube: 'text-red-400',
}

export default function KanbanBoard({ brandId, ideas, drafts, approved, published }: KanbanBoardProps) {
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  async function addIdea() {
    if (!newTitle.trim()) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('content_ideas').insert({
      brand_id: brandId, title: newTitle.trim(), status: 'idea', source: 'user',
    })
    setNewTitle('')
    setAdding(false)
    setLoading(false)
    window.location.reload()
  }

  async function approveIdea(id: string) {
    const supabase = createClient()
    await supabase.from('content_ideas').update({ status: 'approved' }).eq('id', id)
    window.location.reload()
  }

  const columns = [
    { key: 'ideas',     label: 'Ideas',     count: ideas.length,     dot: 'bg-sky-400',     items: ideas },
    { key: 'drafts',    label: 'Drafts',    count: drafts.length,    dot: 'bg-amber-400',   items: drafts },
    { key: 'approved',  label: 'Approved',  count: approved.length,  dot: 'bg-violet-400',  items: approved },
    { key: 'published', label: 'Published', count: published.length, dot: 'bg-emerald-400', items: published },
  ]

  return (
    <div className="grid grid-cols-4 gap-4 min-h-[600px]">
      {columns.map(col => (
        <div key={col.key} className="flex flex-col">
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{col.label}</span>
            <span className="ml-auto text-[11px] text-zinc-700 tabular-nums">{col.count}</span>
          </div>

          <div className="flex-1 space-y-2">
            {col.key === 'ideas' && (ideas as ContentIdea[]).map(item => (
              <div key={item.id} className="glass-hover rounded-xl p-3.5 group">
                <p className="text-sm text-zinc-200 leading-snug font-medium">{item.title}</p>
                {item.hook && <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed line-clamp-2">{item.hook}</p>}
                {item.content_type && (
                  <span className="inline-block text-[10px] text-zinc-700 bg-white/[0.04] rounded px-1.5 py-0.5 mt-2">
                    {CONTENT_TYPE_LABELS[item.content_type] ?? item.content_type}
                  </span>
                )}
                <button
                  onClick={() => approveIdea(item.id)}
                  className="mt-2.5 flex items-center gap-1 text-[11px] text-zinc-700 hover:text-violet-400 transition-colors duration-150 opacity-0 group-hover:opacity-100"
                >
                  Approve <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            ))}

            {col.key === 'drafts' && (drafts as ContentDraft[]).map(item => (
              <div key={item.id} className="glass-hover rounded-xl p-3.5">
                <p className="text-sm text-zinc-200 leading-snug font-medium">{item.title || CONTENT_TYPE_LABELS[item.content_type] || item.content_type}</p>
                {item.hook && <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed line-clamp-2">{item.hook}</p>}
                <span className="inline-block text-[10px] text-amber-500/70 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5 mt-2">draft</span>
              </div>
            ))}

            {col.key === 'approved' && (approved as ContentDraft[]).map(item => (
              <div key={item.id} className="rounded-xl p-3.5 border border-violet-500/20 bg-violet-500/[0.04]">
                <p className="text-sm text-zinc-200 leading-snug font-medium">{item.title || CONTENT_TYPE_LABELS[item.content_type] || item.content_type}</p>
                <span className="inline-block text-[10px] text-violet-400/70 bg-violet-500/10 border border-violet-500/20 rounded px-1.5 py-0.5 mt-2">ready to schedule</span>
              </div>
            ))}

            {col.key === 'published' && (published as PublishedPost[]).map(item => (
              <div key={item.id} className="glass rounded-xl p-3.5">
                <p className="text-sm text-zinc-300 leading-snug">{item.content_drafts?.title || '—'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn('text-[11px] font-medium capitalize', PLATFORM_COLORS[item.platform] ?? 'text-zinc-500')}>{item.platform}</span>
                  <span className="text-[11px] text-zinc-700">{new Date(item.published_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))}

            {col.key === 'ideas' && (
              <div>
                {adding ? (
                  <div className="glass rounded-xl p-3.5">
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addIdea(); if (e.key === 'Escape') setAdding(false) }}
                      placeholder="What's the idea?"
                      className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none mb-3"
                    />
                    <div className="flex items-center gap-2">
                      <button onClick={addIdea} disabled={loading || !newTitle.trim()} className="text-xs bg-zinc-100 text-zinc-950 font-medium px-3 py-1.5 rounded-lg hover:bg-white transition-colors disabled:opacity-40">
                        {loading ? 'Adding…' : 'Add'}
                      </button>
                      <button onClick={() => { setAdding(false); setNewTitle('') }} className="text-zinc-700 hover:text-zinc-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAdding(true)} className="w-full flex items-center gap-2 text-xs text-zinc-800 hover:text-zinc-500 py-2.5 px-1 transition-colors duration-150 group">
                    <Plus className="w-3.5 h-3.5 group-hover:text-violet-400 transition-colors" />
                    Add idea
                  </button>
                )}
              </div>
            )}

            {col.items.length === 0 && col.key !== 'ideas' && (
              <div className="flex items-center justify-center h-16 rounded-xl border border-dashed border-white/[0.04]">
                <span className="text-xs text-zinc-800">empty</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
