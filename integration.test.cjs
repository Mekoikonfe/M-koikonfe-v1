const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');const dir=path.join(__dirname,'..');let store=new Map();class TestDate extends Date {constructor(...args){super(...(args.length?args:['2026-10-25T12:00:00+01:00']))}static now(){return new Date('2026-10-25T12:00:00+01:00').getTime()}}const ctx=vm.createContext({console,Date:TestDate,Intl,URL,URLSearchParams,structuredClone,location:{hash:'',protocol:'http:'},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},document:{querySelector:()=>({})},window:{addEventListener(){}},setTimeout,clearInterval,scrollTo(){}});
vm.runInContext(fs.readFileSync(path.join(dir,'planner-core.js'),'utf8'),ctx);
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
vm.runInContext(fs.readFileSync(path.join(dir,'v2.js'),'utf8').replace(/render\(\);\s*$/,''),ctx);
const run=s=>vm.runInContext(s,ctx);
run("Object.assign(S,{name:'Laure',city:'Paris',types:['concert'],who:['couple'],budget:'mid'});render=()=>{};go=p=>{page=p};startPlan(3)");
assert.equal(run('pagePlanner()'),''); // V6 : organisateur supprimé.
assert.equal(run('draft.date'),'2026-10-26');
run("plans=[{...draft,id:'test',status:'simulation',restaurant:restaurants[0]}];persistPlans()");assert.equal(JSON.parse(store.get('entracte-v2-plans')).plans.length,1);
assert.match(run('pageAgenda()'),/Meryl/);assert.match(run('pageTickets()'),/NON VALABLE/);assert.match(run('pageFavs()'),/Aucun favori/);
run('favs=[3];save()');assert.match(run('pageFavs()'),/Meryl/);assert.ok(store.has('entracte2'));
run("draft.input.slot='19:30'");
run("plans[0].status='cancelled'");assert.doesNotMatch(run('pageAgenda()').split('<details>')[0],/Meryl/);
console.log('11 assertions intégration réussies : catalogue, planificateur, agenda, portefeuille, favoris, persistance, annulation.');

// V3 : frontières, absence de minimum et neutralité du mode sans plafond.
for(const price of [0,5,25,60,999,1000,1500,null])assert.equal(run(`budgetScore(${price},'any')`),0);
assert.equal(run("budgetScore(5,'plus')"),8);
assert.equal(run("budgetScore(1000,'plus')"),8);
assert.equal(run("budgetScore(1001,'plus')"),-12);
assert.equal(run("budgetScore(25,'eco')"),8);
assert.equal(run("budgetScore(26,'eco')"),-12);
assert.equal(run("budgetScore(60,'mid')"),8);
assert.equal(run("budgetScore(null,'eco')"),0);
run("S.budget='any';save()");assert.equal(JSON.parse(store.get('entracte2')).S.budget,'any');
assert.match(html,/Mékoikon<span>fé/);
assert.match(html,/Peu importe, j’vois large 😅/);
run("S.budget='any'");
assert.equal(run("score({...EVENTS[0],price:5},null,null).pct"),run("score({...EVENTS[0],price:1000},null,null).pct"));
console.log('19 assertions V3 réussies : budgets, frontières, prix inconnus, identité et persistance.');
