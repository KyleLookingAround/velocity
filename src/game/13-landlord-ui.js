/* ================= the landlord's panels ================= */
// Homes (rent, repairs, evictions, buying and selling), Tenants (who pays what), Books (equity over the years), the
// landlord's top bar, first card and endings.
const pct=v=>(v>0?'+':v<0?'−':'')+Math.round(Math.abs(v)*100)+'%';
function refreshTopLandlord(){
  const ll=G.ll;
  $('#nw').textContent=money(equity());
  $('#growth').innerHTML=`rent roll <b>${money(rentRoll())}</b> a year · loan ${money(ll.loan)}`;
  $('#clock').innerHTML=`<b>Agnes, ${age()}</b><br>Year ${yearNo()} of ${LL.years}`;
  for(const b of $('#speed').children)b.classList.toggle('on',+b.dataset.s===G.speed);
  const u=G.unrest,lv=unrestLevel(u);
  $('#unrestT').textContent=lv[0].toUpperCase()+lv.slice(1)+(u>=70?' · rent strike':'');
  const ub=$('#unrestB');ub.style.width=Math.min(100,u)+'%';ub.style.background=u>=70?'var(--red)':u>=55?'var(--amber)':u>=30?'#c9a227':'var(--green)';
  const mine=myHomes(),let_=mine.filter(r=>!r.homeless&&!r.sheltered).length;
  $('#jobsT').textContent=let_+' of '+mine.length+' let';
  $('#spendT').textContent=Math.round(ll.cond*100)+'% kept up';
  $('#meters').children[1].firstChild.textContent='Homes ';$('#meters').children[2].firstChild.textContent='Repair ';
}
function tenantBurden(){const t=myHomes().filter(r=>!r.homeless&&!r.sheltered&&r.income>0);return t.length?t.reduce((a,r)=>a+r.rent/r.income,0)/t.length:0}
Object.assign(PANES,{
  homes(){
    const ll=G.ll,b=tenantBurden(),seg=(attr,opts,cur)=>`<div class="seg">${opts.map(([v,l])=>`<button data-${attr}="${v}" class="${v==cur?'on':''}">${l}</button>`).join('')}</div>`;
    const estate=G.res.filter(r=>r.homeOwner==='you').length;
    return `<p class="lead">You own ${myHomes().length} of the town's 19 homes${estate?'; the billionaire’s estate owns '+estate+' and raises their rent 7% a year':''}. Your tenants pay ${Math.round(b*100)}% of their income in rent.</p>
      <div class="card"><div class="txt"><b>Next year's rent</b><small>Above 35% of income, tenants fall behind. Wages rise about 2% a year.</small>
        ${seg('rent',LL.rentSteps.map(v=>[v,pct(v)]),ll.rentChange)}</div></div>
      <div class="card"><div class="txt"><b>Repairs</b><small>${money(llRepairsWeek()*WEEKS)} a year, spent in town. Homes are ${Math.round(ll.cond*100)}% kept up; below 40% tenants pay less.</small>
        ${seg('repair',[['none','None'],['basic','Basic'],['full','Full']],ll.repairs)}</div></div>
      <div class="card"><div class="txt"><b>Evict after six weeks behind</b><small>${ll.evict?'Tenants who fall behind lose their home.':'Tenants who fall behind stay, and owe you the rent.'}</small></div>
        <button class="toggle ${ll.evict?'on':''}" data-evict="1" aria-label="Evictions" aria-pressed="${ll.evict}"></button></div>
      <div class="card"><div class="txt"><b>Buy homes from the estate</b><small>${money(G.homePrice)} for one figure's homes, ${Math.round(LL.deposit*100)}% down, the rest borrowed at ${Math.round(LL.rate*100)}%.</small></div>
        ${estate?`<button class="act" data-ll="buy" ${canBuyFromEstate()?'':'disabled'}>${money(G.homePrice*LL.deposit)}</button>`:'<small>None left</small>'}</div>
      <div class="card"><div class="txt"><b>Sell homes to the estate</b><small>Pays off part of the loan. The estate will push their rent up.</small></div>
        <button class="act" data-ll="sell" ${canSellToEstate()?'':'disabled'}>${money(G.homePrice*(0.55+0.45*ll.cond))}</button></div>`;
  },
  tenants(){
    const rows=myHomes().map(r=>{const st=r.homeless?'Evicted, sleeping rough':r.sheltered?'Evicted, in a shelter':r.owed>0?'Owes '+money(r.owed/HH):r.arrears?r.arrears+' weeks behind':'Paying';
      const share=r.income>0?Math.round(r.rent/r.income*100)+'% of income':'no income';
      return `<div class="card"><div class="txt"><b>${r.name}</b><small>Rent ${money(r.rent/HH)} a week · ${share}</small><small>${st}</small></div></div>`}).join('');
    return `<p class="lead">One card per figure renting from you (each is ${HH} households).</p>`+(rows||'<p class="lead">You have no tenants. Buy homes from the estate on the Homes tab.</p>');
  },
  books(){
    const ll=G.ll,h=ll.history.at(-1);
    return `<p class="lead">Each bar is a year of your equity: what your homes are worth, plus your savings, less the loan.</p><canvas id="chart"></canvas>
      <div class="stats" style="margin-top:8px"><div>Homes worth<b>${money(homeValue())}</b></div><div>Loan<b>${money(ll.loan)}</b></div>
      <div>Savings<b>${money(G.res[0].cash)}</b></div><div>Loan to value<b>${homeValue()?Math.round(ll.loan/homeValue()*100)+'%':'–'}</b></div>
      <div>Rent last year<b>${h?money(h.rent):'–'}</b></div><div>Interest last year<b>${h?money(h.interest):'–'}</b></div>
      <div>Repairs last year<b>${h?money(h.repairs):'–'}</b></div><div>Evictions last year<b>${h?h.evictions:'–'}</b></div></div>
      <p class="lead" style="margin-top:8px">The bank calls in the loan if it grows past what the homes are worth, and takes them if you miss three months of payments.</p>`;
  },
});
// the landlord's buttons
$('#pane').addEventListener('click',e=>{
  if(!isLandlord())return;
  const t=e.target.closest('[data-rent],[data-repair],[data-evict],[data-ll]');if(!t)return;
  if(t.dataset.rent!=null)setRentChange(+t.dataset.rent);
  if(t.dataset.repair)setRepairs(t.dataset.repair);
  if(t.dataset.evict)setEvict(!G.ll.evict);
  if(t.dataset.ll==='buy')buyFromEstate();
  if(t.dataset.ll==='sell')sellToEstate();
  save();renderPane(true);refreshTop();
});
function drawBooksChart(){
  const el=$('#chart');if(!el)return;const r=el.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);
  el.width=r.width*d;el.height=r.height*d;const c=el.getContext('2d');c.scale(d,d);
  const h=G.ll.history.concat([{equity:equity()}]),W=r.width,H=r.height-18,n=LL.years+1,bw=W/n;
  const max=Math.max(1,...h.map(y=>Math.abs(y.equity)),G.ll.startEquity);
  c.fillStyle='#888';c.font='11px system-ui';c.textAlign='left';c.fillText(money(max),2,10);
  const y0=H-(G.ll.startEquity/max)*(H-14);c.strokeStyle='#999';c.setLineDash([4,4]);c.beginPath();c.moveTo(0,y0);c.lineTo(W,y0);c.stroke();c.setLineDash([]);
  h.forEach((y,i)=>{const bh=Math.max(1,(Math.max(0,y.equity)/max)*(H-14));for(let k=0;k<bh;k+=4){c.fillStyle=k%8?'#5aa86b':'#4c9a5d';c.fillRect(i*bw+1,H-k-3,bw-2,3)}});
  c.fillStyle='#666';c.textAlign='center';c.fillText('year 1',bw*1.5,H+16);c.fillText(String(LL.years),W-bw,H+16);
  c.textAlign='left';c.fillText('dashed: where you started',4,H+16+0);
}
const _drawChart=drawChart;
drawChart=function(){if(isLandlord())drawBooksChart();else _drawChart()};
function showLandlordIntro(){
  const from=G.ladder.from,mine=myHomes().length,estate=G.res.filter(r=>r.homeOwner==='you').length;
  const legacy={hero:'The billionaire died a hero, and its foundation still pays for the gifts.',luthor:'The billionaire died rich, and its gifts died with it.',
    revolt:'The town revolted against the billionaire, and it hasn’t calmed down.'}[from]||'';
  showModal(`<h2>Step down: the landlord</h2><p>You are Agnes. You own ${mine} of the town's 19 homes${estate?', and the billionaire’s estate owns '+estate:''}. ${legacy}</p>
    <p>Each year, set the rent, choose how much to spend on repairs, and decide whether to evict. Squeeze, and the town pays until it can't.</p>
    <p>A fair landlord keeps rents under about a third of income, homes kept up, and nobody sleeping rough. The bank takes everything if you can't pay the loan.</p>
    <div class="opts"><button class="main" data-start="1"><b>Start</b><small>You have ${LL.years} years.</small></button></div>`);
}
function showLandlordEnding(){
  const e=G.ending;
  const T0={fair:['A fair landlord','Rents your tenants can pay, homes kept up, and nobody on the street.'],
    rentier:['A rentier','You did well out of the town. The town did less well out of you.'],
    bankrupt:['Bankrupt','The bank has taken the homes. You fall to the bottom of the ladder.']}[e.kind];
  const next=e.kind==='bankrupt'?'Next: <b>Out of work</b>, the bottom rung. It isn’t built yet.':'Next rung: <b>Law firm partner</b>. It isn’t built yet.';
  showModal(`<h2>${T0[0]}</h2><p>${T0[1]}</p><div class="big">${money(e.equity)}</div>
    <p>Equity after ${Math.max(1,Math.round(e.week/WEEKS))} years, from ${money(e.start)}. Your tenants paid ${Math.round((e.burden||0)*100)}% of their income in rent, and your homes were ${Math.round(e.cond*100)}% kept up.</p>
    ${e.kind!=='fair'?'<p>A fair landlord keeps rents under about 36% of income, homes at least 65% kept up, and nobody sleeping rough.</p>':''}
    <p>${next}</p>
    <div class="opts"><button class="main" data-replay="1"><b>Be the landlord again</b><small>The same town, as the billionaire left it</small></button>
    <button data-again="1"><b>Live another billionaire life</b><small>A new town and $30M</small></button></div>`);
}
