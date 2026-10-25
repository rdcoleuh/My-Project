/* MineWorld 6.7: texture legibility, 16x16 palette and save-safe masks. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=f=>fs.readFileSync(path.resolve(__dirname,'..',f),'utf8');
const files=['pixel-materials.js','texture-refinement.js','texture-details.js',
 'texture-polish.js','texture-workshop.js','classic-materials.js',
 'texture-clarity.js','readable-materials.js','texture-fidelity.js',
 'utility-materials.js','core-pixel-art.js','texture-facets.js','texture-classic-forms.js'];
const ctx=vm.createContext({window:{},console,Uint8ClampedArray});
for(const f of files)vm.runInContext(read(f),ctx,{filename:f,timeout:30000});
const before=ctx.window.MineWorldPixelMaterials.paint;
const ids=[1,2,3,5,8,11,18,19,20,32,44,53,60,61,72,92,119,120,130,168,
 51,83,84,95,96,97,98,99,100,101,102,103,104,105,106,107,108];
const prior=new Map();
for(const id of ids)prior.set(id,Array.from({length:768},(_,n)=>[...before(id,Math.floor(n/256),n%16,Math.floor(n/16)%16)]));
vm.runInContext(read('texture-precision.js'),ctx,{filename:'texture-precision.js',timeout:30000});
const paint=ctx.window.MineWorldPixelMaterials.paint,meta=ctx.window.MineWorldTexturePrecision;
const face=(id,f)=>Array.from({length:256},(_,n)=>paint(id,f,n%16,n>>4).join(',')).join(';');
const mean=(id,face,x0,y0,x1,y1,channel)=>{
 let sum=0,n=0;
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){sum+=paint(id,face,x,y)[channel];n++;}
 return sum/n;
};
test('every block remains 16x16 with three stable, unique integer RGBA faces',()=>{
 const unique=new Set();
 assert.equal(meta.size,16);assert.ok(meta.alteredIds.length>=34);
 assert.equal(new Set(meta.alteredIds).size,meta.alteredIds.length);
 for(let id=1;id<=169;id++){
  for(let f=0;f<3;f++){
   assert.equal(face(id,f),face(id,f),'Nondeterministic '+id+'/'+f);
   for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const c=paint(id,f,x,y);
    assert.equal(c.length,4);
    assert.ok(c.every(n=>Number.isInteger(n)&&n>=0&&n<=255),'Out-of-range '+id+'/'+f+'/'+x+','+y);
   }
  }
  const s=face(id,1);assert.ok(!unique.has(s),'Repeated side for '+id);unique.add(s);
 }
 assert.equal(unique.size,169);
});
test('refinements actually change target blocks and never erase earlier cutouts',()=>{
 for(const id of ids){
  let different=false;
  const p=prior.get(id);
  for(let n=0;n<768;n++){
   const f=n>>8,x=n%16,y=(n>>4)%16,c=paint(id,f,x,y);
   assert.equal(c[3],p[n][3],'changed transparency on '+id+'/'+f+'/'+x+','+y);
   if(c.join(',')!==p[n].join(','))different=true;
  }
  assert.ok(different,'no visible improvement for material '+id);
 }
 for(const id of [16,17,73,77,82,139,142,143,146,147,150,151,154]){
  // Plants and crop stages still have the previous painter's alpha.
  for(let f=0;f<3;f++)for(let y=0;y<16;y++)for(let x=0;x<16;x++)
   assert.equal(paint(id,f,x,y)[3],before(id,f,x,y)[3]);
 }
});
test('grass, cobblestone, ores, workstations and wood use visible face-specific patterns',()=>{
 assert.ok(mean(1,0,0,0,15,15,1)>mean(1,0,0,0,15,15,0));
 assert.ok(mean(1,1,0,0,15,2,1)>mean(1,1,0,0,15,2,0));
 assert.ok(mean(1,1,0,10,15,15,0)>mean(1,1,0,10,15,15,1));
 assert.notEqual(face(1,0),face(1,1));
 assert.ok(mean(61,1,0,0,15,0,0)<mean(61,1,0,2,15,2,0),'Cobbled mortar is dark');
 assert.ok(mean(11,1,0,0,15,0,0)<mean(11,1,0,2,15,2,0),'Plank seam dark');
 assert.notEqual(face(18,1),face(101,1));
 assert.notEqual(face(99,1),face(107,1));
 assert.notEqual(face(20,0),face(20,1));
 assert.ok(mean(20,1,5,6,10,10,0)<mean(20,1,0,0,1,15,0),'Furnace opening dark');
 assert.notEqual(face(168,0),face(168,1));
 assert.notEqual(face(119,0),face(120,0));
 assert.notEqual(face(44,0),face(44,1));
});
test('load ordering, caching and existing save keys remain intact',()=>{
 const html=read('index.html'),sw=read('sw.js');
 const a=html.indexOf('src="./texture-classic-forms.js"'),b=html.indexOf('src="./texture-precision.js"'),c=html.indexOf('src="./texture-motion.js"');
 assert.ok(a>=0&&a<b&&b<c);
 assert.equal((html.match(/src="\.\/texture-precision\.js"/g)||[]).length,1);
 assert.ok(sw.includes("'./texture-precision.js'"));
 assert.ok(sw.includes('mineworld-6-7-inventory-texture-20261025-v48'));
 for(const marker of ['MineWorld 6.7','mineworld-selfhost-v1','javaInventory:javaInventory.snapshot()','survivalHotbar:[...survivalHotbar]'])assert.ok(html.includes(marker),marker);
});
