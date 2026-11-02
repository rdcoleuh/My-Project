/* Furnace/catalog integration: real three-slot terracotta cooking and no Netherrack planks. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx=vm.createContext({window:{}});
vm.runInContext(read('furnace-engine.js'),ctx);
vm.runInContext(read('survival-catalog.js'),ctx);
const api=ctx.window.MineWorldFurnace,catalog=ctx.window.MineWorldCatalog;
const p={dimension:'overworld',x:30,y:-40,z:-12};
const copy=x=>JSON.parse(JSON.stringify(x));

test('generic terracotta cooks into glazed terracotta only in an ordinary furnace',()=>{
 assert.equal(api.RECIPES['block:25'],'glazedTerracotta');
 assert.equal(api.canSmelt('furnace','block:25'),true);
 assert.equal(api.canSmelt('smoker','block:25'),false);
 assert.equal(api.canSmelt('blast','block:25'),false);
 const f=api.create();
 assert.equal(f.insert(p,'input','block:25',1),1);
 assert.equal(f.insert(p,'fuel','coal',1),1);
 assert.equal(f.tick(9).completed,0);
 assert.equal(f.get(p).output,null);
 assert.equal(f.tick(1).completed,1);
 assert.equal(f.get(p).output.key,'glazedTerracotta');
 assert.equal(f.get(p).output.qty,1);
 assert.equal(f.get(p).input,null);
 assert.equal(f.get(p).burn,70);
});
test('glazed terracotta progress and output survive a deep-Y save and reload',()=>{
 const f=api.create();f.insert(p,'input','block:25',2);f.insert(p,'fuel','coal',1);
 assert.equal(f.tick(4).completed,0);
 const saved=copy(f.snapshot()),g=api.create();g.restore(saved);
 assert.equal(g.get(p).progress,4);
 assert.equal(g.tick(6).completed,1);
 assert.equal(g.take(p,'output',1).key,'glazedTerracotta');
 assert.equal(g.tick(10).completed,1);
 assert.equal(g.get(p).output.qty,1);
 assert.equal(g.get(p).input,null);
 assert.equal(saved[0].progress,4,'saved data must not be mutated');
});
test('glazed terracotta recipe preview matches actual one-input furnace mechanics',()=>{
 const recipe=catalog.recipes.find(r=>r.name==='Glazed Terracotta');
 assert.ok(recipe);
 assert.equal(recipe.station,'furnace');
 assert.equal(recipe.cost['block:25'],1);
 assert.equal(recipe.cost.coal,1,'coal is an example fuel in recipe guidance');
 assert.equal(recipe.cost.dye,undefined,'three-slot furnace has no dye input');
 assert.equal(recipe.give.glazedTerracotta,1);
});
test('Netherrack cannot be turned into Dark Planks by any crafting recipe',()=>{
 const bad=catalog.recipes.filter(r=>r.cost['block:50']&&r.give['block:52']);
 assert.equal(bad.length,0);
 assert.equal(api.RECIPES['block:50'],undefined);
 assert.equal(api.FUEL['block:50'],undefined);
 const dark=ctx.window.MineWorldCatalog.recipes.filter(r=>r.give['block:52']);
 assert.equal(dark.length,0,'until a real dark log exists, no fake wood recipe');
});
test('desktop/mobile Chrome smoke verifies placed furnace with synthetic imported pack',()=>{
 const smoke=read('scripts/browser-smoke.cjs');
 assert.match(smoke,/grantLoot\('block:25',1\)/);
 assert.match(smoke,/selectOption\('block:25'\)/);
 assert.match(smoke,/output\?\.key==='glazedTerracotta'/);
 assert.match(smoke,/desktop-furnace-glazed-terracotta-synthetic\.png/);
 assert.match(smoke,/mobile-furnace-glazed-terracotta-synthetic\.png/);
 assert.ok(smoke.includes('bx=x+5'),'new furnace must not overlap cartography fixture');
 assert.match(smoke,/glazed terracotta furnace cleanup failed/);
 // Cache versions advance with unrelated gameplay/HUD updates.
 assert.match(read('sw.js'),/const VERSION='mineworld-6-\\d+-/);
});
