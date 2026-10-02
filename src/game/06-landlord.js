/* ================= the landlord rung ================= */
// The second rung of the ladder. You play Agnes, the town's landlord, for 20 years in the town the billionaire left:
// its homes and shops pass to its estate, which the computer runs (rents up 7% a year, profits out of town). A hero's
// gifts carry on as a foundation; anyone else's stop. You set next year's rent, how much you spend on repairs, whether
// you evict, and buy or sell homes with a mortgage. Fair rents keep homes full and the town calm; squeezing pays until
// the tenants can't, the town stalls, prices fall and the bank calls the loan.
const LL={years:20,rate:0.05,ltv:0.75,callAt:1,callTo:0.9,deposit:0.25,
  repairs:{none:0,basic:22*HH,full:48*HH},           // weekly spend per home on repairs
  wear:{none:-0.09,basic:-0.02,full:0.035},           // yearly change in condition
  rentSteps:[-0.05,0,0.03,0.07,0.12]};
const isLandlord=()=>G.rung==='landlord';
const rungWeeks=()=>rungYears()*WEEKS;
const rungWeek=()=>G.week-(G.rungStart||0);
const myHomes=()=>G.res.filter(r=>r.homeOwner==='local');
const homeValue=()=>myHomes().length*G.homePrice*(0.55+0.45*G.ll.cond);
function equity(){return homeValue()+G.res[0].cash-G.ll.loan}
const rentRoll=()=>myHomes().filter(r=>!r.homeless&&!r.sheltered).reduce((a,r)=>a+r.rent,0)*WEEKS;

function startLandlord(){
  const kind=G.ending&&G.ending.kind;
  G.ladder=G.ladder||{};G.ladder.unlocked=Object.assign({},G.ladder.unlocked,{landlord:true});
  const legacy=Object.assign({},G);delete legacy.ladder;G.ladder.legacy=JSON.stringify(legacy);G.ladder.from=kind;
  beginLandlord(kind);
}
// replay the landlord in the same town the billionaire left
function restartLandlord(){
  const ladder=G.ladder;const s=JSON.parse(ladder.legacy);G=DEFAULT();Object.assign(G,s);G.ladder=ladder;
  R.flows=[];R.stage={};beginLandlord(ladder.from);
}
function beginLandlord(kind){
  G.rung='landlord';G.rungStart=G.week;G.ending=null;G.tax=null;G.nextTax=1e9;G.speed=G.speed||1;
  G.foundation=kind==='hero';
  if(!G.foundation)for(const k in G.gifts)G.gifts[k]=false;
  const ag=G.res[0],homes=myHomes().length;
  G.ll={loan:0,rentChange:0.03,repairs:'basic',cond:0.82,missed:0,startEquity:0,history:[],year:llYear()};
  G.card=null;G.arrearsQ=[];G.rentDue=true;G.freezeUntil=0;G.nextCard=G.week+6;
  // Agnes keeps what she's saved, and has borrowed against her homes; if the billionaire bought them all she at least
  // has the deposit on two
  G.ll.loan=homes*G.homePrice*0.4;
  ag.cash=Math.max(ag.cash,homes?13*(rentRollNow()/WEEKS):2*G.homePrice*LL.deposit*1.1);
  G.ll.startEquity=equity();
  G.seen.landlord=false;
  toast('You are Agnes, the landlord');
}
function rentRollNow(){return myHomes().reduce((a,r)=>a+r.rent,0)*WEEKS}
function llYear(){return {rent:0,interest:0,repairs:0,evictions:0,lost:0}}

// what a week costs the landlord: interest on the loan and repairs on every home
const llRepairsWeek=()=>myHomes().length*LL.repairs[G.ll.repairs]*grow(0.02);
const llInterestWeek=()=>G.ll.loan*LL.rate/WEEKS;
function landlordWeek(){
  const ll=G.ll,ag=G.res[0];
  const interest=llInterestWeek(),repairs=llRepairsWeek();
  ag.cash-=interest;pay('r0','out',interest,'interest');
  ll.year.interest+=interest;ll.year.repairs+=repairs; // repairs are spent through the town's store (economyWeek)
  ll.cond=Math.max(0,Math.min(1,ll.cond+LL.wear[ll.repairs]/WEEKS));
  // a landlord short of cash misses mortgage payments; three months of that and the bank takes the homes
  if(ag.cash<0){ll.missed++;if(ll.missed>=13)return endLife('bankrupt')}else ll.missed=Math.max(0,ll.missed-1);
}
// the end of each landlord year: the bank checks the loan against what the homes are worth
function landlordYearEnd(){
  const ll=G.ll,ag=G.res[0],value=homeValue();
  if(value>0&&ll.loan>value*LL.callAt){
    const need=ll.loan-value*LL.callTo;
    if(ag.cash>=need){ag.cash-=need;ll.loan-=need;toast('Prices fell. The bank made you pay '+money(need)+' off the loan')}
    else return endLife('bankrupt');
  }
  const tenants=myHomes().filter(r=>!r.homeless&&!r.sheltered);
  G.rentDue=G.freezeUntil<=G.week;if(!G.rentDue)ll.rentChange=0;
  ll.history.push({year:rungWeek()/WEEKS,equity:equity(),value,loan:ll.loan,cash:ag.cash,rent:ll.year.rent,interest:ll.year.interest,
    repairs:ll.year.repairs,cond:ll.cond,homes:myHomes().length,let:tenants.length,evictions:ll.year.evictions,unrest:G.unrest});
  ll.year=llYear();
}
// buy one figure's homes from the estate with a mortgage, or sell one back to it
function canBuyFromEstate(){return isLandlord()&&G.res.some(r=>r.homeOwner==='you')&&G.res[0].cash>=G.homePrice*LL.deposit}
function buyFromEstate(){
  const r=G.res.find(r=>r.homeOwner==='you');if(!r||!canBuyFromEstate())return false;
  const price=G.homePrice,ag=G.res[0];ag.cash-=price*LL.deposit;G.ll.loan+=price*(1-LL.deposit);G.cash+=price;
  // the condition of the homes you own is averaged in
  const n=myHomes().length;G.ll.cond=(G.ll.cond*n+0.7)/(n+1);
  r.homeOwner='local';toast('You bought '+r.name+"'s homes from the estate");return true;
}
function canSellToEstate(){return isLandlord()&&myHomes().length>0}
function sellToEstate(){
  const homes=myHomes();if(!homes.length)return false;
  const r=homes[homes.length-1],price=G.homePrice*(0.55+0.45*G.ll.cond),share=G.ll.loan/homes.length;
  G.res[0].cash+=price-share;G.ll.loan-=share;G.cash-=price;r.homeOwner='you';r.owed=0;
  toast('You sold '+r.name+"'s homes to the estate. Their rent will climb");return true;
}
function setRentChange(v){G.ll.rentChange=v}
function setRepairs(k){G.ll.repairs=k}

// how a landlord's 20 years are judged
function landlordVerdict(){
  const tenants=myHomes().filter(r=>!r.homeless&&!r.sheltered&&r.income>0);
  const burden=tenants.length?tenants.reduce((a,r)=>a+r.rent/r.income,0)/tenants.length:1;
  const rough=G.res.filter(r=>r.homeless).length;
  const fair=tenants.length>0&&burden<=0.36&&G.ll.cond>=0.65&&rough===0;
  return {kind:fair?'fair':'rentier',burden,rough};
}
// what happens to a tenant six weeks behind: the first time, a card asks you; your answer becomes the policy for
// everyone after (it can be changed on the Tenants tab)
function applyArrears(r,k){
  if(k==='evict'){evict(r);G.ll.year.evictions++}
  else if(k==='time'){r.arrears=0;r.grace=G.week+26}
  else{r.arrears=0;cutRent(r,0.8)}
}
