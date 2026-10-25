/* Minecraft Wiki-guided inventory icons and dropped item appearance.
 * Tests use synthetic texture values, never original Minecraft artwork.
 */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
function visuals(){
 const context={window:{},Math,Number,Object,Array};
 vm.runInNewContext(read('dropped-item-visuals.js'),context);
 return context.window.MineWorldDroppedVisuals;
}
test('Java dropped item stacks appear as 1 to 5 mini models',()=>{
 const d=visuals();
 for(const [count,number] of [[1,1],[2,2],[16,2],[17,3],[32,3],
  [33,4],[48,4],[49,5],[64,5]])assert.equal(d.copies(count),number);
 const a={x:2,y:1,z:3,count:56},first=d.pose(a,0);
 assert.equal(first.count,5);
 assert.ok(first.bob>=.0625&&first.bob<=.2625);
 assert.ok(Math.abs(d.pose(a,1).angle-first.angle-1)<1e-8,'one radian per second');
 assert.deepEqual({...d.offset(0,a)},{x:0,y:0,z:0});
 assert.deepEqual({...d.offset(1,a)},{...d.offset(1,a)},'no jitter between frames');
});
test('nearby items merge without exceeding max stack size or crossing dimensions',()=>{
 const d=visuals(),drops=[
  {key:'block:3',count:41,x:3,y:2,z:4,age:120,delay:0,dimension:'overworld'},
  {key:'block:3',count:29,x:3.2,y:2,z:4,age:22,delay:.3,dimension:'overworld'},
  {key:'block:3',count:2,x:3.1,y:2,z:4,age:60,dimension:'nether'},
  {key:'apple',count:8,x:3,y:2,z:4,age:0,dimension:'overworld'}
 ];
 const merged=d.mergeNearby(drops,key=>key==='apple'?16:64);
 assert.equal(merged,0,'a partially consumed source still remains');
 assert.equal(drops[0].count,64);
 assert.equal(drops[1].count,6);
 assert.equal(drops[0].age,22);
 assert.equal(drops[0].delay,.3);
 assert.equal(drops[2].count,2);
 assert.equal(drops[3].count,8);
 drops[1].count=1;drops[0].count=63;
 assert.equal(d.mergeNearby(drops,()=>64),1);
 assert.equal(drops.some(drop=>drop.count===0),false);
});
test('Java block thumbnails render distinct sharp top, left and right faces',()=>{
 const context={window:{MineWorldPixelMaterials:{paint:(_id,face)=>[
  face===0?240:120,face===0?200:125,face===0?100:140,255]}}};
 class MockCtx{
  constructor(){this.drawn=null;this.imageSmoothingEnabled=true;}
  createImageData(w,h){return {width:w,height:h,data:new Uint8ClampedArray(w*h*4)}}
  putImageData(image){this.drawn=image}
  clearRect(){}
  getImageData(x,y,w,h){return this.drawn||this.createImageData(w,h)}
 }
 class Canvas{
  constructor(){this.width=32;this.height=32;this.ctx=new MockCtx();}
  getContext(){return this.ctx;}
 }
 context.document={createElement:()=>new Canvas()};
 context.Number=Number;context.Math=Math;context.Uint8ClampedArray=Uint8ClampedArray;
 vm.runInNewContext(read('block-item-icons.js'),context);
 const out=new Canvas();
 assert.equal(context.window.MineWorldBlockItemIcons.paint(out,3),true);
 assert.equal(out.width,32);
 const img=out.ctx.drawn.data;
 const sample=(x,y)=>[...img.slice((y*32+x)*4,(y*32+x)*4+4)];
 const top=sample(16,9),left=sample(9,19),right=sample(23,19);
 assert.equal(top[3],255);
 assert.equal(left[3],255);
 assert.equal(right[3],255);
 assert.ok(top[0]>left[0]&&left[0]>right[0],'distinct face shading');
 assert.equal(context.window.MineWorldBlockItemIcons.paint(out,-1),false);
});
test('world mining emits collectible items, not automatic pickup; UI uses authentic slot layout',()=>{
 const html=read('index.html'),ui=read('java-inventory-ui.js');
 const sw=read('sw.js'),visuals=read('dropped-item-visuals.js');
 assert.ok(html.includes('function dropMinedResource(key,qty,x,y,z)'));
 assert.ok(html.includes("dropMinedResource('block:'+found,1,target.x,target.y,target.z)"));
 assert.ok(html.includes('window.MineWorldDroppedVisuals.mergeNearby(droppedItems,stackLimit)'));
 assert.ok(html.includes('visuals.pose(drop,dayClock)'));
 assert.ok(html.includes('window.MineWorldAtlas.uv(b,faceIndex,corner)'));
 assert.ok(html.includes('window.MineWorldFaceUV.corner(face.n,v)'));
 assert.ok(ui.includes('for(let i=0;i<27;i++)slot('));
 assert.ok(ui.includes('for(let i=0;i<9;i++)slot('));
 assert.ok(ui.includes("slot(util,'offhand','Offhand')"));
 assert.ok(ui.includes("const craftWorkspace=doc.getElementById('craft-workspace')"));
 assert.ok(html.includes("Inventory Crafting · 2 × 2"));
 assert.ok(ui.includes('MineWorldBlockItemIcons?.paint('));
 assert.ok(sw.includes("'./dropped-item-visuals.js'"));
 assert.ok(sw.includes("'./block-item-icons.js'"));
 assert.ok(visuals.includes('function mergeNearby'));
 assert.ok(html.includes('mineworld-selfhost-v1'));
});
