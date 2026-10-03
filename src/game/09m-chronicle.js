/* ================= the chronicle ================= */
// Every ending adds a line to the chronicle, kept on the ladder: which run it was (a run starts with each new
// billionaire life), the role and its ending, how long it lasted, what it left the town, and the named people it touched.
// The Story tab shows it as a page per run, and it can be saved as one picture.
const CHRON_CAP=120;
function chronNote(e){
  const l=G.ladder;l.chron=l.chron||[];
  const touched=(G.threads||[]).filter(t=>t.rung===e.rung&&t.week>=G.rungStart);
  l.chron.push({run:l.lives||0,rung:e.rung,who:e.name||null,kind:e.kind,rare:e.rare||null,heir:G.heir||0,daily:G.daily||null,town:G.town||'mill',
    years:Math.max(1,Math.round(e.week/WEEKS)),
    left:{rough:G.res.filter(r=>r.homeless).length,jobless:jobless().length,unrest:Math.round(G.unrest),purse:Math.round(G.fund||0),
      shops:G.shops.filter(s=>s.open).length},
    names:[...new Set(touched.map(t=>t.name).filter(Boolean))].slice(0,4),
    lines:touched.slice(-2).map(threadText).filter(Boolean)});
  if(l.chron.length>CHRON_CAP)l.chron.splice(0,l.chron.length-CHRON_CAP);
}
// the runs, newest first, each with its lives in order
function chronRuns(){const by=new Map();for(const c of G.ladder.chron||[]){const k=c.run+'|'+(c.daily||'');if(!by.has(k))by.set(k,[]);by.get(k).push(c)}
  return [...by.values()].reverse()}
