import { runTrendScout } from './trend-scout'
import { runIdeaGenerator } from './idea-generator'
import { runContentWriter } from './content-writer'
import { logAgentStart, logAgentComplete, logAgentError } from '@/lib/utils/agent-logger'

export async function runPipeline(brandId?: string) {
    const startedAt = Date.now()
    const logId = await logAgentStart('pipeline', brandId)

    try {
        let scoutResult = { brandsProcessed: 0, reportsCreated: 0 }
        try { scoutResult = await runTrendScout(brandId) } catch (e) { console.error('Pipeline: TrendScout failed:', e) }

        let ideaResult = { brandsProcessed: 0, ideasCreated: 0 }
        try { ideaResult = await runIdeaGenerator(brandId) } catch (e) { console.error('Pipeline: IdeaGenerator failed:', e) }

        let writerResult = { brandsProcessed: 0, draftsCreated: 0 }
        try { writerResult = await runContentWriter(brandId) } catch (e) { console.error('Pipeline: ContentWriter failed:', e) }

        const count =
            (scoutResult.reportsCreated || 0) +
            (ideaResult.ideasCreated || 0) +
            (writerResult.draftsCreated || 0)

        await logAgentComplete(logId, startedAt, count)
        return { status: 'ok', agent: 'pipeline', summary: { scout: scoutResult, ideas: ideaResult, writer: writerResult, timestamp: new Date().toISOString() } }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        await logAgentError(logId, startedAt, message)
        throw err
    }
}
