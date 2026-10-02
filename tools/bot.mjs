// Plays whole lives headless on seeds 1-3, answering every decision card by a strategy, and checks each reaches the
// ending the game promises. The billionaire:
//   passive (takes no offers, funds nothing, pays the tax)        -> Lex Luthor
//   hoarder (always takes the accountant's advice)                 -> revolt before death
//   giver   (always the generous option, whatever it costs)         -> gave it all away
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
// Then the shop owner, in the town a counsel partner leaves (after passive / fair):
//   pillar  (always the generous option)                                  -> pillar of the high street
//   seller  (always the accountant: sells to the estate when it can)      -> sold
//   squeeze (the accountant's prices, pay and supplies, but never sells)  -> closed: squeezing drives the customers off
// Then the waiter, in the town a pillar shop owner leaves (after passive / fair / counsel):
//   careful (fewer shifts when worn, the union, evening classes, never a payday loan) -> getting ahead
//   grind   (extra shifts, payday loans, skips care: what pays most this week)        -> evicted, or just getting by
//            when a fair landlord's rent is low enough: never getting ahead
// Then out of work, after the careful waiter:
//   organiser (the generous option: leads the organising)        -> organiser
//   scrambler (what pays most: gig work, then the first job)     -> back on your feet
//   passive   (signs on for nothing, takes nothing)              -> stuck
// Then the union organiser, after the organiser out of work:
//   steady  (the generous option: recruits, fights sackings, strikes when the odds are good) -> fair pay
//   manager (always the accountant: takes the manager's job when offered)                 -> sold out
//   idle    (does nothing: no drives, no strikes)                                         -> crumbs
// Then the activist, after the steady organiser:
//   steady (the generous option: campaigns, knocks on doors, spends on the final push)   -> the town changed (3+ votes)
//   donor  (always the easiest: takes the foundation's money)                             -> bought
//   idle   (never campaigns)                                                              -> ignored
// Then the mayor, after the steady activist. Elections are a gamble, so any run may end voted out, but each
// strategy's own ending must come up on at least two of the three seeds (one, for the donors' strategies: their
// cover-ups and scandals make their elections a real gamble):
//   builder (the generous option: the high tax while re-election looks safe, council homes) -> builder
//   machine (the donors' way: the backer, low tax, the flats)                               -> machine
//   idle    (does nothing)                                                                  -> caretaker
// Then the governor, after the builder mayor (the same rule for its re-election):
//   newdeal   (the generous option: raises the minimum wage, taxes fortunes, grants)  -> a new deal
//   dealmaker (the donors' way: tax breaks, cuts, the repeal)                         -> the dealmaker
//   idle      (does nothing)                                                          -> the steward
// Then the president, after the new-deal governor (the same rule for its re-election):
//   rebuilt (the generous option: the tax on fortunes first, fights every vote)        -> the ladder, rebuilt
//   lobbied (the donors' way: takes the lobby's support, waters bills down)            -> owned
//   idle    (sends nothing to Congress)                                                -> gridlock
// and a billionaire born after the rebuilt president lives under its laws: it pays the tax on fortunes.
// node tools/bot.mjs [--years] prints the billionaire's year-by-year table for seed 1 too.
import {loadSim} from './sim.mjs';
// --group <name> plays one group only (down: the billionaire to out of work; climb: the union and activist; mayor;
// governor; president, with the heir; hunt: the rare endings). tools/bot-all.mjs plays every group at once, in parallel.
const gi=process.argv.indexOf('--group'),GROUP=gi>0?process.argv[gi+1]:null,on=g=>!GROUP||GROUP===g;
const opt=(S,f)=>{const o=S.cardOptions();return (o.find(f)||o.find(o=>o.none)||o[0]).k};
const budget=S=>S.netWorth()*S.G.rate*0.65; // what a hero lets itself give a year
const running=S=>Object.keys(S.G.gifts).filter(k=>S.G.gifts[k]).reduce((a,k)=>a+S.giftEstimate(k),0);
const BILLIONAIRE={
  passive:S=>opt(S,o=>o.none),
  hoarder:S=>opt(S,o=>o.acct),
  hero:S=>{const id=S.G.card.id;
    if(id.startsWith('gift-'))return running(S)+S.giftEstimate(id.slice(5))<budget(S)?'fund':'pass';
    if(id==='workshop')return S.G.cash>S.START_FORTUNE*1.5?'build':'pass';
    return opt(S,o=>o.kind)},
  patient:S=>S.G.week<15*S.WEEKS?BILLIONAIRE.passive(S):BILLIONAIRE.hero(S),
  giver:S=>opt(S,o=>o.kind),
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
const SHOP={pillar:S=>opt(S,o=>o.kind),seller:S=>opt(S,o=>o.acct),squeeze:S=>opt(S,o=>o.acct&&o.k!=='sell'&&o.k!=='found')};
const shWant={pillar:'pillar',seller:'sold',squeeze:'closed'};
const shRows=[];
const WAITER={careful:S=>S.G.card.id==='shifts'?(S.G.wt.health<0.6?'fewer':'regular'):opt(S,o=>o.kind),grind:S=>opt(S,o=>o.acct)};
const wtWant={careful:'ahead',grind:'evicted'};
const wtRows=[];
const OUT={organiser:S=>opt(S,o=>o.kind),scrambler:S=>opt(S,o=>o.acct),passive:S=>opt(S,o=>o.none)};
const owWant={organiser:'organiser',scrambler:'feet',passive:'stuck'};
const owRows=[];
const UNION={steady:S=>opt(S,o=>o.kind),manager:S=>opt(S,o=>o.acct),idle:S=>opt(S,o=>o.none)};
const unWant={steady:'fairpay',manager:'soldout',idle:'busted'};
const unRows=[];
const ACTIVIST={steady:S=>opt(S,o=>o.kind),donor:S=>opt(S,o=>o.acct),idle:S=>opt(S,o=>o.none)};
const acWant={steady:'changed',donor:'bought',idle:'ignored'};
const acRows=[];
const DONORS=['machine','dealmaker','lobbied'];
const MAYOR={builder:S=>opt(S,o=>o.kind),machine:S=>opt(S,o=>o.acct),idle:S=>opt(S,o=>o.none)};
const myRows=[];
const GOVERNOR={newdeal:S=>opt(S,o=>o.kind),dealmaker:S=>opt(S,o=>o.acct),idle:S=>opt(S,o=>o.none)};
const gvRows=[];
const PRESIDENT={rebuilt:S=>opt(S,o=>o.kind),lobbied:S=>opt(S,o=>o.acct),gridlock:S=>opt(S,o=>o.none)};
const prRows=[];
const want={passive:'luthor',hoarder:'revolt',hero:'hero',patient:'hero',giver:'giver'};
const llWant={fair:(k,after)=>after==='hoarder'?k!=='bankrupt':k==='fair',gouger:k=>k!=='fair'};
const rares=new Set();
function live(S,pick,each){while(!S.G.ending){if(S.G.card)S.answerCard(pick(S));else{S.step();if(each&&S.G.week%S.WEEKS===1)each(S)}}if(S.G.ending.rare)rares.add(S.G.ending.rung+':'+S.G.ending.rare)}
const showYears=process.argv.includes('--years');
let bad=0;const rows=[],llRows=[];
if(on('down'))for(const [name,pick] of Object.entries(BILLIONAIRE))for(const seed of [1,2,3]){
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
if(on('down'))for(const [bname,lname] of [['passive','fair'],['hero','fair'],['hoarder','gouger']])for(const seed of [1,2,3])for(const [pname,ppick] of Object.entries(PARTNER)){
  const S=loadSim(seed);live(S,BILLIONAIRE[bname],yearly[bname]);S.startLandlord();live(S,LANDLORD[lname]);
  if(S.G.ending.kind==='bankrupt')continue;
  S.startPartner();live(S,ppick);
  const e=S.G.ending,ok=e.kind===ptWant[pname];if(!ok)bad++;
  ptRows.push({after:bname+'/'+lname,seed,partner:pname,ending:e.kind,years:Math.floor(e.week/52),worth:'$'+(e.worth/1e6).toFixed(0)+'M',
    toBillion:Math.round(e.years)+' yrs',forRich:e.forRich,forTown:e.forTown,unrest:Math.round(e.unrest),ok:ok?'yes':'NO'});
}
if(on('down'))for(const seed of [1,2,3])for(const [sname,spick] of Object.entries(SHOP)){
  const S=loadSim(seed);live(S,BILLIONAIRE.passive);S.startLandlord();live(S,LANDLORD.fair);S.startPartner();live(S,PARTNER.counsel);S.startShop();live(S,spick);
  const e=S.G.ending,ok=e.kind===shWant[sname];if(!ok)bad++;
  shRows.push({seed,shop:sname,ending:e.kind,years:Math.floor(e.week/52),worth:'$'+(e.worth/1e6).toFixed(1)+'M',start:'$'+(e.start/1e6).toFixed(1)+'M',staff:e.staff,unrest:Math.round(e.unrest),ok:ok?'yes':'NO'});
}
if(on('down'))for(const seed of [1,2,3])for(const [wname,wpick] of Object.entries(WAITER)){
  const S=loadSim(seed);live(S,BILLIONAIRE.passive);S.startLandlord();live(S,LANDLORD.fair);S.startPartner();live(S,PARTNER.counsel);S.startShop();live(S,SHOP.pillar);
  S.startWaiter();live(S,wpick);
  const e=S.G.ending,ok=wname==='grind'?e.kind!=='ahead':e.kind===wtWant[wname];if(!ok)bad++;
  wtRows.push({seed,waiter:wname,name:e.name,ending:e.kind,years:Math.floor(e.week/52),saved:'$'+Math.round(e.worth/S.HH),owes:'$'+Math.round(e.loan/S.HH),health:Math.round(e.health*100)+'%',trained:e.trained,ok:ok?'yes':'NO'});
}
if(on('down'))for(const seed of [1,2,3])for(const [oname,opick] of Object.entries(OUT)){
  const S=loadSim(seed);live(S,BILLIONAIRE.passive);S.startLandlord();live(S,LANDLORD.fair);S.startPartner();live(S,PARTNER.counsel);S.startShop();live(S,SHOP.pillar);
  S.startWaiter();live(S,WAITER.careful);S.startOut();live(S,opick);
  const e=S.G.ending,ok=e.kind===owWant[oname];if(!ok)bad++;
  owRows.push({seed,out:oname,name:e.name,ending:e.kind,job:e.job,sleepingRough:e.homeless,organised:e.organised,purse:'$'+(S.G.fund/1e6).toFixed(0)+'M',ok:ok?'yes':'NO'});
}
// after a sale of the café, the careful waiter still gets by on the estate's minimum; and the one let go can start out of
// work straight from the sale
if(on('down'))for(const seed of [1,2,3])for(const next of ['waiter','out']){
  const S=loadSim(seed);live(S,BILLIONAIRE.passive);S.startLandlord();live(S,LANDLORD.fair);S.startPartner();live(S,PARTNER.counsel);S.startShop();live(S,SHOP.seller);
  if(S.G.ending.kind!=='sold')continue;
  if(next==='waiter'){S.startWaiter();live(S,WAITER.careful);const e=S.G.ending,ok=e.kind!=='evicted';if(!ok)bad++;
    wtRows.push({seed,waiter:'careful, after a sale',name:e.name,ending:e.kind,years:Math.floor(e.week/52),saved:'$'+Math.round(e.worth/S.HH),owes:'$'+Math.round(e.loan/S.HH),health:Math.round(e.health*100)+'%',trained:e.trained,ok:ok?'yes':'NO'})}
  else{S.startOut();live(S,OUT.organiser);const e=S.G.ending,ok=!!e.kind;if(!ok)bad++;
    owRows.push({seed,out:'organiser, from a sale',name:e.name,ending:e.kind,job:e.job,sleepingRough:e.homeless,organised:e.organised,purse:'$'+(S.G.fund/1e6).toFixed(0)+'M',ok:ok?'yes':'NO'})}
}
if(on('climb'))for(const seed of [1,2,3])for(const [uname,upick] of Object.entries(UNION)){
  const S=loadSim(seed);live(S,BILLIONAIRE.passive);S.startLandlord();live(S,LANDLORD.fair);S.startPartner();live(S,PARTNER.counsel);S.startShop();live(S,SHOP.pillar);
  S.startWaiter();live(S,WAITER.careful);S.startOut();live(S,OUT.organiser);S.startUnion();live(S,upick);
  const e=S.G.ending,ok=e.kind===unWant[uname];if(!ok)bad++;
  unRows.push({seed,union:uname,name:e.name,ending:e.kind,years:Math.floor(e.week/52),won:e.wins,lost:e.losses,members:Math.round(e.members*100)+'%',pay:(e.rise>=0?'+':'')+Math.round(e.rise*100)+'%',ok:ok?'yes':'NO'});
}
if(on('climb'))for(const seed of [1,2,3])for(const [aname,apick] of Object.entries(ACTIVIST)){
  const S=loadSim(seed);live(S,BILLIONAIRE.passive);S.startLandlord();live(S,LANDLORD.fair);S.startPartner();live(S,PARTNER.counsel);S.startShop();live(S,SHOP.pillar);
  S.startWaiter();live(S,WAITER.careful);S.startOut();live(S,OUT.organiser);S.startUnion();live(S,UNION.steady);S.startActivist();live(S,apick);
  const e=S.G.ending,ok=e.kind===acWant[aname];if(!ok)bad++;
  acRows.push({seed,activist:aname,name:e.name,ending:e.kind,passed:e.passed.length,lost:e.lost,support:Math.round(e.support*100)+'%',unrest:Math.round(e.unrest),ok:ok?'yes':'NO'});
}
if(on('mayor'))for(const [mname,mpick] of Object.entries(MAYOR)){let hits=0;
  for(const seed of [1,2,3]){
    const S=loadSim(seed);live(S,BILLIONAIRE.passive);S.startLandlord();live(S,LANDLORD.fair);S.startPartner();live(S,PARTNER.counsel);S.startShop();live(S,SHOP.pillar);
    S.startWaiter();live(S,WAITER.careful);S.startOut();live(S,OUT.organiser);S.startUnion();live(S,UNION.steady);S.startActivist();live(S,ACTIVIST.steady);S.startMayor();live(S,mpick);
    const e=S.G.ending,want=mname==='idle'?'caretaker':mname,ok=e.kind===want||e.kind==='outvoted';if(e.kind===want)hits++;if(!ok)bad++;
    myRows.push({seed,mayor:mname,name:e.name,ending:e.kind,terms:e.terms,council:e.council,donors:e.donors,approval:Math.round(e.approval*100)+'%',unrest:Math.round(e.unrest),ok:ok?'yes':'NO'});
  }
  if(hits<(DONORS.includes(mname)||mname==='idle'?1:2)){bad++;myRows.push({mayor:mname,ending:'reached on only '+hits+' of 3 seeds',ok:'NO'})}
}
if(on('governor'))for(const [gname,gpick] of Object.entries(GOVERNOR)){let hits=0;
  for(const seed of [1,2,3]){
    const S=loadSim(seed);live(S,BILLIONAIRE.passive);S.startLandlord();live(S,LANDLORD.fair);S.startPartner();live(S,PARTNER.counsel);S.startShop();live(S,SHOP.pillar);
    S.startWaiter();live(S,WAITER.careful);S.startOut();live(S,OUT.organiser);S.startUnion();live(S,UNION.steady);S.startActivist();live(S,ACTIVIST.steady);S.startMayor();live(S,MAYOR.builder);
    if(S.G.ending.kind==='outvoted')continue;
    S.startGovernor();live(S,gpick);
    // (a governor voted out can govern again, as a player would)
    for(let n=0;n<2&&S.G.ending.kind==='unseated';n++){S.restartGovernor();live(S,gpick)}
    const e=S.G.ending,want=gname==='idle'?'steward':gname,ok=e.kind===want||e.kind==='unseated';if(e.kind===want)hits++;if(!ok)bad++;
    gvRows.push({seed,governor:gname,name:e.name,ending:e.kind,terms:e.terms,minWage:'+'+Math.round((e.minWage-1)*100)+'%',fortuneTax:e.fortuneTax,grants:e.granted,donors:e.donors,approval:Math.round(e.approval*100)+'%',unrest:Math.round(e.unrest),ok:ok?'yes':'NO'});
  }
  if(hits<(DONORS.includes(gname)||gname==='idle'?1:2)){bad++;gvRows.push({governor:gname,ending:'reached on only '+hits+' of 3 seeds',ok:'NO'})}
}
if(on('president'))for(const [pname,ppick] of Object.entries(PRESIDENT)){let hits=0;
  for(const seed of [1,2,3]){
    const S=loadSim(seed);live(S,BILLIONAIRE.passive);S.startLandlord();live(S,LANDLORD.fair);S.startPartner();live(S,PARTNER.counsel);S.startShop();live(S,SHOP.pillar);
    S.startWaiter();live(S,WAITER.careful);S.startOut();live(S,OUT.organiser);S.startUnion();live(S,UNION.steady);S.startActivist();live(S,ACTIVIST.steady);S.startMayor();live(S,MAYOR.builder);
    if(S.G.ending.kind==='outvoted')continue;
    S.startGovernor();live(S,GOVERNOR.newdeal);if(S.G.ending.kind==='unseated')continue;
    S.startPresident();live(S,ppick);
    // (a president voted out after one term can serve again, as a player would, as the mayor's runs do)
    for(let n=0;n<2&&S.G.ending.kind==='oneterm'&&pname!=='gridlock';n++){S.restartPresident();live(S,ppick)}
    const e=S.G.ending,ok=e.kind===pname||e.kind==='oneterm';if(e.kind===pname)hits++;if(!ok)bad++;
    let next='';
    if(pname==='rebuilt'&&e.kind==='rebuilt'){
      // the next billionaire life, under those laws: its fortune pays the tax on fortunes into the purse
      S.newGame(seed);live(S,BILLIONAIRE.passive);const f=S.G.ending,taxed=f.nw<S.G.history.at(-1).nw*1.5&&S.G.fund>0;
      next='$'+(f.nw/1e6).toFixed(0)+'M, purse $'+(S.G.fund/1e6).toFixed(0)+'M';if(!S.G.pub.wealthtax||!(S.G.fund>0)){bad++;next+=' NO'}
    }
    prRows.push({seed,president:pname,name:e.name,ending:e.kind,terms:e.terms,laws:e.passed.length,lobby:e.lobby,approval:Math.round(e.approval*100)+'%',unrest:Math.round(e.unrest),nextBillionaire:next,ok:ok?'yes':'NO'});
  }
  if(hits<(DONORS.includes(pname)||pname==='gridlock'?1:2)){bad++;prRows.push({president:pname,ending:'reached on only '+hits+' of 3 seeds',ok:'NO'})}
}
// the rare role: a hero's heir lives a second billionaire life in the same town, and is judged against what it inherited
const heirRows=[];
if(on('president'))for(const seed of [1,2,3]){
  const S=loadSim(seed);live(S,BILLIONAIRE.hero,yearly.hero);if(S.G.ending.kind!=='hero')continue;
  S.startHeir();const start=S.netWorth();live(S,BILLIONAIRE.hero,yearly.hero);const e=S.G.ending,ok=!!e&&e.heir===1&&S.G.ladder.achieved['m:heir'];if(!ok)bad++;
  heirRows.push({seed,inherited:'$'+(start/1e6).toFixed(0)+'M',ending:e.kind,rare:e.rare||'',worth:'$'+(e.nw/1e6).toFixed(0)+'M',ok:ok?'yes':'NO'});
}
for(const t of [rows,llRows,ptRows,shRows,wtRows,owRows,unRows,acRows,myRows,gvRows,prRows,heirRows])if(t.length)console.table(t);

// (an idle mayor or governor, or a president who lets Congress drift, is at the voters' mercy: one seed of three is enough)
// the rare endings that need a deliberate route must stay reachable: a hunter that goes for them on purpose (its
// billionaire buys the shops the general strike needs; the shop sells to its staff; the waiter guards their
// health; the organiser strikes everywhere it hasn't won; the governor keeps raising the minimum wage)
if(on('hunt')){const hunted=new Set(),k2=S=>opt(S,o=>o.kind);
  const pick={shop:S=>S.G.card.id==='staffbuy'?'sell':k2(S),waiter:S=>S.G.card.id==='shifts'?(S.G.wt.health<0.95?'fewer':'regular'):k2(S),
    union:S=>{if(S.G.card.id==='strikevote'){const won=S.G.un.wonAt||{};const o=S.cardOptions().find(o=>o.k!=='wait'&&!won[o.k]&&S.strikeOdds(o.k)>=0.4);return o?o.k:'wait'}return k2(S)},
    governor:S=>S.G.card.id==='minwage'?'raise':k2(S)};
  // (its billionaire passes on homes and buys every shop it can, so the estate has shops to strike)
  const shopper=S=>S.G.card.id==='homes'?'pass':S.G.card.id==='shop'?'cut':opt(S,o=>o.acct);
  for(const seed of [1,2,3]){const S=loadSim(seed);live(S,shopper);
    for(const r of ['Landlord','Partner','Shop','Waiter','Out','Union','Activist','Mayor','Governor']){if(S.G.ending.kind==='outvoted')break;S['start'+r]();live(S,pick[r.toLowerCase()]||k2);
      // (a mayor voted out can run the town again, as a player would)
      for(let n=0;n<4&&S.G.ending.kind==='outvoted';n++){S.restartMayor();live(S,k2)}
      if(S.G.ending.rare)hunted.add(S.G.ending.rung+':'+S.G.ending.rare)}}
  const need=['shop:coop','waiter:thriving','union:general','governor:landslide'],missing=need.filter(x=>!hunted.has(x));
  console.log('rare endings a hunter reached: '+[...hunted].sort().join(', '));if(missing.length){bad++;console.error('rare endings out of reach: '+missing.join(', '))}}console.log('rare endings reached: '+([...rares].sort().join(', ')||'none'));
if(bad){console.error(bad+' runs missed their ending');process.exit(1)}
