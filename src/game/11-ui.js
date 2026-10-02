/* ================= panels ================= */
// The top bar, the bottom sheet (its tabs, or the decision card waiting for an answer), and the cards that open and
// close each rung. Each rung has its own tabs: the billionaire's Fortune and Commitments, the landlord's Books and
// Tenants; Town and Story are shared.
const SPEEDS=[0,1,2,4,8];
function buildChrome(){
  $('#speed').innerHTML=SPEEDS.map(s=>`<button data-s="${s}" aria-label="${s?s+' times speed':'Pause'}">${s?s+'×':'❚❚'}</button>`).join('');
  $('#speed').onclick=e=>{const b=e.target.closest('button');if(b){G.speed=+b.dataset.s;refreshTop()}};
  buildTabs();
  $('#tabs').onclick=e=>{const b=e.target.closest('button');if(b&&!G.card){R.tab=b.dataset.t;renderPane(true)}};
  $('#pane').onclick=onPaneClick;
}
function buildTabs(){
  const tabs=isLandlord()?[['books','Books'],['tenants','Tenants'],['town','Town'],['story','Story']]:[['fortune','Fortune'],['commit','Commitments'],['town','Town'],['story','Story']];
  if(!tabs.some(t=>t[0]===R.tab))R.tab=tabs[0][0];
  $('#tabs').innerHTML=tabs.map(([k,n])=>`<button data-t="${k}">${n}</button>`).join('');
}
const weeklySpend=()=>G.res.reduce((a,r)=>a+r.spent,0);
function setMeter(i,label,value){const m=$('#meters').children[i];m.firstChild.textContent=label+' ';m.querySelector('b').textContent=value}
function refreshTop(){
  const u=G.unrest,lv=unrestLevel(u),last=G.history.at(-1);
  if(isLandlord()){
    $('#nw').textContent=money(equity());
    $('#growth').innerHTML=`rent roll <b>${money(rentRoll())}</b> a year · loan ${money(G.ll.loan)}`;
    $('#clock').innerHTML=`<b>Agnes, ${age()}</b><br>Year ${yearNo()} of ${LL.years}`;
    const mine=myHomes();setMeter(1,'Homes',mine.filter(r=>!r.homeless&&!r.sheltered).length+' of '+mine.length+' let');setMeter(2,'Repair',Math.round(G.ll.cond*100)+'% kept up');
  }else{
    $('#nw').textContent=money(netWorth());
    $('#growth').innerHTML=`growing <b>${rateText()}</b> a year`+(last&&last.given>0?` · gave ${money(last.given)} last year`:'');
    $('#clock').innerHTML=`<b>Age ${age()}</b><br>Year ${yearNo()} of 40`;
    const work=G.res.filter(r=>r.role==='worker'||r.role==='owner');
    setMeter(1,'Jobs',work.filter(r=>r.role==='owner'||r.job!=null).length+' of '+work.length);setMeter(2,'Town spends',money(weeklySpend()*WEEKS)+'/yr');
  }
  for(const b of $('#speed').children)b.classList.toggle('on',+b.dataset.s===G.speed);
  $('#unrestT').textContent=lv[0].toUpperCase()+lv.slice(1)+(isLandlord()&&u>=70?' · rent strike':'');
  const ub=$('#unrestB');ub.style.width=Math.min(100,u)+'%';ub.style.background=u>=70?'var(--red)':u>=55?'var(--amber)':u>=30?'#c9a227':'var(--green)';
}

let paneKey='';
function renderPane(force){
  $('#sheet').classList.toggle('deciding',!!G.card);
  for(const b of $('#tabs').children)b.classList.toggle('on',!G.card&&b.dataset.t===R.tab);
  const html=G.card?cardHTML():PANES[R.tab]();
  if(force||html!==paneKey){paneKey=html;$('#pane').innerHTML=html;$('#pane').scrollTop=0;if(R.tab==='fortune'||R.tab==='books')drawChart()}
}
// the decision card: what's happened, and each option's cost to you and to the town
function cardHTML(){
  const c=cardDef(G.card.id),d=G.card.d||{};
  return `<div class="decide"><div class="kicker">A decision · ${isLandlord()?'year '+yearNo():'age '+age()}</div><h3>${c.title(d)}</h3><p>${c.body(d)}</p>`+
    c.options(d).map(o=>`<button class="opt ${o.acct?'acct':''}" data-card="${o.k}"><b>${o.label}</b>${o.acct?'<em>Your accountant’s pick</em>':''}
      <span><i>You</i>${o.you}</span><span><i>Town</i>${o.town}</span></button>`).join('')+`</div>`;
}
const PANES={
  fortune(){
    const share=G.gains>0?Math.round(G.given/G.gains*100):0;
    return `<p class="lead">Each bar is a year of your fortune. The dark strip under it is what you gave away.</p><canvas id="chart"></canvas>
      <div class="stats" style="margin-top:8px"><div>Worth now<b>${money(netWorth())}</b></div><div>Invested<b>${money(G.cash)}</b></div>
      <div>Homes owned<b>${homesOwned()} of 19</b></div><div>Shops owned<b>${shopsOwned()} of 4</b></div>
      <div>Given so far<b>${money(G.given)}</b></div><div>Share of gains<b>${share}%</b></div>
      <div>Taxes paid<b>${money(G.taxPaid)}</b></div><div>Next tax vote<b>${G.ending?'–':G.nextTax>G.week?'age '+(START_AGE+Math.floor(G.nextTax/WEEKS)):'now'}</b></div></div>
      <p class="lead" style="margin-top:8px">A hero gives at least ${Math.round(T.heroGiveShare*100)}% of what they gain, keeps the town calm, and still dies richer than $30M.</p>`;
  },
  commit(){
    const seen=GIFTS.filter(g=>G.seenGifts[g.k]||G.gifts[g.k]),cost=giftCosts();
    let s=`<p class="lead">Gifts you've been asked for can be started or stopped here at any time. They come out of your fortune every week.</p>`;
    s+=seen.length?seen.map(g=>`<div class="card"><div class="txt"><b>${g.name}</b><small>${g.note}</small><small>${G.gifts[g.k]?(cost[g.k]?'Cost you '+money(cost[g.k])+' last year':'Started this year'):'About '+money(giftEstimate(g.k))+' a year'}</small><small class="real">${g.real}</small></div>
      <button class="toggle ${G.gifts[g.k]?'on':''}" data-gift="${g.k}" aria-label="${g.name}" aria-pressed="${G.gifts[g.k]}"></button></div>`).join(''):'<p class="lead">Nobody has asked you for anything yet.</p>';
    const own=[homesOwned()&&homesOwned()+' figures’ homes',shopsOwned()&&shopsOwned()+' shops',G.workshops.length&&G.workshops.length+' workshops'].filter(Boolean);
    if(own.length)s+=`<div class="sum">You own ${own.join(', ')}.</div>`;
    return s;
  },
  town(){
    if(!R.parts)unrestTarget();
    const people=G.res.filter(r=>r.role!=='landlord'),last=G.history.at(-1),rough=people.filter(r=>r.homeless).length,poor=Math.round((R.parts?.poor||0)*people.length);
    return `<p class="lead">The town is ${people.length*HH} households. Each line below counts groups of ${HH}.</p>
      <div class="stats"><div>Out of work<b>${jobless().length}</b></div><div>Sleeping rough<b>${rough}</b></div>
      <div>Below the poverty line<b>${poor}</b></div><div>Spent at the megastore<b>${last?money(last.mega)+'/yr':'–'}</b></div>
      <div>A dollar changes hands<b>${last?last.vel.toFixed(0)+'× a year':'–'}</b></div><div>Unrest<b>${Math.round(G.unrest)} of 100</b></div></div>
      <div style="margin-top:10px">${G.shops.map((s,i)=>`<div class="card"><div class="txt"><b>${s.name}</b><small>${!s.open?'Closed':s.ownedByYou?(isLandlord()?'The estate’s':'Yours')+' · '+staffOf(i).length+' staff':'Run by '+G.res[s.owner].name+' · '+staffOf(i).length+' staff'}</small></div></div>`).join('')}</div>`;
  },
  story(){
    const list=G.choices.slice().reverse().slice(0,30);
    return `<div class="card"><div class="txt"><b>Let your accountant decide</b><small>Every decision goes the way that makes the most money, without asking you.</small></div>
      <button class="toggle ${G.autoAcct?'on':''}" data-auto="1" aria-label="Let your accountant decide" aria-pressed="${G.autoAcct}"></button></div>`+
      (list.length?list.map(c=>`<div class="story"><small>${c.rung==='landlord'?'Landlord':'Age '+(START_AGE+Math.floor(c.week/WEEKS))}</small><b>${c.title}</b><span>${c.label}</span></div>`).join(''):'<p class="lead">Your decisions will be listed here.</p>');
  },
};
function onPaneClick(e){
  const k=e.target.closest('[data-card]'),g=e.target.closest('[data-gift]'),a=e.target.closest('[data-auto]');
  if(k&&G.card){answerCard(k.dataset.card);save();renderPane(true);refreshTop()}
  if(g){const on=!G.gifts[g.dataset.gift];setGift(g.dataset.gift,on);if(on)queueScenes('give','gift-'+g.dataset.gift,{title:'You fund: '+GIFTS.find(x=>x.k===g.dataset.gift).name.toLowerCase()});save();renderPane(true)}
  if(a){G.autoAcct=!G.autoAcct;save();renderPane(true)}
}
// a bar a year, like the video's stacked money: the fortune (or, as the landlord, your equity)
function drawChart(){
  const el=$('#chart');if(!el)return;const r=el.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);
  el.width=r.width*d;el.height=r.height*d;const c=el.getContext('2d');c.scale(d,d);
  const L=isLandlord(),n=L?LL.years+1:41,W=r.width,H=r.height-18,bw=W/n;
  const rows=L?G.ll.history.map(y=>({v:y.equity})).concat([{v:equity()}]):G.history.map(y=>({v:y.nw,g:y.given})).concat([{v:netWorth(),g:G.year.given}]);
  const max=Math.max(L?G.ll.startEquity:START_FORTUNE*1.2,...rows.map(y=>Math.abs(y.v)),1);
  c.fillStyle='#888';c.font='11px system-ui';c.textAlign='left';c.fillText(money(max),2,10);
  rows.forEach((y,i)=>{const bh=Math.max(1,(Math.max(0,y.v)/max)*(H-14));for(let k=0;k<bh;k+=4){c.fillStyle=k%8?'#5aa86b':'#4c9a5d';c.fillRect(i*bw+1,H-k-3,bw-2,3)}
    if(y.g>0){c.fillStyle='#235f33';c.fillRect(i*bw+1,H+2,bw-2,Math.min(12,2+y.g/max*400))}});
  if(L){const y0=H-(G.ll.startEquity/max)*(H-14);c.strokeStyle='#999';c.setLineDash([4,4]);c.beginPath();c.moveTo(0,y0);c.lineTo(W,y0);c.stroke();c.setLineDash([])}
  c.fillStyle='#666';c.textAlign='center';c.fillText(L?'year 1':'age 40',bw*2.5,H+16);c.fillText(L?'20':'80',W-bw,H+16);
}

// the cards that open and close a rung
// (an ending sits low, so its scene stays in view above it)
function showModal(html,low){$('#box').innerHTML=html;$('#modal').classList.toggle('low',!!low);$('#modal').classList.add('show')}
function hideModal(){$('#modal').classList.remove('show')}
function showIntro(){
  showModal(`<h2>Money Makes Money</h2><p>You have <b>$30 million</b>. It earns 8% a year while you do nothing.</p>
    <p>Every few months someone will want something from you: a deal, a donation, a vote. Your accountant will always say what pays best.</p>
    <p>On the left you'll see what you do. On the right, what it does to the town.</p>
    <div class="opts"><button class="main" data-start="1"><b>Start</b><small>You're 40. You have 40 years.</small></button></div>`);
}
function showLandlordIntro(){
  const from=G.ladder.from,mine=myHomes().length,estate=G.res.filter(r=>r.homeOwner==='you').length;
  const legacy={hero:'The billionaire died a hero, and its foundation still pays for its gifts.',luthor:'The billionaire died rich, and its gifts died with it.',
    revolt:'The town revolted against the billionaire, and it hasn’t calmed down.'}[from]||'';
  showModal(`<h2>Step down: the landlord</h2><p>You are Agnes. You own ${mine} of the town's 19 homes${estate?', and the billionaire’s estate owns '+estate:''}. ${legacy}</p>
    <p>Each year you set the rent. Tenants who fall behind, leaking roofs and offers from the estate will come to you as they happen.</p>
    <p>A fair landlord keeps rent under about a third of income, keeps the homes up and puts nobody on the street. The bank takes everything if you can't pay the loan.</p>
    <div class="opts"><button class="main" data-start="1"><b>Start</b><small>You have ${LL.years} years.</small></button></div>`);
}
function showEnding(){
  const e=G.ending;
  if(e.rung==='landlord'){
    const T0={fair:['A fair landlord','Rents your tenants could pay, homes kept up, and nobody on the street.'],
      rentier:['A rentier','You did well out of the town. The town did less well out of you.'],
      bankrupt:['Bankrupt','The bank has taken the homes. You fall to the bottom of the ladder.']}[e.kind];
    const next=e.kind==='bankrupt'?'Next: <b>Out of work</b>, the bottom rung. It isn’t built yet.':'Next rung: <b>Law firm partner</b>. It isn’t built yet.';
    return showModal(`<h2>${T0[0]}</h2><p>${T0[1]}</p><div class="big">${money(e.equity)}</div>
      <p>Equity after ${Math.max(1,Math.round(e.week/WEEKS))} years, from ${money(e.start)}. Your tenants paid ${Math.round((e.burden||0)*100)}% of their income in rent, and your homes were ${Math.round(e.cond*100)}% kept up.</p>
      ${e.kind!=='fair'?'<p>A fair landlord keeps rent under about 36% of income, homes at least 65% kept up, and nobody sleeping rough.</p>':''}<p>${next}</p>
      <div class="opts"><button class="main" data-replay="1"><b>Be the landlord again</b><small>The same town, as the billionaire left it</small></button>
      <button data-again="1"><b>Live another billionaire life</b><small>A new town and $30M</small></button></div>`,true);
  }
  const share=e.gains>0?Math.round(e.given/e.gains*100):0;
  const T0={hero:['Hero','The town fizzes with spending, and you die richer than you started.'],
    luthor:['Lex Luthor','You die in your bunker, very rich, over a grey and quiet town.'],
    revolt:['Revolt','The town has had enough. Signs fill the streets and your name is on them.']}[e.kind];
  showModal(`<h2>${T0[0]}</h2><p>${T0[1]}</p><div class="big">${money(e.nw)}</div>
    <p>Age ${40+Math.floor(e.week/WEEKS)}. You gave away ${money(e.given)}, ${share}% of everything you gained.</p>
    ${e.kind!=='hero'?`<p>The hero ending needs you to give at least ${Math.round(T.heroGiveShare*100)}% of your gains, keep unrest low, and still finish richer than $30M.</p>`:''}
    <div class="opts"><button class="main" data-rung="landlord"><b>Step down: the landlord</b><small>Play Agnes, in the town you leave behind</small></button>
    <button data-again="1"><b>Live another billionaire life</b><small>A new town and $30M</small></button></div>`,true);
}
$('#box').addEventListener('click',e=>{
  const s=e.target.closest('[data-start]'),a=e.target.closest('[data-again]'),g=e.target.closest('[data-rung]'),rr=e.target.closest('[data-replay]');
  if(s){G.seen.intro=true;if(isLandlord())G.seen.landlord=true;hideModal();save()}
  if(a){newGame(Math.random()*4294967296);G.seen.intro=true;R.stage={};hideModal();buildTabs();save();renderPane(true)} // cosmetic
  if(g){startLandlord();R.stage={};buildTabs();save();renderPane(true);showLandlordIntro()}
  if(rr){restartLandlord();R.stage={};buildTabs();save();renderPane(true);showLandlordIntro()}
});
function showToasts(){
  while(R.toasts.length){const t=R.toasts.shift();const d=document.createElement('div');d.className='toast';d.textContent=t.t;
    $('#toasts').appendChild(d);setTimeout(()=>d.remove(),4600);while($('#toasts').children.length>3)$('#toasts').firstChild.remove()}
}
