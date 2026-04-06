import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mic, Zap } from 'lucide-react'
import VoiceLearnerPanel from '@/components/brands/VoiceLearnerPanel'
import ContentPillarsPanel from '@/components/brands/ContentPillarsPanel'

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ brandId: string }>
}) {
  const { brandId } = await params
  const supabase = await createClient()
  // Auth disabled — fetch brand by id only
  const { data: brand } = await supabase
    .from('brands')
    .select('*, brand_voice_profiles(*), content_pillars, off_limits_topics, example_posts')
    .eq('id', brandId)
    .single()

  if (!brand) notFound()

  const voice = brand.brand_voice_profiles?.[0]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/brands"
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Brands
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-50">{brand.name}</h1>
            {brand.handle && (
              <p className="text-zinc-400 text-sm mt-0.5">@{brand.handle}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-200">Brand info</span>
          </div>
          <div className="space-y-2 text-sm">
            {brand.niche && (
              <div className="flex gap-2">
                <span className="text-zinc-500 w-20 shrink-0">Niche</span>
                <span className="text-zinc-300">{brand.niche}</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-zinc-500 w-20 shrink-0">Platforms</span>
              <span className="text-zinc-300 capitalize">
                {(brand.platforms as string[])?.join(', ') || '—'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-200">Voice profile</span>
            </div>
            {!voice && (
              <Link
                href={`/brands/new`}
                className="text-xs text-yellow-400 hover:text-yellow-300"
              >
                Set up
              </Link>
            )}
          </div>
          {voice ? (
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-zinc-500 w-20 shrink-0">Tone</span>
                <span className="text-zinc-300 capitalize">{voice.formality_level || 'formal-casual'}</span>
              </div>
              {voice.natural_tone && (
                <div className="flex gap-2">
                  <span className="text-zinc-500 w-20 shrink-0">Style</span>
                  <span className="text-zinc-300 line-clamp-2">{voice.natural_tone}</span>
                </div>
              )}
              {voice.respected_creators?.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-zinc-500 w-20 shrink-0">Refs</span>
                  <span className="text-zinc-300">{(voice.respected_creators as string[]).join(', ')}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">No voice profile yet</p>
          )}
        </div>
      </div>

      {voice && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-zinc-200">Voice Profile Details</h3>
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {voice.worldview && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Worldview</p>
                <p className="text-zinc-300">{voice.worldview}</p>
              </div>
            )}
            {voice.never_do && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Red lines</p>
                <p className="text-zinc-300">{voice.never_do}</p>
              </div>
            )}
            {voice.known_for && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Known for</p>
                <p className="text-zinc-300">{voice.known_for}</p>
              </div>
            )}
            {voice.desired_feeling && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Desired feeling</p>
                <p className="text-zinc-300">{voice.desired_feeling}</p>
              </div>
            )}
            {voice.personal_phrases?.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Personal phrases</p>
                <p className="text-zinc-300">{(voice.personal_phrases as string[]).join(', ')}</p>
              </div>
            )}
            {voice.not_my_voice_phrases?.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-1">Never write</p>
                <p className="text-zinc-300">{(voice.not_my_voice_phrases as string[]).join(', ')}</p>
              </div>
            )}
          </div>
          {voice.style_guide ? (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-2 font-medium text-zinc-400">Style guide</p>
              <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
                {voice.style_guide}
              </pre>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-3">
                <span className="text-yellow-400 font-medium">Style guide not generated yet.</span>{' '}
                Paste some of your YouTube video URLs below and the Voice Learner will transcribe them
                and write a detailed guide for the writing agents.
              </p>
            </div>
          )}
        </div>
      )}

      <VoiceLearnerPanel brandId={brandId} hasStyleGuide={!!voice?.style_guide} />

      <ContentPillarsPanel
        brandId={brandId}
        initialPillars={(brand.content_pillars as string[]) ?? []}
        initialOffLimits={(brand.off_limits_topics as string) ?? ''}
        initialExamplePosts={(brand.example_posts as string[]) ?? []}
      />
    </div>
  )
}
