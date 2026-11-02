'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const context={window:{},Uint8ClampedArray};
vm.runInNewContext(read('hotbar-sprite-uv.js'),context);
const uv=context.window.MineWorldHotbarUV;
function cropPixels(rgba,size,rect){
 const out=new Uint8ClampedArray(rect.width*rect.height*4);
 for(let y=0;y<rect.height;y++)for(let x=0;x<rect.width;x++){
  const from=((rect.y+y)*size+rect.x+x)*4;
  out.set(rgba.subarray(from,from+4),(y*rect.width+x)*4);
 }
 return out;
}
test('opaque unrelated atlas pixels cannot make a transparent heart or food cell visible',()=>{
 for(const size of [256,512]){
  const atlas=new Uint8ClampedArray(size*size*4);
  atlas[3]=255; // Unrelated opaque pixel outside every survival sprite.
  assert.equal(uv.hasVisibleAlpha(atlas),true);
  for(const kind of ['heart','food'])for(const fill of ['full','half','empty']){
   const rect=uv.legacyStatRect(size,size,kind,fill);
   assert.equal(uv.hasVisibleAlpha(cropPixels(atlas,size,rect)),false,kind+':'+fill);
   const at=((rect.y+Math.floor(rect.height/2))*size+rect.x)*4+3;
   atlas[at]=255;
   assert.equal(uv.hasVisibleAlpha(cropPixels(atlas,size,rect)),true,kind+':'+fill);
   atlas[at]=0;
  }
 }
});
test('legacy icon importer checks alpha in cropped cell and browser smoke exercises fallback',()=>{
 const source=read('local-resource-pack.js'),smoke=read('scripts/browser-smoke.cjs');
 assert.match(source,/if\(!rect\|\|!visibleCandidate\(image,rect\)\)return null;/);
 assert.ok(smoke.includes("makeTestArchive('transparent-legacy-icons')"));
 assert.ok(smoke.includes('mobile-transparent-legacy-icons.png'));
 assert.ok(smoke.includes('desktop-transparent-legacy-icons.png'));
 assert.ok(smoke.includes("icons.every(icon=>icon===null)"));
});
