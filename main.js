// ─── THEME TOGGLE ────────────────────────────────────────────
(function () {
  const html = document.documentElement;
  const toggle = document.querySelector('[data-theme-toggle]');
  let theme = html.getAttribute('data-theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  function applyTheme(t) {
    theme = t;
    html.setAttribute('data-theme', t);
    if (toggle) {
      toggle.setAttribute('aria-label', 'Switch to ' + (t === 'dark' ? 'light' : 'dark') + ' mode');
      toggle.innerHTML = t === 'dark'
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    }
  }

  applyTheme(theme);
  toggle && toggle.addEventListener('click', () => applyTheme(theme === 'dark' ? 'light' : 'dark'));
})();


// ─── MODAL SYSTEM ────────────────────────────────────────────
(function () {
  let currentModal = null;
  let lastFocused = null;

  function openModal(id) {
    const backdrop = document.getElementById('modal-' + id);
    if (!backdrop) return;
    lastFocused = document.activeElement;
    if (currentModal) _close(currentModal, false);
    currentModal = backdrop;
    backdrop.removeAttribute('hidden');
    requestAnimationFrame(() => backdrop.classList.add('is-open'));
    document.body.classList.add('modal-open');
    const focusable = backdrop.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
    backdrop.addEventListener('keydown', trapFocus);
  }

  function closeModal(backdrop) {
    _close(backdrop, true);
  }

  function _close(backdrop, restoreFocus) {
    backdrop.classList.remove('is-open');
    backdrop.removeEventListener('keydown', trapFocus);
    const onEnd = () => {
      backdrop.setAttribute('hidden', '');
      backdrop.removeEventListener('transitionend', onEnd);
    };
    backdrop.addEventListener('transitionend', onEnd);
    document.body.classList.remove('modal-open');
    currentModal = null;
    if (restoreFocus && lastFocused) lastFocused.focus();
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusable = Array.from(e.currentTarget.querySelectorAll(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  // Open via data-modal attribute
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-modal]');
    if (trigger) openModal(trigger.dataset.modal);
  });

  // Close via data-close button
  document.addEventListener('click', e => {
    if (e.target.closest('[data-close]') && currentModal) closeModal(currentModal);
  });

  // Close on backdrop click
  document.addEventListener('click', e => {
    if (currentModal && e.target === currentModal) closeModal(currentModal);
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && currentModal) closeModal(currentModal);
  });

  // Expose for lightbox / highlights
  window._openModal  = openModal;
  window._closeModal = () => { if (currentModal) closeModal(currentModal); };
})();


// ─── HAMBURGER MOBILE MENU ───────────────────────────────────
(function () {
  const hamburger  = document.querySelector('.nav-hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!hamburger || !mobileMenu) return;

  function toggleMenu(open) {
    hamburger.classList.toggle('is-open', open);
    mobileMenu.classList.toggle('is-open', open);
    hamburger.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
  }

  hamburger.addEventListener('click', () => {
    toggleMenu(!hamburger.classList.contains('is-open'));
  });

  // Close when a mobile nav link is tapped
  mobileMenu.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', () => toggleMenu(false));
  });

  // Escape closes menu
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && hamburger.classList.contains('is-open')) toggleMenu(false);
  });
})();


// ─── GALLERY FILTER ──────────────────────────────────────────
(function () {
  const filterBtns  = document.querySelectorAll('.gallery-filter');
  const galleryItems = document.querySelectorAll('.gallery-item');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      filterBtns.forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');

      galleryItems.forEach(item => {
        const match = filter === 'all' || item.dataset.category === filter;
        // Fade out first
        item.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        item.style.opacity    = '0';
        item.style.transform  = 'scale(0.95)';

        setTimeout(() => {
          item.style.display = match ? 'block' : 'none';
          if (match) {
            requestAnimationFrame(() => {
              item.style.transition = 'opacity 0.35s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1)';
              item.style.opacity    = '1';
              item.style.transform  = 'scale(1)';
            });
          }
        }, 200);
      });
    });
  });
})();


// ─── LIGHTBOX ────────────────────────────────────────────────
(function () {
  const lightbox  = document.getElementById('lightbox');
  if (!lightbox) return;

  const lbImg     = lightbox.querySelector('.lightbox-img');
  const lbTitle   = lightbox.querySelector('.lightbox-title');
  const lbMeta    = lightbox.querySelector('.lightbox-meta');
  const lbCounter = lightbox.querySelector('.lightbox-counter');
  const lbClose   = lightbox.querySelector('.lightbox-close');
  const lbPrev    = lightbox.querySelector('.lightbox-prev');
  const lbNext    = lightbox.querySelector('.lightbox-next');

  let currentItems = [];
  let currentIndex = 0;

  // Build data arrays from the DOM
  function getGalleryData() {
    return Array.from(document.querySelectorAll('.gallery-item')).map(item => ({
      src:      item.querySelector('img').src,
      alt:      item.querySelector('img').alt,
      title:    item.querySelector('.gallery-item-title')?.textContent.trim() || '',
      category: item.querySelector('.gallery-item-cat')?.textContent.trim()   || '',
    }));
  }

  function getHighlightData() {
    return Array.from(document.querySelectorAll('.highlight-card')).map(card => ({
      src:   card.querySelector('img').src,
      alt:   card.querySelector('img').alt,
      title: card.querySelector('.highlight-title')?.textContent.trim() || '',
      category: card.querySelector('.highlight-date')?.textContent.trim() || '',
    }));
  }

  function openLightbox(items, index) {
    currentItems = items;
    currentIndex = Math.max(0, Math.min(index, items.length - 1));
    lightbox.removeAttribute('hidden');
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => lightbox.classList.add('is-open'));
    renderSlide();
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    setTimeout(() => lightbox.setAttribute('hidden', ''), 300);
  }

  function renderSlide() {
    const item = currentItems[currentIndex];
    // Fade out
    lbImg.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    lbImg.style.opacity    = '0';
    lbImg.style.transform  = 'scale(0.97)';

    setTimeout(() => {
      lbImg.src         = item.src;
      lbImg.alt         = item.alt || item.title;
      lbTitle.textContent = item.title;
      lbMeta.textContent  = item.category || '';
      lbCounter.textContent = (currentIndex + 1) + ' / ' + currentItems.length;
      // Fade in
      lbImg.style.transition = 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.16,1,0.3,1)';
      lbImg.style.opacity    = '1';
      lbImg.style.transform  = 'scale(1)';
    }, 150);

    lbPrev.style.opacity      = currentIndex > 0 ? '1' : '0.3';
    lbPrev.style.pointerEvents = currentIndex > 0 ? 'auto' : 'none';
    lbNext.style.opacity      = currentIndex < currentItems.length - 1 ? '1' : '0.3';
    lbNext.style.pointerEvents = currentIndex < currentItems.length - 1 ? 'auto' : 'none';
  }

  function navigate(dir) {
    const next = currentIndex + dir;
    if (next < 0 || next >= currentItems.length) return;
    currentIndex = next;
    renderSlide();
  }

  // Open from gallery grid
  document.addEventListener('click', e => {
    const galleryBtn = e.target.closest('.gallery-item');
    if (!galleryBtn) return;
    // Don't open if click was on gallery-item inside a lightbox
    if (lightbox.contains(galleryBtn)) return;
    const index = parseInt(galleryBtn.dataset.index, 10) || 0;
    openLightbox(getGalleryData(), index);
  });

  // Open from highlight strip — opens gallery modal first, then lightbox
  document.addEventListener('click', e => {
    const hlCard = e.target.closest('[data-gallery-open]');
    if (!hlCard) return;
    const index = parseInt(hlCard.dataset.galleryOpen, 10) || 0;
    window._openModal && window._openModal('gallery');
    setTimeout(() => openLightbox(getGalleryData(), index), 380);
  });

  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click',  () => navigate(-1));
  lbNext.addEventListener('click',  () => navigate(1));

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'ArrowLeft')  navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
    if (e.key === 'Escape')     closeLightbox();
  });

  // Touch swipe
  let touchStartX = 0;
  lightbox.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) navigate(dx < 0 ? 1 : -1);
  }, { passive: true });

  // Close lightbox on backdrop click (not on image/controls)
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });
})();


// ─── SCROLL REVEAL ───────────────────────────────────────────
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = document.querySelectorAll(
    '.hero-eyebrow, .hero-heading, .hero-sub, .hero-cta, .hero-stack, .hero-photo-wrap, .highlights-strip'
  );

  targets.forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition =
      `opacity 0.65s ease ${i * 0.08}s, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s`;
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  targets.forEach(el => observer.observe(el));
})();