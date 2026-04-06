/**
 * Content Creation Knowledge Base
 *
 * Distilled from the creator's value vault — frameworks for hooks, storytelling,
 * and script structure injected into agent prompts to lift output quality.
 *
 * This is NOT a brand voice file (that's voice.ts).
 * This is craft knowledge: HOW to write content that spreads.
 */

// ─────────────────────────────────────────────────────────────────────────────
// HOOK KNOWLEDGE
// A hook is a PATTERN INTERRUPT — not just an attention grab.
// Three mechanisms that cause a brain to stop scrolling:
//   1. Contradiction — challenges something the viewer believes is true
//   2. Specificity — a precise detail (number, name, situation) that signals this is real
//   3. Identity Alignment — speaks directly to who the viewer is or wants to be
// ─────────────────────────────────────────────────────────────────────────────

export const HOOK_PRINCIPLES = `
HOOK WRITING RULES (non-negotiable):
- A hook is a PATTERN INTERRUPT. It must make the brain stop — not just look.
- Three things that cause a stop: (1) Contradiction — challenges a belief they hold, (2) Specificity — a real detail like a number, name, or specific situation, (3) Identity Alignment — speaks directly to who they are.
- The hook must NOT give away the payoff. The viewer needs a reason to keep watching.
- Weak hooks: generic questions, "Have you ever...?", vague curiosity bait, hype without substance.
- Strong hooks: specific story-opening line, a claim that creates tension, a contradiction of common advice.
- The first sentence must work as a standalone statement. If it only makes sense with context, rewrite it.

5 BATTLE-TESTED HOOK FORMULAS:
1. CALL OUT THE MISTAKE DIRECTLY: "Most [people in niche] are doing [X] backwards — and they don't know it."
2. SPECIFICITY OVER HYPE: "I spent [specific time] on [specific thing] and here's the one thing I'd do differently."
3. START WITH WHAT THEY ALREADY BELIEVE, THEN FLIP IT: "Everyone says [common advice]. [Pause.] That's exactly what held me back."
4. MAKE IT ABOUT THEM: "[Identity statement] — here's what no one told you when you started."
5. THE EARNED CLAIM: State something that sounds unbelievable but is true for this creator specifically.
`

// ─────────────────────────────────────────────────────────────────────────────
// STORYTELLING STRUCTURES
// From the vault: "The story IS the hook — not a setup FOR the hook."
// Emotion is the actual mechanism. Stakes keep people watching.
// ─────────────────────────────────────────────────────────────────────────────

export const STORYTELLING_STRUCTURES = `
STORYTELLING RULES:
- Core arc always: Setup → Conflict → Resolution. Everything else is decoration.
- Emotion is the real hook. The viewer needs to feel something in the first 5 seconds.
- Stakes must be present. Something must be on the line. Without stakes, there's no reason to watch.
- The payoff must be earned — it's the logical conclusion of everything that came before.
- Personal specificity beats universal relatability. Specific details make stories believable.

6 STRUCTURES (pick the one that fits the story):
1. THE LESSON: Setback → Pain Points → What the creator tried that failed → Resolution → The actual lesson
2. THE BREAKTHROUGH: Problem that was stuck → The one thing that cracked it → What changed → Takeaway
3. HERO'S JOURNEY: Before state → Inciting incident → Struggle with failed attempts → Turning point → After state
4. HOT TAKE: State the belief → Acknowledge the opposing view → Evidence from real experience → Payoff (the point that lands)
5. THE CONFESSION: Admit something real and uncomfortable → Why it matters → What they did about it → What it cost
6. CHALLENGE TO VICTORY: Public doubt or failure → The early struggle → The moment the tide turned → The transformation

SCRIPT WRITING RULES:
- Write talking points, not word-for-word scripts. Authenticity comes from natural language, not performance.
- Don't give away the payoff early. Structure tension like a slow build, not a summary.
- Simplify, then simplify again. If a sentence needs explaining, rewrite it.
- Each beat should either ADD tension or RELEASE it. Neutral sentences are filler.
- Talk to ONE person. Never write to "you guys" or "everyone". One person, direct address.
- No filler transitions: "so basically", "at the end of the day", "let that sink in", "that's the thing".
`

// ─────────────────────────────────────────────────────────────────────────────
// WHAT MAKES AN IDEA SPREAD (vs. just get watched)
// From the vault: "If a random stranger in your niche could make this exact video,
// it's the wrong idea."
// ─────────────────────────────────────────────────────────────────────────────

export const IDEA_QUALITY_PRINCIPLES = `
WHAT MAKES AN IDEA SPREAD:
- The idea has a point of view someone could DISAGREE WITH. Consensus content is forgettable.
- It's rooted in something the creator specifically experienced — not general advice.
- It creates curiosity or tension that can only be resolved by watching/reading to the end.
- The viewer sees themselves in it (identity match) — they feel like this was made FOR them.
- It has a surprising element: an unexpected angle, a counterintuitive truth, or a confession.

RED FLAGS (ideas that will perform poorly):
- Any idea where the creator's identity is irrelevant — a Wikipedia article could say the same thing
- Ideas that promise value without creating tension first (value-first without conflict)
- Listicles dressed up as personal content ("5 things I learned" without the real story behind each)
- Content that's actually a product demo or tutorial in disguise
`

// ─────────────────────────────────────────────────────────────────────────────
// CAROUSEL / SLIDE SPECIFIC
// ─────────────────────────────────────────────────────────────────────────────

export const CAROUSEL_PRINCIPLES = `
CAROUSEL WRITING RULES:
- Slide 1 = THE HOOK. One statement. Creates enough tension or curiosity that someone swipes. NOT a title or summary.
- Middle slides = one idea each. One thought, one moment, one beat. Short and punchy.
- Last slide = the earned payoff or conclusion. The release of all the tension built. No CTA, no "follow me", no "smash the like button".
- Each slide body: 1–3 short sentences max. If a slide needs more, it's two slides.
- Slide titles: 2–6 words, punchy. NOT a headline bullet point.
- Write in the exact voice of the script. Don't soften, don't generalize.
- No filler transitions. No hashtags.
`

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT: FULL KNOWLEDGE INJECTION
// Used in agent system prompts for content-generating agents.
// ─────────────────────────────────────────────────────────────────────────────

export function buildKnowledgeInjection(includeCarousel = false): string {
  const parts = [
    HOOK_PRINCIPLES,
    STORYTELLING_STRUCTURES,
    IDEA_QUALITY_PRINCIPLES,
  ]
  if (includeCarousel) parts.push(CAROUSEL_PRINCIPLES)
  return parts.join('\n\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT PILLARS INJECTION
// Tells agents what topic areas the creator will make content about.
// ─────────────────────────────────────────────────────────────────────────────

export function buildContentPillarsInjection(
  pillars: string[],
  offLimits: string,
  examplePosts: string[]
): string {
  const parts: string[] = []

  if (pillars.length > 0) {
    parts.push(`CONTENT PILLARS — this creator makes content about these topic areas ONLY:
${pillars.map(p => `- ${p}`).join('\n')}
Every idea must connect to at least one of these pillars. Ideas outside these areas are off-brand.`)
  }

  if (offLimits?.trim()) {
    parts.push(`OFF-LIMITS TOPICS — never generate content about:
${offLimits}`)
  }

  if (examplePosts.length > 0) {
    parts.push(`EXAMPLE CONTENT THIS CREATOR HAS ALREADY MADE (use for style/topic reference, do NOT repeat):
${examplePosts.map(p => `- ${p}`).join('\n')}`)
  }

  return parts.join('\n\n')
}
