/* Deep-world migration must preserve player-owned drops and respawn points. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','world-depth.js'),'utf8'),ctx);
const plan=ctx.window.MineWorldWorldDepth.planLegacySaveMigration;
const make=extra=>({version:13,worldSize:10000,edits:[],...extra});
const json=value=>JSON.parse(JSON.stringify(value));

test('migration preview preserves dropped items, momentum, pickup delay and respawn',()=>{
 const saved=make({bedSpawn:{x:5000,y:15,z:5000},droppedItems:[
  {key:'block:15',count:8,x:5000.5,y:16.2,z:5001.5,
   vx:.3,vy:1.2,vz:-.1,age:5,delay:.35,dimension:'overworld'},
  {key:'rawIron',count:2,x:4000.2,y:7.5,z:4001.4,
   vx:0,vy:0,vz:0,age:0,delay:0,dimension:'nether'}
 ]});
 const before=JSON.stringify(saved),preview=plan(saved);
 assert.equal(preview.status,'preview-only');
 assert.deepEqual(json(preview.bedSpawn),saved.bedSpawn);
 assert.deepEqual(json(preview.droppedItems),saved.droppedItems);
 assert.ok(Object.isFrozen(preview.droppedItems));
 assert.ok(Object.isFrozen(preview.droppedItems[0]));
 assert.equal(JSON.stringify(saved),before,'migration must not mutate the source save');
});

test('malformed second drop rejects the entire migration instead of losing its stack',()=>{
 const good={key:'coal',count:1,x:5000.5,y:14,z:5000.5,dimension:'overworld'};
 for(const bad of [
  {...good,x:10000}, {...good,y:-64}, {...good,count:65},
  {...good,key:'__proto__'}, {...good,dimension:'unknown'},
  {...good,vx:Infinity}, {...good,age:-1}
 ]){
  const saved=make({droppedItems:[good,bad]});
  const before=json(saved);
  assert.throws(()=>plan(saved),/Invalid saved dropped-item/);
  assert.deepEqual(saved,before,'failure cannot rewrite or truncate the saved drops');
 }
});

test('bed respawn validation rejects coordinates the legacy loader would discard',()=>{
 const valid={x:5000,y:1,z:5000};
 assert.deepEqual(json(plan(make({bedSpawn:valid})).bedSpawn),valid);
 for(const bedSpawn of [{...valid,y:46},{...valid,x:1},{...valid,z:10000},
                        {...valid,y:-1},{...valid,y:1.5}]){
  assert.throws(()=>plan(make({bedSpawn})),/Invalid saved bed respawn/);
 }
 assert.equal(plan(make({})).bedSpawn,null,'older saves may lack a bed');
});

test('missing drop arrays are compatible; non-arrays and overflow are rejected',()=>{
 assert.deepEqual(json(plan(make({})).droppedItems),[]);
 for(const droppedItems of [{},'not-an-array',Array.from({length:81},()=>({
   key:'coal',count:1,x:5000.5,y:14,z:5000.5,dimension:'overworld'
 }))])assert.throws(()=>plan(make({droppedItems})),/Invalid saved dropped-item collection/);
});
