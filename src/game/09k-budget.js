/* ================= the public purse's books ================= */
// Where the purse's money came from and went this year, for the budget on the climb's tabs. The main flows name
// themselves through purse(); anything that moves the purse some other way is picked up at the end of each week as
// 'other'. The year's books close at the year end into G.plast.
const PURSE_NAMES={tax:'Taxes on the rich',gift:'Gifts from the rich',grant:'Grants from the state',federal:'Federal money',donor:'Donors',rent:'Council rents',
  programme:'Programmes',works:'Public works',benefit:'Benefits',salary:'Town hall pay',buses:'Buses',homes:'Council homes',subsidy:'Subsidies',other:'Other'};
function purse(kind,amt){
  G.fund=(G.fund||0)+amt;R.ptrack=(R.ptrack||0)+amt;
  G.pyear=G.pyear||{};G.pyear[kind]=(G.pyear[kind]||0)+amt;
}
function purseWeekEnd(f0){
  const d=(G.fund||0)-f0-(R.ptrack||0);R.ptrack=0;
  if(Math.abs(d)>1){G.pyear=G.pyear||{};G.pyear.other=(G.pyear.other||0)+d}
}
function purseYearEnd(){G.plast=G.pyear||{};G.pyear={}}
