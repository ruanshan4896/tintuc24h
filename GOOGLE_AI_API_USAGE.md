# Phân tích sử dụng Google AI API

## Số lần gọi API cho mỗi bài viết

Khi import một bài viết mới (qua RSS hoặc URL Import), hệ thống sẽ gọi Google AI API như sau:

### 1. AI Rewrite (Tùy chọn)
- **Khi nào**: Khi bật tùy chọn "AI Rewrite" trong RSS Import hoặc URL Import
- **Số lần**: **1 lần** cho mỗi bài viết
- **Mục đích**: Viết lại nội dung bài viết, tạo SEO title, description, tags, và main_keyword
- **File**: `app/api/admin/ai-rewrite/route.ts`
- **Model**: `gemini-2.0-flash-lite`
- **Chi phí**: Miễn phí (có quota giới hạn)

### 2. Image Caption Generation (Tùy chọn)
- **Khi nào**: Khi bài viết có hình ảnh và hệ thống cần tạo caption/alt text
- **Số lần**: **1 lần** cho mỗi bài viết (chỉ cho 1 hình ảnh chính)
- **Mục đích**: Tạo caption và alt text cho hình ảnh chính của bài viết
- **File**: `app/api/admin/rss/fetch/route.ts` (line 820) và `app/api/admin/import-url/route.ts` (line 476)
- **Model**: `gemini-2.0-flash-lite`
- **Chi phí**: Miễn phí (có quota giới hạn)

## Tổng kết

### Trường hợp 1: Import với AI Rewrite + có hình ảnh
- **Tổng số lần gọi**: **2 lần** cho mỗi bài viết
  1. 1 lần cho AI Rewrite
  2. 1 lần cho Image Caption

### Trường hợp 2: Import với AI Rewrite + không có hình ảnh
- **Tổng số lần gọi**: **1 lần** cho mỗi bài viết
  1. 1 lần cho AI Rewrite

### Trường hợp 3: Import không bật AI Rewrite + có hình ảnh
- **Tổng số lần gọi**: **1 lần** cho mỗi bài viết
  1. 1 lần cho Image Caption

### Trường hợp 4: Import không bật AI Rewrite + không có hình ảnh
- **Tổng số lần gọi**: **0 lần** cho mỗi bài viết

## Tối ưu hóa

### Đã triển khai:
1. **Multiple API Keys**: Hệ thống hỗ trợ nhiều Google AI keys (`GOOGLE_AI_API_KEY_1`, `GOOGLE_AI_API_KEY_2`, ...) để tự động rotate khi một key hết quota
2. **Auto-retry**: Tự động thử key tiếp theo nếu key hiện tại hết quota (429 error)
3. **Key Exhaustion Tracking**: Theo dõi các key đã hết quota tạm thời để tránh gọi lại ngay lập tức
4. **Error Handling**: Xử lý lỗi gracefully, không làm crash toàn bộ quá trình import

### Có thể cải thiện:
1. **Batch Processing**: Nếu import nhiều bài viết, có thể batch các request để giảm overhead
2. **Caching**: Cache kết quả AI Rewrite cho các bài viết tương tự (nếu có)
3. **Rate Limiting**: Thêm rate limiting để tránh vượt quota quá nhanh
4. **Skip Image Caption**: Có thể bỏ qua image caption generation nếu không cần thiết để tiết kiệm API calls

## Quota Google AI

- **Free Tier**: Có quota giới hạn (thường là 15 requests/phút)
- **Giải pháp**: Sử dụng nhiều API keys để tăng quota tổng
- **Monitoring**: Theo dõi logs để biết khi nào cần thêm keys mới

## Kết luận

Hệ thống hiện tại **không lãng phí** API calls. Mỗi bài viết chỉ gọi tối đa 2 lần (1 cho rewrite, 1 cho image caption), và chỉ khi cần thiết. Việc sử dụng multiple keys giúp tối ưu quota và tránh bị giới hạn.

