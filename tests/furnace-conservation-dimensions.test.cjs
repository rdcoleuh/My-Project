/* MineWorld furnace conservation and cross-dimension isolation regressions. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const sandbox=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','furnace-engine.js'),'utf8'),sandbox);
const api=sandbox.window.MineWorldFurnace;
const copy=value=>JSON.parse(JSON.stringify(value));

test('furnaces at identical coordinates in separate dimensions remain independent',()=>{
 const f=api.create();
 const positions=['overworld','nether','end'].map(dimension=>({dimension,x:7,y:12,z:-8}));
 for(const [i,p] of positions.entries()){
  f.ensure(p);
  assert.equal(f.insert(p,'input',['rawIron','rawGold','rawCopper'][i]),1);
  assert.equal(f.insert(p,'fuel','coal'),1);
 }
 assert.equal(f.tick(10).completed,3);
 const restored=api.create();
 restored.restore(copy(f.snapshot()));
 assert.deepEqual(positions.map(p=>restored.get(p).output.key),['iron','gold','copper']);
 assert.deepEqual(copy(restored.remove(positions[1]).map(s=>s.key)),['gold']);
 assert.equal(restored.get(positions[0]).output.key,'iron');
 assert.equal(restored.get(positions[2]).output.key,'copper');
});

test('smoker and blast furnace spend fuel twice as fast, not twice as efficiently',()=>{
 for(const [kind,ingredient,product] of [['furnace','rawIron','iron'],['blast','rawIron','iron'],['smoker','potato','bakedPotato']]){
  const f=api.create(),p={dimension:'overworld',x:0,y:20,z:0};
  f.ensure(p,kind);
  assert.equal(f.insert(p,'input',ingredient,9),9);
  assert.equal(f.insert(p,'fuel','coal'),1);
  assert.equal(f.tick(60).completed,kind==='furnace'?6:8);
  assert.equal(f.get(p).output.key,product);
  assert.equal(f.tick(60).completed,kind==='furnace'?2:0);
  assert.equal(f.get(p).output.qty,8);
  assert.equal(f.get(p).input.qty,1);
  assert.equal(f.get(p).burn,0);
 }
});
