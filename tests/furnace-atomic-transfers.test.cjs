/* Atomic furnace transfers must never duplicate or delete player inventory. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
vm.createContext(ctx);
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const engine=ctx.window.MineWorldFurnace;
const {deposit,withdraw}=ctx.window.MineWorldFurnaceUI.transfers;
const p={dimension:'overworld',x:5000,y:14,z:5000};
function inventory(initial={},fail=()=>false){
 const items={...initial};
 return {items,count:key=>items[key]||0,change:(key,delta)=>{
  if(fail(key,delta))return 0;
  const before=items[key]||0;
  const after=Math.max(0,Math.min(65535,before+delta));
  items[key]=after;return after-before;
 }};
}
test('successful input and fuel deposits reserve exactly the items moved',()=>{
 const f=engine.create(),bag=inventory({rawIron:5,coal:2});
 assert.equal(deposit(f,bag,p,'input','rawIron',64),5);
 assert.equal(deposit(f,bag,p,'fuel','coal',1),1);
 assert.equal(bag.count('rawIron'),0);assert.equal(bag.count('coal'),1);
 assert.equal(f.get(p).input.qty,5);assert.equal(f.get(p).fuel.qty,1);
 assert.equal(deposit(f,bag,p,'input','rawGold',1),0);
 assert.equal(f.get(p).input.key,'rawIron');
});
test('failed debit cannot duplicate materials into a furnace',()=>{
 const f=engine.create(),bag=inventory({rawIron:4},(_key,delta)=>delta<0);
 assert.equal(deposit(f,bag,p,'input','rawIron',4),0);
 assert.equal(f.get(p),null);assert.equal(bag.count('rawIron'),4);
});
test('unsupported input is refunded when the furnace rejects insertion',()=>{
 const f=engine.create(),bag=inventory({notSmeltable:2});
 assert.equal(deposit(f,bag,p,'input','notSmeltable',2),0);
 assert.equal(bag.count('notSmeltable'),2);
 assert.equal(f.get(p),null);
});
test('failed credit cannot delete smelted output',()=>{
 const f=engine.create();f.insert(p,'input','rawIron',1);f.insert(p,'fuel','coal',1);
 f.tick(10);const bag=inventory({iron:0},(_key,delta)=>delta>0);
 const result=withdraw(f,bag,p,'output');
 assert.equal(result.moved,0);assert.equal(f.get(p).output.qty,1);
 assert.equal(bag.count('iron'),0);
});
test('collecting output respects the 65535 inventory cap without loss',()=>{
 const f=engine.create();f.insert(p,'input','rawIron',3);f.insert(p,'fuel','coal',1);f.tick(30);
 const bag=inventory({iron:65534});
 assert.equal(withdraw(f,bag,p,'output').moved,1);
 assert.equal(bag.count('iron'),65535);assert.equal(f.get(p).output.qty,2);
 assert.equal(withdraw(f,bag,p,'output').full,true);
 assert.equal(f.get(p).output.qty,2);
});
test('input withdrawal preserves inventory and resets smelt progress',()=>{
 const f=engine.create();f.insert(p,'input','rawIron',3);f.insert(p,'fuel','coal',1);f.tick(2);
 const bag=inventory({rawIron:0});
 assert.equal(withdraw(f,bag,p,'input').moved,3);
 assert.equal(bag.count('rawIron'),3);assert.equal(f.get(p).input,null);
 assert.equal(f.get(p).progress,0);
});
test('mobile dropdown changes immediately refresh transfer availability',()=>{
 const source=fs.readFileSync(path.join(root,'furnace-ui.js'),'utf8');
 assert.match(source,/el\('mw-furnace-'\+which\)\.addEventListener\('change',render\)/);
});
