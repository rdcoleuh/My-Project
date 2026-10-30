/* Player inventory, hotbar and Java slot preservation during deep-world preflight. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','world-depth.js'),'utf8'),ctx);
const plan=ctx.window.MineWorldWorldDepth.planLegacySaveMigration;
const base={version:13,worldSize:8,edits:[],netherEdits:[],endEdits:[]};
const options={width:8,depth:8};
const stack={id:5,key:'rawIron',qty:3,custom:{name:'Iron',tags:['smelt']}};
const sample=()=>({...base,inventory:[0,2,65535],itemStacks:[stack],
 survivalHotbar:[5,null,'rawIron'],javaInventory:{slots:[5,null,null],offhand:null,cursor:null}});
const preview=save=>plan(save,options).playerItems;
test('player counters, stacks, hotbar and Java slots survive as detached immutable previews',()=>{
 const save=sample(),original=JSON.stringify(save),items=preview(save);
 assert.deepEqual(JSON.parse(JSON.stringify(items.inventory)),save.inventory);
 assert.deepEqual(JSON.parse(JSON.stringify(items.itemStacks)),save.itemStacks);
 assert.deepEqual(JSON.parse(JSON.stringify(items.survivalHotbar)),save.survivalHotbar);
 assert.deepEqual(JSON.parse(JSON.stringify(items.javaInventory)),save.javaInventory);
 assert.equal(Object.isFrozen(items),true);
 assert.equal(Object.isFrozen(items.itemStacks[0].custom.tags),true);
 assert.notStrictEqual(items.itemStacks[0].custom,stack.custom);
 assert.equal(JSON.stringify(save),original);
});
test('legacy saves without modern item fields remain previewable',()=>{
 const items=preview(base);
 for(const name of ['inventory','itemStacks','survivalHotbar','javaInventory'])
  assert.equal(items[name],null);
});
test('invalid or accessor-backed aggregate inventory counters are rejected',()=>{
 const getter=[1,2];Object.defineProperty(getter,'0',{enumerable:true,get(){throw Error('executed');}});
 for(const inventory of [[-1],[65536],[1.5],Array(1),getter,Array(2049).fill(0)]){
  assert.throws(()=>preview({...sample(),inventory}),/Invalid saved inventory counters/);
 }
});
test('duplicate, invalid and oversized item stacks fail before save mutation',()=>{
 for(const itemStacks of [
  [{id:5,key:'rawIron',qty:65}],
  [{id:5,key:'rawIron',qty:3},{id:5,key:'coal',qty:1}],
  [{id:5,key:'__proto__',qty:1}],
  [{id:0,key:'rawIron',qty:1}],
  Array(8193).fill(stack)
 ]){
  const save={...sample(),itemStacks},original=JSON.stringify(save);
  assert.throws(()=>preview(save),/Invalid saved item stack/);
  assert.equal(JSON.stringify(save),original);
 }
});
test('dangling hotbar IDs and invalid hotbar arrays cannot be silently normalized',()=>{
 for(const survivalHotbar of [[99],[0],[{}],Array(10).fill(null)]){
  assert.throws(()=>preview({...sample(),survivalHotbar}),/Invalid saved survival hotbar/);
 }
});
test('Java inventory duplicate or missing stack references abort preflight',()=>{
 for(const javaInventory of [
  {slots:[5,5],offhand:null,cursor:null},
  {slots:[99],offhand:null,cursor:null},
  {slots:[5],offhand:5,cursor:null},
  {slots:[5],offhand:null,cursor:-1},
  {slots:Array(8193).fill(null),offhand:null,cursor:null}
 ]){
  assert.throws(()=>preview({...sample(),javaInventory}),/Invalid saved Java inventory/);
 }
});
test('expanded Java slot arrays remain supported without mutable aliases',()=>{
 const slots=Array(160).fill(null);slots[100]=5;
 const save={...sample(),javaInventory:{slots,offhand:null,cursor:null}};
 const items=preview(save);
 assert.equal(items.javaInventory.slots[100],5);
 assert.equal(Object.isFrozen(items.javaInventory.slots),true);
 slots[100]=null;
 assert.equal(items.javaInventory.slots[100],5);
});
