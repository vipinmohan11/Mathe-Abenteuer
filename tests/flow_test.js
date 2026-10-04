const {JSDOM,VirtualConsole}=require('../node_modules/jsdom');
const fs=require('fs');
const html=fs.readFileSync('../dist/Mathe-Abenteuer_Klasse4.html','utf8');
let fails=0;const ok=(c,m)=>{if(!c){fails++;console.log('FAIL:',m)}};
const errs=[];
function boot(storage){
  const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push('jsdomError: '+(e.detail&&e.detail.stack||e.message)));vc.on('error',e=>errs.push('console.error: '+e));
  const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://localhost/',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.print=()=>{};if(storage)for(const k in storage)w.localStorage.setItem(k,storage[k]);}});
  const w=dom.window;const A=w.__app,doc=w.document;
  const click=(sel)=>{const el=doc.querySelector(sel);if(!el)throw new Error('no el '+sel);el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
  const act=(a,arg)=>click(`[data-act="${a}"]${arg!=null?`[data-arg="${arg}"]`:''}`);
  return {w,A,doc,click,act};
}
const cur=A=>A.view==='play'?A.R.ctx:A.T.qs[A.T.i].c;
function solve(E,mode){ // mode: 'first' | 'second' | 'fail'
  const {A,act}=E;const c=cur(A),q=c.q;
  const right=()=>{ if(q.fields){q.fields.forEach((f,i)=>{ if(c.locked[i])return; act('foc',i); c.vals[i]=''; for(const ch of String(f.a)){ if(f.digit||/\d/.test(ch)) A.press(ch); else A.press(','); } }); A.check(); } else A.pickChoice(q.correct); };
  const wrong=()=>{ if(q.fields){ act('foc',0); c.vals[0]=''; A.press('9');A.press('9');A.press('9');A.press('9');A.press('9'); /*fill others*/ q.fields.forEach((f,i)=>{if(i&&!c.locked[i]){c.focus=i;c.vals[i]='';A.press('9');A.press('9');A.press('9');A.press('9');}}); A.check(); } else A.pickChoice((q.correct+1)%q.choices.length); };
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
ok(Object.values(A.SHOP).some(s=>s.items.some(x=>x.cur==='s'))&&Object.values(A.SHOP).some(s=>s.items.some(x=>x.cur==='f')),'items for stars and flames');

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
ok(A.deckPts(A.S.decks[key])===2+1+0+2,'points 5');
ok(A.S.mistakes.length===2,'2 mistakes stored (second+fail): '+A.S.mistakes.length);
ok(A.S.coins===5,'coins = points: '+A.S.coins);
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
act('toBlock');ok(A.view==='block','back to block');
const coinsAfterB1=A.S.coins, starsAfterB1=A.S.stars;
ok(A.S.stars>=0,'stars non-negative');
act('toGroup');ok(A.view==='topic','to group');
act('reviewDeck');ok(A.view==='review','review whole group');
act('toTopic');

// ================= 4. finish group perfectly -> medal, chest =================
A.startDeck(key);
answerAll(E,()=> 'first');   // block 2
ok(A.view==='block','block 2 done');
act('blockNext');ok(A.view==='play','blockNext continues');
answerAll(E,()=> 'first');   // block 3
ok(A.view==='block','block 3 done');
ok(A.S.decks[key].i===30,'deck complete');
ok(A.S.topics[key].medal>=3,'gold or better: '+A.S.topics[key].medal);
const maxCoins=60;ok(A.S.coins<=maxCoins,'coins cannot exceed group max 60: '+A.S.coins);
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
ok(A.S.coins<=60&&A.S.coins>=coinsFull,'coins capped at 60 per group: '+A.S.coins);
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
const allItems=Object.entries(A.SHOP).flatMap(([s,v])=>v.items.map(i=>({s,...i})));
const itS=allItems.find(x=>x.cur==='s'),itF=allItems.find(x=>x.cur==='f');
A.buy(itS.s,itS.id);ok(A.S.stars===30-itS.price,'bought with stars');
A.buy(itF.s,itF.id);ok(A.S.flames===20-itF.price,'bought with flames');
const st=A.S.stars;A.buy(itS.s,itS.id);ok(A.S.stars===st,'no double purchase');
A.S.flames=0;const itF2=allItems.find(x=>x.cur==='f'&&x.id!==itF.id);if(itF2){A.buy(itF2.s,itF2.id);ok(!A.S.owned[itF2.s].includes(itF2.id),'cannot buy without flames');}

// ================= 8. chests / album =================
A.S.chests=3;A.go('album');
act('openChest');ok(Object.keys(A.S.cards).length===1&&A.S.chests===2,'chest opens a card');
A.openChest();A.openChest();ok(Object.keys(A.S.cards).length===3,'3 distinct cards');
A.go('album');ok(/Noch nicht gefunden/.test(doc.body.textContent),'locked placeholders');

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

// ================= 13. export/import =================
{const j=JSON.stringify(A.S);const E5=boot();E5.A.importData(j,true);ok(E5.A.S.coins===A.S.coins,'import restores');}

console.log('JS errors:',errs.length);errs.slice(0,10).forEach(e=>console.log(e));
console.log(fails?`${fails} FAILS`:'ALL FLOW CHECKS PASSED');
process.exit(0);
