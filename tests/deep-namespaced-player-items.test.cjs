/* Deep-world preflight must preserve strict custom player-owned item IDs. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
for(const file of ['world-depth.js','furnace-engine.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);
const plan=ctx.window.MineWorldWorldDepth.planLegacySaveMigration;
const furnace=ctx.window.MineWorldFurnace.create;
const base={version:13,worldSize:8,edits:[],netherEdits:[],endEdits:[]};
const options={width:8,depth:8};
const sample=key=>({...base,
 itemStacks:[{id:17,key,qty:3,custom:{display:'Player item',tags:['owned']}}],
 survivalHotbar:[17,key],
 javaInventory:{slots:[17],offhand:null,cursor:null}});
const plain=value=>JSON.parse(JSON.stringify(value));

test('namespaced player stacks, hotbar keys and Java slot references survive preflight',()=>{
 const save=sample('modded:ore/raw_cobalt'),before=plain(save);
 const items=plan(save,options).playerItems;
 assert.deepEqual(plain(items.itemStacks),save.itemStacks);
 assert.deepEqual(plain(items.survivalHotbar),save.survivalHotbar);
 assert.deepEqual(plain(items.javaInventory),save.javaInventory);
 assert.equal(Object.isFrozen(items.itemStacks[0].custom.tags),true);
 assert.notStrictEqual(items.itemStacks[0].custom,save.itemStacks[0].custom);
 assert.deepEqual(save,before,'preflight must never rewrite the source save');
});

test('different namespace and path segments retain their exact identity',()=>{
 for(const key of ['other.mod:ingots/cobalt','pack-v2:tools/iron_hammer','a:b']){
  const items=plan(sample(key),options).playerItems;
  assert.equal(items.itemStacks[0].key,key);
  assert.equal(items.survivalHotbar[1],key);
 }
});

test('namespaced player IDs use the same 192-character bound as furnace saves',()=>{
 const accepted='mod:'+'a'.repeat(188);
 assert.equal(plan(sample(accepted),options).playerItems.itemStacks[0].key,accepted);
 const rejected='mod:'+'a'.repeat(189);
 assert.throws(()=>plan(sample(rejected),options),/Invalid saved item stack/);
});

test('invalid namespace syntax and prototype keys still abort migration',()=>{
 for(const key of ['block:0','block:01','mod:','mod:/ore','mod:../ore',
   'mod:ore//piece','bad!mod:ore','mod:ore?x','constructor',
   '__proto__','mod:ore/','Mod:ore','mod:UPPER']){
  const save=sample(key),before=plain(save);
  assert.throws(()=>plan(save,options),/Invalid saved item stack/,key);
  assert.deepEqual(save,before,'rejected preview must leave original untouched');
 }
});

test('invalid custom keys in direct hotbar assignments are rejected',()=>{
 const save={...sample('mod:ore'),survivalHotbar:[17,'mod:ore//broken']};
 assert.throws(()=>plan(save,options),/Invalid saved survival hotbar/);
});

test('furnace and player preflight preserve the same namespaced inventory key',()=>{
 const key='modded:ore/raw_cobalt',save=sample(key);
 save.furnaces=[{dimension:'overworld',x:2,y:14,z:3,
   input:{key,qty:1},fuel:null,output:null,burn:0,burnTotal:0,progress:0}];
 const preview=plan(save,options);
 assert.equal(preview.playerItems.itemStacks[0].key,key);
 assert.equal(preview.furnaces[0].input.key,key);
 const f=furnace();f.restore(save.furnaces);
 assert.equal(f.get({dimension:'overworld',x:2,y:14,z:3}).input.key,key);
});
