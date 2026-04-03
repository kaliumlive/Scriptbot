import fs from 'fs'
import { ExtractorResult } from '@/lib/video/extractor'
import { analyzeFramesWithGemini } from '@/lib/ai/gemini'

export interface TaggedMoment {
  b_roll_note: string
  timestampSeconds: number
  confidence: number
  reason: string
}

export async function tagFramesWithVision(
  extraction: ExtractorResult,
  bRollNotes: string[]
): Promise<TaggedMoment[]> {
  // Read frames and convert to base64
  // To avoid hitting payload limits, if there are too many frames, sample them (e.g. max 50 frames per prompt)
  const MAX_FRAMES = 50
  let sampledFrames = extraction.frames
  
  if (sampledFrames.length > MAX_FRAMES) {
    const step = Math.ceil(sampledFrames.length / MAX_FRAMES)
    sampledFrames = sampledFrames.filter((_, i) => i % step === 0)
  }

  const base64Frames = sampledFrames.map(f => {
    const data = fs.readFileSync(f.filePath)
    return {
      timestampSeconds: f.timestampSeconds,
      base64: data.toString('base64'),
      mimeType: 'image/jpeg'
    }
  })

  // We need to tell the model exactly which image index corresponds to which timestamp,
  // but Gemini inlineData doesn't take names. So we pass them in order and the prompt will rely on order.
  const prompt = `
You are a Video Editor Assistant. I am providing you with ${base64Frames.length} frames extracted chronologically from a raw video. Each frame represents a specific timestamp.

Frame timestamps in order:
${base64Frames.map((f, i) => `Frame ${i + 1}: ${f.timestampSeconds}s`).join('\n')}

I need you to scan these frames to find the best moments that match the following B-Roll notes:
${bRollNotes.map((note, idx) => `- [${idx}] ${note}`).join('\n')}

Return a JSON array of matched moments.
OUTPUT FORMAT (JSON ONLY):
[
  {
    "b_roll_note": "The exact b-roll note text",
    "timestampSeconds": 45, // The timestamp exactly mapping to one of the frames provided
    "confidence": 0.9, // 0.0 to 1.0 depending on how well the visual matches the note
    "reason": "Why this frame matches"
  }
]
  `

  const responseText = await analyzeFramesWithGemini(prompt, base64Frames.map(f => ({ base64: f.base64, mimeType: f.mimeType })))
  
  try {
    const clean = responseText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    const result = JSON.parse(clean)
    return result
  } catch (error) {
    const match = responseText.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('Failed to parse Vision Tagger output')
    return JSON.parse(match[0])
  }
}
