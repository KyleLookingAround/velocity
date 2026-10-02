/* ================= the daily life ================= */
// One billionaire life a day, the same for everyone on the same date: its seed is the date, it's always in Millbrook,
// and it starts without the laws a president made, so every player meets the same town and the same cards. Your best
// result for each day stays on the device, with how many tries it took; the last thirty days are kept.
const DAILY_RANK={hero:3,giver:2,luthor:1,revolt:0};
function daySeed(k){let h=2166136261;for(const c of 'daily:'+k)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0}
// (better: a better ending, then for the generous endings more given, for the others a bigger fortune)
const dailyBetter=(a,b)=>!b||DAILY_RANK[a.kind]>DAILY_RANK[b.kind]||DAILY_RANK[a.kind]===DAILY_RANK[b.kind]&&(DAILY_RANK[a.kind]>=2?a.given>b.given:a.nw>b.nw);
function startDaily(k){newGame(daySeed(k),'mill');G.pub={};G.daily=k;G.seen.intro=true}
function recordDaily(e){
  const L=G.ladder,k=G.daily;L.daily=L.daily||{};
  const s={kind:e.kind,nw:e.nw,given:e.given,share:e.gains>0?e.given/e.gains:0},prev=L.daily[k],tries=((prev&&prev.tries)||0)+1;
  R.dailyBest=dailyBetter(s,prev);L.daily[k]=Object.assign(R.dailyBest?s:prev,{tries});
  const keys=Object.keys(L.daily).sort();while(keys.length>30)delete L.daily[keys.shift()];
}
