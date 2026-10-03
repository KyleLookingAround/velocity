// Writes this version's saves into tools/saves/: a billionaire ten years in, a shop owner five years in and a mayor two
// years in, each as the page would save it. The bot's saves group loads every save there and plays on, so a later
// version that breaks an old save fails the checks. Run it once per release, after raising VERSION.
import {writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {loadSim,root} from './sim.mjs';
const S=loadSim(4),kind=()=>{const o=S.cardOptions();return (o.find(o=>o.kind)||o[0]).k};
const until=f=>{let n=0;while(!f()&&!S.G.ending&&n++<1e6){if(S.G.card)S.answerCard(kind());else S.step()}};
const years=y=>{const w=S.G.week+y*S.WEEKS;until(()=>S.G.week>=w)};
const finish=()=>until(()=>false);
const dir=join(root,'tools/saves');mkdirSync(dir,{recursive:true});
const write=name=>{const f=join(dir,S.VERSION+'-'+name+'.json');S.G.ver=S.VERSION;writeFileSync(f,JSON.stringify(S.G));console.log('wrote '+f)};
years(10);write('billionaire');finish();
S.startLandlord();finish();S.startPartner();finish();S.startShop();years(5);write('shop');finish();
for(const r of ['startWaiter','startOut','startUnion','startActivist','startMayor']){S[r]();if(r==='startMayor')break;finish()}
years(2);write('mayor');
