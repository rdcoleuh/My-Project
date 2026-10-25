/* MineWorld 5.6: test named-world saves, 64x64 skin editing and texel dimensions.
   Run with node --test tests/*.test.cjs; no Minecraft assets. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
  fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const dir=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(dir,name),'utf8');
const PREFIX='mineworld-selfhost-v1';
function storage(initial={}){
 const entries=new Map(Object.entries(initial));
 return {
  getItem:k=>entries.has(k)?entries.get(k):null,
  setItem:(k,v)=>entries.set(k,String(v)),
  removeItem:k=>entries.delete(k),
  entries
 };
}
function worlds(store){
 const context={window:{},console,Math,Date,JSON};
 vm.runInNewContext(read('world-library.js'),context,{filename:'world-library.js'});
 return context.window.MineWorldWorldLibrary.create(store,PREFIX);
}
test('the original Creative and Survival save keys remain byte-for-byte intact',()=>{
 const original=PREFIX+'-slot-creative-v1',legacy=JSON.stringify({seed:991,inventory:[0,5]});
 const old=storage({[original]:legacy,[PREFIX+'-slot-survival-v1']:'another-save'});
 const index=worlds(old);
 assert.equal(index.key('creative'),original);
 assert.equal(index.key('survival'),PREFIX+'-slot-survival-v1');
 assert.equal(index.list('creative').length,1);
 assert.equal(index.list('survival').length,1);
 assert.equal(old.getItem(original),legacy);
});
test('creating, selecting, duplicating, renaming and removing worlds does not overwrite originals',()=>{
 const original=PREFIX+'-slot-survival-v1',old=storage({[original]:'OLD PRIVATE SAVE'});
 const index=worlds(old);
 const a=index.create('survival','Mountains');
 const b=index.create('survival','Island');
 assert.notEqual(a.key,b.key);assert.notEqual(a.key,original);
 old.setItem(a.key,'MOUNTAINS');old.setItem(b.key,'ISLAND');
 index.select('survival',a.id);
 assert.equal(index.key('survival'),a.key);
 index.select('survival',b.id);assert.equal(index.key('survival'),b.key);
 const clone=index.duplicate('survival',a.id);
 assert.equal(old.getItem(clone.key),'MOUNTAINS');
 index.rename('survival',clone.id,'Castle');
 assert.equal(index.list('survival').find(x=>x.id===clone.id).name,'Castle');
 index.remove('survival',a.id);
 assert.equal(old.getItem(a.key),null);
 assert.equal(old.getItem(original),'OLD PRIVATE SAVE');
 const restored=worlds(old);
 assert.equal(restored.list('survival').length,3);
 assert.equal(restored.key('survival'),b.key);
 assert.throws(()=>restored.remove('survival','original'),/Original worlds/);
});
test('world IDs cannot cross modes or be reused to erase protected world slots',()=>{
 const old=storage(),index=worlds(old),extra=index.create('creative','Test');
 assert.throws(()=>index.select('survival',extra.id),/World not found/);
 assert.throws(()=>index.remove('creative','original'),/Original worlds/);
 assert.equal(index.key('creative','original'),PREFIX+'-slot-creative-v1');
 const survivor=worlds(old);
 assert.ok(survivor.list('creative').some(w=>w.id===extra.id));
});
function skinHarness(store){
 const els=new Map();
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.handlers={};this.style={};this.value='';this.width=64;this.height=64;this.files=[];}
  append(...x){this.children.push(...x)}appendChild(x){this.children.push(x);return x}
  addEventListener(k,fn){this.handlers[k]=fn}setAttribute(){}
  getBoundingClientRect(){return {left:0,top:0,width:this.width,height:this.height}}
  setPointerCapture(){}
  click(){}
  getContext(){return {createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){},fillRect(){},strokeRect(){},drawImage(){},getImageData:()=>({data:new Uint8ClampedArray(64*64*4)})}}
 }
 const doc={head:new Element('head'),body:new Element('body'),createElement:t=>new Element(t),
  getElementById:id=>{if(!els.has(id))els.set(id,new Element(id));return els.get(id)},
  addEventListener(){}};
 const win={localStorage:store};
 const context={window:win,document:doc,localStorage:store,Uint8ClampedArray,
  btoa:s=>Buffer.from(s,'binary').toString('base64'),atob:s=>Buffer.from(s,'base64').toString('binary'),confirm:()=>true};
 vm.runInNewContext(read('skin-editor.js'),context,{filename:'skin-editor.js'});
 return {skin:win.MineWorldSkin,els};
}
test('skin editor paints square pixels and persists a 64x64 skin across reloads',()=>{
 const store=storage(),first=skinHarness(store).skin;
 assert.equal(first.pixels.length,64*64*4);
 assert.equal(first.parts.head.front[2],8);
 assert.equal(first.parts.torso.front[3],12);
 assert.equal(first.parts.armL.front[2],4);
 assert.equal(first.paint('head','front',3,3,'#ff1122'),true);
 const p=(11*64+11)*4; // head face starts at x=8,y=8
 assert.deepEqual(Array.from(first.pixels.slice(p,p+4)),[255,17,34,255]);
 assert.equal(first.save(),true);
 const reloaded=skinHarness(store).skin;
 assert.deepEqual(Array.from(reloaded.pixels.slice(p,p+4)),[255,17,34,255]);
 assert.equal(reloaded.paint('head','front',99,99,'#abcdef'),false);
});
test('skin face texels are distinct, nearest-neighbor GPU texture upload is used',()=>{
 const skin=skinHarness(storage()).skin,regions=[];
 for(const part of Object.keys(skin.parts))for(let f=0;f<6;f++){
  const points=Array.from({length:4},(_,i)=>skin.uv(part,f,i));
  for(const [u,v] of points){assert.ok(u>0&&u<1);assert.ok(v>0&&v<1)}
  assert.ok(points[2][0]>points[0][0]);
  assert.ok(points[2][1]>points[0][1]);
  regions.push(points);
 }
 assert.equal(regions.length,36);
 const calls=[];
 const gl={TEXTURE_2D:1,UNPACK_FLIP_Y_WEBGL:2,RGBA:3,UNSIGNED_BYTE:4,
  TEXTURE_WRAP_S:5,TEXTURE_WRAP_T:6,CLAMP_TO_EDGE:7,TEXTURE_MIN_FILTER:8,
  TEXTURE_MAG_FILTER:9,NEAREST:10,createTexture:()=>({}),
  bindTexture(){},pixelStorei(){},texParameteri(...v){calls.push(v)},texImage2D(){calls.push(['upload'])}};
 skin.makeTexture(gl);
 assert.ok(calls.some(v=>v[1]===gl.TEXTURE_MIN_FILTER&&v[2]===gl.NEAREST));
 assert.ok(calls.some(v=>v[0]==='upload'));
});
test('worlds and skin UI files are loaded, full-size block texel density is preserved, and save keys persist',()=>{
 const html=read('index.html'),worker=read('sw.js');
 for(const file of ['world-library.js','world-manager-ui.js','skin-editor.js']){
  assert.ok(html.includes('src="./'+file+'"'),file+' missing from game');
  assert.ok(worker.includes("'./"+file+"'"),file+' missing offline');
 }
 assert.ok(html.includes('worldLibrary.key(mode)'));
 assert.ok(html.includes('worldLibrary.current'));
 assert.ok(html.includes('window.MineWorldSkin.uv'));
 assert.ok(html.includes('pxU=Math.max(1,Math.min(SIZE,Math.round((arguments[3]??1)*SIZE)))'));
 assert.ok(html.includes('sourceCorner=window.MineWorldFaceUV.corner(f.n,v)') &&
     html.includes('originalUV=window.MineWorldAtlas.uv(b,textureFace,sourceCorner,spanU,spanV,0,offsetV,sourceTile)') &&
     html.includes('MineWorldJavaFaceTransforms?.sample('));
 assert.ok(html.includes('gl.NEAREST'));
 assert.ok(html.includes('mineworld-selfhost-v1'));
 assert.ok(html.includes("version:13"));
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new Function(m[1]);
});