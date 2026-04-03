import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Zap } from 'lucide-react'
import SeedBrandButton from '@/components/brands/SeedBrandButton'

export default async function BrandsPage() {
  const supabase = await createClient()
  // Auth disabled — fetch all brands
  const { data: brands } = await supabase
    .from('brands')
    .select('*, brand_voice_profiles(id)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-zinc-50">Brands</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            Each brand has its own voice, niche, and agent pipeline
          </p>
        </div>
      </div>

      {!brands || brands.length === 0 ? (
        <div className="border border-dashed border-zinc-700 rounded-xl p-12 text-center">
          <Zap className="w-8 h-8 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-zinc-300 font-medium mb-2">Your intake is already done</h3>
          <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">
            You answered all the brand voice questions in the setup chat.
            Click below to import your profile.
          </p>
          <SeedBrandButton />
        </div>
      ) : (
        <div className="grid gap-4">
          {brands.map((brand: {
            id: string
            name: string
            handle?: string
            niche?: string
            platforms: string[]
            brand_voice_profiles: { id: string }[]
          }) => {
            const hasVoice = brand.brand_voice_profiles?.length > 0
            return (
              <Link
                key={brand.id}
                href={`/brands/${brand.id}`}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-zinc-50">{brand.name}</span>
                    {brand.handle && (
                      <span className="text-zinc-500 text-sm">@{brand.handle}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {brand.niche && (
                      <span className="text-xs text-zinc-500">{brand.niche}</span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        hasVoice
                          ? 'bg-green-400/10 text-green-400'
                          : 'bg-yellow-400/10 text-yellow-400'
                      }`}
                    >
                      {hasVoice ? 'Voice trained' : 'Voice setup needed'}
                    </span>
                  </div>
                </div>
                <div className="text-zinc-600 text-sm">
                  {brand.platforms?.length ?? 0} platforms
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
