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
];
const achCount=()=>Object.keys(G.ladder.achieved||{}).length;
const adviserOpen=a=>achCount()>=a.need;
// what the adviser in charge would answer the waiting card with, or null to leave it to you
function adviserAnswer(){
  const a=ADVISERS.find(a=>a.k===G.adviser);if(!a||!G.card||a.speed)return null;
  const c=cardDef(G.card.id);if(a.urgentOnly&&!c.urgent)return null;
  const o=a.pick(cardOptions(),c);return o?o.k:null;
}
