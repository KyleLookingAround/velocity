/* ================= the map ================= */
// The town drawn on the canvas, in the video's style: grey ground, black pictogram figures, and green money as the only
// strong colour. Two layouts: wide (desktop, tablet, landscape) and tall (phones held upright). Everything is placed in
// the layout's own units and scaled to fit.
const $=s=>document.querySelector(s);
const cv=$('#cv'),ctx=cv.getContext('2d');
const V={L:null,k:1,ox:0,oy:0,w:0,h:0};
const LAYOUTS={
  wide:{w:1000,h:640,vault:[95,330],mega:[925,330],mansion:[95,120],mill:[430,540],park:[205,560],
    home:i=>[230+(i%10)*63,i<10?92:178],shop:i=>[280+i*150,345],workshop:i=>[630+i*112,545]},
  tall:{w:620,h:900,vault:[92,520],mega:[540,520],mansion:[92,95],mill:[175,690],park:[175,858],
    home:i=>[205+(i%5)*92,72+Math.floor(i/5)*82],shop:i=>[245+(i%2)*150,470+Math.floor(i/2)*115],workshop:i=>[350+i*92,700]},
};
function fitMap(){
  const r=cv.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
  cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.height*dpr);
  V.L=r.width/r.height<0.95?LAYOUTS.tall:LAYOUTS.wide;
  V.k=Math.min(cv.width/V.L.w,cv.height/V.L.h);V.ox=(cv.width-V.L.w*V.k)/2;V.oy=(cv.height-V.L.h*V.k)/2;V.dpr=dpr;
}
// where each party in a payment sits on the map
function homeSlot(i){return i-1} // figure 0 (the landlord) lives in the mansion
function spotOf(id){
  const L=V.L;
  if(id==='you')return L.vault;
  if(id==='mega')return L.mega;
  if(id==='mill')return L.mill;
  if(id==='out')return [L.w*0.5+((id.length*97)%200-100),-20];
  if(id[0]==='s')return L.shop(+id.slice(1));
  if(id[0]==='w')return L.workshop(+id.slice(1));
  if(id[0]==='r'){const i=+id.slice(1);return figureSpot(i)}
  return [L.w/2,L.h/2];
}
function figureSpot(i){
  const L=V.L,r=G.res[i];
  if(i===0)return [L.mansion[0]+34,L.mansion[1]+26];
  if(r.homeless){const n=G.res.filter((o,k)=>o.homeless&&k<i).length;return [L.park[0]-56+(n%6)*23,L.park[1]-4+Math.floor(n/6)*34]}
  const [x,y]=L.home(homeSlot(i));return [x,y+30];
}

function drawMap(dt){
  if(!V.L)fitMap();
  const L=V.L,c=ctx;
  c.setTransform(1,0,0,1,0,0);
  c.fillStyle='#c9c9c9';c.fillRect(0,0,cv.width,cv.height);
  c.setTransform(V.k,0,0,V.k,V.ox,V.oy);
  // ground with the video's soft vignette
  const g=c.createRadialGradient(L.w/2,L.h/2,L.h*0.15,L.w/2,L.h/2,L.w*0.75);
  g.addColorStop(0,'#e4e4e4');g.addColorStop(1,'#bdbdbd');c.fillStyle=g;c.fillRect(-200,-200,L.w+400,L.h+400);
  drawRoads(c,L);
  drawVault(c,L);drawMega(c,L);drawMansion(c,L);drawMill(c,L);
  for(let i=1;i<G.res.length;i++)drawHome(c,L,i);
  G.shops.forEach((s,i)=>drawShop(c,L,s,i));
  G.workshops.forEach((w,i)=>drawWorkshop(c,L,i));
  drawPark(c,L);
  G.res.forEach((r,i)=>drawFigure(c,i));
  drawBills(c,dt);
}
function drawRoads(c,L){
  c.strokeStyle='#d6d6d6';c.lineWidth=26;c.lineCap='round';c.beginPath();
  if(L===LAYOUTS.wide){c.moveTo(150,262);c.lineTo(900,262);c.moveTo(150,440);c.lineTo(1000,440);c.moveTo(860,262);c.lineTo(860,440)}
  else{c.moveTo(150,395);c.lineTo(540,395);c.moveTo(150,640);c.lineTo(620,640);c.moveTo(540,395);c.lineTo(540,640)}
  c.stroke();
}
function label(c,t,x,y,size,col,weight){c.font=(weight||600)+' '+(size||12)+'px system-ui,sans-serif';c.fillStyle=col||'#555';c.textAlign='center';c.fillText(t,x,y)}
function drawVault(c,L){
  const [x,y]=L.vault,R0=58;
  c.fillStyle='#a9a9a9';c.beginPath();c.arc(x,y,R0+8,0,7);c.fill();
  c.fillStyle='#f2f2f2';c.beginPath();c.arc(x,y,R0,0,7);c.fill();
  // the bars of money inside rise with the fortune (log scale: $30M to $5B fills it)
  const fill=Math.max(0.08,Math.min(1,Math.log10(Math.max(1,netWorth())/3e6)/3.2));
  c.save();c.beginPath();c.arc(x,y,R0-6,0,7);c.clip();
  const top=y+R0-6-(2*R0-12)*fill;
  for(let k=0;k<9;k++){const bx=x-R0+10+k*12,h=(y+R0)-top-((k*37)%9)*fill;c.fillStyle=k%2?'#5ea86f':'#4c9a5d';c.fillRect(bx,y+R0-6-h,10,h)}
  c.restore();
  c.strokeStyle='#777';c.lineWidth=3;c.beginPath();c.arc(x,y,R0-6,0,7);c.stroke();
  for(let k=0;k<5;k++){c.beginPath();c.moveTo(x-R0+14+k*22,y-R0+12);c.lineTo(x-R0+14+k*22,y+R0-12);c.strokeStyle='rgba(90,90,90,.55)';c.lineWidth=2;c.stroke()}
  label(c,isLandlord()?'The estate':'Your fortune',x,y+R0+26,13,'#333',700);
}
function drawMega(c,L){
  const [x,y]=L.mega;
  c.fillStyle='#9a9a9a';c.fillRect(x-46,y-52,92,104);
  c.fillStyle='#7d7d7d';c.fillRect(x-46,y-52,92,18);
  c.fillStyle='#bdbdbd';for(let k=0;k<3;k++)c.fillRect(x-36+k*26,y-22,18,30);
  c.fillStyle='#e8e8e8';c.fillRect(x-14,y+22,28,30);
  label(c,'MEGASTORE',x,y-39,10,'#fff',800);
  label(c,'Leaves the map',x,y+72,11.5,'#555');
}
function drawMansion(c,L){
  const [x,y]=L.mansion;
  c.fillStyle='#8f8f8f';c.beginPath();c.moveTo(x-48,y-6);c.lineTo(x,y-38);c.lineTo(x+48,y-6);c.fill();
  c.fillStyle='#bcbcbc';c.fillRect(x-42,y-6,84,44);
  c.fillStyle='#e9e9e9';for(let k=0;k<3;k++)c.fillRect(x-34+k*26,y+2,14,12);c.fillRect(x-7,y+20,14,18);
  label(c,isLandlord()?'You, the landlord':'Landlord',x,y+56,11.5,isLandlord()?'#151515':'#555',isLandlord()?800:600);
}
function drawMill(c,L){
  const [x,y]=L.mill;
  c.fillStyle='#a3a3a3';c.fillRect(x-80,y-40,160,80);
  c.fillStyle='#8a8a8a';c.fillRect(x+40,y-80,18,44);c.fillRect(x+12,y-66,14,30);
  c.beginPath();c.moveTo(x-80,y-40);for(let k=0;k<4;k++){c.lineTo(x-80+k*40+20,y-58);c.lineTo(x-80+(k+1)*40,y-40)}c.fill();
  c.fillStyle='#d9d9d9';for(let k=0;k<4;k++)c.fillRect(x-66+k*36,y-20,22,16);
  label(c,'Mill',x,y+58,12,'#444',700);label(c,'sells outside town',x,y+73,11,'#666',500);
}
function drawHome(c,L,i){
  const [x,y]=L.home(homeSlot(i)),r=G.res[i];
  const yours=r.homeOwner==='you';
  // as the landlord, your own roofs show how well the homes are kept up: grey when sound, rust as they fall apart
  const kept=isLandlord()&&r.homeOwner==='local'?G.ll.cond:1;
  c.fillStyle=yours?'#4c9a5d':kept<1?`rgb(${Math.round(141+(1-kept)*60)},${Math.round(141-(1-kept)*50)},${Math.round(141-(1-kept)*80)})`:'#8d8d8d';c.beginPath();c.moveTo(x-20,y-2);c.lineTo(x,y-20);c.lineTo(x+20,y-2);c.fill();
  c.fillStyle=r.homeless?'#d5d5d5':'#b9b9b9';c.fillRect(x-16,y-2,32,20);
  c.fillStyle='#ececec';c.fillRect(x-4,y+6,8,12);
  if(r.homeless){c.fillStyle='#b23a3a';c.fillRect(x-17,y+1,34,10);label(c,'EVICTED',x,y+9,6.5,'#fff',800)}
  if(yours)label(c,'$',x,y-6,10,'#fff',800);
}
function drawShop(c,L,s,i){
  const [x,y]=L.shop(i);
  c.fillStyle=s.open?'#b0b0b0':'#c4c4c4';c.fillRect(x-48,y-36,96,64);
  if(s.open){
    for(let k=0;k<6;k++){c.fillStyle=k%2?'#f1f1f1':(s.ownedByYou?'#4c9a5d':'#7c7c7c');c.fillRect(x-48+k*16,y-36,16,12)}
    c.fillStyle='#ebebeb';c.fillRect(x-38,y-16,40,24);c.fillRect(x+12,y-16,22,44);
    // one dot per member of staff
    const n=staffOf(i).length;for(let k=0;k<n;k++){c.fillStyle='#151515';c.beginPath();c.arc(x-34+k*9,y+18,3,0,7);c.fill()}
  }else{c.fillStyle='#9d9d9d';for(let k=0;k<7;k++)c.fillRect(x-44,y-30+k*8,88,5);label(c,'CLOSED',x,y+2,12,'#fff',800)}
  label(c,s.name,x,y+46,12.5,'#333',700);
  if(s.ownedByYou){c.fillStyle='#4c9a5d';c.beginPath();c.arc(x+44,y-36,11,0,7);c.fill();label(c,'$',x+44,y-31.5,12,'#fff',800);
    if(G.unrest>=70){c.fillStyle='#b23a3a';c.fillRect(x-40,y-6,80,16);label(c,'STRIKE',x,y+6,11,'#fff',800)}}
}
function drawWorkshop(c,L,i){
  const [x,y]=L.workshop(i);
  c.fillStyle='#a9a9a9';c.fillRect(x-38,y-28,76,56);
  c.fillStyle='#4c9a5d';c.beginPath();c.moveTo(x-38,y-28);c.lineTo(x-19,y-42);c.lineTo(x,y-28);c.lineTo(x+19,y-42);c.lineTo(x+38,y-28);c.fill();
  c.fillStyle='#e6e6e6';c.fillRect(x-28,y-14,20,14);c.fillRect(x+8,y-14,20,14);
  label(c,'Workshop',x,y+42,11.5,'#333',700);
}
function drawPark(c,L){
  const [x,y]=L.park;
  c.fillStyle='#bfc9bf';c.beginPath();c.ellipse(x,y+10,92,34,0,0,7);c.fill();
  for(const [dx,dy] of [[-70,-6],[64,-2],[-30,26]]){c.fillStyle='#9fb09f';c.beginPath();c.arc(x+dx,y+dy,11,0,7);c.fill()}
  label(c,'Park',x,y+60,11,'#666');
  // a tent for each figure sleeping rough
  G.res.forEach((r,i)=>{if(!r.homeless)return;const [fx,fy]=figureSpot(i);
    c.fillStyle='#7a7a7a';c.beginPath();c.moveTo(fx-14,fy+20);c.lineTo(fx,fy-4);c.lineTo(fx+14,fy+20);c.fill()});
}
// a pictogram person: black when working, grey when out of work, with a sign when the town protests
function drawFigure(c,i){
  const r=G.res[i];let [x,y]=figureSpot(i);
  if(r.homeless)y-=4;
  const idle=r.role==='worker'&&r.job==null,col=idle?'#8a8a8a':'#151515';
  const t=performance.now()/1000,bob=Math.sin(t*2+i)*0.8; // cosmetic
  c.fillStyle=col;
  c.beginPath();c.arc(x,y-24+bob,6.5,0,7);c.fill();
  c.beginPath();c.roundRect(x-6,y-16+bob,12,15,4);c.fill();
  c.fillRect(x-5,y-3,4,11);c.fillRect(x+1,y-3,4,11);
  if(i===0){c.fillRect(x-8,y-31,16,3);c.fillRect(x-5,y-38,10,8)} // the landlord's hat
  if(r.role==='retiree'){c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.moveTo(x+9,y-10);c.lineTo(x+11,y+8);c.stroke()}
  const signs=G.unrest>=55?(G.unrest>=T.revoltAt?1:G.unrest>=70?0.6:0.3):0;
  if(signs&&i>0&&((i*37)%10)/10<signs){
    c.strokeStyle='#151515';c.lineWidth=1.5;c.beginPath();c.moveTo(x+8,y-12);c.lineTo(x+8,y-40);c.stroke();
    c.fillStyle='#f5f5f5';c.fillRect(x-4,y-56,26,17);c.strokeRect(x-4,y-56,26,17);
    label(c,['TAX','RENT','FAIR','PAY'][i%4],x+9,y-44.5,8,'#b23a3a',800);
  }
  if(R.sel==='r'+i){c.strokeStyle='#4c9a5d';c.lineWidth=2;c.beginPath();c.arc(x,y-12,20,0,7);c.stroke()}
}

// the week's payments, flying as green bills from payer to payee
function spawnBills(weekSecs){
  const f=R.flows.filter(p=>p.amt>0);if(!f.length)return;
  const total=f.reduce((a,p)=>a+p.amt,0),n=Math.min(42,f.length*2);
  for(let k=0;k<n;k++){
    let pick=Math.random()*total,p=f[0]; // cosmetic
    for(const q of f){pick-=q.amt;if(pick<=0){p=q;break}}
    R.bills.push({from:p.from,to:p.to,kind:p.kind,t:-Math.random()*weekSecs*0.85,dur:Math.max(0.5,Math.min(1.4,weekSecs*0.5)),bend:(Math.random()-0.5)*80}); // cosmetic
  }
  if(R.bills.length>220)R.bills.splice(0,R.bills.length-220);
}
function drawBills(c,dt){
  for(const b of R.bills)b.t+=dt;
  R.bills=R.bills.filter(b=>b.t<b.dur);
  for(const b of R.bills){
    if(b.t<0)continue;
    const [x0,y0]=spotOf(b.from),[x1,y1]=spotOf(b.to),u=b.t/b.dur;
    const mx=(x0+x1)/2+b.bend,my=Math.min(y0,y1)-40;
    const x=(1-u)*(1-u)*x0+2*(1-u)*u*mx+u*u*x1,y=(1-u)*(1-u)*(y0-14)+2*(1-u)*u*my+u*u*(y1-14);
    c.save();c.translate(x,y);c.rotate(Math.atan2(y1-y0,x1-x0)*0.3+u*2);
    c.fillStyle=b.kind==='gift'?'#2f8a47':'#5aa86b';c.globalAlpha=Math.min(1,(1-u)*4);c.fillRect(-7,-3.5,14,7);
    c.fillStyle='rgba(255,255,255,.55)';c.fillRect(-2,-1.5,4,3);c.restore();
  }
}
// tap a figure, shop or the vault to see what it is
function hitTest(px,py){
  const x=(px*V.dpr-V.ox)/V.k,y=(py*V.dpr-V.oy)/V.k;
  let best=null,bd=28*28;
  G.res.forEach((r,i)=>{const [fx,fy]=figureSpot(i);const d=(fx-x)**2+(fy-12-y)**2;if(d<bd){bd=d;best='r'+i}});
  G.shops.forEach((s,i)=>{const [sx,sy]=V.L.shop(i);if(Math.abs(sx-x)<50&&Math.abs(sy-y)<40)best='s'+i});
  return best;
}
