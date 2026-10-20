/* =====================================================================
   GERÄTE ABGLEICHEN (Eltern-Bereich) – ohne Server, ohne Hochladen.
   (1) Datei zusammenführen: Sicherung vom anderen Gerät laden → beide Stände werden vereint (nicht ersetzt).
   (2) Direkt über WLAN: zwei QR-Codes scannen → WebRTC-Verbindung von Gerät zu Gerät (verschlüsselt, nur im
       eigenen Netz, kein STUN/TURN-Server) → beide Geräte haben danach denselben, vereinten Stand.

   Zusammenführen (3-Wege): Jeder Abgleich/jede Sicherung ist ein „Stand-Punkt“ (S.syncId, Verlauf S.syncHist).
   Eine Kopie jedes Stand-Punkts liegt in IndexedDB („base:<id>“, die letzten 6). Finden beide Geräte einen
   gemeinsamen Stand-Punkt, werden Zähler genau addiert: Münzen = hier + dort − gemeinsam (nichts doppelt, nichts weg).
   Ohne gemeinsamen Stand-Punkt (erster Abgleich): jeweils der höhere Wert, Besitz/Listen werden vereint.
   Vor jedem Zusammenführen wird der bisherige Stand zusätzlich aufgehoben (PREIMPORT_KEY).
   ===================================================================== */

/* ---------- Stand-Punkte ---------- */
const SY_MAXB = 6;
const syId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const syT = id => parseInt(String(id || '').slice(0, 8), 36) || 0;
const syHistOf = (...ls) => [...new Set([].concat(...ls.map(l => Array.isArray(l) ? l : [])))].sort((x, y) => syT(y) - syT(x)).slice(0, 16);
function syMark(st) { const id = syId(); st.syncId = id; st.syncHist = syHistOf([id], st.syncHist); return id; }
function syPutBase(id, json) {
  if (!id || !json) return Promise.resolve(false);
  return idbOpen().then(db => new Promise(res => {
    const tx = db.transaction('kv', 'readwrite'), st = tx.objectStore('kv');
    st.put(json, 'base:' + id);
    const q = st.get('bases');
    q.onsuccess = () => {
      const l = syHistOf([id], q.result || []);
      l.slice(SY_MAXB).forEach(d => st.delete('base:' + d));            // nur eigene Abgleich-Kopien, nie den Lernstand
      st.put(l.slice(0, SY_MAXB), 'bases');
    };
    tx.oncomplete = () => { db.close(); res(true); }; tx.onerror = () => { db.close(); res(false); };
  })).catch(() => false);
}
function syGetBase(id) {
  return idbOpen().then(db => new Promise(res => {
    const q = db.transaction('kv').objectStore('kv').get('base:' + id);
    q.onsuccess = () => { db.close(); res(q.result || null); }; q.onerror = () => { db.close(); res(null); };
  })).catch(() => null);
}
async function syFindBase(a, b) {
  const hb = new Set(b.syncHist || []);
  for (const id of (a.syncHist || []).filter(x => hb.has(x)).sort((x, y) => syT(y) - syT(x))) {
    const j = await syGetBase(id); if (j) { try { return JSON.parse(j); } catch (e) { } }
  }
  return null;
}

/* ---------- Zusammenführen ---------- */
/* Zähler (werden addiert, wenn ein gemeinsamer Stand bekannt ist) */
const SY_SUM = /^(coins|life|stars|starsLife|flames|flamesLife|chests)$|^stats\.[^.]+$|^daily\.(n|sec|shopSec)$|^daily\.cr\.(used|left|grants)$|^topics\.[^.]+\.(q|c)$|^log\.[^.]+\.(n|c)$|^world\.(spent|milesSpent)$|^licht\.(lp|lpLife)$|^punkte\.stars$|\.(vnMk|vnMkT)$/;
const syJ = v => JSON.stringify(v, (k, x) => isObj(x) ? Object.keys(x).sort().reduce((o, q) => { o[q] = x[q]; return o; }, {}) : x);
const syEq = (x, y) => x === y || (typeof x === 'object' && typeof y === 'object' && x && y && syJ(x) === syJ(y));
const syProg = d => (d.i || 0) * 1000 + (Array.isArray(d.res) ? d.res.filter(r => r != null).length : 0);
function syM(a, b, o, p, C) {
  if (syEq(a, b)) return a;
  if (o !== undefined) { if (syEq(a, o)) return b; if (syEq(b, o)) return a; }
  if (a === undefined || a === null) return b;
  if (b === undefined || b === null) return a;
  if (p === 'daily' && isObj(a) && isObj(b)) {                      // anderer Tag: der neuere Tag gilt
    if (a.d !== b.d) return String(a.d || '') > String(b.d || '') ? a : b;
    if (C.base && !(isObj(o) && o.d === a.d)) o = Object.assign(DEF().daily, { d: a.d });   // gemeinsamer Stand war ein anderer Tag → heute bei 0 begonnen
  }
  if (/^decks\.[^.]+$/.test(p) && isObj(a) && isObj(b)) return syProg(b) > syProg(a) ? b : a;   // eine Übung nie mischen
  if (typeof a === 'number' && typeof b === 'number') {
    if (SY_SUM.test(p)) {
      const ob = typeof o === 'number' ? o : (C.base ? 0 : null);
      if (ob !== null) return Math.max(0, a + b - ob);
    }
    return Math.max(a, b);
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const oa = Array.isArray(o) ? o : [];
    const nums = x => x.every(v => typeof v === 'number');
    if (a.length === b.length && nums(a) && nums(b) && (!o || (oa.length === a.length && nums(oa)))) return a.map((v, i) => Math.max(v, b[i]));
    const ids = x => x.length > 0 && x.every(v => isObj(v) && v.id != null);
    if (ids(a) && ids(b)) {
      const om = new Map(oa.filter(isObj).map(v => [String(v.id), v])), bm = new Map(b.map(v => [String(v.id), v])), seen = new Set(), out = [];
      a.forEach(v => { const k = String(v.id); seen.add(k);
        if (bm.has(k)) out.push(syM(v, bm.get(k), om.get(k), p + '[]', C));
        else if (!(om.has(k) && syEq(v, om.get(k)))) out.push(v); });          // auf dem anderen Gerät gelöscht und hier unverändert → weg
      b.forEach(v => { const k = String(v.id); if (!seen.has(k) && !(om.has(k) && syEq(v, om.get(k)))) out.push(v); });
      return out;
    }
    const ok = new Set(oa.map(syJ)), ak = new Set(a.map(syJ)), bk = new Set(b.map(syJ));
    const out = a.filter(v => { const k = syJ(v); return !(ok.has(k) && !bk.has(k)); });
    b.forEach(v => { const k = syJ(v); if (!ak.has(k) && !ok.has(k)) { out.push(v); ak.add(k); } });
    return out;
  }
  if (isObj(a) && isObj(b)) {
    const out = {};
    new Set([...Object.keys(a), ...Object.keys(b)]).forEach(k => {
      const v = syM(a[k], b[k], isObj(o) ? o[k] : undefined, p ? p + '.' + k : k, C);
      if (v !== undefined) out[k] = v;
    });
    return out;
  }
  return C.newerB ? b : a;
}
/* a = hier, b = anderes Gerät, base = gemeinsamer Stand (oder null). Liefert einen neuen Stand (a/b bleiben unberührt). */
function syMerge(a, b, base) {
  a = JSON.parse(JSON.stringify(a)); b = JSON.parse(JSON.stringify(b));
  const o = base ? JSON.parse(JSON.stringify(base)) : undefined;
  const hist = syHistOf(a.syncHist, b.syncHist);
  ['syncId', 'syncHist'].forEach(k => { delete a[k]; delete b[k]; if (o) delete o[k]; });
  const r = syM(a, b, o, '', { base: !!o, newerB: (b.saved || 0) > (a.saved || 0) });
  r.syncHist = hist; syMark(r); r.saved = Date.now();
  return mergeState(r);
}
function syApply(m) {
  try { localStorage.setItem(PREIMPORT_KEY, JSON.stringify(S)); } catch (e) { }
  S = mergeState(m); touchDay(); save();
  try { checkUnlocks(); } catch (e) { }
  syPutBase(S.syncId, JSON.stringify(S));
}

/* ---------- (1) Datei zusammenführen ---------- */
async function syFileMerge(txt) {
  let o;
  try { o = JSON.parse(txt); if (!o || typeof o.coins !== 'number') throw 0; } catch (e) { toast('⚠️', PT('Die Datei konnte nicht gelesen werden.', 'The file could not be read.')); return; }
  o = mergeState(o);
  const base = await syFindBase(S, o), m = syMerge(S, o, base);
  SY.pend = { m, other: o };
  modal(PT('Mit diesem Gerät zusammenführen?', 'Merge into this device?'),
    `${sumTable([PT('Hier', 'Here'), PT('Datei', 'File'), PT('Zusammen', 'Merged')], [saveSummary(S), saveSummary(o), saveSummary(m)])}
    <p class="small mute">${base ? PT('Gemeinsamer Stand gefunden ✓ – alles wird genau zusammengezählt.', 'Common state found ✓ – everything is added up exactly.') : PT('Erster Abgleich: Es wird jeweils der höhere Wert genommen, Besitz und Listen werden vereint.', 'First sync: the higher value is kept, items and lists are combined.')} ${PT('Der jetzige Stand wird vorher zusätzlich aufgehoben.', 'The current state is kept as an extra copy first.')}</p>`,
    PT('Ja, zusammenführen', 'Yes, merge'), 'syFileYes', '', PT('Nein', 'No'));
}

/* ---------- (2) Direkt über WLAN (WebRTC + QR) ---------- */
const SY = { pc: null, dc: null, role: '', stream: null, scanning: false, step: '', msg: '', code: '', pend: null, buf: '', before: null, other: null, timer: 0 };
/* Kompakter Code statt langer SDP (passt in einen gut lesbaren QR-Code) */
function syPack(desc) {
  const s = desc.sdp, g = re => (s.match(re) || [])[1] || '';
  const fp = g(/a=fingerprint:sha-256 (\S+)/).replace(/:/g, ''), setup = g(/a=setup:(\S+)/);
  const cands = [...s.matchAll(/a=candidate:\S+ 1 udp \d+ (\S+) (\d+) typ host/gi)].map(m => m[1] + ',' + m[2]);
  return ['DZ1', desc.type === 'offer' ? 'o' : 'a', { actpass: 'x', active: 'c', passive: 'p' }[setup] || 'x', g(/a=ice-ufrag:(\S+)/), g(/a=ice-pwd:(\S+)/), fp, ...[...new Set(cands)].slice(0, 6)].join('~');
}
function syUnpack(str) {
  const p = String(str || '').trim().split('~');
  if (p[0] !== 'DZ1' || p.length < 7 || !/^[0-9A-F]{64}$/i.test(p[5])) throw new Error('code');
  const cands = p.slice(6).map((c, i) => { const [ip, port] = c.split(','); return `a=candidate:${i + 1} 1 udp ${2122260223 - i} ${ip} ${port} typ host generation 0`; });
  const sdp = ['v=0', 'o=- ' + Date.now() + ' 2 IN IP4 127.0.0.1', 's=-', 't=0 0', 'a=group:BUNDLE 0', 'a=msid-semantic: WMS',
    'm=application 9 UDP/DTLS/SCTP webrtc-datachannel', 'c=IN IP4 0.0.0.0', 'a=ice-ufrag:' + p[3], 'a=ice-pwd:' + p[4], 'a=ice-options:trickle',
    'a=fingerprint:sha-256 ' + p[5].toUpperCase().match(/../g).join(':'), 'a=setup:' + ({ x: 'actpass', c: 'active', p: 'passive' }[p[2]] || 'actpass'),
    'a=mid:0', 'a=sctp-port:5000', 'a=max-message-size:262144', ...cands, 'a=end-of-candidates'].join('\r\n') + '\r\n';
  return { type: p[1] === 'o' ? 'offer' : 'answer', sdp };
}
function syQrSvg(text) {
  const q = qrcode(0, 'M'); q.addData(text, 'Byte'); q.make();
  const n = q.getModuleCount(), z = 4; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + z} ${r + z}h1v1h-1z`;
  return `<svg class="sy-qr" viewBox="0 0 ${n + 2 * z} ${n + 2 * z}" shape-rendering="crispEdges" role="img" aria-label="QR-Code"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
function syGather(pc) {
  return new Promise(res => {
    if (pc.iceGatheringState === 'complete') return res();
    const t = setTimeout(res, 3000);
    pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } });
  });
}
/* Kamera: wird schon vor dem ersten Code geöffnet – dann gibt Chrome die echte WLAN-Adresse frei (sonst nur „….local“) */
async function syCam() {
  if (SY.stream) return true;
  try { SY.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); return true; }
  catch (e) { return false; }
}
function syCamStop() { try { if (SY.stream) SY.stream.getTracks().forEach(t => t.stop()); } catch (e) { } SY.stream = null; SY.scanning = false; }
function syScan(onCode) {
  const v = $('#syVid'); if (!v || !SY.stream) return;
  v.srcObject = SY.stream; v.play().catch(() => { });
  let bd = null;
  try { if ('BarcodeDetector' in window) bd = new BarcodeDetector({ formats: ['qr_code'] }); } catch (e) { bd = null; }
  const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
  SY.scanning = true;
  const tick = async () => {
    if (!SY.scanning || !document.body.contains(v)) return;
    let txt = null;
    try {
      if (v.readyState >= 2 && v.videoWidth) {
        if (bd) { try { const r = await bd.detect(v); if (r && r[0]) txt = r[0].rawValue; } catch (e) { bd = null; } }
        else if (typeof jsQR === 'function') {
          const k = Math.min(1, 1000 / Math.max(v.videoWidth, v.videoHeight)); cv.width = v.videoWidth * k | 0; cv.height = v.videoHeight * k | 0;
          cx.drawImage(v, 0, 0, cv.width, cv.height); const r = jsQR(cx.getImageData(0, 0, cv.width, cv.height).data, cv.width, cv.height, { inversionAttempts: 'dontInvert' }); if (r) txt = r.data;
        }
      }
    } catch (e) { }
    if (txt && txt.indexOf('DZ1~') === 0) { SY.scanning = false; onCode(txt); return; }
    setTimeout(tick, 160);
  };
  tick();
}
function syClose() {
  clearTimeout(SY.timer); syCamStop();
  try { if (SY.dc) SY.dc.close(); } catch (e) { } try { if (SY.pc) SY.pc.close(); } catch (e) { }
  Object.assign(SY, { pc: null, dc: null, role: '', step: '', msg: '', code: '', buf: '', pend: null, before: null, other: null });
  closeModal();
}
function syNewPc() {
  const pc = new RTCPeerConnection({ iceServers: [] });                // nur das eigene Netz – kein fremder Server
  pc.addEventListener('connectionstatechange', () => { if (pc.connectionState === 'failed' && SY.step !== 'done') syFail(); });
  return pc;
}
function syWire(dc) {
  SY.dc = dc;
  dc.onopen = () => { clearTimeout(SY.timer); syCamStop(); SY.step = 'busy'; SY.msg = PT('Verbunden ✓ – Daten werden abgeglichen …', 'Connected ✓ – syncing data …'); syDraw(); if (SY.role === 'b') sySend({ t: 'state', s: S, adm: ADMIN }); };
  dc.onmessage = e => {
    const d = String(e.data);
    if (d[0] === 'C') { SY.buf += d.slice(1); return; }
    if (d[0] !== 'Z') return;
    let msg = null; try { msg = JSON.parse(SY.buf + d.slice(1)); } catch (x) { } SY.buf = '';
    if (msg) syOnMsg(msg);
  };
}
function sySend(obj) {
  const j = JSON.stringify(obj), N = 16000;
  for (let i = 0; i < j.length; i += N) SY.dc.send((i + N >= j.length ? 'Z' : 'C') + j.slice(i, i + N));
  if (!j.length) SY.dc.send('Z');
}
async function syOnMsg(msg) {
  if (msg.t === 'state' && SY.role === 'a') {
    if (!!msg.adm !== !!ADMIN) { sySend({ t: 'err', e: 'adm' }); return syFail(PT('Bitte auf beiden Geräten denselben Nutzer wählen (Kind oder Admin).', 'Please choose the same user (child or admin) on both devices.')); }
    const o = mergeState(msg.s), base = await syFindBase(S, o), m = syMerge(S, o, base);
    SY.pend = m; SY.other = o; SY.before = saveSummary(S); SY.exact = !!base;
    sySend({ t: 'merged', s: m, exact: !!base });
  } else if (msg.t === 'merged' && SY.role === 'b') {
    SY.before = saveSummary(S); SY.exact = !!msg.exact;
    syApply(msg.s); sySend({ t: 'ok' }); syDone();
  } else if (msg.t === 'ok' && SY.role === 'a' && SY.pend) {
    syApply(SY.pend); SY.pend = null; syDone();
  } else if (msg.t === 'err') {
    syFail(msg.e === 'adm' ? PT('Bitte auf beiden Geräten denselben Nutzer wählen (Kind oder Admin).', 'Please choose the same user (child or admin) on both devices.') : '');
  }
}
function syDone() {
  SY.step = 'done'; SY.msg = ''; syCamStop(); syDraw(); render();
  setTimeout(() => { try { if (SY.pc) SY.pc.close(); } catch (e) { } }, 1500);
}
function syFail(txt) {
  syCamStop(); SY.step = 'fail';
  SY.msg = txt || PT('Keine Verbindung. Sind beide Geräte im selben WLAN? Gäste-/Hotel-WLAN blockiert oft Verbindungen zwischen Geräten – dann ein Handy-Hotspot nutzen oder „Datei zusammenführen“.',
    'No connection. Are both devices on the same Wi-Fi? Guest/hotel Wi-Fi often blocks device-to-device connections – use a phone hotspot or “Merge file” instead.');
  syDraw();
}
async function syStartA() {
  SY.role = 'a'; SY.step = 'prep'; syDraw();
  await syCam();
  const pc = SY.pc = syNewPc(); syWire(pc.createDataChannel('dz'));
  await pc.setLocalDescription(await pc.createOffer()); await syGather(pc);
  SY.code = syPack(pc.localDescription); SY.step = 'showOffer'; syDraw();
}
function syStartB() { SY.role = 'b'; SY.step = 'scanOffer'; syDraw(); syCam().then(() => syDraw()); }
async function syGotOffer(code) {
  let desc; try { desc = syUnpack(code); if (desc.type !== 'offer') throw 0; } catch (e) { toast('⚠️', PT('Das ist nicht der Start-Code.', 'That is not the start code.')); if (SY.stream) syScan(syGotOffer); return; }
  SY.step = 'prep'; syDraw();
  const pc = SY.pc = syNewPc(); pc.ondatachannel = e => syWire(e.channel);
  await pc.setRemoteDescription(desc); await pc.setLocalDescription(await pc.createAnswer()); await syGather(pc);
  SY.code = syPack(pc.localDescription); SY.step = 'showAnswer'; syDraw();
  SY.timer = setTimeout(() => { if (SY.step === 'showAnswer') syFail(); }, 90000);
}
async function syGotAnswer(code) {
  let desc; try { desc = syUnpack(code); if (desc.type !== 'answer') throw 0; } catch (e) { toast('⚠️', PT('Das ist nicht der Antwort-Code.', 'That is not the reply code.')); if (SY.stream) syScan(syGotAnswer); return; }
  SY.step = 'connecting'; SY.msg = PT('Verbinde …', 'Connecting …'); syDraw();
  try { await SY.pc.setRemoteDescription(desc); } catch (e) { return syFail(); }
  SY.timer = setTimeout(() => { if (SY.step === 'connecting') syFail(); }, 20000);
}
function syCodeBox(code) {
  return `<details class="sy-txt"><summary>${PT('Kein Scannen möglich? Code als Text', 'Can’t scan? Code as text')}</summary><textarea class="txt" readonly rows="3" id="syOut">${esc(code)}</textarea><button class="btn sm sec" data-act="syCopy">${PT('Kopieren', 'Copy')}</button></details>`;
}
function syScanBox(next) {
  return `${SY.stream ? `<video id="syVid" class="sy-vid" playsinline muted></video>` : `<p class="small">${PT('Die Kamera ist nicht verfügbar. Bitte den Code als Text einfügen:', 'Camera not available. Please paste the code as text:')}</p>`}
  <details class="sy-txt" ${SY.stream ? '' : 'open'}><summary>${PT('Code als Text einfügen', 'Paste code as text')}</summary><textarea class="txt" rows="3" id="syIn" aria-label="Code"></textarea><button class="btn sm" data-act="syPaste" data-arg="${next}">OK</button></details>`;
}
function syDraw() {
  closeModal();
  if (!SY.step) return;
  const m = document.createElement('div'); m.className = 'modal sy-modal'; m.id = 'modal';
  const steps = (n) => `<div class="sy-steps">${[1, 2, 3].map(i => `<i class="${i < n ? 'done' : i === n ? 'cur' : ''}">${i}</i>`).join('')}</div>`;
  let b = '', btns = `<button class="btn sec" data-act="syCancel">${SY.step === 'done' ? 'OK' : PT('Abbrechen', 'Cancel')}</button>`;
  if (SY.step === 'start') {
    b = `<p>${PT('Beide Geräte ins <b>selbe WLAN</b> (oder Handy-Hotspot). Die Daten gehen direkt von Gerät zu Gerät – nichts wird hochgeladen.', 'Put both devices on the <b>same Wi-Fi</b> (or a phone hotspot). Data goes directly from device to device – nothing is uploaded.')}</p>
    <div class="sy-pick"><button class="btn big" data-act="syA">${PT('① Hier starten', '① Start here')}<br><small>${PT('zeigt einen Code', 'shows a code')}</small></button>
    <button class="btn big sec" data-act="syB">${PT('② Code scannen', '② Scan code')}<br><small>${PT('auf dem anderen Gerät', 'on the other device')}</small></button></div>`;
  } else if (SY.step === 'prep') {
    b = `<p class="sy-wait">⏳ ${PT('Einen Moment …', 'One moment …')}</p>`;
  } else if (SY.step === 'showOffer') {
    b = `${steps(1)}<p>${PT('Auf dem <b>anderen Gerät</b>: Eltern → Abgleichen → „② Code scannen“ und diesen Code scannen.', 'On the <b>other device</b>: Parents → Sync → “② Scan code” and scan this code.')}</p>${syQrSvg(SY.code)}${syCodeBox(SY.code)}`;
    btns += `<button class="btn" data-act="syScanAns">${PT('Weiter: Antwort scannen', 'Next: scan reply')}</button>`;
  } else if (SY.step === 'scanOffer') {
    b = `${steps(1)}<p>${PT('Den Code auf dem ersten Gerät scannen.', 'Scan the code on the first device.')}</p>${syScanBox('offer')}`;
  } else if (SY.step === 'showAnswer') {
    b = `${steps(2)}<p>${PT('Jetzt auf dem <b>ersten Gerät</b> „Weiter: Antwort scannen“ tippen und diesen Code scannen.', 'Now tap “Next: scan reply” on the <b>first device</b> and scan this code.')}</p>${syQrSvg(SY.code)}${syCodeBox(SY.code)}`;
  } else if (SY.step === 'scanAnswer') {
    b = `${steps(2)}<p>${PT('Den Antwort-Code auf dem anderen Gerät scannen.', 'Scan the reply code on the other device.')}</p>${syScanBox('answer')}`;
  } else if (SY.step === 'connecting' || SY.step === 'busy') {
    b = `${steps(3)}<p class="sy-wait">⏳ ${SY.msg}</p>`;
  } else if (SY.step === 'done') {
    b = `${steps(4)}<p><b>${PT('Abgleich fertig ✓ Beide Geräte haben jetzt denselben Stand.', 'Sync done ✓ Both devices now have the same progress.')}</b></p>${SY.before ? sumTable([PT('Vorher', 'Before'), PT('Jetzt', 'Now')], [SY.before, saveSummary(S)]) : ''}
    <p class="small mute">${SY.exact ? PT('Gemeinsamer Stand gefunden – genau zusammengezählt.', 'Common state found – added up exactly.') : PT('Erster Abgleich: jeweils der höhere Wert, Besitz und Listen vereint. Ab jetzt wird genau zusammengezählt.', 'First sync: higher value kept, items and lists combined. From now on everything is added up exactly.')}</p>`;
  } else if (SY.step === 'fail') {
    b = `<p>⚠️ ${SY.msg}</p>`;
    btns += `<button class="btn" data-act="syRetry">${PT('Nochmal', 'Try again')}</button>`;
  }
  m.innerHTML = `<div class="card"><h2>${PT('Geräte abgleichen', 'Sync devices')}</h2>${b}<div class="row wrap" style="justify-content:center;margin-top:14px">${btns}</div></div>`;
  document.body.appendChild(m);
  if (SY.step === 'scanAnswer' && SY.stream) syScan(syGotAnswer);
  if (SY.step === 'scanOffer' && SY.stream) syScan(syGotOffer);
}

Object.assign(ACT, {
  syOpen: () => {
    if (!window.RTCPeerConnection) return modal(PT('Geräte abgleichen', 'Sync devices'), PT('Dieser Browser kann keine direkte Verbindung. Bitte „Datei zusammenführen“ nutzen.', 'This browser cannot connect directly. Please use “Merge file”.'));
    syClose(); SY.step = 'start'; syDraw();
  },
  syA: () => { syStartA().catch(() => syFail()); },
  syB: () => syStartB(),
  syScanAns: () => { SY.step = 'scanAnswer'; if (SY.stream) syDraw(); else syCam().then(() => syDraw()); },
  syPaste: kind => { const v = ($('#syIn') || {}).value || ''; SY.scanning = false; (kind === 'offer' ? syGotOffer : syGotAnswer)(v.trim()); },
  syCopy: () => { const t = $('#syOut'); if (!t) return; t.select(); try { navigator.clipboard.writeText(t.value).then(() => toast('📋', PT('Kopiert', 'Copied'))); } catch (e) { try { document.execCommand('copy'); } catch (x) { } } },
  syCancel: () => syClose(),
  syRetry: () => { syClose(); SY.step = 'start'; syDraw(); },
  syFileYes: () => { const p = SY.pend; SY.pend = null; closeModal(); if (!p) return; const before = saveSummary(S); syApply(p.m); go('home', { say: '' });
    modal(PT('Zusammengeführt ✓', 'Merged ✓'), sumTable([PT('Vorher', 'Before'), PT('Jetzt', 'Now')], [before, saveSummary(S)]) + `<p class="small mute">${PT('Tipp: Jetzt hier „Backup speichern“ und die Datei auf dem anderen Gerät ebenfalls zusammenführen – dann haben beide denselben Stand.', 'Tip: now “Save backup” here and merge that file on the other device too – then both have the same progress.')}</p>`, '', '', '', 'OK'); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'mrgFile' && t.files && t.files[0]) { const r = new FileReader(); r.onload = () => syFileMerge(r.result); r.readAsText(t.files[0]); t.value = ''; }
});
window.__sync = { syMerge, syPack, syUnpack, syFindBase, syPutBase, SY };
