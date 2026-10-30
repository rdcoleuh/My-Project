/* Regression for partial furnace withdrawal: preserve live smelt progress. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const engine=ctx.window.MineWorldFurnace,withdraw=ctx.window.MineWorldFurnaceUI.transfers.withdraw;
const p={dimension:'overworld',x:120,y:-40,z:121};
function bag(initial={}){
 const counts={...initial};
 return {counts,count:key=>counts[key]||0,change:(key,delta)=>{
  const before=counts[key]||0;
  counts[key]=Math.max(0,Math.min(65535,before+delta));
  return counts[key]-before;
 }};
}
test('taking one input leaves the same recipe cooking; taking the last input resets progress',()=>{
 const f=engine.create();
 f.insert(p,'input','rawIron',3);f.insert(p,'fuel','coal',1);
 f.tick(4);
 assert.equal(f.take(p,'input',1).qty,1);
 assert.equal(f.get(p).input.qty,2);
 assert.equal(f.get(p).progress,4,'same recipe still has ingredients');
 assert.equal(f.tick(6).completed,1,'partial take must not waste four seconds');
 assert.equal(f.get(p).input.qty,1);
 assert.equal(f.take(p,'input',1).qty,1);
 assert.equal(f.get(p).input,null);
 assert.equal(f.get(p).progress,0);
});
test('inventory Take 1 is atomic, bounded and preserves partial cook progress',()=>{
 const f=engine.create(),inventory=bag();
 f.insert(p,'input','rawGold',4);f.insert(p,'fuel','coal',1);f.tick(3);
 assert.equal(withdraw(f,inventory,p,'input',1).moved,1);
 assert.equal(inventory.count('rawGold'),1);
 assert.equal(f.get(p).input.qty,3);
 assert.equal(f.get(p).progress,3);
 assert.equal(withdraw(f,inventory,p,'input',0).moved,0);
 assert.equal(withdraw(f,inventory,p,'input',1.5).moved,0);
 assert.equal(f.get(p).input.qty,3);
 assert.equal(withdraw(f,inventory,p,'input').moved,3);
 assert.equal(inventory.count('rawGold'),4);
 assert.equal(f.get(p).progress,0);
});
test('taking one fuel from a stack does not extinguish already burning fuel',()=>{
 const f=engine.create(),inventory=bag();
 f.insert(p,'input','rawIron',4);f.insert(p,'fuel','coal',3);f.tick(2);
 assert.equal(withdraw(f,inventory,p,'fuel',1).moved,1);
 assert.equal(f.get(p).fuel.qty,1,'one coal was already consumed at ignition');
 assert.equal(f.get(p).burn,78);
 assert.equal(f.tick(8).completed,1);
 assert.equal(f.get(p).burn,70);
});
test('both accessible Take 1 buttons are exercised in real desktop/mobile browser smoke',()=>{
 const ui=fs.readFileSync(path.join(root,'furnace-ui.js'),'utf8');
 const smoke=fs.readFileSync(path.join(root,'scripts/browser-smoke.cjs'),'utf8');
 for(const which of ['input','fuel']){
  assert.match(ui,new RegExp('mw-furnace-return-'+which+'-one'));
  assert.match(ui,new RegExp("take\\(which,1\\)"));
 }
 assert.match(smoke,/mw-furnace-return-input-one/);
 assert.match(smoke,/mobile-furnace-take-one\.png/);
 assert.match(smoke,/desktop-furnace-take-one\.png/);
});
