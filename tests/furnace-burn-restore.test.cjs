/* A saved furnace must not manufacture fuel from inconsistent timers. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:417,y:-48,z:418};
const clone=value=>JSON.parse(JSON.stringify(value));

test('restoring burn without a matching burnTotal cannot create free smelts',()=>{
 for(const record of [
  {burn:800,burnTotal:0},
  {burn:800},
  {burn:Infinity,burnTotal:Infinity},
  {burn:'800',burnTotal:'800'},
  {burn:NaN,burnTotal:800},
  {burn:-5,burnTotal:800}
 ]){
  const f=api.create();
  f.restore([{...p,input:{key:'rawIron',qty:8},...record}]);
  assert.equal(f.get(p).burn,0,JSON.stringify(record));
  assert.equal(f.tick(60).completed,0,JSON.stringify(record));
  assert.equal(f.get(p).output,null);
  assert.equal(f.get(p).input.qty,8);
 }
});

test('corrupted burn above total is capped without consuming additional fuel',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'rawIron',qty:5},burn:800,burnTotal:20}]);
 assert.equal(f.get(p).burn,20);
 assert.equal(f.tick(20).completed,2);
 assert.equal(f.get(p).burn,0);
 assert.equal(f.get(p).input.qty,3);
 assert.equal(f.tick(60).completed,0,'a corrupt timer must not cook three more items');
});

test('legitimate long-duration coal-block fuel and partial progress survive save restore',()=>{
 const f=api.create();
 assert.equal(f.insert(p,'input','rawIron',12),12);
 assert.equal(f.insert(p,'fuel','block:116',1),1);
 assert.equal(f.tick(34).completed,3);
 const saved=clone(f.snapshot()),g=api.create();
 g.restore(saved);
 assert.equal(g.get(p).burnTotal,800);
 assert.equal(g.get(p).burn,766);
 assert.equal(g.get(p).progress,4);
 assert.equal(g.tick(6).completed,1);
 assert.equal(g.get(p).output.qty,4);
 assert.equal(g.get(p).burn,760);
 assert.equal(g.get(p).input.qty,8);
});

test('fuel in a valid slot still ignites after invalid timer metadata is discarded',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'rawIron',qty:2},fuel:{key:'coal',qty:1},
  burn:900,burnTotal:0}]);
 assert.equal(f.get(p).burn,0);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).burnTotal,80);
 assert.equal(f.get(p).burn,70);
 assert.equal(f.get(p).fuel,null);
});
