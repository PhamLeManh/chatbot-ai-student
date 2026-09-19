/**
 * ==========================================================================
 * AI STUDENT ASSISTANT - AUTHENTICATION JS (auth.js)
 * Login, Register, Gmail OTP Verification & 1-Click Demo Logins
 * ==========================================================================
 */

let pendingVerificationEmail = '';
let resendTimerInterval = null;

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
      const submitBtn = document.getElementById('login-submit-btn');

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...';

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const result = await res.json();

        // Nếu tài khoản chưa xác minh email (Mã lỗi 403 / NOT_VERIFIED)
        if (res.status === 403 && result.code === 'NOT_VERIFIED') {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Đăng Nhập <i class="fas fa-arrow-right"></i>';
          pendingVerificationEmail = result.email || email;
          openLoginOtpModal(pendingVerificationEmail);
          showToast('Tài khoản chưa được kích hoạt. Vui lòng nhập mã OTP để xác minh.', 'warning');
          return;
        }

        if (!result.success) {
          throw new Error(result.message || 'Đăng nhập thất bại.');
        }

        setAuthSession(result.data.token, result.data.user);
        showToast(result.message || 'Đăng nhập thành công!', 'success');

        setTimeout(() => {
          if (result.data.user.role === 'admin') {
            window.location.href = '/admin/dashboard';
          } else {
            window.location.href = '/chat';
          }
        }, 500);
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
      const university = document.getElementById('university')?.value.trim() || 'Trường Đại học Nguyễn Trãi (NTU)';
      const major = document.getElementById('major')?.value.trim() || 'Công nghệ thông tin';
      const submitBtn = document.getElementById('register-submit-btn');

      if (password !== confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp!', 'warning');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng ký & gửi OTP...';

        const result = await fetchAPI('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, studentId, university, major }),
        });

        pendingVerificationEmail = email;

        // Chuyển sang màn hình nhập OTP
        showOtpCard(email, result.data?.devOtp);
        showToast('Đã gửi mã OTP xác minh vào Gmail!', 'success');
      } catch (error) {
        showToast(error.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Tiếp Tục Đăng Ký & Nhận Mã OTP <i class="fas fa-arrow-right"></i>';
      }
    });
  }

  // 5. Xử lý Form Xác Minh OTP (Trang Register)
  const otpForm = document.getElementById('otp-form');
  if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const otp = document.getElementById('otp-input').value.trim();
      const verifyBtn = document.getElementById('verify-otp-btn');

      if (!otp || otp.length !== 6) {
        showToast('Vui lòng nhập đúng 6 chữ số OTP!', 'warning');
        return;
      }

      try {
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang kích hoạt...';

        const result = await fetchAPI('/api/auth/verify-otp', {
          method: 'POST',
          body: JSON.stringify({ email: pendingVerificationEmail, otp }),
        });

        setAuthSession(result.data.token, result.data.user);
        showToast('Kích hoạt tài khoản thành công! Đang chuyển vào Chatbot AI...', 'success');

        setTimeout(() => {
          window.location.href = '/chat';
        }, 800);
      } catch (error) {
        showToast(error.message, 'error');
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Kích Hoạt Tài Khoản NTU';
      }
    });
  }

  // 6. Xử lý Form Xác Minh OTP (Trang Login Modal)
  const loginOtpForm = document.getElementById('login-otp-form');
  if (loginOtpForm) {
    loginOtpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const otp = document.getElementById('login-otp-input').value.trim();
      const verifyBtn = document.getElementById('login-verify-btn');

      if (!otp || otp.length !== 6) {
        showToast('Vui lòng nhập đúng 6 chữ số OTP!', 'warning');
        return;
      }

      try {
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xác minh...';

        const result = await fetchAPI('/api/auth/verify-otp', {
          method: 'POST',
          body: JSON.stringify({ email: pendingVerificationEmail, otp }),
        });

        setAuthSession(result.data.token, result.data.user);
        showToast('Xác thực thành công!', 'success');

        setTimeout(() => {
          if (result.data.user.role === 'admin') {
            window.location.href = '/admin/dashboard';
          } else {
            window.location.href = '/chat';
          }
        }, 600);
      } catch (error) {
        showToast(error.message, 'error');
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Xác Minh & Đăng Nhập Ngay';
      }
    });
  }
});

// ==========================================
// Helper Functions: OTP Card UI
// ==========================================
function showOtpCard(email, devOtp = null) {
  const registerCard = document.getElementById('register-card');
  const otpCard = document.getElementById('otp-card');
  const targetEmailEl = document.getElementById('otp-target-email');
  const devOtpBox = document.getElementById('dev-otp-box');
  const devOtpCode = document.getElementById('dev-otp-code');
  const otpInput = document.getElementById('otp-input');

  if (registerCard) registerCard.style.display = 'none';
  if (otpCard) otpCard.style.display = 'block';
  if (targetEmailEl) targetEmailEl.innerText = email;

  if (devOtp && devOtpBox && devOtpCode) {
    devOtpBox.style.display = 'block';
    devOtpCode.innerText = devOtp;
  }

  if (otpInput) {
    otpInput.value = '';
    otpInput.focus();
  }

  startResendCountdown();
}

function fillDevOtp() {
  const code = document.getElementById('dev-otp-code')?.innerText;
  const input = document.getElementById('otp-input');
  if (code && input) {
    input.value = code;
    input.focus();
  }
}

function backToRegisterForm(e) {
  if (e) e.preventDefault();
  const registerCard = document.getElementById('register-card');
  const otpCard = document.getElementById('otp-card');
  const submitBtn = document.getElementById('register-submit-btn');

  if (registerCard) registerCard.style.display = 'block';
  if (otpCard) otpCard.style.display = 'none';
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Tiếp Tục Đăng Ký & Nhận Mã OTP <i class="fas fa-arrow-right"></i>';
  }
}

function openLoginOtpModal(email) {
  const loginCard = document.getElementById('login-card');
  const loginOtpCard = document.getElementById('login-otp-card');
  const emailEl = document.getElementById('login-unverified-email');
  const otpInput = document.getElementById('login-otp-input');

  if (loginCard) loginCard.style.display = 'none';
  if (loginOtpCard) loginOtpCard.style.display = 'block';
  if (emailEl) emailEl.innerText = email;
  if (otpInput) {
    otpInput.value = '';
    otpInput.focus();
  }
}

function backToLoginForm(e) {
  if (e) e.preventDefault();
  const loginCard = document.getElementById('login-card');
  const loginOtpCard = document.getElementById('login-otp-card');
  if (loginCard) loginCard.style.display = 'block';
  if (loginOtpCard) loginOtpCard.style.display = 'none';
}

async function handleResendOTP() {
  if (!pendingVerificationEmail) {
    showToast('Không xác định được email cần gửi lại mã.', 'error');
    return;
  }

  try {
    showToast('Đang gửi lại mã OTP mới...', 'info');
    const result = await fetchAPI('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: pendingVerificationEmail }),
    });

    if (result.data?.devOtp) {
      const devOtpBox = document.getElementById('dev-otp-box');
      const devOtpCode = document.getElementById('dev-otp-code');
      if (devOtpBox && devOtpCode) {
        devOtpBox.style.display = 'block';
        devOtpCode.innerText = result.data.devOtp;
      }
    }

    showToast(result.message || 'Mã OTP mới đã được gửi!', 'success');
    startResendCountdown();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleLoginResendOTP() {
  if (!pendingVerificationEmail) return;
  try {
    showToast('Đang gửi lại mã OTP...', 'info');
    const result = await fetchAPI('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: pendingVerificationEmail }),
    });
    showToast(result.message || 'Mã OTP đã được gửi!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function startResendCountdown() {
  const btn = document.getElementById('resend-otp-btn');
  const timer = document.getElementById('resend-timer');
  if (!btn) return;

  btn.disabled = true;
  if (timer) timer.style.display = 'inline';

  let countdown = 60;
  if (timer) timer.innerText = `(${countdown}s)`;

  if (resendTimerInterval) clearInterval(resendTimerInterval);

  resendTimerInterval = setInterval(() => {
    countdown--;
    if (timer) timer.innerText = `(${countdown}s)`;

    if (countdown <= 0) {
      clearInterval(resendTimerInterval);
      btn.disabled = false;
      if (timer) timer.style.display = 'none';
    }
  }, 1000);
}

// ==========================================
// 7. Đăng nhập Nhanh 1-Click Demo Accounts
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
    }, 500);
  } catch (error) {
    showToast(error.message || 'Không thể đăng nhập demo.', 'error');
  }
}
