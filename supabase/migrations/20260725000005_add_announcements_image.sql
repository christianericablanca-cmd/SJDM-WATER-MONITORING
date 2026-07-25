ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN announcements.image_url IS 'URL to an optional featured image for the announcement (Facebook-sourced or uploaded)';
