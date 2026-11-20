/* Математика · 7 класс — чертежи: точки и отрезки, пошаговые доказательства с анимацией, перетаскиваемые точки. */
(function(){
"use strict";
const G = window.G = {};
const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const P=(x,y)=>({x,y});
const add=(a,b)=>P(a.x+b.x,a.y+b.y), sub=(a,b)=>P(a.x-b.x,a.y-b.y), mul=(a,k)=>P(a.x*k,a.y*k);
const len=a=>Math.hypot(a.x,a.y), dist=(a,b)=>len(sub(a,b));
const unit=a=>{ const l=len(a)||1; return P(a.x/l,a.y/l); };
const lerp=(a,b,t)=>P(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t), mid=(a,b)=>lerp(a,b,.5);
const perp=a=>P(-a.y,a.x);
const rot=(a,t)=>P(a.x*Math.cos(t)-a.y*Math.sin(t), a.x*Math.sin(t)+a.y*Math.cos(t));
const rotAround=(p,c,t)=>add(c,rot(sub(p,c),t));
function foot(p,a,b){ const d=sub(b,a); const t=((p.x-a.x)*d.x+(p.y-a.y)*d.y)/(d.x*d.x+d.y*d.y); return add(a,mul(d,t)); }
function reflect(p,a,b){ const f=foot(p,a,b); return P(2*f.x-p.x,2*f.y-p.y); }
function angAt(v,p1,p2){ let a=Math.atan2(p1.y-v.y,p1.x-v.x)-Math.atan2(p2.y-v.y,p2.x-v.x); a=Math.abs(a); if(a>Math.PI) a=2*Math.PI-a; return a*180/Math.PI; }
function inter(a,b,c,d){ const r=sub(b,a), s=sub(d,c), den=r.x*s.y-r.y*s.x; if(Math.abs(den)<1e-9) return null; const t=((c.x-a.x)*s.y-(c.y-a.y)*s.x)/den; return add(a,mul(r,t)); }
const centroid=(...ps)=>P(ps.reduce((s,p)=>s+p.x,0)/ps.length, ps.reduce((s,p)=>s+p.y,0)/ps.length);
Object.assign(G,{P,add,sub,mul,len,dist,unit,lerp,mid,perp,rot,rotAround,foot,reflect,angAt,inter,centroid});
G.cm = px => (px/30).toFixed(1).replace('.',',');
G.deg = a => Math.round(a)+'°';
G.n = (s,w) => '<span class="n"'+(w?' style="--w:'+w+'"':'')+'>'+s+'</span>';
G.swap = (list,i) => '<span class="swap">'+list.map((h,k)=>'<span'+(k===i?' class="on"':' aria-hidden="true"')+'>'+h+'</span>').join('')+'</span>';

/* ---------- примитивы SVG ---------- */
const f=n=>(+n).toFixed(1);
G.seg=(A,B,c)=>'<path class="ln '+(c||'')+'"'+(/dash/.test(c||'')?'':' pathLength="1"')+' d="M'+f(A.x)+' '+f(A.y)+'L'+f(B.x)+' '+f(B.y)+'"/>';
G.line=(A,B,c,e)=>{ e=e||900; const u=unit(sub(B,A)); return G.seg(sub(A,mul(u,e)),add(B,mul(u,e)),c); };
G.ray=(A,B,c,e)=>{ e=e||900; const u=unit(sub(B,A)); return G.seg(A,add(A,mul(u,e)),c); };
G.path=(pts,c,close)=>'<path class="ln '+(c||'')+'" pathLength="1" d="M'+pts.map(p=>f(p.x)+' '+f(p.y)).join('L')+(close?'Z':'')+'"/>';
G.poly=(pts,c)=>'<path class="fl '+(c||'')+'" d="M'+pts.map(p=>f(p.x)+' '+f(p.y)).join('L')+'Z"/>';
G.dot=(A,c)=>'<circle class="pt '+(c||'')+'" cx="'+f(A.x)+'" cy="'+f(A.y)+'" r="3.6"/>';
G.lbl=(A,t,dx,dy,c)=>'<text class="lb '+(c||'')+'" x="'+f(A.x+(dx||0))+'" y="'+f(A.y+(dy||0))+'">'+t+'</text>';
G.away=(A,from,t,d,c)=>{ const u=unit(sub(A,from)); return G.lbl(add(A,mul(u,d||16)),t,0,0,c); };
G.ms=(A,t,c)=>'<text class="ms '+(c||'')+'" x="'+f(A.x)+'" y="'+f(A.y)+'">'+t+'</text>';
G.ticks=(A,B,n,c)=>{ n=n||1; const m=mid(A,B), u=unit(sub(B,A)), q=perp(u); let d='';
  for(let i=0;i<n;i++){ const p=add(m,mul(u,(i-(n-1)/2)*5)); const a=add(p,mul(q,6)), b=sub(p,mul(q,6)); d+='M'+f(a.x)+' '+f(a.y)+'L'+f(b.x)+' '+f(b.y); }
  return '<path class="tick '+(c||'')+'" d="'+d+'"/>'; };
function arcD(V,A,B,r){ const a1=Math.atan2(A.y-V.y,A.x-V.x), a2=Math.atan2(B.y-V.y,B.x-V.x); let d=a2-a1; while(d>Math.PI) d-=2*Math.PI; while(d<=-Math.PI) d+=2*Math.PI;
  const s=P(V.x+r*Math.cos(a1),V.y+r*Math.sin(a1)), e=P(V.x+r*Math.cos(a1+d),V.y+r*Math.sin(a1+d));
  return {s,e,sw:d>0?1:0,d:'M'+f(s.x)+' '+f(s.y)+'A'+r+' '+r+' 0 0 '+(d>0?1:0)+' '+f(e.x)+' '+f(e.y)}; }
G.arc=(V,A,B,r,n,c)=>{ r=r||22; n=n||1; let o=''; for(let i=0;i<n;i++) o+='<path class="arcl '+(c||'')+'" pathLength="1" d="'+arcD(V,A,B,r+i*4.5).d+'"/>'; return o; };
G.wedge=(V,A,B,r,c)=>{ const a=arcD(V,A,B,r); return '<path class="fl '+(c||'')+'" d="M'+f(V.x)+' '+f(V.y)+'L'+a.d.slice(1)+'Z"/>'; };
G.right=(V,A,B,s,c)=>{ s=s||11; const u1=mul(unit(sub(A,V)),s), u2=mul(unit(sub(B,V)),s); const a=add(V,u1), b=add(add(V,u1),u2), d=add(V,u2);
  return '<path class="arcl '+(c||'')+'" pathLength="1" d="M'+f(a.x)+' '+f(a.y)+'L'+f(b.x)+' '+f(b.y)+'L'+f(d.x)+' '+f(d.y)+'"/>'; };
G.angText=(V,A,B,r,t,c)=>{ const u=unit(add(unit(sub(A,V)),unit(sub(B,V)))); return G.ms(add(V,mul(u,r)),t,c); };
G.svg=(vb,inner,label)=>'<svg viewBox="0 0 '+vb[0]+' '+vb[1]+'" role="img" aria-label="'+(label||'Чертёж')+'">'+inner+'</svg>';
/* треугольник с подписями вершин */
G.tri=(A,B,C,names,c)=>{ const O=centroid(A,B,C); return G.path([A,B,C],c,true)+(names?G.away(A,O,names[0])+G.away(B,O,names[1])+G.away(C,O,names[2]):''); };

/* перенос фигуры: точки src1→dst1, направление src1→src2 совпадает с dst1→dst2; mirror — перевернуть */
G.tf=(s1,s2,d1,d2,mirror)=>{ const u=sub(s2,s1), v=sub(d2,d1), s=mirror?-1:1;
  let a=(Math.atan2(v.y,v.x)-Math.atan2(s*u.y,u.x))*180/Math.PI; while(a>180) a-=360; while(a<=-180) a+=360;
  return 'translate('+f(d1.x)+'px,'+f(d1.y)+'px) rotate('+a.toFixed(2)+'deg) scale(1,'+s+') translate('+f(-s1.x)+'px,'+f(-s1.y)+'px)'; };
G.tf0=s1=>'translate('+f(s1.x)+'px,'+f(s1.y)+'px) rotate(0deg) scale(1,1) translate('+f(-s1.x)+'px,'+f(-s1.y)+'px)';

/* ---------- пошаговое доказательство ---------- */
G.proof=function(root,cfg){
  const vb=cfg.vb||[400,280];
  root.classList.add('proof');
  const movers={};
  let fig='';
  cfg.items.forEach((it,i)=>{
    const g='<g class="gi" data-i="'+i+'">'+it.h+'</g>';
    if(it.mv){ if(!movers[it.mv]){ movers[it.mv]=[]; fig+='<g class="mv" data-mv="'+it.mv+'">@@'+it.mv+'@@</g>'; } movers[it.mv].push(g); }
    else fig+=g;
  });
  Object.keys(movers).forEach(id=>{ fig=fig.replace('@@'+id+'@@',movers[id].join('')); });
  root.innerHTML=(cfg.title?'<div class="ptitle">'+cfg.title+'</div>':'')+
    '<div class="pfig">'+G.svg(vb,fig,cfg.label||'Чертёж к доказательству')+'</div>'+
    '<div class="ptext">'+(cfg.given?'<div class="pgiven">'+cfg.given+'</div>':'')+'<ol></ol></div>'+
    '<div class="ctrl"><button type="button" class="btn ghost prev">← Назад</button><span class="count"></span><button type="button" class="btn next">Дальше →</button></div>';
  const gs=[...root.querySelectorAll('.gi')], ol=root.querySelector('ol'), prev=root.querySelector('.prev'), next=root.querySelector('.next'), count=root.querySelector('.count');
  const mvs=[...root.querySelectorAll('.mv')];
  const N=cfg.steps.length-1; let k=0;
  function render(anim){
    gs.forEach(g=>{ const it=cfg.items[+g.dataset.i]; const vis=(it.s||0)<=k && (it.e==null || k<it.e);
      g.classList.toggle('hid',!vis); g.classList.remove('new');
      if(vis && anim && (it.s||0)===k && !reduce){ void g.getBoundingClientRect(); g.classList.add('new'); } });
    mvs.forEach(m=>{ const spec=(cfg.moves||{})[m.dataset.mv]||{}; let best=null, bk=-1;
      Object.keys(spec).forEach(key=>{ const n=+key; if(n<=k && n>bk){ bk=n; best=spec[key]; } });
      if(best){ if(!anim||reduce){ m.style.transition='none'; m.style.transform=best; void m.getBoundingClientRect(); m.style.transition=''; } else m.style.transform=best; } });
    ol.innerHTML=cfg.steps.slice(0,k+1).map((t,i)=>'<li class="'+(i===k?'cur':'')+'">'+t+'</li>').join('');
    prev.disabled=k===0; next.textContent=k===N?'Сначала ↺':'Дальше →';
    count.textContent=k===0?'Чертёж':'Шаг '+k+' из '+N;
    if(window.S) S.math(root);
  }
  prev.addEventListener('click',()=>{ if(k>0){ k--; render(false); } });
  next.addEventListener('click',()=>{ if(k<N){ k++; render(true); } else { k=0; render(false); } });
  render(false);
  return {go(n){ k=n; render(false); }};
};

/* ---------- чертёж с перетаскиваемыми точками ---------- */
G.drag=function(root,cfg){
  const vb=cfg.vb||[400,280];
  root.classList.add('gfig');
  root.innerHTML=G.svg(vb,'<g class="dl"></g><g class="hl"></g>',cfg.label||'Интерактивный чертёж')+(cfg.info?'<div class="ginfo" aria-live="polite"></div>':'')+(cfg.hint?'<div class="note">'+cfg.hint+'</div>':'');
  const svg=root.querySelector('svg'), dl=root.querySelector('.dl'), hl=root.querySelector('.hl'), info=root.querySelector('.ginfo');
  const pts={}; Object.keys(cfg.pts).forEach(k=>pts[k]={...cfg.pts[k]});
  const names=cfg.handles||Object.keys(pts);
  hl.innerHTML=names.map((n,i)=>'<g data-h="'+n+'" tabindex="0" role="button" aria-label="Точка '+n+': двигай мышью, пальцем или стрелками"><circle class="hit" r="22"/><circle class="hdl'+(i===0?' pulse':'')+'" r="7"/></g>').join('');
  const hs=[...hl.querySelectorAll('[data-h]')];
  function redraw(){
    dl.innerHTML=cfg.draw(pts);
    hs.forEach(h=>{ const p=pts[h.dataset.h]; h.querySelectorAll('circle').forEach(c=>{ c.setAttribute('cx',f(p.x)); c.setAttribute('cy',f(p.y)); }); });
    if(info) { info.innerHTML=cfg.info(pts); if(window.S) S.math(info); }
  }
  function toSvg(e){ const pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const m=svg.getScreenCTM(); return m?pt.matrixTransform(m.inverse()):pt; }
  function calc(n,p){ p=P(Math.max(12,Math.min(vb[0]-12,p.x)),Math.max(12,Math.min(vb[1]-12,p.y))); if(cfg.constrain) p=cfg.constrain(n,p,pts)||pts[n]; return p; }
  function moveTo(n,p){ pts[n]=calc(n,p); redraw(); }
  let act=null;
  hs.forEach(h=>{
    h.addEventListener('pointerdown',e=>{ act=h.dataset.h; h.querySelector('.hdl').classList.remove('pulse'); try{ h.setPointerCapture(e.pointerId); }catch(_){} e.preventDefault(); });
    h.addEventListener('pointermove',e=>{ if(act!==h.dataset.h) return; moveTo(act,toSvg(e)); });
    h.addEventListener('pointerup',()=>{ act=null; }); h.addEventListener('pointercancel',()=>{ act=null; });
    h.addEventListener('keydown',e=>{ const d={ArrowLeft:[-4,0],ArrowRight:[4,0],ArrowUp:[0,-4],ArrowDown:[0,4]}[e.key]; if(!d) return; e.preventDefault(); const n=h.dataset.h; for(let m=1;m<=8;m++){ const q=calc(n,P(pts[n].x+d[0]*m,pts[n].y+d[1]*m)); if(dist(q,pts[n])>0.5||m===8){ pts[n]=q; redraw(); break; } } });
  });
  redraw();
  return {pts, redraw, set(n,p){ pts[n]=p; redraw(); }};
};

/* плавная анимация значения */
G.tween=function(dur,fn,done){ if(reduce){ fn(1); if(done) done(); return; } const t0=performance.now();
  function fr(t){ const x=Math.min(1,(t-t0)/dur); fn(x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2); if(x<1) requestAnimationFrame(fr); else if(done) done(); } requestAnimationFrame(fr); };
})();
