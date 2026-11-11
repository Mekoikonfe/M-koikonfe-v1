/* Adaptation du catalogue normalisé au parcours de Laure. */
'use strict';
const liveData=window.MEKO_CATALOG;
if(liveData){
  // Garder les identifiants historiques pour retrouver favoris et soirées, sans séances inventées.
  EVENTS.forEach(e=>{e.dates=[];e.runs=[];delete e.run;e.legacy=true});
  if(typeof CINEMA_ENABLED!=='undefined'&&CINEMA_ENABLED&&!TYPES.some(t=>t.id==='cinema'))TYPES.push({id:'cinema',g:'▶',t:'Cinéma',s:'Projections et rencontres'});

  for(const e of liveData.events){
    const id=100000000+parseInt(Array.from(e.key).reduce((a,c)=>((a*31+c.charCodeAt(0))>>>0),0).toString(16),16);
    // Clé numérique stable pour compatibilité des favoris et de l'organisateur.
    if(EVENTS.some(x=>x.id===id))throw Error('Collision identifiant catalogue');
    const times={};for(const s of e.sessions){if(!times[s.localDate])times[s.localDate]=s.localTime}
    EVENTS.push({id,t:e.title,cat:(e.category==='cinema'&&!(typeof CINEMA_ENABLED!=='undefined'&&CINEMA_ENABLED))?'festival':e.category,cine:e.category==='cinema',d:e.description,venue:e.venue,city:e.city,src:e.source.url,price:null,dates:Object.keys(times),times,time:Object.values(times)[0],aud:['solo','couple','amis'],ages:null,approx:false,live:e});
  }
}
