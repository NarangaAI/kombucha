(() => {
  const collection = document.getElementById('collection');
  if (!collection) return;

  // Pixel coordinates of the shelf openings in the 1672 by 941 showroom photograph.
  const products = [
    { id:'mango', name:'망고맛', en:'Mango', left:101, right:318, accent:'#ffd59b', paper:'#f6e734', lid:'#edd4c5', kcal:15, story:'달콤한 망고 향에 콤부차의 새콤한 끝맛을 더했어요' },
    { id:'lemon', name:'레몬맛', en:'Lemon', left:419, right:631, accent:'#ffabbd', paper:'#bcdfdc', lid:'#a8dddc', kcal:20, story:'레몬의 상큼한 향과 콤부차의 산뜻한 산미를 함께 즐겨 보세요' },
    { id:'banana', name:'바나나맛', en:'Banana', left:731, right:944, accent:'#f2e9c4', paper:'#e2ecb7', lid:'#d4e6c3', kcal:15, story:'부드러운 바나나 향 뒤로 발효차 특유의 새콤함이 남아요' },
    { id:'strawberry', name:'딸기맛', en:'Strawberry', line:'프로틴', left:1044, right:1258, accent:'#ffcec0', paper:'#e8d8b8', lid:'#c97158', kcal:19, story:'콤부차에 딸기농축분말 11%와 분리유청단백(WPI)을 담았어요' },
    { id:'blueberry', name:'블루베리맛', en:'Blueberry', line:'프로틴', left:1357, right:1576, accent:'#d8dded', paper:'#e2d1b0', lid:'#29344b', kcal:19, story:'콤부차에 블루베리농축분말 11%와 분리유청단백(WPI)을 담았어요' }
  ];
  const sectionNumber = index => String(index + 1).padStart(2,'0');

  function carton(product) {
    const edgeInk = product.line === '프로틴' ? '--side-blend:multiply;--side-ink:.78;' : '';
    return `<span class="carton-mount" style="${edgeInk}--paper:${product.paper};--lid-paper:${product.lid};--print:url(assets/pack-${product.id}.webp)">
      <span class="carton-model">
        <span class="carton-side"></span><span class="carton-lid"></span>
        <span class="carton-face"><img class="sr-bottle" src="assets/pack-${product.id}.webp" width="544" height="784" alt="" draggable="false"></span>
      </span>
    </span>`;
  }

  function shelf(product, index) {
    const pack = carton(product);
    const width = product.right - product.left;
    const style = [
      '--left:' + 100 * product.left / 1672 + '%',
      '--w:' + 100 * width / 1672 + '%',
      '--crop-w:' + 100 * 1672 / width + '%',
      '--crop-x:' + 100 * product.left / (1672 - width) + '%',
      '--accent:' + product.accent
    ].join(';');
    return `<button class="sr-item sr-carton" data-index="${index}" style="${style}" type="button" aria-haspopup="dialog" aria-label="${product.name} 상세 보기">
      <span class="sr-niche">
        <span class="sr-recess"></span>
        <span class="sr-wash"></span>
        <span class="sr-contact-shadow"></span>
        <span class="sr-vessel">${pack}</span>
      </span>
      <span aria-hidden="true" class="sr-reflect"><span class="carton-mirror">${pack}</span></span>
      <span aria-hidden="true" class="sr-tag"><span>${product.en}</span><small>${product.name}</small></span>
    </button>`;
  }

  collection.innerHTML = `<div class="sr-room">
    <div class="sr-world"><div class="sr-wall" aria-hidden="true"></div>
      <div class="sr-floor" aria-hidden="true"></div>${products.map(shelf).join('')}
    </div>
    <div class="sr-chrome">
      <a class="sr-logo" href="#home" aria-label="웰니스 프로바이오틱스 홈"><img class="brand-logo" src="assets/wellness-logo-light.svg" alt="Wellness Probiotics" width="178" height="40"></a>
      <div class="sr-folio"><span class="sr-eyebrow">제품소개</span>
        <h2 id="collection-title" lang="en">The <em>Wellness</em> collection</h2>
        <p>다섯 가지 맛의 콤부차 <i></i><span class="sr-desktop-hint">제품을 선택해 맛을 확인하세요</span><span class="sr-touch-hint">제품을 눌러 맛을 확인하세요</span></p>
      </div>
    </div></div>`;

  const dialog = document.createElement('dialog');
  dialog.className = 'sr-dialog';
  dialog.setAttribute('aria-labelledby','sr-detail-title');
  dialog.innerHTML = `<div class="sr-viewport" aria-hidden="true"></div><div aria-hidden="true" class="sr-vignette"></div>
    <div class="sr-details"></div>
    <div class="sr-detail-logo" aria-hidden="true"><img class="brand-logo" src="assets/wellness-logo-light.svg" alt="" width="178" height="40"></div>
    <button type="button" class="sr-back" autofocus><span aria-hidden="true">←</span> 제품 목록</button>`;
  document.body.append(dialog);
  const room = collection.querySelector('.sr-room');
  const world = collection.querySelector('.sr-world');
  function renderDetail(index) {
    const product = products[index];
    dialog.style.setProperty('--accent', product.accent);
    const details = dialog.querySelector('.sr-details');
    const title = `원데이 ${product.line || '콜라겐'} 콤부차 · ${product.name}`;
    details.innerHTML = `<p class="sr-eyebrow">${sectionNumber(index)} / 05</p>
      <h3 id="sr-detail-title"><span lang="en">${product.en}</span><small>${title}</small></h3>
      <p class="sr-story">${product.story}</p>
      <dl class="sr-notes"><div><dt>구성</dt><dd>5 g × 15포 (75 g)</dd></div><div><dt>1포 열량</dt><dd>${product.kcal} kcal</dd></div></dl>
      <a class="sr-contact" href="#contact">구매 및 문의 <span aria-hidden="true">↗</span></a>`;
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
    item.style.setProperty('--pack-turn', (offset * 2.4) + 'deg');
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
