const documentService = require('../services/document.service');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

class DocumentController {
  // POST /api/documents/upload
  async uploadDocument(req, res, next) {
    try {
      if (!req.file) {
        return errorResponse(res, 'Vui lòng chọn tệp tài liệu để tải lên.', null, 400);
      }

      const { title, courseId, tags } = req.body;
      const document = await documentService.uploadDocument({
        title,
        file: req.file,
        courseId,
        uploadedBy: req.user._id,
        tags,
      });

      return successResponse(res, 'Tải lên và tóm tắt tài liệu bằng AI thành công!', document, 201);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/documents
  async getDocuments(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 12;
      const search = req.query.search || '';
      const courseId = req.query.courseId || null;

      const result = await documentService.getDocuments({ page, limit, search, courseId });
      return paginatedResponse(res, 'Lấy danh sách tài liệu thành công.', result.documents, page, limit, result.total);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/documents/:id
  async getDocument(req, res, next) {
    try {
      const document = await documentService.getDocumentById(req.params.id);
      return successResponse(res, 'Lấy chi tiết tài liệu thành công.', document);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/documents/:id
  async deleteDocument(req, res, next) {
    try {
      const result = await documentService.deleteDocument(req.params.id, req.user._id, req.user.role);
      return successResponse(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DocumentController();
