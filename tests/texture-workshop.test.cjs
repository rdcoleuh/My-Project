/* MineWorld 5.3 — run with: node --test tests/texture-workshop.test.cjs
   Zero dependencies; verifies procedural art and compatibility contracts. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function load(files,window={}){
 const context=vm.createContext({window,console});
 for(const file of files)vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
 return window;
}
test('all 169 block side faces are unique original 16px patterns',()=>{
 const w=load(['pixel-materials.js','texture-refinement.js','texture-details.js','texture-polish.js','texture-workshop.js']);
 const seen=new Set();
 for(let id=1;id<=169;id++){
  let key='';
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){
   const c=w.MineWorldPixelMaterials.paint(id,1,x,y);
   assert.equal(c.length,4);
   assert.ok(c.every(n=>Number.isFinite(n)&&n>=0&&n<=255));
   assert.equal(c[3],255);
   key+=c.join(',')+';';
  }
  assert.ok(!seen.has(key),'block '+id+' repeats a prior side texture');
  seen.add(key);
 }
 assert.equal(seen.size,169);
});
test('atlas animations upload only 16x16 tile regions, respect low FPS',()=>{
 const w=load(['texture-motion.js'],{MineWorldPixelMaterials:{paint:(id,face,x,y)=>[x*12,y*12,id,255]}});
 const uploads=[];
 const gl={
   TEXTURE_2D:3553,UNPACK_FLIP_Y_WEBGL:37440,RGBA:6408,UNSIGNED_BYTE:5121,
   bindTexture(){},pixelStorei(){},isContextLost(){return false},
   texSubImage2D(...args){uploads.push(args);}
 };
 const texture={};
 w.MineWorldTextureMotion.update(gl,texture,1000,60,false);
 assert.equal(uploads.length,24,'eight 3-face animated desktop blocks');
 for(const args of uploads){
   assert.equal(args[4],16);assert.equal(args[5],16);
   assert.equal(args[8].length,1024);
   assert.ok(args[2]>=0&&args[3]>=0&&args[2]+16<=256&&args[3]+16<=512);
 }
 w.MineWorldTextureMotion.update(gl,texture,1010,60,false);
 assert.equal(uploads.length,24,'uploads are frame-throttled');
 w.MineWorldTextureMotion.update(gl,texture,5000,12,true);
 assert.equal(uploads.length,30,'iPhone in slow mode animates only two fluids');
});
test('block model dimensions stay within voxel and preserve original ID map',()=>{
 const w=load(['block-models.js']);
 const m=w.MineWorldBlockModels;
 assert.equal(m.texturePixels,16);
 assert.equal(m.normalBlockMeters,1);
 for(let id=1;id<=169;id++){
  const s=m.shape(id);
  assert.ok(s.left>=0&&s.right<=1&&s.top<=1&&s.bottom>=0);
  assert.ok(s.right>s.left&&s.top>s.bottom&&s.back>s.front);
 }
 assert.equal(m.shape(137).top,15/16,'farmland is 15 pixels tall');
 assert.equal(m.shape(70).top,14/16,'soul sand is 14 pixels tall');
 assert.equal(m.shape(169).top,9/16,'single-bed approximation');
});
test('existing save keys, movement, and offline files remain unchanged',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const worker=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 for(const name of ["mineworld-selfhost-v1","MineWorldChunkPlanner","MineWorldMovement.resolve","survivalHotbar","stack-inventory.js","texture-workshop.js","texture-motion.js","block-guide.js"]){
  assert.ok(html.includes(name),name+' missing');
 }
 for(const file of ["texture-workshop.js","texture-motion.js","block-guide.js"]){
  assert.ok(worker.includes("'./"+file+"'"),file+' absent from offline cache');
 }
 assert.equal((html.match(/src="\.\/texture-polish\.js"/g)||[]).length,1,'no duplicate texture loader');
});
