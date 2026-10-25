/* MineWorld 6.7 — connected silhouettes and compatibility checks. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const scripts=['pixel-materials.js','texture-refinement.js','texture-details.js',
 'texture-polish.js','texture-workshop.js','classic-materials.js',
 'texture-clarity.js','readable-materials.js','texture-fidelity.js',
 'utility-materials.js','core-pixel-art.js','texture-facets.js'];
const ctx=vm.createContext({window:{},console,Uint8ClampedArray});
for(const s of scripts)vm.runInContext(read(s),ctx,{filename:s,timeout:30000});
const old=ctx.window.MineWorldPixelMaterials.paint;
const previous=new Map();
for(const id of [1,3,5,6,8,9,11,18,19,24,32,41,52,53,61,83,84,92,101,102,121,130,168]){
 const faces=[];
 for(let face=0;face<3;face++)faces.push(Array.from({length:256},(_,i)=>[...old(id,face,i%16,i>>4)]));
 previous.set(id,faces);
}
vm.runInContext(read('texture-classic-forms.js'),ctx,{filename:'texture-classic-forms.js',timeout:30000});
const paint=ctx.window.MineWorldPixelMaterials.paint;
const meta=ctx.window.MineWorldClassicForms;
const tile=(id,face)=>Array.from({length:256},(_,n)=>paint(id,face,n%16,n>>4).join(',')).join(';');
function mean(id,face,x0,y0,x1,y1,ch){
 let sum=0,n=0;
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){sum+=paint(id,face,x,y)[ch];n++;}
 return sum/n;
}
test('all 169 blocks still expose three deterministic 16x16 RGBA faces',()=>{
 const sides=new Set();
 assert.equal(meta.pixelSize,16);
 assert.ok(meta.paintedIds.length>=60);
 assert.equal(new Set(meta.paintedIds).size,meta.paintedIds.length);
 for(let id=1;id<=169;id++){
  for(let face=0;face<3;face++){
   const first=tile(id,face);
   assert.equal(first,tile(id,face),'Determinism '+id+'/'+face);
   for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const c=paint(id,face,x,y);
    assert.equal(c.length,4,'RGBA size');
    assert.ok(c.every(v=>Number.isInteger(v)&&v>=0&&v<=255),'Invalid pixel '+id+'/'+face+'/'+x+','+y);
   }
  }
  const side=tile(id,1);
  assert.ok(!sides.has(side),'Duplicate block side '+id);
  sides.add(side);
 }
 assert.equal(sides.size,169);
});
test('original-style soil, grass, stone and planks have intentional recognisable structure',()=>{
 assert.ok(mean(1,0,0,0,15,15,1)>mean(1,0,0,0,15,15,0),'Grass top is green');
 assert.ok(mean(1,1,0,0,15,2,1)>mean(1,1,0,0,15,2,0),'Grass side has green upper band');
 assert.ok(mean(1,1,0,9,15,15,0)>mean(1,1,0,9,15,15,1),'Grass side lower band is dirt');
 assert.notEqual(tile(1,0),tile(1,1));
 assert.notEqual(tile(1,1),tile(1,2));
 assert.notEqual(tile(3,1),tile(61,1));
 assert.notEqual(tile(8,1),tile(53,1));
 assert.notEqual(tile(11,1),tile(52,1));
 assert.notEqual(tile(24,0),tile(24,1),'Sandstone has carved sides');
 assert.ok(mean(11,1,0,0,15,0,0)<mean(11,1,0,2,15,2,0),'Plank seams must read dark');
 assert.ok(mean(8,1,0,0,15,0,0)<mean(8,1,0,2,15,2,0),'Brick grout must read dark');
});
test('tree species, rock-host ores and unique workstations retain their identities',()=>{
 for(const id of [5,15,30,32,34,36,38,40,42,78,80]){
  assert.notEqual(tile(id,0),tile(id,1),'Bark/ring face distinct '+id);
  assert.notEqual(paint(id,0,8,8).join(','),paint(id,0,0,0).join(','),'Ring center '+id);
 }
 for(const [normal,deep] of [[18,101],[19,102],[95,103],[96,104],[97,105],[98,106],[99,107],[100,108]]){
  assert.notEqual(tile(normal,1),tile(deep,1),'Ore host color '+normal);
  assert.notEqual(tile(normal,1),tile(3,1),'Normal ore is not stone '+normal);
  assert.notEqual(tile(deep,1),tile(58,1),'Deep ore is not deep stone '+deep);
 }
 for(const id of [20,119,120,136,155,156,157,158,159,160,161,162,163,164,165,166,167,168]){
  // Unique workstation faces are intentionally not repainted.
  if(previous.has(id))for(let face=0;face<3;face++)
   for(let i=0;i<256;i++)assert.deepEqual(Array.from(paint(id,face,i%16,i>>4)),previous.get(id)[face][i]);
 }
 assert.equal(tile(9,1)===tile(22,1),false,'Glass and ice stay visibly different');
});
test('crop and foliage transparency, render script order, offline cache and saves remain intact',()=>{
 for(const id of [6,12,31,33,41,43,79,81]){
  const before=previous.get(id);
  if(!before)continue;
  for(let f=0;f<3;f++)for(let n=0;n<256;n++)
   assert.equal(paint(id,f,n%16,n>>4)[3],before[f][n][3],'Foliage transparency changed '+id);
 }
 for(const stage of [139,143,147,151]){
  const young=Array.from({length:256},(_,i)=>paint(stage,1,i%16,i>>4));
  const ripe=Array.from({length:256},(_,i)=>paint(stage+3,1,i%16,i>>4));
  assert.ok(young.some(c=>c[3]===0));
  assert.ok(ripe.filter(c=>c[3]!==0).length>young.filter(c=>c[3]!==0).length);
 }
 const html=read('index.html'),sw=read('sw.js');
 assert.ok(html.indexOf('src="./texture-facets.js"')<html.indexOf('src="./texture-classic-forms.js"'));
 assert.ok(html.indexOf('src="./texture-classic-forms.js"')<html.indexOf('src="./texture-motion.js"'));
 assert.equal((html.match(/src="\.\/texture-classic-forms\.js"/g)||[]).length,1);
 assert.ok(sw.includes("'./texture-classic-forms.js'"));
 assert.ok(sw.includes('mineworld-6-7-inventory-texture-20261025-v49'));
 assert.ok(html.includes('mineworld-selfhost-v1'));
 assert.ok(html.includes('MineWorld 6.7'));
 assert.ok(!read('texture-classic-forms.js').includes('fetch('));
});
