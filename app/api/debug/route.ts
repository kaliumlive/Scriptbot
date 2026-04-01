export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data: brands, error } = await supabase.from('brands').select('id, name, handle, is_active')
    return Response.json({ brands, error: error?.message, count: brands?.length ?? 0 })
  } catch (err) {
    return Response.json({ fatal: String(err) }, { status: 500 })
  }
}
