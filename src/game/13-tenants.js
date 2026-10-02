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
      return `<div class="card"><div class="txt"><b>${r.name}</b><small>Rent ${hh(r.rent)} a week · ${share}</small><small>${st}</small></div></div>`}).join('');
    return `<p class="lead">Your tenants, ${HH} households each.</p>`+(rows||'<p class="lead">You have no tenants. The estate may offer you homes.</p>');
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
PANES.budget=function(){
  const w=G.wt,r=me(),pay=G.shops[CAFE].wage*WT.shift[w.shift]*(w.trained?WT.trainedPay:1);
  return `<p class="lead">Each bar is a year of your savings, less what you owe. Money here is one household\u2019s, in today\u2019s dollars.</p><canvas id="chart"></canvas>
    <div class="stats" style="margin-top:8px"><div>Pay a week<b>${hh(pay)}</b></div><div>Rent a week<b>${hh(r.rent)}</b></div>
    <div>Rent takes<b>${Math.round(r.rent/Math.max(1,pay)*100)}% of pay</b></div><div>Shifts<b>${{fewer:'Fewer',regular:'Regular',extra:'Extra'}[w.shift]}</b></div>
    <div>Savings<b>${hh(r.cash)}</b></div><div>Payday loan<b>${hh(w.loan)}</b></div>
    <div>Health<b>${Math.round(w.health*100)}%</b></div><div>Medical debt<b>${hh(r.debt)}</b></div>
    <div>Union<b>${w.union?'A member':'No'}</b></div><div>Classes<b>${w.trained?'Finished':w.classes?Math.ceil(w.classes/WEEKS)+' years to go':'No'}</b></div>
    <div>Housing benefit<b>${w.benefit?(G.fund>0?'Claimed':'The purse is empty'):'Not claimed'}</b></div><div>Public purse<b>${money(G.fund||0)}</b></div>
    <div>Getting to work<b>${w.moved?'The bus':'On foot'}</b></div><div>Weeks behind on rent<b>${r.arrears}</b></div></div>`;
};
