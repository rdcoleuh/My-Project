'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../furnace-core.js');
test('furnace snapshot survives JSON round trip with active burn and progress',()=>{
 const active=core.tick({input:{id:'sand',count:2},fuel:{id:'coal',count:1}},37);
 const snapshot=core.serialize(active);
 assert.equal(snapshot.version,1);
 assert.deepEqual(core.deserialize(JSON.parse(JSON.stringify(snapshot))),active);
 assert.deepEqual(core.tick(core.deserialize(snapshot),163).output,{id:'glass',count:1});
});
test('legacy unversioned furnace save remains readable',()=>{
 assert.deepEqual(core.deserialize({input:{id:'sand',count:1},progress:17}).input,{id:'sand',count:1});
 assert.equal(core.deserialize({progress:17}).progress,0,'orphan progress cannot grant a future ingredient free cooking');
 assert.equal(core.deserialize({input:{id:'sand',count:1},progress:17}).progress,17,'valid legacy ingredient progress survives');
});
test('unknown future furnace version is rejected without data loss',()=>{
 assert.throws(()=>core.deserialize({version:2,input:{id:'sand',count:12}}),/Unsupported furnace save version/);
});
test('malformed timer and stack values are normalized on restore',()=>{
 const restored=core.deserialize({version:1,input:{id:'sand',count:999},burn:Infinity,burnTotal:-2,progress:999999});
 assert.equal(restored.input,null);
 assert.equal(restored.burn,0);
 assert.equal(restored.burnTotal,0);
 assert.equal(restored.progress,0,'invalid input must not retain almost-complete cooking');
 const valid=core.deserialize({version:1,input:{id:'sand',count:1},burn:300,burnTotal:10,progress:199});
 assert.equal(valid.burn,10,'remaining burn cannot exceed paid fuel total');
 assert.equal(valid.progress,199,'valid ingredient progress remains available');
 assert.deepEqual(core.tick(valid,1).output,{id:'glass',count:1},'one paid tick finishes a valid 199-tick cook');
 assert.equal(core.tick({...valid,progress:0},10).output,null,'ten paid ticks cannot finish a fresh cook');
});
