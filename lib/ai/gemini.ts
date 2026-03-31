import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiPro = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
export const geminiFlash = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export async function generateWithGemini(prompt: string, model: 'pro' | 'flash' = 'flash'): Promise<string> {
  const client = model === 'pro' ? geminiPro : geminiFlash
  const result = await client.generateContent(prompt)
  return result.response.text()
}

export async function analyzeImageWithGemini(prompt: string, imageBase64: string, mimeType: string = 'image/jpeg'): Promise<string> {
  const result = await geminiPro.generateContent([
    prompt,
    { inlineData: { data: imageBase64, mimeType } }
  ])
  return result.response.text()
}
