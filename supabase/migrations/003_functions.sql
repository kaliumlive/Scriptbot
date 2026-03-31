-- Function: update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_ideas_updated_at BEFORE UPDATE ON content_ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_drafts_updated_at BEFORE UPDATE ON content_drafts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON scheduled_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_platform_connections_updated_at BEFORE UPDATE ON platform_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_repurpose_jobs_updated_at BEFORE UPDATE ON video_repurpose_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: get brand pipeline stats
CREATE OR REPLACE FUNCTION get_pipeline_stats(p_brand_id UUID)
RETURNS TABLE(
  ideas_count BIGINT,
  drafts_count BIGINT,
  approved_count BIGINT,
  scheduled_count BIGINT,
  published_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM content_ideas WHERE brand_id = p_brand_id AND status = 'idea'),
    (SELECT COUNT(*) FROM content_drafts WHERE brand_id = p_brand_id AND status = 'draft'),
    (SELECT COUNT(*) FROM content_drafts WHERE brand_id = p_brand_id AND status = 'approved'),
    (SELECT COUNT(*) FROM scheduled_posts WHERE brand_id = p_brand_id AND status = 'scheduled'),
    (SELECT COUNT(*) FROM published_posts WHERE brand_id = p_brand_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
