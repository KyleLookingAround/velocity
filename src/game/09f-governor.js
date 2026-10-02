/* ================= the governor rung ================= */
// The fourth rung of the climb. The mayor wins the state: two four-year terms, if the state re-elects you. The town is
// one of many now, and what reaches it comes from the state: a minimum wage under every pay packet, a tax on the
// biggest fortunes (the estate's among them), grants to towns paid from the state's budget, and the deals a state gets
// offered: a chain's warehouse for a tax break, a recession that tests whether you cut or spend. Approval follows the
// town's mood and jobs (it stands for the state's); the estate's money backs whoever runs against you.
const GV={years:8,term:4,minWageStep:0.1,fortuneTax:0.01};
const isGovernor=()=>G.rung==='governor';
const gvMe=()=>G.res[G.gv.i];
function startGovernor(){
  const kind=G.ending&&G.ending.kind;
  G.ladder.unlocked=Object.assign({},G.ladder.unlocked,{governor:true});
  const legacy=Object.assign({},G);delete legacy.ladder;G.ladder.legacyGovernor=JSON.stringify(legacy);G.ladder.fromMayor=kind;
  beginGovernor(kind);
}
function restartGovernor(){
  const ladder=G.ladder;const s=JSON.parse(ladder.legacyGovernor);G=DEFAULT();Object.assign(G,s);G.ladder=ladder;
  R.flows=[];R.stage={};beginGovernor(ladder.fromMayor);
}
function beginGovernor(kind){
  G.rung='governor';G.rungStart=G.week;G.ending=null;G.card=null;G.arrearsQ=[];G.nextCard=G.week+4;G.levyDue=false;
  const i=G.my?G.my.i:G.res.indexOf(G.res.find(r=>r.role==='worker')),r=G.res[i];
  r.job='governor';r.homeless=false;r.sheltered=false;r.arrears=0;
  G.pub=G.pub||{};
  // the state starts with a budget of a year of the town's wages, times the towns it stands for
  G.gv={i,name:r.name,approval:kind==='builder'?0.56:kind==='machine'?0.5:0.52,minWage:1,raises:0,cuts:0,fortuneTax:false,
    budget:G.res.length*T.wage*grow(0.02)*WEEKS*0.5,granted:0,donors:0,deals:[],elections:[],recession:0,history:[],year:{grants:0,tax:0}};
  G.wageDue=true;G.seen.governor=false;
  toast('You are '+r.name+', governor of the state');
}
// a governor's salary: twice a wage, from outside the town
function governorPay(r){return isGovernor()&&r===gvMe()?T.wage*grow(0.02)*2:0}
// the state's minimum wage: no shop pays less, and the mill's base pay follows it
const minWageFloor=()=>T.wage*grow(0.02)*(G.gv?G.gv.minWage:1)*0.9;
function governorWeek(){
  const g=G.gv;
  for(const s of G.shops)if(s.open)s.wage=Math.max(s.wage,minWageFloor());
  G.millMul=Math.max(G.millMul||1,g.minWage);
  // a recession lasts a year (it starts as a card: the mill lays people off)
  if(g.recession>0){g.recession--;if(g.recession===0)toast('The recession is over')}
  g.approval=Math.max(0.05,Math.min(0.9,g.approval+(gvApprovalTarget()-g.approval)*0.02));
}
function gvApprovalTarget(){
  const g=G.gv,work=G.res.filter(r=>r.role==='worker'),jobs=work.filter(r=>r.job!=null).length/Math.max(1,work.length);
  return 0.27+(100-G.unrest)/400+(jobs-0.8)*0.6+0.03*g.raises+0.015*g.granted-(g.recession>0?0.05:0)-0.03*g.cuts;
}
function gvChallenger(){const g=G.gv;return 0.46+(g.fortuneTax?0.06:0)+(G.cash>1e9?0.04:G.cash>1e8?0.02:0)-0.03*Math.min(4,g.donors)}
function gvElectionOdds(){return Math.max(0.05,Math.min(0.95,0.5+(G.gv.approval-gvChallenger())*3))}
// the state's budget pays grants to towns: a share of it into this town's purse
function stateGrant(share){const g=G.gv,a=g.budget*share;g.budget-=a;G.fund=(G.fund||0)+a;g.granted++;g.year.grants+=a;return a}
function governorYearEnd(){
  const g=G.gv;
  // the state's own taxes: on wages (a little of the town's), and, if you passed it, 1% of the biggest fortunes
  g.budget+=G.res.length*T.wage*grow(0.02)*WEEKS*0.15;
  if(g.fortuneTax&&G.cash>0){const t=G.cash*GV.fortuneTax;G.cash-=t;g.budget+=t;g.year.tax+=t}
  g.history.push({year:(G.week-G.rungStart)/WEEKS,approval:g.approval,budget:g.budget,minWage:g.minWage,unrest:G.unrest});
  g.year={grants:0,tax:0};G.wageDue=true;
  if(rungWeek()>=GV.term*WEEKS&&g.elections.length===0){
    const won=rnd()<gvElectionOdds();g.elections.push({week:G.week,won,approval:g.approval});
    toast(won?'Re-elected governor':'You lose the election');if(won)townEvent('election','won');else endLife('unseated');
  }
}
function governorVerdict(){
  const g=G.gv;return {kind:g.donors>=2?'dealmaker':g.raises>=2&&g.fortuneTax?'newdeal':'steward'};
}
// the recession's first blow: the mill lays off a third of its staff, and the year is hard
function recessionHits(){const g=G.gv;g.recession=WEEKS;const m=millStaff();m.slice(0,Math.ceil(m.length/3)).forEach(r=>{r.job=null});townEvent('laidoff','The mill')}
