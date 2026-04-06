-- Add content pillars, off-limits topics, and example posts to brands table
-- These tell agents WHAT the creator wants to make content about

ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS content_pillars TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS off_limits_topics TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS example_posts TEXT[] DEFAULT '{}';

COMMENT ON COLUMN brands.content_pillars IS 'Topic areas the creator wants to make content about (e.g. music production, music business, creative process)';
COMMENT ON COLUMN brands.off_limits_topics IS 'Topics the creator refuses to make content about';
COMMENT ON COLUMN brands.example_posts IS 'URLs or short descriptions of content the creator has already made — used as style reference for agents';
