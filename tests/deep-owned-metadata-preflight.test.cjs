/* Migration previews must never alias nested player-owned save metadata. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','world-depth.js'),'utf8'),ctx);
const plan=ctx.window.MineWorldWorldDepth.planLegacySaveMigration;
const base={version:13,worldSize:8,dimension:'overworld',edits:[],netherEdits:[],endEdits:[]};
const options={width:8,depth:8};
const vehicle={id:1,kind:'boat',dimension:'overworld',x:4,y:14,z:4};
const dropped={key:'coal',count:2,dimension:'overworld',x:4,y:14,z:4};
const preview=save=>plan({...base,...save},options);

test('nested vehicle metadata is recursively detached and immutable',()=>{
 const source={...vehicle,custom:{name:'Boat',colors:['blue',{trim:'white'}]}};
 const result=preview({vehicles:[source]}).vehicles[0];
 assert.deepEqual(JSON.parse(JSON.stringify(result)),source);
 assert.notStrictEqual(result.custom,source.custom);
 assert.notStrictEqual(result.custom.colors,source.custom.colors);
 assert.equal(Object.isFrozen(result.custom),true);
 assert.equal(Object.isFrozen(result.custom.colors),true);
 assert.equal(Object.isFrozen(result.custom.colors[1]),true);
 source.custom.colors[1].trim='black';
 assert.equal(result.custom.colors[1].trim,'white');
 assert.throws(()=>{result.custom.colors[1].trim='red';},TypeError);
});
test('dropped-item metadata is also detached from the original save',()=>{
 const source={...dropped,custom:{history:[{tick:3}]}};
 const result=preview({droppedItems:[source]}).droppedItems[0];
 source.custom.history[0].tick=100;
 assert.equal(result.custom.history[0].tick,3);
 assert.equal(Object.isFrozen(result.custom.history[0]),true);
});
test('cyclic, accessor and non-JSON metadata fail preflight without changing saves',()=>{
 const cycle={};cycle.self=cycle;
 const accessor={};Object.defineProperty(accessor,'bad',{enumerable:true,get(){throw Error('getter executed');}});
 for(const bad of [cycle,accessor,{value:Infinity},{value:undefined},{value:()=>0},{value:new Date()}]){
  const source={...vehicle,custom:bad};
  assert.throws(()=>preview({vehicles:[source]}),/Invalid saved vehicle metadata/);
  assert.strictEqual(source.custom,bad);
 }
});
test('numeric array accessors cannot execute during migration preflight',()=>{
 const custom=[1,2];
 Object.defineProperty(custom,'0',{enumerable:true,configurable:true,get(){throw Error('unexpected array getter');}});
 assert.throws(()=>preview({vehicles:[{...vehicle,custom}]}),/Invalid saved vehicle metadata/);
});
test('oversized or excessively deep entity metadata is rejected within a bounded budget',()=>{
 const deep={};let node=deep;
 for(let i=0;i<12;i++){node.child={};node=node.child;}
 for(const bad of [deep,Array.from({length:129},(_,i)=>i)]){
  assert.throws(()=>preview({vehicles:[{...vehicle,custom:bad}]}),/Invalid saved vehicle metadata/);
 }
});
