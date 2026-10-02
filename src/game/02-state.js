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
  speed:()=>1, seen:()=>({intro:false}), autoAcct:()=>false,
  card:()=>null, nextCard:()=>12, cool:()=>({}), choices:()=>[], borrowed:()=>false, senator:()=>false,
  arrearsQ:()=>[], seenGifts:()=>({}), rentDue:()=>false, freezeUntil:()=>0,
  rung:()=>'billionaire', rungStart:()=>0, ladder:()=>({unlocked:{}}), ll:()=>null, foundation:()=>false,
};
const DEFAULT=()=>{const s={};for(const k in FIELDS)s[k]=FIELDS[k]();return s};
let G;
const R={sim:false,flows:[],toasts:[],tab:'fortune',stage:{},recent:null};

function money(v){
  const s=v<0?'−':'';v=Math.abs(v);
  if(v>=1e9)return s+'$'+(v/1e9).toFixed(v>=1e10?1:2)+'B';
  if(v>=1e6)return s+'$'+(v/1e6).toFixed(v>=1e8?0:1)+'M';
  if(v>=1e3)return s+'$'+Math.round(v/1e3)+'k';
  return s+'$'+Math.round(v);
}
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
const age=()=>START_AGE+Math.floor((G.week-(G.rungStart||0))/WEEKS);
const yearNo=()=>Math.min(Math.floor((G.week-(G.rungStart||0))/WEEKS)+1,isLandlord()?LL.years:END_AGE-START_AGE);
// what you're worth: the invested fortune, the homes at today's price and the shops and workshops at their price
function netWorth(){
  let v=G.cash+homesOwned()*G.homePrice;
  for(const s of G.shops)if(s.ownedByYou&&s.open)v+=Math.max(0,s.profitAvg*WEEKS*T.rivalMultiple*0.7);
  v+=G.workshops.length*T.workshopCost*0.8;
  return v;
}
