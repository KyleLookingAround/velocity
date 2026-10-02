/* ================= save ================= */
// One save on the device. Fields missing from an older save take their defaults from FIELDS.
const SAVE_KEY='money-makes-money-save-v1';
function save(){if(R.sim||R.noSave)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(G))}catch(e){}}
function load(){
  try{const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(!s||s.v!==1)return false;
    G=DEFAULT();for(const k in FIELDS)if(k in s)G[k]=s[k];for(const k in s)if(!(k in FIELDS))G[k]=s[k];if(G.autoAcct&&!G.adviser)G.adviser='acct';G.autoAcct=false;return true}catch(e){return false}
}
