/* Furnace ore-block and wood-fuel parity; independently authored MineWorld IDs. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),context=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'furnace-engine.js'),'utf8'),context);
const api=context.window.MineWorldFurnace;
const position={dimension:'overworld',x:420,y:-32,z:421};
test('placeable Overworld and deep ore blocks smelt into the matching inventory items',()=>{
 const cases={
  18:'coal',19:'iron',95:'copper',96:'gold',97:'redstone',98:'lapis',
  99:'diamond',100:'emerald',101:'coal',102:'iron',103:'copper',
  104:'gold',105:'redstone',106:'lapis',107:'diamond',108:'emerald'
 };
 for(const [id,product] of Object.entries(cases)){
  const f=api.create(),ingredient='block:'+id;
  assert.equal(f.insert(position,'input',ingredient,1),1,ingredient);
  assert.equal(f.insert(position,'fuel','coal',1),1);
  assert.equal(f.tick(10).completed,1,ingredient);
  assert.equal(f.get(position).output.key,product,ingredient);
 }
});
test('nether quartz and gold ore, red sand, and clay use the correct outputs',()=>{
 for(const [ingredient,product] of [
  ['block:83','quartz'],['block:84','goldNugget'],
  ['block:26','block:9'],['block:57','block:25']
 ]){
  const f=api.create();
  assert.equal(f.insert(position,'input',ingredient,1),1);
  assert.equal(f.insert(position,'fuel','coal',1),1);
  assert.equal(f.tick(10).completed,1);
  assert.equal(f.get(position).output.key,product);
 }
});
test('all supported Overworld log types burn without consuming unrelated fuel',()=>{
 for(const id of [5,15,30,32,34,36,38,40,42]){
  const f=api.create();
  assert.equal(f.insert(position,'input','rawIron',2),2);
  assert.equal(f.insert(position,'fuel','block:'+id,1),1);
  assert.equal(f.tick(10).completed,1,'log '+id);
  assert.equal(f.get(position).burn,5,'log '+id+' burns for 15 seconds');
  assert.equal(f.get(position).input.qty,1);
 }
});
test('new ore smelts survive a partial-cook save/restore at negative Y',()=>{
 const f=api.create();
 assert.equal(f.insert(position,'input','block:57',2),2);
 assert.equal(f.insert(position,'fuel','block:40',1),1);
 assert.equal(f.tick(4).completed,0);
 const saved=JSON.parse(JSON.stringify(f.snapshot()));
 const restored=api.create();restored.restore(saved);
 assert.equal(restored.get(position).progress,4);
 assert.equal(restored.tick(6).completed,1);
 assert.equal(restored.get(position).output.key,'block:25');
 assert.equal(restored.get(position).input.qty,1);
 assert.equal(restored.get(position).burn,5);
});
