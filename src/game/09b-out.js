/* ================= the out of work rung ================= */
// The bottom rung. You play the same person you were as the waiter, now out of work (and, if you were evicted, with
// nowhere to live), for 5 years. What gets you through is whatever the town has: benefits and public works paid from
// the public purse (as full as the rich were taxed), the shelter if a billionaire's gifts still fund it, the food bank,
// gig work that pays and wears you down. Jobs come as offers, rarer when nobody's hiring and when you've no address.
// The way back up is work and a home, or organising the people around you: the first step of the climb.
const OW={years:5,benefit:0.35,works:0.8,gig:0.45,gigWear:-0.25,offerChance:0.5};
const isOut=()=>G.rung==='out';
const outMe=()=>G.res[G.ow.i];
function startOut(){
  const kind=G.ending&&G.ending.kind;
  G.ladder.unlocked=Object.assign({},G.ladder.unlocked,{out:true});
  const legacy=Object.assign({},G);delete legacy.ladder;G.ladder.legacyOut=JSON.stringify(legacy);G.ladder.fromWaiter=kind;
  beginOut(kind);
}
function restartOut(){
  const ladder=G.ladder;const s=JSON.parse(ladder.legacyOut);G=DEFAULT();Object.assign(G,s);G.ladder=ladder;
  R.flows=[];R.stage={};beginOut(ladder.fromWaiter);
}
function beginOut(kind){
  setAge('out');G.rung='out';G.rungStart=G.week;G.ending=null;G.card=null;G.arrearsQ=[];G.nextCard=G.week+4;G.shiftsDue=false;
  // the waiter loses the job (the café lets them go, or they were evicted and couldn't keep it)
  // (straight from a sale of the café, you're the one the estate let go)
  const i=G.wt?G.wt.i:G.sh&&G.sh.letGo!=null&&G.res[G.sh.letGo].job==null?G.sh.letGo:G.res.indexOf(jobless()[0]||G.res.find(r=>r.role==='worker'&&r.job!=='retired'));
  const r=G.res[i];r.job=null;if(r.role==='owner'){r.role='worker';delete r.shop}
  G.aiLandlord=G.aiLandlord||{rise:0.035,evictAt:6};
  G.ow={i,name:r.name,benefit:false,works:false,gig:false,health:G.wt?Math.max(0.3,G.wt.health):0.7,trained:!!(G.wt&&G.wt.trained),course:0,
    organised:0,foodbank:0,sanctioned:0,history:[],startHomeless:r.homeless};
  G.seen.out=false;G.claimDue=true;
  toast(r.homeless?'You are '+r.name+': no job, and nowhere to live':'You are '+r.name+', and the café has let you go');
}
// figures the town's shops can hire without asking: everyone out of work except you, whose offers come as cards
const hireable=()=>jobless().filter(r=>!(isOut()&&r===outMe()));
// a week out of work: benefit and public works from the purse, gig work, and your health
function outWeek(){
  const o=G.ow,r=outMe(),id='r'+o.i,wage=T.wage*grow(0.02);
  const fromPurse=a=>{const p=Math.min(G.fund||0,a);if(p>0){purse('benefit',-p);r.cash+=pay('out',id,p,'benefit')}return p};
  if(r.job==null){
    if(o.benefit&&o.sanctioned<=0)fromPurse(wage*OW.benefit);
    if(o.works&&!fromPurse(wage*OW.works)){o.works=false;toast('The public works scheme has run out of money')}
    if(o.gig){r.cash+=pay('out',id,wage*(o.coopGig?0.4:OW.gig)*(r.homeless?0.8:1),'gig');o.health+=OW.gigWear*(o.coopGig?0.5:1)/WEEKS}
  }
  if(o.sanctioned>0)o.sanctioned--;
  if(o.course>0){o.course--;if(o.course===0){o.trained=true;toast('You finish the course')}}
  o.health=Math.max(0,Math.min(1,o.health+(r.homeless&&!r.sheltered?-0.15:0.05)/WEEKS));
}
// the chance a job offer comes this card: more when shops are short of staff, less with no address or poor health
function offerOdds(){
  const r=outMe(),open=G.shops.some((s,i)=>s.open&&staffOf(i).length<SHOP_DEF[i].max)||millStaff().length<T.millStaff||G.workshops.some((w,i)=>G.res.filter(x=>x.job==='w'+i).length<T.workshopStaff);
  return (open?0.7:0.25)*(r.homeless?0.5:1)*(G.ow.trained?1.3:1)*(0.4+0.6*G.ow.health);
}
function outYearEnd(){const o=G.ow,r=outMe();o.history.push({year:(G.week-G.rungStart)/WEEKS,cash:r.cash,job:r.job,homeless:r.homeless,health:o.health})}
function outVerdict(){
  const o=G.ow,r=outMe(),feet=r.job!=null&&!r.homeless&&!r.sheltered&&!r.sofa;
  return {kind:o.organised>=3?'organiser':feet?'feet':'stuck'};
}
