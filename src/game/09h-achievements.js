/* ================= achievements, rare endings and the heir ================= */
// Every ending of every rung is an achievement, kept on the ladder (so it lasts across lives and replays). Some
// endings have a rare form, reached only by playing a rung unusually well, or only on a second time round the loop.
// A few achievements are milestones on the ladder itself. And one rare role: a billionaire who dies a hero can be
// followed by its heir, a second billionaire life in the same town, starting from the fortune it left.
const ENDINGS={
  billionaire:{hero:'Hero',luthor:'Lex Luthor',revolt:'Revolt'},
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
    {k:'dynasty',name:'Dynasty',note:'Play the heir of a hero, and die a hero too',when:e=>e.kind==='hero'&&G.heir>0}],
  landlord:[{k:'goodlandlord',name:'The good landlord',note:'A fair landlord with homes kept nearly perfect and rents a quarter of income',when:e=>e.kind==='fair'&&e.cond>=0.9&&e.burden<=0.25}],
  partner:[{k:'peoples',name:'The people’s lawyer',note:'Counsel for the town who never took a rich client’s side',when:e=>e.kind==='counsel'&&e.forRich===0&&e.forTown>=4}],
  shop:[{k:'coop',name:'The co-op',note:'A pillar who paid a living wage for fifteen years and bought locally',when:e=>e.kind==='pillar'&&e.pay&&e.pay.living>=15&&e.supply==='local'}],
  waiter:[{k:'thriving',name:'Thriving',note:'Get ahead, trained and in full health',when:e=>e.kind==='ahead'&&e.trained&&e.health>=0.9}],
  out:[{k:'phoenix',name:'From the street',note:'Start out of work with nowhere to live, and end with a job and a home',when:e=>e.kind==='feet'&&G.ow&&G.ow.startHomeless}],
  union:[{k:'general',name:'The general strike',note:'Win four strikes and nearly every worker, and raise pay by a third',when:e=>e.kind==='fairpay'&&e.wins>=4&&e.members>=0.9&&e.rise>=0.3}],
  activist:[{k:'sweep',name:'Clean sweep',note:'Pass every measure, closing the loopholes your partner once wrote',when:e=>e.kind==='changed'&&e.passed.includes('loopholes')&&e.passed.length>=7}],
  mayor:[{k:'commons',name:'The commons',note:'Leave no home in town with a private landlord',when:e=>e.kind==='builder'&&!G.res.some(r=>r.homeOwner==='local'&&r.role!=='landlord'||r.homeOwner==='you')}],
  governor:[{k:'landslide',name:'Landslide',note:'A new deal, with 85% of the state behind you',when:e=>e.kind==='newdeal'&&e.approval>=0.85}],
  president:[{k:'utopia',name:'Utopia',note:'Rebuild the ladder in a country that was already yours, passing every bill',when:e=>e.kind==='rebuilt'&&G.pr.loop&&e.passed.length>=BILLS.length}],
};
// milestones on the ladder itself
const MILESTONES={
  bottom:{name:'All the way down',note:'Reach the bottom rung'},
  top:{name:'All the way up',note:'Finish a presidency'},
  country:{name:'The country you made',note:'Start a billionaire life under your own laws'},
  heir:{name:'The heir',note:'Play a hero’s heir to the end'},
  everyrole:{name:'Every rung',note:'Finish every role on the ladder at least once'},
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
  (R.newAch=R.newAch||[]).push(id);if(a)toast('Achievement: '+a.name);return true;
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
  G.heir=(G.heir||0)+1;G.ending=null;G.card=null;G.rung='billionaire';G.rungStart=G.week;G.startNW=netWorth();
  G.given=0;G.gains=0;G.givenAvg=0;G.gainsAvg=0;G.revoltWeeks=0;G._nw=null;G.nextCard=G.week+12;G.nextTax=G.week+T.taxEvery*WEEKS;
  toast('You are the heir');
}
