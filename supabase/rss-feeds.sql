-- RSS Feeds Table
CREATE TABLE IF NOT EXISTS rss_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  last_fetched TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RSS Feed Items (để track đã import chưa)
CREATE TABLE IF NOT EXISTS rss_feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID REFERENCES rss_feeds(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rss_feeds_active ON rss_feeds(active);
CREATE INDEX IF NOT EXISTS idx_rss_feed_items_feed_id ON rss_feed_items(feed_id);
CREATE INDEX IF NOT EXISTS idx_rss_feed_items_original_url ON rss_feed_items(original_url);

-- RLS Policies
ALTER TABLE rss_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_feed_items ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow read access to rss_feeds" ON rss_feeds
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to rss_feed_items" ON rss_feed_items
  FOR SELECT USING (true);

-- Allow all operations for service role (bypasses RLS)
-- These are only for documentation, service_role bypasses RLS by default
CREATE POLICY "Allow all for service role on rss_feeds" ON rss_feeds
  FOR ALL USING (true);

CREATE POLICY "Allow all for service role on rss_feed_items" ON rss_feed_items
  FOR ALL USING (true);

-- Sample RSS Feeds (Vietnamese news sources)
INSERT INTO rss_feeds (name, url, category, active) VALUES
  ('VnExpress - Công nghệ', 'https://vnexpress.net/rss/khoa-hoc.rss', 'Công nghệ', true),
  ('VnExpress - Thể thao', 'https://vnexpress.net/rss/the-thao.rss', 'Thể thao', true),
  ('VnExpress - Sức khỏe', 'https://vnexpress.net/rss/suc-khoe.rss', 'Sức khỏe', true),
  ('VnExpress - Ô tô', 'https://vnexpress.net/rss/oto-xe-may.rss', 'Ô tô', true),
  ('VnExpress - Giải trí', 'https://vnexpress.net/rss/giai-tri.rss', 'Giải trí', true)
ON CONFLICT (url) DO NOTHING;

-- Comments
COMMENT ON TABLE rss_feeds IS 'RSS feed sources for auto-importing articles';
COMMENT ON TABLE rss_feed_items IS 'Track which RSS items have been imported';

