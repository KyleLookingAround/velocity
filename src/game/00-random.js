/* ================= random ================= */
// The simulation draws its randomness from rnd(), so a run repeats exactly from the same seed.
// The bot sets window.__seed before the game loads; players get a new seed each life.
let rndState=(window.__seed??Math.random()*4294967296)>>>0; // cosmetic
function rnd(){ // mulberry32
  rndState=(rndState+0x6D2B79F5)>>>0;let t=rndState;
  t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;
}
function seedRandom(s){rndState=s>>>0}
// a side draw that reads the stream without moving it: the same game still gets the same answer, but a rare extra
// (a card's silver variant) doesn't shift every draw after it
function peek(salt){let t=(rndState^Math.imul(salt|0,0x9E3779B1))>>>0;t=Math.imul(t^t>>>16,0x85EBCA6B);t=Math.imul(t^t>>>13,0xC2B2AE35);return ((t^t>>>16)>>>0)/4294967296}
