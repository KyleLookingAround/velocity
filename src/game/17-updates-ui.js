/* ================= What's new ================= */
// Once after an update, the versions since the one this device last saw, newest first; any time from the Story tab.
const sinceSeen=()=>{const seen=prefs().seenVersion,i=UPDATES.findIndex(u=>u.v===seen);return i<0?UPDATES:UPDATES.slice(0,i)};
const whatsNewDue=()=>prefs().seenVersion!==VERSION&&sinceSeen().length>0;
function showWhatsNew(all){
  const list=all?UPDATES:sinceSeen();setPref('seenVersion',VERSION);
  showModal(`<small class="kick">Version ${VERSION}</small><h2>What’s new</h2>
    ${list.map(u=>`<div class="upd">${list.length>1?`<div class="cap">Version ${u.v}</div>`:''}<ul>${u.items.map(t=>`<li>${t}</li>`).join('')}</ul></div>`).join('')}
    <div class="opts"><button class="main" data-close="1"><b>${all?'Back to the game':'Play'}</b></button></div>`);
}
const versionHTML=()=>`<div class="card"><div class="txt"><b>Version ${VERSION}</b><small>Your save stays on this device and carries over to every new version</small></div><button class="act" data-whatsnew="1">What’s new</button></div>`;
$('#pane').addEventListener('click',e=>{if(e.target.closest('[data-whatsnew]'))showWhatsNew(true)});
