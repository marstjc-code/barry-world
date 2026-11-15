/* Barry's Paper Round: the game behind the cabinet at Small Plates. Loaded only when the arcade opens.
   route.js = the route, input.js = keys and touch, sim.js = the rules, render.js + sprites.js = the picture, audio.js = sound. */
import { route as R } from './route.js';
import { createState, step } from './sim.js';
import { makeRenderer } from './render.js';
import { makeInput } from './input.js';
import { makeAudio } from './audio.js';

const KEY = 'barry-paper-round-v1';                 // high scores live in their own versioned key
const DT = 1 / 60;
const MISS_LINES = ['They can walk to the gate.', 'Near enough.', "That's the hedge's paper now.", 'Wind took it.', 'They can read it off the path.'];
const BUMP_LINES = { float: 'Who parks a milk float there?', bin: 'Bin day. Lovely.', gull: 'Not the butty!' };
const num = x => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0);
const loadBest = () => { try { const j = JSON.parse(localStorage.getItem(KEY)); return j && j.v === 1 ? { v: 1, best: num(j.best), rounds: num(j.rounds) } : { v: 1, best: 0, rounds: 0 }; } catch (e) { return { v: 1, best: 0, rounds: 0 }; } };   // a damaged value reads as zero
const saveBest = b => { try { localStorage.setItem(KEY, JSON.stringify(b)); } catch (e) {} };
function verdict(st) {
  if (st.delivered === R.total && !st.bumps) return "Twelve doors, twelve papers, not a scratch. Don't tell anyone I'm good at this.";
  if (st.delivered === R.total) return 'Every door got one. The bike has opinions about how.';
  if (st.delivered >= 9) return 'Tidy. The butty survived, and so did most of the papers.';
  if (st.delivered >= 5) return "Half the street's reading. The other half can borrow one.";
  if (st.delivered >= 1) return 'They can read it off the pavement.';
  return 'Twelve papers, no readers. I cook better than I throw.';
}

export function mount({ crt, deck, exit, soundOn, toggleSound }) {
  const touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('./game.css', import.meta.url).href; document.head.append(css);
  crt.innerHTML = `<canvas id="prc" aria-label="Barry's Paper Round"></canvas>
   <div class="prhud" id="prhud" hidden><span id="prscore" aria-label="Score">0</span><span id="prcap" role="status"></span><span id="prcount" aria-label="Deliveries">0/${R.total}</span></div>
   <div class="prover title" id="prtitle"><div class="top"><h2 id="artitle">Barry's Paper Round</h2><p class="tag">Steer. Aim. Lob.</p>
     <p class="how">${touch ? 'Left thumb steers: ▲ kerb, ▼ road. Right thumb lobs.<br>Throw as the ring reaches the mat.' : '<b>↑</b> <b>↓</b> steer &nbsp; <b>Space</b> throw &nbsp; <b>P</b> pause<br>Throw as the ring reaches the mat.'}</p></div>
     <div class="bot"><button type="button" class="go" id="prstart">Start round</button><button type="button" id="prexit">Back to the bar</button><p class="best" id="prbest"></p></div></div>
   <div class="prover" id="prpause" hidden><h2>Paused</h2><button type="button" class="go" id="prresume">Resume</button><button type="button" id="prrestart">Restart</button><button type="button" id="prquit">Back to the bar</button></div>
   <div class="prover" id="prend" hidden><div class="receipt" id="prreceipt"></div></div>`;
  deck.innerHTML = `<div class="prpad" ${touch ? '' : 'hidden'}><button type="button" id="prkerb" aria-label="Steer to the kerb">▲<small>kerb</small></button><button type="button" id="prroad" aria-label="Steer out into the road">▼<small>road</small></button></div>
   <div class="prmid"><button type="button" id="prpbtn" aria-label="Pause">❚❚</button><button type="button" id="prsnd" aria-pressed="false">Sound: off</button></div>
   <div class="prpad right" ${touch ? '' : 'hidden'}><button type="button" id="prthrow" aria-label="Throw a paper">LOB</button></div>`;
  deck.classList.add('prdeck');
  const $ = s => crt.querySelector(s) || deck.querySelector(s);
  const canvas = $('#prc'), view = makeRenderer(canvas), audio = makeAudio(soundOn);
  const offs = [];
  let mode = 'title', st = createState(), raf = 0, last = 0, acc = 0, clock = 0, lineT = -99, capT = 0, best = loadBest(), dead = false;

  const input = makeInput({ onPause: () => pause(mode !== 'paused'), active: () => mode === 'play' || mode === 'paused' });
  if (touch) { input.button($('#prkerb'), 'kerb'); input.button($('#prroad'), 'road'); input.button($('#prthrow'), 'throw'); }

  function fit() {                                   // whole-number scaling in device pixels, so every game pixel is square and sharp
    const box = crt.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; if (!box.width) return;
    const portrait = box.width / box.height < 1.15;
    const k = Math.max(1, Math.floor(Math.min(box.width * dpr / (portrait ? 270 : 426), box.height * dpr / (portrait ? 330 : 240))));
    const W = portrait ? 270 : Math.min(576, Math.floor(box.width * dpr / k)), H = Math.max(portrait ? 330 : 240, Math.min(portrait ? 470 : 324, Math.floor(box.height * dpr / k)));
    view.resize(W, H, portrait); canvas.style.width = W * k / dpr + 'px'; canvas.style.height = H * k / dpr + 'px';
    crt.style.setProperty('--prw', W * k / dpr + 'px'); crt.style.setProperty('--prh', H * k / dpr + 'px');
    view.draw(st, clock, mode === 'title');
  }
  const show = (id, on) => { $(id).hidden = !on; };
  function say(msg) { $('#prcap').textContent = msg; capT = clock + 2.6; }
  function hud() { $('#prscore').textContent = st.score; $('#prcount').textContent = `${st.delivered}/${R.total}`; if (capT && clock > capT) { $('#prcap').textContent = ''; capT = 0; } }
  function sndLabel() { const on = soundOn(); $('#prsnd').setAttribute('aria-pressed', on ? 'true' : 'false'); $('#prsnd').textContent = on ? 'Sound: on' : 'Sound: off'; }

  function start() { deck.classList.remove('ended'); st = createState(); input.clear(); acc = 0; lineT = -99; mode = 'play'; show('#prtitle', 0); show('#prend', 0); show('#prpause', 0); show('#prhud', 1); $('#prcap').textContent = ''; hud(); canvas.focus(); }
  function pause(on) {
    if (on && mode === 'play') { mode = 'paused'; show('#prpause', 1); $('#prresume').focus(); }
    else if (!on && mode === 'paused') { mode = 'play'; show('#prpause', 0); input.clear(); last = 0; canvas.focus(); }
  }
  function finish() {
    mode = 'end'; best = loadBest(); const record = st.score > best.best; best.rounds++; if (record) best.best = st.score; saveBest(best); audio.play('finish');
    const row = (a, b) => `<div class="row"><span>${a}</span><span>${b}</span></div>`;
    $('#prreceipt').innerHTML = `<h3>SMALL PLATES</h3><p class="sub">MORNING ROUND</p><hr>${row('Deliveries', `${st.delivered} / ${R.total}`)}${row('Best streak', st.best)}${row('Papers thrown', st.thrown)}${row('Bumps', st.bumps)}<hr>
      ${row('<b>FINAL SCORE</b>', `<b id="prfinal">${st.score}</b>`)}${row('Local best', `<span id="prlocal">${best.best}</span>${record && st.score ? ' ★ new' : ''}`)}<hr><p class="verdict">“${verdict(st)}”</p><p class="sub">— Barry</p>
      <div class="btns"><button type="button" class="go" id="pragain">Ride again</button><button type="button" id="prback">Back to the bar</button></div>`;
    show('#prhud', 0); show('#prend', 1); deck.classList.add('ended'); $('#pragain').onclick = start; $('#prback').onclick = exit; $('#pragain').focus();
  }
  function tick(ts) {
    if (dead) return; raf = requestAnimationFrame(tick);
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0; last = ts; clock += dt;
    if (mode === 'play') {
      acc += dt; const inp = input.read(); let first = true;
      while (acc >= DT) {
        step(st, DT, first ? inp : { steer: inp.steer }); first = false; acc -= DT;
        for (const e of st.ev) {
          if (e.e === 'throw') audio.play('throw');
          if (e.e === 'hit') audio.play('hit'); if (e.e === 'streak') audio.play('streak'); if (e.e === 'gull') audio.play('gull');
          if (e.e === 'miss') { audio.play('miss'); if (clock - lineT > 9 && Math.random() < 0.5) { lineT = clock; say(MISS_LINES[Math.random() * MISS_LINES.length | 0]); } }
          if (e.e === 'bump') { audio.play('bump'); if (clock - lineT > 6) { lineT = clock; say(BUMP_LINES[e.what] || ''); } }
          if (e.e === 'finish') { view.draw(st, clock); return finish(); }
        }
        if (st.ev.length) { view.draw(st, clock); st.ev.length = 0; }   // let the renderer see every event, even on a frame with several steps
      }
      hud();
    }
    if (mode !== 'paused') view.draw(st, clock, mode === 'title');
    st.ev.length = 0;                                 // each event is shown once, whatever the screen's refresh rate
  }

  const on = (t, e, f) => { t.addEventListener(e, f); offs.push(() => t.removeEventListener(e, f)); };
  const ro = new ResizeObserver(() => fit()); ro.observe(crt); offs.push(() => ro.disconnect()); css.onload = fit;   // refit when the cabinet's own styles arrive or the screen turns
  on(window, 'resize', fit); on(window, 'blur', () => pause(true)); on(document, 'visibilitychange', () => { if (document.hidden) pause(true); });
  $('#prstart').onclick = start; $('#prexit').onclick = exit; $('#prresume').onclick = () => pause(false); $('#prrestart').onclick = start; $('#prquit').onclick = exit;
  $('#prpbtn').onclick = () => pause(mode !== 'paused'); $('#prsnd').onclick = () => { toggleSound(); sndLabel(); };
  canvas.tabIndex = -1; sndLabel();
  $('#prbest').textContent = best.best ? `Local best: ${best.best}` : '';
  fit(); requestAnimationFrame(() => { fit(); $('#prstart').focus(); }); raf = requestAnimationFrame(tick);
  window.__paperRound = { get st() { return st; }, get mode() { return mode; }, R, start, pause, KEY };

  return {
    escape() { if (mode === 'play') { pause(true); return true; } if (mode === 'paused') { pause(false); return true; } return false; },   // Escape pauses before it leaves
    unmount() { dead = true; cancelAnimationFrame(raf); input.destroy(); offs.forEach(f => f()); audio.close(); css.remove(); deck.classList.remove('prdeck'); delete window.__paperRound; },
  };
}
