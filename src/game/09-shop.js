/* ================= the shop owner rung ================= */
// The fourth rung, the middle of the ladder. You play Bea, who runs the café, for 20 years in the town Theo leaves.
// The café lives on the spending chain: its customers spend the town's wages, including the wages it pays its own
// staff. You pay rent on the premises to Agnes (still run the way you played her), and decide prices, pay and where
// your supplies come from: the megastore is cheaper, but that money leaves town, while the local store's stays. Higher
// prices send customers to the megastore. Late on, investors may offer to turn the café into a chain: the founder's
// shortcut back up to a billionaire, which skips the climb and changes nothing.
const SH={years:20,premRent:150*HH,pay:{minimum:0.85,standard:1,living:1.18},supply:{mega:0.85,local:1.1}};
const isShop=()=>G.rung==='shop';
const CAFE=1;
const bea=()=>G.res.find(r=>r.name==='Bea');
function startShop(){
  const kind=G.ending&&G.ending.kind;
  G.ladder.unlocked=Object.assign({},G.ladder.unlocked,{shop:true});
  const legacy=Object.assign({},G);delete legacy.ladder;G.ladder.legacyShop=JSON.stringify(legacy);G.ladder.fromPartner=kind;
  beginShop(kind);
}
function restartShop(){
  const ladder=G.ladder;const s=JSON.parse(ladder.legacyShop);G=DEFAULT();Object.assign(G,s);G.ladder=ladder;
  R.flows=[];R.stage={};beginShop(ladder.fromPartner);
}
function beginShop(kind){
  G.rung='shop';G.rungStart=G.week;G.ending=null;G.card=null;G.arrearsQ=[];G.nextCard=G.week+6;G.hoursDue=false;
  // Bea has the café, whatever happened to it: reopened if it closed, bought back if the estate had it
  const s=G.shops[CAFE],b=bea(),i=G.res.indexOf(b);
  for(const r of G.res)if(r.role==='owner'&&r.shop===CAFE&&r!==b){r.role='worker';r.job=null;delete r.shop}
  if(b.job!=null&&b.role==='worker')b.job=null;
  b.role='owner';b.shop=CAFE;s.owner=i;s.open=true;s.ownedByYou=false;s.cash=Math.max(s.cash,8000*HH);s.wage=Math.max(s.wage,T.wage*grow(0.02));
  // Bea has a home, at a rent an owner's draw can carry (a century of rises across the ladder would otherwise have
  // outrun it; from here it rises the way Agnes was played)
  b.homeless=false;b.sheltered=false;b.sofa=false;b.arrears=0;b.owed=0;b.rent=Math.min(b.rent,T.ownerWage*0.33);
  if(staffOf(CAFE).length===0){const j=jobless()[0];if(j)j.job=CAFE}
  G.sh={price:1,pay:'standard',supply:'mega',premRent:SH.premRent*grow(0.03),payYears:{minimum:0,standard:0,living:0},startWorth:0,history:[],year:{rev:0,profit:0},sold:false,founded:false,moved:false};
  G.sh.startWorth=shopWorth();G.priceDue=true;G.seen.shop=false;
  toast('You are Bea, and the café is yours');
}
// the estate offers six years of the café's profit, between $2M and $12M
const buyoutPrice=()=>Math.min(12e6,Math.max(2e6,G.shops[CAFE].profitAvg*WEEKS*6));
const shopWorth=()=>(G.sh&&G.sh.sold?0:Math.max(0,G.shops[CAFE].cash))+bea().cash;
// the sale: the estate pays Bea from its fortune and she retires on it; the café is one of the estate's shops from
// then on (it pays the minimum, and its profit leaves town), and one of the staff goes
function sellCafe(){
  const s=G.shops[CAFE],b=bea(),price=buyoutPrice();
  G.cash-=price;b.cash+=price;G.sh.sold=true;G.sh.soldFor=price;G.sh.pay='minimum';
  b.role='worker';b.job='retired';delete b.shop;s.ownedByYou=true;s.boughtFor=price;
  const st=staffOf(CAFE);if(st.length){const r=st[st.length-1];r.job=null;G.sh.letGo=G.res.indexOf(r);townEvent('laidoff',r.name)}
}
// what the café's choices do to the week: price sends some customers to the megastore, pay and supplies cost more or less
const cafeLeak=()=>Math.max(0,(G.sh.price-1)*1.4)+(G.sh.counter&&!G.sh.loyal?0.08:0);
const cafeSupplies=()=>T.supplies*SH.supply[G.sh.supply]/G.sh.price;
const cafeWageMul=()=>SH.pay[G.sh.pay];
// a week of rent on the premises, to Agnes
function shopWeek(){
  const s=G.shops[CAFE];const rent=G.sh.premRent;s.cash-=rent;G.res[0].income+=pay('s'+CAFE,'r0',rent,'rent');
  // deliveries: the app brings a tenth more and keeps 30% of it, out of town; a local rider brings less, and it stays
  if(G.sh.app==='app'){const x=s.rev*0.1;s.cash+=x*0.7;pay('s'+CAFE,'out',x*0.3,'app')}else if(G.sh.app==='own')s.cash+=s.rev*0.05;
  if(s.cash<-14*s.wage)return endLife('closed');
}
function shopYearEnd(){
  const sh=G.sh,s=G.shops[CAFE];
  if(!(sh.lease>G.week))sh.premRent*=1+(G.aiLandlord?G.aiLandlord.rise:0.035)*(sh.moved?0.5:1);
  sh.payYears[sh.pay]++;
  sh.history.push({year:(G.week-G.rungStart)/WEEKS,worth:shopWorth(),cash:s.cash,staff:staffOf(CAFE).length,price:sh.price,pay:sh.pay,supply:sh.supply,unrest:G.unrest});
  G.priceDue=true;
}
function shopVerdict(){
  const sh=G.sh,y=sh.payYears,fairPay=y.living+y.standard>=y.minimum*2,local=sh.supply==='local';
  return {kind:fairPay&&G.shops[CAFE].open?'pillar':'tightfisted',fairPay,local};
}
