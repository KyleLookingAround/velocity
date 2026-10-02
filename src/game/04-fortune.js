/* ================= fortune, moves and gifts ================= */
// Your fortune earns its return every week with no input. Moves spend it to earn faster, mostly at the town's cost;
// gifts spend it on the town. Prices of everything grow a little each year (grow()).
const grow=(r)=>Math.pow(1+r,Math.floor(G.week/WEEKS));
// the crash takes a share of the fortune: more if you rode the boom on borrowed money, half as much if you sold at the top
function crashHits(keep){if(G.boom==='rode'){keep-=0.1;G.rate-=0.006}else if(G.boom==='sold')keep=1-(1-keep)*0.5;G.cash*=keep}
function fortuneWeek(){
  if(G.boom==='sold'&&!G.crashed){G.cash*=Math.pow(1-0.004,1/WEEKS)}
  const before=G.cash;
  G.cash*=Math.pow(1+G.rate,1/WEEKS);
  G.year.gains+=G.cash-before;
}

// buy the homes of the next figure renting from the local landlord
function canBuyHomes(){return G.res.some(r=>r.homeOwner==='local')&&G.cash>=G.homePrice}
function buyHomes(){
  const r=G.res.find(r=>r.homeOwner==='local');if(!r||G.cash<G.homePrice)return false;
  G.cash-=G.homePrice;r.homeOwner='you';
  G.homePrice*=1+T.homeBuyPush;G.pricePush+=T.homeBuyPush;
  for(const o of G.res)if(o.homeOwner==='local')o.rent*=1+T.homeBuyPush; // the landlord follows the market up
  toast('You own '+r.name+"'s homes");
  return true;
}
// buy the most profitable shop you don't own: its owner is out, its profit is yours, and one of its staff goes
function shopPrice(s){const staff=staffOf(G.shops.indexOf(s)).reduce((a,r)=>a+wageFor(r,s.wage),0);
  return Math.max(2e6,(s.rev*(1-T.supplies)-staff)*WEEKS*T.rivalMultiple)}
function rivalTarget(){return G.shops.filter(s=>s.open&&!s.ownedByYou).sort((a,b)=>shopPrice(b)-shopPrice(a))[0]}
function canBuyRival(){const s=rivalTarget();return !!s&&G.cash>=shopPrice(s)}
function buyRival(keep){
  const s=rivalTarget();if(!s)return false;const p=shopPrice(s);if(G.cash<p)return false;
  G.cash-=p;s.ownedByYou=true;s.boughtFor=p;
  // the owner stays on as its manager on a wage, or is out; cutting costs also lets one of the staff go
  const i=G.shops.indexOf(s),o=G.res[s.owner];o.role='worker';delete o.shop;
  if(keep){o.job=i;toast('You bought the '+s.name+'. '+o.name+' stays on to run it');return true}
  o.job=null;townEvent('laidoff',o.name);
  const staff=staffOf(i);if(staff.length>1)staff[staff.length-1].job=null;
  toast('You bought the '+s.name+'. '+o.name+' is out of work');
  return true;
}
// a workshop sells outside the town and hires three figures out of work
function canBuild(){return G.workshops.length<T.maxWorkshops&&G.cash>=T.workshopCost}
function build(){
  if(!canBuild())return false;
  G.cash-=T.workshopCost;const i=G.workshops.length;G.workshops.push({at:G.week});
  let hired=0;for(const r of hireable()){if(hired>=T.workshopStaff)break;r.job='w'+i;hired++;if(hired===1)remember('hired',r)}remember('workshop');
  toast('Workshop '+(i+1)+' opens'+(hired?' and hires '+hired:''));
  return true;
}
function doMove(k){return k==='homes'?buyHomes():k==='rival'?buyRival():k==='build'?build():false}
function canMove(k){return k==='homes'?canBuyHomes():k==='rival'?canBuyRival():k==='build'?canBuild():false}
function movePrice(k){if(k==='homes')return G.homePrice;if(k==='rival'){const s=rivalTarget();return s?shopPrice(s):0}return T.workshopCost}
function setGift(k,on){G.gifts[k]=!!on;if(k==='shelter'&&on)for(const r of G.res)if(r.homeless){r.homeless=false;r.sheltered=true}}

// what each gift cost over the last year, for the gifts list
function giftCosts(){return G.lastGiftCost||{}}
