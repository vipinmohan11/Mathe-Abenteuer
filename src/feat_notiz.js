/* =====================================================================
   NOTIZBUCH · „Zettel-Wand“ in Meine Welt
   Kurze Zettel (höchstens 140 Zeichen) an einer Wand: die letzten 6 hängen sichtbar, ältere stehen in einer Liste darunter.
   Zustand: S.notes = [{ id, t (Text), ts (Zeit) }] – nur das Kind schreibt hier; Zettel werden nur gelöscht, wenn das Kind es bestätigt.
   Farben: gelb, mint, himmelblau (nie rosa).
   ===================================================================== */
const NOTE_MAX = 140, NOTE_CAP = 200, NOTE_WALL = 6, NOTE_COLS = ['y', 'm', 's'];
DZ_ART.notiz = '<rect x="9" y="9" width="30" height="30" rx="3" fill="#f1e4b6" stroke="#52676c" stroke-width="2" transform="rotate(-6 24 24)"/><path d="M15 19h16M15 25h16M15 31h9" stroke="#8a8f7a" stroke-width="2" stroke-linecap="round" transform="rotate(-6 24 24)"/><rect x="33" y="22" width="22" height="22" rx="3" fill="#cfe9d6" stroke="#52676c" stroke-width="2" transform="rotate(7 44 33)"/><path d="M38 31h12M38 37h8" stroke="#6f9871" stroke-width="2" stroke-linecap="round" transform="rotate(7 44 33)"/><circle cx="24" cy="9" r="3" fill="#e0a823" stroke="#52676c" stroke-width="1.5"/>';
const noteList = () => { if (!Array.isArray(S.notes)) S.notes = []; return S.notes; };
const noteLen = t => Array.from(t || '').length;
const noteClip = t => Array.from(String(t || '').replace(/\s+/g, ' ')).slice(0, NOTE_MAX).join('');
const noteDate = ts => new Date(ts).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
const noteSub = () => { const n = noteList().length; return n ? `${n} ${n === 1 ? 'Zettel' : 'Zettel'}` : 'Schreib etwas auf'; };
function noteCard(n, big) {
  const c = NOTE_COLS[(n.id || 0) % 3], rot = ((n.id || 0) % 5 - 2) * 0.9;
  return `<button class="nz-note nz-${c}" style="--r:${rot}deg" data-act="noteEdit" data-arg="${n.id}" aria-label="Zettel vom ${noteDate(n.ts)} bearbeiten: ${esc(n.t)}"><span class="nz-pin"></span><span class="nz-t">${esc(n.t)}</span><small>${noteDate(n.ts)}</small></button>`;
}
VIEWS.notiz = () => {
  const L = noteList(), edit = L.find(n => n.id === UI.noteEdit), draft = UI.noteDraft != null ? UI.noteDraft : (edit ? edit.t : '');
  const sorted = L.slice().sort((a, b) => b.ts - a.ts || b.id - a.id), wall = sorted.slice(0, NOTE_WALL), older = sorted.slice(NOTE_WALL);
  return topBar('Notizbuch', 'rewards') + `
  <section class="dz-panel nz-edit"><h2>${edit ? 'Zettel ändern' : 'Neuer Zettel'}</h2>
    <label class="sr-only" for="noteIn">Dein Zettel, höchstens ${NOTE_MAX} Zeichen</label>
    <textarea id="noteIn" class="txt" rows="3" maxlength="${NOTE_MAX * 2}" placeholder="Schreib hier etwas auf …" autocomplete="off">${esc(draft)}</textarea>
    <div class="nz-row"><span class="nz-cnt" id="noteCnt" aria-live="polite">${noteLen(draft)} / ${NOTE_MAX}</span>
      <span class="nz-btns">${edit ? '<button class="btn sec" data-act="noteCancel">Abbrechen</button><button class="btn sec" data-act="noteDel">Zettel löschen</button>' : ''}<button class="btn" data-act="noteSave">${edit ? 'Änderung speichern' : 'Zettel anheften'}</button></span></div>
  </section>
  ${dzSec('Meine Zettel-Wand', L.length ? '' : 'Noch hängt nichts an der Wand.')}
  ${wall.length ? `<div class="nz-wall">${wall.map(n => noteCard(n)).join('')}</div>` : ''}
  ${older.length ? `<details class="ad-earned nz-older"><summary>${ico('book', 18)} Ältere Zettel <span>${older.length}</span></summary><ul>${older.map(n => `<li><button class="nz-old" data-act="noteEdit" data-arg="${n.id}"><small>${noteDate(n.ts)}</small> ${esc(n.t)}</button></li>`).join('')}</ul></details>` : ''}`;
};
function noteSaveNow() {
  const el = $('#noteIn'), t = noteClip(el ? el.value : UI.noteDraft).trim(), L = noteList();
  if (!t) return toast('✏️', 'Schreib erst etwas auf.');
  const edit = L.find(n => n.id === UI.noteEdit);
  if (edit) { edit.t = t; edit.ed = Date.now(); toast('✅', 'Zettel geändert'); }
  else {
    if (L.length >= NOTE_CAP) return toast('📌', 'Die Wand ist voll. Lösche erst einen alten Zettel.');
    const id = L.reduce((m, n) => Math.max(m, n.id || 0), 0) + 1;
    L.push({ id, t, ts: Date.now() }); toast('📌', 'Zettel angeheftet'); sfx('ok');
  }
  UI.noteEdit = null; UI.noteDraft = null; save(); render();
}
registerFeature({
  id: 'notiz', title: 'Notizbuch', icon: 'book', tint: 'butter', group: 'world', order: 6, view: 'notiz', sub: noteSub,
  acts: {
    notiz: () => { UI.noteEdit = null; UI.noteDraft = null; go('notiz'); },
    noteSave: noteSaveNow,
    noteEdit: id => { const n = noteList().find(x => x.id === +id); if (!n) return; UI.noteEdit = n.id; UI.noteDraft = null; render(); window.scrollTo(0, 0); },
    noteCancel: () => { UI.noteEdit = null; UI.noteDraft = null; render(); },
    noteDel: () => { const n = noteList().find(x => x.id === UI.noteEdit); if (!n) return; modal('Zettel löschen?', `„${esc(n.t)}“<br><br>Ein gelöschter Zettel ist weg.`, 'Ja, löschen', 'noteDelYes', '', 'Nein, behalten'); },
    noteDelYes: () => { closeModal(); S.notes = noteList().filter(n => n.id !== UI.noteEdit); UI.noteEdit = null; UI.noteDraft = null; save(); render(); toast('🗑️', 'Zettel gelöscht'); }
  }
});
document.addEventListener('input', e => {
  if (e.target.id !== 'noteIn') return;
  const t = noteClip(e.target.value.replace(/\n/g, ' ')); if (t !== e.target.value) e.target.value = t;
  UI.noteDraft = t; const c = $('#noteCnt'); if (c) { c.textContent = `${noteLen(t)} / ${NOTE_MAX}`; c.classList.toggle('full', noteLen(t) >= NOTE_MAX); }
});
