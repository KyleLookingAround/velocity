/* ================= panels ================= */
// The top bar, the bottom sheet (its tabs, or the decision card waiting for an answer), and the cards that open and
// close each rung. Each rung has its own tabs: the billionaire's Fortune and Commitments, the landlord's Books and
// Tenants; Town and Story are shared.
const SPEEDS=[0,1,2,4,8];
function buildChrome(){
  $('#speed').innerHTML=SPEEDS.map(s=>`<button data-s="${s}" aria-label="${s?s+' times speed':'Pause'}" title="${s?s+'\u00d7 speed (key '+SPEEDS.indexOf(s)+')':'Pause (space)'}">${s?s+'×':'❚❚'}</button>`).join('');
  $('#speed').onclick=e=>{const b=e.target.closest('button');if(b){G.speed=+b.dataset.s;refreshTop()}};
  buildTabs();
  $('#tabs').onclick=e=>{const b=e.target.closest('button');if(b&&!G.card){R.tab=b.dataset.t;renderPane(true)}};
  $('#pane').onclick=onPaneClick;
}
function buildTabs(){
  const tabs=isPresident()?[['congress','Congress'],['town','Town'],['story','Story']]:isGovernor()?[['state','State'],['town','Town'],['story','Story']]:isMayor()?[['hall','Town hall'],['town','Town'],['story','Story']]:isActivist()?[['campaign','Campaign'],['town','Town'],['story','Story']]:isUnion()?[['union','Union'],['town','Town'],['story','Story']]:isOut()?[['days','Days'],['town','Town'],['story','Story']]:isWaiter()?[['budget','Budget'],['town','Town'],['story','Story']]:isShop()?[['cafe','Café'],['town','Town'],['story','Story']]:isPartner()?[['career','Career'],['town','Town'],['story','Story']]:isLandlord()?[['books','Books'],['tenants','Tenants'],['town','Town'],['story','Story']]:[['fortune','Fortune'],['commit','Commitments'],['town','Town'],['story','Story']];
  if(!tabs.some(t=>t[0]===R.tab))R.tab=tabs[0][0];
  $('#tabs').innerHTML=tabs.map(([k,n])=>`<button data-t="${k}">${n}</button>`).join('');
}
const weeklySpend=()=>G.res.reduce((a,r)=>a+r.spent,0);
function setMeter(i,label,value){const m=document.querySelectorAll('#meters .meter')[i];m.firstChild.textContent=label+' ';m.querySelector('b').textContent=value}
function refreshTop(){
  topExtras();
  const u=G.unrest,lv=unrestLevel(u),last=G.history.at(-1);
  if(isPresident()){
    const p=G.pr;$('#nw').textContent=Math.round(p.approval*100)+'% approve';
    $('#growth').innerHTML=p.bill?'in Congress: <b>'+lawOf(p.bill).name+'</b>':p.passed.length+' law'+(p.passed.length===1?'':'s')+' passed';
    $('#clock').innerHTML=`<b>President ${p.name}, ${age()}</b><br>Year ${yearNo()} of ${PR.years}`;
    setMeter(1,'Congress',Math.round(p.congress*100)+'% with you');setMeter(2,'Re-election',p.elections.length?(p.elections[0].won?'Won':'Lost'):Math.round(prElectionOdds()*100)+'%');
  }else if(isGovernor()){
    const g=G.gv;$('#nw').textContent=Math.round(g.approval*100)+'% approve';
    $('#growth').innerHTML='state budget <b>'+money(g.budget)+'</b> · minimum wage '+(g.minWage>=1?'+':'')+Math.round((g.minWage-1)*100)+'%';
    $('#clock').innerHTML=`<b>Governor ${g.name}, ${age()}</b><br>Year ${yearNo()} of ${GV.years}`;
    setMeter(1,'Re-election',g.elections.length?(g.elections[0].won?'Won':'Lost'):'Year '+GV.term);setMeter(2,'Odds',g.elections.length?'\u2013':Math.round(gvElectionOdds()*100)+'%');
  }else if(isMayor()){
    const m=G.my;$('#nw').textContent=Math.round(m.approval*100)+'% approve';
    $('#growth').innerHTML='purse <b>'+money(G.fund||0)+'</b> · '+m.council+' council home'+(m.council===1?'':'s');
    $('#clock').innerHTML=`<b>Mayor ${m.name}, ${age()}</b><br>Year ${yearNo()} of ${MY.years}`;
    setMeter(1,'Re-election',m.elections.length?(m.elections[0].won?'Won':'Lost'):'Year '+MY.term);setMeter(2,'Odds',m.elections.length?'\u2013':Math.round(electionOdds()*100)+'%');
  }else if(isActivist()){
    const a=G.ac;$('#nw').textContent=Math.round(a.support*100)+'% behind you';
    $('#growth').innerHTML=a.campaign?'campaigning: <b>'+measure(a.campaign).name+'</b>':'funds <b>'+money(a.funds)+'</b> · no campaign';
    $('#clock').innerHTML=`<b>${a.name}, ${age()}</b><br>Year ${yearNo()} of ${AC.years}`;
    setMeter(1,'Votes won',String(a.passed.length));setMeter(2,'Public purse',money(G.fund||0));
  }else if(isUnion()){
    const u=G.un;$('#nw').textContent=Math.round(u.members*100)+'% in';
    $('#growth').innerHTML=u.striking?'<b>On strike</b>: '+u.striking+' weeks to go':'strike fund <b>'+money(u.fund)+'</b> · '+u.wins+' won, '+u.losses+' lost';
    $('#clock').innerHTML=`<b>${u.name}, ${age()}</b><br>Year ${yearNo()} of ${UN.years}`;
    setMeter(1,'Pay since you began',(wageRise()>=0?'+':'')+Math.round(wageRise()*100)+'%');setMeter(2,'Strikes won',String(u.wins));
  }else if(isOut()){
    const o=G.ow,r=outMe();$('#nw').textContent=hh(r.cash);
    $('#growth').innerHTML=r.job!=null?'<b>In work</b> again':(o.benefit&&o.sanctioned<=0&&G.fund>0?'on benefit':'no benefit')+(o.works?' · public works':'')+(o.gig?' · gig work':'');
    $('#clock').innerHTML=`<b>${o.name}, ${age()}</b><br>Year ${yearNo()} of ${OW.years}`;
    setMeter(1,'Health',Math.round(o.health*100)+'%');setMeter(2,'Home',r.homeless?(r.sheltered?'A shelter':'None'):'Renting');
  }else if(isWaiter()){
    const w=G.wt,r=me();$('#nw').textContent=hh(waiterWorth());
    $('#growth').innerHTML=`pay <b>${hh(G.shops[CAFE].wage*WT.shift[w.shift]*(w.trained?WT.trainedPay:1))}</b> a week · rent ${hh(r.rent)}`;
    $('#clock').innerHTML=`<b>${w.name}, ${age()}</b><br>Year ${yearNo()} of ${WT.years}`;
    setMeter(1,'Health',Math.round(w.health*100)+'%');setMeter(2,'You owe',hh(w.loan));
  }else if(isShop()){
    const s=G.shops[CAFE];$('#nw').textContent=money(shopWorth());
    $('#growth').innerHTML=`takings <b>${money(s.rev*WEEKS)}</b> a year · rent ${money(G.sh.premRent*WEEKS)}`;
    $('#clock').innerHTML=`<b>Bea, ${age()}</b><br>Year ${yearNo()} of ${SH.years}`;
    setMeter(1,'Staff',String(staffOf(CAFE).length));setMeter(2,'Lost customers',Math.round(Math.min(1,cafeLeak()+(G.sh.moved?0.1:0))*100)+'%');
  }else if(isPartner()){
    const p=G.pt;$('#nw').textContent=money(ptWorth());
    $('#growth').innerHTML=`<b>$${PT.rate.toLocaleString('en-GB')}</b> an hour · ${p.hours} hours a week`;
    $('#clock').innerHTML=`<b>Theo, ${age()}</b><br>Year ${yearNo()} of ${PT.years}`;
    setMeter(1,'Burnout',Math.round(p.burn*100)+'%');setMeter(2,'A billion in',Math.round(yearsToBillion())+' years');
  }else if(isLandlord()){
    $('#nw').textContent=money(equity());
    $('#growth').innerHTML=`rent roll <b>${money(rentRoll())}</b> a year · loan ${money(G.ll.loan)}`;
    $('#clock').innerHTML=`<b>Agnes, ${age()}</b><br>Year ${yearNo()} of ${LL.years}`;
    const mine=myHomes();setMeter(1,'Homes',mine.filter(r=>!r.homeless&&!r.sheltered).length+' of '+mine.length+' let');setMeter(2,'Repair',Math.round(G.ll.cond*100)+'% kept up');
  }else{
    $('#nw').textContent=money(netWorth());
    const lawTax=G.pub?(G.pub.wealthtax?2:0)+(G.pub.gains?1:0)+(G.pub.stepup?1:0):0;
    $('#growth').innerHTML=`growing <b>${rateText()}</b> a year`+(lawTax?`, less ${lawTax}% in tax`:'')+(last&&last.given>0?` · gave ${money(last.given)} last year`:'');
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
  $('#sheet').classList.toggle('deciding',!!G.card);$('#app').classList.toggle('deciding',!!G.card);
  for(const b of $('#tabs').children)b.classList.toggle('on',!G.card&&b.dataset.t===R.tab);
  const html=G.card?cardHTML():PANES[R.tab]();
  if(force||html!==paneKey){paneKey=html;$('#pane').innerHTML=html;$('#pane').classList.toggle('fresh',!!force);$('#pane').scrollTop=0;if(['fortune','books','career','cafe','budget'].includes(R.tab))drawChart()}
}
// the decision card: what's happened, and each option's cost to you and to the town
function cardHTML(){
  const c=cardDef(G.card.id),d=G.card.d||{};
  // (the first decision ever explains itself, once)
  const tip=G.ladder.tipCard?'':`<div class="tip"><span>\u261d</span><span><b>The game waits for you.</b> Each choice shows what it does for you and for the town. The tagged one is the easy way; the others change the town.</span></div>`;
  return `<div class="decide">${tip}<div class="kicker">A decision · ${G.rung!=='billionaire'?'year '+yearNo():'age '+age()}</div><h3>${c.title(d)}</h3><p>${c.body(d)}</p>`+
    c.options(d).map(o=>`<button class="opt ${o.acct?'acct':''}" data-card="${o.k}"><b>${o.label}</b>${o.acct?'<em>'+(G.rung==='mayor'||G.rung==='governor'||G.rung==='president'?'Keeps the donors happy':G.rung==='union'||G.rung==='activist'?'Easiest for you':G.rung==='waiter'||G.rung==='out'?'Pays most this week':'Your accountant’s pick')+'</em>':''}
      <span><i>You</i>${o.you}</span><span><i>Town</i>${o.town}</span></button>`).join('')+`</div>`;
}
const PANES={
  fortune(){
    const share=G.gains>0?Math.round(G.given/G.gains*100):0;
    return `<p class="lead">Each bar is a year of your fortune. The gold strip under it is what you gave away; the dashed line is where you started.</p><canvas id="chart"></canvas>
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
    const n=(k,one,many)=>k&&k+' '+(k===1?one:many);
    const own=[n(homesOwned(),'street of homes','streets of homes'),n(shopsOwned(),'shop','shops'),n(G.workshops.filter(w=>!w.outside).length,'workshop','workshops')].filter(Boolean);
    if(own.length)s+=`<div class="sum">You own ${own.join(', ')}.</div>`;
    return s;
  },
  town(){
    if(!R.parts)unrestTarget();
    const people=G.res.filter(r=>r.role!=='landlord'),last=G.history.at(-1),rough=people.filter(r=>r.homeless).length,poor=Math.round((R.parts?.poor||0)*people.length);
    return `<p class="lead">The town is ${people.length*HH} households. Each line below counts groups of ${HH}.</p>
      <div class="stats"><div>Out of work<b>${jobless().length}</b></div><div>Sleeping rough<b>${rough}</b></div>
      <div>Below the poverty line<b>${poor}</b></div><div>Spent at the megastore<b>${last?money(last.mega)+'/yr':'–'}</b></div>
      <div>Public purse<b>${money(G.fund||0)}</b></div><div>Paid for by<b>taxes on the rich</b></div>
      <div>A dollar changes hands<b>${last?last.vel.toFixed(0)+'× a year':'–'}</b></div><div>Unrest<b>${Math.round(G.unrest)} of 100</b></div></div>
      <div style="margin-top:10px">${G.shops.map((s,i)=>`<div class="card"><div class="txt"><b>${s.name}</b><small>${!s.open?'Closed':s.ownedByYou?(isLandlord()?'The estate’s':'Yours')+' · '+staffOf(i).length+' staff':'Run by '+G.res[s.owner].name+' · '+staffOf(i).length+' staff'}</small></div></div>`).join('')}</div>`;
  },
  story(){
    const list=G.choices.slice().reverse().slice(0,30);
    return achSummary()+`<div class="card"><div class="txt"><b>Let your accountant decide</b><small>Every decision goes ${G.rung==='mayor'||G.rung==='governor'||G.rung==='president'?'the way the donors like':G.rung==='union'||G.rung==='activist'?'the easiest way for you':G.rung==='waiter'||G.rung==='out'?'the way that pays most this week':'the way that makes the most money'}, without asking you.</small></div>
      <button class="toggle ${G.autoAcct?'on':''}" data-auto="1" aria-label="Let your accountant decide" aria-pressed="${G.autoAcct}"></button></div>`+
      (list.length?list.map(c=>`<div class="story"><small>${c.rung==='landlord'?'Landlord':c.rung==='partner'?'Law firm partner':c.rung==='shop'?'Shop owner':c.rung==='waiter'?'Waiter':c.rung==='out'?'Out of work':c.rung==='union'?'Union organiser':c.rung==='activist'?'Activist':c.rung==='mayor'?'Mayor':c.rung==='governor'?'Governor':c.rung==='president'?'President':'Age '+(c.age||START_AGE+Math.floor(c.week/WEEKS))}</small><b>${c.title}</b><span>${c.label}</span></div>`).join(''):'<p class="lead">Your decisions will be listed here.</p>');
  },
};
function onPaneClick(e){
  const k=e.target.closest('[data-card]'),g=e.target.closest('[data-gift]'),a=e.target.closest('[data-auto]');
  if(k&&G.card){G.ladder.tipCard=true;answerCard(k.dataset.card);save();renderPane(true);refreshTop()}
  if(g){const on=!G.gifts[g.dataset.gift];setGift(g.dataset.gift,on);if(on)queueScenes('give','gift-'+g.dataset.gift,{title:'You fund: '+GIFTS.find(x=>x.k===g.dataset.gift).name.toLowerCase()});save();renderPane(true)}
  if(a){G.autoAcct=!G.autoAcct;save();renderPane(true)}
}
// a bar a year, like the video's stacked money: the fortune (or, as the landlord, your equity)
function drawChart(){
  const el=$('#chart');if(!el)return;const r=el.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);
  el.width=r.width*d;el.height=r.height*d;const c=el.getContext('2d');c.scale(d,d);
  const L=isLandlord()||isShop(),P=isPartner()||isShop()||isWaiter(),n=rungYears()+1,W=r.width,H=r.height-18,bw=W/n;
  const rows=isWaiter()?G.wt.history.map(y=>({v:(y.cash-y.loan)/HH/grow(0.02)})).concat([{v:waiterWorth()/HH/grow(0.02)}]):isShop()?G.sh.history.map(y=>({v:y.worth})).concat([{v:shopWorth()}]):P?G.pt.history.map(y=>({v:y.worth})).concat([{v:ptWorth()}]):L?G.ll.history.map(y=>({v:y.equity})).concat([{v:equity()}]):G.history.map(y=>({v:y.nw,g:y.given})).concat([{v:netWorth(),g:G.year.given}]);
  const max=Math.max(isWaiter()?100:isShop()?G.sh.startWorth:P?1e6:L?G.ll.startEquity:START_FORTUNE*1.2,...rows.map(y=>Math.abs(y.v)),1);
  const top=H-14,yOf=v=>H-(Math.max(0,v)/max)*top;
  // a faint guide at the top, and the start as a dashed line on every rung
  c.strokeStyle='#e6dfd2';c.lineWidth=1;c.beginPath();c.moveTo(0,H-top+0.5);c.lineTo(W,H-top+0.5);c.moveTo(0,H+0.5);c.lineTo(W,H+0.5);c.stroke();
  c.fillStyle='#8a8478';c.font='600 11px system-ui';c.textAlign='left';c.fillText(money(max),2,H-top-4);
  const start=rows[0]?rows[0].v:0;
  if(start>0){const y0=yOf(start);c.strokeStyle='#b5ac9b';c.setLineDash([4,4]);c.beginPath();c.moveTo(0,y0);c.lineTo(W,y0);c.stroke();c.setLineDash([])}
  rows.forEach((y,i)=>{const now=i===rows.length-1,x=i*bw+Math.max(1,bw*0.12),w=Math.max(2,bw*0.76),yy=yOf(y.v),bh=Math.max(2,H-yy);
    const g=c.createLinearGradient(0,yy,0,H);g.addColorStop(0,now?'#2f7a44':'#5ca56d');g.addColorStop(1,now?'#3c8a50':'#8cc497');c.fillStyle=g;
    c.beginPath();c.roundRect(x,yy,w,bh,[Math.min(4,w/2),Math.min(4,w/2),0,0]);c.fill();
    if(y.v<0){c.fillStyle='#b23a3a';c.fillRect(x,H-3,w,3)}
    if(y.g>0){c.fillStyle='#d4a72c';c.fillRect(x,H+2,w,Math.min(10,2+y.g/max*400))}
    if(now&&rows.length>1){c.fillStyle='#1c1b18';c.font='700 11px system-ui';c.textAlign=x+w/2>W-40?'right':'center';c.fillText(money(y.v),Math.min(W-2,x+w/2),Math.max(10,yy-5))}});
  c.fillStyle='#8a8478';c.font='11px system-ui';c.textAlign='left';c.fillText(L||P?'year 1':'age 40',2,H+16);c.textAlign='right';c.fillText(L||P?String(rungYears()):'80',W-2,H+16);
}

// the cards that open and close a rung
// (an ending sits low, so its scene stays in view above it)
function showModal(html,low){$('#box').className='';$('#box').innerHTML=html;$('#modal').classList.toggle('low',!!low);$('#modal').classList.add('show')}
function hideModal(){$('#modal').classList.remove('show')}
// the first screen: four short points, each with its picture, and the start
const ICONS={
  you:'<svg viewBox="0 0 40 40"><rect x="13" y="3" width="14" height="9" rx="1"/><rect x="10" y="11" width="20" height="2"/><circle cx="20" cy="17" r="5"/><rect x="14" y="22" width="12" height="11" rx="3"/><rect x="15" y="32" width="4" height="7"/><rect x="21" y="32" width="4" height="7"/></svg>',
  town:'<svg viewBox="0 0 40 40"><path d="M3 20 12 12 21 20V36H3Z"/><path d="M19 22 28 14 37 22V36H19Z" opacity=".55"/><rect x="9" y="27" width="5" height="9" fill="#fff"/></svg>',
  card:'<svg viewBox="0 0 40 40"><rect x="7" y="5" width="26" height="31" rx="4"/><rect x="12" y="12" width="16" height="3" fill="#fff"/><rect x="12" y="19" width="12" height="3" fill="#fff" opacity=".7"/><rect x="12" y="26" width="14" height="3" fill="#fff" opacity=".7"/></svg>',
  ladder:'<svg viewBox="0 0 40 40"><rect x="9" y="3" width="4" height="34" rx="2"/><rect x="27" y="3" width="4" height="34" rx="2"/><rect x="11" y="9" width="18" height="3"/><rect x="11" y="18" width="18" height="3"/><rect x="11" y="27" width="18" height="3"/></svg>'};
function showIntro(){
  const row=(i,b,t)=>`<div class="step"><span class="ico ${i}">${ICONS[i]}</span><div><b>${b}</b><span>${t}</span></div></div>`;
  showModal(`<div class="hero"><small>A game about where money goes</small><h2>Money Makes Money</h2></div>
    <div class="steps">${row('you','You have $30 million','It earns 8% a year while you do nothing.')}
    ${row('town','Below you, a town','Every dollar you keep is one that stops moving down there. Watch what it does.')}
    ${row('card','People want things from you','Deals, donations, votes. The game waits while you choose; your accountant always knows what pays.')}
    ${row('ladder','A ladder of lives','Each life steps down a rung, then climbs back up by votes. Every ending you find is kept.')}</div>
    <div class="opts"><button class="main" data-start="1"><b>Start</b><small>You\u2019re 40. You have 40 years.</small></button></div>`);
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
function showPartnerIntro(){
  const from=G.ladder.fromLandlord;
  showModal(`<h2>Step down: the law firm partner</h2><p>You are Theo. You bill <b>$${PT.rate.toLocaleString('en-GB')} an hour</b>, the top of the pay table. At that rate a billion takes about 200 years.</p>
    <p>Agnes still owns the homes, and runs them the way you did: ${from==='fair'?'fairly':'hard'}. You rent from her.</p>
    <p>Each year you choose your hours. Clients come to you: the rich pay best, and the town can’t pay at all.</p>
    <div class="opts"><button class="main" data-start="1"><b>Start</b><small>You have ${PT.years} years.</small></button></div>`);
}
function showPresidentIntro(){
  const p=G.pr;
  showModal(`<h2>The top: the president</h2><p>You are President ${p.name}. You started this climb with nothing.</p>
    <p>Now the law itself can change: tax gains like wages, end buy-borrow-die, tax the biggest fortunes, and pay for the whole programme list. Bills go to Congress; the lobby pays for the other side. What you pass lasts into the next billionaire life.</p>
    <div class="opts"><button class="main" data-start="1"><b>Start</b><small>Two terms, if they re-elect you.</small></button></div>`);
}
// a billionaire life in a country a president changed
function showLawsIntro(){
  const laws=Object.keys(G.pub||{}).filter(k=>G.pub[k]&&lawOf(k));
  if(!laws.length)return;
  showModal(`<h2>The country you made</h2><p>You have $30 million again, in a country with these laws:</p><p><b>${laws.map(k=>lawOf(k).name).join('</b>, <b>')}</b>.</p>
    <p>${G.pub.wealthtax?'Your fortune pays 2% a year into the public purse, and the purse pays for the programmes.':'The public purse pays for the programmes.'}</p>
    <div class="opts"><button class="main" data-start="1"><b>Start</b><small>You're 40. You have 40 years.</small></button></div>`);
}
function showGovernorIntro(){
  const g=G.gv;
  showModal(`<h2>Climb: the governor</h2><p>You are Governor ${g.name}. The town is one of many now, and what reaches it comes from the state.</p>
    <p>Set the minimum wage, decide whether the biggest fortunes pay, hand out the state\u2019s grants to towns, and choose what a recession and a chain\u2019s warehouse get. The state votes again in ${GV.term} years.</p>
    <div class="opts"><button class="main" data-start="1"><b>Start</b><small>Two terms, if they re-elect you.</small></button></div>`);
}
function showMayorIntro(){
  const m=G.my;
  showModal(`<h2>Climb: the mayor</h2><p>You are Mayor ${m.name}. The public purse is yours to spend: ${money(G.fund||0)}.</p>
    <p>Tax the landlords\u2019 rents, buy homes for the town, and decide what the mill, the developers and the donors get. The town votes again in ${MY.term} years, and the estate\u2019s money backs whoever runs against you.</p>
    <div class="opts"><button class="main" data-start="1"><b>Start</b><small>Two terms, if they re-elect you.</small></button></div>`);
}
function showActivistIntro(){
  const a=G.ac,from=G.ladder.fromUnion;
  showModal(`<h2>Climb: the activist</h2><p>You are ${a.name}. ${from==='fairpay'?'The union\u2019s wins brought people with you':from==='soldout'?'People remember the manager\u2019s job':'You start with the people you know'}: ${Math.round(a.support*100)}% of the town is behind you.</p>
    <p>Campaign for changes the whole town votes on: taxing the estate, capping rents, and programmes paid from the public purse. Each campaign runs half a year before its vote. The estate\u2019s money pays for the other side.</p>
    <div class="opts"><button class="main" data-start="1"><b>Start</b><small>${AC.years} years.</small></button></div>`);
}
function showUnionIntro(){
  const u=G.un;
  showModal(`<h2>Climb: the union organiser</h2><p>You are ${u.name}. ${Math.round(u.members*100)}% of the town\u2019s workers are with you so far.</p>
    <p>Members pay dues into a strike fund. A strike wins when enough workers are in and the fund can carry them, and it raises a whole workplace\u2019s pay. Employers will fight back, and one of them will offer you a way out.</p>
    <div class="opts"><button class="main" data-start="1"><b>Start</b><small>${UN.years} years.</small></button></div>`);
}
function showOutIntro(){
  const o=G.ow,r=outMe();
  showModal(`<h2>The bottom rung: out of work</h2><p>You are ${o.name}. ${r.homeless?'You have no job and nowhere to live.':'The café has let you go.'}</p>
    <p>What the town can do for you depends on what\u2019s in its public purse: ${money(G.fund||0)}, from the taxes the rich paid. ${G.gifts.shelter?'A billionaire\u2019s foundation still pays for a shelter.':''}</p>
    <p>Jobs come as offers, rarer when nobody\u2019s hiring and when you\u2019ve no address. Or you could organise the people around you.</p>
    <div class="opts"><button class="main" data-start="1"><b>Start</b><small>${OW.years} years.</small></button></div>`);
}
function showWaiterIntro(){
  const w=G.wt;
  showModal(`<h2>Step down: the waiter</h2><p>You are ${w.name}, and you wait tables at the café for ${hh(G.shops[CAFE].wage)} a week. Your rent to Agnes is ${hh(me().rent)} a week.</p>
    <p>Every year you choose your shifts. Extra shifts pay, and wear you down. When you\u2019re short there\u2019s a payday lender. The union is organising.</p>
    <p>Fall too far behind on the rent and you\u2019re evicted.</p>
    <div class="opts"><button class="main" data-start="1"><b>Start</b><small>${WT.years} years.</small></button></div>`);
}
function showShopIntro(){
  showModal(`<h2>Step down: the shop owner</h2><p>You are Bea, and the café is yours. Your customers spend the town\u2019s wages, including the ones you pay.</p>
    <p>You pay rent on the premises to Agnes. You set prices and pay, and choose where your supplies come from. Raise prices and customers drift to the megastore.</p>
    <div class="opts"><button class="main" data-start="1"><b>Start</b><small>You have ${SH.years} years.</small></button></div>`);
}
// (showEnding, in the achievements panel file, wraps this with the rare title, new achievements and the heir)
function showEndingCore(){
  const e=G.ending;
  if(e.rung==='president'){
    const T0={rebuilt:['The ladder, rebuilt','The biggest fortunes pay, and the country pays for its programme list.'],
      lobbied:['Owned','The lobby wrote the laws that passed. The fortunes kept growing.'],
      gridlock:['Gridlock','Eight years of fights, and the biggest fortunes still pay least.'],
      oneterm:['One term','The country chose someone else.']}[e.kind];
    const names=e.passed.map(k=>lawOf(k).name.toLowerCase());
    return showModal(`<h2>${T0[0]}</h2><p>${T0[1]}</p><div class="big">${e.passed.length} law${e.passed.length===1?'':'s'}</div>
      <p>President ${e.name}, ${e.terms} term${e.terms===1?'':'s'}${names.length?': '+names.join(', '):''}.</p>
      <p>That\u2019s the whole ladder. What you passed is the law in every billionaire life from now on.</p>
      <div class="opts"><button class="main" data-again="1"><b>Live another billionaire life</b><small>$30M, in the country you made</small></button>
      <button data-replay10="1"><b>Serve again</b><small>The same country, as the governor left it</small></button></div>`,true);
  }
  if(e.rung==='governor'){
    const T0={newdeal:['A new deal','Higher wages, the biggest fortunes paying their share, and the money sent to the towns.'],
      dealmaker:['The dealmaker','Tax breaks and donors. The state ran smoothly, for the people who paid for it.'],
      steward:['The steward','Two terms. Steady hands, and not much changed.'],
      unseated:['Unseated','The state chose someone else.']}[e.kind];
    return showModal(`<h2>${T0[0]}</h2><p>${T0[1]}</p><div class="big">${(e.minWage>=1?'+':'')+Math.round((e.minWage-1)*100)}% minimum wage</div>
      <p>Governor ${e.name}, ${e.terms} term${e.terms===1?'':'s'}. ${e.fortuneTax?'The biggest fortunes pay 1% a year. ':''}${e.granted} grants and schemes for the towns. ${Math.round(e.approval*100)}% approved of you at the end.</p>
      ${e.kind==='unseated'?'<p>A governor the state voted out can\u2019t run for president.</p>':''}
      <div class="opts">${e.kind==='unseated'?'':`<button class="main" data-rung="president"><b>Climb: the president</b><small>${e.name} runs for the country, and wins</small></button>`}
      <button ${e.kind==='unseated'?'class="main" ':''}data-replay9="1"><b>Govern again</b><small>The same state, as the mayor left it</small></button>
      <button data-again="1"><b>Live another billionaire life</b><small>A new town and $30M</small></button></div>`,true);
  }
  if(e.rung==='mayor'){
    const T0={builder:['The builder','Two terms, homes the town can afford, and a calmer town for it.'],
      machine:['The machine','Re-elected on the donors\u2019 money. The landlords never had it so good.'],
      caretaker:['The caretaker','Two terms. The town ticks over much as you found it.'],
      outvoted:['Voted out','The town chose someone else.']}[e.kind];
    return showModal(`<h2>${T0[0]}</h2><p>${T0[1]}</p><div class="big">${e.council} council home${e.council===1?'':'s'}</div>
      <p>Mayor ${e.name}, ${e.terms} term${e.terms===1?'':'s'}. ${Math.round(e.approval*100)}% approved of you at the end. The purse holds ${money(e.purse)}.</p>
      ${e.kind==='outvoted'?'<p>A mayor the town voted out can\u2019t run for governor.</p>':''}
      <div class="opts">${e.kind==='outvoted'?'':`<button class="main" data-rung="governor"><b>Climb: the governor</b><small>${e.name} runs for the state, and wins</small></button>`}
      <button ${e.kind==='outvoted'?'class="main" ':''}data-replay8="1"><b>Run the town again</b><small>The same town, as the activist left it</small></button>
      <button data-again="1"><b>Live another billionaire life</b><small>A new town and $30M</small></button></div>`,true);
  }
  if(e.rung==='activist'){
    const T0={changed:['The town changed','Three votes or more, and the town runs differently for it.'],
      heard:['Heard','You won some. The town is a little fairer than you found it.'],
      bought:['Bought','The foundation\u2019s money ran your campaigns. The estate was never taxed.'],
      ignored:['Ignored','Ten years, and nothing on the ballot passed.']}[e.kind];
    const names=e.passed.map(k=>measure(k).name.toLowerCase());
    return showModal(`<h2>${T0[0]}</h2><p>${T0[1]}</p><div class="big">${e.passed.length} vote${e.passed.length===1?'':'s'} won</div>
      <p>${e.name}, after ${Math.max(1,Math.round(e.week/WEEKS))} years${names.length?': '+names.join(', '):''}. ${e.lost?e.lost+' lost. ':''}The public purse holds ${money(e.purse)}.</p>
      <div class="opts"><button class="main" data-rung="mayor"><b>Climb: the mayor</b><small>${e.name} runs for mayor, and wins</small></button>
      <button data-replay7="1"><b>Campaign again</b><small>The same town, as the union left it</small></button>
      <button data-again="1"><b>Live another billionaire life</b><small>A new town and $30M</small></button></div>`,true);
  }
  if(e.rung==='union'){
    const T0={fairpay:['Fair wages','You won the fights that mattered, and the whole town is paid more for it.'],
      soldout:['Sold out','You took the manager\u2019s job. The union didn\u2019t last long without you.'],
      busted:['Crumbs from the table','Small deals, no wins. The town\u2019s pay barely moved.']}[e.kind];
    return showModal(`<h2>${T0[0]}</h2><p>${T0[1]}</p><div class="big">${(e.rise>=0?'+':'')+Math.round(e.rise*100)}% pay</div>
      <p>${e.name}, after ${Math.max(1,Math.round(e.week/WEEKS))} years: ${e.wins} strike${e.wins===1?'':'s'} won, ${e.losses} lost, ${Math.round(e.members*100)}% of workers in the union.</p>
      <div class="opts"><button class="main" data-rung="activist"><b>Climb: the activist</b><small>Campaign for the whole town, as ${e.name}</small></button>
      <button data-replay6="1"><b>Organise again</b><small>The same town, as the bottom rung left it</small></button>
      <button data-again="1"><b>Live another billionaire life</b><small>A new town and $30M</small></button></div>`,true);
  }
  if(e.rung==='out'){
    const T0={feet:['Back on your feet','A job, and a door of your own.'],
      organiser:['An organiser','You didn\u2019t climb out alone. You brought people with you.'],
      stuck:['Still at the bottom','Five years, and the ladder\u2019s still out of reach.']}[e.kind];
    return showModal(`<h2>${T0[0]}</h2><p>${T0[1]}</p>
      <p>${e.name}. ${e.job?'In work.':'Out of work.'} ${e.homeless?'Sleeping rough.':'Housed.'} The town\u2019s public purse has ${money(G.fund||0)} left.</p>
      <p>This is the bottom of the ladder. The climb back up is by votes, not money.</p>
      <div class="opts"><button class="main" data-rung="union"><b>Climb: the union organiser</b><small>Organise the town\u2019s workers, as ${e.name}</small></button>
      <button data-replay5="1"><b>Live the bottom rung again</b><small>The same town, as you left it</small></button>
      <button data-again="1"><b>Live another billionaire life</b><small>A new town and $30M</small></button></div>`,true);
  }
  if(e.rung==='waiter'){
    const T0={ahead:['Getting ahead','You came out of it with something put by and nothing owed.'],
      by:['Getting by','Fifteen years of shifts, and you\u2019re still standing.'],
      evicted:['Evicted','You fell too far behind on the rent. You fall to the bottom rung: out of work.']}[e.kind];
    return showModal(`<h2>${T0[0]}</h2><p>${T0[1]}</p><div class="big">${hh(e.worth)}</div>
      <p>${e.name}, after ${Math.max(1,Math.round(e.week/WEEKS))} years. ${e.loan>0?'You still owe '+hh(e.loan)+'. ':''}${e.trained?'You finished the course. ':''}${e.union?'You stood with the union.':''}</p>
      <div class="opts"><button class="main" data-rung="out"><b>Step down: out of work</b><small>The bottom rung, as ${e.name}</small></button>
      <button data-replay4="1"><b>Be the waiter again</b><small>The same town, as Bea left it</small></button>
      <button data-again="1"><b>Live another billionaire life</b><small>A new town and $30M</small></button></div>`,true);
  }
  if(e.rung==='shop'){
    const T0={pillar:['A pillar of the high street','You paid fairly, kept the café open, and the town kept coming back.'],
      tightfisted:['Kept the lights on','The café survived. Your staff mostly didn\u2019t.'],
      closed:['Closed','The café couldn\u2019t pay its way. You fall to the next rung: the waiter.'],
      sold:['Sold','The estate bought the café. Its profit leaves town now.'],
      founder:['Founder','The café becomes a chain, and you start a new billionaire life. Nothing in the town has changed.']}[e.kind];
    return showModal(`<h2>${T0[0]}</h2><p>${T0[1]}</p><div class="big">${money(e.worth)}</div>
      <p>After ${Math.max(1,Math.round(e.week/WEEKS))} years. You paid ${e.pay.living?'a living wage for '+e.pay.living+' years':e.pay.minimum?'the minimum for '+e.pay.minimum+' years':'the going rate'}, and bought supplies ${e.supply==='local'?'in town':'from the megastore'}.</p>
      <p>${e.kind==='founder'?'The founder\u2019s shortcut: straight back to the top, with the rules unchanged.':''}</p>
      <div class="opts">${e.kind==='founder'?'<button class="main" data-again="1"><b>Start your billionaire life</b><small>A new town and $30M</small></button>':'<button class="main" data-rung="waiter"><b>Step down: the waiter</b><small>Work at the café, in the town Bea leaves</small></button>'}
      <button data-replay3="1"><b>Be the shop owner again</b><small>The same town, as Theo left it</small></button>
      ${e.kind!=='founder'?'<button data-again="1"><b>Live another billionaire life</b><small>A new town and $30M</small></button>':''}</div>`,true);
  }
  if(e.rung==='partner'){
    const T0={hiredgun:['A hired gun','You were very good at helping the rich keep their money. They paid you well for it.'],
      counsel:['Counsel for the town','You took the cases that couldn’t pay, and turned down the ones that hurt the town.'],
      burnout:['Burnt out','The hours caught up with you.']}[e.kind];
    return showModal(`<h2>${T0[0]}</h2><p>${T0[1]}</p><div class="big">${money(e.worth)}</div>
      <p>After ${Math.max(1,Math.round(e.week/WEEKS))} years at $${PT.rate.toLocaleString('en-GB')} an hour. At that rate a billion would take you <b>${Math.round(e.years)} years</b>.</p>
      <p>${e.loopholes?e.loopholes+' loophole'+(e.loopholes>1?'s':'')+' for the estate. ':''}${e.proBono?e.proBono+' eviction'+(e.proBono>1?'s':'')+' fought for free.':''}</p>
      <div class="opts"><button class="main" data-rung="shop"><b>Step down: the shop owner</b><small>Play Bea, who runs the café, in the town Theo leaves</small></button>
      <button data-replay2="1"><b>Be the partner again</b><small>The same town, as Agnes left it</small></button>
      <button data-again="1"><b>Live another billionaire life</b><small>A new town and $30M</small></button></div>`,true);
  }
  if(e.rung==='landlord'){
    const T0={fair:['A fair landlord','Rents your tenants could pay, homes kept up, and nobody on the street.'],
      rentier:['A rentier','You did well out of the town. The town did less well out of you.'],
      bankrupt:['Bankrupt','The bank has taken the homes. You fall to the bottom of the ladder.']}[e.kind];
    const next=e.kind==='bankrupt'?'Next: <b>Out of work</b>, the bottom rung. It isn’t built yet.':'';
    return showModal(`<h2>${T0[0]}</h2><p>${T0[1]}</p><div class="big">${money(e.equity)}</div>
      <p>Equity after ${Math.max(1,Math.round(e.week/WEEKS))} years, from ${money(e.start)}. Your tenants paid ${Math.round((e.burden||0)*100)}% of their income in rent, and your homes were ${Math.round(e.cond*100)}% kept up.</p>
      ${e.kind!=='fair'?'<p>A fair landlord keeps rent under about 36% of income, homes at least 65% kept up, and nobody sleeping rough.</p>':''}<p>${next}</p>
      <div class="opts">${e.kind!=='bankrupt'?'<button class="main" data-rung="partner"><b>Step down: the law firm partner</b><small>Play Theo, in the town Agnes leaves behind</small></button>':''}
      <button class="${e.kind==='bankrupt'?'main':''}" data-replay="1"><b>Be the landlord again</b><small>The same town, as the billionaire left it</small></button>
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
  if(s){G.seen.intro=true;G.seen[G.rung]=true;hideModal();save()}
  if(a){newGame(Math.random()*4294967296);G.seen.intro=true;R.stage={};hideModal();buildTabs();save();renderPane(true);showLawsIntro()} // cosmetic
  if(g&&g.dataset.rung==='landlord'){startLandlord();R.stage={};buildTabs();save();renderPane(true);showLandlordIntro()}
  if(g&&g.dataset.rung==='partner'){startPartner();R.stage={};buildTabs();save();renderPane(true);showPartnerIntro()}
  if(g&&g.dataset.rung==='president'){startPresident();R.stage={};buildTabs();save();renderPane(true);showPresidentIntro()}
  if(e.target.closest('[data-replay10]')){restartPresident();R.stage={};buildTabs();save();renderPane(true);showPresidentIntro()}
  if(g&&g.dataset.rung==='governor'){startGovernor();R.stage={};buildTabs();save();renderPane(true);showGovernorIntro()}
  if(e.target.closest('[data-replay9]')){restartGovernor();R.stage={};buildTabs();save();renderPane(true);showGovernorIntro()}
  if(g&&g.dataset.rung==='mayor'){startMayor();R.stage={};buildTabs();save();renderPane(true);showMayorIntro()}
  if(e.target.closest('[data-replay8]')){restartMayor();R.stage={};buildTabs();save();renderPane(true);showMayorIntro()}
  if(g&&g.dataset.rung==='activist'){startActivist();R.stage={};buildTabs();save();renderPane(true);showActivistIntro()}
  if(e.target.closest('[data-replay7]')){restartActivist();R.stage={};buildTabs();save();renderPane(true);showActivistIntro()}
  if(g&&g.dataset.rung==='union'){startUnion();R.stage={};buildTabs();save();renderPane(true);showUnionIntro()}
  if(e.target.closest('[data-replay6]')){restartUnion();R.stage={};buildTabs();save();renderPane(true);showUnionIntro()}
  if(g&&g.dataset.rung==='out'){startOut();R.stage={};buildTabs();save();renderPane(true);showOutIntro()}
  if(e.target.closest('[data-replay5]')){restartOut();R.stage={};buildTabs();save();renderPane(true);showOutIntro()}
  if(g&&g.dataset.rung==='waiter'){startWaiter();R.stage={};buildTabs();save();renderPane(true);showWaiterIntro()}
  if(e.target.closest('[data-replay4]')){restartWaiter();R.stage={};buildTabs();save();renderPane(true);showWaiterIntro()}
  if(g&&g.dataset.rung==='shop'){startShop();R.stage={};buildTabs();save();renderPane(true);showShopIntro()}
  if(e.target.closest('[data-replay3]')){restartShop();R.stage={};buildTabs();save();renderPane(true);showShopIntro()}
  if(e.target.closest('[data-replay2]')){restartPartner();R.stage={};buildTabs();save();renderPane(true);showPartnerIntro()}
  if(rr){restartLandlord();R.stage={};buildTabs();save();renderPane(true);showLandlordIntro()}
});
function showToasts(){
  while(R.toasts.length){const t=R.toasts.shift();const d=document.createElement('div');d.className='toast'+(t.t.startsWith('Achievement')?' gold':'');d.textContent=t.t;
    $('#toasts').appendChild(d);setTimeout(()=>d.remove(),4600);while($('#toasts').children.length>3)$('#toasts').firstChild.remove()}
}
