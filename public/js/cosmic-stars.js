/**
 * ==========================================================================
 * AI STUDENT COSMOS - COSMIC STARFIELD & NEBULA CANVAS ENGINE (cosmic-stars.js)
 * High-performance 60FPS interactive starfield, shooting stars & nebula waves
 * ==========================================================================
 */

(function () {
  'use strict';

  class CosmicUniverse {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.width = 0;
      this.height = 0;
      this.stars = [];
      this.meteors = [];
      this.dustParticles = [];
      this.mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false };
      this.animationFrameId = null;
      this.lastTime = 0;
      this.meteorTimer = 0;
      this.theme = document.documentElement.getAttribute('data-theme') || 'dark';

      this.init();
    }

    init() {
      // Tìm hoặc tạo canvas
      this.canvas = document.getElementById('cosmic-canvas');
      if (!this.canvas) {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'cosmic-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100vw';
        this.canvas.style.height = '100vh';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '0';
        document.body.insertBefore(this.canvas, document.body.firstChild);
      }

      this.ctx = this.canvas.getContext('2d');
      this.resize();

      // Khởi tạo các vì sao
      this.createStars();
      this.createDustParticles();

      // Bắt các sự kiện
      window.addEventListener('resize', () => this.resize());
      window.addEventListener('mousemove', (e) => this.onMouseMove(e));
      window.addEventListener('mouseleave', () => this.onMouseLeave());

      // Lắng nghe sự thay đổi theme
      const observer = new MutationObserver(() => {
        this.theme = document.documentElement.getAttribute('data-theme') || 'dark';
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

      // Bắt đầu vòng lặp render
      this.start();
    }

    resize() {
      this.width = this.canvas.width = window.innerWidth;
      this.height = this.canvas.height = window.innerHeight;
      this.createStars();
    }

    onMouseMove(e) {
      this.mouse.targetX = e.clientX;
      this.mouse.targetY = e.clientY;
      this.mouse.active = true;
    }

    onMouseLeave() {
      this.mouse.active = false;
      this.mouse.targetX = -1000;
      this.mouse.targetY = -1000;
    }

    createStars() {
      const count = Math.min(160, Math.floor((this.width * this.height) / 8000));
      this.stars = [];

      // Màu sắc của các vì sao (Trắng, Xanh thiên hà, Tím tinh vân, Vàng kim stardust)
      const starColors = [
        'rgba(255, 255, 255, ',
        'rgba(168, 85, 247, ',
        'rgba(6, 182, 212, ',
        'rgba(244, 63, 94, ',
        'rgba(251, 191, 36, ',
      ];

      for (let i = 0; i < count; i++) {
        this.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 1.6 + 0.4,
          baseAlpha: Math.random() * 0.7 + 0.3,
          alpha: Math.random(),
          twinkleSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          colorBase: starColors[Math.floor(Math.random() * starColors.length)],
          layer: Math.floor(Math.random() * 3) + 1, // 1: gần, 2: vừa, 3: xa
        });
      }
    }

    createDustParticles() {
      const count = 18;
      this.dustParticles = [];
      for (let i = 0; i < count; i++) {
        this.dustParticles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 180 + 80,
          alpha: Math.random() * 0.04 + 0.01,
          color: i % 2 === 0 ? 'rgba(139, 92, 246, ' : 'rgba(6, 182, 212, ',
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
        });
      }
    }

    spawnMeteor() {
      // Tạo sao băng lướt qua ngẫu nhiên
      const startX = Math.random() * (this.width * 0.9);
      const startY = Math.random() * (this.height * 0.4);
      const length = Math.random() * 140 + 80;
      const speed = Math.random() * 12 + 10;
      const angle = (Math.PI / 4) + (Math.random() * 0.2 - 0.1); // ~45 độ
      const colors = ['#00f2fe', '#8b5cf6', '#ffffff', '#fb7185'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.meteors.push({
        x: startX,
        y: startY,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        length: length,
        life: 1.0,
        decay: Math.random() * 0.025 + 0.015,
        color: color,
        width: Math.random() * 2 + 1.2,
      });
    }

    update(dt) {
      // Làm mượt vị trí chuột (lerp)
      this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.1;
      this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.1;

      // Cập nhật vị trí các sao
      for (let star of this.stars) {
        star.x += star.vx;
        star.y += star.vy;

        // Vòng lặp biên
        if (star.x < 0) star.x = this.width;
        if (star.x > this.width) star.x = 0;
        if (star.y < 0) star.y = this.height;
        if (star.y > this.height) star.y = 0;

        // Lấp lánh
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 1 || star.alpha < 0.2) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }
      }

      // Cập nhật bụi tinh vân
      for (let dust of this.dustParticles) {
        dust.x += dust.vx;
        dust.y += dust.vy;
        if (dust.x < -dust.radius) dust.x = this.width + dust.radius;
        if (dust.x > this.width + dust.radius) dust.x = -dust.radius;
        if (dust.y < -dust.radius) dust.y = this.height + dust.radius;
        if (dust.y > this.height + dust.radius) dust.y = -dust.radius;
      }

      // Xử lý sao băng
      this.meteorTimer += dt;
      if (this.meteorTimer > 2.8) {
        if (Math.random() < 0.8) {
          this.spawnMeteor();
        }
        this.meteorTimer = 0;
      }

      for (let i = this.meteors.length - 1; i >= 0; i--) {
        const m = this.meteors[i];
        m.x += m.dx;
        m.y += m.dy;
        m.life -= m.decay;

        if (m.life <= 0 || m.x > this.width + 200 || m.y > this.height + 200) {
          this.meteors.splice(i, 1);
        }
      }
    }

    render() {
      this.ctx.clearRect(0, 0, this.width, this.height);

      const isDark = this.theme === 'dark';

      // 1. Vẽ các đám bụi tinh vân khổng lồ mềm mại (Nebula Clouds)
      if (isDark) {
        for (let dust of this.dustParticles) {
          const gradient = this.ctx.createRadialGradient(
            dust.x, dust.y, 0,
            dust.x, dust.y, dust.radius
          );
          gradient.addColorStop(0, `${dust.color}${dust.alpha})`);
          gradient.addColorStop(0.5, `${dust.color}${dust.alpha * 0.4})`);
          gradient.addColorStop(1, `${dust.color}0)`);

          this.ctx.fillStyle = gradient;
          this.ctx.beginPath();
          this.ctx.arc(dust.x, dust.y, dust.radius, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      // 2. Vẽ liên kết chòm sao gần con trỏ chuột (Constellation Lines)
      if (isDark && this.mouse.active) {
        const connectionDistance = 140;
        for (let i = 0; i < this.stars.length; i++) {
          const star = this.stars[i];
          const distMouse = Math.hypot(star.x - this.mouse.x, star.y - this.mouse.y);
          if (distMouse < connectionDistance) {
            const lineAlpha = (1 - distMouse / connectionDistance) * 0.45;
            this.ctx.strokeStyle = `rgba(6, 182, 212, ${lineAlpha})`;
            this.ctx.lineWidth = 0.8;
            this.ctx.beginPath();
            this.ctx.moveTo(star.x, star.y);
            this.ctx.lineTo(this.mouse.x, this.mouse.y);
            this.ctx.stroke();

            // Vẽ liên kết giữa các sao gần chuột
            for (let j = i + 1; j < this.stars.length; j++) {
              const other = this.stars[j];
              const distStars = Math.hypot(star.x - other.x, star.y - other.y);
              if (distStars < 90) {
                const linkAlpha = (1 - distStars / 90) * (1 - distMouse / connectionDistance) * 0.3;
                this.ctx.strokeStyle = `rgba(168, 85, 247, ${linkAlpha})`;
                this.ctx.lineWidth = 0.6;
                this.ctx.beginPath();
                this.ctx.moveTo(star.x, star.y);
                this.ctx.lineTo(other.x, other.y);
                this.ctx.stroke();
              }
            }
          }
        }
      }

      // 3. Vẽ các vì sao
      for (let star of this.stars) {
        const currentAlpha = isDark ? (star.baseAlpha * star.alpha) : (star.baseAlpha * 0.25);
        this.ctx.fillStyle = `${star.colorBase}${currentAlpha})`;
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Thêm ánh hào quang nhẹ cho các ngôi sao lớn
        if (isDark && star.radius > 1.2 && star.alpha > 0.6) {
          this.ctx.fillStyle = `${star.colorBase}${currentAlpha * 0.35})`;
          this.ctx.beginPath();
          this.ctx.arc(star.x, star.y, star.radius * 2.5, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      // 4. Vẽ sao băng (Shooting Stars)
      if (isDark) {
        for (let m of this.meteors) {
          const tailX = m.x - (m.dx / Math.hypot(m.dx, m.dy)) * m.length;
          const tailY = m.y - (m.dy / Math.hypot(m.dx, m.dy)) * m.length;

          const gradient = this.ctx.createLinearGradient(m.x, m.y, tailX, tailY);
          gradient.addColorStop(0, m.color);
          gradient.addColorStop(0.3, `rgba(255, 255, 255, ${m.life * 0.8})`);
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

          this.ctx.strokeStyle = gradient;
          this.ctx.lineWidth = m.width;
          this.ctx.lineCap = 'round';
          this.ctx.beginPath();
          this.ctx.moveTo(m.x, m.y);
          this.ctx.lineTo(tailX, tailY);
          this.ctx.stroke();

          // Đầu phát sáng rực rỡ của sao băng
          this.ctx.fillStyle = '#ffffff';
          this.ctx.beginPath();
          this.ctx.arc(m.x, m.y, m.width * 1.5, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }

    start() {
      const loop = (timestamp) => {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.render();
        this.animationFrameId = requestAnimationFrame(loop);
      };

      this.animationFrameId = requestAnimationFrame(loop);
    }
  }

  // Khởi chạy khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.cosmicUniverse = new CosmicUniverse();
    });
  } else {
    window.cosmicUniverse = new CosmicUniverse();
  }
})();
