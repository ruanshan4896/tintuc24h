-- QUICK FIX: Disable RLS for RSS tables
-- Run this if you're getting permission errors

-- Disable RLS temporarily (for testing)
ALTER TABLE IF EXISTS rss_feeds DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rss_feed_items DISABLE ROW LEVEL SECURITY;

-- Or recreate tables without RLS
DROP TABLE IF EXISTS rss_feed_items CASCADE;
DROP TABLE IF EXISTS rss_feeds CASCADE;

-- RSS Feeds Table (without RLS)
CREATE TABLE rss_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  last_fetched TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RSS Feed Items (without RLS)
CREATE TABLE rss_feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID REFERENCES rss_feeds(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rss_feeds_active ON rss_feeds(active);
CREATE INDEX idx_rss_feed_items_feed_id ON rss_feed_items(feed_id);
CREATE INDEX idx_rss_feed_items_original_url ON rss_feed_items(original_url);

-- Sample data
INSERT INTO rss_feeds (name, url, category, active) VALUES
  ('VnExpress - Công nghệ', 'https://vnexpress.net/rss/khoa-hoc.rss', 'Công nghệ', true),
  ('VnExpress - Thể thao', 'https://vnexpress.net/rss/the-thao.rss', 'Thể thao', true),
  ('VnExpress - Sức khỏe', 'https://vnexpress.net/rss/suc-khoe.rss', 'Sức khỏe', true),
  ('VnExpress - Ô tô', 'https://vnexpress.net/rss/oto-xe-may.rss', 'Ô tô', true),
  ('VnExpress - Giải trí', 'https://vnexpress.net/rss/giai-tri.rss', 'Giải trí', true)
ON CONFLICT (url) DO NOTHING;

-- Success message
SELECT 'RSS tables created successfully!' as message;

