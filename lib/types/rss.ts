export interface RssFeed {
  id: string;
  name: string;
  url: string;
  category: string;
  active: boolean;
  last_fetched: string | null;
  created_at: string;
  updated_at: string;
}

export interface RssFeedItem {
  id: string;
  feed_id: string;
  article_id: string;
  original_url: string;
  created_at: string;
}

export interface CreateRssFeedInput {
  name: string;
  url: string;
  category: string;
  active?: boolean;
}

export interface UpdateRssFeedInput {
  name?: string;
  url?: string;
  category?: string;
  active?: boolean;
}

export interface RssImportResult {
  success: boolean;
  feedName: string;
  totalItems: number;
  newArticles: number;
  skippedItems: number;
  errors: string[];
}

