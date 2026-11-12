/* V6 — Accueil simplifié « un profil, plusieurs vies » : Avec qui ? Quand ? Les idées.
   4 onglets (Accueil, Découvrir, Favoris, Profil). Le reste (alertes, salles, sorties, agenda) passe par le Profil. */
'use strict';
const V6KEY='mekoikonfe-v6';
const OCCS=[['couple','À deux','2'],['famille','Famille','+ kids'],['amis','Amis','4+'],['solo','Solo','1']];
const KID_AGES=['4-6 ans','7-11 ans','12-17 ans'];
let v6={occ:null,when:'weekend',more:0,cal:false,genre:'all'};
try{const x=JSON.parse(localStorage.getItem(V6KEY)||'{}');if(x&&typeof x==='object'){if(OCCS.some(o=>o[0]===x.occ))v6.occ=x.occ;if(typeof x.when==='string')v6.when=x.when;if(typeof x.genre==='string')v6.genre=x.genre}}catch(e){}
const v6save=()=>{try{localStorage.setItem(V6KEY,JSON.stringify({occ:v6.occ,when:v6.when,genre:v6.genre}))}catch(e){}};
const v6occ=()=>v6.occ&&OCCS.some(o=>o[0]===v6.occ)?v6.occ:(S.who[0]||'couple');

// Jours couverts par le choix « Quand ? »
function v6days(){
  const w=v6.when;
  if(w==='soir')return {idx:[0],evening:true,label:"ce soir"};
  if(w==='semaine')return {idx:[0,1,2,3,4,5,6],label:'cette semaine'};
  if(/^\d{4}-\d{2}-\d{2}$/.test(w)){const i=DAYS.findIndex(d=>iso(d)===w);if(i>=0)return {idx:[i],label:fmt(DAYS[i],{weekday:'long',day:'numeric',month:'long'})}}
  const we=weekends()[0]||[5,6];return {idx:we,label:'ce week-end'};
}
// Idées pour l'occasion et la période : le meilleur score de chaque événement, sa première séance retenue.
function v6ideas(){
  const occ=v6occ(),{idx,evening}=v6days();
  const keep=S.ages;if(occ==='famille'&&!S.ages.length)S.ages=KID_AGES.slice();
  const best=new Map();
  try{
    for(const i of idx){const d=DAYS[i];if(!d)continue;
      for(const e of EVENTS){
        if(!playsOn(e,d))continue;const hr=timeOn(e,d);
        if(evening&&parseInt(hr)<17)continue;
        const r=score(e,occ,d);if(!r)continue;
        const prev=best.get(e.id);if(!prev||r.pct>prev.pct)best.set(e.id,{...e,...r,hr,di:i});
      }
    }
  }finally{S.ages=keep}
  return [...best.values()].sort((a,b)=>b.pct-a.pct||a.di-b.di);
}
function v6summary(){
  const occ=v6occ(),b=(BUDGET.find(x=>x[0]===S.budget)||['',''])[1];
  const parts=[];
  if(occ==='famille')parts.push(S.ages.length?'avec vos enfants de '+S.ages.join(', '):'âge des enfants à préciser dans le Profil');
  if(occ==='couple')parts.push('en amoureux');
  if(occ==='amis')parts.push('entre amis');
  if(b)parts.push(b.toLowerCase());
  if(S.city)parts.push('près de '+S.city);
  return parts.join(' · ');
}
function v6home(){
  const hr=new Date().getHours(),occ=v6occ(),{label}=v6days(),ideas=v6ideas(),shown=ideas.slice(0,6+v6.more);
  const isDate=/^\d{4}-\d{2}-\d{2}$/.test(v6.when);
  const whenBtn=(id,t)=>`<button class="v6when" data-v6when="${id}" aria-pressed="${v6.when===id}">${t}</button>`;
  return `<div class="stack step v6">
    <form class="v6search" id="askform" role="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <label for="ask" class="v6sr">Votre envie</label><input type="search" id="ask" placeholder="${esc(ASK_EX[0])}" autocomplete="off"><button class="btn primary" type="submit">Go</button></form>
    <div class="greet"><p>${hr<18?'Bonjour':'Bonsoir'} ${esc(S.name)}</p><h1>On sort avec qui ?</h1></div>
    <div class="v6occ" role="group" aria-label="Avec qui">${OCCS.map(([id,t,g])=>`<button data-v6occ="${id}" aria-pressed="${occ===id}"><b>${g}</b>${t}</button>`).join('')}</div>
    <section class="section"><h2 class="v6h2">Quand ?</h2>
      <div class="v6whenrow">${whenBtn('soir','Ce soir')}${whenBtn('weekend','Ce week-end')}${whenBtn('semaine','Semaine')}
        <button class="v6when v6cal" id="v6cal" aria-pressed="${isDate}" aria-label="Choisir une date">${isDate?esc(fmt(new Date(v6.when+'T12:00:00'),{day:'numeric',month:'short'}).replace('.','')):'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>'}</button></div>
      ${v6.cal?`<label class="v6datebox">Choisir un jour<input type="date" id="v6date" min="${iso(DAYS[0])}" max="${iso(DAYS[DAYS.length-1])}" value="${isDate?v6.when:''}"></label>`:''}
      <p class="v6sum">${esc(v6summary())}</p></section>
    <section class="section"><div class="sec-title"><span>Nos idées ${esc(label)}</span><small>${ideas.length}</small></div>
      ${shown.length?`<div class="cards">${shown.map(e=>card(e,short(e.di))).join('')}</div>`
        :`<p class="empty">Rien qui vous ressemble ${esc(label)}. Essayez une autre période ou une autre occasion.</p>`}
      ${ideas.length>shown.length?`<button class="btn outline" id="v6more">Plus d'idées</button>`:''}</section>
  </div>`;
}

// Découvrir : filtre par genre au-dessus des cartes
const v6deck=deck;
deck=function(){const d=v6deck();return v6.genre==='all'?d:d.filter(e=>e.cat===v6.genre)};
const v6swipe=pageSwipe;
pageSwipe=function(){
  const cats=TYPES.filter(t=>EVENTS.some(e=>e.cat===t.id&&nextIdx(e)>=0));
  return `<div class="chips scroll v6genres" role="group" aria-label="Genre"><button class="chipbtn" data-v6genre="all" aria-pressed="${v6.genre==='all'}">Tout</button>${cats.map(t=>`<button class="chipbtn" data-v6genre="${t.id}" aria-pressed="${v6.genre===t.id}">${esc(t.t)}</button>`).join('')}</div>`+v6swipe();
};

// Profil : point d'entrée vers alertes, salles, sorties et agenda
const v6profile=pageProfile;
pageProfile=function(){
  const al=(S.alerts||[]).length,ar=(S.artists||[]).length,ve=(typeof V4!=='undefined'?V4.venues.length:0);
  return `<section class="ticket stack v6links"><h2>Mes raccourcis</h2>
    <button class="btn outline" data-tab="billets">Mes alertes · ${ar} artiste${ar>1?'s':''}, ${ve} salle${ve>1?'s':''}, ${al} mise${al>1?'s':''} en vente</button>
    <button class="btn outline" data-tab="agenda">Agenda jour par jour</button></section>`+v6profile();
};

// Cartes allégées : la mention de vérification reste sur la fiche détaillée.
const v6card=card;card=function(e,d){return v6card(e,d).replace(/<span class="hint">(Source publique · billets et tarif non vérifiés|Archive non revérifiée)<\/span>/,'')};
pageHome=v6home;
for(let i=TABS.length-1;i>=0;i--)if(!['accueil','decouvrir','favoris','profil'].includes(TABS[i][0]))TABS.splice(i,1);
TABS[0][1]='Accueil';TABS[0][2]='<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>';

const v6render=render;
render=function(){v6render();const hs=document.querySelector('#hsearch');if(hs)hs.hidden=true};

const v6bind=bind;
bind=function(){
  v6bind();
  const each=(sel,fn)=>view.querySelectorAll(sel).forEach(el=>el.onclick=()=>fn(el));
  each('[data-v6occ]',el=>{v6.occ=el.dataset.v6occ;v6.more=0;v6save();render()});
  each('[data-v6when]',el=>{if(el.id==='v6cal')return;v6.when=el.dataset.v6when;v6.cal=false;v6.more=0;v6save();render()});
  const cal=document.querySelector('#v6cal');if(cal)cal.onclick=()=>{v6.cal=!v6.cal;render();const d=document.querySelector('#v6date');if(d){d.focus();try{d.showPicker()}catch(e){}}};
  const di=document.querySelector('#v6date');if(di)di.onchange=()=>{if(/^\d{4}-\d{2}-\d{2}$/.test(di.value)){v6.when=di.value;v6.cal=false;v6.more=0;v6save();render()}};
  const more=document.querySelector('#v6more');if(more)more.onclick=()=>{v6.more+=6;render()};
  each('[data-v6genre]',el=>{v6.genre=el.dataset.v6genre;v6save();render()});
};
if(['weekend','billets','agenda','recherche','sorties'].includes(page)===false&&!TABS.some(t=>t[0]===page))page='accueil';
render();
