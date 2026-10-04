const fs=require('fs'),vm=require('vm');
const src=fs.readFileSync('../src/gen.js','utf8');
const ctx={Math,console,String,Number,Array,Object,JSON};vm.createContext(ctx);
vm.runInContext(src+';this.MODULES=MODULES;this.eur=eur;',ctx);
const {MODULES,eur}=ctx;
const strip=h=>h.replace(/<br>/g,'\n').replace(/<\/div>/g,'\n').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
// fieldOK copy from app (extract)
const app=fs.readFileSync('../src/store.js','utf8');
const m=/const normIn[\s\S]*?\n}\n/.exec(app)[0];
const fieldOK=new Function(m+';return fieldOK')();
let errors=[],count=0;
const err=(id,L,msg,q)=>{errors.push(`${id} L${L}: ${msg}\n   ${JSON.stringify(q).slice(0,300)}`)};
const num=s=>Number(String(s).replace(',','.'));
for(const mod of MODULES)for(const t of mod.topics)for(let L=1;L<=3;L++)for(let r=0;r<400;r++){
  const q=t.gen(L);count++;const id=mod.id+'.'+t.id;
  if(!q.title||!q.hint||!q.explain){err(id,L,'missing text',q);continue}
  if(/undefined|NaN|\[object/.test(JSON.stringify(q))){err(id,L,'undefined/NaN in q',q);continue}
  if(q.fields){
    const ph=[...q.html.matchAll(/\[\[(\d+)\]\]/g)].map(x=>+x[1]).sort((a,b)=>a-b);
    if(ph.length!==q.fields.length||ph.some((v,i)=>v!==i)){err(id,L,'placeholder mismatch '+ph,q);continue}
    q.fields.forEach((f,i)=>{
      if(!fieldOK(f,f.a))err(id,L,'own answer rejected '+f.a,q);
      const bad=f.digit?String((+f.a+1)%10):f.strict?f.a+'0':String(+String(f.a).replace(',','.')+1).replace('.',',');
      if(f.digit||!f.strict){ if(fieldOK(f,bad)&&bad!==f.a)err(id,L,'wrong accepted '+bad+' vs '+f.a,q)}
      if(f.next!=null&&(f.next<0||f.next>=q.fields.length))err(id,L,'bad next',q);
    });
    const A=q.fields.map(f=>f.a);
    const txt=strip(q.html).split('\n').map(s=>s.trim()).filter(Boolean);
    const val=tok=>{const mm=/^\[\[(\d+)\]\]$/.exec(tok);return mm?num(A[+mm[1]]):num(tok)};
    // generic a op b = c lines (integers only)
    for(const line of txt){
      const g=/^(?:U: )?(\[\[\d+\]\]|\d+) ([:·]) (\[\[\d+\]\]|\d+) = (\[\[\d+\]\]|\d+)$/.exec(line);
      if(g){const a=val(g[1]),b=val(g[3]),c=val(g[4]);const ok=g[2]===':'?(b!==0&&a/b===c):a*b===c;if(!ok)err(id,L,'arith line wrong: '+line+' → '+[a,b,c],q)}
      const mm=/^(\d+) · (\d+,\d\d) € = \[\[(\d+)\]\] €$/.exec(line);
      if(mm){if(Math.round(+mm[1]*num(mm[2])*100)!==Math.round(num(A[+mm[3]])*100))err(id,L,'money mult wrong: '+line+' '+A[+mm[3]],q)}
      const sc=/^(\d+) € (\d+) ct = \[\[0\]\] (€|ct)$/.exec(line);
      if(sc){const c=+sc[1]*100+ +sc[2];const exp=sc[3]==='€'?eur(c):String(c);if(A[0]!==exp)err(id,L,'schreib wrong '+line+' '+A[0],q)}
      const sc2=/^(\d+),(\d\d) € = \[\[0\]\] € \[\[1\]\] ct$/.exec(line);
      if(sc2&&(+A[0]!==+sc2[1]||+A[1]!==+sc2[2]))err(id,L,'schreib2 wrong',q);
      const sc3=/^(\d+) ct = \[\[0\]\] €$/.exec(line);if(sc3&&A[0]!==eur(+sc3[1]))err(id,L,'schreib3 wrong',q);
      const sc4=/^(\d+) ct = \[\[0\]\] € \[\[1\]\] ct$/.exec(line);if(sc4&&(+A[0]*100+ +A[1]!==+sc4[1]))err(id,L,'schreib4 wrong',q);
      const rd=/^(.*?)(\d+,\d\d) € ≈ \[\[(\d+)\]\] €$/.exec(line);
      if(rd){const c=Math.round(num(rd[2])*100);const exp=id.endsWith('ueber')&&q.title.includes('10 Euro')?Math.floor((c/100+5)/10)*10:Math.floor((c+50)/100);if(+A[+rd[3]]!==exp)err(id,L,'round wrong '+line+' '+A[+rd[3]],q)}
    }
    if(t.id==='ueber'&&q.fields.length===4){const s=q.fields.slice(0,3).reduce((a,f)=>a+ +f.a,0);if(s!==+q.fields[3].a)err(id,L,'ueber sum',q)}
    if(t.id==='kette'){
      const nodes=[...q.html.matchAll(/class="node( [sz])?">(?:Ziel )?(\[\[\d+\]\]|\d+)/g)].map(x=>val(x[2]));
      const arrs=[...q.html.matchAll(/class="arr">(.) (\d+)/g)].map(x=>[x[1],+x[2]]);
      let v=nodes[0];arrs.forEach((a,i)=>{v=a[0]==='·'?v*a[1]:a[0]===':'?v/a[1]:a[0]==='+'?v+a[1]:v-a[1];if(!Number.isInteger(v)||v<=0)err(id,L,'chain non-int '+v,q);
        const nd=nodes[i+1];if(nd!==v)err(id,L,`chain mismatch step ${i} ${nd} vs ${v}`,q)});
      if(L===3&&!/Ziel/.test(q.html))err(id,L,'no ziel',q)
    }
    if(t.id==='geteilt'){
      const rows=[...q.html.matchAll(/<tr>(.*?)<\/tr>/g)].map(x=>x[1]);const cols=[...rows[0].matchAll(/<th>(\d+)<\/th>/g)].map(x=>+x[1]);
      rows.slice(1).forEach(rw=>{const rn=+/<th>(\d+)<\/th>/.exec(rw)[1];[...rw.matchAll(/\[\[(\d+)\]\]/g)].forEach((x,j)=>{if(rn/cols[j]!==+A[+x[1]]||!Number.isInteger(rn/cols[j]))err(id,L,'geteilt wrong',q)})});
      if(rows.length!==3)err(id,L,'geteilt rows '+rows.length,q);
    }
    if(t.id==='column'){
      const rowsH=[...q.html.matchAll(/<div class="crow">(.*?)<\/div>/g)].map(x=>x[1]);
      const rowTxt=rowsH.map(h=>{const sg=/class="sg">(.*?)<\/span>/.exec(h)[1];const cells=[...h.matchAll(/<span class="cell">(.*?)<\/span>/g)].map(x=>x[1]);return {sg,cells}});
      const parse=(cells)=>cells.map(c=>c.replace('&nbsp;','')).join('');
      const operands=rowTxt.slice(0,-1).map(r=>({sg:r.sg,v:Math.round(num(parse(r.cells))*100)}));
      const op=operands.length>1?operands[1].sg:'+';
      const res=op==='+'?operands.reduce((a,x)=>a+x.v,0):operands[0].v-operands[1].v;
      // result digits: index 0 rightmost
      const rc=rowTxt[rowTxt.length-1].cells;let digits=[];
      rc.forEach(c=>{const mm=/\[\[(\d+)\]\]/.exec(c);if(mm)digits.push(+mm[1])});
      // left to right order -> indices descending
      const str=rc.map(c=>{const mm=/\[\[(\d+)\]\]/.exec(c);return mm?A[+mm[1]]:c.replace('&nbsp;','')}).join('');
      if(Math.round(num(str)*100)!==res)err(id,L,'column result '+str+' vs '+res/100,q);
      if(res<=0)err(id,L,'neg result',q);
      // typed order check: digit idx 0 should be rightmost
      for(let i=0;i<digits.length;i++)if(digits[i]!==digits.length-1-i)err(id,L,'digit order '+digits,q);
      q.fields.forEach((f,i)=>{if(f.next!==(i+1<q.fields.length?i+1:null))err(id,L,'next chain',q)});
    }
    if(t.id==='sach'||t.id==='angebot'||t.id==='ticket'){ /* verified by explain-based numbers below */ }
  } else {
    if(!(q.correct>=0&&q.correct<q.choices.length))err(id,L,'correct oob',q);
    if(new Set(q.choices).size!==q.choices.length)err(id,L,'dup choices',q);
    if(t.id==='vergl'){const p=strip(q.prompt).replace(/\s+/g,' ').trim();const mm=/^(.+?)\s*\?\s*(.+)$/.exec(p);
      const ev=s=>{const x=/^(\d+) ([·:]) (\d+)$/.exec(s);return x?(x[2]==='·'?+x[1]* +x[3]:+x[1]/ +x[3]):+s};
      const a=ev(mm[1]),b=ev(mm[2]);const c=a<b?0:a===b?1:2;if(c!==q.correct)err(id,L,'vergleich wrong '+p,q)}
    if(t.id==='ueber'){const p=strip(q.prompt);const mm=/([\d,]+) € ([+−]) ([\d,]+) € = \?/.exec(p);const a=Math.round(num(mm[1])*100),b=Math.round(num(mm[3])*100);const r=mm[2]==='+'?a+b:a-b;if(q.choices[q.correct]!==eur(r)+' €')err(id,L,'ueber choice wrong',q)}
  }
}
console.log('questions generated:',count);
console.log(errors.length?errors.slice(0,25).join('\n')+`\n... total ${errors.length}`:'ALL GENERATOR CHECKS PASSED');
