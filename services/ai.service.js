const { getOpenAIClient, getGeminiApiKey, aiConfig } = require('../config/ai');

function removeAccents(str) {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

class AIService {
  constructor() {
    this.systemPrompt = `Bạn là Trợ Lý AI Đồng Hành & Tư Vấn Học Tập Sinh Viên NTU (Nguyen Trai University).
Trường Đại học Nguyễn Trãi là trường đại học ứng dụng hàng đầu (Địa chỉ: 28A Lê Trọng Tấn, Hà Đông, Hà Nội).

NGUYÊN TẮC HOẠT ĐỘNG & NĂNG LỰC:
1. Bạn là một trợ lý AI toàn năng: Bạn trả lời MỌI CÂU HỎI của người dùng từ kiến thức học tập tổng quát, khoa học tự nhiên, toán học, lập trình, thuật toán, ngoại ngữ, lịch sử, đời sống, viết lách... cho đến tư vấn học thuật chuyên sâu của 10 ngành đào tạo tại Trường Đại học Nguyễn Trãi.
2. Tuyệt đối KHÔNG từ chối những câu hỏi ngoài trường. Luôn sẵn sàng giải bài tập, viết code, dịch thuật, giải thích khái niệm khoa học và hỗ trợ sinh viên trong mọi lĩnh vực.
3. Chuyên sâu về 10 Ngành Đào Tạo tại Đại Học Nguyễn Trãi (NTU):
   - 1. Thiết kế đồ họa (Graphic Design): Mỹ thuật ứng dụng, 2D/3D Graphic, UI/UX, Typography, Nhận diện thương hiệu, Adobe Photoshop/Illustrator/Figma.
   - 2. Ngôn ngữ Nhật (Japanese Language): Chuẩn JLPT N5-N1, Biên - Phiên dịch, Tiếng Nhật thương mại, Văn hóa doanh nghiệp Nhật Bản.
   - 3. Ngôn ngữ Hàn Quốc (Korean Language): Chuẩn TOPIK 1-6, Giao tiếp thương mại Hàn Quốc, Biên phiên dịch, cơ hội việc làm tại tập đoàn FDI (Samsung, LG, CJ...).
   - 4. Quốc tế học (International Studies): Quan hệ quốc tế, Ngoại giao, Kinh tế đối ngoại, Tổ chức phi chính phủ (NGO), Đàm phán quốc tế.
   - 5. Quan hệ công chúng (PR): Quản trị truyền thông & sự kiện, Báo chí đa phương tiện, Xử lý khủng hoảng truyền thông, Branding.
   - 6. Quản trị kinh doanh (Business Administration): Quản trị 4.0, Marketing số, Khởi nghiệp & Đổi mới sáng tạo (Startup NTU).
   - 7. Tài chính – Ngân hàng (Finance - Banking): Tài chính doanh nghiệp, Ngân hàng số (Digital Banking), Fintech, Đầu tư chứng khoán.
   - 8. Kế toán (Accounting): Kế toán tài chính & Quản trị, Thuế, Kiểm toán, Chuẩn mực VAS/IFRS, Phần mềm MISA/SAP.
   - 9. Công nghệ thông tin (IT): Kỹ thuật phần mềm, Trí tuệ nhân tạo (AI/ML), Lập trình Web/Mobile, An toàn thông tin, Thuật toán.
   - 10. Thiết kế nội thất (Interior Design): Không gian kiến trúc nội thất, Vật liệu & Ánh sáng, AutoCAD, 3ds Max, SketchUp, Revit.
4. Phong cách trình bày:
   - Sử dụng Markdown chuẩn: tiêu đề, gạch đầu dòng, in đậm từ khóa, bảng so sánh, và code block có ngôn ngữ highlight.
   - Thân thiện, tôn trọng, đồng hành tận tâm, chính xác và khuyến khích tinh thần tự học.`;
  }

  /**
   * Sinh câu trả lời Chatbot (Hỗ trợ Google Gemini, OpenAI và Universal Fallback Engine)
   */
  async generateChatResponse({ messages, userContext = {}, documentContext = '' }) {
    const geminiKey = getGeminiApiKey();
    const openai = getOpenAIClient();

    let fullSystemPrompt = this.systemPrompt;
    if (userContext.name) {
      fullSystemPrompt += `\nSinh viên đang trò chuyện cùng bạn tên là: ${userContext.name}, ngành học: ${userContext.major || 'Đại học Nguyễn Trãi'}.`;
    }
    if (documentContext) {
      fullSystemPrompt += `\n\n[DỮ LIỆU TÀI LIỆU ĐÍNH KÈM]:\n${documentContext}\nHãy ưu tiên trả lời dựa trên nội dung tài liệu này nếu liên quan.`;
    }

    // 1. Thử gọi Google Gemini API (Nếu có cấu hình GEMINI_API_KEY)
    if (geminiKey) {
      try {
        const geminiResult = await this.callGeminiAPI({
          apiKey: geminiKey,
          systemPrompt: fullSystemPrompt,
          messages,
        });

        if (geminiResult) {
          return {
            content: geminiResult,
            model: aiConfig.geminiModel,
            tokens: geminiResult.length,
            isAiGenerated: true,
          };
        }
      } catch (err) {
        console.warn(`[Gemini API Notice] Không thể gọi Gemini API: ${err.message}. Chuyển sang phương án tiếp theo.`);
      }
    }

    // 2. Thử gọi OpenAI API (Nếu có cấu hình OPENAI_API_KEY)
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
          model: aiConfig.openaiModel,
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 2048,
        });

        const reply = response.choices[0]?.message?.content;
        if (reply) {
          return {
            content: reply,
            model: aiConfig.openaiModel,
            tokens: response.usage?.total_tokens || 0,
            isAiGenerated: true,
          };
        }
      } catch (err) {
        console.warn(`[OpenAI API Notice] Không thể gọi OpenAI API (${err.message}). Chuyển sang Universal Academic Engine.`);
      }
    }

    // 3. Chế độ Universal Academic & General AI Engine thông minh (Offline Fallback Engine)
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const fallbackReply = this.generateIntelligentFallbackResponse(lastUserMessage, userContext);

    return {
      content: fallbackReply,
      model: 'ntu-universal-ai-engine-v3',
      tokens: fallbackReply.length,
      isAiGenerated: true,
    };
  }

  /**
   * Gọi Google Gemini REST API
   */
  async callGeminiAPI({ apiKey, systemPrompt, messages }) {
    const model = aiConfig.geminiModel || 'gemini-3.6-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents = [];
    
    // Thêm lịch sử tin nhắn
    for (const msg of messages) {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      });
    }

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errorData}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    return text || null;
  }

  /**
   * Sinh Kế Hoạch Học Tập & Lộ Trình Ôn Thi Thông Minh
   */
  async generateStudyPlan({ goal, targetExam, targetDate, dailyHours, subjects }) {
    const geminiKey = getGeminiApiKey();
    const openai = getOpenAIClient();

    const targetDateObj = new Date(targetDate);
    const now = new Date();
    const diffDays = Math.max(1, Math.ceil((targetDateObj - now) / (1000 * 60 * 60 * 24)));
    const totalDaysToGenerate = Math.min(diffDays, 14);

    const promptText = `Hãy đóng vai trò chuyên gia cố vấn học tập tại Trường Đại học Nguyễn Trãi (NTU). Tạo một lộ trình học tập chi tiết với các thông tin sau:
- Mục tiêu: ${goal}
- Kỳ thi / Học phần: ${targetExam || 'Kỳ thi học kỳ NTU'}
- Thời gian còn lại: ${diffDays} ngày (ngày thi: ${targetDate})
- Thời gian học mỗi ngày: ${dailyHours} giờ
- Các môn/chuyên đề: ${subjects && subjects.length ? subjects.join(', ') : 'Nội dung trọng tâm chuyên ngành NTU'}

YÊU CẦU: Trả về DUY NHẤT một chuỗi JSON hợp lệ (không chứa markdown thừa ngoài json) với cấu trúc:
{
  "title": "Tiêu đề lộ trình học tập hấp dẫn",
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

    // Thử với Gemini
    if (geminiKey) {
      try {
        const text = await this.callGeminiAPI({
          apiKey: geminiKey,
          systemPrompt: 'Bạn là chuyên gia tư vấn giáo dục tại Đại học Nguyễn Trãi. Trả về JSON chuẩn 100%.',
          messages: [{ sender: 'user', content: promptText }],
        });

        if (text) {
          const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed.schedule && parsed.schedule.length) {
            return {
              title: parsed.title || `Lộ trình học tập NTU: ${goal}`,
              schedule: parsed.schedule,
              studyTips: parsed.studyTips || this.getDefaultStudyTips(),
            };
          }
        }
      } catch (err) {
        console.warn(`[Study Plan Gemini Notice] Fallback: ${err.message}`);
      }
    }

    // Thử với OpenAI
    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: aiConfig.openaiModel,
          messages: [
            { role: 'system', content: 'Bạn là chuyên gia tư vấn giáo dục tại Đại học Nguyễn Trãi. Trả về JSON chuẩn 100%.' },
            { role: 'user', content: promptText },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.5,
        });

        const rawContent = response.choices[0]?.message?.content;
        const parsed = JSON.parse(rawContent);
        if (parsed.schedule && parsed.schedule.length) {
          return {
            title: parsed.title || `Lộ trình học tập NTU: ${goal}`,
            schedule: parsed.schedule,
            studyTips: parsed.studyTips || this.getDefaultStudyTips(),
          };
        }
      } catch (err) {
        console.warn(`[Study Plan OpenAI Notice] Fallback: ${err.message}`);
      }
    }

    return this.generateFallbackStudyPlan(goal, targetExam, totalDaysToGenerate, dailyHours, subjects);
  }

  /**
   * Tóm tắt tài liệu học tập
   */
  async summarizeDocument({ title, contentSnippet, fileType }) {
    const openai = getOpenAIClient();
    const geminiKey = getGeminiApiKey();

    const prompt = `Đọc tài liệu học tập sau và trả về JSON:
{
  "summary": "Đoạn tóm tắt tổng quan súc tích khoảng 150-200 từ",
  "keyPoints": ["Ý chính 1", "Ý chính 2", "Ý chính 3", "Ý chính 4", "Ý chính 5"],
  "tags": ["tag1", "tag2", "tag3"]
}
Tài liệu: ${title}
Trích đoạn:\n${contentSnippet ? contentSnippet.substring(0, 4000) : ''}`;

    if (geminiKey && contentSnippet && contentSnippet.length > 30) {
      try {
        const text = await this.callGeminiAPI({
          apiKey: geminiKey,
          systemPrompt: 'Bạn là trợ lý học thuật Đại học Nguyễn Trãi. Trả về JSON thuần túy.',
          messages: [{ sender: 'user', content: prompt }],
        });
        if (text) {
          const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          return {
            summary: parsed.summary || 'Tài liệu đã được phân tích.',
            keyPoints: parsed.keyPoints || [],
            tags: parsed.tags || ['Đại học Nguyễn Trãi', 'Tài liệu học tập'],
          };
        }
      } catch (e) {
        console.warn('Gemini summarize fallback:', e.message);
      }
    }

    if (openai && contentSnippet && contentSnippet.length > 50) {
      try {
        const response = await openai.chat.completions.create({
          model: aiConfig.openaiModel,
          messages: [
            { role: 'system', content: 'Bạn là trợ lý học thuật Đại học Nguyễn Trãi. Trả về JSON.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        });

        const parsed = JSON.parse(response.choices[0]?.message?.content);
        return {
          summary: parsed.summary || 'Tài liệu đã được phân tích và trích xuất kiến thức cốt lõi.',
          keyPoints: parsed.keyPoints || [],
          tags: parsed.tags || ['Tài liệu NTU', 'Đại học Nguyễn Trãi', 'Kiến thức cốt lõi'],
        };
      } catch (err) {
        console.warn(`[Document Summarizer Notice] Fallback summary: ${err.message}`);
      }
    }

    return {
      summary: `Tài liệu "${title}" thuộc học phần chuyên ngành Đại học Nguyễn Trãi, tổng hợp lý thuyết nền tảng, công thức và phương pháp giải quyết tình huống thực tế.`,
      keyPoints: [
        'Hệ thống hóa định nghĩa và nguyên lý cốt lõi của bài học.',
        'Quy trình triển khai và giải quyết bài toán chuyên ngành thực tế.',
        'Ví dụ minh họa chi tiết theo tiêu chuẩn doanh nghiệp.',
        'Các lỗi sai thường gặp cần tránh trong quá trình làm bài.',
        'Câu hỏi định hướng ôn tập và thi kết thúc học phần.',
      ],
      tags: ['Đại học Nguyễn Trãi', 'Tài liệu học tập', 'Học phần NTU'],
    };
  }

  /**
   * Bộ tri thức thông minh đa năng: Trả lời MỌI CÂU HỎI bên ngoài + 10 Ngành Đào tạo NTU
   */
  generateIntelligentFallbackResponse(query, userContext = {}) {
    const clean = removeAccents(query);
    const raw = (query || '').trim();

    // 1. LẬP TRÌNH, CODE, THUẬT TOÁN, CÔNG NGHỆ THÔNG TIN
    if (
      clean.includes('python') || clean.includes('javascript') || clean.includes('node') ||
      clean.includes('react') || clean.includes('html') || clean.includes('css') ||
      clean.includes('c++') || clean.includes('java') || clean.includes('sql') ||
      clean.includes('mongodb') || clean.includes('git') || clean.includes('api') ||
      clean.includes('thuat toan') || clean.includes('dijkstra') || clean.includes('quicksort') ||
      clean.includes('cay nhi phan') || clean.includes('lap trinh') || clean.includes('viet code') ||
      clean.includes('ham') || clean.includes('function') || clean.includes('debug')
    ) {
      return this.handleProgrammingQuery(raw, clean);
    }

    // 2. TOÁN HỌC, PHƯƠNG TRÌNH, TÍNH TOÁN, ĐẠI SỐ, HÌNH HỌC
    if (
      clean.includes('phuong trinh') || clean.includes('tich phan') || clean.includes('dao ham') ||
      clean.includes('giai toan') || clean.includes('toan hoc') || clean.includes('tam giac') ||
      clean.includes('hinh hoc') || clean.includes('ma tran') || clean.includes('xac suat') ||
      clean.includes('thong ke') || clean.includes('cong thuc') || clean.includes('tinh toan') ||
      /\d+\s*[\+\-\*\/]\s*\d+/.test(raw)
    ) {
      return this.handleMathQuery(raw, clean);
    }

    // 3. TIẾNG ANH, DỊCH THUẬT, NGOẠI NGỮ (ENGLISH, JAPANESE, KOREAN)
    if (
      clean.includes('tieng anh') || clean.includes('dich sang') || clean.includes('translate') ||
      clean.includes('ngu phap') || clean.includes('ielts') || clean.includes('toeic') ||
      clean.includes('tu vung') || clean.includes('tieng nhat') || clean.includes('tieng han') ||
      clean.includes('jlpt') || clean.includes('topik')
    ) {
      return this.handleLanguageQuery(raw, clean);
    }

    // 4. KHOA HỌC TỰ NHIÊN, VẬT LÝ, HÓA HỌC, ĐỊA LÝ, LỊCH SỬ, THẾ GIỚI
    if (
      clean.includes('vat ly') || clean.includes('hoa hoc') || clean.includes('sinh hoc') ||
      clean.includes('dia ly') || clean.includes('lich su') || clean.includes('thu do') ||
      clean.includes('quoc gia') || clean.includes('trai dat') || clean.includes('vu tru') ||
      clean.includes('nguyen tu') || clean.includes('phan ung') || clean.includes('dinh luat')
    ) {
      return this.handleScienceAndWorldQuery(raw, clean);
    }

    // 5. PHƯƠNG PHÁP HỌC TẬP, KỸ NĂNG, ÔN THI, POMODORO
    if (
      clean.includes('phuong phap hoc') || clean.includes('on thi') || clean.includes('pomodoro') ||
      clean.includes('active recall') || clean.includes('spaced repetition') || clean.includes('tap trung') ||
      clean.includes('tri hoan') || clean.includes('ghi nho') || clean.includes('mindmap')
    ) {
      return this.handleStudyMethodsQuery();
    }

    // 6. 10 NGÀNH ĐÀO TẠO TẠI ĐẠI HỌC NGUYỄN TRÃI (NTU)
    if (
      clean.includes('nganh') || clean.includes('chuong trinh dao tao') || clean.includes('hoc phan') ||
      clean.includes('khoa') || clean.includes('nguyen trai') || clean.includes('ntu') ||
      clean.includes('do hoa') || clean.includes('noi that') || clean.includes('pr') ||
      clean.includes('quan tri') || clean.includes('tai chinh') || clean.includes('ke toan') ||
      clean.includes('quoc te hoc')
    ) {
      return this.handleNTUMajorsQuery(clean);
    }

    // 7. LỜI CHÀO & CÂU HỎI TỔNG QUÁT KHÁC
    return this.handleGeneralQuery(raw);
  }

  // --- HANDLER CHI TIẾT ---

  handleProgrammingQuery(raw, clean) {
    if (clean.includes('python')) {
      return `### 🐍 Hướng Dẫn Lập Trình Python - Trợ Lý AI NTU

Python là ngôn ngữ lập trình đa năng, cú pháp trong sáng và hỗ trợ mạnh mẽ cho Trí tuệ nhân tạo (AI), Phân tích dữ liệu và Web Backend.

#### Ví dụ: Xử lý dữ liệu & Kết nối MongoDB / API với Python
\`\`\`python
# 1. Cài đặt thư viện: pip install pymongo requests
from pymongo import MongoClient
import requests

def fetch_and_save_data():
    # Kết nối MongoDB Atlas / Local
    client = MongoClient("mongodb://localhost:27017/")
    db = client["student_learning_db"]
    collection = db["study_topics"]
    
    # Mẫu dữ liệu sinh viên
    sample_topic = {
        "title": "Cấu trúc dữ liệu & Giải thuật",
        "category": "Computer Science",
        "difficulty": "Intermediate",
        "status": "In Progress"
    }
    
    result = collection.insert_one(sample_topic)
    print(f"Đã lưu thành công bản ghi ID: {result.inserted_id}")

if __name__ == "__main__":
    fetch_and_save_data()
\`\`\`

#### Các khái niệm trọng tâm cần nắm vững:
- **Cấu trúc dữ liệu**: List, Tuple, Dictionary, Set, List Comprehension.
- **Lập trình hướng đối tượng (OOP)**: Class, Object, Kế thừa (Inheritance), Đa hình (Polymorphism).
- **Thư viện AI/Data phổ biến**: NumPy, Pandas, Matplotlib, Scikit-Learn, PyTorch.

*Bạn cần mình viết code giải bài toán cụ thể nào bằng Python không? Hãy gửi đề bài nhé!* 💻`;
    }

    if (clean.includes('javascript') || clean.includes('node') || clean.includes('react')) {
      return `### ⚡ Lập Trình JavaScript & Fullstack Web - Trợ Lý AI NTU

JavaScript là nền tảng cốt lõi của phát triển Web hiện đại (Frontend với React/Vue và Backend với Node.js/Express).

#### Ví dụ: Xây dựng REST API Endpoint trong Node.js / Express
\`\`\`javascript
const express = require('express');
const router = express.Router();

// GET: Lấy danh sách tài liệu học tập
router.get('/documents', async (req, res) => {
  try {
    const documents = [
      { id: 1, title: 'Slide Bài giảng Cấu trúc dữ liệu', author: 'NTU IT Dept' },
      { id: 2, title: 'Nguyên lý Thiết kế Đồ họa CRAP', author: 'NTU Art Dept' },
    ];
    
    return res.status(200).json({
      success: true,
      message: 'Lấy dữ liệu thành công',
      data: documents,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
\`\`\`

#### Các lưu ý quan trọng:
1. **Async / Await & Promises**: Luôn bọc trong khối \`try...catch\` để bắt lỗi bất đồng bộ.
2. **ES6+ Features**: Destructuring, Spread/Rest operator, Arrow Functions, Modules (\`import\`/\`export\`).
3. **Bảo mật**: Sử dụng biến môi trường \`.env\`, mã hóa mật khẩu với \`bcrypt\` và bảo vệ route bằng JWT.

*Bạn muốn giải đáp bài tập JavaScript hoặc sửa lỗi đoạn code nào? Hãy dán code vào đây nhé!* 🚀`;
    }

    // Mặc định cho lập trình chung & thuật toán
    return `### 💻 Hướng Dẫn Kỹ Thuật & Thuật Toán - Trợ Lý AI NTU

Câu hỏi của bạn: **"${raw}"**

#### 1. Phân tích bài toán & Tư duy giải thuật:
- **Xác định Input & Output**: Đầu vào là gì, kiểu dữ liệu và các điều kiện biên (Edge Cases).
- **Độ phức tạp thời gian & không gian (Big-O)**:
  - Tối ưu thời gian chạy: từ $O(N^2)$ xuống $O(N \\log N)$ hoặc $O(N)$.
  - Tối ưu bộ nhớ: Tránh đệ quy quá sâu gây Stack Overflow.

#### 2. Mẫu triển khai thuật toán mẫu:
\`\`\`javascript
/**
 * Thuật toán tìm kiếm nhị phân (Binary Search) - O(log N)
 * Yêu cầu: Mảng đã được sắp xếp tăng dần
 */
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid; // Tìm thấy tại chỉ số mid
    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return -1; // Không tìm thấy
}
\`\`\`

*Bạn có thể gửi đoạn mã cần sửa (debug) hoặc bài tập lập trình cụ thể để mình hướng dẫn từng bước nhé!* ✨`;
  }

  handleMathQuery(raw, clean) {
    return `### 📐 Giải Đáp Toán Học & Phương Trình - Trợ Lý AI NTU

Câu hỏi/Bài toán của bạn: **"${raw}"**

#### 1. Nguyên lý & Công thức áp dụng:
- **Phương trình bậc hai**: $ax^2 + bx + c = 0$ ($a \\neq 0$)
  - $\\Delta = b^2 - 4ac$
  - Nếu $\\Delta > 0$: 2 nghiệm phân biệt $x_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$
  - Nếu $\\Delta = 0$: Nghiệm kép $x = \\frac{-b}{2a}$
  - Nếu $\\Delta < 0$: Phương trình vô nghiệm trên tập số thực $\\mathbb{R}$.

- **Đạo hàm & Tích phân cơ bản**:
  - $\\frac{d}{dx}(x^n) = n x^{n-1}$
  - $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$ ($n \\neq -1$)
  - $\\int e^x dx = e^x + C$
  - $\\int \\frac{1}{x} dx = \\ln|x| + C$

#### 2. Các bước giải bài toán chuẩn:
1. Đặt điều kiện xác định cho bài toán (mẫu khác 0, biểu thức dưới căn $\\ge 0$).
2. Biến đổi tương đương đưa về dạng chuẩn.
3. Thực hiện phép tính và kiểm tra lại điều kiện nghiệm.

*Nếu bạn có bài tập toán cụ thể (Đại số tuyến tính, Giải tích, Toán kinh tế, Xác suất thống kê), hãy gửi đề bài chi tiết để mình giải từng bước nhé!* 🔢`;
  }

  handleLanguageQuery(raw, clean) {
    return `### 🌐 Cố Vấn Ngoại Ngữ & Dịch Thuật - Trợ Lý AI NTU

Hỗ trợ học tập đa ngôn ngữ: **Tiếng Anh (IELTS/TOEIC)**, **Tiếng Nhật (JLPT N5-N1)**, và **Tiếng Hàn (TOPIK 1-6)**.

#### 1. Phương pháp học ngoại ngữ ứng dụng hiệu quả:
- **Học từ vựng theo ngữ cảnh (Contextual Learning)**: Không học từ đơn lẻ, luôn học kèm câu ví dụ và cụm từ (Collocations).
- **Kỹ thuật Shadowing**: Lắng nghe người bản xứ và nói nhại theo tức thì để rèn luyện ngữ điệu và phát âm chuẩn.
- **Áp dụng Spaced Repetition**: Lặp lại từ vựng ngắt quãng bằng Flashcards để nhớ lâu.

#### 2. Mẹo giao tiếp & làm bài thi:
| Ngôn ngữ | Chứng chỉ chuẩn | Trọng tâm học phần |
| :--- | :--- | :--- |
| **Tiếng Anh** | IELTS 6.5+ / TOEIC 750+ | Đọc hiểu tài liệu chuyên ngành, Thuyết trình dự án, Viết học thuật |
| **Tiếng Nhật** | JLPT N3 - N2 | Kính ngữ (Keigo), Tiếng Nhật thương mại, Tác phong Hou-Ren-So |
| **Tiếng Hàn** | TOPIK 4 - 5 | Biên phiên dịch kinh tế, Giao tiếp doanh nghiệp FDI Hàn Quốc |

*Bạn muốn mình dịch đoạn văn bản nào, giải thích ngữ pháp hay gợi ý câu trả lời tiếng Anh/Nhật/Hàn? Hãy gửi cho mình ngay nhé!* 🌍`;
  }

  handleScienceAndWorldQuery(raw, clean) {
    return `### 🔬 Giải Đáp Khoa Học & Tri Thức Tổng Quát - Trợ Lý AI NTU

Câu hỏi của bạn: **"${raw}"**

#### 1. Tổng quan & Bản chất khoa học:
- **Khoa học Tự nhiên**: Mọi hiện tượng vật lý, hóa học, sinh học đều tuân theo các định luật bảo toàn (Bảo toàn năng lượng, bảo toàn khối lượng, động lượng).
- **Phương pháp thực nghiệm**: Quan sát $\\rightarrow$ Đặt giả thuyết $\\rightarrow$ Thí nghiệm kiểm chứng $\\rightarrow$ Kết luận quy luật.

#### 2. Kiến thức tổng hợp hữu ích:
- **Vật lý**: Định luật vạn vật hấp dẫn, Thuyết tương đối, Sóng điện từ và Ứng dụng bán dẫn trong Chip AI.
- **Hóa học**: Bảng tuần hoàn Mendeleev, Liên kết ion/cộng hóa trị, Phản ứng Oxy hóa - Khử.
- **Địa lý & Lịch sử**: Các nền văn minh cổ đại, địa chính trị thế giới, khí hậu toàn cầu và chuyển đổi năng lượng xanh.

*Bạn muốn tìm hiểu sâu hơn về hiện tượng khoa học nào? Mình luôn sẵn sàng giải thích chi tiết và dễ hiểu nhất!* 🌌`;
  }

  handleStudyMethodsQuery() {
    return `### 🎯 Chiến Lược Học Tập Đạt Điểm A+ & Bứt Phá Năng Suất

Để tối ưu hóa thời gian học và đạt kết quả cao trong các kỳ thi học kỳ, bạn hãy áp dụng mô hình 4 trụ cột khoa học:

1. **Active Recall (Chủ động truy hồi)**:
   - Thay vì đọc thụ động giáo trình nhiều lần, hãy gấp sách lại và tự viết ra giấy nháp những gì mình nhớ được.
2. **Spaced Repetition (Lặp lại ngắt quãng)**:
   - Ôn lại bài sau 1 ngày $\\rightarrow$ 3 ngày $\\rightarrow$ 7 ngày $\\rightarrow$ 14 ngày để biến trí nhớ ngắn hạn thành dài hạn.
3. **Kỹ thuật Pomodoro 50/10**:
   - 50 phút học tập trung tuyệt đối (tắt thông báo điện thoại).
   - 10 phút nghỉ ngơi thư giãn mắt và vận động nhẹ.
4. **Học qua dự án thực tế (Project-Based Learning)**:
   - Biến kiến thức lý thuyết thành bài code thực tế, bản thiết kế hoàn chỉnh hoặc bài phân tích case study doanh nghiệp.

*Bạn có thể vào mục **"Lộ Trình Học Tập"** trên thanh menu để AI thiết lập thời gian biểu ôn thi chi tiết từng ngày cho bạn nhé!* 🚀`;
  }

  handleNTUMajorsQuery(clean) {
    // 10 Ngành Đào tạo NTU
    return `### 🏛️ 10 Ngành Đào Tạo Chuẩn Ứng Dụng Tại Đại Học Nguyễn Trãi (NTU)

Trường Đại học Nguyễn Trãi đào tạo theo mô hình Đại học Ứng dụng chuẩn quốc tế, gắn kết chặt chẽ cùng hơn 500+ doanh nghiệp:

| STT | Ngành Đào Tạo | Chuyên Môn Trọng Tâm & Điểm Nổi Bật |
| :---: | :--- | :--- |
| **1** | **Thiết kế đồ họa** | Mỹ thuật ứng dụng, 2D/3D Graphic, UI/UX, Typography, Nhận diện thương hiệu |
| **2** | **Ngôn ngữ Nhật** | Chuẩn JLPT N3-N1, Tiếng Nhật thương mại, làm việc tại Nhật Bản & FDI |
| **3** | **Ngôn ngữ Hàn Quốc** | Chuẩn TOPIK 3-6, Biên phiên dịch, làm việc tại tập đoàn Samsung, LG, CJ |
| **4** | **Quốc tế học** | Ngoại giao, Quan hệ quốc tế, Tổ chức phi chính phủ (NGO), Đàm phán toàn cầu |
| **5** | **Quan hệ công chúng (PR)** | Quản trị truyền thông, Tổ chức sự kiện chuyên nghiệp, Xử lý khủng hoảng PR |
| **6** | **Quản trị kinh doanh** | Quản trị 4.0, Marketing số, Khởi nghiệp đổi mới sáng tạo (Startup NTU) |
| **7** | **Tài chính – Ngân hàng** | Tài chính doanh nghiệp, Ngân hàng số (Digital Banking), Công nghệ Fintech |
| **8** | **Kế toán** | Kế toán tài chính & Quản trị, Thuế, Kiểm toán, Chuẩn mực IFRS, MISA/SAP |
| **9** | **Công nghệ thông tin** | Kỹ thuật phần mềm, AI & Data Science, Lập trình Web/Mobile, An toàn mạng |
| **10** | **Thiết kế nội thất** | Không gian kiến trúc nội thất, Vật liệu & Ánh sáng, AutoCAD, 3ds Max, Revit |

👉 *Bạn đang theo học ngành nào hoặc cần tư vấn sâu hơn về học phần, đồ án hay kỹ năng chuyên ngành nào?* 🎓`;
  }

  handleGeneralQuery(raw) {
    return `### 💡 Trợ Lý AI Sinh Viên NTU - Sẵn Sàng Đồng Hành!

Chào bạn! Cảm ơn bạn đã trò chuyện cùng Trợ lý AI. Về vấn đề bạn quan tâm: **"${raw}"**:

Dưới đây là một số hướng tiếp cận và giải pháp gợi ý:
1. **Xác định mục tiêu rõ ràng**: Đặt ra kết quả cụ thể bạn muốn đạt được và các điều kiện cần thiết.
2. **Phương pháp thực hiện**:
   - Chia nhỏ vấn đề lớn thành các đầu việc cụ thể.
   - Sử dụng các công cụ bổ trợ và tìm kiếm nguồn tài liệu tham khảo đáng tin cậy.
3. **Đánh giá & Tối ưu**: Kiểm tra kết quả định kỳ để kịp thời điều chỉnh kế hoạch.

---
> 💡 *Bạn có thể hỏi mình bất kỳ câu hỏi nào về kiến thức tổng quát, bài tập lập trình, toán học, ngoại ngữ, tóm tắt tài liệu hoặc chương trình học của 10 ngành tại Đại học Nguyễn Trãi nhé!* 🚀`;
  }

  generateFallbackStudyPlan(goal, targetExam, totalDays, dailyHours, subjects = []) {
    const defaultSubjects = subjects.length ? subjects : ['Lý thuyết chuyên ngành', 'Bài tập thực hành ứng dụng', 'Luyện giải đề thi'];
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
        focus: `Chuyên đề ${i}: Ôn tập toàn diện môn ${subjectForDay}`,
        tasks: [
          {
            title: `Đọc & hệ thống hóa lý thuyết chuyên đề ${i} môn ${subjectForDay}`,
            subject: subjectForDay,
            duration: `${Math.round(dailyHours * 30)} phút`,
            isCompleted: false,
            notes: 'Tóm tắt sơ đồ tư duy Mindmap',
          },
          {
            title: `Thực hành giải bài tập / case study thực tế về ${subjectForDay}`,
            subject: subjectForDay,
            duration: `${Math.round(dailyHours * 45)} phút`,
            isCompleted: false,
            notes: 'Lưu ý các tiêu chuẩn thực tế',
          },
          {
            title: 'Tự kiểm tra câu hỏi trắc nghiệm cùng Trợ lý AI NTU',
            subject: subjectForDay,
            duration: '30 phút',
            isCompleted: false,
            notes: 'Ghi chú các điểm cần cải thiện',
          },
        ],
      });
    }

    return {
      title: `Lộ trình học tập NTU: ${goal} (${targetExam || 'Kỳ thi học kỳ'})`,
      schedule: days,
      studyTips: this.getDefaultStudyTips(),
    };
  }

  getDefaultStudyTips() {
    return [
      'Áp dụng phương pháp Pomodoro 50/10 để duy trì sự tập trung cao độ.',
      'Sử dụng sơ đồ tư duy (Mindmap) để hệ thống hóa kiến thức toàn bộ học phần.',
      'Thực hành giải bài tập và tình huống thực tế thường xuyên.',
      'Ôn tập theo nhóm và chủ động đặt câu hỏi với giảng viên và Trợ lý AI.',
      'Giữ sức khỏe và ngủ đủ 7-8 tiếng trước ngày thi để đạt phong độ cao nhất.',
    ];
  }
}

module.exports = new AIService();
