// Sticky nav mobile toggle
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// Scroll reveal for .reveal elements
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15 }
);

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// Year in footer
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Smooth scroll for in-page links (extra safety on Safari)
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (links && links.classList.contains('open')) {
      links.classList.remove('open');
      toggle?.setAttribute('aria-expanded', 'false');
    }
  });
});

// Bootloader simulation
(function () {
  const boot = document.getElementById('bootloader');
  if (!boot) return;
  const fill = boot.querySelector('.progress__fill');
  const pctEl = boot.querySelector('.boot__pct');
  const etaEl = boot.querySelector('.boot__eta');
  let progress = 0;

  const formatEta = (ms) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `Estimated time: ${days}d ${hours}hr ${minutes}m ${seconds}s`;
  };

  const totalMs = 3200 + Math.random() * 1400; // 3.2-4.6s arası
  const start = Date.now();

  const tick = () => {
    const elapsed = Date.now() - start;
    progress = Math.min(100, Math.floor((elapsed / totalMs) * 100));
    if (fill) fill.style.width = progress + '%';
    if (pctEl) pctEl.textContent = progress + '%';
    const remaining = totalMs - elapsed;
    if (etaEl) etaEl.textContent = formatEta(remaining);
    if (progress >= 100) {
      boot.style.transition = 'opacity 0.35s ease';
      boot.style.opacity = '0';
      setTimeout(() => boot.remove(), 380);
    } else {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
})();

// Interactive geometric background (particles + lines)
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let width = 0, height = 0;
  const particles = [];
  const MAX_PARTICLES = 150;
  const LINK_DIST = 100;
  const MOUSE_PULL = 0.08;
  const COLORS = ['#4dd3ff', '#a26bff', '#7ab8ff', '#c98838' , '#38c938' , '#3838c9'];
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function spawnParticle() {
    return {
      x: rand(0, width),
      y: rand(0, height),
      vx: rand(-0.4, 0.4),
      vy: rand(-0.4, 0.4),
      r: rand(1.2, 2.2),
      c: COLORS[(Math.random() * COLORS.length) | 0]
    };
  }

  function init() {
    particles.length = 0;
    for (let i = 0; i < MAX_PARTICLES; i++) particles.push(spawnParticle());
  }

  function step() {
    ctx.clearRect(0, 0, width, height);

    // update
    for (const p of particles) {
      // slight pull towards mouse
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < 220) {
        p.vx += (dx / dist) * MOUSE_PULL * 0.2;
        p.vy += (dy / dist) * MOUSE_PULL * 0.2;
      }

      p.x += p.vx;
      p.y += p.vy;

      // bounce on edges
      if (p.x < 0 || p.x > width) p.vx *= -1, p.x = Math.max(0, Math.min(width, p.x));
      if (p.y < 0 || p.y > height) p.vy *= -1, p.y = Math.max(0, Math.min(height, p.y));

      // friction
      p.vx *= 0.995; p.vy *= 0.995;
    }

    // links
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < LINK_DIST) {
          const alpha = (1 - d / LINK_DIST) * 0.6;
          const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          grad.addColorStop(0, 'rgba(77,211,255,' + alpha + ')');
          grad.addColorStop(1, 'rgba(162,107,255,' + alpha + ')');
          ctx.strokeStyle = grad;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // draw particles
    for (const p of particles) {
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(step);
  }

  window.addEventListener('resize', () => { resize(); init(); });
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }, { passive: true });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  resize();
  init();
  step();
})();

