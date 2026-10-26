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

test('large Bedrock terrain maps preserve late water, lava and leaf paths including optional .png',()=>{
 const b=terrainAPI(),texture_data={};
 for(let i=0;i<700;i++)
  texture_data['unused_'+i]={textures:'textures/blocks/custom/other_'+i};
 texture_data.still_water_grey={textures:'textures/blocks/custom/late_water.png'};
 texture_data.flowing_lava={textures:{path:'textures/blocks/custom/late_lava.png'}};
 texture_data.oak_leaves={textures:'textures/blocks/foliage/late_leaves.png'};
 const map=b.terrain(JSON.stringify({texture_data}));
 assert.equal(map.size,703,'atlas entries beyond the old 512-entry limit are retained');
 assert.equal(map.get('still_water_grey'),'block:custom/late_water');
 assert.equal(map.get('flowing_lava'),'block:custom/late_lava');
 assert.equal(map.get('oak_leaves'),'block:foliage/late_leaves');
 assert.equal(b.terrain('x'.repeat(1024*1024+1)).size,0,
  'oversized untrusted terrain definitions remain bounded');
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
 assert.match(sw,/const VERSION='mineworld-[^']+'/,
  'offline cache remains versioned after unrelated feature updates');
 assert.ok(sw.includes("'./bedrock-flipbook.js'"),
  'Bedrock terrain parser remains available offline');
 assert.doesNotMatch(read('bedrock-flipbook.js'),/fetch\(|localStorage|indexedDB/);
});

function largeBedrockTerrain(){
 const texture_data={};
 for(let i=0;i<3400;i++)texture_data['unused_'+i]={textures:'textures/blocks/nested/long_custom_terrain_entry_'+i};
 const names=['still_water_grey','flowing_water_grey','still_lava','flowing_lava','oak_leaves'];
 for(const n of names)texture_data[n]={textures:'textures/blocks/custom/'+n};
 const json=Buffer.from(JSON.stringify({texture_data}));
 assert.ok(json.length>256*1024&&json.length<1024*1024,'exercise the former 256 KiB cutoff');
 return {json,names};
}
function storedBedrockZip(entries){
 const local=[],central=[];let offset=0;
 for(const [name,payload] of entries){
  const n=Buffer.from(name),bytes=Buffer.from(payload);
  const lh=Buffer.alloc(30+n.length),ch=Buffer.alloc(46+n.length);
  lh.writeUInt32LE(0x04034b50,0);lh.writeUInt16LE(20,4);
  lh.writeUInt32LE(bytes.length,18);lh.writeUInt32LE(bytes.length,22);
  lh.writeUInt16LE(n.length,26);n.copy(lh,30);
  ch.writeUInt32LE(0x02014b50,0);ch.writeUInt16LE(20,4);ch.writeUInt16LE(20,6);
  ch.writeUInt32LE(bytes.length,20);ch.writeUInt32LE(bytes.length,24);
  ch.writeUInt16LE(n.length,28);ch.writeUInt32LE(offset,42);n.copy(ch,46);
  local.push(lh,bytes);central.push(ch);offset+=lh.length+bytes.length;
 }
 const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);
 end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);
 end.writeUInt32LE(central.reduce((s,x)=>s+x.length,0),12);end.writeUInt32LE(offset,16);
 return Uint8Array.from(Buffer.concat([...local,...central,end])).buffer;
}
test('large Bedrock terrain metadata imports late water/lava/leaves from both folders and ZIP',async()=>{
 const {json,names}=largeBedrockTerrain();
 const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,16,0,0,0,16]);
 const entries=[['textures/terrain_texture.json',json],
  ...names.map(n=>['textures/blocks/custom/'+n+'.png',png])];
 const file=([name,bytes])=>({name:name.split('/').at(-1),webkitRelativePath:'MyPack/'+name,
  size:bytes.length,async arrayBuffer(){return Uint8Array.from(bytes).buffer;}});
 const folder=importer();
 const folderResult=await folder.pack.loadFiles(entries.map(file));
 assert.equal(folderResult.bedrockTerrainMappings,3405);
 for(const id of [7,66,6])for(const face of [0,1,2])
  assert.equal(folder.pack.hasImportedFace(id,face),true,'folder face '+id+':'+face);
 await folder.pack.clear();
 const archive=storedBedrockZip(entries),zipped=importer();
 assert.ok(zipped.pack.inspectZip(archive).includes('bedrock:terrain'),
  'ZIP screening must retain terrain JSON above 256 KiB');
 const result=await zipped.pack.loadFile({name:'MyPack.mcpack',async arrayBuffer(){return archive;}});
 assert.equal(result.bedrockTerrainMappings,3405);
 for(const id of [7,66,6])for(const face of [0,1,2])
  assert.equal(zipped.pack.hasImportedFace(id,face),true,'ZIP face '+id+':'+face);
 await zipped.pack.clear();
});
