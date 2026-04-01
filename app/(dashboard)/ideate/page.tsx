import { createClient } from '@/lib/supabase/server'
import IdeateClient from '@/components/ideate/IdeateClient'
import Link from 'next/link'

export default async function IdeatePage() {
  const supabase = await createClient()

  // Fetch the first brand since auth is disabled
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name')
    .limit(1)
  const brand = brands?.[0]

  if (!brand) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="border border-dashed border-zinc-700 rounded-xl p-12 text-center">
          <h3 className="text-zinc-300 font-medium mb-2">No brand set up</h3>
          <p className="text-zinc-500 text-sm mb-6">
            Create a brand first before ideating content.
          </p>
          <Link
            href="/brands/new"
            className="bg-zinc-50 text-zinc-950 text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Create brand
          </Link>
        </div>
      </div>
    )
  }

  return <IdeateClient brandId={brand.id} />
}
