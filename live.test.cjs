const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const dir=path.join(__dirname,'..');const catalog=JSON.parse(fs.readFileSync(path.join(dir,'data/catalog.json')));
class FixedDate extends Date{constructor(...args){super(...(args.length?args:['2026-10-25T12:00:00+01:00']))}static now(){return new Date('2026-10-25T12:00:00+01:00').getTime()}}
const window={MEKO_CATALOG:catalog,addEventListener(){}};
const ctx=vm.createContext({window,console,Date:FixedDate,Intl,URL,location:{hash:''},localStorage:{getItem(){return null},setItem(){}},document:{querySelector(){return {}}},setTimeout,scrollTo(){}});
vm.runInContext(fs.readFileSync(path.join(dir,'planner-core.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(dir,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1],ctx);
vm.runInContext(fs.readFileSync(path.join(dir,'v2.js'),'utf8').replace(/^render\(\);$/gm,''),ctx);
vm.runInContext(fs.readFileSync(path.join(dir,'live-ui.js'),'utf8').replace(/^render\(\);$/gm,''),ctx);
const run=s=>vm.runInContext(s,ctx);
assert.equal(run('EVENTS.filter(e=>e.live).length'),catalog.events.length);
assert.equal(run('EVENTS.filter(e=>e.legacy&&e.dates.length).length'),0);
run("render=()=>{};go=p=>{page=p};Object.assign(S,{who:['solo'],city:'Paris',types:[]});var event=EVENTS.find(e=>e.live&&DAYS.some(d=>playsOn(e,d)));detailId=event.id");
assert.match(run('pageDetail()'),/Disponibilité des billets : non vérifiée/);
assert.match(run('pageDetail()'),/ODbL/);
run('startPlan(event.id)');assert.ok(run('draft'));
assert.equal(run('event.price'),null);assert.doesNotMatch(run('pageHome()'),/Organiser ma soirée/); // V6 : organisateur retiré de l'accueil.
console.log('Intégration réelle : catalogue, archives masquées, fiche sourcée, tarifs inconnus, parcours Laure et organisateur OK.');
assert.ok(run("eveningResults().length")>0);
assert.ok(run("eveningResults().every(x=>x.event.cat==='theatre'&&x.session.localTime>='18:00')"));
run('draft=null');
run("eveningChoice.date='2026-10-31'");assert.ok(run("eveningResults().every(x=>x.session.localDate==='2026-10-31')"));
run("eveningChoice.date='2099-01-01'");
console.log('Recherche depuis l’organisateur : théâtre, soirée, date, choix à deux et absence de résultats OK.');
run("var genericTheatre=parseAsk('Un théâtre la semaine prochaine')");
console.log('Diagnostic recherche :',run('JSON.stringify(genericTheatre)'),run('runAsk(genericTheatre).length'));
assert.equal(run('genericTheatre.ids'),null,'Une demande générique ne doit pas reconnaître un titre');
assert.ok(run('runAsk(genericTheatre).length')>0,'La semaine prochaine contient du théâtre');

for(const query of ['Une pièce de théâtre la semaine prochaine','Un concert la semaine prochaine','Une sortie en amoureux samedi soir','Du théâtre avec des amis demain'])assert.equal(run(`parseAsk(${JSON.stringify(query)}).ids`),null,query);
assert.ok(run("runAsk(parseAsk('Une pièce de théâtre la semaine prochaine')).every(e=>e.cat==='theatre'&&e.di>=1&&e.di<=7)"));
assert.ok(run("parseAsk('Big Mother la semaine prochaine').ids.length")>0,'Un titre réel reste reconnu');
assert.ok(run("runAsk(parseAsk('Big Mother la semaine prochaine')).some(e=>e.t==='Big Mother')"));
assert.ok(run("parseAsk('Au Lucernaire la semaine prochaine').ids.length")>0,'Un lieu réel reste reconnu');
console.log('Régression recherche : mots de calendrier exclus des titres ; théâtre, date, vrais titres et vrais lieux OK.');
