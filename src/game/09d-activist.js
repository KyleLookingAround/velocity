/* ================= the activist rung ================= */
// The second rung of the climb. You play the same person, now campaigning for 10 years for changes the whole town
// votes on: taxing the estate, capping rents, closing the loopholes, and public programmes paid from the public purse
// (the gifts a billionaire could have funded, now the town's). Supporters give a little each week; a campaign runs at
// least half a year before its vote; the estate's money pays for the other side. A passed measure lasts: it carries up
// the ladder, and the programmes run while the purse can pay. A foundation will fund you, if you drop the wealth tax.
const AC={years:10,give:0.01,campaignWeeks:30};
const MEASURES=[
  {k:'wealthtax',name:'Tax the estate',note:'2% of the estate’s fortune a year, into the public purse',opp:0.12},
  {k:'rentcap',name:'Cap rents',note:'No rent above a third of a wage, rises of 2% a year at most, and no eviction under ten weeks behind',opp:0.08},
  {k:'loopholes',name:'Close the loopholes',note:'The estate pays its full share of tax again',opp:0.1,when:()=>G.pt&&G.pt.loopholes>0},
  {k:'shelter',name:'Housing first',note:'Nobody sleeps rough; the public purse pays',opp:0.03},
  {k:'childcare',name:'Public childcare',note:'Parents can work full time; the public purse pays',opp:0.04},
  {k:'medical',name:'Medical debt relief',note:'Medical debt cleared as it arrives; the public purse pays',opp:0.04},
  {k:'vouchers',name:'Housing vouchers',note:'A third of the rent for low earners; the public purse pays',opp:0.05},
];
const measure=k=>MEASURES.find(m=>m.k===k);
const isActivist=()=>G.rung==='activist';
const acMe=()=>G.res[G.ac.i];
function startActivist(){
  const kind=G.ending&&G.ending.kind;
  G.ladder.unlocked=Object.assign({},G.ladder.unlocked,{activist:true});
  const legacy=Object.assign({},G);delete legacy.ladder;G.ladder.legacyActivist=JSON.stringify(legacy);G.ladder.fromUnion=kind;
  beginActivist(kind);
}
function restartActivist(){
  const ladder=G.ladder;const s=JSON.parse(ladder.legacyActivist);G=DEFAULT();Object.assign(G,s);G.ladder=ladder;
  R.flows=[];R.stage={};beginActivist(ladder.fromUnion);
}
function beginActivist(kind){
  G.rung='activist';G.rungStart=G.week;G.ending=null;G.card=null;G.arrearsQ=[];G.nextCard=G.week+3;
  const i=G.un?G.un.i:G.res.indexOf(G.res.find(r=>r.role==='worker')),r=G.res[i];
  r.job='activist';r.homeless=false;r.sheltered=false;r.arrears=0;
  G.pub=G.pub||{};
  // the town remembers how the union ended: a union that won brings people with it, one that sold out costs trust
  G.ac={i,name:r.name,support:kind==='fairpay'?0.4:kind==='soldout'?0.22:0.3,funds:0,campaign:null,campaignStart:0,
    passed:[],lost:[],donor:false,arrests:0,granted:0,base:0,history:[]};
  G.seen.activist=false;
  toast('You are '+r.name+', campaigning for the whole town');
}
// a campaign group pays you a little over half a wage
function activistPay(r){return isActivist()&&r===acMe()?T.wage*grow(0.02)*0.6:0}
const available=()=>MEASURES.filter(m=>!G.ac.passed.includes(m.k)&&!(G.ac.donor&&m.k==='wealthtax')&&(!m.when||m.when()));
// the other side: each measure's own opponents, and the estate's money on top while it has plenty
const opposition=k=>measure(k).opp+(G.cash>1e9?0.05:G.cash>1e8?0.03:0);
// what the funds buy in a final push of adverts and leaflets: up to 12 points
const adsBoost=()=>0.12*Math.min(1,G.ac.funds/Math.max(1,G.res.length*T.wage*grow(0.02)*0.15));
// the chance a vote passes, given support and the final push
function voteOdds(k,boost){return Math.max(0.05,Math.min(0.95,0.5+(G.ac.support+(boost||0)-opposition(k)-0.45)*2.5))}
// a week: supporters give, and support drifts towards what the town's mood and your record say (the doors you've
// knocked on build a base that stays)
function activistWeek(){
  const a=G.ac,n=G.res.length;
  a.funds+=a.support*n*T.wage*grow(0.02)*AC.give;
  // a campaign under way is itself knocking on doors: support builds week by week until the vote
  if(a.campaign)a.support=Math.min(0.9,a.support+0.002);
  const target=0.22+G.unrest/250+(a.base||0)+0.03*a.passed.length-(a.donor?0.1:0)-0.02*a.arrests;
  a.support=Math.max(0.05,Math.min(0.9,a.support+(target-a.support)*0.01));
}
function holdVote(boost){
  const a=G.ac,k=a.campaign,won=rnd()<voteOdds(k,boost);
  a.campaign=null;
  if(won){a.passed.push(k);passMeasure(k);a.support=Math.min(0.9,a.support+0.03);toast('The vote passes: '+measure(k).name);townEvent('ballot',k)}
  else{a.lost.push(k);a.support=Math.max(0.05,a.support-0.04);toast('The vote is lost: '+measure(k).name)}
  return won;
}
// a passed measure lasts: rent rules bind Agnes, a tax fills the purse, and programmes are paid from the purse
function passMeasure(k){
  if(k==='rentcap'){G.aiLandlord=G.aiLandlord||{rise:0.035,evictAt:6};G.aiLandlord.rise=Math.min(G.aiLandlord.rise,0.02);G.aiLandlord.evictAt=Math.max(G.aiLandlord.evictAt,10);
    for(const r of G.res)if(r.homeOwner==='local')r.rent=Math.min(r.rent,T.wage*grow(0.02)/3)}
  if(k==='loopholes'&&G.pt)G.pt.loopholes=0;
  G.pub[k]=true;
  if(k==='shelter')for(const r of G.res)if(r.homeless){r.homeless=false;r.sheltered=true}
}
function activistYearEnd(){const a=G.ac;a.history.push({year:(G.week-G.rungStart)/WEEKS,support:a.support,funds:a.funds,passed:a.passed.length,purse:G.fund||0})}
function activistVerdict(){const a=G.ac;return {kind:a.donor?'bought':a.passed.length>=3?'changed':a.passed.length?'heard':'ignored'}}
