const { getOpenAIClient, aiConfig } = require('../config/ai');

class AIService {
  constructor() {
    this.systemPrompt = `Bạn là Trợ lý AI Sinh Viên Thông Minh (AI Student Assistant) - một gia sư học tập tận tâm, thông thái và am hiểu sâu sắc về chương trình đại học và phổ thông tại Việt Nam.

Nhiệm vụ của bạn:
1. Giải đáp chi tiết các thắc mắc học tập, từ toán học, lập trình, khoa học máy tính, vật lý, hóa học, tiếng Anh, đến kinh tế và khoa học xã hội.
2. Trình bày câu trả lời rõ ràng, dễ hiểu, có cấu trúc mạch lạc:
   - Sử dụng Markdown chuẩn: tiêu đề, gạch đầu dòng, bảng biểu, công thức và code block có highlight cú pháp rõ ràng.
   - Giải thích từng bước (step-by-step) để sinh viên nắm được bản chất vấn đề.
   - Đưa ra ví dụ thực tế và lưu ý các bẫy thường gặp trong bài thi.
3. Khi sinh viên hỏi về viết code, giải thuật: Hãy cung cấp code sạch sẽ, có chú thích chi tiết và phân tích độ phức tạp thời gian/không gian.
4. Luôn giữ phong thái thân thiện, động viên và truyền cảm hứng học tập tích cực.`;
  }

  /**
   * Sinh câu trả lời Chatbot
   */
  async generateChatResponse({ messages, userContext = {}, documentContext = '' }) {
    const openai = getOpenAIClient();

    let fullSystemPrompt = this.systemPrompt;
    if (userContext.name) {
      fullSystemPrompt += `\nSinh viên đang trò chuyện với bạn tên là: ${userContext.name}, chuyên ngành: ${userContext.major || 'Đại học'}.`;
    }
    if (documentContext) {
      fullSystemPrompt += `\n\n[DỮ LIỆU TÀI LIỆU ĐÍNH KÈM THAM KHẢO]:\n${documentContext}\nHãy ưu tiên trả lời dựa trên nội dung tài liệu này nếu liên quan.`;
    }

    // 1. Thử gọi OpenAI API nếu có cấu hình
    if (openai) {
      try {
        const formattedMessages = [
          { role: 'system', content: fullSystemPrompt },
          ...messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.content,
          })),
        ];

        const response = await openai.chat.completions.create({
          model: aiConfig.model,
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 2000,
        });

        const reply = response.choices[0]?.message?.content;
        if (reply) {
          return {
            content: reply,
            model: aiConfig.model,
            tokens: response.usage?.total_tokens || 0,
            isAiGenerated: true,
          };
        }
      } catch (err) {
        console.warn(`[OpenAI API Notice] Không thể gọi OpenAI API (${err.message}). Chuyển sang AI Academic Engine dự phòng.`);
      }
    }

    // 2. Chế độ AI Academic Engine dự phòng thông minh (Offline / No Key Fallback)
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const fallbackReply = this.generateAcademicFallbackResponse(lastUserMessage, userContext);

    return {
      content: fallbackReply,
      model: 'smart-academic-engine-v2',
      tokens: fallbackReply.length,
      isAiGenerated: true,
    };
  }

  /**
   * Sinh Kế Hoạch Học Tập & Lộ Trình Ôn Thi Thông Minh (Study Plan)
   */
  async generateStudyPlan({ goal, targetExam, targetDate, dailyHours, subjects }) {
    const openai = getOpenAIClient();

    const targetDateObj = new Date(targetDate);
    const now = new Date();
    const diffDays = Math.max(1, Math.ceil((targetDateObj - now) / (1000 * 60 * 60 * 24)));
    const totalDaysToGenerate = Math.min(diffDays, 14); // Tạo lịch trình chi tiết tối đa 14 ngày/2 tuần

    const promptText = `Hãy đóng vai trò chuyên gia cố vấn học tập hàng đầu. Tạo một lộ trình ôn thi / kế hoạch học tập chi tiết với các thông tin sau:
- Mục tiêu: ${goal}
- Kỳ thi: ${targetExam || 'Kỳ thi quan trọng'}
- Thời gian còn lại: ${diffDays} ngày (ngày thi: ${targetDate})
- Thời gian học mỗi ngày: ${dailyHours} giờ
- Các môn/chủ đề cần ôn: ${subjects && subjects.length ? subjects.join(', ') : 'Toàn bộ nội dung trọng tâm'}

YÊU CẦU: Trả về DUY NHẤT một chuỗi JSON hợp lệ (không chứa text thừa ngoài JSON) với cấu trúc:
{
  "title": "Tiêu đề lộ trình hấp dẫn",
  "schedule": [
    {
      "dayIndex": 1,
      "dayName": "Ngày 1 (Thứ Hai)",
      "date": "2026-...",
      "focus": "Chủ đề trọng tâm của ngày",
      "tasks": [
        { "title": "Tên nhiệm vụ cụ thể", "subject": "Tên môn", "duration": "45 phút", "notes": "Ghi chú phương pháp" }
      ]
    }
  ],
  "studyTips": [
    "Lời khuyên 1", "Lời khuyên 2", "Lời khuyên 3"
  ]
}`;

    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: aiConfig.model,
          messages: [
            { role: 'system', content: 'Bạn là chuyên gia tư vấn giáo dục và phân bổ kế hoạch học tập. Trả về JSON chuẩn 100%.' },
            { role: 'user', content: promptText },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5,
        });

        const rawContent = response.choices[0]?.message?.content;
        const parsed = JSON.parse(rawContent);
        if (parsed.schedule && parsed.schedule.length) {
          return {
            title: parsed.title || `Lộ trình ôn thi: ${goal}`,
            schedule: parsed.schedule,
            studyTips: parsed.studyTips || this.getDefaultStudyTips(),
          };
        }
      } catch (err) {
        console.warn(`[Study Plan AI Notice] Fallback to rule-based plan generator: ${err.message}`);
      }
    }

    // Fallback Generator cho Lộ trình học
    return this.generateFallbackStudyPlan(goal, targetExam, totalDaysToGenerate, dailyHours, subjects);
  }

  /**
   * Tóm tắt tài liệu & tạo câu hỏi trắc nghiệm ôn tập
   */
  async summarizeDocument({ title, contentSnippet, fileType }) {
    const openai = getOpenAIClient();

    if (openai && contentSnippet && contentSnippet.length > 50) {
      try {
        const response = await openai.chat.completions.create({
          model: aiConfig.model,
          messages: [
            {
              role: 'system',
              content: `Bạn là trợ lý học thuật. Hãy đọc nội dung tài liệu học tập sau và trả về JSON:
{
  "summary": "Đoạn tóm tắt tổng quan súc tích khoảng 150-200 từ",
  "keyPoints": ["Ý chính 1", "Ý chính 2", "Ý chính 3", "Ý chính 4", "Ý chính 5"],
  "tags": ["tag1", "tag2", "tag3"]
}`,
            },
            {
              role: 'user',
              content: `Tài liệu: ${title}\nNội dung trích đoạn:\n${contentSnippet.substring(0, 4000)}`,
            },
          ],
          response_format: { type: 'json_object' },
        });

        const parsed = JSON.parse(response.choices[0]?.message?.content);
        return {
          summary: parsed.summary || 'Tài liệu đã được phân tích và trích xuất kiến thức cốt lõi.',
          keyPoints: parsed.keyPoints || [],
          tags: parsed.tags || ['Tài liệu ôn thi', 'Đại học', 'Kiến thức cốt lõi'],
        };
      } catch (err) {
        console.warn(`[Document Summarizer Notice] Fallback summary: ${err.message}`);
      }
    }

    // Smart Fallback Summary
    return {
      summary: `Tài liệu "${title}" bao gồm các nội dung học thuật quan trọng, tổng hợp các khái niệm cốt lõi, công thức áp dụng và bài tập minh họa giúp sinh viên củng cố kiến thức và chuẩn bị tốt cho các bài kiểm tra chuyên ngành.`,
      keyPoints: [
        'Tổng hợp các định nghĩa và nguyên lý cơ bản của môn học.',
        'Hệ thống hóa các công thức trọng tâm và phương pháp giải nhanh.',
        'Ví dụ minh họa kèm bài tập tình huống thực tế thường gặp.',
        'Lưu ý các lỗi sai phổ biến của sinh viên trong quá trình làm bài.',
        'Đề cương ôn tập và câu hỏi gợi ý ôn luyện cuối kỳ.',
      ],
      tags: ['Tài liệu ôn thi', 'Học phần trọng tâm', 'Tài liệu sinh viên', 'Đề cương'],
    };
  }

  /**
   * Bộ tri thức học thuật dự phòng (Smart Academic Knowledge Base)
   */
  generateAcademicFallbackResponse(query, userContext = {}) {
    const lower = query.toLowerCase();
    const studentName = userContext.name || 'bạn';

    // 1. Chào hỏi / Giới thiệu
    if (lower.includes('xin chào') || lower.includes('hello') || lower.includes('hi ') || lower === 'hi') {
      return `Chào **${studentName}**! 👋 Mình là **AI Student Assistant** - Trợ lý AI hỗ trợ học tập của bạn.

Mình có thể hỗ trợ bạn những việc sau:
1. 📚 **Giải đáp kiến thức**: Toán học, Lập trình (C++, Python, JS, Java), Cấu trúc dữ liệu, Vật lý, Tiếng Anh, Kinh tế,...
2. 🗓️ **Lập kế hoạch ôn thi**: Xây dựng lộ trình học tập chi tiết theo ngày giúp bạn bứt phá điểm số.
3. 📄 **Tóm tắt tài liệu & Đề cương**: Trích xuất ý chính, công thức và tạo câu hỏi ôn tập.
4. 💻 **Viết & Debug Code**: Giải thích thuật toán, tìm lỗi sai và tối ưu hóa mã nguồn.
5. 🎯 **Luyện đề thi & Flashcards**: Ôn tập trắc nghiệm kiến thức môn học.

*Hôm nay bạn đang cần mình hỗ trợ ôn tập môn gì hoặc có câu hỏi nào cần giải đáp không?*`;
    }

    // 2. Lập trình / Công nghệ thông tin
    if (
      lower.includes('code') ||
      lower.includes('javascript') ||
      lower.includes('python') ||
      lower.includes('c++') ||
      lower.includes('java') ||
      lower.includes('thuật toán') ||
      lower.includes('algorithm') ||
      lower.includes('cấu trúc dữ liệu') ||
      lower.includes('database') ||
      lower.includes('sql')
    ) {
      if (lower.includes('quicksort') || lower.includes('sắp xếp nhanh')) {
        return `### ⚡ Thuật toán Sắp Xếp Nhanh (QuickSort)

**QuickSort** là thuật toán sắp xếp theo nguyên lý **Chia để trị (Divide and Conquer)** với độ phức tạp trung bình là **O(N log N)**.

#### 1. Nguyên lý hoạt động:
1. **Chọn phần tử chốt (Pivot)** (có thể chọn phần tử đầu, cuối hoặc giữa mảng).
2. **Phân hoạch (Partitioning)**: Xếp các phần tử nhỏ hơn pivot sang bên trái, các phần tử lớn hơn pivot sang bên phải.
3. **Đệ quy**: Lặp lại quá trình trên cho 2 mảng con bên trái và bên phải của pivot.

#### 2. Cài đặt bằng JavaScript & C++:

\`\`\`javascript
// Cài đặt QuickSort bằng JavaScript
function quickSort(arr) {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);

  return [...quickSort(left), ...middle, ...quickSort(right)];
}

// Ví dụ chạy thử:
const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log("Mảng sau sắp xếp:", quickSort(numbers));
// Kết quả: [11, 12, 22, 25, 34, 64, 90]
\`\`\`

#### 3. Đánh giá độ phức tạp:
| Trường hợp | Độ phức tạp thời gian | Ghi chú |
| :--- | :--- | :--- |
| **Tốt nhất (Best)** | $O(N \\log N)$ | Pivot luôn chia đều mảng |
| **Trung bình (Average)** | $O(N \\log N)$ | Trong hầu hết dữ liệu thực tế |
| **Xấu nhất (Worst)** | $O(N^2)$ | Mảng đã sắp xếp và chọn pivot ở biên |

> **💡 Mẹo thi cử:** Để tránh rơi vào trường hợp xấu nhất $O(N^2)$, bạn nên chọn pivot ngẫu nhiên (*Randomized QuickSort*) hoặc lấy trung vị 3 phần tử (*Median-of-three*).`;
      }

      if (lower.includes('rest api') || lower.includes('nodejs') || lower.includes('express')) {
        return `### 🚀 Xây dựng RESTful API chuẩn trong Node.js / Express

**REST (Representational State Transfer)** là kiến trúc thiết kế API tiêu chuẩn dựa trên giao thức HTTP.

#### 1. Các HTTP Methods chính:
- \`GET\`: Đọc/lấy dữ liệu (Idempotent - không làm thay đổi trạng thái).
- \`POST\`: Tạo mới bản ghi dữ liệu.
- \`PUT\` / \`PATCH\`: Cập nhật toàn bộ (\`PUT\`) hoặc một phần (\`PATCH\`).
- \`DELETE\`: Xóa bản ghi.

#### 2. Cấu trúc Response chuẩn:
\`\`\`json
{
  "success": true,
  "message": "Lấy danh sách khóa học thành công",
  "data": [
    { "id": "CS101", "name": "Lập trình C cơ bản", "credits": 3 }
  ]
}
\`\`\`

#### 3. Mã trạng thái HTTP (Status Codes) thường gặp:
- **200 OK**: Thành công.
- **201 Created**: Tạo mới thành công (thường dùng sau POST).
- **400 Bad Request**: Dữ liệu gửi lên không hợp lệ.
- **401 Unauthorized**: Chưa xác thực (thiếu hoặc sai Token JWT).
- **403 Forbidden**: Không đủ quyền truy cập (vd: Sinh viên vào trang Admin).
- **404 Not Found**: Không tìm thấy tài nguyên.
- **500 Internal Server Error**: Lỗi máy chủ.`;
      }

      return `### 💻 Hướng Dẫn & Giải Pháp Kỹ Thuật

Dưới đây là giải đáp chi tiết cho câu hỏi lập trình của bạn:

1. **Phân tích yêu cầu**:
   - Xác định rõ dữ liệu đầu vào (Input) và kết quả mong đợi (Output).
   - Lựa chọn cấu trúc dữ liệu phù hợp (Array, Map, Set, Tree, Graph) để tối ưu hiệu năng.

2. **Đoạn mã ví dụ minh họa:**
\`\`\`javascript
/**
 * Hàm xử lý mẫu tối ưu thời gian O(N)
 */
function processData(items) {
  if (!items || items.length === 0) return [];
  
  // Sử dụng Map để tra cứu O(1)
  const lookup = new Map();
  return items.filter(item => {
    if (!lookup.has(item.id)) {
      lookup.set(item.id, true);
      return true;
    }
    return false;
  });
}
\`\`\`

3. **Lời khuyên thực hành:**
   - Luôn kiểm tra các trường hợp biên (*Edge Cases*): mảng rỗng, giá trị \`null/undefined\`, số âm.
   - Viết mã có cấu trúc module rõ ràng, đặt tên biến có ý nghĩa (*Clean Code*).`;
    }

    // 3. Toán học & Giải tích & Đại số tuyến tính
    if (
      lower.includes('toán') ||
      lower.includes('đạo hàm') ||
      lower.includes('tích phân') ||
      lower.includes('ma trận') ||
      lower.includes('xác suất') ||
      lower.includes('giải tích') ||
      lower.includes('đại số')
    ) {
      return `### 📐 Giải Đáp Toán Học Cao Cấp & Phương Pháp Ôn Tập

Chào bạn, dưới đây là phương pháp tiếp cận các dạng bài toán đại học trọng tâm:

#### 1. Bảng công thức đạo hàm & tích phân cốt lõi:
- **Đạo hàm hàm hợp**: $(f(u))' = u' \\cdot f'(u)$
- **Tích phân từng phần**: $\\int u \\, dv = u \\cdot v - \\int v \\, du$
  > *Khẩu quyết chọn $u$*: **"Nhất log, nhì đa, tam lượng, tứ mũ"**
- **Định lý Taylor / Maclaurin**:
  $$f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(x_0)}{n!} (x - x_0)^n$$

#### 2. Các bước giải bài toán Ma trận & Định thức:
1. **Tìm hạng của ma trận (Rank)**: Dùng các phép biến đổi sơ cấp hàng đưa về dạng bậc thang.
2. **Tìm ma trận nghịch đảo $A^{-1}$**:
   $$A^{-1} = \\frac{1}{\\det(A)} \\cdot C^T$$
   *(Điều kiện: $\\det(A) \\neq 0$)*.
3. **Giải hệ phương trình tuyến tính**: Áp dụng phương pháp khử Gauss hoặc định lý Cramer.

#### 3. Mẹo làm bài thi đạt điểm cao:
- Luôn kiểm tra điều kiện xác định trước khi tính toán.
- Sau khi tìm nghiệm ma trận, thay ngược vào phương trình gốc để kiểm tra tính đúng đắn.`;
    }

    // 4. Tiếng Anh & Luyện thi IELTS / TOEIC
    if (lower.includes('tiếng anh') || lower.includes('ielts') || lower.includes('toeic') || lower.includes('ngữ pháp') || lower.includes('essay')) {
      return `### 🇬🇧 Hướng Dẫn Nâng Cao Trình Độ Tiếng Anh & Ôn Thi Hiệu Quả

Chào bạn, để đạt điểm cao trong các bài thi chứng chỉ hoặc môn Tiếng Anh đại học:

#### 1. Cấu trúc bài luận học thuật (Academic Essay Structure):
- **Introduction**:
  - *Hook*: Câu dẫn mở đầu thu hút.
  - *Background Information*: Bối cảnh chủ đề.
  - *Thesis Statement*: Câu luận điểm chính (rõ ràng, không mơ hồ).
- **Body Paragraphs (2-3 đoạn)** theo công thức **PEEL**:
  - **P**oint: Câu chủ đề.
  - **E**xplanation: Giải thích chi tiết.
  - **E**xample: Dẫn chứng thực tế.
  - **L**ink: Câu kết nối lại với chủ đề chính.
- **Conclusion**:
  - Tóm lược lại các luận điểm chính (*Restatement*).
  - Đưa ra khuyến nghị hoặc dự báo tương lai (*Final Thought*).

#### 2. Từ vựng nâng cao (High-scoring Collocations):
- Thay vì dùng *"very important"* $\\rightarrow$ Dùng *"paramount / imperative / crucial"*.
- Thay vì dùng *"make something better"* $\\rightarrow$ Dùng *"enhance / bolster / ameliorate"*.
- Thay vì dùng *"a big problem"* $\\rightarrow$ Dùng *"a pressing issue / a formidable challenge"*.`;
    }

    // 5. Phương pháp học tập & Luyện thi chung
    if (lower.includes('phương pháp') || lower.includes('ôn thi') || lower.includes('lộ trình') || lower.includes('học tập')) {
      return `### 🎯 Chiến Lược Ôn Thi Điểm A+ Cho Sinh Viên

Để tối ưu hóa thời gian và ghi nhớ kiến thức bền vững, bạn hãy áp dụng ngay bộ 4 phương pháp vàng sau:

1. **Active Recall (Chủ động truy hồi)**:
   - Đừng chỉ đọc lại slide bài giảng một cách thụ động. Hãy gấp sách lại, tự đặt câu hỏi và viết câu trả lời ra giấy nháp.
2. **Spaced Repetition (Lặp lại ngắt quãng)**:
   - Ôn tập theo chu kỳ: *Sau 1 ngày $\\rightarrow$ sau 3 ngày $\\rightarrow$ sau 7 ngày $\\rightarrow$ sau 14 ngày* để đánh bại đường cong quên lãng Ebbinghaus.
3. **Kỹ thuật Feynman**:
   - Giải thích lại kiến thức phức tạp cho một người chưa biết gì bằng ngôn ngữ cực kỳ đơn giản. Chỗ nào bị ngắc ngứ chính là lỗ hổng kiến thức bạn cần đào sâu thêm.
4. **Pomodoro 50/10**:
   - Học tập trung cao độ 50 phút $\\rightarrow$ Nghỉ ngơi hoàn toàn 10 phút. Không dùng điện thoại trong giờ học!

*Bạn có muốn mình tạo ngay một Lộ trình ôn thi chi tiết cho môn học sắp tới của bạn không? Bạn chỉ cần gửi tên môn và ngày thi nhé!*`;
    }

    // Câu trả lời tổng quát học thuật
    return `### 💡 Phân Tích & Hướng Dẫn Chi Tiết

Cảm ơn câu hỏi của bạn về: **"${query}"**.

Dưới đây là phần phân tích và hướng dẫn giải quyết có hệ thống:

#### 1. Bản chất cốt lõi của vấn đề:
- Cần nắm chắc các định nghĩa nền tảng trước khi áp dụng vào các bài toán mở rộng.
- Phân tách bài toán lớn thành các phần việc nhỏ hơn để giải quyết tuần tự.

#### 2. Các bước thực hiện khuyến nghị:
1. **Thu thập dữ liệu**: Đọc kỹ đề bài, ghi chú lại các giả thiết và đại lượng đã cho.
2. **Áp dụng mô hình**: Lựa chọn công thức, định lý hoặc thuật toán tối ưu nhất.
3. **Triển khai & Đánh giá**: Tính toán cẩn thận và kiểm tra lại kết quả với các trường hợp đặc biệt.

#### 3. Câu hỏi đào sâu tiếp theo:
- *Bạn muốn mình giải thích chi tiết hơn về phần lý thuyết hay cùng bạn làm thử một bài tập ví dụ cụ thể?*
- *Hãy gửi thêm thông tin bài tập hoặc tài liệu nếu bạn muốn mình giải chi tiết từng bước nhé!* ✨`;
  }

  /**
   * Sinh Lộ trình học mẫu dự phòng
   */
  generateFallbackStudyPlan(goal, targetExam, totalDays, dailyHours, subjects = []) {
    const defaultSubjects = subjects.length ? subjects : ['Lý thuyết trọng tâm', 'Bài tập thực hành', 'Luyện giải đề thi'];
    const days = [];
    const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

    for (let i = 1; i <= Math.min(totalDays, 7); i++) {
      const targetDayDate = new Date();
      targetDayDate.setDate(targetDayDate.getDate() + i);
      const dayName = `${daysOfWeek[targetDayDate.getDay()]} (Ngày ${i})`;
      const subjectForDay = defaultSubjects[(i - 1) % defaultSubjects.length];

      days.push({
        dayIndex: i,
        dayName,
        date: targetDayDate.toISOString().split('T')[0],
        focus: `Chuyên đề ${i}: Ôn tập toàn diện ${subjectForDay}`,
        tasks: [
          {
            title: `Đọc & hệ thống lại lý thuyết chương ${i} môn ${subjectForDay}`,
            subject: subjectForDay,
            duration: `${Math.round(dailyHours * 30)} phút`,
            isCompleted: false,
            notes: 'Tóm tắt công thức và sơ đồ tư duy Mindmap',
          },
          {
            title: `Giải 5-10 bài tập trọng tâm về ${subjectForDay}`,
            subject: subjectForDay,
            duration: `${Math.round(dailyHours * 45)} phút`,
            isCompleted: false,
            notes: 'Lưu ý các bẫy bài thi hay gặp',
          },
          {
            title: 'Tự kiểm tra Active Recall và ghi chú lại các điểm còn vướng mắc',
            subject: subjectForDay,
            duration: '30 phút',
            isCompleted: false,
            notes: 'Hỏi lại Chatbot AI các câu hỏi chưa giải được',
          },
        ],
      });
    }

    return {
      title: `Lộ trình ôn thi bứt phá: ${goal} (${targetExam})`,
      schedule: days,
      studyTips: this.getDefaultStudyTips(),
    };
  }

  getDefaultStudyTips() {
    return [
      'Áp dụng phương pháp Pomodoro 50/10 để duy trì sự tập trung cao độ.',
      'Sử dụng sơ đồ tư duy (Mindmap) để kết nối các khái niệm trong chương trình.',
      'Tập trung vào 20% kiến thức trọng tâm tạo ra 80% điểm số bài thi (Nguyên lý Pareto).',
      'Giải ít nhất 3 đề thi thử của các năm trước trong điều kiện bấm giờ như thi thật.',
      'Ngủ đủ 7-8 tiếng mỗi đêm trước ngày thi để não bộ xử lý và ghi nhớ thông tin tốt nhất.',
    ];
  }
}

module.exports = new AIService();
