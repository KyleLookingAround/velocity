// Plays every group of tools/bot.mjs at once, one process per group, as many at a time as there are cores, and
// prints each group's tables in a fixed order once it finishes. Exits 1 if any group missed an ending.
//   node tools/bot-all.mjs            every group
//   node tools/bot-all.mjs down mayor just those
//   node tools/bot-all.mjs --baseline  every group, writing tools/baseline/ from this run
import {spawn} from 'node:child_process';
import {availableParallelism} from 'node:os';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
// (the slowest first, so the long ones aren't left running alone at the end)
const ALL=['hunt','towns','president','governor','mayor','climb','down'];
// (flags such as --baseline pass through to every group)
const args=process.argv.slice(2),flags=args.filter(a=>a.startsWith('--')),named=args.filter(a=>!a.startsWith('--'));
const groups=named.length?named:ALL;
const width=Math.max(1,Math.min(groups.length,availableParallelism()));
const results={};let next=0,failed=0;const t0=Date.now();
function run(g){
  return new Promise(res=>{
    const p=spawn(process.execPath,[join(here,'bot.mjs'),'--group',g,...flags],{stdio:['ignore','pipe','pipe']});
    let out='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>out+=d);
    p.on('close',code=>{results[g]={code,out};if(code)failed++;console.error(`${code?'FAIL':'ok  '}  ${g}  ${Math.round((Date.now()-t0)/1000)}s`);res()});
  });
}
async function worker(){while(next<groups.length)await run(groups[next++])}
await Promise.all(Array.from({length:width},worker));
for(const g of ALL.slice().reverse())if(results[g]){console.log(`\n===== ${g} =====`);console.log(results[g].out.trimEnd())}
console.log(`\n${groups.length} groups in ${Math.round((Date.now()-t0)/1000)}s, ${width} at a time: ${failed?failed+' failed':'all passed'}`);
process.exit(failed?1:0);
