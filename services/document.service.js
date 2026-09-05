const fs = require('fs');
const path = require('path');
const Document = require('../models/Document');
const aiService = require('./ai.service');

class DocumentService {
  /**
   * Tải lên và xử lý tài liệu mới
   */
  async uploadDocument({ title, file, courseId = null, uploadedBy, tags = [] }) {
    if (!file) {
      throw new Error('Không tìm thấy tệp tải lên.');
    }

    const fileUrl = `/uploads/${file.filename}`;

    // Đọc trích đoạn nội dung nếu là file text / md
    let contentSnippet = '';
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.txt', '.md', '.json', '.js', '.py', '.html', '.css'].includes(ext)) {
      try {
        contentSnippet = fs.readFileSync(file.path, 'utf8').substring(0, 3000);
      } catch (e) {
        console.warn('Không thể đọc nội dung file văn bản:', e.message);
      }
    }

    // Tự động phân tích tóm tắt bằng AI
    const aiSummaryResult = await aiService.summarizeDocument({
      title: title || file.originalname,
      contentSnippet,
      fileType: file.mimetype,
    });

    const parsedTags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : [];
    const mergedTags = [...new Set([...parsedTags, ...aiSummaryResult.tags])];

    const document = await Document.create({
      title: title || file.originalname,
      originalName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileUrl,
      fileType: file.mimetype,
      fileSize: file.size,
      courseId: courseId || null,
      uploadedBy,
      summary: aiSummaryResult.summary,
      keyPoints: aiSummaryResult.keyPoints,
      tags: mergedTags,
    });

    return document;
  }

  /**
   * Lấy danh sách tài liệu có phân trang và tìm kiếm
   */
  async getDocuments({ page = 1, limit = 10, search = '', courseId = null }) {
    const query = { isPublic: true };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    if (courseId) {
      query.courseId = courseId;
    }

    const total = await Document.countDocuments(query);
    const documents = await Document.find(query)
      .populate('uploadedBy', 'name email avatar')
      .populate('courseId', 'code name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return { documents, total, page, limit };
  }

  /**
   * Lấy chi tiết tài liệu theo ID
   */
  async getDocumentById(id) {
    const document = await Document.findById(id)
      .populate('uploadedBy', 'name email avatar')
      .populate('courseId', 'code name description');
    if (!document) {
      throw new Error('Tài liệu không tồn tại.');
    }
    return document;
  }

  /**
   * Xóa tài liệu
   */
  async deleteDocument(id, userId, userRole) {
    const document = await Document.findById(id);
    if (!document) {
      throw new Error('Không tìm thấy tài liệu.');
    }

    // Chỉ người tải lên hoặc Admin mới được xóa
    if (document.uploadedBy.toString() !== userId.toString() && userRole !== 'admin') {
      throw new Error('Bạn không có quyền xóa tài liệu này.');
    }

    // Xóa file vật lý nếu tồn tại
    if (fs.existsSync(document.filePath)) {
      try {
        fs.unlinkSync(document.filePath);
      } catch (e) {
        console.warn('Không thể xóa file vật lý:', e.message);
      }
    }

    await Document.findByIdAndDelete(id);
    return { message: 'Đã xóa tài liệu thành công.' };
  }
}

module.exports = new DocumentService();
