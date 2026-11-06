const test=require('node:test');
const assert=require('node:assert/strict');
const furnace=require('../furnace-core.js');
test('replacing an exhausted input cannot reuse old recipe progress',()=>{
 const prior={input:{id:'sand',count:1},fuel:{id:'coal',count:1},progress:199,burn:1,burnTotal:1600};
 const removed=furnace.extract(prior,'input',1);
 assert.equal(removed.furnace.progress,0);
 const next=furnace.insert(removed.furnace,'input',{id:'iron_ore',count:1});
 assert.equal(next.furnace.progress,0);
 const after=furnace.tick(next.furnace,1);
 assert.equal(after.progress,1);
 assert.equal(after.output,null);
 assert.equal(prior.progress,199);
});
test('adding same ingredient retains legitimate partial progress',()=>{
 const s={input:{id:'sand',count:1},progress:87,burn:100};
 const next=furnace.insert(s,'input',{id:'sand',count:2});
 assert.equal(next.furnace.progress,87);
 assert.equal(next.furnace.input.count,3);
});
test('partial extraction retains progress but full extraction clears it',()=>{
 const s={input:{id:'sand',count:2},progress:80};
 assert.equal(furnace.extract(s,'input',1).furnace.progress,80);
 assert.equal(furnace.extract(s,'input',2).furnace.progress,0);
});
