/* Cactus-to-dye furnace parity using MineWorld's own block/item registry. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:816,y:14,z:818};
const clone=value=>JSON.parse(JSON.stringify(value));

test('harvested cactus smelts into generic dye in a normal furnace',()=>{
 const f=api.create();
 assert.equal(api.RECIPES['block:44'],'dye');
 assert.equal(f.insert(p,'input','block:44',3),3);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(30).completed,3);
 assert.equal(f.get(p).output.key,'dye');
 assert.equal(f.get(p).output.qty,3);
 assert.equal(f.get(p).input,null);
 assert.equal(f.get(p).burn,50);
});

test('cactus cannot be cooked in smoker or blast furnace',()=>{
 for(const kind of ['smoker','blast']){
  const f=api.create();f.ensure(p,kind);
  assert.equal(api.canSmelt(kind,'block:44'),false);
  assert.equal(f.insert(p,'input','block:44',1),0);
  f.restore([{...p,kind,input:{key:'block:44',qty:1},fuel:{key:'coal',qty:1}}]);
  assert.equal(f.tick(10).completed,0);
  assert.equal(f.take(p,'input',1).key,'block:44');
 }
});

test('partial cactus smelting and fuel survive save/reload',()=>{
 const f=api.create();
 f.insert(p,'input','block:44',2);f.insert(p,'fuel','coal',1);
 assert.equal(f.tick(4).completed,0);
 const g=api.create();g.restore(clone(f.snapshot()));
 assert.equal(g.get(p).progress,4);
 assert.equal(g.get(p).burn,76);
 assert.equal(g.tick(6).completed,1);
 assert.equal(g.get(p).output.key,'dye');
 assert.equal(g.get(p).input.qty,1);
});

test('existing incompatible output is never overwritten by dye',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'block:44',qty:1},fuel:{key:'coal',qty:1},
   output:{key:'iron',qty:1}}]);
 assert.equal(f.tick(10).completed,0);
 assert.equal(f.get(p).output.key,'iron');
 assert.equal(f.get(p).input.qty,1);
 assert.equal(f.take(p,'output',1).key,'iron');
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).output.key,'dye');
});

test('full dye output stack blocks cactus consumption until room exists',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'block:44',qty:2},output:{key:'dye',qty:64},
   burn:40,burnTotal:80}]);
 assert.equal(f.tick(10).completed,0);
 assert.equal(f.get(p).input.qty,2);
 assert.equal(f.take(p,'output',1).qty,1);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).output.qty,64);
 assert.equal(f.get(p).input.qty,1);
});

test('browser smoke checks real cactus picker, smelting and synthetic screenshots',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/\b'Cactus'\b/);
 assert.match(html,/\bdye:0\b/);
 const smoke=fs.readFileSync(path.join(root,'scripts/browser-smoke.cjs'),'utf8');
 assert.ok(smoke.includes("grantLoot('block:44',1)"));
 assert.ok(smoke.includes("selectOption('block:44')"));
 assert.ok(smoke.includes("output?.key==='dye'"));
 assert.ok(smoke.includes('desktop-furnace-cactus-dye-synthetic.png'));
 assert.ok(smoke.includes('mobile-furnace-cactus-dye-synthetic.png'));
});
