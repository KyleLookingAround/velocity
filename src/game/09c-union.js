/* ================= the union organiser rung ================= */
// The first rung of the climb back up, by votes rather than money. You play the person you were out of work, now
// organising the town's workers for 10 years. Members pay dues into a strike fund; a strike wins when enough of the
// workers are in and the fund can carry them, and a win raises a whole workplace's pay (the mill's owners are elsewhere,
// the café is Bea's, the estate's shops send their profit away). Employers fight back: counter-offers, sackings, and a
// manager's job for you if you'll call it all off. A wage won here is spent in town: the spending chain from below.
const UN={years:10,dues:20*HH,strikeWeeks:4,winRaise:0.12,dealRaise:0.05};
const isUnion=()=>G.rung==='union';
const unMe=()=>G.res[G.un.i];
const workers=()=>G.res.filter(r=>r.role==='worker'&&r.job!=null);
function startUnion(){
  const kind=G.ending&&G.ending.kind;
  G.ladder.unlocked=Object.assign({},G.ladder.unlocked,{union:true});
  const legacy=Object.assign({},G);delete legacy.ladder;G.ladder.legacyUnion=JSON.stringify(legacy);G.ladder.fromOut=kind;
  beginUnion(kind);
}
function restartUnion(){
  const ladder=G.ladder;const s=JSON.parse(ladder.legacyUnion);G=DEFAULT();Object.assign(G,s);G.ladder=ladder;
  R.flows=[];R.stage={};beginUnion(ladder.fromOut);
}
function beginUnion(kind){
  setAge('union');G.rung='union';G.rungStart=G.week;G.ending=null;G.card=null;G.arrearsQ=[];G.nextCard=G.week+4;G.claimDue=false;
  const i=G.ow?G.ow.i:G.res.indexOf(workers()[0]),r=G.res[i];
  // the union pays you a modest wage to organise; you're housed, whatever happened at the bottom
  r.job='union';r.homeless=false;r.sheltered=false;r.arrears=0;
  const shopsWage=G.shops.filter(s=>s.open).reduce((a,s)=>a+s.wage,0)/Math.max(1,G.shops.filter(s=>s.open).length);
  // an organiser who already led the people at the bottom starts with more of them behind them
  G.un={i,name:r.name,members:(kind==='organiser'?0.3:0.15)+(G.wt&&G.wt.organiser?0.05:0),fund:0,wins:0,losses:0,soldOut:false,striking:0,target:null,
    startMill:G.millMul||1,startShops:shopsWage,history:[]};
  G.seen.union=false;
  toast('You are '+r.name+', organising the town’s workers');
}
// your own pay as organiser: three-quarters of a wage, from the union
function unionPay(r){return isUnion()&&r===unMe()?T.wage*grow(0.02)*0.75:0}
// a week of the union: dues into the strike fund, strike pay out of it, and a strike's end
function unionWeek(){
  const u=G.un,n=workers().length;
  u.fund+=u.members*n*UN.dues*grow(0.02)*(u.national===true?0.8:1);
  if(u.striking>0){
    u.fund-=u.members*n*T.wage*grow(0.02)*0.4;u.striking--;
    if(u.fund<0){u.fund=0;u.striking=0;return strikeEnds(false)}
    // (a strike is judged on the odds it was called at: the fund it spends on strike pay was already counted)
    if(u.striking===0)strikeEnds(rnd()<(u.odds??strikeOdds(u.target)));
  }
  u.members=Math.max(0,Math.min(1,u.members+(G.unrest>55?0.002:-0.001)));
}
// a strike's odds: how many are in, how long the fund can carry them, and how hard the employer can hold out
function strikeOdds(target){
  const u=G.un,n=Math.max(1,workers().length),weeks=u.fund/Math.max(1,u.members*n*T.wage*grow(0.02)*0.4);
  const hold=target==='mill'?0.55:target==='estate'?0.6:0.4;
  return Math.max(0.05,Math.min(0.95,u.members*0.8+Math.min(1,weeks/UN.strikeWeeks)*0.5-hold+0.2+(u.allies?0.05:0)+(u.focus===target?UN_FOCUS:0)));
}
// the fronts: where the union can strike, who works there, and how hard the employer holds out. Once a quarter you can
// put your organising into one of them, which raises the odds there
const FRONTS=[{k:'mill',name:'The mill',hold:'Owners elsewhere, a long purse'},{k:'street',name:'The high street',hold:'Small owners, short of cash'},{k:'estate',name:'The estate\u2019s shops',hold:'The estate\u2019s lawyers'}];
const UN_FOCUS=0.06;
const frontStaff=k=>k==='mill'?millStaff().length:G.shops.reduce((a,s,i)=>a+(s.open&&(k==='estate'?s.ownedByYou:!s.ownedByYou)?staffOf(i).length:0),0);
const frontOpen=k=>k!=='estate'||shopsOwned()>0;
function setFocus(k){const u=G.un;if(!frontOpen(k)||u.focus===k||(u.focusAt!=null&&G.week-u.focusAt<13))return false;u.focus=k;u.focusAt=G.week;return true}
// a strike needs a fund that can carry the members for its four weeks
const strikeCost=()=>G.un.members*Math.max(1,workers().length)*T.wage*grow(0.02)*0.4*UN.strikeWeeks;
function strikeEnds(won){
  const u=G.un,t=u.target;
  if(won){u.wins++;u.wonAt=Object.assign({},u.wonAt,{[t]:true});if(t==='mill')G.millMul=(G.millMul||1)*(1+UN.winRaise);else G.shops.forEach(s=>{if(s.open&&(t==='estate'?s.ownedByYou:!s.ownedByYou))s.wage*=1+UN.winRaise});
    u.members=Math.min(1,u.members+0.1);toast('The strike is won: '+(t==='mill'?'the mill':t==='estate'?'the estate’s shops':'the high street')+' pays 12% more');townEvent('strikewon',t)}
  else{u.losses++;u.members=Math.max(0,u.members-0.08);toast('The strike is lost')}
  u.target=null;
}
function unionYearEnd(){const u=G.un;u.history.push({year:(G.week-G.rungStart)/WEEKS,members:u.members,fund:u.fund,wins:u.wins,mill:G.millMul||1})}
// how much pay has risen since you started, across the mill and the high street (above inflation)
function wageRise(){
  const u=G.un,open=G.shops.filter(s=>s.open),shops=open.reduce((a,s)=>a+s.wage,0)/Math.max(1,open.length);
  return ((G.millMul||1)/u.startMill+shops/Math.max(1,u.startShops)/Math.pow(1.02,(G.week-G.rungStart)/WEEKS))/2-1;
}
function unionVerdict(){const u=G.un;return {kind:u.soldOut?'soldout':u.wins>=2&&wageRise()>=0.08?'fairpay':'busted'}}
