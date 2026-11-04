/* Regression coverage for furnace replacement and legacy blast migration. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),context);
const api=context.window.MineWorldFurnace;
const p=(x,y,z)=>({dimension:'overworld',x,y,z});

test('changing furnace type preserves remaining fuel capacity but clears partial recipe progress',()=>{
 const f=api.create(),loc=p(8,12,8);
 f.ensure(loc,'furnace');
 assert.equal(f.insert(loc,'input','rawIron',2),2);
 assert.equal(f.insert(loc,'fuel','coal',1),1);
 assert.equal(f.tick(4).completed,0);
 assert.equal(f.get(loc).burn,76);
 assert.equal(f.get(loc).progress,4);
 f.ensure(loc,'blast');
 assert.equal(f.get(loc).progress,0);
 assert.equal(f.get(loc).burn,38);
 assert.equal(f.tick(5).completed,1);
 assert.equal(f.get(loc).output.key,'iron');
 f.ensure(loc,'furnace');
 assert.equal(f.get(loc).burn,66);
 assert.equal(f.get(loc).progress,0);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(loc).output.qty,2);
});

test('legacy blast migration touches only saved blast stations with matching old block',()=>{
 const f=api.create(),old=p(5,20,6),modern=p(7,20,8),signed=p(-5,20,6);
 f.ensure(old,'blast');
 f.ensure(modern,'furnace');
 f.ensure(signed,'blast');
 const index=(x,y,z)=>x*10000+y*100+z;
 const edits=new Map([[index(5,20,6),158],[index(7,20,8),158]]);
 const converted=f.migrateLegacyBlastBlocks({overworld:edits},index);
 assert.equal(converted,1);
 assert.equal(edits.get(index(5,20,6)),156);
 assert.equal(edits.get(index(7,20,8)),158);
 assert.equal(f.migrateLegacyBlastBlocks({overworld:edits},index),0);
});

test('unfueled cook progress cools down and malformed saved timers cannot mint free work',()=>{
 const f=api.create(),loc=p(10,15,10);
 f.restore([{...loc,kind:'furnace',input:{key:'rawIron',qty:1},
  fuel:null,output:null,burn:100,burnTotal:0,progress:9}]);
 assert.equal(f.get(loc).burn,0);
 assert.equal(f.tick(2).completed,0);
 assert.equal(f.get(loc).progress,5);
 assert.equal(f.tick(10).completed,0);
 assert.equal(f.get(loc).progress,0);
 assert.equal(f.insert(loc,'fuel','coal',1),1);
 assert.equal(f.tick(10).completed,1);
});
