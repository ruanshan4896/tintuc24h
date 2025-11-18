-- ============================================
-- STEP BY STEP: Chạy từng câu lệnh một
-- Copy và paste từng STEP vào SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Create Bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('articles', 'articles', true)
ON CONFLICT (id) DO NOTHING;

-- Verify: Should return 1 row
SELECT * FROM storage.buckets WHERE id = 'articles';


-- ============================================
-- STEP 2: Policy - Public Read
-- ============================================
CREATE POLICY "articles_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'articles');


-- ============================================
-- STEP 3: Policy - Authenticated Insert
-- ============================================
CREATE POLICY "articles_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'articles');


-- ============================================
-- STEP 4: Policy - Authenticated Update
-- ============================================
CREATE POLICY "articles_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'articles');


-- ============================================
-- STEP 5: Policy - Authenticated Delete
-- ============================================
CREATE POLICY "articles_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'articles');


-- ============================================
-- VERIFY ALL
-- ============================================
-- Check bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'articles';

-- Check policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE 'articles%';

-- Should see 4 policies:
-- 1. articles_public_read (SELECT, {public})
-- 2. articles_auth_insert (INSERT, {authenticated})
-- 3. articles_auth_update (UPDATE, {authenticated})
-- 4. articles_auth_delete (DELETE, {authenticated})
