import Groq from 'groq-sdk'

let _groq: Groq | null = null
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
  return _groq
}

export async function generateWithGroq(
  prompt: string,
  systemPrompt?: string,
  model: string = 'llama-3.3-70b-versatile'
): Promise<string> {
  const messages: Groq.Chat.ChatCompletionMessageParam[] = []
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
  messages.push({ role: 'user', content: prompt })

  const completion = await getGroq().chat.completions.create({ messages, model, temperature: 0.7, max_tokens: 4096 })
  return completion.choices[0]?.message?.content ?? ''
}
