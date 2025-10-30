# CLOUDFLARE SETUP - TĂNG PAGESPEED MIỄN PHÍ

## 🎯 Mục tiêu
- **PageSpeed Mobile:** 85 → **95+**
- **LCP:** 2.5s → **1.5s**
- **FCP:** 1.8s → **0.8s**

---

## 📋 BƯỚC 1: TẠO TÀI KHOẢN CLOUDFLARE

1. Truy cập: https://dash.cloudflare.com/sign-up
2. Đăng ký với email (MIỄN PHÍ)
3. Add site: `tintuc24h-seven.vercel.app` (hoặc custom domain)

---

## 📋 BƯỚC 2: CẤU HÌNH DNS

**Nếu dùng custom domain:**

1. Vào Cloudflare Dashboard → DNS
2. Add các DNS records từ domain provider
3. Update nameservers về Cloudflare

**Nếu dùng Vercel domain:**

Vercel đã có CDN, nhưng bạn có thể:
- Dùng Cloudflare Workers (miễn phí 100k requests/day)
- Hoặc chuyển sang custom domain để dùng Cloudflare CDN

---

## 📋 BƯỚC 3: BẬT OPTIMIZATION

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

## 📋 BƯỚC 4: PAGE RULES (MIỄN PHÍ 3 RULES)

**Rule 1: Cache Everything**
```
URL: *tintuc24h-seven.vercel.app/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 2 hours
  - Browser Cache TTL: 4 hours
```

**Rule 2: Image Optimization**
```
URL: *tintuc24h-seven.vercel.app/_next/image*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Polish: Lossless
```

**Rule 3: Static Assets**
```
URL: *tintuc24h-seven.vercel.app/_next/static/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 year
  - Browser Cache TTL: 1 year
```

---

## 📋 BƯỚC 5: CLOUDFLARE WORKERS (OPTIONAL)

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

