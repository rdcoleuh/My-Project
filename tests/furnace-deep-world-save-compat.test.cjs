'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:-1,y:-64,z:-1};
test('deep-world furnace snapshot preserves dimension and signed coordinates',()=>{
 const engine=api.create();engine.ensure(p,'furnace');
 engine.insert(p,'input','rawIron',2);engine.insert(p,'fuel','coal',1);engine.tick(3);
 const copy=api.create();copy.restore(JSON.parse(JSON.stringify(engine.snapshot())));
 assert.equal(copy.get(p).progress,3);
 assert.equal(copy.get({...p,dimension:'nether'}),null);
 assert.equal(copy.get({...p,x:1}),null);
 assert.equal(copy.tick(7).completed,1);
 assert.equal(copy.take(p,'output',1).key,'iron');
});
test('unknown namespaced player-pack inventory survives load and withdrawal',()=>{
 const engine=api.create();
 engine.restore([{...p,kind:'furnace',input:{key:'custom:unfamiliar_ore',qty:3},
 fuel:{key:'custom:unfamiliar_fuel',qty:2},output:{key:'custom:unfamiliar_ingot',qty:4},
 burn:0,burnTotal:0,progress:0}]);
 assert.equal(engine.tick(60).completed,0);
 assert.equal(engine.take(p,'input',3).qty,3);
 assert.equal(engine.take(p,'fuel',2).key,'custom:unfamiliar_fuel');
 assert.equal(engine.take(p,'output',4).qty,4);
});
test('legacy migration ignores negative coordinates and cannot alias positive indices',()=>{
 const engine=api.create();engine.ensure(p,'blast');
 const edits=new Map([[42,158]]);
 const migrated=engine.migrateLegacyBlastBlocks({overworld:edits},()=>42);
 assert.equal(migrated,0);
 assert.equal(edits.get(42),158);
});
test('full output stack blocks new smelting without deleting stored materials',()=>{
 const engine=api.create();
 engine.restore([{...p,kind:'furnace',input:{key:'rawIron',qty:1},
 fuel:{key:'coal',qty:1},output:{key:'iron',qty:64},
 burn:0,burnTotal:0,progress:0}]);
 assert.equal(engine.tick(60).completed,0);
 assert.equal(engine.get(p).input.qty,1);
 assert.equal(engine.get(p).output.qty,64);
});
