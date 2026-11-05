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
test('legacy overfilled furnace stacks survive save and can be withdrawn without accepting new deposits',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'rawIron',qty:90},fuel:{key:'coal',qty:70},output:{key:'iron',qty:75}}]);
 const m=f.get(p);
 assert.equal(m.input.qty,90);assert.equal(m.fuel.qty,70);assert.equal(m.output.qty,75);
 assert.equal(f.insert(p,'input','rawIron',1),0);
 assert.equal(f.insert(p,'fuel','coal',1),0);
 const saved=JSON.parse(JSON.stringify(f.snapshot()));
 const g=api.create();g.restore(saved);
 assert.equal(g.get(p).input.qty,90);
 assert.equal(g.get(p).fuel.qty,70);
 assert.equal(g.get(p).output.qty,75);
 assert.equal(g.tick(10).completed,0,'overfull output must block cooking');
 assert.equal(g.take(p,'output',64).qty,64);
 assert.equal(g.take(p,'output',64).qty,11);
 assert.equal(g.take(p,'input',64).qty,64);
 assert.equal(g.get(p).input.qty,26);
});

test('malformed and excessive legacy furnace quantities are still rejected',()=>{
 const f=api.create();f.restore([{...p,input:{key:'rawIron',qty:1000001},fuel:{key:'coal',qty:1.5},output:{key:'iron',qty:Infinity}}]);
 assert.equal(f.get(p).input,null);assert.equal(f.get(p).fuel,null);assert.equal(f.get(p).output,null);
});

test('restore sanitizes invalid slots, coordinates and progress',()=>{
 const f=api.create();f.restore([{dimension:'overworld',x:1,y:1,z:1,input:{key:'__proto__',qty:500},fuel:{key:'coal',qty:-5},progress:999,burn:-1}]);
 const m=f.get({dimension:'overworld',x:1,y:1,z:1});
 assert.equal(m.input,null);assert.equal(m.fuel,null);assert.equal(m.progress,0);assert.equal(m.burn,0);
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

test('unfueled partial smelts cool down instead of remaining indefinitely ready',()=>{
 const f=api.create();
 assert.equal(f.insert(p,'input','rawIron',2),2);
 assert.equal(f.insert(p,'fuel','sticks',1),1); // one stick burns for five seconds
 assert.equal(f.tick(5).completed,0);
 assert.equal(f.get(p).progress,5);
 const cooling=f.tick(1);
 assert.equal(cooling.changed,true,'cooldown changes saved furnace state');
 assert.equal(cooling.completed,0);
 assert.equal(f.get(p).progress,3);
 f.tick(1.5);
 assert.equal(f.get(p).progress,0,'progress cannot become negative');
 assert.equal(f.tick(20).changed,false,'an idle furnace needs no repeated save');
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(9).completed,0,'new fuel must actually cook a full item');
 assert.equal(f.tick(1).completed,1);
 assert.equal(f.get(p).output.qty,1);
});

test('partially smelted saves cool correctly without fuel and resume with fuel',()=>{
 const f=api.create();
 f.restore([{...p,input:{key:'rawIron',qty:1},progress:4,burn:0}]);
 assert.equal(f.tick(1).completed,0);
 assert.equal(f.get(p).progress,2);
 const saved=JSON.parse(JSON.stringify(f.snapshot()));
 const restored=api.create();restored.restore(saved);
 assert.equal(restored.tick(1).completed,0);
 assert.equal(restored.get(p).progress,0);
 assert.equal(restored.insert(p,'fuel','coal',1),1);
 assert.equal(restored.tick(10).completed,1);
 assert.equal(restored.get(p).output.key,'iron');
});

test('a suspended browser frame catches up at most sixty seconds of smelting',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(html.includes('const furnaceDt=clamp(frameMs/1000,0,60);'),
   'the live render loop must not discard elapsed furnace time after one second');
 const f=api.create();
 assert.equal(f.insert(p,'input','rawIron',9),9);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(3600).completed,6,'one resumed frame is bounded to sixty seconds');
 assert.equal(f.get(p).output.qty,6);
 assert.equal(f.get(p).input.qty,3);
 assert.equal(f.get(p).burn,20);
 const saved=JSON.parse(JSON.stringify(f.snapshot()));
 const restored=api.create();restored.restore(saved);
 assert.equal(restored.tick(20).completed,2,'remaining fuel resumes after saving');
 assert.equal(restored.get(p).output.qty,8);
 assert.equal(restored.get(p).input.qty,1);
 assert.equal(restored.tick(60).completed,0,'no fuel means no free ninth item');
 assert.equal(restored.get(p).output.qty,8);
});

test('a suspended browser frame cannot smelt more than a full output stack',()=>{
 const f=api.create();
 assert.equal(f.insert(p,'input','rawIron',64),64);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(3600).completed,6);
 assert.equal(f.tick(3600).completed,2);
 assert.equal(f.get(p).output.qty,8);
 assert.equal(f.get(p).input.qty,56);
 assert.equal(f.get(p).burn,0);
});


test('lava bucket returns an empty bucket without duplicating fuel on save/reload',()=>{
 const f=api.create();
 assert.equal(f.insert(p,'input','rawIron',2),2);
 assert.equal(f.insert(p,'fuel','lavaBucket',2),1,'lava buckets cannot stack');
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).fuel.key,'bucket');
 assert.equal(f.get(p).burn,990);
 const restored=api.create();restored.restore(JSON.parse(JSON.stringify(f.snapshot())));
 assert.equal(restored.tick(10).completed,1);
 assert.equal(restored.get(p).output.qty,2);
 assert.equal(restored.take(p,'fuel',64).key,'bucket');
 assert.equal(restored.insert(p,'fuel','coal',1),1,'fuel slot can be reused after bucket withdrawal');
});

test('smoker and blast furnace consume fuel at matching accelerated rate',()=>{
 for(const [kind,ingredient,product] of [['smoker','chicken','cookedChicken'],['blast','rawIron','iron']]){
  const f=api.create();f.ensure(p,kind);
  assert.equal(f.insert(p,'input',ingredient,9),9);
  assert.equal(f.insert(p,'fuel','coal',1),1);
  assert.equal(f.tick(40).completed,8);
  assert.equal(f.get(p).output.key,product);
  assert.equal(f.get(p).burn,0);
  assert.equal(f.tick(5).completed,0,'one coal must not smelt a ninth item');
 }
});


test('duplicate save records cannot overwrite the first furnace inventory',()=>{
 const a={dimension:'overworld',x:41,y:-20,z:42};
 const f=api.create();
 f.restore([{...a,input:{key:'rawIron',qty:3},fuel:{key:'coal',qty:1}},
            {...a,input:{key:'rawGold',qty:64},fuel:{key:'coal',qty:64}}]);
 assert.equal(f.snapshot().length,1);
 assert.equal(f.get(a).input.key,'rawIron');
 assert.equal(f.get(a).input.qty,3);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(a).output.key,'iron');
});

test('malformed saved burn timers cannot create free furnace fuel',()=>{
 const a={dimension:'overworld',x:42,y:-20,z:42};
 const f=api.create();
 f.restore([{...a,input:{key:'rawIron',qty:2},burn:1000}]);
 assert.equal(f.get(a).burn,0);
 assert.equal(f.tick(60).completed,0);
 f.restore([{...a,input:{key:'rawIron',qty:2},burn:1000,burnTotal:10}]);
 assert.equal(f.get(a).burn,10);
 assert.equal(f.tick(60).completed,1);
 assert.equal(f.tick(60).completed,0);
});

test('deep negative coordinates and dimensions isolate furnace inventories through save reload',()=>{
 const f=api.create();
 const overworld={dimension:'overworld',x:-1,y:-64,z:-1};
 const nether={dimension:'nether',x:-1,y:-64,z:-1};
 const neighbor={dimension:'overworld',x:0,y:-64,z:-1};
 assert.equal(f.insert(overworld,'input','rawIron',2),2);
 assert.equal(f.insert(overworld,'fuel','coal',1),1);
 assert.equal(f.insert(nether,'input','rawGold',1),1);
 assert.equal(f.insert(nether,'fuel','coal',1),1);
 assert.equal(f.insert(neighbor,'input','rawCopper',1),1);
 assert.equal(f.insert(neighbor,'fuel','coal',1),1);
 assert.equal(f.tick(10).completed,3);
 const saved=JSON.parse(JSON.stringify(f.snapshot()));
 assert.equal(saved.length,3);
 const restored=api.create();restored.restore(saved);
 assert.equal(restored.get(overworld).output.key,'iron');
 assert.equal(restored.get(nether).output.key,'gold');
 assert.equal(restored.get(neighbor).output.key,'copper');
 assert.equal(restored.take(overworld,'output',1).key,'iron');
 assert.equal(restored.get(nether).output.qty,1,'another dimension must not be affected');
 assert.equal(restored.get(neighbor).output.qty,1,'adjacent signed coordinate must not alias');
 assert.equal(restored.get({...overworld,y:-65}),null);
 assert.equal(restored.get({...overworld,y:320}),null);
});
