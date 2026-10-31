/* World identity, camera and toolbar must survive future deep-world migration. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'world-depth.js'),'utf8'),ctx);
const plan=ctx.window.MineWorldWorldDepth.planLegacySaveMigration;
const base={version:13,worldSize:8,edits:[],netherEdits:[],endEdits:[]};
const preview=fields=>plan({...base,...fields},{width:8,depth:8});
const plain=value=>JSON.parse(JSON.stringify(value));

test('seed, label and weather survive as detached immutable data',()=>{
 const weather={type:'thunder',seconds:135.5,step:12,custom:{original:true}};
 const save={seed:-2147483648,seedLabel:'My original world',weather};
 const result=preview(save);
 assert.deepEqual(plain(result.worldState),save);
 assert.ok(Object.isFrozen(result.worldState.weather.custom));
 weather.seconds=5;weather.custom.original=false;
 assert.equal(result.worldState.weather.seconds,135.5);
 assert.equal(result.worldState.weather.custom.original,true);
});
test('camera orientation and flight survive without changing position coordinates',()=>{
 const player={x:2.5,y:15.5,z:3.5,yaw:1.75,pitch:-0.35,fly:false};
 const result=preview({player});
 assert.deepEqual(plain(result.positions.player),{x:2.5,y:15.5,z:3.5});
 assert.deepEqual(plain(result.playerViewState),{yaw:1.75,pitch:-0.35,fly:false});
 assert.ok(Object.isFrozen(result.playerViewState));
 player.yaw=3;player.fly=true;
 assert.equal(result.playerViewState.yaw,1.75);
 assert.equal(result.playerViewState.fly,false);
});
test('Creative hotbar and backpack display order survive without aliases',()=>{
 const creativeHotbar=[1,2,3,4,5,6,7,8,169];
 const inventoryOrder=['rawIron','block:169','custom:ore/cobalt'];
 const result=preview({creativeHotbar,inventoryOrder});
 assert.deepEqual(plain(result.playerItems.creativeHotbar),creativeHotbar);
 assert.deepEqual(plain(result.playerItems.inventoryOrder),inventoryOrder);
 assert.ok(Object.isFrozen(result.playerItems.creativeHotbar));
 assert.ok(Object.isFrozen(result.playerItems.inventoryOrder));
 creativeHotbar[0]=99;inventoryOrder.push('coal');
 assert.equal(result.playerItems.creativeHotbar[0],1);
 assert.equal(result.playerItems.inventoryOrder.length,3);
});
test('old saves without these optional fields remain compatible',()=>{
 const result=preview({version:5,player:{x:2,y:14,z:3}});
 assert.deepEqual(plain(result.worldState),{seed:null,seedLabel:null,weather:null});
 assert.deepEqual(plain(result.playerViewState),{yaw:null,pitch:null,fly:null});
 assert.equal(result.playerItems.creativeHotbar,null);
 assert.equal(result.playerItems.inventoryOrder,null);
});
test('malformed seed and weather reject without modifying the source save',()=>{
 for(const bad of [
  {seed:Infinity},{seed:'123'},{seedLabel:42},{seedLabel:'x'.repeat(1025)},
  {weather:{type:'snow',seconds:120,step:2}},
  {weather:{type:'rain',seconds:-1,step:2}},
  {weather:{type:'clear',seconds:120,step:1.5}},
  {weather:{type:'clear',seconds:Infinity,step:2}}
 ]){
  const save={...base,...bad},before=plain(save);
  assert.throws(()=>preview(save),/Invalid saved/);
  assert.deepEqual(plain(save),before);
 }
 const weather={type:'rain',seconds:20,step:1};
 Object.defineProperty(weather,'step',{enumerable:true,get(){throw Error('executed');}});
 assert.throws(()=>preview({weather}),/Invalid saved weather metadata/);
});
test('malformed toolbar and player view fail preflight',()=>{
 for(const bad of [
  {creativeHotbar:[1,2]},{creativeHotbar:[1,2,3,4,5,6,7,8,170]},
  {creativeHotbar:[1,2,3,4,5,6,7,8,'9']},
  {inventoryOrder:['coal','coal']},{inventoryOrder:['block:0']},
  {inventoryOrder:Array(2001).fill('coal')},
  {player:{x:2,y:14,z:3,yaw:Infinity}},
  {player:{x:2,y:14,z:3,pitch:'0.5'}},
  {player:{x:2,y:14,z:3,fly:'true'}}
 ])assert.throws(()=>preview(bad),/Invalid saved/);
 const player={x:2,y:14,z:3};
 Object.defineProperty(player,'yaw',{enumerable:true,get(){throw Error('executed');}});
 assert.throws(()=>preview({player}),/Invalid saved player yaw/);
});
test('live world still uses the 48-layer legacy profile',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/const W=10000, D=10000, H=48, SEA=14/);
 assert.equal(preview({seed:7}).status,'preview-only');
});
