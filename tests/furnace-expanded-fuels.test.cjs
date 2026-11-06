'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const furnace=require('../furnace-core.js');
const cases=[['bamboo',50],['blaze_rod',2400],['coal_block',16000],['sapling',100],['bowl',100],['wooden_axe',200],['wooden_shovel',200],['wooden_hoe',200],['wooden_sword',200]];
for(const [fuel,ticks] of cases){
 test(fuel+' burns for exactly '+ticks+' ticks',()=>{
  assert.equal(furnace.FUELS[fuel],ticks);
  const start={input:{id:'sand',count:64},fuel:{id:fuel,count:1}};
  const first=furnace.tick(start,1);
  assert.equal(first.burn,ticks-1);
  assert.equal(first.fuel,null);
  let end=first,remaining=ticks-1;
  while(remaining>0){const step=Math.min(remaining,12000);end=furnace.tick(end,step);remaining-=step;}
  assert.equal(end.burn,0);
  assert.equal(end.output?.count||0,Math.floor(ticks/200));
 });
}
test('short-burning bamboo cannot finish a smelt by itself',()=>{
 const end=furnace.tick({input:{id:'sand',count:1},fuel:{id:'bamboo',count:1}},50);
 assert.equal(end.output,null);
 assert.equal(end.progress,50);
});
test('fuel ids inherited from Object.prototype remain invalid',()=>{
 assert.equal(furnace.insert({},'fuel',{id:'constructor',count:1}).moved,0);
});
