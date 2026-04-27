'use strict';

/* ─── THEME TOGGLE ───────────────────────────────────────── */
(function initTheme() {
  const html      = document.documentElement;
  const toggleBtn = document.querySelector('[data-theme-toggle]');

  let current = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  html.setAttribute('data-theme', current);
  updateIcon(current);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      current = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', current);
      updateIcon(current);
      toggleBtn.setAttribute('aria-label', `Switch to ${current === 'dark' ? 'light' : 'dark'} mode`);
    });
  }

  function updateIcon(theme) {
    if (!toggleBtn) return;
    toggleBtn.innerHTML = theme === 'dark'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }
})();


/* ─── MODAL SYSTEM ───────────────────────────────────────── */
(function initModals() {
  const body       = document.body;
  let activeModal  = null;
  let lastFocused  = null;

  // Open modal
  function openModal(id) {
    const backdrop = document.getElementById(`modal-${id}`);
    if (!backdrop) return;

    // Close any open modal first
    if (activeModal) closeModal(activeModal, false);

    lastFocused = document.activeElement;
    activeModal = backdrop;

    backdrop.removeAttribute('hidden');
    body.classList.add('modal-open');

    // Force reflow so transition plays
    backdrop.getBoundingClientRect();
    backdrop.classList.add('is-open');

    // Focus first focusable element inside
    const focusable = backdrop.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) focusable.focus();

    trapFocus(backdrop);
  }

  // Close modal
  function closeModal(backdrop, returnFocus = true) {
    if (!backdrop) return;
    backdrop.classList.remove('is-open');

    const onEnd = () => {
      backdrop.setAttribute('hidden', '');
      backdrop.removeEventListener('transitionend', onEnd);
      body.classList.remove('modal-open');
      if (returnFocus && lastFocused) lastFocused.focus();
      activeModal = null;
    };

    backdrop.addEventListener('transitionend', onEnd);
  }

  // Open triggers — any element with data-modal="id"
  document.querySelectorAll('[data-modal]').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      openModal(trigger.dataset.modal);
    });
  });

  // Close triggers — data-close inside a modal
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const backdrop = btn.closest('.modal-backdrop');
      closeModal(backdrop);
    });
  });

  // Click outside modal box to close
  document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal(backdrop);
    });
  });

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeModal) closeModal(activeModal);
  });

  // Focus trap inside open modal
  function trapFocus(backdrop) {
    const focusables = backdrop.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];

    function handler(e) {
      if (e.key !== 'Tab') return;
      if (!activeModal) { backdrop.removeEventListener('keydown', handler); return; }

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    backdrop.addEventListener('keydown', handler);
  }
})();


/* ─── TYPED CURSOR ───────────────────────────────────────── */
(function initTyped() {
  const target = document.querySelector('.hero-heading em');
  if (!target) return;

  const phrases = [
    'people actually use.',
    'feels good to use.',
    'stands out.',
    'loads fast.',
    'makes sense.',
  ];

  let phraseIndex = 0, charIndex = 0, isDeleting = false, isPaused = false;

  target.innerHTML = '';
  const textNode = document.createElement('span');
  const cursor   = document.createElement('span');
  cursor.className = 'typed-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.textContent = '|';
  target.appendChild(textNode);
  target.appendChild(cursor);

  function tick() {
    const phrase = phrases[phraseIndex];
    charIndex += isDeleting ? -1 : 1;
    textNode.textContent = phrase.slice(0, charIndex);

    let delay = isDeleting ? 40 : 75;

    if (!isDeleting && charIndex === phrase.length) {
      if (isPaused) { isPaused = false; isDeleting = true; delay = 80; }
      else           { isPaused = true; delay = 1800; }
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 400;
    }

    setTimeout(tick, delay);
  }
  setTimeout(tick, 900);
})();


/* ─── CARD TILT ──────────────────────────────────────────── */
(function initCardTilt() {
  if (window.matchMedia('(hover: none)').matches) return;

  document.addEventListener('mousemove', (e) => {
    const card = e.target.closest('.project-card');
    if (!card) return;

    const rect    = card.getBoundingClientRect();
    const deltaX  = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
    const deltaY  = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);

    card.style.transform =
      `perspective(800px) rotateX(${-(deltaY * 5)}deg) rotateY(${deltaX * 5}deg) translateY(-3px)`;
  });

  document.addEventListener('mouseleave', (e) => {
    const card = e.target.closest?.('.project-card');
    if (card) card.style.transform = '';
  }, true);

  document.querySelectorAll('.project-card').forEach((card) => {
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      card.style.transform  = '';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
})();


/* ─── NAVBAR SCROLL SHADOW ───────────────────────────────── */
(function initNavShadow() {
  const nav = document.querySelector('.nav-wrapper');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 10
      ? '0 1px 24px rgba(0,0,0,0.10)'
      : 'none';
  }, { passive: true });
})();


/* ─── STACK TAG STAGGER ──────────────────────────────────── */
(function initStackStagger() {
  const tags = document.querySelectorAll('.stack-tag');
  tags.forEach((tag, i) => {
    tag.style.opacity   = '0';
    tag.style.transform = 'translateY(8px)';
    tag.style.transition = `opacity 0.4s ease ${0.5 + i * 0.08}s, transform 0.4s cubic-bezier(0.16,1,0.3,1) ${0.5 + i * 0.08}s`;
  });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    tags.forEach((tag) => { tag.style.opacity = '1'; tag.style.transform = 'translateY(0)'; });
  }));
})();


/* ─── INJECT TYPED CURSOR STYLE ──────────────────────────── */
(function injectStyles() {
  const s = document.createElement('style');
  s.textContent = `
    .typed-cursor {
      display: inline-block;
      font-style: normal;
      color: var(--color-primary);
      font-weight: 300;
      margin-left: 1px;
      animation: blink 1s step-end infinite;
    }
    @keyframes blink {
      0%,100% { opacity:1; }
      50%      { opacity:0; }
    }
  `;
  document.head.appendChild(s);
})();