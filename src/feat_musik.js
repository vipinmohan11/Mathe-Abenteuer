/* =====================================================================
   MUSIK-WERKSTATT (Kreativ-Bereich, geschlossen bis Kreativzeit): kleiner Step-Sequencer mit WebAudio-Synthese (keine Samples).
   Start: EIN Schlagzeug-Klang, 8 Schritte, Play/Stopp, Tempo. Alles andere wird im Shop verdient (Katalog unten).
   Zustand: S.mus = laufendes Muster (Autosave), S.songs = „Meine Beats“. Alles hier heißt mu… / MU_… (ein gemeinsames Skript).
   Teile: 1 Klang · 2 Katalog · 3 Muster-Logik · 4 Abspielen · 5 Ansicht · 6 Aktionen
   ===================================================================== */
const MU_VIEWS = ['musik', 'musikSongs'];
const MU_SCALES = { dpent: { st: [0, 2, 4, 7, 9] }, mpent: { st: [0, 3, 5, 7, 10] }, dur: { st: [0, 2, 4, 5, 7, 9, 11] } };
const MU_NOTE = ['C', 'Cis', 'D', 'Dis', 'E', 'F', 'Fis', 'G', 'Gis', 'A', 'B', 'H'];
const muFreq = m => 440 * Math.pow(2, (m - 69) / 12);

/* ---------- Bausteine ---------- */
const muNoiseBufs = new WeakMap();
function muNoise(c) {
  let b = muNoiseBufs.get(c);
  if (!b) { b = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = b.getChannelData(0); let s = 1234567; for (let i = 0; i < d.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = s / 2147483648 - 1; } muNoiseBufs.set(c, b); }
  return b;
}
const muG = (c, v) => { const g = c.createGain(); g.gain.value = v == null ? 1 : v; return g; };
const muF = (c, type, f, q) => { const x = c.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q; return x; };
function muOsc(c, type, f, t, dur) { const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.start(t); o.stop(t + dur + .05); return o; }
function muNz(c, t, dur) { const s = c.createBufferSource(); s.buffer = muNoise(c); s.loop = true; s.start(t, (t * 7.31) % .5); s.stop(t + dur + .05); return s; }
function muEnv(g, t, a, pk, d) { const p = g.gain; p.setValueAtTime(0.0001, t); p.linearRampToValueAtTime(Math.max(pk, 0.0002), t + a); p.exponentialRampToValueAtTime(0.0001, t + a + d); }
function muNoiseHit(c, t, v, o, type, f, q, a, d) { const n = muNz(c, t, a + d), fl = muF(c, type, f, q), g = muG(c, 0); muEnv(g, t, a, v, d); n.connect(fl); fl.connect(g); g.connect(o); }
function muTone(c, t, v, o, type, f, d, a, f1, sw) { const os = muOsc(c, type, f, t, (a || .002) + d); if (f1) os.frequency.exponentialRampToValueAtTime(f1, t + (sw || .1)); const g = muG(c, 0); muEnv(g, t, a || .002, v, d); os.connect(g); g.connect(o); return os; }

/* ---------- Synthese-Rezepte: (ctx, zeit, lautstärke, ziel, midi-note) ---------- */
const MU_SYN = {
  kick(c, t, v, o) { muTone(c, t, v * .95, o, 'sine', 150, .4, .002, 45, .12); },
  snare(c, t, v, o) { muNoiseHit(c, t, v * .7, o, 'highpass', 1400, 0, .001, .17); muTone(c, t, v * .5, o, 'triangle', 190, .1, .001, 118, .08); },
  hat(c, t, v, o) { muNoiseHit(c, t, v * .55, o, 'highpass', 7000, 0, .001, .045); },
  clap(c, t, v, o) { [0, .013, .026].forEach(d => muNoiseHit(c, t + d, v * .85, o, 'bandpass', 1250, 1.2, .001, .02)); muNoiseHit(c, t + .039, v * .9, o, 'bandpass', 1250, 1, .002, .16); },
  wood(c, t, v, o) { const f = muF(c, 'bandpass', 1050, 4); f.connect(o); muTone(c, t, v * 1.1, f, 'sine', 1050, .06, .001, 880, .03); },
  cow(c, t, v, o) { const f = muF(c, 'bandpass', 830, 1.4); f.connect(o); [560, 845].forEach(fr => { const os = muOsc(c, 'square', fr, t, .3), g = muG(c, 0); muEnv(g, t, .001, v * .3, .26); os.connect(g); g.connect(f); }); },
  /* --- Bass --- */
  bsub(c, t, v, o, n) { const f = muFreq(n); muTone(c, t, v * .85, o, 'sine', f, .34, .008); muTone(c, t, v * .22, o, 'sine', f * 2, .16, .005); },
  bpluck(c, t, v, o, n) { const f = muFreq(n), os = muOsc(c, 'triangle', f, t, .3), os2 = muOsc(c, 'square', f, t, .3), fl = muF(c, 'lowpass', 2200, 2), g = muG(c, 0), g2 = muG(c, .25); fl.frequency.setValueAtTime(2400, t); fl.frequency.exponentialRampToValueAtTime(220, t + .18); muEnv(g, t, .003, v * .7, .24); os.connect(fl); os2.connect(g2); g2.connect(fl); fl.connect(g); g.connect(o); },
  bsq(c, t, v, o, n) { const os = muOsc(c, 'square', muFreq(n), t, .22), g = muG(c, 0); muEnv(g, t, .002, v * .46, .2); os.connect(g); g.connect(o); },
  bsaw(c, t, v, o, n) { const d = .3, os = muOsc(c, 'sawtooth', muFreq(n), t, d), fl = muF(c, 'lowpass', 1400, 4), g = muG(c, 0); fl.frequency.setValueAtTime(1500, t); fl.frequency.exponentialRampToValueAtTime(260, t + d); muEnv(g, t, .005, v * .55, d); os.connect(fl); fl.connect(g); g.connect(o); },
  /* --- Melodie --- */
  bell(c, t, v, o, n) { const f = muFreq(n); muTone(c, t, v * .5, o, 'sine', f, 1.1, .001); muTone(c, t, v * .18, o, 'sine', f * 2.76, .5, .001); muTone(c, t, v * .08, o, 'sine', f * 5.4, .25, .001); },
  epiano(c, t, v, o, n) { const f = muFreq(n); muTone(c, t, v * .42, o, 'sine', f, .9, .004); muTone(c, t, v * .2, o, 'sine', f * 2, .5, .002); muTone(c, t, v * .1, o, 'sine', f * 14, .07, .001); muTone(c, t, v * .1, o, 'triangle', f * .5, .6, .004); }
};
/* Eine Stimme spielen (auch mit OfflineAudioContext nutzbar). */
function voice(inst, note, time, vol, ctx, dest) {
  const it = typeof inst === 'string' ? CATALOG[inst] : inst;
  if (!it || !MU_SYN[it.syn]) return;
  try { MU_SYN[it.syn](ctx, time, vol == null ? 1 : vol, dest, note || 60); } catch (e) { }
}

/* ---------- Klang-Sets: Effektkette am Ausgang ---------- */
const muImpBufs = new WeakMap();
function muImpulse(c, secs) {
  let m = muImpBufs.get(c); if (!m) { m = {}; muImpBufs.set(c, m); }
  if (m[secs]) return m[secs];
  const len = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let s = 99 + ch * 77; for (let i = 0; i < len; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = (s / 2147483648 - 1) * Math.pow(1 - i / len, 2.6); } }
  return m[secs] = b;
}
function muCurve(fn) { const n = 2048, a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = fn(i / (n - 1) * 2 - 1); return a; }
function muKitChain(c, k, dest) {
  const input = muG(c, 1); let cur = input;
  if (k.crush) { const lv = Math.pow(2, k.crush), w = c.createWaveShaper(); w.curve = muCurve(x => Math.round(x * lv) / lv); cur.connect(w); cur = w; }
  if (k.lp) { const f = muF(c, 'lowpass', k.lp, .6); cur.connect(f); cur = f; }
  const out = muG(c, 1); cur.connect(out);
  if (k.rev) { const cv = c.createConvolver(); cv.buffer = muImpulse(c, k.revT || 1.4); const wg = muG(c, k.rev); cur.connect(cv); cv.connect(wg); wg.connect(out); }
  out.connect(dest);
  return input;
}
/* Sitzung: Lautstärke → Kompressor → Klang-Set → Ausgang */
function muSession(c, kitId, dest) {
  const kit = CATALOG[kitId] || CATALOG['mk.normal'] || {};
  const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.knee.value = 12; comp.attack.value = .004; comp.release.value = .2;
  const bus = muG(c, .8), kc = muKitChain(c, kit.fx || {}, dest);
  bus.connect(comp); comp.connect(kc);
  return { c, bus, comp, kc, dead: false };
}
function muSessionEnd(s) {
  if (!s || s.dead) return; s.dead = true;
  try { const t = s.c.currentTime; s.bus.gain.cancelScheduledValues(t); s.bus.gain.setValueAtTime(s.bus.gain.value, t); s.bus.gain.linearRampToValueAtTime(0, t + .03); } catch (e) { }
  setTimeout(() => { try { s.bus.disconnect(); s.comp.disconnect(); s.kc.disconnect(); } catch (e) { } }, 150);
}

/* ---------- Scheduler (Vorausplanung) ---------- */
/* o: { now(), look, bpm(), div() Schritte pro Schlag, swing() 0..100, steps(), step(stepIndex, zeit) } */
function muMakeSched(o) {
  const s = { step: 0, grid: 0, started: false };
  s.start = t0 => { s.step = 0; s.grid = t0; s.started = true; };
  s.tick = () => {
    if (!s.started) return;
    const now = o.now();
    while (s.grid < now + o.look) {
      const sd = 60 / o.bpm() / o.div(), off = (s.step % 2 === 1) ? o.swing() / 100 * .5 * sd : 0;
      o.step(s.step, s.grid + off);
      s.grid += sd; s.step = (s.step + 1) % o.steps();
    }
  };
  return s;
}

/* ---------- Katalog (alles Verdiente): Klänge · Töne · Klang-Sets · Spuren & Takt ---------- */
const muThumb = it => `<div class="mu-th">${it.e}</div>`;
regKind('msound', { group: 'musik', label: 'Klänge', ic: 'music', thumb: muThumb });
regKind('mscale', { group: 'musik', label: 'Tonleitern', ic: 'music', thumb: muThumb });
regKind('mkit', { group: 'musik', label: 'Klang-Sets', ic: 'sparkle', thumb: muThumb });
regKind('mfx', { group: 'musik', label: 'Spuren & Takt', ic: 'beat', thumb: muThumb });
const muShop = price => ({ t: 'shop', cur: 'c', price });
const muMile = why => ({ t: 'milestone', why });
(function () {
  const I = (id, name, e, role, syn, src, oct) => ({ id: 'ms.' + id, kind: 'msound', name, e, role, syn, oct: oct || 0, src });
  regItems([
    I('kick', 'Trommel', '🥁', 'd', 'kick', { t: 'free' }),
    I('snare', 'Snare', '💥', 'd', 'snare', muShop(20)),
    I('hat', 'Hi-Hat', '✨', 'd', 'hat', muShop(30)),
    I('clap', 'Klatschen', '👏', 'd', 'clap', muShop(50)),
    I('wood', 'Holzblock', '🧱', 'd', 'wood', muMile('Sammle 2 Stempel')),
    I('cow', 'Kuhglocke', '🐄', 'd', 'cow', muShop(100)),
    I('bsub', 'Tiefer Bass', '🌊', 'b', 'bsub', muShop(90)),
    I('bpluck', 'Zupf-Bass', '🎸', 'b', 'bpluck', muShop(120)),
    I('bsq', '8-Bit-Bass', '👾', 'b', 'bsq', muShop(150)),
    I('bsaw', 'Saw-Bass', '🔊', 'b', 'bsaw', muShop(180)),
    I('bell', 'Glockenspiel', '🎐', 'm', 'bell', muShop(110), 12),
    I('epiano', 'E-Piano', '🎹', 'm', 'epiano', muShop(160))
  ]);
  const S_ = (id, name, e, src) => ({ id: 'mc.' + id, kind: 'mscale', name, e, sc: id, src });
  regItems([S_('dpent', 'Fröhlich', '🌞', { t: 'free' }), S_('mpent', 'Nachdenklich', '🌧️', muShop(60)), S_('dur', 'Ganze Leiter', '🌈', muShop(90))]);
  const K = (id, name, e, src, fx) => ({ id: 'mk.' + id, kind: 'mkit', name, e, fx, src });
  regItems([
    K('normal', 'Normal', '🎵', { t: 'free' }, {}),
    K('warm', 'Warm', '☕', muMile('Speichere 3 Beats'), { lp: 3200, rev: .1 }),
    K('raum', 'Großer Raum', '🏛️', muShop(140), { rev: .35, revT: 2 }),
    K('retro', 'Retro', '🎮', muShop(250), { crush: 5, lp: 9000 })
  ]);
  const X = (id, name, e, src) => ({ id: 'mx.' + id, kind: 'mfx', name, e, src });
  regItems([
    X('s16', '16 Schritte', '⏩', muShop(50)),
    X('swing', 'Swing', '🌀', muShop(70)),
    X('d2', 'Zweite Schlag-Spur', '➕', muShop(80)),
    X('bar2', 'Zweiter Takt', '2️⃣', muShop(120)),
    X('d3', 'Dritte Schlag-Spur', '➕', muShop(130))
  ]);
})();
/* Meilensteine: vom Lernfortschritt geschenkt */
function muCheck() {
  try {
    if (stampCount() >= 2) unlock('ms.wood');
    if ((S.songs || []).length >= 3) unlock('mk.warm');
  } catch (e) { }
}

/* =====================================================================
   MUSTER-LOGIK
   MU.rows[k].steps = Array(32): Schlagzeug 0/1 · Bass/Melodie: -1 = Pause, 0.. = Tonstufe.
   Gespeichert: Zeichenkette, '.' = leer, Schlagzeug '1', Töne '0'..'6'.
   ===================================================================== */
const MU_ROWS = [
  { k: 'd0', role: 'd', n: 'Schlag', def: 'ms.kick', on: () => true },
  { k: 'd1', role: 'd', n: 'Schlag 2', def: 'ms.snare', on: () => hasItem('mx.d2') },
  { k: 'd2', role: 'd', n: 'Schlag 3', def: 'ms.hat', on: () => hasItem('mx.d3') },
  { k: 'b', role: 'b', n: 'Bass', def: null, on: () => muOwned('b').length > 0 },
  { k: 'm', role: 'm', n: 'Melodie', def: null, on: () => muOwned('m').length > 0 }
];
const muPitched = r => r.role !== 'd';
const muOwned = role => itemsOf('msound').filter(i => i.role === role && hasItem(i.id));
const muRowsOn = () => MU_ROWS.filter(r => r.on());
const muSoundOn = () => S.cfg.sound !== false;
const muClamp = (v, a, b) => Math.max(a, Math.min(b, v));
const MU = { inited: false, bpm: 90, swing: 0, sp: 8, bars: 1, kit: 'mk.normal', scale: 'mc.dpent', name: '', editId: null, rows: {}, sel: 'd0', page: 0, dirty: false };
const muN = () => MU.sp * MU.bars;
const muNV = () => Math.min(muN(), window.innerWidth < 720 ? 8 : 16);
const muScaleOf = () => MU_SCALES[(CATALOG[MU.scale] || {}).sc] || MU_SCALES.dpent;
const muEmpty = pitched => Array(32).fill(pitched ? -1 : 0);
function muReset() {
  MU.bpm = 90; MU.swing = 0; MU.sp = 8; MU.bars = 1; MU.kit = 'mk.normal'; MU.scale = 'mc.dpent'; MU.name = ''; MU.editId = null; MU.sel = 'd0'; MU.page = 0; MU.dirty = false;
  MU.rows = {}; MU_ROWS.forEach(r => { MU.rows[r.k] = { inst: r.def || '', steps: muEmpty(muPitched(r)) }; });
}
function muEncSteps(arr, pitched, n) { let s = ''; for (let i = 0; i < n; i++) { const v = arr[i]; s += pitched ? (v >= 0 ? String(v) : '.') : (v ? '1' : '.'); } return s; }
function muDecSteps(str, pitched) { const a = muEmpty(pitched); String(str || '').slice(0, 32).split('').forEach((ch, i) => { if (ch === '.' || ch === ' ') return; if (pitched) { const d = parseInt(ch, 10); a[i] = d >= 0 && d <= 6 ? d : -1; } else a[i] = 1; }); return a; }
function muEncode() {
  const n = muN();
  return { id: MU.editId, name: MU.name, bpm: MU.bpm, swing: MU.swing, sp: MU.sp, bars: MU.bars, kit: MU.kit, scale: MU.scale,
    rows: MU_ROWS.filter(r => r.on()).map(r => ({ k: r.k, inst: MU.rows[r.k].inst, steps: muEncSteps(MU.rows[r.k].steps, muPitched(r), n) })) };
}
/* Gespeichertes → Muster (tolerant gegenüber fehlenden/alten Feldern) */
function muDecode(s) {
  s = s || {}; const P = { bpm: muClamp(+s.bpm || 90, 60, 160), swing: muClamp(+s.swing || 0, 0, 100), sp: s.sp === 16 ? 16 : 8, bars: s.bars === 2 ? 2 : 1,
    kit: CATALOG[s.kit] && hasItem(s.kit) ? s.kit : 'mk.normal', scale: CATALOG[s.scale] && hasItem(s.scale) ? s.scale : 'mc.dpent', name: String(s.name || ''), editId: s.id || null, rows: {} };
  MU_ROWS.forEach(r => {
    const x = (s.rows || []).find(q => q && q.k === r.k) || {}, it = CATALOG[x.inst];
    const inst = it && it.role === r.role && hasItem(x.inst) ? x.inst : (r.def && hasItem(r.def) ? r.def : ((muOwned(r.role)[0] || {}).id || ''));
    P.rows[r.k] = { inst, steps: muDecSteps(x.steps, muPitched(r)) };
  });
  return P;
}
function muApply(P) { Object.assign(MU, P); MU.sel = 'd0'; MU.page = 0; MU.dirty = false; muClampScale(); }
function muClampScale() { const n = muScaleOf().st.length; ['b', 'm'].forEach(k => { const a = MU.rows[k].steps; for (let i = 0; i < 32; i++) if (a[i] >= n) a[i] = n - 1; }); }
let muPersistT = 0;
function muPersist() { clearTimeout(muPersistT); muPersistT = 0; try { S.mus = Object.assign(muEncode(), { dirty: MU.dirty }); save(); } catch (e) { } }
function muTouch() { MU.dirty = true; clearTimeout(muPersistT); muPersistT = setTimeout(muPersist, 500); }
function muInit() {
  if (MU.inited) return; MU.inited = true; muReset();
  if (S.mus && S.mus.rows) { muApply(muDecode(S.mus)); MU.dirty = !!S.mus.dirty; }
}
/* Instrument einer Spur: nur Besessenes (sonst Ersatz) */
function muInstOf(r) {
  const x = MU.rows[r.k], it = CATALOG[x.inst];
  if (it && it.role === r.role && hasItem(x.inst)) return it;
  const o = muOwned(r.role)[0]; if (o) x.inst = o.id; return o || null;
}
const muIsOn = (r, s, p) => muPitched(r) ? MU.rows[r.k].steps[s] === p : !!MU.rows[r.k].steps[s];
function muSet(r, s, p, on) { const a = MU.rows[r.k].steps; if (!muPitched(r)) a[s] = on ? 1 : 0; else if (on) a[s] = p; else if (a[s] === p) a[s] = -1; }
const muHasNotes = () => MU_ROWS.some(r => MU.rows[r.k].steps.some(v => muPitched(r) ? v >= 0 : v));
function muSetBars(n) {
  if (n === MU.bars) return;
  if (n === 2) MU_ROWS.forEach(r => { const a = MU.rows[r.k].steps, p = muPitched(r); if (a.slice(MU.sp, MU.sp * 2).every(v => p ? v < 0 : !v)) for (let k = 0; k < MU.sp; k++) a[MU.sp + k] = a[k]; });
  MU.bars = n; MU.page = 0;
}
/* ---------- Töne ---------- */
function muMidi(r, deg, it) { return (r.k === 'b' ? 36 : 60) + muScaleOf().st[Math.min(deg, muScaleOf().st.length - 1)] + (it.oct || 0); }
const muVol = r => r.k === 'b' ? .75 : r.k === 'm' ? .7 : r.k === 'd0' ? .85 : .75;
function muNote(P, r, v, t, c, dest, instId) {
  const it = instId ? CATALOG[instId] : CATALOG[P.rows[r.k].inst]; if (!it) return;
  voice(it, muPitched(r) ? muMidi(r, v, it) : 0, t, muVol(r) * (it.syn === 'hat' ? .8 : 1), c, dest);
}
function muPlayStep(P, step, t, c, dest) {
  MU_ROWS.forEach(r => { const x = P.rows[r.k]; if (!x || !x.inst) return; const v = x.steps[step]; if (muPitched(r) ? v < 0 : !v) return; muNote(P, r, v, t, c, dest); });
}
/* ---------- Speichern: Meine Beats ---------- */
const MU_MAX = 30;
const muSongById = id => S.songs.find(s => s.id === id);
const muNewId = () => 's' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
function muDefaultName() { let n = S.songs.length + 1; const have = new Set(S.songs.map(s => s.name)); while (have.has('Mein Beat ' + n)) n++; return 'Mein Beat ' + n; }
function muSaveSong(name, asCopy) {
  name = String(name || '').trim().slice(0, 24) || muDefaultName();
  const song = muEncode(); song.name = name; song.ts = Date.now();
  const ex = !asCopy && MU.editId && muSongById(MU.editId);
  if (ex) { song.id = ex.id; S.songs[S.songs.indexOf(ex)] = song; }
  else { if (S.songs.length >= MU_MAX) { toast('📦', 'Du hast schon ' + MU_MAX + ' Beats. Lösche einen alten.'); return false; } song.id = muNewId(); S.songs.push(song); }
  MU.editId = song.id; MU.name = name; MU.dirty = false; muPersist();
  try { checkTrophies(); } catch (e) { }
  muCheck(); save(); return true;
}
function muSongText(s) { return `${s.bpm} Tempo · ${(s.sp === 16 ? 16 : 8) * (s.bars === 2 ? 2 : 1)} Schritte`; }

/* =====================================================================
   ABSPIELEN
   ===================================================================== */
const ENG = { sess: null, sched: null, timer: 0, raf: 0, q: [], playing: false, proj: null, songId: null, prev: null, cur: -1, watch: 0 };
function muStartEng(P, songId) {
  if (!muSoundOn()) { toast('🔇', 'Die Töne sind ausgeschaltet (Eltern-Bereich)'); return false; }
  const c = AC(); if (!c) { toast('🔇', 'Dieses Gerät kann gerade keine Töne abspielen'); return false; }
  muStopEng(true);
  ENG.proj = P; ENG.songId = songId || null; ENG.q = []; ENG.cur = -1;
  ENG.sess = muSession(c, P.kit, c.destination);
  ENG.sched = muMakeSched({ now: () => c.currentTime, look: .12, bpm: () => ENG.proj.bpm, div: () => ENG.proj.sp === 8 ? 2 : 4, swing: () => ENG.proj.swing, steps: () => ENG.proj.sp * ENG.proj.bars,
    step: (s, t) => { muPlayStep(ENG.proj, s, t, c, ENG.sess.bus); ENG.q.push({ s, t }); } });
  ENG.sched.start(c.currentTime + .06);
  ENG.timer = setInterval(muTick, 25);
  ENG.playing = true; ENG.raf = requestAnimationFrame(muFrame); muPlayUI();
  return true;
}
function muTick() {
  if (!MU_VIEWS.includes(view) || document.hidden) { muStopEng(); return; }
  try { ENG.sched.tick(); } catch (e) { console.error(e); muStopEng(); }
}
function muFrame() {
  if (!ENG.playing) return;
  const c = ENG.sess && ENG.sess.c; if (c) {
    const lat = c.outputLatency || c.baseLatency || 0; let last = null;
    while (ENG.q.length && ENG.q[0].t + lat <= c.currentTime) last = ENG.q.shift();
    if (last) muShowStep(last.s);
  }
  ENG.raf = requestAnimationFrame(muFrame);
}
function muStopEng(silent) {
  clearInterval(ENG.timer); ENG.timer = 0; cancelAnimationFrame(ENG.raf); ENG.raf = 0;
  const was = ENG.playing; ENG.playing = false;
  if (ENG.sess) { muSessionEnd(ENG.sess); ENG.sess = null; }
  ENG.sched = null; ENG.q = []; ENG.cur = -1; ENG.songId = null;
  muClearHead();
  if (was && !silent) muPlayUI();
}
/* Beim Verlassen: alles anhalten und Audio freigeben */
function muDispose() {
  muStopEng(true);
  if (ENG.prev) { muSessionEnd(ENG.prev); ENG.prev = null; }
  clearInterval(ENG.watch); ENG.watch = 0; muCloseSheet();
  if (muPersistT) muPersist();
}
function muWatch() { if (!MU_VIEWS.includes(view)) muDispose(); }
function muKitChanged() {
  const c = ENG.sess && ENG.sess.c; if (ENG.playing && ENG.proj === MU && c) { const old = ENG.sess; ENG.sess = muSession(c, MU.kit, c.destination); muSessionEnd(old); }
  if (ENG.prev) { muSessionEnd(ENG.prev); ENG.prev = null; }
}
function muPreview(r, v, instId) {
  if (!muSoundOn()) return; const c = AC(); if (!c) return;
  if (!ENG.prev || ENG.prev.dead) ENG.prev = muSession(c, MU.kit, c.destination);
  muNote(MU, r, v == null ? 0 : v, c.currentTime + .01, c, ENG.prev.bus, instId);
}

/* =====================================================================
   ANSICHT
   ===================================================================== */
const muRowOf = k => MU_ROWS.find(r => r.k === k);
function muCellsHTML(r, p, s0, NV) {
  let h = '';
  const bl = MU.sp / 4;
  for (let i = 0; i < NV; i++) { const s = s0 + i, on = muIsOn(r, s, p); h += `<button class="mu-pad${on ? ' on' : ''}${Math.floor((s % MU.sp) / bl) & 1 ? ' alt' : ''}" data-r="${r.k}" data-s="${s}" data-p="${p}" aria-label="${r.n} Schritt ${s + 1}"></button>`; }
  return h;
}
function muLaneHTML(r, s0, NV) {
  const it = muInstOf(r) || { name: '?', e: '❓' }, sc = muScaleOf(), pit = muPitched(r);
  const head = `<button class="mu-inst${MU.sel === r.k ? ' sel' : ''}" data-act="muSel" data-arg="${r.k}" aria-label="${r.n}: ${esc(it.name)}"><span class="mu-ie">${it.e}</span><span class="mu-in"><small>${r.n}</small>${esc(it.name)}</span></button>`;
  let rows = '';
  if (!pit) rows = `<div class="mu-row"><span class="mu-lab"></span><div class="mu-cells">${muCellsHTML(r, 0, s0, NV)}</div></div>`;
  else { const cnt = r.k === 'b' ? Math.min(4, sc.st.length) : sc.st.length; for (let p = cnt - 1; p >= 0; p--) { rows += `<div class="mu-row"><span class="mu-lab${p === 0 ? ' root' : ''}">${MU_NOTE[((r.k === 'b' ? 36 : 60) + sc.st[p]) % 12]}</span><div class="mu-cells">${muCellsHTML(r, p, s0, NV)}</div></div>`; } }
  return `<div class="mu-lane mu-${r.k[0]}${pit ? ' pit' : ''}" data-lane="${r.k}">${head}<div class="mu-rows">${rows}</div></div>`;
}
function muGridHTML() {
  const NV = muNV(), pages = muN() / NV; MU.page = Math.min(MU.page, pages - 1); const s0 = MU.page * NV, bl = MU.sp / 4;
  let hn = ''; for (let i = 0; i < NV; i++) { const s = s0 + i; hn += `<span class="mu-hn${s % bl === 0 ? ' b' : ''}" data-s="${s}">${s % bl === 0 ? (s % MU.sp) / bl + 1 : '·'}</span>`; }
  return `<div class="mu-lane mu-hdl"><span></span><div class="mu-rows"><div class="mu-row"><span class="mu-lab"></span><div class="mu-cells">${hn}</div></div></div></div>` + muRowsOn().map(r => muLaneHTML(r, s0, NV)).join('');
}
function muPagesHTML() {
  const NV = muNV(), pages = muN() / NV; if (pages < 2) return '';
  let h = '<div class="mu-pages" role="group" aria-label="Takt-Seite">';
  for (let p = 0; p < pages; p++) h += `<button class="${p === MU.page ? 'on' : ''}" data-act="muPage" data-arg="${p}">${NV === MU.sp ? 'Takt ' + (p + 1) : (p * NV + 1) + '–' + (p + 1) * NV}</button>`;
  return h + '</div>';
}
const muSeg = (items, cur, act) => `<div class="mu-seg">${items.map(([v, l]) => `<button class="${String(v) === String(cur) ? 'on' : ''}" data-act="${act}" data-arg="${v}">${l}</button>`).join('')}</div>`;
/* Meine Klänge: alles Verdiente und alles, was noch kommt (grau mit Preis) */
function muLibHTML() {
  const groups = [['Schlagzeug', itemsOf('msound').filter(i => i.role === 'd'), 'muSound'], ['Bass', itemsOf('msound').filter(i => i.role === 'b'), 'muSound'], ['Melodie', itemsOf('msound').filter(i => i.role === 'm'), 'muSound'],
    ['Tonleiter', itemsOf('mscale'), 'muScale'], ['Spuren & Takt', itemsOf('mfx'), ''], ['Klang-Sets', itemsOf('mkit'), 'muKit']];
  return `<div class="mu-lib"><h3>Meine Klänge</h3><p class="mute small">Graue Klänge kannst du dir im Shop verdienen. Tippe darauf, um zu sehen, was sie kosten.</p>` + groups.map(([n, l, act]) =>
    `<div class="mu-lg"><span class="mu-sh">${n}</span><div class="itiles">${l.map(it => itemTile(it, { act, arg: it.id, sel: it.id === MU.kit || it.id === MU.scale || (act === 'muSound' && muRowsOn().some(r => MU.rows[r.k].inst === it.id)) })).join('')}</div></div>`).join('') + '</div>';
}
VIEWS.musik = () => {
  muInit(); setTimeout(muMount, 0);
  const on = muSoundOn(), n = S.songs.length, has = muHasNotes();
  return topBar(ico('music', 26) + ' Musik-Werkstatt', 'kreativhefte', `<button class="btn sec sm" data-act="muSongs">${ico('beat', 20)} Meine Beats <b>${n}</b></button>`) + `
  <div class="mu" id="muRoot">
  ${on ? '' : `<div class="mu-note">${ico('mute', 22)} Die Töne sind ausgeschaltet (Eltern-Bereich). Du kannst trotzdem bauen und speichern.</div>`}
  <div class="mu-bar card">
    <button id="muPlay" class="mu-play${ENG.playing && ENG.proj === MU ? ' on' : ''}" data-act="muPlay" aria-label="Abspielen">${muPlayInner(ENG.playing && ENG.proj === MU)}</button>
    <div class="mu-sl"><label for="muBpm">Tempo</label><div class="mu-slr"><input id="muBpm" type="range" min="60" max="160" value="${MU.bpm}"><b id="muBpmV">${MU.bpm}</b></div></div>
    ${hasItem('mx.swing') ? `<div class="mu-sl sm"><label for="muSwing">Swing</label><div class="mu-slr"><input id="muSwing" type="range" min="0" max="100" value="${MU.swing}"></div></div>` : ''}
    ${hasItem('mx.s16') || hasItem('mx.bar2') ? `<div class="mu-opts">${hasItem('mx.s16') ? `<div class="mu-opt"><span class="mu-sh">Schritte</span>${muSeg([[8, '8'], [16, '16']], MU.sp, 'muSteps')}</div>` : ''}${hasItem('mx.bar2') ? `<div class="mu-opt"><span class="mu-sh">Takte</span>${muSeg([[1, '1'], [2, '2']], MU.bars, 'muBars')}</div>` : ''}</div>` : ''}
  </div>
  <div class="card mu-gridcard"><div id="muPagesBox">${muPagesHTML()}</div><div class="mu-grid" id="muGrid">${muGridHTML()}</div></div>
  <div class="mu-foot"><button class="btn mu-save" data-act="muSaveOpen"${has ? '' : ' disabled'}>${ico('save', 22)} Als Beat speichern</button><button class="btn sec" data-act="muClearAll"${has ? '' : ' disabled'}>${ico('trash', 20)} Leeren</button></div>
  <p class="mute small center mu-auto">Dein Muster wird automatisch gemerkt.</p>
  ${muLibHTML()}
  </div>`;
};
const muPlayInner = on => `<span class="mu-pi">${ico(on ? 'stop' : 'play', 30)}</span><span class="mu-pt">${on ? 'Stopp' : 'Play'}</span>`;
let muCols = null;
function muDrawGrid() {
  const g = $('#muGrid'); if (!g) return; g.innerHTML = muGridHTML(); muCols = null;
  const p = $('#muPagesBox'); if (p) p.innerHTML = muPagesHTML();
  if (ENG.playing && ENG.cur >= 0) muShowStep(ENG.cur, true);
}
function muPlayUI() {
  const b = $('#muPlay'), on = ENG.playing && ENG.proj === MU;
  if (b) { b.classList.toggle('on', on); b.innerHTML = muPlayInner(on); }
  if (view === 'musikSongs') render();
}
/* ---------- Abspielkopf ---------- */
function muBuildCols() {
  const root = $('#muGrid'); if (!root) return null; const cols = {};
  root.querySelectorAll('[data-s]').forEach(el => { (cols[el.dataset.s] = cols[el.dataset.s] || []).push(el); });
  return muCols = { root, cols, last: -1 };
}
function muClearHead() {
  if (muCols && muCols.last >= 0 && muCols.root.isConnected) (muCols.cols[muCols.last] || []).forEach(e => e.classList.remove('ph'));
  if (muCols) muCols.last = -1;
  document.querySelectorAll('.mu-pad.ph,.mu-hn.ph').forEach(e => e.classList.remove('ph'));
}
function muShowStep(s, force) {
  ENG.cur = s;
  if (view !== 'musik' || ENG.proj !== MU) return;
  const pg = Math.floor(s / muNV());
  if (pg !== MU.page && pg < muN() / muNV()) { MU.page = pg; muDrawGrid(); }
  if (!muCols || !muCols.root.isConnected || muCols.root !== $('#muGrid')) muBuildCols(); if (!muCols) return;
  if (muCols.last >= 0) (muCols.cols[muCols.last] || []).forEach(e => e.classList.remove('ph'));
  (muCols.cols[s] || []).forEach(e => e.classList.add('ph')); muCols.last = s;
}
function muPadDom(r, s) {
  const root = $('#muGrid'); if (!root) return;
  root.querySelectorAll(`.mu-pad[data-r="${r.k}"][data-s="${s}"]`).forEach(el => el.classList.toggle('on', muIsOn(r, s, +el.dataset.p)));
  const b = document.querySelector('.mu-save'), c = document.querySelector('[data-act="muClearAll"]'), h = muHasNotes();
  if (b) b.disabled = !h; if (c) c.disabled = !h;
}
/* ---------- Namens-Dialog ---------- */
function muCloseSheet() { const d = $('#muSheet'); if (d) d.remove(); }
function muNameSheet() {
  muCloseSheet(); const ex = MU.editId && muSongById(MU.editId), d = document.createElement('div'); d.className = 'mu-ov'; d.id = 'muSheet';
  d.innerHTML = `<div class="mu-sheet" role="dialog"><h3>Beat speichern</h3><input class="txt mu-name" id="muNameIn" maxlength="24" value="${esc(MU.name || muDefaultName())}" placeholder="Name deines Beats" autocomplete="off">
    <div class="row wrap" style="justify-content:center;margin-top:14px"><button class="btn sec" data-act="muCloseSheet">Abbrechen</button><button class="btn" data-act="muSaveDo">${ico('save', 20)} Speichern</button>${ex ? '<button class="btn sec" data-act="muSaveCopy">Als neuen Beat</button>' : ''}</div></div>`;
  d.addEventListener('click', e => { if (e.target === d) muCloseSheet(); });
  document.body.appendChild(d);
  const inp = d.querySelector('#muNameIn'); setTimeout(() => { try { inp.focus(); inp.select(); } catch (e) { } }, 30);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') d.querySelector('[data-act="muSaveDo"]').click(); else if (e.key === 'Escape') muCloseSheet(); });
}
/* ---------- Meine Beats ---------- */
function muMini(s) {
  const n = (s.sp === 16 ? 16 : 8) * (s.bars === 2 ? 2 : 1), step = 2.4; let r = '';
  (s.rows || []).forEach((tr, t) => { String(tr.steps || '').slice(0, n).split('').forEach((ch, i) => { if (ch !== '.') r += `<rect class="m${tr.k[0]}" x="${(i * step).toFixed(1)}" y="${(t * step).toFixed(1)}" width="2" height="2" rx=".5"/>`; }); });
  return `<svg class="mu-mini" viewBox="-1.5 -1.5 ${n * step + 1.2} ${Math.max(3, (s.rows || []).length) * step + 1.2}" preserveAspectRatio="none" aria-hidden="true">${r}</svg>`;
}
VIEWS.musikSongs = () => {
  setTimeout(muMount, 0);
  const list = S.songs.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const card = s => { const pl = ENG.playing && ENG.songId === s.id;
    return `<div class="card mu-song${pl ? ' playing' : ''}" data-id="${esc(s.id)}"><div class="mu-sc-h"><button class="mu-sp ${pl ? 'on' : ''}" data-act="muPlaySong" data-arg="${esc(s.id)}" aria-label="${pl ? 'Stopp' : 'Abspielen'}">${ico(pl ? 'stop' : 'play', 26)}</button>
      <div class="mu-sn"><b>${esc(s.name)}</b><span class="mute small">${esc(muSongText(s))}</span></div></div>
      ${muMini(s)}
      <div class="mu-sa"><button class="btn sm" data-act="muLoad" data-arg="${esc(s.id)}">${ico('pen', 18)} Bearbeiten</button>
      <button class="btn sec sm ic" data-act="muDel" data-arg="${esc(s.id)}" title="Löschen" aria-label="Löschen">${ico('trash', 18)}</button></div></div>`; };
  return topBar(ico('beat', 26) + ' Meine Beats', 'musik', `<button class="btn sm" data-act="muNew">${ico('plus', 18)} Neuer Beat</button>`) + `<div class="mu-songs">
    ${list.length ? `<div class="mu-sgrid">${list.map(card).join('')}</div>`
      : `<div class="card result center"><h3>Noch leer</h3><p class="mute">Baue in der Werkstatt einen Beat und tippe auf <b>Als Beat speichern</b>. Dann erscheint er hier.</p><button class="btn big" data-act="musik">${ico('music', 24)} Zur Werkstatt</button></div>`}</div>`;
};

/* =====================================================================
   AKTIONEN, EINGABE, REGISTRIERUNG
   ===================================================================== */
function muMount() {
  if (!MU_VIEWS.includes(view)) return;
  if (!ENG.watch) ENG.watch = setInterval(muWatch, 400);
  muCols = null; if (view === 'musik' && ENG.playing && ENG.proj === MU && ENG.cur >= 0) muShowStep(ENG.cur, true);
}
const MU_ACT = {
  muPlay: () => { if (ENG.playing && ENG.proj === MU) muStopEng(); else muStartEng(MU); },
  muSel: k => { MU.sel = k; const r = muRowOf(k), it = r && muInstOf(r); if (it && !ENG.playing) muPreview(r, 0); document.querySelectorAll('.mu-inst').forEach(b => b.classList.toggle('sel', b.dataset.arg === k)); },
  muSteps: n => { MU.sp = +n === 16 && hasItem('mx.s16') ? 16 : 8; MU.page = 0; muTouch(); render(); },
  muBars: n => { muSetBars(+n === 2 && hasItem('mx.bar2') ? 2 : 1); muTouch(); render(); },
  /* Klang einer Spur zuweisen: gewählte Spur, wenn sie passt, sonst die erste passende */
  muSound: id => {
    const it = CATALOG[id]; if (!it || !hasItem(id)) return;
    const cand = muRowsOn().filter(r => r.role === it.role), r = cand.find(x => x.k === MU.sel) || cand[0]; if (!r) return;
    MU.rows[r.k].inst = id; MU.sel = r.k; muTouch(); render(); muPreview(r, 0);
  },
  muScale: id => { if (!hasItem(id)) return; MU.scale = id; muClampScale(); muTouch(); render(); muPreview(muRowOf('m').on() ? muRowOf('m') : muRowOf('d0'), 2); },
  muKit: id => { if (!hasItem(id)) return; MU.kit = id; muTouch(); muKitChanged(); render(); muPreview(muRowOf('d0'), 0); },
  muClearAll: () => modal('Leeren?', 'Dein Muster wird leer. Gespeicherte Beats bleiben erhalten.', 'Ja, leeren', 'muClearAllYes', '', 'Zurück'),
  muClearAllYes: () => { closeModal(); MU_ROWS.forEach(r => MU.rows[r.k].steps.fill(muPitched(r) ? -1 : 0)); MU.editId = null; MU.name = ''; MU.dirty = false; muPersist(); render(); },
  muPage: n => { MU.page = +n; muDrawGrid(); },
  muSaveOpen: () => muNameSheet(),
  muSaveDo: () => muDoSave(false), muSaveCopy: () => muDoSave(true),
  muSongs: () => { muStopEng(); muPersist(); go('musikSongs'); },
  muNew: () => { muStopEng(); muReset(); muPersist(); go('musik'); },
  muPlaySong: id => { const s = muSongById(id); if (!s) return; if (ENG.playing && ENG.songId === id) muStopEng(); else muStartEng(muDecode(s), id); },
  muLoad: id => { if (MU.dirty && muHasNotes() && MU.editId !== id) modal('Beat laden?', 'Dein aktuelles Muster ist noch nicht gespeichert. Wenn du weitermachst, wird es ersetzt.', 'Laden', 'muLoadYes', id, 'Zurück'); else ACT.muLoadYes(id); },
  muLoadYes: id => { closeModal(); const s = muSongById(id); if (!s) return; muStopEng(); muApply(muDecode(s)); MU.name = s.name; MU.editId = s.id; muPersist(); go('musik'); },
  muDel: id => { const s = muSongById(id); if (s) modal('Beat löschen?', `„${esc(s.name)}“ wird für immer gelöscht.`, 'Ja, löschen', 'muDelYes', id, 'Behalten'); },
  muDelYes: id => { closeModal(); if (ENG.songId === id) muStopEng(); S.songs = S.songs.filter(x => x.id !== id); if (MU.editId === id) MU.editId = null; save(); render(); },
  muCloseSheet: () => muCloseSheet()
};
function muDoSave(asCopy) {
  const inp = $('#muNameIn');
  if (muSaveSong(inp ? inp.value : '', asCopy)) { muCloseSheet(); toast('💾', `Gespeichert: <b>${esc(MU.name)}</b>`); render(); }
}
function muToggleAt(r, s, p) {
  const on = !muIsOn(r, s, p); muSet(r, s, p, on); muPadDom(r, s); muTouch();
  if (on && (muPitched(r) || !ENG.playing)) muPreview(r, p);
}
/* ----- Pads: Antippen und Drüber-Wischen (Zeiger-Ereignisse; Klick nur für die Tastatur) ----- */
const muPtr = { id: null, el: null, r: '', down: false, paint: false, val: true, last: null, changed: false };
const muPadAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.classList && el.classList.contains('mu-pad') ? el : null; };
function muPaintOne(el) {
  if (el === muPtr.last) return; muPtr.last = el;
  const r = muRowOf(el.dataset.r), s = +el.dataset.s, p = +el.dataset.p;
  if (muIsOn(r, s, p) === muPtr.val) return;
  muSet(r, s, p, muPtr.val); muPadDom(r, s); muPtr.changed = true;
  if (muPtr.val && muPitched(r)) muPreview(r, p);
}
document.addEventListener('pointerdown', e => {
  if (view !== 'musik' || (e.button != null && e.button > 0)) return;
  const el = e.target.closest && e.target.closest('.mu-pad'); if (!el) return;
  try { el.releasePointerCapture(e.pointerId); } catch (x) { }
  const r = muRowOf(el.dataset.r);
  Object.assign(muPtr, { id: e.pointerId, el, r: el.dataset.r, down: true, paint: false, last: null, changed: false, val: !muIsOn(r, +el.dataset.s, +el.dataset.p) });
});
document.addEventListener('pointermove', e => {
  if (!muPtr.down || e.pointerId !== muPtr.id) return;
  const el = muPadAt(e.clientX, e.clientY); if (!el || el.dataset.r !== muPtr.r) return;
  if (!muPtr.paint) { if (el === muPtr.el) return; muPtr.paint = true; AC(); muPaintOne(muPtr.el); }
  muPaintOne(el);
});
document.addEventListener('pointerup', e => {
  if (!muPtr.down || e.pointerId !== muPtr.id) return; muPtr.down = false;
  if (muPtr.paint) { if (muPtr.changed) muTouch(); return; }
  const el = muPtr.el; if (el && el.isConnected) muToggleAt(muRowOf(el.dataset.r), +el.dataset.s, +el.dataset.p);
});
document.addEventListener('pointercancel', e => { if (e.pointerId === muPtr.id) { muPtr.down = false; if (muPtr.paint && muPtr.changed) muTouch(); } });
document.addEventListener('click', e => {
  if (view !== 'musik' || e.detail !== 0) return;
  const el = e.target.closest && e.target.closest('.mu-pad'); if (el) muToggleAt(muRowOf(el.dataset.r), +el.dataset.s, +el.dataset.p);
});
document.addEventListener('input', e => {
  const t = e.target; if (!t || view !== 'musik') return;
  if (t.id === 'muBpm') { MU.bpm = +t.value; $('#muBpmV').textContent = MU.bpm; muTouch(); }
  else if (t.id === 'muSwing') { MU.swing = +t.value; muTouch(); }
});
document.addEventListener('keydown', e => {
  if (view !== 'musik') return;
  if (e.key === 'Escape' && $('#muSheet')) { muCloseSheet(); return; }
  if (e.key === ' ' && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName || '') && !$('#muSheet') && !$('#modal')) { e.preventDefault(); MU_ACT.muPlay(); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) { muStopEng(); if (muPersistT) muPersist(); } });
window.addEventListener('pagehide', () => { muStopEng(true); if (muPersistT) muPersist(); });
let muLastNV = muNV();
window.addEventListener('resize', () => { if (view === 'musik' && muNV() !== muLastNV) { muLastNV = muNV(); MU.page = 0; muDrawGrid(); } });

registerFeature({
  id: 'musik', title: 'Musik-Werkstatt', icon: 'music', tint: 'sky', group: 'world', order: 60, creative: 'closed',
  sub: () => `${S.songs.length} Beats`, view: 'musik',
  views: { musik: VIEWS.musik, musikSongs: VIEWS.musikSongs },
  acts: Object.assign({ musik: () => go('musik') }, MU_ACT),
  check: muCheck, leave: muDispose
});
