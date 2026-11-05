/* Real furnace-engine + UI-transfer integration without a browser DOM. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx,{filename:file});
const engineApi=ctx.window.MineWorldFurnace;
const {deposit,withdraw}=ctx.window.MineWorldFurnaceUI.transfers;
const p={dimension:'overworld',x:11,y:12,z:13};
const copy=x=>JSON.parse(JSON.stringify(x));
function inventory(initial){
 const items={...initial};
 let saves=0;
 return {items,count:key=>items[key]||0,change(key,delta){
  if((items[key]||0)+delta<0)return 0;
  items[key]=(items[key]||0)+delta;return delta;
 },onChange(){saves++},get saves(){return saves}};
}
test('player inventory -> three slots -> smelting -> output -> save/reload conserves items',()=>{
 const engine=engineApi.create(),bag=inventory({rawIron:3,coal:1});
 assert.equal(engine.ensure(p,'furnace').kind,'furnace');
 assert.equal(deposit(engine,bag,p,'input','rawIron',3),3);
 assert.equal(deposit(engine,bag,p,'fuel','coal',1),1);
 assert.equal(bag.count('rawIron'),0);
 assert.equal(bag.count('coal'),0);
 assert.equal(engine.tick(10).completed,1);
 const saved=copy(engine.snapshot());
 const restored=engineApi.create();restored.restore(saved);
 assert.equal(restored.get(p).input.qty,2);
 assert.equal(restored.get(p).output.qty,1);
 assert.equal(withdraw(restored,bag,p,'output',1).moved,1);
 assert.equal(bag.count('iron'),1);
 assert.equal(restored.tick(20).completed,2);
 assert.equal(withdraw(restored,bag,p,'output',64).moved,2);
 assert.equal(bag.count('iron'),3);
 assert.equal(restored.get(p).input,null);
 assert.equal(restored.get(p).output,null);
});
test('failed inventory debit never deposits phantom fuel',()=>{
 const engine=engineApi.create(),bag=inventory({coal:0});
 engine.ensure(p);
 assert.equal(deposit(engine,bag,p,'fuel','coal',1),0);
 assert.equal(engine.get(p).fuel,null);
});
test('inventory capacity prevents output loss on collection',()=>{
 const engine=engineApi.create(),bag=inventory({iron:65535});
 engine.restore([{...p,output:{key:'iron',qty:2}}]);
 const result=withdraw(engine,bag,p,'output',64);
 assert.equal(result.moved,0);
 assert.equal(result.full,true);
 assert.equal(engine.get(p).output.qty,2);
});

test('deposit rolls back an inventory debit when the adapter throws after mutation',()=>{
 const engine=engineApi.create(),pos={...p,x:41},bag=inventory({rawIron:2});
 engine.ensure(pos);
 const original=bag.change;
 bag.change=(key,delta)=>{const result=original(key,delta);if(delta<0)throw Error('interrupted debit');return result;};
 assert.throws(()=>deposit(engine,bag,pos,'input','rawIron',2),/interrupted debit/);
 assert.equal(bag.count('rawIron'),2);
 assert.equal(engine.get(pos).input,null);
});
test('withdraw rolls back a player credit when the adapter throws after mutation',()=>{
 const engine=engineApi.create(),pos={...p,x:42},bag=inventory({iron:0});
 engine.restore([{...pos,output:{key:'iron',qty:2}}]);
 const original=bag.change;
 bag.change=(key,delta)=>{const result=original(key,delta);if(delta>0)throw Error('interrupted credit');return result;};
 assert.throws(()=>withdraw(engine,bag,pos,'output',2),/interrupted credit/);
 assert.equal(bag.count('iron'),0);
 assert.equal(engine.get(pos).output.qty,2);
});
