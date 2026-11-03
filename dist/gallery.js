(() => {
  const collection = document.getElementById('collection');
  if (!collection) return;

  // Pixel coordinates of the shelf openings in the 1672 by 941 showroom photograph.
  const products = [
    { id:'yuzu', name:'유자 오리지널', en:'Yuzu Original', left:101, right:318, size:65, accent:'#ffd59b', note:'유자 껍질 · 시트러스', finish:'은은한 쌉싸름함', story:'유자 껍질 향이 먼저 나고, 끝에는 차의 쌉싸름함이 남습니다.' },
    { id:'berry', name:'베리 블러시', en:'Berry Blush', left:419, right:631, size:52, accent:'#ffabbd', note:'붉은 베리 · 새콤함', finish:'부드러운 과즙 향', story:'첫맛은 새콤하고, 뒤에는 잘 익은 베리 향이 남습니다.' },
    { id:'lemon', name:'레몬 미스트', en:'Lemon Mist', left:731, right:944, size:49, accent:'#f2e9c4', note:'레몬 제스트 · 산뜻함', finish:'맑은 레몬 향', story:'레몬 껍질의 향과 가벼운 산미를 살린 맛입니다.' },
    { id:'grape', name:'그린 그레이프', en:'Green Grape', left:1044, right:1258, size:66, accent:'#b7d9bb', note:'청포도 · 머스캣', finish:'싱그러운 과즙 향', story:'청포도 과즙을 닮은 산미와 은은한 머스캣 향이 특징입니다.' },
    { id:'hibiscus', name:'히비스커스', en:'Hibiscus', left:1357, right:1576, size:60, accent:'#ef9da8', note:'붉은 꽃잎 · 새콤함', finish:'잔잔한 꽃향', story:'히비스커스의 또렷한 산미 뒤로 옅은 꽃향이 이어집니다.' }
  ];
  const sectionNumber = index => String(index + 1).padStart(2,'0');
  function shelf(product, index) {
    const image = 'assets/night-' + product.id + '.webp';
    const width = product.right - product.left;
    const style = [
      '--left:' + 100 * product.left / 1672 + '%',
      '--w:' + 100 * width / 1672 + '%',
      '--crop-w:' + 100 * 1672 / width + '%',
      '--crop-x:' + 100 * product.left / (1672 - width) + '%',
      '--size:' + product.size + '%',
      '--glass:url(' + image + ')',
      '--accent:' + product.accent
    ].join(';');
    return `<button class="sr-item" data-index="${index}" style="${style}" type="button" aria-haspopup="dialog" aria-label="${product.name} 상세 보기">
      <span class="sr-niche">
        <span class="sr-recess"></span>
        <span class="sr-wash"></span>
        <span class="sr-contact-shadow"></span>
        <span class="sr-vessel"><img class="sr-bottle" src="${image}" alt="" draggable="false"><span class="sr-glint"></span></span>
      </span>
      <span aria-hidden="true" class="sr-reflect"><img src="${image}" alt="" draggable="false"></span>
      <span aria-hidden="true" class="sr-tag"><span>${product.en}</span><small>${product.name}</small></span>
    </button>`;
  }

  collection.innerHTML = `<div class="sr-room">
    <div class="sr-world"><div class="sr-wall" aria-hidden="true"></div>
      <div class="sr-floor" aria-hidden="true"></div>${products.map(shelf).join('')}
    </div>
    <div class="sr-chrome">
      <a class="sr-logo" href="#home" aria-label="모루 메인으로">MORU</a>
      <div class="sr-folio"><span class="sr-eyebrow">제품소개</span>
        <h2 id="collection-title" lang="en">The <em>moru</em> collection</h2>
        <p>다섯 가지 맛의 콤부차 <i></i><span class="sr-desktop-hint">병을 선택해 맛을 확인하세요.</span><span class="sr-touch-hint">병을 눌러 맛을 확인하세요.</span></p>
      </div>
      <a class="sr-next" href="#about">콤부차 소개 <span aria-hidden="true">↓</span></a>
    </div></div>`;

  const dialog = document.createElement('dialog');
  dialog.className = 'sr-dialog';
  dialog.setAttribute('aria-labelledby','sr-detail-title');
  dialog.innerHTML = `<div class="sr-viewport" aria-hidden="true"></div><div aria-hidden="true" class="sr-vignette"></div>
    <div class="sr-details"></div>
    <div class="sr-detail-logo" aria-hidden="true">MORU</div>
    <button type="button" class="sr-back" autofocus><span aria-hidden="true">←</span> 제품 목록</button>`;
  document.body.append(dialog);
  const room = collection.querySelector('.sr-room');
  const world = collection.querySelector('.sr-world');
  function renderDetail(index) {
    const product = products[index];
    dialog.style.setProperty('--accent', product.accent);
    const details = dialog.querySelector('.sr-details');
    details.innerHTML = `<p class="sr-eyebrow">${sectionNumber(index)} / 05</p>
      <h3 id="sr-detail-title"><span lang="en">${product.en}</span><small>${product.name}</small></h3>
      <p class="sr-story">${product.story}</p>
      <dl class="sr-notes"><div><dt>향</dt><dd>${product.note}</dd></div><div><dt>마무리</dt><dd>${product.finish}</dd></div></dl>
      <a class="sr-contact" href="#contact">구매 및 문의 <span aria-hidden="true">↗</span></a>
      <p class="sr-disclosure">제품과 맛 설명은 임시 시안입니다.</p>`;
    const select = document.getElementById('enquiry-product');
    if (select) select.value = product.name;
  }
  window.moruShowroom = { renderDetail };

  const items = [...world.querySelectorAll('.sr-item')];
  const reducedLightMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let pointedAt = null;
  let lit = null;

  function setLight(item) {
    if (item === lit) return;
    lit?.classList.remove('is-lit');
    lit = item;
    lit?.classList.add('is-lit');
    world.classList.toggle('sr-aiming', Boolean(lit));
  }

  function syncLight() {
    setLight(pointedAt || world.querySelector('.sr-item:focus-visible'));
  }

  function illuminate(item, event) {
    pointedAt = item;
    setLight(item);
    if (reducedLightMotion.matches) return;
    const box = item.getBoundingClientRect();
    const offset = Math.max(-1, Math.min(1, 2 * (event.clientX - box.left) / box.width - 1));
    item.style.setProperty('--beam-tilt', (-offset * 2.5) + 'deg');
    item.style.setProperty('--spec-x', (37 + offset * 9) + '%');
    item.style.setProperty('--pool-x', (50 + offset * 8) + '%');
  }

  function releasePointer(item) {
    if (pointedAt !== item) return;
    pointedAt = null;
    syncLight();
  }
  for (const item of items) {
    item.addEventListener('pointerenter', event => illuminate(item,event));
    item.addEventListener('pointermove', event => illuminate(item,event));
    item.addEventListener('pointerdown', event => illuminate(item,event));
    item.addEventListener('pointerleave', () => releasePointer(item));
    item.addEventListener('pointercancel', () => releasePointer(item));
    item.addEventListener('focus', () => {
      if (item.matches(':focus-visible')) {
        pointedAt = null;
        setLight(item);
      }
    });
    item.addEventListener('blur', () => setLight(pointedAt));
  }
  let pending = false;
  function updateHeader() {
    const rect = room.getBoundingClientRect();
    const header = document.querySelector('.masthead');
    const hide = rect.top <= header.offsetHeight + 6 && rect.bottom > header.offsetHeight + 40;
    header.classList.toggle('sr-immersed', hide);
    header.inert = hide;
    pending = false;
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(updateHeader); }
  }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule);
  updateHeader();
})();
