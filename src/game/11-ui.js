/* ================= panels ================= */
// The top bar (fortune, age, speed, the town's meters), the bottom sheet's tabs, the tax vote and the endings.
const SPEEDS=[0,1,2,4,8];
function buildChrome(){
  $('#speed').innerHTML=SPEEDS.map(s=>`<button data-s="${s}" aria-label="${s?s+' times speed':'Pause'}">${s?s+'×':'❚❚'}</button>`).join('');
  $('#speed').onclick=e=>{const b=e.target.closest('button');if(b){G.speed=+b.dataset.s;refreshTop()}};
  buildTabs();
  $('#tabs').onclick=e=>{const b=e.target.closest('button');if(b){R.tab=b.dataset.t;renderPane(true)}};
  $('#pane').onclick=onPaneClick;
}
// each rung has its own tabs; the Town tab is the same on all of them
function buildTabs(){
  const tabs=isLandlord()?[['homes','Homes'],['tenants','Tenants'],['books','Books'],['town','Town']]:[['moves','Moves'],['gifts','Gifts'],['fortune','Fortune'],['town','Town']];
  if(!tabs.some(t=>t[0]===R.tab))R.tab=tabs[0][0];
  $('#tabs').innerHTML=tabs.map(([k,n])=>`<button data-t="${k}">${n}</button>`).join('');
}
function refreshTop(){
  if(isLandlord())return refreshTopLandlord();
  $('#nw').textContent=money(netWorth());
  const last=G.history.at(-1),given=last?last.given:0;
  $('#growth').innerHTML=`growing <b>${Math.round(G.rate*100)}%</b> a year`+(given>0?` · gave ${money(given)} last year`:'');
  $('#clock').innerHTML=`<b>Age ${age()}</b><br>Year ${yearNo()} of 40`;
  for(const b of $('#speed').children)b.classList.toggle('on',+b.dataset.s===G.speed);
  const u=G.unrest,lv=unrestLevel(u);
  $('#unrestT').textContent=lv[0].toUpperCase()+lv.slice(1);
  const ub=$('#unrestB');ub.style.width=Math.min(100,u)+'%';ub.style.background=u>=70?'var(--red)':u>=55?'var(--amber)':u>=30?'#c9a227':'var(--green)';
  $('#meters').children[1].firstChild.textContent='Jobs ';$('#meters').children[2].firstChild.textContent='Town spends ';
  const work=G.res.filter(r=>r.role==='worker'||r.role==='owner');
  $('#jobsT').textContent=work.filter(r=>r.role==='owner'||r.job!=null).length+' of '+work.length;
  $('#spendT').textContent=money(weeklySpend()*WEEKS)+'/yr';
}
const weeklySpend=()=>G.res.reduce((a,r)=>a+r.spent,0);

let paneKey='';
function renderPane(force){
  for(const b of $('#tabs').children)b.classList.toggle('on',b.dataset.t===R.tab);
  const html=PANES[R.tab]();
  if(force||html!==paneKey){paneKey=html;$('#pane').innerHTML=html;if(R.tab==='fortune')drawChart()}
}
const PANES={
  moves(){
    return `<p class="lead">Your fortune earns ${Math.round(G.rate*100)}% a year on its own. These make it grow faster, mostly at the town's cost.</p>`+
      MOVES.map(m=>{const p=movePrice(m.k),ok=canMove(m.k);
        const done=m.k==='homes'&&!G.res.some(r=>r.homeOwner==='local')?'You own every home':m.k==='rival'&&!rivalTarget()?'No shop left to buy':m.k==='build'&&G.workshops.length>=T.maxWorkshops?'All three built':'';
        const own=m.k==='homes'?homesOwned()+' of 19 owned':m.k==='rival'?shopsOwned()+' of 4 owned':G.workshops.length+' of 3 built';
        return `<div class="card"><div class="txt"><b>${m.name}</b><small>${m.note}</small><small>${own}</small></div>`+
          (done?`<small>${done}</small>`:`<button class="act" data-move="${m.k}" ${ok?'':'disabled'}>${money(p)}</button>`)+`</div>`}).join('');
  },
  gifts(){
    const cost=giftCosts(),last=G.history.at(-1);
    let s=`<p class="lead">Gifts come out of your fortune every week while they're on. The town spends them, so they keep moving.</p>`;
    s+=GIFTS.map(g=>`<div class="card"><div class="txt"><b>${g.name}</b><small>${g.note}</small><small class="real">${g.real}</small>`+
      (G.gifts[g.k]&&cost[g.k]?`<small>Cost you ${money(cost[g.k])} last year</small>`:'')+
      `</div><button class="toggle ${G.gifts[g.k]?'on':''}" data-gift="${g.k}" aria-label="${g.name}" aria-pressed="${G.gifts[g.k]}"></button></div>`).join('');
    if(last){const kept=last.nw-(G.history.at(-2)?.nw??START_FORTUNE);
      s+=`<div class="sum">Last year you gave <b>${money(last.given)}</b>. Your fortune still ${kept>=0?'grew by <b>'+money(kept)+'</b>':'shrank by <b>'+money(-kept)+'</b>'}.</div>`}
    return s;
  },
  fortune(){
    const share=G.gains>0?Math.round(G.given/G.gains*100):0;
    return `<p class="lead">Each bar is a year of your fortune. The darker strip under it is what you gave away.</p><canvas id="chart"></canvas>
      <div class="stats" style="margin-top:8px"><div>Worth now<b>${money(netWorth())}</b></div><div>Invested<b>${money(G.cash)}</b></div>
      <div>Homes owned<b>${homesOwned()}</b></div><div>Shops owned<b>${shopsOwned()}</b></div>
      <div>Given so far<b>${money(G.given)}</b></div><div>Share of gains<b>${share}%</b></div>
      <div>Taxes paid<b>${money(G.taxPaid)}</b></div><div>Next tax vote<b>${G.nextTax>G.week?'year '+(Math.floor(G.nextTax/WEEKS)+1):'now'}</b></div></div>`;
  },
  town(){
    const people=G.res.filter(r=>r.role!=='landlord'),last=G.history.at(-1);
    const rough=people.filter(r=>r.homeless).length,poor=Math.round((R.parts?.poor||0)*people.length);
    const rent=people.filter(r=>r.homeOwner!=='self'&&!r.homeless).reduce((a,r)=>a+r.rent,0)/Math.max(1,people.filter(r=>!r.homeless).length);
    return `<p class="lead">Each figure is ${HH} households. Tap one on the map to see how they're doing.</p>
      <div class="stats"><div>Out of work<b>${jobless().length}</b></div><div>Sleeping rough<b>${rough}</b></div>
      <div>Below the poverty line<b>${poor}</b></div><div>Rent a week<b>${money(rent/HH)}</b></div>
      <div>Spent at the megastore<b>${last?money(last.mega)+'/yr':'–'}</b></div><div>Rent and profit to you<b>${last?money(last.toYou)+'/yr':'–'}</b></div>
      <div>A dollar changes hands<b>${last?last.vel.toFixed(0)+'× a year':'–'}</b></div><div>Unrest<b>${Math.round(G.unrest)} of 100</b></div></div>
      <div style="margin-top:10px">${G.shops.map((s,i)=>`<div class="card"><div class="txt"><b>${s.name}</b><small>${!s.open?'Closed':s.ownedByYou?'Yours · '+staffOf(i).length+' staff':'Run by '+G.res[s.owner].name+' · '+staffOf(i).length+' staff'}</small></div></div>`).join('')}</div>`;
  },
};
function onPaneClick(e){
  const m=e.target.closest('[data-move]'),g=e.target.closest('[data-gift]');
  if(m){doMove(m.dataset.move);save();renderPane(true);refreshTop()}
  if(g){setGift(g.dataset.gift,!G.gifts[g.dataset.gift]);save();renderPane(true)}
}
// the fortune chart: a green bar a year, like the video's stacked money
function drawChart(){
  const el=$('#chart');if(!el)return;const r=el.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);
  el.width=r.width*d;el.height=r.height*d;const c=el.getContext('2d');c.scale(d,d);
  const h=G.history,W=r.width,H=r.height-18,n=40,bw=W/n;
  const max=Math.max(START_FORTUNE*1.2,...h.map(y=>y.nw),netWorth());
  c.fillStyle='#888';c.font='11px system-ui';c.textAlign='left';c.fillText(money(max),2,10);
  h.concat([{nw:netWorth(),given:G.year.given}]).forEach((y,i)=>{
    const bh=Math.max(1,(Math.max(0,y.nw)/max)*(H-14)),x=i*bw;
    for(let k=0;k<bh;k+=4){c.fillStyle=k%8?'#5aa86b':'#4c9a5d';c.fillRect(x+1,H-k-3,bw-2,3)}
    if(y.given>0){c.fillStyle='#235f33';c.fillRect(x+1,H+2,bw-2,Math.min(12,2+y.given/max*400))}
  });
  c.fillStyle='#666';c.textAlign='center';c.fillText('age 40',bw*2,H+16);c.fillText('80',W-bw,H+16);
}

// the tax vote, the first-time card and the endings use one modal
function showModal(html){$('#box').innerHTML=html;$('#modal').classList.add('show')}
function hideModal(){$('#modal').classList.remove('show')}
function showTax(){
  const t=G.tax,nw=netWorth();
  showModal(`<h2>The town votes on a wealth tax</h2><p>A one-off ${Math.round(T.taxRate*100)}% of your fortune, spent on public works.</p>
    <div class="big">${money(t.amount)}</div><p>At ${Math.round(G.rate*100)}% a year you'd earn it back in about <b>${t.payback<1?Math.round(t.payback*12)+' months':t.payback.toFixed(1)+' years'}</b>.</p>
    <div class="opts"><button class="main" data-tax="pay"><b>Pay it</b><small>The town hires people and spends it. Unrest falls.</small></button>
    <button data-tax="lobby"><b>Lobby against it · ${money(nw*T.lobbyCost)}</b><small>Usually works. The town notices who paid.</small></button>
    <button data-tax="move"><b>Move your money out of state · ${money(nw*T.moveCost)}</b><small>No tax at all. Unrest jumps.</small></button></div>`);
}
function showEnding(){
  if(G.ending.rung==='landlord')return showLandlordEnding();
  const e=G.ending,share=e.gains>0?Math.round(e.given/e.gains*100):0;
  const T0={hero:['Hero','The town fizzes with spending, and you die richer than you started.'],
    luthor:['Lex Luthor','You die in your bunker, very rich, over a grey and quiet town.'],
    revolt:['Revolt','The town has had enough. Signs fill the streets and your name is on them.']}[e.kind];
  showModal(`<h2>${T0[0]}</h2><p>${T0[1]}</p><div class="big">${money(e.nw)}</div>
    <p>Age ${40+Math.floor(e.week/WEEKS)}. You gave away ${money(e.given)}, ${share}% of everything you gained.</p>
    ${e.kind!=='hero'?`<p>The hero ending needs you to give at least ${Math.round(T.heroGiveShare*100)}% of your gains, keep unrest low, and still finish richer than $30M.</p>`:''}
    <div class="opts"><button class="main" data-rung="landlord"><b>Step down: the landlord</b><small>Play Agnes, in the town you leave behind</small></button>
    <button data-again="1"><b>Live another billionaire life</b><small>A new town and $30M</small></button></div>`);
}
function showIntro(){
  showModal(`<h2>Money Makes Money</h2><p>You have <b>$30 million</b>. It earns 8% a year while you do nothing.</p>
    <p>Below you is a town. Every dollar you lock away is a dollar that stops moving down there.</p>
    <p>Hoard and the town stalls. Spend and it comes alive, and you may find you're still getting richer.</p>
    <div class="opts"><button class="main" data-start="1"><b>Start</b><small>You're 40. You have 40 years.</small></button></div>`);
}
$('#box').addEventListener('click',e=>{
  const t=e.target.closest('[data-tax]'),a=e.target.closest('[data-again]'),s=e.target.closest('[data-start]');
  if(t){answerTax(t.dataset.tax);hideModal();save();renderPane(true)}
  if(a){newGame(Math.random()*4294967296);G.seen.intro=true;R.bills=[];hideModal();buildTabs();save();renderPane(true)} // cosmetic
  const g=e.target.closest('[data-rung]'),rr=e.target.closest('[data-replay]');
  if(g){startLandlord();R.bills=[];buildTabs();save();renderPane(true);showLandlordIntro()}
  if(rr){restartLandlord();R.bills=[];buildTabs();save();renderPane(true);showLandlordIntro()}
  if(s){G.seen.intro=true;if(isLandlord())G.seen.landlord=true;hideModal();save()}
});
// tapping the map shows who or what is there
function showTip(px,py){
  const id=hitTest(px,py),tip=$('#tip');R.sel=id;
  if(!id){tip.style.display='none';return}
  let h='';
  if(id[0]==='r'){const r=G.res[+id.slice(1)];
    const job=r.role==='landlord'?'Owns most of the homes':r.role==='retiree'?'Retired':r.role==='owner'?'Runs the '+G.shops[r.shop].name:r.job==='mill'?'Works at the mill':typeof r.job==='number'?'Works at the '+G.shops[r.job].name:r.job?'Works at your workshop':'Out of work';
    h=`<b>${r.name}</b><br>${job}<br>Earns ${money(r.income/HH)} a week`+(r.homeless?'<br>Sleeping rough':r.homeOwner==='self'?'':`<br>Rent ${money(r.rent/HH)} to ${r.homeOwner==='you'?'you':'Agnes'}`)+(r.debt>0?`<br>Medical debt ${money(r.debt/HH)}`:'')}
  else{const s=G.shops[+id.slice(1)];h=`<b>${s.name}</b><br>${!s.open?'Closed':s.ownedByYou?'Yours':'Run by '+G.res[s.owner].name}<br>Takes ${money(s.rev/HH)} a week per household`}
  tip.innerHTML=h;tip.style.display='block';
  const w=$('#mapwrap').getBoundingClientRect();
  tip.style.left=Math.min(w.width-230,Math.max(6,px-110))+'px';tip.style.top=Math.max(6,py-110)+'px';
}
function showToasts(){
  while(R.toasts.length){const t=R.toasts.shift();if(R.sim)continue;const d=document.createElement('div');d.className='toast';d.textContent=t.t;
    $('#toasts').appendChild(d);setTimeout(()=>d.remove(),4600);while($('#toasts').children.length>3)$('#toasts').firstChild.remove()}
}
