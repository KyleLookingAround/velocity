// Plays whole lives headless with three strategies on seeds 1-3 and checks each reaches the ending the game promises:
//   passive (invest only, pays the tax)          -> Lex Luthor
//   hoarder (buys homes and shops, dodges taxes) -> revolt before death
//   hero    (builds, funds gifts from the start, pays) -> hero, and still richer than at the start
//   patient (invests 15 years, then funds gifts)       -> hero, and at least five times richer: giving early costs
//                                                         you, waiting pays, and waiting too long misses the ending
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
  patient:S=>{if(S.G.week<15*S.WEEKS){if(S.G.tax)S.answerTax('pay')}else STRATS.hero(S)},
};
// the landlord rung, played in the town each billionaire strategy leaves behind:
//   fair   (rents up 2% a year, held or cut when they bite, full repairs, no evictions, buys homes back from the
//           estate while the town is calm) -> fair, except after a revolt, where it must at least stay solvent
//   gouger (rents up 12% a year, no repairs, evicts, buys every home it can) -> never fair: rentier or bankrupt
const LANDLORD={
  fair:S=>{const t=S.myHomes().filter(r=>!r.homeless&&r.income>0),b=t.length?t.reduce((a,r)=>a+r.rent/r.income,0)/t.length:0;
    S.setRentChange(b>0.33?-0.05:b>0.29?0:0.02);S.setRepairs(S.G.res[0].cash>S.myHomes().length*S.LL.repairs.full*20?'full':'basic');S.setEvict(false);
    // buys a home back from the estate once a year, while the town is calm enough and there's plenty in the bank
    if(S.G.unrest<70&&S.canBuyFromEstate()&&S.G.res[0].cash>S.G.homePrice*S.LL.deposit*3)S.buyFromEstate()},
  gouger:S=>{S.setRentChange(0.12);S.setRepairs('none');S.setEvict(true);while(S.canBuyFromEstate())S.buyFromEstate()},
};
const llWant={fair:(k,after)=>after==='hoarder'?k!=='bankrupt':k==='fair',gouger:k=>k!=='fair'};
const llRows=[];
const want={passive:'luthor',hoarder:'revolt',hero:'hero',patient:'hero'};
const showYears=process.argv.includes('--years');
let bad=0;const rows=[];
for(const [name,play] of Object.entries(STRATS))for(const seed of [1,2,3]){
  const S=loadSim(seed);
  while(!S.G.ending){play(S);S.step();if(S.G.tax&&!S.G.ending)play(S)}
  const e=S.G.ending,h=S.G.history;
  const vel=h.length?h.slice(-5).reduce((a,y)=>a+y.vel,0)/Math.min(5,h.length):0;
  const ok=e.kind===want[name]&&(name!=='hero'||e.nw>=S.START_FORTUNE)&&(name!=='patient'||e.nw>=5*S.START_FORTUNE);if(!ok)bad++;
  rows.push({strategy:name,seed,ending:e.kind,age:40+Math.floor(e.week/52),worth:'$'+(e.nw/1e6).toFixed(0)+'M',given:'$'+(e.given/1e6).toFixed(0)+'M',
    share:(e.given/Math.max(1,e.gains)*100).toFixed(0)+'%',unrest:Math.round(e.unrest),velocity:vel.toFixed(1),jobs:h.at(-1)?.jobs,ok:ok?'yes':'NO'});
  if(showYears&&seed===1){console.log(name);console.table(h.filter((y,i)=>i%4===0||i===h.length-1).map(y=>({yr:y.year,nw:(y.nw/1e6).toFixed(1),given:(y.given/1e6).toFixed(2),vel:y.vel.toFixed(1),unrest:Math.round(y.unrest),jobs:y.jobs,mega:(y.mega/1e6).toFixed(1),homes:y.homes,shops:y.shops})))}
}
console.table(rows);
// each billionaire legacy (seed 1-3) handed to each landlord
for(const [bname,bplay] of Object.entries(STRATS))for(const seed of [1,2,3])for(const [lname,lplay] of Object.entries(LANDLORD)){
  const S=loadSim(seed);
  while(!S.G.ending){bplay(S);S.step();if(S.G.tax&&!S.G.ending)bplay(S)}
  S.startLandlord();
  while(!S.G.ending){if(S.G.week%S.WEEKS===1||S.G.week===S.G.rungStart)lplay(S);S.step()}
  const e=S.G.ending,ok=llWant[lname](e.kind,bname);if(!ok)bad++;
  llRows.push({after:bname,seed,landlord:lname,ending:e.kind,years:Math.floor(e.week/52),equity:'$'+(e.equity/1e6).toFixed(1)+'M',
    start:'$'+(e.start/1e6).toFixed(1)+'M',homes:e.homes,rentShare:(e.burden*100||0).toFixed(0)+'%',repair:(e.cond*100).toFixed(0)+'%',unrest:Math.round(e.unrest),ok:ok?'yes':'NO'});
}
console.table(llRows);
if(bad){console.error(bad+' runs missed their ending');process.exit(1)}
