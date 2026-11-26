/* V8 — Billetteries partenaires : prix et bouton d'achat rémunéré quand le flux catalogue a trouvé l'événement.
   Les offres sont rattachées chaque nuit par ingestion/sync.py (champ offers de l'événement). */
'use strict';
const OFFER_ORDER=['fnac','billetreduc','cdiscount','ticketac'];
const bestOffer=e=>{const o=e&&e.live&&e.live.offers;if(!o)return null;const k=OFFER_ORDER.find(x=>o[x]&&/^https:\/\//.test(o[x].url));return k?{key:k,...o[k]}:null};
for(const e of EVENTS){const o=bestOffer(e);if(o&&typeof o.price==='number'&&e.price==null)e.price=o.price}
const v8detail=pageDetail;
pageDetail=function(){
  const e=EVENTS.find(x=>x.id===detailId);let h=v8detail();const o=bestOffer(e);if(!o)return h;
  const btn=`<a class="btn primary srclink" href="${esc(o.url)}" target="_blank" rel="sponsored noopener">Réserver sur ${esc(o.label)}${typeof o.price==='number'?' · dès '+o.price.toLocaleString('fr-FR',{maximumFractionDigits:2})+' €':''} ↗</a>`;
  const note='<p class="hint v8aff">Lien partenaire : Venivi peut percevoir une commission, sans surcoût pour vous. Prix indicatif, à confirmer sur le site.</p>';
  if(h.includes('>Billets et infos ↗</a>'))h=h.replace(/<a class="btn primary srclink" (href="[^"]*" target="_blank" rel="noopener")>Billets et infos ↗<\/a>/,btn+'<a class="btn outline srclink" $1>Infos sur la source ↗</a>');
  else h=h.replace('<p class="note" id="soon"',btn+'<p class="note" id="soon"');
  return h.replace('<p class="note" id="soon"',note+'<p class="note" id="soon"');
};
render();
