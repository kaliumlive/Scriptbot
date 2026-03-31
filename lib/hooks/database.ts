export type HookCategory =
  | 'comparison'
  | 'burning-question'
  | 'controversy'
  | 'pain-point'
  | 'desired-outcome'
  | 'secret-info'
  | 'unexpected-twist'
  | 'authority'
  | 'social-proof'
  | 'challenge'
  | 'mistake'
  | 'transformation'
  | 'behind-the-scenes'
  | 'hot-take'
  | 'story'

export interface HookTemplate {
  id: string
  category: HookCategory
  template: string // uses (topic), (number), (outcome), (timeframe) placeholders
  mass_appeal: boolean
  example?: string
}

export const HOOK_DATABASE: HookTemplate[] = [
  // Comparison hooks
  { id: 'cmp-001', category: 'comparison', template: 'Most producers do (topic) wrong. Here\'s what actually works.', mass_appeal: true },
  { id: 'cmp-002', category: 'comparison', template: '(topic) vs (topic) — I tested both for (timeframe) and here\'s what happened.', mass_appeal: true },
  { id: 'cmp-003', category: 'comparison', template: 'The difference between a (outcome) producer and everyone else.', mass_appeal: true },
  { id: 'cmp-004', category: 'comparison', template: 'Before I knew about (topic): (negative outcome). After: (positive outcome).', mass_appeal: true },
  { id: 'cmp-005', category: 'comparison', template: 'Why (common approach) is a waste of time when you could just (better approach).', mass_appeal: true },
  // Burning question hooks
  { id: 'bq-001', category: 'burning-question', template: 'Why does every producer skip this step?', mass_appeal: true },
  { id: 'bq-002', category: 'burning-question', template: 'What actually happens when you (action)?', mass_appeal: true },
  { id: 'bq-003', category: 'burning-question', template: 'Is (common belief) actually true? I tested it.', mass_appeal: true },
  { id: 'bq-004', category: 'burning-question', template: 'How do (successful producers) actually make (topic)?', mass_appeal: true },
  { id: 'bq-005', category: 'burning-question', template: 'What\'s the real reason your (topic) sounds like that?', mass_appeal: false },
  // Controversy hooks
  { id: 'con-001', category: 'controversy', template: '(Popular belief) is actually killing your (outcome).', mass_appeal: true },
  { id: 'con-002', category: 'controversy', template: 'Nobody talks about this but (controversial truth).', mass_appeal: true },
  { id: 'con-003', category: 'controversy', template: 'Unpopular opinion: (topic) doesn\'t matter as much as people think.', mass_appeal: true },
  { id: 'con-004', category: 'controversy', template: 'Stop (common advice). It\'s not what you think.', mass_appeal: true },
  { id: 'con-005', category: 'controversy', template: 'The (topic) advice you\'re getting is wrong. Here\'s why.', mass_appeal: true },
  // Pain point hooks
  { id: 'pp-001', category: 'pain-point', template: 'If your (topic) sounds off, this is probably why.', mass_appeal: true },
  { id: 'pp-002', category: 'pain-point', template: 'The reason your (topic) doesn\'t hit the way you want it to.', mass_appeal: true },
  { id: 'pp-003', category: 'pain-point', template: 'I spent (timeframe) fixing this one problem in my (topic).', mass_appeal: false },
  { id: 'pp-004', category: 'pain-point', template: 'You know that feeling when your (topic) is almost there but not quite? This is why.', mass_appeal: true },
  { id: 'pp-005', category: 'pain-point', template: 'Every producer struggles with (topic). Here\'s the actual fix.', mass_appeal: true },
  // Desired outcome hooks
  { id: 'do-001', category: 'desired-outcome', template: 'This is how I got my (topic) to sound like (outcome).', mass_appeal: false },
  { id: 'do-002', category: 'desired-outcome', template: '(Number) things I did to finally (outcome).', mass_appeal: true },
  { id: 'do-003', category: 'desired-outcome', template: 'The exact process I use to (outcome) every time.', mass_appeal: true },
  { id: 'do-004', category: 'desired-outcome', template: 'How to (outcome) without (common obstacle).', mass_appeal: true },
  { id: 'do-005', category: 'desired-outcome', template: 'What finally made my (topic) click.', mass_appeal: true },
  // Secret info hooks
  { id: 'si-001', category: 'secret-info', template: 'The (topic) technique nobody shows you.', mass_appeal: true },
  { id: 'si-002', category: 'secret-info', template: 'I don\'t know why more people don\'t talk about this (topic) method.', mass_appeal: true },
  { id: 'si-003', category: 'secret-info', template: 'Most tutorials skip this. It\'s the most important part of (topic).', mass_appeal: true },
  { id: 'si-004', category: 'secret-info', template: 'The (topic) thing I learned from (source) that changed how I work.', mass_appeal: false },
  { id: 'si-005', category: 'secret-info', template: 'There\'s a reason professional (topic) sounds different. Here it is.', mass_appeal: true },
  // Unexpected twist hooks
  { id: 'ut-001', category: 'unexpected-twist', template: 'I tried (thing everyone does) for (timeframe). Here\'s what actually happened.', mass_appeal: true },
  { id: 'ut-002', category: 'unexpected-twist', template: 'The worst (topic) I ever made taught me the most.', mass_appeal: true },
  { id: 'ut-003', category: 'unexpected-twist', template: 'I followed all the (topic) rules. The results surprised me.', mass_appeal: true },
  { id: 'ut-004', category: 'unexpected-twist', template: 'What I thought was (negative) turned out to be (positive).', mass_appeal: true },
  { id: 'ut-005', category: 'unexpected-twist', template: 'This shouldn\'t work. It does.', mass_appeal: true },
  // Authority hooks
  { id: 'au-001', category: 'authority', template: 'After (timeframe) of making (topic), here\'s what I actually know.', mass_appeal: false },
  { id: 'au-002', category: 'authority', template: 'Sound engineering school taught me (thing). Real sessions taught me this instead.', mass_appeal: false },
  { id: 'au-003', category: 'authority', template: '(Number) sessions in and I\'m still learning (topic).', mass_appeal: false },
  { id: 'au-004', category: 'authority', template: 'The feedback that changed how I think about (topic).', mass_appeal: false },
  { id: 'au-005', category: 'authority', template: 'What (experienced producer) told me about (topic) that stuck.', mass_appeal: false },
  // Challenge hooks
  { id: 'ch-001', category: 'challenge', template: 'I made (number) beats using only (constraint). Here\'s what I learned.', mass_appeal: true },
  { id: 'ch-002', category: 'challenge', template: 'Recreating (reference) from scratch — no tutorials, just my ear.', mass_appeal: true },
  { id: 'ch-003', category: 'challenge', template: 'Can you actually (outcome) in (timeframe)? I tried.', mass_appeal: true },
  { id: 'ch-004', category: 'challenge', template: '(Challenge) for (timeframe). Day 1.', mass_appeal: true },
  { id: 'ch-005', category: 'challenge', template: 'Making a (genre) beat but I only use (constraint).', mass_appeal: true },
  // Mistake hooks
  { id: 'mi-001', category: 'mistake', template: 'The (topic) mistake I kept making for (timeframe).', mass_appeal: true },
  { id: 'mi-002', category: 'mistake', template: 'I did (wrong thing) for years. Here\'s what it cost me.', mass_appeal: true },
  { id: 'mi-003', category: 'mistake', template: 'Don\'t do what I did with (topic).', mass_appeal: true },
  { id: 'mi-004', category: 'mistake', template: 'The (topic) advice I wish someone gave me earlier.', mass_appeal: true },
  { id: 'mi-005', category: 'mistake', template: 'I wasted (timeframe) on (wrong approach). This is what works.', mass_appeal: true },
  // Transformation hooks
  { id: 'tr-001', category: 'transformation', template: 'My (topic) (timeframe) ago vs now. The difference is (insight).', mass_appeal: true },
  { id: 'tr-002', category: 'transformation', template: 'How my approach to (topic) completely changed.', mass_appeal: true },
  { id: 'tr-003', category: 'transformation', template: 'The moment I stopped (wrong approach) and started (right approach).', mass_appeal: true },
  { id: 'tr-004', category: 'transformation', template: 'What changed when I finally (action).', mass_appeal: true },
  { id: 'tr-005', category: 'transformation', template: 'Everything I thought I knew about (topic) was wrong.', mass_appeal: true },
  // Behind the scenes hooks
  { id: 'bts-001', category: 'behind-the-scenes', template: 'The part of (process) nobody films.', mass_appeal: true },
  { id: 'bts-002', category: 'behind-the-scenes', template: 'What a (topic) session actually looks like.', mass_appeal: true },
  { id: 'bts-003', category: 'behind-the-scenes', template: 'This is my real process for (topic). No cuts.', mass_appeal: true },
  { id: 'bts-004', category: 'behind-the-scenes', template: 'Studio day — but I\'m showing the boring parts too.', mass_appeal: true },
  { id: 'bts-005', category: 'behind-the-scenes', template: 'How (outcome) actually gets made from scratch.', mass_appeal: true },
  // Hot take hooks
  { id: 'ht-001', category: 'hot-take', template: '(Topic) is overrated. Here\'s what actually matters.', mass_appeal: true },
  { id: 'ht-002', category: 'hot-take', template: 'The (topic) myth that needs to die.', mass_appeal: true },
  { id: 'ht-003', category: 'hot-take', template: 'If you\'re obsessing over (topic), you\'re missing the point.', mass_appeal: true },
  { id: 'ht-004', category: 'hot-take', template: '(Controversial take about topic).', mass_appeal: true },
  { id: 'ht-005', category: 'hot-take', template: 'The (topic) gatekeeping needs to stop.', mass_appeal: true },
  // Story hooks
  { id: 'st-001', category: 'story', template: 'Story time: the (topic) session that almost made me quit.', mass_appeal: false },
  { id: 'st-002', category: 'story', template: 'The feedback that broke me and what I did with it.', mass_appeal: false },
  { id: 'st-003', category: 'story', template: 'How I ended up studying sound engineering and what I actually think of it.', mass_appeal: false },
  { id: 'st-004', category: 'story', template: 'A session where everything went wrong — and what I learned.', mass_appeal: false },
  { id: 'st-005', category: 'story', template: 'The moment I realized (insight) about my own music.', mass_appeal: false },
  // Social proof hooks
  { id: 'sp-001', category: 'social-proof', template: '(Number) producers I respect all do this one (topic) thing.', mass_appeal: true },
  { id: 'sp-002', category: 'social-proof', template: 'Someone with (number) streams broke down their (topic) process. Notes below.', mass_appeal: true },
  { id: 'sp-003', category: 'social-proof', template: 'I studied (number) successful (topic) examples. Here\'s the pattern.', mass_appeal: true },
  { id: 'sp-004', category: 'social-proof', template: 'What separates (high-level outcome) producers from everyone else.', mass_appeal: true },
  { id: 'sp-005', category: 'social-proof', template: 'The (topic) thing that (respected name) gets right that others don\'t.', mass_appeal: true },
]

export function getHooksByCategory(category: HookCategory): HookTemplate[] {
  return HOOK_DATABASE.filter(h => h.category === category)
}

export function getMassAppealHooks(): HookTemplate[] {
  return HOOK_DATABASE.filter(h => h.mass_appeal)
}

export function fillHookTemplate(template: string, replacements: Record<string, string>): string {
  let filled = template
  for (const [key, value] of Object.entries(replacements)) {
    filled = filled.replace(new RegExp(`\\(${key}\\)`, 'g'), value)
  }
  return filled
}
