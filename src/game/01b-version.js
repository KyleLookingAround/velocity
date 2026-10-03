/* ================= versions ================= */
// The game's version, and what each one brought. A save keeps the version that last wrote it. A player coming back
// to a newer version sees What's new once (the panel lists every version since the one they last saw). Every
// version leaves saves in tools/saves/, and the bot's saves group loads each one and plays on, so old saves always
// load. To release: raise VERSION, add its entry at the top of UPDATES, and run node tools/fixtures.mjs.
const VERSION='1.0';
const UPDATES=[
  {v:'1.0',items:[
    'The share market turns two or three times a life: ride a boom, sell a third at the top, or hold through the crash.',
    'Booms put home prices up in town, and a crash puts the mill on short time.',
    'Price each line of the café’s menu, and change the partner’s hours any week.',
    'The activist can lay groundwork for a second measure while a campaign runs.',
    'Under a president’s laws, the Fortune tab shows what the taxes took and what the programmes paid.',
    'Crowds on the stage follow the town’s numbers: tents, marchers and the money in the air.',
    'The chronicle on the Story tab: every life of every run, and a picture of the whole run.',
    'Colour-blind safe colours in Settings, and clearer, higher-contrast text in the panel.']},
];
