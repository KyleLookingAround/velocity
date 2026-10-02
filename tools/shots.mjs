// Screenshots of the built page at phone (portrait and landscape, including 320 px), tablet and desktop sizes, after a
// few years of play, into build/shots/. Also fails if the page throws. Look at them after any change to the screen.
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {root} from './sim.mjs';
const sizes=[['phone-320',320,568],['phone',390,844],['phone-landscape',844,390],['tablet',820,1180],['desktop',1440,900]];
const out=join(root,'build/shots');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'}).catch(()=>chromium.launch());
let errors=0;
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
}
await browser.close();
console.log('screenshots in build/shots');
if(errors)process.exit(1);
