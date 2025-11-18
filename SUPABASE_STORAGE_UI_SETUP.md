# 🎯 Setup Supabase Storage qua UI (Dễ nhất)

Nếu SQL bị lỗi, hãy setup qua giao diện:

## 1. Tạo Bucket

1. Mở: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets
2. Click **"New bucket"**
3. Điền:
   - **Name**: `articles`
   - **Public bucket**: ✅ Check (bật)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/avif, image/gif`
4. Click **"Create bucket"**

## 2. Setup Policies

### Cách 1: Dùng Template (Khuyến nghị)

1. Vào bucket `articles` vừa tạo
2. Click tab **"Policies"**
3. Click **"New policy"**
4. Chọn template: **"Allow public read access"**
5. Click **"Review"** → **"Save policy"**

### Cách 2: Tạo thủ công

#### Policy 1: Public Read
```
Name: Public read access
Allowed operation: SELECT
Target roles: public
USING expression: bucket_id = 'articles'
```

#### Policy 2: Authenticated Upload
```
Name: Authenticated upload
Allowed operation: INSERT
Target roles: authenticated
WITH CHECK expression: bucket_id = 'articles'
```

#### Policy 3: Authenticated Update
```
Name: Authenticated update
Allowed operation: UPDATE
Target roles: authenticated
USING expression: bucket_id = 'articles'
```

#### Policy 4: Authenticated Delete
```
Name: Authenticated delete
Allowed operation: DELETE
Target roles: authenticated
USING expression: bucket_id = 'articles'
```

## 3. Verify

Sau khi setup xong, kiểm tra:

1. Vào Storage → Buckets
2. Thấy bucket `articles` với icon 🌐 (public)
3. Click vào bucket → tab Policies
4. Thấy 4 policies đã tạo

## 4. Test Upload

Chạy script test:

```bash
npx tsx scripts/test-upload.ts
```

Nếu thành công → Setup hoàn tất! ✅

## 5. Troubleshooting

### Lỗi: "new row violates row-level security policy"
→ Policies chưa đúng, tạo lại policy cho authenticated users

### Lỗi: "Bucket not found"
→ Bucket chưa được tạo, tạo lại bucket

### Lỗi: "Permission denied"
→ Kiểm tra bucket có public = true không

---

**Sau khi setup xong, quay lại chạy:**
```bash
npx tsx scripts/test-upload.ts
```
