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
    opener.addEventListener('click', () => dialog.showModal());
    dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  }

  const form = document.getElementById('enquiry-form');
  const messageField = form.elements.message;
  const fields = form.querySelector('fieldset');
  const submit = form.querySelector('button[type="submit"]');
  const status = document.getElementById('enquiry-status');
  let checking = false;

  document.getElementById('enquiry-open').addEventListener('click', async () => {
    if (checking || fields.disabled) return;
    checking = true;
    submit.disabled = true;
    status.textContent = '접수 가능 여부를 확인하고 있습니다';
    try {
      const response = await fetch(form.action + '/status', {cache:'no-store', signal:AbortSignal.timeout(8000)});
      if (!response.ok) throw new Error();
      const {available} = await response.json();
      submit.disabled = available !== true;
      status.textContent = submit.disabled ? '현재 이메일 문의 접수를 준비 중입니다' : '';
    } catch {
      status.textContent = '접수 상태를 확인할 수 없습니다\n잠시 후 다시 열어 주세요';
    } finally {
      checking = false;
    }
  });

  messageField.addEventListener('input', () => messageField.setCustomValidity(''));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled) return;
    const message = messageField.value.trim();
    if (!message) {
      messageField.setCustomValidity('문의 내용을 입력해 주세요');
      messageField.reportValidity();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    data.message = message;
    fields.disabled = true;
    submit.disabled = true;
    status.textContent = '문의를 보내고 있습니다';
    try {
      const response = await fetch(form.action, {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data),
        redirect:'error', signal:AbortSignal.timeout(45000)
      });
      if (response.ok && (await response.json()).ok === true) {
        form.reset();
        status.textContent = '문의가 접수되었습니다\n입력하신 이메일로 답변드리겠습니다';
      } else if (response.status === 429) {
        status.textContent = '잠시 후 다시 보내 주세요';
      } else if (response.status === 400) {
        status.textContent = '이메일 주소와 문의 내용을 확인해 주세요';
      } else {
        status.textContent = '지금은 문의를 보낼 수 없습니다\n잠시 후 다시 시도해 주세요';
      }
    } catch {
      status.textContent = '전송 결과를 확인할 수 없습니다\n네트워크 연결을 확인해 주세요';
    } finally {
      fields.disabled = false;
      submit.disabled = false;
    }
  });
})();
