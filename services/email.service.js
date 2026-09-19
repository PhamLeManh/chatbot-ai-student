const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: user.trim(),
          pass: pass.trim().replace(/\s+/g, ''), // Xóa khoảng trắng nếu là app password dạng 'xxxx xxxx xxxx xxxx'
        },
      });
      console.log(`[Email Service] Đã cấu hình Gmail SMTP cho: ${user}`);
    } else {
      console.log('[Email Service Notice] Chưa phát hiện cấu hình GMAIL_USER & GMAIL_APP_PASSWORD. Hệ thống đang chạy ở chế độ Debug (in mã OTP trực tiếp ra Terminal).');
    }
  }

  /**
   * Gửi Email Xác Minh Tài Khoản kèm Mã OTP và Link kích hoạt
   */
  async sendVerificationEmail({ to, name, otp, verificationUrl }) {
    const brandName = 'Trường Đại Học Nguyễn Trãi (NTU)';
    const subject = `[NTU] Mã xác minh tài khoản của bạn: ${otp}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 20px; }
        .email-card { max-width: 580px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .email-header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px 20px; text-align: center; }
        .email-header h1 { margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
        .email-header p { margin: 5px 0 0; color: #bfdbfe; font-size: 13px; }
        .email-body { padding: 30px; }
        .greeting { font-size: 16px; font-weight: 600; color: #f9fafb; margin-bottom: 15px; }
        .message-text { font-size: 14px; line-height: 1.6; color: #9ca3af; margin-bottom: 25px; }
        .otp-container { background: #1f2937; border: 2px dashed #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0; }
        .otp-label { font-size: 12px; font-weight: 700; color: #93c5fd; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #60a5fa; font-family: 'Courier New', Courier, monospace; }
        .otp-expiry { font-size: 12px; color: #f87171; margin-top: 8px; }
        .btn-verify { display: block; width: 220px; margin: 25px auto; padding: 12px 24px; background: #2563eb; color: #ffffff !important; text-decoration: none; font-weight: 700; text-align: center; border-radius: 6px; font-size: 14px; }
        .footer-note { font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; padding-top: 20px; margin-top: 25px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="email-card">
        <div class="email-header">
          <h1>🏛️ ${brandName}</h1>
          <p>Trợ Lý AI Đồng Hành & Tư Vấn Học Tập Sinh Viên</p>
        </div>
        <div class="email-body">
          <div class="greeting">Xin chào ${name || 'Bạn'},</div>
          <div class="message-text">
            Cảm ơn bạn đã đăng ký tài khoản trên nền tảng <strong>Trợ Lý AI Đại Học Nguyễn Trãi</strong>. 
            Để kích hoạt tài khoản và bắt đầu sử dụng, vui lòng sử dụng mã OTP xác minh bên dưới:
          </div>
          
          <div class="otp-container">
            <div class="otp-label">MÃ XÁC MINH (OTP)</div>
            <div class="otp-code">${otp}</div>
            <div class="otp-expiry">⏳ Mã xác minh có hiệu lực trong vòng 15 phút</div>
          </div>

          <div style="text-align: center; color: #9ca3af; font-size: 13px;">
            Hoặc bạn có thể nhấn trực tiếp vào liên kết bên dưới để xác minh ngay lập tức:
          </div>

          <a href="${verificationUrl}" class="btn-verify" target="_blank">
            Xác Minh Tài Khoản Ngay &rarr;
          </a>

          <div class="footer-note">
            Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.<br>
            &copy; 2026 Trường Đại Học Nguyễn Trãi (NTU) • 28A Lê Trọng Tấn, Hà Đông, Hà Nội.
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    // In mã OTP và Link xác minh ra Terminal để thuận tiện kiểm thử
    console.log('\n' + '='.repeat(60));
    console.log(`📬 [GMAIL VERIFICATION OTP] Gửi tới: ${to}`);
    console.log(`🔑 MÃ OTP 6 SỐ: ${otp}`);
    console.log(`🔗 LINK XÁC MINH: ${verificationUrl}`);
    console.log('='.repeat(60) + '\n');

    // Nếu có cấu hình Gmail thì tiến hành gửi qua SMTP
    if (this.transporter) {
      try {
        const mailOptions = {
          from: `"Đại Học Nguyễn Trãi (NTU AI)" <${process.env.GMAIL_USER}>`,
          to,
          subject,
          html: htmlContent,
        };
        const info = await this.transporter.sendMail(mailOptions);
        console.log(`[Email Service] Đã gửi email xác minh thành công tới ${to} (ID: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.warn(`[Email Service Warning] Gửi qua Gmail SMTP thất bại: ${err.message}. Mã OTP vẫn có thể dùng từ Terminal.`);
        return { success: false, error: err.message, devOtp: otp };
      }
    }

    return { success: true, isDevMock: true, devOtp: otp };
  }
}

module.exports = new EmailService();
