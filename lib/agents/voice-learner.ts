/**
 * Voice Learner Agent
 *
 * Accepts YouTube video URLs, sends them to Gemini 1.5 Pro (which processes
 * YouTube URLs natively via fileData), extracts voice patterns, then uses
 * Groq to write a consolidated style guide stored in brand_voice_profiles.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { generateWithGroq } from '@/lib/ai/groq'

export interface VoiceLearnerInput {
  brandId: string
  youtubeUrls: string[]
}

interface VoicePatterns {
  common_sentence_starters: string[]
  avg_sentence_length: 'short' | 'medium' | 'long'
  formality_level: 'casual' | 'formal-casual' | 'formal'
  uses_technical_terms: boolean
  term_drop_style: string
  filler_patterns: string[]
  personal_phrases: string[]
  natural_tone: string
}

const ANALYSIS_PROMPT = `Watch this video and do two things:

1. TRANSCRIBE the spoken content accurately. Keep filler words (like, you know, um) — they matter.

2. Then return ONLY this JSON (no markdown, no explanation):
{
  "transcription": "full transcript here",
  "voice_patterns": {
    "common_sentence_starters": ["5-8 phrases this person commonly starts sentences with"],
    "avg_sentence_length": "short",
    "formality_level": "formal-casual",
    "uses_technical_terms": true,
    "term_drop_style": "how they introduce technical terms",
    "filler_patterns": ["their filler words or phrases"],
    "personal_phrases": ["3-5 recurring phrases unique to this speaker"],
    "natural_tone": "1-2 sentence description of how they sound"
  }
}`

function buildStyleGuidePrompt(voiceData: VoicePatterns[], brandAnswers: Record<string, string>): string {
  return `You are analyzing a content creator's voice across ${voiceData.length} video(s). Write a STYLE GUIDE that AI writing agents will use to write content that sounds exactly like them.

VOICE PATTERNS FROM VIDEOS:
${voiceData.map((v, i) => `Video ${i + 1}:
- Sentence starters: ${v.common_sentence_starters.join(', ')}
- Sentence length: ${v.avg_sentence_length}
- Formality: ${v.formality_level}
- Technical terms: ${v.uses_technical_terms ? 'yes, ' + v.term_drop_style : 'no'}
- Fillers: ${v.filler_patterns.join(', ')}
- Personal phrases: ${v.personal_phrases.join(', ')}
- Tone: ${v.natural_tone}`).join('\n\n')}

CREATOR'S OWN DESCRIPTION:
- How they talk: ${brandAnswers.natural_tone || 'not provided'}
- Phrases they use: ${brandAnswers.personal_phrases || 'not provided'}
- What they never sound like: ${brandAnswers.not_my_voice_phrases || 'not provided'}
- Communication references: ${brandAnswers.respected_creators || 'not provided'}

Write a STYLE GUIDE (max 400 words) with these sections:
1. SENTENCE STRUCTURE — how to build sentences like them
2. WORD CHOICE — vocabulary level, terms to use and avoid
3. RHYTHM — pacing, how ideas connect, use of brevity
4. PERSONALITY — what personality bleeds through
5. NEVER DO — specific patterns that would sound fake

Be specific. Use examples. This will be a writing agent's system prompt.`
}

export async function runVoiceLearner(input: VoiceLearnerInput): Promise<{
  processed: number
  styleGuideUpdated: boolean
  error?: string
}> {
  const { brandId, youtubeUrls } = input

  if (!youtubeUrls.length) {
    return { processed: 0, styleGuideUpdated: false, error: 'No URLs provided' }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { processed: 0, styleGuideUpdated: false, error: 'GEMINI_API_KEY not configured' }
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })
  const supabase = await createClient()

  // Get existing voice profile for brand answers
  const { data: voiceProfile } = await supabase
    .from('brand_voice_profiles')
    .select('*')
    .eq('brand_id', brandId)
    .single()

  const allVoicePatterns: VoicePatterns[] = []
  let processed = 0

  for (const url of youtubeUrls) {
    try {
      const result = await model.generateContent([
        { fileData: { mimeType: 'video/mp4', fileUri: url } },
        { text: ANALYSIS_PROMPT },
      ])

      const rawText = result.response.text().trim()

      let parsed: { transcription: string; voice_patterns: VoicePatterns }
      try {
        const clean = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '')
        parsed = JSON.parse(clean)
      } catch {
        const match = rawText.match(/\{[\s\S]*\}/)
        if (!match) { console.error(`VoiceLearner: failed to parse response for ${url}`); continue }
        parsed = JSON.parse(match[0])
      }

      // Store transcription
      await supabase.from('video_transcriptions').insert({
        brand_id: brandId,
        source_url: url,
        platform: 'youtube',
        transcription: parsed.transcription,
        voice_patterns: parsed.voice_patterns,
        processed: true,
      })

      allVoicePatterns.push(parsed.voice_patterns)
      processed++
    } catch (err) {
      console.error(`VoiceLearner: error processing ${url}:`, err)
    }
  }

  if (allVoicePatterns.length === 0) {
    return { processed: 0, styleGuideUpdated: false, error: 'All videos failed to process' }
  }

  // Build style guide from all patterns
  const brandAnswers = {
    natural_tone: voiceProfile?.natural_tone ?? '',
    personal_phrases: (voiceProfile?.personal_phrases as string[] | null)?.join(', ') ?? '',
    not_my_voice_phrases: (voiceProfile?.not_my_voice_phrases as string[] | null)?.join(', ') ?? '',
    respected_creators: (voiceProfile?.respected_creators as string[] | null)?.join(', ') ?? '',
  }

  const styleGuide = await generateWithGroq(buildStyleGuidePrompt(allVoicePatterns, brandAnswers))
  const merged = mergePatterns(allVoicePatterns)

  const updatePayload = {
    ...merged,
    style_guide: styleGuide,
    last_updated: new Date().toISOString(),
  }

  if (voiceProfile) {
    await supabase.from('brand_voice_profiles').update(updatePayload).eq('brand_id', brandId)
  } else {
    await supabase.from('brand_voice_profiles').insert({ brand_id: brandId, ...updatePayload })
  }

  return { processed, styleGuideUpdated: true }
}

function mergePatterns(patterns: VoicePatterns[]): Partial<VoicePatterns> {
  if (patterns.length === 1) return patterns[0]

  const dedup = (arr: string[]) => [...new Set(arr.map(s => s.toLowerCase().trim()))].slice(0, 8)
  const vote = <T>(vals: T[]): T => {
    const counts = new Map<T, number>()
    for (const v of vals) counts.set(v, (counts.get(v) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0]
  }

  return {
    common_sentence_starters: dedup(patterns.flatMap(p => p.common_sentence_starters)),
    avg_sentence_length: vote(patterns.map(p => p.avg_sentence_length)),
    formality_level: vote(patterns.map(p => p.formality_level)),
    uses_technical_terms: patterns.filter(p => p.uses_technical_terms).length >= patterns.length / 2,
    term_drop_style: patterns[0].term_drop_style,
    filler_patterns: dedup(patterns.flatMap(p => p.filler_patterns)),
    personal_phrases: dedup(patterns.flatMap(p => p.personal_phrases)),
    natural_tone: patterns[0].natural_tone,
  }
}
