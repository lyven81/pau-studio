// Pau Studio showcase: reads assets/work.json and shows the latest
// completed, public-cleared output in each category (by completed_at).
(function () {
  const NAMES = {
    'product-still': 'Product Still', 'carousel': 'Carousel', 'slideshow': 'Slideshow',
    'product-reel': 'Product Reel', 'sharing-video': 'Sharing Video'
  };

  function el(tag, attrs, text) {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    if (text) e.textContent = text;
    return e;
  }

  function latestPerCategory(data) {
    const best = {};
    for (const it of data.items || []) {
      if (!it.cleared_for_public || !NAMES[it.category]) continue;
      const cur = best[it.category];
      if (!cur || Date.parse(it.completed_at) > Date.parse(cur.completed_at)) best[it.category] = it;
    }
    return (data.categories || Object.keys(NAMES)).filter(c => best[c]).map(c => best[c]);
  }

  function unavailable() { return el('div', { class: 'unavailable' }, 'Preview unavailable'); }

  function guard(node, box) {
    node.addEventListener('error', () => box.replaceChildren(unavailable()), { once: true });
    return node;
  }

  function thumb(it) {
    return it.type === 'image' ? it.media : it.type === 'carousel' ? it.slides[0] : it.poster;
  }

  // Home: one tile per category
  function renderHome(box, items) {
    box.replaceChildren();
    for (const it of items) {
      const a = el('a', { class: 'tile', href: 'work.html#' + it.category });
      const img = el('img', { src: thumb(it), alt: it.alt || it.title, loading: 'lazy' });
      img.addEventListener('error', () => img.replaceWith(unavailable()), { once: true });
      a.append(img, el('span', {}, NAMES[it.category]), el('small', {}, it.title));
      box.appendChild(a);
    }
  }

  function mediaFor(it) {
    const box = el('div', { class: 'media' });
    if (it.type === 'image') {
      box.appendChild(guard(el('img', { src: it.media, alt: it.alt || it.title }), box));
      return [box];
    }
    if (it.type === 'video') {
      const v = el('video', { controls: '', playsinline: '', preload: 'none', poster: it.poster || '' });
      v.appendChild(el('source', { src: it.media, type: 'video/mp4' }));
      v.setAttribute('aria-label', it.alt || it.title);
      guard(v.querySelector('source'), box);
      box.appendChild(v);
      return [box];
    }
    // carousel
    let i = 0;
    const img = guard(el('img', { src: it.slides[0], alt: `${it.alt || it.title}, slide 1 of ${it.slides.length}` }), box);
    box.appendChild(img);
    const nav = el('div', { class: 'slides-nav' });
    const prev = el('button', { type: 'button', 'aria-label': 'Previous slide' }, 'Prev');
    const next = el('button', { type: 'button', 'aria-label': 'Next slide' }, 'Next');
    const count = el('span', { 'aria-live': 'polite' });
    const show = n => {
      i = (n + it.slides.length) % it.slides.length;
      img.src = it.slides[i];
      img.alt = `${it.alt || it.title}, slide ${i + 1} of ${it.slides.length}`;
      count.textContent = `${i + 1} / ${it.slides.length}`;
    };
    prev.addEventListener('click', () => show(i - 1));
    next.addEventListener('click', () => show(i + 1));
    nav.append(prev, count, next);
    show(0);
    return [box, nav];
  }

  // Work: format buttons and a viewer
  function renderWork(buttons, viewer, items) {
    buttons.replaceChildren();
    if (!items.length) { viewer.replaceChildren(el('p', {}, 'Examples will appear here soon.')); return; }
    const select = cat => {
      const it = items.find(x => x.category === cat) || items[0];
      [...buttons.children].forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === it.category)));
      const left = el('div');
      left.append(...mediaFor(it));
      const right = el('div');
      right.append(el('strong', {}, `${NAMES[it.category]} · ${it.title}`), el('p', {}, it.caption), el('span', { class: 'label' }, it.label || 'Ruang Selesa studio work'));
      viewer.replaceChildren(left, right);
      if (location.hash !== '#' + it.category) history.replaceState(null, '', '#' + it.category);
    };
    for (const it of items) {
      const b = el('button', { class: 'format', type: 'button', 'aria-pressed': 'false' }, NAMES[it.category]);
      b.dataset.cat = it.category;
      b.addEventListener('click', () => select(it.category));
      buttons.appendChild(b);
    }
    select(location.hash.slice(1));
  }

  const home = document.getElementById('latest');
  const buttons = document.getElementById('format-buttons');
  const viewer = document.getElementById('viewer');
  if (!home && !buttons) return;
  fetch('assets/work.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(data => {
      const items = latestPerCategory(data);
      if (home) renderHome(home, items);
      if (buttons && viewer) renderWork(buttons, viewer, items);
    })
    .catch(() => {
      if (home) home.replaceChildren();
      if (viewer) viewer.replaceChildren(el('p', {}, 'Examples could not be loaded. Please refresh the page.'));
    });
})();
