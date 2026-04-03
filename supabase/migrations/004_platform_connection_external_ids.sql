ALTER TABLE platform_connections
ADD COLUMN IF NOT EXISTS external_account_id TEXT;

ALTER TABLE platform_connections
ADD COLUMN IF NOT EXISTS external_page_id TEXT;
