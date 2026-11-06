const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const window={MineWorldFurnace:{
 RECIPES:{sand:'glass'},FUEL:{coal:1600},
 KINDS:{furnace:{cook:10}},
 canSmelt(_kind,key){return Object.prototype.hasOwnProperty.call(this.RECIPES,key);}
}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../furnace-ui.js'),'utf8'),{window});
const status=window.MineWorldFurnaceUI.furnaceWorkState;
test('inherited recipe names are rejected in furnace status',()=>{
 for(const key of ['constructor','toString','__proto__']){
  assert.equal(status({kind:'furnace',input:{key},burn:0,progress:0}), 'This ingredient cannot be smelted here. Take the input to change it.');
 }
});
test('real recipe still reports missing fuel',()=>{
 assert.equal(status({kind:'furnace',input:{key:'sand'},burn:0,progress:0,fuel:null}), 'Add usable fuel to begin or resume smelting.');
});
