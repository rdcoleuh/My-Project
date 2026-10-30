/* Restoring malformed or duplicate furnace records must not erase items or grant free cooking. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:481,y:-30,z:482};
const copy=x=>JSON.parse(JSON.stringify(x));

test('duplicate furnace positions cannot overwrite the first saved inventory',()=>{
 const q={...p,x:p.x+1};
 const f=api.create();
 f.restore([
  {...p,input:{key:'rawIron',qty:3},fuel:{key:'coal',qty:1},
   output:{key:'iron',qty:2},progress:6,burn:30,burnTotal:80},
  {...p,input:{key:'rawGold',qty:64},fuel:{key:'blazeRod',qty:64},
   output:{key:'gold',qty:64},progress:9,burn:120,burnTotal:120},
  {...q,input:{key:'rawGold',qty:1},fuel:{key:'coal',qty:1}}
 ]);
 assert.equal(f.snapshot().length,2,'one machine per physical block');
 const restored=copy(f.get(p));
 assert.equal(restored.input.key,'rawIron');
 assert.equal(restored.input.qty,3);
 assert.equal(restored.fuel.key,'coal');
 assert.equal(restored.output.key,'iron');
 assert.equal(restored.output.qty,2);
 assert.equal(restored.burn,30);
 assert.equal(restored.progress,6);
 assert.equal(f.get(q).input.key,'rawGold','unrelated furnaces still restore');
 assert.equal(f.tick(4).completed,1,'original progress continues after restore');
 assert.equal(f.get(p).output.qty,3);
 assert.equal(f.get(p).input.qty,2);
});

test('orphaned progress cannot accelerate the next inserted ingredient',()=>{
 const f=api.create();
 f.restore([{...p,progress:9,fuel:{key:'coal',qty:1}}]);
 assert.equal(f.get(p).progress,0);
 assert.equal(f.insert(p,'input','rawIron',1),1);
 assert.equal(f.tick(1).completed,0,'one second must not finish a fresh item');
 assert.equal(f.get(p).progress,1);
 assert.equal(f.tick(9).completed,1);
 assert.equal(f.get(p).output.key,'iron');
});

test('invalid ingredient stacks cannot retain progress, but valid partial cooks do',()=>{
 const f=api.create(),q={...p,z:p.z+1};
 f.restore([
  {...p,input:{key:'rawIron',qty:0},progress:8,fuel:{key:'coal',qty:1}},
  {...q,input:{key:'rawIron',qty:2},progress:8,fuel:{key:'coal',qty:1}}
 ]);
 assert.equal(f.get(p).input,null);
 assert.equal(f.get(p).progress,0);
 assert.equal(f.get(q).progress,8,'valid partial progress remains intact');
 assert.equal(f.tick(2).completed,1,'legitimate saved progress is still useful');
 assert.equal(f.get(q).output.qty,1);
});

test('duplicate guard survives snapshot and a second restore',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'rawIron',qty:2}},{...p,input:{key:'rawGold',qty:2}}]);
 const g=api.create();g.restore(copy(f.snapshot()));
 assert.equal(g.snapshot().length,1);
 assert.equal(g.get(p).input.key,'rawIron');
});
