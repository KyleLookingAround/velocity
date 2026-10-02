// Money Makes Money, offline: the page, its fonts and its icons are kept in a small cache. A visit is served from the
// cache at once and the cache is refreshed behind it, so a new version arrives on the visit after it is published.
const CACHE='money-makes-money-v1';
const SHELL=['./','./index.html','./manifest.webmanifest','./fonts/inter-latin-wght-normal.woff2','./fonts/bricolage-grotesque-latin-wght-normal.woff2','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(r,{ignoreSearch:true});
    const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>hit);
    return hit||net;
  }));
});
