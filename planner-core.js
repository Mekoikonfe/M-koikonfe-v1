/* Logique pure, commune à l'interface et aux tests. Aucune API partenaire. */
(function(root){
'use strict';
function minutes(t){if(!/^\d{2}:\d{2}$/.test(t))throw Error('Horaire invalide');const [h,m]=t.split(':').map(Number);if(h>23||m>59)throw Error('Horaire invalide');return h*60+m}
function clock(m){return `${Math.floor(m/1440)?'J+'+Math.floor(m/1440)+' ':''}${String(Math.floor(m%1440/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`}
function plan({start,duration,meal,walk,margin,order,slot}){
 const a=minutes(start), b=minutes(slot);
 for(const n of [duration,meal,walk,margin])if(!Number.isInteger(n)||n<0)throw Error('Durée invalide');
 if(duration<30||meal<30||walk>120||margin<10)throw Error('Durées hors limites');
 const end=a+duration, dinner=order==='after'&&b<a?b+1440:b;
 const gap=order==='before'?a-(dinner+meal+walk+margin):dinner-(end+walk+margin);
 return {ok:gap>=0,gap,start:a,end,dinner,dinnerEnd:dinner+meal,departure:order==='before'?dinner+meal:end,arrival:order==='before'?dinner+meal+walk:end+walk};
}
const api={minutes,clock,plan};root.EntractePlanner=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
