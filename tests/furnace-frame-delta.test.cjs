/* Malformed frame deltas must not ignite fuel or advance saved furnace timers. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),context);
const api=context.window.MineWorldFurnace;
const p={dimension:'overworld',x:738,y:-32,z:739};
function ready(){
 const f=api.create();
 assert.equal(f.insert(p,'input','rawIron',8),8);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 return f;
}
test('infinite frame delta cannot ignite fuel or smelt items',()=>{
 const f=ready(),before=JSON.stringify(f.snapshot());
 const result=f.tick(Infinity);
 assert.equal(result.changed,false);
 assert.equal(result.completed,0);
 assert.equal(JSON.stringify(f.snapshot()),before);
 assert.equal(f.tick(10).completed,1,'valid time still works afterward');
});
test('NaN and nonnumeric objects cannot mutate a loaded furnace',()=>{
 const f=ready(),before=JSON.stringify(f.snapshot());
 for(const delta of [NaN,{},null,undefined]){
  assert.equal(f.tick(delta).changed,false);
  assert.equal(JSON.stringify(f.snapshot()),before);
 }
});
test('numeric strings cannot bypass the typed elapsed-time boundary',()=>{
 const f=ready(),before=JSON.stringify(f.snapshot());
 for(const delta of ['10','Infinity','0.5']){
  assert.equal(f.tick(delta).completed,0);
  assert.equal(JSON.stringify(f.snapshot()),before);
 }
});
test('negative and zero deltas leave partial cooking and burn unchanged',()=>{
 const f=ready();
 assert.equal(f.tick(3).completed,0);
 const before=JSON.stringify(f.snapshot());
 for(const delta of [-1,-Infinity,0]){
  assert.equal(f.tick(delta).changed,false);
  assert.equal(JSON.stringify(f.snapshot()),before);
 }
 assert.equal(f.tick(7).completed,1);
 assert.equal(f.get(p).output.qty,1);
});
test('finite suspended-frame time remains capped at 60 seconds',()=>{
 const f=ready();
 const result=f.tick(3600);
 assert.equal(result.completed,6);
 assert.equal(f.get(p).burn,20);
 assert.equal(f.get(p).input.qty,2);
});
