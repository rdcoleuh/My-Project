/* Real craftable MineWorld wooden fuel and harvested bamboo regressions. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'furnace-engine.js'),'utf8'),ctx);
const api=ctx.window.MineWorldFurnace;
const p={dimension:'overworld',x:5000,y:-32,z:5000};
const copy=x=>JSON.parse(JSON.stringify(x));

test('harvestable bamboo and craftable wooden accessories have correct fuel duration',()=>{
 const fuels={
  'block:45':2.5,'block:119':15,'block:155':15,'block:160':15,'block:168':15,
  ladder:15,fence:15,gate:15,door:10,trapdoor:15,sign:10,
  button:5,pressurePlate:15,bowl:5
 };
 const catalog=fs.readFileSync(path.join(root,'survival-catalog.js'),'utf8');
 for(const [key,seconds] of Object.entries(fuels)){
  assert.equal(api.FUEL[key],seconds,'missing burn time: '+key);
  assert.ok(catalog.includes(key.startsWith('block:')?'B('+key.slice(6)+')':key),
    'fuel must correspond to a real MineWorld craftable or harvestable item: '+key);
  const f=api.create();
  assert.equal(f.insert(p,'input','rawIron',1),1);
  assert.equal(f.insert(p,'fuel',key,1),1);
  assert.equal(f.tick(1).completed,0);
  assert.equal(f.get(p).burnTotal,seconds);
  assert.equal(f.get(p).burn,seconds-1);
  assert.equal(f.get(p).fuel,null,'one fuel consumed at ignition');
 }
});

test('four harvested bamboo blocks fuel exactly one ten-second iron smelt',()=>{
 const f=api.create();
 assert.equal(f.insert(p,'input','rawIron',2),2);
 assert.equal(f.insert(p,'fuel','block:45',4),4);
 assert.equal(f.tick(10).completed,1);
 assert.equal(f.get(p).output.key,'iron');
 assert.equal(f.get(p).output.qty,1);
 assert.equal(f.get(p).input.qty,1);
 assert.equal(f.get(p).fuel,null);
 assert.equal(f.get(p).burn,0);
 assert.equal(f.tick(10).completed,0,'no fifth bamboo or free second smelt');
});

test('insufficient bamboo cools partial progress rather than producing free iron',()=>{
 const f=api.create();
 f.insert(p,'input','rawIron',1);
 f.insert(p,'fuel','block:45',3);
 assert.equal(f.tick(7.5).completed,0);
 assert.equal(f.get(p).progress,7.5);
 assert.equal(f.get(p).fuel,null);
 assert.equal(f.tick(1).completed,0);
 assert.equal(f.get(p).progress,5.5);
 assert.equal(f.get(p).output,null);
});

test('bamboo burn and input survive deep-Y save and reload without duplication',()=>{
 const f=api.create();
 f.insert(p,'input','rawIron',1);
 f.insert(p,'fuel','block:45',4);
 assert.equal(f.tick(3).completed,0);
 const saved=copy(f.snapshot()),g=api.create();
 g.restore(saved);
 assert.equal(g.get(p).fuel.qty,2);
 assert.equal(g.get(p).burn,2);
 assert.equal(g.get(p).progress,3);
 assert.equal(g.tick(7).completed,1);
 assert.equal(g.get(p).output.qty,1);
 assert.equal(g.get(p).fuel,null);
 assert.equal(g.take(p,'output',1).qty,1);
 assert.equal(g.tick(60).completed,0);
 assert.equal(saved[0].fuel.qty,2,'restoring must not mutate the original save');
});

test('desktop and mobile smoke exercise bamboo fuel through real furnace controls',()=>{
 const smoke=fs.readFileSync(path.join(root,'scripts/browser-smoke.cjs'),'utf8');
 assert.match(smoke,/grantLoot\('block:45',4\)/);
 assert.match(smoke,/selectOption\('block:45'\)/);
 assert.match(smoke,/output\?\.qty,1,name\+': four bamboo/);
 assert.match(smoke,/desktop-furnace-bamboo-smelt-synthetic\.png/);
 assert.match(smoke,/mobile-furnace-bamboo-smelt-synthetic\.png/);
});
