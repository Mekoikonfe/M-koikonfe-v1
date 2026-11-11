/* V5 — Retour à la simplicité : un lien « Restaurants autour » à la place de l'organisateur de soirée.
   L'organisateur reste dans le code (v2.js). Passer PLANNER_ENABLED à true pour le réafficher. */
'use strict';
const PLANNER_ENABLED=false;
if(!PLANNER_ENABLED){
  const restoUrl=e=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('restaurants près de '+[e.venue,e.live&&e.live.address,e.city].filter(Boolean).join(', '));
  const hasPlans=()=>typeof plans!=='undefined'&&plans.some(p=>p.status!=='cancelled');
  // Retire l'enveloppe « portefeuille / agenda de soirées » quand elle est vide, pour retrouver la page d'origine.
  const unwrap=(h,emptyText)=>{
    if(!h.includes(emptyText))return h;
    const s=h.indexOf('<summary>'),e=h.indexOf('</summary>',s),end=h.lastIndexOf('</details>');
    if(s<0||e<0||end<0)return h;
    return '<div class="stack">'+h.slice(e+10,end)+'</div>';
  };

  const v5Home=pageHome;
  pageHome=function(){return v5Home().replace(/<button class="weteaser" data-tab="organiser">[\s\S]*?<\/button>/,'')};

  const v5Detail=pageDetail;
  pageDetail=function(){
    const e=EVENTS.find(x=>x.id===detailId);let h=v5Detail();if(!e)return h;
    h=h.replace(/<button class="btn primary" data-plan="\d+">Organiser ma soirée<\/button><span class="hint">[^<]*<\/span>/,
      `<a class="btn primary srclink" href="${esc(e.src||'#')}" target="_blank" rel="noopener">Billets et infos ↗</a><a class="btn outline srclink" href="${restoUrl(e)}" target="_blank" rel="noopener">Restaurants autour ↗</a>`);
    h=h.replace(/<a class="btn outline srclink" href="[^"]*" target="_blank" rel="noopener">Infos et horaires sur la source ↗<\/a>/,'');
    if(e.famHint)h=h.replace('Public et âge conseillé non qualifiés par ce connecteur.','Public familial et âge indicatifs, déduits de la description de l’événement : à vérifier auprès de la salle.');
    return h.replace('<p class="note" id="soon"','<p class="hint" style="margin:0">Billets : sur le site de la salle ou de la source. Restaurants : recherche autour de la salle sur Google Maps.</p><p class="note" id="soon"');
  };

  const v5Tickets=pageTickets;
  pageTickets=function(){
    const h=v5Tickets();if(plans.some(p=>p.status!=='draft'))return h;
    return h.replace(/<div class="stack"><h1>Mon portefeuille<\/h1>[\s\S]*?<summary>Artistes et annonces du catalogue hérité<\/summary>/,'<div class="stack">').replace(/<\/details><\/div>$/,'</div>');
  };

  const v5Agenda=pageAgenda;
  pageAgenda=function(){const h=v5Agenda();return hasPlans()?h.replace('Ouvrez un spectacle puis « Organiser ma soirée ».',''):unwrap(h,'Aucune soirée enregistrée.')};

  TABS[3][1]='Billets';

  const v5Decorate=decorate;
  decorate=function(){v5Decorate();
    // Accueil épuré : retire les bandeaux techniques et le bouton isolé du haut de page.
    while(view.firstElementChild&&view.firstElementChild.matches('.v2notice,.v2nav'))view.firstElementChild.remove();
    const names={paris:'Que faire à Paris (Ville de Paris, licence ODbL)',openagenda:'OpenAgenda (licences ouvertes)',ticketmaster:'Ticketmaster'};
    const src=((typeof liveData!=='undefined'&&liveData&&liveData.sources)||[]).filter(x=>x.status==='ok'&&names[x.name]).map(x=>names[x.name]).join(', ')||names.paris;
    const when=(typeof liveData!=='undefined'&&liveData&&liveData.generatedAt)?new Date(liveData.generatedAt).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}):'';
    view.insertAdjacentHTML('beforeend','<p class="sample">Agenda : '+esc(src)+(when?', mis à jour le '+esc(when):'')+'. Horaires, tarifs et disponibilité à vérifier sur la fiche source.<br>Version du 11 novembre · V8</p>')};

  if(page==='organiser')page='accueil';
  // Verrou : aucun chemin (ancien lien #organiser, bouton « Reprendre ») ne rouvre l'organisateur.
  const v5Render=render;
  render=function(){if(page==='organiser'){page='accueil';draft=null;try{history.replaceState(null,'','#accueil')}catch(e){}}v5Render()};
  if(typeof startPlan==='function')startPlan=function(){go('accueil')};
  const v5Bind=bind;
  bind=function(){v5Bind();view.querySelectorAll('[data-resume],[data-plan],[data-tab="organiser"]').forEach(b=>b.remove())};
}
render();
