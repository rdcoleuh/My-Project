/* A furnace withdrawal must reconcile actual slot loss, never trust an adapter's report. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const create=ctx.window.MineWorldFurnace.create;
const withdraw=ctx.window.MineWorldFurnaceUI.transfers.withdraw;
const p={dimension:'overworld',x:5110,y:14,z:5110};
function inventory(initial=0){
 let amount=initial;
 return {count:()=>amount,change:(_key,delta)=>{
  const before=amount;amount=Math.max(0,Math.min(65535,amount+delta));
  return amount-before;
 },get amount(){return amount;}};
}
function output(qty){
 const f=create();f.insert(p,'input','rawIron',qty);
 f.insert(p,'fuel','coal',1);assert.equal(f.tick(qty*10).completed,qty);
 return f;
}
function wrap(f,take){return {get:pos=>f.get(pos),take};}
test('reported output withdrawal without any slot mutation cannot duplicate ingots',()=>{
 const f=output(2),bag=inventory();
 const engine=wrap(f,(_p,_slot,n)=>({key:'iron',qty:n}));
 assert.equal(withdraw(engine,bag,p,'output',2).moved,0);
 assert.equal(bag.amount,0);assert.equal(f.get(p).output.qty,2);
});
test('underreported withdrawal with real mutation transfers exactly the removed stack',()=>{
 const f=output(3),bag=inventory();
 const engine=wrap(f,(...args)=>{f.take(...args);return {key:'iron',qty:0};});
 assert.equal(withdraw(engine,bag,p,'output',2).moved,2);
 assert.equal(bag.amount,2);assert.equal(f.get(p).output.qty,1);
});
test('overreported partial withdrawal refunds only items left inside the furnace',()=>{
 const f=output(4),bag=inventory();
 const engine=wrap(f,(pos,slot,n)=>{f.take(pos,slot,1);return {key:'iron',qty:n};});
 assert.equal(withdraw(engine,bag,p,'output',3).moved,1);
 assert.equal(bag.amount,1);assert.equal(f.get(p).output.qty,3);
});
test('partially mutating withdrawal that throws preserves conservation before rethrow',()=>{
 const f=output(3),bag=inventory();
 const engine=wrap(f,(pos,slot)=>{f.take(pos,slot,1);throw Error('take adapter failed');});
 assert.throws(()=>withdraw(engine,bag,p,'output',3),/take adapter failed/);
 assert.equal(bag.amount,1);assert.equal(f.get(p).output.qty,2);
});
test('existing input stack is reconciled from its before/after quantity',()=>{
 const f=create(),bag=inventory();f.insert(p,'input','rawGold',5);
 const engine=wrap(f,(pos,slot)=>{f.take(pos,slot,2);return null;});
 assert.equal(withdraw(engine,bag,p,'input',4).moved,2);
 assert.equal(bag.amount,2);assert.equal(f.get(p).input.qty,3);
});
test('invalid mutation that increases or changes a slot is rejected',()=>{
 const f=output(2),bag=inventory();
 const engine=wrap(f,()=>{f.get(p).output={key:'rawIron',qty:2};return null;});
 assert.throws(()=>withdraw(engine,bag,p,'output',1),/Invalid furnace withdrawal state/);
});
