/* V4 — idées inspirées de Shotgun : ta semaine, salles suivies, liste d'attente, sorties et badges.
   Tout reste sur l'appareil (clé mekoikonfe-v4). Aucune notification réelle n'est envoyée. */
'use strict';
const V4KEY='mekoikonfe-v4';
let V4={venues:[],waitlist:[],history:[],swipes:0,invited:0};
try{
  const x=JSON.parse(localStorage.getItem(V4KEY)||'{}');
  if(x&&x.version===1){
    for(const k of ['venues','waitlist'])if(Array.isArray(x[k]))V4[k]=x[k].filter(v=>typeof v==='string'&&v.length<200).slice(0,300);
    if(Array.isArray(x.history))V4.history=x.history.filter(h=>h&&typeof h.title==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(h.date)&&typeof h.key==='string').slice(0,500);
    for(const k of ['swipes','invited'])if(Number.isInteger(x[k])&&x[k]>=0)V4[k]=x[k];
  }
}catch(e){}
let v4Msg='';
function v4save(){try{localStorage.setItem(V4KEY,JSON.stringify({version:1,...V4}));return true}catch(e){v4Msg='Sauvegarde impossible sur cet appareil.';return false}}
const v4norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const followsVenue=v=>!!v&&V4.venues.some(x=>v4norm(x)===v4norm(v));
const onWaitlist=k=>V4.waitlist.includes(k);

/* ---------- Salles suivies ---------- */
function topVenues(n=18){
  const c=new Map();
  for(const e of EVENTS){if(!e.venue||nextIdx(e)<0)continue;const k=e.venue.trim();c.set(k,(c.get(k)||0)+1)}
  return [...c.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'fr')).slice(0,n);
}
function venueNews(limit=6){
  return EVENTS.filter(e=>followsVenue(e.venue)&&nextIdx(e)>=0)
    .map(e=>({...e,...(score(e,null,null)||{pct:50,why:[]}),di:nextIdx(e),hr:timeOn(e,DAYS[nextIdx(e)])}))
    .sort((a,b)=>a.di-b.di||b.pct-a.pct).slice(0,limit);
}
function venuePicker(){
  const tops=topVenues(), custom=V4.venues.filter(v=>!tops.some(([t])=>v4norm(t)===v4norm(v)));
  return `<div class="chips v4venues">${tops.map(([v,n])=>`<button class="chipbtn" data-venue="${esc(v)}" aria-pressed="${followsVenue(v)}">${esc(v)} <small>${n}</small></button>`).join('')}${custom.map(v=>`<button class="chipbtn" data-venue="${esc(v)}" aria-pressed="true">${esc(v)} ✕</button>`).join('')}</div>`;
}
function venueSection(){
  const news=venueNews(8);
  return `<section class="ticket stack v4block"><div class="sec-title"><span>Vos salles</span><small>${V4.venues.length} suivie${V4.venues.length>1?'s':''}</small></div>
    <p class="hint" style="margin:0">Suivez les lieux que vous aimez : leurs nouvelles dates remontent en priorité dans vos suggestions. Les salles proposées sont celles qui ont le plus de dates dans le catalogue.</p>
    <details ${V4.venues.length?'':'open'}><summary>Choisir mes salles</summary>${venuePicker()}</details>
    ${news.length?`<div class="cards">${news.map(e=>card(e,short(e.di))).join('')}</div>`:V4.venues.length?`<p class="empty">Pas de date à venir dans vos salles pour l'instant.</p>`:''}
  </section>`;
}

/* ---------- Ta semaine ---------- */
function weekStrip(){
  const used=new Set();const items=DAYS.slice(0,7).map((d,i)=>{const e=bestOfDay(d).find(x=>!used.has(x.id));if(e)used.add(e.id);return {d,i,e}}); // une idée différente chaque soir
  if(!items.some(x=>x.e))return '';
  return `<section class="section v4week"><div class="sec-title"><span>Ta semaine</span><small>une idée par soir</small></div>
    <div class="v4strip">${items.map(({d,i,e})=>e?`<button class="v4day" data-open="${e.id}"><small>${i===0?"Aujourd'hui":i===1?'Demain':fmt(d,{weekday:'short',day:'numeric'}).replace('.','')}</small><strong>${esc(e.t)}</strong><span>${e.hr?esc(e.hr.replace(':','h'))+' · ':''}${esc(e.venue)}</span>${followsVenue(e.venue)?'<em>salle suivie</em>':''}</button>`
      :`<div class="v4day empty"><small>${i===0?"Aujourd'hui":i===1?'Demain':fmt(d,{weekday:'short',day:'numeric'}).replace('.','')}</small><span>Soirée libre</span></div>`).join('')}</div></section>`;
}

/* ---------- Sorties, badges, parrainage ---------- */
const BADGES=[
  {id:'first',t:'Première sortie',d:'Votre première sortie enregistrée',need:1,val:s=>s.n},
  {id:'regular',t:'Habitué·e',d:'5 sorties',need:5,val:s=>s.n},
  {id:'pillar',t:'Pilier de salle',d:'10 sorties',need:10,val:s=>s.n},
  {id:'live',t:'Fan de live',d:'3 concerts',need:3,val:s=>s.cat.concert||0},
  {id:'stage',t:'Côté scène',d:'3 pièces ou spectacles d\'humour',need:3,val:s=>(s.cat.theatre||0)+(s.cat.humour||0)},
  {id:'eye',t:'Œil curieux',d:'2 expositions',need:2,val:s=>s.cat.expo||0},
  {id:'all',t:'Touche-à-tout',d:'4 genres différents',need:4,val:s=>Object.keys(s.cat).length},
  {id:'places',t:'Fidèle des lieux',d:'Suivre 3 salles',need:3,val:()=>V4.venues.length},
  {id:'swipe',t:'Swipeur fou',d:'30 cartes swipées',need:30,val:()=>V4.swipes},
  {id:'ambassador',t:'Ambassadeur·rice',d:'Inviter un ami',need:1,val:()=>V4.invited}
];
function stats(){const cat={},venues=new Set();for(const h of V4.history){if(h.cat)cat[h.cat]=(cat[h.cat]||0)+1;if(h.venue)venues.add(v4norm(h.venue))}return {n:V4.history.length,cat,venues:venues.size}}
function badgeState(){const s=stats();return BADGES.map(b=>{const v=Math.min(b.need,b.val(s));return {...b,v,ok:v>=b.need}})}
function addHistory(e,date,from){
  const key=e.id+'@'+date;if(V4.history.some(h=>h.key===key))return false;
  V4.history.push({key,id:e.id,title:e.t,cat:e.cat,venue:e.venue||'',date,from});v4save();return true;
}
function pastPlans(){
  const t=iso(today);
  return (typeof plans!=='undefined'?plans:[]).filter(p=>p.status!=='cancelled'&&p.date<t&&!V4.history.some(h=>h.key===p.eventId+'@'+p.date));
}
function pageSorties(){
  const s=stats(),bs=badgeState(),won=bs.filter(b=>b.ok).length,pp=pastPlans();
  const hist=[...V4.history].sort((a,b)=>b.date.localeCompare(a.date));
  return `<div class="stack step"><div class="greet"><p>Votre carnet de sorties</p><h1>Mes sorties</h1></div>
    <div class="facts"><div class="fact"><small>Sorties</small><b>${s.n}</b></div><div class="fact"><small>Genres</small><b>${Object.keys(s.cat).length}</b></div><div class="fact"><small>Badges</small><b>${won} / ${BADGES.length}</b></div></div>
    ${pp.length?`<section class="ticket stack"><h2>Vous y êtes allé·e ?</h2><p class="hint" style="margin:0">Ces soirées de votre agenda sont passées. Confirmez-les pour les ajouter à votre carnet.</p>${pp.map(p=>{const e=EVENTS.find(x=>x.id===p.eventId)||p.eventSnapshot;return e?`<div class="v4row"><span><b>${esc(e.t)}</b><br><small>${esc(p.date)} · ${esc(e.venue||'')}</small></span><button class="mini hot" data-confirmplan="${esc(p.id)}">J'y étais</button></div>`:''}).join('')}</section>`:''}
    <section class="section"><div class="sec-title"><span>Mes badges</span><small>${won} débloqué${won>1?'s':''}</small></div>
      <div class="v4badges">${bs.map(b=>`<div class="v4badge${b.ok?' ok':''}"><span class="v4medal" aria-hidden="true">${b.ok?'★':'☆'}</span><strong>${esc(b.t)}</strong><small>${esc(b.d)}</small><span class="v4prog"><i style="width:${Math.round(b.v/b.need*100)}%"></i></span><small>${b.v} / ${b.need}</small></div>`).join('')}</div></section>
    <section class="ticket stack v4invite"><h2>Invitez vos amis</h2><p style="margin:0">Partagez Mékoikonfé avec ceux qui sortent avec vous. Le badge Ambassadeur·rice se débloque à la première invitation.</p>
      <textarea id="v4invitetext" rows="3" readonly>Je teste Mékoikonfé pour choisir nos sorties (concerts, théâtre, expos…). Viens tester : ${esc(location.origin&&location.origin!=='null'?location.origin:'lien à venir')}</textarea>
      <button class="btn primary" id="v4invite">Copier l'invitation</button><p class="hint" id="v4invitemsg" role="status" style="margin:0"></p></section>
    <section class="section"><div class="sec-title"><span>Historique</span><small>${hist.length}</small></div>
      ${hist.length?`<div class="v4hist">${hist.map(h=>`<div class="v4row"><span><b>${esc(h.title)}</b><br><small>${esc(new Date(h.date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}))} · ${esc(h.venue)}${h.cat?' · '+esc(catT(h.cat)):''}</small></span><button class="mini" data-unhist="${esc(h.key)}" aria-label="Retirer de l'historique">Retirer</button></div>`).join('')}</div>`
      :`<p class="empty">Aucune sortie enregistrée. Sur la fiche d'un spectacle, touchez « J'y suis allé·e », ou confirmez vos soirées passées de l'agenda.</p>`}</section>
    <p class="sample">Carnet, badges et salles suivies restent sur cet appareil. Ils ne sont pas encore inclus dans l'export JSON.</p>
    ${v4Msg?`<p class="error" role="alert">${esc(v4Msg)}</p>`:''}</div>`;
}

/* ---------- Branchements sur l'existant ---------- */
const v4Score=score;
score=function(e,occ,d){const r=v4Score(e,occ,d);if(r&&e&&followsVenue(e.venue)){r.pct=Math.min(99,r.pct+12);r.why=['une salle que vous suivez',...r.why.filter(w=>w!=='une salle que vous suivez')].slice(0,2)}return r};

const v4Sw=swAct;
swAct=function(kind){if(kind==='like'||kind==='nope'){V4.swipes++;v4save()}return v4Sw(kind)};

const v4Tk=tkcard;
tkcard=function(o){
  const html=v4Tk(o);if(o.st!=='partial')return html;
  const k='onsale:'+o.k,on=onWaitlist(k);
  return html.replace('<div class="tkact">',`<div class="tkact"><button class="mini${on?' on':''}" data-wait="${esc(k)}" aria-pressed="${on}">${on?'✓ Sur liste d\'attente':'Liste d\'attente des dates complètes'}</button>`);
};

const v4Home=pageHome;
pageHome=function(){
  let h=v4Home();
  const news=V4.venues.length?venueNews(4):[];
  const extra=weekStrip()
    +(news.length?`<section class="section"><div class="sec-title"><span>Du nouveau dans vos salles</span><button class="link" data-tab="billets">Gérer</button></div><div class="cards">${news.map(e=>card(e,short(e.di))).join('')}</div></section>`
      :`<button class="weteaser v4teaser" data-tab="billets"><span><small>Nouveau</small><strong>Suivez vos salles préférées</strong></span><span class="arrow">→</span></button>`)
    +`<button class="btn outline" data-v4go="sorties">Mes sorties et badges${badgeState().filter(b=>b.ok).length?' · '+badgeState().filter(b=>b.ok).length+' ★':''}</button>`;
  const at=h.indexOf('<form class="ask"');
  return at>=0?h.slice(0,at)+extra+h.slice(at):extra+h;
};

const v4Tickets=pageTickets;
pageTickets=function(){return venueSection()+v4Tickets()};

const v4Detail=pageDetail;
pageDetail=function(){
  const e=EVENTS.find(x=>x.id===detailId);let h=v4Detail();if(!e)return h;
  const fv=followsVenue(e.venue),wk='ev:'+e.id,wl=onWaitlist(wk),done=V4.history.some(x=>x.id===e.id);
  const block=`<section class="ticket stack v4actions">
    ${e.venue?`<button class="btn outline" data-venue="${esc(e.venue)}" aria-pressed="${fv}">${fv?'✓ Vous suivez '+esc(e.venue):'Suivre '+esc(e.venue)}</button>`:''}
    <button class="btn outline" data-wait="${esc(wk)}" aria-pressed="${wl}">${wl?'✓ Sur liste d\'attente':'Complet ? Me prévenir si des places se libèrent'}</button>
    <button class="btn outline" data-been="${e.id}">${done?'✓ Dans mes sorties':'J\'y suis allé·e'}</button>
    <p class="hint" style="margin:0">Liste d'attente : la disponibilité des billets n'est pas encore connectée. Dans l'appli finale, vous recevrez une notification si des places se libèrent.</p></section>`;
  const at=h.lastIndexOf('</div>');
  return at>=0?h.slice(0,at)+block+h.slice(at):h+block;
};

const v4Profile=pageProfile;
pageProfile=function(){return `<button class="btn primary v4profilebtn" data-v4go="sorties">Mes sorties et badges</button>`+v4Profile()};

const v4Render=render;
render=function(){
  if(onboard>=STEPS&&!editing&&page==='sorties'&&!detailId){
    page='accueil';v4Render();page='sorties';view.innerHTML=pageSorties();bind();
    if(typeof decorate==='function')decorate();return;
  }
  v4Render();
};

const v4Bind=bind;
bind=function(){
  v4Bind();
  const each=(sel,fn)=>view.querySelectorAll(sel).forEach(el=>el.onclick=()=>fn(el));
  each('[data-venue]',el=>{const v=el.dataset.venue;V4.venues=followsVenue(v)?V4.venues.filter(x=>v4norm(x)!==v4norm(v)):[...V4.venues,v];v4save();
    const box=el.closest('details');render();if(box){const d=view.querySelector('.v4block details');if(d)d.open=true}});
  each('[data-wait]',el=>{const k=el.dataset.wait;V4.waitlist=onWaitlist(k)?V4.waitlist.filter(x=>x!==k):[...V4.waitlist,k];v4save();render()});
  each('[data-been]',el=>{const e=EVENTS.find(x=>x.id===+el.dataset.been);if(!e)return;if(V4.history.some(h=>h.id===e.id)){V4.history=V4.history.filter(h=>h.id!==e.id);v4save()}else addHistory(e,iso(today),'manuel');render()});
  each('[data-confirmplan]',el=>{const p=plans.find(x=>x.id===el.dataset.confirmplan);if(!p)return;const e=EVENTS.find(x=>x.id===p.eventId)||p.eventSnapshot;if(e)addHistory(e,p.date,'agenda');render()});
  each('[data-unhist]',el=>{V4.history=V4.history.filter(h=>h.key!==el.dataset.unhist);v4save();render()});
  each('[data-v4go]',el=>go(el.dataset.v4go));
  const inv=document.querySelector('#v4invite');
  if(inv)inv.onclick=()=>{const t=document.querySelector('#v4invitetext'),msg=document.querySelector('#v4invitemsg');
    const ok=()=>{if(V4.invited===0){V4.invited=1;v4save();msg.textContent='Invitation copiée. Badge Ambassadeur·rice débloqué !';setTimeout(render,1200)}else msg.textContent='Invitation copiée.'};
    try{navigator.clipboard.writeText(t.value).then(ok,()=>{t.select();msg.textContent='Sélectionnez le texte et copiez-le.'})}catch(e){t.select();msg.textContent='Sélectionnez le texte et copiez-le.'}};
};

if((location.hash||'').slice(1)==='sorties')page='sorties';
window.addEventListener('hashchange',()=>{if(location.hash.slice(1)==='sorties'){page='sorties';detailId=null;render()}});
render();
