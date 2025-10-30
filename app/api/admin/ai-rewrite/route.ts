import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize OpenAI (optional)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Helper function to get all available Google AI keys
function getGoogleAIKeys(): string[] {
  const keys: string[] = [];
  let i = 1;
  
  // Check for numbered keys (GOOGLE_AI_API_KEY_1, GOOGLE_AI_API_KEY_2, ...)
  while (true) {
    const key = process.env[`GOOGLE_AI_API_KEY_${i}`];
    if (key) {
      keys.push(key);
      i++;
    } else {
      break;
    }
  }
  
  // Fallback to single key if no numbered keys found
  if (keys.length === 0 && process.env.GOOGLE_AI_API_KEY) {
    keys.push(process.env.GOOGLE_AI_API_KEY);
  }
  
  return keys;
}

// Round-robin index for key rotation (stored in memory)
let currentKeyIndex = 0;

// Clean up markdown output from AI (remove code fence wrappers)
function cleanMarkdownOutput(content: string): string {
  let cleaned = content.trim();
  
  // Remove ```markdown wrapper at start and ``` at end
  if (cleaned.startsWith('```markdown')) {
    cleaned = cleaned.replace(/^```markdown\n?/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n?/, '');
  }
  
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\n?```$/, '');
  }
  
  return cleaned.trim();
}

export async function POST(request: NextRequest) {
  try {
    const { content, title, tone = 'professional', provider = 'google', generateMetadata = true } = await request.json();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 AI REWRITE DEBUG START');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!content || !title) {
      console.log('❌ Missing content or title');
      return NextResponse.json(
        { error: 'Content and title are required' },
        { status: 400 }
      );
    }

    // Get all available Google AI keys
    const googleApiKeys = getGoogleAIKeys();
    
    // Check API keys
    console.log('🔑 API Keys Status:');
    console.log(`  - GOOGLE_AI_API_KEYs: ${googleApiKeys.length} keys available`);
    if (googleApiKeys.length > 0) {
      googleApiKeys.forEach((key, index) => {
        console.log(`    • Key ${index + 1}: ${key.substring(0, 10)}...`);
      });
    }
    console.log('  - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');

    // Check if any API key is configured
    if (!process.env.OPENAI_API_KEY && googleApiKeys.length === 0) {
      console.log('❌ NO API KEY CONFIGURED!');
      return NextResponse.json(
        { error: 'No AI API key configured. Please add OPENAI_API_KEY or GOOGLE_AI_API_KEY_1, GOOGLE_AI_API_KEY_2, ... to environment variables.' },
        { status: 500 }
      );
    }

    // Determine which provider to use
    const actualProvider = provider === 'openai' && openai ? 'openai' : 'google';

    console.log('📊 Request Info:');
    console.log('  - Title:', title.substring(0, 50) + '...');
    console.log('  - Content Length:', content.length, 'chars');
    console.log('  - Tone:', tone);
    console.log('  - Requested Provider:', provider);
    console.log('  - Actual Provider:', actualProvider);

    // Prepare prompt based on tone
    const toneInstructions = {
      professional: 'Giọng văn chuyên nghiệp, khách quan, phù hợp cho tin tức.',
      casual: 'Giọng văn thân thiện, gần gũi, dễ hiểu.',
      formal: 'Giọng văn trang trọng, học thuật.',
      engaging: 'Giọng văn hấp dẫn, thu hút, có nhiều câu hỏi và ví dụ.',
    };

      const prompt = `Bạn là một SEO Content Specialist và biên tập viên tin tức chuyên nghiệp.

Nhiệm vụ: Phân tích keyword intent và viết MỘT BÀI BÁO HOÀN TOÀN MỚI để giải quyết intent đó. KHÔNG viết lại từng câu - hãy VIẾT LẠI TOÀN BỘ như bạn đang tự viết một bài báo mới.

## 📊 BƯỚC 1: PHÂN TÍCH KEYWORD & SEARCH INTENT (BẮT BUỘC!)

**Trước khi viết, hãy tự phân tích (KHÔNG xuất ra phần này):**

1. **Keyword Chính:**
   - Từ tiêu đề và nội dung, tìm từ khóa chính mà người dùng sẽ search
   - VD: "cách làm bánh mì", "iphone 15 giá bao nhiêu", "tại sao trẻ khóc đêm"

2. **Search Intent (Ý Định Tìm Kiếm):**
   - **Informational (Thông tin):** Người dùng muốn học hỏi, hiểu biết
     → Cung cấp kiến thức, giải thích, hướng dẫn chi tiết
   - **Commercial Investigation (So sánh):** Người dùng cân nhắc mua/dùng
     → So sánh, review, ưu/nhược điểm, đề xuất
   - **Transactional (Giao dịch):** Người dùng muốn mua/đăng ký ngay
     → Giá cả, khuyến mãi, call-to-action rõ ràng
   - **Navigational (Điều hướng):** Người dùng tìm một trang/thương hiệu cụ thể
     → Thông tin về thương hiệu, sản phẩm, dịch vụ

3. **Viết Content Theo Intent:**
   - **Informational:** Giải thích TẠI SAO + CÁCH NÀO, cung cấp giá trị kiến thức
   - **Commercial:** Phân tích ưu/nhược, so sánh, gợi ý lựa chọn
   - **Transactional:** Nhấn mạnh giá trị, lợi ích, tạo urgency
   - **Navigational:** Tập trung vào thương hiệu/sản phẩm cụ thể

**VÍ DỤ PHÂN TÍCH:**

*Bài gốc: "iPhone 15 ra mắt với chip A17 Pro, camera 48MP, giá từ 799 USD"*

- **Keyword:** "iphone 15", "iphone 15 giá"
- **Intent:** Commercial Investigation (người dùng đang cân nhắc mua)
- **Content Strategy:**
  - Đánh giá chi tiết tính năng mới (chip A17 Pro, camera 48MP)
  - So sánh với iPhone 14 và đối thủ (Samsung, Google)
  - Phân tích giá 799 USD có hợp lý không
  - Gợi ý: nên mua hay đợi giảm giá
  - SEO Title: "iPhone 15 Có Đáng Mua? Đánh Giá Chi Tiết Tính Năng & Giá"
  - SEO Desc: "iPhone 15 chip A17 Pro, camera 48MP giá từ 799 USD. So sánh với iPhone 14, phân tích ưu nhược điểm để quyết định có nên mua ngay."

---

## ⚠️ QUY TẮC ĐẦU RA (OUTPUT RULES) - BẮT BUỘC:

**CRITICAL:** Trả về TRỰC TIẾP markdown content, BẮT ĐẦU NGAY với ## Heading hoặc đoạn văn đầu tiên.

❌ **TUYỆT ĐỐI KHÔNG được thêm:**
- \`\`\`markdown wrapper
- \`\`\` code fence
- Bất kỳ meta text nào như "Đây là bài viết đã viết lại..."
- Tiêu đề bài (title) ở đầu

✅ **Chỉ trả về:**
- Markdown content thuần túy
- Bắt đầu với ## Heading hoặc đoạn văn
- Kết thúc với đoạn cuối cùng (KHÔNG có \`\`\`)

**VÍ DỤ OUTPUT ĐÚNG:**
\`\`\`
## Tiêu Đề Chính: Câu Chuyện Hấp Dẫn

Đoạn mở đầu với câu hook thu hút người đọc...

- **Điểm 1**: Nội dung
- **Điểm 2**: Nội dung

## Tiêu Đề Phụ

Nội dung tiếp theo...
\`\`\`

## YÊU CẦU QUAN TRỌNG NHẤT - VIẾT KHÁC BIỆT 100%:

### 1. VĂN PHONG BÁO CHÍ CHUYÊN NGHIỆP (CRITICAL!)

**TONE & STYLE:**
- ✅ Văn phong **báo chí**, **khách quan**, **đáng tin cậy**
- ✅ Sử dụng **số liệu, thống kê, trích dẫn** từ bài gốc
- ✅ Trích dẫn nguồn: "theo...", "nghiên cứu cho thấy...", "chuyên gia nhận định..."
- ✅ Phân tích sâu, đa chiều, không chỉ tóm tắt bề mặt
- ❌ KHÔNG dùng ngôn ngữ cảm tính, clickbait, cường điệu quá mức

**GIỮ NGUYÊN & NHẤN MẠNH:**
- 🔢 **Số liệu cụ thể** (%, số người, giá trị, thời gian)
- 📊 **Thống kê, nghiên cứu** (tên tác giả, tổ chức, năm)
- 👤 **Trích dẫn chuyên gia** (tên, chức danh, ý kiến)
- 📅 **Thời gian, địa điểm** quan trọng
- 💰 **Giá cả, chi phí** cụ thể

### 2. PARAPHRASE TRIỆT ĐỂ (nhưng giữ thông tin quan trọng!)
❌ **TUYỆT ĐỐI KHÔNG:**
- Copy nguyên văn bất kỳ câu nào từ bài gốc
- Giữ nguyên cấu trúc câu của bài gốc
- Bỏ sót số liệu, thống kê quan trọng

✅ **BẮT BUỘC PHẢI:**
- VIẾT LẠI mỗi câu với cấu trúc HOÀN TOÀN KHÁC
- **GIỮ NGUYÊN** số liệu, tên riêng, trích dẫn chuyên gia
- Thêm phân tích sâu hơn về ý nghĩa của số liệu
- Đặt thông tin vào context rộng hơn
- Giải thích tại sao số liệu này quan trọng

**VÍ DỤ CÁCH PARAPHRASE (GIỮ SỐ LIỆU):**

Bài gốc: "Theo nghiên cứu của WHO năm 2024, ô nhiễm không khí ở Hà Nội đạt chỉ số AQI 215, vượt mức an toàn 2,5 lần."

❌ SAI (mất số liệu): "Không khí Hà Nội rất ô nhiễm."

❌ SAI (giống gốc): "Theo nghiên cứu của WHO năm 2024, tình trạng ô nhiễm không khí tại Hà Nội đã đạt mức AQI 215, vượt ngưỡng an toàn 2,5 lần."

✅ ĐÚNG (giữ số liệu + khác biệt): "Báo cáo mới nhất từ Tổ chức Y tế Thế giới (WHO) công bố vào năm 2024 cho thấy, chất lượng không khí tại thủ đô Hà Nội đã lên đến **215 điểm AQI** - một con số đáng báo động khi cao gấp **2,5 lần** so với ngưỡng an toàn mà tổ chức này khuyến nghị. Điều này đặt ra những lo ngại nghiêm trọng về tác động đến sức khỏe cộng đồng, đặc biệt là trẻ em và người cao tuổi."

### 2. THAY ĐỔI CẤU TRÚC & THỨ TỰ
- Đảo ngược thứ tự các đoạn (kết luận → nguyên nhân → giải pháp)
- Bắt đầu với hook khác hẳn (câu hỏi, thống kê, case study)
- Chia nhỏ hoặc gộp lại các section theo cách mới
- Tạo headings hoàn toàn mới (không dịch heading cũ)

### 3. THÊM GIÁ TRỊ MỚI
- Context: Giải thích tại sao điều này quan trọng
- So sánh: So với trước đây, các trường hợp tương tự
- Hệ quả: Ảnh hưởng đến người đọc như thế nào
- Góc nhìn mới: Phân tích từ nhiều khía cạnh
- Độ dài: Dài hơn bài gốc 30-50% (tối thiểu 700 từ)

### 2. CẤU TRÚC SEO-OPTIMIZED

**Heading Hierarchy (QUAN TRỌNG):**
- Sử dụng ## cho heading chính (H2) - 3-5 headings
- Sử dụng ### cho sub-heading (H3) nếu cần
- Mỗi heading chứa keywords tự nhiên
- Headings mô tả rõ nội dung phần đó

**Hình Ảnh Minh Họa (CRITICAL!):**
- Chèn ĐÚNG 1 placeholder hình ảnh vào giữa bài viết
- Format: [IMAGE_PLACEHOLDER_1]
- Đặt sau heading đầu tiên (##) hoặc giữa các đoạn quan trọng
- KHÔNG đặt ở đầu bài (trước heading đầu) hoặc cuối bài
- VÍ DỤ vị trí chèn:

\`\`\`
## Tiêu Đề Chính

Đoạn mở đầu giới thiệu chủ đề...

[IMAGE_PLACEHOLDER_1]

## Phân Tích Chi Tiết

Nội dung chi tiết về vấn đề...

## Kết Luận

Tóm tắt và đánh giá cuối cùng...
\`\`\`

**Đoạn văn:**
- Mỗi đoạn: 3-5 câu (60-100 từ)
- Câu đầu tiên: Topic sentence rõ ràng
- Câu ngắn gọn, dễ đọc (15-25 từ/câu)
- Tránh đoạn văn quá dài

**Formatting:**
- **Bold** cho keywords, số liệu quan trọng (2-3 lần)
- *Italic* cho thuật ngữ, từ khóa phụ
- Bullet points (- ) cho danh sách
- Số thứ tự (1. 2. 3.) cho hướng dẫn từng bước

### 3. SEO ON-PAGE

**Keywords:**
- Từ khóa chính (từ tiêu đề): Xuất hiện 3-5 lần tự nhiên
- LSI keywords (từ liên quan): Rải đều trong bài
- Long-tail keywords: Sử dụng trong headings
- Keyword density: 1-2% (tự nhiên, không spam)

**Đoạn đầu (Introduction):**
- Hook: Câu mở đầu hấp dẫn, đặt vấn đề
- Chứa keyword chính trong 100 từ đầu
- Tóm tắt nội dung chính của bài
- 2-3 đoạn ngắn (80-120 từ tổng)

**Đoạn cuối (Conclusion):**
- Tóm tắt takeaways chính
- Call-to-action tự nhiên (nếu phù hợp)
- Đặt câu hỏi hoặc khuyến khích suy nghĩ
- 1-2 đoạn (60-80 từ)

### 4. E-E-A-T (Experience, Expertise, Authority, Trust)
- Sử dụng con số, số liệu cụ thể
- Trích dẫn nguồn (nếu có trong bài gốc): "theo...", "nghiên cứu từ..."
- Thêm context, giải thích rõ hơn
- Tránh ngôn ngữ quá cường điệu, clickbait

### 5. READABILITY
- Tone: ${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.professional}
- Viết cho người đọc thật, không phải bot
- Ngôn ngữ đơn giản, dễ hiểu
- Tránh jargon, thuật ngữ phức tạp (hoặc giải thích rõ)
- Sử dụng câu chủ động, hạn chế bị động

### 6. FEATURED SNIPPET POTENTIAL
- Trả lời câu hỏi "Là gì?", "Tại sao?", "Như thế nào?" ngay đầu
- Sử dụng lists, tables (markdown) khi phù hợp
- Định nghĩa rõ ràng trong 2-3 câu đầu
- Steps/tips: Numbered lists với hành động cụ thể

---

**TIÊU ĐỀ BÀI GỐC:**
${title}

**NỘI DUNG BÀI GỐC:**
${content}

---

**CẤU TRÚC BÀI VIẾT (THAM KHẢO):**

❌ **KHÔNG được tạo abstract/summary in đậm ở đầu bài!**
✅ **Bắt đầu TRỰC TIẾP với ## Heading hoặc đoạn văn thường**

## [Heading 1 - Chứa keyword chính]

[Đoạn mở đầu: Câu hook → Context → Tại sao quan trọng. Viết như đoạn văn bình thường, KHÔNG in đậm toàn bộ đoạn]

## [Heading 2 - Sub-topic hoặc benefit]

[Nội dung chi tiết với số liệu, ví dụ cụ thể]

- **Point 1**: [Chi tiết]
- **Point 2**: [Chi tiết]

### [Sub-heading nếu cần]

[Nội dung chi tiết hơn]

## [Heading 3 - Giải pháp/Cách làm]

1. **Bước 1**: [Mô tả]
2. **Bước 2**: [Mô tả]

## [Heading 4 - Kết luận/Tóm tắt]

[Tóm tắt key points, takeaways, CTA tự nhiên]

---

**BẮT ĐẦU VIẾT BÀI NGAY - CHỈ TRẢ VỀ MARKDOWN (không có wrapper \`\`\`markdown, không giải thích):**

---

${generateMetadata ? `
**QUAN TRỌNG - TẠO METADATA SEO + TAGS:**

Sau khi viết xong bài, thêm 3 dòng cuối cùng (bắt đầu với "---"):

\`\`\`
---
SEO_TITLE: [Tiêu đề SEO mới 50-60 ký tự, KHÁC BẢN GỐC, có keyword]
SEO_DESC: [Mô tả ngắn gọn 140-155 ký tự, tóm tắt nội dung chính, có CTA]
TAGS: [tag1, tag2, tag3, tag4, tag5]
\`\`\`

**YÊU CẦU:**
- **SEO_TITLE (PHẢI PHÙ HỢP VỚI INTENT!):**
  - Viết LẠI hoàn toàn, KHÁC tiêu đề gốc, 50-60 ký tự
  - Chứa keyword chính + số liệu/năm nếu có
  - Phản ánh đúng intent:
    * Informational: "Cách...", "Tại Sao...", "Hướng Dẫn..."
    * Commercial: "Review...", "So Sánh...", "Có Nên Mua..."
    * Transactional: "Giá...", "Mua Ngay...", "Khuyến Mãi..."
  
- **SEO_DESC (PHẢI GIẢI QUYẾT INTENT!):**
  - 140-155 ký tự, ngắn gọn, súc tích
  - Hook + giải quyết intent + CTA
  - VD Informational: "Tìm hiểu nguyên nhân, cách khắc phục hiệu quả..."
  - VD Commercial: "So sánh chi tiết ưu/nhược, đánh giá có nên mua..."
  
- **TAGS (PHẢN ÁNH KEYWORD + INTENT):**
  - 3-7 tags, viết thường, ngắn gọn (1-3 từ)
  - Bao gồm: keyword chính + từ liên quan + intent-related tags
  - Format: [tag1, tag2, tag3] - dùng dấu phẩy ngăn cách
  - Ví dụ: [iphone 15, smartphone, review, công nghệ, mua sắm]
  - KHÔNG dùng hashtag (#)
  
- Đặt ở CUỐI CÙNG của bài viết (sau [IMAGE_PLACEHOLDER_1] nếu có)

**VÍ DỤ:**
\`\`\`
[... Nội dung bài viết ở đây ...]

---
SEO_TITLE: Ô Nhiễm Hà Nội Vượt 215 AQI: Cách Bảo Vệ Sức Khỏe
SEO_DESC: Chỉ số AQI Hà Nội vượt mức an toàn 2,5 lần. Tìm hiểu tác động và biện pháp phòng tránh hiệu quả cho gia đình bạn.
TAGS: [ô nhiễm không khí, hà nội, sức khỏe, môi trường, who]
\`\`\`
` : ''}`;



    // Call AI API based on provider
    let rewrittenContent = '';
    let tokensUsed = 0;
    let cost = '$0.0000';

    if (actualProvider === 'google' && googleApiKeys.length > 0) {
      console.log('🟢 Using Google AI (Gemini)');
      console.log(`📦 Available keys: ${googleApiKeys.length}`);
      
      // Only gemini-2.0-flash-lite works with v1beta API (Oct 2025)
      const modelName = 'gemini-2.0-flash-lite';
      
      let result;
      let duration = 0;
      let lastError;
      let successfulKeyIndex = -1;
      
      // Try each key until one succeeds
      for (let keyAttempt = 0; keyAttempt < googleApiKeys.length; keyAttempt++) {
        // Calculate which key to try (start from current position)
        const keyIndex = (currentKeyIndex + keyAttempt) % googleApiKeys.length;
        const keyNumber = keyIndex + 1;
        const selectedKey = googleApiKeys[keyIndex];
        
        console.log(`🔑 Trying Key #${keyNumber} of ${googleApiKeys.length}...`);
        
        const tempGoogleAI = new GoogleGenerativeAI(selectedKey);
        
        try {
          // Try with minimal config first
          console.log('⚙️  Trying with minimal config...');
          let model = tempGoogleAI.getGenerativeModel({ 
            model: modelName,
          });

          const startTime = Date.now();
          result = await model.generateContent(prompt);
          duration = Date.now() - startTime;
          
          console.log(`✅ SUCCESS with Key #${keyNumber} (minimal config)`);
          successfulKeyIndex = keyIndex;
          break; // Success! Exit loop
          
        } catch (minimalError: any) {
          // Check if it's a quota error (429)
          const isQuotaError = minimalError.message?.includes('429') || 
                               minimalError.message?.includes('quota') ||
                               minimalError.message?.includes('Too Many Requests');
          
          if (isQuotaError) {
            console.log(`⚠️  Key #${keyNumber} quota exceeded, trying next key...`);
            lastError = minimalError;
            continue; // Try next key
          }
          
          console.log(`⚠️  Minimal config failed: ${minimalError.message}`);
          
          // Try with full config as fallback (for non-quota errors)
          try {
            console.log('⚙️  Trying with full config (temp=1.0, topP=0.95, topK=40)...');
            const model = tempGoogleAI.getGenerativeModel({ 
              model: modelName,
              generationConfig: {
                temperature: 1.0,
                maxOutputTokens: 8000,
                topP: 0.95,
                topK: 40,
              },
            });

            const startTime = Date.now();
            result = await model.generateContent(prompt);
            duration = Date.now() - startTime;
            
            console.log(`✅ SUCCESS with Key #${keyNumber} (full config)`);
            successfulKeyIndex = keyIndex;
            break; // Success! Exit loop
            
          } catch (fullError: any) {
            // Check if it's a quota error
            const isFullQuotaError = fullError.message?.includes('429') || 
                                     fullError.message?.includes('quota') ||
                                     fullError.message?.includes('Too Many Requests');
            
            if (isFullQuotaError) {
              console.log(`⚠️  Key #${keyNumber} quota exceeded (full config), trying next key...`);
              lastError = fullError;
              continue; // Try next key
            }
            
            console.log(`❌ Full config also failed: ${fullError.message}`);
            lastError = fullError;
            continue; // Try next key for other errors too
          }
        }
      }
      
      if (!result) {
        console.error('❌ All keys failed!');
        // Check if all failures were quota errors
        const isAllQuotaErrors = lastError?.message?.includes('quota') || 
                                 lastError?.message?.includes('429');
        if (isAllQuotaErrors) {
          console.error('💡 TIP: All keys exceeded quota. Wait for reset or add more keys.');
        }
        throw lastError || new Error('All Google AI keys failed');
      }
      
      // Update currentKeyIndex to the successful key + 1 for next request
      if (successfulKeyIndex >= 0) {
        currentKeyIndex = (successfulKeyIndex + 1) % googleApiKeys.length;
      }
      
      rewrittenContent = result.response.text() || '';
      
      console.log(`✅ Google AI Response received in ${duration}ms`);
      console.log(`📏 Output length: ${rewrittenContent.length} chars`);
      
      // Estimate tokens (Google AI doesn't provide exact count in free tier)
      tokensUsed = Math.floor((content.length + rewrittenContent.length) / 4);
      cost = 'FREE';

      console.log('✅ Google AI Rewrite success:', {
        originalLength: content.length,
        rewrittenLength: rewrittenContent.length,
        estimatedTokens: tokensUsed,
        cost: 'FREE',
      });

    } else if (actualProvider === 'openai' && openai) {
      // Use OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Bạn là một biên tập viên tin tức chuyên nghiệp, giỏi viết lại nội dung một cách unique và hấp dẫn.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 4000,
      });

      rewrittenContent = completion.choices[0].message.content || '';
      tokensUsed = completion.usage?.total_tokens || 0;
      cost = calculateCost(tokensUsed);

      console.log('✅ OpenAI Rewrite success:', {
        originalLength: content.length,
        rewrittenLength: rewrittenContent.length,
        tokensUsed,
        cost,
      });
    } else {
      throw new Error('No AI provider available');
    }

    if (!rewrittenContent || rewrittenContent.length < 100) {
      console.log('❌ AI content too short:', rewrittenContent.length, 'chars');
      throw new Error('AI generated content is too short');
    }

    // Clean up AI output: Remove markdown code fence wrappers
    rewrittenContent = cleanMarkdownOutput(rewrittenContent);

    // Extract metadata if present
    let seoTitle = '';
    let seoDescription = '';
    let tags: string[] = [];
    let finalContent = rewrittenContent;

    if (generateMetadata) {
      // Updated regex to handle optional trailing "---"
      // Matches format:
      // ---
      // SEO_TITLE: ...
      // SEO_DESC: ...
      // TAGS: [...]
      // ---  (optional)
      const metadataRegex = /---[\s\n]*SEO_TITLE:\s*(.+?)[\s\n]+SEO_DESC:\s*(.+?)[\s\n]+TAGS:\s*\[(.+?)\][\s\n]*(?:---)?[\s\n]*$/;
      const metadataMatch = rewrittenContent.match(metadataRegex);
      
      if (metadataMatch) {
        seoTitle = metadataMatch[1].trim();
        seoDescription = metadataMatch[2].trim();
        const tagsString = metadataMatch[3].trim();
        
        // Parse tags
        tags = tagsString
          .split(',')
          .map(tag => tag.trim().toLowerCase())
          .filter(tag => tag.length > 0 && tag.length < 50);
        
        // Remove metadata from content (everything from first "---" before SEO_TITLE)
        finalContent = rewrittenContent.replace(/---[\s\n]*SEO_TITLE:[\s\S]*$/, '').trim();
        
        console.log('📋 Extracted Metadata:');
        console.log('  - SEO Title:', seoTitle);
        console.log('  - SEO Desc:', seoDescription);
        console.log('  - Tags:', tags);
      } else {
        console.warn('⚠️ Could not extract metadata from AI response');
        console.log('Last 500 chars of content:', rewrittenContent.slice(-500));
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ AI REWRITE SUCCESS!');
    console.log('  - Original:', content.length, 'chars');
    console.log('  - Rewritten:', finalContent.length, 'chars');
    console.log('  - Increase:', Math.round((finalContent.length / content.length - 1) * 100) + '%');
    console.log('  - Tokens:', tokensUsed);
    console.log('  - Cost:', cost);
    console.log('  - Provider:', actualProvider);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json({
      success: true,
      rewrittenContent: finalContent,
      seoTitle: seoTitle || title, // Fallback to original if not generated
      seoDescription,
      tags,
      originalLength: content.length,
      rewrittenLength: finalContent.length,
      tokensUsed,
      cost,
      provider: actualProvider,
    });
  } catch (error: any) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ AI REWRITE ERROR!');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Status:', error.status);
    console.error('Full Error:', error);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'OpenAI quota exceeded. Please check your API credits.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to rewrite content', details: error.message },
      { status: 500 }
    );
  }
}

// Calculate approximate cost (GPT-4o-mini pricing)
function calculateCost(tokens: number): string {
  // GPT-4o-mini: $0.15 / 1M input tokens, $0.60 / 1M output tokens
  // Approximate 50/50 split
  const inputTokens = tokens * 0.5;
  const outputTokens = tokens * 0.5;
  
  const inputCost = (inputTokens / 1_000_000) * 0.15;
  const outputCost = (outputTokens / 1_000_000) * 0.60;
  const totalCost = inputCost + outputCost;
  
  return `$${totalCost.toFixed(4)}`;
}

