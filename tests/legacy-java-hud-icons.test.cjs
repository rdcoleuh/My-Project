'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const window={};
vm.runInNewContext(read('hotbar-sprite-uv.js'),{window});
const uv=window.MineWorldHotbarUV;
test('legacy Java icons atlas crops full, half and empty health/hunger at native and HD scales',()=>{
 for(const scale of [1,2,4]){
  const size=256*scale;
  for(const kind of ['heart','food']){
   for(const [fill,x] of [['empty',16],['full',52],['half',61]]){
    assert.deepEqual({...uv.legacyStatRect(size,size,kind,fill)},
     {x:x*scale,y:(kind==='food'?27:0)*scale,width:9*scale,height:9*scale});
   }
  }
 }
});
test('legacy stat atlas rejects unsupported dimensions and invalid sprite names',()=>{
 for(const [w,h] of [[0,0],[255,255],[384,384],[256,128],[4097,4097],[NaN,256]]){
  assert.equal(uv.legacyStatRect(w,h,'heart','full'),null);
 }
 for(const [kind,fill] of [['health','full'],['heart','selected'],['food','slot0']]){
  assert.equal(uv.legacyStatRect(256,256,kind,fill),null);
 }
});
test('legacy icons ZIP import preserves modern sprite precedence and composited underlay',()=>{
 const source=read('local-resource-pack.js');
 assert.ok(source.includes("legacyIcons=relative==='textures/gui/icons.png'"));
 assert.ok(source.includes("keep('hud:legacy-icons'"));
 assert.ok(source.includes("source.entries.has('hud:legacy-icons')"));
 assert.ok(source.includes("legacyStat?'hud:legacy-icons'"));
 assert.ok(source.includes("legacyStatRect(image.width,image.height,kind,'empty')"));
 assert.ok(source.includes('if(legacyStat&&fill!==\'empty\')'));
 assert.ok(read('scripts/browser-smoke.cjs').includes("'legacy-icons-hd'"));
});
