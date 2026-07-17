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
const tintStates = new Map();
let tintScrollItems = [];

let lastScrollY = window.scrollY || 0;
let scrollFrame = 0;
let forceScrollSync = false;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const NAV_ACTIVE_LOOKAHEAD = 120;

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

  const probeY = window.scrollY + getScrollOffset() + NAV_ACTIVE_LOOKAHEAD;
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

const getTintState = (element) => {
  if (!tintStates.has(element)) {
    tintStates.set(element, {
      progress: 0,
      locked: false,
    });
  }

  return tintStates.get(element);
};

const syncTintReveal = (force = false) => {
  if (!tintScrollItems.length) {
    return;
  }

  const currentScrollY = window.scrollY || 0;
  const scrollingDown = currentScrollY > lastScrollY;

  if (!force && !scrollingDown) {
    return;
  }

  const viewportHeight = window.innerHeight || 1;
  const revealStart = viewportHeight * 0.7;
  const revealEnd = viewportHeight * 0.38;
  const span = Math.max(1, revealStart - revealEnd);

  tintScrollItems.forEach((item) => {
    const state = getTintState(item);

    if (state.locked) {
      return;
    }

    const rect = item.getBoundingClientRect();
    const rawProgress = clamp((revealStart - rect.top) / span, 0, 1);
    const nextProgress = Math.max(state.progress, rawProgress);

    if (nextProgress !== state.progress) {
      state.progress = nextProgress;
      item.style.setProperty('--tint-reveal', String(nextProgress));
    }

    if (nextProgress >= 1) {
      state.locked = true;
      item.style.setProperty('--tint-reveal', '1');
    }
  });
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
    syncTintReveal(forceScrollSync);
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
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');
    const indicatorRotor = carousel.querySelector('[data-carousel-indicator-rotor]');

    if (!track) {
      return;
    }

    let slidesToShow = 3;
    let isAnimating = false;
    let pendingDirection = null;
    let autoPlayTimer;
    let touchStartX = 0;
    let touchEndX = 0;
    let indicatorRotation = 0;
    let resizeDebounce;

    // Le déplacement d'un slide est calculé en CSS (calc()), avec exactement
    // la même formule que le flex-basis des slides dans le CSS. Comme ça, le
    // navigateur fait le calcul lui-même : impossible d'avoir un écart de
    // sous-pixel entre "ce que le JS croit" et "ce que le CSS affiche
    // réellement" (c'était la cause du micro-recentrage visible au wrap).
    const SLIDE_STEP_EXPR = 'calc((100% - (var(--slides-to-show) - 1) * var(--carousel-gap)) / var(--slides-to-show) + var(--carousel-gap))';

    const getSlides = () => Array.from(track.children).filter((slide) => slide.classList.contains('carousel-slide'));

    const getSlidesToShow = () => {
      if (window.innerWidth <= 760) {
        return 1;
      }

      if (window.innerWidth <= 1250) {
        return 2;
      }

      return 3;
    };

    const getCarouselGap = () => {
      const value = window.getComputedStyle(carousel).getPropertyValue('--carousel-gap');
      const parsed = Number.parseFloat(value);

      return Number.isFinite(parsed) ? parsed : 18;
    };

    const stopAutoPlay = () => {
      if (autoPlayTimer) {
        window.clearInterval(autoPlayTimer);
        autoPlayTimer = undefined;
      }
    };

    const shouldAutoPlay = () => !prefersReducedMotion && window.innerWidth > 1250 && getSlides().length > 1;

    const startAutoPlay = () => {
      if (!shouldAutoPlay()) {
        stopAutoPlay();
        return;
      }

      stopAutoPlay();
      autoPlayTimer = window.setInterval(() => {
        goNext(false);
      }, 8000);
    };

    const rotateIndicator = (direction) => {
      if (!indicatorRotor || !direction) {
        return;
      }

      indicatorRotation += direction === 'next' ? 90 : -90;
      indicatorRotor.style.setProperty('--indicator-rotation', `${indicatorRotation}deg`);
    };

    const syncVisibleState = () => {
      const slides = getSlides();

      slides.forEach((slide, index) => {
        const isVisible = index < slidesToShow;
        const slot = isVisible ? index : -1;
        const isCenterSlot = slidesToShow === 1 ? slot === 0 : slot === 1;

        slide.classList.toggle('is-active', isVisible);
        slide.classList.toggle('is-carousel-start', isVisible && slot === 0);
        slide.classList.toggle('is-carousel-center', isVisible && isCenterSlot);
        slide.classList.toggle('is-carousel-end', isVisible && slot === slidesToShow - 1);
        slide.setAttribute('aria-hidden', String(!isVisible));
      });
    };

    const measureLayout = () => {
      const gap = getCarouselGap();

      carousel.style.setProperty('--slides-to-show', String(slidesToShow));
      carousel.style.setProperty('--carousel-gap', `${gap}px`);
      // Le pas de déplacement n'est plus mesuré en JS : il est délégué au CSS
      // via calc(), en pointant vers les mêmes variables que le flex-basis.
      carousel.style.setProperty('--slide-step', SLIDE_STEP_EXPR);
    };

    const resetPosition = () => {
      track.style.transition = 'none';
      track.style.transform = 'translateX(0)';
    };

    const finalizeMove = (direction) => {
      track.style.transition = 'none';

      if (direction === 'next') {
        const firstSlide = track.firstElementChild;

        if (firstSlide) {
          track.append(firstSlide);
        }

        track.style.transform = 'translateX(0)';
      }

      pendingDirection = null;
      isAnimating = false;
    };

    const goNext = (fromInteraction = false) => {
      if (isAnimating || getSlides().length <= 1) {
        return;
      }

      isAnimating = true;
      pendingDirection = 'next';
      rotateIndicator('next');
      track.style.transition = 'transform 0.5s ease';
      track.style.transform = 'translateX(calc(-1 * var(--slide-step)))';

      if (fromInteraction) {
        startAutoPlay();
      }
    };

    const goPrev = (fromInteraction = false) => {
      if (isAnimating || getSlides().length <= 1) return;

      isAnimating = true;
      pendingDirection = 'prev';
      rotateIndicator('prev');

      track.style.transition = 'none';

      const lastSlide = track.lastElementChild;

      if (lastSlide) {
        track.prepend(lastSlide);
      }

      track.style.transform = 'translateX(calc(-1 * var(--slide-step)))';

      // Force le navigateur à appliquer la position initiale
      track.offsetHeight;

      track.style.transition = 'transform 0.5s ease';
      track.style.transform = 'translateX(0)';

      if (fromInteraction) {
        startAutoPlay();
      }
    };

    const onMoveRequest = (step, fromInteraction = false) => {
      if (step > 0) {
        goNext(fromInteraction);
      } else {
        goPrev(fromInteraction);
      }
    };

    if (getSlides().length < 2) {
      if (prevBtn) {
        prevBtn.hidden = true;
      }

      if (nextBtn) {
        nextBtn.hidden = true;
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        onMoveRequest(-1, true);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        onMoveRequest(1, true);
      });
    }

    track.addEventListener('transitionend', (event) => {
      if (event.propertyName !== 'transform' || !isAnimating) {
        return;
      }

      finalizeMove(pendingDirection);
    });

    track.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', (event) => {
      touchEndX = event.changedTouches[0].clientX;
      const delta = touchStartX - touchEndX;

      if (Math.abs(delta) < 45) {
        return;
      }

      onMoveRequest(delta > 0 ? 1 : -1, true);
    }, { passive: true });

    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);
    carousel.addEventListener('focusin', stopAutoPlay);
    carousel.addEventListener('focusout', startAutoPlay);

    const syncLayout = () => {
      slidesToShow = getSlidesToShow();
      measureLayout();
      resetPosition();
      syncVisibleState();
      isAnimating = false;
      pendingDirection = null;
    };

    const handleResize = () => {
      window.clearTimeout(resizeDebounce);
      resizeDebounce = window.setTimeout(() => {
        syncLayout();
        if (shouldAutoPlay()) {
          startAutoPlay();
        } else {
          stopAutoPlay();
        }
      }, 50);
    };

    const refreshAfterAssets = () => {
      syncLayout();
    };

    syncLayout();
    startAutoPlay();

    // Toujours utile pour re-synchroniser --slides-to-show quand on passe
    // un breakpoint (1 / 2 / 3 slides visibles).
    const viewportEl = carousel.querySelector('.carousel-viewport');

    if (viewportEl && 'ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });

      resizeObserver.observe(viewportEl);
    } else {
      window.addEventListener('resize', handleResize);
    }

    if (document.readyState === 'complete') {
      refreshAfterAssets();
    } else {
      window.addEventListener('load', refreshAfterAssets, { once: true });
    }

    if (document.fonts && typeof document.fonts.ready?.then === 'function') {
      document.fonts.ready.then(refreshAfterAssets).catch(() => {});
    }

    const carouselImages = Array.from(carousel.querySelectorAll('img'));

    carouselImages.forEach((image) => {
      if (image.complete) {
        return;
      }

      image.addEventListener('load', refreshAfterAssets, { once: true });
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

const setupTintReveal = () => {
  const tintSelectors = '.section-kicker, .key-prefix, .key-figure-phrase .key-arrow, .key-date-month, .focus-note';

  if (prefersReducedMotion) {
    tintScrollItems = [];
    return;
  }

  tintScrollItems = Array.from(document.querySelectorAll(tintSelectors));
};

const enhanceHeadingWords = () => {
  if (prefersReducedMotion) {
    return;
  }

  document.querySelectorAll('.reveal h2').forEach((heading) => {
    if (heading.dataset.wordReveal) {
      return;
    }

    // Les titres qui contiennent déjà des éléments inline "riches" (mark,
    // spans de surlignage, etc.) sont laissés intacts. Le découpage mot par mot
    // les casse visuellement en doublant/masquant certaines couches de texte.
    if (heading.closest('.contact-showcase') || heading.querySelector('mark, .contact-highlight')) {
      return;
    }

    heading.dataset.wordReveal = 'true';

    const nodes = Array.from(heading.childNodes);
    heading.textContent = '';
    let index = 0;

    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const parts = node.textContent.split(/(\s+)/).filter((part) => part.length);

        parts.forEach((part) => {
          if (/^\s+$/.test(part)) {
            heading.appendChild(document.createTextNode(part));
            return;
          }

          const wrapper = document.createElement('span');
          wrapper.className = 'word-reveal';
          wrapper.style.setProperty('--word-index', String(index));
          index += 1;

          const inner = document.createElement('span');
          inner.textContent = part;
          wrapper.appendChild(inner);
          heading.appendChild(wrapper);
        });

        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
        heading.appendChild(node.cloneNode(true));
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const wrapper = document.createElement('span');
        wrapper.className = 'word-reveal';
        wrapper.style.setProperty('--word-index', String(index));
        index += 1;
        wrapper.appendChild(node.cloneNode(true));
        heading.appendChild(wrapper);
      }
    });
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
  setupTintReveal();
  enhanceHeadingWords();
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
