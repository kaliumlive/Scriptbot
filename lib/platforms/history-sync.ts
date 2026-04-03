import { createAdminClient } from '@/lib/supabase/admin'
import { importInstagramPublishedPosts } from './instagram'
import { importYouTubePublishedPosts } from './youtube'

interface PlatformHistoryResult {
  platform: string
  importedPosts: number
  scannedPosts: number
  error?: string
}

type HistoryImporter = (brandId: string, limit?: number) => Promise<{ importedPosts: number; scannedPosts: number }>

const HISTORY_IMPORTERS: Record<string, HistoryImporter> = {
  instagram: importInstagramPublishedPosts,
  youtube: importYouTubePublishedPosts,
}

export async function importConnectedPostHistory(brandId: string, limitPerPlatform: number = 100) {
  const supabase = createAdminClient()
  const { data: connections, error } = await supabase
    .from('platform_connections')
    .select('platform, is_active')
    .eq('brand_id', brandId)
    .eq('is_active', true)

  if (error || !connections) {
    return { importedPosts: 0, scannedPosts: 0, platforms: [] as PlatformHistoryResult[] }
  }

  const platforms: PlatformHistoryResult[] = []
  let importedPosts = 0
  let scannedPosts = 0

  for (const connection of connections as Array<{ platform: string; is_active: boolean }>) {
    const importer = HISTORY_IMPORTERS[connection.platform]
    if (!importer) {
      continue
    }

    try {
      const result = await importer(brandId, limitPerPlatform)
      importedPosts += result.importedPosts
      scannedPosts += result.scannedPosts
      platforms.push({
        platform: connection.platform,
        importedPosts: result.importedPosts,
        scannedPosts: result.scannedPosts,
      })
    } catch (error) {
      platforms.push({
        platform: connection.platform,
        importedPosts: 0,
        scannedPosts: 0,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return { importedPosts, scannedPosts, platforms }
}

