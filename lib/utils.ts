import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Robustly parse JSON from LLM output.
 * Handles markdown fences, leading/trailing text, and nested structures.
 */
export function parseLLMJson<T>(text: string): T {
  // Step 1: strip markdown code fences
  const stripped = text
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  // Step 2: try direct parse first (clean output)
  try {
    return JSON.parse(stripped) as T
  } catch {
    // continue to extraction
  }

  // Step 3: find the first JSON array or object
  const arrStart = stripped.indexOf('[')
  const objStart = stripped.indexOf('{')

  if (arrStart === -1 && objStart === -1) {
    throw new Error(`parseLLMJson: no JSON structure found in: ${text.slice(0, 300)}`)
  }

  // Pick whichever comes first
  const isArray = arrStart !== -1 && (objStart === -1 || arrStart < objStart)
  const open = isArray ? '[' : '{'
  const close = isArray ? ']' : '}'
  const startIdx = stripped.indexOf(open)

  // Walk forward to find the matching closing bracket (respects strings)
  let depth = 0
  let endIdx = -1
  let inString = false
  let escape = false

  for (let i = startIdx; i < stripped.length; i++) {
    const ch = stripped[i]
    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === open) depth++
    if (ch === close) {
      depth--
      if (depth === 0) { endIdx = i; break }
    }
  }

  if (endIdx === -1) {
    throw new Error(`parseLLMJson: unmatched brackets in output`)
  }

  const jsonStr = stripped.substring(startIdx, endIdx + 1)
  return JSON.parse(jsonStr) as T
}
