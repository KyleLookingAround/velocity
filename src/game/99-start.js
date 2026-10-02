/* ================= start ================= */
// The loop: real time times the speed advances the weeks (a week is WEEK_SECS at 1×), the map draws every frame,
// and the panels refresh a few times a second. A tax vote or an ending pauses everything until answered.
const WEEK_SECS=2.3;
function start(){
  if(!load())newGame();
  buildChrome();fitMap();refreshTop();renderPane(true);
  if(!G.seen.intro)showIntro();else if(isLandlord()&&!G.seen.landlord&&!G.ending)showLandlordIntro();else if(G.ending)showEnding();else if(G.tax)showTax();
  let last=performance.now(),acc=0,ui=0;
  function frame(now){
    const dt=Math.min(0.1,(now-last)/1000);last=now;
    const modal=$('#modal').classList.contains('show');
    if(!modal&&!G.ending&&!G.tax&&G.speed>0){
      acc+=dt*G.speed;
      while(acc>=WEEK_SECS){acc-=WEEK_SECS;step();spawnBills(WEEK_SECS/G.speed);
        if(G.week%WEEKS===0)save();if(G.tax){showTax();break}if(G.ending){save();showEnding();break}}
    }
    drawMap(modal?0:dt);
    ui+=dt;if(ui>0.25){ui=0;refreshTop();renderPane(false);showToasts()}
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  addEventListener('resize',()=>{fitMap()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
  cv.addEventListener('click',e=>{const r=cv.getBoundingClientRect();showTip(e.clientX-r.left,e.clientY-r.top)});
}
start();
