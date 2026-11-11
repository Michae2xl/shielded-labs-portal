/* The site's only script. Every feature is optional: without JS the menu is a plain list, footnote links
   jump to the notes, the globe is absent and the search button does nothing. Hugo minifies this file. */
(() => {
  const root = document.documentElement;
  const darkScheme = matchMedia('(prefers-color-scheme: dark)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function menu() {
    const btn = document.querySelector('.menu-btn');
    if (!btn) return;
    const isOpen = () => btn.getAttribute('aria-expanded') === 'true';
    const set = (open) => btn.setAttribute('aria-expanded', String(open));
    btn.addEventListener('click', () => set(!isOpen()));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) { set(false); btn.focus(); }
    });
    // Close when focus leaves the header, so the open menu never covers the focused element.
    document.addEventListener('focusin', (e) => { if (!e.target.closest('.site-header')) set(false); });
    // A tap outside the open menu, including on the dimmed page, closes it.
    document.addEventListener('click', (e) => {
      // Links too, since same-page ones like /#values don't navigate.
      if (isOpen() && (!e.target.closest('.nav-list, .menu-btn') || e.target.closest('.nav-list a'))) set(false);
    });
    matchMedia('(min-width: 981px)').addEventListener('change', (m) => { if (m.matches) set(false); });
  }

  // Nav dropdowns, one open at a time.
  function dropdowns() {
    const toggles = [...document.querySelectorAll('.nav-group__toggle')];
    if (!toggles.length) return;
    const isOpen = (t) => t.getAttribute('aria-expanded') === 'true';
    const set = (t, open) => { const g = t.closest('.nav-group'); g.classList.toggle('is-open', open); if (open) g.classList.remove('is-dismissed'); t.setAttribute('aria-expanded', String(open)); };
    const closeAll = (except) => toggles.forEach((t) => { if (t !== except) set(t, false); });
    toggles.forEach((t) => t.addEventListener('click', () => { const open = isOpen(t); closeAll(t); set(t, !open); }));
    // Escape also hides lists opened by hover or focus, until the pointer or focus leaves.
    const groups = toggles.map((t) => t.closest('.nav-group'));
    groups.forEach((g) => {
      g.addEventListener('mouseleave', () => g.classList.remove('is-dismissed'));
      g.addEventListener('focusout', (e) => { if (!g.contains(e.relatedTarget)) g.classList.remove('is-dismissed'); });
    });
    // Capture: close the list before the menu sees Escape.
    document.addEventListener('keydown', (e) => {
      const shown = e.key === 'Escape' ? groups.filter((g) => { const c = getComputedStyle(g.querySelector('.nav-sub')); return c.display !== 'none' && c.visibility !== 'hidden'; }) : [];
      if (!shown.length) return;
      e.stopPropagation();
      closeAll(null);
      shown.forEach((g) => g.classList.add('is-dismissed'));
      (shown.find((g) => g.contains(document.activeElement)) || shown[0]).querySelector('.nav-group__toggle').focus();
    }, true);
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-group') || e.target.closest('.nav-group a')) closeAll(null);
    });
    matchMedia('(min-width: 981px)').addEventListener('change', () => closeAll(null));
  }

  // Blocks rise in as they enter the view, a batch staggered by 60ms. head.html adds .reveal only when
  // motion is welcome; the selector list matches .reveal in base.css.
  function scrollReveal() {
    if (!root.classList.contains('reveal')) return;
    const io = new IntersectionObserver((entries) => {
      let n = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.style.setProperty('--delay', Math.min(n++, 6) * 0.06 + 's');
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.sec-head, .proj, .ledger > .entry, .person, .value, .milestone, .resource-list, .section--page-head ~ .section > .wrap > h2')
      .forEach((el) => io.observe(el));
    root.classList.add('reveal-ready');
  }

  // Hero globe: a dot-matrix Earth turning west to east, Switzerland facing at first and marked, two orbits
  // and a few pinging nodes, in the theme's ink. Leans toward the pointer; one still frame for reduced
  // motion; paused while off screen or the tab is hidden.
  function globe() {
    const canvas = document.querySelector('.hero-globe canvas');
    if (!canvas || !canvas.getContext) return;
    const g = canvas.getContext('2d');
    const DEG = Math.PI / 180;
    const TILT = 0.32;
    let width = 0, height = 0, dpr = 1;
    let yaw = -1.42, tilt = TILT, tiltTo = TILT, lean = 0, leanTo = 0;
    let last = 0, raf = 0, onScreen = true, ink = '#16150F';

    const unit = (lat, lon) => {
      const p = (90 - lat) * DEG, t = (lon + 180) * DEG;
      return [Math.sin(p) * Math.cos(t), Math.cos(p), Math.sin(p) * Math.sin(t)];
    };

    // Land map from data/globe.yaml (tools/make_globe.py): one bit per cell, north to south, west to east.
    // Land cells get a dot; every other sea cell in each direction gets a faint one, so the sphere reads as solid.
    const { step, cols, land } = canvas.dataset;
    const bits = atob(land || ''), landDots = [], seaDots = [];
    const cells = +cols * Math.floor(bits.length * 8 / +cols);
    for (let b = 0; b < cells; b++) {
      const row = Math.floor(b / cols), col = b % cols;
      const v = unit(90 - step * (row + 0.5), -180 + step * (col + 0.5));
      if ((bits.charCodeAt(b >> 3) >> (7 - (b & 7))) & 1) landDots.push(v);
      else if (row % 2 === 0 && col % 2 === 0) seaDots.push(v);
    }

    const mono = getComputedStyle(root).getPropertyValue('--mono');
    const home = unit(47.17, 8.52); // Zug, where Shielded Labs is registered
    const nodes = [[40.71, -74.01], [1.35, 103.82], [-23.55, -46.63], [6.52, 3.38], [35.68, 139.69], [-33.87, 151.21]]
      .map(([lat, lon], i) => ({ v: unit(lat, lon), phase: i * 0.37 }));
    const orbits = [
      { r: 1.24, inc: 0.92, node: 0.5, speed: 0.00012, phase: 0 },
      { r: 1.38, inc: -0.48, node: 2.3, speed: -0.00008, phase: 2.6 },
    ];

    const rgba = (alpha) => {
      let hex = ink.trim().replace('#', '');
      if (hex.length === 3) hex = hex.replace(/./g, '$&$&');
      const n = parseInt(hex, 16);
      return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${alpha})`;
    };

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      ({ width, height } = canvas.getBoundingClientRect());
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    const draw = (now) => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, width, height);
      const cx = width / 2, cy = height / 2, rad = Math.min(width, height) * 0.34;
      const cosY = Math.cos(yaw + lean), sinY = Math.sin(yaw + lean), cosX = Math.cos(tilt), sinX = Math.sin(tilt);

      // Rotate, then project with a little perspective. Returns [x, y, depth, scale]; depth < 0 faces the viewer.
      const project = (v) => {
        const x = v[0] * cosY + v[2] * sinY, z = -v[0] * sinY + v[2] * cosY;
        const y = v[1] * cosX - z * sinX, depth = v[1] * sinX + z * cosX, k = 4 / (4 + depth);
        return [cx + x * rad * k, cy - y * rad * k, depth, k];
      };
      const orbitPoint = (o, t) => {
        const x = o.r * Math.cos(t), y = o.r * Math.sin(t) * Math.sin(o.inc), z = o.r * Math.sin(t) * Math.cos(o.inc);
        return project([x * Math.cos(o.node) + z * Math.sin(o.node), y, -x * Math.sin(o.node) + z * Math.cos(o.node)]);
      };
      const ring = (o, front) => {
        g.beginPath();
        let drawing = false;
        for (let j = 0; j <= 96; j++) {
          const q = orbitPoint(o, j / 96 * 2 * Math.PI);
          if ((q[2] < 0) === front) { drawing ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); drawing = true; }
          else drawing = false;
        }
        g.strokeStyle = rgba(front ? 0.32 : 0.1);
        g.stroke();
      };
      const satellite = (o, front) => {
        const q = orbitPoint(o, o.phase + now * o.speed);
        if ((q[2] < 0) !== front) return;
        g.beginPath();
        g.arc(q[0], q[1], 2.6 * q[3], 0, 2 * Math.PI);
        g.fillStyle = rgba(front ? 0.9 : 0.25);
        g.fill();
      };
      const dot = (q, size) => g.fillRect(q[0] - size / 2, q[1] - size / 2, size, size);

      // Sphere: soft shading and outline.
      const shade = g.createRadialGradient(cx - rad * 0.35, cy - rad * 0.4, rad * 0.1, cx, cy, rad);
      shade.addColorStop(0, rgba(0));
      shade.addColorStop(1, rgba(0.07));
      g.fillStyle = shade;
      g.beginPath();
      g.arc(cx, cy, rad, 0, 2 * Math.PI);
      g.fill();
      g.lineWidth = 1;
      g.strokeStyle = rgba(0.22);
      g.stroke();

      // Parallels.
      for (const lat of [0, 30, -30, 60, -60]) {
        g.beginPath();
        for (let i = 0; i <= 72; i++) {
          const q = project(unit(lat, i * 5 - 180));
          i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]);
        }
        g.strokeStyle = rgba(0.07);
        g.stroke();
      }

      for (const o of orbits) { ring(o, false); satellite(o, false); }

      g.fillStyle = rgba(0.16);
      for (const v of seaDots) { const q = project(v); if (q[2] < 0) dot(q, 1.1 * q[3]); }
      for (const v of landDots) {
        const q = project(v), front = q[2] < 0;
        g.fillStyle = rgba(front ? 0.85 : 0.08);
        dot(q, (front ? 1.8 : 1) * q[3]);
      }

      // Home: a steady ring and a label while it faces us, fading in as it turns toward the viewer.
      const hq = project(home);
      if (hq[2] < -0.15) {
        const a = Math.min(1, (-hq[2] - 0.15) * 4);
        g.beginPath();
        g.arc(hq[0], hq[1], 3.2, 0, 2 * Math.PI);
        g.fillStyle = rgba(a);
        g.fill();
        g.beginPath();
        g.arc(hq[0], hq[1], 8, 0, 2 * Math.PI);
        g.strokeStyle = rgba(0.6 * a);
        g.stroke();
        g.beginPath();
        g.moveTo(hq[0] + 8, hq[1] - 6);
        g.lineTo(hq[0] + 22, hq[1] - 20);
        g.lineTo(hq[0] + 30, hq[1] - 20);
        g.stroke();
        g.font = `500 ${Math.max(10, Math.round(rad * 0.055))}px ${mono}`;
        g.fillStyle = rgba(0.8 * a);
        g.textBaseline = 'middle';
        g.fillText('SWITZERLAND', hq[0] + 34, hq[1] - 20);
      }

      for (const n of nodes) {
        const q = project(n.v);
        if (q[2] > -0.1) continue;
        g.beginPath();
        g.arc(q[0], q[1], 2, 0, 2 * Math.PI);
        g.fillStyle = rgba(0.9);
        g.fill();
        if (reducedMotion) continue;
        const ping = (now / 2600 + n.phase) % 1;
        g.beginPath();
        g.arc(q[0], q[1], 2 + ping * 12, 0, 2 * Math.PI);
        g.strokeStyle = rgba(0.45 * (1 - ping));
        g.stroke();
      }

      for (const o of orbits) { ring(o, true); satellite(o, true); }
    };

    const frame = (now) => {
      if (!onScreen || document.hidden) { raf = 0; return; }
      const dt = last ? Math.min(now - last, 50) : 16;
      last = now;
      yaw -= dt * 0.00009;
      lean += (leanTo - lean) * 0.05;
      tilt += (tiltTo - tilt) * 0.05;
      draw(now);
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (reducedMotion || raf || !onScreen || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };

    // The ink colour changes only with the theme, so read it then, not every frame.
    const retheme = () => {
      ink = getComputedStyle(root).getPropertyValue('--ink') || ink;
      if (reducedMotion) draw(0);
    };
    new MutationObserver(retheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    darkScheme.addEventListener('change', retheme);
    retheme();
    resize();
    draw(0);
    new ResizeObserver(() => { resize(); draw(performance.now()); }).observe(canvas);
    if (reducedMotion) return;

    new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; start(); }).observe(canvas);
    document.addEventListener('visibilitychange', start);
    const hero = canvas.closest('.hero');
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      leanTo = clamp((e.clientX - r.left) / r.width * 2 - 1) * 0.35;
      tiltTo = TILT - clamp((e.clientY - r.top) / r.height * 2 - 1) * 0.18;
    });
    hero.addEventListener('pointerleave', () => { leanTo = 0; tiltTo = TILT; });
    start();
  }

  // A footnote reference opens its note in a card under the line; without JS the link jumps to the note.
  // Works for Markdown footnotes ([^1]) and for HTML posts whose notes are <li id="…"> items.
  function footnotes() {
    let open = null; // [reference link, card]
    const close = () => {
      if (!open) return;
      open[1].hidden = true;
      open[0].setAttribute('aria-expanded', 'false');
      open = null;
    };
    document.querySelectorAll('.prose sup a[href^="#"]').forEach((a, i) => {
      const note = document.getElementById(decodeURIComponent(a.hash.slice(1)));
      const block = a.closest('p, li');
      if (!note || !block) return;
      const card = document.createElement('div');
      card.className = 'fn-pop';
      card.id = 'fn-pop-' + i;
      card.hidden = true;
      card.setAttribute('role', 'note');
      card.innerHTML = '<span class="label">Note ' + a.textContent + '</span>' + note.innerHTML;
      card.querySelectorAll('.footnote-backref, a[href^="#fnref"]').forEach((b) => b.remove());
      card.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
      a.setAttribute('aria-expanded', 'false');
      a.setAttribute('aria-controls', card.id);
      block.appendChild(card);
      a.addEventListener('click', (e) => {
        e.preventDefault();
        const wasOpen = open && open[0] === a;
        close();
        if (wasOpen) return;
        const sup = a.parentNode;
        card.style.top = sup.offsetTop + sup.offsetHeight + 10 + 'px';
        card.hidden = false;
        a.setAttribute('aria-expanded', 'true');
        open = [a, card];
      });
    });
    document.addEventListener('click', (e) => { if (open && !e.target.closest('.fn-pop, .prose sup')) close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !open) return;
      const a = open[0];
      close();
      a.focus();
    });
  }

  // The dialog fetches search.json once, on first open; every query runs locally, nothing leaves the browser.
  // A result needs every word somewhere; title matches rank above description, description above body.
  function search() {
    const dialog = document.getElementById('search');
    const btn = document.querySelector('.search-btn');
    if (!dialog || !dialog.showModal || !btn) return;
    const input = dialog.querySelector('.search__input');
    const list = dialog.querySelector('.search__results');
    const status = dialog.querySelector('.search__status');
    let index = null, loading = null;

    const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    // One pass over the raw text, so a word like "mark" or "amp" can't match inside markup added for an earlier word.
    const highlight = (text, words) => {
      const re = new RegExp('(' + words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
      return text.split(re).map((s, i) => (i % 2 ? '<mark>' + esc(s) + '</mark>' : esc(s))).join('');
    };
    // A stretch of the body around the first match, cut at word boundaries; the description if the body has no match.
    const snippet = (p, word) => {
      const at = p.lx.indexOf(word);
      if (at < 0) return p.d;
      const from = at > 60 ? p.x.indexOf(' ', at - 60) + 1 : 0;
      const to = p.x.lastIndexOf(' ', from + 170);
      return (from ? '…' : '') + p.x.slice(from, to > from ? to : from + 170).trim() + '…';
    };

    const load = () => loading || (loading = fetch(dialog.dataset.index)
      .then((r) => r.json())
      .then((pages) => {
        index = pages.map((p) => ({ ...p, lt: p.t.toLowerCase(), ld: p.d.toLowerCase(), lx: p.x.toLowerCase() }));
        run();
      })
      .catch(() => { loading = null; status.textContent = 'Search is unavailable right now.'; }));

    const run = () => {
      const query = input.value.trim().toLowerCase();
      const words = query.split(/\s+/).filter(Boolean);
      list.innerHTML = '';
      if (!words.length) { status.textContent = ''; return; }
      if (!index) { status.textContent = 'Loading…'; return; }
      const hits = [];
      for (const p of index) {
        let score = 0;
        const all = words.every((w) => {
          const t = p.lt.includes(w), d = p.ld.includes(w), x = p.lx.includes(w);
          score += (t ? 10 : 0) + (d ? 4 : 0) + (x ? 1 : 0);
          return t || d || x;
        });
        if (!all) continue;
        if (p.lt.includes(query)) score += 20;
        hits.push([score, p]);
      }
      hits.sort((a, b) => b[0] - a[0]);
      status.textContent = hits.length === 1 ? '1 result'
        : hits.length ? hits.length + ' results'
        : 'No results for “' + input.value.trim() + '”';
      list.innerHTML = hits.slice(0, 12).map(([, p]) =>
        '<li><a href="' + esc(p.u) + '">' +
        '<span class="label">' + esc(p.k) + (p.date ? ' · ' + esc(p.date) : '') + '</span>' +
        '<span class="search__title">' + highlight(p.t, words) + '</span>' +
        '<span class="search__snip">' + highlight(snippet(p, words[0]), words) + '</span>' +
        '</a></li>').join('');
    };

    const openSearch = () => {
      if (dialog.open) return;
      dialog.showModal();
      input.select();
      load();
    };
    btn.addEventListener('click', openSearch);
    input.addEventListener('input', run);
    input.addEventListener('keydown', (e) => {
      const first = list.querySelector('a');
      if (e.key === 'Enter' && first) { e.preventDefault(); location.href = first.href; }
    });
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => btn.focus());
    document.addEventListener('keydown', (e) => {
      const el = document.activeElement;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable;
      if ((e.key === '/' && !typing) || (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        openSearch();
      }
    });
  }

  // An explicit choice lives on <html data-theme> and in localStorage 'sl-theme' (applied before first paint
  // by the inline script in head.html); otherwise the system preference applies.
  function theme() {
    const btn = document.querySelector('.theme-btn');
    if (!btn) return;
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    const current = () => {
      const t = root.getAttribute('data-theme');
      return t === 'dark' || t === 'light' ? t : darkScheme.matches ? 'dark' : 'light';
    };
    const sync = () => {
      btn.setAttribute('aria-label', current() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
      // Browser chrome follows the page, including a manual choice that differs from the system.
      const paper = getComputedStyle(root).getPropertyValue('--paper').trim();
      metas.forEach((m) => m.setAttribute('content', paper));
    };
    btn.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      root.classList.add('theme-fade');
      setTimeout(() => root.classList.remove('theme-fade'), 300);
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('sl-theme', next); } catch (e) { /* private mode: the choice lasts this page */ }
      sync();
    });
    darkScheme.addEventListener('change', sync);
    sync();
  }

  menu();
  dropdowns();
  scrollReveal();
  globe();
  footnotes();
  search();
  theme();
})();
