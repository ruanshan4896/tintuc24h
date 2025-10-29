# 🤖 AI REWRITE SETUP GUIDE

Hướng dẫn tích hợp AI để viết lại bài viết tự động sau khi scrape từ RSS feeds.

---

## 🎯 MỤC ĐÍCH

**Tại sao cần AI Rewrite?**

✅ **Tránh Duplicate Content**: Google phạt nội dung trùng lặp  
✅ **Better SEO**: Nội dung unique → Ranking tốt hơn  
✅ **Tuân thủ Bản quyền**: Không copy nguyên văn  
✅ **Tăng Chất lượng**: AI viết mượt mà, dễ đọc hơn  
✅ **Tiết kiệm Thời gian**: Tự động thay vì viết tay  

**Chi phí:**
- ~$0.001 - $0.005 mỗi bài (rất rẻ!)
- 1000 bài = ~$2-5
- Sử dụng GPT-4o-mini (nhanh, rẻ, chất lượng tốt)

---

## 📦 YÊU CẦU

✅ Node.js 18+  
✅ Next.js 14+  
✅ OpenAI API Key  

---

## 🚀 SETUP LOCAL

### BƯỚC 1: Lấy OpenAI API Key

#### 1.1. Tạo tài khoản OpenAI

Truy cập: https://platform.openai.com/

- Click **Sign Up** (hoặc Login nếu đã có tài khoản)
- Verify email

#### 1.2. Thêm tiền vào tài khoản

```
Dashboard → Billing → Add Payment Method
→ Add $5-10 (đủ dùng cho hàng nghìn bài)
```

**Lưu ý:** OpenAI yêu cầu có credit card để dùng API.

#### 1.3. Tạo API Key

```
Dashboard → API Keys → Create New Secret Key
→ Copy key (sk-proj-...)
→ LƯU LẠI NGAY (chỉ hiện 1 lần!)
```

### BƯỚC 2: Thêm Environment Variable

#### Local Development:

Mở file `.env.local` (tạo mới nếu chưa có):

```bash
# OpenAI API Key
OPENAI_API_KEY=sk-proj-YOUR_API_KEY_HERE
```

**⚠️ QUAN TRỌNG:**
- KHÔNG commit `.env.local` vào Git
- `.env.local` đã có trong `.gitignore`

#### Production (Vercel):

```
1. Vào Vercel Dashboard:
   https://vercel.com/dashboard

2. Chọn project → Settings → Environment Variables

3. Thêm biến:
   Name: OPENAI_API_KEY
   Value: sk-proj-YOUR_API_KEY_HERE
   Environment: Production, Preview, Development

4. Click "Save"

5. Redeploy:
   Deployments → ... → Redeploy
```

### BƯỚC 3: Restart Dev Server

```bash
# Stop server (Ctrl+C)
# Start lại
npm run dev
```

---

## 🧪 TEST THỰC TẾ

### Test 1: Check API Connection

**Vào:**
```
http://localhost:3000/admin/rss
```

**Làm:**
1. ✅ Bật checkbox **"Viết lại nội dung bằng AI"**
2. ✅ Click **"Fetch"** một RSS feed
3. ✅ Đợi (có thể 30-60s nếu bật cả scraping)
4. ✅ Check console log để xem progress

**Kết quả mong đợi:**
```
🤖 AI Rewriting: [Title]...
✅ AI Rewrite success (1234 tokens, $0.0012)
✅ Imported 5 articles (3 new, 2 skipped)
```

### Test 2: So sánh Nội dung

**Vào:**
```
http://localhost:3000/admin
```

**Làm:**
1. Tìm bài vừa import (status: Bản nháp)
2. Click "Sửa"
3. So sánh với bài gốc

**Check:**
- ✅ Nội dung khác hoàn toàn (không copy nguyên văn)
- ✅ Thông tin chính vẫn giữ nguyên
- ✅ Văn phong tự nhiên, dễ đọc
- ✅ Format Markdown đúng (## heading, **bold**, etc.)

### Test 3: Check Plagiarism (Optional)

**Dùng công cụ:**
- https://www.copyscape.com/
- https://plagiarismdetector.net/

**Copy 1-2 đoạn văn, paste vào tool:**
- ✅ Nên có < 10% trùng lặp
- ✅ Không có câu nào copy 100%

---

## ⚙️ CONFIGURATION

### Tuỳ chỉnh AI Behavior

**File:** `app/api/admin/ai-rewrite/route.ts`

#### 1. Thay đổi Model:

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini', // ← Thay đổi ở đây
  // ...
});
```

**Options:**
- `gpt-4o-mini`: Rẻ nhất, nhanh, chất lượng tốt ✅ (Recommend)
- `gpt-4o`: Đắt hơn, chất lượng cao hơn
- `gpt-3.5-turbo`: Rẻ hơn, chất lượng thấp hơn

#### 2. Thay đổi Temperature:

```typescript
temperature: 0.8, // ← Thay đổi ở đây (0.0 - 1.0)
```

**Giải thích:**
- `0.0 - 0.3`: Conservative, ít sáng tạo
- `0.4 - 0.7`: Balanced ✅
- `0.8 - 1.0`: Creative, nhiều variation

#### 3. Thay đổi Tone:

**File:** `app/admin/rss/page.tsx`

Trong `handleFetchFeed`:

```typescript
body: JSON.stringify({
  title,
  content,
  tone: 'professional', // ← Thay đổi ở đây
}),
```

**Options:**
- `professional`: Chuyên nghiệp, khách quan ✅
- `casual`: Thân thiện, gần gũi
- `formal`: Trang trọng, học thuật
- `engaging`: Hấp dẫn, nhiều câu hỏi

---

## 💰 CHI PHÍ & USAGE

### Pricing (GPT-4o-mini)

```
Input:  $0.15 / 1M tokens
Output: $0.60 / 1M tokens

Ước tính mỗi bài:
- Input: ~1000 tokens (bài gốc)
- Output: ~1500 tokens (bài viết lại)
- Total: ~2500 tokens
- Cost: ~$0.002 (0.04 cent VN = 50 đồng!)

1000 bài = ~$2-5
```

### Monitor Usage

**OpenAI Dashboard:**
```
https://platform.openai.com/usage
```

**Check:**
- Total tokens used
- Total cost
- Usage by day

**Set Limits:**
```
Dashboard → Billing → Usage Limits
→ Set monthly limit (e.g., $10)
```

---

## 🔧 WORKFLOW KHUYẾN NGHỊ

### Option 1: Full Auto (Scraping + AI)

```
✅ Web Scraping: ON
✅ AI Rewrite: ON

→ Kết quả: Nội dung đầy đủ, 100% unique
→ Thời gian: ~45-60s/bài
→ Chi phí: ~$0.005/bài
→ Best cho: SEO, Chất lượng cao
```

### Option 2: AI Only (No Scraping)

```
❌ Web Scraping: OFF
✅ AI Rewrite: ON

→ Kết quả: Nội dung ngắn (excerpt), unique
→ Thời gian: ~10-30s/bài
→ Chi phí: ~$0.001/bài
→ Best cho: Nhanh, chi phí thấp
```

### Option 3: Scraping Only (No AI)

```
✅ Web Scraping: ON
❌ AI Rewrite: OFF

→ Kết quả: Nội dung đầy đủ, nhưng duplicate
→ Thời gian: ~15-30s/bài
→ Chi phí: $0
→ Best cho: Internal use, không publish
```

---

## 🐛 TROUBLESHOOTING

### Lỗi 1: "OpenAI API key not configured"

**Nguyên nhân:** Chưa set `OPENAI_API_KEY`

**Fix:**
1. Check `.env.local` có biến `OPENAI_API_KEY`?
2. Restart dev server (`npm run dev`)
3. Nếu Vercel: Add env var → Redeploy

### Lỗi 2: "OpenAI quota exceeded"

**Nguyên nhân:** Hết credit hoặc vượt limit

**Fix:**
1. Vào https://platform.openai.com/billing
2. Add thêm tiền
3. Hoặc tăng usage limit

### Lỗi 3: "AI generated content is too short"

**Nguyên nhân:** 
- Bài gốc quá ngắn (< 200 chars)
- API error

**Fix:**
- Chỉ enable AI Rewrite khi có Web Scraping (để có nội dung đủ dài)
- Check API logs trong Vercel

### Lỗi 4: Nội dung AI không đủ unique

**Nguyên nhân:** Temperature quá thấp

**Fix:**
- Tăng `temperature` lên 0.8-0.9
- Thay đổi prompt để yêu cầu "viết lại hoàn toàn"

### Lỗi 5: AI tạo nội dung không chính xác

**Nguyên nhân:** Input content kém chất lượng

**Fix:**
- Enable Web Scraping để có content tốt hơn
- Review bài trước khi publish
- Tuỳ chỉnh prompt trong `app/api/admin/ai-rewrite/route.ts`

---

## 🔒 BẢO MẬT

### ⚠️ QUAN TRỌNG:

1. **KHÔNG commit API key vào Git:**
   - `.env.local` đã trong `.gitignore`
   - Check trước khi commit: `git status`

2. **KHÔNG share API key:**
   - Mỗi người dùng key riêng
   - Rotate key nếu bị lộ

3. **Set Usage Limits:**
   - Prevent unexpected charges
   - Monitor usage hàng tuần

4. **Use Environment Variables:**
   - KHÔNG hardcode key trong code
   - Luôn dùng `process.env.OPENAI_API_KEY`

---

## 📊 METRICS & MONITORING

### Track Success Rate

**Trong Vercel Function Logs:**

```
✅ Success: "AI Rewrite success"
❌ Failed: "AI Rewrite failed"
⚠️ Skipped: "using original content"
```

**Monitor:**
- Success rate (nên > 95%)
- Average tokens per request
- Average cost per article
- Response time

### Best Practices:

1. **Review trước khi publish:**
   - AI có thể tạo nội dung không chính xác
   - Luôn check facts

2. **Test thường xuyên:**
   - 1-2 lần/tuần
   - Check quality

3. **Monitor costs:**
   - Set alerts khi vượt budget
   - Review usage hàng tháng

4. **Backup original:**
   - Keep original content in `rss_feed_items` table
   - Có thể rollback nếu cần

---

## 🎨 CUSTOMIZATION

### Thêm Tone Options trong UI

**File:** `app/admin/rss/page.tsx`

```typescript
const [tone, setTone] = useState<'professional' | 'casual' | 'formal' | 'engaging'>('professional');

// In UI:
<select value={tone} onChange={(e) => setTone(e.target.value)}>
  <option value="professional">Chuyên nghiệp</option>
  <option value="casual">Thân thiện</option>
  <option value="formal">Trang trọng</option>
  <option value="engaging">Hấp dẫn</option>
</select>
```

### Custom Prompt cho từng Category

**File:** `app/api/admin/ai-rewrite/route.ts`

```typescript
const categoryPrompts = {
  'Công nghệ': 'Viết với nhiều thuật ngữ kỹ thuật, chuyên sâu...',
  'Thể thao': 'Viết sôi động, nhiều cảm xúc, dùng thuật ngữ thể thao...',
  'Sức khỏe': 'Viết khoa học, có căn cứ, dễ hiểu...',
  // ...
};
```

---

## 🚀 NEXT STEPS

### Sau khi setup thành công:

1. ✅ Test với 5-10 bài
2. ✅ Review quality
3. ✅ Adjust prompts nếu cần
4. ✅ Monitor costs
5. ✅ Enable cho production
6. ✅ Setup monitoring & alerts

### Nâng cao:

- [ ] Thêm batch rewrite cho existing articles
- [ ] A/B testing different prompts
- [ ] Auto-generate tags từ nội dung
- [ ] SEO optimization suggestions
- [ ] Multi-language support

---

## 📚 TÀI LIỆU THAM KHẢO

- [OpenAI API Docs](https://platform.openai.com/docs)
- [GPT-4o-mini Pricing](https://openai.com/pricing)
- [Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)

---

**Happy AI Rewriting! 🤖✨**

_Nếu có vấn đề, check Troubleshooting hoặc hỏi AI Assistant!_

