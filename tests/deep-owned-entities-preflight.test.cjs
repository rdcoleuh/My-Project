/* Deep-world migration preflight for player-owned vehicles and animals. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','world-depth.js'),'utf8'),ctx);
const plan=ctx.window.MineWorldWorldDepth.planLegacySaveMigration;
const base={version:13,worldSize:8,dimension:'overworld',edits:[],netherEdits:[],endEdits:[]};
const opts={width:8,depth:8};
const vehicle={id:7,kind:'cherryBoat',x:4.5,y:18,z:4.5,dimension:'overworld'};
const mount={kind:'horse',x:4,y:18,z:4,dimension:'nether',tamed:true,saddled:true};
const animal={kind:'sheep',x:3,y:18,z:3,hp:8,heading:.4,baby:false,growTimer:17,sheared:true,breedCooldown:25};
const copy=x=>JSON.parse(JSON.stringify(x));
test('owned entities survive migration preflight detached with absolute Y',()=>{
 const save={...base,vehicles:[copy(vehicle)],tamedMounts:[copy(mount)],farmAnimals:[copy(animal)]};
 const before=JSON.stringify(save),result=plan(save,opts);
 for(const [name,original] of [['vehicles',vehicle],['tamedMounts',mount],['farmAnimals',animal]]){
  assert.deepEqual(copy(result[name]),[original]);
  assert.notStrictEqual(result[name][0],save[name][0]);
  assert.equal(Object.isFrozen(result[name][0]),true);
  assert.equal(Object.isFrozen(result[name]),true);
 }
 assert.equal(JSON.stringify(save),before,'preview must not rewrite save');
 assert.equal(result.status,'preview-only');
});
test('legacy saves without entity collections remain compatible',()=>{
 const result=plan(base,opts);
 for(const key of ['vehicles','tamedMounts','farmAnimals'])
  assert.deepEqual(copy(result[key]),[]);
});
test('duplicate IDs and invalid vehicle coordinates or types abort migration',()=>{
 for(const records of [
  [vehicle,copy(vehicle)],[{...vehicle,id:0}],[{...vehicle,id:1.5}],
  [{...vehicle,kind:'unknown'}],[{...vehicle,dimension:'moon'}],
  [{...vehicle,y:-1}],[{...vehicle,y:48}],[{...vehicle,x:8}],
  Array.from({length:81},(_,i)=>({...vehicle,id:i+1}))
 ])assert.throws(()=>plan({...base,vehicles:records},opts),/Invalid saved vehicle/);
});
test('invalid mount kinds, dimensions, coordinates and counts are rejected',()=>{
 for(const records of [
  [{...mount,kind:'cow'}],[{...mount,dimension:'moon'}],
  [{...mount,y:48}],[{...mount,z:-1}],[{...mount,tamed:'yes'}],
  Array.from({length:61},()=>copy(mount))
 ])assert.throws(()=>plan({...base,tamedMounts:records},opts),/Invalid saved tamed mount/);
});
test('farm animals retain breeding state and reject records legacy load would discard',()=>{
 const result=plan({...base,farmAnimals:[animal]},opts);
 assert.deepEqual(copy(result.farmAnimals[0]),animal);
 for(const records of [
  [{...animal,kind:'creeper'}],[{...animal,hp:0}],
  [{...animal,x:2}],[{...animal,y:46}],
  [{...animal,growTimer:-1}],[{...animal,breedCooldown:Infinity}],
  Array.from({length:25},()=>copy(animal))
 ])assert.throws(()=>plan({...base,farmAnimals:records},opts),/Invalid saved farm animal/);
});
test('one malformed entity rejects whole plan without modifying any other record',()=>{
 const save={...base,vehicles:[copy(vehicle)],tamedMounts:[copy(mount)],
  farmAnimals:[copy(animal),{...animal,hp:-2}],furnaces:[]};
 const before=JSON.stringify(save);
 assert.throws(()=>plan(save,opts),/Invalid saved farm animal/);
 assert.equal(JSON.stringify(save),before);
});
