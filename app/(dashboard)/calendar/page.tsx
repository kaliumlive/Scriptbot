import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Calendar, Clock } from 'lucide-react'

export default async function CalendarPage() {
  const supabase = await createClient()
  // Auth disabled — fetch all brands
  const { data: brands } = await supabase
    .from('brands')
    .select('id')
  const brandIds = brands?.map((b: { id: string }) => b.id) ?? []

  const { data: scheduled } = brandIds.length > 0
    ? await supabase
        .from('scheduled_posts')
        .select('*, content_drafts(title, content_type)')
        .in('brand_id', brandIds)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(20)
    : { data: [] }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">Calendar</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            Upcoming scheduled posts — managed by the Scheduler agent
          </p>
        </div>
      </div>

      {!scheduled || scheduled.length === 0 ? (
        <div className="border border-dashed border-zinc-700 rounded-xl p-12 text-center">
          <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-zinc-300 font-medium mb-2">Nothing scheduled yet</h3>
          <p className="text-zinc-500 text-sm max-w-sm mx-auto">
            Approve content in the Pipeline and the Scheduler agent will automatically queue
            posts at optimal times.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {(scheduled as {
            id: string
            platform: string
            scheduled_at: string
            content_drafts?: { title?: string; content_type?: string } | null
          }[]).map(post => (
            <div
              key={post.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4"
            >
              <div className="flex items-center gap-2 text-xs text-zinc-500 shrink-0 w-40">
                <Clock className="w-3.5 h-3.5" />
                {new Date(post.scheduled_at).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">
                  {post.content_drafts?.title || post.content_drafts?.content_type || 'Untitled'}
                </p>
              </div>
              <span className="text-xs text-zinc-500 bg-zinc-800 rounded px-2 py-0.5 capitalize shrink-0">
                {post.platform}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
