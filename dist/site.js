(() => {
  const menu = document.querySelector('.menu-switch');
  const nav = document.getElementById('main-nav');

  function setMenu(open) {
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    menu.querySelector('span').textContent = open ? '닫기' : '메뉴';
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
  window.matchMedia('(max-width:700px)').addEventListener('change', () => setMenu(false));

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

  const brewVideo = document.querySelector('.brew-video');
  let videoInView = false;
  function syncVideo() {
    if (videoInView && !document.hidden) {
      brewVideo.play().catch(() => {});
    } else {
      brewVideo.pause();
    }
  }
  new IntersectionObserver(([entry]) => {
    videoInView = entry.isIntersecting;
    syncVideo();
  }).observe(brewVideo);
  document.addEventListener('visibilitychange', syncVideo);

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
      const title = button.getAttribute('aria-label').replace(' 크게 보기', '');
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

  for (const name of ['shop','enquiry']) {
    const opener = document.getElementById(name + '-open');
    const dialog = document.getElementById(name + '-dialog');
    opener.addEventListener('click', () => {
      const status = dialog.querySelector('.copy-status');
      if (status) status.textContent = '';
      dialog.showModal();
    });
    dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  }

  const enquiryText = document.getElementById('enquiry-text');
  enquiryText.addEventListener('input', () => enquiryText.setCustomValidity(''));
  document.getElementById('enquiry-form').addEventListener('submit', async event => {
    event.preventDefault();
    const message = enquiryText.value.trim();
    if (!message) {
      enquiryText.setCustomValidity('문의 내용을 입력해 주세요');
      enquiryText.reportValidity();
      return;
    }
    const product = document.getElementById('enquiry-product').value;
    const draft = '[웰니스 콤부차 문의] ' + product + '\n\n' + message;
    const status = event.currentTarget.querySelector('.copy-status');
    try {
      await navigator.clipboard.writeText(draft);
      status.textContent = '관심 제품과 문의 내용을 복사했어요';
    } catch {
      enquiryText.focus();
      enquiryText.select();
      status.textContent = '선택된 문의 내용을 기기의 복사 기능으로 복사해 주세요';
    }
  });
})();
