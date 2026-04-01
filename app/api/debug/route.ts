export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const keyPrefix = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) ?? 'NOT SET'
  try {
    const supabase = createAdminClient()
    const { data: brands, error } = await supabase.from('brands').select('id, name, handle')
    return Response.json({ hasServiceKey, keyPrefix, brands, error: error?.message, count: brands?.length ?? 0 })
  } catch (err) {
    return Response.json({ hasServiceKey, keyPrefix, fatal: String(err) }, { status: 500 })
  }
}
