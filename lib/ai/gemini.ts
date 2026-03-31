import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

let _genAI: GoogleGenerativeAI | null = null
function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  return _genAI
}

function getPro(): GenerativeModel { return getGenAI().getGenerativeModel({ model: 'gemini-1.5-pro' }) }
function getFlash(): GenerativeModel { return getGenAI().getGenerativeModel({ model: 'gemini-1.5-flash' }) }

export async function generateWithGemini(prompt: string, model: 'pro' | 'flash' = 'flash'): Promise<string> {
  const client = model === 'pro' ? getPro() : getFlash()
  const result = await client.generateContent(prompt)
  return result.response.text()
}

export async function analyzeImageWithGemini(prompt: string, imageBase64: string, mimeType: string = 'image/jpeg'): Promise<string> {
  const result = await getPro().generateContent([
    prompt,
    { inlineData: { data: imageBase64, mimeType } }
  ])
  return result.response.text()
}
