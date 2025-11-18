-- ============================================
-- SIMPLE VERSION: Supabase Storage Setup
-- Run this if the main setup-storage.sql fails
-- ============================================

-- Step 1: Create bucket (run this first)
INSERT INTO storage.buckets (id, name, public)
VALUES ('articles', 'articles', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies one by one
-- If you get "policy already exists" error, that's OK - skip to next one

-- Policy 1: Public read
CREATE POLICY "articles_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'articles');

-- Policy 2: Authenticated upload
CREATE POLICY "articles_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'articles');

-- Policy 3: Authenticated update
CREATE POLICY "articles_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'articles');

-- Policy 4: Authenticated delete
CREATE POLICY "articles_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'articles');

-- ============================================
-- Verify Setup
-- ============================================
-- Check bucket:
SELECT * FROM storage.buckets WHERE id = 'articles';

-- Check policies:
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE 'articles%';
