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
        const scoutResult = await runTrendScout(brandId)
        
        // 2. Idea Generation
        console.log('Pipeline Step 2: Generating ideas...')
        const ideaResult = await runIdeaGenerator(brandId)

        // 3. Content Writing (Optional: normally waits for approval, but we can process existing approved ones)
        console.log('Pipeline Step 3: Writing content for approved ideas...')
        const writerResult = await runContentWriter(brandId)

        // 4. Publishing
        console.log('Pipeline Step 4: Publishing scheduled posts...')
        const publisherResult = await runPublisher(brandId)

        const summary = {
            scout: scoutResult,
            ideas: ideaResult,
            writer: writerResult,
            publisher: publisherResult,
            timestamp: new Date().toISOString()
        }

        const count = [
          scoutResult.reportsCreated,
          ideaResult.ideasCreated,
          writerResult.draftsCreated,
          publisherResult.publishedCount
        ].reduce((acc, curr) => acc + (curr || 0), 0)
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
