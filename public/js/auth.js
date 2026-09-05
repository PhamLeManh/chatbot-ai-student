/**
 * ==========================================================================
 * AI STUDENT ASSISTANT - AUTHENTICATION JS (auth.js)
 * Login, Register & 1-Click Demo Logins
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Nếu đã đăng nhập, tự động chuyển về trang Chat hoặc Admin
  const token = getToken();
  const user = getCurrentUser();
  const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';

  if (token && user && isAuthPage) {
    if (user.role === 'admin') {
      window.location.href = '/admin/dashboard';
    } else {
      window.location.href = '/chat';
    }
    return;
  }

  // 2. Toggle ẩn hiện mật khẩu
  document.querySelectorAll('.password-toggle').forEach((toggleBtn) => {
    toggleBtn.addEventListener('click', () => {
      const input = toggleBtn.parentElement.querySelector('input');
      if (input.type === 'password') {
        input.type = 'text';
        toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
      } else {
        input.type = 'password';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
      }
    });
  });

  // 3. Xử lý Form Đăng Nhập
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...';

        const result = await fetchAPI('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        setAuthSession(result.data.token, result.data.user);
        showToast(result.message || 'Đăng nhập thành công!', 'success');

        setTimeout(() => {
          if (result.data.user.role === 'admin') {
            window.location.href = '/admin/dashboard';
          } else {
            window.location.href = '/chat';
          }
        }, 600);
      } catch (error) {
        showToast(error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Đăng Nhập <i class="fas fa-arrow-right"></i>';
      }
    });
  }

  // 4. Xử lý Form Đăng Ký
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const studentId = document.getElementById('studentId')?.value.trim() || '';
      const university = document.getElementById('university')?.value.trim() || '';
      const major = document.getElementById('major')?.value.trim() || '';
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      if (password !== confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp!', 'warning');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng ký...';

        const result = await fetchAPI('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, studentId, university, major }),
        });

        setAuthSession(result.data.token, result.data.user);
        showToast('Đăng ký tài khoản thành công! Đang chuyển hướng...', 'success');

        setTimeout(() => {
          window.location.href = '/chat';
        }, 800);
      } catch (error) {
        showToast(error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Đăng Ký Tài Khoản <i class="fas fa-user-plus"></i>';
      }
    });
  }
});

// ==========================================
// 5. Đăng nhập Nhanh 1-Click Demo Accounts
// ==========================================
async function quickDemoLogin(role) {
  try {
    showToast(`Đang đăng nhập nhanh với tài khoản Demo ${role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}...`, 'info');

    const result = await fetchAPI('/api/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });

    setAuthSession(result.data.token, result.data.user);
    showToast(result.message, 'success');

    setTimeout(() => {
      if (result.data.user.role === 'admin') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/chat';
      }
    }, 600);
  } catch (error) {
    showToast(error.message || 'Không thể đăng nhập demo.', 'error');
  }
}
