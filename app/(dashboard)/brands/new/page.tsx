'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'

type Step = 'basics' | 'your-story' | 'your-voice' | 'philosophy' | 'done'
const STEPS: Step[] = ['basics', 'your-story', 'your-voice', 'philosophy', 'done']
const STEP_LABELS = ['Brand basics', 'Your story', 'Your voice', 'Philosophy']

const PLATFORMS = ['instagram', 'tiktok', 'twitter', 'youtube']

interface FormState {
  name: string
  handle: string
  niche: string
  platforms: string[]
  worldview: string
  building_toward: string
  unlearned: string
  click_moment: string
  sacrifices: string
  natural_tone: string
  personal_phrases: string
  not_my_voice_phrases: string
  respected_creators: string
  never_do: string
  proud_content_reason: string
  content_cringe: string
  delete_triggers: string
  ideal_viewer: string
  desired_feeling: string
  known_for: string
}

function Field({
  label,
  note,
  children,
}: {
  label: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-200 mb-1">{label}</label>
      {note && <p className="text-xs text-zinc-500 mb-2">{note}</p>}
      {children}
    </div>
  )
}

const inputCls =
  'w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-50 text-sm focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600'
const textareaCls =
  'w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-50 text-sm focus:outline-none focus:border-zinc-600 placeholder:text-zinc-600 resize-none'

export default function NewBrandPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('basics')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormState>({
    name: '',
    handle: '',
    niche: '',
    platforms: ['instagram', 'tiktok'],
    worldview: '',
    building_toward: '',
    unlearned: '',
    click_moment: '',
    sacrifices: '',
    natural_tone: '',
    personal_phrases: '',
    not_my_voice_phrases: '',
    respected_creators: '',
    never_do: '',
    proud_content_reason: '',
    content_cringe: '',
    delete_triggers: '',
    ideal_viewer: '',
    desired_feeling: '',
    known_for: '',
  })

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function togglePlatform(p: string) {
    setForm(prev => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter(x => x !== p)
        : [...prev.platforms, p],
    }))
  }

  function nextStep() {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }

  function prevStep() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .insert({
          user_id: user.id,
          name: form.name,
          handle: form.handle || null,
          niche: form.niche || null,
          platforms: form.platforms,
        })
        .select()
        .single()
      if (brandError) throw brandError

      const { error: voiceError } = await supabase
        .from('brand_voice_profiles')
        .insert({
          brand_id: brand.id,
          worldview: form.worldview || null,
          building_toward: form.building_toward || null,
          unlearned: form.unlearned || null,
          click_moment: form.click_moment || null,
          sacrifices: form.sacrifices || null,
          natural_tone: form.natural_tone || null,
          personal_phrases: form.personal_phrases
            ? form.personal_phrases.split(',').map(s => s.trim()).filter(Boolean)
            : [],
          not_my_voice_phrases: form.not_my_voice_phrases
            ? form.not_my_voice_phrases.split(',').map(s => s.trim()).filter(Boolean)
            : [],
          respected_creators: form.respected_creators
            ? form.respected_creators.split(',').map(s => s.trim()).filter(Boolean)
            : [],
          never_do: form.never_do || null,
          proud_content_reason: form.proud_content_reason || null,
          content_cringe: form.content_cringe || null,
          delete_triggers: form.delete_triggers || null,
          ideal_viewer: form.ideal_viewer || null,
          desired_feeling: form.desired_feeling || null,
          known_for: form.known_for || null,
          formality_level: 'formal-casual',
          uses_technical_terms: true,
        })
      if (voiceError) throw voiceError

      setStep('done')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const stepIdx = STEPS.indexOf(step)

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-12 h-12 bg-green-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-50 mb-2">Brand created</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Voice profile saved. Agents will write content that sounds like you.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/brands')}
              className="text-sm text-zinc-400 hover:text-zinc-200 px-4 py-2"
            >
              View brands
            </button>
            <button
              onClick={() => router.push('/settings/connections')}
              className="bg-zinc-50 text-zinc-950 text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Connect social accounts
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.slice(0, -1).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium transition-colors ${
                i < stepIdx
                  ? 'bg-green-400 text-zinc-950'
                  : i === stepIdx
                  ? 'bg-zinc-50 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {i < stepIdx ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span
              className={`text-xs hidden sm:block ${
                i === stepIdx ? 'text-zinc-200' : 'text-zinc-600'
              }`}
            >
              {STEP_LABELS[i]}
            </span>
            {i < STEPS.length - 2 && (
              <div className={`w-6 h-px ${i < stepIdx ? 'bg-green-400' : 'bg-zinc-800'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step: Basics */}
      {step === 'basics' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-50">Brand basics</h2>
            <p className="text-zinc-400 text-sm mt-1">Start here — you can edit all of this later.</p>
          </div>
          <Field label="Brand name *" note="What you call this brand inside Scriptbot.">
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. kalium.wav"
              className={inputCls}
            />
          </Field>
          <Field label="Handle" note="Your username on the main platform (no @).">
            <input
              value={form.handle}
              onChange={e => set('handle', e.target.value)}
              placeholder="kalium.wav"
              className={inputCls}
            />
          </Field>
          <Field label="Niche" note="One phrase describing your content.">
            <input
              value={form.niche}
              onChange={e => set('niche', e.target.value)}
              placeholder="e.g. music production, sound design"
              className={inputCls}
            />
          </Field>
          <Field 
            label="Platforms" 
            note="Select the platforms you want to track analytics for. Integrations are currently read-only."
          >
            <div className="flex flex-wrap gap-2 mb-2">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                    form.platforms.includes(p)
                      ? 'bg-zinc-50 text-zinc-950'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-indigo-400 font-medium">
              Note: System generates drafts, but does not auto-post to these platforms.
            </p>
          </Field>
        </div>
      )}

      {/* Step: Your Story */}
      {step === 'your-story' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-50">Your story</h2>
            <p className="text-zinc-400 text-sm mt-1">
              Content that comes from your real experience hits different. These questions help agents write from your life, not from Google.
            </p>
          </div>
          <Field
            label="What do people who watch your videos think you stand for?"
            note="Not your niche — your worldview. What do they assume you believe in?"
          >
            <textarea
              value={form.worldview}
              onChange={e => set('worldview', e.target.value)}
              placeholder="e.g. unconditional support for creators, Indian sounds belonging in modern music..."
              className={textareaCls}
              rows={3}
            />
          </Field>
          <Field
            label="What version of yourself are you building toward?"
            note="Not career goals — the kind of person you're becoming."
          >
            <textarea
              value={form.building_toward}
              onChange={e => set('building_toward', e.target.value)}
              placeholder="Be honest — even if it sounds weird."
              className={textareaCls}
              rows={2}
            />
          </Field>
          <Field label="What did you have to unlearn or go through to get good at what you do?">
            <textarea
              value={form.unlearned}
              onChange={e => set('unlearned', e.target.value)}
              placeholder="Feedback that hurt, approaches that failed, things school taught wrong..."
              className={textareaCls}
              rows={3}
            />
          </Field>
          <Field label="A moment where everything clicked — specific session, beat, or decision?">
            <textarea
              value={form.click_moment}
              onChange={e => set('click_moment', e.target.value)}
              placeholder="The more specific, the better."
              className={textareaCls}
              rows={3}
            />
          </Field>
          <Field label="What did you invest to get here that most people don't see?">
            <textarea
              value={form.sacrifices}
              onChange={e => set('sacrifices', e.target.value)}
              placeholder="Degree, time, money, other pursuits..."
              className={textareaCls}
              rows={2}
            />
          </Field>
        </div>
      )}

      {/* Step: Your Voice */}
      {step === 'your-voice' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-50">Your voice</h2>
            <p className="text-zinc-400 text-sm mt-1">
              This is what agents will write in. Skip anything you&apos;re not sure about.
            </p>
          </div>
          <Field
            label="How do you naturally talk when explaining something to someone you trust?"
            note="Drop an example sentence if you can."
          >
            <textarea
              value={form.natural_tone}
              onChange={e => set('natural_tone', e.target.value)}
              placeholder="e.g. formal-casual, drops technical terms when no simpler word comes to mind, no catchphrases, just says what needs saying..."
              className={textareaCls}
              rows={3}
            />
          </Field>
          <Field label="Phrases or words you use naturally (comma-separated)" note="Even fillers count.">
            <input
              value={form.personal_phrases}
              onChange={e => set('personal_phrases', e.target.value)}
              placeholder="e.g. honestly, that's actually, for real"
              className={inputCls}
            />
          </Field>
          <Field label="Phrases that would tell you something wasn't written by you (comma-separated)">
            <input
              value={form.not_my_voice_phrases}
              onChange={e => set('not_my_voice_phrases', e.target.value)}
              placeholder="e.g. game-changer, unlock your potential, skyrocket"
              className={inputCls}
            />
          </Field>
          <Field
            label="2–3 creators whose communication style you respect (any field)"
            note="Not to copy — just for reference."
          >
            <input
              value={form.respected_creators}
              onChange={e => set('respected_creators', e.target.value)}
              placeholder="e.g. Chloe Shih, Adrian Per, Gawx"
              className={inputCls}
            />
          </Field>
          <Field label="What do you refuse to make, even if it would grow your audience?">
            <textarea
              value={form.never_do}
              onChange={e => set('never_do', e.target.value)}
              placeholder="e.g. content I wouldn't want to make for myself"
              className={textareaCls}
              rows={2}
            />
          </Field>
        </div>
      )}

      {/* Step: Philosophy */}
      {step === 'philosophy' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-50">Content philosophy</h2>
            <p className="text-zinc-400 text-sm mt-1">
              How agents decide what&apos;s worth making — and what to throw out.
            </p>
          </div>
          <Field
            label="When you've posted something and felt genuinely proud of it, what made it feel right?"
            note="Not because it performed — because it felt like you."
          >
            <textarea
              value={form.proud_content_reason}
              onChange={e => set('proud_content_reason', e.target.value)}
              placeholder="e.g. when it was gratifying for the effort, and it resonated with followers..."
              className={textareaCls}
              rows={3}
            />
          </Field>
          <Field label="What do you see other creators post that makes you cringe?">
            <textarea
              value={form.content_cringe}
              onChange={e => set('content_cringe', e.target.value)}
              placeholder="e.g. people with no idea what to post, just posting anything hoping it works..."
              className={textareaCls}
              rows={2}
            />
          </Field>
          <Field label="What would make you immediately delete a draft?">
            <textarea
              value={form.delete_triggers}
              onChange={e => set('delete_triggers', e.target.value)}
              placeholder="e.g. if it feels unfinished, or if something I said is factually wrong..."
              className={textareaCls}
              rows={2}
            />
          </Field>
          <Field
            label="Who are you actually making content for?"
            note="Not a demographic — a type of person."
          >
            <textarea
              value={form.ideal_viewer}
              onChange={e => set('ideal_viewer', e.target.value)}
              placeholder="e.g. I post my ideas — everything is a product of overthinking, if an idea turns out good it bugs me if I don't show people..."
              className={textareaCls}
              rows={2}
            />
          </Field>
          <Field label="What do you want people to feel after watching your content?" note="Not think — feel.">
            <input
              value={form.desired_feeling}
              onChange={e => set('desired_feeling', e.target.value)}
              placeholder="e.g. like they learned something they couldn't get anywhere else"
              className={inputCls}
            />
          </Field>
          <Field label="What do you want to be known for that has nothing to do with metrics?">
            <input
              value={form.known_for}
              onChange={e => set('known_for', e.target.value)}
              placeholder="e.g. skilled, good ideas, page lucrative for creative work"
              className={inputCls}
            />
          </Field>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-800">
        <button
          onClick={prevStep}
          disabled={stepIdx === 0}
          className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-0 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        {step === 'philosophy' ? (
          <button
            onClick={handleSubmit}
            disabled={loading || !form.name}
            className="flex items-center gap-2 bg-zinc-50 text-zinc-950 text-sm font-medium px-5 py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Create brand'}
            {!loading && <Check className="w-4 h-4" />}
          </button>
        ) : (
          <button
            onClick={nextStep}
            disabled={step === 'basics' && !form.name}
            className="flex items-center gap-2 bg-zinc-50 text-zinc-950 text-sm font-medium px-5 py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
