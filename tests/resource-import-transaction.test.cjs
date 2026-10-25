/* Regression: failed local texture imports keep the last working sprites/sounds.
 * Resource controls should never be duplicated in the Options screen.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'..','local-resource-pack.js'),'utf8');
class Node {
 constructor(tag='div'){this.tag=tag;this.children=[];this.style={};this.width=256;this.height=1024;}
 append(...nodes){this.children.push(...nodes)}
 appendChild(el){this.children.push(el);return el}
 addEventListener(){}
 setAttribute(){}
 getContext(){return {imageSmoothingEnabled:false,clearRect(){},drawImage(){},
  getImageData(_x,_y,w,h){return {data:new Uint8ClampedArray(w*h*4)};},
  putImageData(){}}}
 toDataURL(){return 'data:image/png;base64,original'}
}
test('Options mounts a single import panel and rejected replacements preserve the current pack',async()=>{
 const options=new Node('options'),clears=[],uploads=[],loaded=new Set(['pickup']);
 const document={createElement:tag=>new Node(tag),
  querySelector:selector=>selector==='#mw-options-screen .mw-settings'?options:null};
 class Image{constructor(){this.width=16;this.height=16;}
  set src(_value){queueMicrotask(()=>this.onload?.());}}
 const gl={TEXTURE0:1,TEXTURE_2D:2,RGBA:3,UNSIGNED_BYTE:4,
  UNPACK_FLIP_Y_WEBGL:5,TEXTURE_MIN_FILTER:6,TEXTURE_MAG_FILTER:7,NEAREST:8,
  activeTexture(){},bindTexture(){},pixelStorei(){},texParameteri(){},
  texImage2D(){uploads.push('write')},isContextLost(){return false}};
 const window={MineWorldResourcePackContext:{gl,texture:{},baseURL:'data:image/png;base64,original'},
  MineWorldAtlas:{dataURL:'data:image/png;base64,original'},
  MineWorldBlockGuide:{names:Array(170).fill('unknown_block')},
  MineWorldSound:{
   clearSamples(types=[]){clears.push([...types]);for(const type of [...loaded])if(!types.includes(type))loaded.delete(type)},
   async loadSound(type){loaded.add(type);return true}
  },
  MineWorldBridge:{refreshTextureUI(){}}};
 const context={window,document,Image,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},
  Blob,Uint8Array,Uint8ClampedArray,ArrayBuffer,DataView,TextDecoder,Math,JSON,Number,
  console,queueMicrotask,performance:{now:()=>0}};
 vm.runInNewContext(source,context);
 assert.equal(options.children.filter(n=>n.className==='mw-local-experiment').length,1,
  'only one Options resource pack selector');
 const api=window.MineWorldLocalTextures;
 const png=Uint8Array.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,16,0,0,0,16]);
 const file=(name,bytes,webkitRelativePath)=>({name,webkitRelativePath,
  size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer});
 const good=await api.loadFiles([file('stone.png',png),
  file('pop.ogg',Uint8Array.from([79,103,103,83]),'sounds/random/pop.ogg')]);
 assert.equal(good.faces,3);
 assert.equal(good.sounds,1);
 assert.equal(api.active,true);
 assert.equal(clears.length,1);
 assert.deepEqual([...loaded],['pickup']);
 const oldTint=api.grassTint,oldResult=api.lastResult,oldUploads=uploads.length;
 await assert.rejects(api.loadFiles([file('not_a_known_block.png',png)]),
  /No compatible block, item or sound files found/);
 assert.equal(api.active,true,'prior texture atlas stays active');
 assert.equal(api.lastResult,oldResult,'previous coverage report stays active');
 assert.equal(uploads.length,oldUploads,'rejected archive never reaches the GPU');
 assert.equal(clears.length,1,'rejected archive cannot erase the previous sound pack');
 assert.deepEqual([...loaded],['pickup']);
 assert.deepEqual(api.grassTint,oldTint,'rejected archive cannot alter biome palette');
});
