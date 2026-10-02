// Plays whole lives headless on seeds 1-3, answering every decision card by a strategy, and checks each reaches the
// ending the game promises. The billionaire:
//   passive (takes no offers, funds nothing, pays the tax)        -> Lex Luthor
//   hoarder (always takes the accountant's advice)                 -> revolt before death
//   hero    (takes the generous option whenever it can afford it)  -> hero, and still richer than at the start
//   patient (passive for 15 years, then a hero)                    -> hero, and at least four times richer
// Then the landlord, in the town each billionaire leaves:
//   fair    (holds or cuts the rent when it bites, cuts arrears rather than evicting, fixes the homes) -> fair, or after
//            a revolt at least solvent
//   gouger  (always takes the accountant's advice)                 -> never fair
// Then the law firm partner, in the town a fair landlord leaves (after the passive and the hero billionaire) and a
// gouging one leaves (after the hoarder):
//   hiredgun   (always the accountant)                       -> hired gun
//   counsel    (always the town's side)                      -> counsel for the town
//   workaholic (the accountant, but 75-hour weeks)           -> burnt out
// node tools/bot.mjs [--years] prints the billionaire's year-by-year table for seed 1 too.
import {loadSim} from './sim.mjs';
const opt=(S,f)=>{const o=S.cardOptions();return (o.find(f)||o.find(o=>o.none)||o[0]).k};
const budget=S=>S.netWorth()*S.G.rate*0.6; // what a hero lets itself give a year
const running=S=>Object.keys(S.G.gifts).filter(k=>S.G.gifts[k]).reduce((a,k)=>a+S.giftEstimate(k),0);
const BILLIONAIRE={
  passive:S=>opt(S,o=>o.none),
  hoarder:S=>opt(S,o=>o.acct),
  hero:S=>{const id=S.G.card.id;
    if(id.startsWith('gift-'))return running(S)+S.giftEstimate(id.slice(5))<budget(S)?'fund':'pass';
    if(id==='workshop')return S.G.cash>S.START_FORTUNE*1.5?'build':'pass';
    return opt(S,o=>o.kind)},
  patient:S=>S.G.week<15*S.WEEKS?BILLIONAIRE.passive(S):BILLIONAIRE.hero(S),
};
// once a year a hero also uses the Commitments tab: it starts any gift it has been offered that fits its budget, and
// stops the newest if giving has outgrown what it can afford
const yearly={hero:S=>{
  for(const g of ['medical','shelter','childcare','vouchers','poverty'])if(S.G.seenGifts[g]&&!S.G.gifts[g]&&running(S)+S.giftEstimate(g)<budget(S))S.setGift(g,true);
  if(running(S)>budget(S)*1.45){const g=['poverty','vouchers','childcare','shelter','medical'].find(g=>S.G.gifts[g]);if(g)S.setGift(g,false)}}};
yearly.patient=S=>{if(S.G.week>=15*S.WEEKS)yearly.hero(S)};
const LANDLORD={
  fair:S=>{const id=S.G.card.id,share=S.tenantShare();
    if(id==='rent')return share>0.33?'-0.05':share>0.29?'0':'0.03';
    if(id==='repairs')return S.G.res[0].cash>S.myHomes().length*S.LL.repairs.full*20?'full':'basic';
    if(id==='estate')return S.G.unrest<70&&S.G.res[0].cash>S.G.homePrice*S.LL.deposit*3?'buy':'pass';
    return opt(S,o=>o.kind)},
  gouger:S=>opt(S,o=>o.acct),
};
const PARTNER={hiredgun:S=>opt(S,o=>o.acct),counsel:S=>opt(S,o=>o.kind),workaholic:S=>S.G.card.id==='hours'?'75':opt(S,o=>o.acct)};
const ptWant={hiredgun:'hiredgun',counsel:'counsel',workaholic:'burnout'};
const ptRows=[];
const want={passive:'luthor',hoarder:'revolt',hero:'hero',patient:'hero'};
const llWant={fair:(k,after)=>after==='hoarder'?k!=='bankrupt':k==='fair',gouger:k=>k!=='fair'};
function live(S,pick,each){while(!S.G.ending){if(S.G.card)S.answerCard(pick(S));else{S.step();if(each&&S.G.week%S.WEEKS===1)each(S)}}}
const showYears=process.argv.includes('--years');
let bad=0;const rows=[],llRows=[];
for(const [name,pick] of Object.entries(BILLIONAIRE))for(const seed of [1,2,3]){
  const S=loadSim(seed);live(S,pick,yearly[name]);
  const e=S.G.ending,h=S.G.history;
  const ok=e.kind===want[name]&&(name!=='hero'||e.nw>=S.START_FORTUNE)&&(name!=='patient'||e.nw>=4*S.START_FORTUNE);if(!ok)bad++;
  rows.push({strategy:name,seed,ending:e.kind,age:40+Math.floor(e.week/52),worth:'$'+(e.nw/1e6).toFixed(0)+'M',given:'$'+(e.given/1e6).toFixed(0)+'M',
    share:(e.given/Math.max(1,e.gains)*100).toFixed(0)+'%',unrest:Math.round(e.unrest),cards:S.G.choices.length,jobs:h.at(-1)?.jobs,ok:ok?'yes':'NO'});
  if(showYears&&seed===1){console.log(name);console.table(h.filter((y,i)=>i%4===0||i===h.length-1).map(y=>({yr:y.year,nw:(y.nw/1e6).toFixed(1),given:(y.given/1e6).toFixed(2),unrest:Math.round(y.unrest),jobs:y.jobs,homes:y.homes,shops:y.shops})))}
  for(const [lname,lpick] of Object.entries(LANDLORD)){
    const L=loadSim(seed);live(L,pick,yearly[name]);L.startLandlord();live(L,lpick);
    const f=L.G.ending,lok=llWant[lname](f.kind,name);if(!lok)bad++;
    llRows.push({after:name,seed,landlord:lname,ending:f.kind,years:Math.floor(f.week/52),equity:'$'+(f.equity/1e6).toFixed(0)+'M',start:'$'+(f.start/1e6).toFixed(0)+'M',
      homes:f.homes,rentShare:(f.burden*100||0).toFixed(0)+'%',repair:(f.cond*100).toFixed(0)+'%',unrest:Math.round(f.unrest),ok:lok?'yes':'NO'});
  }
}
for(const [bname,lname] of [['passive','fair'],['hero','fair'],['hoarder','gouger']])for(const seed of [1,2,3])for(const [pname,ppick] of Object.entries(PARTNER)){
  const S=loadSim(seed);live(S,BILLIONAIRE[bname],yearly[bname]);S.startLandlord();live(S,LANDLORD[lname]);
  if(S.G.ending.kind==='bankrupt')continue;
  S.startPartner();live(S,ppick);
  const e=S.G.ending,ok=e.kind===ptWant[pname];if(!ok)bad++;
  ptRows.push({after:bname+'/'+lname,seed,partner:pname,ending:e.kind,years:Math.floor(e.week/52),worth:'$'+(e.worth/1e6).toFixed(0)+'M',
    toBillion:Math.round(e.years)+' yrs',forRich:e.forRich,forTown:e.forTown,unrest:Math.round(e.unrest),ok:ok?'yes':'NO'});
}
console.table(rows);console.table(llRows);console.table(ptRows);
if(bad){console.error(bad+' runs missed their ending');process.exit(1)}
