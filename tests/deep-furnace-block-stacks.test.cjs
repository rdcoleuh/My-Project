/* Migration preflight must preserve real block stacks in all furnace slots. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','world-depth.js'),'utf8'),ctx);
const plan=ctx.window.MineWorldWorldDepth.planLegacySaveMigration;
const copy=value=>JSON.parse(JSON.stringify(value));
const base={version:13,worldSize:8,dimension:'overworld',
 edits:[],netherEdits:[],endEdits:[]};
const furnace={dimension:'overworld',x:2,y:17,z:3,
 input:{key:'block:40',qty:2},fuel:{key:'block:116',qty:1},
 output:{key:'block:9',qty:3},burn:0,burnTotal:0,progress:0};
test('legacy furnace migration accepts placeable blocks in all three slots',()=>{
 const save={...base,furnaces:[copy(furnace)]},before=JSON.stringify(save);
 const result=plan(save,{width:8,depth:8});
 assert.deepEqual(copy(result.furnaces[0]),furnace);
 assert.equal(Object.isFrozen(result.furnaces[0]),true);
 for(const slot of ['input','fuel','output']){
  assert.equal(Object.isFrozen(result.furnaces[0][slot]),true);
  assert.notStrictEqual(result.furnaces[0][slot],save.furnaces[0][slot]);
 }
 assert.equal(JSON.stringify(save),before,'preview cannot mutate the saved furnace');
});
test('all supported block-key lengths round-trip without changing absolute Y',()=>{
 for(const key of ['block:1','block:9','block:40','block:116','block:169','block:999']){
  const record={...furnace,input:{key,qty:64},y:47};
  const result=plan({...base,furnaces:[record]},{width:8,depth:8});
  assert.equal(result.furnaces[0].input.key,key);
  assert.equal(result.furnaces[0].input.qty,64);
  assert.equal(result.furnaces[0].y,47);
 }
});
test('malformed block keys remain rejected atomically',()=>{
 for(const key of ['block:0','block:01','block:1000','block:12a','block:1\\d','block:','__proto__']){
  const save={...base,furnaces:[{...furnace,fuel:{key,qty:1}}]};
  const before=JSON.stringify(save);
  assert.throws(()=>plan(save,{width:8,depth:8}),/Invalid saved furnace fuel stack/,key);
  assert.equal(JSON.stringify(save),before,key);
 }
});
test('mixed ordinary and block items survive the furnace migration preview',()=>{
 const save={...base,furnaces:[{...furnace,
  input:{key:'rawIron',qty:4},fuel:{key:'block:11',qty:5},
  output:{key:'futureIngot',qty:2},burn:0,burnTotal:0,progress:3}]};
 const result=plan(save,{width:8,depth:8});
 assert.deepEqual(copy(result.furnaces[0]),save.furnaces[0]);
});
