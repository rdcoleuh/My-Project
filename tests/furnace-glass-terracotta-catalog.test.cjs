/* Glass and terracotta must use timed smelting, not instant crafting. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','survival-catalog.js'])vm.runInContext(read(file),ctx);
const api=ctx.window.MineWorldFurnace,recipes=ctx.window.MineWorldCatalog.recipes;
const p={dimension:'overworld',x:-15,y:-32,z:48};
const cases=[{name:'Glass (smelt sand)',input:'block:4',output:'block:9'},
 {name:'Terracotta (fire clay)',input:'block:57',output:'block:25'}];

test('glass and terracotta have only furnace-station catalog recipes',()=>{
 for(const sample of cases){
  const matching=recipes.filter(r=>r.give[sample.output]===1);
  assert.equal(matching.length,1,sample.name+' must have exactly one route');
  assert.equal(matching[0].name,sample.name);
  assert.equal(matching[0].station,'furnace');
  assert.equal(matching[0].cost[sample.input],1);
  assert.equal(matching[0].cost.coal,1,'coal is an example fuel in the guide');
  assert.equal(api.RECIPES[sample.input],sample.output);
 }
 assert.equal(recipes.filter(r=>r.cost['block:47']&&r.give['block:25']).length,0,
   'mud must not turn directly into terracotta');
});
test('both blocks take ten seconds, fuel and three slots in an ordinary furnace',()=>{
 for(const sample of cases){
  const f=api.create();
  assert.equal(f.insert(p,'input',sample.input,2),2);
  assert.equal(f.tick(30).completed,0,'no fuel means no smelting');
  assert.equal(f.insert(p,'fuel','coal',1),1);
  assert.equal(f.tick(9).completed,0);
  assert.equal(f.get(p).output,null);
  assert.equal(f.tick(1).completed,1);
  assert.equal(f.get(p).output.key,sample.output);
  assert.equal(f.get(p).input.qty,1);
  assert.equal(f.take(p,'output',1).key,sample.output);
  assert.equal(f.tick(10).completed,1);
  assert.equal(f.get(p).output.qty,1);
 }
});
test('smokers and blast furnaces cannot cook glass or terracotta',()=>{
 for(const kind of ['smoker','blast'])for(const sample of cases){
  assert.equal(api.canSmelt(kind,sample.input),false);
  const f=api.create();f.ensure(p,kind);
  assert.equal(f.insert(p,'input',sample.input,1),0);
  assert.equal(f.get(p).input,null);
 }
});
test('mid-cook save/restore preserves fuel and progress for both recipes',()=>{
 for(const sample of cases){
  const f=api.create();f.insert(p,'input',sample.input,1);
  f.insert(p,'fuel','coal',1);f.tick(4);
  const saved=JSON.parse(JSON.stringify(f.snapshot()));
  const g=api.create();g.restore(saved);
  assert.equal(g.get(p).progress,4);
  assert.equal(g.tick(6).completed,1);
  assert.equal(g.take(p,'output',1).key,sample.output);
  assert.equal(g.get(p).burn,70);
  assert.equal(saved[0].progress,4,'snapshot is not mutated');
 }
});
test('desktop/mobile Chrome smoke exercises glass and clay with synthetic pack enabled',()=>{
 const smoke=read('scripts/browser-smoke.cjs');
 for(const sample of cases){
  assert.ok(smoke.includes("input:'"+sample.input+"',output:'"+sample.output+"'"));
 }
 assert.ok(smoke.includes("'furnace-'+sample.slug+'-synthetic.png'"));
 assert.ok(smoke.includes('glazeFixture,output:sample.output'));
 // Cache versions advance with unrelated gameplay/HUD updates.
 assert.match(read('sw.js'),/const VERSION='mineworld-6-\\d+-/);
});
