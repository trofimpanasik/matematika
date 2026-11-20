/* Математика · 7 класс — тренажёр «впиши в окошко»: число, дробь, показатель степени.
   Окошки стоят прямо внутри записи, поэтому ребёнку видно, куда что писать. */
(function(){
"use strict";
const S = window.S;
const gcd=(a,b)=>{ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a; };
const num = x => { const s=(Math.round(x*1e9)/1e9).toString().replace('.',','); return x<0 ? '−'+s.slice(1) : s; };
S.fmt = num;
/* дробь столбиком: S.fr(1,125) */
S.fr = (n,d) => '<span class="fr"><span>'+(typeof n==='number'?num(n):n)+'</span><span>'+(typeof d==='number'?num(d):d)+'</span></span>';
S.frs = (n,d) => (n<0?'−':'')+S.fr(Math.abs(n),d);
S.gcdn = gcd;
/* запись формулы из строки: буквы курсивом, ^5 / ^−3 / ^{n+m} — степень */
S.tx = s => String(s).replace(/([a-z])/g,'<i>$1</i>').replace(/\^\{([^}]*)\}/g,'<sup>$1</sup>').replace(/\^(−?\d+)/g,'<sup>$1</sup>').replace(/\^(−?)<i>([a-z])<\/i>/g,'<sup>$1<i>$2</i></sup>');
/* число со скобками, если отрицательное: (−3) */
S.pn = x => x<0 ? '('+num(x)+')' : num(x);

/* шаблон: {n} — окошко для числа, {s} — окошко для показателя (сверху), {f} — дробь из двух окошек */
function build(tpl){
  let i=0;
  return tpl.replace(/\{([nsf])\}/g,(_,t)=>{
    if(t==='f'){ const a=i++, b=i++; return '<span class="fr dfr"><span><input class="dbox" data-i="'+a+'" aria-label="числитель"></span><span><input class="dbox" data-i="'+b+'" aria-label="знаменатель"></span></span>'; }
    const k=i++; return t==='s' ? '<sup class="dsup"><input class="dbox sm" data-i="'+k+'" aria-label="показатель степени"></sup>' : '<input class="dbox" data-i="'+k+'" aria-label="ответ">';
  });
}
function parseNum(s){
  s=String(s).replace(/\s/g,'').replace(/[−–—]/g,'-').replace('.',',');
  if(!s) return {empty:true};
  if(!/^-?\d+(,\d+)?$/.test(s)) return {bad:true};
  return {v:parseFloat(s.replace(',','.'))};
}

S.drill = function(root, cfg){
  const modes=cfg.modes||[];
  root.classList.add('trainer','drill');
  root.innerHTML=
    '<div class="tbar">'+(modes.length>1?'<div class="seg" role="group" aria-label="Что тренируем">'+modes.map((m,i)=>'<button type="button" data-mode="'+m[0]+'" aria-pressed="'+(i===0)+'">'+m[1]+'</button>').join('')+'</div>':'<span></span>')+'<span class="score">Верно: 0 из 0</span></div>'+
    '<div class="task" aria-live="polite"></div>'+
    '<form class="dform" autocomplete="off"><div class="dline"></div><button class="btn" type="submit">Проверить</button></form>'+
    '<div class="keypad" role="group" aria-label="Кнопки для набора ответа"><div class="krow digits"></div><div class="krow">'+
      '<button type="button" class="key op" data-ins="−" aria-label="минус">−</button><button type="button" class="key op" data-ins="," aria-label="запятая">,</button>'+
      '<button type="button" class="key small" data-act="next">Следующее окошко ▸</button>'+
      '<button type="button" class="key small" data-act="back" aria-label="Стереть один знак">⌫ стереть</button></div></div>'+
    '<div class="howto">'+(cfg.howto||'<div>Нажми на окошко с пунктиром и впиши число. Если окошек несколько, переходи кнопкой «Следующее окошко ▸».</div>')+'</div>'+
    '<div class="fb" aria-live="polite"></div>'+
    '<div class="tbar"><button type="button" class="btn ghost sol-btn">Показать решение</button><button type="button" class="btn ghost new-btn">Новый пример →</button></div>'+
    '<div class="tsol" hidden></div>';
  const q=s=>root.querySelector(s);
  const taskEl=q('.task'), line=q('.dline'), fb=q('.fb'), solWrap=q('.tsol'), scoreEl=q('.score');
  const coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  q('.digits').innerHTML=[1,2,3,4,5,6,7,8,9,0].map(d=>'<button type="button" class="key dig" data-ins="'+d+'">'+d+'</button>').join('');
  const solBoard=S.board(solWrap);
  let mode=modes.length?modes[0][0]:null, cur=null, boxes=[], active=null, right=0, total=0, checked=false;
  const fit = b => { b.style.width = Math.max(b.classList.contains('sm')?1.6:2.2, (b.value.length||0)*0.62+1.1)+'em'; };
  function focusBox(b){ if(!b) return; active=b; boxes.forEach(x=>x.classList.toggle('act',x===b)); if(!coarse) b.focus(); }
  function newTask(){
    cur=cfg.gen(mode); checked=false;
    taskEl.innerHTML=cur.q;
    line.innerHTML=build(cur.tpl);
    boxes=[...line.querySelectorAll('.dbox')].sort((a,b)=>a.dataset.i-b.dataset.i);
    boxes.forEach(b=>{ if(coarse) b.setAttribute('inputmode','none'); b.setAttribute('spellcheck','false'); b.setAttribute('autocomplete','off'); fit(b);
      b.addEventListener('focus',()=>{ active=b; boxes.forEach(x=>x.classList.toggle('act',x===b)); });
      b.addEventListener('input',()=>{ b.value=b.value.replace(/-/g,'−').replace(/\./g,',').replace(/[^0-9−,]/g,''); fit(b); }); });
    fb.textContent=''; fb.className='fb'; solWrap.hidden=true;
    active=boxes[0]; boxes.forEach(x=>x.classList.toggle('act',x===active));
    if(window.S) S.math(root);
  }
  root.querySelector('.keypad').addEventListener('mousedown',e=>{ if(e.target.closest('.key')) e.preventDefault(); });
  root.querySelector('.keypad').addEventListener('click',e=>{ const k=e.target.closest('.key'); if(!k||!active) return;
    if(k.dataset.act==='next'){ focusBox(boxes[(boxes.indexOf(active)+1)%boxes.length]); return; }
    if(k.dataset.act==='back'){ active.value=active.value.slice(0,-1); fit(active); return; }
    let t=k.dataset.ins;
    if(t==='−'){ active.value = active.value.startsWith('−') ? active.value.slice(1) : '−'+active.value; }
    else if(t===','){ if(!active.value.includes(',')) active.value=(active.value||'0')+','; }
    else active.value+=t;
    fit(active);
  });
  function check(){
    const vals=boxes.map(b=>parseNum(b.value));
    const ei=vals.findIndex(v=>v.empty); if(ei>=0){ focusBox(boxes[ei]); return {err:'Заполни все окошки.'}; }
    const bi=vals.findIndex(v=>v.bad); if(bi>=0){ focusBox(boxes[bi]); return {err:'В окошке должно быть одно число, например 12, −3 или 0,5.'}; }
    const v=vals.map(x=>x.v);
    if(cur.check) return cur.check(v);
    // по умолчанию: ans — массив ожидаемых значений; пара (числитель, знаменатель) отмечена cur.frac=[индекс числителя]
    const fr=cur.frac||[];
    for(const a of fr){ if(v[a+1]===0) return {ok:false,msg:'В знаменателе не может быть нуля.'};
      const en=cur.ans[a], ed=cur.ans[a+1];
      if(Math.abs(v[a]/v[a+1]-en/ed)>1e-9) return {ok:false,msg:(cur.diag&&cur.diag(v))||'Неверно. Попробуй ещё раз или открой решение.'};
      if(v[a+1]<0) return {ok:false,msg:'Верно по значению, но минус пиши в числителе, а знаменатель оставь положительным.'};
      if(Number.isInteger(v[a])&&Number.isInteger(v[a+1])&&gcd(v[a],v[a+1])>1) return {ok:false,msg:'Значение верное, но дробь можно сократить. Сократи её.'};
    }
    for(let i=0;i<v.length;i++){ if(fr.includes(i)||fr.includes(i-1)) continue;
      if(Math.abs(v[i]-cur.ans[i])>1e-9) return {ok:false,msg:(cur.diag&&cur.diag(v))||'Неверно. Попробуй ещё раз или открой решение.'}; }
    return {ok:true};
  }
  q('form').addEventListener('submit',e=>{ e.preventDefault();
    const res=check();
    if(res.err){ fb.textContent=res.err; fb.className='fb no'; return; }
    if(!checked){ total++; if(res.ok) right++; checked=true; }
    scoreEl.textContent='Верно: '+right+' из '+total;
    if(res.ok){ fb.textContent='Верно! Можно брать новый пример.'; fb.className='fb ok'; }
    else { fb.textContent=res.msg; fb.className='fb no'; }
  });
  q('.new-btn').addEventListener('click',newTask);
  q('.sol-btn').addEventListener('click',()=>{ if(!checked){ total++; checked=true; scoreEl.textContent='Верно: '+right+' из '+total; } solWrap.hidden=false; solBoard.load(cur.steps); if(window.S) S.math(solWrap); });
  root.querySelectorAll('.seg button').forEach(b=>b.addEventListener('click',()=>{ root.querySelectorAll('.seg button').forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); mode=b.dataset.mode; newTask(); }));
  newTask();
  const api={next:newTask, get cur(){ return cur; }, boxes:()=>boxes};
  root._drill=api;
  return api;
};

/* простые шаги для доски: массив строк-формул + пояснения */
S.lines = function(list){
  // list: [{h:'формула', n:'пояснение'}]; на каждом шаге показываем все строки до текущей
  return list.map((st,k)=>({html:list.slice(0,k+1).map((x,i)=>'<div class="bl'+(i===0?' main':'')+(i===k&&k===list.length-1?' res':'')+'">'+x.h+'</div>').join(''), note:st.n?'<p>'+st.n+'</p>':'', label:st.l}));
};
})();
