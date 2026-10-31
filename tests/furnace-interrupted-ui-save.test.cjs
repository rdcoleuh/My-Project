/* A partially completed furnace transfer must be saved even when its
 * inventory adapter throws after moving items. No Minecraft assets used. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const engine=ctx.window.MineWorldFurnace;
const {deposit,withdraw,commitTransfer}=ctx.window.MineWorldFurnaceUI.transfers;
const p={dimension:'overworld',x:5444,y:14,z:5444};
function bag(initial){
 let amount=initial;
 return {count:()=>amount,change:(_key,delta)=>{
  const before=amount;amount=Math.max(0,Math.min(65535,amount+delta));
  return amount-before;
 },get amount(){return amount;}};
}
function tracked(inventory){
 let saved=0,refreshed=0,notice='';
 return {count:inventory.count,change:inventory.change,
  onChange:()=>{saved++;},toast:message=>{notice=message;},
  refresh:()=>{refreshed++;},
  get saved(){return saved;},get refreshed(){return refreshed;},get notice(){return notice;}};
}
test('successful transfer saves and redraws exactly once',()=>{
 const f=engine.create(),inventory=bag(5),api=tracked(inventory);
 assert.equal(commitTransfer(api,()=>deposit(f,api,p,'input','rawIron',3),
  moved=>moved>0,api.refresh),3);
 assert.equal(api.saved,1);assert.equal(api.refreshed,1);
 assert.equal(inventory.amount,2);assert.equal(f.get(p).input.qty,3);
});
test('partial deposit followed by a thrown adapter error still saves and redraws',()=>{
 const f=engine.create(),inventory=bag(4),api=tracked(inventory);
 const broken={get:q=>f.get(q),insert:(q,slot,item)=>{
  f.insert(q,slot,item,1);throw Error('insertion interrupted');
 }};
 assert.equal(commitTransfer(api,()=>deposit(broken,api,p,'input','rawIron',3),
  moved=>moved>0,api.refresh),null);
 assert.equal(inventory.amount,3);assert.equal(f.get(p).input.qty,1);
 assert.equal(api.saved,1);assert.equal(api.refreshed,1);
 assert.match(api.notice,/interrupted/);
});
test('partial output withdrawal followed by an adapter error is persisted',()=>{
 const f=engine.create();f.insert(p,'input','rawIron',3);
 f.insert(p,'fuel','coal',1);assert.equal(f.tick(30).completed,3);
 const inventory=bag(0),api=tracked(inventory);
 const broken={get:q=>f.get(q),take:(q,slot)=>{
  f.take(q,slot,1);throw Error('withdrawal interrupted');
 }};
 assert.equal(commitTransfer(api,()=>withdraw(broken,api,p,'output',3),
  value=>!!value?.moved,api.refresh),null);
 assert.equal(inventory.amount,1);assert.equal(f.get(p).output.qty,2);
 assert.equal(api.saved,1);assert.equal(api.refreshed,1);
 assert.match(api.notice,/interrupted/);
});
test('a rejected or full transfer does not issue an unnecessary save',()=>{
 const f=engine.create(),inventory=bag(0),api=tracked(inventory);
 assert.equal(commitTransfer(api,()=>deposit(f,api,p,'input','rawIron',3),
  moved=>moved>0,api.refresh),0);
 assert.equal(api.saved,0);assert.equal(api.refreshed,0);
 const full=commitTransfer(api,()=>({moved:0,full:true}),
  value=>!!value?.moved,api.refresh);
 assert.equal(full.full,true);assert.equal(api.saved,0);
});
test('even an error before mutation takes the conservative save path',()=>{
 const inventory=bag(1),api=tracked(inventory);
 assert.equal(commitTransfer(api,()=>{throw Error('preflight failed');},
  moved=>moved>0,api.refresh),null);
 assert.equal(api.saved,1);assert.equal(api.refreshed,1);
 assert.equal(inventory.amount,1);
});
test('real furnace click handlers route deposits and withdrawals through commitTransfer',()=>{
 const source=fs.readFileSync(path.join(root,'furnace-ui.js'),'utf8');
 assert.match(source,/commitTransfer\(api,\(\)=>\{\s*const moved=deposit\(/);
 assert.match(source,/const result=commitTransfer\(api,\(\)=>withdraw\(/);
 assert.match(source,/if\(result\?\.full\)/);
});
