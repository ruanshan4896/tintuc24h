# CLOUDFLARE SETUP - TĂNG PAGESPEED MIỄN PHÍ

## ⚠️ **QUAN TRỌNG: YÊU CẦU CUSTOM DOMAIN**

**Vercel subdomain (`.vercel.app`) KHÔNG THỂ dùng Cloudflare CDN!**

**Lý do:**
- Bạn không sở hữu domain `vercel.app`
- Không thể thay đổi nameservers
- Cloudflare chỉ hoạt động với custom domain

**GIẢI PHÁP:**
- **Option 1:** Mua custom domain ($10-15/năm) → Dùng Cloudflare (khuyến nghị)
- **Option 2:** Tối ưu code (đã làm) → PageSpeed 88-90 điểm

---

## 🎯 Mục tiêu (với custom domain)
- **PageSpeed Mobile:** 85 → **95+**
- **LCP:** 2.5s → **1.2s**
- **FCP:** 1.8s → **0.6s**

---

## 📋 BƯỚC 1: MUA CUSTOM DOMAIN

**Khuyến nghị:**
- **Cloudflare Registrar:** Rẻ nhất, tích hợp sẵn
- **Namecheap:** Dễ dùng, giá tốt
- **GoDaddy:** Phổ biến

**Giá tham khảo:**
- `.com`: $10-15/năm
- `.xyz`: $5/năm
- `.vn`: $15-20/năm

**Ví dụ domain:** `tintuc24h.com`, `tintuc24h.xyz`

---

## 📋 BƯỚC 2: TẠO TÀI KHOẢN CLOUDFLARE

1. Truy cập: https://dash.cloudflare.com/sign-up
2. Đăng ký với email (MIỄN PHÍ)
3. Add site: `tintuc24h.com` (custom domain của bạn)

---

## 📋 BƯỚC 3: UPDATE NAMESERVERS

**Tại nhà đăng ký domain (Namecheap, GoDaddy...):**

1. Đăng nhập vào tài khoản domain
2. Vào **Domain Management** → **Nameservers**
3. Chọn **Custom DNS**
4. Nhập nameservers từ Cloudflare:
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```
5. **Save** và chờ 24h để propagate

---

## 📋 BƯỚC 4: CONNECT VERCEL VỚI CUSTOM DOMAIN

1. **Vào Vercel Dashboard:**
   - Chọn project `tintuc24h`
   - Vào **Settings** → **Domains**

2. **Add domain:**
   ```
   tintuc24h.com
   www.tintuc24h.com
   ```

3. **Vercel sẽ cung cấp DNS records:**
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

4. **Add records vào Cloudflare:**
   - Vào Cloudflare → DNS → Add Record
   - Copy từng record từ Vercel
   - **QUAN TRỌNG:** Bật "Proxy" (cloud màu cam) cho mỗi record

---

## 📋 BƯỚC 5: BẬT OPTIMIZATION TRÊN CLOUDFLARE

### Speed → Optimization

```
✅ Auto Minify
   - JavaScript: ON
   - CSS: ON
   - HTML: ON

✅ Brotli: ON

✅ Early Hints: ON

✅ Rocket Loader: OFF (conflict với Next.js)

✅ Mirage: ON (auto image optimization)
```

### Caching → Configuration

```
✅ Browser Cache TTL: 4 hours

✅ Caching Level: Standard

✅ Always Online: ON
```

### Speed → Optimization → Image Resizing

```
✅ Polish: Lossless (hoặc Lossy nếu cần)

✅ WebP: ON

✅ Mirage: ON
```

---

## 📋 BƯỚC 6: PAGE RULES (MIỄN PHÍ 3 RULES)

**Rule 1: Cache Everything**
```
URL: *tintuc24h.com/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 2 hours
  - Browser Cache TTL: 4 hours
```

**Rule 2: Image Optimization**
```
URL: *tintuc24h.com/_next/image*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Polish: Lossless
```

**Rule 3: Static Assets**
```
URL: *tintuc24h.com/_next/static/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 year
  - Browser Cache TTL: 1 year
```

*Thay `tintuc24h.com` bằng custom domain của bạn*

---

## 📋 BƯỚC 7: CLOUDFLARE WORKERS (OPTIONAL - NÂNG CAO)

**Tạo worker để optimize thêm:**

```javascript
// worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const response = await fetch(request)
  
  // Clone response để modify headers
  const newResponse = new Response(response.body, response)
  
  // Add performance headers
  newResponse.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800')
  newResponse.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Preload critical resources
  newResponse.headers.append('Link', '<https://i1-vnexpress.vnecdn.net>; rel=preconnect; crossorigin')
  
  return newResponse
}
```

---

## 🎯 KẾT QUẢ DỰ KIẾN

| Metric | Trước | Sau Cloudflare |
|--------|-------|----------------|
| **Mobile Score** | 85 | **92-95** |
| **LCP** | 2.5s | **1.2-1.5s** |
| **FCP** | 1.8s | **0.6-0.8s** |
| **TTI** | 3.5s | **2.0s** |

---

## ⚠️ LƯU Ý

1. **Development mode:** Tắt khi test PageSpeed
2. **Purge cache:** Sau mỗi deploy
3. **SSL/TLS:** Chế độ "Full (strict)"

