/* Regression: furnace XP is paid on verified collection, not on smelting or failed transfers. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const fns=ctx.window.MineWorldFurnaceUI;
const p={dimension:'overworld',x:420,y:-12,z:400};
const makeBag=(initial={})=>{
 const items={...initial};
 return {count:key=>items[key]||0,change:(key,delta)=>{
  const before=items[key]||0,after=Math.max(0,Math.min(65535,before+delta));
  items[key]=after;return after-before;
 }};
};
test('only known smelting products grant original MineWorld whole-point XP',()=>{
 assert.equal(fns.smeltingReward('iron',1),1);
 assert.equal(fns.smeltingReward('charcoal',3),3);
 assert.equal(fns.smeltingReward('netheriteScrap',2),4);
 assert.equal(fns.smeltingReward('future:unrecognized',2),0);
 for(const invalid of [0,-1,65,1.5,Infinity,'2'])
  assert.equal(fns.smeltingReward('iron',invalid),0);
});
test('verified one-at-a-time output collection awards XP once per item',()=>{
 const engine=ctx.window.MineWorldFurnace.create(),bag=makeBag(),earned=[];
 const api={gainExperience:points=>earned.push(points)};
 engine.insert(p,'input','rawIron',2);
 engine.insert(p,'fuel','coal',1);
 assert.equal(engine.tick(20).completed,2);
 assert.equal(earned.length,0,'smelting alone does not grant collection XP');
 const first=fns.transfers.withdraw(engine,bag,p,'output',1);
 assert.equal(first.moved,1);
 assert.equal(fns.awardCollectedOutput(api,'output','iron',first),1);
 const second=fns.transfers.withdraw(engine,bag,p,'output',64);
 assert.equal(second.moved,1);
 assert.equal(fns.awardCollectedOutput(api,'output','iron',second),1);
 const empty=fns.transfers.withdraw(engine,bag,p,'output',64);
 assert.equal(fns.awardCollectedOutput(api,'output','iron',empty),0);
 assert.equal(earned.reduce((a,b)=>a+b,0),2);
 assert.equal(bag.count('iron'),2);
});
test('full inventory, fuel/input withdrawals and unknown products grant no XP',()=>{
 const engine=ctx.window.MineWorldFurnace.create(),bag=makeBag({iron:65535}),earned=[];
 const api={gainExperience:points=>earned.push(points)};
 engine.insert(p,'input','rawIron',2);
 engine.insert(p,'fuel','coal',1);
 engine.tick(10);
 const blocked=fns.transfers.withdraw(engine,bag,p,'output');
 assert.equal(blocked.full,true);
 assert.equal(fns.awardCollectedOutput(api,'output','iron',blocked),0);
 const returned=fns.transfers.withdraw(engine,bag,p,'input');
 assert.equal(fns.awardCollectedOutput(api,'input','rawIron',returned),0);
 assert.equal(fns.awardCollectedOutput(api,'fuel','coal',{moved:1}),0);
 assert.equal(fns.awardCollectedOutput(api,'output','future:unknown',{moved:1}),0);
 assert.equal(fns.awardCollectedOutput(api,'output','iron',null),0);
 assert.equal(earned.length,0);
 assert.equal(engine.get(p).output.qty,1);
});
test('live furnace UI wires XP to survival progression and both Chrome smoke paths',()=>{
 const ui=fs.readFileSync(path.join(root,'furnace-ui.js'),'utf8');
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const browser=fs.readFileSync(path.join(root,'scripts/browser-smoke.cjs'),'utf8');
 assert.match(ui,/awardCollectedOutput\(api,which,outputKey,result\)/);
 assert.match(html,/engine:furnaces,count:amount,totals:inventoryTotals,change:addResource,label:itemLabel,toast,\s*gainExperience,/);
 assert.match(browser,/xpBeforeCollection/);
 assert.match(browser,/xpAfterOne/);
 assert.match(browser,/xpAfterStack/);
});
