/* Regression: legacy nonstackable fuel stacks remain withdrawable in the live furnace engine. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../furnace-engine.js'),'utf8');
const context={window:{}};
vm.runInNewContext(source,context,{filename:'furnace-engine.js'});
const engine=context.window.MineWorldFurnace;
const p={dimension:'overworld',x:7,y:12,z:9};
for(const fuel of ['lavaBucket','boat','spruceBoat','cherryBoat','raft']){
 test('legacy stacked '+fuel+' cannot ignite or disappear',()=>{
  const f=engine.create();
  f.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:2},fuel:{key:fuel,qty:2},burn:0,burnTotal:0,progress:4}]);
  const result=f.tick(20);
  assert.equal(result.completed,0);
  assert.equal(f.get(p).burn,0);
  assert.equal(f.get(p).fuel.qty,2);
  assert.equal(f.take(p,'fuel',64).qty,2);
 });
 test('single '+fuel+' still ignites',()=>{
  const f=engine.create();
  f.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},fuel:{key:fuel,qty:1}}]);
  assert.equal(f.tick(10).completed,1);
  assert.equal(f.get(p).output.key,'iron');
 });
}
test('stackable coal continues to ignite',()=>{
 const f=engine.create();
 f.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},fuel:{key:'coal',qty:2}}]);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).fuel.qty,1);
});
