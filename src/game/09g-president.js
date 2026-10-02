/* ================= the president rung ================= */
// The top of the climb. The governor wins the country: two four-year terms, if it re-elects you. Here the video's
// ideas are the law you can change: tax gains like wages (not half of them), end buy-borrow-die, tax the biggest
// fortunes, and pay for the programme price list (poverty, homelessness, rents, childcare, medical debt) for the whole
// country. Bills go to Congress, whose support follows your approval and shifts at the midterms; the lobbyists will
// fund you if you water things down; the Court can strike a law. What you pass lasts: it carries into the next
// billionaire life, in the country you made.
const PR={years:8,term:4,billWeeks:20};
const BILLS=[
  {k:'wealthtax',name:'A tax on fortunes',note:'2% a year on fortunes over $50M',opp:0.16},
  {k:'gains',name:'Tax gains like wages',note:'No more tax on only half the gains',opp:0.1},
  {k:'stepup',name:'End buy, borrow, die',note:'Gains are taxed when a fortune is passed on',opp:0.1},
  ...GIFTS.map(g=>({k:g.k,name:g.name,note:g.note+' ('+g.real+')',opp:g.k==='poverty'?0.12:0.05,programme:true})),
];
const lawOf=k=>BILLS.find(b=>b.k===k);
const isPresident=()=>G.rung==='president';
const prMe=()=>G.res[G.pr.i];
function startPresident(){
  const kind=G.ending&&G.ending.kind;
  G.ladder.unlocked=Object.assign({},G.ladder.unlocked,{president:true});
  const legacy=Object.assign({},G);delete legacy.ladder;G.ladder.legacyPresident=JSON.stringify(legacy);G.ladder.fromGovernor=kind;
  beginPresident(kind);
}
function restartPresident(){
  const ladder=G.ladder;const s=JSON.parse(ladder.legacyPresident);G=DEFAULT();Object.assign(G,s);G.ladder=ladder;
  R.flows=[];R.stage={};beginPresident(ladder.fromGovernor);
}
function beginPresident(kind){
  setAge('president');G.rung='president';G.rungStart=G.week;G.ending=null;G.card=null;G.arrearsQ=[];G.nextCard=G.week+3;G.wageDue=false;
  const i=G.gv?G.gv.i:G.res.indexOf(G.res.find(r=>r.role==='worker')),r=G.res[i];
  r.job='president';r.homeless=false;r.sheltered=false;r.arrears=0;
  G.pub=G.pub||{};
  G.pr={i,name:r.name,approval:kind==='newdeal'?0.56:kind==='dealmaker'?0.5:0.52,congress:kind==='newdeal'?0.5:0.45,
    loop:!!(G.ladder.laws&&Object.keys(G.ladder.laws).length),bill:null,billStart:0,passed:[],failed:[],lobby:0,struck:[],elections:[],history:[]};
  G.seen.president=false;
  toast('You are '+r.name+', president');
}
function presidentPay(r){return isPresident()&&r===prMe()?T.wage*grow(0.02)*3:0}
const prAvailable=()=>BILLS.filter(b=>!G.pr.passed.includes(b.k));
// the lobby's money stands behind every bill's opponents
const prOpposition=k=>lawOf(k).opp+0.03*Math.min(4,G.pr.lobby);
function congressOdds(k,boost){const p=G.pr;return Math.max(0.05,Math.min(0.95,0.5+(p.congress+0.3*(p.approval-0.5)+(boost||0)-prOpposition(k)-0.42)*2.5))}
function presidentWeek(){
  const p=G.pr,work=G.res.filter(r=>r.role==='worker'),jobs=work.filter(r=>r.job!=null).length/Math.max(1,work.length);
  const target=0.31+(100-G.unrest)/400+(jobs-0.8)*0.6+0.025*p.passed.length-0.02*p.lobby;
  p.approval=Math.max(0.05,Math.min(0.9,p.approval+(target-p.approval)*0.02));
}
function holdCongressVote(boost){
  const p=G.pr,k=p.bill,won=rnd()<congressOdds(k,boost);p.bill=null;
  if(won){p.passed.push(k);enactBill(k);toast('Congress passes it: '+lawOf(k).name);townEvent('ballot',k)}
  else{p.failed.push(k);p.approval=Math.max(0.05,p.approval-0.02);toast('Congress votes it down: '+lawOf(k).name)}
  return won;
}
// a law: the programmes run from the purse, which federal money fills; the taxes take from the biggest fortune
function enactBill(k){G.pub[k]=true;if(lawOf(k).programme)purse('federal',G.res.length*T.wage*grow(0.02)*WEEKS*0.25)}
function presidentYearEnd(){
  const p=G.pr,y=Math.round((G.week-G.rungStart)/WEEKS);
  // federal money for the programmes the country pays for
  const progs=BILLS.filter(b=>b.programme&&G.pub[b.k]).length;
  purse('federal',progs*G.res.length*T.wage*grow(0.02)*WEEKS*0.1);
  p.history.push({year:y,approval:p.approval,congress:p.congress,passed:p.passed.length});
  // the midterms, two years into each term: Congress swings towards how the country feels about you
  if(y%PR.term===2){p.congress=Math.max(0.2,Math.min(0.75,p.congress+(p.approval-0.5)*0.5-0.03));toast('The midterms: '+Math.round(p.congress*100)+'% of Congress with you')}
  if(y===PR.term&&p.elections.length===0){
    const won=rnd()<prElectionOdds();p.elections.push({week:G.week,won,approval:p.approval});
    toast(won?'Re-elected president':'You lose the election');if(won)townEvent('election','won');else endLife('oneterm');
  }
}
function prElectionOdds(){const p=G.pr;return Math.max(0.05,Math.min(0.95,0.5+(p.approval-(0.44+(G.pub.wealthtax?0.04:0)-0.03*Math.min(4,p.lobby)))*3))}
function presidentVerdict(){
  const p=G.pr;return {kind:p.lobby>=2?'lobbied':p.passed.includes('wealthtax')&&p.passed.length>=4?'rebuilt':'gridlock'};
}
// the laws a president passed, carried into the next billionaire life
function lawsPassed(){const out={};for(const k of (G.pr?G.pr.passed:[]))if(!G.pr.struck.includes(k))out[k]=true;return out}
