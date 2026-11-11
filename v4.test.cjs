// V4 : ta semaine, salles suivies, liste d'attente, carnet de sorties et badges (catalogue réel livré).
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const dir=path.join(__dirname,'..');const catalog=JSON.parse(fs.readFileSync(path.join(dir,'data/catalog.json')));
class FixedDate extends Date{constructor(...a){super(...(a.length?a:['2026-10-25T12:00:00+01:00']))}static now(){return new Date('2026-10-25T12:00:00+01:00').getTime()}}
const store=new Map();const window={MEKO_CATALOG:catalog,addEventListener(){}};
const ctx=vm.createContext({window,console,Date:FixedDate,Intl,URL,navigator:{},location:{hash:'',origin:'https://exemple.test'},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},document:{querySelector(){return null}},setTimeout,clearInterval,scrollTo(){}});
const strip=s=>s.replace(/^render\(\);$/gm,'');
vm.runInContext(fs.readFileSync(path.join(dir,'planner-core.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(dir,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
for(const f of ['v2.js','live-ui.js','v4-shotgun.js'])vm.runInContext(strip(fs.readFileSync(path.join(dir,f),'utf8')),ctx);
const run=s=>vm.runInContext(s,ctx);
run("render=()=>{};go=p=>{page=p};Object.assign(S,{name:'Laure',who:['couple'],city:'Paris',types:['concert','theatre']})");
// Ta semaine
assert.match(run('pageHome()'),/Ta semaine/);
assert.match(run('pageHome()'),/Suivez vos salles préférées/);
// Salles suivies : boost de classement et rubrique dédiée
run("var ev=EVENTS.find(e=>e.live&&e.venue&&nextIdx(e)>=0);var before=score(ev,null,null).pct;V4.venues=[ev.venue]");
assert.ok(run('score(ev,null,null).pct')>=run('Math.min(99,before)'));
assert.match(run('score(ev,null,null).why.join()'),/salle que vous suivez/);
assert.match(run('pageTickets()'),/Vos salles/);
assert.match(run('pageHome()'),/Du nouveau dans vos salles/);
assert.ok(run('topVenues().length')>5);
// Liste d'attente sur une date en partie complète
assert.match(run("tkcard(ONSALE.find(o=>o.st==='partial'))"),/Liste d'attente/);
assert.doesNotMatch(run("tkcard(ONSALE.find(o=>o.st==='soon'))"),/Liste d'attente/);
run('detailId=ev.id');assert.match(run('pageDetail()'),/Me prévenir si des places se libèrent/);assert.match(run('pageDetail()'),/Suivre|Vous suivez/);
// Carnet et badges
assert.equal(run("addHistory(ev,'2026-10-20','manuel')"),true);assert.equal(run("addHistory(ev,'2026-10-20','manuel')"),false);
assert.equal(run("badgeState().find(b=>b.id==='first').ok"),true);
run("V4.swipes=30");assert.equal(run("badgeState().find(b=>b.id==='swipe').ok"),true);
assert.match(run('pageSorties()'),/Mes badges/);assert.match(run('pageSorties()'),/exemple\.test/);
// Soirée passée de l'agenda à confirmer
run("startPlan(ev.id);plans=[{...draft,id:'p1',date:'2026-10-10',status:'draft',restaurant:restaurants[0]}]");
assert.equal(run('pastPlans().length'),1);assert.match(run('pageSorties()'),/Vous y êtes allé·e/);
// Persistance
run('v4save()');const saved=JSON.parse(store.get('mekoikonfe-v4'));assert.equal(saved.version,1);assert.equal(saved.venues.length,1);assert.equal(saved.history.length,1);
console.log('19 assertions V4 réussies : semaine, salles suivies, liste d\'attente, carnet, badges, persistance.');
