/* ================= the waiter rung ================= */
// The fifth rung, the working one. You play one of the café's staff for 15 years in the town Bea leaves: the wage is
// whatever Bea paid, the rent goes to Agnes, and every week is a budget. Extra shifts pay but wear you down; a payday
// lender is there when you're short; the union is organising; evening classes cost now and pay later. Fall far enough
// behind on the rent and you're evicted: the bottom rung. Money here is per household (the figure you play stands for
// HH households, so its numbers are divided by HH on screen).
const WT={years:15,shift:{fewer:0.8,regular:1,extra:1.25},wear:{fewer:0.2,regular:0.03,extra:-0.22},loanRate:0.015,
  dues:6*HH,travel:28*HH,classes:40*HH,classYears:2,trainedPay:1.25};
const isWaiter=()=>G.rung==='waiter';
const me=()=>G.res[G.wt.i];
function startWaiter(){
  const kind=G.ending&&G.ending.kind;
  G.ladder.unlocked=Object.assign({},G.ladder.unlocked,{waiter:true});
  const legacy=Object.assign({},G);delete legacy.ladder;G.ladder.legacyWaiter=JSON.stringify(legacy);G.ladder.fromShop=kind;
  beginWaiter(kind);
}
function restartWaiter(){
  const ladder=G.ladder;const s=JSON.parse(ladder.legacyWaiter);G=DEFAULT();Object.assign(G,s);G.ladder=ladder;
  R.flows=[];R.stage={};beginWaiter(ladder.fromShop);
}
function beginWaiter(kind){
  G.rung='waiter';G.rungStart=G.week;G.ending=null;G.card=null;G.arrearsQ=[];G.nextCard=G.week+6;G.priceDue=false;G.hoursDue=false;
  // you're a waiter at the café: on its staff (taken on if it had none), in a home of your own, renting
  const cafe=G.shops[CAFE];if(!cafe.open){cafe.open=true;cafe.cash=6000*HH;const j=jobless().find(r=>r.name!=='Bea');if(j){j.role='owner';j.shop=CAFE;cafe.owner=G.res.indexOf(j)}}
  let r=staffOf(CAFE)[0]||G.res.find(r=>r.role==='worker'&&r.job==null&&r.name!=='Bea')||G.res.find(r=>r.role==='worker'&&r.job!=='mill');
  // your rent: a third of a waiter's pay if Agnes was played fair, half if she was played hard. (A century of rises
  // across the ladder would otherwise have outrun any wage; from here on it rises the way she was played.)
  r.job=CAFE;r.homeless=false;r.sheltered=false;r.arrears=0;r.owed=0;if(r.homeOwner==='self')r.homeOwner='local';
  // Agnes keeps renting as you played her; the café pays what Bea paid, if you played her
  G.aiLandlord=G.aiLandlord||{rise:0.035,evictAt:6};
  if(G.sh)cafe.wage*=SH.pay[G.sh.pay];
  r.rent=cafe.wage*(G.aiLandlord.rise>=0.05?0.5:0.33);
  G.wt={i:G.res.indexOf(r),name:r.name,shift:'regular',health:0.85,loan:0,union:false,struck:false,classes:0,trained:false,moved:false,
    startCash:r.cash,history:[],year:{earned:0,loanPaid:0}};
  G.shiftsDue=true;G.seen.waiter=false;
  toast('You are '+r.name+', a waiter at the café');
}
// what you earn: the café's wage for your shifts, more once you've trained, nothing on a week too ill to work
function waiterWage(r,w){
  if(!isWaiter()||r!==me())return w;
  const sick=G.wt.health<0.3&&rnd()<(0.3-G.wt.health)*2;
  // (a café its staff own shares its profit: a tenth more)
  return sick?0:w*WT.shift[G.wt.shift]*(G.wt.trained?WT.trainedPay:1)*(G.wt.super?1.15:1)*(G.wt.cityPay?1.2:1)*(G.sh&&G.sh.coop?1.1:1);
}
// a week of your own costs: the loan's interest, union dues, the bus if you moved out, evening classes; and your health
function waiterWeek(){
  const w=G.wt,r=me(),id='r'+w.i;
  if(w.loan>0){const i=w.loan*WT.loanRate;r.cash-=pay(id,'out',i,'interest');const p=Math.min(w.loan,Math.max(0,r.cash*0.15));w.loan-=p;r.cash-=p;w.year.loanPaid+=i+p}
  if(w.union)r.cash-=pay(id,'out',WT.dues,'dues');
  if(w.moved)r.cash-=pay(id,'out',WT.travel*grow(0.02),'travel');
  // housing benefit: the purse pays most of whatever rent takes beyond a third of your pay, while it has money
  if(w.benefit&&r.income>0){const b=Math.min(G.fund||0,Math.max(0,r.rent-r.income/3)*0.6);
    if(b>0){G.fund-=b;r.cash+=pay('out',id,b,'benefit');w.year.benefit=(w.year.benefit||0)+b}
    else if(!(G.fund>0)&&!w.purseEmpty){w.purseEmpty=true;toast('The public purse is empty. Housing benefit stops')}}
  // (a training grant pays half the classes, if the purse can)
  if(w.classes>0){const grant=w.grant&&G.fund>WT.classes/2?WT.classes/2:0;G.fund-=grant;r.cash-=pay(id,'out',(WT.classes-grant)*(w.cheap?0.5:1),'classes');w.classes--;if(w.classes===0){w.trained=true;toast('You finish the course. Your pay goes up')}}
  w.health=Math.max(0,Math.min(1,w.health+WT.wear[w.shift]/WEEKS-(r.debt>0&&!giftsOn().medical?0.002:0)));
  if(r.homeless)return endLife('evicted');
}
function waiterYearEnd(){
  const w=G.wt,r=me();
  w.history.push({year:(G.week-G.rungStart)/WEEKS,cash:r.cash,loan:w.loan,health:w.health,rent:r.rent,income:r.income});
  w.year={earned:0,loanPaid:0};G.shiftsDue=true;
}
const waiterWorth=()=>me().cash-G.wt.loan;
function waiterVerdict(){
  // ahead: trained or six months' rent saved, owing nothing, and still well
  const w=G.wt,ahead=(w.trained||waiterWorth()>=26*me().rent)&&w.loan<=0&&w.health>=0.5;
  return {kind:ahead?'ahead':'by'};
}
