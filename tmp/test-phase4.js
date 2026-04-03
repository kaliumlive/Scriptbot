require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Get brand
  const { data: brandData, error: brandErr } = await supabase.from('brands').select('id').limit(1).single();
  if (brandErr) throw brandErr;

  // Create job
  const { data: job, error: jobErr } = await supabase.from('video_repurpose_jobs').insert({
    brand_id: brandData.id,
    source_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4', // A short video example
    status: 'pending'
  }).select('id').single();
  if (jobErr) throw jobErr;

  console.log('Created Job:', job.id);

  // 1. Download & Extract
  console.log('Downloading and extracting...')
  const { downloadAndExtractVideo } = require('./lib/video/extractor')
  const { tagFramesWithVision } = require('./lib/agents/vision-tagger')

  const extraction = await downloadAndExtractVideo('https://www.youtube.com/watch?v=ScMzIvxBSi4', 0.5)
  console.log('Extraction complete, frames in:', extraction.framesDir)

  // 2. Tag with Vision
  console.log('Tagging with vision...')
  const bRollNotes = [
    "A wide shot of a sunset",
    "Someone walking away"
  ]
  const taggedMoments = await tagFramesWithVision(extraction, bRollNotes)
  console.log('Tagged Moments:', taggedMoments)

}
main().catch(console.error);
