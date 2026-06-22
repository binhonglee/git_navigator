// ===== Scroll reveal =====
(() => {
  const els = Array.from(document.querySelectorAll('[data-reveal]'));
  if (!els.length) return;

  const showAll = () => els.forEach(e => e.classList.add('is-visible'));

  if (!('IntersectionObserver' in window)) { showAll(); return; }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  els.forEach(e => io.observe(e));
  // Safety fallback
  setTimeout(showAll, 3500);
})();

// ===== Media overlay =====
(() => {
  const overlay = document.querySelector('.overlay');
  if (!overlay) return;

  const overlayBody = overlay.querySelector('.overlay-body');
  const closeButton = overlay.querySelector('.overlay-close');
  if (!overlayBody || !closeButton) return;

  const openOverlay = (node) => {
    overlayBody.innerHTML = '';
    overlayBody.appendChild(node);
    overlay.classList.add('is-active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  };

  const closeOverlay = () => {
    overlay.classList.remove('is-active');
    overlay.setAttribute('aria-hidden', 'true');
    overlayBody.innerHTML = '';
    document.body.classList.remove('no-scroll');
  };

  const bindMedia = (media) => {
    media.addEventListener('click', () => {
      if (media.tagName === 'VIDEO') {
        const zoomVideo = document.createElement('video');
        zoomVideo.src = media.currentSrc || media.src;
        zoomVideo.controls = true;
        zoomVideo.autoplay = true;
        zoomVideo.loop = true;
        zoomVideo.playsInline = true;
        zoomVideo.muted = true;
        openOverlay(zoomVideo);
      } else {
        const zoomImage = document.createElement('img');
        zoomImage.src = media.currentSrc || media.src;
        zoomImage.alt = media.alt || 'Expanded view';
        openOverlay(zoomImage);
      }
    });
  };

  document.querySelectorAll('[data-zoom]').forEach(bindMedia);

  closeButton.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeOverlay();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('is-active')) closeOverlay();
  });
})();

// ===== Platform detection =====
const detectPlatform = () => {
  const ua = navigator.userAgent || '';
  const userAgentDataPlatform = navigator.userAgentData?.platform || '';
  const legacyPlatform = navigator.platform || '';
  const source = `${ua} ${userAgentDataPlatform} ${legacyPlatform}`.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(source) || (legacyPlatform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = source.includes('android');
  if (isIOS || isAndroid) return null;
  if (source.includes('mac')) return 'macos';
  if (source.includes('win')) return 'windows';
  if (source.includes('linux')) return 'linux';
  return null;
};

// ===== Download page: recommend platform =====
(() => {
  const page = document.querySelector('[data-download-page]');
  if (!page) return;
  const platform = detectPlatform();
  if (!platform) return;
  const card = page.querySelector(`.platform-card[data-os="${platform}"]`);
  if (!card) return;
  card.classList.add('is-recommended');
  const badge = card.querySelector('.platform-badge');
  if (badge) badge.hidden = false;
  card.parentElement.prepend(card);
})();

// ===== Sidebar toggle (docs) =====
(() => {
  const toggle = document.querySelector('.sidebar-toggle');
  if (!toggle) return;
  const backdrop = document.querySelector('.sidebar-backdrop');

  const setOpen = (open) => {
    document.body.classList.toggle('sidebar-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  toggle.addEventListener('click', () => {
    setOpen(!document.body.classList.contains('sidebar-open'));
  });
  if (backdrop) {
    backdrop.addEventListener('click', () => setOpen(false));
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
  document.querySelectorAll('.docs-sidebar a, .docs-layout .docs-sidebar a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });
})();

// ===== Walkthrough mode toggle =====
document.querySelectorAll('.walkthrough-modes').forEach(group => {
  const tabs = Array.from(group.querySelectorAll('.walkthrough-mode-btn'));
  const lists = Array.from(group.parentElement.querySelectorAll('.walkthrough[data-mode]'));
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;
      tabs.forEach(t => {
        const active = t.dataset.target === target;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      lists.forEach(list => {
        list.toggleAttribute('hidden', list.dataset.mode !== target);
      });
    });
  });
});

// ===== Docs "On this page" scrollspy =====
(() => {
  const rail = document.querySelector('.docs-rail');
  if (!rail) return;

  const links = Array.from(rail.querySelectorAll('a[href^="#"]'));
  if (!links.length) return;

  // Map each rail link to its target heading element.
  const entries = links
    .map((link) => {
      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      const target = document.getElementById(id);
      return target ? { link, target } : null;
    })
    .filter(Boolean);
  if (!entries.length) return;

  const setActive = (link) => {
    links.forEach((l) => l.classList.toggle('active', l === link));
  };

  // Offset for the sticky header so a heading counts as "current" once it
  // scrolls near the top of the viewport.
  const headerOffset = 90;

  const onScroll = () => {
    const scrollPos = window.scrollY + headerOffset;
    let current = entries[0];
    for (const entry of entries) {
      if (entry.target.offsetTop <= scrollPos) {
        current = entry;
      } else {
        break;
      }
    }
    // At the very bottom of the page, highlight the last section.
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 2) {
      current = entries[entries.length - 1];
    }
    setActive(current.link);
  };

  let ticking = false;
  const requestScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScroll();
      ticking = false;
    });
  };

  window.addEventListener('scroll', requestScroll, { passive: true });
  window.addEventListener('resize', requestScroll, { passive: true });
  onScroll();
})();

// ===== Docs sidebar: persist scroll position across navigation =====
// (Restore happens inline before first paint to avoid flicker; here we only
// save the position when navigating away.)
(() => {
  const sidebar = document.querySelector('.docs-sidebar');
  if (!sidebar) return;

  const KEY = 'gn-docs-sidebar-scroll';

  sidebar.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      sessionStorage.setItem(KEY, String(sidebar.scrollTop));
    });
  });

  window.addEventListener('pagehide', () => {
    sessionStorage.setItem(KEY, String(sidebar.scrollTop));
  });
})();
