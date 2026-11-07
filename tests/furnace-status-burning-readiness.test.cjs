'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const sandbox = {window:{}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../furnace-engine.js'),'utf8'),sandbox);
const engine = sandbox.window.MineWorldFurnace;
const p = {dimension:'overworld',x:3,y:12,z:7};
const plain = value => JSON.parse(JSON.stringify(value));

test('unlit furnace distinguishes fuel readiness from active combustion',()=>{
 const f=engine.create();f.ensure(p,'furnace');
 assert.equal(f.insert(p,'input','rawIron',1),1);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 let s=f.status(p);
 assert.equal(s.readyToSmelt,true);
 assert.equal(s.burning,false);
 assert.equal(s.cooking,true);
 assert.equal(s.burnSecondsRemaining,0);
 f.tick(1);
 s=f.status(p);
 assert.equal(s.burning,true);
 assert.equal(s.readyToSmelt,true);
 assert.equal(s.burnSecondsRemaining,79);
});
test('burning furnace without ingredients is burning but not ready to smelt',()=>{
 const f=engine.create();f.ensure(p,'furnace');
 f.insert(p,'input','rawIron',1);f.insert(p,'fuel','coal',1);f.tick(1);
 assert.deepEqual(plain(f.take(p,'input',1)),{key:'rawIron',qty:1});
 const s=f.status(p);
 assert.equal(s.burning,true);
 assert.equal(s.readyToSmelt,false);
 assert.equal(s.idleReason,'no_input');
});
test('empty and blocked furnaces report inactive readiness',()=>{
 const f=engine.create();f.ensure(p,'furnace');
 assert.equal(f.status(p).burning,false);
 assert.equal(f.status(p).readyToSmelt,false);
 f.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},fuel:{key:'coal',qty:1},output:{key:'gold',qty:1},burn:0,burnTotal:0,progress:0}]);
 const s=f.status(p);
 assert.equal(s.readyToSmelt,false);
 assert.equal(s.burning,false);
 assert.equal(s.idleReason,'output_blocked');
});
