-- Add main_keyword column to articles table for autolink feature
-- This column stores the primary keyword that this article is about
-- Other articles mentioning this keyword will automatically link to this article

ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS main_keyword TEXT;

-- Create index for faster keyword lookups
CREATE INDEX IF NOT EXISTS idx_articles_main_keyword ON articles(main_keyword) WHERE main_keyword IS NOT NULL;

-- Add comment
COMMENT ON COLUMN articles.main_keyword IS 'Primary keyword for this article. Used for autolink feature - other articles mentioning this keyword will link to this article.';

