/* ================= the chronicle on screen ================= */
// A page per run on the Story tab: each life in order, its ending, what it left the town and the names it touched.
// The newest run can be saved as one tall picture, the share card for a whole run.
const chronEnd=c=>{const r=c.rare&&(RARE[c.rung]||[]).find(x=>x.k===c.rare);return r?r.name:(ENDINGS[c.rung]||{})[c.kind]||c.kind};
// what a life left the town, in a few words: the worst of it first, and the purse if there was one
function chronLeft(c){const l=c.left,out=[];
  if(l.rough)out.push(l.rough*HH+' sleeping rough');if(l.jobless)out.push(l.jobless*HH+' out of work');
  if(l.shops<4)out.push(l.shops+' of 4 shops open');out.push('unrest '+l.unrest);if(l.purse>0)out.push('a purse of '+money(l.purse));
  return out.join(', ')}
const chronRole=c=>(RUNG_NAMES[c.rung]||c.rung)+(c.heir?' (heir)':'')+(c.who?' · '+c.who:'');
const chronTitle=(run,i,n)=>(i===0?'This run':'Run '+(n-i))+' · '+(TOWNS[run[0].town]||TOWNS.mill).name+(run[0].daily?' · today’s life, '+dayName(run[0].daily):'');
function chronHTML(){const runs=chronRuns();if(!runs.length)return '';const lives=(G.ladder.chron||[]).length;
  return `<div class="card"><div class="txt"><b>The chronicle</b><small>${runs.length} run${runs.length===1?'':'s'}, ${lives} li${lives===1?'fe':'ves'}: each one in order, and what it left the town</small></div><button class="act" data-chron="1">Read it</button></div>`}
function showChronicle(){
  const runs=chronRuns(),n=runs.length;
  const life=c=>`<div class="chlife${c.rare?' gold':''}"><small>${chronRole(c)} · ${c.years} year${c.years===1?'':'s'}</small><b>${chronEnd(c)}</b>
    <span>Left the town: ${chronLeft(c)}</span>${c.lines.length?`<span class="names">${c.lines.join(' \u00b7 ')}</span>`:c.names.length?`<span class="names">Touched: ${c.names.join(', ')}</span>`:''}</div>`;
  const pages=runs.map((run,i)=>`<div class="chrun"><div class="cap">${chronTitle(run,i,n)}</div>${run.map(life).join('')}</div>`).join('');
  showModal(`<div class="ladhead"><h2>The chronicle</h2><div class="score"><b>${n}</b> run${n===1?'':'s'}</div></div>
    <p class="lead">Every life you’ve finished, run by run. A run starts with each new billionaire life and goes down and up the ladder from there.</p>
    <div class="achlist">${pages}</div><div class="opts"><button data-chronshare="1"><b>Save this run as a picture</b><small>The newest run, every life on one card</small></button><button class="main" data-close="1"><b>Back to the game</b></button></div>`);
  $('#box').classList.add('wide');
}
// the newest run as a tall picture: a line per life, the ending big, what it left small
function chronPicture(){
  const run=chronRuns()[0]||[],W=1080,rowH=150,H=Math.max(900,560+run.length*rowH),c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle='#f4efe6';x.fillRect(0,0,W,H);x.save();x.beginPath();x.roundRect(50,50,W-100,H-100,40);x.clip();x.fillStyle='#fffdf8';x.fillRect(50,50,W-100,H-100);
  x.fillStyle='#2e8749';x.fillRect(50,50,W-100,14);x.restore();
  const fit=(t,font,maxW)=>{x.font=font;if(x.measureText(t).width<=maxW)return t;while(t.length>3&&x.measureText(t+'…').width>maxW)t=t.slice(0,-1);return t+'…'};
  x.textAlign='left';x.font='800 34px Inter,system-ui,sans-serif';x.fillStyle='#8a8478';x.fillText(('A run in '+(TOWNS[(run[0]||{}).town]||TOWNS.mill).name).toUpperCase(),90,170);
  x.font='800 80px "Bricolage Grotesque",Inter,system-ui,sans-serif';x.fillStyle='#1b1a17';x.fillText(run.length+' li'+(run.length===1?'fe':'ves'),90,260);
  run.forEach((cl,i)=>{const y=340+i*rowH;x.fillStyle=cl.rare?'#d4a72c':'#2e8749';x.beginPath();x.arc(104,y+28,12,0,7);x.fill();
    if(i<run.length-1){x.fillStyle='#d8d0c2';x.fillRect(102,y+44,4,rowH-30)}
    x.fillStyle='#8a8478';x.fillText(fit(chronRole(cl)+' · '+cl.years+' years','600 28px Inter,system-ui,sans-serif',W-240),140,y+12);
    x.fillStyle='#1b1a17';x.fillText(fit(chronEnd(cl),'800 48px "Bricolage Grotesque",Inter,system-ui,sans-serif',W-240),140,y+66);
    x.fillStyle='#4d483f';x.fillText(fit('Left: '+chronLeft(cl),'500 28px Inter,system-ui,sans-serif',W-240),140,y+108)});
  x.font='800 56px "Bricolage Grotesque",Inter,system-ui,sans-serif';x.fillStyle='#1b1a17';x.fillText('Money Makes Money',90,H-110);
  return c;
}
function shareChronicle(){
  const c=chronPicture(),name='money-makes-money-run.png';
  c.toBlob(b=>{if(!b)return;const f=new File([b],name,{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[f]}))navigator.share({files:[f],title:'Money Makes Money'}).catch(()=>{});
    else{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}},'image/png');
}
$('#pane').addEventListener('click',e=>{if(e.target.closest('[data-chron]'))showChronicle()});
$('#box').addEventListener('click',e=>{if(e.target.closest('[data-chronshare]'))shareChronicle()});
