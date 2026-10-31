/* Blast furnace block ID parity and conservative legacy-save recovery. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function load(file,property){
 const ctx=vm.createContext({window:{}});
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
 return ctx.window[property];
}
const api=load('furnace-engine.js','MineWorldFurnace');
const catalog=load('survival-catalog.js','MineWorldCatalog');
const p={dimension:'overworld',x:80,y:16,z:90};
const idx=(x,y,z)=>(x*10000+z)*48+y;
test('crafting blast furnace yields block 156, not cartography table 158',()=>{
 const blast=catalog.recipes.find(r=>r.name==='Craft a Blast Furnace');
 const cartography=catalog.recipes.find(r=>r.name==='Cartography Table');
 assert.equal(blast.give['block:156'],1);
 assert.equal(blast.give['block:158'],undefined);
 assert.equal(cartography.give['block:158'],1);
});
test('actual blast furnace block opens the correct engine and browser fixture',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const smoke=fs.readFileSync(path.join(root,'scripts/browser-smoke.cjs'),'utf8');
 assert.match(html,/\[20,156,157\]\.includes\(aim\?\.b\)/);
 assert.match(html,/\[20,156,157\]\.includes\(before\)/);
 assert.match(html,/target\.b===156\?'blast'/);
 assert.match(html,/\!\[20,156,157\]\.includes\(get\(x,y,z\)\)/);
 assert.doesNotMatch(html,/\[20,157,158\]/);
 assert.match(smoke,/\{block:156,kind:'blast'/);
 assert.match(smoke,/cartography table opened as a furnace/);
});
test('legacy placed blast furnace recovers in place without losing machine state',()=>{
 const f=api.create();f.ensure(p,'blast');
 f.insert(p,'input','rawIron',2);f.insert(p,'fuel','coal',1);f.tick(2);
 const restored=api.create();restored.restore(JSON.parse(JSON.stringify(f.snapshot())));
 const edits={overworld:new Map([[idx(p.x,p.y,p.z),158],[idx(81,16,90),158]]),
   nether:new Map(),end:new Map()};
 assert.equal(restored.migrateLegacyBlastBlocks(edits,idx),1);
 assert.equal(edits.overworld.get(idx(p.x,p.y,p.z)),156);
 assert.equal(edits.overworld.get(idx(81,16,90)),158,'real cartography table is untouched');
 assert.equal(restored.get(p).input.qty,2);
 assert.equal(restored.get(p).burn,38);
 assert.equal(restored.get(p).progress,2);
 assert.equal(restored.tick(3).completed,1);
 assert.equal(restored.get(p).output.key,'iron');
 assert.equal(restored.migrateLegacyBlastBlocks(edits,idx),0,'idempotent migration');
});
test('migration respects dimensions and never touches normal cartography tables',()=>{
 const f=api.create(),nether={...p,dimension:'nether'};
 f.ensure(nether,'blast');
 const maps={overworld:new Map([[idx(p.x,p.y,p.z),158]]),
   nether:new Map([[idx(p.x,p.y,p.z),158]]),end:new Map()};
 assert.equal(f.migrateLegacyBlastBlocks(maps,idx),1);
 assert.equal(maps.nether.get(idx(p.x,p.y,p.z)),156);
 assert.equal(maps.overworld.get(idx(p.x,p.y,p.z)),158);
});
test('migration skips unmatched or deep-world positions and invalid maps',()=>{
 const f=api.create(),deep={...p,y:-32};
 f.ensure(deep,'blast');
 const edits={overworld:new Map([[idx(deep.x,deep.y,deep.z),158]])};
 assert.equal(f.migrateLegacyBlastBlocks(edits,idx),0);
 assert.equal(edits.overworld.get(idx(deep.x,deep.y,deep.z)),158);
 assert.equal(f.migrateLegacyBlastBlocks(null,idx),0);
 assert.equal(f.migrateLegacyBlastBlocks(edits,null),0);
});
test('live load migrates only saved blast machines, backs up and marks world dirty',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/furnaces\.migrateLegacyBlastBlocks\(/);
 assert.match(html,/mineworld-backup-before-blast-block-fix-/);
 assert.match(html,/dirtySave=correctedBlastBlocks>0/);
});
