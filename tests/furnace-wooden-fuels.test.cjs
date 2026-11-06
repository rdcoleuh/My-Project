const test=require('node:test');
const assert=require('node:assert/strict');
const furnace=require('../furnace-core.js');
const cases={wooden_slab:150,crafting_table:300,chest:300,ladder:300,bookshelf:300,wooden_pressure_plate:300,wooden_button:100};
for(const [fuel,duration] of Object.entries(cases)){
 test(fuel+' is registered with the expected duration',()=>{
  assert.equal(furnace.FUELS[fuel],duration);
  const initial={input:{id:'sand',count:1},fuel:{id:fuel,count:1}};
  const after=furnace.tick(initial,1);
  assert.equal(after.burnTotal,duration);
  assert.equal(after.burn,duration-1);
  assert.equal(after.fuel,null);
 });
}
test('short wooden button fuel cannot finish a full smelt by itself',()=>{
 const after=furnace.tick({input:{id:'sand',count:1},fuel:{id:'wooden_button',count:1}},100);
 assert.equal(after.output,null);
 assert.equal(after.input.count,1);
 assert.equal(after.burn,0);
});
test('crafting table fuel can smelt one item',()=>{
 const after=furnace.tick({input:{id:'sand',count:1},fuel:{id:'crafting_table',count:1}},200);
 assert.deepEqual(after.output,{id:'glass',count:1});
});
