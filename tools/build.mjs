// Builds the single-page game from src/: src/shell.html with the files in src/game joined, in file-name order, where
// its /*GAME*/ marker sits, into dist/index.html. Plain Node, no dependencies. Fails, naming the file and line, on a slip.
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {Script} from 'node:vm';
import {root} from './sim.mjs';
const fail=m=>{console.error('build: '+m);process.exit(1)};
const shell=readFileSync(join(root,'src/shell.html'),'utf8');
if(!shell.includes('/*GAME*/'))fail('src/shell.html has lost its /*GAME*/ marker');
const files=readdirSync(join(root,'src/game')).filter(f=>f.endsWith('.js')).sort();
const parts=files.map(f=>({file:'src/game/'+f,text:readFileSync(join(root,'src/game',f),'utf8')}));
for(const p of parts){
  if(/<\/script/i.test(p.text))fail(p.file+' must not contain a closing script tag');
  try{new Script(p.text,{filename:p.file})}catch(e){fail(p.file+': '+e.message)}
  // a run must repeat from its seed: anything that changes the game takes its randomness from rnd()
  p.text.split('\n').forEach((l,i)=>{if(/Math\.random\(/.test(l)&&!/\/\/ cosmetic\s*$/.test(l))fail(`${p.file}:${i+1} uses Math.random(); use rnd(), or end the line with // cosmetic if it only affects drawing`)});
}
const game=parts.map(p=>p.text).join('\n');
try{new Script('(()=>{"use strict";'+game+'})',{filename:'src/game'})}catch(e){fail('joined game: '+e.message)}
const page=shell.replace('/*GAME*/',()=>game);
mkdirSync(join(root,'dist'),{recursive:true});writeFileSync(join(root,'dist/index.html'),page);
console.log(`built dist/index.html (${Math.round(page.length/1024)} KB) from ${parts.length} files`);
