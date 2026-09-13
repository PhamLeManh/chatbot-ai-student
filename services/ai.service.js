const { getOpenAIClient, aiConfig } = require('../config/ai');

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
    this.systemPrompt = `Bạn là Trợ lý AI Sinh Viên & Tư Vấn Tuyển Sinh Thông Minh của Trường Đại học Nguyễn Trãi (Nguyen Trai University - NTU).
Trường Đại học Nguyễn Trãi là trường đại học ứng dụng hàng đầu (Địa chỉ: 28A Lê Trọng Tấn, Hà Đông, Hà Nội), đào tạo sinh viên trở thành công dân toàn cầu với chương trình gắn kết thực tiễn doanh nghiệp.

Nhiệm vụ trọng tâm của bạn:
1. Tư vấn tuyển sinh, định hướng nghề nghiệp, lộ trình đào tạo và cơ hội việc làm cho 10 ngành đào tạo chính của Trường Đại học Nguyễn Trãi:
   - 1. **Thiết kế đồ họa** (Graphic Design): Mỹ thuật ứng dụng, 2D/3D Graphic, UI/UX, Typography, Nhận diện thương hiệu, Adobe Photoshop/Illustrator/Figma/InDesign.
   - 2. **Ngôn ngữ Nhật** (Japanese Language): Chuẩn JLPT N5-N1, Biên - Phiên dịch, Tiếng Nhật thương mại, Văn hóa doanh nghiệp Nhật Bản, cơ hội làm việc tại các tập đoàn Nhật Bản.
   - 3. **Ngôn ngữ Hàn Quốc** (Korean Language): Chuẩn TOPIK 1-6, Giao tiếp thương mại Hàn Quốc, Biên phiên dịch, cơ hội việc làm tại doanh nghiệp FDI Hàn Quốc (Samsung, LG, CJ...).
   - 4. **Quốc tế học** (International Studies): Quan hệ quốc tế, Ngoại giao, Kinh tế đối ngoại, Tổ chức phi chính phủ (NGO), Chính sách công & Kỹ năng đàm phán quốc tế.
   - 5. **Quan hệ công chúng** (Public Relations - PR): Quản trị truyền thông & sự kiện, Báo chí truyền thông đa phương tiện, Xử lý khủng hoảng truyền thông, Branding & Chiến lược IMC.
   - 6. **Quản trị kinh doanh** (Business Administration): Quản trị doanh nghiệp 4.0, Marketing số, Khởi nghiệp & Đổi mới sáng tạo (Startup), Quản trị chuỗi cung ứng & Bán lẻ.
   - 7. **Tài chính – Ngân hàng** (Finance - Banking): Tài chính doanh nghiệp, Ngân hàng số (Digital Banking), Công nghệ tài chính (Fintech), Đầu tư chứng khoán & Quản trị rủi ro.
   - 8. **Kế toán** (Accounting): Kế toán tài chính & Quản trị, Thuế doanh nghiệp, Kiểm toán, Chuẩn mực kế toán VAS/IFRS, Phần mềm MISA/SAP.
   - 9. **Công nghệ thông tin** (Information Technology): Kỹ thuật phần mềm, Trí tuệ nhân tạo (AI & Data Science), An toàn thông tin, Lập trình Web/Mobile, Điện toán đám mây.
   - 10. **Thiết kế nội thất** (Interior Design): Quy hoạch không gian kiến trúc nội thất, Vật liệu & Ánh sáng, AutoCAD, 3ds Max, SketchUp, Revit, V-Ray, Thiết kế nội thất thương mại & nhà ở.
2. Hỗ trợ sinh viên NTU giải đáp bài tập, viết code, dịch thuật ngoại ngữ, giải toán kinh tế và lập kế hoạch ôn thi bứt phá.
3. Trình bày câu trả lời rõ ràng bằng Markdown chuẩn: tiêu đề mục, gạch đầu dòng, bảng so sánh và code block có highlight cú pháp.
4. Luôn giữ phong thái thân thiện, đồng hành tận tâm, tự hào về chất lượng đào tạo của Trường Đại học Nguyễn Trãi.`;
  }

  /**
   * Sinh câu trả lời Chatbot
   */
  async generateChatResponse({ messages, userContext = {}, documentContext = '' }) {
    const openai = getOpenAIClient();

    let fullSystemPrompt = this.systemPrompt;
    if (userContext.name) {
      fullSystemPrompt += `\nSinh viên/Thí sinh đang trao đổi với bạn tên là: ${userContext.name}, ngành quan tâm: ${userContext.major || 'Đại học Nguyễn Trãi'}.`;
    }
    if (documentContext) {
      fullSystemPrompt += `\n\n[DỮ LIỆU TÀI LIỆU ĐÍNH KÈM]:\n${documentContext}\nHãy ưu tiên trả lời dựa trên nội dung tài liệu này nếu liên quan.`;
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
        console.warn(`[OpenAI API Notice] Không thể gọi OpenAI API (${err.message}). Chuyển sang AI NTU Engine dự phòng.`);
      }
    }

    // 2. Chế độ AI NTU Academic Engine dự phòng
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const fallbackReply = this.generateAcademicFallbackResponse(lastUserMessage, userContext);

    return {
      content: fallbackReply,
      model: 'ntu-academic-engine-v2',
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
    const totalDaysToGenerate = Math.min(diffDays, 14);

    const promptText = `Hãy đóng vai trò chuyên gia cố vấn học tập tại Trường Đại học Nguyễn Trãi (NTU). Tạo một lộ trình học tập chi tiết với các thông tin sau:
- Mục tiêu: ${goal}
- Kỳ thi / Học phần: ${targetExam || 'Kỳ thi học kỳ NTU'}
- Thời gian còn lại: ${diffDays} ngày (ngày thi: ${targetDate})
- Thời gian học mỗi ngày: ${dailyHours} giờ
- Các môn/chuyên đề: ${subjects && subjects.length ? subjects.join(', ') : 'Nội dung trọng tâm chuyên ngành NTU'}

YÊU CẦU: Trả về DUY NHẤT một chuỗi JSON hợp lệ với cấu trúc:
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

    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: aiConfig.model,
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
        console.warn(`[Study Plan AI Notice] Fallback to rule-based plan generator: ${err.message}`);
      }
    }

    return this.generateFallbackStudyPlan(goal, targetExam, totalDaysToGenerate, dailyHours, subjects);
  }

  /**
   * Tóm tắt tài liệu học tập
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
              content: `Bạn là trợ lý học thuật Đại học Nguyễn Trãi. Đọc tài liệu học tập sau và trả về JSON:
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
          tags: parsed.tags || ['Tài liệu NTU', 'Đại học Nguyễn Trãi', 'Kiến thức cốt lõi'],
        };
      } catch (err) {
        console.warn(`[Document Summarizer Notice] Fallback summary: ${err.message}`);
      }
    }

    return {
      summary: `Tài liệu "${title}" thuộc chương trình đào tạo của Trường Đại học Nguyễn Trãi, tổng hợp các nguyên lý nền tảng, công thức áp dụng và bài tập tình huống thực tế giúp sinh viên củng cố kiến thức vững chắc.`,
      keyPoints: [
        'Hệ thống hóa các định nghĩa và kiến thức trọng tâm của học phần.',
        'Các phương pháp thực hành và giải quyết bài toán ứng dụng thực tế.',
        'Ví dụ minh họa chi tiết theo tiêu chuẩn doanh nghiệp.',
        'Lưu ý các lỗi sai thường gặp của sinh viên trong quá trình làm bài.',
        'Bộ câu hỏi định hướng ôn tập và thi kết thúc học phần.',
      ],
      tags: ['Đại học Nguyễn Trãi', 'Tài liệu học tập', 'Học phần trọng tâm', 'NTU'],
    };
  }

  /**
   * Bộ tri thức chuyên sâu 10 Ngành Đào tạo Trường Đại học Nguyễn Trãi (NTU)
   */
  generateAcademicFallbackResponse(query, userContext = {}) {
    const raw = (query || '').normalize('NFC').toLowerCase();
    const clean = removeAccents(query);
    const studentName = userContext.name || 'bạn';

    // 1. NGÀNH 1: THIẾT KẾ ĐỒ HỌA
    if (
      clean.includes('thiet ke do hoa') ||
      clean.includes('graphic design') ||
      clean.includes('photoshop') ||
      clean.includes('illustrator') ||
      clean.includes('indesign') ||
      clean.includes('crap') ||
      clean.includes('typography') ||
      clean.includes('branding') ||
      clean.includes('ui/ux') ||
      (clean.includes('do hoa') && !clean.includes('noi that'))
    ) {
      return `### 🎨 Tư Vấn & Hướng Dẫn Ngành Thiết Kế Đồ Họa - Đại Học Nguyễn Trãi (NTU)

Ngành **Thiết kế đồ họa** tại Trường Đại học Nguyễn Trãi được thiết kế theo định hướng ứng dụng thực chiến, kết hợp giữa tư duy thẩm mỹ nghệ thuật và công nghệ đồ họa số hiện đại.

#### 1. Các mảng kiến thức & Kỹ năng cốt lõi:
- **Tư duy thị giác & Nguyên lý thiết kế (CRAP)**:
  - **Contrast (Tương phản)**: Tạo điểm nhấn phân cấp thị giác rõ ràng bằng độ tương phản màu sắc, hình khối và kích thước font chữ.
  - **Repetition (Lặp lại)**: Nhất quán màu sắc nhận diện, hệ thống lưới (*Grid System*) và kiểu chữ.
  - **Alignment (Căn chỉnh)**: Mọi chi tiết đều có trục gióng liên kết chặt chẽ.
  - **Proximity (Khoảng cách gần)**: Nhóm các thông tin có mối liên quan lại gần nhau.
- **Bộ công cụ phần mềm chuyên nghiệp**: Adobe Illustrator (Vector/Logo), Adobe Photoshop (Xử lý ảnh), Adobe InDesign (Dàn trang sách báo), Figma (UI/UX App/Web), After Effects (Motion Graphics).
- **Thiết kế bộ nhận diện thương hiệu (Brand Identity)**: Logo, Brand Guidelines, bao bì sản phẩm (Packaging), ấn phẩm truyền thông Marketing.

#### 2. Cơ hội nghề nghiệp sinh viên NTU:
- Chuyên viên thiết kế nhận diện thương hiệu (Brand Designer)
- Chuyên viên thiết kế giao diện và trải nghiệm người dùng (UI/UX Designer)
- Giám đốc nghệ thuật (Art Director) / Trưởng nhóm sáng tạo (Creative Lead) tại các Agency truyền thông, Nhà xuất bản, Doanh nghiệp lớn.

> 💡 *Sinh viên Thiết kế đồ họa NTU được tham gia triển lãm đồ án thực tế và xưởng sáng tạo doanh nghiệp ngay từ năm 2!*`;
    }

    // 2. NGÀNH 2: NGÔN NGỮ NHẬT
    if (
      clean.includes('ngon ngu nhat') ||
      clean.includes('tieng nhat') ||
      clean.includes('jlpt') ||
      clean.includes('hiragana') ||
      clean.includes('katakana') ||
      clean.includes('kanji') ||
      clean.includes('nhat ban')
    ) {
      return `### 🇯🇵 Tư Vấn & Hướng Dẫn Ngành Ngôn Ngữ Nhật - Đại Học Nguyễn Trãi (NTU)

Chương trình **Ngôn ngữ Nhật** tại NTU chú trọng đào tạo sinh viên thành thạo năng lực tiếng Nhật chuẩn JLPT N3-N1 cùng tác phong làm việc chuẩn doanh nghiệp Nhật Bản (Hou-Ren-So, văn hóa Omotenashi).

#### 1. Lộ trình đào tạo & Chuẩn đầu ra:
- **Năm 1 - Nền tảng**: Bảng chữ cái Hiragana, Katakana, cấu trúc ngữ pháp sơ cấp, đạt chuẩn JLPT N5–N4.
- **Năm 2 - Trung cấp & Giao tiếp**: Tích lũy ~650 chữ Hán Kanji, ngữ pháp trung cấp, đạt chuẩn JLPT N3.
- **Năm 3 - Chuyên ngành**: Tiếng Nhật thương mại (*Business Japanese*), Kỹ năng biên - phiên dịch, thực tập doanh nghiệp Nhật Bản.
- **Năm 4 - Nâng cao & Khóa luận**: Đạt chuẩn JLPT N2–N1, thành thạo đàm phán hợp đồng thương mại.

#### 2. Cấu trúc ngữ pháp tiếng Nhật căn bản:
- **Câu khẳng định**: Chủ ngữ + は + Vị ngữ + です (Ví dụ: 私はグエン・チャイ大学の学生です - *Tôi là sinh viên ĐH Nguyễn Trãi*).
- **Quy tắc chia động từ**: Nhóm 1 (Ngũ đoạn), Nhóm 2 (Nhất đoạn), Nhóm 3 (Bất quy tắc: する, くる).

#### 3. Cơ hội việc làm:
- Biên - Phiên dịch viên tại các tập đoàn Nhật Bản tại Việt Nam & Tokyo/Osaka.
- Quản lý dự án cầu nối IT Comtor / BrSE cho các công ty phần mềm Nhật Bản.
- Chuyên viên đối ngoại, xúc tiến thương mại Việt - Nhật.`;
    }

    // 3. NGÀNH 3: NGÔN NGỮ HÀN QUỐC
    if (
      clean.includes('ngon ngu han') ||
      clean.includes('tieng han') ||
      clean.includes('topik') ||
      clean.includes('hangul') ||
      clean.includes('han quoc') ||
      clean.includes('k-wave')
    ) {
      return `### 🇰🇷 Tư Vấn & Hướng Dẫn Ngành Ngôn Ngữ Hàn Quốc - Đại Học Nguyễn Trãi (NTU)

Ngành **Ngôn ngữ Hàn Quốc** tại NTU đón đầu làn sóng đầu tư FDI mạnh mẽ từ Hàn Quốc, đào tạo sinh viên đạt chuẩn năng lực tiếng Hàn TOPIK cấp độ cao và am hiểu sâu sắc văn hóa kinh doanh Hàn Quốc.

#### 1. Lộ trình chinh phục chuẩn TOPIK:
- **TOPIK I (Cấp 1-2)**: Làm quen bảng chữ cái Hangul (14 phụ âm, 10 nguyên âm), từ vựng đời sống và ngữ pháp giao tiếp thường nhật (아요/어요, 습니다/ㅂ니다).
- **TOPIK II (Cấp 3-4)**: Ngữ pháp trung cấp, kỹ năng viết luận ngắn 200-300 chữ, đọc hiểu tin tức xã hội và đàm phán kinh doanh.
- **TOPIK II (Cấp 5-6)**: Tiếng Hàn chuyên ngành kinh tế, thương mại, dịch thuật hội nghị và văn bản pháp lý.

#### 2. Ví dụ ngữ pháp giao tiếp chuẩn:
\`\`\`
- Cấu trúc: Danh từ + 은/는 + Danh từ + 입니다 (là ...)
  VD: 저는 응우옌짜이 대학교 학생입니다. (Tôi là sinh viên Đại học Nguyễn Trãi).
- Cấu trúc mục đích: Động từ + (으)러 가다/오다 (Đi/đến để làm gì)
\`\`\`

#### 3. Cơ hội nghề nghiệp:
- Thư ký, trợ lý giám đốc, chuyên viên nhân sự/kinh doanh tại các tập đoàn: Samsung, LG, Hyundai, Lotte, CJ, Posco...
- Biên dịch viên tài liệu, phiên dịch viên cabin hội nghị quốc tế.
- Hướng dẫn viên du lịch quốc tế, giảng viên tiếng Hàn.`;
    }

    // 4. NGÀNH 4: QUỐC TẾ HỌC
    if (
      clean.includes('quoc te hoc') ||
      clean.includes('quan he quoc te') ||
      clean.includes('ngoai giao') ||
      clean.includes('phi chinh phu') ||
      clean.includes('ngo') ||
      clean.includes('chinh sach doi ngoai')
    ) {
      return `### 🌐 Tư Vấn & Hướng Dẫn Ngành Quốc Tế Học - Đại Học Nguyễn Trãi (NTU)

Ngành **Quốc tế học** tại Trường Đại học Nguyễn Trãi trang bị cho sinh viên phông kiến thức sâu rộng về chính trị toàn cầu, ngoại giao, kinh tế quốc tế, luật pháp quốc tế và năng lực đàm phán đa phương.

#### 1. Nội dung đào tạo cốt lõi:
- **Lý thuyết Quan hệ Quốc tế**: Chủ nghĩa hiện thực, Chủ nghĩa tự do, Chủ nghĩa kiến tạo trong phân tích xung đột và hợp tác quốc tế.
- **Ngoại giao & Đàm phán quốc tế**: Lễ tân ngoại giao (*Diplomatic Protocol*), nghệ thuật soạn thảo công hàm, kỹ năng điều hành hội nghị quốc tế chuẩn mô hình Liên Hợp Quốc (Model UN).
- **Kinh tế quốc tế & Thương mại toàn cầu**: Hội nhập kinh tế thế giới, vai trò của WTO, ASEAN, CPTPP, EVFTA và các khối kinh tế mới nổi.
- **Hoạt động của các tổ chức quốc tế & Phi chính phủ (NGO)**: Quản trị dự án phát triển cộng đồng, biến đổi khí hậu và chính sách nhân đạo.

#### 2. Năng lực sinh viên tốt nghiệp NTU:
- Thành thạo ít nhất 1-2 ngoại ngữ (Tiếng Anh, Tiếng Nhật hoặc Tiếng Hàn).
- Tư duy phản biện sắc bén và khả năng phân tích sự kiện chính trị - kinh tế toàn cầu.

#### 3. Cơ hội việc làm:
- Chuyên viên đối ngoại tại các Bộ, Ngành, Sở Ngoại vụ và cơ quan đại diện ngoại giao.
- Quản lý dự án tại các Tổ chức Liên Hợp Quốc (UN, UNDP, UNESCO, UNICEF), các tổ chức phi chính phủ quốc tế (NGOs).
- Chuyên viên truyền thông đối ngoại, hợp tác quốc tế tại các tập đoàn đa quốc gia.`;
    }

    // 5. NGÀNH 5: QUAN HỆ CÔNG CHÚNG (PR)
    if (
      clean.includes('quan he cong chung') ||
      clean.includes(' pr') ||
      clean.startsWith('pr') ||
      clean.includes('khung hoang truyen thong') ||
      clean.includes('thong cao bao chi') ||
      clean.includes('to chuc su kien') ||
      (clean.includes('truyen thong') && !clean.includes('thong tin'))
    ) {
      return `### 📣 Tư Vấn & Hướng Dẫn Ngành Quan Hệ Công Chúng (PR) - Đại Học Nguyễn Trãi (NTU)

Ngành **Quan hệ công chúng (PR)** tại NTU là cái nôi đào tạo các chuyên gia chiến lược truyền thông, quản trị hình ảnh thương hiệu và tổ chức sự kiện chuyên nghiệp thời đại số.

#### 1. Các khối kiến thức nghiệp vụ cốt lõi:
- **Quy trình xử lý khủng hoảng truyền thông (Crisis Management)**:
  1. *Giám sát & Phát hiện sớm*: Theo dõi social listening 24/7 để nắm bắt nguồn tin tiêu cực.
  2. *Đánh giá rủi ro*: Phân cấp mức độ ảnh hưởng đến uy tín tổ chức.
  3. *Thiết lập thông điệp cốt lõi*: Minh bạch, chân thành, đưa ra giải pháp khắc phục cụ thể thay vì trốn tránh.
  4. *Truyền thông đa kênh*: Tổ chức họp báo, phát thông cáo báo chí (Press Release) và làm việc trực tiếp với báo chí.
- **Nghiệp vụ Tổ chức sự kiện (Event Management)**: Lập kế hoạch, quản trị ngân sách, điều phối sân khấu, quản lý KOLs/Influencers.
- **Kỹ năng viết PR chuyên sâu**: Viết bài PR báo chí, thông cáo báo chí, kịch bản video viral, nội dung truyền thông mạng xã hội.

#### 2. Mẫu cấu trúc Thông Cáo Báo Chí chuẩn:
\`\`\`
[LOGO TỔ CHỨC / TRƯỜNG ĐH NGUYỄN TRÃI]
THÔNG CÁO BÁO CHÍ
Về việc: [Tiêu đề hành động súc tích - Dưới 15 từ]

Hà Nội, Ngày ... tháng ... năm ...
[ĐOẠN LEAD]: Trả lời công thức 5W1H (Who - What - When - Where - Why - How).
[THÂN BÀI]: Trích dẫn phát biểu của Lãnh đạo + Chi tiết sự kiện/chương trình.
[BOILERPLATE]: Tóm tắt thông tin về đơn vị phát hành.
[LIÊN HỆ TRUYỀN THÔNG]: Họ tên, Chức vụ, Email, Điện thoại.
\`\`\`

#### 3. Cơ hội nghề nghiệp:
- Chuyên viên PR, Brand Manager tại các tập đoàn lớn.
- Account Executive / Event Manager tại các Agency truyền thông & quảng cáo.
- Chuyên viên quản lý truyền thông nội bộ, phát ngôn viên báo chí.`;
    }

    // 6. NGÀNH 6: QUẢN TRỊ KINH DOANH
    if (
      clean.includes('quan tri kinh doanh') ||
      clean.includes('qtkd') ||
      clean.includes('marketing') ||
      clean.includes('swot') ||
      clean.includes('khoi nghiep') ||
      clean.includes('startup') ||
      clean.includes('porter') ||
      (clean.includes('kinh doanh') && !clean.includes('tai chinh'))
    ) {
      return `### 💼 Tư Vấn & Hướng Dẫn Ngành Quản Trị Kinh Doanh - Đại Học Nguyễn Trãi (NTU)

Chương trình **Quản trị kinh doanh** tại Trường Đại học Nguyễn Trãi tập trung vào mô hình đào tạo "Vườn ươm Khởi nghiệp" (Startup Incubator), trang bị tư duy quản trị 4.0, Digital Marketing và kỹ năng lãnh đạo thực tế.

#### 1. Các mô hình & Công cụ quản trị cốt lõi:
- **Ma trận phân tích SWOT**:
  - *Strengths (Điểm mạnh)* & *Weaknesses (Điểm yếu)*: Yếu tố nội bộ tổ chức.
  - *Opportunities (Cơ hội)* & *Threats (Thách thức)*: Yếu tố môi trường kinh doanh bên ngoài.
- **Chiến lược Marketing Mix (4P → 7P)**:
  - Product (Sản phẩm) - Price (Giá) - Place (Phân phối) - Promotion (Chiêu thị).
  - Mở rộng ngành dịch vụ: People (Con người) - Process (Quy trình) - Physical Evidence (Cơ sở vật chất).
- **Mô hình 5 Áp lực cạnh tranh của Michael Porter**:
  1. Đối thủ hiện hữu trong ngành.
  2. Nguy cơ từ đối thủ tiềm năng mới.
  3. Quyền thương lượng của khách hàng.
  4. Quyền thương lượng của nhà cung cấp.
  5. Mối đe dọa từ sản phẩm/dịch vụ thay thế.

#### 2. Cơ hội việc làm sinh viên tốt nghiệp:
- Khởi nghiệp và làm chủ doanh nghiệp (Founder / Co-Founder).
- Chuyên viên phát triển kinh doanh (Business Development), Quản lý dự án, Giám đốc Marketing.
- Quản lý chuỗi cung ứng, chuyên viên quản trị nhân sự tại các công ty đa quốc gia.`;
    }

    // 7. NGÀNH 7: TÀI CHÍNH – NGÂN HÀNG
    if (
      clean.includes('tai chinh') ||
      clean.includes('ngan hang') ||
      clean.includes('fintech') ||
      clean.includes('chung khoan') ||
      clean.includes('lai suat') ||
      clean.includes('pv') ||
      clean.includes('fv')
    ) {
      return `### 📊 Tư Vấn & Hướng Dẫn Ngành Tài Chính – Ngân Hàng - Đại Học Nguyễn Trãi (NTU)

Ngành **Tài chính – Ngân hàng** tại NTU đào tạo sinh viên đón đầu xu thế chuyển đổi số trong lĩnh vực ngân hàng (Digital Banking), Công nghệ tài chính (Fintech) và đầu tư chứng khoán thông minh.

#### 1. Các công thức tài chính cốt lõi:
- **Giá trị hiện tại (Present Value - PV)**:
  $$PV = \\frac{FV}{(1 + r)^n}$$
- **Giá trị tương lai của dòng tiền (Future Value - FV)**:
  $$FV = PV \\times (1 + r)^n$$
- **Chỉ số hiệu quả tài chính doanh nghiệp**:
  - Tỷ suất sinh lời trên vốn chủ sở hữu (ROE):
    $$ROE = \\frac{\\text{Lợi nhuận sau thuế}}{\\text{Vốn chủ sở hữu bình quân}} \\times 100\\%$$
  - Tỷ suất sinh lời trên tổng tài sản (ROA):
    $$ROA = \\frac{\\text{Lợi nhuận sau thuế}}{\\text{Tổng tài sản bình quân}} \\times 100\\%$$

#### 2. Các mảng chuyên môn tại NTU:
- Quản trị tài chính doanh nghiệp & Thẩm định dự án đầu tư.
- Nghiệp vụ Ngân hàng thương mại: Tín dụng doanh nghiệp, thanh toán quốc tế, quản trị rủi ro thanh khoản.
- Công nghệ tài chính (Fintech): Ví điện tử, Blockchain trong tài chính, Open Banking API.
- Đầu tư tài chính & Thị trường chứng khoán: Phân tích kỹ thuật (Technical Analysis), Phân tích cơ bản (Fundamental Analysis).

#### 3. Cơ hội nghề nghiệp:
- Chuyên viên tín dụng, quản lý khách hàng ưu tiên tại các Ngân hàng lớn (Vietcombank, BIDV, Techcombank, MB...).
- Chuyên viên phân tích đầu tư tại các Công ty Chứng khoán, Quỹ đầu tư mạo hiểm.
- Chuyên viên tài chính doanh nghiệp (CFO tương lai), chuyên gia Fintech.`;
    }

    // 8. NGÀNH 8: KẾ TOÁN
    if (
      clean.includes('ke toan') ||
      clean.includes('kiem toan') ||
      clean.includes('dinh khoan') ||
      clean.includes('no - co') ||
      clean.includes('bang can doi') ||
      clean.includes('ifrs') ||
      clean.includes('misa')
    ) {
      return `### 📑 Tư Vấn & Hướng Dẫn Ngành Kế Toán - Đại Học Nguyễn Trãi (NTU)

Ngành **Kế toán** tại NTU trang bị cho sinh viên nghiệp vụ kế toán thực hành trên các phần mềm hiện đại (MISA, SAP, Fast Accounting) và tiếp cận chuẩn mực kế toán quốc tế (IFRS).

#### 1. Nguyên tắc định khoản kế toán kép (Debit / Credit):
- **Tài sản (TK đầu 1, 2) & Chi phí (TK đầu 6, 8)**: Tăng ghi **Nợ (Dr)** | Giảm ghi **Có (Cr)**
- **Nguồn vốn (TK đầu 3, 4) & Doanh thu (TK đầu 5, 7)**: Tăng ghi **Có (Cr)** | Giảm ghi **Nợ (Dr)**
- **Quy tắc bất biến**: $\\sum \\text{Phát sinh Nợ} = \\sum \\text{Phát sinh Có}$

#### 2. Ví dụ nghiệp vụ kế toán điển hình:
\`\`\`
Nghiệp vụ: Doanh nghiệp mua hàng hóa nhập kho trị giá 50.000.000đ, thuế GTGT 10%, chưa thanh toán cho người bán:
  Nợ TK 156 (Hàng hóa):                 50.000.000 VNĐ
  Nợ TK 1331 (Thuế GTGT được khấu trừ):  5.000.000 VNĐ
    Có TK 331 (Phải trả người bán):     55.000.000 VNĐ
\`\`\`

#### 3. Cơ hội nghề nghiệp:
- Kế toán tổng hợp, Kế toán trưởng tại các doanh nghiệp trong và ngoài nước.
- Trợ lý kiểm toán viên tại các Công ty Kiểm toán (Big4, RSM, Grant Thornton...).
- Chuyên viên tư vấn thuế, thẩm định báo cáo tài chính tại cơ quan nhà nước.`;
    }

    // 9. NGÀNH 9: CÔNG NGHỆ THÔNG TIN
    if (
      clean.includes('cong nghe thong tin') ||
      clean.includes('cntt') ||
      clean.includes('lap trinh') ||
      clean.includes('code') ||
      clean.includes('quicksort') ||
      clean.includes('javascript') ||
      clean.includes('python') ||
      clean.includes('c++') ||
      clean.includes('java') ||
      clean.includes('thuat toan') ||
      clean.includes('database') ||
      clean.includes('phan mem')
    ) {
      if (clean.includes('quicksort') || clean.includes('sap xep nhanh')) {
        return `### ⚡ Thuật toán Sắp Xếp Nhanh (QuickSort) - Chuyên Đề CNTT NTU

**QuickSort** là thuật toán sắp xếp kinh điển theo nguyên lý **Chia để trị (Divide and Conquer)** với độ phức tạp trung bình **O(N log N)**.

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

// Chạy thử nghiệm:
const data = [45, 12, 89, 34, 70, 23, 9];
console.log("Mảng sau khi sắp xếp:", quickSort(data));
// Kết quả: [9, 12, 23, 34, 45, 70, 89]
\`\`\`

#### Đánh giá độ phức tạp:
- **Tốt nhất (Best Case)**: $O(N \\log N)$
- **Trung bình (Average Case)**: $O(N \\log N)$
- **Xấu nhất (Worst Case)**: $O(N^2)$ (khi pivot luôn là phần tử nhỏ nhất hoặc lớn nhất)`;
      }

      return `### 💻 Tư Vấn & Hướng Dẫn Ngành Công Nghệ Thông Tin - Đại Học Nguyễn Trãi (NTU)

Ngành **Công nghệ thông tin** tại NTU đào tạo theo chuẩn thực hành dự án thực tế (Project-Based Learning) với các hướng chuyên sâu: Kỹ thuật phần mềm, Trí tuệ nhân tạo (AI/ML), Lập trình Fullstack và An toàn thông tin.

#### 1. Khung chương trình đào tạo trọng tâm:
- **Nền tảng lập trình & Thuật toán**: C/C++, Java, Python, Cấu trúc dữ liệu & Giải thuật nâng cao.
- **Lập trình Ứng dụng & Web/Mobile**: JavaScript/TypeScript, React.js, Node.js, Flutter/React Native, RESTful API & Microservices.
- **Cơ sở dữ liệu & Điện toán đám mây**: SQL (PostgreSQL, MySQL), NoSQL (MongoDB, Redis), AWS/Docker/Kubernetes.
- **Trí tuệ nhân tạo & Khoa học dữ liệu**: Machine Learning, Deep Learning, Xử lý ngôn ngữ tự nhiên (NLP) & Thị giác máy tính (Computer Vision).

#### 2. Cơ hội việc làm:
- Kỹ sư phát triển phần mềm (Software Engineer / Fullstack Developer).
- Kỹ sư AI & Khoa học dữ liệu (AI/Data Engineer).
- Chuyên viên an toàn thông tin & Kỹ sư DevOps.`;
    }

    // 10. NGÀNH 10: THIẾT KẾ NỘI THẤT
    if (
      clean.includes('thiet ke noi that') ||
      clean.includes('noi that') ||
      clean.includes('autocad') ||
      clean.includes('3ds max') ||
      clean.includes('sketchup') ||
      clean.includes('revit') ||
      clean.includes('ban ve') ||
      clean.includes('scandinavian') ||
      clean.includes('japandi')
    ) {
      return `### 🏛️ Tư Vấn & Hướng Dẫn Ngành Thiết Kế Nội Thất - Đại Học Nguyễn Trãi (NTU)

Ngành **Thiết kế nội thất** tại Trường Đại học Nguyễn Trãi kết hợp hài hòa giữa nghệ thuật sáng tạo không gian sống, công nghệ mô phỏng 3D hiện đại và am hiểu vật liệu thực tế.

#### 1. Các kiến thức & Kỹ năng kỹ thuật trọng tâm:
- **Hệ thống bản vẽ kiến trúc nội thất**:
  - *Mặt bằng (Floor Plan)*: Bố trí công năng các phòng, kích thước nội thất và luồng giao thông.
  - *Mặt đứng (Elevation)* & *Mặt cắt (Section)*: Chi tiết độ cao trần, tường, chi tiết kỹ thuật ốp lát và đồ gỗ may đo.
  - *Phối cảnh 3D (3D Rendering)*: Thể hiện ánh sáng thực tế và vật liệu bề mặt.
- **Bộ công cụ phần mềm tiêu chuẩn**: AutoCAD (vẽ kỹ thuật 2D), 3ds Max + V-Ray/Corona (render hình ảnh chân thực), SketchUp, Revit BIM (mô hình thông tin công trình).
- **Các phong cách nội thất xu hướng 2026**:
  - **Minimalism (Tối giản)**: Triết lý "Less is more", đường nét kỷ hà tinh gọn, màu sắc trung tính (trắng - đen - xám).
  - **Japandi**: Giao thoa tinh tế giữa phong cách Nhật Bản wabi-sabi và Scandinavian Bắc Âu mộc mạc, gần gũi thiên nhiên.
  - **Modern Luxury**: Sử dụng vật liệu cao cấp (đá marble, kim loại mạ vàng, da thuộc, hệ thống chiếu sáng thông minh).

#### 2. Cơ hội nghề nghiệp:
- Nhà thiết kế nội thất nhà ở, biệt thự, căn hộ cao cấp (Residential Interior Designer).
- Nhà thiết kế không gian thương mại: Khách sạn, resort, showroom, nhà hàng, quán cafe (Commercial Interior Designer).
- Chuyên viên tư vấn giải pháp vật liệu và giám sát thi công nội thất công trình.`;
    }

    // 11. CHÀO HỎI / GIỚI THIỆU 10 NGÀNH ĐẠI HỌC NGUYỄN TRÃI
    if (
      clean.includes('xin chao') ||
      clean.includes('hello') ||
      clean.includes('hi ') ||
      clean === 'hi' ||
      clean.includes('nguyen trai') ||
      clean.includes('ntu') ||
      clean.includes('cac nganh') ||
      clean.includes('nganh nao') ||
      clean.includes('tuyen sinh')
    ) {
      return `### 🏛️ Chào mừng ${studentName} đến với Trợ lý AI - Trường Đại học Nguyễn Trãi (NTU)!

Mình là Trợ lý AI hỗ trợ tư vấn tuyển sinh và đồng hành học tập của **Trường Đại học Nguyễn Trãi** (Địa chỉ: 28A Lê Trọng Tấn, Hà Đông, Hà Nội).

Trường Đại học Nguyễn Trãi đào tạo **10 ngành trọng điểm chuẩn ứng dụng quốc tế**:

| STT | Tên Ngành | Điểm Nổi Bật & Hướng Phát Triển |
| :---: | :--- | :--- |
| **1** | **Thiết kế đồ họa** | Mỹ thuật ứng dụng, 2D/3D Graphic, UI/UX, Branding, thực chiến tại Studio & Agency |
| **2** | **Ngôn ngữ Nhật** | Chuẩn JLPT N3-N1, Tiếng Nhật thương mại, cơ hội làm việc tại Nhật Bản & DN FDI |
| **3** | **Ngôn ngữ Hàn Quốc** | Chuẩn TOPIK 3-6, Biên phiên dịch, làm việc tại các tập đoàn Hàn Quốc (Samsung, LG, CJ) |
| **4** | **Quốc tế học** | Ngoại giao, Quan hệ quốc tế, Tổ chức phi chính phủ (NGO), Đàm phán toàn cầu |
| **5** | **Quan hệ công chúng (PR)** | Quản trị truyền thông, Tổ chức sự kiện, Xử lý khủng hoảng PR, Báo chí đa phương tiện |
| **6** | **Quản trị kinh doanh** | Quản trị doanh nghiệp 4.0, Digital Marketing, Khởi nghiệp đổi mới sáng tạo (Startup) |
| **7** | **Tài chính – Ngân hàng** | Tài chính doanh nghiệp, Ngân hàng số, Fintech, Phân tích đầu tư chứng khoán |
| **8** | **Kế toán** | Kế toán tài chính & Quản trị, Thuế, Kiểm toán, Chuẩn mực IFRS, phần mềm MISA/SAP |
| **9** | **Công nghệ thông tin** | Kỹ thuật phần mềm, AI & Data Science, Lập trình Web/Mobile, An toàn thông tin |
| **10** | **Thiết kế nội thất** | Kiến trúc nội thất, Vật liệu & Ánh sáng, AutoCAD, 3ds Max, SketchUp, Revit |

👉 *Bạn muốn mình tư vấn chi tiết về ngành học nào trong 10 ngành trên, hay cần hỗ trợ giải bài tập, lập kế hoạch ôn thi?*`;
    }

    // 12. PHƯƠNG PHÁP HỌC & LỘ TRÌNH ÔN THI
    if (clean.includes('lo trinh') || clean.includes('phuong phap') || clean.includes('on thi') || clean.includes('hoc tap')) {
      return `### 🎯 Chiến Lược Học Tập & Ôn Thi Đạt Điểm A+ Tại Đại Học Nguyễn Trãi

Để tối ưu hóa thời gian và làm chủ kiến thức chuyên ngành vững vàng, bạn hãy áp dụng phương pháp 4 bước hiệu quả sau:

1. **Active Recall (Chủ động truy hồi)**: Tự tóm tắt kiến thức ra giấy nháp trước khi xem lại giáo trình để kích thích mạng nơ-ron não bộ ghi nhớ sâu.
2. **Spaced Repetition (Lặp lại ngắt quãng)**: Ôn tập ngắt quãng theo chu kỳ 1 ngày - 3 ngày - 7 ngày để kiến thức chuyển từ trí nhớ ngắn hạn sang dài hạn.
3. **Thực hành theo dự án (Project-Based Learning)**: Biến lý thuyết thành sản phẩm thực tế (code app, vẽ bản vẽ, lập kế hoạch PR, bài phân tích tài chính).
4. **Pomodoro 50/10**: Học tập trung cao độ 50 phút $\\rightarrow$ Nghỉ ngơi 10 phút.

*Bạn có muốn mình lập ngay một Lộ trình học tập chi tiết cho môn học sắp tới của bạn không? Hãy gửi tên môn học và ngày thi nhé!* ✨`;
    }

    // Trả lời mặc định học thuật NTU
    return `### 💡 Phân Tích & Hướng Dẫn Chi Tiết - Trợ Lý AI NTU

Cảm ơn câu hỏi của bạn về: **"${query}"**.

Dưới đây là phần phân tích và hướng dẫn giải quyết theo chuẩn học thuật Trường Đại học Nguyễn Trãi:

1. **Bản chất vấn đề**:
   - Cần nắm vững các khái niệm nền tảng trước khi áp dụng vào các bài toán mở rộng chuyên ngành.
   - Chia nhỏ vấn đề lớn thành các bước giải quyết tuần tự và có kiểm chứng.

2. **Các bước triển khai khuyến nghị**:
   - Thu thập đầy đủ dữ liệu đầu vào và các ràng buộc bài toán.
   - Áp dụng nguyên lý, công thức hoặc công cụ tiêu chuẩn ngành phù hợp nhất.
   - Đối chiếu kết quả với thực tiễn doanh nghiệp.

*Nếu bạn cần giải đáp chi tiết hơn hoặc có bài tập cụ thể thuộc 10 ngành đào tạo của NTU, hãy gửi cho mình ngay nhé!* 🚀`;
  }

  generateFallbackStudyPlan(goal, targetExam, totalDays, dailyHours, subjects = []) {
    const defaultSubjects = subjects.length ? subjects : ['Lý thuyết chuyên ngành NTU', 'Bài tập thực hành ứng dụng', 'Giải đề thi & Đồ án'];
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
            title: `Đọc & hệ thống lại lý thuyết chuyên đề ${i} môn ${subjectForDay}`,
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
            notes: 'Lưu ý các tiêu chuẩn thực tế ngành',
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
      title: `Lộ trình học tập NTU: ${goal} (${targetExam})`,
      schedule: days,
      studyTips: this.getDefaultStudyTips(),
    };
  }

  getDefaultStudyTips() {
    return [
      'Áp dụng phương pháp Pomodoro 50/10 để duy trì sự tập trung cao độ.',
      'Sử dụng sơ đồ tư duy (Mindmap) để hệ thống hóa kiến thức toàn bộ học phần.',
      'Thực hành giải bài tập và tình huống thực tế theo định hướng ứng dụng của NTU.',
      'Ôn tập theo nhóm và chủ động đặt câu hỏi với giảng viên và Trợ lý AI.',
      'Giữ sức khỏe và ngủ đủ 7-8 tiếng trước ngày thi để đạt phong độ cao nhất.',
    ];
  }
}

module.exports = new AIService();
