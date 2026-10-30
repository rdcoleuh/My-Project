'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','world-depth.js'),'utf8'),ctx);
const plan=ctx.window.MineWorldWorldDepth.planLegacySaveMigration;
const base={version:13,worldSize:8,dimension:'overworld',edits:[],netherEdits:[],endEdits:[]};
const opts={width:8,depth:8};
const furnace={dimension:'overworld',x:2,y:17,z:3,
 input:{key:'rawIron',qty:3},fuel:{key:'coal',qty:2},output:{key:'iron',qty:1},
 burn:20,burnTotal:80,progress:4.5};
const copy=value=>JSON.parse(JSON.stringify(value));
test('migration preview preserves and detaches furnace inventories and fractional timers',()=>{
 const original=copy(furnace),save={...base,furnaces:[furnace]};
 const result=plan(save,opts);
 assert.equal(result.status,'preview-only');
 assert.deepEqual(copy(result.furnaces),[original]);
 assert.notStrictEqual(result.furnaces[0],furnace);
 assert.notStrictEqual(result.furnaces[0].input,furnace.input);
 assert.equal(Object.isFrozen(result.furnaces[0]),true);
 assert.equal(Object.isFrozen(result.furnaces[0].input),true);
 assert.deepEqual(furnace,original,'preview never modifies the saved furnace');
 assert.equal(result.edits.length,0,'no block edits are manufactured');
});
test('legacy saves without furnaces remain previewable',()=>{
 assert.deepEqual(copy(plan(base,opts).furnaces),[]);
});
test('migration preflight rejects duplicate positions rather than dropping inventory',()=>{
 assert.throws(()=>plan({...base,furnaces:[furnace,copy(furnace)]},opts),/Duplicate saved furnace/);
 assert.doesNotThrow(()=>plan({...base,furnaces:[
  furnace,{...copy(furnace),dimension:'nether'},
  {...copy(furnace),dimension:'end'}]},opts));
});
test('migration rejects out-of-range and fractional furnace coordinates in all dimensions',()=>{
 for(const record of [
  {...furnace,y:-64},{...furnace,y:48},{...furnace,x:8},
  {...furnace,z:-1},{...furnace,x:1.5},{...furnace,dimension:'other'}
 ])assert.throws(()=>plan({...base,furnaces:[record]},opts),/Invalid saved furnace/);
});
test('malformed or oversized stacks cannot silently disappear during migration',()=>{
 for(const stack of [{key:'rawIron',qty:0},{key:'rawIron',qty:65},
  {key:'__proto__',qty:1},{key:'block:0',qty:1},{key:'rawIron',qty:1.5}]){
  assert.throws(()=>plan({...base,furnaces:[{...furnace,input:stack}]},opts),/Invalid saved furnace/);
 }
 const future={...furnace,input:{key:'futureModdedItem',qty:4}};
 assert.equal(plan({...base,furnaces:[future]},opts).furnaces[0].input.key,'futureModdedItem',
  'unknown but well-formed items must remain recoverable');
});
test('invalid burn and progress timers abort migration before data is lost',()=>{
 for(const bad of [
  {...furnace,burn:81},{...furnace,burn:-1},{...furnace,burnTotal:Infinity},
  {...furnace,progress:10},{...furnace,progress:-1},
  {...furnace,input:null,progress:4}
 ])assert.throws(()=>plan({...base,furnaces:[bad]},opts),/Invalid saved furnace/);
});
test('migration preflight does not switch the playable world height or rewrite saves',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 assert.match(html,/\bH=48\b/);
 assert.match(html,/SEA=14/);
 assert.match(html,/verticalProfile:window\.MineWorldWorldDepth\.LEGACY_PROFILE/);
});

test('specialized furnace kind and five-second progress survive deep-world preview',()=>{
 for(const kind of ['smoker','blast']){
  const record={...furnace,kind,progress:4.75};
  const original=copy(record);
  const preview=plan({...base,furnaces:[record]},opts).furnaces[0];
  assert.deepEqual(copy(preview),original);
  assert.equal(Object.isFrozen(preview),true);
  assert.deepEqual(record,original,'preflight never mutates specialized stations');
 }
});
test('invalid station kinds and overlong specialized progress fail without item loss',()=>{
 for(const record of [
  {...furnace,kind:'unknown'},
  {...furnace,kind:'smoker',progress:5},
  {...furnace,kind:'blast',progress:8}
 ])assert.throws(()=>plan({...base,furnaces:[record]},opts),/Invalid saved furnace/);
 assert.equal(plan({...base,furnaces:[furnace]},opts).furnaces[0].kind,undefined,
  'untagged legacy furnace records remain unchanged');
});
