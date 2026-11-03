(() => {
  const room = document.querySelector('#collection .sr-room');
  const world = room?.querySelector('.sr-world');
  const dialog = document.querySelector('.sr-dialog');
  if (!world || !dialog) return;

  const viewport = dialog.querySelector('.sr-viewport');
  const vignette = dialog.querySelector('.sr-vignette');
  const back = dialog.querySelector('.sr-back');
  const details = dialog.querySelector('.sr-details');
  const mobile = matchMedia('(max-width:760px), (max-aspect-ratio:1/1) and (max-width:1050px)');
  const reduced = matchMedia('(prefers-reduced-motion:reduce)');
  const root = document.documentElement;
  const approachDuration = 1040;
  const returnDuration = 800;
  let current = null;

  const shades = ['left', 'right'].map(side => {
    const shade = document.createElement('span');
    shade.className = 'sr-camera-shade sr-camera-' + side;
    vignette.append(shade);
    return shade;
  });
  const mix = (start, end, t) => start + (end - start) * t;
  const clamp = t => Math.max(0, Math.min(1, t));
  const smooth = t => t * t * (3 - 2 * t);

  // Measure the untransformed live shelf. The camera can be reframed on resize
  // without ever resetting the transform of the visible scene.
  function measure(state) {
    const live = world.getBoundingClientRect();
    const source = state.item.getBoundingClientRect();
    const roomBox = room.getBoundingClientRect();
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    state.clone.style.width = live.width + 'px';
    state.clone.style.height = live.height + 'px';
    const startX = source.left + source.width / 2;
    const endX = width * (mobile.matches ? .5 : .51);
    const clip = [roomBox.top, width - roomBox.right, height - roomBox.bottom, roomBox.left]
      .map(n => Math.max(0, n));
    state.frame = {
      localX: startX - live.left, localY: source.top - live.top + source.height / 2,
      startX, startY: source.top + source.height / 2,
      endX, endY: height * (mobile.matches ? .305 : .47),
      zoom: Math.min(height * (mobile.matches ? .575 : 1.07) / source.height,
        width * (mobile.matches ? .76 : .46) / source.width),
      nicheWidth: source.width,
      pan: Math.max(-1, Math.min(1, (endX - startX) / (width * .4))),
      clip: clip.some(n => n > .5) ? clip : null
    };
    viewport.style.clipPath = '';
  }

  // All layers use one progress value. These transforms remain on the elements
  // while the visitor reads; nothing expires or restarts when they click Back.
  function paint(state) {
    const f = state.frame;
    const p = state.progress;
    const t = smooth(p);
    const through = Math.sin(Math.PI * t);
    const aim = t + .145 * through;
    const cx = mix(f.startX, f.endX, aim);
    const scrollOffset = state.closing && state.returnStart > 0
      ? state.readOffset * smooth(clamp(p / state.returnStart)) : 0;
    const cy = mix(f.startY, f.endY, aim) + scrollOffset;
    const zoom = 1 / mix(1, 1 / f.zoom, t);
    const x = cx - f.localX * zoom;
    const y = cy - f.localY * zoom;
    state.clone.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scale(' + zoom + ')';
    if (f.clip) {
      const edge = 1 - smooth(clamp(p / .43));
      viewport.style.clipPath = edge ? 'inset(' + f.clip.map(n => n * edge + 'px').join(' ') + ')' : 'none';
    }
    const radius = f.nicheWidth * zoom / 2 + 4;
    shades[0].style.transform = 'translate3d(' + (cx - radius) + 'px,0,0)';
    shades[1].style.transform = 'translate3d(' + (cx + radius) + 'px,0,0)';
    vignette.style.opacity = smooth(clamp((t - .12) / .82));
    vignette.style.transform = scrollOffset ? 'translate3d(0,' + scrollOffset + 'px,0)' : '';
    state.chrome.style.opacity = 1 - smooth(clamp(p / .28));
    const drift = f.pan * f.nicheWidth * .064 * through;
    const front = 1 + .053 * t;
    const glassPose = 'translate3d(' + drift + 'px,0,0) scale(' + front + ')';
    state.glass.style.transform = glassPose;
    state.reflection.style.transform = glassPose;
    state.foot.style.transform = 'translate3d(' + drift + 'px,0,0) scaleX(' + front + ')';

    // Reveal the already-rendered live shelf over the last few pixels.
    viewport.style.opacity = smooth(clamp(p / .14));
  }

  function reveal(state) {
    details.inert = false;
    dialog.classList.add('sr-detail-visible');
    state.raf = 0;
  }

  function finishClose(state) {
    current = null;
    dialog.close();
    dialog.classList.remove('sr-entered', 'sr-detail-visible', 'sr-leaving');
    state.clone.remove();
    viewport.style.clipPath = '';
    viewport.style.opacity = '';
    vignette.style.opacity = '';
    vignette.style.transform = '';
    root.style.overflow = state.overflow;
    document.body.style.paddingInlineEnd = state.padding;
    if (scrollX !== state.scrollX || scrollY !== state.scrollY) {
      window.scrollTo({left:state.scrollX, top:state.scrollY, behavior:'instant'});
    }
    if (state.contact) {
      const target = document.getElementById('contact');
      target.setAttribute('tabindex','-1');
      target.focus({preventScroll:true});
      location.hash = 'contact';
      target.scrollIntoView({behavior:reduced.matches ? 'instant' : 'smooth'});
    } else {
      state.item.focus({preventScroll:true});
    }
  }

  function run(state) {
    cancelAnimationFrame(state.raf);
    let last = performance.now();
    function tick(now) {
      if (current !== state) return;
      // A stalled/backgrounded renderer resumes from the last visible pose.
      const elapsed = Math.min(48, Math.max(0, now - last));
      last = now;
      const step = state.closing ? -elapsed / returnDuration : elapsed / approachDuration;
      state.progress = reduced.matches ? (state.closing ? 0 : 1) : clamp(state.progress + step);
      paint(state);
      if (state.closing && state.progress === 0) finishClose(state);
      else if (!state.closing && state.progress === 1) reveal(state);
      else state.raf = requestAnimationFrame(tick);
    }
    if (reduced.matches) tick(last);
    else state.raf = requestAnimationFrame(tick);
  }

  function open(item) {
    if (current || !item.offsetWidth) return;
    window.moruShowroom.renderDetail(Number(item.dataset.index));
    details.inert = true;
    const clone = world.cloneNode(true);
    clone.classList.add('sr-clone');
    clone.inert = true;
    clone.setAttribute('aria-hidden','true');
    const chrome = room.querySelector('.sr-chrome').cloneNode(true);
    clone.append(chrome);
    clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    const selected = clone.querySelector('.sr-item[data-index="' + item.dataset.index + '"]');
    selected.classList.add('is-selected');
    const state = {
      item, clone, chrome,
      glass:selected.querySelector('.sr-vessel'), foot:selected.querySelector('.sr-contact-shadow'),
      reflection:selected.querySelector('.sr-reflect'),
      overflow:root.style.overflow, padding:document.body.style.paddingInlineEnd,
      scrollX, scrollY, progress:0, closing:false, raf:0
    };
    current = state;
    viewport.append(clone);
    const scrollbar = innerWidth - root.clientWidth;
    if (scrollbar > 0) {
      const pad = parseFloat(getComputedStyle(document.body).paddingInlineEnd) || 0;
      document.body.style.paddingInlineEnd = (pad + scrollbar) + 'px';
    }
    root.style.overflow = 'hidden';
    dialog.showModal();
    dialog.scrollTop = 0;
    back.focus({preventScroll:true});
    measure(state);
    paint(state);
    dialog.classList.add('sr-entered');
    run(state);
  }

  function close(contact = false) {
    const state = current;
    if (!state || state.closing) return;
    state.closing = true;
    state.contact = contact;
    state.returnStart = state.progress;
    // On a scrolled mobile detail, pin the stage at its current visual offset.
    // The camera carries that offset back to zero instead of jumping to the top.
    state.readOffset = viewport.getBoundingClientRect().top - dialog.getBoundingClientRect().top;
    dialog.classList.add('sr-leaving');
    dialog.classList.remove('sr-detail-visible','sr-entered');
    details.inert = true;
    paint(state);
    run(state);
  }

  room.addEventListener('click', event => {
    const item = event.target.closest('.sr-item');
    if (item && world.contains(item)) open(item);
  });
  dialog.addEventListener('cancel', event => {event.preventDefault(); close();});
  back.addEventListener('click', () => close());
  dialog.addEventListener('click', event => {
    if (event.target.closest('.sr-contact')) {event.preventDefault(); close(true);}
  });
  window.addEventListener('resize', () => {
    if (current) {measure(current); paint(current);}
  });
  reduced.addEventListener('change', () => {
    if (current && reduced.matches && current.raf) run(current);
  });
})();
