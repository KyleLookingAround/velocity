/* ================= sound and touch ================= */
// A few soft sounds, made in the browser (no audio files), and a short buzz on a phone: a chime when a decision
// arrives, a coin tap when you answer, a small fanfare for an achievement, a low note at the end of a life. Off until
// the player turns it on in Settings; the browser only allows sound after a tap, which turning it on is.
let AUD=null;
function audio(){if(!prefs().sound)return null;try{AUD=AUD||new (window.AudioContext||window.webkitAudioContext)();if(AUD.state==="suspended")AUD.resume();return AUD}catch(e){return null}}
// one soft note: a sine with a quick rise and a gentle fall
function note(f,at,len,vol){const c=audio();if(!c)return;const t=c.currentTime+(at||0),o=c.createOscillator(),g=c.createGain();
  o.type='sine';o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol||0.08,t+0.012);g.gain.exponentialRampToValueAtTime(0.0001,t+(len||0.25));
  o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+(len||0.25)+0.05)}
const SFX={
  card:()=>{note(660,0,0.35,0.06);note(880,0.09,0.4,0.05)},
  coin:()=>{note(1320,0,0.08,0.05);note(1760,0.05,0.12,0.04)},
  achieve:()=>{[523,659,784,1047].forEach((f,i)=>note(f,i*0.09,0.4,0.06))},
  ending:()=>{note(392,0,0.7,0.07);note(294,0.25,0.9,0.06)},
};
function sfx(k,buzz){if(R.sim)return;if(prefs().sound&&SFX[k])SFX[k]();if(buzz&&prefs().buzz&&navigator.vibrate)try{navigator.vibrate(buzz)}catch(e){}}
