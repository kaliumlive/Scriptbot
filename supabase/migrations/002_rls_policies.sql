-- Enable RLS on all tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_repurpose_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_transcriptions ENABLE ROW LEVEL SECURITY;

-- Brands: users own their brands
CREATE POLICY "Users can manage own brands" ON brands FOR ALL USING (auth.uid() = user_id);

-- All brand-related tables: access via brand ownership
CREATE POLICY "Brand voice: owner access" ON brand_voice_profiles FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);
CREATE POLICY "Platform connections: owner access" ON platform_connections FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);
CREATE POLICY "Content ideas: owner access" ON content_ideas FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);
CREATE POLICY "Content drafts: owner access" ON content_drafts FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);
CREATE POLICY "Scheduled posts: owner access" ON scheduled_posts FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);
CREATE POLICY "Published posts: owner access" ON published_posts FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);
CREATE POLICY "Analytics: owner access" ON analytics_snapshots FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);
CREATE POLICY "Trend reports: owner access" ON trend_reports FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);
CREATE POLICY "Repurpose jobs: owner access" ON video_repurpose_jobs FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);
CREATE POLICY "Agent logs: owner access" ON agent_logs FOR ALL USING (
  brand_id IS NULL OR brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);
CREATE POLICY "Transcriptions: owner access" ON video_transcriptions FOR ALL USING (
  brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
);
