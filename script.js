const navToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('#primary-nav');
const navLinks = primaryNav ? primaryNav.querySelectorAll('a') : [];
const revealItems = document.querySelectorAll('.reveal');
const header = document.querySelector('.header');
const hashLinks = document.querySelectorAll('a[href^="#"]');
const sectionLinks = document.querySelectorAll('.primary-nav a[href^="#"]');
const openContactModalBtn = document.querySelector('[data-open-contact-modal]');
const contactModal = document.querySelector('#contact-modal');
const closeContactModalBtns = document.querySelectorAll('[data-close-contact-modal]');
const contactForm = document.querySelector('#contact-form');
const contactFeedback = document.querySelector('#contact-form-feedback');
const body = document.body;
const parallaxTargets = document.querySelectorAll('.intro-figure img, .section-figure img, .plan-map-wrap');

let lastScrollY = window.scrollY;
let ticking = false;
let directionBuffer = 0;
const headerHideThreshold = 150;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sectionOffsets = new Map();

const getScrollOffset = () => (header ? header.offsetHeight : 0) + 18;

const scrollToHash = (hash, updateHistory = true) => {
  if (!hash || hash.length < 2) {
    return;
  }

  const target = document.querySelector(hash);
  if (!target) {
    return;
  }

  const targetTop = window.pageYOffset + target.getBoundingClientRect().top - getScrollOffset();
  window.scrollTo({
    top: Math.max(0, targetTop),
    behavior: 'smooth',
  });

  if (updateHistory) {
    history.pushState(null, '', hash);
  }
};

hashLinks.forEach((link) => {
  const hash = link.getAttribute('href') || '';
  if (hash.length < 2) {
    return;
  }

  link.addEventListener('click', (event) => {
    event.preventDefault();
    scrollToHash(hash);
  });
});

const markSiteReady = () => {
  body.classList.add('site-ready');
};

requestAnimationFrame(() => {
  requestAnimationFrame(markSiteReady);
});

window.addEventListener('pageshow', () => {
  body.classList.add('site-ready');

  if (header) {
    header.classList.toggle('is-scrolled', window.scrollY > 16);
  }

  if (window.location.hash && window.location.hash.length > 1) {
    setTimeout(() => {
      scrollToHash(window.location.hash, false);
    }, 0);
  }
});

const createScrollProgress = () => {
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  body.appendChild(progress);
  return progress;
};

const scrollProgress = createScrollProgress();

const setScrollProgress = () => {
  const doc = document.documentElement;
  const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
  scrollProgress.style.setProperty('--progress', String(progress));
};

const updateParallax = () => {
  if (prefersReducedMotion || !parallaxTargets.length) {
    return;
  }

  const viewportHeight = window.innerHeight || 1;
  parallaxTargets.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > viewportHeight) {
      return;
    }

    const center = rect.top + (rect.height / 2);
    const normalized = (center / viewportHeight) - 0.5;
    const shift = Math.max(-16, Math.min(16, normalized * -18));
    element.style.setProperty('--parallax-shift', `${shift.toFixed(2)}px`);
  });
};

const computeSectionOffsets = () => {
  sectionOffsets.clear();
  sectionLinks.forEach((link) => {
    const hash = link.getAttribute('href');
    if (!hash || hash.length < 2) {
      return;
    }

    const target = document.querySelector(hash);
    if (!target) {
      return;
    }

    sectionOffsets.set(hash, target);
  });
};

const updateActiveNavLink = () => {
  if (!sectionOffsets.size) {
    return;
  }

  const probeY = window.scrollY + getScrollOffset() + 28;
  let activeHash = '#top';

  sectionOffsets.forEach((section, hash) => {
    const top = section.offsetTop;
    if (probeY >= top) {
      activeHash = hash;
    }
  });

  sectionLinks.forEach((link) => {
    const isActive = link.getAttribute('href') === activeHash;
    link.classList.toggle('is-active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
};

const updateScrollDirection = () => {
  const currentY = window.scrollY;
  const delta = currentY - lastScrollY;

  setScrollProgress();

  if (!header) {
    lastScrollY = currentY;
    return;
  }

  header.classList.toggle('is-scrolled', currentY > 16);

  if (Math.abs(delta) < 3) {
    lastScrollY = currentY;
    updateParallax();
    updateActiveNavLink();
    return;
  }

  directionBuffer += delta;

  if (currentY > headerHideThreshold && directionBuffer > 12) {
    body.classList.add('scroll-down');
    body.classList.remove('scroll-up');
    header.classList.add('is-hidden');
    directionBuffer = 0;
  } else if (directionBuffer < -12 || currentY <= 8) {
    body.classList.add('scroll-up');
    body.classList.remove('scroll-down');
    header.classList.remove('is-hidden');
    directionBuffer = 0;
  }

  updateParallax();
  updateActiveNavLink();
  lastScrollY = currentY;
};

const onScroll = () => {
  if (ticking) {
    return;
  }

  ticking = true;
  window.requestAnimationFrame(() => {
    updateScrollDirection();
    ticking = false;
  });
};

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', () => {
  setScrollProgress();
  computeSectionOffsets();
  updateActiveNavLink();
  updateParallax();
});
setScrollProgress();
computeSectionOffsets();
updateActiveNavLink();
updateParallax();

if (navToggle && primaryNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = primaryNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      primaryNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

if ('IntersectionObserver' in window) {
  const revealImmediatelyIfVisible = (item) => {
    const rect = item.getBoundingClientRect();
    if (rect.top <= window.innerHeight * 0.9) {
      item.classList.add('is-visible');
      return true;
    }
    return false;
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -8% 0px',
  });

  revealItems.forEach((item) => {
    if (!revealImmediatelyIfVisible(item)) {
      observer.observe(item);
    }
  });
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const setupStaggeredEntry = () => {
  const animatedGroups = [
    '.metiers-list .metier-item',
    '.news-grid .news-card',
    '.footer-main > div',
  ];

  animatedGroups.forEach((selector) => {
    const items = document.querySelectorAll(selector);
    items.forEach((item, index) => {
      item.style.setProperty('--stagger-index', String(index));
      item.classList.add('stagger-item');
    });
  });
};

setupStaggeredEntry();

const enableClickPulse = () => {
  const clickTargets = document.querySelectorAll('.button-pill, .plan-phone, .primary-nav a, .sticky-actions a, .scroll-top, .contact-form-cancel, .contact-modal-close');

  clickTargets.forEach((target) => {
    target.classList.add('pulse-target');
    target.addEventListener('click', (event) => {
      if (prefersReducedMotion) {
        return;
      }

      const rect = target.getBoundingClientRect();
      const pulse = document.createElement('span');
      pulse.className = 'click-pulse';
      pulse.style.left = `${event.clientX - rect.left}px`;
      pulse.style.top = `${event.clientY - rect.top}px`;
      target.appendChild(pulse);

      pulse.addEventListener('animationend', () => {
        pulse.remove();
      }, { once: true });
    });
  });
};

enableClickPulse();

if (openContactModalBtn && contactModal) {
  const toggleModal = (isOpen) => {
    contactModal.classList.toggle('is-open', isOpen);
    contactModal.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  openContactModalBtn.addEventListener('click', () => {
    toggleModal(true);
  });

  closeContactModalBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      toggleModal(false);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && contactModal.classList.contains('is-open')) {
      toggleModal(false);
    }
  });

  if (contactForm && contactFeedback) {
    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const formData = new FormData(contactForm);
      const name = String(formData.get('name') || '').trim();
      const email = String(formData.get('email') || '').trim();
      const phone = String(formData.get('phone') || '').trim();
      const message = String(formData.get('message') || '').trim();

      if (!name || !email || !message) {
        contactFeedback.textContent = 'Merci de remplir les champs obligatoires.';
        return;
      }

      const subject = encodeURIComponent(`Demande de contact - ${name}`);
      const body = encodeURIComponent(
        `Nom: ${name}\nEmail: ${email}\nTéléphone: ${phone || 'Non renseigné'}\n\nMessage:\n${message}`,
      );

      contactFeedback.textContent = 'Votre messagerie va s\'ouvrir pour envoyer la demande.';
      window.location.href = `mailto:mecaeurope@orange.fr?subject=${subject}&body=${body}`;

      contactForm.reset();
      setTimeout(() => {
        toggleModal(false);
        contactFeedback.textContent = '';
      }, 350);
    });
  }
}
