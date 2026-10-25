/* Java model UV fidelity for partial-height full-width blocks.
 * UV expectations come from Java end_portal_frame and template_farmland JSON.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=n=>fs.readFileSync(path.join(__dirname,'..',n),'utf8');
const html=read('index.html');
const art=html.match(/\/\* MineWorld original procedural 16x16 voxel pixel-art atlas\. No external assets\. \*\/\s*\(\(\) => \{[\s\S]*?\}\)\(\);/);
test('atlas offsets sample the bottom 13 or 15 rows without crossing adjacent tiles',()=>{
 assert.ok(art);
 const window={};vm.runInNewContext(art[0],{window,Math,Uint8ClampedArray});
 const atlas=window.MineWorldAtlas;
 for(const [id,rows,offset] of [[125,13,3],[137,15,1],[138,15,1]]){
  const tile=id*3+1,row=Math.floor(tile/16);
  const top=atlas.uv(id,1,0,1,rows/16,0,offset/16);
  const bottom=atlas.uv(id,1,1,1,rows/16,0,offset/16);
  assert.ok(Math.abs(top[1]-(row*16+offset+.5)/1024)<1e-9);
  assert.ok(Math.abs(bottom[1]-(row*16+15.5)/1024)<1e-9);
  assert.ok(top[1]<bottom[1]);
 }
 assert.deepEqual(atlas.uv(3,1,0),atlas.uv(3,1,0,1,1,0,0));
 assert.deepEqual(atlas.uv(125,0,0),atlas.uv(125,0,0,1,1,0,0),
  'portal-frame top keeps the full 16x16 source PNG');
});
test('mesh builder bottom-aligns only the relevant Java model sides',()=>{
 const match=html.match(/function pushFace\(a,x,y,z,b,f,biomeName=''\)\{[\s\S]*?\n  \}\n  function buildChunkMesh/);
 assert.ok(match);
 const calls=[];
 const shape=id=>({left:0,right:1,bottom:0,top:id===125?13/16:[137,138].includes(id)?15/16:1,front:0,back:1});
 const window={MineWorldAtlas:{alternateFaces:{},uv:(...args)=>{calls.push(args);return [0,0];}},
  MineWorldVillages:{cropAt:()=>null},MineWorldBlockModels:{shape}};
 vm.runInNewContext(read('block-face-uv.js'),{window,Array});
 const fn=vm.runInNewContext(match[0].replace(/\n  function buildChunkMesh$/,'')+'\npushFace',
  {window,dimension:'overworld'});
 const face={n:[0,0,-1],v:[[0,0,0],[0,1,0],[1,1,0],[1,0,0]],shade:1};
 function offsets(id,n=face.n){
  calls.length=0;fn([],0,0,0,id,{...face,n});return [...new Set(calls.map(args=>args[6]))];
 }
 assert.deepEqual(offsets(125),[3/16]);
 assert.deepEqual(offsets(137),[1/16]);
 assert.deepEqual(offsets(138),[1/16]);
 assert.deepEqual(offsets(3),[0]);
 assert.deepEqual(offsets(125,[0,1,0]),[0],'portal-frame top is not cropped vertically');
});
