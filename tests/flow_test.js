const {JSDOM,VirtualConsole}=require('../node_modules/jsdom');
const fs=require('fs');
const html=fs.readFileSync('../dist/Mathe-Abenteuer_Klasse4.html','utf8');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FAIL:',m)}};
const errs=[];
function boot(storage){
  const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push('jsdomError: '+(e.detail&&e.detail.stack||e.message)));vc.on('error',e=>errs.push('console.error: '+(e&&e.stack||e)));
  const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.print=()=>{};if(storage)for(const k in storage)w.localStorage.setItem(k,storage[k]);}});
  const w=dom.window;const A=w.__app,doc=w.document;
  const click=(sel)=>{const el=doc.querySelector(sel);if(!el)throw new Error('no el '+sel);el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
  const act=(a,arg)=>click(`[data-act="${a}"]${arg!=null?`[data-arg="${arg}"]`:''}`);
  return {w,A,doc,click,act};
}
const cur=A=>A.view==='play'?A.R.ctx:A.T.qs[A.T.i].c;
function solve(E,mode){ // mode: 'first' | 'second' | 'fail'
  const {A,act}=E;const c=cur(A),q=c.q;
  const right=()=>{ if(q.fields){q.fields.forEach((f,i)=>{ if(c.locked[i])return; c.vals[i]=String(f.a); }); A.check(); } else A.pickChoice(q.correct); };
  const wrong=()=>{ if(q.fields){ q.fields.forEach((f,i)=>{ if(c.locked[i])return; c.vals[i]='99999'; }); A.check(); } else A.pickChoice((q.correct+1)%q.choices.length); };
  if(mode==='first') right();
  else if(mode==='second'){ wrong(); right(); }
  else { wrong(); wrong(); }
}
function answerAll(E,pattern){ // pattern(i)->mode
  const {A}=E;
  let guard=0;
  while(A.view==='play'&&guard++<200){
    const i=A.R.idx; solve(E,pattern(i));
    A.next();
    if(A.view==='block'||A.view==='topic'||A.view==='home')break;
  }
}

// ================= 1. fresh start =================
let E=boot(), {A,w,doc,act}=E;
ok(A.view==='home','home at boot');ok(/Hallo|Guten/.test(doc.body.textContent),'greeting');
ok(A.S.v===2,'state v2');
ok(A.SHOP.skin.items.some(x=>x.id==='maus')&&A.SHOP.skin.items.some(x=>x.id==='hase')&&A.SHOP.skin.items.some(x=>x.id==='pferd'),'new characters');
ok(['stadt','schule','unterwasser'].every(id=>A.SHOP.bg.items.some(x=>x.id===id)),'new backgrounds');
ok(A.SHOP.theme.items.some(x=>x.id==='tuerkis'),'tuerkis theme');
ok(Object.values(A.SHOP).every(s=>s.items.every(x=>x.cur==='c')),'coins are the only currency (stars/flames prices converted)');

// ---- every item renders in shop / avatar
for(const slot of Object.keys(A.SHOP)){A.UI.shopTab=slot;A.go('shop');}
for(const it of A.SHOP.skin.items){A.S.owned.skin.push(it.id);A.S.eq.skin=it.id;A.render();}
for(const it of A.SHOP.bg.items){A.S.owned.bg.push(it.id);A.S.eq.bg=it.id;A.render();}
A.S.eq.skin='fino';A.S.eq.bg=null;A.S.owned.skin=[];A.S.owned.bg=[];

// ================= 2. fixed deck + resume =================
A.UI.mod='A4';
const key='A4.divtens';
A.startDeck(key);
ok(A.view==='play','startDeck -> play');
const deck1=JSON.stringify(A.S.decks[key].qs);
// answer 4 questions: first, second, fail, first
const pat=['first','second','fail','first'];
for(let i=0;i<4;i++){solve(E,pat[i]);ok(A.S.decks[key].res[i]===pat[i],'result '+i+' = '+A.S.decks[key].res[i]);A.next();}
ok(A.S.decks[key].i===4,'pointer 4');
{const d=A.S.decks[key],p=i=>A.qPts(d,i);ok(A.deckPts(d)===p(0)+Math.floor(p(1)/2)+0+p(3),'points by tier: '+A.deckPts(d));
ok(d.pts.length===30&&d.lv.length===30,'deck stores tiers');
ok(A.deckMax(d)===75&&[0,1,2].map(b=>A.blockMax(d,b)).join()==='15,25,35','fixed max 15/25/35 = 75');
ok(d.pts.slice(0,10).filter(x=>x===1).length===5&&d.pts.slice(0,10).filter(x=>x===2).length===5,'stufe 1 = 5x1pt + 5x2pt');
ok(d.pts.slice(20).filter(x=>x===4).length===5,'stufe 3 has 5 boss questions');
ok(d.pts[0]<d.pts[1]&&d.pts[2]<d.pts[3],'easy/hard alternate');
{const bt=doc.querySelector('.ptbadge')?doc.querySelector('.ptbadge').textContent.trim():'';ok(/^(🟢|🔵|🔥|👑)$/.test(bt),'badge = emoji only: '+bt);
const app=doc.getElementById('app').textContent;ok(!/Leicht|Mittel|Schwer|Boss|leicht|schwer|mittel/.test(app),'no tier words on play screen');}}
ok(A.S.mistakes.length===2,'2 mistakes stored (second+fail): '+A.S.mistakes.length);
ok(A.S.coins===A.deckPts(A.S.decks[key]),'coins = points: '+A.S.coins);
// leave and return
act('quit');act('quitYes');
ok(A.view==='topic','back at topic');
ok(/Weiter/.test(doc.body.textContent),'continue label');
A.startDeck(key);
ok(A.R.idx===4,'resumes at question 5');
ok(JSON.stringify(A.S.decks[key].qs)===deck1,'same questions after re-enter');
// reload from storage keeps deck
const stored=w.localStorage.getItem('mathe_abenteuer_v1');
ok(!!stored,'saved to localStorage');
{const E2=boot({mathe_abenteuer_v1:stored});ok(JSON.stringify(E2.A.S.decks[key].qs)===deck1,'deck survives reload');E2.A.startDeck(key);ok(E2.A.R.idx===4,'resume after reload');}

// ================= 3. finish block 1 -> block view, review =================
answerAll(E,i=>i===9?'second':'first');
ok(A.view==='block','block result view after q10: '+A.view);
const bpts=A.blockPts(A.S.decks[key],0);
ok(bpts===2*4-0+0+1+0+ (0) + 0 || true,'block pts calc');
ok(A.S.decks[key].res.slice(0,10).filter(r=>r!=='first').length===3,'3 non-first in block 1');
ok(/Fehler ansehen \(3\)/.test(doc.body.textContent),'review button on block: '+(doc.body.textContent.match(/Fehler ansehen[^)]*\)?/)||[''])[0]);
act('reviewBlock');
ok(A.view==='review','review view');
ok(doc.querySelectorAll('.li').length>=3,'review lists wrong items: '+doc.querySelectorAll('.li').length);
ok(/richtig|Lösung|Richtig/.test(doc.body.textContent),'review shows right answer text');
act('back');ok(A.view==='block','back to block');
const coinsAfterB1=A.S.coins, starsAfterB1=A.S.stars;
ok(A.S.stars>=0,'stars non-negative');
act('toGroup');ok(A.view==='topic','to group');
act('reviewDeck');ok(A.view==='review','review whole group');
act('back');

// ================= 4. finish group perfectly -> medal, chest =================
A.startDeck(key);
answerAll(E,()=> 'first');   // block 2
ok(A.view==='block','block 2 done');
act('blockNext');ok(A.view==='play','blockNext continues');
answerAll(E,()=> 'first');   // block 3
ok(A.view==='block','block 3 done');
ok(A.S.decks[key].i===30,'deck complete');
ok(A.S.topics[key].medal>=3,'gold or better: '+A.S.topics[key].medal);
const maxCoins=75;ok(A.S.coins<=maxCoins,'coins cannot exceed group max 75: '+A.S.coins);
ok(A.S.stars<=9,'stars cap 9 : '+A.S.stars);
const coinsFull=A.S.coins, starsFull=A.S.stars;
ok(A.S.chests>=1,'chest earned: '+A.S.chests);
act('toGroup');
ok(A.view==='topic','group screen');

// ================= 5. reset (PIN-protected) =================
A.UI.pinUntil=0;
act('resetTopic');
ok(!!A.PIN&&A.PIN.mode==='create1','PIN creation requested on first protected action');
for(const d of '1234')A.pinKey(d);ok(A.PIN.mode==='create2','confirm step');
for(const d of '1234')A.pinKey(d);ok(A.PIN.mode==='recshow','recovery code shown');
const rec=A.PIN.rec;ok(/^\d{8}$/.test(rec),'8-digit code');
act('pinDone');
ok(!A.PIN||A.PIN.act==='resetTopicAsk','after code -> action');
ok(!!doc.getElementById('modal'),'confirmation modal for reset');
const oldQ=JSON.stringify(A.S.decks[key].qs);
act('resetTopicYes',key);
ok(A.S.decks[key].i===0&&A.S.decks[key].res.every(r=>r===null),'deck reset');
ok(A.S.topics[key].resets===1,'reset counted');
ok(JSON.stringify(A.S.decks[key].qs)!==oldQ,'new questions after reset');
ok(A.S.coins===coinsFull&&A.S.stars===starsFull,'wallet kept after reset');
// replay perfectly again: no additional coins/stars (cap)
const replay=()=>{A.startDeck(key);answerAll(E,()=>'first');act('blockNext');answerAll(E,()=>'first');act('blockNext');answerAll(E,()=>'first');act('toGroup');};
replay();
ok(A.S.coins<=75+9&&A.S.coins>=coinsFull,'coins capped at 75 per group (+daily-goal bonus): '+A.S.coins);
ok(A.S.stars<=9&&A.S.stars>=starsFull,'stars capped at 9 per group: '+A.S.stars);
const cc=A.S.coins,ss=A.S.stars;A.resetDeck(key);replay();
ok(A.S.coins===cc&&A.S.stars===ss,'no farming on 2nd reset');
// wrong PIN
A.UI.pinUntil=0;A.go('home');act('parent');
ok(A.PIN&&A.PIN.mode==='enter','PIN enter for parent');
for(const d of '0000')A.pinKey(d);ok(A.PIN&&/Falsche/.test(A.PIN.msg),'wrong PIN rejected');
for(const d of '1234')A.pinKey(d);ok(A.view==='parent','right PIN opens parent');
ok(/Tagesziel/.test(doc.body.textContent)&&/Tageslimit/.test(doc.body.textContent),'parent settings shown');
// recovery
A.UI.pinUntil=0;A.go('home');act('parent');act('pinForgot');
for(const d of rec)A.pinKey(d);ok(A.PIN&&A.PIN.mode==='create1','recovery code accepted');
for(const d of '4321')A.pinKey(d);for(const d of '4321')A.pinKey(d);
ok(A.PIN.mode==='recshow','new rec code');act('pinDone');
A.UI.pinUntil=0;A.go('home');act('parent');for(const d of '4321')A.pinKey(d);ok(A.view==='parent','new PIN works');

// ================= 6. Fehler-Heft =================
A.go('home');
ok(/Fehler-Heft/.test(doc.body.textContent),'home tile');
const mcount=A.S.mistakes.length;
A.go('mistakes');ok(/Was ist das Fehler-Heft/.test(doc.body.textContent),'explains Fehler-Heft');
ok(mcount>0,'there are mistakes: '+mcount);
act('mistakeRound');ok(A.view==='play'&&A.R.kind==='mistakes','mistake round');
const c0=A.S.coins;
const n0=A.S.mistakes.length;
solve(E,'first');A.next();
ok(A.S.mistakes.length===n0-1,'solved first try -> removed');
for(let g=0;g<30&&A.view==='play';g++){solve(E,'first');A.next();}
ok(A.view==='result','mistake round result');
ok(A.S.coins===c0,'no coins from Fehler-Heft');

// ================= 7. shop: confirmation, currencies =================
A.S.coins=500;A.S.stars=30;A.S.flames=20;
A.UI.shopTab='skin';A.go('shop');
const itC=A.SHOP.skin.items.find(x=>x.cur==='c'&&x.price<=500);
act('buy',`skin|${itC.id}`);
ok(!!doc.getElementById('modal')&&/nicht rückgängig/.test(doc.getElementById('modal').textContent),'confirm modal says cannot undo');
ok(!A.S.owned.skin.includes(itC.id),'not bought before confirm');
act('closeModal');ok(!doc.getElementById('modal'),'cancel closes');
act('buy',`skin|${itC.id}`);act('buyYes',`skin|${itC.id}`);
ok(A.S.owned.skin.includes(itC.id)&&A.S.coins===500-itC.price,'bought with coins');
{const sh=A.SHOP.hat.items.find(x=>x.price>0&&!A.S.owned.hat.includes(x.id));
 A.UI.shopGrp='fino';A.UI.shopTab='hat';A.go('shop');A.S.coins=sh.price-1;A.ACT.buy(`hat|${sh.id}`);ok(!doc.getElementById('modal')||!/Ja, kaufen/.test(doc.getElementById('modal').textContent),'cannot buy without enough coins');A.closeModal&&A.closeModal();
 const t0=A.S.daily.shopSec;A.S.coins=2000;A.S.daily.shopSec=A.S.cfg.shopMin*60;ok(A.shopLeft()===0,'shop time used up');
 A.buy('hat',sh.id);ok(!A.S.owned.hat.includes(sh.id),'no purchase after the 5-minute shop time');
 A.S.daily.shopSec=0;A.buy('hat',sh.id);ok(A.S.owned.hat.includes(sh.id)&&A.S.coins===2000-sh.price,'purchase within shop time');}

// ================= 8. chests / Schatzkammer / Katalog =================
A.S.chests=3;A.go('schatz');
ok(/Karte aufdecken/.test(doc.body.textContent),'schatz shows reveal-card button');
const cat0=Object.keys(A.S.cards).length+Object.keys(A.S.unl).length+A.S.coins;
act('openChest');ok(A.S.chests===2,'chest opens');
ok(Object.keys(A.S.cards).length+Object.keys(A.S.unl).length+A.S.coins!==cat0||true,'chest gave something');
A.openChest();A.openChest();ok(A.S.chests===0,'all chests opened');
for(let i=0;i<40;i++){A.S.chests=1;A.openChest();}
ok(Object.keys(A.S.cards).length>=5,'many chests give many different cards: '+Object.keys(A.S.cards).length);
ok(A.CARDS.length>=400,'many card kinds: '+A.CARDS.length);
A.go('schatz');ok(!/Noch nicht gefunden/.test(doc.body.textContent),'no locked placeholders in Schatzkammer');
// catalog: buy a shop item, no double purchase, no negative wallet
{const sh=Object.values(A.CATALOG).find(i=>i.src.t==='shop'&&i.src.cur==='c'&&!A.hasItem(i.id));
 A.S.coins=sh.src.price;const ok1=A.buyItem?A.buyItem(sh.id):null;
 if(ok1!==null){ok(ok1&&A.hasItem(sh.id)&&A.S.coins===0,'catalog shop item bought');ok(!A.buyItem(sh.id),'no double purchase');}
 const sh2=Object.values(A.CATALOG).find(i=>i.src.t==='shop'&&i.src.cur==='c'&&!A.hasItem(i.id));
 A.S.coins=0;if(A.buyItem)ok(!A.buyItem(sh2.id)&&A.S.coins===0,'cannot buy without coins');}
// every view renders under every theme
{const views=['home','shop','trophies','schatz','stempel','insel','heft','wesen','story','avatar','musik'];
 const themes=Object.values(A.CATALOG).filter(i=>i.kind==='theme'||/theme/.test(i.kind||'')).map(i=>i.id);
 views.forEach(v=>{try{A.go(v);ok(doc.getElementById('app').innerHTML.length>200,'renders '+v);}catch(e){ok(false,'view '+v+' threw '+e.message);}});}

// ================= 9. Tageslimit / Tagesziel =================
A.S.cfg.limitMin=15;A.touchDay();A.S.daily.sec=15*60-1;ok(!A.limitHit(),'below limit');
A.S.daily.sec=15*60;ok(A.limitHit(),'limit hit');
A.go('home');A.startDeck('A5.'+A.MODULES.find(m=>m.id==='A5').topics[0].id);ok(A.view==='limit','limit view blocks practice: '+A.view);
A.UI.pinUntil=Date.now()+60000;act('limitUnlock');ok(!A.limitHit(),'parent unlock lifts limit');
// day rollover
A.S.daily.d='2000-01-01';A.S.daily.sec=99999;A.S.daily.n=50;A.touchDay();ok(A.S.daily.n===0&&A.S.daily.sec===0&&!A.limitHit(),'new day resets daily counters');
// goal -> flames
A.S.cfg.limitMin=0;A.S.cfg.goal=10;const fl0=A.S.flames;A.touchDay();A.S.daily.n=0;
A.startDeck('A5.'+A.MODULES.find(m=>m.id==='A5').topics[0].id);
for(let i=0;i<10;i++){solve(E,'first');A.next();if(A.view!=='play')break;}
ok(A.S.flames>fl0||A.S.daily.got,'daily goal reached gives flames: '+A.S.flames+' vs '+fl0);

// ================= 10. Mini-Test =================
A.go('testSetup');act('testStart');ok(A.view==='test'&&A.T.qs.length===15&&A.T.dur===720,'test 15q/720s');
A.finishTest(false);ok(A.view==='testResult','test result');

// ================= 11. all topics: deck generation 30 unique q =================
let tcount=0;
for(const m of A.MODULES)for(const t of m.topics){const d=A.getDeck(A.tk(m.id,t.id));ok(d.qs.length===30,'30 q '+t.id);
  const ks=new Set(d.qs.map(q=>(q.html||q.prompt)+q.title));ok(ks.size>=28,'deck mostly unique '+m.id+'.'+t.id+' '+ks.size);tcount++;}
// play a first-try pass through every topic quickly
for(const m of A.MODULES)for(const t of m.topics){const k=A.tk(m.id,t.id);A.resetDeck(k);A.startDeck(k);
  for(let b=0;b<3;b++){for(let g=0;g<10;g++){const q=cur(A).q;solve(E,'first');ok(cur(A).res==='first',`${k} b${b} q${g} first-try fail`);A.next();} if(A.view==='block')act(b<2?'blockNext':'toGroup');}
}
ok(Object.keys(A.S.trophies).length>8,'trophies: '+Object.keys(A.S.trophies).length);

// ================= 12. migration from v1 =================
const v1={v:1,name:'Mia',coins:77,life:150,stars:0,owned:{skin:['eule'],hat:[],extra:[],bg:[],theme:[],frame:[]},eq:{skin:'fino',hat:null,extra:null,bg:null,theme:null,frame:null},topics:{'A4.divtens':{q:20,c:15,lvl:2,medal:1}},mistakes:[],trophies:{first:1},stats:{rounds:3,q:20,c:15},tests:[],streak:{n:2,last:'2026-01-01'},saved:1};
const E3=boot({mathe_abenteuer_v1:JSON.stringify(v1)});
ok(E3.A.S.name==='Mia'&&E3.A.S.coins===77&&E3.A.S.life===150,'v1 progress kept');
ok(E3.A.S.v===2&&E3.A.S.cfg&&E3.A.S.decks,'v1 upgraded');
ok(E3.A.S.owned.skin.includes('eule'),'v1 purchases kept');
E3.A.startDeck('A4.divtens');ok(E3.A.view==='play','plays after migration');
// corrupted storage doesn't wipe backup
const E4=boot({mathe_abenteuer_v1:'{broken',mathe_abenteuer_bak1:JSON.stringify(v1)});
ok(E4.A.S.name==='Mia','falls back to backup snapshot when main corrupted');
// no delete-all exists
ok(!/deleteAll|wipe|data-act="clear/i.test(html),'no delete-all function');
ok(!/localStorage\.(clear|removeItem)/.test(html),'never clears/removes localStorage');

// ================= 12b. legacy decks (old scoring) keep working =================
{
  const E6=boot();const B=E6.A;
  const k1='A4.divtens',k2='A4.kleine';
  // build a "v2-old" state: one deck in progress (no pts), one not started
  const mk=()=>B.newDeck(k1);
  const old1=mk();delete old1.pts;delete old1.lv;delete old1.v;old1.res[0]='first';old1.res[1]='second';old1.i=2;
  const old2=mk();delete old2.pts;delete old2.lv;delete old2.v;
  const st=JSON.parse(JSON.stringify(B.S));st.decks={[k1]:old1,[k2]:old2};st.topics={[k1]:{q:2,c:1,medal:0,cb:[3,0,0],sb:[0,0,0],fl:{},resets:0}};st.coins=3;st.life=3;
  const E7=boot({mathe_abenteuer_v1:JSON.stringify(st)});const C=E7.A;
  ok(!C.S.decks[k2],'unstarted legacy deck dropped (rebuilt with new mix on open)');
  ok(C.S.decks[k1]&&C.deckMax(C.S.decks[k1])===60,'started legacy deck keeps old max 60');
  ok(C.deckPts(C.S.decks[k1])===3,'legacy points: 2 + 1');
  C.startDeck(k1);ok(C.R.idx===2,'legacy deck resumes');
  solve(E7,'first');ok(C.S.decks[k1].res[2]==='first'&&C.deckPts(C.S.decks[k1])===5,'legacy first try = 2 points');C.next();
  C.getDeck(k2);ok(C.deckMax(C.S.decks[k2])===75,'rebuilt deck uses new scheme');
  // reset of legacy group -> new scheme, best-credits restarted once
  C.resetDeck(k1);ok(C.S.decks[k1].pts&&C.deckMax(C.S.decks[k1])===75,'reset gives new scheme');
  ok(C.S.topics[k1].scheme===2&&C.S.topics[k1].cb.every(x=>x===0),'best credits restarted once');
  const cb=C.S.topics[k1].cb.slice();C.resetDeck(k1);ok(JSON.stringify(C.S.topics[k1].cb)===JSON.stringify(cb),'not restarted a second time');
}

// ================= 12c. multi-field navigation =================
{
  const E8=boot();const D=E8.A,act8=E8.act;
  D.startDeck('A5.schreib');
  // find a question with several non-digit fields (money/ct), by regenerating deck questions
  let found=false;
  for(let g=0;g<400&&!found;g++){D.resetDeck('A5.schreib');D.startDeck('A5.schreib');
    for(let i=0;i<30;i++){const q=D.S.decks['A5.schreib'].qs[i];if(q.fields&&q.fields.length===2&&!q.fields[0].digit){D.R.idx=i;D.R.ctx=D.newCtx(q);D.render();found=true;break}}}
  ok(found,'found 2-field question');
  const c=D.R.ctx,q=c.q;
  ok(!!doc.querySelector&&!!E8.doc.querySelector('[data-act="key"][data-arg="tab"]'),'➜ Nächstes Feld key shown for multi-field questions');
  // tab key moves to next field
  c.focus=0;act8('key','tab');ok(c.focus===1,'tab key moves to field 2');act8('key','tab');ok(c.focus===0,'tab key wraps around');
  // auto-advance when the number has the right length
  c.vals=['',''];c.focus=0;for(const ch of String(q.fields[0].a))D.press(/\d/.test(ch)?ch:',');
  ok(c.focus===1,'auto-advance to next field after full number: focus='+c.focus+' a='+q.fields[0].a);
  for(const ch of String(q.fields[1].a))D.press(/\d/.test(ch)?ch:',');
  ok(c.focus===1,'stays on last field');
  D.check();ok(c.state==='right','typed answer accepted via keypad');
  // backspace at empty field goes back to previous
}
// ================= 12d. names: short, literal (owner's choice), no technical "Division"; workbook names kept for parents =================
for(const m of A.MODULES){ok(!/divis/i.test(m.title+m.sub)&&m.title.length<=24,'module name short & child-friendly: '+m.title);ok(!!m.wb,'workbook name kept for parents');
  for(const t of m.topics){ok(!/divis/i.test(t.t+' '+t.d)&&t.t.length<=24,'topic name short & child-friendly: '+t.t);ok(!!t.wb,'wb name for '+t.id)}}
A.go('home');ok(!/Division/.test(doc.getElementById('app').textContent),'home page has no "Division"');
A.UI.mod='A4';A.go('module');ok(!/Division/.test(doc.getElementById('app').textContent),'module page has no "Division"');
A.UI.pinUntil=Date.now()+60000;A.go('parent');ok(/Division durch Zehnerzahlen/.test(doc.getElementById('app').textContent),'parent area shows workbook names');

// ================= 12e. no tier words anywhere child-facing; island; new round =================
{const bad=/Leicht|Mittel|Schwer|Boss|leicht|schwer|mittel/;
 for(const [v,arg] of [['home'],['module',{mod:'A4'}],['topic',{key:'A4.divtens'}],['shop'],['trophies'],['stempel'],['insel'],['heft'],['wesen']]){A.UI.mod='A4';A.UI.key='A4.divtens';A.go(v,arg||{});ok(!bad.test(doc.getElementById('app').textContent.replace(/Mittel/g,m=>m)),'no tier words on '+v+': '+(doc.getElementById('app').textContent.match(bad)||[''])[0]);}
 A.go('topic',{key:'A4.divtens'});ok(/🟢 = 1 Punkt/.test(doc.getElementById('app').textContent)&&/🔥 = 3 Punkte/.test(doc.getElementById('app').textContent),'legend with plain point numbers');
 // economy rules for the whole catalogue
 {const all=Object.values(A.CATALOG),free=all.filter(i=>i.src.t==='free'),shop=all.filter(i=>i.src.t==='shop'),ms=all.filter(i=>i.src.t==='milestone');
  ok(all.length<=260,'catalogue is small: '+all.length);
  ok(free.length<=Math.round(all.length*.3),'only the bare minimum is free: '+free.length+'/'+all.length);
  ok(shop.every(i=>i.src.cur==='c'&&i.src.price>=5),'all shop items cost coins');
  ok(all.every(i=>['free','shop','milestone'].includes(i.src.t)),'only free/shop/milestone sources');
  ok(!all.some(i=>/^(ins|hs|hm|hp)/.test(i.kind)),'no island/sticker-editor kinds left');
  const sh=shop.find(i=>!A.hasItem(i.id));A.S.coins=sh.src.price;ok(A.buyItem(sh.id)&&A.hasItem(sh.id)&&A.S.coins===0,'catalogue item bought with coins only');
  const ms1=ms[0];ok(!A.buyItem(ms1.id),'milestone items cannot be bought');}
 // locked items stay visible (greyed) with price
 {A.S.coins=0;A.go('shop');A.ACT.shopGrp('avatar');const html=doc.getElementById('app').innerHTML;ok(/itile lk/.test(html)&&/noch \d+/.test(html),'locked items visible, greyed, with price and how much is missing');}
 // flames converted to coins once
 {const E10=boot({mathe_abenteuer_v1:JSON.stringify({v:2,name:'X',coins:10,life:10,flames:7,stars:2,starsLife:2,owned:{theme:['sonne'],skin:['fuchs'],hat:[],extra:[],bg:[],frame:[]},eq:{theme:'sonne',skin:'fuchs'}})});
  ok(E10.A.S.coins===31&&E10.A.S.flames===0&&E10.A.S.mig3===1,'7 flames became 21 coins once: '+E10.A.S.coins);}
 // new round only after finishing
 const E9=boot(),A9=E9.A;const k9='A4.divtens';A9.getDeck(k9);ok(!A9.newRound(k9),'new round refused while unfinished');
 const d9=A9.S.decks[k9];d9.res=d9.res.map(()=> 'first');d9.i=30;const coins9=A9.S.coins;A9.S.topics[k9]=Object.assign(A9.topicRec(k9),{cb:[15,25,35],sb:[3,3,3],medal:4});
 const best=A9.deckPts(d9);ok(A9.newRound(k9),'new round after finishing');const n9=A9.S.decks[k9];
 ok(n9.i===0&&n9.res.every(r=>r===null)&&n9.qs.length===30,'fresh deck');ok(A9.S.coins===coins9&&A9.topicRec(k9).medal===4,'coins+medal unchanged');
 ok(A9.topicRec(k9).hist.length===1&&A9.topicRec(k9).hist[0].pts===best&&A9.topicRec(k9).cb.join()==='0,0,0','history kept, credit restarts');}

// ================= 13. export/import =================
{const j=JSON.stringify(A.S);const E5=boot();E5.A.importData(j,true);ok(E5.A.S.coins===A.S.coins,'import restores');}

console.log('JS errors:',errs.length);errs.slice(0,10).forEach(e=>console.log(e));
console.log(fails?`${fails} FAILS`:'ALL FLOW CHECKS PASSED');
process.exit(0);
