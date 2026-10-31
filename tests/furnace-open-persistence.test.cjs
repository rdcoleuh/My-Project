/* Opening a furnace must persist new/converted station metadata even without transfers. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
for(const file of ['furnace-engine.js','furnace-ui.js'])
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const furnace=ctx.window.MineWorldFurnace;
const ensureStation=ctx.window.MineWorldFurnaceUI.ensureStation;
const p={dimension:'overworld',x:631,y:-20,z:632};
const clone=x=>JSON.parse(JSON.stringify(x));
function setup(){
 const engine=furnace.create();let saves=0,lastSave=null;
 const api={onChange:()=>{saves++;lastSave=clone(engine.snapshot());}};
 return {engine,api,get saves(){return saves;},get lastSave(){return lastSave;}};
}
test('first opening creates a saved three-slot furnace without a transfer',()=>{
 const s=setup();
 const m=ensureStation(s.engine,s.api,p);
 assert.equal(m.kind,'furnace');assert.equal(m.input,null);
 assert.equal(m.fuel,null);assert.equal(m.output,null);
 assert.equal(s.saves,1);assert.equal(s.lastSave.length,1);
 assert.equal(s.lastSave[0].kind,'furnace');
});
test('reopening the same station does not repeatedly dirty the save',()=>{
 const s=setup();
 ensureStation(s.engine,s.api,p,'furnace');
 ensureStation(s.engine,s.api,p,'furnace');
 assert.equal(s.saves,1);
});
test('changing a burning furnace to smoker immediately persists kind and fuel conversion',()=>{
 const s=setup();ensureStation(s.engine,s.api,p,'furnace');
 s.engine.insert(p,'input','chicken',3);
 s.engine.insert(p,'fuel','coal',1);
 s.engine.tick(10);
 assert.equal(s.engine.get(p).burn,70);
 ensureStation(s.engine,s.api,p,'smoker');
 assert.equal(s.saves,2);
 assert.equal(s.lastSave[0].kind,'smoker');
 assert.equal(s.lastSave[0].burn,35);
 assert.equal(s.lastSave[0].burnTotal,40);
 assert.equal(s.lastSave[0].input.qty,2);
 assert.equal(s.lastSave[0].output.qty,1);
 const restored=furnace.create();restored.restore(s.lastSave);
 assert.equal(restored.get(p).kind,'smoker');
 assert.equal(restored.tick(5).completed,1);
});
test('invalid position and unknown station type do not create a machine or save',()=>{
 const s=setup();
 assert.equal(ensureStation(s.engine,s.api,{...p,y:320},'furnace'),null);
 assert.equal(ensureStation(s.engine,s.api,p,'unknown'),null);
 assert.equal(s.engine.snapshot().length,0);
 assert.equal(s.saves,0);
});
test('correcting smoker to furnace persists a new kind without losing slots',()=>{
 const s=setup();ensureStation(s.engine,s.api,p,'smoker');
 s.engine.insert(p,'input','potato',2);
 s.engine.insert(p,'fuel','coal',1);
 ensureStation(s.engine,s.api,p,'furnace');
 assert.equal(s.saves,2);
 assert.equal(s.lastSave[0].kind,'furnace');
 assert.equal(s.lastSave[0].input.qty,2);
 assert.equal(s.lastSave[0].fuel.qty,1);
 ensureStation(s.engine,s.api,p,'furnace');
 assert.equal(s.saves,2);
});
test('real open handler uses validated persistent station transition',()=>{
 const source=fs.readFileSync(path.join(root,'furnace-ui.js'),'utf8');
 assert.match(source,/function open\(position,kind='furnace'\)\{\s*const machine=ensureStation\(engine,api,position,kind\);/);
 assert.match(source,/if\(!machine\)return false;/);
});
