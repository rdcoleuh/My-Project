'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const window={};vm.runInNewContext(read('hotbar-sprite-uv.js'),{window});
const uv=window.MineWorldHotbarUV;
test('legacy Java widgets atlas crops crisp bar, selection and nine slots at native and HD scales',()=>{
 for(const scale of [1,2,4]){
  const w=256*scale;
  assert.deepEqual({...uv.legacyRect(w,w,'background')},{x:0,y:0,width:182*scale,height:22*scale});
  assert.deepEqual({...uv.legacyRect(w,w,'selected')},{x:0,y:22*scale,width:24*scale,height:24*scale});
  for(let i=0;i<9;i++)assert.deepEqual({...uv.legacyRect(w,w,'slot'+i)},
   {x:(1+20*i)*scale,y:scale,width:20*scale,height:20*scale});
 }
});
test('reject unrelated, non-square and fractional-scale GUI atlases',()=>{
 for(const [w,h] of [[256,128],[182,22],[257,257],[384,384],[0,0],[4097,4097],[NaN,256]])
  assert.equal(uv.legacyRect(w,h,'background'),null);
 for(const kind of ['slot9','slot-1','empty','foo'])
  assert.equal(uv.legacyRect(256,256,kind),null);
});
test('legacy widgets are read locally and modern individual sprites retain priority',()=>{
 const source=read('local-resource-pack.js');
 assert.ok(source.includes("legacyWidgets=relative==='textures/gui/widgets.png'"));
 assert.ok(source.includes("[key,'hud:hotbar:slot','hud:hotbar:background',legacyKey]"));
 assert.ok(source.includes("[key,legacyKey].filter"));
 assert.ok(source.includes("window.MineWorldHotbarUV?.legacyRect"));
 assert.ok(read('scripts/browser-smoke.cjs').includes("'legacy-widgets-hd'"));
});
