/* Regressions: sub-microsecond burn/cook remainders must not freeze furnaces. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:8000,y:12,z:8000};
test('near-zero saved burn consumes new fuel and finishes cooking',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'rawIron',qty:2},fuel:{key:'coal',qty:1},
  burn:1e-9,burnTotal:80,progress:0}]);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).output.key,'iron');
 assert.equal(f.get(p).output.qty,1);
 assert.equal(f.get(p).fuel,null,'new coal was actually consumed');
 assert.ok(f.get(p).burn>0);
});
test('near-complete saved cook finishes and spends remaining time on next item',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'rawIron',qty:2},burn:30,burnTotal:80,
  progress:9.999999999}]);
 assert.equal(f.tick(0.25).completed,1);
 assert.equal(f.get(p).input.qty,1);
 assert.equal(f.get(p).output.qty,1);
 assert.ok(f.get(p).progress>0.24&&f.get(p).progress<0.26);
});
test('tiny burn without reserve fuel cools rather than freezing the cook',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'rawIron',qty:1},burn:1e-9,burnTotal:80,
  progress:4}]);
 assert.equal(f.tick(1).completed,0);
 assert.equal(f.get(p).burn,0);
 assert.equal(f.get(p).progress,2);
 assert.equal(f.get(p).output,null);
});
test('normal multi-item smelting remains unchanged after epsilon handling',()=>{
 const f=api.create();
 assert.equal(f.insert(p,'input','rawIron',3),3);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(30).completed,3);
 assert.equal(f.get(p).output.qty,3);
 assert.equal(f.get(p).input,null);
});
