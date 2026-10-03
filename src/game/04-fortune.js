/* ================= fortune, moves and gifts ================= */
// Your fortune earns its return every week with no input. Moves spend it to earn faster, mostly at the town's cost;
// gifts spend it on the town. Prices of everything grow a little each year (grow()).
const grow=(r)=>Math.pow(1+r,Math.floor(G.week/WEEKS));
// the crash takes a share of the fortune: more if you rode the boom on borrowed money, half as much if you sold at the top
function crashHits(keep){const m=G.mkt;if(G.boom==='rode'){keep-=0.1;G.rate-=0.006}else if(G.boom==='sold'){keep=1-(1-keep)*0.5;if(m)m.tops=(m.tops||0)+1}G.cash*=keep;
  if(m){m.hit=m.n;m.falls=(m.falls||0)+1;m.rec=MKT.recover[1]*WEEKS}}
// the share market, in a billionaire life: a long calm, then a boom (shares fly, and borrowing to ride them pays for a
// while), then a crash, then calm again: two or three times a life. The boom brings the "shares are flying" card and
// the crash its card, once each a cycle. A boom adds to the fortune's growth (more if you borrowed, less if you sold a
// third); the crash takes it back and more. How long each spell lasts comes from the life's seed, read without moving
// it, so the market doesn't reshuffle the rest of the life.
// (after a crash the market climbs back for two years: most of a held fortune's fall comes back)
const MKT={firstCalm:[14,3],calm:[10,3],boom:[4,1],bust:1,boomGain:0.004,recover:[0.05,2],boomHomes:0.05,millCut:0.95};
const mktSpell=(k,salt)=>Math.round((MKT[k][0]+peek(salt)*MKT[k][1])*WEEKS);
function marketWeek(){
  const m=G.mkt;if(!m||G.rung!=='billionaire')return;
  if(m.left==null)m.left=mktSpell('firstCalm',101);
  if(--m.left>0)return;
  if(m.phase==='calm'){m.phase='boom';m.left=mktSpell('boom',103+m.n);boomHitsTown()}
  else if(m.phase==='boom'){m.phase='bust';m.left=MKT.bust*WEEKS;crashHitsTown()}
  else{m.phase='calm';m.n++;m.left=mktSpell('calm',107+m.n);G.boom=null;if(m.cut){G.millMul=(G.millMul||1)/MKT.millCut;m.cut=false}}
}
// the market reaches the town: a boom puts home prices up (a home further out of reach), and a crash puts the mill on
// short time for the bust year, unless the billionaire keeps the town afloat
function boomHitsTown(){G.homePrice*=1+MKT.boomHomes;townEvent('boomhomes','')}
function crashHitsTown(){const m=G.mkt;G.millMul=(G.millMul||1)*MKT.millCut;m.cut=true;
  townEvent('shorttime','')}
// the market in a word, for the Fortune tab
const marketWord=()=>{const m=G.mkt;if(!m)return 'Calm';return m.phase==='boom'?'Booming'+(G.boom==='rode'?', on borrowed money':G.boom==='sold'?', a third sold':''):m.phase==='bust'?'Crashed':m.rec>0?'Recovering':'Calm'};
// how much of a boom you ride: borrowed to the hilt, a third sold at the top, or as you were
const boomShare=()=>G.boom==='rode'?1.5:G.boom==='sold'?0.5:1;
function fortuneWeek(){
  const m=G.mkt,bil=G.rung==='billionaire'&&m,booming=bil&&m.phase==='boom',rec=bil&&m.rec>0;if(rec)m.rec--;
  const before=G.cash;
  G.cash*=Math.pow(1+G.rate+(G.cash>0?(booming?MKT.boomGain*boomShare():0)+(rec?MKT.recover[0]:0):0),1/WEEKS);
  G.year.gains+=G.cash-before;
  marketWeek();
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
