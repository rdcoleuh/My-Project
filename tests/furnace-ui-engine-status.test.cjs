/* Engine status must be the source of truth for furnace stall messages.
 * Static integration guard plus live engine assertions in a mocked browser. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
test('visible furnace UI consumes read-only engine status and all idle reasons',()=>{
 const source=fs.readFileSync(path.join(root,'furnace-ui.js'),'utf8');
 assert.match(source,/const state=engine\.status\?\.\(current\)/);
 for(const reason of ['no_input','no_recipe','output_blocked','invalid_fuel_stack','invalid_fuel','no_fuel'])
  assert.match(source,new RegExp(reason+':'));
 assert.match(source,/state\?\.readyToSmelt/);
});
test('status reports blocked output and does not mutate furnace inventory',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'furnace-engine.js'),'utf8'),context);
 const engine=context.window.MineWorldFurnace.create(),p={dimension:'overworld',x:2,y:12,z:3};
 engine.ensure(p);engine.insert(p,'input','rawIron',1);engine.insert(p,'fuel','coal',1);
 let status=engine.status(p);assert.equal(status.readyToSmelt,true);assert.equal(status.idleReason,null);
 engine.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},fuel:{key:'coal',qty:1},output:{key:'gold',qty:1},burn:0,burnTotal:0,progress:0}]);
 const before=JSON.stringify(engine.snapshot());
 status=engine.status(p);assert.equal(status.idleReason,'output_blocked');
 assert.equal(JSON.stringify(engine.snapshot()),before);
});
