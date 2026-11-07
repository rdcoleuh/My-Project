/* Ready-to-ignite accessibility regression for furnace UI. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','furnace-ui.js'),'utf8');
const context={window:{MineWorldFurnace:{KINDS:{furnace:{cook:10},smoker:{cook:5},blast:{cook:5}},RECIPES:{}}}};
vm.runInNewContext(source,context);
const describe=context.window.MineWorldFurnaceUI.furnaceProgressDescriptions;
test('ready-to-ignite furnace is not announced as missing burning fuel',()=>{
 const state={kind:'furnace',burn:0,progress:0};
 const result=describe(state,{readyToSmelt:true,idleReason:null});
 assert.match(result.cook,/Ready to ignite/);
 assert.doesNotMatch(result.cook,/Smelting stopped/);
 assert.match(result.fuel,/Fuel is not burning/);
});
test('unfueled furnace remains stopped',()=>{
 const result=describe({kind:'furnace',burn:0,progress:2},{readyToSmelt:false,idleReason:'no_fuel'});
 assert.match(result.cook,/add fuel/);
});
test('actively burning furnace retains countdown',()=>{
 const result=describe({kind:'smoker',burn:4,progress:2},{readyToSmelt:true,idleReason:null});
 assert.equal(result.cook,'3 seconds of cooking remaining');
});
