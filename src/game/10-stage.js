/* ================= the stage ================= */
// Two scenes side by side (stacked on a phone held upright), in the video's style: grey ground, black pictogram people
// and green money. On the left, you: what you're doing, or what you just decided. On the right, the town: the
// consequences, picked from how the town is doing (or the one your last decision caused). Each scene plays for
// SCENE_SECS of real time, whatever the game speed, and the camera moves on; drawing never touches the game state.
const $=s=>document.querySelector(s);
const cv=$('#cv'),ctx=cv.getContext('2d');
const PW=480,PH=300,SCENE_SECS=6,CT=70; // (CT: the sky a stacked phone pane does without)
const V={k:1,dpr:1,panes:[]};
const INK='#151515',GREY='#8b8b8b',GREEN='#4c9a5d',GREEN2='#5aa86b',RED='#b23a3a';
function fitMap(){
  const r=cv.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
  cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.height*dpr);V.dpr=dpr;
  const gap=10*dpr;
  // two panes, each PW×PH scaled to fit, one above the other or side by side: whichever shows them bigger
  // (stacked panes crop their empty sky so they fill the width; a phone held upright always stacks them)
  const portrait=innerHeight>innerWidth,ct=CT,ph=PH-ct;
  const kTall=Math.min(cv.width/PW,(cv.height-gap)/(2*ph)),kWide=Math.min((cv.width-gap)/(2*PW),cv.height/PH);
  const tall=kTall>=kWide||portrait,k=tall?kTall:kWide;
  const w=PW*k,h=(tall?ph:PH)*k;V.k=k;V.ct=tall?ct:0;
  V.panes=tall?[[(cv.width-w)/2,(cv.height-2*h-gap)/2],[(cv.width-w)/2,(cv.height-2*h-gap)/2+h+gap]]
    :[[(cv.width-2*w-gap)/2,(cv.height-h)/2],[(cv.width-2*w-gap)/2+w+gap,(cv.height-h)/2]];
}

// ---------- the pictogram kit ----------
// a person standing with feet at (x,y), facing o.dir (1 right, -1 left). Poses: stand, walk, sit, give, sign, box, slump,
// shake, hammer, raise. o.t drives walking; o.col greys out; o.s scales (0.62 for a child).
function person(c,x,y,o={}){
  const s=o.s||1,d=o.dir||1,col=o.col||INK,p=o.pose||'stand',t=o.t||0;
  c.save();c.translate(x,y);c.scale(s*d,s);c.fillStyle=col;c.strokeStyle=col;c.lineCap='round';
  const sit=p==='sit',slump=p==='slump';
  const hy=sit?-56:slump?-62:-72;
  c.beginPath();c.arc(slump?5:0,hy,9,0,7);c.fill();
  c.beginPath();c.roundRect(-9,hy+10,18,sit?24:30,6);c.fill();
  c.lineWidth=7;
  // legs
  if(sit){c.beginPath();c.moveTo(-3,hy+34);c.lineTo(14,hy+34);c.lineTo(14,0);c.moveTo(3,hy+34);c.lineTo(18,hy+34);c.lineTo(18,0);c.stroke()}
  else{const sw=p==='walk'||p==='box'||p==='sign'&&o.march?Math.sin(t*Math.PI*2)*9:0;
    c.beginPath();c.moveTo(-4,-30);c.lineTo(-4+sw,0);c.moveTo(4,-30);c.lineTo(4-sw,0);c.stroke()}
  // arms
  c.lineWidth=6;c.beginPath();const ay=hy+14;
  if(p==='give'||p==='shake'){c.moveTo(4,ay);c.lineTo(24,ay+(p==='shake'?8:2))}
  else if(p==='sign'){c.moveTo(4,ay);c.lineTo(12,ay-22);c.moveTo(-4,ay);c.lineTo(10,ay-20)}
  else if(p==='raise'){c.moveTo(4,ay);c.lineTo(10,ay-24)}
  else if(p==='box'){c.moveTo(4,ay);c.lineTo(16,ay+10)}
  else if(p==='hammer'){const a=Math.sin(t*Math.PI*8)*0.6;c.moveTo(4,ay);c.lineTo(4+20*Math.cos(-0.6+a),ay+20*Math.sin(-0.6+a))}
  else if(slump){c.moveTo(4,ay);c.lineTo(10,hy+2)}
  else if(sit){c.moveTo(4,ay);c.lineTo(20,ay+10)}
  else{const sw=p==='walk'?Math.sin(t*Math.PI*2)*6:0;c.moveTo(-5,ay);c.lineTo(-7-sw,ay+22);c.moveTo(5,ay);c.lineTo(7+sw,ay+22)}
  c.stroke();
  if(o.hat){c.fillRect(-10,hy-10,20,3);c.fillRect(-6,hy-20,12,11)}
  if(p==='box'){c.fillStyle='#9a8466';c.fillRect(8,ay-4,22,20)}
  if(p==='sign'){c.lineWidth=2;c.beginPath();c.moveTo(11,ay-20);c.lineTo(11,ay-48);c.stroke();c.fillStyle='#f6f6f6';c.fillRect(-12,ay-70,46,24);c.strokeRect(-12,ay-70,46,24);
    c.scale(d,1);txt(c,o.text||'FAIR',d*11,ay-53,10,RED,800)}
  c.restore();
}
function txt(c,t,x,y,size,col,weight,align){c.font=(weight||600)+' '+size+'px Inter,system-ui,sans-serif';c.fillStyle=col||'#444';c.textAlign=align||'center';c.fillText(t,x,y)}
function bill(c,x,y,r,a){c.save();c.translate(x,y);c.rotate(r||0);c.globalAlpha=a??1;c.fillStyle=GREEN2;c.fillRect(-9,-4.5,18,9);c.fillStyle='rgba(255,255,255,.6)';c.fillRect(-2.5,-2,5,4);c.restore()}
// a bill flying from (x0,y0) to (x1,y1) over u in [0,1], arcing up
function flyBill(c,x0,y0,x1,y1,u,lift){if(u<0||u>1)return;const x=x0+(x1-x0)*u,y=y0+(y1-y0)*u-Math.sin(u*Math.PI)*(lift??40);bill(c,x,y,u*4,Math.min(1,(1-u)*5))}
function stack(c,x,y,n){for(let i=0;i<n;i++){c.fillStyle=i%2?GREEN2:GREEN;c.fillRect(x-16,y-4-i*4,32,4)}}
// the season, 0 in the depth of winter (the turn of the year) to 1 at midsummer, and a colour between two for it
function mix(a,b,t){const h=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16));const p=h(a),q=h(b);return 'rgb('+p.map((v,i)=>Math.round(v+(q[i]-v)*t)).join(',')+')'}
function ground(c){const s=season();c.fillStyle=mix('#e4e2dc','#d6cfc1',s);c.fillRect(0,250,PW,50);c.fillStyle='rgba(120,100,70,.12)';c.fillRect(0,250,PW,2)}
// the weather: rain on some autumn and spring weeks (the week decides, so it's the same for both panes), and some
// scene changes fall at dusk
const raining=()=>{const s=season();return s>0.3&&s<0.75&&((G.week*7919)%10)<3};
function rain(c,dt){
  if(!raining()||R.calm)return;
  if(!R.rain)R.rain=Array.from({length:70},()=>({x:Math.random()*PW,y:Math.random()*PH,v:380+Math.random()*120})); // cosmetic
  c.strokeStyle='rgba(90,110,140,.35)';c.lineWidth=1.2;c.beginPath();
  for(const d of R.rain){d.y+=d.v*dt;d.x-=d.v*dt*0.15;if(d.y>PH){d.y=-8;d.x=Math.random()*(PW+40)} // cosmetic
    c.moveTo(d.x,d.y);c.lineTo(d.x-1.5,d.y+9)}
  c.stroke();
}
// dusk: a bluer, darker sky with lit windows in the far town and a first star or two
function dusk(c,world){
  c.fillStyle='rgba(40,44,80,.38)';c.fillRect(0,0,PW,PH);
  c.fillStyle='rgba(255,230,160,.9)';const W=900,x0=world*0.35,start=Math.floor(x0/W)-1;
  for(let n=start;n<start+3;n++)for(let k=0;k<12;k++){const r=((n*12+k)*2654435761>>>0)%1000/1000;if(r<0.3||((k*31+n)%3))continue;const x=n*W-x0+k*75+12,h=40+((r*7)%1)*70;c.fillRect(x,250-h-20,6,6);c.fillRect(x+16,250-h-6,6,6)}
  c.fillStyle='rgba(255,255,255,.8)';c.fillRect(70,40,2,2);c.fillRect(300,28,2,2);c.fillRect(410,60,2,2);
}
// snow in the weeks around the new year: a few flakes drifting down each pane
function snow(c,dt){
  const s=season();if(s>0.1||R.calm)return;
  if(!R.snow)R.snow=Array.from({length:40},()=>({x:Math.random()*PW,y:Math.random()*PH,v:14+Math.random()*16,w:Math.random()*6.3})); // cosmetic
  c.fillStyle='rgba(255,255,255,.85)';
  for(const f of R.snow){f.y+=f.v*dt;f.w+=dt;f.x+=Math.sin(f.w)*0.3;if(f.y>PH){f.y=-4;f.x=Math.random()*PW} // cosmetic
    c.beginPath();c.arc(f.x,f.y,1.8,0,7);c.fill()}
}
function desk(c,x,y){c.fillStyle='#8f8f8f';c.fillRect(x-40,y-34,80,6);c.fillRect(x-36,y-28,5,28);c.fillRect(x+31,y-28,5,28)}
function laptop(c,x,y){c.fillStyle='#5b5b5b';c.fillRect(x-12,y-50,24,16);c.fillRect(x-16,y-35,32,3)}
function chair(c,x,y){c.fillStyle='#6d6d6d';c.fillRect(x-14,y-26,28,5);c.fillRect(x-14,y-56,5,32);c.fillRect(x-12,y-22,4,22);c.fillRect(x+8,y-22,4,22)}
function house(c,x,y,o={}){
  c.fillStyle=o.roof||'#8d8d8d';c.beginPath();c.moveTo(x-56,y-70);c.lineTo(x,y-112);c.lineTo(x+56,y-70);c.fill();
  c.fillStyle='#bcbcbc';c.fillRect(x-48,y-70,96,70);c.fillStyle='#ececec';c.fillRect(x-36,y-56,22,18);c.fillRect(x+14,y-56,22,18);c.fillRect(x-10,y-34,20,34);
  if(o.sign){c.fillStyle=o.signCol||RED;c.fillRect(x+30,y-40,52,18);txt(c,o.sign,x+56,y-27,10,'#fff',800);c.fillStyle='#777';c.fillRect(x+54,y-22,3,22)}
  if(o.damp){c.fillStyle='rgba(90,110,120,.35)';c.beginPath();c.ellipse(x-24,y-66,18,10,0,0,7);c.ellipse(x+20,y-20,14,9,0,0,7);c.fill()}
}
function shop(c,x,y,name,o={}){
  c.fillStyle='#b0b0b0';c.fillRect(x-70,y-96,140,96);
  for(let k=0;k<7;k++){c.fillStyle=k%2?'#f0f0f0':(o.awn||'#7c7c7c');c.fillRect(x-70+k*20,y-96,20,16)}
  c.fillStyle='#ebebeb';c.fillRect(x-58,y-70,64,40);c.fillRect(x+18,y-70,36,70);
  const sh=o.shutter||0;if(sh>0){c.fillStyle='#9a9a9a';const hh=96*sh;for(let k=0;k<hh/7;k++)c.fillRect(x-68,y-80+k*7,136,5)}
  txt(c,name,x,y-100,12,'#333',800);
}
function vault(c,x,y,fill){
  c.fillStyle='#a9a9a9';c.beginPath();c.arc(x,y,62,0,7);c.fill();c.fillStyle='#f2f2f2';c.beginPath();c.arc(x,y,54,0,7);c.fill();
  c.save();c.beginPath();c.arc(x,y,49,0,7);c.clip();const top=y+49-98*fill;
  for(let k=0;k<9;k++){const bx=x-50+k*11,h=y+49-top-((k*37)%9)*fill;c.fillStyle=k%2?GREEN2:GREEN;c.fillRect(bx,y+49-h,10,h)}c.restore();
  c.strokeStyle='#777';c.lineWidth=3;c.beginPath();c.arc(x,y,49,0,7);c.stroke();
  for(let k=0;k<5;k++){c.strokeStyle='rgba(90,90,90,.5)';c.lineWidth=2;c.beginPath();c.moveTo(x-38+k*19,y-44);c.lineTo(x-38+k*19,y+44);c.stroke()}
}
// the crowd follows the town: households out of work, sleeping rough, in medical debt or paying over half their income in
// rent march; at least four figures, at most ten
const aggrieved=()=>G.res.filter(r=>r.role!=='landlord'&&(r.homeless||(r.role==='worker'&&r.job==null)||r.debt>0||(r.rent>0&&r.income>0&&r.rent>r.income*0.5))).length;
const marchers=()=>Math.max(4,Math.min(10,aggrieved()+Math.floor(G.unrest/25)));
function tent(c,x,y){c.fillStyle='#7a7a7a';c.beginPath();c.moveTo(x-30,y);c.lineTo(x,y-38);c.lineTo(x+30,y);c.fill();c.fillStyle='#5e5e5e';c.beginPath();c.moveTo(x-6,y);c.lineTo(x,y-14);c.lineTo(x+6,y);c.fill()}
function tree(c,x,y){c.fillStyle='#8a8a8a';c.fillRect(x-3,y-40,6,40);c.fillStyle='#a9b5a9';c.beginPath();c.arc(x,y-52,20,0,7);c.fill()}
function truck(c,x,y,label){c.fillStyle='#8a8a8a';c.fillRect(x-60,y-56,84,46);c.fillStyle='#6d6d6d';c.fillRect(x+24,y-40,30,30);c.fillStyle='#d9d9d9';c.fillRect(x+30,y-36,16,12);
  c.fillStyle='#333';c.beginPath();c.arc(x-40,y-8,8,0,7);c.arc(x+36,y-8,8,0,7);c.fill();if(label)txt(c,label,x-18,y-28,11,'#fff',800)}
function counter(c,x,y,label){c.fillStyle='#2b2b2b';c.fillRect(x-36,y-44,72,44);c.fillStyle='#555';c.fillRect(x+2,y-62,26,18);if(label)txt(c,label,x,y-18,11,'#fff',800)}
// a sign as wide as its words
function board(c,x,y,t){c.font='800 10px Inter,system-ui,sans-serif';const w=c.measureText(t).width+14;c.fillStyle='#f7f7f7';c.fillRect(x-w/2,y-12,w,24);c.strokeStyle='#999';c.lineWidth=1;c.strokeRect(x-w/2,y-12,w,24);txt(c,t,x,y+4,10,RED,800)}
function letter(c,x,y,t){c.fillStyle='#f7f7f7';c.fillRect(x-24,y-16,48,32);c.strokeStyle='#999';c.lineWidth=1;c.strokeRect(x-24,y-16,48,32);txt(c,t,x,y+4,9,RED,800)}
function bench(c,x,y){c.fillStyle='#8a8a8a';c.fillRect(x-40,y-26,80,6);c.fillRect(x-36,y-20,5,20);c.fillRect(x+31,y-20,5,20)}
function building(c,x,y,label,w){w=w||130;c.fillStyle='#ababab';c.fillRect(x-w/2,y-90,w,90);c.fillStyle='#e6e6e6';for(let k=0;k<3;k++)c.fillRect(x-w/2+14+k*((w-28)/3),y-70,(w-28)/3-10,20);
  c.fillRect(x-12,y-34,24,34);c.fillStyle='#8d8d8d';c.fillRect(x-w/2-4,y-98,w+8,10);txt(c,label,x,y-102,12,'#333',800)}

// ---------- the scenes ----------
// each: cap(d) the caption, draw(c,t,d) with t going 0→1 over the scene. `d` carries names and numbers from the moment.
const loopT=(t,n)=>(t*n)%1;
const rateText=()=>(G.rate*100).toFixed(Math.round(G.rate*1000)%10?1:0)+'%';
const pct=v=>(v>0?'+':v<0?'−':'')+Math.round(Math.abs(v)*100)+'%';
const fortuneFill=()=>Math.max(0.08,Math.min(1,Math.log10(Math.max(1,netWorth())/3e6)/3.2));
const SCENES={
  // ---- you ----
  desk:{cap:()=>'Your fortune earns '+rateText()+' a year while you sit there',draw(c,t){
    desk(c,170,250);laptop(c,170,216);chair(c,120,250);person(c,128,250,{pose:'sit',hat:true});vault(c,360,170,fortuneFill());
    for(let k=0;k<4;k++)flyBill(c,PW+20,60,360,170,loopT(t+k/4,1),30)}},
  yacht:{nowalk:true,cap:()=>'Your money works. You don\u2019t have to',draw(c,t){
    c.fillStyle='#b9c4c9';c.fillRect(0,232,PW,20);const b=Math.sin(t*Math.PI*4)*3;
    c.fillStyle='#e9e9e9';c.beginPath();c.moveTo(150,236+b);c.lineTo(350,236+b);c.lineTo(330,262+b);c.lineTo(170,262+b);c.fill();c.fillStyle='#cfcfcf';c.fillRect(200,212+b,90,24);
    person(c,250,236+b,{pose:'sit',hat:true,s:0.8});for(let k=0;k<3;k++)flyBill(c,PW+10,40,250,180,loopT(t+k/3,1),20)}},
  golf:{cap:()=>'Another round. The fortune grows anyway',draw(c,t){
    c.fillStyle='#c3cdc3';c.fillRect(0,246,PW,10);c.fillStyle='#777';c.fillRect(398,200,2,46);c.fillStyle=RED;c.fillRect(400,200,16,10);
    person(c,180,250,{pose:loopT(t,1)<0.5?'stand':'raise',hat:true});const u=Math.max(0,loopT(t,1)-0.5)*2;c.fillStyle='#fff';c.beginPath();c.arc(200+u*200,246-Math.sin(u*Math.PI)*80,3,0,7);c.fill()}},
  collect:{cap:()=>'Rent day: door to door',draw(c,t){
    house(c,140,250);house(c,380,250);const u=loopT(t,1);person(c,60+u*360,250,{pose:'walk',t:t*6});
    for(let k=0;k<2;k++)flyBill(c,140+k*240,210,80+u*360,190,loopT(t*2+k/2,1),30)}},
  rentbook:{cap:()=>'You count the rent: '+money(rentRoll())+' a year',draw(c,t){
    desk(c,240,250);chair(c,190,250);person(c,198,250,{pose:'sit'});stack(c,250,216,3+Math.floor(loopT(t,1)*8));
    for(let k=0;k<3;k++)flyBill(c,PW+10,150,250,200,loopT(t+k/3,1),40)}},
  deed:{cap:d=>d.label?d.title:'You buy the homes',draw(c,t){
    house(c,360,250,{sign:t>0.45?'SOLD':null,signCol:GREEN,roof:t>0.45?GREEN:undefined});desk(c,140,250);chair(c,96,250);person(c,104,250,{pose:'sit',hat:!isLandlord()});
    letter(c,150,206,'DEED');person(c,220,250,{pose:t<0.45?'give':'stand',dir:-1,col:'#555'});for(let k=0;k<3;k++)flyBill(c,130,200,230,190,loopT(t*2+k/3,1),20)}},
  handshake:{cap:d=>d.title||'A deal is done',draw(c,t){
    const m=Math.min(1,t*2.5);person(c,120+70*m,250,{pose:m<1?'walk':'shake',t:t*4,hat:true});person(c,360-70*m,250,{pose:m<1?'walk':'shake',t:t*4,dir:-1,col:'#555'});
    if(m>=1)for(let k=0;k<4;k++)flyBill(c,200,190,290,190,loopT(t*2+k/4,1),30)}},
  ribbon:{cap:()=>'You open a workshop',draw(c,t){
    building(c,300,250,'WORKSHOP',150);c.strokeStyle=t<0.4?RED:'transparent';c.lineWidth=4;c.beginPath();c.moveTo(225,215);c.lineTo(375,215);c.stroke();
    person(c,170,250,{pose:t<0.4?'give':'raise',hat:true});for(let k=0;k<3;k++){const u=Math.max(0,(t-0.45-k*0.12)*3);if(u>0&&u<1)person(c,40+260*u,250,{pose:'walk',t:u*6})}}},
  give:{cap:d=>d.title||'You give',draw(c,t){
    person(c,140,250,{pose:'give',hat:!isLandlord()});stack(c,110,250,6);person(c,350,250,{dir:-1,col:'#444',pose:loopT(t,1)>0.5?'raise':'stand'});
    for(let k=0;k<6;k++)flyBill(c,170,180,340,190,loopT(t*1.5+k/6,1),50)}},
  truck:{cap:()=>'You move your money out of state',draw(c,t){
    const u=Math.max(0,t-0.35)*1.6;truck(c,240+u*360,250,'MOVING');if(t<0.35)person(c,120+t*300,250,{pose:'box',t:t*6,hat:true});stack(c,80,250,5)}},
  bank:{cap:()=>'Borrow, don’t sell: loans aren’t taxed',draw(c,t){
    counter(c,330,250,'BANK');person(c,360,250,{dir:-1,col:'#555'});const u=Math.min(1,t*2);stack(c,320-u*120,206,Math.round(4+u*6));
    person(c,180,250,{pose:t<0.5?'give':'stand',hat:true});if(t>0.6)txt(c,'Tax: $0',190,140,16,GREEN,800)}},
  refuse:{cap:d=>d.title?'No to: '+d.title.toLowerCase():'You say no',draw(c,t){
    desk(c,150,250);chair(c,104,250);person(c,112,250,{pose:'sit',hat:!isLandlord()});
    const u=t<0.5?t*2:1,back=t>0.55?(t-0.55)*2.2:0;person(c,380-u*140+back*200,250,{pose:back?'slump':'walk',t:t*6,dir:back?1:-1,col:'#555'})}},
  letter:{cap:()=>'Your tenants get a letter',draw(c,t){
    house(c,330,250);const u=Math.min(1,t*2);person(c,90+u*150,250,{pose:u<1?'walk':'give',t:t*6});letter(c,u<1?110+u*150:282,u<1?190:214,'RENT '+pct(G.ll?G.ll.rentChange:0.1))}},
  notice:{cap:()=>'You serve an eviction notice',draw(c,t){
    house(c,330,250,{sign:t>0.5?'EVICTION':null});const u=Math.min(1,t*2.2);person(c,90+u*170,250,{pose:u<1?'walk':'raise',t:t*6})}},
  repair:{cap:()=>'Repairs, paid to local builders',draw(c,t){
    house(c,300,250);c.strokeStyle='#777';c.lineWidth=3;c.beginPath();c.moveTo(380,250);c.lineTo(350,150);c.moveTo(395,250);c.lineTo(365,150);c.stroke();
    person(c,360,190,{pose:'hammer',t,dir:-1,col:'#444'});person(c,130,250,{pose:'give'});for(let k=0;k<3;k++)flyBill(c,160,190,340,150,loopT(t+k/3,1),30)}},
  meeting:{cap:()=>isUnion()?'A union meeting':isActivist()?'A campaign meeting':isMayor()?'A council meeting':'You sit down with the tenants’ union',draw(c){
    desk(c,240,250);person(c,170,250,{pose:'stand'});for(let k=0;k<3;k++)person(c,290+k*42,250,{dir:-1,col:k===1?'#444':'#666',pose:k===1?'raise':'stand'})}},

  office:{cap:()=>'Billing $'+PT.rate.toLocaleString('en-GB')+' an hour',draw(c,t){
    desk(c,200,250);chair(c,150,250);person(c,158,250,{pose:'sit'});for(let k=0;k<4;k++)letter(c,212+(k%2)*8,214-k*8,'');
    c.strokeStyle='#777';c.lineWidth=3;c.beginPath();c.arc(380,90,30,0,7);c.stroke();const a=t*Math.PI*2*3;c.beginPath();c.moveTo(380,90);c.lineTo(380+22*Math.sin(a),90-22*Math.cos(a));c.stroke();
    for(let k=0;k<3;k++)flyBill(c,PW+10,150,220,200,loopT(t+k/3,1),30)}},
  weekend:{cap:()=>'Another weekend at the office',draw(c,t){
    c.fillStyle='#9a9aa6';c.fillRect(0,0,PW,250);c.fillStyle='#f3f3d6';c.beginPath();c.arc(400,60,22,0,7);c.fill();
    desk(c,200,250);chair(c,150,250);person(c,158,250,{pose:t%0.5<0.25?'sit':'slump'});c.fillStyle='#fff6b0';c.fillRect(186,206,30,10)}},
  loophole:{cap:()=>'You write the estate a loophole',draw(c,t){
    const u=Math.min(1,t*2);person(c,140,250,{pose:u<1?'give':'stand'});c.fillStyle='#ddd';c.fillRect(150+u*130,170,34,44);c.fillStyle='#999';c.fillRect(150+u*130,170,6,44);
    person(c,340,250,{dir:-1,hat:true,col:'#333'});for(let k=0;k<4;k++)flyBill(c,330,180,160,180,loopT(t*1.5+k/4,1),40)}},
  court:{cap:()=>'You take the case for nothing',draw(c,t){
    c.fillStyle='#7a7a7a';c.fillRect(300,170,150,80);c.fillStyle='#5f5f5f';c.fillRect(300,160,150,14);person(c,375,170,{dir:-1,col:'#333'});
    person(c,150,250,{pose:loopT(t,2)>0.5?'raise':'stand'});person(c,210,250,{col:'#555',pose:t>0.6?'raise':'slump'})}},
  cafe:{cap:()=>'The café: '+money(G.shops[CAFE].rev*WEEKS)+' a year over the counter',draw(c,t){
    counter(c,170,250);person(c,150,250,{});c.fillStyle='#8f8f8f';c.fillRect(300,214,64,5);c.fillRect(330,219,4,31);
    person(c,290,250,{pose:'sit',col:'#333'});person(c,378,250,{pose:'sit',dir:-1,col:'#444'});
    const u=loopT(t,1);person(c,PW+20-u*260,250,{pose:'walk',t:t*6,dir:-1,col:'#555'});for(let k=0;k<3;k++)flyBill(c,330,190,180,190,loopT(t+k/3,1),30)}},
  staff:{cap:()=>'Pay day at the café',draw(c,t){
    person(c,140,250,{pose:'give'});const n=Math.max(1,staffOf(CAFE).length);for(let k=0;k<n;k++)person(c,300+k*60,250,{dir:-1,col:k%2?'#444':'#333',pose:loopT(t,1)>0.5?'raise':'stand'});
    for(let k=0;k<4;k++)flyBill(c,170,180,300+(k%n)*60,180,loopT(t*1.5+k/4,1),40)}},
  supplier:{cap:()=>G.sh&&G.sh.supply==='local'?'Supplies from the store in town':'Supplies from the megastore',draw(c,t){
    const local=G.sh&&G.sh.supply==='local';counter(c,120,250);person(c,100,250,{});truck(c,PW+60-Math.min(1,t*1.5)*250,250,local?'DEE\u2019S STORE':'MEGASTORE');
    for(let k=0;k<3;k++)flyBill(c,130,190,local?260:PW+30,local?190:90,loopT(t+k/3,1),30)}},
  waiting:{cap:()=>'Waiting tables: '+hh(G.shops[CAFE].wage)+' a week',draw(c,t){
    c.fillStyle='#8f8f8f';for(const x of [120,320]){c.fillRect(x-32,214,64,5);c.fillRect(x-2,219,4,31)}
    person(c,90,250,{pose:'sit',col:'#444'});person(c,150,250,{pose:'sit',dir:-1,col:'#333'});person(c,350,250,{pose:'sit',dir:-1,col:'#444'});
    const u=loopT(t,1),x=u<0.5?180+u*2*100:280-(u-0.5)*2*100;person(c,x,250,{pose:'give',t:t*6,dir:u<0.5?1:-1});c.fillStyle='#fff';c.fillRect(x+(u<0.5?18:-26),190,10,3)}},
  nightshift:{cap:()=>'An extra shift, after closing',draw(c,t){
    c.fillStyle='#9a9aa6';c.fillRect(0,0,PW,250);c.fillStyle='#f3f3d6';c.beginPath();c.arc(410,60,20,0,7);c.fill();
    c.fillStyle='#8f8f8f';c.fillRect(288,214,64,5);c.fillRect(318,219,4,31);const x=140+Math.sin(t*Math.PI*4)*30;person(c,x,250,{pose:'hammer',t});
    c.strokeStyle='#555';c.lineWidth=3;c.beginPath();c.moveTo(x+16,200);c.lineTo(x+34,250);c.stroke()}},
  lender:{cap:()=>'The payday lender: '+Math.round(WT.loanRate*100*52)+'% a year',draw(c,t){
    building(c,330,250,'LOANS',150);c.fillStyle='#c9a227';c.fillRect(290,140,80,14);person(c,330,250,{dir:-1,col:'#333',hat:true});
    person(c,180,250,{pose:t<0.5?'raise':'stand'});for(let k=0;k<3;k++)flyBill(c,320,190,190,190,loopT(t+k/3,1),20)}},
  classes:{cap:()=>'Evening classes',draw(c,t){
    c.fillStyle='#4f5b52';c.fillRect(300,110,150,80);txt(c,'A + B',375,158,18,'#eee',700);person(c,420,250,{dir:-1,col:'#333',pose:'raise'});
    for(let k=0;k<3;k++){c.fillStyle='#8f8f8f';c.fillRect(70+k*70,220,44,5);person(c,80+k*70,250,{pose:'sit',col:k===1?INK:'#555'})}}},
  jobcentre:{cap:()=>'The benefits office',draw(c,t){
    building(c,330,250,'BENEFITS',160);person(c,330,250,{dir:-1,col:'#555'});const u=Math.min(1,t*1.6);
    person(c,80+u*150,250,{pose:u<1?'walk':'stand',t:t*6});if(u>=1)for(let k=0;k<3;k++)flyBill(c,320,190,240,190,loopT(t+k/3,1),20)}},
  jobsearch:{cap:()=>'Looking for work',draw(c,t){
    shop(c,120,250,'NO VACANCIES',{});const s=G.shops.find(s=>!s.open);if(s)shop(c,360,250,s.name.toUpperCase(),{shutter:1});
    const u=loopT(t,1);person(c,40+u*420,250,{pose:'walk',t:t*6});letter(c,60+u*420,170,'CV')}},
  park:{cap:()=>'Another night in the park',draw(c,t){
    c.fillStyle='#9a9aa6';c.fillRect(0,0,PW,250);tree(c,80,250);tree(c,410,250);bench(c,240,250);person(c,240,250,{pose:'slump',col:'#333'});tent(c,330,250)}},
  foodbank:{cap:()=>{const n=threadWho(['letgo','evicted'],r=>r.job==null);return n?n+', whom you remember, at the food bank':'The food bank at the church hall'},draw(c,t){
    c.fillStyle='#8f8f8f';c.fillRect(220,206,140,8);for(let k=0;k<4;k++){c.fillStyle='#9a8466';c.fillRect(230+k*32,186,24,20)}
    person(c,300,250,{dir:-1,col:'#555'});person(c,340,250,{dir:-1,col:'#666',pose:'give'});const u=Math.min(1,t*1.5);person(c,60+u*130,250,{pose:u<1?'walk':'box',t:t*5})}},
  gig:{cap:()=>'Paid by the drop',draw(c,t){
    c.fillStyle='rgba(120,130,140,.25)';for(let k=0;k<30;k++)c.fillRect((k*53+t*400)%PW,(k*31+t*900)%240,1.5,8);
    const x=40+loopT(t,1)*420;c.strokeStyle='#333';c.lineWidth=3;c.beginPath();c.arc(x-16,244,8,0,7);c.arc(x+16,244,8,0,7);c.stroke();
    person(c,x,236,{pose:'sit',s:0.9});c.fillStyle='#4c9a5d';c.fillRect(x-24,178,20,20)}},
  organising:{cap:()=>'Organising',draw(c,t){
    person(c,240,250,{pose:loopT(t,2)<0.5?'raise':'stand'});for(let k=0;k<5;k++){const a=Math.PI*(0.15+k*0.175);person(c,240-Math.cos(a)*170,250,{dir:k<2?1:-1,col:['#444','#555','#333','#666','#444'][k],pose:loopT(t+k*0.2,1)>0.8?'raise':'stand'})}}},
  // the market reaching the town: the mill on short time after a crash, and homes dearer in a boom
  shorttime:{cap:()=>'Shares crash, and the mill goes on short time: pay is down '+Math.round((1-MKT.millCut)*100)+'%',draw(c,t){
    c.fillStyle='#8f8f8f';c.fillRect(330,130,10,120);c.fillRect(430,130,10,120);c.fillRect(330,130,110,10);board(c,385,168,'SHORT TIME');
    for(let k=0;k<3;k++){const u=Math.max(0,Math.min(1,(t-k*0.2)*2));person(c,370-u*190-k*12,250,{pose:u<1?'walk':'slump',t:t*4+k,dir:-1,col:['#333','#444','#555'][k]})}}},
  boomhomes:{cap:()=>'Shares boom, and a home costs '+Math.round(MKT.boomHomes*100)+'% more',draw(c,t){
    house(c,230,250,{});c.fillStyle='#8f8f8f';c.fillRect(118,190,4,60);board(c,120,182,'FOR SALE $'+Math.round(G.homePrice/HH/1000*(1-MKT.boomHomes*(1-Math.min(1,t*1.5))))+'k');person(c,360,250,{pose:'slump',col:'#444'});
    for(let k=0;k<2;k++)flyBill(c,PW+20,120,250,200,loopT(t+k/2,1),30)}},
  rally:{cap:()=>'Signing people up at the gate',draw(c,t){
    c.fillStyle='#8f8f8f';c.fillRect(330,130,10,120);c.fillRect(430,130,10,120);c.fillRect(330,130,110,10);
    person(c,200,250,{pose:loopT(t,2)<0.5?'raise':'give'});for(let k=0;k<4;k++){const u=Math.max(0,Math.min(1,(t-k*0.18)*2.5));person(c,400-u*130-k*10,250,{pose:u<1?'walk':'stand',t:t*5+k,dir:-1,col:['#333','#444','#555','#3a3a3a'][k]})}}},
  strikewon:{cap:()=>'The strike is won',draw(c,t){
    for(let k=0;k<6;k++)person(c,60+k*72,250,{pose:loopT(t+k*0.15,1)<0.5?'raise':'stand',col:k%2?'#333':INK});
    for(let k=0;k<8;k++)flyBill(c,PW+20,60,60+(k%6)*72,170,loopT(t+k/8,1),30)}},
  // ---- endings ----
  bunker:{cap:()=>'Your bunker. Very rich, and very alone',draw(c,t){
    c.fillStyle='#8a8a8a';c.beginPath();c.ellipse(240,250,170,70,0,Math.PI,0);c.fill();c.fillStyle='#6d6d6d';c.fillRect(215,200,50,50);
    person(c,240,250,{hat:true,pose:'sit'});vault(c,380,120,1);for(let k=0;k<3;k++)flyBill(c,PW+10,40,380,120,loopT(t+k/3,1),20)}},
  mob:{cap:()=>'Revolt',draw(c,t){
    for(let k=0;k<9;k++){const x=((k*58+t*90)%(PW+60))-30;person(c,x,250,{pose:'sign',march:true,t:t*4+k*0.3,text:['TAX','ENOUGH','FAIR','PAY'][k%4],col:k%3?'#333':INK})}}},
  cheer:{cap:()=>'The town fizzes with spending, and you\u2019re still rich',draw(c,t){
    person(c,240,250,{pose:'raise',hat:!isLandlord()});for(let k=0;k<6;k++)person(c,40+k*80+(k>2?40:0),250,{pose:k%2?'raise':'walk',t:t*4+k,col:k%2?'#333':'#555'});
    for(let k=0;k<12;k++)flyBill(c,(k*53)%PW,260,((k*97)+t*200)%PW,40,loopT(t+k/12,1),80)}},
  repo:{cap:()=>'The bank takes the homes',draw(c,t){
    house(c,320,250,{sign:'BANK OWNED',signCol:'#555'});person(c,180,250,{pose:'slump'});
    for(let k=0;k<2;k++)person(c,360+k*40+t*80,250,{pose:'box',t:t*5,col:'#555'})}},
  // ---- the town ----
  chain:{cap:()=>G.history.length?'A dollar changes hands about '+Math.round(G.history.at(-1).vel)+' times a year':'Every dollar spent is someone’s wage',draw(c,t){
    // shopper → cashier → barber → café → shopper, the video's chain
    counter(c,90,250);person(c,70,250,{col:'#333'});person(c,128,250,{dir:-1,pose:'box'});
    c.fillStyle='#555';c.fillRect(196,206,26,8);c.fillRect(205,214,8,36);person(c,212,250,{pose:'sit',dir:-1});person(c,248,250,{dir:-1,col:'#444',pose:'hammer',t});
    c.fillStyle='#8f8f8f';c.fillRect(312,214,64,5);c.fillRect(342,219,4,31);person(c,300,250,{pose:'sit'});person(c,390,250,{pose:'sit',dir:-1});person(c,420,250,{dir:-1,col:'#444'});
    const leak=G.history.length?Math.min(0.6,G.history.at(-1).mega/Math.max(1,weeklySpend()*WEEKS)):0.2;
    // a bill in the air for each time a dollar changes hands in a year (two to eight)
    const nb=G.history.length?Math.max(2,Math.min(8,Math.round(G.history.at(-1).vel))):5;
    const pts=[[110,180],[220,180],[350,180],[430,175]];for(let k=0;k<nb;k++){const u=loopT(t*1.2+k/nb,1),seg=Math.floor(u*3),f=u*3-seg;flyBill(c,pts[seg][0],pts[seg][1],pts[seg+1][0],pts[seg+1][1],f,30)}
    if(leak>0.25)for(let k=0;k<2;k++)flyBill(c,130,180,PW+30,120,loopT(t+k/2,1),20)}},
  evicted:{cap:()=>(R.recent.evicted?R.recent.evicted+'\u2019s family':'A family')+' is put out on the street',draw(c,t){
    house(c,140,250,{sign:'EVICTED'});const u=t*0.8;person(c,260+u*60,250,{pose:'box',t:t*4});person(c,300+u*60,250,{pose:'walk',t:t*4,s:0.62})}},
  tents:{cap:()=>{const n=G.res.filter(r=>r.homeless).length,who=threadWho(['evicted'],r=>r.homeless);return who?who+'\u2019s family, whom you evicted, in the park':n?n*HH+' households sleeping in the park':'The park'},draw(c){
    // one tent for every hundred households sleeping rough, squeezed closer as the park fills
    tree(c,60,250);tree(c,430,250);const n=Math.min(9,Math.max(1,G.res.filter(r=>r.homeless).length)),gap=Math.min(55,280/n);
    for(let k=0;k<n;k++)tent(c,120+k*gap+(n<5?(5-n)*20:0),250);
    for(let k=0;k<Math.min(3,Math.ceil(n/2));k++)person(c,140+k*110,250,{pose:'slump',col:'#555',dir:k%2?-1:1})}},
  closed:{cap:()=>{const n=R.recent.closed||(G.shops.find(s=>!s.open)||{}).name;return n?'The '+n+' has closed':'A shop closes'},draw(c,t){
    const s=G.shops.find(s=>s.name===R.recent.closed)||G.shops.find(s=>!s.open);shop(c,220,250,(s?s.name:'SHOP').toUpperCase(),{shutter:Math.min(1,t*1.6)});person(c,330+Math.max(0,t-0.6)*300,250,{pose:t>0.6?'slump':'stand',col:'#444'})}},
  laidoff:{cap:()=>{const n=jobless().length;return (R.recent.laidoff?R.recent.laidoff+' is out of work':'Jobs are cut')+(n?'. '+n*HH+' households without a job':'')},draw(c,t){
    const s=G.shops.find(s=>s.ownedByYou&&s.open);shop(c,140,250,(s?s.name:'SHOP').toUpperCase(),{awn:GREEN});person(c,230+t*200,250,{pose:'box',t:t*5})}},
  strike:{cap:()=>isLandlord()?'Rent strike':G.rung==='billionaire'?'Strike at your shops':'On strike',draw(c,t){
    shop(c,120,250,'STRIKE',{awn:GREEN});for(let k=0;k<4;k++){const x=210+((k*60+t*120)%240);person(c,x,250,{pose:'sign',march:true,t:t*4+k,text:'STRIKE'})}}},
  protest:{cap:()=>(['waiter','out','union','activist'].includes(G.rung)?'You march with the town':G.rung==='billionaire'||G.rung==='landlord'?'The town marches against you':'The town marches')+(aggrieved()?': '+aggrieved()*HH+' households':''),draw(c,t){
    const words=isLandlord()?['RENT','FAIR','HOMES','RENT','FIX IT','FAIR']:['TAX','FAIR','PAY','TAX US','RENT','FAIR'];
    const n=marchers(),gap=(PW+80)/n;
    for(let k=0;k<n;k++){const x=((k*gap+t*160)%(PW+80))-40;person(c,x,250,{pose:'sign',march:true,t:t*4+k*0.3,text:words[k%6],col:k%2?'#333':INK})}}},
  nursery:{cap:()=>'Childcare: parents work full time',draw(c,t){
    building(c,330,250,'NURSERY',130);const u=Math.min(1,t*1.6);person(c,60+u*180,250,{pose:'walk',t:t*5});if(u<1)person(c,90+u*180,250,{pose:'walk',t:t*5,s:0.62});
    else person(c,250-(t-0.62)*500,250,{pose:'walk',t:t*5,dir:-1})}},
  medical:{cap:()=>giftsOn().medical?'Medical debt, wiped as it arrives':(G.res.filter(r=>r.debt>0).length*HH)+' households paying off medical bills',draw(c,t){
    person(c,200,250,{pose:giftsOn().medical?'raise':'slump',col:'#333'});c.fillStyle='#f6f6f6';const h=giftsOn().medical?Math.max(0,60-t*120):60+t*40;c.fillRect(220,250-h-60,36,h);
    txt(c,giftsOn().medical?'PAID':'BILL',238,175,11,giftsOn().medical?GREEN:RED,800);if(giftsOn().medical)for(let k=0;k<3;k++)flyBill(c,PW+10,80,240,170,loopT(t+k/3,1),20)}},
  workshop:{cap:()=>'Workshops sell outside town and pay wages here',draw(c,t){
    for(let k=0;k<3;k++){c.fillStyle='#8f8f8f';c.fillRect(40+k*110,214,70,6);person(c,70+k*110,250,{pose:'hammer',t:t+k*0.2})}
    truck(c,380+Math.max(0,t-0.5)*300,250,'EXPORT');for(let k=0;k<3;k++)flyBill(c,PW+20,120,90+k*110,180,loopT(t+k/3,1),20)}},
  megastore:{cap:()=>'Spent at the megastore: it leaves town',draw(c,t){
    c.fillStyle='#8a8a8a';c.fillRect(300,130,170,120);txt(c,'MEGASTORE',385,150,13,'#fff',800);c.fillStyle='#bdbdbd';c.fillRect(370,200,30,50);
    person(c,60+t*300,250,{pose:'box',t:t*5});for(let k=0;k<3;k++)flyBill(c,90+t*300,180,PW+30,100,loopT(t*1.5+k/3,1),20)}},
  rentrise:{cap:()=>'Rent rises faster than pay',draw(c,t){
    desk(c,240,250);chair(c,200,250);person(c,208,250,{pose:'slump',col:'#333'});letter(c,250,206,'RENT +'+(isLandlord()&&G.ll?Math.round(G.ll.rentChange*100):7)+'%');
    for(let k=0;k<3;k++)flyBill(c,240,190,PW+20,120,loopT(t+k/3,1),30)}},
  damp:{cap:()=>'Homes falling apart',draw(c,t){house(c,200,250,{damp:true});person(c,330,250,{pose:'slump',col:'#444'});
    c.fillStyle='rgba(90,110,130,.6)';for(let k=0;k<3;k++){const y=150+loopT(t+k/3,1)*90;c.fillRect(170+k*20,y,3,7)}}},
  works:{cap:()=>'Public works, paid for by the tax',draw(c,t){
    c.fillStyle='#bdbdbd';c.fillRect(0,250,PW*Math.min(1,0.3+t),8);for(let k=0;k<4;k++)person(c,70+k*100,250,{pose:'hammer',t:t+k*0.25,col:k%2?'#333':INK});
    c.fillStyle='#f0f0f0';c.fillRect(380,150,80,30);txt(c,'PUBLIC WORKS',420,170,9,'#333',800)}},
  calm:{cap:()=>'A quiet day in town',draw(c,t){tree(c,80,250);tree(c,420,250);bench(c,240,250);person(c,215,250,{pose:'sit'});person(c,265,250,{pose:'sit',dir:-1,col:'#333'});
    person(c,-20+t*(PW+40),250,{pose:'walk',t:t*8,col:'#555'})}},
  // ---- the activist ----
  canvass:{cap:()=>G.ac&&G.ac.campaign?'Knocking on doors: '+measure(G.ac.campaign).name.toLowerCase():'Knocking on doors',draw(c,t){
    house(c,350,250);const u=Math.min(1,t*2.2);person(c,60+u*230,250,{pose:u<1?'walk':'give',t:t*6});
    if(u>=1)letter(c,318,192,'VOTE');if(t>0.6)person(c,370,250,{dir:-1,col:'#555',pose:t>0.8?'raise':'stand'})}},
  ballot:{cap:()=>R.recent.ballot&&measure(R.recent.ballot)?measure(R.recent.ballot).name+': the town votes yes':'The town votes',draw(c,t){
    c.fillStyle='#6d6d6d';c.fillRect(214,190,52,60);c.fillStyle='#f2f2f2';c.fillRect(222,186,36,6);txt(c,'VOTE',240,228,11,'#f2f2f2',800);
    // voters walk up to the box one after another, and each drops a paper in
    for(let k=0;k<5;k++){const u=loopT(t+k*0.2,1);
      if(u<0.5)person(c,20+u*2*170,250,{pose:'walk',t:t*5+k,col:['#333','#444','#555','#3a3a3a',INK][k]});
      else if(u<0.7){person(c,190,250,{pose:'give',col:['#333','#444','#555','#3a3a3a',INK][k]});c.fillStyle='#f7f7f7';c.fillRect(234,166+(u-0.5)*100,12,14)}}
    for(let k=0;k<4;k++)person(c,320+k*44,250,{dir:-1,col:k%2?'#555':'#333',pose:loopT(t+k*0.25,1)>0.7?'raise':'stand'})}},
  march:{cap:()=>'You lead a march on the town hall',draw(c,t){
    building(c,410,250,'TOWN HALL',120);
    const word=G.ac&&G.ac.campaign?({wealthtax:'TAX',rentcap:'RENT',loopholes:'LAWS',shelter:'HOMES',childcare:'KIDS',medical:'HEALTH',vouchers:'RENT'})[G.ac.campaign]:'VOTE';
    for(let k=0;k<5;k++){const x=((k*56+t*120)%300)-20;person(c,x,250,{pose:'sign',march:true,t:t*4+k*0.3,text:k%2?'VOTE':word,col:k===4?INK:k%2?'#333':'#444'})}}},
  smear:{cap:()=>'Your face on the front page',draw(c,t){
    c.fillStyle='#f4f4f4';c.fillRect(200,90,170,150);c.strokeStyle='#999';c.lineWidth=1;c.strokeRect(200,90,170,150);
    txt(c,'THE TOWN TIMES',285,110,10,'#333',800);txt(c,'WHO PAYS',285,138,18,RED,900);txt(c,'FOR THE',285,158,18,RED,900);txt(c,'ACTIVIST?',285,178,18,RED,900);
    c.fillStyle='#bbb';for(let k=0;k<4;k++)c.fillRect(214,192+k*10,142,4);
    person(c,120,250,{pose:t>0.5?'give':'slump'})}},
  paperwork:{cap:()=>'Applying for the state\u2019s grant',draw(c,t){
    desk(c,240,250);chair(c,190,250);person(c,198,250,{pose:'sit'});for(let k=0;k<6;k++)letter(c,256+(k%2)*6,214-k*6,'');
    if(t>0.7){c.fillStyle=GREEN;c.fillRect(320,150,60,26);txt(c,'GRANTED',350,168,10,'#fff',800);for(let k=0;k<3;k++)flyBill(c,PW+10,60,300,200,loopT(t+k/3,1),30)}}},
  // ---- the mayor ----
  townhall:{cap:()=>'At the town hall',draw(c,t){
    building(c,330,250,'TOWN HALL',170);c.fillStyle='#8f8f8f';c.fillRect(120,200,40,50);
    person(c,140,200,{pose:loopT(t,2)<0.5?'raise':'stand'});for(let k=0;k<4;k++)person(c,40+k*30,250,{dir:1,col:['#555','#444','#666','#3a3a3a'][k],s:0.9})}},
  keys:{cap:()=>R.recent.keys?R.recent.keys+' moves into a council home':'A council home',draw(c,t){
    house(c,340,250,{sign:'TOWN',signCol:GREEN});person(c,150,250,{pose:'give'});
    const u=Math.min(1,t*1.6);person(c,190+u*120,250,{pose:u<1?'walk':'raise',t:t*5,col:'#444'});
    if(u<0.3){c.fillStyle='#c9a23a';c.fillRect(176,184,10,6)}}},
  election:{cap:()=>{const l=lastElection();return l?(l.won?'Election night: re-elected':'Election night: voted out'):'Election night'},draw(c,t){
    c.fillStyle='#f4f4f4';c.fillRect(150,70,180,90);c.strokeStyle='#999';c.strokeRect(150,70,180,90);
    const w=Math.min(1,t*1.5),last=lastElection(),a=last?(last.won?Math.max(0.55,last.approval):Math.min(0.45,last.approval)):0.5;c.fillStyle=GREEN;c.fillRect(165,95,150*a*w,22);c.fillStyle=RED;c.fillRect(165,125,150*(1-a)*w,22);
    txt(c,'YOU',158,111,9,'#333',800,'right');
    const lost=last&&!last.won;person(c,240,250,{pose:t>0.6?(lost?'slump':'raise'):'stand'});for(let k=0;k<4;k++)person(c,60+k*40+(k>1?260:0),250,{col:k%2?'#444':'#555',pose:t>0.6&&k%2&&!lost?'raise':'stand',dir:k>1?-1:1})}},
  // ---- the governor ----
  capitol:{cap:()=>isPresident()?'In the capital':'At the state capitol',draw(c,t){
    c.fillStyle='#ababab';c.fillRect(240,160,180,90);c.beginPath();c.arc(330,160,46,Math.PI,0);c.fill();c.fillRect(326,100,8,18);
    c.fillStyle='#e6e6e6';for(let k=0;k<5;k++)c.fillRect(252+k*34,180,14,70);
    person(c,140,250,{pose:loopT(t,2)<0.5?'raise':'stand'});person(c,90,250,{col:'#555',s:0.95})}},
  billsign:{cap:d=>d&&d.label&&d.title?'You sign: '+d.label.toLowerCase():'You sign it into law',draw(c,t){
    desk(c,240,250);chair(c,200,250);person(c,208,250,{pose:'sit'});c.fillStyle='#f7f7f7';c.fillRect(236,206,40,10);
    if(t>0.5){c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(242,211);for(let k=0;k<8;k++)c.lineTo(244+k*4,208+(k%2)*5);c.stroke()}
    for(let k=0;k<4;k++)person(c,320+k*40,250,{dir:-1,col:k%2?'#444':'#666',pose:t>0.6&&k%2?'raise':'stand'})}},
  warehouse:{cap:()=>'The chain\u2019s warehouse',draw(c,t){
    c.fillStyle='#9a9a9a';c.fillRect(200,140,240,110);c.fillStyle='#7a7a7a';for(let k=0;k<3;k++)c.fillRect(220+k*70,190,50,60);txt(c,'WAREHOUSE',320,170,12,'#fff',800);
    const x=((t*260)%300)-40;c.fillStyle='#5b5b5b';c.fillRect(x,214,60,30);c.fillStyle='#333';c.beginPath();c.arc(x+12,246,6,0,7);c.arc(x+48,246,6,0,7);c.fill();
    person(c,140,250,{pose:'shake'})}},
  shelter:{cap:()=>'Everyone evicted gets a bed',draw(c,t){building(c,320,250,'SHELTER',140);person(c,80+Math.min(1,t*1.5)*220,250,{pose:'box',t:t*5,col:'#444'})}},
};
// the most recent election, as mayor or governor
const lastElection=()=>{const e=isPresident()?G.pr.elections:isGovernor()?G.gv.elections:G.my?G.my.elections:[];return e.at(-1)};
// what a gift looks like on the town's side
const GIFT_SCENE={medical:'medical',shelter:'shelter',childcare:'nursery',vouchers:'chain',poverty:'chain'};

// the right-hand scene: the town's most pressing story, weighted by how pressing it is
function pickTownScene(){
  const people=G.res.filter(r=>r.role!=='landlord'),rough=people.filter(r=>r.homeless).length,w=[['chain',2+(G.unrest<30?2:0)]];
  if(rough)w.push(['tents',2+rough]);
  if(G.shops.some(s=>!s.open))w.push(['closed',2]);
  if(G.unrest>=55)w.push(['protest',3]);
  if(G.unrest>=70&&(shopsOwned()||isLandlord()))w.push(['strike',3]);
  if(giftsOn().childcare)w.push(['nursery',1.5]);
  if(people.some(r=>r.debt>0)||giftsOn().medical)w.push(['medical',1.2]);
  if(G.workshops.length)w.push(['workshop',1]);
  if(jobless().length>=3)w.push(['laidoff',1.5]);
  if(G.fund>0)w.push(['works',1.5]);
  if(people.some(r=>r.sheltered))w.push(['shelter',1]);
  if(isLandlord()&&G.ll.cond<0.5)w.push(['damp',2]);
  if(homesOwned()||isLandlord()||isPartner())w.push(['rentrise',1]);
  w.push(['megastore',0.6]);if(G.unrest<30)w.push(['calm',1]);
  const last=R.stage.town&&R.stage.town.k,ws=w.filter(x=>x[0]!==last),pool=ws.length?ws:w;
  let r=Math.random()*pool.reduce((a,x)=>a+x[1],0); // cosmetic
  for(const [k,v] of pool){r-=v;if(r<=0)return k}return 'chain';
}
// what you do between decisions: a few scenes per role, never the same one twice running
const IDLE={billionaire:['desk','yacht','golf'],landlord:['rentbook','collect'],partner:['office','weekend'],shop:['cafe','staff'],waiter:['waiting','waiting','nightshift'],out:['jobsearch','jobsearch','park'],union:['rally','meeting'],activist:['canvass','canvass','meeting'],mayor:['townhall','meeting'],governor:['capitol','capitol','billsign'],president:['capitol','billsign']};
const idleScene=()=>{const o=(IDLE[G.rung]||['desk']).filter(k=>k!=='park'||G.ow&&G.res[G.ow.i]&&G.res[G.ow.i].homeless),last=R.stage.you&&R.stage.you.k;const pool=o.filter(k=>k!==last);return pool[Math.floor(Math.random()*pool.length)]||o[0]}; // cosmetic
// what an ending looks like, on each side
const endingScene=()=>({hero:'cheer',giver:'give',luthor:'bunker',revolt:'mob',fair:'cheer',rentier:'rentbook',bankrupt:'repo',hiredgun:'loophole',counsel:'court',burnout:'weekend',pillar:'cafe',tightfisted:'cafe',closed:'closed',sold:'handshake',founder:'ribbon',ahead:'classes',by:'waiting',evicted:'evicted',feet:'handshake',organiser:'organising',stuck:'park',fairpay:'strikewon',soldout:'handshake',busted:'meeting',changed:'ballot',heard:'canvass',bought:'handshake',ignored:'meeting',builder:'keys',machine:'handshake',caretaker:'townhall',outvoted:'election',newdeal:'billsign',dealmaker:'handshake',steward:'capitol',unseated:'election',rebuilt:'billsign',lobbied:'handshake',gridlock:'capitol',oneterm:'election'})[G.ending.kind]||idleScene();
const endingTown=()=>({hero:'chain',giver:'works',luthor:'tents',revolt:'protest',fair:'calm',rentier:'rentrise',bankrupt:'evicted',hiredgun:'rentrise',counsel:'chain',burnout:'calm',pillar:'chain',tightfisted:'rentrise',closed:'laidoff',sold:'laidoff',founder:'megastore',ahead:'chain',by:'rentrise',evicted:'tents',feet:'chain',organiser:'protest',stuck:'tents',fairpay:'chain',soldout:'laidoff',busted:'rentrise',changed:'nursery',heard:'chain',bought:'rentrise',ignored:'tents',builder:'chain',machine:'rentrise',caretaker:'calm',outvoted:'rentrise',newdeal:'chain',dealmaker:'megastore',steward:'calm',unseated:'rentrise',rebuilt:'chain',lobbied:'rentrise',gridlock:'calm',oneterm:'rentrise'})[G.ending.kind]||'chain';
// a decision plays its scene on your side and its consequence on the town's, next, ahead of anything else
function queueScenes(you,town,d){
  const put=(side,k)=>{const st=R.stage,s=st[side],n={k,d};if(!s)st[side]={k,d,walk:null};else if(st.tr)s.to.next=n;else s.next=n};
  if(you)put('you',you);
  if(town)put('town',town.startsWith('gift-')?GIFT_SCENE[town.slice(5)]:town);
}
// ---------- moving between scenes ----------
// The stage is one camera travelling right through the town, both panes in step, the way the video pans across its
// map: a scene drifts slowly past while it plays, then the camera moves on and the next slides in from the right. Most
// of the time a passer-by walks ahead of it (now and then with a child in tow): they cross the scene as it plays, reach
// its edge as it ends, and the camera follows them into the next, where they walk on. A decision's scenes come first,
// as soon as it's made.
const TR=1.6,DRIFT=4,STEP=PW+40,AL=34,AR=446;
const ease=u=>u<0.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;
function nextScene(side){
  if(side==='you')return {k:G.ending?endingScene():idleScene(),d:{}};
  return {k:G.ending?endingTown():R.townQ.length?R.townQ.shift():pickTownScene(),d:{}};
}
// who passes through: the cast of the street, each with its own gait and pace, weighted by how the town is doing
// (pickets when it's restless, movers when families are losing their homes, couriers when the work is by the drop,
// umbrellas in winter). Those on foot at the camera's pace are carried into the next scene; the quick ones cross and go.
const dog=(c,x,y,t,col)=>{c.fillStyle=col;c.beginPath();c.roundRect(x-10,y-15,20,9,4);c.fill();c.beginPath();c.arc(x+12,y-16,5,0,7);c.fill();
  c.strokeStyle=col;c.lineWidth=3;c.lineCap='round';const sw=Math.sin(t*Math.PI*4)*4;c.beginPath();c.moveTo(x-7,y-8);c.lineTo(x-7+sw,y);c.moveTo(x+6,y-8);c.lineTo(x+6-sw,y);c.moveTo(x-10,y-13);c.lineTo(x-16,y-20);c.stroke()};
const wheel=(c,x,y,r)=>{c.strokeStyle='#333';c.lineWidth=2.5;c.beginPath();c.arc(x,y,r,0,7);c.stroke()};
const bike=(c,x,y,t,col,box)=>{wheel(c,x-15,y-9,9);wheel(c,x+15,y-9,9);c.strokeStyle=col;c.lineWidth=2.5;c.beginPath();c.moveTo(x-15,y-9);c.lineTo(x-2,y-28);c.lineTo(x+15,y-9);c.moveTo(x-2,y-28);c.lineTo(x+10,y-30);c.stroke();
  person(c,x-4,y-12,{pose:'sit',s:0.8,col});if(box){c.fillStyle=GREEN;c.fillRect(x-24,y-54,18,16)}};
const WALKERS=[
  {k:'walker',w:3,draw:(c,x,t,w)=>person(c,x,250,{pose:'walk',t:t*1.6,col:w.col})},
  {k:'family',w:2,draw:(c,x,t,w)=>{person(c,x,250,{pose:'walk',t:t*1.6,col:w.col});person(c,x-22,250,{pose:'walk',t:t*2.2,s:0.62,col:w.col})}},
  {k:'couple',w:1.5,draw:(c,x,t,w)=>{person(c,x-14,250,{pose:'walk',t:t*1.6,col:w.col});person(c,x+12,250,{pose:'walk',t:t*1.6+0.4,col:'#333'})}},
  {k:'dog',w:2,draw:(c,x,t,w)=>{person(c,x,250,{pose:'walk',t:t*1.6,col:w.col});dog(c,x+30,250,t,w.col)}},
  {k:'pram',w:1.2,draw:(c,x,t,w)=>{person(c,x,250,{pose:'give',col:w.col});c.strokeStyle=w.col;c.lineWidth=3;c.beginPath();c.moveTo(x+22,222);c.lineTo(x+34,236);c.stroke();
    c.fillStyle=w.col;c.beginPath();c.roundRect(x+22,234,26,12,[8,8,2,2]);c.fill();wheel(c,x+27,248,3);wheel(c,x+44,248,3)}},
  {k:'shopper',w:2,draw:(c,x,t,w)=>person(c,x,250,{pose:'box',t:t*1.6,col:w.col})},
  {k:'elder',w:1.5,pace:0.75,draw:(c,x,t,w)=>{person(c,x,250,{pose:'walk',t:t*1.1,col:w.col});c.strokeStyle=w.col;c.lineWidth=2.5;c.beginPath();c.moveTo(x+8,208);c.lineTo(x+16,250);c.stroke()}},
  {k:'scooter',w:1,pace:1.5,draw:(c,x,t,w)=>{person(c,x,246,{pose:'stand',s:0.62,col:w.col});c.fillStyle='#444';c.fillRect(x-12,245,26,3);wheel(c,x-11,248,3);wheel(c,x+13,248,3)}},
  {k:'umbrella',w:0,when:()=>raining()?4:season()<0.3?1.2:0.1,draw:(c,x,t,w)=>{person(c,x,250,{pose:'walk',t:t*1.6,col:w.col});c.strokeStyle=w.col;c.lineWidth=2;c.beginPath();c.moveTo(x+6,228);c.lineTo(x+6,186);c.stroke();
    c.fillStyle='#8a6d3b';c.beginPath();c.arc(x+6,186,22,Math.PI,0);c.fill()}},
  {k:'picket',w:0,when:()=>G.unrest>=55?3:G.unrest>=40?0.8:0,draw:(c,x,t,w)=>person(c,x,250,{pose:'sign',march:true,t:t*1.6,text:['FAIR','RENT','PAY','TAX'][w.n%4],col:w.col})},
  {k:'movers',w:0,when:()=>G.res.some(r=>r.homeless)?1.8:0.3,draw:(c,x,t,w)=>{person(c,x,250,{pose:'box',t:t*1.6,col:w.col});person(c,x-30,250,{pose:'box',t:t*1.6+0.5,col:'#333'})}},
  {k:'jogger',w:1.2,pace:2.2,when:()=>G.unrest<45?1.5:0.4,draw:(c,x,t,w)=>{c.save();c.translate(x,250);c.rotate(0.12);person(c,0,0,{pose:'walk',t:t*3.4,col:w.col});c.restore()}},
  {k:'cyclist',w:1.5,pace:2.6,draw:(c,x,t,w)=>bike(c,x,250,t,w.col)},
  {k:'courier',w:0,pace:2.6,when:()=>isOut()||isWaiter()?2:0.6,draw:(c,x,t,w)=>bike(c,x,250,t,w.col,true)},
  {k:'van',w:1,pace:3,draw:(c,x,t,w)=>truck(c,x,250,'')},
  {k:'bus',w:0.9,pace:2.3,draw:(c,x,t,w)=>{c.fillStyle='#7d7d7d';c.beginPath();c.roundRect(x-60,194,120,50,6);c.fill();c.fillStyle='#d9d9d9';for(let k=0;k<4;k++)c.fillRect(x-52+k*28,202,20,16);
    c.fillStyle='#333';c.beginPath();c.arc(x-40,246,7,0,7);c.arc(x+40,246,7,0,7);c.fill()}},
  {k:'birds',w:1.5,pace:1.6,draw:(c,x,t,w)=>{c.strokeStyle='#6f6f6f';c.lineWidth=2;for(let k=0;k<3;k++){const bx=x-k*22,by=72+k*9+Math.sin(t*3+k)*4,f=Math.sin(t*9+k)*3;
    c.beginPath();c.moveTo(bx-6,by);c.lineTo(bx,by-3+f);c.lineTo(bx+6,by);c.stroke()}}},
  {k:'bill',w:0.8,pace:1.3,draw:(c,x,t,w)=>bill(c,x,215+Math.sin(t*2.5)*18,t*2)},
  // the rung's own
  {k:'agent',w:0,when:()=>isLandlord()||G.rung==='billionaire'&&homesOwned()?1.5:0,draw:(c,x,t,w)=>{person(c,x,250,{pose:'walk',t:t*1.6,col:'#333'});c.fillStyle='#f4f4f4';c.fillRect(x+8,200,14,18);c.fillStyle='#999';c.fillRect(x+8,200,14,3)}},
  {k:'rider',w:0,pace:2.4,when:()=>isShop()||isWaiter()?2:0,draw:(c,x,t,w)=>{bike(c,x,250,t,w.col);c.fillStyle='#c0392b';c.fillRect(x-26,196,20,18);txt(c,'EATS',x-16,209,8,'#fff',800)}},
  {k:'leafleter',w:0,when:()=>isActivist()||isUnion()?2.5:0,draw:(c,x,t,w)=>{person(c,x,250,{pose:'give',col:w.col});letter(c,x+30,206,isUnion()?'JOIN':'VOTE')}},
  {k:'police',w:0,pace:3,when:()=>G.unrest>=70?2:0,draw:(c,x,t,w)=>{c.fillStyle='#e9e9e9';c.beginPath();c.roundRect(x-40,214,80,30,6);c.fill();c.fillStyle='#3b5bdb';c.fillRect(x-40,222,80,7);c.fillStyle=(Math.floor(t*6)%2)?'#3b5bdb':'#d33';c.fillRect(x-8,206,16,6);
    c.fillStyle='#333';c.beginPath();c.arc(x-26,246,6,0,7);c.arc(x+26,246,6,0,7);c.fill()}},
  {k:'removal',w:0,pace:2.6,when:()=>R.recent.evicted||G.res.some(r=>r.homeless)?1.5:0,draw:(c,x,t,w)=>truck(c,x,250,'MOVING')},
  {k:'motorcade',w:0,pace:3,when:()=>isGovernor()||isPresident()?1.2:0,draw:(c,x,t,w)=>{for(let k=0;k<2;k++){c.fillStyle='#222';c.beginPath();c.roundRect(x-40+k*90,216,76,28,6);c.fill();c.fillStyle='#555';c.fillRect(x-30+k*90,220,56,10);c.fillStyle='#111';c.beginPath();c.arc(x-26+k*90,246,6,0,7);c.arc(x+22+k*90,246,6,0,7);c.fill()}}},
];
function walker(k,prev){
  const sc=SCENES[k];if(sc&&sc.nowalk||R.calm)return null;
  // (the one the camera brought walks on from the left edge, and sometimes off before the scene ends)
  if(prev)return Object.assign({},prev,{x0:AL,x1:Math.random()<0.4?PW+60:AR}); // cosmetic
  if(Math.random()>0.65)return null; // cosmetic
  const pool=WALKERS.map(w=>[w,w.when?w.when():w.w]);let r=Math.random()*pool.reduce((a,x)=>a+x[1],0),kind=WALKERS[0]; // cosmetic
  for(const [w,v] of pool){r-=v;if(r<=0){kind=w;break}}
  const col=['#555','#444','#666'][Math.floor(Math.random()*3)],n=Math.floor(Math.random()*4); // cosmetic
  // on foot at the camera's pace: in from the left (from somewhere further off, so the panes' walkers aren't twins) to the
  // far edge, where the camera picks them up; the quick ones cross either way and are gone
  if(!kind.pace)return {kind:kind.k,col,n,x0:-40-Math.random()*140,x1:AR}; // cosmetic
  const left=kind.k==='birds'||Math.random()<0.6; // cosmetic
  return {kind:kind.k,col,n,pace:kind.pace,dir:left?1:-1,x0:left?-80:PW+80,x1:left?PW+80:-80};
}
const walkerX=(w,u)=>w.x0+(w.x1-w.x0)*u*(w.pace||1);
function advanceStage(dt){
  const st=R.stage;st.t=st.t||0;
  for(const side of ['you','town'])if(!st[side]){const n=nextScene(side);st[side]=Object.assign(n,{walk:walker(n.k)})}
  if(st.tr){st.tr.u+=dt/TR;
    if(st.tr.u>=1){R.world=(R.world||0)+st.tr.off;for(const side of ['you','town']){const s=st[side];st[side]=Object.assign(s.to,{walk:walker(s.to.k,s.walk&&s.walk.x1===AR?s.walk:null)})}st.dusk=st.duskNext;st.tr=null;st.t=0}
    return}
  st.t+=dt;
  if(st.t>=SCENE_SECS||st.you.next||st.town.next){
    for(const side of ['you','town']){const s=st[side],n=s.next||nextScene(side);s.next=null;s.to={k:n.k,d:n.d||{}}}
    st.tr={u:0,t0:st.t,from:(R.calm?0:DRIFT)*st.t,off:STEP};st.duskNext=Math.random()<0.15; // cosmetic
  }
}
function drawScene(c,s,t){const sc=SCENES[s.k]||SCENES.chain;try{sc.draw(c,t,s.d||{})}catch(e){}}
function drawWalker(c,w,x,t){const k=WALKERS.find(k=>k.k===w.kind)||WALKERS[0];if(w.dir<0){c.save();c.translate(x,0);c.scale(-1,1);k.draw(c,0,t,w);c.restore()}else k.draw(c,x,t,w)}
// the far town behind every scene: rooftops, chimneys and trees, drawn faint and panned slower than the scene, so the
// camera seems to travel through one long town rather than cut between pictures
function skyline(c,x0){
  c.fillStyle='rgba(150,138,118,.13)';
  const W=900,start=Math.floor(x0/W)-1;
  for(let n=start;n<start+3;n++){const bx=n*W-x0;
    for(let k=0;k<12;k++){const r=((n*12+k)*2654435761>>>0)%1000/1000,w=50+r*40,h=40+((r*7)%1)*70,x=bx+k*75;
      if(r<0.3){c.beginPath();c.arc(x+30,214-h*0.4,22+r*20,0,7);c.fill();c.fillRect(x+27,214-h*0.4,6,h*0.4+40)}
      else{c.fillRect(x,250-h-36,w,h+36);if(r>0.7)c.fillRect(x+w*0.6,250-h-52,8,18);
        if(r>0.5&&r<0.7){c.beginPath();c.moveTo(x-4,250-h-36);c.lineTo(x+w/2,250-h-60);c.lineTo(x+w+4,250-h-36);c.fill()}}}}
}
// a scene's caption, sized to stay readable on a phone; it belongs to its scene, so it slides along with it
function caption(c,text,dx){
  text=townText(text);const k=V.k/V.dpr,t=text.length>64?text.slice(0,62)+'\u2026':text;
  // as large as a phone needs, but never wider than the pane
  let size=Math.max(13,Math.min(19,12.5/k));c.font='700 '+size+'px Inter,system-ui,sans-serif';const w=c.measureText(t).width;if(w>PW-24)size*=(PW-24)/w;
  const h=Math.max(26,size*2.2);
  c.save();c.translate(dx||0,0);
  c.fillStyle='rgba(251,249,245,.86)';c.fillRect(-STEP+PW,PH-h,STEP,h);
  txt(c,t,PW/2,PH-h/2+size*0.36,size,'#24211c',700);c.restore();
}
function drawMap(dt){
  if(!V.panes.length)fitMap();
  const c=ctx;
  c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cv.width,cv.height);
  advanceStage(dt);const st=R.stage;
  for(const side of ['you','town']){
    const s=st[side];
    const [ox,oy]=V.panes[side==='you'?0:1];
    const ct=V.ct||0;c.setTransform(V.k,0,0,V.k,ox,oy-ct*V.k);
    // the pane: a soft shadow under it, then everything clipped to its rounded corners
    c.save();c.shadowColor='rgba(40,30,10,.22)';c.shadowBlur=18;c.shadowOffsetY=6;c.fillStyle='#ece6db';c.beginPath();c.roundRect(0,ct,PW,PH-ct,14);c.fill();c.restore();
    c.save();c.beginPath();c.roundRect(0,ct,PW,PH-ct,14);c.clip();
    const u=st.tr?ease(Math.min(1,st.tr.u)):0,cam=st.tr?st.tr.from+(st.tr.off-st.tr.from)*u:(R.calm?0:DRIFT)*st.t,world=(R.world||0)+cam+(side==='town'?400:0);
    const se=season(),g=c.createLinearGradient(0,0,0,250);g.addColorStop(0,mix('#edeff3','#f9f3e6',se));g.addColorStop(1,mix('#d9dde3','#e6dcc9',se));c.fillStyle=g;c.fillRect(0,0,PW,PH);
    // a warm light that drifts a little with the camera
    const lx=PW*0.5-((world*0.08)%120)+60,glow=c.createRadialGradient(lx,90,10,lx,90,300);glow.addColorStop(0,'rgba(255,236,196,'+(0.2+0.4*se).toFixed(2)+')');glow.addColorStop(1,'rgba(255,236,196,0)');c.fillStyle=glow;c.fillRect(0,0,PW,PH);
    skyline(c,world*0.35);
    if(st.dusk&&!st.tr)dusk(c,world);
    ground(c);
    let cap,capNext=null;
    if(st.tr){
      // the passer-by is carried along to the near edge of the next scene, behind both as they go by
      if(s.walk&&s.walk.x1===AR){const x0=walkerX(s.walk,Math.min(1,st.tr.t0/SCENE_SECS));drawWalker(c,s.walk,x0+(AL-x0)*u,st.tr.t0+st.tr.u*TR)}
      c.save();c.translate(-cam,0);drawScene(c,s,Math.min(1,(st.tr.t0+st.tr.u*TR)/SCENE_SECS));c.restore();
      c.save();c.translate(st.tr.off-cam,0);drawScene(c,s.to,0);c.restore();
      cap=(SCENES[s.k]||SCENES.chain).cap(s.d||{});capNext=(SCENES[s.to.k]||SCENES.chain).cap(s.to.d||{});
    }else{
      if(s.walk)drawWalker(c,s.walk,walkerX(s.walk,Math.min(1,st.t/SCENE_SECS)),st.t);
      c.save();c.translate(-cam,0);drawScene(c,s,Math.min(1,st.t/SCENE_SECS));c.restore();
      cap=(SCENES[s.k]||SCENES.chain).cap(s.d||{});
    }
    // haze at both edges: scenes drift in and out of it rather than off a hard edge
    snow(c,dt);rain(c,dt);
    for(const [x0,x1] of [[0,26],[PW,PW-26]]){const h=c.createLinearGradient(x0,0,x1,0);h.addColorStop(0,'rgba(236,230,219,.8)');h.addColorStop(1,'rgba(236,230,219,0)');c.fillStyle=h;c.fillRect(Math.min(x0,x1),0,26,PH)}
    // the pane's label, as a small pill
    const lab=side==='you'?'YOU':'THE TOWN';c.font='800 11px Inter,system-ui,sans-serif';const lw=c.measureText(lab).width+16;
    c.fillStyle=side==='you'?'rgba(28,27,24,.82)':'rgba(60,138,80,.9)';c.beginPath();c.roundRect(10,ct+10,lw,20,10);c.fill();txt(c,lab,10+lw/2,ct+24,11,'#fff',800);
    if(capNext){caption(c,cap,-(cam-st.tr.from));caption(c,capNext,st.tr.off-cam)}else caption(c,cap,0);
    c.restore();
  }
  confettiFall(c,dt);
}
// a shower of paper over the whole stage for a new achievement, gone in about three seconds
function confettiFall(c,dt){
  const ps=R.confetti;if(!ps||!ps.length)return;
  c.setTransform(V.dpr,0,0,V.dpr,0,0);const W=cv.width/V.dpr,H=cv.height/V.dpr;
  for(const p of ps){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=0.12*dt;p.r+=dt*4;
    c.save();c.globalAlpha=Math.max(0,Math.min(1,3-p.t));c.translate(p.x*W,p.y*H);c.rotate(p.r);c.fillStyle=p.c;c.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);c.restore()}
  R.confetti=ps.filter(p=>p.t<3&&p.y<1.1);
}
