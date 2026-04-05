'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, ChevronRight, X, Trash2, Pencil, Sparkles, BookOpen,
  Check, Search, ChevronDown, Zap, RefreshCw, Eye,
} from 'lucide-react'
import { HOOK_DATABASE, type HookTemplate, type HookCategory } from '@/lib/hooks/database'
import { STORY_STRUCTURES } from '@/lib/storytelling/structures'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContentIdea {
  id: string; title: string; hook?: string; concept?: string
  content_type?: string; story_structure_id?: string; created_at: string
}
interface ContentDraft {
  id: string; title?: string; content_type: string; hook?: string
  script?: string; build_up?: string; value_section?: string
  payoff?: string; cta?: string; story_structure_id?: string
  hashtags?: string[]; status: string; created_at: string
}
interface PublishedPost {
  id: string; platform: string; published_at: string; title?: string
  content_drafts?: { title?: string } | null
}

interface KanbanBoardProps {
  brandId: string
  ideas: ContentIdea[]
  drafts: ContentDraft[]
  approved: ContentDraft[]
  published: PublishedPost[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTENT_TYPE_LABELS: Record<string, string> = {
  short_video: 'Short video', reel: 'Reel', carousel: 'Carousel',
  thread: 'Thread', long_video: 'Long video',
}
const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'text-pink-400', tiktok: 'text-cyan-400',
  twitter: 'text-sky-400', x: 'text-sky-400', youtube: 'text-red-400',
}
const HOOK_CATEGORY_LABELS: Record<HookCategory, string> = {
  'comparison': 'Comparison', 'burning-question': 'Burning Q',
  'controversy': 'Controversy', 'pain-point': 'Pain Point',
  'desired-outcome': 'Outcome', 'secret-info': 'Secret',
  'unexpected-twist': 'Twist', 'authority': 'Authority',
  'social-proof': 'Social Proof', 'challenge': 'Challenge',
  'mistake': 'Mistake', 'transformation': 'Transformation',
  'behind-the-scenes': 'BTS', 'hot-take': 'Hot Take', 'story': 'Story',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StructureBadge({ id }: { id?: string | null }) {
  if (!id) return null
  const s = STORY_STRUCTURES.find(s => s.id === id)
  if (!s) return null
  return (
    <span className="inline-block text-[10px] text-violet-400/80 bg-violet-500/10 border border-violet-500/20 rounded-full px-2 py-0.5">
      {s.name}
    </span>
  )
}

// ── Hook Picker Modal ─────────────────────────────────────────────────────────

function HookPicker({ onSelect, onClose }: { onSelect: (t: string) => void; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState<HookCategory | 'all'>('all')

  const categories = useMemo(() =>
    [...new Set(HOOK_DATABASE.map(h => h.category))] as HookCategory[],
    []
  )
  const filtered = useMemo(() =>
    HOOK_DATABASE
      .filter(h => cat === 'all' || h.category === cat)
      .filter(h => !search || h.template.toLowerCase().includes(search.toLowerCase())),
    [cat, search]
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h3 className="text-white font-bold text-sm">Hook Database</h3>
            <span className="text-zinc-600 text-xs">{filtered.length} hooks</span>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-zinc-500" /></button>
        </div>

        <div className="p-3 border-b border-white/5 space-y-2">
          <div className="flex items-center gap-2 bg-zinc-900 border border-white/5 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search hooks…" className="bg-transparent text-sm text-white placeholder-zinc-600 outline-none flex-1" autoFocus />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setCat('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${cat === 'all' ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'border-white/5 text-zinc-600 hover:text-zinc-400'}`}>
              All
            </button>
            {categories.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${cat === c ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'border-white/5 text-zinc-600 hover:text-zinc-400'}`}>
                {HOOK_CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-white/[0.04]">
          {filtered.map((h: HookTemplate) => (
            <button key={h.id} onClick={() => { onSelect(h.template); onClose() }}
              className="w-full text-left px-4 py-3 hover:bg-white/[0.025] transition-colors group">
              <div className="flex items-start justify-between gap-3">
                <p className="text-zinc-300 text-sm leading-relaxed group-hover:text-white transition-colors">{h.template}</p>
                <span className="shrink-0 text-[10px] text-zinc-700 bg-zinc-900 border border-white/5 rounded px-1.5 py-0.5 mt-0.5">
                  {HOOK_CATEGORY_LABELS[h.category]}
                </span>
              </div>
              {h.mass_appeal && <span className="text-[10px] text-emerald-500/60 mt-1 block">✦ mass appeal</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Idea Edit / Generate Modal ────────────────────────────────────────────────

function IdeaModal({
  idea, brandId, mode, onClose, onDone,
}: {
  idea: ContentIdea | null
  brandId: string
  mode: 'edit' | 'generate'
  onClose: () => void
  onDone: () => void
}) {
  const [title, setTitle] = useState(idea?.title ?? '')
  const [concept, setConcept] = useState(idea?.concept ?? '')
  const [hook, setHook] = useState(idea?.hook ?? '')
  const [contentType, setContentType] = useState(idea?.content_type ?? 'short_video')
  const [structureId, setStructureId] = useState(idea?.story_structure_id ?? '')
  const [personalPoints, setPersonalPoints] = useState('')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showHookPicker, setShowHookPicker] = useState(false)
  const [error, setError] = useState('')

  async function saveEdit() {
    if (!idea || !title.trim()) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('content_ideas').update({
      title: title.trim(), concept: concept.trim() || null,
      hook: hook.trim() || null, content_type: contentType || null,
      story_structure_id: structureId || null,
    }).eq('id', idea.id)
    setSaving(false)
    onDone()
  }

  async function generateDraft() {
    if (!title.trim()) return
    setGenerating(true)
    setError('')
    try {
      const topic = [
        title.trim(),
        concept.trim() ? `Concept: ${concept.trim()}` : '',
        personalPoints.trim() ? `My personal angle: ${personalPoints.trim()}` : '',
        hook.trim() ? `Suggested hook: ${hook.trim()}` : '',
        structureId ? `Story structure: ${STORY_STRUCTURES.find(s => s.id === structureId)?.name}` : '',
      ].filter(Boolean).join('\n')

      const res = await fetch('/api/agents/flesh-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, topic }),
      })
      if (!res.ok) throw new Error('Generation failed')

      // Mark idea as drafted
      if (idea) {
        const supabase = createClient()
        await supabase.from('content_ideas').update({ status: 'drafted' }).eq('id', idea.id)
      }
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setGenerating(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              {mode === 'generate' ? <Sparkles className="w-4 h-4 text-violet-400" /> : <Pencil className="w-4 h-4 text-zinc-400" />}
              <h3 className="text-white font-bold text-sm">
                {mode === 'generate' ? 'Generate Script' : 'Edit Idea'}
              </h3>
            </div>
            <button onClick={onClose}><X className="w-4 h-4 text-zinc-500" /></button>
          </div>

          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 transition-colors"
                placeholder="What's this about?" />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Concept</label>
              <textarea value={concept} onChange={e => setConcept(e.target.value)} rows={2}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 transition-colors resize-none"
                placeholder="Brief description of the angle or premise…" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Hook</label>
                <button onClick={() => setShowHookPicker(true)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  <BookOpen className="w-3 h-3" /> Pick from database
                </button>
              </div>
              <textarea value={hook} onChange={e => setHook(e.target.value)} rows={2}
                className="w-full bg-zinc-900 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 transition-colors resize-none"
                placeholder="Opening line that stops the scroll…" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Content type</label>
                <div className="relative">
                  <select value={contentType} onChange={e => setContentType(e.target.value)}
                    className="w-full appearance-none bg-zinc-900 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 transition-colors cursor-pointer pr-8">
                    {Object.entries(CONTENT_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Story structure</label>
                <div className="relative">
                  <select value={structureId} onChange={e => setStructureId(e.target.value)}
                    className="w-full appearance-none bg-zinc-900 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-white/20 transition-colors cursor-pointer pr-8">
                    <option value="">— pick one —</option>
                    {STORY_STRUCTURES.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
                </div>
              </div>
            </div>

            {mode === 'generate' && (
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
                  Your personal points <span className="text-zinc-700 normal-case font-normal">(optional but recommended)</span>
                </label>
                <textarea value={personalPoints} onChange={e => setPersonalPoints(e.target.value)} rows={4}
                  className="w-full bg-zinc-900/80 border border-violet-500/20 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/40 transition-colors resize-none"
                  placeholder="Add your personal experience, specific details, opinions, or any context you want the AI to include in the script. The more specific, the better the output…" />
              </div>
            )}

            {error && <p className="text-rose-400 text-xs">{error}</p>}
          </div>

          <div className="p-4 border-t border-white/5 flex items-center justify-end gap-2">
            <button onClick={onClose} className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-2 transition-colors">Cancel</button>
            {mode === 'edit' ? (
              <button onClick={saveEdit} disabled={saving || !title.trim()}
                className="flex items-center gap-1.5 bg-zinc-100 text-zinc-950 text-xs font-bold px-4 py-2 rounded-xl hover:bg-white transition-colors disabled:opacity-40">
                {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Save
              </button>
            ) : (
              <button onClick={generateDraft} disabled={generating || !title.trim()}
                className="flex items-center gap-1.5 bg-violet-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-40">
                {generating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {generating ? 'Generating…' : 'Generate Script'}
              </button>
            )}
          </div>
        </div>
      </div>
      {showHookPicker && <HookPicker onSelect={t => setHook(t)} onClose={() => setShowHookPicker(false)} />}
    </>
  )
}

// ── Draft View Modal ──────────────────────────────────────────────────────────

function DraftModal({ draft, onClose, onDone }: {
  draft: ContentDraft; onClose: () => void; onDone: () => void
}) {
  const [title, setTitle] = useState(draft.title ?? '')
  const [hook, setHook] = useState(draft.hook ?? '')
  const [buildUp, setBuildUp] = useState(draft.build_up ?? '')
  const [value, setValue] = useState(draft.value_section ?? draft.script ?? '')
  const [payoff, setPayoff] = useState(draft.payoff ?? '')
  const [cta, setCta] = useState(draft.cta ?? '')
  const [structureId, setStructureId] = useState(draft.story_structure_id ?? '')
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showHookPicker, setShowHookPicker] = useState(false)
  const structure = STORY_STRUCTURES.find(s => s.id === structureId)

  async function save() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('content_drafts').update({
      title: title.trim() || null, hook: hook.trim() || null,
      build_up: buildUp.trim() || null, value_section: value.trim() || null,
      payoff: payoff.trim() || null, cta: cta.trim() || null,
      story_structure_id: structureId || null,
    }).eq('id', draft.id)
    setSaving(false)
    onDone()
  }

  async function approve() {
    setApproving(true)
    const supabase = createClient()
    // Save edits first, then approve
    await supabase.from('content_drafts').update({
      title: title.trim() || null, hook: hook.trim() || null,
      build_up: buildUp.trim() || null, value_section: value.trim() || null,
      payoff: payoff.trim() || null, cta: cta.trim() || null,
      story_structure_id: structureId || null, status: 'approved',
    }).eq('id', draft.id)
    setApproving(false)
    onDone()
  }

  async function deleteDraft() {
    if (!confirm('Delete this draft? This cannot be undone.')) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('content_drafts').delete().eq('id', draft.id)
    setDeleting(false)
    onDone()
  }

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="w-4 h-4 text-amber-400 shrink-0" />
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="bg-transparent text-white font-bold text-sm outline-none min-w-0 flex-1 placeholder-zinc-600"
                placeholder="Draft title…" />
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className="text-[10px] text-amber-500/70 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">draft</span>
              <button onClick={onClose}><X className="w-4 h-4 text-zinc-500" /></button>
            </div>
          </div>

          {/* Structure selector */}
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-zinc-600 font-bold uppercase tracking-widest">Structure</span>
            <div className="relative">
              <select value={structureId} onChange={e => setStructureId(e.target.value)}
                className="appearance-none bg-zinc-900/60 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-white/20 transition-colors cursor-pointer pr-6">
                <option value="">None</option>
                {STORY_STRUCTURES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
            </div>
            {structure && (
              <p className="text-[11px] text-zinc-600 italic truncate">{structure.description}</p>
            )}
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            {/* Hook */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-400" /> Hook
                </label>
                <button onClick={() => setShowHookPicker(true)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  <BookOpen className="w-3 h-3" /> Swap hook
                </button>
              </div>
              <textarea value={hook} onChange={e => setHook(e.target.value)} rows={2}
                className="w-full bg-zinc-900/60 border border-amber-500/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/30 transition-colors resize-none"
                placeholder="Opening hook…" />
            </div>

            {/* Build-up */}
            <div>
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Build-up</label>
              <textarea value={buildUp} onChange={e => setBuildUp(e.target.value)} rows={3}
                className="w-full bg-zinc-900/60 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-white/20 transition-colors resize-none"
                placeholder="Setup / context / tension…" />
            </div>

            {/* Value / Main body */}
            <div>
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">
                {structure ? structure.stages[Math.floor(structure.stages.length / 2)]?.name ?? 'Main Content' : 'Main Content'}
              </label>
              <textarea value={value} onChange={e => setValue(e.target.value)} rows={5}
                className="w-full bg-zinc-900/60 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-white/20 transition-colors resize-none"
                placeholder="The core value, lesson, or story of this piece…" />
            </div>

            {/* Payoff */}
            <div>
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Payoff</label>
              <textarea value={payoff} onChange={e => setPayoff(e.target.value)} rows={2}
                className="w-full bg-zinc-900/60 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-white/20 transition-colors resize-none"
                placeholder="Resolution, insight, or satisfying conclusion…" />
            </div>

            {/* CTA */}
            <div>
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">CTA</label>
              <textarea value={cta} onChange={e => setCta(e.target.value)} rows={2}
                className="w-full bg-zinc-900/60 border border-white/5 rounded-xl px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-white/20 transition-colors resize-none"
                placeholder="Call to action…" />
            </div>
          </div>

          {/* Footer actions */}
          <div className="p-4 border-t border-white/5 flex items-center justify-between shrink-0">
            <button onClick={deleteDraft} disabled={deleting}
              className="flex items-center gap-1.5 text-xs text-rose-500/70 hover:text-rose-400 transition-colors disabled:opacity-40">
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? 'Deleting…' : 'Delete draft'}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-white/5 px-3 py-2 rounded-xl transition-colors disabled:opacity-40">
                {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={approve} disabled={approving}
                className="flex items-center gap-1.5 bg-violet-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-40">
                {approving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                {approving ? 'Approving…' : 'Approve →'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {showHookPicker && <HookPicker onSelect={t => setHook(t)} onClose={() => setShowHookPicker(false)} />}
    </>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function KanbanBoard({ brandId, ideas, drafts, approved, published }: KanbanBoardProps) {
  const supabase = createClient()

  // Add idea state
  const [newTitle, setNewTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  // Modal state
  const [ideaModal, setIdeaModal] = useState<{ idea: ContentIdea | null; mode: 'edit' | 'generate' } | null>(null)
  const [draftModal, setDraftModal] = useState<ContentDraft | null>(null)

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function reload() { window.location.reload() }

  async function addIdea() {
    if (!newTitle.trim()) return
    setLoading(true)
    await supabase.from('content_ideas').insert({
      brand_id: brandId, title: newTitle.trim(), status: 'idea', source: 'user',
    })
    setNewTitle('')
    setAdding(false)
    setLoading(false)
    reload()
  }

  async function deleteIdea(id: string) {
    if (!confirm('Delete this idea?')) return
    setDeletingId(id)
    await supabase.from('content_ideas').delete().eq('id', id)
    setDeletingId(null)
    reload()
  }

  async function approveIdea(id: string) {
    await supabase.from('content_ideas').update({ status: 'approved' }).eq('id', id)
    reload()
  }

  async function deleteDraftInline(id: string) {
    if (!confirm('Delete this draft?')) return
    setDeletingId(id)
    await supabase.from('content_drafts').delete().eq('id', id)
    setDeletingId(null)
    reload()
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-4 min-h-[600px]">
        {/* ── IDEAS ──────────────────────────────────────────────────────── */}
        <Column label="Ideas" count={ideas.length} dot="bg-sky-400">
          {ideas.map(item => (
            <div key={item.id} className="glass-hover rounded-xl p-3.5 group relative">
              {/* Action bar */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ActionBtn title="Edit" onClick={() => setIdeaModal({ idea: item, mode: 'edit' })}>
                  <Pencil className="w-3 h-3" />
                </ActionBtn>
                <ActionBtn title="Delete" onClick={() => deleteIdea(item.id)} disabled={deletingId === item.id} danger>
                  <Trash2 className="w-3 h-3" />
                </ActionBtn>
              </div>

              <p className="text-sm text-zinc-200 leading-snug font-medium pr-14">{item.title}</p>
              {item.hook && (
                <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed line-clamp-2">{item.hook}</p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {item.content_type && (
                  <span className="text-[10px] text-zinc-700 bg-white/[0.04] rounded px-1.5 py-0.5">
                    {CONTENT_TYPE_LABELS[item.content_type] ?? item.content_type}
                  </span>
                )}
                <StructureBadge id={item.story_structure_id} />
              </div>

              {/* Hover actions row */}
              <div className="mt-2.5 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setIdeaModal({ idea: item, mode: 'generate' })}
                  className="flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors font-semibold">
                  <Sparkles className="w-3 h-3" /> Generate script
                </button>
                <button onClick={() => approveIdea(item.id)}
                  className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">
                  Approve <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          {/* Add idea */}
          <div>
            {adding ? (
              <div className="glass rounded-xl p-3.5">
                <input autoFocus value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addIdea(); if (e.key === 'Escape') setAdding(false) }}
                  placeholder="What's the idea?"
                  className="w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none mb-3" />
                <div className="flex items-center gap-2">
                  <button onClick={addIdea} disabled={loading || !newTitle.trim()}
                    className="text-xs bg-zinc-100 text-zinc-950 font-medium px-3 py-1.5 rounded-lg hover:bg-white transition-colors disabled:opacity-40">
                    {loading ? 'Adding…' : 'Add'}
                  </button>
                  <button onClick={() => { setAdding(false); setNewTitle('') }} className="text-zinc-700 hover:text-zinc-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAdding(true)}
                className="w-full flex items-center gap-2 text-xs text-zinc-800 hover:text-zinc-500 py-2.5 px-1 transition-colors group">
                <Plus className="w-3.5 h-3.5 group-hover:text-violet-400 transition-colors" />
                Add idea
              </button>
            )}
          </div>

          {ideas.length === 0 && !adding && <EmptyState />}
        </Column>

        {/* ── DRAFTS ─────────────────────────────────────────────────────── */}
        <Column label="Drafts" count={drafts.length} dot="bg-amber-400">
          {drafts.map(item => (
            <div key={item.id}
              onClick={() => setDraftModal(item)}
              className="glass-hover rounded-xl p-3.5 group relative cursor-pointer">
              <button
                onClick={e => { e.stopPropagation(); deleteDraftInline(item.id) }}
                disabled={deletingId === item.id}
                className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-zinc-700 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-40">
                <Trash2 className="w-3 h-3" />
              </button>

              <p className="text-sm text-zinc-200 leading-snug font-medium pr-8">
                {item.title || CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
              </p>
              {item.hook && (
                <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed line-clamp-2">{item.hook}</p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-amber-500/70 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">draft</span>
                <StructureBadge id={item.story_structure_id} />
              </div>
              <p className="text-[10px] text-zinc-700 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                Click to view &amp; edit →
              </p>
            </div>
          ))}
          {drafts.length === 0 && <EmptyState />}
        </Column>

        {/* ── APPROVED ───────────────────────────────────────────────────── */}
        <Column label="Approved" count={approved.length} dot="bg-violet-400">
          {approved.map(item => (
            <div key={item.id}
              onClick={() => setDraftModal(item)}
              className="rounded-xl p-3.5 border border-violet-500/20 bg-violet-500/[0.04] group relative cursor-pointer hover:bg-violet-500/[0.07] transition-colors">
              <button
                onClick={e => { e.stopPropagation(); deleteDraftInline(item.id) }}
                disabled={deletingId === item.id}
                className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-zinc-700 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-40">
                <Trash2 className="w-3 h-3" />
              </button>
              <p className="text-sm text-zinc-200 leading-snug font-medium pr-8">
                {item.title || CONTENT_TYPE_LABELS[item.content_type] || item.content_type}
              </p>
              {item.hook && (
                <p className="text-xs text-zinc-600 mt-1.5 leading-relaxed line-clamp-2">{item.hook}</p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-violet-400/70 bg-violet-500/10 border border-violet-500/20 rounded-full px-2 py-0.5">ready to post</span>
                <StructureBadge id={item.story_structure_id} />
              </div>
            </div>
          ))}
          {approved.length === 0 && <EmptyState label="Approve a draft to see it here" />}
        </Column>

        {/* ── PUBLISHED ──────────────────────────────────────────────────── */}
        <Column label="Published" count={published.length} dot="bg-emerald-400">
          {published.map(item => (
            <div key={item.id} className="glass rounded-xl p-3.5">
              <p className="text-sm text-zinc-300 leading-snug font-medium">
                {item.title || item.content_drafts?.title || <span className="text-zinc-700 italic">No title</span>}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[11px] font-semibold capitalize ${PLATFORM_COLORS[item.platform] ?? 'text-zinc-500'}`}>
                  {item.platform}
                </span>
                <span className="text-[11px] text-zinc-700">
                  {new Date(item.published_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
          {published.length === 0 && <EmptyState />}
        </Column>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {ideaModal && (
        <IdeaModal
          idea={ideaModal.idea}
          brandId={brandId}
          mode={ideaModal.mode}
          onClose={() => setIdeaModal(null)}
          onDone={() => { setIdeaModal(null); reload() }}
        />
      )}
      {draftModal && (
        <DraftModal
          draft={draftModal}
          onClose={() => setDraftModal(null)}
          onDone={() => { setDraftModal(null); reload() }}
        />
      )}
    </>
  )
}

// ── Layout helpers ────────────────────────────────────────────────────────────

function Column({ label, count, dot, children }: {
  label: string; count: number; dot: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{label}</span>
        <span className="ml-auto text-[11px] text-zinc-700 tabular-nums">{count}</span>
      </div>
      <div className="flex-1 space-y-2">{children}</div>
    </div>
  )
}

function ActionBtn({ children, onClick, title, danger, disabled }: {
  children: React.ReactNode; onClick: () => void; title: string
  danger?: boolean; disabled?: boolean
}) {
  return (
    <button title={title} onClick={onClick} disabled={disabled}
      className={`p-1 rounded-lg transition-colors disabled:opacity-40 ${
        danger ? 'text-zinc-700 hover:text-rose-400 hover:bg-rose-500/10' : 'text-zinc-700 hover:text-zinc-300 hover:bg-white/5'
      }`}>
      {children}
    </button>
  )
}

function EmptyState({ label = 'empty' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center h-16 rounded-xl border border-dashed border-white/[0.04]">
      <span className="text-xs text-zinc-800">{label}</span>
    </div>
  )
}
