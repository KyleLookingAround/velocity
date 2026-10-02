// Screenshots of the built page at phone (portrait and landscape, including 320 px), tablet and desktop sizes, into
// build/shots/. Each scene starts from a save made headless, so the screenshots repeat. Fails if the page throws.
// Look at them after any change to the screen.
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {root,loadSim} from './sim.mjs';
const sizes=[['phone-320',320,568],['phone',390,844],['phone-landscape',844,390],['tablet',820,1180],['desktop',1440,900]];
const out=join(root,'build/shots');mkdirSync(out,{recursive:true});
const acct=S=>{const o=S.cardOptions();return (o.find(o=>o.acct)||o[0]).k};
const until=(S,f,pick)=>{while(!f()&&!S.G.ending){if(S.G.card)S.answerCard(pick(S));else S.step()}};
const saves=[];
// (a week of daily lives on the Story tab, part-way through another)
{const S=loadSim(14);S.startDaily('2026-09-30');until(S,()=>S.G.week>=3*52&&!S.G.card,acct);
  S.G.ladder.daily={'2026-09-24':{kind:'luthor',nw:451e6,given:0,tries:1},'2026-09-26':{kind:'revolt',nw:312e6,given:0,tries:2},'2026-09-27':{kind:'hero',nw:104e6,given:96e6,tries:3},'2026-09-29':{kind:'giver',nw:-4e6,given:61e6,tries:1}};
  saves.push(['daily',JSON.stringify(S.G),'story'])}
// (the other towns: the port's town tab, and the suburb's Story tab with every town open)
for(const [town,seed,tab] of [['port',12,'town'],['suburb',13,'story']]){const S=loadSim(seed);S.newGame(seed,town);S.G.seen.intro=true;
  S.G.ladder.achieved={'billionaire:luthor':1,'billionaire:revolt':1,'billionaire:hero':1,'landlord:fair':1,'landlord:rentier':1,'partner:counsel':1};
  until(S,()=>S.G.week>=8*52&&!S.G.card,acct);saves.push([town,JSON.stringify(S.G),tab])}
{const S=loadSim(5);S.G.seen.intro=true;until(S,()=>!!S.G.card,acct);saves.push(['card',JSON.stringify(S.G),'fortune'])}
{const S=loadSim(6);S.G.seen.intro=true;until(S,()=>S.G.week>=22*52&&!S.G.card,acct);saves.push(['hoarder',JSON.stringify(S.G),'town'])}
{const S=loadSim(7);S.G.seen.intro=true;until(S,()=>S.G.week>=20*52&&!S.G.card,S=>{const o=S.cardOptions();return (o.find(o=>o.kind)||o[0]).k});saves.push(['giver',JSON.stringify(S.G),'commit'])}
{const S=loadSim(8);S.G.seen.intro=true;until(S,()=>false,S=>{const o=S.cardOptions();return (o.find(o=>o.none)||o[0]).k});saves.push(['ending',JSON.stringify(S.G),'fortune']);
  S.startLandlord();S.G.seen.landlord=true;S.step();saves.push(['landlord-card',JSON.stringify(S.G),'books']);
  until(S,()=>S.G.week>=S.G.rungStart+6*52&&!S.G.card,acct);saves.push(['landlord',JSON.stringify(S.G),'tenants'])}
{const S=loadSim(9);S.G.seen.intro=true;const kind=S=>{const o=S.cardOptions();return (o.find(o=>o.kind)||o[0]).k};
  until(S,()=>false,S=>{const o=S.cardOptions();return (o.find(o=>o.none)||o[0]).k});S.startLandlord();S.G.seen.landlord=true;until(S,()=>false,kind);
  S.startPartner();S.G.seen.partner=true;S.step();saves.push(['partner-card',JSON.stringify(S.G),'career']);
  until(S,()=>S.G.week>=S.G.rungStart+8*52&&!S.G.card,acct);saves.push(['partner',JSON.stringify(S.G),'career']);
  until(S,()=>false,acct);saves.push(['partner-ending',JSON.stringify(S.G),'career']);
  S.startShop();S.G.seen.shop=true;S.step();saves.push(['shop-card',JSON.stringify(S.G),'cafe']);
  until(S,()=>S.G.week>=S.G.rungStart+6*52&&!S.G.card,kind);saves.push(['shop',JSON.stringify(S.G),'cafe']);
  // (a silver card: the rare variant of a card already held)
  {const g=JSON.parse(JSON.stringify(S.G));g.card={id:'sick',d:{name:g.res.find(r=>r.role==='worker').name},week:g.week,rare:1};
    g.ladder.tipCard=true;g.ladder.cards=Object.assign({},g.ladder.cards,{'shop:sick':{title:'A child is ill',k:'paid',label:'Paid leave',week:0,life:0}});saves.push(['shop-silver',JSON.stringify(g),'decide'])}
  until(S,()=>false,kind);S.startWaiter();S.G.seen.waiter=true;S.step();saves.push(['waiter-card',JSON.stringify(S.G),'budget']);
  until(S,()=>S.G.week>=S.G.rungStart+5*52&&!S.G.card,kind);saves.push(['waiter',JSON.stringify(S.G),'budget']);
  until(S,()=>false,kind);S.startOut();S.G.seen.out=true;S.step();saves.push(['out-card',JSON.stringify(S.G),'days']);
  until(S,()=>S.G.week>=S.G.rungStart+2*52&&!S.G.card,S=>{const o=S.cardOptions();return (o.find(o=>o.none)||o[0]).k});saves.push(['out',JSON.stringify(S.G),'days']);
  until(S,()=>false,kind);saves.push(['out-ending',JSON.stringify(S.G),'days']);
  S.startUnion();S.G.seen.union=true;S.step();saves.push(['union-card',JSON.stringify(S.G),'union']);
  until(S,()=>S.G.week>=S.G.rungStart+4*52&&!S.G.card,kind);saves.push(['union',JSON.stringify(S.G),'union']);
  until(S,()=>false,kind);saves.push(['union-ending',JSON.stringify(S.G),'union']);
  S.startActivist();S.G.seen.activist=true;until(S,()=>!!S.G.card,kind);saves.push(['activist-card',JSON.stringify(S.G),'campaign']);
  until(S,()=>S.G.week>=S.G.rungStart+4*52&&!S.G.card,kind);saves.push(['activist',JSON.stringify(S.G),'campaign']);
  until(S,()=>false,kind);saves.push(['activist-ending',JSON.stringify(S.G),'campaign']);
  S.startMayor();S.G.seen.mayor=true;until(S,()=>!!S.G.card,kind);saves.push(['mayor-card',JSON.stringify(S.G),'hall']);
  until(S,()=>S.G.week>=S.G.rungStart+2*52+20&&!S.G.card,kind);saves.push(['mayor',JSON.stringify(S.G),'hall']);
  until(S,()=>false,kind);saves.push(['mayor-ending',JSON.stringify(S.G),'hall']);
  // (the re-election is a gamble: replay the mayor until one wins it, so the governor gets screenshots too)
  for(let n=0;n<6&&S.G.ending.kind==='outvoted';n++){S.restartMayor();until(S,()=>false,kind)}
  if(S.G.ending.kind!=='outvoted'){S.startGovernor();S.G.seen.governor=true;until(S,()=>!!S.G.card,kind);saves.push(['governor-card',JSON.stringify(S.G),'state']);
    until(S,()=>S.G.week>=S.G.rungStart+5*52+20&&!S.G.card,kind);saves.push(['governor',JSON.stringify(S.G),'state']);
    until(S,()=>false,kind);saves.push(['governor-ending',JSON.stringify(S.G),'state']);
    for(let n=0;n<6&&S.G.ending.kind==='unseated';n++){S.restartGovernor();until(S,()=>false,kind)}
    if(S.G.ending.kind!=='unseated'){S.startPresident();S.G.seen.president=true;until(S,()=>!!S.G.card,kind);saves.push(['president-card',JSON.stringify(S.G),'congress']);
      until(S,()=>S.G.week>=S.G.rungStart+5*52+20&&!S.G.card,kind);saves.push(['president',JSON.stringify(S.G),'congress']);
      until(S,()=>false,kind);saves.push(['president-ending',JSON.stringify(S.G),'congress']);
      // the next billionaire life, in the country that president made
      S.newGame(11);S.G.seen.intro=true;until(S,()=>S.G.week>=12*52&&!S.G.card,S=>{const o=S.cardOptions();return (o.find(o=>o.none)||o[0]).k});saves.push(['president-after',JSON.stringify(S.G),'town'])}}}
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'}).catch(()=>chromium.launch());
let errors=0;
// (SIZES=phone,desktop limits the run to those sizes)
const wanted=process.env.SIZES?process.env.SIZES.split(','):null;
for(const [name,w,h] of sizes.filter(s=>!wanted||wanted.includes(s[0]))){
  const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});
  page.on('pageerror',e=>{errors++;console.error(name+': '+e.message)});
  await page.addInitScript(()=>{window.__seed=7;localStorage.clear()});
  await page.goto('file://'+join(root,'dist/index.html'));
  await page.screenshot({path:join(out,name+'-intro.png')});
  await page.close();
  const only=process.argv[2];
  for(const [scene,save,tab] of saves.filter(x=>!only||x[0].startsWith(only))){
    const p=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});
    p.on('pageerror',e=>{errors++;console.error(name+' '+scene+': '+e.message)});
    await p.addInitScript(j=>{localStorage.setItem('money-makes-money-save-v1',JSON.stringify(Object.assign(JSON.parse(j),{speed:0})))},save);
    await p.goto('file://'+join(root,'dist/index.html'));await p.waitForTimeout(300);
    if(!JSON.parse(save).card)await p.click('#tabs [data-t="'+tab+'"]').catch(()=>{}); // (a waiting decision shows its own tab)await p.waitForTimeout(2200);
    await p.screenshot({path:join(out,name+'-'+scene+'.png')});
    await p.close();
  }
}
await browser.close();
console.log('screenshots in build/shots');
if(errors)process.exit(1);
