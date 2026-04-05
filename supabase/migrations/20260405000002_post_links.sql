-- Manual cross-post links: lets users explicitly connect a post on one platform
-- to the same content on another platform (e.g. an IG reel and a YouTube upload).
-- Always stored with post_id_a < post_id_b (alphabetically) so each pair has exactly one row.

CREATE TABLE IF NOT EXISTS post_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  post_id_a   UUID NOT NULL REFERENCES published_posts(id) ON DELETE CASCADE,
  post_id_b   UUID NOT NULL REFERENCES published_posts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id_a, post_id_b)
);

CREATE INDEX IF NOT EXISTS post_links_brand_id_idx ON post_links (brand_id);
