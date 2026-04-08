import Groq from 'groq-sdk'

export const MODEL = {
  FAST: 'llama-3.1-8b-instant',
  SMART: 'llama-3.3-70b-versatile',
} as const

let _groq: Groq | null = null
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
  return _groq
}

const RETRY_STATUS_CODES = new Set([429, 500, 503])
const MAX_RETRIES = 3
const BASE_DELAY_MS = 2000

function parseRetryAfter(error: unknown): number | null {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>
    const headers = (err.headers ?? (err as { response?: { headers?: Record<string, string> } }).response?.headers) as Record<string, string> | undefined
    if (headers) {
      const retryAfter = headers['retry-after'] ?? headers['Retry-After']
      if (retryAfter) {
        const seconds = Number(retryAfter)
        if (!isNaN(seconds) && seconds > 0) return seconds * 1000
      }
    }
    const message = String(err.message ?? err.error ?? '')
    const match = message.match(/try again in (\d+(?:\.\d+)?)\s*s/i)
    if (match) return Math.ceil(Number(match[1]) * 1000)
  }
  return null
}

function isRetryable(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const status = (error as { status?: number }).status ?? (error as { statusCode?: number }).statusCode
    if (status && RETRY_STATUS_CODES.has(status)) return true
    const code = (error as { code?: string }).code
    if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ENOTFOUND' || code === 'UND_ERR_CONNECT_TIMEOUT') return true
  }
  if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) return true
  return false
}

function getRetryDelay(attempt: number, error: unknown): number {
  if ((error as { status?: number }).status === 429) {
    const retryAfter = parseRetryAfter(error)
    if (retryAfter) return retryAfter
  }
  return BASE_DELAY_MS * Math.pow(2, attempt) // 2s, 4s, 8s
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function generateWithGroq(
  prompt: string,
  systemPrompt?: string,
  model: string = 'llama-3.3-70b-versatile'
): Promise<string> {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: prompt })

  let lastError: unknown
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await getGroq().chat.completions.create({ messages, model, temperature: 0.7, max_tokens: 4096 })
      return completion.choices[0]?.message?.content ?? ''
    } catch (error) {
      lastError = error
      if (attempt < MAX_RETRIES && isRetryable(error)) {
        const delay = getRetryDelay(attempt, error)
        console.warn(`[groq] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed, retrying in ${delay}ms...`, (error as Error).message ?? error)
        await sleep(delay)
        continue
      }
      throw error
    }
  }
  throw lastError
}
export async function chatWithGroq(
  messages: Groq.Chat.ChatCompletionMessageParam[],
  model: string = 'llama-3.3-70b-versatile'
): Promise<string> {
  const completion = await getGroq().chat.completions.create({ messages, model, temperature: 0.7, max_tokens: 2048 })
  return completion.choices[0]?.message?.content ?? ''
}
