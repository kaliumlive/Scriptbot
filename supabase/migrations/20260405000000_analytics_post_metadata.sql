-- Add rich metadata columns to published_posts for display in analytics dashboard
ALTER TABLE published_posts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE published_posts ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE published_posts ADD COLUMN IF NOT EXISTS caption TEXT;
ALTER TABLE published_posts ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Add views column to analytics_snapshots (was computed but never stored correctly)
ALTER TABLE analytics_snapshots ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Index for cross-post detection by title
CREATE INDEX IF NOT EXISTS idx_published_posts_title ON published_posts (brand_id, title);

COMMENT ON COLUMN published_posts.title IS 'Human-readable title: video title for YouTube, first line of caption for Instagram';
COMMENT ON COLUMN published_posts.thumbnail_url IS 'CDN thumbnail URL — refreshed on each sync (Instagram URLs expire)';
COMMENT ON COLUMN published_posts.caption IS 'Full caption text from Instagram, or full video description for YouTube';
COMMENT ON COLUMN published_posts.media_type IS 'IMAGE | VIDEO | REELS | CAROUSEL_ALBUM for Instagram; video for YouTube';
COMMENT ON COLUMN analytics_snapshots.views IS 'Total view count — video_views/plays for Instagram, viewCount for YouTube';
