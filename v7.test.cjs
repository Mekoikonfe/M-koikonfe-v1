// V7 : retours d'Alexandre — icônes, musique, swipe explicite, ton neutre, duels retirés, recherche d'artiste stricte.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const dir=path.join(__dirname,'..');const catalog=JSON.parse(fs.readFileSync(path.join(dir,'data/catalog.json')));
class D extends Date{constructor(...a){super(...(a.length?a:['2026-11-12T12:00:00+01:00']))}static now(){return new Date('2026-11-12T12:00:00+01:00').getTime()}}
const store=new Map();const ctx=vm.createContext({window:{MEKO_CATALOG:catalog,addEventListener(){}},console,Date:D,Intl,URL,navigator:{},location:{hash:'',origin:'x'},history:{replaceState(){}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem(){}},document:{querySelector(){return null},head:{insertAdjacentHTML(){}}},setTimeout,clearInterval,scrollTo(){}});
const strip=s=>s.replace(/^render\(\);$/gm,'');
vm.runInContext(fs.readFileSync(path.join(dir,'planner-core.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(dir,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
for(const f of ['v2.js','live-ui.js','v4-shotgun.js','v5-simple.js','v6-accueil.js','v7-retours.js'])vm.runInContext(strip(fs.readFileSync(path.join(dir,f),'utf8')),ctx);
const run=s=>vm.runInContext(s,ctx);
run("render=()=>{};Object.assign(S,{name:'Alex',city:'Paris',who:['couple'],types:['concert'],budget:'any',styles:['rock']})");
// Icônes à la place des glyphes
const t=run("TYPES.map(o=>tile(o,false,'data-type')).join('')");
assert.match(t,/<svg/);assert.doesNotMatch(t,/Ha!|Tada|5,6,7,8|Stand B|Salle 7/);
// Onboarding : 5 étapes, musique d'abord, ton neutre
run('onboard=0');const s0=run('onboardingView()');
assert.match(s0,/Votre tranche d’âge \(facultatif\)/);assert.match(s0,/Je préfère ne pas répondre/);assert.doesNotMatch(s0,/mystère|Promis|Six petits/);
run('onboard=2');const s2=run('onboardingView()');
assert.match(s2,/Qu’aimez-vous écouter/);assert.match(s2,/data-v7style="funk"/);assert.doesNotMatch(s2,/voir sur scène/);
run('onboard=5');const s5=run('onboardingView()');
assert.match(s5,/Pas de limite/);assert.doesNotMatch(s5,/vois large|😅/);assert.match(s5,/Billet 5 · le pratique/);
// Duels retirés du profil, envie du moment facultative
run("S.duels={mood:'none',size:'none',style:'none'};onboard=STEPS");const p=run('pageProfile()');
assert.doesNotMatch(p,/data-edit="4"/);assert.match(p,/Envie du moment/);assert.match(p,/<small>Musique<\/small><span>Rock/);
// Swipe explicite
const sw=run('pageSwipe()');assert.match(sw,/Pas pour moi/);assert.match(sw,/ajouté à vos favoris/);
// Style écouté : bonus et raison
const rock=run("EVENTS.find(e=>e.cat==='concert'&&/\\brock\\b/i.test(e.t+' '+(e.d||'')))");
if(rock){const r=run('score(EVENTS.find(e=>e.id==='+rock.id+'),null,null)');assert.ok(r.why.some(w=>/rock/.test(w)),'raison rock')}
// Recherche d'artiste : jamais de suggestions hors sujet
run("askQ='Orelsan'");const o=run('pageSearch()');
assert.match(o,/Rien de programmé pour « Orelsan »/);assert.match(o,/data-v7follow="Orelsan"/);assert.doesNotMatch(o,/class="ev"/);
// Les phrases d'exemple restent des recherches par critères
for(const q of ASK_EX_LIST())assert.ok(!run('parseAsk('+JSON.stringify(q)+').strict'),q);
function ASK_EX_LIST(){return run('ASK_EX')}
// Un vrai titre du catalogue est retrouvé, même loin
const ev=run("EVENTS.find(e=>e.live&&e.dates.length&&e.t.split(/\\s+/).some(w=>w.length>6))");
const word=ev.t.split(/\s+/).find(w=>w.length>6);run('askQ='+JSON.stringify(word));
assert.ok(run('parseAsk(askQ).ids.includes('+ev.id+')'),'titre retrouvé');assert.doesNotMatch(run('pageSearch()'),/Rien de programmé/);
console.log('V7 : icônes, 5 étapes, musique, ton neutre, profil, swipe, recherche stricte — assertions réussies.');
