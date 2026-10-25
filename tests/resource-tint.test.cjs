/* MineWorld 6.7: locally imported Java greyscale biome tint behavior. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),src=fs.readFileSync(path.join(root,'local-resource-pack.js'),'utf8');
const body=src.match(/function tintNeutralSprite\(ctx,x,y,id,face\)[\s\S]*?(?=\nasync function applyResources)/)?.[0];
if(!body)throw Error('Import tint function missing');
const tint=vm.runInNewContext(body+'\ntintNeutralSprite');
function pixelContext(rgb,alpha=255){
 const state={written:null,w:null,h:null},ctx={
  getImageData(_x,_y,w,h){state.w=w;state.h=h;const data=new Uint8ClampedArray(w*h*4);
   for(let i=0;i<data.length;i+=4)data.set([...rgb,alpha],i);
   return {data,width:w,height:h};},
  putImageData(im){state.written=im.data;}
 };
 return {state,ctx};
}
test('neutral vanilla grass is plains-tinted but preserves its alpha',()=>{
 const a=pixelContext([180,180,180],211);
 assert.equal(tint(a.ctx,0,0,1,0),true);
 assert.ok(a.state.written[1]>a.state.written[0]);
 assert.ok(a.state.written[0]>a.state.written[2]);
 assert.equal(a.state.written[3],211);
 assert.equal(a.state.h,16);
});
test('already-colorized Java resource pack sprites are never recolored',()=>{
 const a=pixelContext([19,151,26],255);
 assert.equal(tint(a.ctx,0,0,1,0),false);
 assert.equal(a.state.written,null);
});
test('vanilla side grass only tints top few pixels, not dirt below',()=>{
 const side=pixelContext([120,120,120]);
 assert.equal(tint(side.ctx,0,0,1,1),true);
 assert.equal(side.state.h,5);
 const dirt=pixelContext([131,87,51]);
 assert.equal(tint(dirt.ctx,0,0,1,1),false);
 assert.equal(dirt.state.written,null);
});
test('neutral leaf assets tint and stone/dirt resource pack art does not',()=>{
 const leaves=pixelContext([180,180,180]);
 assert.equal(tint(leaves.ctx,0,0,6,0),true);
 const soil=pixelContext([180,180,180]);
 assert.equal(tint(soil.ctx,0,0,2,0),false);
});
test('optional tint safely skips low-feature browser canvases',()=>{
 assert.equal(tint({drawImage(){}},0,0,1,0),false);
});
test('resource files stay local, ZIP sprite matching still wired to atlas',()=>{
 new Function(src);
 assert.ok(src.includes('tintNeutralSprite(ctx,column*16,row*16,id,face)'));
 assert.ok(src.includes('async function applyResources(zip,sourceName)'));
 assert.ok(src.includes('window.MineWorldLocalTextures=Object.freeze(exposed)'));
 assert.ok(src.includes('ctx.drawImage(image,0,0,frame,frame,column*16,row*16,16,16)'));
});
