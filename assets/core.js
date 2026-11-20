/* Математика · 7 класс — общий движок: формулы, одночлены/многочлены, пошаговые разборы, тренажёр, тест. */
(function(){
"use strict";
const S = window.S = {};
const SUPD = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
S.reduce = reduce;
S.$ = id => document.getElementById(id);
S.num = x => String(x).replace('.', ',');

/* ---------- запись формул: латинские буквы курсивом, ^n — степень ---------- */
const tex = s => s.replace(/([a-z])/g,'<i>$1</i>').replace(/\^\{([^}]*)\}/g,'<sup>$1</sup>').replace(/\^(−?\d+)/g,'<sup>$1</sup>').replace(/\^(−?)<i>([a-z])<\/i>/g,'<sup>$1<i>$2</i></sup>');
S.tex = tex;
S.math = root => (root||document).querySelectorAll('.m:not([data-m])').forEach(el=>{ el.innerHTML = tex(el.textContent); el.setAttribute('data-m','1'); });

/* ---------- одночлены и многочлены ---------- */
function mono(c,v){ const o={}; for(const k in (v||{})) if(v[k]) o[k]=v[k]; return {c, v:o}; }
const mkey = m => Object.keys(m.v).sort().map(l=>l+m.v[l]).join('');
const deg = m => { let d=0; for(const k in m.v) d+=m.v[k]; return d; };
function mmul(a,b){ const v={...a.v}; for(const k in b.v) v[k]=(v[k]||0)+b.v[k]; return mono(a.c*b.c,v); }
function mdiv(a,b){ const v={...a.v}; for(const k in b.v) v[k]=(v[k]||0)-b.v[k]; return mono(a.c/b.c,v); }
function cmp(a,b){
  const d=deg(b)-deg(a); if(d) return d;
  const L=[...new Set([...Object.keys(a.v),...Object.keys(b.v)])].sort();
  for(const l of L){ const x=(b.v[l]||0)-(a.v[l]||0); if(x) return x; }
  return 0;
}
const pmul = (P,Q) => { const r=[]; P.forEach(p=>Q.forEach(q=>r.push(mmul(p,q)))); return r; };
function pcomb(P){
  const order=[], map=new Map();
  P.forEach(t=>{ const k=mkey(t); if(!map.has(k)){ map.set(k,{c:0,v:t.v}); order.push(k); } map.get(k).c+=t.c; });
  return order.map(k=>mono(map.get(k).c,map.get(k).v)).filter(m=>m.c!==0);
}
const psort = P => [...P].sort(cmp);
const pneg = P => P.map(m=>mono(-m.c,m.v));
const gcd = (a,b) => { a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a; };
function pgcd(P){ // общий множитель (коэффициент > 0)
  let g=0; P.forEach(t=>g=gcd(g,t.c));
  const v={}; const L=Object.keys(P[0].v);
  L.forEach(l=>{ let e=Infinity; P.forEach(t=>{ e=Math.min(e,t.v[l]||0); }); if(e>0&&e!==Infinity) v[l]=e; });
  return mono(g||1,v);
}
Object.assign(S,{mono,mkey,deg,mmul,mdiv,pmul,pcomb,psort,pneg,gcd,pgcd,cmp});

const pw = (l,e) => '<i>'+l+'</i>'+(e>1?'<sup>'+e+'</sup>':'');
function body(m){ const vs=Object.keys(m.v).sort().map(l=>pw(l,m.v[l])).join(''); const a=Math.abs(m.c); return (a===1&&vs?'':String(a))+vs; }
const mh = m => (m.c<0?'−':'')+body(m);
const mp = m => m.c<0 ? '('+mh(m)+')' : mh(m);
function divH(m){ const ks=Object.keys(m.v); const simple = m.c===1 && ks.length===1 && m.v[ks[0]]===1; return simple ? mh(m) : '('+mh(m)+')'; }
const OP = s => '<span class="op">'+s+'</span>';
const th = (m,first) => first ? mh(m) : OP(m.c<0?'−':'+')+body(m);
const polyH = P => P.length ? P.map((m,i)=>th(m,i===0)).join('') : '0';
const polyP = P => P.length>1 ? '('+polyH(P)+')' : mp(P[0]);
function sq(m){ // запись (m)²
  const ks=Object.keys(m.v); const simple = (m.c===1 && ks.length===1 && m.v[ks[0]]===1) || (!ks.length && m.c>0);
  return simple ? mh(m)+'<sup>2</sup>' : '('+mh(m)+')<sup>2</sup>';
}
function plural(n,f){ f=f||['член','члена','членов']; const d=n%10, h=n%100; if(d===1&&h!==11) return f[0]; if(d>=2&&d<=4&&(h<10||h>=20)) return f[1]; return f[2]; }
Object.assign(S,{pw,body,mh,mp,divH,OP,th,polyH,polyP,sq,plural});

/* ---------- разбор ввода ---------- */
const CYR = {'а':'a','с':'c','х':'x','у':'y','о':'o','р':'p','е':'e'};
function normalize(s){
  s = [...String(s).toLowerCase()].map(ch=>CYR[ch]||ch).join('');
  s = s.replace(/[−–—]/g,'-').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m=>'^'+[...m].map(c=>SUPD.indexOf(c)).join(''));
  return s.replace(/[\s*·⋅]/g,'');
}
function parsePoly(raw){
  const s = normalize(raw);
  if(!s) return {err:'Сначала впиши ответ.'};
  if(/[а-яё]/.test(s)) return {err:'Похоже, включена русская раскладка. Переключи на английскую: переменные пишутся латинскими буквами.'};
  if(/[()]/.test(s)) return {err:'Запиши ответ без скобок, многочленом стандартного вида.'};
  if(/[\/:]/.test(s)) return {err:'Дробей в ответе не бывает: все числа здесь целые. Проверь вычисления.'};
  if(/[^0-9a-z^+\-]/.test(s)) return {err:'В ответе есть лишний символ. Набирай ответ кнопками под строкой ввода.'};
  const parts = s.match(/[+-]?[^+-]+/g) || [];
  if(parts.join('')!==s) return {err:'Проверь знаки: два знака подряд или знак в конце.'};
  const terms=[];
  for(const p of parts){
    const mt = p.match(/^([+-]?)(\d*)((?:[a-z](?:\^\d+)?)*)$/);
    if(!mt || (!mt[2] && !mt[3])) return {err:'Не получилось прочитать «'+p+'». Число ставь перед буквами, а степень набирай кнопкой «степень».'};
    let c = mt[2] ? parseInt(mt[2],10) : 1; if(mt[1]==='-') c=-c;
    const v={}; mt[3].replace(/([a-z])(?:\^(\d+))?/g,(_,l,e)=>{ v[l]=(v[l]||0)+(e?parseInt(e,10):1); return ''; });
    terms.push(mono(c,v));
  }
  return {terms};
}
function parseProduct(raw){
  const s = normalize(raw);
  if(!s) return {err:'Сначала впиши ответ.'};
  if(/[а-яё]/.test(s)) return {err:'Похоже, включена русская раскладка. Переключи на английскую.'};
  if(/[^0-9a-z^+\-()]/.test(s)) return {err:'В ответе есть лишний символ. Набирай ответ кнопками.'};
  const factors=[]; let i=0, sign=1;
  if(s[0]==='-'){ sign=-1; i=1; } else if(s[0]==='+') i=1;
  while(i<s.length){
    if(s[i]==='('){
      const j=s.indexOf(')',i); if(j<0) return {err:'Не хватает закрывающей скобки.'};
      const inner=s.slice(i+1,j); if(inner.includes('(')) return {err:'Скобки внутри скобок здесь не нужны.'};
      const r=parsePoly(inner); if(r.err) return {err:'В скобках: '+r.err};
      i=j+1; let e=1; const m=s.slice(i).match(/^\^(\d+)/); if(m){ e=+m[1]; i+=m[0].length; }
      for(let t=0;t<e;t++) factors.push({poly:r.terms});
    } else {
      const m=s.slice(i).match(/^(\d*)((?:[a-z](?:\^\d+)?)*)/);
      if(!m || !m[0]){
        if(s[i]==='+'||s[i]==='-') return {err:'Ответ должен быть произведением: «+» и «−» ставятся только внутри скобок.'};
        if(s[i]===')') return {err:'Лишняя закрывающая скобка.'};
        return {err:'Не получилось прочитать ответ.'};
      }
      factors.push({mono:parsePoly(m[0]).terms[0]}); i+=m[0].length;
    }
  }
  if(!factors.length) return {err:'Сначала впиши ответ.'};
  return {sign, factors};
}
function expand(pr){ let cur=[mono(pr.sign,{})]; pr.factors.forEach(f=>{ cur=pmul(cur, f.poly||[f.mono]); }); return pcomb(cur); }
function prodH(pr){ return (pr.sign<0?'−':'')+pr.factors.map(f=>f.poly?'('+polyH(f.poly)+')':mh(f.mono)).join(''); }
function canon(terms){ const m=new Map(); for(const t of terms){ const k=mkey(t); m.set(k,(m.get(k)||0)+t.c); } for(const [k,v] of [...m]) if(v===0) m.delete(k); return m; }
function sameC(U,E){ if(U.size!==E.size) return false; for(const [k,v] of E) if(U.get(k)!==v) return false; return true; }
const T = s => parsePoly(s).terms;
const T1 = s => parsePoly(s).terms[0];
Object.assign(S,{normalize,parsePoly,parseProduct,expand,prodH,canon,sameC,T,T1});

/* ---------- пояснения к действию с одночленами ---------- */
function signPhrase(a,b){ return a ? (b?'минус на минус — плюс':'минус на плюс — минус') : (b?'плюс на минус — минус':'плюс на плюс — плюс'); }
function whyRows(A,B,R,op){
  const sym = op==='div'?':':'·';
  const rows=[['Знак', signPhrase(A.c<0,B.c<0)]];
  const a=Math.abs(A.c), b=Math.abs(B.c), r=Math.abs(R.c);
  const hid = (a===1&&Object.keys(A.v).length)||(b===1&&Object.keys(B.v).length);
  rows.push(['Числа','<span class="x">'+a+' '+sym+' '+b+' = '+r+'</span>'+(hid?' <span class="note">(если перед буквами нет числа, там стоит 1)</span>':'')]);
  [...new Set([...Object.keys(A.v),...Object.keys(B.v)])].sort().forEach(l=>{
    const ea=A.v[l]||0, eb=B.v[l]||0; let s;
    if(op!=='div'){
      s = (ea&&eb) ? '<span class="x">'+pw(l,ea)+' · '+pw(l,eb)+' = '+pw(l,ea+eb)+'</span> <span class="note">(показатели складываем: '+ea+' + '+eb+' = '+(ea+eb)+')</span>'
                   : '<span class="x">'+pw(l,ea||eb)+'</span> есть только в одном множителе, переписываем';
    } else {
      if(eb===0) s='<span class="x">'+pw(l,ea)+'</span>: в делителе нет <i>'+l+'</i>, переписываем';
      else if(ea===eb) s='<span class="x">'+pw(l,ea)+' : '+pw(l,eb)+' = 1</span>, буква <i>'+l+'</i> сокращается';
      else s='<span class="x">'+pw(l,ea)+' : '+pw(l,eb)+' = '+pw(l,ea-eb)+'</span> <span class="note">(показатели вычитаем: '+ea+' − '+eb+' = '+(ea-eb)+')</span>';
    }
    rows.push(['<i class="x">'+l+'</i>', s]);
  });
  if(op==='div' && !Object.keys(R.v).length) rows.push(['Итог','осталось только число <span class="x">'+mh(R)+'</span>. Писать 0 нельзя: член не пропадает.']);
  return '<dl class="why">'+rows.map(([t,d])=>'<dt>'+t+'</dt><dd>'+d+'</dd>').join('')+'</dl>';
}
S.whyRows = whyRows;
const dl = rows => '<dl class="why">'+rows.map(([t,d])=>'<dt>'+t+'</dt><dd>'+d+'</dd>').join('')+'</dl>';
S.dl = dl;

/* ---------- доска пошагового разбора со стрелками ---------- */
S.board = function(root){
  root.classList.add('board');
  root.innerHTML='<div class="bscroll"><div class="bin"><svg class="arrows" aria-hidden="true"></svg><div class="bcontent"></div></div></div>'+
    '<div class="detail" aria-live="polite"></div>'+
    '<div class="ctrl"><button type="button" class="btn ghost prev">← Назад</button><span class="count"></span><button type="button" class="btn next">Дальше →</button></div>';
  const q=s=>root.querySelector(s);
  const bin=q('.bin'), svg=q('.arrows'), content=q('.bcontent'), detail=q('.detail'), prev=q('.prev'), next=q('.next'), count=q('.count');
  let steps=[], k=0;
  function arrows(anim){
    const st=steps[k]; const list=(st&&st.arrows)||[];
    const box=bin.getBoundingClientRect();
    svg.setAttribute('width',box.width); svg.setAttribute('height',box.height); svg.setAttribute('viewBox','0 0 '+box.width+' '+box.height);
    let out='';
    list.forEach(a=>{
      const A=content.querySelector('[data-id="'+a.a+'"]'), B=content.querySelector('[data-id="'+a.b+'"]'); if(!A||!B) return;
      const ra=A.getBoundingClientRect(), rb=B.getBoundingClientRect();
      const below=!!a.below, dir=below?1:-1;
      const sx=ra.left-box.left+ra.width/2+(a.off||0), tx=rb.left-box.left+rb.width/2;
      const y0 = below ? Math.max(ra.bottom,rb.bottom)-box.top-3 : Math.min(ra.top,rb.top)-box.top+5;
      const h=Math.min(38,14+Math.abs(tx-sx)*0.2), mx=(sx+tx)/2, my=y0+dir*2*h;
      const ang=Math.atan2(y0-my,tx-mx), L=8, w=0.45;
      const p1=(tx-L*Math.cos(ang-w)).toFixed(1)+','+(y0-L*Math.sin(ang-w)).toFixed(1);
      const p2=(tx-L*Math.cos(ang+w)).toFixed(1)+','+(y0-L*Math.sin(ang+w)).toFixed(1);
      const an = a.cur && anim && !reduce;
      out+='<g class="arr k'+(a.k||0)+(a.cur?' cur':'')+(an?' anim':'')+'"><path pathLength="1" d="M'+sx.toFixed(1)+' '+y0.toFixed(1)+' Q'+mx.toFixed(1)+' '+my.toFixed(1)+' '+tx.toFixed(1)+' '+y0.toFixed(1)+'"/><polygon points="'+tx.toFixed(1)+','+y0.toFixed(1)+' '+p1+' '+p2+'"/></g>';
    });
    svg.innerHTML=out;
  }
  function render(anim){
    const st=steps[k], last=steps.length-1;
    content.innerHTML=st.html; detail.innerHTML=st.note||'';
    prev.disabled = k===0;
    next.textContent = k===last ? 'Сначала ↺' : 'Дальше →';
    count.textContent = st.label || (k===0 ? 'Условие' : (k===last ? 'Ответ' : 'Шаг '+k+' из '+(last-1)));
    arrows(anim);
  }
  prev.addEventListener('click',()=>{ if(steps.length && k>0){ k--; render(false); } });
  next.addEventListener('click',()=>{ if(!steps.length) return; if(k<steps.length-1){ k++; render(true); } else { k=0; render(false); } });
  if(window.ResizeObserver) new ResizeObserver(()=>{ if(steps.length) arrows(false); }).observe(bin);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(()=>{ if(steps.length) arrows(false); });
  const api={ load(s){ steps=s; k=0;
    bin.classList.toggle('pa', s.some(x=>(x.arrows||[]).some(a=>!a.below)));
    bin.classList.toggle('pb', s.some(x=>(x.arrows||[]).some(a=>a.below)));
    render(false); return api; } };
  return api;
};
/* вкладки с примерами над доской */
S.tabsBoard = function(tabsEl, boardEl, list, toSteps, labelOf){
  const b=S.board(boardEl);
  list.forEach((t,i)=>{
    const btn=document.createElement('button'); btn.type='button'; btn.className='tab'; btn.innerHTML=labelOf(t);
    btn.setAttribute('aria-pressed', i===0?'true':'false');
    btn.addEventListener('click',()=>{ tabsEl.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-pressed','false')); btn.setAttribute('aria-pressed','true'); b.load(toSteps(t)); });
    tabsEl.appendChild(btn);
  });
  b.load(toSteps(list[0]));
  return b;
};

/* ---------- генераторы шагов ---------- */
// одночлен × многочлен  /  многочлен : одночлен
S.monoPolyExpr = function(t, cls){
  const {op,M,P}=t, side=t.side||'left';
  cls = cls || (()=>'');
  const terms=P.map((p,i)=>'<span class="tm k'+(i%4)+' '+cls(i)+'" data-id="t'+i+'">'+th(p,i===0)+'</span>').join('');
  if(op==='div') return '('+terms+')'+OP(':')+'<span class="src" data-id="s">'+divH(M)+'</span>';
  if(side==='left') return '<span class="src" data-id="s">'+mh(M)+'</span>('+terms+')';
  return '('+terms+')'+OP('·')+'<span class="src" data-id="s">'+mp(M)+'</span>';
};
S.stepsMonoPoly = function(t){
  const {op,M,P}=t, side=t.side||'left', n=P.length;
  const pairs=P.map(p=> op==='div' ? [p,M] : (side==='left'?[M,p]:[p,M]));
  const R=pairs.map(([a,b])=> op==='div'?mdiv(a,b):mmul(a,b));
  const st=(i,k,fade)=> k>n ? 'done' : (i===k-1 ? 'on' : (i<k-1 ? 'done' : (fade?'off':'')));
  const list=P.map((p,i)=>'<span class="math k'+(i%4)+' kt">'+mh(p)+'</span>').join(', ');
  const steps=[];
  for(let k=0;k<=n+1;k++){
    const prods=P.map((p,i)=>{
      let s;
      if(op==='mul'&&side==='left') s=(i?OP('+'):'')+(i?mp(M):mh(M))+OP('·')+mp(p);
      else { const j=i?OP(p.c<0?'−':'+'):(p.c<0?'−':''); s=j+body(p)+OP(op==='div'?':':'·')+(op==='div'?divH(M):mp(M)); }
      return '<span class="pr k'+(i%4)+' '+st(i,k,true)+'">'+s+'</span>';
    }).join('');
    const res=R.map((r,i)=>'<span class="rs k'+(i%4)+' '+st(i,k,true)+'">'+th(r,i===0)+'</span>').join('');
    const html='<div class="bl main">'+S.monoPolyExpr(t,i=>st(i,k,false))+'</div><div class="bl"><span class="eq">=</span>'+prods+'</div><div class="bl res"><span class="eq">=</span>'+res+'</div>';
    let note;
    if(k===0) note = op==='mul'
      ? '<p>Умножаем одночлен <span class="math src">'+mh(M)+'</span> на каждый член многочлена. Членов '+n+': '+list+'. Каждый берём вместе с его знаком. Нажимай «Дальше».</p>'
      : '<p>Делим каждый член многочлена на одночлен <span class="math src">'+mh(M)+'</span>. Членов '+n+': '+list+'. Значит, в ответе тоже будет '+n+' '+plural(n)+'. Нажимай «Дальше».</p>';
    else if(k<=n){ const i=k-1, [A,B]=pairs[i];
      note='<div class="dhead">Член <span class="math k'+(i%4)+' kt">'+mh(P[i])+'</span></div><div class="deq k'+(i%4)+'">'+mh(A)+OP(op==='div'?':':'·')+(op==='div'?divH(B):mp(B))+' = <span class="strong">'+mh(R[i])+'</span></div>'+whyRows(A,B,R[i],op);
    } else note = '<div class="deq"><b>Ответ:</b> <span class="math">'+polyH(R)+'</span></div>'+(op==='mul'
      ? '<p>Произведения сложили. Подобных членов среди них нет. В многочлене было '+n+' '+plural(n)+', в ответе тоже '+n+'.</p>'
      : '<p>Проверка умножением: <span class="math">'+polyP(R)+' · '+mp(M)+' = '+polyH(P)+'</span> ✓</p>');
    const arrows=[]; for(let i=0;i<Math.min(k,n);i++) arrows.push({a:'s',b:'t'+i,k:i%4,cur:i===k-1&&k<=n,off:(i-(n-1)/2)*5});
    steps.push({html,note,arrows});
  }
  return steps;
};
// многочлен × многочлен
S.stepsPolyPoly = function(P,Q){
  const m=P.length, n=Q.length, N=m*n;
  const prod=[]; P.forEach((p,i)=>Q.forEach((q,j)=>prod.push({i,j,r:mmul(p,q)})));
  const comb=pcomb(prod.map(x=>x.r));
  const cnt=new Map(); prod.forEach(x=>{ const k=mkey(x.r); cnt.set(k,(cnt.get(k)||0)+1); });
  const gidx=new Map(); let g=0; prod.forEach(x=>{ const k=mkey(x.r); if(cnt.get(k)>1 && !gidx.has(k)) gidx.set(k,g++); });
  const expr=(ci,cj)=>{
    const ps=P.map((p,i)=>'<span class="tm k'+(i%4)+' '+(i===ci?'on':'')+'" data-id="p'+i+'">'+th(p,i===0)+'</span>').join('');
    const qs=Q.map((q,j)=>'<span class="tm '+(ci>=0&&j<=cj?'k'+(ci%4)+' '+(j===cj?'on':'done'):'')+'" data-id="q'+j+'">'+th(q,j===0)+'</span>').join('');
    return '('+ps+')('+qs+')';
  };
  const steps=[];
  const intro='<p>Умножаем <b>каждый</b> член первого многочлена на <b>каждый</b> член второго. Получится '+m+' · '+n+' = '+N+' '+plural(N,['произведение','произведения','произведений'])+'. Потом приводим подобные.</p>';
  for(let s=0;s<=N;s++){
    const line=prod.map((x,t)=>'<span class="pr k'+(x.i%4)+' '+(t<s?(t===s-1?'on':'done'):'off')+'">'+th(x.r,t===0)+'</span>').join('');
    let html, note, arrows=[];
    if(s===0){ html='<div class="bl main">'+expr(-1,-1)+'</div><div class="bl"><span class="eq">=</span>'+line+'</div>'; note=intro; }
    else { const x=prod[s-1];
      html='<div class="bl main">'+expr(x.i,x.j)+'</div><div class="bl"><span class="eq">=</span>'+line+'</div>';
      for(let j=0;j<=x.j;j++) arrows.push({a:'p'+x.i,b:'q'+j,k:x.i%4,cur:j===x.j,below:x.i%2===1,off:(j-(n-1)/2)*4});
      note='<div class="dhead">Произведение '+s+' из '+N+'</div><div class="deq k'+(x.i%4)+'">'+mp(P[x.i])+' · '+mp(Q[x.j])+' = <span class="strong">'+mh(x.r)+'</span></div>'+whyRows(P[x.i],Q[x.j],x.r,'mul');
    }
    steps.push({html,note,arrows});
  }
  const grouped=prod.map((x,t)=>{ const k=mkey(x.r); return '<span class="pr '+(gidx.has(k)?'ul k'+(gidx.get(k)%4):'')+'">'+th(x.r,t===0)+'</span>'; }).join('');
  if(gidx.size){
    const rows=[...gidx.keys()].map(k=>{ const terms=prod.filter(x=>mkey(x.r)===k).map(x=>x.r); const sum=pcomb(terms);
      return '<span class="math k'+(gidx.get(k)%4)+' kt">'+polyH(terms)+' = '+(sum.length?mh(sum[0]):'0')+'</span>'; });
    steps.push({html:'<div class="bl main">'+expr(-1,-1)+'</div><div class="bl"><span class="eq">=</span>'+grouped+'</div><div class="bl res"><span class="eq">=</span>'+polyH(comb)+'</div>',
      note:'<div class="dhead">Приводим подобные</div><p>Подобные члены подчёркнуты одним цветом:</p><ul class="plain">'+rows.map(r=>'<li>'+r+'</li>').join('')+'</ul>', label:'Подобные'});
  }
  steps.push({html:'<div class="bl main">'+expr(-1,-1)+'</div><div class="bl"><span class="eq">=</span>'+grouped+'</div><div class="bl res"><span class="eq">=</span>'+polyH(comb)+'</div>',
    note:'<div class="deq"><b>Ответ:</b> <span class="math">'+polyH(comb)+'</span></div>'+(gidx.size?'':'<p>Подобных членов не было, поэтому все '+N+' '+plural(N,['произведение','произведения','произведений'])+' остались в ответе.</p>')});
  return steps;
};
// (a ± b)²
S.stepsSquare = function(a,b,sign){
  const A2=mmul(a,a), AB2=mmul(mono(2*sign,{}),mmul(a,b)), B2=mmul(b,b);
  const s=sign>0?'+':'−';
  const ea='<span class="hlk k0" data-id="a">'+mh(a)+'</span>', eb='<span class="hlk k1" data-id="b">'+mh(b)+'</span>';
  const head='<div class="bl main">('+ea+OP(s)+eb+')<sup>2</sup></div>';
  const pat='<div class="bl"><span class="eq">=</span><span class="k0 kt">'+sq(a)+'</span>'+OP(s)+'2 · <span class="k0 kt">'+mp(a)+'</span> · <span class="k1 kt">'+mp(b)+'</span>'+OP('+')+'<span class="k1 kt">'+sq(b)+'</span></div>';
  const piece=(k)=>{
    const parts=[['k0',mh(A2),true],['k2',th(AB2,false),true],['k1',th(B2,false),true]];
    return '<div class="bl res"><span class="eq">=</span>'+parts.map((p,i)=>'<span class="rs '+p[0]+' '+(i<k?(i===k-1?'on':'done'):'off')+'">'+(i===0?mh(A2):p[1])+'</span>').join('')+'</div>';
  };
  const word = sign>0 ? 'квадрат суммы' : 'квадрат разности';
  const coefSq = m => { const parts=['<span class="x">'+Math.abs(m.c)+'<sup>2</sup> = '+(m.c*m.c)+'</span>']; Object.keys(m.v).sort().forEach(l=>parts.push('<span class="x">('+pw(l,m.v[l])+')<sup>2</sup> = '+pw(l,2*m.v[l])+'</span> <span class="note">(показатель умножаем на 2)</span>')); return parts; };
  const steps=[
    {html:head+pat.replace('class="bl"','class="bl off"')+piece(0), note:'<p>Это '+word+'. Первое выражение <span class="math hlk k0">'+mh(a)+'</span>, второе <span class="math hlk k1">'+mh(b)+'</span>.</p><p class="note">Формула: (<i>a</i> '+s+' <i>b</i>)<sup>2</sup> = <i>a</i><sup>2</sup> '+s+' 2<i>ab</i> + <i>b</i><sup>2</sup>.</p>'},
    {html:head+pat+piece(0), note:'<div class="dhead">Подставляем в формулу</div><p>Квадрат первого '+(sign>0?'плюс':'минус')+' удвоенное произведение первого и второго плюс квадрат второго.</p>'},
    {html:head+pat+piece(1), note:'<div class="dhead">Квадрат первого</div><div class="deq">'+sq(a)+' = <span class="k0 kt"><b>'+mh(A2)+'</b></span></div>'+dl(coefSq(a).map((p,i)=>[i?'буква':'число',p]))},
    {html:head+pat+piece(2), note:'<div class="dhead">Удвоенное произведение</div><div class="deq">'+(sign>0?'':'−')+'2 · '+mp(a)+' · '+mp(b)+' = <span class="k2 kt"><b>'+mh(AB2)+'</b></span></div>'+dl([['числа','<span class="x">2 · '+Math.abs(a.c)+' · '+Math.abs(b.c)+' = '+Math.abs(AB2.c)+'</span>'],['знак',sign>0?(a.c*b.c>0?'плюс':'минус: одно из выражений отрицательное'):(a.c*b.c>0?'минус, как в формуле':'плюс: минус на минус')]])},
    {html:head+pat+piece(3), note:'<div class="dhead">Квадрат второго</div><div class="deq">'+sq(b)+' = <span class="k1 kt"><b>'+mh(B2)+'</b></span></div><p class="note">Квадрат всегда со знаком «плюс».</p>'},
    {html:head+pat+piece(3), note:'<div class="deq"><b>Ответ:</b> <span class="math">'+polyH([A2,AB2,B2])+'</span></div><p>Получилось три члена. Частая ошибка — забыть удвоенное произведение.</p>'}
  ];
  return steps;
};
// (a − b)(a + b)
S.stepsDiffSq = function(a,b,order){
  const A2=mmul(a,a), B2=mmul(b,b);
  const ea=id=>'<span class="hlk k0" data-id="'+id+'">'+mh(a)+'</span>', eb=id=>'<span class="hlk k1" data-id="'+id+'">'+mh(b)+'</span>';
  const f1='('+ea('a1')+OP('−')+eb('b1')+')', f2='('+ea('a2')+OP('+')+eb('b2')+')';
  const head='<div class="bl main">'+(order?f2+f1:f1+f2)+'</div>';
  const pat='<div class="bl"><span class="eq">=</span><span class="k0 kt">'+sq(a)+'</span>'+OP('−')+'<span class="k1 kt">'+sq(b)+'</span></div>';
  const res='<div class="bl res"><span class="eq">=</span><span class="k0 kt">'+mh(A2)+'</span>'+OP('−')+'<span class="k1 kt">'+body(B2)+'</span></div>';
  const ab=mmul(a,b);
  return [
    {html:head+pat.replace('class="bl"','class="bl off"')+res.replace('class="bl res"','class="bl res off"'), note:'<p>Это произведение <b>разности</b> и <b>суммы</b> одних и тех же выражений: <span class="math hlk k0">'+mh(a)+'</span> и <span class="math hlk k1">'+mh(b)+'</span>.</p><p class="note">Формула: (<i>a</i> − <i>b</i>)(<i>a</i> + <i>b</i>) = <i>a</i><sup>2</sup> − <i>b</i><sup>2</sup>.</p>'},
    {html:head+pat+res.replace('class="bl res"','class="bl res off"'), note:'<div class="dhead">По формуле</div><p>Квадрат первого выражения минус квадрат второго.</p>'},
    {html:head+pat+res, note:'<div class="dhead">Считаем квадраты</div><div class="deq">'+sq(a)+' = <span class="k0 kt"><b>'+mh(A2)+'</b></span>;  '+sq(b)+' = <span class="k1 kt"><b>'+mh(B2)+'</b></span></div>'},
    {html:head+pat+res, note:'<div class="dhead">Почему так</div><p>Если умножить по правилу, средние члены сократятся:</p><div class="deq">'+mh(A2)+OP('+')+'<span class="strike">'+body(ab)+'</span>'+OP('−')+'<span class="strike">'+body(ab)+'</span>'+OP('−')+body(B2)+' = '+mh(A2)+OP('−')+body(B2)+'</div>', label:'Проверка'},
    {html:head+pat+res, note:'<div class="deq"><b>Ответ:</b> <span class="math">'+mh(A2)+OP('−')+body(B2)+'</span></div>'}
  ];
};
// вынесение общего множителя
S.stepsGcd = function(P){
  const G=pgcd(P); const lead = P[0].c<0;
  const F = lead ? mono(-G.c,G.v) : G;
  const Q = P.map(t=>mdiv(t,F));
  const coefs=P.map(t=>Math.abs(t.c));
  const letters=Object.keys(P[0].v).sort().filter(l=>P.every(t=>t.v[l]));
  const head=k=>'<div class="bl main">'+P.map((p,i)=>'<span class="tm k'+(i%4)+' '+(k>=3?'done':'')+'" data-id="t'+i+'">'+th(p,i===0)+'</span>').join('')+'</div>';
  const res=k=>'<div class="bl res '+(k<3?'off':'')+'"><span class="eq">=</span><span class="src" data-id="s">'+mh(F)+'</span>('+Q.map((q,i)=>'<span class="rs k'+(i%4)+' '+(k>=4?'done':'off')+'">'+th(q,i===0)+'</span>').join('')+')</div>';
  const rows=letters.map(l=>['<i class="x">'+l+'</i>','есть во всех членах; наименьший показатель '+Math.min(...P.map(t=>t.v[l]))+' → <span class="x">'+pw(l,Math.min(...P.map(t=>t.v[l])))+'</span>']);
  const notAll=[...new Set(P.flatMap(t=>Object.keys(t.v)))].sort().filter(l=>!letters.includes(l));
  notAll.forEach(l=>rows.push(['<i class="x">'+l+'</i>','есть не во всех членах — в общий множитель не входит']));
  const arrows=P.map((p,i)=>({a:'s',b:'t'+i,k:i%4,below:true,cur:true}));
  return [
    {html:head(0)+res(0), note:'<p>Ищем одночлен, на который делится каждый член. Он состоит из НОД коэффициентов и общих букв в наименьших степенях.</p>'},
    {html:head(1)+res(0), note:'<div class="dhead">Числа</div><div class="deq">НОД('+coefs.join(', ')+') = <b class="redc">'+G.c+'</b></div>', label:'Шаг 1 из 4'},
    {html:head(2)+res(0), note:'<div class="dhead">Буквы</div>'+(rows.length?dl(rows):'<p>Общих букв нет.</p>'), label:'Шаг 2 из 4'},
    {html:head(3)+res(3), note:'<div class="dhead">Общий множитель</div><div class="deq"><span class="src">'+mh(F)+'</span></div>'+(lead?'<p class="note">Первый член отрицательный, поэтому удобно вынести множитель вместе с минусом.</p>':''), label:'Шаг 3 из 4'},
    {html:head(4)+res(4), arrows, note:'<div class="dhead">Делим каждый член на <span class="math src">'+mh(F)+'</span></div><p>'+P.map((p,i)=>'<span class="math k'+(i%4)+' kt">'+mh(p)+' : '+divH(F)+' = '+mh(Q[i])+'</span>').join('; ')+'</p>', label:'Шаг 4 из 4'},
    {html:head(4)+res(4), note:'<div class="deq"><b>Ответ:</b> <span class="math">'+mh(F)+'('+polyH(Q)+')</span></div><p>Проверка: раскрой скобки, должен получиться исходный многочлен.</p>'}
  ];
};

// приведение подобных членов; opt.pre — строки над выражением, opt.intro — первое пояснение
S.stepsCombine = function(T,opt){
  opt=opt||{}; const pre=opt.pre||'';
  const keys=T.map(mkey), cnt=new Map(); keys.forEach(k=>cnt.set(k,(cnt.get(k)||0)+1));
  const groups=[], gi=new Map();
  keys.forEach((k,i)=>{ if(cnt.get(k)>1){ if(!gi.has(k)){ gi.set(k,groups.length); groups.push([]); } groups[gi.get(k)].push(i); } });
  const main=(ul,doneG)=>'<div class="bl main">'+(opt.lead||'')+T.map((t,i)=>{ const g=gi.has(keys[i])?gi.get(keys[i]):-1; let c=''; if(ul&&g>=0) c='ul k'+(g%4); if(g>=0&&doneG>g) c+=' off'; return '<span class="tm '+c+'">'+th(t,i===0)+'</span>'; }).join('')+'</div>';
  const order=[...new Set(keys)];
  const comb=k=>{ const c=T.filter((t,i)=>keys[i]===k).reduce((s,t)=>s+t.c,0); return mono(c,T[keys.indexOf(k)].v); };
  const resLine=doneG=>{ const vis=[]; order.forEach(k=>{ const g=gi.has(k)?gi.get(k):-1; if(g<0) vis.push({m:T[keys.indexOf(k)],c:''}); else if(g<doneG){ const m=comb(k); if(m.c!==0) vis.push({m,c:'done k'+(g%4)}); } });
    return '<div class="bl res"><span class="eq">=</span>'+(vis.length?vis.map((x,i)=>'<span class="rs '+x.c+'">'+th(x.m,i===0)+'</span>').join(''):'0')+'</div>'; };
  const coefStr=idx=>idx.map((i,j)=>{ const c=T[i].c; return j===0?(c<0?'−'+Math.abs(c):String(c)):(c<0?' − '+Math.abs(c):' + '+c); }).join('');
  const steps=[{html:pre+main(false,0), note:opt.intro||'<p>Ищем подобные члены: у них одинаковая буквенная часть (одни и те же буквы в одних и тех же степенях).</p>'}];
  const final=psort(pcomb(T));
  if(!groups.length){ steps.push({html:pre+main(false,0)+'<div class="bl res"><span class="eq">=</span>'+polyH(final)+'</div>', note:'<p>Подобных членов нет. Остаётся записать члены по убыванию степеней.</p><div class="deq"><b>Ответ:</b> <span class="math">'+polyH(final)+'</span></div>'}); return steps; }
  const singles=order.filter(k=>!gi.has(k));
  steps.push({html:pre+main(true,0), label:'Подобные', note:'<div class="dhead">Подчёркиваем подобные одним цветом</div><ul class="plain">'+groups.map((g,j)=>'<li><span class="math k'+(j%4)+' kt">'+g.map(i=>mh(T[i])).join(', ')+'</span></li>').join('')+'</ul>'+(singles.length?'<p class="note">Без пары: <span class="math">'+singles.map(k=>mh(T[keys.indexOf(k)])).join(', ')+'</span> — их просто переписываем.</p>':'')});
  groups.forEach((g,j)=>{ const k=keys[g[0]], m=comb(k), letters=Object.keys(T[g[0]].v).length?body(mono(1,T[g[0]].v)):'';
    steps.push({html:pre+main(true,j+1)+resLine(j+1), note:'<div class="dhead">Складываем коэффициенты, буквенную часть переписываем</div><div class="deq k'+(j%4)+'">'+g.map((i,n)=>th(T[i],n===0)).join('')+' = ('+coefStr(g)+')'+(letters||'')+' = <span class="strong">'+(m.c===0?'0':mh(m))+'</span></div>'+(m.c===0?'<p class="note">Эти члены взаимно уничтожились.</p>':'')});
  });
  steps.push({html:pre+main(true,groups.length)+'<div class="bl res"><span class="eq">=</span>'+polyH(final)+'</div>', note:'<div class="deq"><b>Ответ:</b> <span class="math">'+polyH(final)+'</span></div><p class="note">Члены записали по убыванию степеней — это многочлен стандартного вида.</p>'+(opt.after||'')});
  return steps;
};

/* ---------- тренажёр с экранной клавиатурой ---------- */
S.trainer = function(root, cfg){
  const kind=cfg.kind||'poly';
  const modes=cfg.modes||[];
  root.classList.add('trainer');
  root.innerHTML=
    '<div class="tbar">'+(modes.length>1?'<div class="seg" role="group" aria-label="Что тренируем">'+modes.map((m,i)=>'<button type="button" data-mode="'+m[0]+'" aria-pressed="'+(i===0)+'">'+m[1]+'</button>').join('')+'</div>':'<span></span>')+'<span class="score">Верно: 0 из 0</span></div>'+
    '<div class="task" aria-live="polite"></div>'+
    '<form class="ans" autocomplete="off"><input type="text" spellcheck="false" autocapitalize="off" aria-label="Ответ" placeholder="'+(kind==='product'?'например: 3x(2x − 1)':'например: 6x³ − 4x² + 2')+'"><button class="btn" type="submit">Проверить</button></form>'+
    '<div class="keypad" role="group" aria-label="Кнопки для набора ответа"><div class="krow kl"></div><div class="krow digits"></div><div class="krow">'+
      '<button type="button" class="key op" data-ins=" + " aria-label="плюс">+</button><button type="button" class="key op" data-ins=" − " aria-label="минус">−</button>'+
      (kind==='product'?'<button type="button" class="key op" data-ins="(" aria-label="открыть скобку">(</button><button type="button" class="key op" data-ins=")" aria-label="закрыть скобку">)</button>':'')+
      '<button type="button" class="key pow" aria-pressed="false"><span class="math"><i>x</i><sup>▫</sup></span>степень</button>'+
      '<button type="button" class="key small" data-act="back" aria-label="Стереть один знак">⌫ стереть</button><button type="button" class="key small" data-act="clear">Очистить</button></div></div>'+
    '<div class="howto">'+(kind==='product'
      ? '<div class="seq" aria-hidden="true">Как набрать <span class="m">3x(2x − 1)</span>: <span class="cap">3</span><span class="cap"><i>x</i></span><span class="cap">(</span><span class="cap">2</span><span class="cap"><i>x</i></span><span class="cap">−</span><span class="cap">1</span><span class="cap">)</span></div>'
      : '<div class="seq" aria-hidden="true">Как набрать <span class="m">6x^3 − 4x^2 + 2</span>: <span class="cap">6</span><span class="cap"><i>x</i></span><span class="cap on">степень</span><span class="cap">³</span><span class="cap">−</span><span class="cap">4</span><span class="cap"><i>x</i></span><span class="cap on">степень</span><span class="cap">²</span><span class="cap">+</span><span class="cap">2</span></div>')+
      '<div><b>Степень:</b> нажми «<i>x</i>▫ степень» — кнопка станет синей, и цифры будут печататься маленькими сверху. Любая буква или знак возвращает обычные цифры.</div>'+
      (kind==='product'?'<div><b>Квадрат скобки</b> можно записать как <span class="m">(a + 1)(a + 1)</span> или поставить степень после скобки: <span class="m">(a + 1)^2</span>.</div>':'<div><b>Дробей и скобок в ответе не бывает.</b> Если получилась дробь, где-то ошибка.</div>')+
    '</div>'+
    '<div class="preview"></div><div class="fb" aria-live="polite"></div>'+
    '<div class="tbar"><button type="button" class="btn ghost sol-btn">Показать решение</button><button type="button" class="btn ghost new-btn">Новый пример →</button></div>'+
    '<div class="tsol" hidden></div>';
  S.math(root);
  const q=s=>root.querySelector(s);
  const taskEl=q('.task'), input=q('input'), fb=q('.fb'), preview=q('.preview'), solWrap=q('.tsol'), scoreEl=q('.score'), kl=q('.kl'), kd=q('.digits'), kPow=q('.pow');
  const coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  if(coarse) input.setAttribute('inputmode','none');
  const solBoard = S.board(solWrap);
  let mode=modes.length?modes[0][0]:null, cur=null, right=0, total=0, checked=false, powOn=false;
  kd.innerHTML=[1,2,3,4,5,6,7,8,9,0].map(d=>'<button type="button" class="key dig" data-d="'+d+'">'+d+'</button>').join('');
  function setPow(on){ powOn=on; kPow.setAttribute('aria-pressed',on?'true':'false'); kd.classList.toggle('sup',on);
    kd.querySelectorAll('.dig').forEach(b=>{ const d=+b.dataset.d; b.textContent=on?SUPD[d]:String(d); b.setAttribute('aria-label',on?'степень '+d:String(d)); }); }
  const pretty = s => s.replace(/\^(\d+)/g,(_,d)=>[...d].map(c=>SUPD[+c]).join('')).replace(/-/g,'−');
  const caret = () => { const v=input.value, a=input.selectionStart, b=input.selectionEnd; return a==null?[v.length,v.length]:[a,b]; };
  function put(v,p){ input.value=v; try{ input.setSelectionRange(p,p); }catch(e){} onInput(); }
  function insert(t){ const v=input.value, [a,b]=caret(); put(v.slice(0,a)+t+v.slice(b), a+t.length); }
  function back(){ let v=input.value, [a,b]=caret();
    if(a!==b){ put(v.slice(0,a)+v.slice(b),a); return; }
    while(a>0&&v[a-1]===' '){ v=v.slice(0,a-1)+v.slice(a); a--; }
    if(a>0){ v=v.slice(0,a-1)+v.slice(a); a--; }
    while(a>0&&v[a-1]===' '){ v=v.slice(0,a-1)+v.slice(a); a--; }
    put(v,a); }
  const kp=q('.keypad');
  kp.addEventListener('mousedown',e=>{ if(e.target.closest('.key')) e.preventDefault(); });
  kp.addEventListener('click',e=>{ const k=e.target.closest('.key'); if(!k) return;
    if(k===kPow){ setPow(!powOn); return; }
    if(k.dataset.d!=null){ insert(powOn?SUPD[+k.dataset.d]:k.dataset.d); return; }
    if(k.dataset.act==='back'){ back(); return; }
    if(k.dataset.act==='clear'){ put('',0); setPow(false); return; }
    if(k.dataset.ins){ setPow(false); insert(k.dataset.ins); }
  });
  function onInput(){
    const v=input.value, c=caret()[0], nv=pretty(v);
    if(nv!==v){ const nc=pretty(v.slice(0,c)).length; input.value=nv; try{ input.setSelectionRange(nc,nc); }catch(e){} }
    if(!input.value.trim()){ preview.innerHTML=''; return; }
    if(kind==='product'){ const r=parseProduct(input.value); preview.innerHTML = r.err?'':'Ты ввёл: <span class="math">'+prodH(r)+'</span>'; }
    else { const r=parsePoly(input.value); preview.innerHTML = r.err?'':'Ты ввёл: <span class="math">'+polyH(r.terms)+'</span>'; }
  }
  input.addEventListener('input',onInput);
  function newTask(){
    cur=cfg.gen(mode); checked=false;
    taskEl.innerHTML=cur.q;
    input.value=''; fb.textContent=''; fb.className='fb'; preview.textContent=''; solWrap.hidden=true;
    const letters=cur.letters || [...new Set((cur.answer||cur.spec.orig).flatMap(t=>Object.keys(t.v)))].sort();
    kl.innerHTML=letters.map(l=>'<button type="button" class="key let" data-ins="'+l+'" aria-label="буква '+l+'">'+l+'</button>').join('');
    setPow(false);
  }
  function diagnose(U,E){
    if(U.size!==E.size) return 'Должно получиться '+E.size+' '+plural(E.size)+', а у тебя '+U.size+'.'+(U.size<E.size?' Не пропущен ли член?':'');
    let miss=0, sign=0, coef=0;
    for(const [k,v] of E){ if(!U.has(k)) miss++; else if(U.get(k)===-v) sign++; else if(U.get(k)!==v) coef++; }
    if(miss) return 'Проверь показатели степеней: не у всех членов буквы стоят в нужных степенях.';
    if(sign) return 'Почти! Степени и числа верные, проверь знаки.';
    if(coef) return 'Степени верные. Проверь числовые коэффициенты.';
    return 'Неверно. Попробуй ещё раз.';
  }
  function checkPoly(){
    const r=parsePoly(input.value); if(r.err) return {err:r.err};
    const U=canon(r.terms), E=canon(cur.answer);
    if(sameC(U,E)){ if(r.terms.length>U.size) return {ok:false, msg:'Почти: в ответе остались подобные члены. Приведи их.'}; return {ok:true}; }
    return {ok:false,msg:diagnose(U,E)};
  }
  function checkProduct(){
    const r=parseProduct(input.value); if(r.err) return {err:r.err};
    const sp=cur.spec;
    if(!sameC(canon(expand(r)),canon(sp.orig))) return {ok:false,msg:'Если раскрыть скобки, исходный многочлен не получается. Проверь знаки и числа.'};
    let mon=mono(1,{}), polys=[];
    r.factors.forEach(f=>{ if(f.mono) mon=mmul(mon,f.mono); else { const p=pcomb(f.poly); if(p.length===1) mon=mmul(mon,p[0]); else polys.push(p); } });
    for(const p of polys){ const g=pgcd(p); if(g.c>1||Object.keys(g.v).length) return {ok:false,msg:'Из скобки '+'('+polyH(p)+')'.replace(/<[^>]+>/g,'')+' ещё можно вынести общий множитель.'}; }
    if(Math.abs(mon.c)!==sp.mono.c || mkey(mono(1,mon.v))!==mkey(mono(1,sp.mono.v))) return {ok:false,msg:'Общий множитель вынесен не полностью.'};
    if(polys.length<sp.n) return {ok:false,msg:'Разложение не закончено: одну из скобок ещё можно разложить.'};
    return {ok:true};
  }
  function check(){
    const res = kind==='product' ? checkProduct() : checkPoly();
    if(res.err){ fb.textContent=res.err; fb.className='fb no'; return; }
    if(!checked){ total++; if(res.ok) right++; checked=true; }
    scoreEl.textContent='Верно: '+right+' из '+total;
    if(res.ok){ fb.textContent='Верно! Можно брать новый пример.'; fb.className='fb ok'; }
    else { fb.textContent=res.msg; fb.className='fb no'; }
  }
  q('form').addEventListener('submit',e=>{ e.preventDefault(); check(); });
  q('.new-btn').addEventListener('click',newTask);
  q('.sol-btn').addEventListener('click',()=>{ if(!checked){ total++; checked=true; scoreEl.textContent='Верно: '+right+' из '+total; } solWrap.hidden=false; solBoard.load(cur.steps); });
  root.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{ root.querySelectorAll('.seg button').forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); mode=b.dataset.mode; newTask(); }));
  newTask();
  root._tr={next:newTask, get cur(){ return cur; }};
};
/* случайности для генераторов */
S.ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
S.pick=a=>a[Math.floor(Math.random()*a.length)];
S.sgn=p=>Math.random()<p?-1:1;
S.rmono=function(L,cmax,emax,negP,minDeg){
  for(let t=0;t<100;t++){ const v={}; L.forEach(l=>v[l]=S.ri(0,emax)); const m=mono(S.ri(1,cmax)*S.sgn(negP),v); if(deg(m)>=minDeg) return m; }
  return mono(2,{[L[0]]:1});
};
S.rpoly=function(L,n,cmax,emax,degMax){
  for(let t=0;t<200;t++){
    const out=[], keys=new Set(); let consts=0, guard=0;
    while(out.length<n && guard++<300){
      const m=S.rmono(L,cmax,emax,0.4,0), d=deg(m);
      if(d>degMax) continue;
      if(d===0){ if(consts) continue; consts++; }
      const k=mkey(m); if(keys.has(k)) continue; keys.add(k); out.push(m);
    }
    if(out.length<n) continue;
    const s=psort(out); if(s[0].c<0 && Math.random()<0.6) s[0].c=-s[0].c;
    return s;
  }
  return [mono(1,{[L[0]]:2}),mono(-3,{[L[0]]:1}),mono(1,{})];
};

/* ---------- тест с выбором ответа ---------- */
S.quiz = function(root, items){
  root.classList.add('quiz');
  let i=0, right=0, answered=false, order=items.map((_,j)=>j);
  function render(){
    if(i>=order.length){
      root.innerHTML='<div class="qq">Готово! Верно: <b>'+right+' из '+order.length+'</b>.</div><p>'+(right===order.length?'Отлично, все ответы верные.':(right>=order.length*0.7?'Хорошо. Посмотри ещё раз вопросы, где ошибся.':'Перечитай теорию выше и попробуй ещё раз.'))+'</p><div><button type="button" class="btn again">Пройти ещё раз</button></div>';
      root.querySelector('.again').addEventListener('click',()=>{ i=0; right=0; order=order.sort(()=>Math.random()-0.5); render(); });
      return;
    }
    const it=items[order[i]]; answered=false;
    root.innerHTML='<div class="tbar"><span class="count">Вопрос '+(i+1)+' из '+order.length+'</span><span class="score">Верно: '+right+'</span></div>'+
      (it.fig?'<div class="qfig">'+it.fig+'</div>':'')+'<div class="qq">'+it.q+'</div>'+
      '<div class="qopts">'+it.opts.map((o,j)=>'<button type="button" class="qopt" data-j="'+j+'">'+o+'</button>').join('')+'</div>'+
      '<div class="qwhy" hidden></div><div class="ctrl"><span></span><button type="button" class="btn qnext" hidden>Дальше →</button></div>';
    S.math(root);
    root.querySelectorAll('.qopt').forEach(b=>b.addEventListener('click',()=>{
      if(answered) return; answered=true; const j=+b.dataset.j;
      root.querySelectorAll('.qopt').forEach(x=>{ x.disabled=true; if(+x.dataset.j===it.ok) x.classList.add('right'); });
      if(j===it.ok) right++; else b.classList.add('wrong');
      const w=root.querySelector('.qwhy'); w.hidden=false; w.innerHTML=(j===it.ok?'<b class="good">Верно.</b> ':'<b class="bad">Неверно.</b> ')+(it.why||''); S.math(w);
      root.querySelector('.score').textContent='Верно: '+right;
      const n=root.querySelector('.qnext'); n.hidden=false; n.textContent = i===order.length-1?'Результат →':'Дальше →';
    }));
    root.querySelector('.qnext').addEventListener('click',()=>{ i++; render(); });
  }
  render();
};

document.addEventListener('DOMContentLoaded',()=>S.math());
if(document.readyState!=='loading') S.math();
})();
