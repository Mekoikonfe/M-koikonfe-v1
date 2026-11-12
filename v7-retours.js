/* V7 — Retours d'Alexandre : icônes, « Qu'aimez-vous écouter ? », swipe explicite, ton neutre,
   duels retirés du quiz (remplacés par une « Envie du moment » facultative dans le Profil),
   recherche d'artiste stricte : la prochaine date, ou « rien de programmé », jamais de suggestion hors sujet. */
'use strict';
const V7VERSION='Version du 12 novembre · V10';

/* ---------- Icônes à la place des « Ha! », « Tada », « 5,6,7,8 »… ---------- */
const ICONS={
  humour:'<circle cx="12" cy="12" r="9"/><path d="M8 14.5a4.5 4.5 0 0 0 8 0"/><path d="M9 9.5h.01M15 9.5h.01"/>',
  theatre:'<path d="M4 4h16v6a8 8 0 0 1-16 0z"/><path d="M8.5 9h.01M15.5 9h.01"/><path d="M9 13.5a3 3 0 0 0 6 0"/>',
  concert:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  musical:'<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v4M8 21h8"/>',
  danse:'<circle cx="13" cy="4" r="2"/><path d="M11 8 7 12l3 2-2 7"/><path d="m11 8 4 2 3-2"/><path d="m10 14 5 2 1 5"/>',
  cirque:'<path d="M3 20 12 5l9 15z"/><path d="M12 5v15"/><path d="m9 20 3-6 3 6"/><path d="M12 5V2l3 1-3 1"/>',
  opera:'<path d="M12 3 21 8H3z"/><path d="M4 10h16M3 21h18"/><path d="M6 10v11M10 10v11M14 10v11M18 10v11"/>',
  jeune:'<path d="M12 3a6 6 0 0 0-6 6c0 4 6 8 6 8s6-4 6-8a6 6 0 0 0-6-6z"/><path d="M12 17c0 2-2 3-1 5"/>',
  salon:'<path d="M3 9h18l-2-5H5z"/><path d="M5 9v11M19 9v11M3 20h18"/><path d="M9 20v-6h6v6"/>',
  festival:'<path d="m12 3 2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/>',
  expo:'<rect x="3" y="4" width="18" height="16" rx="1"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="16" cy="8.5" r="1.5"/>',
  cinema:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>'
};
const icon=id=>ICONS[id]?`<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[id]}</svg>`:'';
const v7tile=tile;
tile=function(o,on,attr){
  const h=v7tile(o,on,attr);
  return attr==='data-type'&&ICONS[o.id]?h.replace(/<span class="glyph">[\s\S]*?<\/span>/,`<span class="glyph v7ico">${icon(o.id)}</span>`):h;
};
const v7scard=scard;
scard=function(e,i){
  return v7scard(e,i).replace(/<span class="art" aria-hidden="true">[\s\S]*?<\/span>/,`<span class="art v7ico" aria-hidden="true">${icon(e.cat)}</span>`)
    .replace('<span class="stamp like">J\'Y VAIS</span><span class="stamp nope">BOF</span>','<span class="stamp like">FAVORI</span><span class="stamp nope">PAS POUR MOI</span>');
};

/* ---------- Styles de musique, comme sur Deezer ou Apple Music ---------- */
const STYLES=[
  ['pop','Pop',/\bpop\b/],['rock','Rock',/\brock\b/],['rap','Rap & hip-hop',/\brap\b|hip.?hop|urbain/],
  ['chanson','Chanson française',/chanson/],['electro','Électro',/electro|techno|\bhouse\b|\bdj\b/],
  ['jazz','Jazz',/jazz|swing/],['blues','Blues',/blues/],['funk','Funk & soul',/funk|\bsoul\b|disco|groove/],
  ['rnb','R&B',/r ?& ?b\b|\brnb\b/],['classique','Classique',/classique|orchestre|symphon|quatuor|piano|recital|baroque|lyrique/],
  ['metal','Métal',/metal/],['reggae','Reggae',/reggae|\bdub\b|ska\b/],
  ['monde','Musiques du monde',/musiques? du monde|afro|latin|flamenco|salsa|tango|fado|bossa|world/],
  ['folk','Folk & country',/\bfolk\b|country|bluegrass/],['gospel','Gospel',/gospel/],
  ['films','Musiques de films',/musiques? de films?|cine.?concert|bande originale/]
];
const MUSIC_CATS=['concert','opera','festival','musical','danse'];
const v7styles=()=>{if(!Array.isArray(S.styles))S.styles=[];S.styles=S.styles.filter(id=>STYLES.some(s=>s[0]===id));return S.styles};
function styleMatch(e){
  if(!MUSIC_CATS.includes(e.cat)||!v7styles().length)return null;
  const t=norm((e.t||'')+' '+(e.d||'')+' '+((e.artists||[]).join(' ')));
  return STYLES.find(s=>S.styles.includes(s[0])&&s[2].test(t))||null;
}
const v7score=score;
score=function(e,occ,d){
  const r=v7score(e,occ,d);if(!r)return r;
  const st=styleMatch(e);
  if(st){r.pct=Math.min(99,r.pct+10);const i=r.why.findIndex(w=>w.startsWith('vous aimez '));const w='vous écoutez : '+st[1].toLowerCase();if(i>=0)r.why[i]=w;else if(r.why.length<2)r.why.push(w);else r.why[1]=w}
  return r;
};

/* ---------- Onboarding : ton neutre, duels retirés, musique d'abord ---------- */
BUDGET[2][1]='Plus de 60 €';BUDGET[3][1]='Pas de limite';
const v7onb=onboardingView;
onboardingView=function(){
  let h=v7onb();
  if(onboard===0)h=h
    .replace(/<p class="lead">Six petits billets[^<]*<\/p>/,'<p class="lead">Cinq questions rapides, puis des idées de sorties pour chaque jour : spectacles, concerts, expositions, à deux, entre amis ou avec les enfants.</p>')
    .replace('Vous connaissez votre âge, à peu près ?','Votre tranche d’âge (facultatif)')
    .replace(/<p class="hint" id="user-age-joke">[\s\S]*?<\/p>\s*/,'')
    .replace('aria-describedby="user-age-joke user-age-hint"','aria-describedby="user-age-hint"')
    .replace('>Je cultive le mystère</option>','>Je préfère ne pas répondre</option>')
    .replace('Facultatif — vous pouvez garder le mystère.','Elle sert uniquement à affiner les idées de sorties.');
  if(onboard===2){
    const n=v7styles().length;
    h=h.replace('Billet 3 · vos artistes','Billet 3 · votre musique')
      .replace(/<h2>Qui aimeriez-vous voir sur scène \?<\/h2><p class="lead">[\s\S]*?<\/p>/,
        '<h2>Qu’aimez-vous écouter ?</h2><p class="lead">Vos styles de musique d’abord. Ensuite, si vous le souhaitez, quelques artistes que vous aimez : ils nous aident à comprendre vos goûts. Tout est facultatif.</p>')
      .replace(/<div class="tear"><\/div>\s*<div class="stack">/,
        `<div class="tear"></div><div class="stack"><div class="agroup"><small>Styles de musique</small><div class="chips v7styles">${STYLES.map(s=>`<button class="chipbtn" data-v7style="${s[0]}" aria-pressed="${S.styles.includes(s[0])}">${esc(s[1])}</button>`).join('')}</div></div><p class="f v7arttitle">Des artistes que vous aimez</p>`);
    if(n)h=h.replace(/(<p class="hint">)([^<]*)(<\/p><div class="actions">)/,`$1${n} style${n>1?'s':''} · $2$3`).replace('>Passer</button>','>Suivant</button>');
  }
  if(onboard===5)h=h.replace('Billet 6 · le pratique','Billet 5 · le pratique')
    .replace(/<p class="hint">Un plafond, pas un minimum[\s\S]*?<\/p>/,'<p class="hint">Un plafond, pas un minimum : les petits prix restent proposés. « Pas de limite » : aucun plafond. Les prix inconnus restent à vérifier.</p>');
  return h;
};

/* ---------- Profil : musique, envie du moment, libellés neutres ---------- */
const ENVIES=[['none','Peu importe'],['decouverte','Découvrir des talents'],['classique','Valeurs sûres']];
const v7profile=pageProfile;
pageProfile=function(){
  const st=v7styles().map(id=>STYLES.find(s=>s[0]===id)[1]);
  const mus=[st.join(', '),S.artists.join(', ')].filter(Boolean).join(' · ')||'Aucun style ni artiste choisi';
  const cur=ENVIES.some(x=>x[0]===S.duels.style)?S.duels.style:'none';
  return v7profile()
    .replace(/<button data-edit="4">[\s\S]*?<\/button>/,'')
    .replace(/<button data-edit="2"><small>Artistes<\/small><span>[\s\S]*?<\/span>/,`<button data-edit="2"><small>Musique</small><span>${esc(mus)}</span>`)
    .replace('Je cultive le mystère','Âge non précisé')
    .replace('<section class="ticket stack v6links">',`<section class="ticket stack v7envie"><h2>Envie du moment</h2>
      <div class="chips" role="group" aria-label="Envie du moment">${ENVIES.map(([id,t])=>`<button class="chipbtn" data-v7envie="${id}" aria-pressed="${cur===id}">${t}</button>`).join('')}</div>
      <p class="hint">Change seulement l’ordre des idées, sans rien exclure. À modifier quand vous voulez.</p></section><section class="ticket stack v6links">`);
};

/* ---------- Découvrir : ce que fait chaque geste ---------- */
const v7swipe=pageSwipe;
pageSwipe=function(){
  return v7swipe()
    .replace('<h1>Swipez vos envies</h1>','<h1>Swipez vos envies</h1><p class="v7swintro">♥ ou glisser à droite : ajouté à vos favoris, et plus d’idées de ce genre. ✕ ou glisser à gauche : on passe, ce genre remonte moins.</p>')
    .replace(/<div class="swbtns">[\s\S]*?<\/div>\s*<p class="swhint">[\s\S]*?<\/p>/,
      `<div class="swbtns v7swbtns"><span><button class="swb nope" data-sw="nope" aria-label="Pas pour moi">✕</button><small>Pas pour moi</small></span><span><button class="swb info" data-sw="info" aria-label="Voir la fiche">i</button><small>La fiche</small></span><span><button class="swb like" data-sw="like" aria-label="Ajouter aux favoris">♥</button><small>Favori</small></span></div>`);
};

/* ---------- Recherche d'un artiste ou d'un titre précis ---------- */
const V7STOP=new Set(['expo','expos','musee','salon','salons','theatre','festival','concert','musical','spectacle','comedy','club','livre','presse','nuits','faire','pour','grand','petit','seul','tout','histoire','histoires','entre','deux','france','jeunesse','culturel','international','patrimoine','mere','prochain',
  'semaine','semaines','prochaine','prochaines','suivante','suivant','demain','apres','aujourd','soir','soiree','soirees','journee','matin','week','weekend','samedi','dimanche','lundi','mardi','mercredi','jeudi','vendredi','amoureux','amoureuse','couple','romantique','famille','enfant','enfants','fille','fils','amis','amies','avec','dans','sans','cette','quel','quelle','quels','quelles','cherche','chercher','recherche','trouver','sortie','sorties','piece','pieces','theatres','concerts','spectacles','musique','humour','cinema','gratuit','gratuite','gratuites','cher','budget','moins','euros','novembre','octobre','decembre','janvier','fevrier','vacances','toussaint',
  'truc','trucs','sympa','chose','choses','idee','idees','envie','sortir','voir','aller','bien','super','cool','original','originale','activite','activites','chouette','belle','beau','bonne','quelque','notre','nous','vous','petite','petits','petites','grande','grands','jeune','jeunes','public','prix','pres','chez','autour','ville','quoi','comment','plus','tres','tous','toutes','ambiance','exposition','expositions','musees','festivals','ados','bebe','gouter','midi','matinee','nuit','pendant','avant','depuis','mois','jour','jours','date','dates','prochains','places','billet','billets','tarif','reduit','neveu','niece','gamin','gamins','copine','copain','copines','copains','potes','bande','collegues','femme','mari','cheri','cherie','seule','solo','famille','marrant','drole','droles','emouvant','show','shows','scene','salle','salles','danse','opera','cirque','magie']);
const nameTerms=raw=>{
  const venues=new Set(EVENTS.flatMap(e=>norm(e.venue+' '+e.city).split(/[^a-z0-9]+/)));
  return norm(raw).split(/[^a-z0-9]+/).filter(w=>w.length>3&&!/^\d+$/.test(w)&&!V7STOP.has(w)&&!venues.has(w)&&!CATKW.some(([,re])=>re.test(w)));
};
const words=s=>norm(s||'').split(/[^a-z0-9]+/);
const v7parse=parseAsk;
parseAsk=function(raw){
  const p=v7parse(raw),terms=nameTerms(raw);
  if(!terms.length||/candlelight|bougie|opera de paris|garnier|bastille/.test(norm(raw)))return p;
  const has=(e,f)=>terms.every(w=>f(e).includes(w));
  let hits=EVENTS.filter(e=>has(e,x=>words(x.t+' '+(x.artists||[]).join(' '))));
  if(!hits.length)hits=EVENTS.filter(e=>has(e,x=>words(x.d)));
  p.ids=hits.map(e=>e.id);p.strict=true;
  p.name=raw.split(/\s+/).filter(w=>terms.includes(norm(w).replace(/[^a-z0-9]/g,''))).join(' ')||raw.trim();
  return p;
};
const v7search=pageSearch;
pageSearch=function(){
  const p=parseAsk(askQ);
  if(!p.strict||runAsk(p).length)return v7search();
  const now=iso(today);
  const far=EVENTS.filter(e=>p.ids.includes(e.id)).map(e=>({...e,next:(e.dates||[]).filter(x=>x>=now).sort()[0]})).filter(e=>e.next).sort((a,b)=>a.next.localeCompare(b.next));
  const nm=esc(p.name),followed=follows(p.name);
  const body=far.length
    ?`<p class="lead">Pas de date ${p.dayLabel?esc(p.dayLabel):'dans les six prochaines semaines'}. Voici la prochaine :</p><div class="cards">${far.slice(0,5).map(e=>card({...e,pct:null,why:[],hr:e.times&&e.times[e.next]},fmt(new Date(e.next+'T12:00:00'),{weekday:'short',day:'numeric',month:'long',year:'numeric'}))).join('')}</div>`
    :`<p class="empty">Rien de programmé pour « ${nm} » pour l’instant dans notre agenda.</p>
      <button class="btn primary" data-v7follow="${nm}" ${followed?'disabled':''}>${followed?'✓ Vous suivez '+nm:'Suivre '+nm}</button>
      <p class="hint">${followed?nm+' apparaîtra en tête de vos idées dès qu’une date sera au programme.':'Vous le retrouverez dans « Mes alertes », et en tête de vos idées dès qu’une date sera au programme.'}</p>`;
  return `<div class="stack step"><div class="greet"><p>Recherche</p><h1>${nm}</h1></div>${askBox(askQ)}${body}</div>`;
};

/* ---------- Rendu : étapes 1 à 5, envie neutre par défaut, version ---------- */
let v7prev=onboard;
const v7render=render;
render=function(){
  S.duels=S.duels&&typeof S.duels==='object'?S.duels:{};
  for(const k of ['mood','size','style'])if(typeof S.duels[k]!=='string')S.duels[k]='none';
  v7styles();
  if(!editing&&onboard===4)onboard=v7prev>4?3:5;
  v7render();
  v7prev=onboard;
  if(onboard<STEPS&&!editing){
    const n=onboard<4?onboard+1:onboard,st=document.querySelector('#stubno'),pf=document.querySelector('#perfs');
    if(st)st.textContent=`Billet ${n} / 5`;
    if(pf)pf.innerHTML=Array.from({length:5},(_,i)=>`<i class="${i<n?'on':''}"></i>`).join('');
  }
  const v=[...view.querySelectorAll('p.sample')].find(x=>x.innerHTML.includes('Version du'));
  if(v)v.innerHTML=v.innerHTML.replace(/Version du [^<]*/,V7VERSION);
};
const v7bind=bind;
bind=function(){
  v7bind();
  view.querySelectorAll('[data-v7style]').forEach(el=>el.onclick=()=>{const id=el.dataset.v7style;S.styles=S.styles.includes(id)?S.styles.filter(x=>x!==id):[...S.styles,id];save();render()});
  view.querySelectorAll('[data-v7envie]').forEach(el=>el.onclick=()=>{S.duels.style=el.dataset.v7envie;save();render()});
  view.querySelectorAll('[data-v7follow]').forEach(el=>el.onclick=()=>{const a=el.dataset.v7follow;if(!follows(a))S.artists.push(a);save();render()});
};

document.head.insertAdjacentHTML('beforeend',`<style>
.v7ico svg{width:30px;height:30px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;display:block}
.scard .art.v7ico{opacity:.3}.scard .art.v7ico svg{width:clamp(84px,26vw,128px);height:clamp(84px,26vw,128px);stroke-width:1.3}
.v7swintro{margin:6px 0 0;color:var(--muted);font-size:.9rem;line-height:1.4}
.v7swbtns{align-items:flex-start}.v7swbtns>span{display:flex;flex-direction:column;align-items:center;gap:6px}
.v7swbtns small{font-size:.8rem;color:var(--muted);font-weight:600}
.v7arttitle{margin:8px 0 0}
.v7envie h2,.v6links h2{margin:0}
</style>`);
render();
