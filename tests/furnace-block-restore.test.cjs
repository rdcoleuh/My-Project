'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),context);
const position={dimension:'overworld',x:3,y:14,z:5};
test('saved numeric block keys survive furnace restore and can be withdrawn',()=>{
 const furnace=context.window.MineWorldFurnace.create();
 furnace.restore([{...position,input:{key:'block:18',qty:2},fuel:{key:'block:15',qty:1},output:{key:'block:9',qty:3}}]);
 const state=furnace.get(position);
 assert.equal(state.input?.key,'block:18');
 assert.equal(state.fuel?.key,'block:15');
 assert.equal(state.output?.key,'block:9');
 assert.equal(furnace.take(position,'output',3)?.qty,3);
 assert.equal(furnace.tick(10).completed,1);
 assert.equal(furnace.get(position).output?.key,'coal');
});
test('malformed block identifiers remain rejected on restore',()=>{
 const furnace=context.window.MineWorldFurnace.create();
 for(const item of ['block:0','block:-1','block:1x','block:1000','block:__proto__']){
  furnace.restore([{...position,input:{key:item,qty:1}}]);
  assert.equal(furnace.get(position).input,null,item);
 }
});
