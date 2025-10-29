import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize OpenAI (optional)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Initialize Google AI (optional)
const googleAI = process.env.GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const { content, title, tone = 'professional', provider = 'google' } = await request.json();

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

    // Check API keys
    console.log('🔑 API Keys Status:');
    console.log('  - GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? `SET (${process.env.GOOGLE_AI_API_KEY.substring(0, 10)}...)` : '❌ NOT SET');
    console.log('  - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');

    // Check if any API key is configured
    if (!process.env.OPENAI_API_KEY && !process.env.GOOGLE_AI_API_KEY) {
      console.log('❌ NO API KEY CONFIGURED!');
      return NextResponse.json(
        { error: 'No AI API key configured. Please add OPENAI_API_KEY or GOOGLE_AI_API_KEY to environment variables.' },
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

Nhiệm vụ: Viết MỘT BÀI BÁO HOÀN TOÀN MỚI dựa trên thông tin từ bài gốc. KHÔNG viết lại từng câu - hãy VIẾT LẠI TOÀN BỘ như bạn đang tự viết một bài báo mới.

## YÊU CẦU QUAN TRỌNG NHẤT - VIẾT KHÁC BIỆT 100%:

### 1. PARAPHRASE TRIỆT ĐỂ (CRITICAL!)
❌ **TUYỆT ĐỐI KHÔNG:**
- Copy bất kỳ câu nào từ bài gốc (kể cả thay đổi 1-2 từ)
- Giữ nguyên cấu trúc câu của bài gốc
- Sử dụng cụm từ giống hệt bài gốc

✅ **BẮT BUỘC PHẢI:**
- VIẾT LẠI mỗi câu với cấu trúc HOÀN TOÀN KHÁC
- Thay đổi thứ tự trình bày thông tin
- Sử dụng từ đồng nghĩa, cách diễn đạt khác
- Thêm giải thích, context, ví dụ mới
- Viết như BẠN ĐANG KỂ CHUYỆN cho người khác nghe

**VÍ DỤ CÁCH PARAPHRASE:**

Bài gốc: "Ô nhiễm không khí ở Hà Nội đang ở mức nghiêm trọng với chỉ số AQI vượt 200."

❌ SAI (quá giống): "Tình trạng ô nhiễm không khí tại Hà Nội đang rất nghiêm trọng khi chỉ số AQI đã vượt mức 200."

✅ ĐÚNG (khác biệt): "Chất lượng không khí tại thủ đô đang báo động đỏ. Các thiết bị đo lường cho thấy nồng độ bụi mịn đã vượt ngưỡng an toàn gấp đôi, khiến nhiều chuyên gia y tế lo ngại về sức khỏe cộng đồng."

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

**OUTPUT FORMAT:**

\`\`\`markdown
## [Heading 1 - Chứa keyword chính]

[Đoạn mở đầu hấp dẫn, hook người đọc, có keyword chính trong 50 từ đầu]

[Đoạn 2: Context, tại sao điều này quan trọng]

## [Heading 2 - Sub-topic hoặc benefit]

[Nội dung chi tiết với số liệu, ví dụ cụ thể]

- **Point 1**: [Chi tiết]
- **Point 2**: [Chi tiết]
- **Point 3**: [Chi tiết]

### [Sub-heading nếu cần]

[Nội dung chi tiết hơn]

## [Heading 3 - Giải pháp/Cách làm]

[Hướng dẫn cụ thể, tips, best practices]

1. **Bước 1**: [Mô tả]
2. **Bước 2**: [Mô tả]
3. **Bước 3**: [Mô tả]

## [Heading 4 - Kết luận/Tóm tắt]

[Tóm tắt key points, takeaways, CTA tự nhiên]
\`\`\`

**QUY TẮC TUYỆT ĐỐI:**
❌ KHÔNG thêm meta text như "Đây là bài viết đã viết lại..."
❌ KHÔNG giải thích về quá trình viết lại
❌ KHÔNG thêm tiêu đề bài (title) ở đầu - chỉ bắt đầu với ## Heading
✅ CHỈ trả về nội dung Markdown đã tối ưu SEO
✅ Bắt đầu NGAY với ## Heading đầu tiên hoặc đoạn introduction`;


    // Call AI API based on provider
    let rewrittenContent = '';
    let tokensUsed = 0;
    let cost = '$0.0000';

    if (actualProvider === 'google' && googleAI) {
      console.log('🟢 Using Google AI (Gemini)');
      
      // Try different model names in order of preference (updated Oct 2024)
      const modelNames = [
        'gemini-2.0-flash-lite',   // Latest, fastest, free (recommended)
        'gemini-1.5-flash',        // Previous stable version
        'gemini-1.5-pro',          // Pro version (may require billing)
        'gemini-1.0-pro',          // Older stable version
        'gemini-pro',              // Legacy fallback
      ];
      
      let result;
      let duration = 0;
      let lastError;
      
      for (const modelName of modelNames) {
        try {
          console.log(`📝 Trying Model: ${modelName}`);
          
          // Try with minimal config first
          console.log('⚙️  Trying with minimal config...');
          let model = googleAI.getGenerativeModel({ 
            model: modelName,
          });

          const startTime = Date.now();
          result = await model.generateContent(prompt);
          duration = Date.now() - startTime;
          
          console.log(`✅ SUCCESS with model: ${modelName} (minimal config)`);
          break; // Success! Exit loop
          
        } catch (minimalError: any) {
          console.log(`⚠️  Minimal config failed: ${minimalError.message}`);
          
          // Try with full config as fallback
          try {
            console.log('⚙️  Trying with full config (temp=1.0, topP=0.95, topK=40)...');
            const model = googleAI.getGenerativeModel({ 
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
            
            console.log(`✅ SUCCESS with model: ${modelName} (full config)`);
            break; // Success! Exit loop
            
          } catch (fullError: any) {
            console.log(`❌ Full config also failed: ${fullError.message}`);
            lastError = fullError;
            continue; // Try next model
          }
        }
      }
      
      if (!result) {
        console.error('❌ All models failed!');
        throw lastError || new Error('All Google AI models failed');
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

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ AI REWRITE SUCCESS!');
    console.log('  - Original:', content.length, 'chars');
    console.log('  - Rewritten:', rewrittenContent.length, 'chars');
    console.log('  - Increase:', Math.round((rewrittenContent.length / content.length - 1) * 100) + '%');
    console.log('  - Tokens:', tokensUsed);
    console.log('  - Cost:', cost);
    console.log('  - Provider:', actualProvider);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return NextResponse.json({
      success: true,
      rewrittenContent,
      originalLength: content.length,
      rewrittenLength: rewrittenContent.length,
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

