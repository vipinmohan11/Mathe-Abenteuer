/* BOOT – läuft als Letztes, wenn alle Module (app.js, feat_*.js) geladen sind */
/* ---------- boot ---------- */
window.__app = {
  get S() { return S; }, set S(v) { S = v; }, get R() { return R; }, get T() { return T; }, get view() { return view; }, get PIN() { return PIN; }, UI, MODULES, SHOP, CARDS, ACT, VIEWS, FEATS, CATALOG, hasItem, unlock, buyItem, checkUnlocks, openChest, stampsOf, nextGoals,
  startDeck, startMistakes, startTest, press, check, pickChoice, next, fieldOK, newCtx, isCorrect, levelInfo, medalOf, trophyList, checkTrophies, finishTest, remaining,
  mergeState, render, go, giveCoins, buy, equip, topicRec, importData, tk, qBody, mascotSVG, getDeck, deckPts, deckMax, deckFinished, newRound, bestRound, blockMax, qPts, ptsOf, newDeck, starNeed, NEW_DECK_MAX, NEW_BLOCK_MAX, TIER, deckWrong, blockPts, resetDeck, requirePin, pinKey, limitHit, openChest, save, load, dailyCheck, touchDay, creativeOK, creativeLeft, grantCreative, creativeMode, shopLeft, goalItem, nextUp, startNext, FN, shopAt, noteEarn, CHAPTERS, KIND, itemsOf, itemTile, featOf
};
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
touchDay();
if (ADMIN) adminFill();
Object.values(FEATS).forEach(f => { if (f.boot) { try { f.boot(); } catch (e) { console.error(e); } } });
try { checkUnlocks(); } catch (e) { console.error(e); }
try { if (testRestore()) view = 'test'; } catch (e) { console.error(e); }        // Mini-Test nach Neuladen fortsetzen
render();
idbGet().then(j => {                                // zweite Kopie: falls der Hauptspeicher leer/älter ist
  try {
    const o = j ? JSON.parse(j) : null;
    if (o && (o.saved || 0) > (S.saved || 0) + 1000) { S = mergeState(o); touchDay(); try { checkUnlocks(); } catch (e) { } toast('♻️', 'Fortschritt wiederhergestellt'); render(); }
  } catch (e) { }
  save();
});
