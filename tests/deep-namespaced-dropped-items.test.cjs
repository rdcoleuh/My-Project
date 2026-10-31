/* Preserve player-owned namespaced dropped loot in deep-world preflight. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','world-depth.js'),'utf8'),ctx);
const plan=ctx.window.MineWorldWorldDepth.planLegacySaveMigration;
const base=extra=>({version:13,worldSize:10000,edits:[],...extra});
const drop=(key,dimension='overworld')=>({key,count:2,x:5000.5,y:14,z:5000.5,dimension,
  metadata:{owner:'player',components:[{quality:3}]}});
const json=value=>JSON.parse(JSON.stringify(value));
test('namespaced dropped items survive preflight in all dimensions',()=>{
 const drops=['modded:ore/raw_cobalt','my_pack:tools/steel_axe','custom:blocks/blue'].map(
  (key,i)=>drop(key,['overworld','nether','end'][i]));
 const save=base({droppedItems:drops}),before=JSON.stringify(save);
 const preview=plan(save);
 assert.deepEqual(json(preview.droppedItems),drops);
 assert.equal(JSON.stringify(save),before);
 assert.ok(Object.isFrozen(preview.droppedItems[0].metadata.components[0]));
});
test('dropped custom metadata is detached from source save',()=>{
 const save=base({droppedItems:[drop('modded:ore/raw_cobalt')]});
 const preview=plan(save);
 save.droppedItems[0].metadata.components[0].quality=99;
 assert.equal(preview.droppedItems[0].metadata.components[0].quality,3);
});
test('bounded namespaced syntax is enforced without silent loss',()=>{
 for(const key of ['a:b','a:'+'x'.repeat(190)])
  assert.equal(plan(base({droppedItems:[drop(key)]})).droppedItems[0].key,key);
 for(const key of ['a:'+'x'.repeat(191),'modded:','Modded:ore',
  'modded:bad//path','modded:/ore','modded:UPPER','block:1000',
  '__proto__','constructor','modded:ore/../bad'])
  assert.throws(()=>plan(base({droppedItems:[drop(key)]})),/Invalid saved dropped-item/,key);
});
test('one malformed custom drop aborts preview without touching other loot',()=>{
 const save=base({droppedItems:[drop('modded:ore/raw_cobalt'),drop('modded:BAD')]}),
  before=JSON.stringify(save);
 assert.throws(()=>plan(save),/Invalid saved dropped-item/);
 assert.equal(JSON.stringify(save),before);
});
test('same custom identifier is preserved in drops, furnace and inventory',()=>{
 const key='modded:ore/raw_cobalt';
 const save=base({droppedItems:[drop(key)],itemStacks:[{id:1,key,qty:1}],
  survivalHotbar:[1,null,null,null,null,null,null,null,null],
  furnaces:[{dimension:'overworld',x:5001,y:14,z:5001,
    input:{key,qty:3},fuel:null,output:null,burn:0,burnTotal:0,progress:0}]});
 const preview=plan(save);
 assert.equal(preview.droppedItems[0].key,key);
 assert.equal(preview.playerItems.itemStacks[0].key,key);
 assert.equal(preview.furnaces[0].input.key,key);
});
