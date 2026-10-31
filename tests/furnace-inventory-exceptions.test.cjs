/* Inventory adapters may throw after mutating: furnace transfers must remain conservative. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const create=ctx.window.MineWorldFurnace.create;
const {deposit,withdraw}=ctx.window.MineWorldFurnaceUI.transfers;
const p={dimension:'overworld',x:5371,y:14,z:5371};
function bag(initial,operation,mode){
 let amount=initial,failed=false;
 return {count:()=>amount,change:(_key,delta)=>{
  const matches=operation==='debit'?delta<0:delta>0;
  if(matches&&!failed){
   failed=true;
   if(mode!=='before'){
    const applied=mode==='partial'?Math.sign(delta):delta;
    amount=Math.max(0,Math.min(65535,amount+applied));
   }
   throw Error('inventory adapter interrupted');
  }
  const before=amount;
  amount=Math.max(0,Math.min(65535,amount+delta));
  return amount-before;
 },get amount(){return amount;}};
}
function output(qty=2){
 const f=create();f.insert(p,'input','rawIron',qty);f.insert(p,'fuel','coal',1);
 assert.equal(f.tick(qty*10).completed,qty);return f;
}
for(const mode of ['before','partial','after']){
 test('deposit recovers inventory when debit throws '+mode+' mutation',()=>{
  const f=create(),inventory=bag(5,'debit',mode);
  assert.throws(()=>deposit(f,inventory,p,'input','rawIron',3),/inventory adapter interrupted/);
  assert.equal(inventory.amount,5);
  assert.equal(f.get(p),null);
 });
 test('withdraw recovers inventory when credit throws '+mode+' mutation',()=>{
  const f=output(),inventory=bag(0,'credit',mode);
  assert.throws(()=>withdraw(f,inventory,p,'output',2),/inventory adapter interrupted/);
  assert.equal(inventory.amount,0);
  assert.equal(f.get(p).output.qty,2);
 });
}
test('unexpected reverse-direction debit is rolled back rather than creating items',()=>{
 const f=create();let amount=5,misbehaved=false;
 const inventory={count:()=>amount,change:(_key,delta)=>{
  if(delta<0&&!misbehaved){misbehaved=true;amount++;return 0;}
  amount+=delta;return delta;
 }};
 assert.equal(deposit(f,inventory,p,'input','rawIron',2),0);
 assert.equal(amount,5);assert.equal(f.get(p),null);
});
test('unexpected reverse-direction credit is rolled back rather than losing items',()=>{
 const f=output(1);let amount=2,misbehaved=false;
 const inventory={count:()=>amount,change:(_key,delta)=>{
  if(delta>0&&!misbehaved){misbehaved=true;amount--;return 0;}
  amount+=delta;return delta;
 }};
 assert.equal(withdraw(f,inventory,p,'output',1).moved,0);
 assert.equal(amount,2);assert.equal(f.get(p).output.qty,1);
});
test('a recovered adapter failure does not prevent later ordinary furnace transfers',()=>{
 const f=create(),inventory=bag(5,'debit','partial');
 assert.throws(()=>deposit(f,inventory,p,'input','rawIron',3),/interrupted/);
 assert.equal(deposit(f,inventory,p,'input','rawIron',3),3);
 assert.equal(inventory.amount,2);assert.equal(f.get(p).input.qty,3);
});
