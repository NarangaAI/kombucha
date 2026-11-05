(() => {
  const menu = document.querySelector('.menu-switch');
  const nav = document.getElementById('main-nav');

  function setMenu(open) {
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    menu.querySelector('span').textContent = open ? 'Close' : 'Menu';
  }
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') === 'false'));
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.masthead')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menu.focus();
    }
  });
  window.matchMedia('(max-width:1000px)').addEventListener('change', () => setMenu(false));

  const navLinks = [...nav.querySelectorAll('a')];
  const sections = [...document.querySelectorAll('main > section')];
  let scheduled = false;
  function markSection() {
    const threshold = Math.min(window.innerHeight * 0.33, 250);
    const section = sections.filter(item => item.getBoundingClientRect().top <= threshold).pop();
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    const active = atBottom ? sections[sections.length - 1] : section;
    for (const link of navLinks) {
      if (active && link.hash === '#' + active.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    scheduled = false;
  }
  function scheduleMark() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(markSection);
    }
  }
  window.addEventListener('scroll', scheduleMark, {passive:true});
  window.addEventListener('resize', scheduleMark);
  markSection();

  const backgroundVideos = [...document.querySelectorAll('.brew-video, .company-video')];
  const videosInView = new Set();
  function syncVideos() {
    for (const video of backgroundVideos) {
      if (videosInView.has(video) && !document.hidden) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  }
  const videoObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) videosInView.add(entry.target);
      else videosInView.delete(entry.target);
    }
    syncVideos();
  });
  for (const video of backgroundVideos) videoObserver.observe(video);
  document.addEventListener('visibilitychange', syncVideos);

  const exhibitViewer = document.getElementById('exhibit-viewer');
  for (const button of document.querySelectorAll('.exhibit-open')) {
    button.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      const bounds = button.getBoundingClientRect();
      const angle = ((event.clientX - bounds.left) / bounds.width - .5) * 8;
      button.parentElement.style.setProperty('--lamp-angle', angle + 'deg');
    });
    button.addEventListener('pointerleave', () => button.parentElement.style.removeProperty('--lamp-angle'));
    button.addEventListener('click', () => {
      const title = button.querySelector('.exhibit-label > span').innerText.replace(/\s+/g, ' ').trim();
      const image = exhibitViewer.querySelector('img');
      const documentPhoto = button.querySelector('img');
      image.width = documentPhoto.naturalWidth || documentPhoto.width;
      image.height = documentPhoto.naturalHeight || documentPhoto.height;
      image.src = documentPhoto.src;
      image.alt = documentPhoto.alt;
      document.getElementById('exhibit-viewer-title').textContent = title;
      exhibitViewer.showModal();
    });
  }
  exhibitViewer.querySelector('.exhibit-close').addEventListener('click', () => exhibitViewer.close());
  exhibitViewer.addEventListener('click', event => {
    if (event.target !== exhibitViewer) return;
    const box = exhibitViewer.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) exhibitViewer.close();
  });

  for (const name of ['enquiry']) {
    const opener = document.getElementById(name + '-open');
    const dialog = document.getElementById(name + '-dialog');
    opener.addEventListener('click', () => dialog.showModal());
    dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  }

  const form = document.getElementById('enquiry-form');
  const emailField = form.elements.email;
  const messageField = form.elements.message;
  const fields = form.querySelector('fieldset');
  const submit = form.querySelector('button[type="submit"]');
  const status = document.getElementById('enquiry-status');
  let checking = false;

  document.getElementById('enquiry-open').addEventListener('click', async () => {
    if (checking || fields.disabled) return;
    checking = true;
    submit.disabled = true;
    status.textContent = 'Checking whether inquiries can be submitted';
    try {
      const response = await fetch(form.action + '/status', {cache:'no-store', signal:AbortSignal.timeout(8000)});
      if (!response.ok) throw new Error();
      const {available} = await response.json();
      submit.disabled = available !== true;
      status.textContent = submit.disabled ? 'Email inquiries are not yet available' : '';
    } catch {
      status.textContent = 'Unable to check inquiry availability\nPlease reopen this form shortly';
    } finally {
      checking = false;
    }
  });

  for (const field of [emailField, messageField]) {
    field.addEventListener('input', () => field.setCustomValidity(''));
    field.addEventListener('invalid', () => {
      if (field.validity.valueMissing) {
        field.setCustomValidity(field === emailField ? 'Please enter your email address' : 'Please enter your inquiry');
      } else if (field.validity.typeMismatch || field.validity.badInput) {
        field.setCustomValidity('Please enter a valid email address');
      } else if (field.validity.tooLong) {
        field.setCustomValidity(field === emailField
          ? 'Please keep your email address within 254 characters'
          : 'Please keep your inquiry within 4,000 characters');
      }
    });
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const message = messageField.value.trim();
    if (!message) {
      messageField.setCustomValidity('Please enter your inquiry');
      messageField.reportValidity();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    data.message = message;
    fields.disabled = true;
    submit.disabled = true;
    status.textContent = 'Sending your inquiry';
    try {
      const response = await fetch(form.action, {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data),
        redirect:'error', signal:AbortSignal.timeout(45000)
      });
      if (response.ok && (await response.json()).ok === true) {
        form.reset();
        status.textContent = 'Your inquiry has been received\nWe will reply to the email address you provided';
      } else if (response.status === 429) {
        status.textContent = 'Please try sending your inquiry again shortly';
      } else if (response.status === 400) {
        status.textContent = 'Please check your email address and inquiry';
      } else {
        status.textContent = 'Your inquiry cannot be sent right now\nPlease try again shortly';
      }
    } catch {
      status.textContent = 'Unable to confirm whether your inquiry was sent\nPlease check your network connection';
    } finally {
      fields.disabled = false;
      submit.disabled = false;
    }
  });
})();
