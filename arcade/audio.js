/* Barry's Paper Round: sound, all synthesised. Silent unless the world's own sound setting is on. */
export function makeAudio(enabled) {
  let ac = null;
  const ctx = () => { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; };
  function noise(dur, freq, type, vol, when = 0) {
    const a = ctx(), n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), v = a.createGain(); s.buffer = buf; f.type = type; f.frequency.value = freq; v.gain.value = vol;
    s.connect(f).connect(v).connect(a.destination); s.start(a.currentTime + when);
  }
  function tone(f0, f1, dur, type, vol, when = 0) {
    const a = ctx(), o = a.createOscillator(), v = a.createGain(), t = a.currentTime + when; o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    v.gain.setValueAtTime(vol, t); v.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(v).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  const S = {
    throw: () => noise(0.12, 2400, 'bandpass', 0.12),
    hit: () => { noise(0.05, 1100, 'lowpass', 0.5); tone(150, 70, 0.07, 'sine', 0.25); },            // a dry paper slap
    miss: () => noise(0.06, 500, 'lowpass', 0.2),
    streak: () => { tone(880, 880, 0.09, 'triangle', 0.16); tone(1320, 1320, 0.16, 'triangle', 0.16, 0.09); },
    bump: () => { tone(120, 45, 0.22, 'square', 0.2); noise(0.18, 300, 'lowpass', 0.4); },
    gull: () => { tone(1500, 900, 0.16, 'sawtooth', 0.07); tone(1400, 800, 0.18, 'sawtooth', 0.07, 0.2); },
    finish: () => { tone(1568, 1568, 0.12, 'triangle', 0.18); tone(2093, 2093, 0.4, 'triangle', 0.18, 0.1); },   // the till
  };
  return { play(name) { if (!enabled() || !S[name]) return; try { S[name](); } catch (e) {} }, close() { if (ac) ac.close(); } };
}
