const test=require('node:test');
const assert=require('node:assert/strict');
const f=require('../furnace-core.js');
test('restored progress cannot exceed one smelt cycle',()=>{
 const s=f.state({input:{id:'sand',count:1},fuel:{id:'coal',count:1},progress:999999});
 assert.equal(s.progress,199);
 assert.equal(f.tick(s,1).output.id,'glass');
});
test('invalid restored progress becomes zero',()=>{
 for(const progress of [-5,NaN,Infinity,2.5,'199'])assert.equal(f.state({progress}).progress,0);
});
test('ordinary partially completed save resumes without losing progress',()=>{
 let s=f.tick({input:{id:'sand',count:1},fuel:{id:'coal',count:1}},100);
 s=f.tick(JSON.parse(JSON.stringify(s)),99);
 assert.equal(s.output,null);
 assert.equal(s.progress,199);
 s=f.tick(s,1);
 assert.deepEqual(s.output,{id:'glass',count:1});
});
