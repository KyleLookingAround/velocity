/* ================= constants ================= */
// The town on the map is a small city: each figure stands for HH households, so its wages, rent and spending are
// HH times one household's. Money is in dollars; the simulation steps one week at a time.
const HH=100;
const WEEKS=52, START_AGE=40, END_AGE=80, LIFE_WEEKS=(END_AGE-START_AGE)*WEEKS;
const START_FORTUNE=30e6;

// tuning: every number the economy runs on (weekly amounts are per figure, HH households)
const T={
  baseReturn:0.08,        // what the fortune earns a year with no input
  wage:700*HH,            // a week's pay
  ownerWage:550*HH,       // what a shop owner pays themselves before profit
  pension:420*HH,         // a retiree's week, paid from outside the town
  rent:170*HH,            // a week's rent at the start
  povertyLine:300*HH,     // what's left after rent below which a figure counts as poor
  partTime:0.6,           // a parent's pay without childcare
  mpc:{low:0.92,mid:0.8,high:0.35}, // the share of each dollar of income spent
  savingsDraw:0.03,       // the share of savings drawn each week when income runs short
  supplies:0.28,          // the share of a shop's takings paid to suppliers outside the town
  millStaff:6,
  rentRise:0.035,         // the local landlord's yearly rent rise
  yourRentRise:0.07,      // yours, once you own the homes
  wageRise:0.02,          // a healthy business's yearly pay rise
  homePrice:150000*HH,    // a figure's homes (HH of them) at the start
  homeYield:0.0589,       // a home's price is about its rent over this: prices follow rents, and the town's mood
  homeBuyPush:0.012,      // each figure's homes you buy push all prices (and the landlord's rents) up by this much
  rivalMultiple:9,        // a shop's price, in years of profit
  workshopCost:12e6, workshopOutput:1060*HH, workshopStaff:3, maxWorkshops:3,
  medicalChance:0.12,     // a figure's yearly chance of a medical bill
  medicalBill:9000*HH, medicalPay:70*HH,
  taxEvery:8,             // years between the town's tax votes
  taxRate:0.05, lobbyCost:0.006, moveCost:0.02, lobbyWin:0.7,
  revoltAt:90, revoltWeeks:26, heroGiveShare:0.35,
};
// what figures spend on: food (grocer), eating out (café), haircuts (barber) and goods (store), and how much of each
// goes to the out-of-town megastore even when the local shop is open
const CATS=['food','eat','hair','goods'];
const CAT_SHARE={food:0.44,eat:0.22,hair:0.1,goods:0.24};
const CAT_LEAK={food:0.18,eat:0,hair:0,goods:0.45};
const SHOP_DEF=[
  {cat:'food',name:'Grocer',max:3},
  {cat:'eat',name:'Café',max:3},
  {cat:'hair',name:'Barber',max:2},
  {cat:'goods',name:'Store',max:2},
];
const GIFTS=[
  {k:'poverty',name:'End poverty',note:'Tops every figure up to the poverty line',real:'$177B a year in the US'},
  {k:'shelter',name:'House everyone',note:'Nobody sleeps rough after an eviction',real:'$10B a year in the US'},
  {k:'vouchers',name:'Housing vouchers',note:'Pays a third of the rent for low earners',real:'$118B a year in the US'},
  {k:'childcare',name:'Childcare and pre-K',note:'Parents can work full time',real:'$75B a year in the US'},
  {k:'medical',name:'Wipe medical debt',note:'Clears medical debt as it arrives',real:'$20B a year in the US'},
];
const MOVES=[
  {k:'homes',name:'Buy homes',note:'Rent comes to you and climbs fast'},
  {k:'rival',name:'Buy a shop',note:'Its profit comes to you; staff are cut'},
  {k:'build',name:'Build a workshop',note:'Hires locals and sells outside town'},
];
