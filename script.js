const navToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('#primary-nav');
const navLinks = primaryNav ? primaryNav.querySelectorAll('a') : [];
const revealItems = document.querySelectorAll('.reveal');
const header = document.querySelector('.header');
const hashLinks = document.querySelectorAll('a[href^="#"]');
const openContactModalBtn = document.querySelector('[data-open-contact-modal]');
const contactModal = document.querySelector('#contact-modal');
const closeContactModalBtns = document.querySelectorAll('[data-close-contact-modal]');
const contactForm = document.querySelector('#contact-form');
const contactFeedback = document.querySelector('#contact-form-feedback');

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

window.addEventListener('load', () => {
  if (window.location.hash && window.location.hash.length > 1) {
    setTimeout(() => {
      scrollToHash(window.location.hash, false);
    }, 0);
  }
});

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
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.14,
  });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

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
