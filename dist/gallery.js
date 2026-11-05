(() => {
  const collection = document.getElementById('collection');
  if (!collection) return;

  // Pixel coordinates of the shelf openings in the 1672 by 941 showroom photograph.
  const products = [
    { id:'mango', name:'Mango', inquiryValue:'망고맛', en:'Mango', left:101, right:318, accent:'#ffd59b', paper:'#f6e734', lid:'#edd4c5', kcal:15, story:'Sweet mango aromas with a tangy kombucha finish' },
    { id:'lemon', name:'Lemon', inquiryValue:'레몬맛', en:'Lemon', left:419, right:631, accent:'#ffabbd', paper:'#bcdfdc', lid:'#a8dddc', kcal:15, story:'Enjoy bright lemon aromas with the refreshing acidity of kombucha' },
    { id:'banana', name:'Banana', inquiryValue:'바나나맛', en:'Banana', left:731, right:944, accent:'#f2e9c4', paper:'#e2ecb7', lid:'#d4e6c3', kcal:15, story:'Smooth banana aromas give way to the distinctive tang of fermented tea' },
    { id:'strawberry', name:'Strawberry', inquiryValue:'딸기맛', en:'Strawberry', line:'Protein', left:1044, right:1258, accent:'#ffcec0', paper:'#e8d8b8', lid:'#c97158', kcal:19, story:'Kombucha blended with 11% strawberry concentrate powder and whey protein isolate (WPI)' },
    { id:'blueberry', name:'Blueberry', inquiryValue:'블루베리맛', en:'Blueberry', line:'Protein', left:1357, right:1576, accent:'#d8dded', paper:'#e2d1b0', lid:'#29344b', kcal:19, story:'Kombucha blended with 11% blueberry concentrate powder and whey protein isolate (WPI)' }
  ];
  const sectionNumber = index => String(index + 1).padStart(2,'0');

  // The supplied nutrition label applies to the three collagen flavours only.
  const collagenNutrition = [
    ['Sodium', '210 mg', '5%'], ['Carbohydrate', '4 g', '1%'],
    ['Sugars', '0 g', '0%'], ['Fat', '0 g', '0%'],
    ['Trans Fat', '0 g', '0%'], ['Saturated Fat', '0 g', '0%'],
    ['Cholesterol', '0 mg', '0%'], ['Protein', '0 g', '0%']
  ];
  const proteinNutrition = [
    ['Sodium', '190 mg', '10%'], ['Carbohydrate', '3 g', '1%'],
    ['Sugars', '0 g', '0%'], ['Fat', '0 g', '0%'],
    ['Trans Fat', '0 g', '—'], ['Saturated Fat', '0 g', '0%'],
    ['Cholesterol', '0 mg', '0%'], ['Protein', '1 g', '2%']
  ];

  function nutrition(product) {
    const nutrients = product.line === 'Protein' ? proteinNutrition : collagenNutrition;
    return `<section class="sr-nutrition" lang="en" aria-labelledby="sr-nutrition-title">
      <h4 id="sr-nutrition-title">Nutrition Facts</h4>
      <p class="sr-net-weight">Net weight 75 g · 5 g × 15 sticks</p>
      <div class="sr-energy"><span>Per 1 stick (5 g)</span><strong>${product.kcal}<small>kcal</small></strong></div>
      <table aria-label="Nutrition per 1 stick (5 g)">
        <thead><tr><th scope="col">Nutrient</th><th scope="col">Amount</th><th scope="col">% Daily Value*</th></tr></thead>
        <tbody>${nutrients.map(([name, amount, daily]) => `<tr><th scope="row">${name}</th><td>${amount}</td><td>${daily}</td></tr>`).join('')}</tbody>
      </table>
      <p class="sr-nutrition-footnote">*Percent Daily Values are based on a 2,000 kcal diet and may vary depending on individual calorie needs</p>
    </section>`;
  }

  function servingIcon(type) {
    const drawing = {
      cold: `<path d="M22 20h36l-5 48H27zM20 16h40v4H20zM25 39c5-4 10 4 15 0s10 4 15 0"/><path d="m31 28 6 1-1 6-6-1zm13 1 6-1 1 6-6 1z" stroke-width="1.5" opacity=".7"/>`,
      sparkling: `<path d="M34 13h12v9H34zM34 22c0 10-3 12-5 22l-5 20c-1 5 1 7 5 7h22c4 0 6-2 5-7l-5-20c-2-10-5-12-5-22zM29 48c8-3 14 3 22 0"/><circle cx="33" cy="58" r="1.2"/><circle cx="45" cy="55" r="1.2"/><circle cx="40" cy="64" r="1.2"/><circle cx="49" cy="64" r="1.2"/>`,
      beer: `<path d="M23 28h31v40H23zM54 33h10v28H54m0-23h5v18h-5M23 28c-5-5-1-12 5-12 1-7 11-9 16-3 7-3 14 3 11 10 3 1 4 3 3 5zM25 39c4-3 8 3 13 0s10 3 14 0M32 43v17m12-17v17"/>`,
      stick: `<path d="M32 10l4 2 4-2 4 2 4-2v60l-4-2-4 2-4-2-4 2zM32 18h16M32 62h16"/><path d="M40 31v18" opacity=".45"/>`
    };
    return `<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${drawing[type]}</svg>`;
  }

  function serving(product) {
    const waterVolume = product.line === 'Protein' ? 300 : 200;
    return `<aside class="sr-serving" lang="en" aria-labelledby="sr-serving-title">
      <h4 id="sr-serving-title">How to enjoy</h4>
      <ul>${[['cold', 'Cold water'], ['sparkling', 'Sparkling water'], ['beer', 'Beer']].map(([type, name]) => `<li>
        <span class="sr-serving-icons">${servingIcon(type)}<span aria-hidden="true">+</span>${servingIcon('stick')}</span>
        <div class="sr-serving-copy"><h5>${name}</h5><p><span>${waterVolume} ml</span> + 1 stick</p></div>
      </li>`).join('')}</ul>
    </aside>`;
  }

  function carton(product) {
    const edgeInk = product.line === 'Protein' ? '--side-blend:multiply;--side-ink:.78;' : '';
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
    return `<button class="sr-item sr-carton" data-index="${index}" style="${style}" type="button" aria-haspopup="dialog" aria-label="View ${product.name} details">
      <span class="sr-niche">
        <span class="sr-recess"></span>
        <span class="sr-wash"></span>
        <span class="sr-contact-shadow"></span>
        <span class="sr-vessel">${pack}</span>
      </span>
      <span aria-hidden="true" class="sr-reflect"><span class="carton-mirror">${pack}</span></span>
      <span aria-hidden="true" class="sr-tag"><span>${product.en}</span><small>${product.name} flavor</small></span>
    </button>`;
  }

  collection.innerHTML = `<div class="sr-room">
    <div class="sr-world"><div class="sr-wall" aria-hidden="true"></div>
      <div class="sr-floor" aria-hidden="true"></div>${products.map(shelf).join('')}
    </div>
    <div class="sr-chrome">
      <div class="sr-folio"><span class="sr-eyebrow">Products</span>
        <h2 id="collection-title" lang="en">The <em>Wellness</em> collection</h2>
        <p>Five kombucha flavors <i></i><span class="sr-desktop-hint">Select a product to discover its flavor</span><span class="sr-touch-hint">Tap a product to discover its flavor</span></p>
      </div>
    </div></div>`;

  const dialog = document.createElement('dialog');
  dialog.className = 'sr-dialog';
  dialog.setAttribute('aria-labelledby','sr-detail-title');
  dialog.innerHTML = `<div class="sr-viewport" aria-hidden="true"></div><div aria-hidden="true" class="sr-vignette"></div>
    <div class="sr-details"></div>
    <div class="sr-detail-logo" aria-hidden="true"><img class="brand-logo" src="assets/wellness-logo-light.svg" alt="" width="178" height="40"></div>
    <button type="button" class="sr-back" autofocus><span aria-hidden="true">←</span> Back to products</button>`;
  document.body.append(dialog);
  const world = collection.querySelector('.sr-world');
  function renderDetail(index) {
    const product = products[index];
    dialog.style.setProperty('--accent', product.accent);
    const details = dialog.querySelector('.sr-details');
    const title = `Oneday ${product.line || 'Collagen'} Kombucha · ${product.name}`;
    details.innerHTML = `<div class="sr-product-copy"><p class="sr-eyebrow">${sectionNumber(index)} / 05</p>
      <h3 id="sr-detail-title"><span lang="en">${product.en}</span><small>${title}</small></h3>
      <p class="sr-story">${product.story}</p>
      ${nutrition(product)}</div>${serving(product)}`;
    details.querySelector('.sr-product-copy').scrollTop = 0;
    const select = document.getElementById('enquiry-product');
    if (select) select.value = product.inquiryValue;
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
})();
