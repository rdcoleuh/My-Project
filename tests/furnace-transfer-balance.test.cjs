/* Furnace transfers must reconcile actual inventory changes, not just adapter return values. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const {deposit,withdraw}=ctx.window.MineWorldFurnaceUI.transfers;
const create=ctx.window.MineWorldFurnace.create;
const p={dimension:'overworld',x:6000,y:14,z:6000};
function bag(start,reported){
 let amount=start;
 return {count:()=>amount,change:(_key,delta)=>{
  const before=amount;
  amount=Math.max(0,Math.min(65535,amount+delta));
  const actual=amount-before;
  return reported?reported(actual,delta):actual;
 },get amount(){return amount;}};
}
function cooked(){
 const f=create();
 f.insert(p,'input','rawIron',2);
 f.insert(p,'fuel','coal',1);
 f.tick(10);
 return f;
}
test('misreported debit is refunded instead of manufacturing furnace input',()=>{
 const f=create(),inventory=bag(5,(actual)=>actual===-3?-2:actual);
 assert.equal(deposit(f,inventory,p,'input','rawIron',3),0);
 assert.equal(inventory.amount,5);
 assert.equal(f.get(p),null);
});
test('claimed debit without inventory mutation cannot manufacture input',()=>{
 const f=create();
 const inventory={count:()=>4,change:(_key,delta)=>delta};
 assert.equal(deposit(f,inventory,p,'input','rawIron',2),0);
 assert.equal(f.get(p),null);
});
test('credit that reports failure after adding items is reversed',()=>{
 const f=cooked(),inventory=bag(0,(actual)=>actual>0?0:actual);
 assert.equal(withdraw(f,inventory,p,'output',1).moved,0);
 assert.equal(inventory.amount,0);
 assert.equal(f.get(p).output.qty,1);
});
test('credit that exaggerates actual amount is reversed',()=>{
 const f=cooked(),inventory=bag(0,(actual)=>actual>0?actual+1:actual);
 assert.equal(withdraw(f,inventory,p,'output',1).moved,0);
 assert.equal(inventory.amount,0);
 assert.equal(f.get(p).output.qty,1);
});
test('partial honest credit still transfers only the amount actually accepted',()=>{
 const f=cooked();
 let amount=0;
 const inventory={count:()=>amount,change:(_key,delta)=>{
  const accepted=delta>0?Math.min(1,delta):delta;
  amount+=accepted;
  return accepted;
 }};
 assert.equal(withdraw(f,inventory,p,'output',2).moved,1);
 assert.equal(amount,1);
 assert.equal(f.get(p).output,null);
});
test('ordinary input deposit and output collection still succeed',()=>{
 const f=create(),inventory=bag(2);
 assert.equal(deposit(f,inventory,p,'input','rawIron',2),2);
 assert.equal(inventory.amount,0);
 f.insert(p,'fuel','coal',1);
 assert.equal(f.tick(10).completed,1);
 assert.equal(withdraw(f,inventory,p,'output',1).moved,1);
 assert.equal(inventory.amount,1);
});
