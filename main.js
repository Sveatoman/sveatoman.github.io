/* ============================================================
   СДН — animations & interactions
   ============================================================ */
(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- Preloader ---------- */
  const preloader = document.getElementById('preloader');
  let preloaderDone = false;

  function finishPreloader() {
    if (preloaderDone) return;
    preloaderDone = true;
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
    preloader.classList.add('hide');
    setTimeout(() => preloader.remove(), 900);
  }

  window.addEventListener('load', () => setTimeout(finishPreloader, reducedMotion ? 0 : 1500));
  setTimeout(finishPreloader, 3200); // fallback, если загрузка затянулась

  /* ---------- Custom cursor ---------- */
  if (finePointer && !reducedMotion) {
    document.body.classList.add('has-cursor');
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    let mx = -100, my = -100, rx = -100, ry = -100, visible = false;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) {
        visible = true;
        rx = mx; ry = my;
      }
    }, { passive: true });

    document.addEventListener('mouseleave', () => { visible = false; dot.style.opacity = ring.style.opacity = 0; });
    document.addEventListener('mouseenter', () => { visible = true; dot.style.opacity = ring.style.opacity = ''; });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    })();

    const hoverSelector = 'a, button, .card, .project-card, .review, input, textarea, select';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverSelector)) ring.classList.add('hovered');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverSelector)) ring.classList.remove('hovered');
    });
  }

  /* ---------- Navbar ---------- */
  const navbar = document.getElementById('navbar');
  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');

  function closeMenu() {
    document.body.classList.remove('nav-open');
    burger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }

  burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    burger.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
  });

  mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Gold particles in hero ---------- */
  const canvas = document.getElementById('heroCanvas');
  if (canvas && !reducedMotion) {
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, particles = [];
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      spawn();
    }

    function spawn() {
      const count = Math.min(110, Math.floor((w * h) / 15000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.7 + 0.5,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -(Math.random() * 0.32 + 0.06),
        baseA: Math.random() * 0.5 + 0.18,
        tw: Math.random() * Math.PI * 2,
        ts: 0.008 + Math.random() * 0.02,
      }));
    }

    const hero = document.querySelector('.hero');
    hero.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }, { passive: true });
    hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.tw += p.ts;

        // отталкивание от курсора
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 14400) {
          const d = Math.sqrt(dist2) || 1;
          const force = (1 - d / 120) * 0.9;
          p.x += (dx / d) * force;
          p.y += (dy / d) * force;
        }

        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        const a = p.baseA + Math.sin(p.tw) * 0.22;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 196, 100, ${Math.max(0, a).toFixed(3)})`;
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();
    tick();
  }

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  document.querySelectorAll('[data-stagger]').forEach((parent) => {
    parent.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((child, i) => {
      child.style.transitionDelay = `${Math.min(i * 90, 540)}ms`;
    });
  });

  const revealIO = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealIO.unobserve(entry.target);
      }
    }
  }, { threshold: 0.14, rootMargin: '0px 0px -46px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el) => revealIO.observe(el));

  /* ---------- Counters ---------- */
  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 1900;
    const t0 = performance.now();

    function frame(t) {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('ru-RU') + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const counterIO = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterIO.unobserve(entry.target);
      }
    }
  }, { threshold: 0.5 });

  document.querySelectorAll('.counter').forEach((el) => counterIO.observe(el));

  /* ---------- Scroll spy ---------- */
  const navLinks = document.querySelectorAll('.nav-link');
  const spy = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
      }
    }
  }, { rootMargin: '-42% 0px -52% 0px' });

  ['about', 'solutions', 'process', 'projects', 'reviews', 'contact'].forEach((id) => {
    const sec = document.getElementById(id);
    if (sec) spy.observe(sec);
  });

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reducedMotion) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    /* ---------- Tilt cards ---------- */
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(950px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- Contact form ---------- */
  const form = document.getElementById('contactForm');
  const formCard = form.closest('.form-card');
  const success = document.getElementById('formSuccess');
  const formStatus = document.getElementById('formStatus');
  const submitButton = form.querySelector('[type="submit"]');
  const submitLabel = submitButton.querySelector('.btn-label');

  function setFieldError(input, hasError) {
    const field = input.closest('.field');
    if (field) field.classList.toggle('error', hasError);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('fName');
    const phone = document.getElementById('fPhone');
    const email = document.getElementById('fEmail');

    let valid = true;

    if (name.value.trim().length < 2) { setFieldError(name, true); valid = false; } else setFieldError(name, false);
    if (!/^[\d\s()+\-]{7,}$/.test(phone.value.trim())) { setFieldError(phone, true); valid = false; } else setFieldError(phone, false);
    if (email.value.trim() && !/^\S+@\S+\.\S+$/.test(email.value.trim())) { setFieldError(email, true); valid = false; } else setFieldError(email, false);

    if (!valid) return;

    submitButton.disabled = true;
    submitLabel.textContent = 'Отправляем…';
    formStatus.textContent = '';
    formStatus.classList.remove('is-error');

    try {
      const endpoint = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      });

      const result = await response.json();
      if (!response.ok || result.success === false || result.success === 'false') {
        throw new Error(result.message || 'FormSubmit request failed');
      }

      formCard.classList.add('sent');
      success.setAttribute('aria-hidden', 'false');
    } catch (error) {
      if (error instanceof TypeError) {
        form.submit();
        return;
      }

      formStatus.textContent = /activation/i.test(error.message)
        ? 'Форма не активирована. Подтвердите письмо от FormSubmit на sveatoman@gmail.com.'
        : 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.';
      formStatus.classList.add('is-error');
      submitButton.disabled = false;
      submitLabel.textContent = 'Отправить заявку';
    }
  });

  ['fName', 'fPhone', 'fEmail'].forEach((id) => {
    const input = document.getElementById(id);
    input.addEventListener('input', () => setFieldError(input, false));
  });

  document.getElementById('formReset').addEventListener('click', () => {
    form.reset();
    formCard.classList.remove('sent');
    success.setAttribute('aria-hidden', 'true');
    submitButton.disabled = false;
    submitLabel.textContent = 'Отправить заявку';
    formStatus.textContent = '';
    formStatus.classList.remove('is-error');
  });
})();
