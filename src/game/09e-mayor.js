/* ================= the mayor rung ================= */
// The third rung of the climb. The activist runs for mayor and wins: two four-year terms, if the town re-elects you.
// The public purse is yours to spend now. You set the property tax on the landlords' rents (Agnes's, and the estate's),
// buy homes for the town and let them at a quarter of a wage (their rent comes back to the purse), and face the deals
// a town gets offered: a mill that wants a subsidy to stay, a developer, a donor who'll pay for your re-election if
// the tax comes down. Approval follows the town's mood, its jobs and its homes; the estate's money backs whoever runs
// against you. Lose the re-election and the rung ends; two terms is the limit.
const MY={years:8,term:4,taxes:{low:0.03,fair:0.1,high:0.2},councilRent:0.25};
const isMayor=()=>G.rung==='mayor';
const myMe=()=>G.res[G.my.i];
function startMayor(){
  const kind=G.ending&&G.ending.kind;
  G.ladder.unlocked=Object.assign({},G.ladder.unlocked,{mayor:true});
  const legacy=Object.assign({},G);delete legacy.ladder;G.ladder.legacyMayor=JSON.stringify(legacy);G.ladder.fromActivist=kind;
  beginMayor(kind);
}
function restartMayor(){
  const ladder=G.ladder;const s=JSON.parse(ladder.legacyMayor);G=DEFAULT();Object.assign(G,s);G.ladder=ladder;
  R.flows=[];R.stage={};beginMayor(ladder.fromActivist);
}
function beginMayor(kind){
  G.rung='mayor';G.rungStart=G.week;G.ending=null;G.card=null;G.arrearsQ=[];G.nextCard=G.week+4;
  const i=G.ac?G.ac.i:G.res.indexOf(G.res.find(r=>r.role==='worker')),r=G.res[i];
  r.job='mayor';r.homeless=false;r.sheltered=false;r.arrears=0;
  G.pub=G.pub||{};
  // a town that changed elects you with a mandate; one bought by a foundation remembers that too
  G.my={i,name:r.name,approval:kind==='changed'?0.58:kind==='bought'?0.45:0.5,tax:'fair',council:0,donors:0,deals:[],
    elections:[],mill:null,granted:0,taxTaken:0,history:[],year:{tax:0,rent:0}};
  G.levyDue=true;G.seen.mayor=false;
  toast('You are '+r.name+', mayor of the town');
}
// a mayor's salary: a wage and a half, from the purse while it can pay
function mayorPay(r){if(!isMayor()||r!==myMe())return 0;const p=Math.min(T.wage*grow(0.02)*1.5,G.fund||0);G.fund-=p;return p}
const councilHomes=()=>G.res.filter(r=>r.homeOwner==='council');
const councilRent=()=>T.wage*grow(0.02)*MY.councilRent;
// a week as mayor: the property tax on the landlords' rents, and approval drifting towards what the town feels
function mayorWeek(){
  const m=G.my,rate=MY.taxes[m.tax];
  const paying=r=>!r.homeless&&!r.sheltered&&r.arrears===0;
  const agnes=G.res.filter(r=>r.homeOwner==='local'&&paying(r)).reduce((a,r)=>a+r.rent,0)*rate;
  const estate=G.res.filter(r=>r.homeOwner==='you'&&paying(r)).reduce((a,r)=>a+r.rent,0)*rate;
  const a=Math.min(agnes,Math.max(0,G.res[0].cash)),e=Math.min(estate,Math.max(0,G.cash));
  G.res[0].cash-=a;G.cash-=e;G.fund=(G.fund||0)+a+e;m.year.tax+=a+e;m.taxTaken+=a+e;
  if(a+e>0)pay('r0','out',a+e,'tax');
  // free buses (or half fares) cost the purse each week, and each worker keeps the fare
  if(m.buses){const c=G.res.length*T.wage*grow(0.02)*0.02*(m.buses==='free'?1:0.5);G.fund=Math.max(0,(G.fund||0)-c);for(const r of G.res)if(r.role==='worker')r.cash+=c/G.res.length}
  m.approval=Math.max(0.05,Math.min(0.9,m.approval+(approvalTarget()-m.approval)*0.02));
}
function approvalTarget(){
  const m=G.my,work=G.res.filter(r=>r.role==='worker'),jobs=work.filter(r=>r.job!=null).length/Math.max(1,work.length);
  return 0.25+(100-G.unrest)/400+(jobs-0.8)*0.6+0.012*m.council+0.02*G.my.granted+(m.buses==='free'?0.03:m.buses?0.015:0)-(m.tax==='high'?0.04:m.tax==='low'?-0.02:0);
}
// who runs against you: a challenger, with the estate's money behind them while it has plenty and you tax it; your
// donors' money is behind you
function challenger(tax){const m=G.my;tax=tax||m.tax;return 0.45+(tax==='high'?0.08:tax==='low'?-0.02:0)+(G.cash>1e9?0.04:G.cash>1e8?0.02:0)-0.03*Math.min(4,m.donors)}
function electionOdds(tax){return Math.max(0.05,Math.min(0.95,0.5+(G.my.approval-challenger(tax))*3))}
function holdElection(){
  const m=G.my,won=rnd()<electionOdds();
  m.elections.push({week:G.week,won,approval:m.approval});
  toast(won?'Re-elected':'You lose the election');if(won)townEvent('election','won');
  return won;
}
// buying a home for the town: one of Agnes's (or the estate's), at the going price, from the purse
function buyCouncilHome(){
  const r=G.res.find(r=>r.homeOwner==='local'&&r.role!=='landlord')||G.res.find(r=>r.homeOwner==='you');
  if(!r||(G.fund||0)<G.homePrice)return false;
  G.fund-=G.homePrice;if(r.homeOwner==='local')G.res[0].cash+=G.homePrice;else G.cash+=G.homePrice;
  r.homeOwner='council';r.rent=Math.min(r.rent,councilRent());r.arrears=0;r.owed=0;G.my.council++;
  townEvent('keys',r.name);return true;
}
function mayorYearEnd(){
  const m=G.my;
  // council rents rise with wages, never above a quarter of one
  for(const r of councilHomes())r.rent=councilRent();
  m.history.push({year:(G.week-G.rungStart)/WEEKS,approval:m.approval,purse:G.fund||0,tax:m.year.tax,council:m.council,unrest:G.unrest});
  m.year={tax:0,rent:0};G.levyDue=true;
  if(rungWeek()>=MY.term*WEEKS&&m.elections.length===0&&!holdElection())endLife('outvoted');
}
function mayorVerdict(){
  // (two terms is the limit: the second ends without a vote)
  const m=G.my;
  return {kind:m.donors>=2?'machine':m.council>=3&&G.unrest<50?'builder':'caretaker'};
}
