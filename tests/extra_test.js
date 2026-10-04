const fs=require('fs'),vm=require('vm');
const ctx={Math,console,String,Number,Array,Object,JSON};vm.createContext(ctx);
vm.runInContext(fs.readFileSync('../src/gen.js','utf8')+';this.MODULES=MODULES;',ctx);
const T=id=>ctx.MODULES.flatMap(m=>m.topics).find(t=>t.id===id);
const c=f=>Math.round(parseFloat(String(f.a).replace(',','.'))*100);
let bad=0;
for(let L=1;L<=3;L++)for(let r=0;r<2000;r++){
  let q=T('sach').gen(L);
  const h=q.html;
  if(/Zusammen: \[\[(\d+)\]\] €/.test(h)&&!/Rest von/.test(h)){const k=+/Zusammen: \[\[(\d+)\]\]/.exec(h)[1];const s=q.fields.slice(0,k).reduce((a,f)=>a+c(f),0);if(s!==c(q.fields[k])){bad++;console.log('sach sum',JSON.stringify(q.fields))}}
  if(/Rest von 50/.test(h)){if(c(q.fields[2])+c(q.fields[3])!==5000||c(q.fields[0])+c(q.fields[1])!==c(q.fields[2])){bad++;console.log('sach rest',JSON.stringify(q.fields))}}
  if(/Rückgeld/.test(h)){const pay=+/bezahlst mit (\d+) €/.exec(q.title)[1]*100;if(c(q.fields[0])+c(q.fields[1])!==pay){bad++;console.log('rueckgeld',q.title,JSON.stringify(q.fields))}}
  if(/Kleines Fahrrad/.test(h)){const T_=+/kosten sie (\d+) €/.exec(q.title)[1],d=+/ist (\d+) € teurer/.exec(q.title)[1];if(+q.fields[0].a+ +q.fields[1].a!==T_||+q.fields[1].a-+q.fields[0].a!==d||+q.fields[0].a<=0){bad++;console.log('fahrrad',q.title,JSON.stringify(q.fields))}}
  if(/Kind zahlt/.test(h)){const T_=+/kostet die Fahrt (\d+) €/.exec(q.title)[1];if(+q.fields[0].a+ +q.fields[1].a!==T_||+q.fields[1].a!==2* +q.fields[0].a||!Number.isInteger(+q.fields[0].a)){bad++;console.log('bahn',q.title,JSON.stringify(q.fields))}}
  q=T('angebot').gen(L);
  if(/Alles einzeln/.test(q.html)){if(c(q.fields[1])-c(q.fields[0])!==c(q.fields[2])||c(q.fields[2])<=0){bad++;console.log('angebot2',JSON.stringify(q.fields),q.title)}}
  else if(c(q.fields[0])-c({a:/Angebot \(.*?\): ([\d,]+) €/.exec(q.html)[1]})!==c(q.fields[1])||c(q.fields[1])<=0){bad++;console.log('angebot1',JSON.stringify(q.fields),q.html)}
  q=T('ticket').gen(L);
  const m=/Erwachsene: ([\d,]+) € · Kinder: ([\d,]+) €<br>Familienticket: ([\d,]+) €/.exec(q.html);
  const a=+/Familie mit (\d+)/.exec(q.title)[1],k=+/und (\d+) Kind/.exec(q.title)[1];
  const pa=c({a:m[1]}),pk=c({a:m[2]}),fam=c({a:m[3]});
  if(a*pa+k*pk!==c(q.fields[0])||c(q.fields[0])-fam!==c(q.fields[1])||c(q.fields[1])<=0){bad++;console.log('ticket',q.title,m[0],JSON.stringify(q.fields))}
}
console.log(bad?`FAILS ${bad}`:'EXTRA CHECKS PASSED');
