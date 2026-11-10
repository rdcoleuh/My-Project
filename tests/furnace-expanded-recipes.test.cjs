'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const furnace=require('../furnace-core.js');
for(const [input,output] of Object.entries({deepslate_iron_ore:'iron_ingot',deepslate_gold_ore:'gold_ingot',copper_ore:'copper_ingot',deepslate_copper_ore:'copper_ingot',raw_copper:'copper_ingot',ancient_debris:'netherite_scrap'})){
 test('smelts '+input+' into '+output,()=>{
  const result=furnace.tick({input:{id:input,count:1},fuel:{id:'coal',count:1}},200);
  assert.deepEqual(result.output,{id:output,count:1});
  assert.equal(result.input,null);
 });
}
test('dried kelp block provides 4000 burn ticks',()=>{
 const result=furnace.tick({input:{id:'sand',count:1},fuel:{id:'dried_kelp_block',count:1}},1);
 assert.equal(result.burn,3999);
 assert.equal(result.progress,1);
});
