/* MineWorld 6.5: full-palette painter regression and save-safe texture coverage. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const scripts=['pixel-materials.js','texture-refinement.js','texture-details.js',
 'texture-polish.js','texture-workshop.js','classic-materials.js',
 'texture-clarity.js','readable-materials.js','texture-fidelity.js',
 'utility-materials.js','core-pixel-art.js'];
const scope=vm.createContext({window:{},console,Uint8ClampedArray});
for(const file of scripts)vm.runInContext(read(file),scope,{filename:file,timeout:30000});
const before=scope.window.MineWorldPixelMaterials.paint;
const baseline=new Map();
for(let id=1;id<=169;id++){
 const pixels=[];
 for(let f=0;f<3;f++)for(let y=0;y<16;y++)for(let x=0;x<16;x++)pixels.push([...before(id,f,x,y)]);
 baseline.set(id,pixels);
}
vm.runInContext(read('texture-facets.js'),scope,{filename:'texture-facets.js',timeout:30000});
const w=scope.window,paint=w.MineWorldPixelMaterials.paint;
const key=(id,face)=>Array.from({length:256},(_,n)=>paint(id,face,n%16,n>>4).join(',')).join(';');
test('every one of 169 blocks receives valid deterministic 16-pixel face refinements',()=>{
 const info=w.MineWorldTextureFacets;
 assert.equal(info.pixelsPerFace,16);
 assert.equal(info.coveredIds.length,169);
 assert.equal(info.originalAssetsUsed,false);
 assert.equal(new Set(info.coveredIds).size,169);
 const seen=new Set();
 for(let id=1;id<=169;id++){
  const expected=baseline.get(id);
  let changed=false;
  for(let i=0;i<expected.length;i++){
   const face=Math.floor(i/256),n=i%256,x=n%16,y=n>>4;
   const actual=paint(id,face,x,y),old=expected[i];
   assert.equal(actual.length,4,'RGBA '+id);
   for(const v of actual)assert.ok(Number.isInteger(v)&&v>=0&&v<=255,'Invalid pixel '+id);
   assert.equal(actual[3],old[3],'Alpha transparency changed for '+id);
   if(actual.some((v,j)=>j<3&&v!==old[j]))changed=true;
  }
  assert.ok(changed,'No visible 16px detail change for block '+id);
  const side=key(id,1);
  assert.ok(!seen.has(side),'Duplicate material side '+id);
  seen.add(side);
 }
 assert.equal(seen.size,169);
});
test('face-specific silhouettes, crisp materials and crop cutouts survive latest pass',()=>{
 for(const id of [5,15,30,32,34,36,38,40,42,78,80])
  assert.notEqual(key(id,0),key(id,1),'Log rings/bark mismatch '+id);
 assert.notEqual(key(1,0),key(1,1),'Grass still has a green top');
 assert.notEqual(key(1,1),key(1,2),'Grass still has a dirt underside');
 assert.notEqual(key(11,1),key(52,1),'Pale and dark wood remain distinct');
 assert.notEqual(key(18,1),key(101,1),'Deep ores keep darker stone hosts');
 assert.notEqual(key(137,0),key(138,0),'Wet farmland stays visually distinct');
 assert.notEqual(key(9,1),key(22,1),'Glass and ice are distinct');
 for(const start of [139,143,147,151]){
  const young=Array.from({length:256},(_,i)=>paint(start,1,i%16,i>>4));
  const grown=Array.from({length:256},(_,i)=>paint(start+3,1,i%16,i>>4));
  assert.ok(young.some(v=>v[3]===0)&&grown.some(v=>v[3]===0),'Crop cutouts '+start);
  assert.ok(grown.filter(v=>v[3]!==0).length>young.filter(v=>v[3]!==0).length,'Crop growth '+start);
 }
});
test('renderer and service worker load layer once, last in artwork stack',()=>{
 const html=read('index.html'),sw=read('sw.js');
 assert.equal((html.match(/src="\.\/texture-facets\.js"/g)||[]).length,1);
 assert.ok(html.indexOf('src="./core-pixel-art.js"')<html.indexOf('src="./texture-facets.js"'));
 assert.ok(html.indexOf('src="./texture-facets.js"')<html.indexOf('src="./texture-motion.js"'));
 assert.ok(sw.includes("'./texture-facets.js'"));
 assert.ok(sw.includes('mineworld-6-5-classic-forms-20261024-v45'));
 assert.ok(html.includes('MineWorld 6.5'));
 assert.ok(html.includes('mineworld-selfhost-v1'));
 assert.ok(!read('texture-facets.js').includes('fetch('));
 assert.equal(w.MineWorldTextureFacets.family(5),'bark');
 assert.equal(w.MineWorldTextureFacets.family(41),'leaves');
 assert.equal(w.MineWorldTextureFacets.family(101),'ore');
});
