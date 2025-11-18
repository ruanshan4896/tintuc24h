# 🔧 Fix Ảnh Không Load trên Vercel

## 🔍 Nguyên nhân

### 1. **Next.js Image Optimization Conflicts**
- Vercel có giới hạn image optimization (1,000 images/month free)
- AVIF format chưa được support đầy đủ trên Vercel
- Optimization có thể làm chậm hoặc fail

### 2. **Hostname Pattern Issues**
- `*.supabase.co` có thể không match chính xác
- Cần thêm exact hostname

### 3. **AVIF Already Optimized**
- Ảnh đã được optimize khi upload (AVIF 80% quality)
- Không cần Next.js optimize thêm

## ✅ Giải pháp Đã Áp dụng

### 1. **Disable Next.js Image Optimization**
```typescript
// next.config.ts
unoptimized: true  // Không optimize, dùng ảnh gốc
```

**Lý do:**
- AVIF đã được optimize khi upload
- Tránh Vercel limits
- Load nhanh hơn (không qua optimization pipeline)

### 2. **Update Hostname Patterns**
```typescript
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'pzakjiqhksdwugvfosvl.supabase.co', // Exact project
  },
  {
    protocol: 'https',
    hostname: '*.supabase.co', // Wildcard
  },
]
```

### 3. **Always Unoptimized in Component**
```typescript
// components/OptimizedImage.tsx
<Image
  src={imgSrc}
  alt={alt}
  unoptimized // Always true
/>
```

## 🚀 Deploy & Test

### 1. Commit Changes
```bash
git add .
git commit -m "fix: disable image optimization for Vercel"
git push
```

### 2. Verify on Vercel
```bash
# Mở site Vercel
https://your-site.vercel.app

# Check console for errors
# Mở DevTools → Console
# Mở DevTools → Network → Filter: Img
```

### 3. Test Specific Images
```bash
# Test Supabase image
https://pzakjiqhksdwugvfosvl.supabase.co/storage/v1/object/public/articles/featured/test-image-upload-1763455184569.avif

# Should return: 200 OK
# Content-Type: image/avif
```

## 🔍 Debug Checklist

### Nếu vẫn không load:

#### 1. Check Browser Console
```javascript
// Mở DevTools → Console
// Tìm errors:
// - "Failed to load resource"
// - "CORS error"
// - "CSP violation"
```

#### 2. Check Network Tab
```
DevTools → Network → Filter: Img
- Status: Should be 200
- Type: Should be "avif" or "image"
- Size: Should show file size
```

#### 3. Check Image URL
```javascript
// Right-click image → "Copy image address"
// Paste in new tab
// Should load directly
```

#### 4. Check Vercel Logs
```bash
# Mở Vercel Dashboard
# Project → Deployments → Latest → Logs
# Tìm image-related errors
```

## 🛠️ Alternative Solutions

### Option 1: Use WebP Instead of AVIF
```typescript
// lib/utils/image-upload.ts
await uploadImageToSupabase(
  imageUrl,
  slug,
  'featured',
  { format: 'webp', quality: 85 } // WebP has better support
);
```

### Option 2: Use Vercel Image Optimization
```typescript
// next.config.ts
unoptimized: false,
formats: ['image/webp'], // Only WebP, not AVIF
```

### Option 3: Use Cloudinary
```typescript
// Upload to Cloudinary instead of Supabase
// Better CDN, auto-format detection
```

## 📊 Performance Comparison

| Solution | Load Time | Support | Cost |
|----------|-----------|---------|------|
| **AVIF Unoptimized** | ⚡⚡⚡⚡ | ⭐⭐⭐ | Free |
| WebP Unoptimized | ⚡⚡⚡⚡ | ⭐⭐⭐⭐⭐ | Free |
| Next.js Optimized | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | Limited |
| Cloudinary | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐⭐ | Paid |

## ✅ Expected Result

**Trước (Lỗi):**
- ❌ Ảnh không load
- ❌ Console errors
- ❌ Placeholder hiển thị

**Sau (Fixed):**
- ✅ Ảnh load nhanh
- ✅ Không có errors
- ✅ AVIF format
- ✅ CDN caching

## 🎯 Verification Steps

1. **Deploy to Vercel**
   ```bash
   git push
   ```

2. **Wait for deployment** (~2-3 minutes)

3. **Open site** and check:
   - Homepage images load ✅
   - Article images load ✅
   - No console errors ✅

4. **Check Network tab:**
   - All images: 200 OK ✅
   - Content-Type: image/avif ✅
   - From: Supabase CDN ✅

## 📝 Notes

- **AVIF support:** ~90% browsers (Chrome, Edge, Firefox, Safari 16+)
- **Fallback:** Component auto-fallbacks to `/og-image.jpg`
- **CDN:** Supabase uses Cloudflare CDN (fast globally)
- **Cache:** Images cached for 1 year (max-age=31536000)

---

**Nếu vẫn lỗi sau khi deploy, hãy:**
1. Check browser console
2. Check Network tab
3. Test image URL trực tiếp
4. Share error message để debug tiếp
