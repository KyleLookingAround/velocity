/* ================= start ================= */
// The loop: real time times the speed advances the weeks (a year takes YEAR_SECS of its rung at 1×: with at most two
// decisions a year, that leaves two or three scenes between them), the stage draws every frame,
// and the panels refresh a few times a second. A decision card or an ending pauses the game until it's answered.
const YEAR_SECS={billionaire:24,landlord:30,partner:30,shop:30,waiter:30,out:60,union:36,activist:36,mayor:45,governor:45,president:45};
const weekSecs=()=>(YEAR_SECS[G.rung]||30)/WEEKS;
function start(){
  if(!load())newGame();
  buildChrome();fitMap();refreshTop();renderPane(true);
  if(!G.seen.intro)showIntro();else if(isLandlord()&&!G.seen.landlord&&!G.ending)showLandlordIntro();else if(isPartner()&&!G.seen.partner&&!G.ending)showPartnerIntro();else if(isShop()&&!G.seen.shop&&!G.ending)showShopIntro();else if(isWaiter()&&!G.seen.waiter&&!G.ending)showWaiterIntro();else if(isOut()&&!G.seen.out&&!G.ending)showOutIntro();else if(isUnion()&&!G.seen.union&&!G.ending)showUnionIntro();else if(isActivist()&&!G.seen.activist&&!G.ending)showActivistIntro();else if(isMayor()&&!G.seen.mayor&&!G.ending)showMayorIntro();else if(isGovernor()&&!G.seen.governor&&!G.ending)showGovernorIntro();else if(isPresident()&&!G.seen.president&&!G.ending)showPresidentIntro();else if(G.ending)showEnding();
  let last=performance.now(),acc=0,ui=0,autoT=0;
  function frame(now){
    const dt=Math.min(0.1,(now-last)/1000);last=now;
    const modal=$('#modal').classList.contains('show');
    // with "let your accountant decide" on, a waiting card is answered after a moment
    if(G.card&&G.autoAcct&&!modal){autoT+=dt;if(autoT>1.2){autoT=0;const o=cardOptions().find(o=>o.acct)||cardOptions()[0];answerCard(o.k);save();renderPane(true)}}
    if(!modal&&!G.ending&&!G.card&&G.speed>0){
      acc+=dt*G.speed;
      while(acc>=weekSecs()){acc-=weekSecs();step();
        if(G.week%WEEKS===0)save();if(G.card){renderPane(true);break}if(G.ending){R.stage={};R.endSoon=true;break}}
    }
    // an ending shows its card: at once when the weeks brought it, and once the deal's scene has played when a decision
    // did (selling the café, founding the chain, taking the manager's job); again, if a menu was opened over it
    if(G.ending&&!modal){R.endT=(R.endT||0)+dt;if(R.endSoon||R.endT>=3){R.endT=0;R.endSoon=false;save();showEnding()}}else R.endT=0;
    drawMap(dt);
    ui+=dt;if(ui>0.25){ui=0;refreshTop();renderPane(false);showToasts()}
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  addEventListener('resize',()=>{fitMap()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
}
start();
// installable on a phone, and playable offline: a small service worker keeps the page and its fonts (not from a file:// copy)
if('serviceWorker' in navigator&&/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
