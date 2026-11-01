/* Native touch/keyboard furnace gestures respect nonstackable fuel limits. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const {create}=ctx.window.MineWorldFurnace;
const {planSlotGesture,transfers}=ctx.window.MineWorldFurnaceUI;
const plain=value=>JSON.parse(JSON.stringify(value));
const p={dimension:'overworld',x:-18,y:-20,z:42};
function inventory(initial){
 const items={...initial};
 return {count:key=>items[key]||0,change:(key,delta)=>{
  const next=(items[key]||0)+delta;
  if(next<0||next>65535)return 0;
  items[key]=next;return delta;
 }};
}
test('full lava-bucket fuel slot taps to withdraw even when same fuel is selected',()=>{
 assert.deepEqual(plain(planSlotGesture('fuel',{key:'lavaBucket',qty:1},
   'lavaBucket',3,{})),{action:'take',limit:1});
 assert.deepEqual(plain(planSlotGesture('fuel',{key:'lavaBucket',qty:1},
   'lavaBucket',3,{shiftKey:true})),{action:'take',limit:64});
});
test('native lava fuel tap withdraw/reinsert cycle conserves inventory',()=>{
 const f=create(),bag=inventory({lavaBucket:3});
 let gesture=planSlotGesture('fuel',null,'lavaBucket',bag.count('lavaBucket'),{});
 assert.equal(transfers.deposit(f,bag,p,'fuel',gesture.item,gesture.limit),1);
 assert.equal(bag.count('lavaBucket'),2);
 gesture=planSlotGesture('fuel',f.get(p).fuel,'lavaBucket',bag.count('lavaBucket'),{});
 assert.equal(gesture.action,'take');
 assert.equal(transfers.withdraw(f,bag,p,'fuel',gesture.limit).moved,1);
 assert.equal(bag.count('lavaBucket'),3);
 gesture=planSlotGesture('fuel',f.get(p).fuel,'lavaBucket',bag.count('lavaBucket'),{});
 assert.equal(gesture.action,'deposit');
 assert.equal(transfers.deposit(f,bag,p,'fuel',gesture.item,gesture.limit),1);
 assert.equal(f.get(p).fuel.qty,1);
 assert.equal(bag.count('lavaBucket'),2);
});
test('overfull legacy lava-bucket slot cannot request an additional deposit',()=>{
 assert.deepEqual(plain(planSlotGesture('fuel',{key:'lavaBucket',qty:2},
   'lavaBucket',4,{})),{action:'take',limit:1});
});
test('stackable coal and ingredient slots still accept up to 64 items',()=>{
 for(const [which,item] of [['fuel','coal'],['input','rawIron']]){
  assert.equal(planSlotGesture(which,{key:item,qty:63},item,2,{}).action,'deposit');
  assert.equal(planSlotGesture(which,{key:item,qty:64},item,2,{}).action,'take');
 }
});
test('desktop/mobile browser smoke records native lava withdrawal and reinsertion',()=>{
 const smoke=fs.readFileSync(path.join(root,'scripts/browser-smoke.cjs'),'utf8');
 assert.match(smoke,/mobile-lava-native-withdraw\.png/);
 assert.match(smoke,/mobile-lava-native-reinsert\.png/);
 assert.match(smoke,/mw-furnace-slot-fuel'\)\.click/);
});
