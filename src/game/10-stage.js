/* ================= the stage ================= */
// Two scenes side by side (stacked on a phone held upright), in the video's style: grey ground, black pictogram people
// and green money. On the left, you: what you're doing, or what you just decided. On the right, the town: the
// consequences, picked from how the town is doing (or the one your last decision caused). Each scene loops for
// SCENE_SECS of real time, whatever the game speed; drawing never touches the game state.
const $=s=>document.querySelector(s);
const cv=$('#cv'),ctx=cv.getContext('2d');
const PW=480,PH=300,SCENE_SECS=6;
const V={k:1,dpr:1,panes:[]};
const INK='#151515',GREY='#8b8b8b',GREEN='#4c9a5d',GREEN2='#5aa86b',RED='#b23a3a';
function fitMap(){
  const r=cv.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
  cv.width=Math.round(r.width*dpr);cv.height=Math.round(r.height*dpr);V.dpr=dpr;
  const gap=10*dpr;
  // two panes, each PW×PH scaled to fit, one above the other or side by side: whichever shows them bigger
  const kTall=Math.min(cv.width/PW,(cv.height-gap)/(2*PH)),kWide=Math.min((cv.width-gap)/(2*PW),cv.height/PH);
  const tall=kTall>=kWide,k=tall?kTall:kWide;
  const w=PW*k,h=PH*k;V.k=k;
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
function txt(c,t,x,y,size,col,weight,align){c.font=(weight||600)+' '+size+'px system-ui,sans-serif';c.fillStyle=col||'#444';c.textAlign=align||'center';c.fillText(t,x,y)}
function bill(c,x,y,r,a){c.save();c.translate(x,y);c.rotate(r||0);c.globalAlpha=a??1;c.fillStyle=GREEN2;c.fillRect(-9,-4.5,18,9);c.fillStyle='rgba(255,255,255,.6)';c.fillRect(-2.5,-2,5,4);c.restore()}
// a bill flying from (x0,y0) to (x1,y1) over u in [0,1], arcing up
function flyBill(c,x0,y0,x1,y1,u,lift){if(u<0||u>1)return;const x=x0+(x1-x0)*u,y=y0+(y1-y0)*u-Math.sin(u*Math.PI)*(lift??40);bill(c,x,y,u*4,Math.min(1,(1-u)*5))}
function stack(c,x,y,n){for(let i=0;i<n;i++){c.fillStyle=i%2?GREEN2:GREEN;c.fillRect(x-16,y-4-i*4,32,4)}}
function ground(c){c.fillStyle='#d2d2d2';c.fillRect(0,250,PW,50)}
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
function tent(c,x,y){c.fillStyle='#7a7a7a';c.beginPath();c.moveTo(x-30,y);c.lineTo(x,y-38);c.lineTo(x+30,y);c.fill();c.fillStyle='#5e5e5e';c.beginPath();c.moveTo(x-6,y);c.lineTo(x,y-14);c.lineTo(x+6,y);c.fill()}
function tree(c,x,y){c.fillStyle='#8a8a8a';c.fillRect(x-3,y-40,6,40);c.fillStyle='#a9b5a9';c.beginPath();c.arc(x,y-52,20,0,7);c.fill()}
function truck(c,x,y,label){c.fillStyle='#8a8a8a';c.fillRect(x-60,y-56,84,46);c.fillStyle='#6d6d6d';c.fillRect(x+24,y-40,30,30);c.fillStyle='#d9d9d9';c.fillRect(x+30,y-36,16,12);
  c.fillStyle='#333';c.beginPath();c.arc(x-40,y-8,8,0,7);c.arc(x+36,y-8,8,0,7);c.fill();if(label)txt(c,label,x-18,y-28,11,'#fff',800)}
function counter(c,x,y,label){c.fillStyle='#2b2b2b';c.fillRect(x-36,y-44,72,44);c.fillStyle='#555';c.fillRect(x+2,y-62,26,18);if(label)txt(c,label,x,y-18,11,'#fff',800)}
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
  meeting:{cap:()=>'You sit down with the tenants’ union',draw(c){
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
    const pts=[[110,180],[220,180],[350,180],[430,175]];for(let k=0;k<5;k++){const u=loopT(t*1.2+k/5,1),seg=Math.floor(u*3),f=u*3-seg;flyBill(c,pts[seg][0],pts[seg][1],pts[seg+1][0],pts[seg+1][1],f,30)}
    if(leak>0.25)for(let k=0;k<2;k++)flyBill(c,130,180,PW+30,120,loopT(t+k/2,1),20)}},
  evicted:{cap:()=>(R.recent.evicted?R.recent.evicted+'\u2019s family':'A family')+' is put out on the street',draw(c,t){
    house(c,140,250,{sign:'EVICTED'});const u=t*0.8;person(c,260+u*60,250,{pose:'box',t:t*4});person(c,300+u*60,250,{pose:'walk',t:t*4,s:0.62})}},
  tents:{cap:()=>{const n=G.res.filter(r=>r.homeless).length;return n?n*HH+' households sleeping in the park':'The park'},draw(c){
    tree(c,60,250);tree(c,430,250);const n=Math.max(1,G.res.filter(r=>r.homeless).length);
    for(let k=0;k<Math.min(6,n);k++){tent(c,120+k*55,250)}person(c,140,250,{pose:'slump',col:'#555'});person(c,300,250,{pose:'slump',col:'#555',dir:-1})}},
  closed:{cap:()=>{const n=R.recent.closed||(G.shops.find(s=>!s.open)||{}).name;return n?'The '+n+' has closed':'A shop closes'},draw(c,t){
    const s=G.shops.find(s=>s.name===R.recent.closed)||G.shops.find(s=>!s.open);shop(c,220,250,(s?s.name:'SHOP').toUpperCase(),{shutter:Math.min(1,t*1.6)});person(c,330+Math.max(0,t-0.6)*300,250,{pose:t>0.6?'slump':'stand',col:'#444'})}},
  laidoff:{cap:()=>{const n=jobless().length;return (R.recent.laidoff?R.recent.laidoff+' is out of work':'Jobs are cut')+(n?'. '+n*HH+' households without a job':'')},draw(c,t){
    const s=G.shops.find(s=>s.ownedByYou&&s.open);shop(c,140,250,(s?s.name:'SHOP').toUpperCase(),{awn:GREEN});person(c,230+t*200,250,{pose:'box',t:t*5})}},
  strike:{cap:()=>isLandlord()?'Rent strike':'Strike at your shops',draw(c,t){
    shop(c,120,250,'STRIKE',{awn:GREEN});for(let k=0;k<4;k++){const x=210+((k*60+t*120)%240);person(c,x,250,{pose:'sign',march:true,t:t*4+k,text:'STRIKE'})}}},
  protest:{cap:()=>'The town marches against you',draw(c,t){
    const words=isLandlord()?['RENT','FAIR','HOMES','RENT','FIX IT','FAIR']:['TAX','FAIR','PAY','TAX US','RENT','FAIR'];
    for(let k=0;k<6;k++){const x=((k*80+t*160)%(PW+80))-40;person(c,x,250,{pose:'sign',march:true,t:t*4+k*0.3,text:words[k],col:k%2?'#333':INK})}}},
  nursery:{cap:()=>'Childcare: parents work full time',draw(c,t){
    building(c,330,250,'NURSERY',130);const u=Math.min(1,t*1.6);person(c,60+u*180,250,{pose:'walk',t:t*5});if(u<1)person(c,90+u*180,250,{pose:'walk',t:t*5,s:0.62});
    else person(c,250-(t-0.62)*500,250,{pose:'walk',t:t*5,dir:-1})}},
  medical:{cap:()=>G.gifts.medical?'Medical debt, wiped as it arrives':(G.res.filter(r=>r.debt>0).length*HH)+' households paying off medical bills',draw(c,t){
    person(c,200,250,{pose:G.gifts.medical?'raise':'slump',col:'#333'});c.fillStyle='#f6f6f6';const h=G.gifts.medical?Math.max(0,60-t*120):60+t*40;c.fillRect(220,250-h-60,36,h);
    txt(c,G.gifts.medical?'PAID':'BILL',238,175,11,G.gifts.medical?GREEN:RED,800);if(G.gifts.medical)for(let k=0;k<3;k++)flyBill(c,PW+10,80,240,170,loopT(t+k/3,1),20)}},
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
  shelter:{cap:()=>'Everyone evicted gets a bed',draw(c,t){building(c,320,250,'SHELTER',140);person(c,80+Math.min(1,t*1.5)*220,250,{pose:'box',t:t*5,col:'#444'})}},
};
// what a gift looks like on the town's side
const GIFT_SCENE={medical:'medical',shelter:'shelter',childcare:'nursery',vouchers:'chain',poverty:'chain'};

// the right-hand scene: the town's most pressing story, weighted by how pressing it is
function pickTownScene(){
  const people=G.res.filter(r=>r.role!=='landlord'),rough=people.filter(r=>r.homeless).length,w=[['chain',2+(G.unrest<30?2:0)]];
  if(rough)w.push(['tents',2+rough]);
  if(G.shops.some(s=>!s.open))w.push(['closed',2]);
  if(G.unrest>=55)w.push(['protest',3]);
  if(G.unrest>=70&&(shopsOwned()||isLandlord()))w.push(['strike',3]);
  if(G.gifts.childcare)w.push(['nursery',1.5]);
  if(people.some(r=>r.debt>0)||G.gifts.medical)w.push(['medical',1.2]);
  if(G.workshops.length)w.push(['workshop',1]);
  if(jobless().length>=3)w.push(['laidoff',1.5]);
  if(G.fund>0)w.push(['works',1.5]);
  if(people.some(r=>r.sheltered))w.push(['shelter',1]);
  if(isLandlord()&&G.ll.cond<0.5)w.push(['damp',2]);
  if(homesOwned()||isLandlord()||isPartner())w.push(['rentrise',1]);
  w.push(['megastore',0.6]);if(G.unrest<30)w.push(['calm',1]);
  let r=Math.random()*w.reduce((a,x)=>a+x[1],0); // cosmetic
  for(const [k,v] of w){r-=v;if(r<=0)return k}return 'chain';
}
const idleScene=()=>isShop()?'cafe':isPartner()?'office':isLandlord()?'rentbook':'desk';
// what an ending looks like, on each side
const endingScene=()=>({hero:'cheer',luthor:'bunker',revolt:'mob',fair:'cheer',rentier:'rentbook',bankrupt:'repo',hiredgun:'loophole',counsel:'court',burnout:'weekend',pillar:'cafe',tightfisted:'cafe',closed:'closed',sold:'handshake',founder:'ribbon'})[G.ending.kind]||idleScene();
const endingTown=()=>({hero:'chain',luthor:'tents',revolt:'protest',fair:'calm',rentier:'rentrise',bankrupt:'evicted',hiredgun:'rentrise',counsel:'chain',burnout:'calm',pillar:'chain',tightfisted:'rentrise',closed:'laidoff',sold:'laidoff',founder:'megastore'})[G.ending.kind]||'chain';
// a decision plays its scene on your side and its consequence on the town's, ahead of anything else
function queueScenes(you,town,d){
  if(you)R.stage.you={k:you,t:0,d};
  if(town)R.stage.town={k:town.startsWith('gift-')?GIFT_SCENE[town.slice(5)]:town,t:0,d};
}
function drawMap(dt){
  if(!V.panes.length)fitMap();
  const c=ctx,st=R.stage;
  c.setTransform(1,0,0,1,0,0);c.fillStyle='#bdbdbd';c.fillRect(0,0,cv.width,cv.height);
  for(const side of ['you','town']){
    let s=st[side];
    if(!s||s.t>=SCENE_SECS){
      const town=R.townQ.length?R.townQ.shift():pickTownScene();
      s=st[side]={k:side==='you'?(G.ending?endingScene():idleScene()):(G.ending?endingTown():town),t:0,d:{}}}
    s.t+=dt;
    const [ox,oy]=V.panes[side==='you'?0:1];
    c.setTransform(V.k,0,0,V.k,ox,oy);
    c.save();c.beginPath();c.roundRect(0,0,PW,PH,10);c.clip();
    const g=c.createRadialGradient(PW/2,PH/2,40,PW/2,PH/2,PW*0.7);g.addColorStop(0,'#ececec');g.addColorStop(1,'#c4c4c4');c.fillStyle=g;c.fillRect(0,0,PW,PH);
    ground(c);
    const sc=SCENES[s.k]||SCENES.chain;
    try{sc.draw(c,Math.min(1,s.t/SCENE_SECS),s.d||{})}catch(e){}
    txt(c,side==='you'?'YOU':'THE TOWN',14,22,11,'#888',800,'left');
    const cap=sc.cap(s.d||{});c.fillStyle='rgba(255,255,255,.75)';c.fillRect(0,PH-30,PW,30);txt(c,cap.length>64?cap.slice(0,62)+'…':cap,PW/2,PH-11,13,'#222',700);
    c.restore();
  }
}
