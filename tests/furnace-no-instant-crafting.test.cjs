/* Regression: furnace recipes must never mint instant output or XP. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html');
function extract(begin,end){
 const start=html.indexOf(begin),finish=html.indexOf(end,start);
 assert.ok(start>=0&&finish>start,'missing '+begin);return html.slice(start,finish);
}
test('all seven classic quick-smelt recipes require the furnace engine',()=>{
 const section=extract('  const RECIPES=[','  const VEHICLE_KINDS=');
 for(const name of ['🍖 Cook meat','⚒ Smelt iron','⚒ Smelt raw iron',
  '⚒ Smelt deep iron','🔥 Smelt copper','🔥 Smelt gold','🔥 Smelt Netherite scrap']){
  const line=section.split('\n').find(x=>x.includes("name:'"+name+"'"));
  assert.ok(line&&line.includes("station:'furnace'"),name);
 }
 assert.match(html,/r\.station!=='furnace'/);
 assert.match(html,/station==='furnace'\?false/);
});
test('production craft function rejects furnace recipes before inventory or XP changes',()=>{
 const code=extract('  function craft(recipe){','  // Village residents');
 let changes=0,xp=0,message='';
 const craft=new Function('gameMode','toast','addResource','gainExperience',
  code+'\nreturn craft;')('survival',x=>{message=x;},()=>{changes++;},()=>{xp++;});
 for(const recipe of [
  {name:'⚒ Smelt raw iron',station:'furnace',cost:{rawIron:1,coal:1},give:{iron:1}},
  {name:'Cooked Chicken',station:'furnace',cost:{chicken:1,coal:1},give:{cookedChicken:1}}
 ])assert.equal(craft(recipe),false);
 assert.equal(changes,0);assert.equal(xp,0);assert.match(message,/Place a Furnace/);
});
test('production recipe preview directs players to placed furnace and remains accessible',()=>{
 const code=extract('  function previewRecipe(recipe){','  function placeCraftingTable(){');
 let message='',state={textContent:''};
 const preview=new Function('toast','$',code+'\nreturn previewRecipe;')(
  x=>{message=x;},()=>state);
 preview({name:'⚒ Smelt raw iron',station:'furnace'});
 assert.match(message,/close Backpack, tap the Furnace/);
 assert.equal(state.textContent,message);
 assert.match(html,/Show furnace smelting instructions for /);
});
test('actual three-slot furnace still cooks over ten seconds and persists output',()=>{
 const ctx=vm.createContext({window:{}});
 vm.runInContext(read('furnace-engine.js'),ctx);
 const api=ctx.window.MineWorldFurnace,f=api.create();
 const p={dimension:'overworld',x:5000,y:14,z:5000};
 assert.equal(f.insert(p,'input','rawIron',1),1);
 assert.equal(f.tick(10).completed,0);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(9).completed,0);
 assert.equal(f.tick(1).completed,1);
 assert.equal(f.get(p).output.key,'iron');
 const restored=api.create();restored.restore(JSON.parse(JSON.stringify(f.snapshot())));
 assert.equal(restored.take(p,'output',1).key,'iron');
 assert.equal(restored.get(p).output,null);
});
test('desktop and mobile Chrome smoke verify furnace recipe guidance',()=>{
 const smoke=read('scripts/browser-smoke.cjs');
 assert.match(smoke,/smeltGuide\.found/);
 assert.match(smoke,/desktop-furnace-no-instant-recipe-synthetic\.png/);
 assert.match(smoke,/mobile-furnace-no-instant-recipe-synthetic\.png/);
 assert.match(smoke,/furnace failed to smelt iron in browser/);
 // Cache versions advance with each deployment; never pin a test to an old release.
 assert.ok(read('sw.js').includes("const VERSION='mineworld-"));
});
