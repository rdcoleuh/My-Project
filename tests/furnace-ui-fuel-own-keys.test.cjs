'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const window={MineWorldFurnace:{
 RECIPES:Object.freeze({sand:'glass'}),
 FUEL:Object.freeze({coal:80}),
 KINDS:{furnace:{cook:10}},
 canSmelt:(kind,key)=>kind==='furnace'&&key==='sand'
}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../furnace-ui.js'),'utf8'),{window});
const describe=window.MineWorldFurnaceUI.furnaceWorkState;
const machine=fuel=>({kind:'furnace',input:{key:'sand',qty:1},fuel:{key:fuel,qty:1},output:null,burn:0,progress:0});
test('inherited object property is not usable furnace fuel',()=>{
 for(const name of ['constructor','toString','__proto__','hasOwnProperty']){
  assert.equal(describe(machine(name)),'Add usable fuel to begin or resume smelting.');
 }
});
test('registered fuel permits normal smelting status',()=>{
 assert.match(describe(machine('coal')),/Smelting glass/);
});
test('missing fuel produces the same accessible prompt',()=>{
 assert.equal(describe({...machine('coal'),fuel:null}),'Add usable fuel to begin or resume smelting.');
});
