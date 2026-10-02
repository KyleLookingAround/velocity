/* ================= start ================= */
// The loop: real time times the speed advances the weeks (a week is WEEK_SECS at 1×), the stage draws every frame,
// and the panels refresh a few times a second. A decision card or an ending pauses the game until it's answered.
const WEEK_SECS=2.3;
function start(){
  if(!load())newGame();
  buildChrome();fitMap();refreshTop();renderPane(true);
  if(!G.seen.intro)showIntro();else if(isLandlord()&&!G.seen.landlord&&!G.ending)showLandlordIntro();else if(G.ending)showEnding();
  let last=performance.now(),acc=0,ui=0,autoT=0;
  function frame(now){
    const dt=Math.min(0.1,(now-last)/1000);last=now;
    const modal=$('#modal').classList.contains('show');
    // with "let your accountant decide" on, a waiting card is answered after a moment
    if(G.card&&G.autoAcct&&!modal){autoT+=dt;if(autoT>1.2){autoT=0;const o=cardOptions().find(o=>o.acct)||cardOptions()[0];answerCard(o.k);save();renderPane(true)}}
    if(!modal&&!G.ending&&!G.card&&G.speed>0){
      acc+=dt*G.speed;
      while(acc>=WEEK_SECS){acc-=WEEK_SECS;step();
        if(G.week%WEEKS===0)save();if(G.card){renderPane(true);break}if(G.ending){R.stage={};save();showEnding();break}}
    }
    drawMap(dt);
    ui+=dt;if(ui>0.25){ui=0;refreshTop();renderPane(false);showToasts()}
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  addEventListener('resize',()=>{fitMap()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
}
start();
