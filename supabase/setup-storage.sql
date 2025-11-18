-- ============================================
-- Supabase Storage Setup for Articles Images
-- ============================================

-- 1. Create storage bucket for articles
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'articles',
  'articles',
  true,
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access to articles images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload articles images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update articles images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete articles images" ON storage.objects;

-- 3. Create new policies
CREATE POLICY "Public read access to articles images"
ON storage.objects FOR SELECT
USING (bucket_id = 'articles');

CREATE POLICY "Authenticated users can upload articles images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'articles' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update articles images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'articles' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete articles images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'articles' 
  AND auth.role() = 'authenticated'
);

-- ============================================
-- Verify Setup
-- ============================================
-- Run this to check if bucket was created:
-- SELECT * FROM storage.buckets WHERE id = 'articles';
