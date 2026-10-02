// Loads the simulation files (no DOM) into a sandbox, so the bot and the checks can run whole lives in Node.
import {readFileSync,readdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
export const root=join(dirname(fileURLToPath(import.meta.url)),'..');
// the files the simulation is made of: everything before 10-, which is where the drawing and the page begin
export const simFiles=()=>readdirSync(join(root,'src/game')).filter(f=>/^0\d[a-z]?-.*\.js$/.test(f)).sort();
export function loadSim(seed=1){
  const code=simFiles().map(f=>readFileSync(join(root,'src/game',f),'utf8')).join('\n')+
    '\n;globalThis.S={get G(){return G},R,T,step,newGame,doMove,canMove,movePrice,setGift,answerTax,netWorth,homesOwned,shopsOwned,jobless,WEEKS,LIFE_WEEKS,unrestLevel,giftCosts,GIFTS,START_FORTUNE,'+
    'startLandlord,restartLandlord,setRentChange,setRepairs,answerCard,cardOptions,giftEstimate,tenantShare,startPartner,restartPartner,startShop,restartShop,shopWorth,SH,CAFE,startWaiter,restartWaiter,waiterWorth,WT,me,HH,ptWorth,yearsToBillion,partnerVerdict,PT,buyFromEstate,sellToEstate,canBuyFromEstate,equity,myHomes,LL,rentRoll,isLandlord,landlordVerdict,homeValue};';
  const ctx={window:{__seed:seed},Math,console};vm.createContext(ctx);
  vm.runInContext(code,ctx,{filename:'sim'});
  ctx.S.newGame(seed);ctx.S.R.sim=true;
  return ctx.S;
}
