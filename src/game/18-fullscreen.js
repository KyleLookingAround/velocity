/* ================= full screen ================= */
// A button beside the speed controls, the F key and a row in Settings put the whole page full screen and back. Hidden
// where the browser can't (an iPhone's Safari: adding the game to the home screen plays it full screen there).
const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
const fsCan=()=>!!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
function toggleFull(){const d=document.documentElement;
  try{if(fsEl())(document.exitFullscreen||document.webkitExitFullscreen).call(document);
    else{const r=(d.requestFullscreen||d.webkitRequestFullscreen).call(d,{navigationUI:'hide'});if(r&&r.catch)r.catch(()=>{})}}catch(e){}}
function fullHTML(){if(!fsCan())return '';const on=!!fsEl();
  return `<div class="card"><div class="txt"><b>Full screen</b><small>The game fills the screen, with no browser bars. F does it too</small></div><button class="toggle ${on?'on':''}" data-full="1" aria-label="Full screen" aria-pressed="${on}"></button></div>`}
{const b=document.createElement('button');b.id='fs';b.setAttribute('aria-label','Full screen');b.title='Full screen (F)';
  b.innerHTML='<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  if(fsCan())$('#transport').appendChild(b);b.addEventListener('click',toggleFull)}
const fsSync=()=>{const on=!!fsEl();document.documentElement.classList.toggle('full',on);const b=$('#fs');if(b){b.classList.toggle('on',on);b.setAttribute('aria-label',on?'Leave full screen':'Full screen')}
  if(R.tab==='story')renderPane(true);if(typeof fitMap==='function')setTimeout(fitMap,60)};
document.addEventListener('fullscreenchange',fsSync);document.addEventListener('webkitfullscreenchange',fsSync);
$('#pane').addEventListener('click',e=>{if(e.target.closest('[data-full]'))toggleFull()});
addEventListener('keydown',e=>{if((e.key==='f'||e.key==='F')&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)&&!$('#modal').classList.contains('show')&&fsCan()){toggleFull();e.preventDefault()}});
