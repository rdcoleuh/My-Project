const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const window={};vm.runInNewContext(read('hotbar-sprite-uv.js'),{window});
const uv=window.MineWorldHotbarUV;
test('Java hotbar sheet yields nine crisp non-overlapping slot interiors at 1x, 2x and 4x',()=>{
 for(const scale of [1,2,4]){
  const rects=Array.from({length:9},(_,i)=>uv.slotRect(182*scale,22*scale,i));
  for(let i=0;i<9;i++){
   const r=rects[i];
   assert.deepEqual({...r},{x:(1+20*i)*scale,y:scale,width:20*scale,height:20*scale});
   if(i)assert.equal(r.x-(rects[i-1].x+rects[i-1].width),0);
  }
 }
});
test('rejects malformed sprite dimensions and non-bar Bedrock slot images',()=>{
 for(const dims of [[20,20],[180,20],[182,16],[0,0],[182.5,22],[364,40]]){
  assert.equal(uv.slotRect(...dims,0),null,JSON.stringify(dims));
 }
 for(const index of [-1,9,1.5,NaN])assert.equal(uv.slotRect(182,22,index),null);
});
test('resource importer slices a player-owned hotbar image and keeps fallback for incompatible sheets',()=>{
 const source=read('local-resource-pack.js'),html=read('index.html'),sw=read('sw.js');
 assert.ok(source.includes("source.entries.has('hud:hotbar:background')"));
 assert.ok(source.includes('window.MineWorldHotbarUV?.slotRect'));
 assert.ok(source.includes('ctx.drawImage(image,rect.x,rect.y,rect.width,rect.height'));
 assert.ok(html.includes('mw-pack-bar-image'));
 assert.ok(html.includes('mw-pack-hotbar-slots'));
 assert.ok(html.includes('src="./hotbar-sprite-uv.js"'));
 assert.ok(sw.includes("'./hotbar-sprite-uv.js'"));
 assert.ok(html.includes('packGeneration!==window.MineWorldLocalTextures?.generation'));
});
