/* Nonstackable fuel containers must never reserve a full inventory stack. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const {create,slotCapacity}=ctx.window.MineWorldFurnace;
const {deposit,withdraw}=ctx.window.MineWorldFurnaceUI.transfers;
const p={dimension:'overworld',x:-5,y:-24,z:8};
function bag(initial){
 let count=initial,largestDebit=0;
 return {count:()=>count,change:(_key,delta)=>{
  if(delta<0)largestDebit=Math.max(largestDebit,-delta);
  const before=count;count=Math.max(0,Math.min(65535,count+delta));return count-before;
 },get amount(){return count;},get largestDebit(){return largestDebit;}};
}
test('slot capacities preserve one lava container and 64 normal items',()=>{
 assert.equal(slotCapacity('fuel','lavaBucket'),1);
 assert.equal(slotCapacity('fuel','coal'),64);
 assert.equal(slotCapacity('input','rawIron'),64);
 assert.equal(slotCapacity('output','lavaBucket'),0);
});
test('Add Stack reserves only one bucket and full slot rejects repeat deposits',()=>{
 const engine=create(),inventory=bag(40);
 assert.equal(deposit(engine,inventory,p,'fuel','lavaBucket',64),1);
 assert.equal(inventory.amount,39);
 assert.equal(inventory.largestDebit,1,'do not temporarily debit 40 containers');
 assert.equal(engine.get(p).fuel.qty,1);
 assert.equal(deposit(engine,inventory,p,'fuel','lavaBucket',64),0);
 assert.equal(inventory.amount,39);
 assert.equal(inventory.largestDebit,1);
 assert.equal(withdraw(engine,inventory,p,'fuel',64).moved,1);
 assert.equal(inventory.amount,40);
});
test('stackable coal and iron retain their original 64-item capacity',()=>{
 const f=create(),coal=bag(70),iron=bag(70);
 assert.equal(deposit(f,coal,p,'fuel','coal',64),64);
 assert.equal(coal.amount,6);
 assert.equal(deposit(f,iron,p,'input','rawIron',64),64);
 assert.equal(iron.amount,6);
});
test('mobile controls and browser smoke check nonstackable capacity',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'..','furnace-ui.js'),'utf8');
 assert.match(ui,/typeof window\.MineWorldFurnace\?\.slotCapacity==='function'/);
 assert.match(ui,/window\.MineWorldFurnace\.slotCapacity\(which,selected\):64/);
 assert.match(ui,/m\[which\]\.qty<capacity/);
 assert.match(ui,/disabled=!canAdd\|\|capacity<=1/);
 const browser=fs.readFileSync(path.join(__dirname,'..','scripts/browser-smoke.cjs'),'utf8');
 assert.match(browser,/mobile-lava-fuel-capacity\.png/);
 assert.match(browser,/Add Stack must be disabled for nonstackable lava buckets/);
});
