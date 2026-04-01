'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function disconnectPlatform(platform: string) {
  const supabase = await createClient()
  
  const { data: brands } = await supabase.from('brands').select('id').limit(1)
  const brandId = brands?.[0]?.id

  if (!brandId) return

  const { error } = await supabase
    .from('platform_connections')
    .update({ is_active: false })
    .eq('brand_id', brandId)
    .eq('platform', platform)

  if (error) {
    console.error(`Failed to disconnect ${platform}:`, error)
    return
  }

  revalidatePath('/settings/connections')
}

export async function initializeDefaultBrand() {
  const HOST = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  await fetch(`${HOST}/api/seed-brand`, { method: 'POST' })
  revalidatePath('/settings/connections')
  revalidatePath('/pipeline')
}
