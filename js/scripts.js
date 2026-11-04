'use strict';

document.documentElement.classList.add('js');
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-navigation');
if (menuToggle && navigation) {
  menuToggle.hidden = false;
  const closeMenu = () => {
    navigation.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    document.body.classList.remove('menu-open');
  };
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    document.body.classList.toggle('menu-open', open);
  });
  navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (!navigation.classList.contains('is-open')) return;
    if (event.key === 'Escape') { closeMenu(); menuToggle.focus(); }
    if (event.key === 'Tab') {
      const lastLink = navigation.querySelector('.nav-cta');
      if (event.shiftKey && document.activeElement === menuToggle) { event.preventDefault(); lastLink.focus(); }
      else if (!event.shiftKey && document.activeElement === lastLink) { event.preventDefault(); menuToggle.focus(); }
    }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  window.matchMedia('(min-width: 861px)').addEventListener('change', closeMenu);
}

document.querySelectorAll('[data-year]').forEach(element => { element.textContent = new Date().getFullYear(); });
const galleryLinks = Array.from(document.querySelectorAll('.gallery-open'));
const lightbox = document.querySelector('#project-lightbox');
if (galleryLinks.length && lightbox && typeof lightbox.showModal === 'function') {
  const image = lightbox.querySelector('.lightbox-image');
  const caption = lightbox.querySelector('#lightbox-caption');
  const counter = lightbox.querySelector('[data-gallery-counter]');
  let currentIndex = 0;
  let opener;
  const displayImage = index => {
    currentIndex = (index + galleryLinks.length) % galleryLinks.length;
    const link = galleryLinks[currentIndex];
    image.src = link.href;
    image.alt = link.querySelector('img').alt;
    caption.textContent = link.dataset.caption;
    counter.textContent = `${currentIndex + 1} / ${galleryLinks.length}`;
  };
  galleryLinks.forEach((link, index) => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    displayImage(index);
    lightbox.showModal();
    document.body.classList.add('dialog-open');
  }));
  lightbox.querySelector('[data-gallery-close]').addEventListener('click', () => lightbox.close());
  lightbox.querySelector('[data-gallery-prev]').addEventListener('click', () => displayImage(currentIndex - 1));
  lightbox.querySelector('[data-gallery-next]').addEventListener('click', () => displayImage(currentIndex + 1));
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); displayImage(currentIndex + (event.key === 'ArrowLeft' ? -1 : 1)); }
  });
  lightbox.addEventListener('click', event => {
    if (event.target !== lightbox) return;
    const bounds = lightbox.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) lightbox.close();
  });
  lightbox.addEventListener('close', () => { document.body.classList.remove('dialog-open'); opener?.focus(); });
}

const contactForm = document.querySelector('#contact-form');
if (contactForm) {
  const service = contactForm.querySelector('#service');
  const requestedService = new URLSearchParams(window.location.search).get('service');
  if (Array.from(service.options).some(option => option.value === requestedService)) service.value = requestedService;
  const status = contactForm.querySelector('#form-status');
  const outcomes = {
    sent: ['success', 'Thank you. Your enquiry has been accepted for sending. Our team will be in touch.'],
    invalid: ['error', 'Please check your name, email and message, then try again.'],
    unavailable: ['error', 'The message service is unavailable. Please call or email us directly.'],
    limited: ['error', 'Too many enquiries have been sent recently. Please wait a while or call us directly.'],
  };
  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;
    const submitButton = contactForm.querySelector('[type="submit"]');
    const buttonLabel = submitButton.querySelector('span');
    const fallback = contactForm.querySelector('#form-fallback');
    const fallbackLink = contactForm.querySelector('#email-fallback');
    const fields = new FormData(contactForm);
    const details = Object.fromEntries(['name','email','phone','message','service','website'].map(key => [key, String(fields.get(key) || '').trim()]));
    if (!details.name || !details.message) { status.dataset.state = 'error'; status.textContent = 'Please add your name and a message before sending.'; return; }
    const emailBody = `Name: ${details.name}\r\nEmail: ${details.email}\r\nPhone: ${details.phone || 'Not provided'}\r\nService: ${details.service}\r\n\r\n${details.message}`;
    fallbackLink.href = `mailto:info@solarfixsolutions.co.za?subject=${encodeURIComponent('Website enquiry: ' + details.service)}&body=${encodeURIComponent(emailBody)}`;
    fallback.hidden = true;
    status.dataset.state = 'pending';
    status.textContent = 'Sending your enquiry…';
    submitButton.disabled = true;
    buttonLabel.textContent = 'Sending…';
    contactForm.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(contactForm.action, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(details), signal: controller.signal });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.success !== true) throw new Error(response.status === 429 ? 'limited' : 'unavailable');
      status.dataset.state = 'success';
      status.textContent = outcomes.sent[1];
      contactForm.reset();
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = error.message === 'limited' ? outcomes.limited[1] : 'We couldn’t confirm that your enquiry was sent. Your message is still here. Please call us or send it using your email app below.';
      fallback.hidden = false;
    } finally {
      clearTimeout(timeout);
      submitButton.disabled = false;
      buttonLabel.textContent = 'Send enquiry';
      contactForm.setAttribute('aria-busy', 'false');
    }
  });
}
