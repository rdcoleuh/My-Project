/* Synthetic Bedrock terrain_texture.json fixtures; no licensed bitmaps. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
function terrainAPI(){
 const window={};vm.runInNewContext(read('bedrock-flipbook.js'),{window});
 return window.MineWorldBedrockFlipbooks;
}
test('Bedrock terrain map resolves local nested water, lava and foliage sprites',()=>{
 const b=terrainAPI();
 const map=b.terrain(JSON.stringify({texture_data:{
  still_water_grey:{textures:'textures/blocks/custom/clear_water'},
  flowing_water_grey:{textures:{path:'textures/blocks/custom/stream'}},
  still_lava:{textures:['textures/blocks/custom/magma_still']},
  oak_leaves:{textures:[{path:'textures/blocks/foliage/leaf_a'}]}
 }}));
 assert.equal(map.get('still_water_grey'),'block:custom/clear_water');
 assert.equal(map.get('flowing_water_grey'),'block:custom/stream');
 assert.equal(map.get('still_lava'),'block:custom/magma_still');
 assert.equal(map.get('oak_leaves'),'block:foliage/leaf_a');
});
test('malformed and remote Bedrock terrain paths never escape local pack',()=>{
 const b=terrainAPI();
 assert.equal(b.terrain('{bad').size,0);
 assert.equal(b.terrain('x'.repeat(300000)).size,0);
 const map=b.terrain(JSON.stringify({texture_data:{
  evil:{textures:'https://example.com/stone'},
  mod:{textures:'assets/othermod/textures/blocks/stone'},
  traversal:{textures:'textures/blocks/../stone'},
  safe:{textures:['https://example.com/bad',{path:'textures/blocks/custom/safe'}]},
  invalid:{textures:[{path:'textures/items/diamond'}]}
 }}));
 assert.equal(map.size,1);
 assert.equal(map.get('safe'),'block:custom/safe');
});
function importer(){
 const draws=[];
 class Canvas{
  constructor(){this.width=256;this.height=1024;}
  getContext(){return {imageSmoothingEnabled:false,globalAlpha:1,clearRect(){},
   drawImage(...args){draws.push(args);},
   getImageData(_x,_y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},
   putImageData(){}};}
  toDataURL(){return 'data:image/png;base64,fixture';}
 }
 class Image{
  constructor(){this.width=16;this.height=16;}
  set src(_){queueMicrotask(()=>this.onload?.());}
 }
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,
  UNPACK_FLIP_Y_WEBGL:5,TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
  activeTexture(){},bindTexture(){},pixelStorei(){},texParameteri(){},
  texImage2D(){},isContextLost(){return false;}};
 const window={MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,fixture'},
  MineWorldAtlas:{dataURL:'data:image/png;base64,fixture'},
  MineWorldBlockGuide:{names:Array(170).fill('unused')},
  MineWorldSound:{clearSamples(){}},MineWorldBridge:{refreshTextureUI(){}}};
 const context={window,document:{createElement:()=>new Canvas(),querySelector:()=>null},
  Image,URL:{createObjectURL:()=> 'blob:synthetic',revokeObjectURL(){}},Blob,
  Uint8Array,Uint8ClampedArray,ArrayBuffer,DataView,TextDecoder,Math,JSON,Number,
  console,queueMicrotask,performance:{now:()=>0}};
 vm.runInNewContext(read('bedrock-flipbook.js'),context);
 vm.runInNewContext(read('local-resource-pack.js'),context);
 return {pack:window.MineWorldLocalTextures,draws};
}
test('folder importer paints nested Bedrock water/lava/leaves via terrain atlas aliases',async()=>{
 const {pack,draws}=importer();
 const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,16,0,0,0,16]);
 const table={texture_data:{
  still_water_grey:{textures:'textures/blocks/custom/water_surface'},
  flowing_water_grey:{textures:'textures/blocks/custom/water_side'},
  still_lava:{textures:'textures/blocks/custom/lava_surface'},
  flowing_lava:{textures:'textures/blocks/custom/lava_side'},
  oak_leaves:{textures:'textures/blocks/foliage/leaf_alpha'}
 }};
 const json=Uint8Array.from(Buffer.from(JSON.stringify(table)));
 const file=(name,bytes)=>({name:name.split('/').at(-1),webkitRelativePath:'MyPack/'+name,
  size:bytes.length,async arrayBuffer(){return Uint8Array.from(bytes).buffer;}});
 const files=[file('textures/terrain_texture.json',json),
  ...['custom/water_surface','custom/water_side','custom/lava_surface',
      'custom/lava_side','foliage/leaf_alpha'].map(n=>file('textures/blocks/'+n+'.png',png))];
 const result=await pack.loadFiles(files);
 assert.equal(result.bedrockTerrainMappings,5);
 for(const id of [7,66,6])for(const face of [0,1,2])
  assert.equal(pack.hasImportedFace(id,face),true,'imported '+id+' face '+face);
 assert.ok(draws.length>=10,'five local sprite paths are painted on the atlas');
 assert.equal(result.worldItemSprites,0,'no unrelated item imports');
 await pack.clear();
});
test('Bedrock terrain map stays optional and does not change saved world formats',()=>{
 const src=read('local-resource-pack.js'),sw=read('sw.js');
 assert.match(src,/keep\('bedrock:terrain'/);
 assert.match(src,/zip\.get\('bedrock:terrain'\)/);
 assert.match(src,/spriteKeys\(name\)/);
 assert.match(sw,/bedrock-terrain-map-20261026/);
 assert.doesNotMatch(read('bedrock-flipbook.js'),/fetch\(|localStorage|indexedDB/);
});
