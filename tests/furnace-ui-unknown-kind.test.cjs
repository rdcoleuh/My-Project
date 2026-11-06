const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../furnace-ui.js'),'utf8');
const window={MineWorldFurnace:{KINDS:{furnace:{cook:10}},RECIPES:{sand:'glass'},FUEL:{coal:80},canSmelt:()=>true}};
vm.runInNewContext(source,{window,console});
const work=window.MineWorldFurnaceUI.furnaceWorkState;
test('unknown furnace kind returns recovery guidance without throwing',()=>{
 const state={kind:'constructor',input:{key:'sand',qty:1},fuel:{key:'coal',qty:1},burn:10,progress:2};
 assert.match(work(state),/Unknown furnace type/);
});
test('valid furnace kind retains progress guidance',()=>{
 const state={kind:'furnace',input:{key:'sand',qty:1},fuel:{key:'coal',qty:1},burn:10,progress:2};
 assert.match(work(state),/Smelting glass/);
});
