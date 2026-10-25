/* MineWorld 6.8: original vanilla grass-block texture layer assembly.
 * Tests blending of the actual user-supplied overlay, with no asset files in repo.
 */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'..','local-resource-pack.js'),'utf8');
const region=src.match(/function tintOverlayPixels\(data,tint\)[\s\S]*?(?=\nasync function applyResources)/)?.[0];
if(!region)throw Error('Vanilla overlay compositor not found');
function setup(pixel){
 const image={width:16,height:16},record={calls:[],modified:null};
 const alpha=new Uint8ClampedArray(16*16*4);
 for(let i=0;i<alpha.length;i+=4)alpha.set(pixel,i);
 const scratch={
  imageSmoothingEnabled:true,
  clearRect(...a){record.calls.push(['clear',...a])},
  drawImage(...a){record.calls.push(['scratchDraw',...a])},
  getImageData(){return {data:alpha.slice()}},
  putImageData(d){record.modified=d.data.slice()}
 };
 const scratchCanvas={width:0,height:0,getContext:()=>scratch};
 const doc={createElement:()=>scratchCanvas};
 const context={document:doc,Uint8ClampedArray};
 const {tintOverlayPixels,composeGrassSideOverlay}=vm.runInNewContext(
  'const state={tint:{grass:[145,189,89],foliage:[119,171,47]}};\n'+region+
  '\n({tintOverlayPixels,composeGrassSideOverlay})',context);
 const destination={drawImage(...args){record.calls.push(['overlay',...args])}};
 return {record,image,context,destination,tintOverlayPixels,composeGrassSideOverlay};
}
test('neutral grayscale vanilla grass overlay becomes green, retains alpha',()=>{
 const g=setup([190,190,190,128]);
 const data=new Uint8ClampedArray([190,190,190,128,0,0,0,0]);
 assert.equal(g.tintOverlayPixels(data,[145,189,89]),true);
 assert.ok(data[1]>data[0]&&data[0]>data[2]);
 assert.equal(data[3],128);
 assert.deepEqual([...data.slice(4,8)],[0,0,0,0]);
});
test('colored texture packs remain unchanged, preserving supplied exact pixels',()=>{
 const g=setup([201,47,28,255]),data=new Uint8ClampedArray([201,47,28,255]);
 assert.equal(g.tintOverlayPixels(data,[145,189,89]),false);
 assert.deepEqual([...data],[201,47,28,255]);
});
test('grass side composites overlay after drawing base without recoloring dirt base',()=>{
 const g=setup([180,180,180,170]);
 assert.equal(g.composeGrassSideOverlay(g.destination,g.image,64,128),true);
 assert.equal(g.record.calls.filter(c=>c[0]==='overlay').length,1);
 assert.ok(g.record.modified);
 assert.equal(g.record.modified[3],170);
 assert.ok(g.record.modified[1]>g.record.modified[0]);
 assert.deepEqual(g.record.calls.filter(c=>c[0]==='overlay')[0].slice(2),[64,128]);
});
test('importer searches actual vanilla side overlay independent of base and never bundles images',()=>{
 assert.ok(src.includes("sprite('grass_block_side_overlay')"));
 assert.ok(src.includes("const grassSide=id===1&&face===1"));
 assert.ok(src.includes("ctx.drawImage(image,0,0,frame,frame,px,py,16,16)"));
 assert.ok(src.includes("composeGrassSideOverlay(ctx,overlay,px,py,firstFrame(overlayInfo),firstFrame(overlayInfo),0,overlayInfo?.geometry,importedTints.palette)"),
  'Java grass overlay must be composited with animation frame geometry');
 assert.ok(src.includes('if(image||overlay){')&&src.includes('faces++;ids.add(id);importedFaces.add(id*3+face);'));
 assert.ok(src.includes('readArchive(await file.arrayBuffer())'));
});
