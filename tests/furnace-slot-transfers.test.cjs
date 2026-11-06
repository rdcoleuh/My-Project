const test=require('node:test');
const assert=require('node:assert/strict');
const f=require('../furnace-core.js');
test('input insertion stacks without mutation or duplication',()=>{
 const initial={input:{id:'sand',count:60},fuel:null,output:null};
 const incoming={id:'sand',count:10};
 const r=f.insert(initial,'input',incoming);
 assert.equal(r.moved,4);assert.deepEqual(r.remainder,{id:'sand',count:6});
 assert.equal(r.furnace.input.count,64);assert.equal(initial.input.count,60);assert.equal(incoming.count,10);
});
test('reject unsupported fuel, invalid items and output insertion',()=>{
 assert.equal(f.insert({},'fuel',{id:'sand',count:2}).moved,0);
 assert.throws(()=>f.insert({},'output',{id:'coal',count:1}),RangeError);
 assert.throws(()=>f.insert({},'input',{id:'sand',count:65}),TypeError);
});
test('extract output partially and retain immutable source',()=>{
 const initial={output:{id:'glass',count:5}};
 const r=f.extract(initial,'output',3);
 assert.deepEqual(r.taken,{id:'glass',count:3});assert.equal(r.furnace.output.count,2);
 assert.equal(initial.output.count,5);
 assert.equal(f.extract(r.furnace,'output').furnace.output,null);
 assert.throws(()=>f.extract({},'output',0),RangeError);
});
test('incompatible stacks are not merged',()=>{
 const r=f.insert({input:{id:'sand',count:3}},'input',{id:'iron_ore',count:2});
 assert.equal(r.moved,0);assert.deepEqual(r.remainder,{id:'iron_ore',count:2});
});
