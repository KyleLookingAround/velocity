/* ================= achievements on screen ================= */
// The Story tab opens the achievements found so far (locked ones stay hidden, with a count of how many are left).
// Each ending card shows its rare title if it earned one, the achievements it just unlocked, and, after a hero's
// death, the rare role: the heir.
const RUNG_NAMES={billionaire:'Billionaire',landlord:'Landlord',partner:'Law firm partner',shop:'Shop owner',waiter:'Waiter',out:'Out of work',
  union:'Union organiser',activist:'Activist',mayor:'Mayor',governor:'Governor',president:'President'};
// (endings reached before achievements existed count too: the ladder kept each rung's latest ending)
function syncBest(){const l=G.ladder;l.achieved=l.achieved||{};for(const [r,k] of Object.entries(l.best||{}))if(ENDINGS[r]&&ENDINGS[r][k]&&!l.achieved[achId(r,k)])l.achieved[achId(r,k)]=1}
const found=()=>(syncBest(),allAchievements()).filter(a=>G.ladder.achieved&&G.ladder.achieved[a.id]);
function achSummary(){
  const all=allAchievements(),n=found().length;
  return `<div class="card"><div class="txt"><b>Achievements</b><small>${n} of ${all.length} found${n<all.length?', some of them rare':''}</small></div>
    <button class="act" data-ach="1">The ladder</button></div>`;
}
// the ladder: down by money on the left, up by votes on the right, out of work at the foot. Each rung has a notch for
// every ending (rare ones gold) and fills them as you find them; a rung never reached keeps its name hidden
const DOWN=['billionaire','landlord','partner','shop','waiter'],UP=['president','governor','mayor','activist','union'];
const reached=r=>r==='billionaire'||G.rung===r||!!(G.ladder.unlocked&&G.ladder.unlocked[r])||Object.keys(ENDINGS[r]).some(k=>G.ladder.achieved[achId(r,k)]);
function rungHTML(r){
  const ends=Object.keys(ENDINGS[r]).map(k=>({id:achId(r,k)})),rares=(RARE[r]||[]).map(x=>({id:achId(r,x.k),rare:true}));
  const got=[...ends,...rares].filter(a=>G.ladder.achieved[a.id]).length,total=ends.length+rares.length;
  const notch=a=>`<i class="${a.rare?'gold ':''}${G.ladder.achieved[a.id]?'on':''}"></i>`;
  return `<button class="rung${G.rung===r?' here':''}${reached(r)?'':' unknown'}" data-lr="${r}">
    <span class="rn">${reached(r)?RUNG_NAMES[r]:'? ? ?'}</span><span class="notches">${ends.map(notch).join('')}${rares.map(notch).join('')}</span>
    <span class="cnt">${got}/${total}</span>${G.rung===r?'<span class="you">You</span>':''}</button>`;
}
function rungDetail(r){
  if(!reached(r))return `<p class="lead">You haven\u2019t reached this rung yet.</p>`;
  const ends=Object.entries(ENDINGS[r]).filter(([k])=>G.ladder.achieved[achId(r,k)]).map(([,n])=>n);
  const rares=(RARE[r]||[]).filter(x=>G.ladder.achieved[achId(r,x.k)]);
  const leftE=Object.keys(ENDINGS[r]).length-ends.length,leftR=(RARE[r]||[]).length-rares.length;
  return `<b>${RUNG_NAMES[r]}</b><div class="found">${ends.map(n=>`<span class="pill">${n}</span>`).join('')}${rares.map(x=>`<span class="pill gold" title="${x.note}">${x.name}</span>`).join('')}${!ends.length&&!rares.length?'<span class="lead">No endings found here yet.</span>':''}</div>
    <small>${leftE?leftE+' ending'+(leftE>1?'s':'')+' left':'Every ending found'}${leftR?' \u00b7 a rare one still hidden':rares.length?' \u00b7 the rare one found':''}</small>
    ${rares.map(x=>`<small class="note">${x.name}: ${x.note}.</small>`).join('')}
    ${!leftE&&leftR?(RARE[r]||[]).filter(x=>!G.ladder.achieved[achId(r,x.k)]).map(x=>`<small class="note">A hint: ${x.note.toLowerCase()}.</small>`).join(''):''}`;
}
function showAchievements(sel){
  syncBest();
  const all=allAchievements(),got=found(),ms=Object.keys(MILESTONES);sel=sel||G.rung;
  showModal(`<div class="ladhead"><h2>The ladder</h2><div class="score"><b>${got.length}</b> of ${all.length} found</div></div>
    <div class="bar big"><i style="width:${Math.round(got.length/all.length*100)}%"></i></div>
    <div class="ladder">
      <div class="side"><div class="cap">Down, by money</div>${DOWN.map(rungHTML).join('')}</div>
      <div class="side up"><div class="cap">Up, by votes</div>${UP.map(rungHTML).join('')}</div>
      <div class="foot">${rungHTML('out')}</div>
    </div>
    <div class="ldetail" id="ldetail">${rungDetail(sel)}</div>
    <div class="cap">Milestones</div>
    <div class="medals">${ms.map(k=>{const on=G.ladder.achieved['m:'+k];return `<div class="medal${on?' on':''}"><i>${on?'\u2605':'?'}</i><span>${on?MILESTONES[k].name:'Hidden'}</span></div>`}).join('')}</div>
    <div class="opts"><button class="main" data-close="1"><b>Back to the game</b></button></div>`);
  $('#box').classList.add('wide');
}
function showEnding(){
  showEndingCore();
  const e=G.ending,box=$('#box');if(!e)return;
  const rare=e.rare&&(RARE[e.rung]||[]).find(r=>r.k===e.rare);
  box.querySelector('h2').insertAdjacentHTML('beforebegin',`<small class="kick">The end \u00b7 ${RUNG_NAMES[e.rung]}${e.heir?' (heir)':''}</small>`);box.classList.add('ending');
  if(rare){box.querySelector('h2').innerHTML=rare.name+'<span class="rare">Rare</span>';const p=box.querySelector('h2+p');if(p)p.textContent=rare.note+'.'}
  const opts=box.querySelector('.opts');
  // this rung's notches, so the card shows what's left to find here
  if(opts&&ENDINGS[e.rung]){const ids=[...Object.keys(ENDINGS[e.rung]).map(k=>[achId(e.rung,k),0]),...(RARE[e.rung]||[]).map(x=>[achId(e.rung,x.k),1])];
    const got=ids.filter(([id])=>G.ladder.achieved[id]).length;
    opts.insertAdjacentHTML('beforebegin',`<div class="endnotches"><span class="notches">${ids.map(([id,r])=>`<i class="${r?'gold ':''}${G.ladder.achieved[id]?'on':''}"></i>`).join('')}</span><small>${got} of ${ids.length} found on this rung</small></div>`)}
  const fresh=(e.newAch||[]).map(id=>allAchievements().find(a=>a.id===id)).filter(Boolean);
  if(fresh.length&&opts)opts.insertAdjacentHTML('beforebegin',`<div class="ach-new"><b>New achievement${fresh.length>1?'s':''}:</b> ${fresh.map(a=>a.name+(a.rare?' (rare)':'')).join(', ')}</div>`);
  // the rare role: a hero's heir, in the same town
  if(e.rung==='billionaire'&&e.kind==='hero'&&opts)opts.insertAdjacentHTML('beforeend',`<button data-heir="1"><b>Play the heir</b><small>A rare role: inherit ${money(e.nw)} and this town</small></button>`);
}
$('#box').addEventListener('click',e=>{
  if(e.target.closest('[data-close]')){hideModal();$('#box').classList.remove('wide')}
  const lr=e.target.closest('[data-lr]');if(lr){$('#ldetail').innerHTML=rungDetail(lr.dataset.lr);document.querySelectorAll('.rung.sel').forEach(x=>x.classList.remove('sel'));lr.classList.add('sel')}
  if(e.target.closest('[data-heir]')){startHeir();R.stage={};buildTabs();save();renderPane(true);
    showModal(`<h2>A rare role: the heir</h2><p>You inherit ${money(netWorth())}, the foundation’s gifts, and a town that remembers who you are.</p>
      <p>A hero’s heir is a hero only by finishing richer than it started, having given away its share.</p>
      <div class="opts"><button class="main" data-start="1"><b>Start</b><small>40 years.</small></button></div>`)}
});
$('#pane').addEventListener('click',e=>{if(e.target.closest('[data-ach]'))showAchievements()});

// the top bar's ladder chip (which rung you're on; it opens the ladder) and the thin bar of years through the rung
const RUNG_ORDER=['billionaire','landlord','partner','shop','waiter','out','union','activist','mayor','governor','president'];
function topExtras(){
  const chip=$('#lad');if(!chip)return;
  const n=RUNG_ORDER.indexOf(G.rung)+1,got=G.ladder.achieved?Object.keys(G.ladder.achieved).length:0;
  const txt=`<b>${RUNG_NAMES[G.rung]}${G.heir?' (heir)':''}</b><span>Rung ${n} of 11 \u00b7 ${got} found</span><em>${n}/11</em>`;
  if(chip.innerHTML!==txt)chip.innerHTML=txt;
  $('#speed').classList.toggle('paused',G.speed===0&&!G.card&&!G.ending);
  $('#yearbar').style.width=Math.min(100,rungWeek()/Math.max(1,rungWeeks())*100)+'%';
}
$('#lad').addEventListener('click',()=>{if(!$('#modal').classList.contains('show'))showAchievements()});

// the keyboard, for desktops: space pauses and plays, 1 to 4 set the speed (or pick a waiting decision's options),
// and Escape closes the ladder
addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;
  const modal=$('#modal').classList.contains('show');
  if(e.key==='Escape'&&modal&&$('#box').querySelector('[data-close]')){hideModal();e.preventDefault();return}
  if(modal)return;
  if(e.key===' '){G.speed=G.speed?0:(R.lastSpeed||1);if(G.speed)R.lastSpeed=G.speed;refreshTop();e.preventDefault();return}
  const n=+e.key;if(!(n>=1&&n<=4))return;
  if(G.card){const b=document.querySelectorAll('#pane [data-card]')[n-1];if(b)b.click();return}
  G.speed=SPEEDS[n];R.lastSpeed=G.speed;refreshTop();
});
