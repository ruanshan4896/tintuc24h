# 📡 HƯỚNG DẪN SETUP RSS AUTO-IMPORT

## ✨ TÍNH NĂNG

Tự động lấy bài viết từ RSS feeds của các trang tin tức khác và import vào website của bạn.

**Features:**
- ✅ Quản lý nhiều RSS feeds
- ✅ Tự động fetch bài viết mới
- ✅ Convert HTML → Markdown
- ✅ Extract ảnh từ RSS
- ✅ Tránh duplicate bài viết
- ✅ Bài viết import ở chế độ Draft (cần review trước khi publish)
- ✅ Track lịch sử import

---

## 🚀 SETUP

### Bước 1: Tạo Database Tables

1. **Truy cập Supabase Dashboard**
   - Vào project của bạn
   - Click **SQL Editor**

2. **Chạy SQL Script**
   - Copy toàn bộ nội dung file `supabase/rss-feeds.sql`
   - Paste vào SQL Editor
   - Click **Run**

3. **Kiểm tra**
   - Vào **Table Editor**
   - Sẽ thấy 2 tables mới:
     - `rss_feeds` - Lưu các RSS sources
     - `rss_feed_items` - Track items đã import

### Bước 2: Deploy Code

```bash
git add .
git commit -m "feat: Add RSS auto-import functionality"
git push origin main
```

Vercel sẽ tự động deploy.

---

## 📖 SỬ DỤNG

### 1. Truy cập Admin Panel

```
https://your-domain.vercel.app/admin/rss
```

### 2. Thêm RSS Feed

**Click "Thêm RSS Feed":**
- **Tên Feed:** VD: "VnExpress - Công nghệ"
- **URL RSS:** `https://vnexpress.net/rss/khoa-hoc.rss`
- **Chuyên mục:** Chọn category phù hợp
- **Active:** ✅ Bật để kích hoạt

**Click "Thêm Feed"**

### 3. Fetch Bài Viết

**Click nút "Fetch" (icon RefreshCw) bên cạnh feed:**
- Hệ thống sẽ:
  1. Fetch RSS feed
  2. Parse nội dung
  3. Convert HTML → Markdown
  4. Extract ảnh
  5. Tạo bài viết mới (Draft)
  6. Track để tránh duplicate

**Kết quả:**
```
✅ Import thành công!
Feed: VnExpress - Công nghệ
Tổng số items: 20
Bài viết mới: 10
Đã bỏ qua: 10 (đã import trước đó)
```

### 4. Review & Publish

1. **Vào "Quản lý bài viết"**
2. **Filter "Bản nháp"** để xem bài vừa import
3. **Click "Sửa"** để review và edit
4. **Bật "Xuất bản"** khi sẵn sàng
5. **Lưu**

---

## 🌐 NGUỒN RSS PHỔ BIẾN

### VnExpress
```
Công nghệ: https://vnexpress.net/rss/khoa-hoc.rss
Thể thao:  https://vnexpress.net/rss/the-thao.rss
Sức khỏe:  https://vnexpress.net/rss/suc-khoe.rss
Ô tô:      https://vnexpress.net/rss/oto-xe-may.rss
Giải trí:  https://vnexpress.net/rss/giai-tri.rss
```

### Thanh Niên
```
Công nghệ: https://thanhnien.vn/rss/cong-nghe.rss
Thể thao:  https://thanhnien.vn/rss/the-thao.rss
Sức khỏe:  https://thanhnien.vn/rss/suc-khoe.rss
Giải trí:  https://thanhnien.vn/rss/giai-tri.rss
```

### Tuổi Trẻ
```
Công nghệ: https://tuoitre.vn/rss/cong-nghe.rss
Thể thao:  https://tuoitre.vn/rss/the-thao.rss
```

### Zing News
```
Công nghệ: https://zingnews.vn/rss/cong-nghe.rss
Thể thao:  https://zingnews.vn/rss/the-thao.rss
```

**Lưu ý:** Kiểm tra URL RSS của từng trang vì có thể thay đổi.

---

## ⚙️ CONFIGURATION

### Giới hạn Items

**File:** `app/api/admin/rss/fetch/route.ts`

```typescript
// Line ~95
for (const item of rssFeed.items.slice(0, 10)) { // <-- Thay đổi số 10
```

**Default:** 10 items mỗi lần fetch  
**Recommended:** 5-20 items

### Auto-Publish (Tùy chọn)

Nếu muốn tự động publish bài viết (không cần review):

**File:** `app/api/admin/rss/fetch/route.ts`

```typescript
// Line ~123
published: true, // <-- Thay false thành true
```

⚠️ **Cảnh báo:** Nên giữ `false` để review trước khi publish!

---

## 🤖 TỰ ĐỘNG HÓA (CRON)

### Setup Vercel Cron Job

1. **Tạo file `vercel.json`** (nếu chưa có):

```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-rss",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Schedule:** Chạy mỗi 6 giờ

2. **Tạo API route** `app/api/cron/fetch-rss/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all active feeds
    const { data: feeds } = await supabaseAdmin
      .from('rss_feeds')
      .select('*')
      .eq('active', true);

    if (!feeds || feeds.length === 0) {
      return NextResponse.json({ message: 'No active feeds' });
    }

    const results = [];

    // Fetch each feed
    for (const feed of feeds) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/rss/fetch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedId: feed.id }),
        });

        const result = await res.json();
        results.push({ feedName: feed.name, result });
      } catch (error) {
        results.push({ feedName: feed.name, error: error.message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch RSS feeds', details: error.message },
      { status: 500 }
    );
  }
}
```

3. **Thêm environment variable** `CRON_SECRET` trong Vercel

4. **Deploy**

**Kết quả:** Hệ thống tự động fetch RSS mỗi 6 giờ!

---

## 🐛 TROUBLESHOOTING

### 1. "Failed to fetch RSS"

**Nguyên nhân:**
- URL RSS không hợp lệ
- Server RSS không phản hồi
- Timeout (> 10s)

**Giải pháp:**
- Kiểm tra URL trong trình duyệt
- Thử URL khác
- Tăng timeout trong `rss-parser` config

### 2. "RSS feed URL already exists"

**Nguyên nhân:**
- Feed đã được thêm trước đó

**Giải pháp:**
- Xóa feed cũ hoặc dùng URL khác

### 3. Bài viết bị trùng

**Nguyên nhân:**
- System track bằng `original_url`
- Nếu RSS không có URL duy nhất

**Giải pháp:**
- Hệ thống đã tự động xử lý
- Nếu vẫn trùng, check table `rss_feed_items`

### 4. Ảnh không hiển thị

**Nguyên nhân:**
- RSS không có ảnh
- Ảnh bị block CORS

**Giải pháp:**
- Edit bài viết và thêm ảnh thủ công
- Hoặc upload ảnh lên Supabase Storage

### 5. Content format xấu

**Nguyên nhân:**
- HTML → Markdown conversion không hoàn hảo

**Giải pháp:**
- Review và edit trong Admin Panel
- Điều chỉnh `turndownService` config

---

## 📊 THEO DÕI

### Xem Logs

**Vercel Dashboard:**
- Functions → Logs
- Filter: `/api/admin/rss/fetch`

**Supabase Dashboard:**
- Table `rss_feed_items` → Xem lịch sử import
- Table `articles` → Filter by `author` (tên feed)

---

## ⚖️ LƯU Ý BẢN QUYỀN

⚠️ **QUAN TRỌNG:**

Khi sử dụng RSS feeds từ các trang tin tức:

1. **Tôn trọng bản quyền**
   - Chỉ lấy excerpt/summary
   - Luôn link về nguồn gốc
   - Không repost toàn bộ nội dung

2. **Follow RSS Terms of Service**
   - Đọc điều khoản sử dụng RSS của từng trang
   - Không fetch quá thường xuyên (spam)

3. **Attribution**
   - Luôn ghi rõ nguồn
   - Có thể thêm "Nguồn: [Tên trang]" vào cuối bài

4. **Best Practice**
   - Dùng RSS cho aggregation, không phải copy
   - Thêm giá trị (analysis, commentary, translation)
   - Respect robots.txt và rate limits

---

## 🎯 TIPS & TRICKS

### 1. Custom Author Name

Edit field `author` khi import để phân biệt nguồn:

```typescript
author: `${feed.name} (RSS)`, // VD: "VnExpress - Công nghệ (RSS)"
```

### 2. Custom Tags

Tự động thêm tags based on feed:

```typescript
tags: ['RSS', feed.category], // ['RSS', 'Công nghệ']
```

### 3. Quality Control

**Workflow đề xuất:**
1. Import → Draft
2. AI review content
3. Manual review & edit
4. Publish

### 4. Performance

**Nếu có nhiều feeds:**
- Fetch tuần tự (tránh overload)
- Thêm delay giữa các requests
- Monitor Vercel function execution time

---

## 🚀 NÂNG CAO

### Features có thể thêm:

- [ ] AI summarize content
- [ ] Auto-translate to Vietnamese
- [ ] Image optimization/upload to Supabase
- [ ] Duplicate detection by content similarity
- [ ] Webhook notifications khi có bài mới
- [ ] RSS feed preview trước khi add
- [ ] Batch operations (fetch all feeds)
- [ ] Statistics dashboard

---

**🎉 Chúc bạn thành công với RSS auto-import!**

**📧 Support:** Tạo GitHub issue nếu gặp vấn đề.

