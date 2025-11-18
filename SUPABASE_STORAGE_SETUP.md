# 🚀 Hướng dẫn Setup Supabase Storage

## ✅ Đã hoàn thành

- [x] Cài đặt `sharp` package
- [x] Tạo upload utility (`lib/utils/image-upload.ts`)
- [x] Cập nhật import flow (auto upload khi import bài viết)
- [x] Tạo OptimizedImage component mới
- [x] Cập nhật Next.js config
- [x] Tạo migration scripts

## 📋 Các bước tiếp theo

### 1. Setup Supabase Storage Bucket

Mở Supabase SQL Editor và chạy:

```bash
# Mở: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
```

Copy và chạy nội dung file: `supabase/setup-storage.sql`

Hoặc chạy trực tiếp:

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'articles',
  'articles',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create policies (xem file setup-storage.sql)
```

### 2. Test Upload

Chạy script test để kiểm tra upload:

```bash
npx tsx scripts/test-upload.ts
```

Nếu thành công, bạn sẽ thấy:
```
✅ Upload successful!
Public URL: https://xxx.supabase.co/storage/v1/object/public/articles/featured/test-image-upload-xxx.avif
```

### 3. Migrate Existing Images

#### A. Migrate Featured Images (ảnh đại diện)

Preview (Dry Run):
```bash
npx tsx scripts/migrate-images.ts --dry-run
```

Migrate 10 bài đầu tiên:
```bash
npx tsx scripts/migrate-images.ts --limit=10
```

Migrate tất cả:
```bash
npx tsx scripts/migrate-images.ts
```

Force re-upload (nếu cần):
```bash
npx tsx scripts/migrate-images.ts --force
```

#### B. Migrate Content Images (ảnh trong bài viết)

Preview (Dry Run):
```bash
npx tsx scripts/migrate-content-images.ts --dry-run
```

Migrate 10 bài đầu tiên:
```bash
npx tsx scripts/migrate-content-images.ts --limit=10
```

Migrate tất cả:
```bash
npx tsx scripts/migrate-content-images.ts
```

### 4. Test Import Bài Viết Mới

1. Mở admin panel: `http://localhost:3000/admin`
2. Import một bài viết từ URL
3. Kiểm tra ảnh có được upload lên Supabase không

### 5. Verify

Kiểm tra Supabase Storage Dashboard:
```
https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets/articles
```

Bạn sẽ thấy cấu trúc:
```
articles/
├── featured/
│   ├── article-slug-1-timestamp.avif
│   ├── article-slug-2-timestamp.avif
│   └── ...
├── content/
└── thumbnail/
```

## 🎯 Kết quả

### Trước:
- ❌ Ảnh từ nhiều nguồn khác nhau
- ❌ CORS errors, 401/403 errors
- ❌ Không kiểm soát
- ❌ Load chậm

### Sau:
- ✅ Tất cả ảnh từ Supabase CDN
- ✅ Format AVIF (70% nhỏ hơn JPEG)
- ✅ Kiểm soát hoàn toàn
- ✅ Load nhanh, reliable

## 📊 Storage Usage

### Ước tính:
- 1 ảnh AVIF (1200x630): ~50-100KB
- 1GB = ~10,000-20,000 ảnh
- Free tier: 1GB (đủ cho hàng nghìn bài viết)

### Monitor:
```
https://supabase.com/dashboard/project/YOUR_PROJECT/settings/billing
```

## 🔧 Troubleshooting

### Lỗi: "Bucket not found"
→ Chạy lại `supabase/setup-storage.sql`

### Lỗi: "Permission denied"
→ Kiểm tra policies trong Supabase Dashboard

### Lỗi: "Sharp installation failed"
→ Chạy: `npm install --platform=win32 --arch=x64 sharp`

### Ảnh không load
→ Kiểm tra Next.js config có `unoptimized: false`

## 🚀 Next Steps (Optional)

### 1. Xóa Image Proxy (không cần nữa)
```bash
# Xóa file: app/api/image-proxy/route.ts
```

### 2. Cleanup Old Code
- Xóa `needsProxy()` function
- Xóa `getProxyUrl()` function
- Simplify OptimizedImage component

### 3. Add Image Transformation
Supabase hỗ trợ transform on-the-fly:
```typescript
const url = supabase.storage
  .from('articles')
  .getPublicUrl('featured/image.avif', {
    transform: {
      width: 800,
      height: 400,
      resize: 'cover',
      quality: 80,
    }
  });
```

### 4. Add Thumbnail Generation
Tự động tạo thumbnail khi upload:
```typescript
// In image-upload.ts
const thumbnail = await sharp(buffer)
  .resize(400, 225)
  .avif({ quality: 70 })
  .toBuffer();

await supabase.storage
  .from('articles')
  .upload(`thumbnail/${slug}.avif`, thumbnail);
```

## 📚 Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Sharp Docs](https://sharp.pixelplumbing.com/)
- [AVIF Format](https://avif.io/)

---

**Hoàn thành! 🎉**

Giờ tất cả ảnh sẽ được lưu trên Supabase Storage với format AVIF tối ưu.
