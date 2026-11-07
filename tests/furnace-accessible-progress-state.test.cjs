/* Accessible furnace progress regression: no false ETA when stalled. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','furnace-ui.js'),'utf8');
const context={window:{MineWorldFurnace:{KINDS:{furnace:{cook:10},smoker:{cook:5},blast:{cook:5}},RECIPES:{}}}};
vm.runInNewContext(source,context);
const describe=context.window.MineWorldFurnaceUI.furnaceProgressDescriptions;
test('stalled machine never announces an inaccurate ETA',()=>{
 for(const [reason,phrase] of [['no_input','input slot empty'],['no_recipe','unsupported ingredient'],['output_blocked','output slot blocked'],['invalid_fuel_stack','invalid nonstackable'],['invalid_fuel','unsupported fuel'],['no_fuel','add fuel']]){
  const result=describe({kind:'furnace',burn:0,progress:8},{idleReason:reason});
  assert.match(result.cook,new RegExp(phrase));assert.doesNotMatch(result.cook,/seconds of cooking remaining/);
 }
});
test('actively cooking stations use their individual cook duration',()=>{
 assert.equal(describe({kind:'smoker',burn:3.2,progress:2},{}).cook,'3 seconds of cooking remaining');
 assert.equal(describe({kind:'furnace',burn:7.1,progress:2},{}).cook,'8 seconds of cooking remaining');
 assert.equal(describe({kind:'blast',burn:0,progress:2},{}).cook,'Smelting stopped: fuel is not burning');
 assert.equal(describe({kind:'furnace',burn:3.2,progress:2},{}).fuel,'4 seconds of burning fuel remaining');
});
