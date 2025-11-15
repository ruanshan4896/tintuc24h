export interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  image_url?: string;
  category: string;
  tags: string[];
  main_keyword?: string; // Primary keyword for autolink feature
  author: string;
  published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface CreateArticleInput {
  title: string;
  slug: string;
  description: string;
  content: string;
  image_url?: string;
  category: string;
  tags: string[];
  main_keyword?: string; // Primary keyword for autolink feature
  author: string;
  published: boolean;
}

export interface UpdateArticleInput extends Partial<CreateArticleInput> {
  id: string;
}

