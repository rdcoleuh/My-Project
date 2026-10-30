/* Regression: precise one-at-a-time output collection without lost ingots. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const engine=ctx.window.MineWorldFurnace;
const withdraw=ctx.window.MineWorldFurnaceUI.transfers.withdraw;
const p={dimension:'overworld',x:240,y:-35,z:250};
function bag(initial={}){
 const counts={...initial};
 return {count:key=>counts[key]||0,change:(key,delta)=>{
  const before=counts[key]||0;
  counts[key]=Math.max(0,Math.min(65535,before+delta));
  return counts[key]-before;
 }};
}
test('collecting one output keeps remaining ingots and conserves total items',()=>{
 const f=engine.create(),inventory=bag();
 assert.equal(f.insert(p,'input','rawIron',3),3);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(30).completed,3);
 assert.equal(f.get(p).output.qty,3);
 assert.equal(withdraw(f,inventory,p,'output',1).moved,1);
 assert.equal(f.get(p).output.qty,2);
 assert.equal(inventory.count('iron'),1);
 assert.equal(withdraw(f,inventory,p,'output',1).moved,1);
 assert.equal(f.get(p).output.qty,1);
 assert.equal(withdraw(f,inventory,p,'output').moved,1);
 assert.equal(f.get(p).output,null);
 assert.equal(inventory.count('iron'),3);
 assert.equal(withdraw(f,inventory,p,'output',1).moved,0);
});
test('single-output collection respects full inventory without consuming furnace items',()=>{
 const f=engine.create(),inventory=bag({iron:65535});
 f.insert(p,'input','rawIron',2);f.insert(p,'fuel','coal',1);f.tick(20);
 assert.equal(withdraw(f,inventory,p,'output',1).full,true);
 assert.equal(f.get(p).output.qty,2);
 assert.equal(inventory.count('iron'),65535);
});
test('desktop/mobile browser smoke exercises accessible Collect 1 with two smelts',()=>{
 const ui=fs.readFileSync(path.join(root,'furnace-ui.js'),'utf8');
 const smoke=fs.readFileSync(path.join(root,'scripts/browser-smoke.cjs'),'utf8');
 assert.match(ui,/id="mw-furnace-output-one"/);
 assert.match(ui,/aria-label="Collect one smelted item"/);
 assert.match(ui,/take\('output',1\)/);
 assert.match(ui,/mw-furnace-output-one'\)\.disabled=!m\.output/);
 assert.match(smoke,/mw-furnace-output-one/);
 assert.match(smoke,/desktop-furnace-output-one\.png/);
 assert.match(smoke,/mobile-furnace-output-one\.png/);
 assert.match(smoke,/output\?\.qty===2/);
});
