-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  handle TEXT,
  niche TEXT,
  tone_of_voice TEXT,
  hashtag_sets JSONB DEFAULT '[]',
  color_palette JSONB DEFAULT '[]',
  logo_url TEXT,
  competitor_handles JSONB DEFAULT '[]',
  platforms JSONB DEFAULT '["instagram","tiktok","twitter","youtube"]',
  audience_timezone TEXT DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand voice profiles
CREATE TABLE IF NOT EXISTS brand_voice_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  worldview TEXT,
  building_toward TEXT,
  unlearned TEXT,
  hard_period TEXT,
  click_moment TEXT,
  sacrifices TEXT,
  producer_mistakes TEXT,
  unpopular_belief TEXT,
  never_do TEXT,
  natural_tone TEXT,
  personal_phrases JSONB DEFAULT '[]',
  not_my_voice_phrases JSONB DEFAULT '[]',
  respected_creators JSONB DEFAULT '[]',
  proud_content_reason TEXT,
  content_cringe TEXT,
  delete_triggers TEXT,
  ideal_viewer TEXT,
  desired_feeling TEXT,
  five_year_vision TEXT,
  known_for TEXT,
  -- Transcription-derived
  common_sentence_starters JSONB DEFAULT '[]',
  avg_sentence_length TEXT DEFAULT 'short',
  formality_level TEXT DEFAULT 'formal-casual',
  uses_technical_terms BOOLEAN DEFAULT true,
  term_drop_style TEXT,
  filler_patterns JSONB DEFAULT '[]',
  style_guide TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform OAuth connections
CREATE TABLE IF NOT EXISTS platform_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  platform_user_id TEXT,
  platform_username TEXT,
  scopes JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, platform)
);

-- Content ideas
CREATE TABLE IF NOT EXISTS content_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  concept TEXT,
  hook TEXT,
  story_structure_id TEXT,
  target_platforms JSONB DEFAULT '[]',
  content_type TEXT DEFAULT 'short_video',
  status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'approved', 'rejected', 'drafted')),
  source TEXT DEFAULT 'ai' CHECK (source IN ('ai', 'user', 'trend')),
  trend_report_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content drafts
CREATE TABLE IF NOT EXISTS content_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  idea_id UUID REFERENCES content_ideas(id),
  title TEXT,
  content_type TEXT NOT NULL DEFAULT 'short_video',
  script TEXT,
  hook TEXT,
  build_up TEXT,
  value_section TEXT,
  payoff TEXT,
  cta TEXT,
  carousel_slides JSONB DEFAULT '[]',
  hashtags JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'rejected')),
  platforms JSONB DEFAULT '[]',
  b_roll_notes TEXT,
  visual_direction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  draft_id UUID REFERENCES content_drafts(id),
  platform TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'published', 'failed', 'cancelled')),
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Published posts
CREATE TABLE IF NOT EXISTS published_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  scheduled_post_id UUID REFERENCES scheduled_posts(id),
  draft_id UUID REFERENCES content_drafts(id),
  platform TEXT NOT NULL,
  platform_post_id TEXT,
  platform_post_url TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics snapshots
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  published_post_id UUID REFERENCES published_posts(id),
  platform TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  profile_visits INTEGER DEFAULT 0,
  follows_from_post INTEGER DEFAULT 0,
  ai_insights TEXT,
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trend reports
CREATE TABLE IF NOT EXISTS trend_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  niche TEXT,
  trends JSONB DEFAULT '[]',
  report_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video repurpose jobs
CREATE TABLE IF NOT EXISTS video_repurpose_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  source_type TEXT DEFAULT 'upload' CHECK (source_type IN ('upload', 'youtube', 'url')),
  source_url TEXT,
  video_storage_path TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'extracting_frames', 'analyzing', 'generating_slides', 'complete', 'failed')),
  frame_count INTEGER DEFAULT 0,
  key_moments JSONB DEFAULT '[]',
  carousel_slide_urls JSONB DEFAULT '[]',
  draft_id UUID REFERENCES content_drafts(id),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent logs
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,
  brand_id UUID REFERENCES brands(id),
  status TEXT NOT NULL CHECK (status IN ('running', 'complete', 'failed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  tokens_used INTEGER DEFAULT 0,
  items_processed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Video transcriptions (for voice learning)
CREATE TABLE IF NOT EXISTS video_transcriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  source_url TEXT,
  platform TEXT,
  transcription TEXT,
  voice_patterns JSONB DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
