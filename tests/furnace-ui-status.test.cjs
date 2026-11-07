/* Furnace UI status must be read-only, bounded, and save-compatible. */
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../furnace-engine.js'),'utf8'),ctx);
const make=()=>ctx.window.MineWorldFurnace.create();
const p={dimension:'overworld',x:-12,y:-64,z:6};
test('unopened furnace does not materialize on status read',()=>{
 const f=make();assert.equal(f.status(p),null);assert.equal(f.snapshot().length,0);
});
test('UI reports all three slots, fractional cook and burn without advancing',()=>{
 const f=make();f.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:2},fuel:{key:'coal',qty:1},
 output:{key:'iron',qty:1},progress:5,burn:40,burnTotal:80}]);
 const before=JSON.stringify(f.snapshot());
 const s=f.status(p);
 assert.equal(s.kind,'furnace');assert.equal(s.progress,0.5);
 assert.equal(s.burn,0.5);assert.equal(s.cooking,true);
 assert.equal(s.input.qty,2);assert.equal(s.fuel.key,'coal');assert.equal(s.output.key,'iron');
 s.input.qty=999;assert.equal(JSON.stringify(f.snapshot()),before);
});
test('full or mismatched output prevents cooking indicator',()=>{
 const f=make();
 f.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},fuel:{key:'coal',qty:1},
 output:{key:'iron',qty:64},burn:30,burnTotal:80}]);
 assert.equal(f.status(p).cooking,false);
 f.take(p,'output',64);
 assert.equal(f.status(p).cooking,true);
});
test('legacy overstacked boats cannot display as available cooking fuel',()=>{
 const f=make();
 f.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},fuel:{key:'boat',qty:2}}]);
 assert.equal(f.status(p).cooking,false);
});
test('status progress is normalized for blast furnaces',()=>{
 const f=make();f.restore([{...p,kind:'blast',input:{key:'rawIron',qty:1},
 fuel:{key:'coal',qty:1},progress:2.5,burn:10,burnTotal:40}]);
 assert.equal(f.status(p).progress,0.5);assert.equal(f.status(p).burn,0.25);
});
