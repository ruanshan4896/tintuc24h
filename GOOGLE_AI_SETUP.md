# 🆓 GOOGLE AI STUDIO SETUP - MIỄN PHÍ!

Hướng dẫn setup Google AI Studio (Gemini) để rewrite bài viết **HOÀN TOÀN MIỄN PHÍ**!

---

## 🎯 TẠI SAO CHỌN GOOGLE AI?

### ✅ Ưu điểm:

```
✅ HOÀN TOÀN MIỄN PHÍ
   - Không cần credit card
   - Không giới hạn thời gian
   - Không bị charge bất ngờ

✅ GENEROUS QUOTA
   - 60 requests/phút
   - 1,500 requests/ngày
   - 1.5M tokens/ngày

✅ CHẤT LƯỢNG TốT
   - Gemini 1.5 Flash: Nhanh, chất lượng cao
   - Tiếng Việt xuất sắc
   - Hiểu ngữ cảnh tốt

✅ DỄ SETUP
   - 2 phút là xong
   - Không cần verify payment
   - Chỉ cần Google account
```

### 💰 So sánh với OpenAI:

| Feature | Google AI (Gemini) | OpenAI (GPT-4) |
|---------|-------------------|----------------|
| **Giá** | 🆓 **FREE** | 💰 $0.002/bài |
| **Credit Card** | ❌ Không cần | ✅ **Bắt buộc** |
| **Quota** | 1,500 bài/ngày | Unlimited (paid) |
| **Setup** | 2 phút | 10 phút |
| **Best cho** | ✅ **Testing, SMB** | Production scale |
| **Tiếng Việt** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**KẾT LUẬN:** Google AI là lựa chọn HOÀN HẢO cho testing và small-medium websites!

---

## 🚀 SETUP TRONG 2 PHÚT

### BƯỚC 1: Lấy API Key

#### 1. Truy cập Google AI Studio:

```
https://aistudio.google.com/app/apikey
```

#### 2. Login với Google Account:

- Dùng tài khoản Google bất kỳ
- Không cần verify payment
- Không cần đăng ký gì thêm

#### 3. Tạo API Key:

```
Click nút "Create API key"
→ Chọn "Create API key in new project" (hoặc existing project)
→ Copy API key (AIza...)
→ LƯU LẠI NGAY!
```

**API Key format:**
```
AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**⚠️ Lưu ý:**
- API key hiển thị ngay, có thể xem lại sau
- Không cần activate hay wait approval
- Dùng được ngay lập tức!

---

### BƯỚC 2: Thêm vào Environment Variables

#### Local Development:

**Tạo/Sửa file `.env.local`:**

```bash
# Google AI Studio API Key (FREE!)
GOOGLE_AI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Lưu file và restart server:**

```bash
# Stop server (Ctrl+C nếu đang chạy)
npm run dev
```

#### Production (Vercel):

```
1. Vào Vercel Dashboard:
   https://vercel.com/dashboard

2. Chọn project → Settings → Environment Variables

3. Thêm biến:
   Name: GOOGLE_AI_API_KEY
   Value: AIzaSy...
   Environment: Production, Preview, Development

4. Click "Save"

5. Redeploy:
   Deployments → ... → Redeploy
```

---

### BƯỚC 3: Test ngay!

#### 1. Start Dev Server:

```bash
npm run dev
```

#### 2. Vào Admin RSS:

```
http://localhost:3000/admin/rss
```

#### 3. Enable AI Rewrite:

```
✅ Bật checkbox "Viết lại nội dung bằng AI"
✅ Chọn "Google AI (Gemini)" (mặc định)
✅ [Optional] Bật "Lấy toàn bộ nội dung bài viết"
```

#### 4. Fetch một RSS feed:

```
Click "Fetch" → Đợi 10-60s
```

#### 5. Check Console:

**Kết quả mong đợi:**

```bash
🤖 AI Rewriting: [Title]...
✅ Google AI Rewrite success: {
  originalLength: 2500,
  rewrittenLength: 2800,
  estimatedTokens: 1325,
  cost: 'FREE'
}
✅ Created article: [Title]
```

#### 6. Review Content:

```
Vào /admin → Tab "Bản nháp" → Click "Sửa"
→ Check nội dung đã được rewrite!
```

---

## 📊 QUOTA & LIMITS

### Free Tier (Đủ cho hầu hết use cases):

```
✅ 60 requests per minute (RPM)
   → 1 request/giây
   → Đủ cho RSS import

✅ 1,500 requests per day (RPD)
   → ~60 requests/giờ
   → Có thể import 1,500 bài/ngày!

✅ 1.5 Million tokens per day
   → ~750 bài dài/ngày
   → Rất generous!
```

### Thực tế:

**Small Website (< 100 bài/ngày):**
```
✅ Hoàn toàn đủ
✅ Không cần lo quota
```

**Medium Website (100-500 bài/ngày):**
```
✅ Vẫn OK
⚠️ Monitor quota nếu peak traffic
```

**Large Website (> 500 bài/ngày):**
```
⚠️ Có thể hit limit
💡 Consider multiple API keys hoặc OpenAI
```

---

## 🔧 CONFIGURATION

### Chọn Model:

**File:** `app/api/admin/ai-rewrite/route.ts`

```typescript
const model = googleAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash', // ← Thay đổi ở đây
  // ...
});
```

**Available Models:**

| Model | Speed | Quality | Best For |
|-------|-------|---------|----------|
| `gemini-1.5-flash` | ⚡⚡⚡ | ⭐⭐⭐⭐ | ✅ **News, Articles** |
| `gemini-1.5-pro` | ⚡⚡ | ⭐⭐⭐⭐⭐ | Long-form, Complex |
| `gemini-1.0-pro` | ⚡⚡⚡ | ⭐⭐⭐ | Simple tasks |

**Khuyến nghị:** `gemini-1.5-flash` (default) - Fast, high quality, perfect cho tin tức!

### Tuỳ chỉnh Temperature:

```typescript
generationConfig: {
  temperature: 0.8, // ← Thay đổi (0.0 - 1.0)
  maxOutputTokens: 4000,
}
```

**Temperature Guide:**
- `0.0 - 0.3`: Conservative, ít sáng tạo
- `0.4 - 0.7`: Balanced ✅
- `0.8 - 1.0`: Creative, nhiều variation

---

## 🐛 TROUBLESHOOTING

### Lỗi 1: "No AI API key configured"

**Nguyên nhân:** Chưa set `GOOGLE_AI_API_KEY`

**Fix:**
1. Check `.env.local` có biến `GOOGLE_AI_API_KEY`?
2. API key format đúng? (AIza...)
3. Restart dev server (`npm run dev`)

### Lỗi 2: "API key not valid"

**Nguyên nhân:** 
- API key sai format
- Project bị disable
- Region restrictions

**Fix:**
1. Tạo API key mới từ https://aistudio.google.com/app/apikey
2. Copy lại chính xác (không có spaces)
3. Check project status

### Lỗi 3: "Quota exceeded" / "Too many requests"

**Nguyên nhân:** Vượt quota (60 RPM hoặc 1,500 RPD)

**Fix:**

**Option 1: Đợi reset**
```
RPM reset: Mỗi phút
RPD reset: 00:00 UTC mỗi ngày
```

**Option 2: Giảm số lượng request**
```
- Import ít bài hơn mỗi lần
- Tắt AI rewrite cho một số feeds
```

**Option 3: Tạo thêm API keys**
```
- Tạo API key mới (project khác)
- Rotate giữa các keys
```

**Option 4: Upgrade (nếu cần)**
```
https://ai.google.dev/pricing
→ Pay-as-you-go: $0.000125/1K tokens
→ Rẻ hơn OpenAI!
```

### Lỗi 4: Content bị block (Safety filters)

**Nguyên nhân:** Google safety filters chặn nội dung nhạy cảm

**Fix:**

**File:** `app/api/admin/ai-rewrite/route.ts`

```typescript
const model = googleAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.8,
    maxOutputTokens: 4000,
  },
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_NONE', // ← Adjust nếu cần
    },
    // ... thêm categories khác
  ],
});
```

**⚠️ Cẩn thận:** Chỉ adjust nếu content hợp lệ bị block nhầm.

### Lỗi 5: Response quá chậm

**Nguyên nhân:** 
- Model `gemini-1.5-pro` chậm hơn
- Content quá dài

**Fix:**
1. Dùng `gemini-1.5-flash` (nhanh hơn)
2. Giảm `maxOutputTokens`
3. Check network connection

---

## 💡 BEST PRACTICES

### 1. Monitor Usage:

**Google AI Studio Dashboard:**
```
https://aistudio.google.com/app/apikey
→ Click vào API key
→ Xem usage stats
```

**Track:**
- Requests per day
- Success rate
- Errors

### 2. Optimize Workflow:

```
✅ Bật AI Rewrite chỉ khi cần (tin quan trọng)
✅ Combine với Web Scraping (full content → better rewrite)
✅ Batch import (10-20 bài/lần, không spam)
✅ Review trước khi publish
```

### 3. Fallback Strategy:

**Nếu Google AI fail:**
```typescript
// Code đã tự động fallback sang OpenAI (nếu có)
// Hoặc dùng original content
```

### 4. Security:

```
❌ KHÔNG commit .env.local vào Git
❌ KHÔNG share API key
✅ Restrict API key (optional):
   → Google Cloud Console
   → API Restrictions
   → Chỉ allow Generative Language API
```

---

## 🎨 CUSTOMIZATION

### Thêm Custom Prompts cho Category:

**File:** `app/api/admin/ai-rewrite/route.ts`

```typescript
// Thêm vào prompt
const categoryHints = {
  'Công nghệ': 'Sử dụng nhiều thuật ngữ kỹ thuật, chuyên sâu.',
  'Thể thao': 'Viết sôi động, nhiều cảm xúc.',
  'Sức khỏe': 'Viết khoa học, có căn cứ.',
  // ...
};

const prompt = `...
${categoryHints[category] || ''}
...`;
```

### Thêm Multi-language:

```typescript
const { content, title, tone, language = 'vi' } = await request.json();

const languageInstructions = {
  vi: 'Viết bằng tiếng Việt',
  en: 'Write in English',
  // ...
};
```

---

## 📈 SCALING

### Nếu cần > 1,500 bài/ngày:

#### Option 1: Multiple API Keys (FREE)

```
1. Tạo 3-5 Google projects
2. Mỗi project = 1 API key
3. Rotate keys trong code
4. Total: 4,500-7,500 bài/ngày (FREE!)
```

#### Option 2: Pay-as-you-go (Rẻ)

```
Pricing: $0.000125/1K input tokens
         $0.000375/1K output tokens

1 bài (~2500 tokens):
→ Cost: ~$0.001 (25 đồng!)

1000 bài = $1 (rẻ hơn OpenAI!)
```

#### Option 3: Hybrid (Google + OpenAI)

```
- Google AI: 1,500 bài đầu/ngày (FREE)
- OpenAI: Phần còn lại (paid)
- Best of both worlds!
```

---

## 🆚 GOOGLE AI vs OPENAI

### Khi nào dùng Google AI?

```
✅ Testing, development
✅ Small-medium websites (< 1,500 bài/ngày)
✅ Budget tight
✅ Không có credit card
✅ Tiếng Việt
```

### Khi nào dùng OpenAI?

```
✅ Large scale (> 1,500 bài/ngày)
✅ Mission-critical content
✅ Cần customize model nhiều
✅ Multi-language phức tạp
```

### Có thể dùng cả 2!

```
✅ Google AI: Primary (FREE)
✅ OpenAI: Fallback/Overflow
✅ Code đã support cả 2!
```

---

## 🎉 CHECKLIST

**Setup Google AI Studio:**

- [ ] 1. Truy cập https://aistudio.google.com/app/apikey
- [ ] 2. Login Google account
- [ ] 3. Create API key
- [ ] 4. Copy API key (AIza...)
- [ ] 5. Thêm vào `.env.local`: `GOOGLE_AI_API_KEY=...`
- [ ] 6. Restart dev server
- [ ] 7. Vào `/admin/rss`
- [ ] 8. Bật "Viết lại nội dung bằng AI"
- [ ] 9. Chọn "Google AI (Gemini)"
- [ ] 10. Click "Fetch" một feed
- [ ] 11. Đợi 10-30s
- [ ] 12. Check console logs
- [ ] 13. Review content trong `/admin`
- [ ] 14. Publish nếu OK!
- [ ] 15. Monitor usage sau 1-2 ngày

---

## 🚀 DEPLOY LÊN PRODUCTION

**Sau khi test local thành công:**

### 1. Add API Key vào Vercel:

```
Vercel Dashboard → Settings → Environment Variables
→ Name: GOOGLE_AI_API_KEY
→ Value: AIza...
→ Environment: All
→ Save
```

### 2. Commit & Push:

```bash
git add .
git commit -m "feat: Add Google AI (Gemini) for FREE AI rewrite"
git push origin main
```

### 3. Test Production:

```
https://your-domain.vercel.app/admin/rss
→ Test với 1-2 bài
→ Confirm hoạt động
```

---

## 📚 TÀI LIỆU THAM KHẢO

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Pricing](https://ai.google.dev/pricing)
- [Quota Limits](https://ai.google.dev/gemini-api/docs/quota)

---

## 💰 CHI PHÍ THỰC TẾ

### Free Tier (Recommended):

```
✅ 0đ/tháng
✅ 1,500 bài/ngày
✅ Đủ cho 99% websites
```

### Nếu upgrade Pay-as-you-go:

```
1,000 bài/ngày = ~$1/ngày = ~$30/tháng
10,000 bài/tháng = ~$10/tháng

Vẫn RẺ HƠN OPENAI nhiều!
```

---

## 🎯 KẾT LUẬN

**Google AI Studio là lựa chọn HOÀN HẢO cho:**

```
✅ Testing tính năng AI Rewrite
✅ Small-medium news websites
✅ Không muốn trả phí
✅ Không có credit card
✅ Nội dung tiếng Việt
✅ Học tập, nghiên cứu
```

**Setup trong 2 phút, dùng ngay, MIỄN PHÍ mãi mãi!** 🎉

---

**Happy FREE AI Rewriting! 🤖✨**

_Nếu có vấn đề, check Troubleshooting hoặc hỏi AI Assistant!_

