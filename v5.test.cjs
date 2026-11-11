// V5 : organisateur masqué, lien « Restaurants autour », pages Billets et Agenda d'origine.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const dir=path.join(__dirname,'..');const catalog=JSON.parse(fs.readFileSync(path.join(dir,'data/catalog.json')));
class D extends Date{constructor(...a){super(...(a.length?a:['2026-10-25T12:00:00+01:00']))}static now(){return new Date('2026-10-25T12:00:00+01:00').getTime()}}
const store=new Map();const ctx=vm.createContext({window:{MEKO_CATALOG:catalog,addEventListener(){}},console,Date:D,Intl,URL,navigator:{},location:{hash:'',origin:'x'},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem(){}},document:{querySelector(){return null}},setTimeout,clearInterval,scrollTo(){}});
const strip=s=>s.replace(/^render\(\);$/gm,'');
vm.runInContext(fs.readFileSync(path.join(dir,'planner-core.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(dir,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
for(const f of ['v2.js','live-ui.js','v4-shotgun.js','v5-simple.js'])vm.runInContext(strip(fs.readFileSync(path.join(dir,f),'utf8')),ctx);
const run=s=>vm.runInContext(s,ctx);
run("render=()=>{};Object.assign(S,{name:'L',who:['couple'],city:'Paris',types:['concert']})");
assert.doesNotMatch(run('pageHome()'),/data-tab="organiser"/);
run('var ev=EVENTS.find(e=>e.live&&nextIdx(e)>=0);detailId=ev.id');const d=run('pageDetail()');
assert.doesNotMatch(d,/Organiser ma soirée/);assert.match(d,/Restaurants autour/);assert.match(d,/google\.com\/maps\/search/);assert.match(d,/Billets et infos/);
assert.doesNotMatch(run('pageTickets()'),/Mon portefeuille/);assert.match(run('pageTickets()'),/Vos salles/);
assert.doesNotMatch(run('pageAgenda()'),/Mon agenda/);
assert.equal(run('TABS[3][1]'),'Billets');
console.log('9 assertions V5 réussies : organisateur masqué, restaurants autour, pages d\'origine.');
// Public familial déduit des descriptions : la recherche « mon fils de 8 ans » ne doit plus être vide.
assert.ok(run('EVENTS.filter(e=>e.famHint).length')>50);
run("Object.assign(S,{who:['famille'],ages:['7-11 ans']})");
assert.ok(run("runAsk(parseAsk('un spectacle en famille')).length")>0);
console.log('2 assertions famille réussies.');
