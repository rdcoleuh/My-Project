/* MineWorld 6.13: partial Java resource packs preserve independent animations. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
function setup(){
 const uploads=[],painted=[];
 const window={MineWorldPixelMaterials:{paint:(id,face,x,y)=>{
  painted.push([id,face]);return [x+id,y+face,90];
 }}};
 const gl={
  TEXTURE_2D:1,UNPACK_FLIP_Y_WEBGL:2,RGBA:3,UNSIGNED_BYTE:4,
  bindTexture(){},pixelStorei(){},
  texSubImage2D(_target,_level,x,y,w,h,_format,_type,pixels){
   uploads.push({x,y,w,h,alpha:pixels[3]});
  },
  isContextLost:()=>false
 };
 vm.runInNewContext(read('texture-motion.js'),{window,Uint8Array,Math,Number,console});
 return {uploads,painted,gl,motion:window.MineWorldTextureMotion};
}
const tile=(id,face)=>({x:((id*3+face)%16)*16,y:Math.floor((id*3+face)/16)*16});
test('imported Java faces are skipped while unmatched water/lava/portal faces still move',()=>{
 const {uploads,painted,gl,motion}=setup();
 const waterTop=tile(7,0),lavaSide=tile(66,1);
 motion.update(gl,{},1000,60,false,(id,face)=>(id===7&&face===0)||(id===66&&face===1));
 assert.equal(uploads.length,22,'Only two of the 24 procedural faces should be skipped');
 assert.ok(!uploads.some(v=>v.x===waterTop.x&&v.y===waterTop.y));
 assert.ok(!uploads.some(v=>v.x===lavaSide.x&&v.y===lavaSide.y));
 assert.ok(uploads.some(v=>v.x===tile(7,1).x&&v.y===tile(7,1).y));
 assert.ok(uploads.some(v=>v.x===tile(87,0).x&&v.y===tile(87,0).y));
 assert.ok(painted.every(([id,face])=>!(id===7&&face===0)&&!(id===66&&face===1)));
 assert.ok(uploads.every(v=>v.alpha===255&&v.w===16&&v.h===16));
});
test('without local pack, all original animated tiles remain active',()=>{
 const {uploads,gl,motion}=setup();
 motion.update(gl,{},1000,60,false);
 assert.equal(uploads.length,24);
 assert.equal(motion.status().disabled,false);
});
test('partial resource-pack integration tracks imported faces and clears on reset',()=>{
 const html=read('index.html'),pack=read('local-resource-pack.js');
 assert.ok(html.includes('localPack?.active?localPack.hasImportedFace:null'));
 assert.ok(html.includes('if(localPack?.active)localPack.updateAnimation(t,currentFPS,isTouch)'));
 assert.ok(pack.includes('importedFaces.add(id*3+face)'));
 assert.ok(pack.includes('state.importedFaces=importedFaces'));
 assert.ok(pack.includes('state.importedFaces=new Set()'));
 assert.ok(pack.includes('hasImportedFace(id,face)'));
 assert.ok(pack.includes('if(image||overlay){')&&pack.includes('faces++;ids.add(id);importedFaces.add(id*3+face);'));
});
