/* Smoker and blast-furnace parity without changing legacy saves. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:5000,y:-30,z:5000};
const q=x=>({...p,x});
test('smoker accepts food only and finishes one item in five seconds',()=>{
 const f=api.create();f.ensure(p,'smoker');
 assert.equal(f.insert(p,'input','rawIron',1),0);
 assert.equal(f.insert(p,'input','chicken',2),2);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(4.9).completed,0);
 assert.equal(f.tick(.1).completed,1);
 assert.equal(f.get(p).output.key,'cookedChicken');
 assert.equal(f.get(p).progress,0);
 assert.equal(f.get(p).kind,'smoker');
});
test('blast furnace accepts ore and ancient debris but rejects food and logs',()=>{
 const f=api.create();f.ensure(p,'blast');
 assert.equal(f.insert(p,'input','chicken',1),0);
 assert.equal(f.insert(p,'input','block:40',1),0);
 assert.equal(f.insert(p,'input','rawIron',2),2);
 f.insert(p,'fuel','coal',1);
 assert.equal(f.tick(10).completed,2);
 assert.equal(f.get(p).output.qty,2);
 assert.equal(api.canSmelt('blast','ancientDebris'),true);
 assert.equal(api.canSmelt('blast','block:99'),true);
 assert.equal(api.canSmelt('blast','block:4'),false);
});
test('ordinary furnace remains ten seconds and accepts both food and ore',()=>{
 const f=api.create();f.ensure(p);
 f.insert(p,'input','rawIron',1);f.insert(p,'fuel','coal',1);
 assert.equal(f.tick(5).completed,0);
 assert.equal(f.tick(5).completed,1);
 assert.equal(api.canSmelt('furnace','chicken'),true);
 assert.equal(api.canSmelt('furnace','block:40'),true);
});
test('specialized station kind, half progress, fuel and inventory survive save/reload',()=>{
 const f=api.create();f.ensure(p,'smoker');
 f.insert(p,'input','chicken',2);f.insert(p,'fuel','coal',1);f.tick(2);
 const saved=JSON.parse(JSON.stringify(f.snapshot()));
 const g=api.create();g.restore(saved);
 assert.equal(g.get(p).kind,'smoker');
 assert.equal(g.get(p).progress,2);
 assert.equal(g.get(p).burn,38);
 assert.equal(g.tick(3).completed,1);
 assert.equal(g.get(p).output.key,'cookedChicken');
 assert.equal(saved[0].input.qty,2);
 assert.equal(saved[0].progress,2);
});
test('legacy saves default to ordinary furnace and invalid kinds cannot grant fast cooks',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'rawIron',qty:1},fuel:{key:'coal',qty:1},output:null,burn:0,burnTotal:0,progress:0}]);
 assert.equal(f.get(p).kind,'furnace');
 assert.equal(f.tick(5).completed,0);
 const g=api.create();g.restore([{...p,kind:'unknown',input:{key:'rawIron',qty:1},fuel:{key:'coal',qty:1},progress:0}]);
 assert.equal(g.get(p).kind,'furnace');
 assert.equal(g.tick(5).completed,0);
});
test('three station types have independent inventories and breaking returns contents',()=>{
 const f=api.create();
 f.ensure(p,'furnace');f.ensure(q(5001),'smoker');f.ensure(q(5002),'blast');
 f.insert(p,'input','rawIron',1);f.insert(q(5001),'input','chicken',1);
 f.insert(q(5002),'input','rawGold',1);
 assert.equal(f.snapshot().length,3);
 assert.equal(f.remove(q(5001))[0].key,'chicken');
 assert.equal(f.get(q(5001)),null);
 assert.equal(f.get(p).input.key,'rawIron');
 assert.equal(f.get(q(5002)).input.key,'rawGold');
});
test('changing a restored station type cannot inherit progress from a different recipe',()=>{
 const f=api.create();f.ensure(p,'furnace');
 f.insert(p,'input','rawIron',1);f.insert(p,'fuel','coal',1);f.tick(8);
 f.ensure(p,'smoker');
 assert.equal(f.get(p).progress,0);
 assert.equal(f.tick(5).completed,0);
 assert.equal(f.get(p).output,null);
 assert.equal(f.take(p,'input').key,'rawIron');
});
test('world interactions, mobile smoke and recipe picker include specialized stations',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const ui=fs.readFileSync(path.join(root,'furnace-ui.js'),'utf8');
 const smoke=fs.readFileSync(path.join(root,'scripts/browser-smoke.cjs'),'utf8');
 assert.match(html,/\[20,157,158\]\.includes\(aim\?\.b\)/);
 assert.match(html,/\[20,157,158\]\.includes\(before\)/);
 assert.match(ui,/engine\.canSmelt\(m\.kind,key\)/);
 assert.match(ui,/mw-furnace-title/);
 assert.match(smoke,/station\.kind\+'-smelt-synthetic\.png'/);
});
