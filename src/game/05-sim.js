/* ================= unrest, years, tax votes and endings ================= */
// Unrest follows the town's hardship and how much of your gains you keep. Past T.revoltAt for T.revoltWeeks it's a revolt.
function unrestTarget(){
  const people=G.res.filter(r=>r.role!=='landlord');
  const poor=people.filter(r=>r.income-(r.homeless||r.sheltered||r.homeOwner==='self'?0:r.rent)<T.povertyLine*grow(0.02)).length/people.length;
  const work=G.res.filter(r=>r.role==='worker'||r.role==='owner');
  const out=work.filter(r=>r.role==='worker'&&r.job==null).length/Math.max(1,work.length);
  const rough=people.filter(r=>r.homeless).length/people.length;
  const renters=people.filter(r=>!r.homeless&&!r.sheltered&&r.homeOwner!=='self'&&r.income>0);
  const burden=renters.length?renters.reduce((a,r)=>a+Math.min(2,r.rent/r.income),0)/renters.length:0;
  const kept=1-Math.min(1,(G.givenAvg||0)/Math.max(1,(G.gainsAvg||0)*T.heroGiveShare));
  const seen=Math.min(1,Math.max(0,Math.log10(Math.max(1,netWorth())/START_FORTUNE)/1.5));
  R.parts={poor,out,rough,burden,kept,seen};
  // as the landlord or later: the estate's hoarding counts for half, and your homes' state and your evictions count too
  let ll=0;
  if(isLandlord()){const mine=myHomes();ll=mine.length?(0.12*(1-G.ll.cond)+0.1*mine.filter(r=>r.homeless||r.owed>0).length/mine.length)*mine.length/19:0}
  return 100*(0.3*poor+0.25*out+0.3*rough+0.25*Math.max(0,burden-0.3)+0.32*kept*seen*(G.rung!=='billionaire'?0.5:1)+ll)+(G.anger||0);
}
function unrestWeek(){
  const t=Math.min(100,Math.max(0,unrestTarget()));
  G.unrest+=(t-G.unrest)*0.05;
  G.anger=(G.anger||0)*0.98;
  if(G.unrest>=T.revoltAt&&G.rung==='billionaire'){G.revoltWeeks++;if(G.revoltWeeks>=T.revoltWeeks)endLife('revolt')}
  else G.revoltWeeks=Math.max(0,G.revoltWeeks-1);
}
const unrestLevel=u=>u<30?'calm':u<55?'grumbling':u<70?'protests':u<T.revoltAt?'strikes':'revolt';

// the end of each game year: rents and pay rise, home prices grow, and the year goes into the history
function yearEnd(){
  for(const r of G.res){if(r.homeOwner==='local')cutRent(r,1+(isLandlord()?G.ll.rentChange:G.rung!=='billionaire'&&G.aiLandlord?G.aiLandlord.rise:T.rentRise));else if(r.homeOwner==='you')r.rent*=1+T.yourRentRise}
  for(const s of G.shops)if(s.open&&s.profitAvg>0)s.wage*=1+T.wageRise;
  // home prices follow rents (only what the town could pay counts) and the market's mood, which sours when the town
  // strikes or its jobs go, and rises as the rich buy up homes
  const work=G.res.filter(r=>r.role==='worker'||r.role==='owner'),jobs=work.filter(r=>r.role==='owner'||r.job!=null).length/Math.max(1,work.length);
  // (an empty home, or one whose tenant owes rent, earns nothing, so it counts for nothing)
  const homes=G.res.filter(r=>r.homeOwner!=='self'),cap=0.45*T.wage*grow(0.02);
  const rent=homes.reduce((a,r)=>a+(r.homeless||r.sheltered||r.owed>0?0:Math.min(r.rent,cap)),0)/Math.max(1,homes.length);
  const mood=1+G.pricePush-(G.unrest>=70?0.3:G.unrest>=55?0.12:0)-(jobs<0.6?0.15:0);
  G.priceMood+=(mood-G.priceMood)*0.35;
  G.homePrice=rent*WEEKS/T.homeYield*G.priceMood;
  if(isLandlord()){landlordYearEnd();if(G.ending)return}
  if(isPartner()){partnerYearEnd();if(G.ending)return}
  if(isShop()||isWaiter()||isOut()||isUnion()||isActivist()||isMayor()){const tax=Math.max(0,G.cash)*PT.taxShare/Math.pow(2,G.pt?G.pt.loopholes:0);if(tax>0){G.cash-=tax;G.fund=(G.fund||0)+tax}}
  // a wealth tax the town voted for: 2% of the estate a year
  if(G.pub&&G.pub.wealthtax&&G.cash>0){const w=G.cash*0.02;G.cash-=w;G.fund=(G.fund||0)+w}
  // the purse holds at most two years of the whole town's wages: beyond that the town can't spend it
  G.fund=Math.min(G.fund||0,T.wage*grow(0.02)*G.res.length*WEEKS*2);
  if(isShop()){shopYearEnd();if(G.ending)return}
  if(isWaiter()){waiterYearEnd();if(G.ending)return}
  if(isOut()){outYearEnd();if(G.ending)return}
  if(isUnion()){unionYearEnd();if(G.ending)return}
  if(isActivist()){activistYearEnd();if(G.ending)return}
  if(isMayor()){mayorYearEnd();if(G.ending)return}
  reopenShops();
  const y=G.year,stock=y.stock/Math.max(1,y.weeks);
  G.lastGiftCost=y.gc||{};
  G.history.push({year:yearNo()-1,nw:netWorth(),cash:G.cash,given:y.given,gains:y.gains,vel:stock>0?y.tx/stock:0,unrest:G.unrest,
    jobs:G.res.filter(r=>r.job!=null).length,mega:y.megastore,toYou:y.toYou,homes:homesOwned(),shops:shopsOwned(),workshops:G.workshops.length});
  G.year=emptyYear();
}

// every few years the town votes on a one-off tax on your fortune
function taxDue(){return G.week>=G.nextTax&&!G.tax&&!G.ending}
function proposeTax(){
  if(G.senator){G.senator=false;G.nextTax=G.week+T.taxEvery*WEEKS;G.anger=(G.anger||0)+12;toast('The tax vote fails. Everyone knows who paid for that');return}
  const amount=netWorth()*T.taxRate;
  G.tax={amount,payback:Math.log(1/(1-T.taxRate))/Math.log(1+G.rate)};
}
function answerTax(choice){
  const t=G.tax;if(!t)return;G.tax=null;G.nextTax=G.week+T.taxEvery*WEEKS;
  const nw=netWorth();
  if(choice==='lobby'){
    G.cash-=nw*T.lobbyCost;G.lobbied++;
    if(rnd()<T.lobbyWin){G.anger=(G.anger||0)+12;toast('The vote fails. The town knows who paid for that');return 'won'}
    G.anger=(G.anger||0)+6;choice='pay';toast('Your lobbying failed, and the tax passes');
  }
  if(choice==='move'){G.cash-=nw*T.moveCost;G.moved++;G.anger=(G.anger||0)+25;toast('You move your money out of state');return 'moved'}
  G.cash-=t.amount;G.taxPaid+=t.amount;G.fund=(G.fund||0)+t.amount;G.anger=(G.anger||0)-15;
  toast('You pay. The town spends it on public works');return 'paid';
}
// the public purse pays for public works: a wage each week for every figure out of work, while it has money (a full
// purse does no more than that; benefits draw on it too)
function fundWeek(){
  if(!(G.fund>0))return;
  for(const r of hireable()){const w=Math.min(G.fund,T.wage*grow(0.02)*0.8);if(w<=0)break;G.fund-=w;r.income+=0;r.cash+=pay('out','r'+G.res.indexOf(r),w,'works')}
}

function endLife(kind){
  if(G.ending)return;
  if(isMayor()){
    const v=kind==='death'?mayorVerdict():{kind};const m=G.my;
    G.ending={rung:'mayor',kind:v.kind,week:rungWeek(),name:m.name,approval:m.approval,council:m.council,donors:m.donors,terms:m.elections.some(e=>e.won)?2:1,purse:G.fund||0,unrest:G.unrest};
    G.ladder.best=Object.assign({},G.ladder.best,{mayor:G.ending.kind});
    return;
  }
  if(isActivist()){
    const v=kind==='death'?activistVerdict():{kind};const a=G.ac;
    G.ending={rung:'activist',kind:v.kind,week:rungWeek(),name:a.name,passed:a.passed.slice(),lost:a.lost.length,support:a.support,purse:G.fund||0,unrest:G.unrest};
    G.ladder.best=Object.assign({},G.ladder.best,{activist:G.ending.kind});
    return;
  }
  if(isUnion()){
    const v=kind==='death'?unionVerdict():{kind};
    G.ending={rung:'union',kind:v.kind,week:rungWeek(),name:G.un.name,wins:G.un.wins,losses:G.un.losses,members:G.un.members,rise:wageRise(),unrest:G.unrest};
    G.ladder.best=Object.assign({},G.ladder.best,{union:G.ending.kind});
    return;
  }
  if(isOut()){
    const v=kind==='death'?outVerdict():{kind};const r=outMe();
    G.ending={rung:'out',kind:v.kind,week:rungWeek(),name:G.ow.name,job:r.job!=null,homeless:r.homeless&&!r.sheltered,organised:G.ow.organised,cash:r.cash,unrest:G.unrest};
    G.ladder.best=Object.assign({},G.ladder.best,{out:G.ending.kind});
    return;
  }
  if(isWaiter()){
    const v=kind==='death'?waiterVerdict():{kind};
    G.ending={rung:'waiter',kind:v.kind,week:rungWeek(),worth:waiterWorth(),loan:G.wt.loan,health:G.wt.health,trained:G.wt.trained,union:G.wt.union,name:G.wt.name,unrest:G.unrest};
    G.ladder.best=Object.assign({},G.ladder.best,{waiter:G.ending.kind});
    return;
  }
  if(isShop()){
    const v=kind==='death'?shopVerdict():{kind};
    G.ending={rung:'shop',kind:v.kind,week:rungWeek(),worth:shopWorth(),start:G.sh.startWorth,pay:G.sh.payYears,supply:G.sh.supply,unrest:G.unrest,staff:staffOf(CAFE).length};
    G.ladder.best=Object.assign({},G.ladder.best,{shop:G.ending.kind});
    return;
  }
  if(isPartner()){
    const v=kind==='death'?partnerVerdict():{kind,forRich:0,forTown:0};
    G.ending={rung:'partner',kind:v.kind,week:rungWeek(),worth:ptWorth(),years:yearsToBillion(),forRich:v.forRich,forTown:v.forTown,unrest:G.unrest,proBono:G.pt.proBono,loopholes:G.pt.loopholes};
    G.ladder.best=Object.assign({},G.ladder.best,{partner:G.ending.kind});
    return;
  }
  if(isLandlord()){
    const v=kind==='death'?landlordVerdict():{kind};
    G.ending={rung:'landlord',kind:v.kind,week:rungWeek(),equity:equity(),start:G.ll.startEquity,burden:v.burden,unrest:G.unrest,cond:G.ll.cond,homes:myHomes().length};
    G.ladder.best=Object.assign({},G.ladder.best,{landlord:G.ending.kind});
    return;
  }
  if(kind==='death'){
    const share=G.given/Math.max(1,G.gains);
    kind=share>=T.heroGiveShare&&netWorth()>=START_FORTUNE&&G.unrest<50?'hero':'luthor';
  }
  G.ending={rung:'billionaire',kind,week:G.week,nw:netWorth(),given:G.given,gains:G.gains,unrest:G.unrest};
  G.ladder.unlocked=Object.assign({},G.ladder.unlocked,{landlord:true});G.ladder.best=Object.assign({},G.ladder.best,{billionaire:kind});
}

// one week of everything, in order
function step(){
  if(G.ending||G.card)return;
  economyWeek();fundWeek();fortuneWeek();
  // the gifts stop when the fortune can't pay for them: a fortune never goes below nothing
  if(G.cash<0&&Object.values(G.gifts).some(Boolean)){for(const k in G.gifts)G.gifts[k]=false;toast(isLandlord()?'The foundation has run out of money':'Your fortune can\u2019t pay for the gifts any more. They\u2019ve stopped')}
  if(isLandlord()){landlordWeek();if(G.ending)return}
  if(isShop()){shopWeek();if(G.ending)return}
  if(isWaiter()){waiterWeek();if(G.ending)return}
  if(isOut()){outWeek();if(G.ending)return}
  if(isUnion()){unionWeek();if(G.ending)return}
  if(isActivist()){activistWeek();if(G.ending)return}
  if(isMayor()){mayorWeek();if(G.ending)return}
  G.week++;
  const nw=netWorth(),givenW=G.year.given-(G._yv||0),gainW=nw-(G._nw??nw)+givenW;
  G._nw=nw;G._yv=G.year.given;
  G.gains+=Math.max(0,gainW);
  G.gainsAvg=(G.gainsAvg||0)*0.98+gainW*WEEKS*0.02;
  G.givenAvg=(G.givenAvg||0)*0.98+givenW*WEEKS*0.02;
  unrestWeek();
  if(G.week%WEEKS===0){yearEnd();G._yv=0}
  if(rungWeek()>=rungWeeks()&&!G.ending)endLife('death');
  if(taxDue())proposeTax();
  drawCard();
}
function toast(t){R.toasts.push({t,week:G.week});if(R.toasts.length>6)R.toasts.shift()}
// a new billionaire life keeps the ladder: what you've unlocked and how each rung ended
function newGame(seed){const ladder=G&&G.ladder;if(seed!=null)seedRandom(seed);G=DEFAULT();if(ladder)G.ladder=ladder;R.flows=[];R.toasts=[]}
