# 🔑 HƯỚNG DẪN SỬ DỤNG NHIỀU GOOGLE AI API KEYS

## 🎯 MỤC ĐÍCH

**Vấn đề:** Google AI Free Tier = 200 requests/ngày  
**Giải pháp:** Dùng nhiều API keys = Tăng quota gấp nhiều lần!

```
1 key  = 200 requests/ngày
3 keys = 600 requests/ngày ✅
5 keys = 1,000 requests/ngày ✅
10 keys = 2,000 requests/ngày ✅
```

**→ HOÀN TOÀN MIỄN PHÍ!**

---

## 🚀 SETUP

### Bước 1: Tạo Nhiều Google AI Projects

1. **Truy cập:** https://aistudio.google.com/app/apikey

2. **Tạo API Key 1:**
   ```
   → Click "Create API key"
   → Chọn "Create API key in new project"
   → Đặt tên: "News AI Project 1"
   → Copy key: AIzaSy...
   ```

3. **Tạo API Key 2:**
   ```
   → Click "Create API key" lần nữa
   → Chọn "Create API key in new project"
   → Đặt tên: "News AI Project 2"
   → Copy key: AIzaSy...
   ```

4. **Lặp lại** cho Key 3, 4, 5... (tùy nhu cầu)

**Lưu ý:**
- Mỗi Google Account có thể tạo nhiều projects
- Mỗi project = 1 API key = 200 requests/ngày
- Không giới hạn số lượng projects!

---

### Bước 2: Thêm Keys vào Environment Variables

#### **Local Development (`.env.local`):**

```env
# Multiple Google AI API Keys (Rotate để tăng quota)
GOOGLE_AI_API_KEY_1=AIzaSyCGdW...key-1...
GOOGLE_AI_API_KEY_2=AIzaSyBxYz...key-2...
GOOGLE_AI_API_KEY_3=AIzaSyMnOp...key-3...
GOOGLE_AI_API_KEY_4=AIzaSyQrSt...key-4...
GOOGLE_AI_API_KEY_5=AIzaSyUvWx...key-5...
# Thêm nhiều keys tùy ý (_6, _7, _8, ...)

# OpenAI (Optional backup)
OPENAI_API_KEY=sk-proj-...

# Unsplash
UNSPLASH_ACCESS_KEY=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=...
REVALIDATE_SECRET=...
```

**⚠️ QUAN TRỌNG:**
- Đặt tên theo format: `GOOGLE_AI_API_KEY_1`, `GOOGLE_AI_API_KEY_2`, `GOOGLE_AI_API_KEY_3`...
- Số thứ tự phải liên tục (1, 2, 3, 4...) không được bỏ sót!
- Hệ thống sẽ tự động detect tất cả keys

#### **Production (Vercel):**

1. **Vào Vercel Dashboard:**
   ```
   https://vercel.com/dashboard
   → Chọn project
   → Settings → Environment Variables
   ```

2. **Thêm từng key:**
   ```
   Name: GOOGLE_AI_API_KEY_1
   Value: AIzaSy...
   Environment: Production, Preview, Development
   → Save
   
   Name: GOOGLE_AI_API_KEY_2
   Value: AIzaSy...
   Environment: Production, Preview, Development
   → Save
   
   (Lặp lại cho key 3, 4, 5...)
   ```

3. **Redeploy:**
   ```
   Deployments → ... → Redeploy
   ```

---

### Bước 3: Restart Server

```bash
# Stop server (Ctrl+C nếu đang chạy)
npm run dev
```

---

## 🧪 TEST

### 1. Kiểm tra Logs:

Khi fetch RSS, bạn sẽ thấy:

```
🔑 API Keys Status:
  - GOOGLE_AI_API_KEYs: 5 keys available
    • Key 1: AIzaSyCGdW...
    • Key 2: AIzaSyBxYz...
    • Key 3: AIzaSyMnOp...
    • Key 4: AIzaSyQrSt...
    • Key 5: AIzaSyUvWx...
  - OPENAI_API_KEY: NOT SET

🔄 Using Google AI Key #1 of 5
✅ AI Rewrite SUCCESS!
```

### 2. Fetch nhiều bài:

```
Fetch 1: Key #1 → Success
Fetch 2: Key #2 → Success
Fetch 3: Key #3 → Success
Fetch 4: Key #4 → Success
Fetch 5: Key #5 → Success
Fetch 6: Key #1 → Success (quay lại key 1)
...
```

**→ Round-robin rotation tự động!**

---

## 🔄 CÁCH HOẠT ĐỘNG

### Round-Robin + Auto-Retry Algorithm:

```typescript
Request 1  → Key 1 ✅ Success
Request 2  → Key 2 ✅ Success
Request 3  → Key 3 ✅ Success
Request 4  → Key 1 ❌ Quota exceeded
           → Key 2 ✅ Success (auto retry!)
Request 5  → Key 3 ✅ Success
...
```

**Lợi ích:**
- ✅ Phân bổ đều requests giữa các keys
- ✅ **Tự động retry với key khác nếu gặp 429 error**
- ✅ Tránh 1 key bị hết quota nhanh
- ✅ Tối đa hóa số requests/ngày
- ✅ Resilient - chỉ fail khi TẤT CẢ keys hết quota

### Chi Tiết Logic:

**Khi Key #1 hết quota:**
```
1. Try Key #1 → 429 Error
   ⚠️  Key #1 quota exceeded, trying next key...

2. Try Key #2 → Success! ✅
   ✅ SUCCESS with Key #2

3. Update rotation: Next request sẽ bắt đầu từ Key #3
```

**Khi TẤT CẢ keys hết quota:**
```
1. Try Key #1 → 429 Error
2. Try Key #2 → 429 Error
3. Try Key #3 → 429 Error
❌ All keys failed!
💡 TIP: All keys exceeded quota. Wait for reset or add more keys.
```

---

## 📊 QUOTA CALCULATION

### Ví dụ với 3 keys:

```
Key 1: 200 requests/ngày
Key 2: 200 requests/ngày
Key 3: 200 requests/ngày
────────────────────────
Total: 600 requests/ngày
```

**Thực tế:**
```
Fetch 10 bài = 10 requests
→ Key 1: 3-4 requests
→ Key 2: 3-4 requests
→ Key 3: 3-4 requests

Fetch 60 lần (600 bài) = Hết quota
```

### Quota Reset:

```
Mỗi key reset độc lập:
- Reset time: 00:00 UTC = 7:00 AM giờ VN
- Tất cả keys reset cùng lúc
- 600 requests mới/ngày!
```

---

## 💡 BEST PRACTICES

### 1. Số Lượng Keys Khuyến Nghị:

```
Small site (< 100 bài/ngày):
→ 1-2 keys (200-400 requests)

Medium site (100-500 bài/ngày):
→ 3-5 keys (600-1,000 requests)

Large site (> 500 bài/ngày):
→ 5-10 keys (1,000-2,000 requests)
```

### 2. Monitor Usage:

```
Vào: https://aistudio.google.com/app/apikey
→ Xem usage của từng key
→ Check nếu có key nào bị quota exceeded
```

### 3. Backup với OpenAI:

```env
# Thêm OpenAI làm backup
OPENAI_API_KEY=sk-proj-...
```

Nếu **TẤT CẢ** Google keys hết quota → Auto fallback sang OpenAI!

### 4. Tạo Key từ nhiều Google Accounts:

```
Account 1: 3-5 projects = 3-5 keys
Account 2: 3-5 projects = 3-5 keys
Account 3: 3-5 projects = 3-5 keys
───────────────────────────────────
Total: 9-15 keys = 1,800-3,000 requests/ngày!
```

**⚠️ Lưu ý:**
- Dùng account cá nhân (không vi phạm ToS)
- Mỗi account = 1 email riêng
- Tất cả đều FREE!

---

## 🐛 TROUBLESHOOTING

### 1. "No API key configured"

**Nguyên nhân:**
- Keys chưa được set
- Format tên sai

**Fix:**
```env
❌ SAI: GOOGLE_AI_KEY_1
❌ SAI: GOOGLE_API_KEY_1
✅ ĐÚNG: GOOGLE_AI_API_KEY_1

❌ SAI: Bỏ sót số (_1, _3, _5 - thiếu _2, _4)
✅ ĐÚNG: Liên tục (_1, _2, _3, _4, _5)
```

### 2. "Only 1 key detected"

**Nguyên nhân:**
- Chỉ set `GOOGLE_AI_API_KEY` (không có số)
- Hoặc bỏ sót số thứ tự

**Fix:**
```env
❌ GOOGLE_AI_API_KEY=AIza...     (old format)
✅ GOOGLE_AI_API_KEY_1=AIza...   (new format)
✅ GOOGLE_AI_API_KEY_2=AIza...
✅ GOOGLE_AI_API_KEY_3=AIza...
```

### 3. Vẫn hết quota nhanh

**Nguyên nhân:**
- Cả 3-5 keys đều hết quota
- Fetch quá nhiều lần trong ngày

**Fix:**
- Thêm nhiều keys hơn (10-15 keys)
- Hoặc đợi đến 7:00 sáng mai
- Hoặc dùng OpenAI backup

### 4. "Key rotation not working"

**Nguyên nhân:**
- Server không restart sau khi thêm keys

**Fix:**
```bash
# Stop server (Ctrl+C)
npm run dev

# Hoặc trên Vercel: Redeploy
```

---

## 📈 PERFORMANCE

### Với 5 keys:

```
Quota/ngày: 1,000 requests
Cost: FREE
Độ tin cậy: 99.9% (1 key fail → vẫn có 4 keys)
```

### So sánh với OpenAI:

| | **Multiple Google AI** | **OpenAI** |
|---|---|---|
| **Cost** | 🆓 FREE | 💰 $0.002/request |
| **Quota** | 200-2,000/ngày | Unlimited |
| **Setup** | 5 phút | 2 phút |
| **Best for** | Small-Medium sites | Large scale |

**Kết luận:** Multiple Google AI = Best choice cho 99% websites!

---

## 🎯 CHECKLIST

**Setup:**
- [ ] Tạo 3-5 Google AI projects
- [ ] Lấy 3-5 API keys
- [ ] Thêm vào `.env.local` với format `GOOGLE_AI_API_KEY_1`, `_2`, `_3`...
- [ ] Restart server
- [ ] Test fetch RSS
- [ ] Verify logs (xem có rotate keys không)

**Production:**
- [ ] Thêm keys vào Vercel Environment Variables
- [ ] Redeploy
- [ ] Test trên production
- [ ] Monitor usage sau 1 ngày

---

## 🚀 KẾT QUẢ MONG ĐỢI

**Trước:**
```
1 key × 200 requests = 200 bài/ngày
→ Hết quota sau ~20-30 lần fetch
```

**Sau:**
```
5 keys × 200 requests = 1,000 bài/ngày
→ Hết quota sau ~100 lần fetch
→ Đủ cho hầu hết websites!
```

---

**🎉 Chúc bạn thành công!**

**Phiên bản:** 1.0  
**Cập nhật:** 30/10/2025

