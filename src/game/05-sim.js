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
  return 100*(0.3*poor+0.25*out+0.3*rough+0.25*Math.max(0,burden-0.3)+0.32*kept*seen)+(G.anger||0);
}
function unrestWeek(){
  const t=Math.min(100,Math.max(0,unrestTarget()));
  G.unrest+=(t-G.unrest)*0.05;
  G.anger=(G.anger||0)*0.98;
  if(G.unrest>=T.revoltAt){G.revoltWeeks++;if(G.revoltWeeks>=T.revoltWeeks)endLife('revolt')}
  else G.revoltWeeks=Math.max(0,G.revoltWeeks-1);
}
const unrestLevel=u=>u<30?'calm':u<55?'grumbling':u<70?'protests':u<T.revoltAt?'strikes':'revolt';

// the end of each game year: rents and pay rise, home prices grow, and the year goes into the history
function yearEnd(){
  for(const r of G.res){if(r.homeOwner==='local')r.rent*=1+T.rentRise;else if(r.homeOwner==='you')r.rent*=1+T.yourRentRise}
  for(const s of G.shops)if(s.open&&s.profitAvg>0)s.wage*=1+T.wageRise;
  G.homePrice*=1+T.homeGrowth;
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
// the tax pays for public works: a share each week is paid as wages to figures out of work, and to everyone else
function fundWeek(){
  if(!(G.fund>0))return;
  const spend=Math.min(G.fund,Math.max(G.fund/104,T.wage*2));G.fund-=spend;
  const out=jobless(),to=out.length?out:G.res.filter(r=>r.role!=='landlord');
  to.forEach(r=>{const i=G.res.indexOf(r);r.cash+=pay('out','r'+i,spend/to.length,'works')});
}

function endLife(kind){
  if(G.ending)return;
  if(kind==='death'){
    const share=G.given/Math.max(1,G.gains);
    kind=share>=T.heroGiveShare&&netWorth()>=START_FORTUNE&&G.unrest<50?'hero':'luthor';
  }
  G.ending={kind,week:G.week,nw:netWorth(),given:G.given,gains:G.gains,unrest:G.unrest};
}

// one week of everything, in order
function step(){
  if(G.ending||G.tax)return;
  economyWeek();fundWeek();fortuneWeek();
  G.week++;
  const nw=netWorth(),givenW=G.year.given-(G._yv||0),gainW=nw-(G._nw??nw)+givenW;
  G._nw=nw;G._yv=G.year.given;
  G.gains+=Math.max(0,gainW);
  G.gainsAvg=(G.gainsAvg||0)*0.98+gainW*WEEKS*0.02;
  G.givenAvg=(G.givenAvg||0)*0.98+givenW*WEEKS*0.02;
  unrestWeek();
  if(G.week%WEEKS===0){yearEnd();G._yv=0}
  if(G.week>=LIFE_WEEKS)endLife('death');
  if(taxDue())proposeTax();
}
function toast(t){R.toasts.push({t,week:G.week});if(R.toasts.length>6)R.toasts.shift()}
function newGame(seed){if(seed!=null)seedRandom(seed);G=DEFAULT();R.flows=[];R.toasts=[]}
