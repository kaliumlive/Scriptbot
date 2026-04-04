'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { resolveAppOriginFromHeaders } from '@/lib/utils/app-origin'

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
  const host = await resolveAppOriginFromHeaders()
  await fetch(`${host}/api/seed-brand`, { method: 'POST' })
  revalidatePath('/settings/connections')
  revalidatePath('/pipeline')
}
