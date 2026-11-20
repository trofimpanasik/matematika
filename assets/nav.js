/* Прокрутка при переходах: урок всегда открывается сверху,
   главная — на карточке темы, которую ребёнок только что открывал. */
(function(){
"use strict";
try{ if('scrollRestoration' in history) history.scrollRestoration='manual'; }catch(e){}

const KEY='site7.lastTopic';
const file=(location.pathname.split('/').pop()||'index.html');
const isHome=!document.querySelector('script[src*="core.js"]') && !!document.querySelector('.card[href]');
const get=()=>{ try{ return sessionStorage.getItem(KEY); }catch(e){ return null; } };
const set=v=>{ try{ sessionStorage.setItem(KEY,v); }catch(e){} };

/* scrollIntoView прокручивает и внешнюю страницу, если сайт открыт во фрейме, вытянутом по высоте */
function toEl(el,block){
  if(!el) return;
  try{ el.scrollIntoView({block:block,inline:'nearest',behavior:'instant'}); }
  catch(e){ el.scrollIntoView(block==='start'); }
}
function toTop(){
  window.scrollTo(0,0);
  toEl(document.body && document.body.firstElementChild, 'start');
}

let touched=false;
['wheel','touchstart','keydown','mousedown'].forEach(t=>window.addEventListener(t,()=>{touched=true;},{passive:true,once:true}));
function place(){
  if(touched) return;
  const hash=decodeURIComponent(location.hash.slice(1));
  const target=hash && document.getElementById(hash);
  if(target){ toEl(target,'start'); return; }
  if(!isHome){ toTop(); return; }
  const last=get();
  const card=last && document.querySelector('.card[href="'+last.replace(/"/g,'')+'"]');
  if(card){
    toEl(card,'center');
    card.classList.add('just');
  } else toTop();
}

if(isHome){
  /* запоминаем тему уже в момент нажатия — на случай, если урок откроют в той же вкладке */
  document.addEventListener('click',e=>{
    const a=e.target.closest && e.target.closest('.card[href], #now a[href]');
    if(a) set(a.getAttribute('href'));
  });
} else if(/^(alg|geo)-/.test(file)) set(file);

place();
document.addEventListener('DOMContentLoaded',place);
window.addEventListener('load',()=>{ place(); setTimeout(place,250); });
window.addEventListener('pageshow',e=>{ if(e.persisted) place(); });
})();
