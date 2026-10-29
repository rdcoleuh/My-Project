/* Furnace save compatibility: unknown but well-formed item stacks are player property. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:5001,y:-48,z:5002};
const clone=value=>JSON.parse(JSON.stringify(value));

test('save restore never deletes valid stacks from newer or unsupported recipes',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'futureOre',qty:7},fuel:{key:'futureFuel',qty:3},
  output:{key:'futureIngot',qty:12},burn:0,progress:4}]);
 const m=f.get(p);
 assert.equal(m.input.key,'futureOre');
 assert.equal(m.fuel.qty,3);
 assert.equal(m.output.qty,12);
 assert.equal(f.tick(30).completed,0,'unsupported input must not produce items');
 assert.deepEqual(clone(f.snapshot()[0].input),{key:'futureOre',qty:7});
 assert.deepEqual(clone(f.snapshot()[0].fuel),{key:'futureFuel',qty:3});
 assert.deepEqual(clone(f.snapshot()[0].output),{key:'futureIngot',qty:12});
 const reopened=api.create();reopened.restore(clone(f.snapshot()));
 assert.equal(reopened.take(p,'input',64).qty,7);
 assert.equal(reopened.take(p,'fuel',64).qty,3);
 assert.equal(reopened.take(p,'output',64).qty,12);
});

test('unknown output blocks smelting until player retrieves it',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'rawIron',qty:2},fuel:{key:'coal',qty:1},
  output:{key:'futureIngot',qty:4},progress:6}]);
 assert.equal(f.tick(20).completed,0);
 assert.equal(f.get(p).output.key,'futureIngot');
 assert.equal(f.get(p).input.qty,2);
 assert.equal(f.take(p,'output').qty,4);
 assert.equal(f.tick(10).completed,1,'known recipe works once output is cleared');
 assert.equal(f.get(p).output.key,'iron');
});

test('corrupt slots remain rejected while valid unknown item keys survive',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'futureOre',qty:0},fuel:{key:'bad!fuel',qty:2},
  output:{key:'futureIngot',qty:65}}]);
 assert.equal(f.get(p).input,null);
 assert.equal(f.get(p).fuel,null);
 assert.equal(f.get(p).output,null);
 f.restore([{...p,input:{key:'futureOre',qty:1},fuel:{key:'futureFuel',qty:1}}]);
 assert.equal(f.insert(p,'input','futureOre',1),0,'unknown recipes are not accepted as new deposits');
 assert.equal(f.insert(p,'fuel','futureFuel',1),0,'unknown fuels are not accepted as new deposits');
 assert.equal(f.take(p,'input').key,'futureOre','restored stack can be retrieved');
 assert.equal(f.take(p,'fuel').key,'futureFuel');
});
