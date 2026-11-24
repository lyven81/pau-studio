// Pau Studio showcase: reads assets/work.json. Home shows the newest completed,
// public-cleared output per category; Work shows the 10 newest per category (by completed_at).
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

  // The 10 newest per category, newest first (rolling 10, like the blog listing); older entries stay in work.json
  const PER_CATEGORY = 10;
  function newestPerCategory(data) {
    const groups = {};
    for (const it of data.items || []) {
      if (!it.cleared_for_public || !NAMES[it.category]) continue;
      (groups[it.category] = groups[it.category] || []).push(it);
    }
    const order = (data.categories && data.categories.length ? data.categories : Object.keys(NAMES)).filter(c => groups[c]);
    return order.map(c => [c, groups[c].sort((a, b) => Date.parse(b.completed_at) - Date.parse(a.completed_at)).slice(0, PER_CATEGORY)]);
  }

  // Work: a tab per category, a viewer, and up to 10 cover cards
  function renderWork(buttons, viewer, cards, groups) {
    buttons.replaceChildren();
    if (!groups.length) { viewer.replaceChildren(el('p', {}, 'Examples will appear here soon.')); return; }
    const show = it => {
      const left = el('div');
      left.append(...mediaFor(it));
      const right = el('div');
      right.append(el('strong', {}, `${NAMES[it.category]} · ${it.title}`), el('p', {}, it.caption), el('span', { class: 'label' }, it.label || 'Ruang Selesa studio work'));
      viewer.replaceChildren(left, right);
      if (cards) [...cards.children].forEach(c => c.setAttribute('aria-current', String(c.dataset.id === (it.content_id || it.media || it.title))));
    };
    const select = cat => {
      const [c, list] = groups.find(g => g[0] === cat) || groups[0];
      [...buttons.children].forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === c)));
      if (cards) {
        cards.replaceChildren();
        for (const it of list) {
          const card = el('button', { class: 'card', type: 'button', 'aria-current': 'false' });
          card.dataset.id = it.content_id || it.media || it.title;
          const img = el('img', { src: thumb(it), alt: it.alt || it.title, loading: 'lazy' });
          img.addEventListener('error', () => img.replaceWith(unavailable()), { once: true });
          card.append(img, el('span', {}, it.title));
          card.addEventListener('click', () => { show(it); viewer.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
          cards.appendChild(card);
        }
      }
      show(list[0]);
      if (location.hash !== '#' + c) history.replaceState(null, '', '#' + c);
    };
    for (const [c] of groups) {
      const b = el('button', { class: 'format', type: 'button', 'aria-pressed': 'false' }, NAMES[c]);
      b.dataset.cat = c;
      b.addEventListener('click', () => select(c));
      buttons.appendChild(b);
    }
    select(location.hash.slice(1));
  }

  const home = document.getElementById('latest');
  const buttons = document.getElementById('format-buttons');
  const viewer = document.getElementById('viewer');
  const cards = document.getElementById('cards');
  if (!home && !buttons) return;
  fetch('assets/work.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(data => {
      if (home) renderHome(home, latestPerCategory(data));
      if (buttons && viewer) renderWork(buttons, viewer, cards, newestPerCategory(data));
    })
    .catch(() => {
      if (home) home.replaceChildren();
      if (viewer) viewer.replaceChildren(el('p', {}, 'Examples could not be loaded. Please refresh the page.'));
    });
})();
