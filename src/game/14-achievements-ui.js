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
    <button class="toggle-like" data-ach="1" style="border:1px solid #bbb;border-radius:8px;background:#fff;padding:6px 10px;font-weight:700">Open</button></div>`;
}
function showAchievements(){
  const all=allAchievements(),got=found(),left=all.length-got.length;
  const rows=[...Object.keys(RUNG_NAMES).map(r=>{const mine=got.filter(a=>a.rung===r);return mine.length?`<div class="ach"><small>${RUNG_NAMES[r]}</small>${mine.map(a=>`<b>${a.name}</b>${a.rare?'<span class="rare">Rare</span>':''}`).join(', ')}</div>`:''}),
    ...got.filter(a=>a.milestone).map(a=>`<div class="ach"><b>${a.name}</b><small>${a.note}</small></div>`)].join('');
  showModal(`<h2>Achievements</h2><p>${got.length} of ${all.length} found.${left?' '+left+' more to find: every ending of every rung, the rare ones, and a few milestones.':' Every one of them.'}</p>
    <div class="achlist">${rows||'<p class="lead">None yet. Every ending of every rung counts.</p>'}</div>
    <div class="opts"><button class="main" data-close="1"><b>Back to the game</b></button></div>`);
}
function showEnding(){
  showEndingCore();
  const e=G.ending,box=$('#box');if(!e)return;
  const rare=e.rare&&(RARE[e.rung]||[]).find(r=>r.k===e.rare);
  if(rare){box.querySelector('h2').innerHTML=rare.name+'<span class="rare">Rare</span>';const p=box.querySelector('h2+p');if(p)p.textContent=rare.note+'.'}
  const opts=box.querySelector('.opts');
  const fresh=(e.newAch||[]).map(id=>allAchievements().find(a=>a.id===id)).filter(Boolean);
  if(fresh.length&&opts)opts.insertAdjacentHTML('beforebegin',`<div class="ach-new"><b>New achievement${fresh.length>1?'s':''}:</b> ${fresh.map(a=>a.name+(a.rare?' (rare)':'')).join(', ')}</div>`);
  // the rare role: a hero's heir, in the same town
  if(e.rung==='billionaire'&&e.kind==='hero'&&opts)opts.insertAdjacentHTML('beforeend',`<button data-heir="1"><b>Play the heir</b><small>A rare role: inherit ${money(e.nw)} and this town</small></button>`);
}
$('#box').addEventListener('click',e=>{
  if(e.target.closest('[data-close]'))hideModal();
  if(e.target.closest('[data-heir]')){startHeir();R.stage={};buildTabs();save();renderPane(true);
    showModal(`<h2>A rare role: the heir</h2><p>You inherit ${money(netWorth())}, the foundation’s gifts, and a town that remembers who you are.</p>
      <p>A hero’s heir is a hero only by finishing richer than it started, having given away its share.</p>
      <div class="opts"><button class="main" data-start="1"><b>Start</b><small>40 years.</small></button></div>`)}
});
$('#pane').addEventListener('click',e=>{if(e.target.closest('[data-ach]'))showAchievements()});
