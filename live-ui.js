'use strict';
POSTER.cinema=POSTER.theatre;
function provenance(e){if(!e.live)return '<p class="v2notice">Catalogue historique non revérifié. Aucune séance réelle proposée.</p>';
const x=e.live,age=(Date.now()-Date.parse(x.lastCheckedAt))/86400000;
return `<section class="v2notice"><b>Événement publié sur un agenda réel · ${age>2?'Données anciennes, à revérifier':'Données récupérées auprès de la source'}</b><p>Disponibilité des billets : non vérifiée. Tarif : non vérifié (${esc(x.priceText)}). Aucun stock temps réel.</p><p>Dernière récupération réussie : ${esc(x.lastCheckedAt)}<br>Mise à jour de la fiche source : ${esc(x.source.updatedAt||'non renseignée')}</p>${x.sources.map(s=>`<p>Source : <a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.licence.publisher)}</a> · <a href="${esc(s.licence.url)}">${esc(s.licence.name)}</a></p>`).join('')}<p>${x.quality.warnings.map(esc).join(' · ')}</p><p>Public et âge conseillé non qualifiés par ce connecteur. Horaires exprimés en Europe/Paris. Plusieurs séances le même jour : consultez la source ; l’organisateur utilise la première.</p></section>`}
const liveDetail=pageDetail;pageDetail=function(){const e=EVENTS.find(x=>x.id===detailId);return liveDetail().replace(e.live?'small>Âge</small><b>Adultes':'__absent__','small>Âge</small><b>À vérifier')+provenance(e)};
const liveCard=card;card=function(e,d){return liveCard(e,d).replace('</h3>','</h3><span class="hint">'+(e.live?'Source publique · billets et tarif non vérifiés':'Archive non revérifiée')+'</span>')};
const livePlanner=pagePlanner;pagePlanner=function(){return livePlanner()+(draft?provenance(EVENTS.find(e=>e.id===draft.eventId)):'')};
const liveDecorate=decorate;decorate=function(){liveDecorate();if(onboard<STEPS||editing)return;
const states=liveData?.sources||[];
view.insertAdjacentHTML('afterbegin',`<section class="v2notice"><b>Agenda connecté — Paris et région</b><p>${states.map(s=>esc(s.name)+': '+({ok:'synchronisé',error:'échec, ancien cache conservé',not_configured:'accès à configurer'}[s.status]||s.status)).join(' · ')}</p><p>Récupération du catalogue : ${esc(liveData?.generatedAt||'aucune')}. Mise à jour automatique toutes les 6 h lorsque le service de synchronisation est lancé. Rechargez pour recevoir le dernier catalogue.</p><details><summary>Événements sans séance exploitable</summary>${(liveData?.events||[]).filter(e=>!e.sessions.length).map(e=>`<p><a href="${esc(e.source.url)}">${esc(e.title)}</a> · ${esc(e.venue)} · horaires, disponibilité et tarif à vérifier auprès de la source. ${esc(e.source.licence.publisher)} — ${esc(e.source.licence.name)} — mise à jour ${esc(e.source.updatedAt||'inconnue')}</p>`).join('')||'Aucun.'}</details></section>`);
};
render();

// Choisir le spectacle directement depuis le billet d'organisation.
let eveningChoice={date:'',category:'theatre',occasion:'couple'};
function eveningResults(){
  const chosen=eveningChoice.date;
  return EVENTS.filter(e=>e.live&&(!eveningChoice.category||e.cat===eveningChoice.category)).flatMap(e=>{
    const s=e.live.sessions.find(s=>s.localDate>=iso(DAYS[0])&&s.localDate<=iso(DAYS[DAYS.length-1])&&(!chosen||s.localDate===chosen)&&s.localTime>='18:00');
    return s?[{event:e,session:s}]:[];
  }).sort((a,b)=>a.session.start.localeCompare(b.session.start)||a.event.t.localeCompare(b.event.t,'fr'));
}
const sourcePlanner=pagePlanner;
pagePlanner=function(){
 if(draft)return `<button class="btn outline" id="change-show">← Choisir un autre spectacle</button>`+sourcePlanner();
 const results=eveningResults();
 return `<section class="ticket stack"><h1>Organiser ma soirée</h1><p>Commençons par le spectacle. Choisissez une sortie à partir de 18 h, puis construisez votre dîner autour.</p>
 <form id="evening-search" class="planner"><label>Quel jour ?<input name="date" type="date" min="${iso(DAYS[0])}" max="${iso(DAYS[DAYS.length-1])}" value="${esc(eveningChoice.date)}"></label><p class="hint">Sans date : les six prochaines semaines.</p>
 <label>Quel spectacle ?<select name="category">${[['theatre','Théâtre'],['humour','Humour'],['concert','Concert'],['musical','Comédie musicale'],['expo','Exposition'],...(CINEMA_ENABLED?[['cinema','Cinéma']]:[]),['','Tous les genres']].map(([v,t])=>`<option value="${v}" ${eveningChoice.category===v?'selected':''}>${t}</option>`).join('')}</select></label>
 <label>Avec qui ?<select name="occasion">${[['couple','À deux, en amoureux'],['amis','Entre amis'],['solo','En solo']].map(([v,t])=>`<option value="${v}" ${eveningChoice.occasion===v?'selected':''}>${t}</option>`).join('')}</select></label><button class="btn primary" type="submit">Trouver nos idées de soirée</button></form>
 <p class="hint">« À deux » prépare un programme pour deux personnes. Le caractère romantique et le public conseillé ne sont pas qualifiés par la source. Tarifs et billets à vérifier. Catalogue partiel de Paris et sa région.</p>
 <h2>${results.length} idée${results.length===1?'':'s'} avec un horaire publié</h2>${results.slice(0,30).map(({event:e,session:s})=>`<article class="ticket"><h3>${esc(e.t)}</h3><p>${esc(e.venue)} · ${esc(e.city)}<br>${esc(s.localDate)} à ${esc(s.localTime)} · tarif et disponibilité à vérifier</p><button class="btn primary" data-evening="${e.id}" data-session="${esc(s.start)}">Choisir pour notre soirée</button><button class="btn outline" data-open="${e.id}">Voir la fiche et la source</button></article>`).join('')||'<p>Aucun horaire correspondant dans notre catalogue. Essayez un autre jour ou un autre genre ; cela ne signifie pas qu’aucun spectacle n’existe.</p>'}${results.length>30?'<p>Les 30 premières idées sont affichées. Choisissez un jour pour affiner.</p>':''}</section>`;
};
const sourceBind=bind;
bind=function(){sourceBind();
 const f=document.querySelector('#evening-search');if(f)f.onsubmit=ev=>{ev.preventDefault();const data=new FormData(f);eveningChoice={date:data.get('date'),category:data.get('category'),occasion:data.get('occasion')};render()};
 const change=document.querySelector('#change-show');if(change)change.onclick=()=>{draft=null;render()};
 view.querySelectorAll('[data-evening]').forEach(b=>b.onclick=()=>{
   const e=EVENTS.find(e=>e.id===+b.dataset.evening),s=e.live.sessions.find(s=>s.start===b.dataset.session);if(!s)return;
   startPlan(e.id);draft.date=s.localDate;draft.input.start=s.localTime;draft.people=eveningChoice.occasion==='solo'?1:2;
   // Une séance tardive de la journée reste celle explicitement choisie.
   draft.selectedSession=s.start;render();
 });
};
// Ciné-événements : projections spéciales rangées avec les festivals tant que le cinéma est en pause.
const cineLabel=h=>h.split('Festivals & ciné-événements').join('Ciné-événement');
const cineCard=card;card=function(e,d){const h=cineCard(e,d);return e&&e.cine&&!CINEMA_ENABLED?cineLabel(h):h};
const cineDetail=pageDetail;pageDetail=function(){const e=EVENTS.find(x=>x.id===detailId),h=cineDetail();return e&&e.cine&&!CINEMA_ENABLED?cineLabel(h):h};
render();
