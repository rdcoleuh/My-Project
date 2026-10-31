/* Deposits reconcile actual furnace contents, even if an adapter lies or throws. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const create=ctx.window.MineWorldFurnace.create;
const deposit=ctx.window.MineWorldFurnaceUI.transfers.deposit;
const p={dimension:'overworld',x:5190,y:14,z:5190};
function bag(initial){
 let amount=initial;
 return {count:()=>amount,change:(_key,delta)=>{
  const before=amount;amount=Math.max(0,Math.min(65535,amount+delta));return amount-before;
 },get amount(){return amount;}};
}
function wrapped(f,insert){
 return {get:p=>f.get(p),insert:(p,slot,item,n)=>insert(p,slot,item,n)};
}
test('underreported insertion does not refund already deposited items',()=>{
 const f=create(),inventory=bag(5);
 const engine=wrapped(f,(...args)=>{f.insert(...args);return 1;});
 assert.equal(deposit(engine,inventory,p,'input','rawIron',3),3);
 assert.equal(inventory.amount,2);
 assert.equal(f.get(p).input.qty,3);
});
test('overreported insertion refunds only items not actually deposited',()=>{
 const f=create(),inventory=bag(5);
 const engine=wrapped(f,(p,slot,item,n)=>{f.insert(p,slot,item,n-1);return n;});
 assert.equal(deposit(engine,inventory,p,'input','rawIron',3),2);
 assert.equal(inventory.amount,3);
 assert.equal(f.get(p).input.qty,2);
});
test('claimed insertion without a slot mutation is fully refunded',()=>{
 const f=create(),inventory=bag(4);
 const engine=wrapped(f,()=>3);
 assert.equal(deposit(engine,inventory,p,'input','rawIron',3),0);
 assert.equal(inventory.amount,4);
 assert.equal(f.get(p),null);
});
test('partially mutating insertion that throws refunds only untransferred items',()=>{
 const f=create(),inventory=bag(4);
 const engine=wrapped(f,(p,slot,item)=>{f.insert(p,slot,item,1);throw Error('adapter failed');});
 assert.throws(()=>deposit(engine,inventory,p,'input','rawIron',3),/adapter failed/);
 assert.equal(inventory.amount,3);
 assert.equal(f.get(p).input.qty,1);
});
test('existing furnace stacks reconcile their incremental growth',()=>{
 const f=create();f.insert(p,'input','rawIron',2);
 const inventory=bag(5);
 const engine=wrapped(f,(...args)=>{f.insert(...args);return 0;});
 assert.equal(deposit(engine,inventory,p,'input','rawIron',3),3);
 assert.equal(inventory.amount,2);
 assert.equal(f.get(p).input.qty,5);
});
