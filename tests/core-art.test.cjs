/* MineWorld 6.6 — pixel-art visual invariants for independently authored core blocks. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const scripts=['pixel-materials.js','texture-refinement.js','texture-details.js','texture-polish.js',
 'texture-workshop.js','classic-materials.js','texture-clarity.js','readable-materials.js',
 'texture-fidelity.js','utility-materials.js','core-pixel-art.js','texture-facets.js'];
const ctx={window:{},console};vm.createContext(ctx);
for(const f of scripts)vm.runInContext(read(f),ctx,{filename:f,timeout:30000});
const paint=ctx.window.MineWorldPixelMaterials.paint;
const avg=(id,face,points,channel)=>points.reduce((a,[x,y])=>a+paint(id,face,x,y)[channel],0)/points.length;
const area=(x0,y0,x1,y1)=>{const out=[];for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)out.push([x,y]);return out;};
const signature=(id,face)=>area(0,0,15,15).map(([x,y])=>paint(id,face,x,y).join(',')).join(';');
test('core materials preserve the exact 16x16 texture source grid and unique signatures',()=>{
 const info=ctx.window.MineWorldCorePixelArt;
 assert.equal(info.pixelSize,16);
 assert.ok(info.ids.length>=16);
 assert.equal(ctx.window.MineWorldPixelMaterials.version,info.version);
 for(const id of info.ids)for(let face=0;face<3;face++){
  const pixels=area(0,0,15,15).map(([x,y])=>paint(id,face,x,y));
  assert.equal(pixels.length,256);
  for(const p of pixels)assert.ok(p.length===4&&p.every(v=>Number.isInteger(v)&&v>=0&&v<=255),'Invalid tile '+id);
  assert.equal(signature(id,face),signature(id,face),'Tile must remain stable');
 }
 assert.notEqual(signature(1,0),signature(1,1));
 assert.notEqual(signature(1,1),signature(1,2));
 assert.notEqual(signature(3,1),signature(61,1));
 assert.notEqual(signature(8,1),signature(53,1));
 assert.notEqual(signature(11,1),signature(52,1));
});
test('grass block has green top and green pixel overhang above earth, including face-appropriate dirt bottom',()=>{
 const all=area(0,0,15,15),top=area(0,0,15,3),bottom=area(0,9,15,15);
 assert.ok(avg(1,0,all,1)>avg(1,0,all,0),'Grass top should be greener than red');
 assert.ok(avg(1,1,top,1)>avg(1,1,top,0),'Grass side should have recognisable green top');
 assert.ok(avg(1,1,bottom,0)>avg(1,1,bottom,1),'Dirt should show under grass side');
 assert.ok(avg(1,2,all,0)>avg(1,2,all,1),'Grass underside should remain earth-colored');
});
test('broken cobbles, bricks, planks, and farmland have legible dark pixel seams',()=>{
 const rgb=(id,face,x,y)=>paint(id,face,x,y).slice(0,3).reduce((a,b)=>a+b,0)/3;
 assert.ok(rgb(8,1,0,0)<rgb(8,1,3,2),'Clay brick mortar must be darker than bricks');
 assert.ok(rgb(53,1,0,0)<rgb(53,1,3,2),'Stone brick mortar must be darker than stone bricks');
 const seam=avg(11,1,area(0,0,15,0),0);
 const board=avg(11,1,area(0,2,15,2),0);
 assert.ok(seam<board,'Wood planks require a dark horizontal board seam');
 assert.ok(rgb(61,1,0,0)<rgb(61,1,3,2),'Cobblestones should have separated irregular edges');
 assert.notEqual(signature(137,0),signature(138,0),'Farmland hydration must visibly change top texture');
});
test('renderer loads new material layer before atlas generation, without changing save format',()=>{
 const html=read('index.html'),sw=read('sw.js');
 for(const f of scripts){
  assert.ok(html.includes('src="./'+f+'"'),'Missing painter script '+f);
  assert.ok(sw.includes("'./"+f+"'"),'Missing painter cache entry '+f);
 }
 assert.ok(html.indexOf('src="./utility-materials.js"')<html.indexOf('src="./core-pixel-art.js"'));
 assert.ok(html.includes('MineWorld 6.6'));
 assert.ok(html.includes('mineworld-selfhost-v1'));
 assert.ok(!read('texture-facets.js').includes('fetch('));
 assert.ok(!read('core-pixel-art.js').includes('fetch('),'Original art must not make external asset requests');
});