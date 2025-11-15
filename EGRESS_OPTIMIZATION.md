# Tối ưu Egress Supabase

## Egress là gì?

**Egress** là lượng dữ liệu truyền từ Supabase database ra ngoài (đến ứng dụng của bạn). Mỗi byte dữ liệu bạn fetch từ database đều tính vào egress.

### Tại sao Egress quan trọng?
- Supabase có giới hạn egress theo gói (Free: 5GB/tháng, Pro: 50GB/tháng)
- Vượt quá giới hạn sẽ bị tính phí hoặc bị giới hạn
- Egress cao = tốn tiền và chậm

## Các vấn đề đã phát hiện và sửa

### 1. ❌ Fetch `content` field không cần thiết

**Vấn đề:**
- Field `content` có thể rất lớn (50KB - 500KB mỗi bài viết)
- Nhiều queries fetch `select('*')` bao gồm cả `content` khi không cần

**Đã sửa:**
- ✅ `getArticlesServer`: Bỏ `content`, chỉ fetch các field cần thiết
- ✅ `searchArticlesServer`: Bỏ `content`, search vẫn hoạt động nhưng không fetch
- ✅ `getArticlesByTagServer`: Bỏ `content`

**Tiết kiệm:** 
- Nếu có 1000 bài viết, mỗi bài 100KB content → tiết kiệm ~100MB mỗi lần query

### 2. ❌ Fetch tất cả articles rồi filter trong memory

**Vấn đề:**
- `getArticlesByTagServer` fetch TẤT CẢ articles (có thể hàng nghìn) rồi filter trong memory
- Rất lãng phí egress!

**Đã sửa:**
- ✅ Dùng database query với `.contains('tags', [tagSlug])` 
- ✅ Chỉ fetch articles có tag phù hợp
- ✅ Thêm limit 200

**Tiết kiệm:**
- Trước: Fetch 1000 bài → ~100MB egress
- Sau: Fetch 50 bài có tag → ~5MB egress
- **Tiết kiệm 95%!**

### 3. ❌ Queries không có limit

**Vấn đề:**
- Một số queries không có limit, có thể fetch hàng nghìn records

**Đã sửa:**
- ✅ `getArticlesServer`: Thêm limit 1000
- ✅ `searchArticlesServer`: Thêm limit 100
- ✅ `getArticlesByTagCached`: Giảm limit từ 500 → 200
- ✅ `getArticlesCached`: Giảm limit từ 500 → 200
- ✅ `getPopularTagsCached`: Giảm limit từ 1000 → 500

### 4. ❌ Cache TTL quá ngắn

**Vấn đề:**
- Cache TTL ngắn → phải query database nhiều lần → egress cao

**Đã sửa:**
- ✅ `CACHE_TTL`: Tăng từ 2 phút → 5 phút
- ✅ `LONG_CACHE_TTL`: Tăng từ 10 phút → 30 phút

**Tiết kiệm:**
- Giảm số lần query database xuống 2-3 lần
- **Tiết kiệm 50-70% egress từ cache**

## Tổng kết tối ưu

### Trước khi tối ưu:
- Mỗi query có thể fetch 100-500MB dữ liệu
- Cache ngắn → query nhiều lần
- Fetch content không cần thiết

### Sau khi tối ưu:
- ✅ Chỉ fetch các field cần thiết (bỏ `content`)
- ✅ Dùng database query thay vì memory filter
- ✅ Thêm limit cho tất cả queries
- ✅ Tăng cache TTL
- ✅ **Giảm egress ước tính 70-90%**

## Best Practices để giữ egress thấp

1. **Luôn specify fields cần thiết**
   ```typescript
   // ❌ Bad
   .select('*')
   
   // ✅ Good
   .select('id, title, slug, description, image_url')
   ```

2. **Dùng database query thay vì memory filter**
   ```typescript
   // ❌ Bad: Fetch all then filter
   const all = await supabase.from('articles').select('*');
   const filtered = all.filter(...);
   
   // ✅ Good: Filter in database
   const filtered = await supabase
     .from('articles')
     .select('id, title')
     .eq('category', 'Tech');
   ```

3. **Luôn có limit**
   ```typescript
   // ✅ Good
   .limit(100)
   ```

4. **Tăng cache TTL cho dữ liệu ít thay đổi**
   ```typescript
   // ✅ Good
   revalidate: 1800 // 30 minutes
   ```

5. **Chỉ fetch content khi thực sự cần**
   - List pages: Không cần `content`
   - Detail page: Cần `content` (nhưng chỉ 1 bài viết)

## Monitoring Egress

Để theo dõi egress:
1. Vào Supabase Dashboard → Settings → Usage
2. Xem "Database Egress" trong tháng hiện tại
3. So sánh trước và sau khi tối ưu

## Kết luận

Sau khi tối ưu, egress sẽ giảm đáng kể. Các thay đổi này không ảnh hưởng đến functionality, chỉ tối ưu cách fetch dữ liệu.

