// Plays whole lives headless with three strategies on seeds 1-3 and checks each reaches the ending the game promises:
//   passive (invest only, pays the tax)          -> Lex Luthor
//   hoarder (buys homes and shops, dodges taxes) -> revolt before death
//   hero    (builds, funds every gift it can, pays) -> hero, and still richer than at the start
// node tools/bot.mjs [--years] prints the year-by-year table too.
import {loadSim} from './sim.mjs';
const STRATS={
  passive:S=>{if(S.G.tax)S.answerTax('pay')},
  hoarder:S=>{
    if(S.G.tax)S.answerTax(S.G.lobbied<=S.G.moved?'lobby':'move');
    for(const k of ['rival','homes'])while(S.canMove(k)&&S.G.cash-S.movePrice(k)>S.START_FORTUNE*0.3)S.doMove(k);
  },
  hero:S=>{
    if(S.G.tax)S.answerTax('pay');
    while(S.canMove('build')&&S.G.cash-S.movePrice('build')>S.START_FORTUNE*1.5)S.doMove('build');
    // once a year: turn the next gift on while what you give stays under about half of what you gain, and the last
    // one off again if giving has outgrown that
    if(S.G.week%S.WEEKS===1){const y=S.G.history.at(-1);if(y){
      const order=['medical','shelter','childcare','vouchers','poverty'],gain=y.nw*0.08;
      if(y.given>0.65*gain){const g=[...order].reverse().find(g=>S.G.gifts[g]);if(g)S.setGift(g,false)}
      else if(y.given<0.4*gain){const g=order.find(g=>!S.G.gifts[g]);if(g)S.setGift(g,true)}}}
  },
};
const want={passive:'luthor',hoarder:'revolt',hero:'hero'};
const showYears=process.argv.includes('--years');
let bad=0;const rows=[];
for(const [name,play] of Object.entries(STRATS))for(const seed of [1,2,3]){
  const S=loadSim(seed);
  while(!S.G.ending){play(S);S.step();if(S.G.tax&&!S.G.ending)play(S)}
  const e=S.G.ending,h=S.G.history;
  const vel=h.length?h.slice(-5).reduce((a,y)=>a+y.vel,0)/Math.min(5,h.length):0;
  const ok=e.kind===want[name]&&(name!=='hero'||e.nw>=S.START_FORTUNE);if(!ok)bad++;
  rows.push({strategy:name,seed,ending:e.kind,age:40+Math.floor(e.week/52),worth:'$'+(e.nw/1e6).toFixed(0)+'M',given:'$'+(e.given/1e6).toFixed(0)+'M',
    share:(e.given/Math.max(1,e.gains)*100).toFixed(0)+'%',unrest:Math.round(e.unrest),velocity:vel.toFixed(1),jobs:h.at(-1)?.jobs,ok:ok?'yes':'NO'});
  if(showYears&&seed===1){console.log(name);console.table(h.filter((y,i)=>i%4===0||i===h.length-1).map(y=>({yr:y.year,nw:(y.nw/1e6).toFixed(1),given:(y.given/1e6).toFixed(2),vel:y.vel.toFixed(1),unrest:Math.round(y.unrest),jobs:y.jobs,mega:(y.mega/1e6).toFixed(1),homes:y.homes,shops:y.shops})))}
}
console.table(rows);
if(bad){console.error(bad+' runs missed their ending');process.exit(1)}
