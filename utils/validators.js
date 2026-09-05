/**
 * Bộ kiểm tra dữ liệu đầu vào (Validation Helpers)
 */

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase());
};

const validateRegisterInput = (data) => {
  const errors = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Họ và tên phải có ít nhất 2 ký tự.';
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'Vui lòng cung cấp địa chỉ email hợp lệ.';
  }

  if (!data.password || data.password.length < 6) {
    errors.password = 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

const validateLoginInput = (data) => {
  const errors = {};

  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'Email không hợp lệ.';
  }

  if (!data.password || data.password.length === 0) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

const validateStudyPlanInput = (data) => {
  const errors = {};

  if (!data.goal || data.goal.trim().length === 0) {
    errors.goal = 'Mục tiêu ôn tập/học tập không được để trống.';
  }

  if (!data.targetDate) {
    errors.targetDate = 'Vui lòng chọn ngày dự kiến hoàn thành hoặc ngày thi.';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  };
};

module.exports = {
  isValidEmail,
  validateRegisterInput,
  validateLoginInput,
  validateStudyPlanInput,
};
