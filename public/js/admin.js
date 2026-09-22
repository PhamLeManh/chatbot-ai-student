/**
 * ==========================================================================
 * AI STUDENT ASSISTANT - ADMIN DASHBOARD JS (admin.js)
 * System Analytics, Users CRUD, Courses CRUD, Document Management
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  const token = getToken();
  const user = getCurrentUser();

  if (!token || !user || user.role !== 'admin') {
    showToast('Từ chối truy cập! Trang này chỉ dành cho Quản trị viên.', 'error');
    window.location.href = '/login';
    return;
  }

  // Render admin profile ở navbar
  renderAdminNavbarProfile();

  // Khởi tạo các view tương ứng
  const path = window.location.pathname;
  if (path.includes('/dashboard') || path === '/admin') {
    loadDashboardStats();
  } else if (path.includes('/users')) {
    loadAdminUsers();
  } else if (path.includes('/courses')) {
    loadAdminCourses();
  } else if (path.includes('/documents')) {
    loadAdminDocuments();
  }
  // /admin/profile được xử lý inline trong profile.html
});

/**
 * Render admin profile (avatar + tên + nút logout) ở navbar admin
 */
function renderAdminNavbarProfile() {
  const user = getCurrentUser();
  const el = document.getElementById('admin-navbar-profile');
  if (!el || !user) return;

  el.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.75rem;">
      <a href="/admin/profile" style="display: flex; align-items: center; gap: 0.6rem; text-decoration: none; padding: 0.35rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); background: var(--bg-glass); transition: all 0.2s ease;" onmouseover="this.style.borderColor='var(--border-hover)'" onmouseout="this.style.borderColor='var(--border-color)'">
        <img src="${user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}"
          alt="${escapeHtml(user.name)}"
          style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-color);">
        <div style="line-height: 1.2;">
          <div style="font-weight: 700; color: var(--text-main); font-size: 0.88rem;">${escapeHtml(user.name)}</div>
          <div style="font-size: 0.72rem; color: var(--danger); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Quản Trị Viên</div>
        </div>
      </a>
      <button onclick="logout()" class="btn btn-icon btn-sm" title="Đăng xuất" style="border: 1px solid var(--border-color); color: var(--text-muted);">
        <i class="fas fa-arrow-right-from-bracket"></i>
      </button>
    </div>
  `;
}



// ==========================================
// 1. Thống kê Tổng quan (Dashboard)
// ==========================================
async function loadDashboardStats() {
  try {
    const result = await fetchAPI('/api/admin/stats');
    const stats = result.data;

    const elTotalUsers = document.getElementById('stat-total-users');
    const elTotalMessages = document.getElementById('stat-total-messages');
    const elTotalCourses = document.getElementById('stat-total-courses');
    const elTotalPlans = document.getElementById('stat-total-plans');

    if (elTotalUsers) elTotalUsers.innerText = stats.totalUsers || 0;
    if (elTotalMessages) elTotalMessages.innerText = stats.totalMessages || 0;
    if (elTotalCourses) elTotalCourses.innerText = stats.totalCourses || 0;
    if (elTotalPlans) elTotalPlans.innerText = stats.totalStudyPlans || 0;

    // Render Recent Users
    const recentUsersTable = document.getElementById('recent-users-tbody');
    if (recentUsersTable && stats.recentUsers) {
      recentUsersTable.innerHTML = stats.recentUsers
        .map(
          (u) => `
        <tr>
          <td>
            <div class="user-cell">
              <img src="${u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" class="user-avatar" style="width: 32px; height: 32px;">
              <div>
                <strong>${escapeHtml(u.name)}</strong><br>
                <small style="color: var(--text-dim);">${escapeHtml(u.email)}</small>
              </div>
            </div>
          </td>
          <td><span class="badge badge-primary">${escapeHtml(u.studentId || 'N/A')}</span></td>
          <td>${escapeHtml(u.major || u.university || 'Chưa cập nhật')}</td>
          <td>${u.streak || 0} ngày 🔥</td>
          <td>${new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
        </tr>
      `
        )
        .join('');
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ==========================================
// 2. Quản lý Người dùng (Users Management)
// ==========================================
async function loadAdminUsers(page = 1, search = '') {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Đang tải danh sách...</td></tr>`;

  try {
    const result = await fetchAPI(`/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`);
    const users = result.data || [];

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-dim);">Không tìm thấy người dùng nào.</td></tr>`;
      return;
    }

    tbody.innerHTML = users
      .map(
        (u) => `
      <tr>
        <td>
          <div class="user-cell">
            <img src="${u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" class="user-avatar" style="width: 36px; height: 36px;">
            <div>
              <strong>${escapeHtml(u.name)}</strong>
              ${u.studentId ? `<br><small style="color: var(--text-muted);">MSSV: ${escapeHtml(u.studentId)}</small>` : ''}
            </div>
          </div>
        </td>
        <td>${escapeHtml(u.email)}</td>
        <td>
          <select class="form-control" style="padding: 0.3rem 0.6rem; font-size: 0.85rem; width: auto;" onchange="updateUserRole('${u._id}', this.value)">
            <option value="student" ${u.role === 'student' ? 'selected' : ''}>Student</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="teacher" ${u.role === 'teacher' ? 'selected' : ''}>Teacher</option>
          </select>
        </td>
        <td>${escapeHtml(u.major || 'Chưa cập nhật')}</td>
        <td><span class="badge ${u.isActive ? 'badge-success' : 'badge-danger'}">${u.isActive ? 'Hoạt động' : 'Bị khóa'}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" style="color: var(--accent);" onclick="deleteAdminUser('${u._id}')" title="Xóa người dùng">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function updateUserRole(userId, newRole) {
  try {
    await fetchAPI(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole }),
    });
    showToast('Cập nhật vai trò người dùng thành công!', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function deleteAdminUser(userId) {
  if (!confirm('Bạn có chắc chắn muốn xóa người dùng này cùng toàn bộ dữ liệu chat/lộ trình liên quan?')) return;
  try {
    await fetchAPI(`/api/admin/users/${userId}`, { method: 'DELETE' });
    showToast('Đã xóa người dùng thành công.', 'info');
    loadAdminUsers();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ==========================================
// 3. Quản lý Học phần (Courses Management)
// ==========================================
async function loadAdminCourses() {
  const container = document.getElementById('courses-grid');
  if (!container) return;

  container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Đang tải danh sách học phần...</div>`;

  try {
    const result = await fetchAPI('/api/admin/courses');
    const courses = result.data || [];

    if (courses.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
          <p style="color: var(--text-muted); margin-bottom: 1rem;">Chưa có học phần nào trong cơ sở dữ liệu.</p>
          <button class="btn btn-primary btn-sm" onclick="openCourseModal()"><i class="fas fa-plus"></i> Thêm Học Phần Đầu Tiên</button>
        </div>
      `;
      return;
    }

    container.innerHTML = courses
      .map(
        (c) => `
      <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
            <span class="badge badge-primary">${escapeHtml(c.code)}</span>
            <span class="badge badge-success">${c.credits} Tín chỉ</span>
          </div>
          <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.5rem;">${escapeHtml(c.name)}</h3>
          <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1rem;">${escapeHtml(c.description || 'Không có mô tả')}</p>
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: var(--text-dim);">
          <span><i class="fas fa-chalkboard-teacher"></i> ${escapeHtml(c.instructor || 'Giảng viên')}</span>
          <button class="btn btn-secondary btn-sm" style="color: var(--accent);" onclick="deleteCourse('${c._id}')" title="Xóa môn học">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
    `
      )
      .join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function handleSaveCourse(e) {
  e.preventDefault();
  const code = document.getElementById('course-code').value.trim();
  const name = document.getElementById('course-name').value.trim();
  const credits = document.getElementById('course-credits').value;
  const instructor = document.getElementById('course-instructor').value.trim();
  const department = document.getElementById('course-department').value.trim();
  const description = document.getElementById('course-description').value.trim();

  try {
    await fetchAPI('/api/admin/courses', {
      method: 'POST',
      body: JSON.stringify({ code, name, credits, instructor, department, description }),
    });

    closeCourseModal();
    showToast('Đã tạo mới học phần thành công!', 'success');
    loadAdminCourses();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function deleteCourse(courseId) {
  if (!confirm('Bạn có chắc muốn xóa học phần này?')) return;
  try {
    await fetchAPI(`/api/admin/courses/${courseId}`, { method: 'DELETE' });
    showToast('Đã xóa học phần thành công.', 'info');
    loadAdminCourses();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function openCourseModal() {
  const modal = document.getElementById('course-modal');
  if (modal) modal.classList.add('active');
}

function closeCourseModal() {
  const modal = document.getElementById('course-modal');
  if (modal) modal.classList.remove('active');
}

// ==========================================
// 4. Quản lý Kho Tài Liệu (Documents)
// ==========================================
async function loadAdminDocuments() {
  const tbody = document.getElementById('documents-table-body');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;"><i class="fas fa-spinner fa-spin"></i> Đang tải kho tài liệu...</td></tr>`;

  try {
    const result = await fetchAPI('/api/documents');
    const docs = result.data || [];

    if (docs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-dim);">Chưa có tài liệu nào được tải lên.</td></tr>`;
      return;
    }

    tbody.innerHTML = docs
      .map(
        (doc) => `
      <tr>
        <td>
          <strong>${escapeHtml(doc.title)}</strong><br>
          <small style="color: var(--text-dim);">${escapeHtml(doc.originalName)} (${Math.round(doc.fileSize / 1024)} KB)</small>
        </td>
        <td>${doc.uploadedBy ? escapeHtml(doc.uploadedBy.name) : 'Hệ thống'}</td>
        <td style="max-width: 320px; font-size: 0.85rem; color: var(--text-muted);">${escapeHtml(doc.summary ? doc.summary.substring(0, 100) + '...' : 'Đã tóm tắt')}</td>
        <td>${new Date(doc.createdAt).toLocaleDateString()}</td>
        <td>
          <a href="${doc.fileUrl}" target="_blank" class="btn btn-secondary btn-sm" title="Tải về"><i class="fas fa-download"></i></a>
          <button class="btn btn-secondary btn-sm" style="color: var(--accent);" onclick="deleteAdminDocument('${doc._id}')" title="Xóa tài liệu">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      </tr>
    `
      )
      .join('');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function deleteAdminDocument(docId) {
  if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) return;
  try {
    await fetchAPI(`/api/documents/${docId}`, { method: 'DELETE' });
    showToast('Đã xóa tài liệu thành công.', 'info');
    loadAdminDocuments();
  } catch (error) {
    showToast(error.message, 'error');
  }
}
