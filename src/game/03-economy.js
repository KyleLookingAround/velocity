/* ================= economy ================= */
// One week of the town. Money comes in from outside (the mill's sales, pensions, your workshops and gifts), goes round
// the spending chain (wages → shops → wages), and leaks out (the megastore, suppliers, the mill's owners, medical debt,
// and anything that comes to you). Every payment is logged in R.flows, which the map draws as flying bills.
// Party ids for flows: 'r3' a figure, 's1' a shop, 'mill', 'w0' a workshop, 'you', 'mega', 'out'.
function pay(from,to,amt,kind){
  if(!(amt>0))return 0;
  if(R.flows.length<400)R.flows.push({from,to,amt,kind});
  const local=p=>p[0]==='r'||p[0]==='s'||p==='mill'||p[0]==='w';
  if(local(from)&&local(to))G.year.tx+=amt;
  if(to==='mega')G.year.megastore+=amt;
  if(to==='you')G.year.toYou+=amt;
  return amt;
}

function economyWeek(){
  R.flows=[];
  const res=G.res,gifts=G.gifts;
  for(const r of res){r.income=0;r.spent=0}
  // the mill sells outside town and pays its six; whatever's left goes to its owners elsewhere
  for(const r of millStaff())r.income+=pay('mill','r'+res.indexOf(r),wageFor(r,T.wage*grow(0.02)),'wage');
  // your workshops do the same: each worker's output sells outside town, and the profit comes to you
  G.workshops.forEach((w,i)=>{
    let paid=0,n=0;
    res.forEach((r,k)=>{if(r.job!=='w'+i)return;const a=wageFor(r,T.wage*grow(0.02));r.income+=pay('w'+i,'r'+k,a,'wage');paid+=a;n++});
    const profit=n*T.workshopOutput*grow(0.02)*(1-T.supplies)-paid;
    G.cash+=profit>0?pay('w'+i,'you',profit,'profit'):profit;
  });
  for(const r of res)if(r.role==='retiree')r.income+=pay('out','r'+res.indexOf(r),T.pension*grow(0.02),'pension');
  // shops pay their staff, and owners take their pay and last week's profit
  G.shops.forEach((s,i)=>{
    if(!s.open)return;
    for(const r of staffOf(i)){const w=wageFor(r,s.wage);s.cash-=w;r.income+=pay('s'+i,'r'+res.indexOf(r),w,'wage')}
    if(s.ownedByYou){const take=Math.max(0,s.cash-4*s.wage);if(take>0){s.cash-=take;G.cash+=pay('s'+i,'you',take,'profit')}}
    else{const o=res[s.owner];const draw=T.ownerWage+Math.max(0,(s.cash-6*s.wage)*0.5);s.cash-=draw;o.income+=pay('s'+i,'r'+s.owner,draw,'profit')}
  });
  // gifts paid before the week's bills
  if(gifts.childcare){const cost=res.filter(r=>r.parent&&r.job!=null).length*(T.wage*grow(0.02)*(1-T.partTime)*0.3);giveOut(cost,'childcare',null)}
  // rent, debt and spending
  const spendBy={food:0,eat:0,hair:0,goods:0};
  res.forEach((r,i)=>{
    const id='r'+i;
    if(r.role==='landlord')return;
    if(r.sheltered&&!gifts.shelter){r.sheltered=false;r.homeless=true}
    if(r.sheltered)giveOut(T.rent*0.6*grow(0.02),'shelter',null);
    if(r.homeless&&r.cash>4*r.rent){r.homeless=false;r.arrears=0} // back into a home once they can pay
    let rent=r.homeless||r.sheltered||r.homeOwner==='self'?0:r.rent;
    if(rent&&gifts.vouchers&&r.income<T.wage*grow(0.02)*0.9){const v=rent/3;giveTo(i,v,'vouchers')}
    if(gifts.poverty){const short=T.povertyLine+rent-r.income;if(short>0)giveTo(i,short,'poverty')}
    r.cash+=r.income;
    // the landlord's tenants pay less in a rent strike, and less again for a home falling apart
    const mine=isLandlord()&&r.homeOwner==='local';
    if(mine&&rent){if(G.unrest>=70)rent*=0.5;if(G.ll.cond<0.4)rent*=0.7}
    if(rent){
      if(r.cash>=rent){r.cash-=rent;pay(id,r.homeOwner==='you'?'you':'r0',rent,'rent');if(r.homeOwner==='you')G.cash+=rent;else res[0].income+=rent;r.arrears=Math.max(0,r.arrears-1)
        if(mine){G.ll.year.rent+=rent;if(r.owed>0){const p=Math.min(r.owed,Math.max(0,(r.cash-rent)*0.2));r.cash-=p;r.owed-=p;res[0].income+=pay(id,'r0',p,'rent')}}}
      else if(mine&&!G.ll.evict){r.owed=(r.owed||0)+rent;G.ll.year.lost+=rent}
      else{r.arrears++;if(r.arrears>=6){evict(r);if(mine)G.ll.year.evictions++}}
    }
    if(r.debt>0){if(gifts.medical){giveOut(r.debt,'medical',i);r.debt=0}else{const p=Math.min(r.debt,T.medicalPay,Math.max(0,r.cash*0.5));r.debt-=p;r.cash-=pay(id,'out',p,'debt')}}
    const mpc=r.role==='owner'?T.mpc.mid:r.income>T.wage*1.4?T.mpc.mid:T.mpc.low;
    let s=Math.max(0,(r.income-rent)*mpc)+r.cash*T.savingsDraw;
    if(r.homeless)s=Math.min(s,T.povertyLine*0.5);
    s=Math.min(s,Math.max(0,r.cash));r.cash-=s;r.spent=s;
    for(const c of CATS)spendBy[c]+=s*CAT_SHARE[c],r['to_'+c]=s*CAT_SHARE[c];
  });
  // the landlord lives on the rent, spending a little and saving the rest
  // (as the landlord rung, you: what's left after interest and repairs, and the repairs are bought in town)
  {const ll=res[0];ll.cash+=res[0].income;let s;
    if(isLandlord()){const net=res[0].income-llInterestWeek()-llRepairsWeek();s=Math.max(0,net*T.mpc.high);const fix=llRepairsWeek();ll.cash-=fix;
      ll.cash-=s;ll.spent=s+fix;for(const c of CATS)spendBy[c]+=s*CAT_SHARE[c],ll['to_'+c]=s*CAT_SHARE[c];spendBy.goods+=fix;ll.to_goods+=fix}
    else{s=res[0].income*T.mpc.high+Math.max(0,ll.cash-200000*HH)*0.004;ll.cash-=s;ll.spent=s;
      for(const c of CATS)spendBy[c]+=s*CAT_SHARE[c],ll['to_'+c]=s*CAT_SHARE[c]}}
  // spending reaches the shops, or leaks to the megastore
  for(const c of CATS){
    const si=G.shops.findIndex(s=>s.cat===c),s=G.shops[si];
    const leak=!s.open?1:Math.min(1,CAT_LEAK[c]+(s.ownedByYou?0.05+(G.unrest>=70?0.3:G.unrest>=55?0.12:0):0));
    res.forEach((r,i)=>{const a=r['to_'+c];if(a>0){pay('r'+i,'s'+si,a*(1-leak),'spend');pay('r'+i,'mega',a*leak,'spend')}});
    const local=spendBy[c]*(1-leak);
    if(s.open){s.rev=local;s.cash+=local;s.cash-=local*T.supplies;pay('s'+si,'out',local*T.supplies,'supplies')}
  }
  // medical bills arrive at random through the year
  for(const r of res)if(r.role!=='landlord'&&rnd()<T.medicalChance/WEEKS)r.debt+=T.medicalBill;
  staffing();staffWorkshops();
  // money in working hands this week, for velocity (the landlord's savings sit still, like the vault)
  let stock=0;for(const r of res)if(r.role!=='landlord')stock+=Math.max(0,r.cash);for(const s of G.shops)if(s.open)stock+=Math.max(0,s.cash);
  G.year.stock+=stock;G.year.weeks++;
}
const wageFor=(r,w)=>r.parent&&!G.gifts.childcare?w*T.partTime:w;

function evict(r){
  r.arrears=0;
  if(G.gifts.shelter){r.homeless=false;r.sheltered=true}else r.homeless=true;
}
// the gifts you fund come out of your fortune and into the town
function giveTo(i,amt,kind){gc(kind,amt);G.cash-=amt;G.year.given+=amt;G.given+=amt;G.res[i].income+=amt;pay('you','r'+i,amt,'gift')}
function giveOut(amt,kind,i){if(!(amt>0))return;gc(kind,amt);G.cash-=amt;G.year.given+=amt;G.given+=amt;pay('you',i==null?'out':'r'+i,amt,'gift')}

// a busy shop hires from the figures out of work; one losing money lays staff off, then closes
function staffing(){
  G.shops.forEach((s,i)=>{
    if(!s.open)return;
    const staff=staffOf(i),wages=staff.reduce((a,r)=>a+wageFor(r,s.wage),0)+(s.ownedByYou?0:T.ownerWage);
    const profit=s.rev*(1-T.supplies)-wages;
    s.profitAvg=s.profitAvg*0.9+profit*0.1;
    if(s.profitAvg>s.wage*0.55&&staff.length<SHOP_DEF[i].max){s.goodWeeks++;if(s.goodWeeks>=6){const j=jobless()[0];if(j){j.job=i;s.goodWeeks=0}}}else s.goodWeeks=0;
    if(s.cash<-3*s.wage){
      if(staff.length){staff[staff.length-1].job=null;s.cash+=s.wage}
      else if(s.cash<-8*s.wage)closeShop(i);
    }
  });
}
function staffWorkshops(){G.workshops.forEach((w,i)=>{const n=G.res.filter(r=>r.job==='w'+i).length;if(n<T.workshopStaff){const j=jobless()[0];if(j)j.job='w'+i}})}
function closeShop(i){
  const s=G.shops[i];s.open=false;
  for(const r of staffOf(i))r.job=null;
  if(!s.ownedByYou){const o=G.res[s.owner];o.role='worker';o.job=null;delete o.shop}
  s.ownedByYou=false;
  toast(s.name+' has closed');
}
// a closed shop reopens when spending in town can carry it, run by someone out of work
function reopenShops(){
  G.shops.forEach((s,i)=>{
    if(s.open)return;
    const j=jobless()[0];if(!j)return;
    const spend=G.res.reduce((a,r)=>a+r.spent,0)*CAT_SHARE[s.cat]*(1-CAT_LEAK[s.cat]);
    if(spend*(1-T.supplies)>T.ownerWage*1.3){s.open=true;s.cash=4000*HH;s.owner=G.res.indexOf(j);j.role='owner';j.shop=i;s.profitAvg=0;toast(s.name+' reopens under '+j.name)}
  });
}
const gc=(k,a)=>{const y=G.year;y.gc=y.gc||{};y.gc[k]=(y.gc[k]||0)+a};
