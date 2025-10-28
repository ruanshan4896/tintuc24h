-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  author TEXT NOT NULL,
  published BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);

-- Enable Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to published articles
CREATE POLICY "Allow public read access to published articles"
  ON articles
  FOR SELECT
  USING (published = true);

-- Create policy to allow all operations for authenticated users (admin)
CREATE POLICY "Allow all operations for authenticated users"
  ON articles
  FOR ALL
  USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO articles (title, slug, description, content, category, tags, author, published, image_url) VALUES
  (
    'Chào mừng đến với Website Tin tức',
    'chao-mung-den-voi-website-tin-tuc',
    'Bài viết giới thiệu về website tin tức của chúng tôi với đầy đủ tính năng quản lý nội dung và SEO tối ưu.',
    '# Chào mừng bạn đến với Website Tin tức

Đây là một nền tảng tin tức hiện đại được xây dựng với Next.js và Supabase.

## Tính năng nổi bật

- **Quản lý bài viết dễ dàng**: Thêm, sửa, xóa bài viết một cách trực quan
- **SEO tối ưu**: Metadata động, sitemap tự động, Open Graph hỗ trợ
- **Hiệu suất cao**: SSR và ISR từ Next.js 14
- **Database mạnh mẽ**: Supabase PostgreSQL
- **Responsive design**: Giao diện đẹp trên mọi thiết bị

## Công nghệ sử dụng

- Next.js 14 với App Router
- TypeScript
- Tailwind CSS
- Supabase
- React Markdown

Hãy khám phá các bài viết khác trên website của chúng tôi!',
    'Công nghệ',
    ARRAY['Next.js', 'Supabase', 'Web Development'],
    'Admin',
    true,
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop'
  ),
  (
    'Hướng dẫn tối ưu SEO cho Next.js',
    'huong-dan-toi-uu-seo-cho-nextjs',
    'Tìm hiểu cách tối ưu hóa SEO cho ứng dụng Next.js của bạn với metadata động, sitemap và nhiều kỹ thuật khác.',
    '# Hướng dẫn tối ưu SEO cho Next.js

SEO (Search Engine Optimization) là yếu tố quan trọng giúp website của bạn được xếp hạng tốt trên các công cụ tìm kiếm.

## 1. Metadata động

Next.js 14 cung cấp API metadata mạnh mẽ:

```typescript
export const metadata = {
  title: "Tiêu đề trang",
  description: "Mô tả trang",
  openGraph: {
    title: "Tiêu đề OG",
    description: "Mô tả OG",
    images: ["/og-image.jpg"]
  }
}
```

## 2. Sitemap tự động

Tạo file `sitemap.ts` để tự động generate sitemap cho Google.

## 3. Robots.txt

Cấu hình file robots.txt để kiểm soát crawler.

## 4. Structured Data

Sử dụng JSON-LD để cung cấp dữ liệu có cấu trúc cho search engines.

## 5. Performance

Tối ưu hóa hiệu suất với Image Optimization, Code Splitting, và Static Generation.

Hãy áp dụng những kỹ thuật này để website của bạn đạt thứ hạng cao hơn!',
    'SEO',
    ARRAY['SEO', 'Next.js', 'Web Development'],
    'Admin',
    true,
    'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=800&h=400&fit=crop'
  );

