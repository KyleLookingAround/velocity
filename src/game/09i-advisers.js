/* ================= advisers: the upgrades ================= */
// Achievements unlock advisers, kept on the ladder. One at a time can run the game for you, each in its own way: the
// accountant takes the money option, the manager handles only the yearly routine, the conscience takes the kind
// option, your memory answers the way you did last time. The last upgrade is a faster speed. Players who want the
// details leave them off; a decision an adviser can't answer still comes to you.
const ADVISERS=[
  {k:'acct',name:'The accountant',need:1,note:()=>'Every decision goes '+(G.rung==='mayor'||G.rung==='governor'||G.rung==='president'?'the way the donors like':G.rung==='union'||G.rung==='activist'?'the easiest way for you':G.rung==='waiter'||G.rung==='out'?'the way that pays most this week':'the way that makes you the most money'),
    pick:os=>os.find(o=>o.acct)||os[0]},
  {k:'manager',name:'The manager',need:2,note:()=>'Handles the yearly routine (prices, shifts, rents, levies) the sensible way, and leaves the real decisions to you',urgentOnly:true,
    pick:os=>os.find(o=>o.kind)||os.find(o=>o.none)||os[0]},
  {k:'kind',name:'The conscience',need:4,note:()=>'Every decision goes the way that does most for the town',
    pick:os=>os.find(o=>o.kind)||os.find(o=>!o.acct)||os[0]},
  {k:'memory',name:'Your memory',need:7,note:()=>'Answers each card the way you did last time, and brings a new one to you',
    pick:(os,c)=>{const e=G.ladder.cards&&G.ladder.cards[cardKey(c)];return e?os.find(o=>o.k===e.k):null}},
  {k:'fast',name:'Sixteen times',need:10,note:()=>'A 16× speed on the transport bar',speed:true},
  // the rung's own advisers: each unlocks with that rung's best ending and plays for it, and only works on its rung
  {k:'foundation',rung:'billionaire',name:'The foundation director',ach:'billionaire:hero',note:()=>'Gives what the fortune can carry, funds the workshop when you’re rich, and takes the kind option otherwise',
    pick:(os,c)=>{if(c.id.startsWith('gift-'))return os.find(o=>o.k===(giftsRunning()+giftEstimate(c.id.slice(5))<giftBudget()?'fund':'pass'));
      if(c.id==='workshop')return os.find(o=>o.k===(G.cash>START_FORTUNE*1.5?'build':'pass'));return kindOf(os)},
    year:()=>{for(const g of ['medical','shelter','childcare','vouchers','poverty'])if(G.seenGifts[g]&&!G.gifts[g]&&giftsRunning()+giftEstimate(g)<giftBudget())setGift(g,true);
      if(giftsRunning()>giftBudget()*1.45){const g=['poverty','vouchers','childcare','shelter','medical'].find(g=>G.gifts[g]);if(g)setGift(g,false)}}},
  {k:'agent',rung:'landlord',name:'The managing agent',ach:'landlord:fair',note:()=>'Keeps rents near a third of income, repairs what the books can carry, and buys when the town is calm',
    pick:(os,c)=>{const share=tenantShare();
      if(c.id==='rent')return os.find(o=>o.k===(share>0.33?'-0.05':share>0.29?'0':'0.03'))||kindOf(os);
      if(c.id==='repairs')return os.find(o=>o.k===(G.res[0].cash>myHomes().length*LL.repairs.full*20?'full':'basic'))||kindOf(os);
      if(c.id==='estate')return os.find(o=>o.k===(G.unrest<70&&G.res[0].cash>G.homePrice*LL.deposit*3?'buy':'pass'))||kindOf(os);
      return kindOf(os)},
    // (and gives a tenant behind on the rent time, as the standing policy on the Tenants tab)
    year:()=>{if(G.ll&&!G.ll.policy)G.ll.policy='time'}},
  {k:'clerk',rung:'partner',name:'The clerk',ach:'partner:counsel',note:()=>'Takes the town’s cases and turns the rich ones down',pick:os=>kindOf(os)},
  {k:'headwaiter',rung:'shop',name:'The head waiter',ach:'shop:pillar',note:()=>'Runs the café as a pillar of the high street: fair pay, local supplies, no sale',pick:os=>kindOf(os)},
  {k:'steward',rung:'waiter',name:'The shop steward',ach:'waiter:ahead',note:()=>'Picks shifts your health can take, joins the union, and never borrows from the lender',
    pick:(os,c)=>c.id==='shifts'?os.find(o=>o.k===(G.wt.health<0.6?'fewer':'regular'))||kindOf(os):kindOf(os)},
  {k:'caseworker',rung:'out',name:'The caseworker',ach:'out:feet',note:()=>'Claims what you’re owed, takes the work that comes, and organises the people around you',pick:os=>kindOf(os)},
  {k:'secretary',rung:'union',name:'The branch secretary',ach:'union:fairpay',note:()=>'Signs people up, strikes when the odds are good, and never takes the manager’s job',pick:os=>kindOf(os)},
  {k:'campaign',rung:'activist',name:'The campaign manager',ach:'activist:changed',note:()=>'Runs every campaign for the town and turns the estate’s money down',pick:os=>kindOf(os)},
  {k:'chief',rung:'mayor',name:'The chief of staff',ach:'mayor:builder',note:()=>'Builds council homes and keeps the donors out of the town hall',pick:os=>kindOf(os)},
  {k:'treasurer',rung:'governor',name:'The state treasurer',ach:'governor:newdeal',note:()=>'Raises the minimum wage, taxes the biggest fortunes, and grants what the budget can carry',pick:os=>kindOf(os)},
  {k:'whip',rung:'president',name:'The whip',ach:'president:rebuilt',note:()=>'Puts the bills to Congress in the order most likely to pass, and turns the lobby away',pick:os=>kindOf(os)},
];
const kindOf=os=>os.find(o=>o.kind)||os.find(o=>!o.acct)||os[0];
// what a hero lets itself give a year
const giftBudget=()=>netWorth()*G.rate*0.65;
const achCount=()=>Object.keys(G.ladder.achieved||{}).length;
const adviserOpen=a=>a.ach?!!(G.ladder.achieved&&G.ladder.achieved[a.ach]):achCount()>=a.need;
// the adviser in charge, if they work on this rung
const adviserOn=()=>{const a=ADVISERS.find(a=>a.k===G.adviser);return a&&(!a.rung||a.rung===G.rung)?a:null};
// once a year, an adviser with a yearly round (the foundation director's gifts) makes it
function adviserYear(){const a=adviserOn();if(a&&a.year)a.year()}
// what the adviser in charge would answer the waiting card with, or null to leave it to you
function adviserAnswer(){
  const a=adviserOn();if(!a||!G.card||a.speed)return null;
  const c=cardDef(G.card.id);if(a.urgentOnly&&!c.urgent)return null;
  const o=a.pick(cardOptions(),c);return o?o.k:null;
}
