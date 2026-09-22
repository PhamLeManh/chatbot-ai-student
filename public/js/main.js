/**
 * ==========================================================================
 * AI STUDENT ASSISTANT - MAIN JAVASCRIPT (main.js)
 * Token management, Theme toggle, Toast notifications, API helper
 * ==========================================================================
 */

// Key lưu trữ localStorage
const STORAGE_KEYS = {
  TOKEN: 'ai_student_token',
  USER: 'ai_student_user',
  THEME: 'ai_student_theme',
};

// ==========================================
// 1. Quản lý Xác thực & Token
// ==========================================
function getToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

function setAuthSession(token, user) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  updateNavbarAuth();
}

function getCurrentUser() {
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  updateNavbarAuth();
}

function logout() {
  clearAuthSession();
  showToast('Đã đăng xuất thành công.', 'info');
  setTimeout(() => {
    window.location.href = '/login';
  }, 500);
}

// ==========================================
// 2. Fetch API Helper
// ==========================================
async function fetchAPI(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Nếu là FormData (upload file), bỏ Content-Type để browser tự sinh boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
        // Token hết hạn
        clearAuthSession();
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      }
      throw new Error(data.message || 'Có lỗi xảy ra khi kết nối máy chủ.');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// ==========================================
// Utility: Escape HTML để tránh XSS
// ==========================================
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(text)));
  return div.innerHTML;
}

// ==========================================
// 3. Toast Notifications
// ==========================================
function showToast(message, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
  };

  toast.innerHTML = `
    <i class="fas ${iconMap[type] || 'fa-info-circle'}"></i>
    <div style="flex: 1; font-size: 0.9rem;">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ==========================================
// 4. Chuyển đổi Theme Sáng / Tối
// ==========================================
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
  updateThemeToggleIcon(newTheme);
}

function updateThemeToggleIcon(theme) {
  const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
  toggleBtns.forEach((btn) => {
    btn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    btn.title = theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối';
  });
}

// ==========================================
// 5. Cập nhật Navbar theo trạng thái đăng nhập
// ==========================================
function updateNavbarAuth() {
  const user = getCurrentUser();
  const authActionArea = document.getElementById('navbar-auth-actions');
  if (!authActionArea) return;

  if (user) {
    authActionArea.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <a href="/profile" style="display: flex; align-items: center; gap: 0.6rem; text-decoration: none;">
          <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" alt="${user.name}" class="user-avatar" style="width: 36px; height: 36px;">
          <span style="font-weight: 700; color: #ffffff; font-size: 0.92rem;">${user.name}</span>
          ${user.role === 'admin' ? '<span class="badge badge-danger">COMMANDER</span>' : '<span class="badge badge-primary">ASTRONAUT</span>'}
        </a>
        <button onclick="logout()" class="btn btn-secondary btn-sm" title="Rời khỏi trạm / Đăng xuất">
          <i class="fas fa-arrow-right-from-bracket"></i>
        </button>
      </div>
    `;
  } else {
    authActionArea.innerHTML = `
      <a href="/login" class="btn btn-secondary btn-sm"><i class="fas fa-right-to-bracket"></i> Đăng Nhập</a>
      <a href="/register" class="btn btn-primary btn-sm"><i class="fas fa-user-astronaut"></i> Đăng Ký</a>
    `;
  }
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  updateNavbarAuth();

  // Bắt sự kiện nút đổi theme nếu có
  document.querySelectorAll('.theme-toggle-btn').forEach((btn) => {
    btn.addEventListener('click', toggleTheme);
  });
});
