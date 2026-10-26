/* Synthetic skin geometry: imported mob UV crops must land on whole texels. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','entity-texture-maps.js'),'utf8');
function mapper(){const window={};vm.runInNewContext(source,{window});return window.MineWorldEntityTextureMaps;}
test('nonstandard-resolution mob skins crop only complete source pixels',()=>{
 const m=mapper(),img={width:100,height:50};
 for(const kind of Object.keys(m.defs))for(const part of Object.keys(m.defs[kind]))
  for(const face of m.faces){
   const r=m.rect(kind,part,face,img);
   assert.ok(r,`${kind} ${part} ${face}`);
   for(const n of Object.values(r))assert.ok(Number.isInteger(n),`${kind} ${part} ${face} has fractional source UV`);
   assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=img.width&&r.y+r.height<=img.height);
  }
});
test('rounded shared cube-net edges stay contiguous without gaps or overlaps',()=>{
 const m=mapper();
 for(const width of [80,96,100,128,256]){
  const img={width,height:width/2};
  const right=m.rect('cow','head','right',img);
  const front=m.rect('cow','head','front',img);
  const left=m.rect('cow','head','left',img);
  const back=m.rect('cow','head','back',img);
  assert.equal(right.x+right.width,front.x);
  assert.equal(front.x+front.width,left.x);
  assert.equal(left.x+left.width,back.x);
  assert.equal(right.y,front.y);
 }
});
test('native 64px and HD 128px/256px face crops retain exact pixel detail',()=>{
 const m=mapper();
 const normal=m.rect('cow','head','front',{width:64,height:32});
 assert.deepEqual({...normal},{x:6,y:6,width:8,height:8});
 for(const factor of [2,4]){
  const r=m.rect('cow','head','front',{width:64*factor,height:32*factor});
  assert.deepEqual({...r},{x:normal.x*factor,y:normal.y*factor,width:normal.width*factor,height:normal.height*factor});
 }
 assert.equal(m.rect('cow','head','front',{width:100.5,height:50}),null);
 assert.equal(m.rect('cow','head','front',{width:64,height:16}),null);
});
