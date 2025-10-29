# 🗺️ HƯỚNG DẪN SỬA LỖI SITEMAP

## 📋 MỤC LỤC
1. [Vấn đề thường gặp](#-vấn-đề-thường-gặp)
2. [Cách test sitemap](#-cách-test-sitemap)
3. [Setup trên Vercel](#-setup-trên-vercel)
4. [Force revalidate sitemap](#-force-revalidate-sitemap)
5. [Submit lên Google Search Console](#-submit-lên-google-search-console)
6. [Troubleshooting](#-troubleshooting)

---

## 🐛 VẤN ĐỀ THƯỜNG GẶP

### 1. Sitemap không cập nhật khi thêm bài viết mới
**Nguyên nhân:**
- Sitemap bị cache bởi Next.js ISR
- Không có revalidation sau khi CRUD bài viết

**Giải pháp:**
✅ Đã sửa: Thêm `export const revalidate = 60` trong `app/sitemap.ts`
✅ Đã sửa: Tự động gọi API revalidate sau CRUD

### 2. Google Search Console báo lỗi không load được sitemap
**Nguyên nhân:**
- `NEXT_PUBLIC_SITE_URL` không được set
- Sitemap dùng URL default sai
- RLS block việc fetch articles

**Giải pháp:**
✅ Đã sửa: Dùng `getArticlesServer()` với service role key
✅ Cần làm: Set `NEXT_PUBLIC_SITE_URL` trong Vercel

### 3. Sitemap trả về 404
**Nguyên nhân:**
- File `app/sitemap.ts` có lỗi syntax
- Build failed

**Giải pháp:**
✅ Test local trước khi deploy
✅ Check build logs trong Vercel

---

## 🧪 CÁCH TEST SITEMAP

### Test Local (Development)

**1. Chạy dev server:**
```bash
npm run dev
```

**2. Truy cập sitemap:**
```
http://localhost:3000/sitemap.xml
```

**3. Dùng script test:**
```bash
node scripts/test-sitemap.js
# Hoặc test production:
node scripts/test-sitemap.js https://your-site.vercel.app
```

**4. Check console logs:**
Mở browser console và xem logs:
```
Generating sitemap for: http://localhost:3000
Sitemap: Found X articles
Sitemap: Generated Y total URLs
```

### Test Production (Vercel)

**1. Truy cập URL:**
```
https://your-domain.vercel.app/sitemap.xml
```

**2. Check Vercel logs:**
- Vercel Dashboard → Deployments
- Click vào deployment → **Functions** tab
- Tìm logs của `/sitemap.xml`

**3. Dùng curl:**
```bash
curl https://your-domain.vercel.app/sitemap.xml
```

**4. Check với Google:**
```
https://www.google.com/ping?sitemap=https://your-domain.vercel.app/sitemap.xml
```

---

## ⚙️ SETUP TRÊN VERCEL

### Bước 1: Thêm Environment Variables

Vào **Vercel Dashboard → Settings → Environment Variables** và thêm:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.vercel.app` | Production, Preview, Development |
| `REVALIDATE_SECRET` | (tạo random string) | Production, Preview, Development |

**Tạo REVALIDATE_SECRET:**
```bash
# Mac/Linux
openssl rand -base64 32

# Hoặc dùng online:
# https://randomkeygen.com/
```

### Bước 2: Redeploy

Sau khi thêm environment variables:
1. Vercel Dashboard → **Deployments**
2. Click **...** ở deployment mới nhất
3. Click **Redeploy**
4. **KHÔNG** check "Use existing Build Cache"

### Bước 3: Verify

```bash
# Check sitemap
curl https://your-domain.vercel.app/sitemap.xml

# Check robots.txt
curl https://your-domain.vercel.app/robots.txt
```

---

## 🔄 FORCE REVALIDATE SITEMAP

### Tự động (Đã setup)

Sitemap sẽ tự động revalidate khi:
- ✅ Tạo bài viết mới
- ✅ Cập nhật bài viết
- ✅ Xóa bài viết

### Thủ công (Manual)

**Cách 1: Qua browser**
```
https://your-domain.vercel.app/api/revalidate?secret=YOUR_SECRET
```

**Cách 2: Qua curl**
```bash
curl -X POST https://your-domain.vercel.app/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_SECRET","path":"/sitemap.xml"}'
```

**Cách 3: Qua admin panel (tương lai)**
Có thể thêm nút "Refresh Sitemap" trong admin dashboard.

### Test revalidate

```bash
# Revalidate sitemap
curl -X POST https://your-domain.vercel.app/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_SECRET","path":"/sitemap.xml"}'

# Response:
# {"revalidated":true,"now":1234567890}
```

---

## 📤 SUBMIT LÊN GOOGLE SEARCH CONSOLE

### Bước 1: Add Property

1. Truy cập [Google Search Console](https://search.google.com/search-console)
2. Click **Add Property**
3. Nhập domain: `https://your-domain.vercel.app`
4. Verify ownership (dùng HTML tag hoặc DNS)

### Bước 2: Submit Sitemap

1. Sidebar → **Sitemaps**
2. Nhập URL: `sitemap.xml`
3. Click **Submit**

### Bước 3: Kiểm tra Status

Đợi vài giờ (hoặc vài ngày), Google sẽ hiển thị:
- ✅ **Success**: Sitemap OK
- ❌ **Error**: Có lỗi (xem chi tiết)

### Các lỗi thường gặp từ Google:

#### 1. "Couldn't fetch"
**Nguyên nhân:**
- URL không đúng
- Server down
- Timeout

**Giải pháp:**
```bash
# Test từ Google's perspective
curl -A "Googlebot" https://your-domain.vercel.app/sitemap.xml
```

#### 2. "Sitemap is HTML"
**Nguyên nhân:**
- Next.js trả về HTML thay vì XML
- Có lỗi và render error page

**Giải pháp:**
- Check build logs
- Test local trước
- Xem Vercel function logs

#### 3. "Invalid XML"
**Nguyên nhân:**
- Có ký tự đặc biệt chưa escape
- XML format sai

**Giải pháp:**
- Validate XML: https://www.xmlvalidation.com/
- Check URLs có ký tự đặc biệt

#### 4. "General HTTP error"
**Nguyên nhân:**
- Server trả về 500 error
- Function timeout (Vercel: 10s limit)

**Giải pháp:**
- Optimize query (đã dùng indexes)
- Check Vercel function logs

---

## 🔧 TROUBLESHOOTING

### Sitemap trống (0 URLs)

**Check 1: Có bài viết published không?**
```sql
-- Chạy trong Supabase SQL Editor
SELECT COUNT(*) FROM articles WHERE published = true;
```

**Check 2: RLS có block không?**
```typescript
// Test trong browser console (trang /admin)
const { data, error } = await supabase
  .from('articles')
  .select('*')
  .eq('published', true);
console.log('Articles:', data?.length, 'Error:', error);
```

**Check 3: Service role key đúng chưa?**
- Vercel → Settings → Environment Variables
- Verify `SUPABASE_SERVICE_ROLE_KEY`

### Sitemap có URL sai

**Ví dụ:** URL hiển thị `http://localhost:3000` thay vì domain thật

**Nguyên nhân:**
`NEXT_PUBLIC_SITE_URL` chưa set hoặc sai

**Giải pháp:**
1. Vercel → Settings → Environment Variables
2. Set `NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app`
3. Redeploy

### Sitemap không update sau khi thêm bài viết

**Check 1: Revalidate có chạy không?**
- Mở browser console khi tạo/sửa/xóa bài viết
- Phải thấy log: `Sitemap revalidated`

**Check 2: Force revalidate thủ công**
```bash
curl -X POST https://your-domain.vercel.app/api/revalidate \
  -H "Content-Type: application/json" \
  -d '{"secret":"YOUR_SECRET","path":"/sitemap.xml"}'
```

**Check 3: Clear cache**
- Thêm `?v=timestamp` vào URL
- Ví dụ: `sitemap.xml?v=1234567890`

### "Function execution timeout"

**Nguyên nhân:**
Query quá chậm (nhiều bài viết)

**Giải pháp:**
Sitemap đã optimize với indexes, nhưng nếu vẫn timeout:

```typescript
// Giới hạn số bài viết trong sitemap (nếu cần)
const articles = (await getArticlesServer(true)).slice(0, 5000);
```

---

## 📊 MONITORING

### Check sitemap thường xuyên

**Cron job (optional):**
```bash
# Add to crontab (chạy mỗi giờ)
0 * * * * curl https://your-domain.vercel.app/sitemap.xml > /dev/null
```

**Uptime monitoring:**
- UptimeRobot
- Pingdom
- Monitor URL: `/sitemap.xml`

### Google Search Console

Check thường xuyên:
- **Coverage**: Số trang indexed
- **Sitemaps**: Status của sitemap
- **Performance**: Clicks, impressions

---

## 🎯 CHECKLIST

Trước khi deploy production:

- [ ] `NEXT_PUBLIC_SITE_URL` đã set trong Vercel
- [ ] `REVALIDATE_SECRET` đã tạo và set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` đúng
- [ ] Test sitemap local: `http://localhost:3000/sitemap.xml`
- [ ] Test script: `node scripts/test-sitemap.js`
- [ ] Sitemap có > 0 URLs
- [ ] URLs đúng format
- [ ] Build thành công không lỗi
- [ ] Deploy lên Vercel
- [ ] Test sitemap production
- [ ] Submit lên Google Search Console
- [ ] Verify sitemap status sau 24h

---

## 📚 TÀI LIỆU THAM KHẢO

- **Next.js Sitemap**: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- **Google Sitemap**: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- **Vercel ISR**: https://vercel.com/docs/incremental-static-regeneration
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security

---

## 🆘 VẪN GẶP VẤN ĐỀ?

Nếu vẫn gặp lỗi sau khi thử tất cả các bước trên:

1. **Check Vercel logs:**
   - Deployments → Functions → `/sitemap.xml`
   - Xem error message

2. **Check Supabase logs:**
   - Dashboard → Logs
   - Filter: API requests

3. **Test API trực tiếp:**
   ```bash
   curl https://your-domain.vercel.app/api/admin/articles
   ```

4. **Create GitHub issue** với thông tin:
   - Error message
   - Vercel logs
   - Sitemap output
   - Number of articles

---

**✅ Sitemap đã được sửa và tối ưu!**

Giờ sitemap sẽ:
- ✅ Tự động revalidate mỗi 60 giây
- ✅ Update khi CRUD bài viết
- ✅ Dùng server-side API (bypass RLS)
- ✅ Handle errors gracefully
- ✅ Log đầy đủ để debug

**🎉 Chúc mừng! Sitemap của bạn giờ hoạt động hoàn hảo!**

