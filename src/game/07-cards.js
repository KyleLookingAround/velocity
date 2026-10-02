/* ================= decision cards ================= */
// Every choice in the game arrives as a card: an offer, a request, a vote or a problem, with two to four options. Each
// option says what it does for you and what it does to the town, and one is what your accountant recommends: whatever
// makes the most money. Cards arrive every few months (urgent ones, like a tax vote or a tenant behind on rent, at
// once), and the game waits for an answer. Gifts you fund become commitments, which you can stop on the Commitments tab.
//
// A card: {id, rung, urgent?, cool (weeks before it can come again), when(), title(d), body(d), options(d)}, where d is
// the card's data (saved with it). An option: {k, label, you, town, acct?, kind?, scene, then, do(d)}: `scene` plays on
// your side of the stage and `then` on the town's. `kind` marks the option a generous player picks, `acct` the
// accountant's, and `none` the one that leaves things as they are.
const pctYr=v=>(v>=0?'':'−')+Math.abs(v*100).toFixed(1)+'% a year';
function growthAfter(cost){const nw=Math.max(1,netWorth());return (nw*G.rate-cost)/nw}
// what a gift would cost over a year if it started now, from the town as it is
function giftEstimate(k){
  const people=G.res.filter(r=>r.role!=='landlord'),last=(G.lastGiftCost||{})[k];
  if(last&&G.gifts[k])return last;
  const rentOf=r=>r.homeless||r.sheltered||r.homeOwner==='self'?0:r.rent;
  if(k==='medical')return Math.max(people.reduce((a,r)=>a+r.debt,0)*0.5,people.length*T.medicalChance*T.medicalBill*0.6);
  if(k==='shelter')return Math.max(1,people.filter(r=>r.homeless||r.sheltered).length)*T.rent*0.6*grow(0.02)*WEEKS;
  if(k==='childcare')return people.filter(r=>r.parent&&r.job!=null).length*T.wage*grow(0.02)*(1-T.partTime)*0.3*WEEKS;
  if(k==='vouchers')return people.filter(r=>rentOf(r)&&r.income<T.wage*grow(0.02)*0.9).reduce((a,r)=>a+rentOf(r)/3,0)*WEEKS;
  if(k==='poverty')return people.reduce((a,r)=>a+Math.max(0,T.povertyLine+rentOf(r)-r.income),0)*WEEKS;
  return 0;
}
const giftCard=(k,when,title,body,then)=>({id:'gift-'+k,rung:'billionaire',cool:3*WEEKS,when:()=>!G.gifts[k]&&when(),
  title:()=>title,body:()=>body(),
  options:()=>{const c=giftEstimate(k);return [
    {k:'fund',label:'Fund it',kind:true,you:'About '+money(c)+' a year. Your fortune would grow '+pctYr(growthAfter(c+giftsRunning())),town:then,scene:'give',then:'gift-'+k,do:()=>setGift(k,true)},
    {k:'pass',label:'Not my problem',acct:true,none:true,you:'Nothing. You can start it later on the Commitments tab',town:'Nothing changes',scene:'refuse',then:null,do:()=>{}}]}});
const giftsRunning=()=>Object.keys(G.gifts).filter(k=>G.gifts[k]).reduce((a,k)=>a+giftEstimate(k),0);

const CARDS=[
  // ---- the billionaire ----
  {id:'homes',rung:'billionaire',cool:12,weight:4,when:()=>G.res.some(r=>r.homeOwner==='local')&&G.cash>=G.homePrice,
    data:()=>({name:G.res.find(r=>r.homeOwner==='local').name}),
    title:d=>'A developer offers you '+d.name+'’s street',
    body:()=>'A block of homes for '+money(G.homePrice)+'. The rent would come to you, and you could raise it faster than the old landlord.',
    options:d=>[{k:'buy',label:'Buy it',acct:true,you:'Rent of about '+money(G.res.find(r=>r.name===d.name).rent*WEEKS)+' a year, rising 7% a year',town:'Their rent climbs faster than their pay. Prices rise for everyone',scene:'deed',then:'rentrise',do:()=>buyHomes()},
      {k:'pass',label:'Pass',none:true,kind:true,you:'Nothing',town:'Nothing changes',scene:'refuse',then:null,do:()=>{}}]},
  {id:'shop',rung:'billionaire',cool:30,weight:2,when:()=>{const s=rivalTarget();return !!s&&G.cash>=shopPrice(s)*1.05},
    data:()=>({i:G.shops.indexOf(rivalTarget())}),
    title:d=>G.res[G.shops[d.i].owner].name+' will sell you the '+G.shops[d.i].name,
    body:d=>'Asking '+money(shopPrice(G.shops[d.i]))+'. Your accountant says it would make more with fewer staff.',
    options:d=>{const s=G.shops[d.i],o=G.res[s.owner].name;return [
      {k:'cut',label:'Buy it and cut costs',acct:true,you:'Its profit, with one wage fewer',town:o+' and one of the staff are out of work',scene:'handshake',then:'laidoff',do:()=>buyRival()},
      {k:'keep',label:'Buy it and keep everyone',you:'A smaller profit',town:o+' stays on to run it. Nobody loses their job',scene:'handshake',then:'chain',do:()=>buyRival(true)},
      {k:'pass',label:'Pass',none:true,kind:true,you:'Nothing',town:o+' keeps the '+s.name,scene:'refuse',then:null,do:()=>{}}]}},
  {id:'workshop',rung:'billionaire',cool:40,when:()=>G.workshops.length<T.maxWorkshops&&jobless().length>0&&G.cash>=T.workshopCost*1.1,
    title:()=>'The council asks you to open a workshop',
    body:()=>jobless().length*HH+' households are out of work. A workshop would cost '+money(T.workshopCost)+' and sell what it makes outside the town.',
    options:()=>[{k:'build',label:'Build it',kind:true,you:'About 5% a year back on '+money(T.workshopCost),town:'Up to three jobs, and wages spent in town',scene:'ribbon',then:'workshop',do:()=>build()},
      {k:'pass',label:'Pass',acct:true,none:true,you:'Your 8% elsewhere',town:'They stay out of work',scene:'refuse',then:null,do:()=>{}}]},
  {id:'borrow',rung:'billionaire',cool:1e6,when:()=>!G.borrowed&&netWorth()>60e6,
    title:()=>'Your accountant has an idea: borrow',
    body:()=>'Borrow against your shares instead of selling them. Loans aren’t income, so there’s no tax, and when you die the gains are wiped. Buy, borrow, die.',
    options:()=>[{k:'borrow',label:'Borrow against everything',acct:true,you:'Your fortune grows about 1.5% a year faster',town:'It’s in the papers. Nobody likes it',scene:'bank',then:'protest',do:()=>{G.borrowed=true;G.rate+=0.015;G.anger=(G.anger||0)+6}},
      {k:'no',label:'No',none:true,kind:true,you:'Nothing',town:'Nothing changes',scene:'refuse',then:null,do:()=>{}}]},
  {id:'senator',rung:'billionaire',cool:6*WEEKS,when:()=>!G.senator&&G.nextTax-G.week<2*WEEKS&&G.nextTax-G.week>8,
    title:()=>'A senator offers to kill the next tax vote',
    body:()=>'For a donation of '+money(netWorth()*T.lobbyCost)+', the vote coming up won’t pass.',
    options:()=>[{k:'donate',label:'Donate',acct:true,you:'The next tax vote fails',town:'The town will know who paid',scene:'handshake',then:'protest',do:()=>{G.cash-=netWorth()*T.lobbyCost;G.senator=true;G.lobbied++}},
      {k:'refuse',label:'Refuse',none:true,kind:true,you:'Nothing',town:'The vote goes ahead',scene:'refuse',then:null,do:()=>{}}]},
  {id:'raise',rung:'billionaire',cool:3*WEEKS,when:()=>shopsOwned()>0,data:()=>({i:G.shops.findIndex(s=>s.ownedByYou&&s.open)}),
    title:d=>'Staff at your '+(G.shops[d.i]||{name:'shop'}).name+' ask for a raise',
    body:()=>'Ten per cent. They say they can’t make rent.',
    options:d=>[{k:'pay',label:'Pay it',kind:true,you:'A smaller profit',town:'They spend it in town',scene:'give',then:'chain',do:()=>{const s=G.shops[d.i];if(s)s.wage*=1.1}},
      {k:'refuse',label:'Refuse',acct:true,none:true,you:'Nothing',town:'They talk about a strike',scene:'refuse',then:'strike',do:()=>{G.anger=(G.anger||0)+5}}]},
  giftCard('medical',()=>G.res.some(r=>r.debt>0),'Medical bills are breaking families',()=>G.res.filter(r=>r.debt>0).length*HH+' households owe for medical bills, and they pay them before anything else.','Debts are cleared as they arrive, and that money is spent in town instead'),
  giftCard('shelter',()=>G.res.some(r=>r.homeless),'People are sleeping in the park',()=>G.res.filter(r=>r.homeless).length*HH+' households have been evicted and have nowhere to go.','Everyone evicted gets a bed in a shelter'),
  giftCard('childcare',()=>G.res.some(r=>r.parent&&r.job!=null)&&G.week>2*WEEKS,'Parents can only work part time',()=>'Without childcare, '+G.res.filter(r=>r.parent&&r.job!=null).length*HH+' working parents earn '+Math.round(T.partTime*100)+'% of a full wage.','Parents work full time and earn full wages'),
  giftCard('vouchers',()=>G.res.some(r=>!r.homeless&&r.homeOwner!=='self'&&r.income>0&&r.rent/r.income>0.33),'Rent is eating wages',()=>'Some households pay more than a third of what they earn in rent.','A third of the rent paid for low earners'),
  giftCard('poverty',()=>R.parts&&R.parts.poor>0.15,'A charity asks you to end poverty here',()=>Math.round(R.parts.poor*19)*HH+' households live below the poverty line.','Everyone is topped up to the poverty line'),
  {id:'tax',rung:'billionaire',urgent:true,cool:0,when:()=>!!G.tax,
    title:()=>'The town votes on a wealth tax',
    body:()=>'A one-off '+Math.round(T.taxRate*100)+'% of your fortune, '+money(G.tax.amount)+', for public works. At '+Math.round(G.rate*100)+'% a year you’d earn it back in about '+(G.tax.payback<1?Math.round(G.tax.payback*12)+' months':G.tax.payback.toFixed(1)+' years')+'.',
    options:()=>[{k:'pay',label:'Pay it',kind:true,none:true,you:'−'+money(G.tax.amount),town:'Public works hire people, and unrest falls',scene:'give',then:'works',do:()=>answerTax('pay')},
      {k:'lobby',label:'Lobby against it',acct:true,you:'About '+money(netWorth()*T.lobbyCost)+'. Usually works',town:'The town notices who paid',scene:'handshake',then:'protest',do:()=>answerTax('lobby')},
      {k:'move',label:'Move your money out of state',you:money(netWorth()*T.moveCost)+' to move, and no tax at all',town:'Unrest jumps',scene:'truck',then:'protest',do:()=>answerTax('move')}]},

  // ---- the landlord ----
  {id:'rent',rung:'landlord',urgent:true,cool:0,when:()=>G.rentDue,
    title:()=>'The yearly rent review',
    body:()=>'Your tenants pay '+Math.round(tenantShare()*100)+'% of their income in rent. Wages rise about 2% a year.',
    options:()=>[[0.12,'Raise it 12%','acct'],[0.03,'Raise it 3%','none'],[0,'Hold it','kind'],[-0.05,'Cut it 5%','']].map(([v,label,f])=>({k:String(v),label,
      acct:f==='acct',none:f==='none',kind:f==='kind',you:'Rent roll about '+money(rentRoll()*(1+v))+' a year',town:'Rent at about '+Math.round(tenantShare()*(1+v)/1.02*100)+'% of income',
      scene:v>0?'letter':'rentbook',then:v>0.05?'rentrise':null,do:()=>{G.ll.rentChange=v;G.rentDue=false}}))},
  {id:'arrears',rung:'landlord',urgent:true,cool:0,when:()=>G.arrearsQ.length>0,data:()=>({i:G.arrearsQ[0]}),
    title:d=>G.res[d.i].name+' is six weeks behind on the rent',
    body:d=>{const r=G.res[d.i];return r.name+' earns '+money(r.income/HH)+' a week per household and owes '+money(r.rent/HH)+' a week in rent.'},
    options:d=>{const r=G.res[d.i];return [
      {k:'evict',label:'Evict',acct:true,you:'The home can be let again, if anyone can afford it',town:r.name+' is out on the street',scene:'notice',then:'evicted',do:()=>{G.arrearsQ.shift();evict(r);G.ll.year.evictions++;R.recent={evict:r.name}}},
      {k:'time',label:'Give them six months',none:true,you:'The rent they owe builds up',town:r.name+' stays home',scene:'rentbook',then:null,do:()=>{G.arrearsQ.shift();r.arrears=0;r.grace=G.week+26}},
      {k:'cut',label:'Cut their rent by a fifth',kind:true,you:'Less rent from '+r.name,town:r.name+' can catch up',scene:'letter',then:'chain',do:()=>{G.arrearsQ.shift();r.arrears=0;r.rent*=0.8}}]}},
  {id:'repairs',rung:'landlord',cool:2*WEEKS,when:()=>G.ll.cond<0.62||rungWeek()===8,
    title:()=>G.ll.cond<0.62?'Damp and leaks in your homes':'How much will you spend on repairs?',
    body:()=>'Your homes are '+Math.round(G.ll.cond*100)+'% kept up. Below 40%, tenants won’t pay full rent for them.',
    options:()=>[['full','Fix everything properly','kind'],['basic','Patch the worst','none'],['none','Leave it','acct']].map(([k,label,f])=>({k,label,acct:f==='acct',none:f==='none',kind:f==='kind',
      you:money(myHomes().length*LL.repairs[k]*grow(0.02)*WEEKS)+' a year',town:k==='full'?'Homes get better every year, and the money is spent in town':k==='basic'?'Homes wear slowly':'Homes fall apart',
      scene:k==='none'?'refuse':'repair',then:k==='none'?'damp':null,do:()=>{G.ll.repairs=k}}))},
  {id:'estate',rung:'landlord',cool:WEEKS,when:()=>canBuyFromEstate(),data:()=>({name:G.res.find(r=>r.homeOwner==='you').name}),
    title:d=>'The estate will sell you '+d.name+'’s homes',
    body:()=>money(G.homePrice)+', '+Math.round(LL.deposit*100)+'% down and the rest borrowed at '+Math.round(LL.rate*100)+'%. The estate puts its rents up 7% a year.',
    options:()=>[{k:'buy',label:'Buy them',acct:true,kind:true,you:'More rent, and more debt',town:'Their rent is yours to set',scene:'deed',then:null,do:()=>buyFromEstate()},
      {k:'pass',label:'Pass',none:true,you:'Nothing',town:'The estate keeps raising their rent',scene:'refuse',then:'rentrise',do:()=>{}}]},
  {id:'union',rung:'landlord',cool:4*WEEKS,when:()=>G.unrest>=55&&myHomes().length>4,
    title:()=>'Your tenants have formed a union',
    body:()=>'They want rents frozen for three years, or they’ll stop paying.',
    options:()=>[{k:'freeze',label:'Freeze the rents',kind:true,you:'No rent rises for three years',town:'The strike is off',scene:'meeting',then:'chain',do:()=>{G.freezeUntil=G.week+3*WEEKS;G.anger=(G.anger||0)-10}},
      {k:'refuse',label:'Refuse',acct:true,none:true,you:'Nothing, for now',town:'A rent strike',scene:'refuse',then:'strike',do:()=>{G.anger=(G.anger||0)+12}}]},
];
const tenantShare=()=>{const t=myHomes().filter(r=>!r.homeless&&!r.sheltered&&r.income>0);return t.length?t.reduce((a,r)=>a+r.rent/r.income,0)/t.length:0};
const cardDef=id=>CARDS.find(c=>c.id===id);
const cardOptions=()=>{const c=G.card&&cardDef(G.card.id);return c?c.options(G.card.d||{}):[]};

// each week: an urgent card at once, otherwise a new card every few months
function drawCard(){
  if(G.card||G.ending)return;
  const rung=G.rung,ok=c=>c.rung===rung&&(G.cool[c.id]==null||G.week-G.cool[c.id]>=c.cool)&&c.when();
  let c=CARDS.find(c=>c.urgent&&ok(c));
  if(!c&&G.week>=G.nextCard){
    const pool=CARDS.filter(c=>!c.urgent&&ok(c));
    // offers to buy come up more often than the rest
    let pick=rnd()*pool.reduce((a,c)=>a+(c.weight||1),0);
    for(const p of pool){pick-=p.weight||1;if(pick<=0){c=p;break}}
    G.nextCard=G.week+10+Math.floor(rnd()*8);
  }
  if(c)G.card={id:c.id,d:c.data?c.data():{},week:G.week};
}
function answerCard(k){
  const c=G.card&&cardDef(G.card.id);if(!c)return;
  const o=c.options(G.card.d||{}).find(o=>o.k===k);if(!o)return;
  const title=c.title(G.card.d||{});G.card=null;G.cool[c.id]=G.week;
  o.do();
  G.choices.push({week:G.week,rung:G.rung,id:c.id,k,title,label:o.label});
  if(c.id.startsWith('gift-'))G.seenGifts[c.id.slice(5)]=true;
  if(G.choices.length>80)G.choices.shift();
  if(!R.sim)queueScenes(o.scene,o.then,{title,label:o.label});
}
