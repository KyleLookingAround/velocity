/* ================= state ================= */
// G is the saved state, R is runtime only. Every saved field of G gets its default here, so older saves load.
const FIELDS={
  v:()=>1, week:()=>0, cash:()=>START_FORTUNE, rate:()=>T.baseReturn,
  homePrice:()=>T.homePrice,       // what one figure's homes cost now
  priceMood:()=>1, pricePush:()=>0, // the market's mood, and how far your buying has pushed it
  res:()=>makeResidents(), shops:()=>makeShops(), workshops:()=>[],
  gifts:()=>({poverty:false,shelter:false,vouchers:false,childcare:false,medical:false}),
  unrest:()=>18, revoltWeeks:()=>0, ending:()=>null,
  year:()=>emptyYear(), history:()=>[], gains:()=>0, given:()=>0, taxPaid:()=>0,
  nextTax:()=>T.taxEvery*WEEKS, tax:()=>null, moved:()=>0, lobbied:()=>0,
  speed:()=>1, seen:()=>({intro:false}), autoAcct:()=>false, adviser:()=>null,
  card:()=>null, nextCard:()=>12, cool:()=>({}), choices:()=>[], threads:()=>[], boom:()=>null, offshore:()=>false, ageAt:()=>START_AGE, pyear:()=>({}), plast:()=>null, borrowed:()=>false, senator:()=>false,
  arrearsQ:()=>[], seenGifts:()=>({}), rentDue:()=>false, freezeUntil:()=>0,
  aiLandlord:()=>null, pt:()=>null, hoursDue:()=>false, millMul:()=>1, sh:()=>null, priceDue:()=>false, wt:()=>null, shiftsDue:()=>false, ow:()=>null, claimDue:()=>false, un:()=>null, ac:()=>null, pub:()=>({}), my:()=>null, levyDue:()=>false, gv:()=>null, wageDue:()=>false, pr:()=>null, heir:()=>0, startNW:()=>0, nwLog:()=>[], giftAsked:()=>-1e9, crashed:()=>false, paperFoundation:()=>false, paper:()=>null, miles:()=>({}),
  rung:()=>'billionaire', rungStart:()=>0, ladder:()=>({unlocked:{}}), ll:()=>null, foundation:()=>false,
};
const DEFAULT=()=>{const s={};for(const k in FIELDS)s[k]=FIELDS[k]();return s};
let G;
const R={sim:false,flows:[],toasts:[],tab:'fortune',stage:{},recent:{},townQ:[]};
// something happened to someone: remembered for the captions, and shown next on the town's side of the stage
function townEvent(k,name){R.recent[k]=name;if(!R.sim&&!R.townQ.includes(k))R.townQ.push(k)}

function money(v){
  const s=v<0?'−':'';v=Math.abs(v);
  if(v>=1e12)return s+'$'+(v/1e12).toFixed(v>=1e13?1:2)+'T';
  if(v>=1e9)return s+'$'+(v/1e9).toFixed(v>=1e10?1:2)+'B';
  if(v>=1e6)return s+'$'+(v/1e6).toFixed(v>=1e8?0:1)+'M';
  if(v>=1e5)return s+'$'+Math.round(v/1e3)+'k';
  if(v>=1e3)return s+'$'+Math.round(v).toLocaleString('en-GB');
  return s+'$'+Math.round(v);
}
// no rent falls below 40% of what the town's rent would be, however many times it's cut
const rentFloor=()=>T.rent*grow(0.03)*0.4;
const cutRent=(r,f)=>{r.rent=Math.max(rentFloor(),r.rent*f)};
// one household's share of an amount, in today's dollars: a century of the ladder inflates every price, so the
// household-sized rungs show money as it would be at the start
const hh=v=>money(v/HH/grow(0.02));
function emptyYear(){return {gains:0,given:0,tx:0,stock:0,weeks:0,megastore:0,toYou:0}}

// twenty figures: the local landlord, four shop owners, the mill's six, five shop staff, two out of work and two retirees
function makeResidents(){
  const R0=(name,role,extra)=>Object.assign({name,role,job:null,cash:2000*HH,income:0,homeOwner:'local',rent:T.rent,
    arrears:0,homeless:false,parent:false,debt:0,spent:0,profit:0},extra||{});
  return [
    R0('Agnes','landlord',{homeOwner:'self',rent:0,cash:60000*HH}),
    R0('Omar','owner',{shop:0}), R0('Bea','owner',{shop:1}), R0('Sal','owner',{shop:2}), R0('Dee','owner',{shop:3}),
    R0('Ana','worker',{job:'mill',parent:true}), R0('Ben','worker',{job:'mill'}), R0('Cal','worker',{job:'mill',parent:true}),
    R0('Dot','worker',{job:'mill'}), R0('Eli','worker',{job:'mill'}), R0('Fay','worker',{job:'mill'}),
    R0('Gus','worker',{job:0,parent:true}), R0('Hal','worker',{job:0}), R0('Ivy','worker',{job:1,parent:true}),
    R0('Jo','worker',{job:1}), R0('Kit','worker',{job:3}),
    R0('Lou','worker',{job:null}), R0('Max','worker',{job:null,parent:true}),
    R0('Nan','retiree',{}), R0('Pip','retiree',{}),
  ];
}
function makeShops(){return SHOP_DEF.map((d,i)=>({cat:d.cat,name:d.name,owner:i+1,open:true,cash:6000*HH,
  wage:T.wage,rev:0,profitAvg:0,lossWeeks:0,goodWeeks:0,ownedByYou:false,boughtFor:0}))}

const staffOf=i=>G.res.filter(r=>r.job===i);
const millStaff=()=>G.res.filter(r=>r.job==='mill');
const workingAge=r=>r.role==='worker'||r.role==='owner'&&r.shop==null;
const jobless=()=>G.res.filter(r=>r.role==='worker'&&r.job==null);
const homesOwned=()=>G.res.filter(r=>r.homeOwner==='you').length;
const shopsOwned=()=>G.shops.filter(s=>s.ownedByYou).length;
// how old you are: each rung's person starts at their own age, and the climb from the waiter up is one person, so
// the years lived on each rung carry into the next
const AGE_START={billionaire:40,landlord:38,partner:32,shop:35,waiter:22,out:37,union:42,activist:52,mayor:60,governor:68,president:74};
const CLIMB=['waiter','out','union','activist','mayor','governor','president'];
function setAge(rung){const prev=G.ending;
  if(CLIMB.includes(rung)&&prev&&CLIMB.indexOf(prev.rung)>=0&&CLIMB.indexOf(prev.rung)===CLIMB.indexOf(rung)-1)G.ageAt=(G.ageAt||AGE_START[prev.rung])+Math.max(1,Math.round(prev.week/WEEKS));
  else G.ageAt=AGE_START[rung]||START_AGE}
// the season, 0 in the depth of winter (the turn of the year) to 1 at midsummer: the stage draws it, and a few cards need it
const season=()=>(1-Math.cos((G.week%WEEKS)/WEEKS*2*Math.PI))/2;
const age=()=>(G.ageAt||START_AGE)+Math.floor((G.week-(G.rungStart||0))/WEEKS);
const rungYears=()=>G.rung==='billionaire'?END_AGE-START_AGE:G.rung==='waiter'?15:G.rung==='out'?5:G.rung==='union'||G.rung==='activist'?10:G.rung==='mayor'||G.rung==='governor'||G.rung==='president'?8:20;
const yearNo=()=>Math.min(Math.floor((G.week-(G.rungStart||0))/WEEKS)+1,rungYears());
// what you're worth: the invested fortune, the homes at today's price and the shops and workshops at their price
function netWorth(){
  let v=G.cash+homesOwned()*G.homePrice;
  for(const s of G.shops)if(s.ownedByYou&&s.open)v+=Math.max(0,s.profitAvg*WEEKS*T.rivalMultiple*0.7);
  v+=G.workshops.length*T.workshopCost*0.8;
  return v;
}
