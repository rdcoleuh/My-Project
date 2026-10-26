/* Synthetic sprite references only: no player or Minecraft bitmaps are included. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
function allocator(){
 const window={};
 vm.runInNewContext(read('java-directional-faces.js'),{window,Map,Set,Number,Object,Array});
 return window.MineWorldJavaDirectionalFaces;
}
test('same imported PNG is stored once across directions and different blocks',()=>{
 const api=allocator();
 const plan=api.plan(new Map([
  [1,{sides:{north:'block:shared',south:'block:other',east:'block:shared',west:'block:other'}}],
  [2,{sides:{north:'block:other',south:'block:shared',east:'block:other',west:'block:shared'}}]
 ]));
 assert.equal(plan.used,2,'two distinct source PNGs consume two GPU atlas tiles');
 assert.equal(plan.tiles.get(1).north.tile,plan.tiles.get(1).east.tile);
 assert.equal(plan.tiles.get(1).north.tile,plan.tiles.get(2).south.tile);
 assert.notEqual(plan.tiles.get(1).north.tile,plan.tiles.get(1).south.tile);
 assert.equal(api.commit(plan.tiles),2);
 assert.equal(api.stats().faces,8,'all eight block directions remain mapped');
 assert.equal(api.tile(1,[0,0,-1]),api.tile(2,[0,0,1]));
 api.commit(new Map());
 assert.equal(api.tile(1,[0,0,-1]),null,'clearing a pack removes all old mapping');
});
test('when 506 atlas slots fill, later faces can still reuse a known sprite',()=>{
 const api=allocator(),models=new Map();
 for(let id=1;id<=126;id++){
  const sides={};
  for(const [n,dir] of ['north','south','east','west'].entries())
   sides[dir]='block:unique-'+id+'-'+n;
  models.set(id,{sides});
 }
 models.set(127,{sides:{north:'block:last-1',south:'block:last-2'}});
 models.set(128,{sides:{north:'block:overflow-a',south:'block:overflow-b'}});
 models.set(129,{sides:{north:'block:unique-1-0',south:'block:unique-1-1'}});
 const plan=api.plan(models);
 assert.equal(plan.used,506);
 assert.equal(plan.tiles.has(128),false,'unallocated new sprites use the old visual fallback');
 assert.equal(plan.tiles.has(129),true,'existing sprites work after the atlas fills');
 assert.equal(plan.tiles.get(129).north.tile,plan.tiles.get(1).north.tile);
 for(const row of plan.tiles.values())for(const item of Object.values(row))
  assert.ok(item.tile>=518&&item.tile<1024);
});
test('directional atlas uploads and animations occur once per shared tile',()=>{
 const importer=read('local-resource-pack.js');
 const start=importer.indexOf('const mappedSides=new Map(),renderedSideTiles=new Set()');
 const end=importer.indexOf('// Eleven reserved atlas tiles',start);
 assert.ok(start>0&&end>start);
 const section=importer.slice(start,end);
 assert.match(section,/if\(!renderedSideTiles\.has\(entry\.tile\)\)\{/);
 assert.match(section,/renderedSideTiles\.add\(entry\.tile\)/);
 assert.match(section,/nativeTiles\.push\(/);
 assert.match(section,/if\(info\)animated\.push\(/);
 assert.ok(section.indexOf('markTransform(id,dir)')>section.indexOf('renderedSideTiles.add(entry.tile)'),
  'per-face UV transformations remain active even for shared atlas tiles');
 assert.match(read('sw.js'),/mineworld-6-50-java-side-dedup/);
});
