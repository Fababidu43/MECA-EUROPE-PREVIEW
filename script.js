const navToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('#primary-nav');
const navLinks = primaryNav ? primaryNav.querySelectorAll('a') : [];
const header = document.querySelector('.header');
const hashLinks = document.querySelectorAll('a[href^="#"]');
const sectionLinks = document.querySelectorAll('.primary-nav a[href^="#"]');
const openContactModalBtns = document.querySelectorAll('[data-open-contact-modal]');
const contactModal = document.querySelector('#contact-modal');
const closeContactModalBtns = document.querySelectorAll('[data-close-contact-modal]');
const contactForm = document.querySelector('#contact-form');
const contactFeedback = document.querySelector('#contact-form-feedback');
const heroParallaxImage = document.querySelector('.hero-video-bg');
const parallaxImages = document.querySelectorAll('.intro-figure img, .engage-section .section-figure img, .experience-section .section-figure img');
const contactShowcase = document.querySelector('.contact-showcase');
const keyFiguresSection = document.querySelector('.key-figures-section');
const keyFigureCounters = keyFiguresSection ? keyFiguresSection.querySelectorAll('[data-count]') : [];
const body = document.body;

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');
const intersectionScrollItems = Array.from(document.querySelectorAll('[data-intersection-scroll]'));
const sectionTargets = new Map();
const intersectionStates = new Map();

let lastScrollY = window.scrollY || 0;
let scrollFrame = 0;
let forceScrollSync = false;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getScrollOffset = () => (header ? header.offsetHeight : 0) + 18;

const computeSectionOffsets = () => {
  sectionTargets.clear();

  sectionLinks.forEach((link) => {
    const hash = link.getAttribute('href');
    if (!hash || hash.length < 2) {
      return;
    }

    const target = document.querySelector(hash);
    if (target) {
      sectionTargets.set(hash, target);
    }
  });
};

const updateActiveNavLink = () => {
  if (!sectionTargets.size) {
    return;
  }

  const probeY = window.scrollY + getScrollOffset() + 28;
  let activeHash = '#top';

  sectionTargets.forEach((section, hash) => {
    if (probeY >= section.offsetTop) {
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

const getIntersectionState = (element) => {
  if (!intersectionStates.has(element)) {
    intersectionStates.set(element, {
      progress: 0,
      locked: false,
    });
  }

  return intersectionStates.get(element);
};

const syncIntersectionScrolls = (force = false) => {
  if (!intersectionScrollItems.length) {
    return;
  }

  const currentScrollY = window.scrollY || 0;
  const scrollingDown = currentScrollY > lastScrollY;

  if (!force && !scrollingDown) {
    return;
  }

  const viewportHeight = window.innerHeight || 1;

  intersectionScrollItems.forEach((item) => {
    const state = getIntersectionState(item);

    if (state.locked) {
      return;
    }

    const rect = item.getBoundingClientRect();
    const revealStart = viewportHeight * 0.82;
    const revealEnd = -Math.max(0, rect.height * 0.14);
    const span = Math.max(1, revealStart - revealEnd);
    const rawProgress = clamp((revealStart - rect.top) / span, 0, 1);
    const nextProgress = Math.max(state.progress, rawProgress);

    if (nextProgress !== state.progress) {
      state.progress = nextProgress;
      item.style.setProperty('--intersection-reveal', String(nextProgress));
    }

    if (nextProgress >= 1) {
      state.locked = true;
      item.style.setProperty('--intersection-reveal', '1');
    }
  });

  lastScrollY = currentScrollY;
};

const updateScrollDynamics = () => {
  if (prefersReducedMotion) {
    return;
  }

  const viewportWidth = window.innerWidth || 0;
  const viewportHeight = window.innerHeight || 1;
  const mediaRange = viewportWidth <= 760 ? 0 : viewportWidth <= 1024 ? 8 : 14;

  if (heroParallaxImage) {
    const heroRect = heroParallaxImage.getBoundingClientRect();
    const heroProgress = clamp(-heroRect.top / Math.max(heroRect.height, 1), 0, 1);
    const heroShift = viewportWidth <= 760 ? 0 : heroProgress * 18;
    heroParallaxImage.style.setProperty('--hero-parallax-y', `${heroShift}px`);
  }

  parallaxImages.forEach((image) => {
    const rect = image.getBoundingClientRect();

    if (rect.bottom < -80 || rect.top > viewportHeight + 80) {
      return;
    }

    const centerOffset = (rect.top + (rect.height / 2)) - (viewportHeight / 2);
    const ratio = clamp(-centerOffset / viewportHeight, -1, 1);
    const shift = clamp(ratio * mediaRange, -mediaRange, mediaRange);
    image.style.setProperty('--media-parallax-y', `${shift}px`);
  });
};

const syncScrollState = (force = false) => {
  forceScrollSync = forceScrollSync || force;

  if (scrollFrame) {
    return;
  }

  scrollFrame = window.requestAnimationFrame(() => {
    if (header) {
      header.classList.toggle('is-scrolled', (window.scrollY || 0) > 28);
    }

    updateActiveNavLink();
    syncIntersectionScrolls(forceScrollSync);
    updateScrollDynamics();
    lastScrollY = window.scrollY || 0;
    scrollFrame = 0;
    forceScrollSync = false;
  });
};

const scrollToHash = (hash, updateHistory = true) => {
  if (!hash || hash.length < 2) {
    return;
  }

  const target = document.querySelector(hash);
  if (!target) {
    return;
  }

  const top = Math.max(0, window.pageYOffset + target.getBoundingClientRect().top - getScrollOffset());
  window.scrollTo({
    top,
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
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

const setupNavToggle = () => {
  if (!navToggle || !primaryNav) {
    return;
  }

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

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && primaryNav.classList.contains('is-open')) {
      primaryNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.focus();
    }
  });
};

const setupCarousels = () => {
  const carousels = document.querySelectorAll('[data-carousel]');

  carousels.forEach((carousel) => {
    const track = carousel.querySelector('[data-carousel-track]');
    const slides = track ? Array.from(track.querySelectorAll('.carousel-slide')) : [];
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');
    const dotsWrap = carousel.querySelector('[data-carousel-dots]');

    if (!track || slides.length === 0) {
      return;
    }

    let currentIndex = 0;
    let autoPlayTimer;
    let touchStartX = 0;
    let touchEndX = 0;
    let slidesToShow = 3;
    let maxIndex = Math.max(0, slides.length - slidesToShow);
    let dots = [];
    let slideMotionTimer = 0;

    const getSlidesToShow = () => {
      if (window.innerWidth <= 760) {
        return 1;
      }

      if (window.innerWidth <= 1250) {
        return 2;
      }

      return 3;
    };

    const renderDots = () => {
      if (!dotsWrap) {
        return;
      }

      dotsWrap.innerHTML = '';
      dots = [];

      for (let index = 0; index <= maxIndex; index += 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Aller au groupe ${index + 1}`);
        dot.addEventListener('click', () => {
          goToSlide(index, true);
        });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      }
    };

    const updateSlides = (direction = null) => {
      track.style.transform = `translateX(-${(currentIndex * 100) / slidesToShow}%)`;

      slides.forEach((slide, index) => {
        const isActive = index >= currentIndex && index < currentIndex + slidesToShow;
        const slot = isActive ? index - currentIndex : -1;
        const isCenterSlot = slidesToShow === 1 ? slot === 0 : slot === 1;
        slide.classList.toggle('is-active', isActive);
        slide.classList.toggle('is-carousel-start', isActive && slot === 0);
        slide.classList.toggle('is-carousel-center', isActive && isCenterSlot);
        slide.classList.toggle('is-carousel-end', isActive && slot === 2);
        slide.setAttribute('aria-hidden', String(!isActive));
        slide.style.setProperty('--slide-offset', String(Math.max(0, index - currentIndex)));
        slide.style.setProperty('--slide-slot', String(slot));

        if (!isActive) {
          slide.classList.remove('is-entering-forward', 'is-entering-backward');
        }
      });

      dots.forEach((dot, index) => {
        if (!dot) {
          return;
        }

        const isActive = index === currentIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
    };

    const stopAutoPlay = () => {
      if (autoPlayTimer) {
        window.clearInterval(autoPlayTimer);
      }
    };

    const shouldAutoPlay = () => !prefersReducedMotion && window.innerWidth > 1250 && slides.length > 1;

    const startAutoPlay = () => {
      if (!shouldAutoPlay()) {
        stopAutoPlay();
        return;
      }

      stopAutoPlay();
      autoPlayTimer = window.setInterval(() => {
        goToSlide(currentIndex + 1);
      }, 5000);
    };

    const goToSlide = (nextIndex, fromInteraction = false) => {
      const lastIndex = maxIndex;
      const direction = nextIndex === currentIndex
        ? null
        : (nextIndex > currentIndex || (currentIndex === lastIndex && nextIndex === 0))
          ? 'forward'
          : 'backward';

      if (nextIndex < 0) {
        currentIndex = lastIndex;
      } else if (nextIndex > lastIndex) {
        currentIndex = 0;
      } else {
        currentIndex = nextIndex;
      }

      updateSlides(direction);

      if (fromInteraction) {
        startAutoPlay();
      }
    };

    if (slides.length < 2) {
      if (prevBtn) {
        prevBtn.hidden = true;
      }

      if (nextBtn) {
        nextBtn.hidden = true;
      }

      if (dotsWrap) {
        dotsWrap.hidden = true;
      }
    }

    const syncLayout = () => {
      slidesToShow = getSlidesToShow();
      maxIndex = Math.max(0, slides.length - slidesToShow);
      carousel.style.setProperty('--slides-to-show', String(slidesToShow));
      currentIndex = Math.min(currentIndex, maxIndex);

      if (dotsWrap) {
        dotsWrap.hidden = maxIndex === 0;
      }

      renderDots();
      updateSlides();
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        goToSlide(currentIndex - 1, true);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        goToSlide(currentIndex + 1, true);
      });
    }

    track.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', (event) => {
      touchEndX = event.changedTouches[0].clientX;
      const delta = touchStartX - touchEndX;

      if (Math.abs(delta) < 45) {
        return;
      }

      if (delta > 0) {
        goToSlide(currentIndex + 1, true);
      } else {
        goToSlide(currentIndex - 1, true);
      }
    }, { passive: true });

    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);
    carousel.addEventListener('focusin', stopAutoPlay);
    carousel.addEventListener('focusout', startAutoPlay);

    syncLayout();
    startAutoPlay();

    window.addEventListener('resize', () => {
      syncLayout();
      if (shouldAutoPlay()) {
        startAutoPlay();
      } else {
        stopAutoPlay();
      }
    });
  });
};

const enableClickPulse = () => {
  const clickTargets = document.querySelectorAll('.button-pill, .plan-phone, .primary-nav a, .sticky-actions a, .contact-form-cancel, .contact-modal-close');

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

const setupKeyFigureCounters = () => {
  if (!keyFiguresSection || !keyFigureCounters.length) {
    return;
  }

  const numberFormatter = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  });
  const formatValue = (value) => numberFormatter.format(Math.round(value)).replace(/\u202f/g, '\u00a0');
  let hasStarted = false;

  const showFinalValues = () => {
    keyFigureCounters.forEach((counter) => {
      counter.textContent = formatValue(Number(counter.dataset.count || 0));
    });
    keyFiguresSection.classList.add('counters-started');
  };

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    showFinalValues();
    return;
  }

  keyFigureCounters.forEach((counter) => {
    counter.textContent = '0';
  });

  const animateCounter = (counter, index) => {
    const target = Number(counter.dataset.count || 0);
    const duration = clamp(Number(counter.dataset.duration || 1800), 1500, 2200);
    const delay = index * 90;
    let startTime;

    const tick = (timestamp) => {
      if (startTime === undefined) {
        startTime = timestamp + delay;
      }

      const elapsed = timestamp - startTime;
      if (elapsed < 0) {
        window.requestAnimationFrame(tick);
        return;
      }

      const progress = clamp(elapsed / duration, 0, 1);
      const easedProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - (Math.pow(-2 * progress + 2, 3) / 2);

      counter.textContent = formatValue(target * easedProgress);

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        counter.textContent = formatValue(target);
      }
    };

    window.requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || hasStarted) {
        return;
      }

      hasStarted = true;
      keyFiguresSection.classList.add('counters-started');
      keyFigureCounters.forEach(animateCounter);
      observer.unobserve(keyFiguresSection);
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -8% 0px',
  });

  observer.observe(keyFiguresSection);
};

const setupRevealObserver = () => {
  if (prefersReducedMotion) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  if (!('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

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
    observer.observe(item);
  });
};

const setupContactModal = () => {
  if (!openContactModalBtns.length || !contactModal) {
    return;
  }

  const dialog = contactModal.querySelector('.contact-modal-dialog');
  let modalTrigger = null;

  const toggleModal = (isOpen) => {
    contactModal.classList.toggle('is-open', isOpen);
    contactModal.setAttribute('aria-hidden', String(!isOpen));
    body.style.overflow = isOpen ? 'hidden' : '';

    if (isOpen) {
      window.requestAnimationFrame(() => {
        const firstField = contactModal.querySelector('input, textarea, button');
        if (firstField) firstField.focus();
      });
    } else if (modalTrigger) {
      modalTrigger.focus();
      modalTrigger = null;
    }
  };

  openContactModalBtns.forEach((button) => {
    button.addEventListener('click', () => {
      modalTrigger = button;
      toggleModal(true);
    });
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

    if (event.key === 'Tab' && contactModal.classList.contains('is-open') && dialog) {
      const focusable = Array.from(dialog.querySelectorAll('button, input, textarea, a[href]'))
        .filter((element) => !element.hasAttribute('disabled'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
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
      const mailBody = encodeURIComponent(
        `Nom: ${name}\nEmail: ${email}\nTéléphone: ${phone || 'Non renseigné'}\n\nMessage:\n${message}`,
      );

      contactFeedback.textContent = 'Votre messagerie va s\'ouvrir pour envoyer la demande.';
      window.location.href = `mailto:mecaeurope@orange.fr?subject=${subject}&body=${mailBody}`;

      contactForm.reset();
      window.setTimeout(() => {
        toggleModal(false);
        contactFeedback.textContent = '';
      }, 350);
    });
  }
};

const init = () => {
  setupNavToggle();
  setupCarousels();
  enableClickPulse();
  setupKeyFigureCounters();
  setupRevealObserver();
  computeSectionOffsets();
  updateActiveNavLink();
  setupContactModal();
  updateScrollDynamics();

  if (window.location.hash && window.location.hash.length > 1) {
    window.setTimeout(() => {
      scrollToHash(window.location.hash, false);
    }, 0);
  }

  window.addEventListener('pageshow', () => {
    computeSectionOffsets();
    syncScrollState(true);

    if (window.location.hash && window.location.hash.length > 1) {
      window.setTimeout(() => {
        scrollToHash(window.location.hash, false);
      }, 0);
    }
  });

  window.addEventListener('scroll', () => {
    syncScrollState(false);
  }, { passive: true });

  window.addEventListener('resize', () => {
    computeSectionOffsets();
    syncScrollState(true);
    updateScrollDynamics();
  }, { passive: true });

  syncScrollState(true);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

if (document.fonts) {
  document.fonts.ready.then(() => {
    computeSectionOffsets();
    syncScrollState(true);
  }).catch(() => {});
}
