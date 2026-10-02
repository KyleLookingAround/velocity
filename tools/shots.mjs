// Screenshots of the built page at phone (portrait and landscape, including 320 px), tablet and desktop sizes, after a
// few years of play, into build/shots/. Also fails if the page throws. Look at them after any change to the screen.
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {root,loadSim} from './sim.mjs';
const sizes=[['phone-320',320,568],['phone',390,844],['phone-landscape',844,390],['tablet',820,1180],['desktop',1440,900]];
const out=join(root,'build/shots');mkdirSync(out,{recursive:true});
// a cloud session has Chromium at /opt/pw-browsers; CI installs Playwright's own
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'}).catch(()=>chromium.launch());
let errors=0;
// saves made headless: a billionaire's life just ended (the step-down card), and a landlord six years in
const S=loadSim(4);
while(!S.G.ending){if(S.G.tax)S.answerTax('pay');if(S.G.week===15*52){for(const g of ['medical','shelter'])S.setGift(g,true)}S.step();if(S.G.tax&&!S.G.ending)S.answerTax('pay')}
S.G.seen.intro=true;const ended=JSON.stringify(S.G);
S.startLandlord();S.G.seen.landlord=true;S.setEvict(false);S.setRepairs('none');S.setRentChange(0.07);
for(let w=0;w<6*52;w++)S.step();S.G.speed=1;const landlord=JSON.stringify(S.G);
const scenes=[['ending',ended,'moves'],['landlord',landlord,'homes'],['landlord-tenants',landlord,'tenants']];
for(const [name,w,h] of sizes){
  const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});
  page.on('pageerror',e=>{errors++;console.error(name+': '+e.message)});
  await page.addInitScript(()=>{window.__seed=7;localStorage.clear()});
  await page.goto('file://'+join(root,'dist/index.html'));
  await page.screenshot({path:join(out,name+'-intro.png')});
  await page.click('[data-start]');
  // play twelve years at top speed with a home bought and two gifts on, so the map has something to show
  await page.evaluate(()=>{document.querySelector('[data-s="8"]').click()});
  await page.click('[data-move="homes"]').catch(()=>{});
  await page.click('#tabs [data-t="gifts"]');await page.click('[data-gift="medical"]');await page.click('[data-gift="shelter"]');
  await page.waitForTimeout(1500);
  await page.screenshot({path:join(out,name+'.png')});
  await page.close();
  // each scene in a fresh page whose save is in place before the game loads
  for(const [scene,save,tab] of scenes){
    const p=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});
    p.on('pageerror',e=>{errors++;console.error(name+' '+scene+': '+e.message)});
    await p.addInitScript(j=>{localStorage.setItem('money-makes-money-save-v1',j)},save);
    await p.goto('file://'+join(root,'dist/index.html'));await p.waitForTimeout(300);
    await p.click('#tabs [data-t="'+tab+'"]').catch(()=>{});await p.waitForTimeout(700);
    await p.screenshot({path:join(out,name+'-'+scene+'.png')});
    await p.close();
  }

}
await browser.close();
console.log('screenshots in build/shots');
if(errors)process.exit(1);
