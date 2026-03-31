import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Video, Play, Layers, ArrowRight } from 'lucide-react'
import VideoUploader from '@/components/repurpose/VideoUploader'
import CarouselPreview from '@/components/repurpose/CarouselPreview'

export default async function RepurposePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch recent drafts
  const { data: drafts } = await supabase
    .from('content_drafts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">Video Repurposer</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Autonomous agents extract viral clips and generate ready-to-post carousels
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <VideoUploader brandId="default-brand" />

        <div className="bg-zinc-900 border border-dashed border-zinc-700 rounded-xl p-8 text-center hover:border-zinc-600 transition-colors cursor-pointer group">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-red-500/20 transition-colors">
            <Play className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-zinc-200 text-sm font-semibold mb-1">Connect YouTube</p>
          <p className="text-zinc-500 text-xs">Import from your channel automatically</p>
          <div className="mt-4 flex items-center justify-center gap-1 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
            Coming Soon <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {drafts && drafts.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Recent Drafts</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {drafts.map((draft: any) => (
              <CarouselPreview key={draft.id} draft={draft} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">How it works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { step: '01', title: 'Extraction', text: 'FFmpeg extracts high-density frames in your browser.' },
            { step: '02', title: 'Analysis', text: 'Gemini Vision identifies hooks and key educational pillars.' },
            { step: '03', title: 'Generation', text: 'Agents apply your brand voice to auto-generated slides.' },
            { step: '04', title: 'Publishing', text: 'One-click push to LinkedIn, Instagram, and Twitter.' },
          ].map(item => (
            <div key={item.step} className="flex gap-4">
              <span className="text-xl font-black text-zinc-800 tabular-nums leading-none">{item.step}</span>
              <div>
                <p className="text-sm font-bold text-zinc-300 mb-1">{item.title}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
