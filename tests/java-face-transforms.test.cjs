/* Java Edition per-face UV / rotation import, original synthetic fixtures only. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const enc=x=>Uint8Array.from(Buffer.from(JSON.stringify(x)));
function resolver(){const window={};vm.runInNewContext(read('java-model-faces.js'),{window,TextDecoder,JSON,Object,Set});return window.MineWorldJavaModelFaces;}
function zip(a){const entries=new Map(Object.entries(a));return {entries,get:async k=>entries.get(k)||null};}
function transform(){
 const window={};vm.runInNewContext(read('java-face-transforms.js'),{window});return window.MineWorldJavaFaceTransforms;
}
test('Java model resolver retains clockwise face rotation, cropped UV and flipped axes',async()=>{
 const cube={elements:[{from:[0,0,0],to:[16,16,16],faces:{
  up:{texture:'#all',rotation:180},
  north:{texture:'#all',rotation:90,uv:[2,1,14,15]},
  west:{texture:'#all',rotation:270,uv:[16,16,0,0]},
  south:{texture:'#all',rotation:45,uv:[0,0,16,16]},
  down:{texture:'#all',uv:[0,0,16,0]}
 }}],textures:{all:'minecraft:block/stone'}};
 const result=await resolver().resolve(zip({'model:stone':enc(cube),'block:stone':Uint8Array.from([1])}),'stone');
 assert.equal(result.faceUV.up.rotation,180);
 assert.equal(result.faceUV.north.rotation,90);
 assert.equal(JSON.stringify(result.faceUV.north.uv),'[2,1,14,15]');
 assert.equal(result.faceUV.west.rotation,270);
 assert.equal(result.faceUV.south,undefined,'unsupported face rotation is ignored');
});
test('UV mapping rotates pixels clockwise and preserves exact source texel crops',()=>{
 const a=transform();
 assert.equal(a.commit(new Map([[3,{north:{rotation:90,uv:[2,1,14,15]}}]])),1);
 const calls=[];const atlas={uv(...p){calls.push(p);return [p[2],p[3],p[4],p[5],p[6]];}};
 const sampled=a.sample(3,[0,0,-1],0,atlas,1,520,[-1]);
 assert.equal(sampled[0],1,'top-left samples bottom-left after 90° clockwise');
 assert.ok(Math.abs(calls[0][3]-.75)<1e-8);
 assert.ok(Math.abs(calls[0][4]-.875)<1e-8);
 assert.ok(Math.abs(calls[0][5]-.125)<1e-8);
 assert.ok(Math.abs(calls[0][6]-.0625)<1e-8);
 assert.equal(calls[0][7],520,'directional tile is retained');
 assert.deepEqual(a.sample(3,[0,1,0],0,atlas,0,null,[9]),[9]);
});
test('UV flips and malformed metadata cannot corrupt other block textures',()=>{
 const api=transform(),tiles=new Map([[5,{
  up:{rotation:0,uv:[16,0,0,16]},
  south:{rotation:0,uv:[0,16,16,0]},
  west:{rotation:45,uv:[0,0,16,16]},
  east:{rotation:90,uv:[1,1,1,14]}
 }]]);
 api.commit(tiles);
 assert.equal(api.stats().faces,2);
 const atlas={uv:(...v)=>v};
 assert.equal(api.sample(5,[0,1,0],0,atlas,0,null,null)[2],3);
 assert.equal(api.sample(5,[0,0,1],0,atlas,1,null,null)[2],1);
 api.commit(new Map());
 assert.equal(api.stats().faces,0);
 assert.equal(api.sample(5,[0,1,0],0,atlas,0,null,'fallback'),'fallback');
});
test('imported face UV module is cached, wired into the renderer, and never updates world saves',()=>{
 const html=read('index.html'),sw=read('sw.js'),pack=read('local-resource-pack.js');
 assert.match(html,/java-face-transforms\.js/);
 assert.match(html,/MineWorldJavaFaceTransforms\?\.sample/);
 assert.match(pack,/MineWorldJavaFaceTransforms\?\.commit\(modelTransforms\)/);
 assert.match(pack,/MineWorldJavaFaceTransforms\?\.commit\(new Map\(\)\)/);
 assert.match(sw,/java-face-transforms\.js/);
 assert.doesNotMatch(read('java-face-transforms.js'),/localStorage|fetch\(|texImage2D/);
 assert.match(html,/mineworld-selfhost-v1/);
});