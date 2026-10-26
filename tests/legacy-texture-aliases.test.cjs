/* Regression: player-owned pre-1.13 Java block PNG names map to MineWorld.
 * No Minecraft texture data is bundled or fetched by this test.
 */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),src=fs.readFileSync(path.join(root,'local-resource-pack.js'),'utf8');
const PNG=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,16,0,0,0,16]);
async function importer(){
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,
  UNPACK_FLIP_Y_WEBGL:5,TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
  activeTexture(){},bindTexture(){},pixelStorei(){},texImage2D(){},texParameteri(){},isContextLost(){return false;}};
 class Canvas{
  constructor(){this.width=16;this.height=16;}
  getContext(){return {imageSmoothingEnabled:false,globalAlpha:1,clearRect(){},drawImage(){},
    getImageData(_x,_y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},putImageData(){}};}
  toDataURL(){return 'data:image/png;base64,original';}
 }
 class Image{
  constructor(){this.width=16;this.height=16;}
  set src(_value){queueMicrotask(()=>this.onload?.());}
 }
 const window={
  MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,original'},
  MineWorldAtlas:{dataURL:'data:image/png;base64,original'},
  MineWorldBlockGuide:{names:Array(170).fill('unknown_block')},
  MineWorldSound:{clearSamples(){}},
  MineWorldBridge:{refreshTextureUI(){}}
 };
 vm.runInNewContext(src,{window,document:{createElement:()=>new Canvas(),querySelector:()=>null},
  Image,URL:{createObjectURL:()=> 'blob:mock',revokeObjectURL(){}},Blob,
  Uint8Array,Uint8ClampedArray,TextDecoder,ArrayBuffer,DataView,Math,Number,
  JSON,console,performance:{now:()=>0},queueMicrotask},{filename:'local-resource-pack.js'});
 return window.MineWorldLocalTextures;
}
function png(name){return {name:name+'.png',size:PNG.length,
 arrayBuffer:async()=>Uint8Array.from(PNG).buffer};}
test('older Java Edition filenames replace the expected block atlas faces',async()=>{
 const pack=await importer();
 const files=['workbench_top','workbench_front','furnace_front_off','hardened_clay',
  'sand_red','dirt_podzol_top','quartz_ore','crops_7','mushroom_block_skin_red',
  'ice_packed','portal','end_bricks','farmland_wet','prismarine_rough'].map(png);
 const result=await pack.loadFiles(files);
 assert.ok(result.faces>=25,'legacy pack must map many independent faces');
 const missing=new Set(result.missingFaces.map(f=>f.id+':'+f.face));
 for(const [id,face] of [[168,0],[168,1],[20,1],[25,0],[26,1],
  [28,0],[83,0],[142,0],[48,0],[23,0],[87,0],[130,0],[138,0],[55,0]]){
  assert.equal(missing.has(id+':'+face),false,'Missing legacy sprite for '+id+':'+face);
 }
 assert.equal(result.faces+result.missingFaces.length,507);
 await pack.clear();
 assert.equal(pack.active,false);
});
test('canonical Java sprite names are still preferred and no images are bundled',()=>{
 const position=src.indexOf('function spriteKeys(name)');
 const code=src.slice(position,position+400);
 assert.ok(code.includes('const keys=[name,...(aliases[name]||[])]')&&
   code.indexOf('candidates.push(key)')<code.indexOf('candidates.push(mapped)'),
  'canonical names must take precedence over historical and terrain aliases');
 assert.ok(src.includes("red_bed_top"),'fictional bed should not inherit wool');
 assert.ok(src.includes("poplar_log"),'fictional poplar should not inherit oak');
 assert.ok(!src.includes('data:image/png;base64,iVBOR'),'no embedded Mojang images');
});
