/* ================= achievements, rare endings and the heir ================= */
// Every ending of every rung is an achievement, kept on the ladder (so it lasts across lives and replays). Some
// endings have a rare form, reached only by playing a rung unusually well, or only on a second time round the loop.
// A few achievements are milestones on the ladder itself. And one rare role: a billionaire who dies a hero can be
// followed by its heir, a second billionaire life in the same town, starting from the fortune it left.
const ENDINGS={
  billionaire:{hero:'Hero',luthor:'Lex Luthor',revolt:'Revolt',giver:'Gave it all away'},
  landlord:{fair:'A fair landlord',rentier:'A rentier',bankrupt:'Bankrupt'},
  partner:{counsel:'Counsel for the town',hiredgun:'A hired gun',burnout:'Burnt out'},
  shop:{pillar:'A pillar of the high street',tightfisted:'Kept the lights on',closed:'Closed',sold:'Sold',founder:'Founder'},
  waiter:{ahead:'Getting ahead',by:'Getting by',evicted:'Evicted'},
  out:{feet:'Back on your feet',organiser:'An organiser',stuck:'Still at the bottom'},
  union:{fairpay:'Fair wages',soldout:'Sold out',busted:'Crumbs from the table'},
  activist:{changed:'The town changed',heard:'Heard',bought:'Bought',ignored:'Ignored'},
  mayor:{builder:'The builder',machine:'The machine',caretaker:'The caretaker',outvoted:'Voted out'},
  governor:{newdeal:'A new deal',dealmaker:'The dealmaker',steward:'The steward',unseated:'Unseated'},
  president:{rebuilt:'The ladder, rebuilt',lobbied:'Owned',gridlock:'Gridlock',oneterm:'One term'},
};
// the rare forms: a rung's ending, played unusually well (or on a later loop), with its own title
const RARE={
  billionaire:[{k:'fullcircle',name:'Full circle',note:'Die a hero in a country a president of yours remade',when:e=>e.kind==='hero'&&G.pub&&G.pub.wealthtax},
    {k:'dynasty',name:'Dynasty',note:'Three generations of heroes: play the heir of a hero\u2019s heir, and die a hero too',when:e=>e.kind==='hero'&&G.heir>=2}],
  landlord:[{k:'goodlandlord',name:'The good landlord',note:'A fair landlord with homes kept nearly perfect and rents a quarter of income',when:e=>e.kind==='fair'&&e.cond>=0.9&&e.burden<=0.25}],
  partner:[{k:'peoples',name:'The people\u2019s lawyer',note:'Defend the town against the rentier landlord you once were, and never take a rich client\u2019s side',when:e=>e.kind==='counsel'&&e.forRich===0&&e.forTown>=4&&G.ladder.fromLandlord==='rentier'}],
  shop:[{k:'coop',name:'The co-op',note:'Pay a living wage, buy locally, and sell the caf\u00e9 to the people who work in it',when:e=>e.kind==='pillar'&&G.sh&&G.sh.coop}],
  waiter:[{k:'thriving',name:'Thriving',note:'Get ahead, trained and in full health, at a caf\u00e9 its staff own',when:e=>e.kind==='ahead'&&e.trained&&e.health>=0.9&&G.sh&&G.sh.coop}],
  out:[{k:'phoenix',name:'From the street',note:'Start out of work with nowhere to live, and end with a job and a home',when:e=>e.kind==='feet'&&G.ow&&G.ow.startHomeless}],
  union:[{k:'general',name:'The general strike',note:'Win strikes at the mill, on the high street and at the estate\u2019s own shops',when:e=>e.kind==='fairpay'&&G.un.wonAt&&G.un.wonAt.mill&&G.un.wonAt.street&&G.un.wonAt.estate}],
  activist:[{k:'sweep',name:'Clean sweep',note:'Pass every measure, closing the loopholes your partner once wrote',when:e=>e.kind==='changed'&&e.passed.includes('loopholes')&&e.passed.length>=7}],
  mayor:[{k:'commons',name:'The commons',note:'Leave no home in town with a private landlord, without a penny from the state',when:e=>e.kind==='builder'&&!G.my.granted&&!G.res.some(r=>r.homeOwner==='local'&&r.role!=='landlord'||r.homeOwner==='you')}],
  governor:[{k:'landslide',name:'Landslide',note:'Raise the minimum wage by half, keep 80% behind you, and leave the state\u2019s budget bigger than you found it',when:e=>e.kind==='newdeal'&&e.minWage>=1.5&&e.approval>=0.8&&G.gv.budget>=(G.gv.startBudget||0)}],
  president:[{k:'utopia',name:'Utopia',note:'Rebuild the ladder in a country that was already yours, passing every bill',when:e=>e.kind==='rebuilt'&&G.pr.loop&&e.passed.length>=BILLS.length}],
};
// milestones on the ladder itself
const MILESTONES={
  bottom:{name:'All the way down',note:'Reach the bottom rung'},
  top:{name:'All the way up',note:'Finish a presidency'},
  country:{name:'The country you made',note:'Start a billionaire life under your own laws'},
  heir:{name:'The heir',note:'Play a hero’s heir to the end'},
  everyrole:{name:'Every rung',note:'Finish every role on the ladder at least once'},
  deck:{name:'The full deck',note:'Answer every kind of card on the ladder'},
  hundredb:{name:'A hundred billion',note:'A fortune of $100B, in one life or down the generations'},
  trillion:{name:'Trillionaire',note:'A fortune of a trillion dollars: heirs of heirs, compounding for a century or more'},
};
const achId=(rung,k)=>rung+':'+k;
const allAchievements=()=>[
  ...Object.entries(ENDINGS).flatMap(([rung,ks])=>Object.entries(ks).map(([k,name])=>({id:achId(rung,k),name,rung}))),
  ...Object.entries(RARE).flatMap(([rung,rs])=>rs.map(r=>({id:achId(rung,r.k),name:r.name,note:r.note,rung,rare:true}))),
  ...Object.entries(MILESTONES).map(([k,m])=>({id:'m:'+k,name:m.name,note:m.note,milestone:true})),
];
function award(id){
  const l=G.ladder;l.achieved=l.achieved||{};if(l.achieved[id])return false;
  l.achieved[id]=G.week+1;const a=allAchievements().find(a=>a.id===id);
  (R.newAch=R.newAch||[]).push(id);if(a)toast('Achievement: '+a.name);
  if(!R.sim)R.confetti=Array.from({length:90},()=>({x:Math.random(),y:-0.05-Math.random()*0.2,vx:(Math.random()-0.5)*0.25,vy:0.15+Math.random()*0.25,r:Math.random()*6.3,s:4+Math.random()*5,c:['#2f8a4b','#d4a72c','#1b1a17','#b8781c','#8cc497'][Math.floor(Math.random()*5)],t:0})); // cosmetic
  return true;
}
// every ending passes through here: the rung's own ending, then its rare form if it earned one, and the milestones
function endLife(kind){
  if(G.ending)return;
  endLifeCore(kind);
  const e=G.ending;if(!e||e.awarded)return;
  e.awarded=true;R.newAch=[];
  const rare=(RARE[e.rung]||[]).find(r=>r.when(e));if(rare)e.rare=rare.k;
  award(achId(e.rung,e.kind));if(rare)award(achId(e.rung,rare.k));
  if(e.rung==='out')award('m:bottom');
  if(e.rung==='president'&&e.kind!=='oneterm')award('m:top');
  if(e.rung==='billionaire'&&G.heir>0)award('m:heir');
  if(Object.keys(ENDINGS).every(r=>Object.keys(ENDINGS[r]).some(k=>G.ladder.achieved[achId(r,k)])))award('m:everyrole');
  e.newAch=R.newAch.slice();
}
// the rare role: the heir of a hero, a second billionaire life in the same town, from the fortune it left
function startHeir(){
  G.heir=(G.heir||0)+1;G.ending=null;G.card=null;G.rung='billionaire';G.ageAt=START_AGE;G.rungStart=G.week;G.startNW=netWorth();
  G.given=0;G.gains=0;G.givenAvg=0;G.gainsAvg=0;G.revoltWeeks=0;G._nw=null;G.nwLog=[];G.nextCard=G.week+12;G.nextTax=G.week+T.taxEvery*WEEKS;
  toast('You are the heir');
}
