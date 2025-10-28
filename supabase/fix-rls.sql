-- FIX Row Level Security để xem được bài viết

-- Xóa tất cả policies cũ
DROP POLICY IF EXISTS "Allow public read access to published articles" ON articles;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON articles;
DROP POLICY IF EXISTS "Allow all operations for everyone" ON articles;

-- Tạo policy mới: CHO PHÉP MỌI NGƯỜI ĐỌC BÀI VIẾT PUBLISHED
CREATE POLICY "Enable read access for published articles"
  ON articles
  FOR SELECT
  USING (published = true);

-- Cho phép mọi người thêm/sửa/xóa (để test, production nên dùng auth)
CREATE POLICY "Enable insert for all users"
  ON articles
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all users"
  ON articles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
  ON articles
  FOR DELETE
  USING (true);

-- Hoặc nếu muốn đơn giản hơn, DISABLE RLS hoàn toàn (chỉ cho development)
-- ALTER TABLE articles DISABLE ROW LEVEL SECURITY;

