/* Native furnace slot interactions must be safe on touch and keyboard. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const {planSlotGesture,transfers}=ctx.window.MineWorldFurnaceUI;
const engine=ctx.window.MineWorldFurnace.create();
const p={dimension:'overworld',x:420,y:12,z:430};
const plain=v=>v==null?v:JSON.parse(JSON.stringify(v));
function inventory(initial){
 const bag={...initial};let saves=0;
 return {count:key=>bag[key]||0,change:(key,delta)=>{
  const next=(bag[key]||0)+delta;if(next<0||next>65535)return 0;
  bag[key]=next;return delta;},onChange:()=>saves++,
  get bag(){return bag;},get saves(){return saves;}};
}
test('empty input and fuel slots accept selected items on touch',()=>{
 assert.deepEqual(plain(planSlotGesture('input',null,'rawIron',2,{})),
  {action:'deposit',item:'rawIron',limit:1});
 assert.deepEqual(plain(planSlotGesture('fuel',null,'coal',1,{})),
  {action:'deposit',item:'coal',limit:1});
});
test('Shift-click deposits a stack while touch defaults to one',()=>{
 const slot={key:'rawIron',qty:2};
 assert.equal(planSlotGesture('input',slot,'rawIron',60,{}).limit,1);
 assert.equal(planSlotGesture('input',slot,'rawIron',60,{shiftKey:true}).limit,64);
 assert.equal(planSlotGesture('input',{key:'rawIron',qty:64},'rawIron',2,{}).action,'take');
});
test('occupied slots can be withdrawn without destroying a different selected item',()=>{
 assert.deepEqual(plain(planSlotGesture('input',{key:'rawIron',qty:3},'rawGold',2,{})),
  {action:'take',limit:1});
 assert.deepEqual(plain(planSlotGesture('fuel',{key:'coal',qty:3},'coal',2,{altKey:true,shiftKey:true})),
  {action:'take',limit:64});
 assert.equal(planSlotGesture('input',null,'rawIron',0,{}),null);
 assert.equal(planSlotGesture('input',null,'rawIron',2,{altKey:true}),null);
});
test('output slot collects all by touch and one with Shift',()=>{
 const output={key:'iron',qty:3};
 assert.deepEqual(plain(planSlotGesture('output',output,'',0,{})),{action:'take',limit:64});
 assert.deepEqual(plain(planSlotGesture('output',output,'',0,{shiftKey:true})),{action:'take',limit:1});
 assert.equal(planSlotGesture('output',null,'',0,{}),null);
 assert.equal(planSlotGesture('invalid',output,'',0,{}),null);
});
test('planned touch transfers conserve ingredients, fuel and smelted output',()=>{
 const api=inventory({rawIron:2,coal:1,iron:0});
 const add=planSlotGesture('input',null,'rawIron',api.count('rawIron'),{});
 assert.equal(transfers.deposit(engine,api,p,'input',add.item,add.limit),1);
 assert.equal(api.count('rawIron'),1);
 const addRest=planSlotGesture('input',engine.get(p).input,'rawIron',1,{});
 assert.equal(transfers.deposit(engine,api,p,'input',addRest.item,addRest.limit),1);
 assert.equal(api.count('rawIron'),0);
 const fuel=planSlotGesture('fuel',null,'coal',1,{});
 assert.equal(transfers.deposit(engine,api,p,'fuel',fuel.item,fuel.limit),1);
 assert.equal(engine.tick(20).completed,2);
 const collect=planSlotGesture('output',engine.get(p).output,'',0,{shiftKey:true});
 assert.equal(transfers.withdraw(engine,api,p,'output',collect.limit).moved,1);
 assert.equal(api.count('iron'),1);assert.equal(engine.get(p).output.qty,1);
 const rest=planSlotGesture('output',engine.get(p).output,'',0,{});
 assert.equal(transfers.withdraw(engine,api,p,'output',rest.limit).moved,1);
 assert.equal(api.count('iron'),2);assert.equal(engine.get(p).output,null);
});
test('furnace visual slots are native keyboard/touch buttons with visible focus',()=>{
 const source=fs.readFileSync(path.join(root,'furnace-ui.js'),'utf8');
 for(const name of ['input','fuel','output']){
  assert.match(source,new RegExp('<button id="mw-furnace-slot-'+name+'" type="button"'));
 }
 assert.match(source,/\.mw-furnace-slot:focus-visible/);
 assert.match(source,/planSlotGesture\(which,stack,selected/);
 assert.match(source,/commitTransfer\(api,\(\)=>deposit/);
 const browser=fs.readFileSync(path.join(root,'scripts/browser-smoke.cjs'),'utf8');
 assert.match(browser,/mobile-furnace-slot-tap\.png/);
 assert.match(browser,/mw-furnace-slot-output'\)\.click/);
});
