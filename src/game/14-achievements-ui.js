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
  const all=allAchievements(),n=found().length,cards=Object.keys(G.ladder.cards||{}).length;
  return `<div class="card"><div class="txt"><b>Achievements</b><small>${n} of ${all.length} found${n<all.length?', some of them rare':''}</small></div>
    <button class="act" data-ach="1">The ladder</button></div>
    <div class="card"><div class="txt"><b>Your cards</b><small>${cards} of ${CARDS.length} collected: every kind of decision is one</small></div>
    <button class="act" data-deck="1">The deck</button></div>
    ${prefsHTML()}<div class="card"><div class="txt"><b>Your save</b><small>Carry this game to another device</small></div><button class="act" data-savebox="1">Move it</button></div>`;
}
// the threads: what your lives did to named people, newest first
function threadsHTML(){
  const ts=(G.threads||[]).slice(-8).reverse().map(t=>`<div class="story"><small>${RUNG_NAMES[t.rung]||t.rung}</small><b>${threadText(t)}</b></div>`).join('');
  return ts?`<div class="card"><div class="txt"><b>The town remembers</b><small>What your lives did to people here. It shows on the stage, and the climb counts it.</small></div></div>${ts}`:'';
}
// the advisers unlocked so far, one of them in charge or none; locked ones stay hidden, with the next one's price
function advisersHTML(){
  syncBest();const open=ADVISERS.filter(adviserOpen),next=ADVISERS.find(a=>!a.rung&&!adviserOpen(a)),n=achCount();
  const here=ADVISERS.find(a=>a.rung===G.rung),hereOpen=here&&adviserOpen(here);
  const row=a=>a.speed?`<div class="card"><div class="txt"><b>${a.name}</b><small>${a.note()}</small></div><span class="kick">Unlocked</span></div>`:
    `<div class="card"><div class="txt"><b>${a.name}${a.rung?' <span class="kick">'+RUNG_NAMES[a.rung]+'</span>':''}</b><small>${a.note()}</small></div><button class="toggle ${G.adviser===a.k?'on':''}" data-adv="${a.k}" aria-label="${a.name}" aria-pressed="${G.adviser===a.k}"></button></div>`;
  return `<div class="card"><div class="txt"><b>Advisers</b><small>${open.length?open.length+' unlocked by your achievements. One can run things for you; switch them off to decide everything yourself.':'Achievements unlock advisers who can run things for you.'}${next?' Next: <b>'+next.name+'</b> at '+next.need+' achievement'+(next.need===1?'':'s')+' (you have '+n+').':''}${here&&!hereOpen?' This rung’s own adviser, <b>'+here.name+'</b>, comes with its best ending.':''}</small></div></div>`+
    (adviserOn()&&!adviserOn().speed&&!G.ending?`<div class="card"><div class="txt"><b>Let ${adviserOn().name.toLowerCase()} finish this rung</b><small>Years go by fast with their answers; a card they leave to you stops it, and so does pause.</small></div><button class="act" data-skip="1">${R.skip?'Stop':'Run it'}</button></div>`:'')+
    open.filter(a=>!a.rung).map(row).join('')+open.filter(a=>a.rung).sort((a,b)=>(a.rung===G.rung?0:1)-(b.rung===G.rung?0:1)).map(row).join('');
}
// the deck: every kind of card on each rung, collected ones face up with the answer you gave last
function showDeck(){
  syncBest();
  const L=G.ladder.cards||{},total=CARDS.length,n=Object.keys(L).length;
  const rows=RUNG_ORDER.map(r=>{const cs=CARDS.filter(c=>c.rung===r);if(!cs.length)return '';
    const got=cs.filter(c=>L[cardKey(c)]).length,known=reached(r);
    return `<div class="dsec"><div class="cap">${known?RUNG_NAMES[r]:'? ? ?'} \u00b7 ${got}/${cs.length}</div><div class="deck">${cs.map(c=>{const e=L[cardKey(c)],rare=cardRare(c);
      return e?`<div class="dcard on${rare?' gold':''}"><i>\u2605</i><b>${e.title}</b><small>${e.label}</small></div>`:`<div class="dcard${rare?' gold':''}"><i>${rare?'\u2606':'?'}</i><b>${known?'Not yet':'? ? ?'}</b></div>`}).join('')}</div></div>`}).join('');
  showModal(`<div class="ladhead"><h2>Your cards</h2><div class="score"><b>${n}</b> of ${total}</div></div><div class="bar big"><i style="width:${Math.round(n/total*100)}%"></i></div>
    <p class="lead">Every kind of decision is a card. Answer it once and it\u2019s yours, on every life after. A gold star marks a card that comes once in a life.</p>
    <div class="achlist">${rows}</div><div class="opts"><button class="main" data-close="1"><b>Back to the game</b></button></div>`);
  $('#box').classList.add('wide');
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
  showEndingCore();if(typeof sfx==='function')sfx(G.ending&&G.ending.newAch&&G.ending.newAch.length?'achieve':'ending',[30,60,30]);
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
  // on a phone not yet playing from the home screen, one offer to put it there
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone,ios=/iPhone|iPad|iPod/.test(navigator.userAgent);
  if(opts&&!standalone&&!prefs().installed&&(R.install||ios)&&/^https?:/.test(location.protocol))opts.insertAdjacentHTML('beforeend',`<button data-install="1"><b>Add it to your home screen</b><small>Full screen, and it plays offline</small></button>`);
  if(opts)opts.insertAdjacentHTML('beforeend',`<button data-share="1"><b>Save the picture</b><small>This ending as an image, to keep or send</small></button>`);
  // the rare role: a hero's heir, in the same town
  if(e.rung==='billionaire'&&e.kind==='hero'&&opts)opts.insertAdjacentHTML('beforeend',`<button data-heir="1"><b>Play the heir</b><small>A rare role: inherit ${money(e.nw)} and this town</small></button>`);
}
$('#box').addEventListener('click',e=>{
  if(e.target.closest('[data-close]')){hideModal();$('#box').classList.remove('wide')}
  if(e.target.closest('[data-share]')){shareEnding();return}
  const ib=e.target.closest('[data-install]');if(ib){setPref('installed',true);ib.remove();
    if(R.install){R.install.prompt();R.install=null}else{const i=$('#info');i.innerHTML='<b>On an iPhone</b> \u00b7 tap Share, then \u201cAdd to Home Screen\u201d.';i.classList.add('show');clearTimeout(R.infoT);R.infoT=setTimeout(()=>i.classList.remove('show'),7000)}return}
  if(e.target.closest('[data-copysave]')){const t=$('#savecode');t.select();(navigator.clipboard?navigator.clipboard.writeText(t.value):Promise.reject()).then(()=>toast('Save copied'),()=>{try{document.execCommand('copy');toast('Save copied')}catch(x){}});return}
  if(e.target.closest('[data-loadsave]')){if(!loadCode($('#saveload').value))showSaveBox('That doesn\u2019t look like a save from this game.');return}
  const lr=e.target.closest('[data-lr]');if(lr){$('#ldetail').innerHTML=rungDetail(lr.dataset.lr);document.querySelectorAll('.rung.sel').forEach(x=>x.classList.remove('sel'));lr.classList.add('sel')}
  if(e.target.closest('[data-heir]')){startHeir();R.stage={};buildTabs();save();renderPane(true);
    showModal(`<h2>A rare role: the heir</h2><p>You inherit ${money(netWorth())}, the foundation’s gifts, and a town that remembers who you are.</p>
      <p>A hero’s heir is a hero only by finishing richer than it started, having given away its share.</p>
      <div class="opts"><button class="main" data-start="1"><b>Start</b><small>40 years.</small></button></div>`)}
});
$('#pane').addEventListener('click',e=>{const pf=e.target.closest('[data-pref]');if(pf){setPref(pf.dataset.pref,!prefs()[pf.dataset.pref]);renderPane(true)}if(e.target.closest('[data-savebox]'))showSaveBox();if(e.target.closest('[data-ach]'))showAchievements();if(e.target.closest('[data-deck]'))showDeck()});

// the top bar's ladder chip (which rung you're on; it opens the ladder) and the thin bar of years through the rung
const RUNG_ORDER=['billionaire','landlord','partner','shop','waiter','out','union','activist','mayor','governor','president'];
function topExtras(){
  moments();
  const n=RUNG_ORDER.indexOf(G.rung)+1;
  const txt=`<b>${RUNG_NAMES[G.rung]}${G.heir?' (heir)':''}</b><span> \u00b7 Rung ${n} of 11</span><em> \u00b7 ${n}/11</em>`;
  const lad=$('#lad');if(lad.innerHTML!==txt)lad.innerHTML=txt;
  $('#speed').classList.toggle('paused',G.speed===0&&!G.card&&!G.ending);$('#speed').classList.toggle('held',!!G.card&&!G.ending);
  $('#yearbar').style.width=Math.min(100,rungWeek()/Math.max(1,rungWeeks())*100)+'%';
  // the year ticks over
  const y=yearNo();if(R.lastYear!==undefined&&y!==R.lastYear){const c=$('#clock');c.classList.remove('tick');void c.offsetWidth;c.classList.add('tick')}R.lastYear=y;
  // what's next: a decision waiting, or roughly when the next one comes
  let long,short;
  if(G.ending){long='The end of this life';short='The end'}
  else if(R.skip){const a=adviserOn();long='<b>'+(a?a.name:'Your adviser')+'</b> runs it \u00b7 tap pause to take over';short='<b>'+(a?a.name.replace(/^The /,''):'Adviser')+'</b> runs it'}
  else if(G.card){long='<b>Your turn</b> \u00b7 time waits while you decide';short='<b>Your turn</b><span class="tw"> \u00b7 time waits</span>'}
  else{const w=Math.max(0,G.nextCard-G.week),m=w<9?2:Math.round(w/4.33),p=G.speed===0?'<b>Paused</b> \u00b7 ':'';
    long=p+(p?'n':'N')+'ext decision '+(w<=2?'any week now':w<6?'in a few weeks':'in about '+(m===2?'two':m)+' months');
    short='Next: '+(w<=2?'any week':w<6?'a few weeks':'~'+m+' months')}
  const next=`<span class="long">${long}</span><span class="short">${short}</span>`;
  const t=$('#nextup');if(t.innerHTML!==next)t.innerHTML=next;$('#ticker').classList.toggle('dec',!!G.card&&!G.ending);
}
$('#who').addEventListener('click',()=>{if(!$('#modal').classList.contains('show'))showAchievements()});

// the keyboard, for desktops: space pauses and plays, 1 to 4 set the speed (or pick a waiting decision's options),
// and Escape closes the ladder
addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;
  const modal=$('#modal').classList.contains('show');
  if(e.key==='Escape'&&modal&&$('#box').querySelector('[data-close]')){hideModal();e.preventDefault();return}
  if(modal)return;
  if(e.key===' '){G.speed=G.speed?0:(R.lastSpeed||1);if(G.speed)R.lastSpeed=G.speed;refreshTop();e.preventDefault();return}
  const n=+e.key;if(!(n>=1&&n<=5))return;
  if(G.card){if(R.tab!=='decide'){R.tab='decide';renderPane(true)}const b=document.querySelectorAll('#pane [data-card]')[n-1];if(b)b.click();return}
  if(!speeds()[n])return;G.speed=SPEEDS[n];R.lastSpeed=G.speed;refreshTop();
});

// moments in a billionaire life: the fortune passing $100M and $1B, and a look back every five years
function moments(){
  if(G.rung!=='billionaire'||G.ending)return;
  const m=G.miles||(G.miles={}),nw=netWorth();
  for(const [t,msg] of [[1e8,'Your fortune passes $100 million'],[1e9,'You\u2019re a billionaire']])
    if(nw>=t&&!m[t]&&(G.startNW||START_FORTUNE)<t){m[t]=1;toast(msg);queueScenes('yacht',null,{})}
  const h=G.history,n=h.length;
  if(n>=5&&n%5===0&&m.recap!==n){m.recap=n;const a=h[n-5],b=h[n-1],g=h.slice(n-5).reduce((s,y)=>s+(y.given||0),0);
    toast('Five years on: '+money(b.nw)+' ('+(b.nw>=a.nw?'+':'')+Math.round((b.nw/Math.max(1,a.nw)-1)*100)+'%)'+(g>0?', '+money(g)+' given':', nothing given')+', unrest '+unrestLevel(b.unrest))}
}

// the grip, and what each meter in the top bar means
$('#grip').addEventListener('click',()=>{$('#app').classList.toggle('expanded');setTimeout(fitMap,260)});
const METER_INFO={
  'Unrest':'How angry the town is: calm, grumbling, protests, strikes, revolt. A billionaire who keeps it at revolt too long is driven out.',
  'Jobs':'How many of the town\u2019s working figures (each a hundred households) have a job.',
  'Town spends':'What the town spends in a year. Money that keeps moving is wages for someone else.',
  'Homes':'How many of your homes are let to a paying tenant.','Repair':'How well your homes are kept up. Below 40%, tenants won\u2019t pay full rent.',
  'Staff':'How many people work at the caf\u00e9.','Lost customers':'The share of your customers going to the megastore instead.',
  'Health':'Your health. Low health means sick days and smaller pay packets.','You owe':'What\u2019s left on the payday loan.',
  'Home':'Where you live.','Pay since you began':'How much pay has risen at the mill and on the high street since you started organising, above prices.',
  'Strikes won':'Each won strike raises a whole workplace\u2019s pay by 12%.','Votes won':'Measures the town has passed on your campaigns. They last.',
  'Public purse':'The town\u2019s own money, from the taxes the rich pay. It pays benefits, public works and programmes.',
  'Re-election':'When the town (or state, or country) votes on you again.','Odds':'Your chance of winning the next election, as things stand.',
  'Congress':'The share of Congress that will vote with you. It follows your approval, and swings at the midterms.',
  'Burnout':'Hours over 55 a week push it up, fewer bring it down. At 100% you stop.','A billion in':'At your rate so far, how long a billion would take.'};
$('#meters').addEventListener('click',e=>{const m=e.target.closest('.meter');if(!m)return;const label=m.firstChild.textContent.trim(),t=METER_INFO[label];if(!t)return;
  const i=$('#info');i.innerHTML='<b>'+label+'</b> \u00b7 '+t;i.classList.add('show');clearTimeout(R.infoT);R.infoT=setTimeout(()=>i.classList.remove('show'),4200)});
// this viewer's settings, kept on the device apart from the game: larger text, and a calm stage
const PREFS_KEY='money-makes-money-prefs';
function prefs(){try{return JSON.parse(localStorage.getItem(PREFS_KEY)||'{}')}catch(e){return {}}}
function setPref(k,v){const p=prefs();p[k]=v;try{localStorage.setItem(PREFS_KEY,JSON.stringify(p))}catch(e){}applyPrefs()}
function applyPrefs(){const p=prefs();document.documentElement.classList.toggle('bigtext',!!p.big);R.calm=!!p.calm||matchMedia('(prefers-reduced-motion: reduce)').matches;if(R.calm)R.confetti=[]}
applyPrefs();
function prefsHTML(){const p=prefs();const row=(k,name,note)=>`<div class="card"><div class="txt"><b>${name}</b><small>${note}</small></div><button class="toggle ${p[k]?'on':''}" data-pref="${k}" aria-label="${name}" aria-pressed="${!!p[k]}"></button></div>`;
  return row('big','Larger text','The panel\u2019s text a size up')+row('calm','A calm stage','No passers-by, weather, drifting or confetti')+row('sound','Sound','Soft chimes for a decision, an answer and an achievement')+(navigator.vibrate?row('buzz','Buzz on a phone','A short buzz when a decision arrives'):'');}
// moving a game between devices: the save as a block of text to copy, and a box to paste one in
function saveCode(){save();const j=localStorage.getItem(SAVE_KEY)||JSON.stringify(G);return 'MMM1:'+btoa(unescape(encodeURIComponent(j)))}
function showSaveBox(msg){
  showModal(`<h2>Your save</h2><p class="lead">Copy this into the same box on another device to carry on there. It holds this life and the whole ladder.</p>
    <textarea id="savecode" readonly rows="5" class="code">${saveCode()}</textarea>
    <div class="opts"><button class="main" data-copysave="1"><b>Copy it</b></button></div>
    <p class="lead" style="margin-top:10px">Or paste a save from another device:</p>
    <textarea id="saveload" rows="4" class="code" placeholder="MMM1:\u2026"></textarea>${msg?`<p class="lead" style="color:var(--red)">${msg}</p>`:''}
    <div class="opts"><button data-loadsave="1"><b>Load it</b><small>Replaces the game on this device</small></button><button data-close="1"><b>Back to the game</b></button></div>`);
}
function loadCode(t){
  try{t=t.trim();if(!t.startsWith('MMM1:'))throw 0;const j=decodeURIComponent(escape(atob(t.slice(5))));const s=JSON.parse(j);if(!s||s.v!==1||!s.rung)throw 0;
    R.noSave=true;localStorage.setItem(SAVE_KEY,j);location.reload();return true}catch(e){return false}
}
// an ending as a picture: the role, the verdict, the big number and the notches, drawn on a canvas to share or save
function endingPicture(){
  const box=$('#box'),W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  const kick=(box.querySelector('.kick')||{}).textContent||'',title=(box.querySelector('h2')||{}).textContent||'',line=(box.querySelector('h2+p')||{}).textContent||'',big=(box.querySelector('.big')||{}).textContent||'';
  const wrap=(t,font,maxW,y,lh,col)=>{x.font=font;x.fillStyle=col;const words=t.split(' ');let l='';for(const w of words){const tt=l?l+' '+w:w;if(x.measureText(tt).width>maxW&&l){x.fillText(l,90,y);y+=lh;l=w}else l=tt}if(l){x.fillText(l,90,y);y+=lh}return y};
  x.fillStyle='#f4efe6';x.fillRect(0,0,W,H);x.save();x.beginPath();x.roundRect(50,50,W-100,H-100,40);x.clip();x.fillStyle='#fffdf8';x.fillRect(50,50,W-100,H-100);
  x.fillStyle='#2e8749';x.fillRect(50,50,W-100,14);x.restore();
  let y=200;x.textAlign='left';
  y=wrap(kick.toUpperCase(),'800 34px Inter,system-ui,sans-serif',W-180,y,46,'#8a8478');y+=30;
  y=wrap(title,'800 96px "Bricolage Grotesque",Inter,system-ui,sans-serif',W-180,y+40,104,'#1b1a17');y+=20;
  y=wrap(line,'500 40px Inter,system-ui,sans-serif',W-180,y,56,'#4d483f');y+=40;
  if(big){x.font='800 150px "Bricolage Grotesque",Inter,system-ui,sans-serif';x.fillStyle='#2e8749';x.fillText(big,90,y+120);y+=190}
  const e=G.ending,ids=e&&ENDINGS[e.rung]?[...Object.keys(ENDINGS[e.rung]).map(k=>[achId(e.rung,k),0]),...(RARE[e.rung]||[]).map(r=>[achId(e.rung,r.k),1])]:[];
  ids.forEach(([id,r],i)=>{const cx=110+i*70,cy=y+30,on=G.ladder.achieved[id];x.lineWidth=5;x.strokeStyle=r?'#d4a72c':'#b5ac9b';x.fillStyle=on?(r?'#d4a72c':'#2e8749'):'transparent';x.beginPath();
    if(r){x.moveTo(cx,cy-24);x.lineTo(cx+24,cy);x.lineTo(cx,cy+24);x.lineTo(cx-24,cy);x.closePath()}else x.arc(cx,cy,22,0,7);if(on)x.fill();x.stroke()});
  const n=found().length,all=allAchievements().length;
  x.font='600 36px Inter,system-ui,sans-serif';x.fillStyle='#8a8478';x.fillText(n+' of '+all+' achievements on the ladder',90,H-200);
  x.font='800 56px "Bricolage Grotesque",Inter,system-ui,sans-serif';x.fillStyle='#1b1a17';x.fillText('Money Makes Money',90,H-120);
  return c;
}
function shareEnding(){
  const c=endingPicture(),name='money-makes-money-'+(G.ending?G.ending.rung+'-'+G.ending.kind:'ending')+'.png';
  c.toBlob(b=>{if(!b)return;const f=new File([b],name,{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[f]}))navigator.share({files:[f],title:'Money Makes Money'}).catch(()=>{});
    else{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}},'image/png');
}
// why the headline moved: tap it for this year's money in and out, so far
function whyHeadline(){
  const y=G.year,yr=yearNo(),f=v=>Math.abs(v)<1?'$0':(v<0?'\u2212':'+')+money(Math.abs(v));let lines=[];
  if(G.rung==='billionaire'){
    lines=[['Returns on what\u2019s invested',y.gains],['From the town (rents, profits)',y.toYou],['Given away',-(y.given||0)]];
    // (the rest: homes and shops worth more or less as the town does, and money spent on moves)
    const start=G.history.length?G.history.at(-1).nw:(G.startNW||START_FORTUNE),rest=netWorth()-start-(y.gains+y.toYou-(y.given||0));
    if(Math.abs(rest)>1)lines.push(['Homes and shops revalued, and spending',rest]);
    lines.push(['Worth since the year began',netWorth()-start]);
    const share=G.pub?(G.pub.wealthtax?0.02:0)+(G.pub.gains?0.01:0)+(G.pub.stepup?0.01:0):0;
    if(share)lines.push(['Wealth tax, due at the year\u2019s end',-G.cash*share*(G.offshore?0.5:1)]);
  }else if(G.plast||G.pyear){const p=G.pyear||{};lines=Object.entries(p).filter(([k,v])=>Math.abs(v)>1).map(([k,v])=>[PURSE_NAMES[k]||k,v]);if(lines.length)lines.unshift(['The public purse this year',null])}
  if(!lines.length)return;
  const body=lines.map(([l,v])=>v==null?`<b>${l}</b>`:`${l} <b>${f(v)}</b>`).join(' \u00b7 ');
  const i=$('#info');i.innerHTML=(G.rung==='billionaire'?'<b>Year '+yr+' so far</b> \u00b7 ':'')+body;i.classList.add('show');clearTimeout(R.infoT);R.infoT=setTimeout(()=>i.classList.remove('show'),7000);
}
$('#fortune').addEventListener('click',whyHeadline);$('#fortune').style.cursor='pointer';$('#fortune').title='Why it moved';
// the glossary: the video's ideas, underlined wherever a card mentions them, explained in a line when tapped
const GLOSSARY=[
  [/buy,? borrow,? die/i,'Buy, borrow, die','Never sell: borrow against your shares instead. Loans aren\u2019t income, so there\u2019s no tax, and at death the gains are wiped (the step-up).'],
  [/step-up/i,'Step-up','When a fortune is inherited, its gains are reset to nothing, so the tax on them is never paid.'],
  [/wealth tax|tax on fortunes|fortune tax/i,'Wealth tax','A small yearly tax on the biggest fortunes themselves, not just their income.'],
  [/loophole/i,'Loophole','A gap in the law, written in on purpose, that lets one kind of income pay less.'],
  [/megastore/i,'The megastore','A chain owned elsewhere: money spent there leaves town instead of becoming someone\u2019s wage here.'],
  [/payday (loan|lender)/i,'Payday loan','A small, short loan at hundreds of percent a year. Easy to take, hard to leave.'],
  [/public purse/i,'The public purse','The town\u2019s own money, from the taxes the rich pay. It pays benefits, works and programmes.'],
  [/co-?operative|co-op/i,'Co-op','A business its workers own together. Its profit stays with them, and in town.'],
  [/minimum wage/i,'Minimum wage','The least any job may pay. Raise it and every low wage rises with it.'],
  [/strike fund/i,'Strike fund','Dues saved to pay members while they strike. The longer it lasts, the better the odds.'],
  [/changes hands|velocity/i,'Velocity','How many times a dollar is spent in a year. Spent locally it becomes wage after wage; hoarded, it stops.'],
];
function glossed(text){
  let out=text;for(const [re,term] of GLOSSARY){if(re.test(out)){out=out.replace(re,m=>`<abbr data-gl="${term}">${m}</abbr>`);}}return out;
}
$('#pane').addEventListener('click',e=>{const a=e.target.closest('[data-gl]');if(!a)return;e.stopPropagation();e.preventDefault();const g=GLOSSARY.find(g=>g[1]===a.dataset.gl);if(!g)return;
  const i=$('#info');i.innerHTML='<b>'+g[1]+'</b> \u00b7 '+g[2];i.classList.add('show');clearTimeout(R.infoT);R.infoT=setTimeout(()=>i.classList.remove('show'),6000)},true);
// the scenes refit whenever their area changes size (the grip, a rotated phone)
if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>fitMap()).observe($('#mapwrap'));
