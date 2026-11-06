const test=require('node:test');
const assert=require('node:assert/strict');
const furnace=require('../furnace-core.js');
test('unheated smelting progress decays by two ticks rather than resetting',()=>{
 const s={input:{id:'sand',count:1},progress:100,burn:0};
 const next=furnace.tick(s,3);
 assert.equal(next.progress,94);
 assert.equal(s.progress,100);
});
test('progress decay clamps at zero',()=>{
 assert.equal(furnace.tick({input:{id:'sand',count:1},progress:1},10).progress,0);
});
test('reigniting after fuel starvation resumes remaining progress',()=>{
 const cooling=furnace.tick({input:{id:'sand',count:1},progress:150},5);
 const fueled=furnace.insert(cooling,'fuel',{id:'coal',count:1}).furnace;
 const resumed=furnace.tick(fueled,60);
 assert.equal(resumed.output.id,'glass');
 assert.equal(resumed.output.count,1);
});
test('blocked output still resets progress',()=>{
 const s={input:{id:'sand',count:1},output:{id:'stone',count:1},progress:100,burn:0};
 assert.equal(furnace.tick(s,1).progress,0);
});
