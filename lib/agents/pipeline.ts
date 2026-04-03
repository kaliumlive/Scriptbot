import { runTrendScout } from './trend-scout'
import { runIdeaGenerator } from './idea-generator'
import { runContentWriter } from './content-writer'
import { runPublisher } from './publisher'
import { logAgentStart, logAgentComplete, logAgentError } from '@/lib/utils/agent-logger'

export async function runPipeline(brandId?: string) {
    const startedAt = Date.now()
    const logId = await logAgentStart('pipeline', brandId)

    try {
        console.log('Pipeline: Starting full autonomous run...')

        // 1. Trend Scouting
        console.log('Pipeline Step 1: Scouting trends...')
        let scoutResult = { brandsProcessed: 0, reportsCreated: 0 }
        try {
            scoutResult = await runTrendScout(brandId)
        } catch (e) {
            console.error('Pipeline: TrendScout failed:', e)
        }
        
        // 2. Idea Generation
        console.log('Pipeline Step 2: Generating ideas...')
        let ideaResult = { brandsProcessed: 0, ideasCreated: 0 }
        try {
            ideaResult = await runIdeaGenerator(brandId)
        } catch (e) {
            console.error('Pipeline: IdeaGenerator failed:', e)
        }

        // 3. Content Writing
        console.log('Pipeline Step 3: Writing content for approved ideas...')
        let writerResult = { brandsProcessed: 0, draftsCreated: 0 }
        try {
            writerResult = await runContentWriter(brandId)
        } catch (e) {
            console.error('Pipeline: ContentWriter failed:', e)
        }

        // 4. Publishing
        console.log('Pipeline Step 4: Publishing scheduled posts...')
        let publisherResult = { publishedCount: 0 }
        try {
            publisherResult = await runPublisher(brandId)
        } catch (e) {
            console.error('Pipeline: Publisher failed:', e)
        }

        const summary = {
            scout: scoutResult,
            ideas: ideaResult,
            writer: writerResult,
            publisher: publisherResult,
            timestamp: new Date().toISOString()
        }

        const count = 
          (scoutResult.reportsCreated || 0) +
          (ideaResult.ideasCreated || 0) +
          (writerResult.draftsCreated || 0) +
          (publisherResult.publishedCount || 0)

        await logAgentComplete(logId, startedAt, count)
        
        return {
            status: 'ok',
            agent: 'pipeline',
            summary
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        await logAgentError(logId, startedAt, message)
        throw err
    }
}
