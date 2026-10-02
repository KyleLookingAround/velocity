/* ================= the law firm partner rung ================= */
// The third rung. You play Theo, a law firm partner on $2,400 an hour, the top of the video's pay table: at that rate a
// billion takes 200 years. 20 years in the town the landlord left; Agnes is run by the computer now, the way you ran her.
// Each year you set your hours: more hours, more money, and burnout builds. Clients come as cards. The rich pay best:
// the estate wants loopholes (which starve the town's public works), Agnes wants her evictions handled, the mill wants
// to fight its union. The town can't pay at all: a tenant facing eviction, the union itself. You live in the town too:
// you rent from Agnes unless you buy, and you spend in its shops.
const PT={years:20,rate:2400,weeksWorked:46,living:9000,taxShare:0.012,returns:0.06,burnUp:0.03,burnDown:0.08};
const isPartner=()=>G.rung==='partner';
function startPartner(){
  const kind=G.ending&&G.ending.kind;
  G.ladder.unlocked=Object.assign({},G.ladder.unlocked,{partner:true});
  const legacy=Object.assign({},G);delete legacy.ladder;G.ladder.legacyPartner=JSON.stringify(legacy);G.ladder.fromLandlord=kind;
  beginPartner(kind);
}
function restartPartner(){
  const ladder=G.ladder;const s=JSON.parse(ladder.legacyPartner);G=DEFAULT();Object.assign(G,s);G.ladder=ladder;
  R.flows=[];R.stage={};beginPartner(ladder.fromLandlord);
}
function beginPartner(kind){
  setAge('partner');G.rung='partner';G.rungStart=G.week;G.ending=null;G.card=null;G.arrearsQ=[];G.nextCard=G.week+6;G.rentDue=false;
  // Agnes keeps on as you played her: a fair landlord raises rents 2% a year and gives tenants time, a rentier 7% and evicts
  G.aiLandlord=kind==='fair'?{rise:0.02,evictAt:10}:{rise:0.07,evictAt:6};
  G.pt={cash:400000,hours:50,rent:3200,home:'rent',loopholes:0,evictionWork:0,proBono:0,unionSide:null,burn:0.1,partnerShare:1,
    earned:0,history:[],year:{earned:0,hours:0,fees:{}}};
  G.seen.partner=false;G.hoursDue=true;
  toast('You are Theo, a law firm partner');
}
const ptWorth=()=>G.pt.cash+(G.pt.home==='own'?G.pt.homeValue||0:0);
// at your average rate so far, how many years a billion would take
// (in the first year, from your hours: there isn't a year's earnings to average yet)
const yearsToBillion=()=>{const y=(G.week-G.rungStart)/WEEKS,avg=y>=1?G.pt.earned/y:G.pt.hours*PT.rate*PT.weeksWorked*G.pt.partnerShare;return 1e9/Math.max(1,avg)};
// a week of the partner: fees, living costs, rent to Agnes, and what's left invested; the money you spend goes into town
function partnerWeek(){
  const p=G.pt,worked=p.hours*PT.rate*p.partnerShare*(1-p.burn*0.4)*(PT.weeksWorked/WEEKS);
  p.cash+=worked;p.earned+=worked;p.year.earned+=worked;p.year.hours+=p.hours;
  p.cash*=Math.pow(1+PT.returns,1/WEEKS);
  const rent=p.home==='rent'?p.rent*grow(0.03):0;
  if(rent){p.cash-=rent;G.res[0].income+=pay('you','r0',rent,'rent')}
  p.cash-=PT.living*grow(0.02);
  return PT.living*grow(0.02)*0.7; // what you spend in town's shops this week
}
// the end of each year: burnout follows your hours, and the town collects its share of the estate (less your loopholes)
function partnerYearEnd(){
  const p=G.pt;
  p.burn=Math.max(0,Math.min(1,p.burn+(p.hours>55?(p.hours-55)/10*PT.burnUp*2:p.hours<45?-PT.burnDown:-0.02)));
  if(p.burn>=1)return endLife('burnout');
  const tax=Math.max(0,G.cash)*PT.taxShare/Math.pow(2,p.loopholes);
  if(tax>0){G.cash-=tax;purse('tax',tax)}
  p.history.push({year:(G.week-G.rungStart)/WEEKS,cash:p.cash,worth:ptWorth(),earned:p.year.earned,burn:p.burn,taxToTown:tax,hours:p.hours});
  p.year={earned:0,hours:0,fees:{}};G.hoursDue=true;
}
function partnerVerdict(){
  const p=G.pt,forRich=p.loopholes+p.evictionWork+(p.unionSide==='mill'?1:0),forTown=p.proBono+(p.unionSide==='union'?1:0);
  return {kind:forRich>forTown?'hiredgun':'counsel',forRich,forTown};
}
function feeOf(hours){return hours*PT.rate} // a case's fee: so many billable hours
