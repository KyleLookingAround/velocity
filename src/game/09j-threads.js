/* ================= the town remembers ================= */
// What a life did to named people stays with the town through the lives after: evictions, time to pay, a rent cut,
// a council home, a job lost in the sale, a workshop built, the café made a co-op. The threads show on the next rung's
// intro card and the Story tab, on the stage (the family you evicted is the one in the park), and in the climb: the
// people you helped are behind the activist, the ones you put out are not.
const THREAD_CAP=60;
const THREAD_TEXT={evicted:n=>'You evicted '+n,time:n=>'You gave '+n+' time to pay',cut:n=>'You cut '+n+'’s rent',housed:n=>n+' got a council home from you',
  letgo:n=>n+' lost their job in the sale',hired:n=>'Your workshop hired '+n,workshop:()=>'You built a workshop',coop:()=>'You made the café a co-op'};
function remember(what,r){
  G.threads=G.threads||[];const i=r?G.res.indexOf(r):-1;
  if(G.threads.some(t=>t.what===what&&t.i===i&&t.rung===G.rung))return;
  G.threads.push({week:G.week,rung:G.rung,i,name:r?r.name:'',what});if(G.threads.length>THREAD_CAP)G.threads.shift();
}
const threadText=t=>THREAD_TEXT[t.what]?THREAD_TEXT[t.what](t.name):'';
// the same thing done to several people, said once: "You evicted Dee, Sal and Hal"
function threadLines(ts){const by={};for(const t of ts){(by[t.what]=by[t.what]||[]).push(t.name)}
  return Object.entries(by).map(([w,ns])=>{ns=ns.filter(Boolean);const names=ns.length>1?ns.slice(0,-1).join(', ')+' and '+ns.at(-1):ns[0]||'';return THREAD_TEXT[w]?THREAD_TEXT[w](names):''}).filter(Boolean)}
const HELPED=['time','cut','housed','hired'],HURT=['evicted','letgo'];
// someone a thread names who's in a state now (sleeping rough, out of work), for a caption
function threadWho(whats,f){const t=(G.threads||[]).slice().reverse().find(t=>whats.includes(t.what)&&t.i>=0&&G.res[t.i]&&f(G.res[t.i]));return t?G.res[t.i].name:null}
// the climb: what the people remember, as a share of the town behind you (at most six points either way)
function threadSupport(){const ts=G.threads||[];return Math.max(-0.06,Math.min(0.06,0.01*ts.filter(t=>HELPED.includes(t.what)).length-0.015*ts.filter(t=>HURT.includes(t.what)).length))}
// what earlier lives left standing, for the intro of the next
function townSoFar(){
  const out=[];const ws=G.workshops.length,ch=G.res.filter(r=>r.homeOwner==='council').length,est=G.shops.filter(s=>s.open&&s.ownedByYou).length,laws=Object.keys(G.pub||{}).filter(k=>G.pub[k]);
  if(ws)out.push(ws+' workshop'+(ws>1?'s':'')+' selling out of town');if(ch)out.push(ch*HH+' council homes at a quarter of a wage');
  if(G.sh&&G.sh.coop)out.push('a café its staff own');if(est)out.push(est+' shop'+(est>1?'s':'')+' the estate owns');
  if(G.fund>0)out.push(money(G.fund)+' in the public purse');if(laws.length)out.push(laws.length+' law'+(laws.length>1?'s':'')+' from a president of yours');
  return out;
}
