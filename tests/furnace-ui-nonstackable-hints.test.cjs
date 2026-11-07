/* Furnace hints must agree with the engine on legacy nonstackable fuels. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const context={window:{}};
for(const name of ['furnace-engine.js','furnace-ui.js'])
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',name),'utf8'),context);
const api=context.window.MineWorldFurnace;
const hint=context.window.MineWorldFurnaceUI.furnaceWorkState;
const p={dimension:'overworld',x:-4,y:-64,z:7};
for(const fuel of ['lavaBucket','boat','spruceBoat','cherryBoat','raft']){
 test('legacy '+fuel+' stack blocks ignition and reports withdrawal',()=>{
  const engine=api.create();
  engine.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},fuel:{key:fuel,qty:2}}]);
  const machine=engine.get(p);
  assert.equal(engine.status(p).idleReason,'invalid_fuel_stack');
  assert.match(hint(machine),/Take excess nonstackable fuel/);
  assert.equal(engine.tick(20).completed,0);
  assert.equal(engine.get(p).fuel.qty,2);
 });
}
test('single boat ignites normally',()=>{
 const engine=api.create();
 engine.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},fuel:{key:'boat',qty:1}}]);
 assert.match(hint(engine.get(p)),/Smelting iron/);
 assert.equal(engine.tick(10).completed,1);
});
test('legacy overstacked boat does not block already burning fuel',()=>{
 const engine=api.create();
 engine.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},fuel:{key:'boat',qty:2},burn:10,burnTotal:60}]);
 assert.match(hint(engine.get(p)),/Smelting iron/);
});

test('unknown saved fuel is explained without consuming it',()=>{
 const engine=api.create();
 engine.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},fuel:{key:'oldCustomFuel',qty:3}}]);
 assert.match(hint(engine.get(p)),/Unknown fuel item.*Take it/);
 assert.equal(engine.tick(20).completed,0);
 assert.equal(engine.get(p).fuel.qty,3);
});
test('empty fuel retains actionable add-fuel guidance',()=>{
 const engine=api.create();
 engine.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1}}]);
 assert.match(hint(engine.get(p)),/Add usable fuel/);
});
