/* Regression: station-specific timing and accessible progress descriptions. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
const engine=ctx.window.MineWorldFurnace;
const ui=ctx.window.MineWorldFurnaceUI;
const position={dimension:'overworld',x:7,y:14,z:8};
test('station help reports actual remaining cook time for furnace and smoker',()=>{
 for(const [kind,duration] of [['furnace',10],['smoker',5]]){
  const f=engine.create();
  f.ensure(position,kind);
  const ingredient=kind==='smoker'?'potato':'rawIron';
  assert.equal(f.insert(position,'input',ingredient,1),1);
  assert.equal(f.insert(position,'fuel','coal',1),1);
  assert.match(ui.furnaceWorkState(f.get(position)),new RegExp('About '+duration+' seconds'));
  f.tick(2);
  assert.match(ui.furnaceWorkState(f.get(position)),new RegExp('About '+(duration-2)+' seconds'));
 }
});
test('progress descriptions distinguish stopped and burning stations',()=>{
 const f=engine.create();f.ensure(position,'furnace');
 f.insert(position,'input','rawIron',1);
 const m=f.get(position);
 assert.match(ui.furnaceProgressDescriptions(m,f.status(position)).cook,/add fuel/i);
 f.insert(position,'fuel','coal',1);
 assert.match(ui.furnaceProgressDescriptions(m,f.status(position)).cook,/Ready to ignite/);
 f.tick(2);
 assert.match(ui.furnaceProgressDescriptions(m,f.status(position)).cook,/8 seconds of cooking remaining/);
 assert.match(ui.furnaceProgressDescriptions(m,f.status(position)).fuel,/seconds of burning fuel remaining/);
 m.output={key:'gold',qty:1};
 assert.match(ui.furnaceProgressDescriptions(m,f.status(position)).cook,/output slot blocked/);
});
