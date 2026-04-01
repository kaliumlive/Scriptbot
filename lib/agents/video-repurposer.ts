import { createAdminClient } from '@/lib/supabase/admin'
import { extractFrames } from '../video/frame-extractor'
import { generateWithGemini } from '../ai/gemini'
import { generateWithGroq } from '../ai/groq'
import { renderSlides } from '../carousel/renderer'

export async function runVideoRepurposer(brandId: string, jobId: string) {
    const supabase = createAdminClient()

    // 1. Get Job & Brand Info
    const { data: job } = await supabase
        .from('video_repurpose_jobs')
        .select('*, brands(*)')
        .eq('id', jobId)
        .single()

    if (!job) throw new Error('Job not found')

    // 2. Extract Frames (Phase: extracting_frames)
    await supabase.from('video_repurpose_jobs').update({ status: 'extracting_frames' }).eq('id', jobId)
    const frames = await extractFrames(job.source_url || job.video_storage_path, 5, brandId)

    // 3. Analyze with AI (Phase: analyzing)
    await supabase.from('video_repurpose_jobs').update({ status: 'analyzing', frame_count: frames.length }).eq('id', jobId)

    const analysisPrompt = `Analyze these frames from a video for the brand "${job.brands.name}" in the niche "${job.brands.niche}". 
  What are the key visual hooks and value points? 
  Suggest a viral carousel concept with 5 slides.`

    // Note: analyzeImageWithGemini would be better but for now we'll use text-based if frames are many
    // Ideally we send the frames directly.
    const concept = await generateWithGemini(analysisPrompt, 'pro')

    // 4. Generate Slide Content (Phase: generating_slides)
    await supabase.from('video_repurpose_jobs').update({ status: 'generating_slides' }).eq('id', jobId)

    const slideContentPrompt = `Based on this concept: ${concept}, write content for a 5-slide educational carousel.
  For each slide, provide a title and 2-3 bullet points.
  Return as a JSON array of objects with {title, content}.`

    const slidesJson = await generateWithGroq(slideContentPrompt, "You are a world-class social media strategist.")
    const slides = JSON.parse(slidesJson)

    // 5. Render Carousel
    const slideUrls = await renderSlides(slides, brandId)

    // 6. Create Draft
    const { data: draft } = await supabase.from('content_drafts').insert({
        brand_id: brandId,
        title: `Repurposed: ${slides[0].title}`,
        content_type: 'carousel',
        carousel_slides: slides,
        status: 'draft',
        visual_direction: concept,
    }).select('id').single()

    // 7. Complete Job
    await supabase.from('video_repurpose_jobs').update({
        status: 'complete',
        carousel_slide_urls: slideUrls,
        draft_id: draft?.id
    }).eq('id', jobId)

    return { status: 'complete', draftId: draft?.id }
}
