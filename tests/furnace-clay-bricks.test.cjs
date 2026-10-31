/* Clay-to-brick furnace parity and persistence; original MineWorld logic. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:812,y:-42,z:813};

test('clay balls cook into bricks in the regular furnace at one per ten seconds',()=>{
 const f=api.create();
 assert.equal(api.RECIPES.clay,'brick');
 assert.equal(f.insert(p,'input','clay',3),3);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(30).completed,3);
 assert.equal(f.get(p).output.key,'brick');
 assert.equal(f.get(p).output.qty,3);
 assert.equal(f.get(p).input,null);
 assert.equal(f.get(p).burn,50);
 assert.equal(f.get(p).fuel,null);
});

test('smoker and blast furnace reject clay but retain it if restored from a save',()=>{
 for(const kind of ['smoker','blast']){
  const f=api.create();f.ensure(p,kind);
  assert.equal(api.canSmelt(kind,'clay'),false);
  assert.equal(f.insert(p,'input','clay',1),0);
  f.restore([{...p,kind,input:{key:'clay',qty:1},fuel:{key:'coal',qty:1}}]);
  assert.equal(f.tick(10).completed,0);
  assert.equal(f.get(p).input.key,'clay');
  assert.equal(f.take(p,'input',1).key,'clay');
 }
});

test('partial clay cooking survives reload and continues without duplicating fuel',()=>{
 const f=api.create();
 f.insert(p,'input','clay',2);f.insert(p,'fuel','coal',1);
 assert.equal(f.tick(4).completed,0);
 const restored=api.create();restored.restore(JSON.parse(JSON.stringify(f.snapshot())));
 assert.equal(restored.get(p).progress,4);
 assert.equal(restored.get(p).burn,76);
 assert.equal(restored.tick(6).completed,1);
 assert.equal(restored.get(p).output.key,'brick');
 assert.equal(restored.get(p).input.qty,1);
 assert.equal(restored.get(p).fuel,null);
});

test('brick output cannot overwrite an incompatible stack',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'clay',qty:2},fuel:{key:'coal',qty:1},
   output:{key:'iron',qty:2}}]);
 assert.equal(f.tick(10).completed,0);
 assert.equal(f.get(p).input.qty,2);
 assert.equal(f.get(p).output.key,'iron');
 assert.equal(f.take(p,'output',64).qty,2);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).output.key,'brick');
});

test('full brick stack blocks further production without consuming another clay',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'clay',qty:2},output:{key:'brick',qty:64},
   burn:40,burnTotal:80}]);
 assert.equal(f.tick(10).completed,0);
 assert.equal(f.get(p).input.qty,2);
 assert.equal(f.get(p).output.qty,64);
 assert.equal(f.take(p,'output',1).qty,1);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).output.qty,64);
 assert.equal(f.get(p).input.qty,1);
});

test('desktop and mobile smoke explicitly exercise clay input, brick output and synthetic pack',()=>{
 const smoke=fs.readFileSync(path.join(root,'scripts/browser-smoke.cjs'),'utf8');
 assert.match(smoke,/grantLoot\('clay',1\)/);
 assert.match(smoke,/selectOption\('clay'\)/);
 assert.match(smoke,/output\?\.key==='brick'/);
 assert.match(smoke,/desktop-furnace-clay-brick-synthetic\.png/);
 assert.match(smoke,/mobile-furnace-clay-brick-synthetic\.png/);
});
