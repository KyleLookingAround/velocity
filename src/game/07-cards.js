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
      {k:'evict',label:'Evict',acct:true,you:'The home can be let again, if anyone can afford it',town:r.name+' is out on the street',scene:'notice',then:'evicted',do:()=>{G.arrearsQ.shift();evict(r);G.ll.year.evictions++}},
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

  // ---- the law firm partner ----
  {id:'hours',rung:'partner',urgent:true,cool:0,when:()=>G.hoursDue,
    title:()=>'How hard will you work this year?',
    body:()=>'You bill $'+PT.rate.toLocaleString('en-GB')+' an hour. You\u2019re '+Math.round(G.pt.burn*100)+'% burnt out; at 100% you stop.',
    options:()=>[[40,'40 hours a week','kind'],[50,'50 hours a week','none'],[60,'60 hours a week','acct'],[75,'75 hours a week','']].map(([h,label,f])=>({k:String(h),label,
      acct:f==='acct',none:f==='none',kind:f==='kind',you:'About '+money(h*PT.rate*PT.weeksWorked*G.pt.partnerShare*(1-G.pt.burn*0.4))+' this year',
      town:h>55?'You burn out faster':h<45?'You recover':'You hold steady',scene:h>55?'weekend':'office',then:null,do:()=>{G.pt.hours=h;G.hoursDue=false}}))},
  {id:'loophole',rung:'partner',cool:2*WEEKS,weight:2,when:()=>G.cash>1e6,
    title:()=>'The estate wants a loophole',
    body:()=>'The billionaire\u2019s estate pays the town about '+money(Math.max(0,G.cash)*PT.taxShare/Math.pow(2,G.pt.loopholes))+' a year in tax, which pays for public works. It wants that halved.',
    options:()=>[{k:'write',label:'Write it',acct:true,you:'A fee of '+money(feeOf(400)),town:'Public works lose half their money',scene:'loophole',then:'protest',do:()=>{G.pt.cash+=feeOf(400);G.pt.earned+=feeOf(400);G.pt.loopholes++}},
      {k:'refuse',label:'Refuse',none:true,kind:true,you:'Nothing',town:'The estate pays its tax',scene:'refuse',then:'works',do:()=>{}}]},
  {id:'agnes',rung:'partner',cool:3*WEEKS,when:()=>G.pt.evictionWork<3&&G.res.some(r=>r.homeOwner==='local'),
    title:()=>'Agnes wants you to handle her evictions',
    body:()=>'A retainer to get tenants out faster once they fall behind.',
    options:()=>[{k:'take',label:'Take the retainer',acct:true,you:'A fee of '+money(feeOf(250)),town:'Tenants are evicted two weeks sooner',scene:'handshake',then:'evicted',do:()=>{G.pt.cash+=feeOf(250);G.pt.earned+=feeOf(250);G.pt.evictionWork++}},
      {k:'refuse',label:'Refuse',none:true,kind:true,you:'Nothing',town:'Nothing changes',scene:'refuse',then:null,do:()=>{}}]},
  {id:'probono',rung:'partner',urgent:true,cool:0,when:()=>G.arrearsQ.length>0,data:()=>({i:G.arrearsQ[0]}),
    title:d=>G.res[d.i].name+' asks you to fight their eviction',
    body:d=>G.res[d.i].name+' is behind on the rent and can\u2019t pay a lawyer.',
    options:d=>{const r=G.res[d.i];return [
      {k:'take',label:'Take it for free',kind:true,you:'About '+money(feeOf(60))+' of time you don\u2019t bill',town:r.name+' stays, on a lower rent',scene:'court',then:'chain',do:()=>{G.arrearsQ.shift();G.pt.cash-=feeOf(60);G.pt.proBono++;r.arrears=0;r.rent*=0.85}},
      {k:'decline',label:'Decline',acct:true,none:true,you:'Nothing',town:r.name+' is evicted',scene:'refuse',then:'evicted',do:()=>{G.arrearsQ.shift();evict(r)}}]}},
  {id:'union',rung:'partner',cool:1e6,when:()=>!G.pt.unionSide&&rungWeek()>WEEKS,
    title:()=>'The mill wants you against its union',
    body:()=>'Its workers want a raise. The mill\u2019s owners live elsewhere, and so does the money.',
    options:()=>[{k:'mill',label:'Represent the mill',acct:true,you:'A fee of '+money(feeOf(500)),town:'Mill wages fall behind for good',scene:'handshake',then:'laidoff',do:()=>{G.pt.cash+=feeOf(500);G.pt.earned+=feeOf(500);G.pt.unionSide='mill';G.millMul=(G.millMul||1)*0.9}},
      {k:'union',label:'Represent the union',kind:true,you:'A fee of '+money(feeOf(60)),town:'Mill wages rise, and they\u2019re spent in town',scene:'court',then:'chain',do:()=>{G.pt.cash+=feeOf(60);G.pt.earned+=feeOf(60);G.pt.unionSide='union';G.millMul=(G.millMul||1)*1.1}},
      {k:'out',label:'Stay out of it',none:true,you:'Nothing',town:'They settle without you',scene:'refuse',then:null,do:()=>{G.pt.unionSide='none'}}]},
  {id:'buyin',rung:'partner',cool:1e6,when:()=>G.pt.partnerShare===1&&rungWeek()>3*WEEKS&&G.pt.cash>2.5e6,
    title:()=>'Become an equity partner?',
    body:()=>'A $2M buy-in for a quarter more of everything you bill.',
    options:()=>[{k:'buy',label:'Buy in',acct:true,you:'−$2M now, 25% more a year',town:'Nothing changes',scene:'handshake',then:null,do:()=>{G.pt.cash-=2e6;G.pt.partnerShare=1.25}},
      {k:'no',label:'No',none:true,kind:true,you:'Nothing',town:'Nothing changes',scene:'refuse',then:null,do:()=>{}}]},
  {id:'house',rung:'partner',cool:4*WEEKS,when:()=>G.pt.home==='rent'&&G.pt.cash>G.homePrice/HH*1.2,
    title:()=>'Your rent has gone up again',
    body:()=>'A home of your own would cost '+money(G.homePrice/HH)+'. You pay Agnes '+money(G.pt.rent*grow(0.03)*WEEKS)+' a year.',
    options:()=>[{k:'buy',label:'Buy a home',acct:true,kind:true,you:'No more rent, and a home that grows in value',town:'Agnes loses a tenant who always paid',scene:'deed',then:null,do:()=>{G.pt.cash-=G.homePrice/HH;G.pt.home='own';G.pt.homeValue=G.homePrice/HH}},
      {k:'rent',label:'Keep renting',none:true,you:'Nothing',town:'Nothing changes',scene:'refuse',then:null,do:()=>{}}]},

  // ---- the shop owner ----
  {id:'price',rung:'shop',urgent:true,cool:0,when:()=>G.priceDue,
    title:()=>'This year\u2019s prices at the café',
    body:()=>'You take about '+money(G.shops[CAFE].rev*WEEKS)+' a year. Every rise sends some customers to the megastore instead.',
    options:()=>[[-0.05,'Cut them 5%','kind'],[0,'Hold them','none'],[0.05,'Raise them 5%',''],[0.12,'Raise them 12%','acct']].map(([v,label,f])=>({k:String(v),label,
      acct:f==='acct',none:f==='none',kind:f==='kind',you:v>0?'More on every sale':v<0?'Less on every sale':'No change',
      town:(l=>l<0.01?'Your customers stay':'About '+Math.round(l*100)+'% of your customers go to the megastore')(Math.max(0,(G.sh.price*(1+v)-1)*1.4)),scene:'cafe',then:v>0.05?'megastore':'chain',do:()=>{G.sh.price=Math.max(0.85,G.sh.price*(1+v));G.priceDue=false}}))},
  {id:'pay',rung:'shop',cool:3*WEEKS,weight:2,when:()=>staffOf(CAFE).length>0&&rungWeek()>8,
    title:()=>'What will you pay your staff?',
    body:()=>staffOf(CAFE).map(r=>r.name).join(' and ')+' work for you. They spend most of what they earn in town, some of it at your counter.',
    options:()=>[['minimum','The legal minimum','acct'],['standard','The going rate','none'],['living','A living wage','kind']].map(([k,label,f])=>({k,label,
      acct:f==='acct',none:f==='none',kind:f==='kind',you:money(staffOf(CAFE).reduce((a,r)=>a+wageFor(r,G.shops[CAFE].wage*SH.pay[k]),0)*WEEKS)+' a year in wages',
      town:k==='living'?'They can afford the rent, and spend in town':k==='minimum'?'They fall behind on the rent':'They get by',scene:'staff',then:k==='minimum'?'rentrise':'chain',do:()=>{G.sh.pay=k}}))},
  {id:'supplier',rung:'shop',cool:5*WEEKS,when:()=>rungWeek()>20&&G.shops[3].open,
    title:()=>'Where will your supplies come from?',
    body:()=>'The megastore will deliver cheaper. Dee\u2019s store in town costs more, but the money stays here.',
    options:()=>[['mega','The megastore','acct'],['local','The local store','kind']].map(([k,label,f])=>({k,label,acct:f==='acct',kind:f==='kind',none:k===G.sh.supply,
      you:k==='mega'?'Supplies 15% cheaper':'Supplies 10% dearer',town:k==='mega'?'That money leaves town':'That money keeps the store going',scene:'supplier',then:k==='mega'?'megastore':'chain',do:()=>{G.sh.supply=k}}))},
  {id:'sick',rung:'shop',cool:2*WEEKS,when:()=>staffOf(CAFE).length>0&&rungWeek()>WEEKS,data:()=>({name:staffOf(CAFE)[0].name}),
    title:d=>d.name+'\u2019s child is ill',
    body:d=>d.name+' needs two weeks off.',
    options:d=>[{k:'paid',label:'Paid leave',kind:true,you:'Two weeks\u2019 wages for no work',town:d.name+' doesn\u2019t fall behind on the rent',scene:'staff',then:'calm',do:()=>{G.shops[CAFE].cash-=2*G.shops[CAFE].wage}},
      {k:'unpaid',label:'Unpaid',acct:true,none:true,you:'Nothing',town:d.name+' falls behind on the rent',scene:'refuse',then:'rentrise',do:()=>{const r=G.res.find(r=>r.name===d.name);if(r)r.cash-=2*G.shops[CAFE].wage;G.anger=(G.anger||0)+3}}]},
  {id:'buyout',rung:'shop',cool:4*WEEKS,when:()=>rungWeek()>3*WEEKS&&G.cash>5e6,
    title:()=>'The billionaire\u2019s estate wants to buy the café',
    body:()=>'It offers '+money(buyoutPrice())+'. Its shops cut staff and send their profit out of town.',
    options:()=>[{k:'sell',label:'Sell',acct:true,you:money(buyoutPrice())+', and you\u2019re done',town:'One of your staff loses their job',scene:'handshake',then:'laidoff',do:()=>{bea().cash+=buyoutPrice();G.sh.sold=true;endLife('sold')}},
      {k:'keep',label:'Keep it',none:true,kind:true,you:'Nothing',town:'The café stays local',scene:'cafe',then:'chain',do:()=>{}}]},
  {id:'chain',rung:'shop',cool:1e6,when:()=>rungWeek()>10*WEEKS&&shopWorth()>3e6&&G.shops[CAFE].profitAvg>0,
    title:()=>'Investors want to turn the café into a chain',
    body:()=>'A hundred cafés, a valuation in the billions, and you as founder. Or a café in a town.',
    options:()=>[{k:'found',label:'Found the chain',acct:true,you:'A billion, in time',town:'Nothing here changes. A new billionaire life begins, under the same rules',scene:'ribbon',then:'megastore',do:()=>{G.sh.founded=true;endLife('founder')}},
      {k:'stay',label:'Stay a café',none:true,kind:true,you:'Nothing',town:'Nothing changes',scene:'cafe',then:'chain',do:()=>{}}]},
  {id:'premises',rung:'shop',cool:3*WEEKS,when:()=>!G.sh.moved&&G.sh.premRent>G.shops[CAFE].rev*0.2,
    title:()=>'Agnes has put your rent up again',
    body:()=>'The premises now cost '+money(G.sh.premRent*WEEKS)+' a year, a fifth of what you take.',
    options:()=>[{k:'pay',label:'Pay it',none:true,you:'It keeps rising',town:'Nothing changes',scene:'rentbook',then:'rentrise',do:()=>{}},
      {k:'move',label:'Move to a smaller place',acct:true,you:'Rent down 40%, and slower to rise',town:'Some customers don\u2019t follow you',scene:'truck',then:'closed',do:()=>{G.sh.moved=true;G.sh.premRent*=0.6}}]},
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
