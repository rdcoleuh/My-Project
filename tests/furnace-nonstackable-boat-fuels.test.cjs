/* Boats and rafts burn as individual fuel items, not stacks of 64. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace,ui=ctx.window.MineWorldFurnaceUI;
const p={dimension:'overworld',x:-45,y:-24,z:61};
const fuels=['boat','spruceBoat','cherryBoat','raft'];
function inventory(amount){let count=amount,largestDebit=0;return {
 count:()=>count,change:(_item,delta)=>{
  if(delta<0)largestDebit=Math.max(largestDebit,-delta);
  if(count+delta<0||count+delta>65535)return 0;
  count+=delta;return delta;
 },get amount(){return count;},get largestDebit(){return largestDebit;}
};}
test('boats, rafts and lava buckets each occupy one furnace fuel slot',()=>{
 for(const item of [...fuels,'lavaBucket']){
  assert.equal(api.slotCapacity('fuel',item),1,item);
  const f=api.create();
  assert.equal(f.insert(p,'fuel',item,64),1,item);
  assert.equal(f.insert(p,'fuel',item,64),0,item);
  assert.equal(f.get(p).fuel.qty,1,item);
 }
 assert.equal(api.slotCapacity('fuel','coal'),64);
 assert.equal(api.slotCapacity('input','rawIron'),64);
 assert.equal(api.slotCapacity('output','boat'),0);
});
test('Add Stack and native slot taps never debit more than one boat',()=>{
 for(const item of fuels){
  const f=api.create(),bag=inventory(6);
  assert.equal(ui.transfers.deposit(f,bag,p,'fuel',item,64),1,item);
  assert.equal(bag.amount,5,item);
  assert.equal(bag.largestDebit,1,item);
  assert.equal(ui.transfers.deposit(f,bag,p,'fuel',item,64),0,item);
  const gesture=ui.planSlotGesture('fuel',f.get(p).fuel,item,bag.count(item),{});
  assert.equal(gesture.action,'take',item);
  assert.equal(ui.transfers.withdraw(f,bag,p,'fuel',gesture.limit).moved,1,item);
  assert.equal(bag.amount,6,item);
 }
});
test('old saved stacked boat fuel is preserved but cannot accept new deposits',()=>{
 const f=api.create();
 f.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:20},fuel:{key:'boat',qty:3}}]);
 assert.equal(f.get(p).fuel.qty,3);
 assert.equal(f.insert(p,'fuel','boat',1),0);
 assert.equal(f.tick(10).completed,0,'overstacked legacy boat fuel must not ignite');
 assert.equal(f.get(p).fuel.qty,3,'no legacy fuel may disappear');
 assert.equal(f.get(p).burn,0);
 const saved=JSON.parse(JSON.stringify(f.snapshot()));
 const restored=api.create();restored.restore(saved);
 assert.equal(restored.get(p).fuel.qty,3);
 assert.equal(restored.tick(60).completed,0,'restored overstacked fuel stays inert');
 assert.equal(restored.get(p).fuel.qty,3);
 assert.equal(restored.take(p,'fuel',2).qty,2,'excess fuel remains withdrawable');
 assert.equal(restored.get(p).fuel.qty,1);
 assert.equal(restored.tick(10).completed,1,'single remaining boat may now ignite');
 assert.equal(restored.get(p).fuel,null);
 assert.equal(restored.get(p).output.qty,1);
 assert.equal(restored.get(p).burn,50);
});
test('desktop/mobile browser smoke captures synthetic boat fuel with imported fixture pack',()=>{
 const smoke=fs.readFileSync(path.join(root,'scripts/browser-smoke.cjs'),'utf8');
 assert.ok(smoke.includes("grantLoot('boat',3)"));
 assert.ok(smoke.includes('mobile-boat-fuel-capacity.png'));
 assert.ok(smoke.includes('desktop-boat-fuel-capacity.png'));
 assert.ok(smoke.includes('boats must be nonstackable furnace fuel'));
});
