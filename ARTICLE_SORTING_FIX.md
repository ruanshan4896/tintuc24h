# 📅 Sắp xếp Bài viết theo Ngày mới nhất

## ✅ Đã được cấu hình

Code đã được cấu hình đúng để sắp xếp **mới nhất → cũ nhất**:

```typescript
// lib/api/articles-cache.ts
.order('created_at', { ascending: false }) // Newest first
```

## 🔍 Kiểm tra

### 1. Verify trong Database

Chạy script để kiểm tra:

```bash
npx tsx scripts/verify-article-order.ts
```

Script sẽ hiển thị:
- Top 10 bài viết mỗi category
- Ngày tạo của từng bài
- ✅ hoặc ❌ nếu sorted đúng/sai

### 2. Kiểm tra trên Website

```bash
# Local
http://localhost:3000/category/cong-nghe

# Production
https://your-site.vercel.app/category/cong-nghe
```

Bài viết đầu tiên phải là **mới nhất**.

## 🔧 Nếu vẫn sai thứ tự

### Nguyên nhân 1: Cache cũ

**Giải pháp:**

```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

### Nguyên nhân 2: Vercel Cache

**Giải pháp:**

```bash
# Deploy lại
git add .
git commit -m "fix: ensure articles sorted by newest first"
git push

# Hoặc clear cache trong Vercel Dashboard
# Project → Settings → Data Cache → Purge Everything
```

### Nguyên nhân 3: Database có dữ liệu test cũ

**Giải pháp:**

```sql
-- Check trong Supabase SQL Editor
SELECT title, created_at, category
FROM articles
WHERE category = 'Công nghệ' AND published = true
ORDER BY created_at DESC
LIMIT 10;

-- Nếu created_at sai, update:
UPDATE articles
SET created_at = NOW()
WHERE id = 'article-id-here';
```

## 📊 Thứ tự hiện tại

### Homepage:
- ✅ Mỗi category: Mới nhất → Cũ nhất
- ✅ Featured articles: Mới nhất → Cũ nhất

### Category Page:
- ✅ Tất cả bài viết: Mới nhất → Cũ nhất

### Tag Page:
- ✅ Bài viết theo tag: Mới nhất → Cũ nhất

### Search:
- ✅ Kết quả tìm kiếm: Mới nhất → Cũ nhất

## 🎯 Xác nhận

Sau khi clear cache, kiểm tra:

1. **Homepage** → Mỗi category section
   - Bài đầu tiên = mới nhất ✅

2. **Category Page** → `/category/cong-nghe`
   - Bài đầu tiên = mới nhất ✅

3. **Tag Page** → `/tag/nextjs`
   - Bài đầu tiên = mới nhất ✅

4. **Search** → `/search?q=test`
   - Bài đầu tiên = mới nhất ✅

## 💡 Tips

### Để test thứ tự:

1. **Import 2 bài viết mới**
   - Bài 1: Import lúc 10:00
   - Bài 2: Import lúc 10:05
   - Bài 2 phải hiển thị trước Bài 1

2. **Check created_at trong database**
   ```sql
   SELECT title, created_at
   FROM articles
   WHERE category = 'Công nghệ'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

3. **So sánh với website**
   - Thứ tự trên web phải giống database

## 🚀 Deploy

Nếu đã verify local OK:

```bash
git add .
git commit -m "docs: verify article sorting by newest first"
git push
```

---

**Kết luận:** Code đã đúng, chỉ cần clear cache nếu thấy sai thứ tự.
