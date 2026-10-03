/* ================= save ================= */
// One save on the device. Fields missing from an older save take their defaults from FIELDS.
const SAVE_KEY='money-makes-money-save-v1';
function save(){if(R.sim||R.noSave)return;G.ver=VERSION;try{localStorage.setItem(SAVE_KEY,JSON.stringify(G))}catch(e){}}
function load(){
  try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(!s||s.v!==1)return false;
    restore(s);return true}catch(e){return false}
}
