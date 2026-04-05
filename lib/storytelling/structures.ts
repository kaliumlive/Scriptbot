export interface StoryStructure {
  id: string
  name: string
  description: string
  best_for: string[]
  stages: StoryStage[]
  example_topic?: string
  example_outline?: string[]
  visual_theme?: string // General visual direction (e.g. "Gritty", "High-Energy Mographs", "Cinematic")
}

export interface StoryStage {
  name: string
  purpose: string
  duration_pct: number // % of total video
  prompts: string[] // questions to help writer fill this stage
  visual_guidance?: string // Guidance for the AV Storyboarder agent
}

export const STORY_STRUCTURES: StoryStructure[] = [
  {
    id: 'heros-journey',
    name: "Hero's Journey",
    description: "Classic transformation arc: normal world → challenge → struggle → breakthrough → new normal.",
    best_for: ['personal story', 'transformation', 'skill development', 'lesson learned'],
    visual_theme: 'Cinematic storytelling with personal B-roll and emotional "movie scene" metaphors.',
    stages: [
      { name: 'Normal World', purpose: 'Show your starting point — relatable, ordinary', duration_pct: 10, prompts: ['Where were you before this happened?', 'What was your default state?'], visual_guidance: 'Static, relatable shots of your workspace or daily routine.' },
      { name: 'The Call', purpose: 'The problem, challenge, or question that kicked everything off', duration_pct: 15, prompts: ['What disrupted the normal?', 'What forced you to act?'], visual_guidance: 'A sudden shift in music or a "record scratch" visual effect.' },
      { name: 'The Struggle', purpose: 'Resistance, attempts, failures — build tension', duration_pct: 30, prompts: ['What did you try that didn\'t work?', 'What was the hardest part?'], visual_guidance: 'Fast-paced montage of "attempts" or an iconic movie scene showing a character struggling.' },
      { name: 'The Breakthrough', purpose: 'The insight, discovery, or turning point', duration_pct: 20, prompts: ['What finally clicked?', 'What changed your approach?'], visual_guidance: 'Bright, high-contrast visuals or a "eureka" movie clip.' },
      { name: 'New Normal', purpose: 'How you operate now — the practical takeaway', duration_pct: 20, prompts: ['What do you do differently now?', 'What\'s the actionable lesson?'], visual_guidance: 'Confident talking-head shots mixed with "after" results B-roll.' },
      { name: 'CTA (optional)', purpose: 'Only if it fits naturally', duration_pct: 5, prompts: ['Is there a resource, comment prompt, or action that adds value here?'] },
    ],
  },
  {
    id: 'about-me',
    name: 'About Me',
    description: "Introduce yourself through what you've done, what you believe, and what makes you different.",
    best_for: ['introduction', 'brand building', 'new audience'],
    stages: [
      { name: 'The Hook Identity', purpose: 'Bold self-descriptor that creates intrigue', duration_pct: 10, prompts: ['What\'s the most unexpected thing about you?', 'What label would you give yourself?'] },
      { name: 'The Evidence', purpose: 'Proof — what you\'ve made, done, learned', duration_pct: 35, prompts: ['What\'s your most interesting credential?', 'What have you built or made?'] },
      { name: 'The Belief', purpose: 'What you actually stand for', duration_pct: 25, prompts: ['What do you believe that others don\'t?', 'What do you refuse to do?'] },
      { name: 'The Vision', purpose: 'Where you\'re going / what you\'re building', duration_pct: 20, prompts: ['What are you working toward?', 'What problem are you solving?'] },
      { name: 'The Invitation', purpose: 'Why they should follow', duration_pct: 10, prompts: ['What will they get from following you?'] },
    ],
  },
  {
    id: 'the-lesson',
    name: 'The Lesson',
    description: "Teach one specific, actionable thing. Value-dense, educational.",
    best_for: ['tutorial', 'tip', 'technique', 'process breakdown'],
    visual_theme: 'Clean, professional mographs mixed with direct screenshare or top-down hands-on shots.',
    stages: [
      { name: 'The Problem Hook', purpose: 'Name the exact problem this lesson solves', duration_pct: 15, prompts: ['What frustration does this fix?', 'What\'s the pain before the lesson?'], visual_guidance: 'Text-on-screen mograph of the "Pain Point".' },
      { name: 'The Setup', purpose: 'Why most people approach this wrong', duration_pct: 20, prompts: ['What\'s the common mistake?', 'What do people misunderstand?'], visual_guidance: 'A "Stop" sign mograph or a famous movie scene showing a "wrong way" to do things.' },
      { name: 'The Lesson', purpose: 'The actual technique — specific and actionable', duration_pct: 45, prompts: ['What exactly do you do?', 'What are the steps?', 'What\'s the nuance most tutorials miss?'], visual_guidance: 'Detailed screenshare, code snippets, or close-up B-roll of the action.' },
      { name: 'The Result', purpose: 'Show the before/after or outcome', duration_pct: 15, prompts: ['What does success look like?', 'What changes when you apply this?'], visual_guidance: 'Split-screen "Before vs After" comparison.' },
      { name: 'CTA (optional)', purpose: 'Optional action', duration_pct: 5, prompts: ['Is there a follow-up resource?'] },
    ],
  },
  {
    id: 'big-goal',
    name: 'The Big Goal',
    description: "Announce a challenge or ambitious project and document the journey.",
    best_for: ['series', 'challenge', 'project announcement', 'accountability'],
    stages: [
      { name: 'The Announcement', purpose: 'State the goal clearly and boldly', duration_pct: 20, prompts: ['What\'s the goal in one sentence?', 'Why is it ambitious?'] },
      { name: 'The Stakes', purpose: 'Why this matters — what\'s at risk', duration_pct: 20, prompts: ['What happens if you fail?', 'Why are you doing this?'] },
      { name: 'The Plan', purpose: 'How you\'re approaching it', duration_pct: 30, prompts: ['What\'s your strategy?', 'What are the steps?'] },
      { name: 'The Unknown', purpose: 'What you\'re not sure about — vulnerability', duration_pct: 20, prompts: ['What are you scared of?', 'What might go wrong?'] },
      { name: 'The Invite', purpose: 'Get them to follow the journey', duration_pct: 10, prompts: ['How can they follow along?'] },
    ],
  },
  {
    id: 'challenge-to-victory',
    name: 'Challenge to Victory',
    description: "Document a specific attempt — the setup, the attempt, the result.",
    best_for: ['experiment', 'demo', 'recreation challenge', 'test'],
    stages: [
      { name: 'The Setup', purpose: 'Define the challenge clearly', duration_pct: 20, prompts: ['What are you attempting?', 'What are the rules/constraints?'] },
      { name: 'The Attempt', purpose: 'Show the process in real time or edited', duration_pct: 50, prompts: ['What happened step by step?', 'What obstacles came up?'] },
      { name: 'The Result', purpose: 'Did it work? Be honest.', duration_pct: 20, prompts: ['What was the outcome?', 'What surprised you?'] },
      { name: 'The Takeaway', purpose: 'What you learned from the attempt', duration_pct: 10, prompts: ['What would you do differently?', 'What\'s the lesson?'] },
    ],
  },
  {
    id: 'breakthrough',
    name: 'The Breakthrough',
    description: "Focus on one specific insight or realization that changed how you work.",
    best_for: ['insight', 'realization', 'mindset shift', 'process change'],
    stages: [
      { name: 'Before the Breakthrough', purpose: 'How you thought / worked before', duration_pct: 25, prompts: ['What was your old approach?', 'What problem were you stuck on?'] },
      { name: 'The Trigger', purpose: 'What caused the insight', duration_pct: 20, prompts: ['What moment or experience triggered it?', 'What feedback, observation, or accident led to it?'] },
      { name: 'The Insight', purpose: 'The actual realization — stated clearly', duration_pct: 30, prompts: ['What did you realize?', 'State it as simply as possible.'] },
      { name: 'The Application', purpose: 'How you applied it in practice', duration_pct: 20, prompts: ['What did you change?', 'What\'s the practical implementation?'] },
      { name: 'CTA (optional)', purpose: 'Optional', duration_pct: 5, prompts: [] },
    ],
  },
  {
    id: 'reaction-commentary',
    name: 'React & Comment',
    description: "React to a trend, technique, or piece of content with your own perspective.",
    best_for: ['commentary', 'opinion', 'trend reaction', 'analysis'],
    stages: [
      { name: 'Setup the Subject', purpose: 'What you\'re reacting to', duration_pct: 20, prompts: ['What\'s the trend/technique/content?', 'Why does it matter right now?'] },
      { name: 'Your Initial Take', purpose: 'First impression / instinctive reaction', duration_pct: 20, prompts: ['What\'s your gut response?'] },
      { name: 'The Nuance', purpose: 'What\'s right, wrong, or missing from the common take', duration_pct: 40, prompts: ['What do people get right?', 'What do they miss?', 'What\'s the more accurate way to think about this?'] },
      { name: 'Your Verdict', purpose: 'Clear, direct conclusion', duration_pct: 20, prompts: ['What\'s your final take?', 'What should people do with this?'] },
    ],
  },
  {
    id: 'day-in-the-life',
    name: 'Day in the Life',
    description: "Show your actual process and environment. Authenticity-heavy format.",
    best_for: ['vlog', 'studio session', 'process content', 'authenticity'],
    stages: [
      { name: 'The Hook Moment', purpose: 'Start mid-action — most interesting moment first', duration_pct: 10, prompts: ['What\'s the most interesting moment in this day?'] },
      { name: 'Context', purpose: 'What day/project/goal this is', duration_pct: 10, prompts: ['What are you working on today?', 'What\'s the mission?'] },
      { name: 'The Process', purpose: 'Real work shown — include struggles', duration_pct: 55, prompts: ['What does the actual work look like?', 'What went wrong?', 'What surprised you?'] },
      { name: 'The Output', purpose: 'Result of the day', duration_pct: 15, prompts: ['What did you make/finish/learn?'] },
      { name: 'Reflection', purpose: 'One honest thought about the day', duration_pct: 10, prompts: ['What do you take away from today?'] },
    ],
  },
  {
    id: 'comparison',
    name: 'A vs B Comparison',
    description: "Compare two approaches, tools, techniques, or workflows directly.",
    best_for: ['gear review', 'technique comparison', 'workflow comparison', 'tool review'],
    stages: [
      { name: 'Frame the Comparison', purpose: 'State exactly what you\'re comparing and why it matters', duration_pct: 15, prompts: ['What are the two things?', 'Why does this comparison matter?'] },
      { name: 'Option A', purpose: 'Show/explain the first option with real examples', duration_pct: 30, prompts: ['What does A look/sound like?', 'What are A\'s strengths?', 'What are A\'s weaknesses?'] },
      { name: 'Option B', purpose: 'Show/explain the second option with real examples', duration_pct: 30, prompts: ['What does B look/sound like?', 'What are B\'s strengths?', 'What are B\'s weaknesses?'] },
      { name: 'Your Verdict', purpose: 'Direct opinion — don\'t hedge', duration_pct: 20, prompts: ['Which do you prefer and why?', 'When would you use each?'] },
      { name: 'CTA (optional)', purpose: 'Optional', duration_pct: 5, prompts: [] },
    ],
  },
  {
    id: 'myth-busting',
    name: 'Myth Buster',
    description: "Take on a widely-held belief and dismantle it with evidence and your own experience.",
    best_for: ['hot take', 'controversy', 'misinformation correction', 'opinion'],
    stages: [
      { name: 'State the Myth', purpose: 'Name the belief clearly — don\'t strawman it', duration_pct: 20, prompts: ['What\'s the common belief you\'re challenging?', 'Where do people hear this?'] },
      { name: 'Why People Believe It', purpose: 'Steelman the myth — show you understand why it spread', duration_pct: 20, prompts: ['Why does this belief persist?', 'What truth is hidden in it?'] },
      { name: 'The Reality', purpose: 'What\'s actually true — your evidence and experience', duration_pct: 40, prompts: ['What does your experience say?', 'What\'s the actual evidence?', 'What are the exceptions?'] },
      { name: 'What to Do Instead', purpose: 'Practical replacement for the myth', duration_pct: 15, prompts: ['What should people do with this new understanding?'] },
      { name: 'CTA (optional)', purpose: 'Optional', duration_pct: 5, prompts: [] },
    ],
  },
  {
    id: 'aida',
    name: 'AIDA',
    description: "Classic copywriting framework: Attention → Interest → Desire → Action. Perfect for promotional and persuasive content.",
    best_for: ['promo', 'product', 'offer', 'persuasion', 'announcement'],
    visual_theme: 'High-energy cuts, bold text overlays, aspirational B-roll.',
    stages: [
      { name: 'Attention', purpose: 'Stop the scroll — one bold, unexpected, or visual statement', duration_pct: 15, prompts: ['What\'s the most arresting thing you can say?', 'What will make them freeze mid-scroll?'], visual_guidance: 'Big text-on-screen or a visually striking action.' },
      { name: 'Interest', purpose: 'Keep them watching — build curiosity or relevance', duration_pct: 30, prompts: ['Why should they care?', 'What context makes this interesting?', 'What\'s the problem or opportunity?'], visual_guidance: 'Talking head with expressive delivery, or rapid-cut montage.' },
      { name: 'Desire', purpose: 'Create want — show the outcome, the transformation, the feeling', duration_pct: 35, prompts: ['What does their life look like with this?', 'What\'s the specific benefit they get?', 'Show don\'t tell — what does success look like?'], visual_guidance: 'Results B-roll, before/after, or aspirational imagery.' },
      { name: 'Action', purpose: 'One clear ask — don\'t hedge', duration_pct: 20, prompts: ['What\'s the single thing you want them to do?', 'Make it feel easy and immediate.'], visual_guidance: 'Direct eye contact, confident tone, text CTA on screen.' },
    ],
  },
  {
    id: 'abt',
    name: 'ABT (And-But-Therefore)',
    description: "South Park's storytelling engine. And (setup) → But (conflict) → Therefore (resolution). Keeps narrative momentum tight.",
    best_for: ['personal story', 'case study', 'problem-solution', 'explanation'],
    visual_theme: 'Conversational, tight edits, momentum-driven pacing.',
    stages: [
      { name: 'And (Setup)', purpose: 'Establish the world — what was true, what you had, how things were', duration_pct: 25, prompts: ['What\'s the background?', 'What was the normal state of things?', 'What did you have or think?'], visual_guidance: 'Relaxed B-roll, setting the scene.' },
      { name: 'But (Conflict)', purpose: 'The turn — what went wrong, what changed, what you discovered', duration_pct: 35, prompts: ['What disrupted the normal?', 'What didn\'t work?', 'What problem emerged?'], visual_guidance: 'Quick cut, tonal shift in music, direct-to-camera delivery.' },
      { name: 'Therefore (Resolution)', purpose: 'The outcome — what you did, what changed, what others should do', duration_pct: 40, prompts: ['What did you do about it?', 'What\'s the result?', 'What should they take away?'], visual_guidance: 'Confident delivery, results shown, clear conclusion.' },
    ],
  },
  {
    id: 'pas',
    name: 'PAS (Problem-Agitate-Solution)',
    description: "Direct response formula. Name the pain → make it feel urgent → present the fix. High-converting for educational content.",
    best_for: ['tutorial', 'tip', 'pain point', 'educational', 'fix'],
    visual_theme: 'Clean, direct, high-information density.',
    stages: [
      { name: 'Problem', purpose: 'Name the exact pain point your audience is experiencing right now', duration_pct: 20, prompts: ['What specific problem do they have?', 'Say it in their words, not yours.'], visual_guidance: 'Text mograph of the problem statement, or direct address.' },
      { name: 'Agitate', purpose: 'Make the problem feel real and urgent — consequences, frustration, cost', duration_pct: 30, prompts: ['What happens if they don\'t fix this?', 'How does this problem compound over time?', 'What are they missing out on?'], visual_guidance: 'Emotional delivery, relatable frustration shown.' },
      { name: 'Solution', purpose: 'Present the fix clearly, specifically, and actionably', duration_pct: 45, prompts: ['What\'s the exact solution?', 'Walk through it step by step.', 'What makes your solution better than the alternatives?'], visual_guidance: 'Tutorial-style screenshare or demonstration, clear steps on screen.' },
      { name: 'CTA (optional)', purpose: 'Optional follow-through ask', duration_pct: 5, prompts: ['What do you want them to do next?'] },
    ],
  },
  {
    id: 'bab',
    name: 'Before-After-Bridge (BAB)',
    description: "Show where they are (Before) → where they could be (After) → how to get there (Bridge). Pure transformation framing.",
    best_for: ['transformation', 'tutorial', 'tip', 'result showcase', 'testimonial'],
    visual_theme: 'Split-screen, contrast visuals, aspirational imagery.',
    stages: [
      { name: 'Before', purpose: 'Paint the current painful reality your audience is living', duration_pct: 25, prompts: ['What does their life look like right now?', 'What\'s the struggle, the frustration, the lack?'], visual_guidance: 'Relatable, unpolished "before" footage or description.' },
      { name: 'After', purpose: 'Show the desired future state — vivid, specific, emotional', duration_pct: 30, prompts: ['What does success look like in detail?', 'How does it feel?', 'What\'s different about their day-to-day?'], visual_guidance: 'Aspirational B-roll, your own "after" results, bright and confident.' },
      { name: 'Bridge', purpose: 'The exact path from Before to After — your method, step, or insight', duration_pct: 40, prompts: ['What\'s the specific mechanism that creates the transformation?', 'Walk them through it.'], visual_guidance: 'Tutorial/demonstration, clear and structured delivery.' },
      { name: 'CTA (optional)', purpose: 'Optional', duration_pct: 5, prompts: [] },
    ],
  },
]

export function getStructureById(id: string): StoryStructure | undefined {
  return STORY_STRUCTURES.find(s => s.id === id)
}

export function getStructuresForContentType(contentType: string): StoryStructure[] {
  return STORY_STRUCTURES.filter(s => s.best_for.some(b => b.toLowerCase().includes(contentType.toLowerCase())))
}
