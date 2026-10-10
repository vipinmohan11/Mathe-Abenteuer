/* =====================================================================
   NOTIZBUCH · „Zettel-Wand“ als schwebende Blase auf JEDER Seite (kein Ordner mehr). Antippen öffnet ein Fenster mit allen Zetteln und Listen.
   Zwei Arten, genau eine pro Eintrag beim Anlegen gewählt:
   - Zettel: kurzer Text (höchstens 140 Zeichen) + genau ein Stichwort (Hilfe/Erledigen/Fragen/Merken/Meine Ideen)
   - Liste: Titel + Häkchen-Punkte (höchstens 40 Zeichen je Punkt); Häkchen setzen streicht durch und schiebt nach unten
   Alles hängt durchgehend scrollbar an einer Wand (keine „Ältere Zettel“-Schublade mehr).
   Zustand: S.notes = [{ id, type:'zettel', t, tag, color, ts, ed? } | { id, type:'liste', title, items:[{id,t,done}], color, ts, ed? }]
   Alte Zettel ({id,t,ts} ohne type/tag/color) werden beim Laden sicher migriert: type wird „zettel“, tag bleibt leer, eine Farbe wird vergeben – nichts geht verloren.
   Farben: gelb, mint, himmelblau, rosa, pfirsich, flieder – hier ist Rosa ausdrücklich erlaubt (Ausnahme von der sonstigen Regel).
   ===================================================================== */
const NOTE_MAX = 140, NOTE_ITEM_MAX = 40, NOTE_LIST_MAX = 30, NOTE_CAP = 200;
const NOTE_COLORS = ['y', 'm', 's', 'p', 'o', 'l'];
const NOTE_TAGS = [
  { id: 'help', label: 'Hilfe', ic: '🆘' },
  { id: 'do', label: 'Erledigen', ic: '✅' },
  { id: 'ask', label: 'Fragen', ic: '❓' },
  { id: 'remember', label: 'Merken', ic: '📌' },
  { id: 'idea', label: 'Meine Ideen', ic: '💡' }
];
DZ_ART.notiz = '<rect x="9" y="9" width="30" height="30" rx="3" fill="#f1e4b6" stroke="#52676c" stroke-width="2" transform="rotate(-6 24 24)"/><path d="M15 19h16M15 25h16M15 31h9" stroke="#8a8f7a" stroke-width="2" stroke-linecap="round" transform="rotate(-6 24 24)"/><rect x="33" y="22" width="22" height="22" rx="3" fill="#cfe9d6" stroke="#52676c" stroke-width="2" transform="rotate(7 44 33)"/><path d="M38 31h12M38 37h8" stroke="#6f9871" stroke-width="2" stroke-linecap="round" transform="rotate(7 44 33)"/><circle cx="24" cy="9" r="3" fill="#e0a823" stroke="#52676c" stroke-width="1.5"/>';
const noteTag = id => NOTE_TAGS.find(t => t.id === id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const noteLen = t => Array.from(t || '').length;
const noteClip = t => Array.from(String(t || '').replace(/\s+/g, ' ')).slice(0, NOTE_MAX).join('');
const noteDate = ts => new Date(ts).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
function noteNorm(n) {
  if (!n || typeof n !== 'object') return null;
  n.id = +n.id || Date.now(); n.ts = +n.ts || Date.now();
  if (!NOTE_COLORS.includes(n.color)) n.color = NOTE_COLORS[Math.abs(n.id) % NOTE_COLORS.length];
  if (n.type === 'liste') {
    n.title = String(n.title || 'Liste').slice(0, 40);
    n.items = (Array.isArray(n.items) ? n.items : []).slice(0, NOTE_LIST_MAX).map(it => ({ id: String((it && it.id) || uid()), t: String((it && it.t) || '').slice(0, NOTE_ITEM_MAX), done: !!(it && it.done) }));
  } else {
    n.type = 'zettel'; n.t = noteClip(n.t || ''); n.tag = NOTE_TAGS.some(x => x.id === n.tag) ? n.tag : null;
  }
  return n;
}
function noteList() { if (!Array.isArray(S.notes)) S.notes = []; S.notes = S.notes.map(noteNorm).filter(Boolean); return S.notes; }
const noteSub = () => { const n = noteList().length; return n ? `${n} ${n === 1 ? 'Eintrag' : 'Einträge'}` : 'Schreib etwas auf'; };
const noteRand = () => NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
const noteRot = id => ((id || 0) % 5 - 2) * 0.9;

/* ---------- Zeichnen: eine Karte an der Wand ---------- */
function noteCard(n) {
  if (n.type === 'liste') {
    const open = n.items.filter(it => !it.done), done = n.items.filter(it => it.done), ordered = [...open, ...done];
    return `<div class="nz-note nz-${n.color} nz-liste" style="--r:${noteRot(n.id)}deg"><span class="nz-pin"></span>
      <button class="nz-cardhead" data-act="noteEdit" data-arg="${n.id}" aria-label="Liste bearbeiten: ${esc(n.title)}"><span class="nz-listicon">${ico('check', 16)}</span><b>${esc(n.title)}</b></button>
      <ul class="nz-items">${ordered.length ? ordered.map(it => `<li class="${it.done ? 'done' : ''}"><button class="nz-chk" data-act="noteItemToggle" data-arg="${n.id}:${it.id}" aria-pressed="${it.done}" aria-label="${esc(it.t)}${it.done ? ', erledigt' : ''}"><span class="nz-box">${it.done ? ico('check', 13) : ''}</span><span>${esc(it.t)}</span></button></li>`).join('') : '<li class="small mute">Noch keine Punkte</li>'}</ul>
      <small>${noteDate(n.ts)}</small></div>`;
  }
  const tag = noteTag(n.tag);
  return `<button class="nz-note nz-${n.color}" style="--r:${noteRot(n.id)}deg" data-act="noteEdit" data-arg="${n.id}" aria-label="Zettel vom ${noteDate(n.ts)} bearbeiten: ${esc(n.t)}"><span class="nz-pin"></span>${tag ? `<span class="nz-chip">${tag.ic} ${tag.label}</span>` : ''}<span class="nz-t">${esc(n.t)}</span><small>${noteDate(n.ts)}</small></button>`;
}

/* ---------- Zeichnen: Neu/Ändern-Feld ---------- */
function noteTypeSeg() {
  const type = UI.noteType || 'zettel', opt = (id, name) => `<button role="radio" aria-checked="${type === id}" data-act="noteType" data-arg="${id}" class="nz-opt${type === id ? ' sel' : ''}">${type === id ? ico('check', 14) : ''}${name}</button>`;
  return `<div class="nz-type" role="radiogroup" aria-label="Was möchtest du anlegen? (genau eins)">${opt('zettel', 'Zettel')}${opt('liste', 'Liste')}</div>`;
}
function noteZettelEditor(edit) {
  const draft = UI.noteDraft != null ? UI.noteDraft : '';
  return `<section class="dz-panel nz-edit"><h2>${edit ? 'Zettel ändern' : 'Neuer Zettel'}</h2>${edit ? '' : noteTypeSeg()}
    <div class="nz-tagrow" role="group" aria-label="Stichwort, genau eins">${NOTE_TAGS.map(t => `<button class="nz-tag${UI.noteTag === t.id ? ' on' : ''}" data-act="noteTagPick" data-arg="${t.id}" aria-pressed="${UI.noteTag === t.id}">${t.ic} ${t.label}</button>`).join('')}</div>
    <label class="sr-only" for="noteIn">Dein Zettel, höchstens ${NOTE_MAX} Zeichen</label>
    <textarea id="noteIn" class="txt" rows="3" maxlength="${NOTE_MAX * 2}" placeholder="Schreib hier etwas auf …" autocomplete="off">${esc(draft)}</textarea>
    <div class="nz-row"><span class="nz-cnt" id="noteCnt" aria-live="polite">${noteLen(draft)} / ${NOTE_MAX}</span>
      <span class="nz-btns"><button class="btn sec" data-act="noteCancel">Abbrechen</button>${edit ? '<button class="btn sec" data-act="noteDel">Zettel löschen</button>' : ''}<button class="btn" data-act="noteSave">${edit ? 'Änderung speichern' : 'Zettel anheften'}</button></span></div>
  </section>`;
}
function noteListEditor(edit) {
  const title = UI.noteTitle || '', items = Array.isArray(UI.noteItems) ? UI.noteItems : [];
  return `<section class="dz-panel nz-edit"><h2>${edit ? 'Liste ändern' : 'Neue Liste'}</h2>${edit ? '' : noteTypeSeg()}
    <label class="sr-only" for="noteTitleIn">Titel der Liste</label>
    <input id="noteTitleIn" class="txt" maxlength="40" placeholder="Titel der Liste …" autocomplete="off" value="${esc(title)}">
    <ul class="nz-draft-items">${items.map((it, i) => `<li><span>${esc(it.t)}</span><button class="nz-rm" data-act="noteItemDel" data-arg="${i}" aria-label="„${esc(it.t)}“ entfernen">${ico('trash', 16)}</button></li>`).join('')}</ul>
    ${items.length < NOTE_LIST_MAX ? `<div class="nz-additem"><label class="sr-only" for="noteItemIn">Neuer Punkt, höchstens ${NOTE_ITEM_MAX} Zeichen</label><input id="noteItemIn" class="txt" maxlength="${NOTE_ITEM_MAX}" placeholder="Neuer Punkt …" autocomplete="off"><button class="btn sec" data-act="noteItemAdd">${ico('plus', 18)} Hinzufügen</button></div>` : '<p class="small mute">Die Liste ist voll.</p>'}
    <div class="nz-row"><span></span><span class="nz-btns"><button class="btn sec" data-act="noteCancel">Abbrechen</button>${edit ? '<button class="btn sec" data-act="noteDel">Liste löschen</button>' : ''}<button class="btn" data-act="noteSave">${edit ? 'Änderung speichern' : 'Liste anlegen'}</button></span></div>
  </section>`;
}
const noteEditPanel = () => UI.noteOpen ? (UI.noteType === 'liste' ? noteListEditor : noteZettelEditor)(UI.noteEdit != null) : '';       // Editor nur nach „Neu“ (oder beim Ändern einer Karte)

/* ---------- Fenster (Pop-up) mit allen Zetteln und Listen ---------- */
function nzBody() {
  const L = noteList(), sorted = L.slice().sort((a, b) => b.ts - a.ts || b.id - a.id);
  if (UI.noteOpen) return noteEditPanel();
  return `<div class="nz-head2"><p class="nz-lead">${L.length ? `${L.length} ${L.length === 1 ? 'Eintrag' : 'Einträge'} an deiner Wand` : 'Noch hängt nichts an der Wand.'}</p><button class="btn nz-new" data-act="noteNew" aria-label="Neuen Zettel oder neue Liste anlegen">${ico('plus', 18)} Neu</button></div>` +
    (sorted.length ? `<div class="nz-wall">${sorted.map(noteCard).join('')}</div>` : '<p class="small mute" style="text-align:center;margin:18px 0">Tippe auf „Neu“, um einen Zettel oder eine Liste zu schreiben.</p>');
}
function nzRender() {
  let ov = document.getElementById('nzOv');
  if (!UI.nzOpen) { if (ov) ov.remove(); nzBubble(); return; }
  const old = ov && ov.querySelector('.nz-body'), st = old ? old.scrollTop : 0;
  if (!ov) { ov = document.createElement('div'); ov.id = 'nzOv'; ov.className = 'nz-ov'; document.body.appendChild(ov); }
  ov.innerHTML = `<div class="nz-modal" role="dialog" aria-modal="true" aria-label="Notizbuch"><div class="nz-mhead"><h2>${ico('notebook', 24)} Notizbuch</h2><button class="nz-x" data-act="nzClose" aria-label="Notizbuch schließen">✕</button></div><div class="nz-body">${nzBody()}</div></div>`;
  const nb = ov.querySelector('.nz-body'); if (nb) nb.scrollTop = st;
  nzBubble();
}
/* Blase: unten links auf jeder Seite; lässt sich verschieben (Position bleibt auf diesem Gerät). Beim Mini-Test und solange das Fenster offen ist, ist sie weg. */
const NZ_POS = 'dz_nzpos';
function nzPosGet() { try { const p = JSON.parse(localStorage.getItem(NZ_POS) || 'null'); if (p && typeof p.x === 'number' && typeof p.y === 'number') return p; } catch (e) { } return null; }
function nzPlace(b) {
  const p = nzPosGet(), kp = !p && document.querySelector('#app .keypad'), kr = kp ? kp.getBoundingClientRect() : null, small = !!(kr && kr.height > 0), w = small ? 48 : 58, m = 10;
  b.classList.toggle('sm', small);
  let x = p ? p.x : (small ? innerWidth - w - m : m), y = p ? p.y : (small ? kr.top - w - 4 : innerHeight - w - 16 - 70);        // ohne eigene Position: unten links, über dem Ziffernblock rechts oberhalb davon
  x = Math.max(m, Math.min(innerWidth - w - m, x)); y = Math.max(m, Math.min(innerHeight - w - m, y));
  b.style.left = x + 'px'; b.style.top = y + 'px';
}
function nzBubble() {
  let b = document.getElementById('nzBubble');
  const hide = UI.nzOpen || (typeof view !== 'undefined' && view === 'test') || !!document.querySelector('.w-flight');
  if (hide) { if (b) b.hidden = true; return; }
  if (!b) {
    b = document.createElement('button'); b.id = 'nzBubble'; b.className = 'nz-bubble'; b.type = 'button'; b.dataset.act = 'nzOpen'; document.body.appendChild(b);
    let sx = 0, sy = 0, ox = 0, oy = 0, drag = false, down = false;
    b.addEventListener('pointerdown', e => { down = true; drag = false; sx = e.clientX; sy = e.clientY; const r = b.getBoundingClientRect(); ox = r.left; oy = r.top; try { b.setPointerCapture(e.pointerId); } catch (x) { } });
    b.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (!drag && Math.hypot(dx, dy) > 8) drag = true; if (drag) { b.style.left = Math.max(8, Math.min(innerWidth - 66, ox + dx)) + 'px'; b.style.top = Math.max(8, Math.min(innerHeight - 66, oy + dy)) + 'px'; } });
    const end = () => { if (!down) return; down = false; if (drag) { const r = b.getBoundingClientRect(); try { localStorage.setItem(NZ_POS, JSON.stringify({ x: Math.round(r.left), y: Math.round(r.top) })); } catch (x) { } b.dataset.moved = '1'; setTimeout(() => { delete b.dataset.moved; }, 350); } };
    b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end);
    window.addEventListener('resize', () => nzPlace(b));
  }
  const n = noteList().length;
  nzPlace(b); b.hidden = false; b.setAttribute('aria-label', n ? `Notizbuch öffnen, ${n} ${n === 1 ? 'Eintrag' : 'Einträge'}` : 'Notizbuch öffnen');
  b.innerHTML = `${ico('notebook', 28)}${n ? `<span class="nz-bubble-n">${n > 99 ? '99+' : n}</span>` : ''}`;
}

/* ---------- Speichern ---------- */
function noteResetDraft() { UI.noteOpen = false; UI.noteEdit = null; UI.noteDraft = null; UI.noteTag = null; UI.noteTitle = ''; UI.noteItems = []; UI.noteType = 'zettel'; }
function noteSaveNow() {
  const L = noteList(), edit = L.find(n => n.id === UI.noteEdit), type = UI.noteType || 'zettel';
  if (type === 'liste') {
    const tiEl = $('#noteTitleIn'), title = ((tiEl ? tiEl.value : UI.noteTitle) || '').trim().slice(0, 40) || 'Liste';
    const items = (Array.isArray(UI.noteItems) ? UI.noteItems : []).slice(0, NOTE_LIST_MAX);
    if (!items.length) return toast('📋', 'Füge zuerst einen Punkt hinzu.');
    if (edit) { edit.title = title; edit.items = items; edit.ed = Date.now(); toast('✅', 'Liste geändert'); }
    else {
      if (L.length >= NOTE_CAP) return toast('📌', 'Die Wand ist voll. Lösche erst etwas Altes.');
      const id = L.reduce((m, n) => Math.max(m, n.id || 0), 0) + 1;
      L.push({ id, type: 'liste', title, items, color: noteRand(), ts: Date.now() }); toast('📋', 'Liste angelegt'); sfx('ok');
    }
  } else {
    const el = $('#noteIn'), t = noteClip(el ? el.value : UI.noteDraft).trim();
    if (!t) return toast('✏️', 'Schreib erst etwas auf.');
    if (!UI.noteTag) return toast('🏷️', 'Wähle zuerst ein Stichwort.');
    if (edit) { edit.t = t; edit.tag = UI.noteTag; edit.ed = Date.now(); toast('✅', 'Zettel geändert'); }
    else {
      if (L.length >= NOTE_CAP) return toast('📌', 'Die Wand ist voll. Lösche erst einen alten Zettel.');
      const id = L.reduce((m, n) => Math.max(m, n.id || 0), 0) + 1;
      L.push({ id, type: 'zettel', t, tag: UI.noteTag, color: noteRand(), ts: Date.now() }); toast('📌', 'Zettel angeheftet'); sfx('ok');
    }
  }
  noteResetDraft(); save(); nzRender();
}
registerFeature({
  id: 'notiz', title: 'Notizbuch', icon: 'book', tint: 'butter', group: 'world', order: 6, sub: noteSub,
  acts: {
    notiz: () => { noteResetDraft(); UI.nzOpen = true; nzRender(); },
    nzOpen: () => { const b = document.getElementById('nzBubble'); if (b && b.dataset.moved) return; noteResetDraft(); UI.nzOpen = true; nzRender(); sfx('tap'); const x = document.querySelector('#nzOv .nz-x'); if (x) x.focus(); },
    nzClose: () => { noteResetDraft(); UI.nzOpen = false; nzRender(); const b = document.getElementById('nzBubble'); if (b) b.focus(); },
    noteNew: () => { noteResetDraft(); UI.noteOpen = true; nzRender(); const t = $('#noteIn'); if (t) t.focus(); },
    noteSave: noteSaveNow,
    noteType: a => { UI.noteType = a === 'liste' ? 'liste' : 'zettel'; if (UI.noteType === 'liste') { if (UI.noteTitle == null) UI.noteTitle = ''; if (!Array.isArray(UI.noteItems)) UI.noteItems = []; } nzRender(); },
    noteTagPick: id => { UI.noteTag = id; nzRender(); },
    noteItemAdd: () => {
      const el = $('#noteItemIn'); if (!el) return;
      const t = String(el.value || '').trim().slice(0, NOTE_ITEM_MAX); if (!t) return;
      if (!Array.isArray(UI.noteItems)) UI.noteItems = []; if (UI.noteItems.length >= NOTE_LIST_MAX) return toast('📋', 'Die Liste ist voll.');
      UI.noteItems.push({ id: uid(), t, done: false }); nzRender(); const ni = $('#noteItemIn'); if (ni) ni.focus();
    },
    noteItemDel: i => { if (Array.isArray(UI.noteItems)) UI.noteItems.splice(+i, 1); nzRender(); },
    noteItemToggle: a => {
      const parts = String(a).split(':'), n = noteList().find(x => x.id === +parts[0]); if (!n || n.type !== 'liste') return;
      const it = n.items.find(x => x.id === parts[1]); if (!it) return;
      it.done = !it.done; n.ed = Date.now(); save(); nzRender();
    },
    noteEdit: id => {
      const n = noteList().find(x => x.id === +id); if (!n) return;
      UI.noteOpen = true; UI.noteEdit = n.id; UI.noteType = n.type;
      if (n.type === 'liste') { UI.noteTitle = n.title; UI.noteItems = n.items.map(it => ({ id: it.id, t: it.t, done: it.done })); }
      else { UI.noteDraft = n.t; UI.noteTag = n.tag; }
      nzRender(); window.scrollTo(0, 0);
    },
    noteCancel: () => { noteResetDraft(); nzRender(); },
    noteDel: () => {
      const n = noteList().find(x => x.id === UI.noteEdit); if (!n) return;
      const label = n.type === 'liste' ? `Liste „${esc(n.title)}“` : `„${esc(n.t)}“`;
      modal(n.type === 'liste' ? 'Liste löschen?' : 'Zettel löschen?', `${label}<br><br>Ein gelöschtes Element ist weg.`, 'Ja, löschen', 'noteDelYes', '', 'Nein, behalten');
    },
    noteDelYes: () => { closeModal(); S.notes = noteList().filter(n => n.id !== UI.noteEdit); noteResetDraft(); save(); nzRender(); toast('🗑️', 'Gelöscht'); }
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'noteIn') {
    const t = noteClip(e.target.value.replace(/\n/g, ' ')); if (t !== e.target.value) e.target.value = t;
    UI.noteDraft = t; const c = $('#noteCnt'); if (c) { c.textContent = `${noteLen(t)} / ${NOTE_MAX}`; c.classList.toggle('full', noteLen(t) >= NOTE_MAX); }
  } else if (e.target.id === 'noteTitleIn') { UI.noteTitle = e.target.value.slice(0, 40); }
});
document.addEventListener('keydown', e => { if (e.target && e.target.id === 'noteItemIn' && e.key === 'Enter') { e.preventDefault(); ACT.noteItemAdd(); } });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && UI.nzOpen && !document.getElementById('modal')) ACT.nzClose(); });
window.addEventListener('load', nzBubble);
