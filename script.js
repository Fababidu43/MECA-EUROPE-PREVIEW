const navToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('#primary-nav');
const navLinks = primaryNav ? primaryNav.querySelectorAll('a') : [];
const header = document.querySelector('.header');
const hashLinks = document.querySelectorAll('a[href^="#"]');
const sectionLinks = document.querySelectorAll('.primary-nav a[href^="#"]');
const contactForm = document.querySelector('#contact-form');
const contactFeedback = document.querySelector('#contact-form-feedback');
const heroParallaxImage = document.querySelector('.hero-video-bg');
const parallaxImages = document.querySelectorAll('.intro-figure img, .engage-section .section-figure img, .experience-section .section-figure img');
const keyFiguresSection = document.querySelector('.key-figures-section');
const keyFigureCounters = keyFiguresSection ? keyFiguresSection.querySelectorAll('[data-count]') : [];
const body = document.body;
const timelinePinCtrl = window.timelinePinCtrl || null;
const precisionPinCtrl = window.precisionPinCtrl || null;
/* Récit vertical façon "parc machines" : une page peut en compter plusieurs
   (a-propos.html a "Notre histoire" et "Précision" en plus du parc machines
   lui-même), d'où un tableau d'instances plutôt qu'un unique élément. */
const storyInstances = Array.from(document.querySelectorAll('[data-story]')).map((story) => ({
  list: story.querySelector('[data-story-list]'),
  items: Array.from(story.querySelectorAll('[data-story-item]')),
  railFill: story.querySelector('[data-story-rail]'),
}));

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

/* Rail latéral de chaque récit vertical façon "parc machines" (le parc
   machines lui-même, et sur a-propos.html "Notre histoire" / "Précision") :
   sa hauteur (scaleY) suit la progression du scroll dans sa propre liste, du
   premier au dernier repère. */
const updateStoryRail = () => {
  storyInstances.forEach(({ list, railFill }) => {
    if (!list || !railFill) {
      return;
    }

    const rect = list.getBoundingClientRect();
    const viewportMiddle = window.innerHeight * 0.5;
    const progress = clamp((viewportMiddle - rect.top) / Math.max(1, rect.height), 0, 1);
    railFill.style.transform = `scaleY(${progress})`;
  });
};

/* Chaque étape d'un récit s'« allume » (couleur, texte, index rouge) quand
   elle traverse la bande centrale de l'écran, et le reste ensuite — c'est ce
   défilement qui raconte l'histoire au fil du scroll. */
const setupStoryObserver = () => {
  const allItems = storyInstances.flatMap((instance) => instance.items);
  if (!allItems.length) {
    return;
  }

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    allItems.forEach((item) => item.classList.add('is-active'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-active');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '-42% 0px -15% 0px', threshold: 0 });

  allItems.forEach((item) => observer.observe(item));
};

/* Section "L'atelier" (a-propos.html) : la photo (3 panneaux diagonaux) et
   le bloc texte partent de la droite et arrivent en cascade. Elle doit se
   lancer au même moment que le hero, donc on la déclenche au chargement avec
   le même léger délai que le titre de page, au lieu d'attendre un scroll. */
const setupAtelierReveal = () => {
  const section = document.querySelector('[data-atelier-reveal]');
  if (!section) {
    return;
  }

  if (prefersReducedMotion) {
    section.classList.add('in-view');
    return;
  }

  window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      section.classList.add('in-view');
    });
  }, 1050);
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
    updateStoryRail();
    if (timelinePinCtrl) {
      timelinePinCtrl.update();
    }
    if (precisionPinCtrl) {
      precisionPinCtrl.update();
    }
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

const enableClickPulse = () => {
  const clickTargets = document.querySelectorAll('.button-pill, .plan-phone, .primary-nav a, .sticky-actions a, .contact-form-cancel');

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
    // Si la page est rechargée alors qu'on est déjà scrollé plus bas, les
    // sections situées au-dessus du viewport n'ont jamais été marquées
    // visibles : en remontant, l'IntersectionObserver les détecte comme si
    // elles apparaissaient pour la première fois et rejoue toute l'entrée
    // (rotation/zoom/flou), d'où l'effet "image de travers" au retour en
    // haut de page. On les marque visibles tout de suite, sans animation,
    // puisqu'elles ont déjà été dépassées.
    if (item.getBoundingClientRect().bottom <= 0) {
      item.classList.add('is-visible');
      return;
    }

    observer.observe(item);
  });
};

const setupTintReveal = () => {
  const tintSelectors = '.section-kicker, .key-prefix, .key-figure-phrase .key-arrow, .key-date-month';

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

const setupContactForm = () => {
  if (!contactForm || !contactFeedback) {
    return;
  }

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
      contactFeedback.textContent = '';
    }, 4000);
  });
};

const init = () => {
  setupNavToggle();
  enableClickPulse();
  setupKeyFigureCounters();
  setupTintReveal();
  enhanceHeadingWords();
  setupRevealObserver();
  computeSectionOffsets();
  updateActiveNavLink();
  setupContactForm();
  updateScrollDynamics();
  setupStoryObserver();
  setupAtelierReveal();
  updateStoryRail();
  if (timelinePinCtrl) {
    timelinePinCtrl.update();
  }
  if (precisionPinCtrl) {
    precisionPinCtrl.update();
  }

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
    if (timelinePinCtrl) {
      timelinePinCtrl.measure();
    }
    if (precisionPinCtrl) {
      precisionPinCtrl.measure();
    }
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
    if (timelinePinCtrl) {
      timelinePinCtrl.measure();
    }
    if (precisionPinCtrl) {
      precisionPinCtrl.measure();
    }
    syncScrollState(true);
  }).catch(() => {});
}
