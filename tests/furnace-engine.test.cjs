const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={window:{}};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace,p={dimension:'overworld',x:5000,y:14,z:5000};
test('coal smelts eight iron, then furnace waits for fuel',()=>{
 const f=api.create();assert.equal(f.insert(p,'input','rawIron',9),9);assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(10).completed,1);assert.equal(f.tick(60).completed,6);assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).output.qty,8);assert.equal(f.tick(10).completed,0);
 assert.equal(f.take(p,'output',3).qty,3);assert.equal(f.get(p).output.qty,5);
});
test('mixed ingredients rejected; progress persists and block removal returns items',()=>{
 const f=api.create();assert.equal(f.insert(p,'input','coal',1),0);
 assert.equal(f.insert(p,'input','rawGold',64),64);assert.equal(f.insert(p,'input','rawIron',1),0);
 assert.equal(f.insert(p,'fuel','coal',1),1);f.tick(3);
 const g=api.create();g.restore(JSON.parse(JSON.stringify(f.snapshot())));
 assert.equal(g.get(p).progress,3);assert.equal(g.tick(7).completed,1);
 assert.equal(g.get(p).output.key,'gold');
 assert.equal(g.remove(p).reduce((n,s)=>n+s.qty,0),64);
});
test('restore sanitizes invalid slots, coordinates and progress',()=>{
 const f=api.create();f.restore([{dimension:'overworld',x:1,y:1,z:1,input:{key:'__proto__',qty:500},fuel:{key:'coal',qty:-5},progress:999,burn:-1}]);
 const m=f.get({dimension:'overworld',x:1,y:1,z:1});
 assert.equal(m.input,null);assert.equal(m.fuel,null);assert.equal(m.progress,10);assert.equal(m.burn,0);
});

test('game loads furnace modules, persists block inventories and ticks smelting',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const snippet of ['furnaces:snapshotFurnaces()','furnaces.restore(s.furnaces)','furnaces.tick(furnaceDt)','openFurnace(aim)','furnaces.remove({dimension,x,y,z})','./furnace-engine.js','./furnace-ui.js'])
  assert.ok(html.includes(snippet),snippet);
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert.ok(sw.includes("'./furnace-engine.js'")&&sw.includes("'./furnace-ui.js'"));
});

test('prototype names cannot be inserted as recipes or fuel',()=>{
 const f=api.create();assert.equal(f.insert(p,'input','constructor',1),0);
 assert.equal(f.insert(p,'fuel','toString',1),0);
 f.restore([{...p,input:{key:'constructor',qty:1},fuel:{key:'toString',qty:1}}]);
 assert.equal(f.get(p).input,null);assert.equal(f.get(p).fuel,null);
});

test('future deep-world furnaces accept negative-Y positions and persist their contents',()=>{
 const deep={dimension:'overworld',x:5000,y:-32,z:5000};
 const f=api.create();assert.equal(f.insert(deep,'input','rawIron',2),2);
 assert.equal(f.insert(deep,'fuel','coal',1),1);
 assert.equal(f.tick(10).completed,1);
 const saved=JSON.parse(JSON.stringify(f.snapshot()));
 const restored=api.create();restored.restore(saved);
 assert.equal(restored.get(deep).output.key,'iron');
 assert.equal(restored.get(deep).input.qty,1);
 assert.equal(restored.get({...deep,y:-65}),null);
 assert.equal(restored.insert({...deep,y:320},'fuel','coal',1),0);
 assert.equal(restored.insert({...deep,x:10000},'fuel','coal',1),0);
});


test('furnace saves preserve more than 256 independent machines without silent truncation',()=>{
 const f=api.create();
 for(let i=0;i<300;i++)assert.equal(f.insert({...p,x:i},'input','rawIron',1),1);
 const saved=JSON.parse(JSON.stringify(f.snapshot()));
 assert.equal(saved.length,300);
 const restored=api.create();restored.restore(saved);
 assert.equal(restored.snapshot().length,300);
 assert.equal(restored.get({...p,x:299}).input.key,'rawIron');
 assert.equal(restored.get({...p,x:0}).input.qty,1);
});

test('restoring a completed cook frame cannot leave the furnace permanently stalled',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'rawIron',qty:1},fuel:{key:'coal',qty:1},progress:10}]);
 assert.equal(f.get(p).progress,0,'invalid completed frame is normalized');
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).output.key,'iron');
});
