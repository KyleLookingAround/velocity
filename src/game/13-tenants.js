/* ================= the landlord's tabs ================= */
// Books (your equity over the years and what the bank sees) and Tenants (who pays what).
Object.assign(PANES,{
  books(){
    const ll=G.ll,h=ll.history.at(-1),v=homeValue();
    return `<p class="lead">Each bar is a year of your equity: what your homes are worth, plus your savings, less the loan. The dashed line is where you started.</p><canvas id="chart"></canvas>
      <div class="stats" style="margin-top:8px"><div>Homes worth<b>${money(v)}</b></div><div>Loan<b>${money(ll.loan)}</b></div>
      <div>Savings<b>${money(G.res[0].cash)}</b></div><div>Loan to value<b>${v?Math.round(ll.loan/v*100)+'%':'–'}</b></div>
      <div>Rent this year<b>${pct(ll.rentChange)}</b></div><div>Repairs<b>${{none:'None',basic:'Basic',full:'Full'}[ll.repairs]}</b></div>
      <div>Rent last year<b>${h?money(h.rent):'–'}</b></div><div>Interest last year<b>${h?money(h.interest):'–'}</b></div>
      <div>Repairs last year<b>${h?money(h.repairs):'–'}</b></div><div>Evictions last year<b>${h?h.evictions:'–'}</b></div></div>
      <p class="lead" style="margin-top:8px">The bank calls in the loan if it grows past what the homes are worth, and takes them if you miss three months of payments.</p>`;
  },
  tenants(){
    const rows=myHomes().map(r=>{const st=r.homeless?'Evicted, sleeping rough':r.sheltered?'Evicted, in a shelter':r.owed>0?'Owes '+hh(r.owed):r.arrears?r.arrears+' weeks behind':'Paying';
      const share=r.income>0?Math.round(r.rent/r.income*100)+'% of income':'no income';
      return `<div class="row"><b>${r.name}</b><span>${hh(r.rent)}/wk · ${share}</span><em class="${r.homeless||r.sheltered||r.arrears?'bad':''}">${st}</em></div>`}).join('');
    const pol=G.ll.policy,opts=[['cut','Cut their rent'],['time','Give them time'],['evict','Evict']];
    const policy=`<div class="card"><div class="txt"><b>When a tenant falls six weeks behind</b><small>${pol?'Your policy, applied to everyone':'You\u2019ll be asked the first time'}</small>
      <div class="seg">${opts.map(([k,l])=>`<button class="${pol===k?'on':''}" data-policy="${k}">${l}</button>`).join('')}</div></div></div>`;
    return policy+`<p class="lead">Your tenants, ${HH} households each.</p>`+(rows||'<p class="lead">You have no tenants. The estate may offer you homes.</p>');
  },
});

// the partner's Career tab
PANES.career=function(){
  const p=G.pt,h=p.history.at(-1);
  return `<p class="lead">Each bar is a year of what you’re worth. At $${PT.rate.toLocaleString('en-GB')} an hour, a billion would take you <b>${Math.round(yearsToBillion())} years</b>.</p><canvas id="chart"></canvas>
    <div class="stats" style="margin-top:8px"><div>Worth<b>${money(ptWorth())}</b></div><div>Hours a week<b>${p.hours}</b></div>
    <div>Earned last year<b>${h?money(h.earned):'–'}</b></div><div>Burnout<b>${Math.round(p.burn*100)}%</b></div>
    <div>Home<b>${p.home==='own'?'Your own':'Rented from Agnes'}</b></div><div>Partner share<b>${p.partnerShare>1?'Equity':'Salaried'}</b></div>
    <div>Loopholes written<b>${p.loopholes}</b></div><div>Evictions fought free<b>${p.proBono}</b></div>
    <div>Agnes’s retainers<b>${p.evictionWork}</b></div><div>The mill’s union<b>${{mill:'Against it',union:'For it',none:'Stayed out'}[p.unionSide]||'–'}</b></div>
    <div>Tax to the town last year<b>${h?money(h.taxToTown):'–'}</b></div><div></div></div>`;
};

// the shop owner's Café tab
PANES.cafe=function(){
  const sh=G.sh,s=G.shops[CAFE];
  return `<p class="lead">Each bar is a year of what you\u2019re worth: the café\u2019s cash and your savings. The dashed line is where you started.</p><canvas id="chart"></canvas>
    <div class="stats" style="margin-top:8px"><div>Takings a year<b>${money(s.rev*WEEKS)}</b></div><div>Rent a year<b>${money(sh.premRent*WEEKS)}</b></div>
    <div>Prices<b>${pct(sh.price-1)} on the start</b></div><div>Pay<b>${{minimum:'The minimum',standard:'The going rate',living:'A living wage'}[sh.pay]}</b></div>
    <div>Supplies<b>${sh.supply==='local'?'The local store':'The megastore'}</b></div><div>Staff<b>${staffOf(CAFE).map(r=>r.name).join(', ')||'None'}</b></div>
    <div>Café cash<b>${money(s.cash)}</b></div><div>Your savings<b>${money(bea().cash)}</b></div></div>`;
};

// the waiter's Budget tab (per household)
// a week at a glance, Monday to Sunday: the days you work, and when money comes in and goes out, with what's left
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
// a household's amount, short enough for a day's cell: $826, $1.2k
const hhShort=v=>{const x=v/HH/grow(0.02);return '$'+(x>=1000?(x/1000).toFixed(x>=10000?0:1)+'k':Math.round(x))};
function weekStrip(items){
  const left=items.reduce((a,x)=>a+(x.amt||0),0);
  const cell=d=>`<div class="day"><b>${DAYS[d]}</b>${items.filter(x=>x.day===d).map(x=>`<i class="${x.amt>0?'in':x.amt<0?'out':'do'}">${x.amt?'<u>'+(x.amt>0?'+':'\u2212')+hhShort(Math.abs(x.amt))+'</u>':''}${x.label}</i>`).join('')}</div>`;
  return `<div class="week">${DAYS.map((_,d)=>cell(d)).join('')}</div><p class="weekleft">A week like this leaves <b class="${left<0?'bad':''}">${left<0?'\u2212':''}${hh(Math.abs(left))}</b>${left<0?': savings run down':''}</p>`;
}
function waiterWeekItems(){
  const w=G.wt,r=me(),pay=G.shops[CAFE].wage*WT.shift[w.shift]*(w.trained?WT.trainedPay:1)*(w.super?1.15:1)*(w.cityPay?1.2:1)*(G.sh&&G.sh.coop?1.1:1);
  const days=w.shift==='fewer'?[1,2,4,5]:w.shift==='extra'?[0,1,2,3,4,5]:[1,2,3,4,5],out=[];
  for(const d of days)out.push({day:d,label:w.shift==='extra'&&d===5?'Double':'Shift'});
  out.push({day:0,label:'Rent',amt:-r.rent});out.push({day:4,label:'Pay',amt:pay});
  if(w.loan>0)out.push({day:3,label:'Lender',amt:-w.loan*WT.loanRate});
  if(w.union)out.push({day:4,label:'Dues',amt:-WT.dues});
  if(w.moved)out.push({day:0,label:'Bus',amt:-WT.travel*grow(0.02)});
  if(w.classes>0)out.push({day:2,label:'Class',amt:-WT.classes*(w.cheap?0.5:1)});
  if(w.benefit&&r.income>0&&G.fund>0)out.push({day:1,label:'Benefit',amt:Math.max(0,r.rent-pay/3)*0.6});
  return out;
}
function outWeekItems(){
  const o=G.ow,r=outMe(),wage=T.wage*grow(0.02),out=[];
  if(r.job!=null){for(const d of [1,2,3,4,5])out.push({day:d,label:'Work'});out.push({day:4,label:'Pay',amt:G.shops[r.job]?G.shops[r.job].wage:wage})}
  else{
    if(o.benefit&&o.sanctioned<=0&&G.fund>0)out.push({day:0,label:'Benefit',amt:wage*OW.benefit});
    if(o.benefit&&o.sanctioned>0)out.push({day:0,label:'Stopped'});
    if(o.works&&G.fund>0){for(const d of [1,2,3])out.push({day:d,label:'Works'});out.push({day:3,label:'Works pay',amt:wage*OW.works})}
    if(o.gig){for(const d of [4,5,6])out.push({day:d,label:'Rides'});out.push({day:6,label:'Gig pay',amt:wage*(o.coopGig?0.4:OW.gig)*(r.homeless?0.8:1)})}
    out.push({day:2,label:'Job centre'});
  }
  if(!r.homeless)out.push({day:0,label:'Rent',amt:-r.rent});else out.push({day:0,label:r.sheltered?'Shelter':'The park'});
  if(o.foodbank)out.push({day:3,label:'Food bank'});
  if(o.course>0)out.push({day:2,label:'Course'});
  return out;
}
PANES.budget=function(){
  const w=G.wt,r=me(),pay=G.shops[CAFE].wage*WT.shift[w.shift]*(w.trained?WT.trainedPay:1);
  return `<p class="lead">This week, and each bar a year of your savings less what you owe. Money here is one household\u2019s, in today\u2019s dollars.</p>${weekStrip(waiterWeekItems())}<canvas id="chart"></canvas>
    <div class="stats" style="margin-top:8px"><div>Pay a week<b>${hh(pay)}</b></div><div>Rent a week<b>${hh(r.rent)}</b></div>
    <div>Rent takes<b>${Math.round(r.rent/Math.max(1,pay)*100)}% of pay</b></div><div>Shifts<b>${{fewer:'Fewer',regular:'Regular',extra:'Extra'}[w.shift]}</b></div>
    <div>Savings<b>${hh(r.cash)}</b></div><div>Payday loan<b>${hh(w.loan)}</b></div>
    <div>Health<b>${Math.round(w.health*100)}%</b></div><div>Medical debt<b>${hh(r.debt)}</b></div>
    <div>Union<b>${w.union?'A member':'No'}</b></div><div>Classes<b>${w.trained?'Finished':w.classes?Math.ceil(w.classes/WEEKS)+' years to go':'No'}</b></div>
    <div>Housing benefit<b>${w.benefit?(G.fund>0?'Claimed':'The purse is empty'):'Not claimed'}</b></div><div>Public purse<b>${money(G.fund||0)}</b></div>
    <div>Getting to work<b>${w.moved?'The bus':'On foot'}</b></div><div>Weeks behind on rent<b>${r.arrears}</b></div></div>`;
};

// out of work: the Days tab
PANES.days=function(){
  const o=G.ow,r=outMe(),wage=T.wage*grow(0.02);
  const odds=Math.round(offerOdds()*100);
  return `<p class="lead">This week. Money here is one household\u2019s, in today\u2019s dollars.</p>${weekStrip(outWeekItems())}
    <div class="stats"><div>Savings<b>${hh(r.cash)}</b></div><div>Work<b>${r.job!=null?'A job':o.works?'Public works':o.gig?'Gig work':'None'}</b></div>
    <div>Benefit<b>${o.benefit?(o.sanctioned>0?'Stopped, '+o.sanctioned+' weeks':G.fund>0?hh(wage*OW.benefit)+' a week':'The purse is empty'):'Not claimed'}</b></div>
    <div>Public purse<b>${money(G.fund||0)}</b></div>
    <div>Home<b>${r.homeless?(r.sheltered?'A shelter':'Sleeping rough'):'Renting from Agnes'}</b></div><div>Rent a week<b>${r.homeless?'\u2013':hh(r.rent)}</b></div>
    <div>Health<b>${Math.round(o.health*100)}%</b></div><div>Chance of an offer<b>${odds}%</b></div>
    <div>Trained<b>${o.trained?'Yes':o.course?'On a course':'No'}</b></div><div>Organising<b>${o.organised>=3?'Leading it':o.organised?'Started':'No'}</b></div>
    <div>Food bank visits<b>${o.foodbank}</b></div><div></div></div>`;
};

// the union organiser's Union tab
PANES.union=function(){
  const u=G.un,pc=v=>Math.round(v*100)+'%';
  return `<p class="lead">A won strike raises a workplace\u2019s pay by ${Math.round(UN.winRaise*100)}%. The odds depend on how many are in and how long the fund can carry them.</p>
    <div class="stats"><div>Workers in<b>${pc(u.members)}</b></div><div>Strike fund<b>${money(u.fund)}</b></div>
    <div>A strike costs<b>${money(strikeCost())}</b></div><div>Striking<b>${u.striking?u.striking+' weeks left':'No'}</b></div>
    <div>Odds at the mill<b>${pc(strikeOdds('mill'))}</b></div><div>On the high street<b>${pc(strikeOdds('street'))}</b></div>
    ${shopsOwned()?`<div>At the estate\u2019s shops<b>${pc(strikeOdds('estate'))}</b></div><div></div>`:''}
    <div>Strikes won<b>${u.wins}</b></div><div>Strikes lost<b>${u.losses}</b></div>
    <div>Pay since you began<b>${(wageRise()>=0?'+':'')+pc(wageRise())}</b></div><div>Public purse<b>${money(G.fund||0)}</b></div></div>`;
};

// the activist's Campaign tab: support, the campaign under way, what has passed, and the purse that pays for it
PANES.campaign=function(){
  const a=G.ac,pc=v=>Math.round(v*100)+'%',k=a.campaign,left=k?Math.max(0,AC.campaignWeeks-(G.week-a.campaignStart)):0;
  const running=['shelter','childcare','medical','vouchers'].filter(x=>G.pub[x]),cost=G.lastGiftCost||{};
  const spent=running.reduce((s,x)=>s+(cost['pub-'+x]||0),0);
  return `<p class="lead">${k?'<b>'+measure(k).name+'</b>: '+(left?'the vote is in '+left+' weeks.':'the vote is due.'):'No campaign under way.'} A vote passes on support, against the measure\u2019s opponents and the estate\u2019s money. What passes lasts.</p>
    <div class="stats"><div>Behind you<b>${pc(a.support)}</b></div><div>Funds<b>${money(a.funds)}</b></div>
    <div>Chance now<b>${k?pc(voteOdds(k)):'\u2013'}</b></div><div>With a push<b>${k?pc(voteOdds(k,adsBoost())):'\u2013'}</b></div>
    <div>Purse<b>${money(G.fund||0)}</b></div><div>Paid out<b>${money(spent)}/yr</b></div></div>
    ${MEASURES.map(m=>`<div class="card"><div class="txt"><b>${m.name}</b><small>${m.note}</small><small>${a.passed.includes(m.k)?'Passed':a.donor&&m.k==='wealthtax'?'Off the table':a.lost.includes(m.k)?'Lost '+a.lost.filter(x=>x===m.k).length+'\u00d7':'Not yet'}</small></div></div>`).join('')}`;
};

// the mayor's Town hall tab: approval and the next election, the purse and the tax, and the town's own homes
// the purse's budget: last year's money in and out as two bars, each split by where it came from or went
function budgetHTML(){
  const y=G.plast,cur=G.pyear||{};const src=y&&Object.keys(y).length?y:cur,label=y&&Object.keys(y).length?'Last year':'This year so far';
  const ins=Object.entries(src).filter(([k,v])=>v>0).sort((a,b)=>b[1]-a[1]),outs=Object.entries(src).filter(([k,v])=>v<0).map(([k,v])=>[k,-v]).sort((a,b)=>b[1]-a[1]);
  const tin=ins.reduce((a,x)=>a+x[1],0),tout=outs.reduce((a,x)=>a+x[1],0),max=Math.max(tin,tout,1);
  const COLS=['#2f8a4b','#5ca56d','#8cc497','#b8d9bf','#d4a72c','#e2c36b'],COLS2=['#b23a3a','#cf6b5a','#e09a8a','#8a8478','#b5ac9b','#d0c9bb'];
  const bar=(xs,t,cols)=>`<div class="bbar">${xs.map(([k,v],i)=>`<i style="width:${(v/max*100).toFixed(1)}%;background:${cols[i%cols.length]}" title="${PURSE_NAMES[k]||k}: ${money(v)}"></i>`).join('')}</div>`;
  const legend=(xs,cols)=>xs.slice(0,4).map(([k,v],i)=>`<span><b style="background:${cols[i%cols.length]}"></b>${PURSE_NAMES[k]||k} ${money(v)}</span>`).join('');
  if(!ins.length&&!outs.length)return '';
  return `<div class="budget"><div class="cap">The purse · ${label}</div>
    <div class="brow"><small>In <b>${money(tin)}</b></small>${bar(ins,tin,COLS)}<div class="blegend">${legend(ins,COLS)}</div></div>
    <div class="brow"><small>Out <b>${money(tout)}</b></small>${bar(outs,tout,COLS2)}<div class="blegend">${legend(outs,COLS2)}</div></div></div>`;
}
PANES.hall=function(){
  const m=G.my,pc=v=>Math.round(v*100)+'%';
  return `<p class="lead">The property tax takes ${pc(MY.taxes[m.tax])} of the landlords\u2019 rents into the purse. Council homes cost a quarter of a wage, and their rent comes back to the purse.</p>
    <div class="stats"><div>Approval<b>${pc(m.approval)}</b></div><div>Re-election<b>${m.elections.length?(m.elections[0].won?'Won':'Lost'):pc(electionOdds())}</b></div>
    <div>Purse<b>${money(G.fund||0)}</b></div><div>Tax so far<b>${money(m.taxTaken)}</b></div>
    <div>Council homes<b>${m.council}</b></div><div>A home costs<b>${money(G.homePrice)}</b></div>
    <div>Donors<b>${m.donors?m.donors:'None'}</b></div><div>The mill<b>${{paid:'Subsidised',stake:'Part the town\u2019s',refused:'Refused'}[m.mill]||'\u2013'}</b></div></div>`+budgetHTML();
};

// the governor's State tab: approval, the minimum wage, the fortune tax, and the state's budget for the towns
PANES.state=function(){
  const g=G.gv,pc=v=>Math.round(v*100)+'%';
  return `<p class="lead">No shop pays less than the minimum wage. The state\u2019s budget pays grants to the towns; a tax on the biggest fortunes fills it.</p>
    <div class="stats"><div>Approval<b>${pc(g.approval)}</b></div><div>Re-election<b>${g.elections.length?(g.elections[0].won?'Won':'Lost'):pc(gvElectionOdds())}</b></div>
    <div>Minimum wage<b>${(g.minWage>=1?'+':'')+pc(g.minWage-1)}</b></div><div>Fortune tax<b>${g.fortuneTax?'1% a year':'No'}</b></div>
    <div>State budget<b>${money(g.budget)}</b></div><div>Town\u2019s purse<b>${money(G.fund||0)}</b></div>
    <div>Grants<b>${g.granted}</b></div><div>Recession<b>${g.recession>0?Math.ceil(g.recession/4)+' months left':'No'}</b></div></div>`+budgetHTML();
};

// the president's Congress tab: the bill in Congress, Congress and the country, and the laws so far
PANES.congress=function(){
  const p=G.pr,pc=v=>Math.round(v*100)+'%',k=p.bill,left=k?Math.max(0,PR.billWeeks-(G.week-p.billStart)):0;
  return `<p class="lead">${k?'<b>'+lawOf(k).name+'</b>: Congress votes '+(left?'in '+left+' weeks.':'now.'):'Nothing before Congress.'} Congress follows the country, and swings at the midterms.</p>
    <div class="stats"><div>Approval<b>${pc(p.approval)}</b></div><div>Congress<b>${pc(p.congress)}</b></div>
    <div>Chance now<b>${k?pc(congressOdds(k)):'\u2013'}</b></div><div>If you fight<b>${k?pc(congressOdds(k,0.1)):'\u2013'}</b></div>
    <div>Owed to the lobby<b>${p.lobby||'Nothing'}</b></div><div>Re-election<b>${p.elections.length?(p.elections[0].won?'Won':'Lost'):pc(prElectionOdds())}</b></div></div>${budgetHTML()}
    ${BILLS.map(b=>`<div class="card"><div class="txt"><b>${b.name}</b><small>${b.note}</small><small>${p.passed.includes(b.k)?'Law':p.struck.includes(b.k)?'Struck down':p.failed.includes(b.k)?'Voted down '+p.failed.filter(x=>x===b.k).length+'\u00d7':'Not yet'}</small></div></div>`).join('')}`;
};
