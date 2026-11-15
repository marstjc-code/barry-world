/* Small Plates: the front door to Barry's world (15 Nov 2026).
   The restaurant is layered 2D art over the existing app. It opens the app's own features (Chat, Diary, Music, Art, the
   village and its replay, and the rest) in the app's own panel; it stores nothing of its own except two "seen" flags.
   Everything is positioned in the plate's pixel space and the stage is scaled as one piece. Off in ?shot mode. */
(function () {
  const H = document.documentElement;
  if (!H.classList.contains('fronton')) return;
  const $ = s => document.querySelector(s);
  const LOCAL = !/github\.io$/.test(location.hostname);
  const bar = $('#bar'), stage = $('#stage');

  /* ---- the two compositions: desktop plate (16:9) and a dedicated phone plate (9:16) ---- */
  const COMP = {
    d: { img: 'home/plate.jpg', img2: 'home/plate-2x.jpg', W: 1672, H: 933, fit: [0, 1672], band: 64,
      cab: { x: 18, y: 586, w: 202, h: 402, lbl: 'up' },
      spots: [
        { go: 'chat', label: 'Talk to Barry', x: 699, y: 428, w: 270, h: 278, lbl: 'top', key: 1 },
        { go: 'diary', label: "Barry's diary", x: 925, y: 648, w: 250, h: 122, lbl: 'dn' },
        { go: 'music', label: "Barry's records", x: 915, y: 52, w: 154, h: 150, lbl: 'in' },
        { go: 'art', label: "Barry's paintings", x: 1110, y: 30, w: 234, h: 232, lbl: 'in' },
        { go: 'village', label: 'Down the lane: the village', x: 1398, y: 300, w: 262, h: 620, lbl: 'in' },
      ],
      fx: [
        { c: 'rain', clip: '1345,0 1672,0 1672,933 1398,933 1398,300 1440,92' },
        { c: 'rain', band: 1 },
        { c: 'shimmer', x: 1430, y: 760, w: 230, h: 150 },
        { c: 'ripple', x: 1470, y: 800, w: 170, h: 110, rings: 3 },
        { c: 'steam', x: 640, y: 440, w: 60, h: 90, puffs: 3 },
        { c: 'gull', x: 566, y: 668, w: 100, h: 92, origin: '18% 62%' },
        { c: 'rec', x: 952, y: 105, w: 94, h: 94 },
        { c: 'lampglow', x: 880, y: 420, w: 330, h: 240 },
      ] },
    m: { img: 'home/plate-m.jpg', W: 1080, H: 1910, fit: [90, 1010], band: 0,
      cab: { x: 108, y: 930, w: 322, h: 641, lbl: 'up' },
      spots: [
        { go: 'chat', label: 'Talk to Barry', x: 262, y: 290, w: 360, h: 430, lbl: 'top', key: 1 },
        { go: 'diary', label: "Barry's diary", x: 568, y: 636, w: 286, h: 158, lbl: 'dn' },
      ],
      fx: [
        { c: 'rain', clip: '0,1205 1080,1205 1080,1910 0,1910' },
        { c: 'rain', clip: '1000,0 1080,0 1080,1205 1000,1205' },
        { c: 'shimmer', x: 480, y: 1330, w: 330, h: 260 },
        { c: 'ripple', x: 560, y: 1440, w: 260, h: 170, rings: 3 },
        { c: 'steam', x: 222, y: 318, w: 60, h: 90, puffs: 3 },
        { c: 'gull', x: 192, y: 664, w: 104, h: 92, origin: '20% 60%' },
        { c: 'lampglow', x: 540, y: 250, w: 330, h: 240 },
      ] },
  };
  const UP = { h: 276, spots: [   // the top of the desktop plate, for the phone's "Upstairs" view
    { go: 'music', label: "Barry's records", x: 915, y: 52, w: 154, h: 150 },
    { go: 'art', label: "Barry's paintings", x: 1110, y: 30, w: 234, h: 232 } ] };
  const TITLES = { now: 'Right now', today: "Barry's day", chat: 'Talk to Barry', wants: 'What Barry wants', places: 'Places in the village',
    diary: "Barry's diary", art: "Barry's paintings", music: "Barry's records", pages: "Barry's pages", dreams: "Barry's dreams" };

  let comp = null, S = 1, opener = null;
  const pick = () => (innerWidth < 700 || innerHeight > innerWidth * 1.2) ? 'm' : 'd';
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const box = (e, o) => { e.style.left = o.x + 'px'; e.style.top = o.y + 'px'; e.style.width = o.w + 'px'; e.style.height = o.h + 'px'; return e; };

  function build() {
    const k = pick(); comp = COMP[k]; comp.key = k;
    H.style.setProperty('--plate', `url(${comp.img})`);
    H.style.setProperty('--plateup', `url(${COMP.d.img2})`);
    stage.innerHTML = '';
    const img = el('img'); img.id = 'plate'; img.alt = ''; img.width = comp.W; img.height = comp.H; img.decoding = 'async'; img.setAttribute('fetchpriority', 'high');
    img.src = comp.img; stage.append(img);
    if (comp.img2 && innerWidth >= 1000 && devicePixelRatio * innerWidth > comp.W * 1.2) { const hi = new Image(); hi.onload = () => { img.src = comp.img2; }; hi.src = comp.img2; }
    const pave = el('div', 'pave' + (comp.key === 'd' ? ' cobbles' : '')); pave.id = 'pave'; pave.append(el('i')); stage.append(pave);
    for (const f of comp.fx) {
      const d = el('div', 'layer ' + f.c);
      if (f.c === 'rain') { if (f.band) d.dataset.band = 1; else { d.style.cssText = `left:0;top:0;width:${comp.W}px;height:${comp.H}px;clip-path:polygon(${f.clip.split(' ').map(p => p.split(',').map(n => n + 'px').join(' ')).join(',')})`; } }
      else box(d, f);
      if (f.c === 'steam' || f.c === 'ripple') for (let i = 0; i < (f.puffs || f.rings); i++) { const p = el('i'); if (f.c === 'ripple') { p.style.cssText = `left:0;top:0;width:${f.w}px;height:${f.w}px`; } d.append(p); }
      if (f.c === 'gull') { d.style.backgroundPosition = `${-f.x}px ${-f.y}px`; d.style.backgroundSize = `${comp.W}px ${comp.H}px`; d.style.transformOrigin = f.origin; }
      if (f.c === 'rec') d.append(el('i'));
      stage.append(d);
    }
    const spot = (o, into) => {
      const b = el('button', 'spot' + (o.key ? ' key' : '')); b.type = 'button'; b.dataset.go = o.go; b.setAttribute('aria-label', o.label);
      b.append(el('span', 'lbl ' + (o.lbl || 'in'), o.label)); box(b, o); b.onclick = () => go(o.go, b); (into || stage).append(b); return b;
    };
    spot(comp.spots[0]);
    const c = spot({ go: 'arcade', label: 'Play Paper Round', key: 1, lbl: comp.cab.lbl, ...comp.cab }); c.id = 'cab';
    c.prepend(el('span', 'shadow'), Object.assign(el('img'), { src: 'home/cabinet.webp', alt: '' }), Object.assign(el('span', 'scr'), { style: 'left:24%;top:22%;width:48%;height:20%' }));
    comp.spots.slice(1).forEach(o => spot(o));
    layout();
  }

  function layout() {
    if (pick() !== comp.key) return build();
    if (comp.key !== 'm' && H.classList.contains('upst')) upstairs(false, null, true);   // the phone's Upstairs view has no place on a wide screen
    const vw = innerWidth, vh = innerHeight, fw = comp.fit[1] - comp.fit[0];
    S = Math.min(vw / fw, vh / (comp.H + comp.band));
    const band = Math.max(comp.band, vh / S - comp.H);
    stage.style.width = comp.W + 'px'; stage.style.height = (comp.H + band) + 'px';
    stage.style.transform = `translate(${(vw - fw * S) / 2 - comp.fit[0] * S}px,0) scale(${S})`;
    stage.style.setProperty('--px', (1 / S) + 'px');
    const pave = $('#pave'); pave.style.top = (comp.H - 1) + 'px'; pave.style.width = comp.W + 'px'; pave.style.height = (band + 2) + 'px';
    const pi = pave.firstChild; pi.style.width = comp.W + 'px'; pi.style.height = comp.H + 'px'; pi.style.backgroundSize = `${comp.W}px ${comp.H}px`;
    stage.querySelectorAll('.rain[data-band]').forEach(r => { r.style.cssText = `left:0;top:${comp.H}px;width:${comp.W}px;height:${band}px`; });
    $('#upbtn').style.display = comp.key === 'm' ? '' : 'none';
  }

  /* ---- where things go ---- */
  function seen() { if (H.classList.contains('hints')) { H.classList.remove('hints'); try { localStorage.setItem('barry-bar-seen', '1'); } catch (e) {} } }
  function go(what, from) {
    seen(); closeMenu();
    if (what === 'arcade') return arcade(true, from);
    if (what === 'village') return mode('village');
    if (what === 'replay') { mode('village'); setTimeout(() => $('#rpplay') && $('#rpplay').focus(), 60); return; }
    if (what === 'tour') { mode('village'); return whenVisit(v => v.tour()); }
    if (what === 'upstairs') return upstairs(true, from);
    if (what === 'postcard' || (what === 'chat' && !LOCAL)) { opener = from; return whenVisit(v => v.postcard()); }
    openTab(what, from);
  }
  function whenVisit(fn, n = 0) { if (window.VISIT) return fn(window.VISIT); if (n < 60) setTimeout(() => whenVisit(fn, n + 1), 150); }

  /* ---- the cream-paper panel: the app's own panel and tabs, opened from the room ---- */
  const panel = $('#panel');
  const head = el('div'); head.id = 'phead'; head.innerHTML = '<b id="ptl" role="heading" aria-level="2"></b><button type="button" id="pcl">Close ✕</button>';
  panel.prepend(head); panel.classList.add('shut'); panel.inert = true;
  new MutationObserver(() => { panel.inert = panel.classList.contains('shut'); }).observe(panel, { attributes: true, attributeFilter: ['class'] });   /* a shut panel must not catch the Tab key */ panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-labelledby', 'ptl');
  $('#pcl').onclick = () => closePanel();
  let openSeq = 0;
  function openTab(t, from, n = 0, seq) {
    if (!n) seq = ++openSeq; else if (seq !== openSeq) return;     // closed, or something else was opened, while the app was still loading
    opener = from || opener; if (H.classList.contains('upst')) upstairs(false, null, true);
    $('#ptl').textContent = TITLES[t] || t; panel.classList.remove('shut'); $('#body').scrollTop = 0;
    const b = document.querySelector(`#panel nav button[data-t="${t}"]`);
    if (b && b.onclick) { b.click(); $('#body').scrollTop = 0; setTimeout(() => $('#pcl').focus(), 30); }
    else if (n < 80) { if (!n) $('#body').textContent = "Fetching Barry's notes…"; setTimeout(() => openTab(t, null, n + 1, seq), 150); }
    else $('#body').textContent = "Barry's notes didn't load. Check the connection and try again.";
  }
  function closePanel(quiet) { openSeq++; if (panel.classList.contains('shut')) return; panel.classList.add('shut'); if (!quiet) back(); }
  const shown = e => e && document.contains(e) && e.getClientRects().length > 0;
  const focusOr = (...els) => { const e = els.find(shown) || [$('#exbtn'), $('#tobar')].find(shown); if (e) e.focus(); };
  function back() { const o = opener; opener = null; focusOr(o); }
  /* a "Go" button inside Places should take you to the village, not fly a camera you can't see */
  $('#body').addEventListener('click', e => { if (H.classList.contains('bar') && e.target.closest('.place button, .place .btn, [data-fly]')) { closePanel(true); mode('village'); } });
  addEventListener('vmodal-close', () => { if (H.classList.contains('bar')) back(); });

  /* ---- bar / village ---- */
  function mode(m, quiet) {
    closePanel(true); closeMenu();
    H.classList.toggle('bar', m === 'bar'); H.classList.toggle('village', m === 'village');
    if (!quiet) { if (m === 'village') history.pushState(null, '', '#village'); else history.replaceState(null, '', location.pathname + location.search); }   // Back returns from the village
    dispatchEvent(new Event('resize'));
    if (m === 'village') focusOr($('#tobar')); else { layout(); focusOr(stage.querySelector('[data-go=village]')); }
  }

  /* ---- the arcade cabinet: Barry's Paper Round (arcade/game.js), fetched only when the cabinet is opened ---- */
  const arc = $('#arcade'); let game = null;
  function arcade(on, from, quiet) {
    if (on) {
      if (H.classList.contains('arcade')) return;
      opener = from || stage.querySelector('#cab'); closePanel(true); H.classList.add('arcade');
      arc.innerHTML = `<div class="cabinet game" role="dialog" aria-modal="true" aria-labelledby="artitle"><div class="marq" aria-hidden="true">PAPER ROUND</div>
        <div class="crt" id="arcrt"><p class="arload" id="artitle">Loading Barry's Paper Round…</p></div><div class="deck" id="ardeck"></div></div>`;
      if (!quiet) history.pushState(null, '', '#arcade');
      import('./arcade/game.js').then(m => {
        if (!H.classList.contains('arcade')) return;
        game = m.mount({ crt: $('#arcrt'), deck: $('#ardeck'), exit: () => arcade(false), soundOn: () => $('#sndbtn').getAttribute('aria-pressed') === 'true', toggleSound: () => $('#sndbtn').click() });
      }).catch(() => { $('#arcrt').innerHTML = '<div class="amenu"><h2 id="artitle">Out of order</h2><p>The cabinet would not start. Check the connection and try again.</p><button type="button" id="arback">Back to the bar</button></div>'; $('#arback').onclick = () => arcade(false); $('#arback').focus(); });
    } else {
      if (game) { game.unmount(); game = null; } arc.innerHTML = ''; H.classList.remove('arcade');
      if (!quiet) history.replaceState(null, '', H.classList.contains('village') ? '#village' : location.pathname + location.search);
      const o = opener; opener = null; focusOr(stage.querySelector('#cab'), o);
    }
  }

  /* ---- upstairs, on phones ---- */
  const up = $('#upst');
  function upstairs(on, from, quiet) {
    if (!on) { H.classList.remove('upst'); if (!quiet) focusOr($('#upbtn')); return; }
    const k = Math.max(0.9, innerHeight * 0.36 / UP.h);   // the turntable and the paintings both fit a phone's width
    up.style.setProperty('--px', '1px');
    up.innerHTML = `<header><span id="uptl">Upstairs</span><button type="button" class="fbtn" id="updown">Back downstairs</button></header><div id="upscroll" tabindex="0" aria-label="Barry's room, swipe sideways"><div id="uproom"></div></div><p>Barry's room above the restaurant. Swipe sideways to look round. Tap the record player for his records, or the paintings for his art.</p>`;
    const room = $('#uproom'); room.style.width = COMP.d.W * k + 'px'; room.style.height = UP.h * k + 'px'; room.style.backgroundSize = `${COMP.d.W * k}px ${COMP.d.H * k}px`;
    for (const o of UP.spots) { const b = el('button', 'spot'); b.type = 'button'; b.setAttribute('aria-label', o.label); b.append(el('span', 'lbl in', o.label)); box(b, { x: o.x * k, y: o.y * k, w: o.w * k, h: o.h * k }); b.onclick = () => go(o.go, $('#upbtn')); b.querySelector('.lbl').style.opacity = 1; room.append(b); }
    H.classList.add('upst'); $('#upscroll').scrollLeft = 1092 * k - innerWidth / 2; $('#updown').onclick = () => upstairs(false); $('#updown').focus();
  }

  /* ---- Explore: labelled access to everything, for keyboard and touch ---- */
  const menu = $('#exmenu');
  const ITEMS = [
    ['chat', 'Talk to Barry', LOCAL ? 'Chat with him' : 'Send him a postcard; he reads them when he wakes'], ['arcade', 'Play Paper Round', 'The arcade cabinet by the door'],
    ['diary', 'Diary', 'His own words, every wake'], ['music', 'Music', 'Records he wrote and sang'], ['art', 'Art', 'His drawings and gallery'],
    ['village', 'Village', 'Walk round the village he builds'], ['replay', 'Village history replay', 'Watch the village grow'], ['tour', 'Take the tour', 'Seven stops, in his voice'],
    ['upstairs', 'Upstairs', "Barry's room: records and paintings"], ['now', 'Now', 'What he is doing this minute'], ['today', 'Today', 'His day so far'],
    ['wants', 'Wants', 'Things he has asked for'], ['places', 'Places', 'Everywhere in the village'], ['pages', 'Pages', 'Web pages he has written'], ['dreams', 'Dreams', 'What he dreamt'],
    ...(LOCAL ? [['postcard', 'Postcard', 'What visitors use to write to him']] : []),
  ];
  function openMenu() {
    menu.innerHTML = '<h2 id="extl">Explore</h2>';
    for (const [g, t, d] of ITEMS) { if (g === 'upstairs' && comp.key !== 'm') continue; const b = el('button', '', `${t}<small>${d}</small>`); b.type = 'button'; b.onclick = () => go(g, $('#exbtn')); menu.append(b); }
    menu.classList.add('on'); $('#exbtn').setAttribute('aria-expanded', 'true'); menu.querySelector('button').focus();
  }
  function closeMenu(refocus) { if (!menu.classList.contains('on')) return; menu.classList.remove('on'); $('#exbtn').setAttribute('aria-expanded', 'false'); if (refocus) $('#exbtn').focus(); }
  $('#exbtn').onclick = () => menu.classList.contains('on') ? closeMenu(true) : openMenu();
  $('#upbtn').onclick = () => upstairs(true);
  $('#tobar').onclick = () => mode('bar');
  addEventListener('pointerdown', e => { if (menu.classList.contains('on') && !menu.contains(e.target) && e.target !== $('#exbtn')) closeMenu(); });

  /* ---- rain you can hear, only if asked for ---- */
  let ac = null, gain = null;
  $('#sndbtn').onclick = () => {
    const b = $('#sndbtn'), on = b.getAttribute('aria-pressed') !== 'true';
    if (on && !ac) {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      const buf = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate), d = buf.getChannelData(0);
      let l = 0; for (let i = 0; i < d.length; i++) { l = 0.97 * l + 0.03 * (Math.random() * 2 - 1); d[i] = (Math.random() * 2 - 1) * 0.35 + l * 2; }
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
      gain = ac.createGain(); gain.gain.value = 0; src.connect(hp).connect(lp).connect(gain).connect(ac.destination); src.start();
    }
    if (ac) { ac.resume(); gain.gain.linearRampToValueAtTime(on ? 0.05 : 0, ac.currentTime + 0.6); }
    b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? 'Rain sound: on' : 'Rain sound: off';
  };

  /* ---- keys ---- */
  addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (H.classList.contains('arcade')) { if (game && game.escape()) return; return arcade(false); }
      if ($('#lb').style.display === 'flex' || getComputedStyle($('#lb')).display !== 'none') { $('#lb').click(); return focusOr($('#pcl')); }
      if (getComputedStyle($('#page')).display !== 'none') { $('#pclose').click(); return focusOr($('#pcl')); }
      if (menu.classList.contains('on')) return closeMenu(true);
      if (document.querySelector('.vmodal')) return;            // the postcard closes itself
      if (H.classList.contains('upst')) return upstairs(false);
      if (H.classList.contains('bar') && !panel.classList.contains('shut')) return closePanel();
    }
    if (e.key === 'Tab') {
      const trap = H.classList.contains('arcade') ? arc : H.classList.contains('upst') ? up : menu.classList.contains('on') ? menu : null;
      if (!trap) return;
      const f = [...trap.querySelectorAll('button,[tabindex="0"]')].filter(shown); if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus(); }
    }
  });
  addEventListener('resize', () => { if (H.classList.contains('bar')) layout(); });
  addEventListener('hashchange', () => { const h = location.hash; if (h === '#arcade') { if (!H.classList.contains('arcade')) arcade(true, null, true); } else { if (H.classList.contains('arcade')) arcade(false, null, true); mode(h === '#village' ? 'village' : 'bar', true); } });

  build();
  $('#pclose').addEventListener('click', () => { if (H.classList.contains('bar')) setTimeout(() => focusOr($('#pcl')), 0); });
  $('#lb').addEventListener('click', () => { if (H.classList.contains('bar')) setTimeout(() => focusOr($('#pcl')), 0); });
  if (location.hash === '#arcade') arcade(true, null, true);
  window.FRONT = { go, mode, layout, get comp() { return comp.key; }, get scale() { return S; } };
})();
