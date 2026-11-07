/* Furnace idle reasons for accessible three-slot UI and legacy saves. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../furnace-engine.js'),'utf8'),ctx);
const position={dimension:'overworld',x:-5,y:-64,z:2};
const make=(record)=>{const engine=ctx.window.MineWorldFurnace.create();engine.restore([{...position,kind:'furnace',...record}]);return engine;};
test('empty input is different from unknown ingredient',()=>{
 assert.equal(make({fuel:{key:'coal',qty:1}}).status(position).idleReason,'no_input');
 assert.equal(make({input:{key:'custom:ore',qty:1},fuel:{key:'coal',qty:1}}).status(position).idleReason,'no_recipe');
});
test('unknown saved fuel is withdrawable but reported invalid',()=>{
 const f=make({input:{key:'rawIron',qty:1},fuel:{key:'custom:power',qty:3}});
 const before=JSON.stringify(f.snapshot());
 assert.equal(f.status(position).idleReason,'invalid_fuel');
 assert.equal(f.status(position).cooking,false);
 assert.equal(JSON.stringify(f.snapshot()),before);
 assert.equal(f.take(position,'fuel',3).key,'custom:power');
 assert.equal(f.status(position).idleReason,'no_fuel');
});
test('already burning station continues despite unknown next fuel',()=>{
 const f=make({input:{key:'rawIron',qty:1},fuel:{key:'custom:power',qty:1},burn:5,burnTotal:80});
 assert.equal(f.status(position).idleReason,null);
 assert.equal(f.status(position).cooking,true);
 const result=f.tick(2);
 assert.equal(result.changed,true);
 assert.equal(f.status(position).progress,0.2);
});
test('output obstruction takes precedence over invalid fuel',()=>{
 const f=make({input:{key:'rawIron',qty:1},fuel:{key:'custom:power',qty:1},output:{key:'gold',qty:1}});
 assert.equal(f.status(position).idleReason,'output_blocked');
});
test('empty input does not burn fuel or create products',()=>{
 const f=make({fuel:{key:'coal',qty:1}});
 f.tick(60);
 assert.equal(f.status(position).idleReason,'no_input');
 assert.equal(f.status(position).fuel.qty,1);
 assert.equal(f.status(position).output,null);
});
