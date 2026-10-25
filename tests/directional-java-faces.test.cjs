/* Verify that MineWorld uses spare atlas slots for real Java workstation sides. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const art=html.match(/\/\* MineWorld original procedural 16x16 voxel pixel-art atlas\. No external assets\. \*\/\s*\(\(\) => \{[\s\S]*?\}\)\(\);/);
test('ten directional sprites have stable unique atlas slots outside the 507 normal block faces',()=>{
  assert.ok(art,'standalone atlas module is present');
  const window={};
  vm.runInNewContext(art[0],{window,Math,Uint8ClampedArray});
  const atlas=window.MineWorldAtlas;
  const extras=Object.entries(atlas.alternateFaces);
  assert.equal(extras.length,10);
  assert.deepEqual(extras.map(([,v])=>v.tile).sort((a,b)=>a-b),[0,1,2,510,511,512,513,514,515,516]);
  const names=Object.fromEntries(extras.map(([id,v])=>[id,v.name]));
  assert.equal(names[20],'furnace_side');
  assert.equal(names[156],'blast_furnace_side');
  assert.equal(names[157],'smoker_side');
  assert.equal(names[158],'cartography_table_side2');
  assert.equal(names[168],'crafting_table_side');
  assert.equal(names[136],'smithing_table_side');
  assert.equal(names[161],'fletching_table_side');
  assert.equal(names[163],'lectern_sides');
  assert.equal(names[165],'loom_side');
  assert.equal(names[166],'smithing_table_side');
  assert.equal(atlas.alternateFaces[158].extra.name,'cartography_table_side3');
  assert.equal(atlas.alternateFaces[158].extra.tile,517);
  assert.ok(html.includes('COLUMNS=16, ROWS=64'),'extra sprites must fit the expanded atlas');
  assert.notDeepEqual(atlas.uv(20,1,0),atlas.uv(20,3,0));
  assert.notDeepEqual(atlas.uv(168,1,0),atlas.uv(168,3,0));
  for(const id of [136,161,163,165,166])assert.notDeepEqual(atlas.uv(id,1,0),atlas.uv(id,3,0));
  assert.notDeepEqual(atlas.uv(158,3,0),atlas.uv(158,4,0),'third cartography side has its own tile');
  assert.deepEqual(atlas.uv(3,1,0),atlas.uv(3,3,0),'ordinary block sides remain unchanged');
});
test('furnaces use their front only on +Z, while worktables have distinct X-axis sides',()=>{
  const match=html.match(/function pushFace\(a,x,y,z,b,f,biomeName=''\)\{[\s\S]*?\n  \}\n  function buildChunkMesh/);
  assert.ok(match,'mesh face builder is present');
  const faces=[];
  const window={
    MineWorldAtlas:{alternateFaces:{20:{tile:0},156:{tile:1},157:{tile:2},168:{tile:510,sideAxis:'x'},158:{tile:511,sideAxis:'x',extra:{tile:517,name:'cartography_table_side3'}},136:{tile:512,sideAxis:'x'},161:{tile:513,sideAxis:'x'},163:{tile:514,sideAxis:'x'},165:{tile:515,sideAxis:'x'},166:{tile:516,sideAxis:'x'}},
      uv:(block,face)=>{faces.push({block,face});return [0,0];}},
    MineWorldVillages:{cropAt:()=>null},
    MineWorldBlockModels:{shape:()=>({left:0,right:1,bottom:0,top:1,front:0,back:1})}
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','block-face-uv.js'),'utf8'),{window,Array});
  const fn=vm.runInNewContext(match[0].replace(/\n  function buildChunkMesh$/,'')+'\npushFace',
    {window,dimension:'overworld'});
  const vertices=[[0,0,0],[0,1,0],[1,1,0],[1,0,0]];
  function selected(block,n){faces.length=0;fn([],0,0,0,block,{n,v:vertices,shade:1});return [...new Set(faces.map(f=>f.face))];}
  assert.deepEqual(selected(20,[0,0,1]),[1]);
  assert.deepEqual(selected(20,[0,0,-1]),[3]);
  assert.deepEqual(selected(20,[1,0,0]),[3]);
  assert.deepEqual(selected(168,[1,0,0]),[3]);
  assert.deepEqual(selected(168,[0,0,1]),[1]);
  assert.deepEqual(selected(168,[-1,0,0]),[1],'Java west crafting face is front');
  assert.deepEqual(selected(168,[0,0,-1]),[3],'Java south crafting face is side');
  for(const id of [136,161,163,165,166]){
    assert.deepEqual(selected(id,[1,0,0]),[3],id+' uses side texture on X axis');
    assert.deepEqual(selected(id,[0,0,1]),[1],id+' retains front texture on +Z');
  }
  assert.deepEqual(selected(158,[-1,0,0]),[3]);
  assert.deepEqual(selected(158,[1,0,0]),[4]);
  assert.deepEqual(selected(158,[0,0,1]),[4]);
  assert.deepEqual(selected(158,[0,0,-1]),[1]);
  assert.deepEqual(selected(3,[1,0,0]),[1]);
  assert.deepEqual(selected(20,[0,1,0]),[0]);
});
test('importer retains 507 ordinary faces and imports up to ten extra workstation sides from player PNGs',()=>{
  const pack=fs.readFileSync(path.join(__dirname,'..','local-resource-pack.js'),'utf8');
  assert.match(pack,/Object\.entries\(window\.MineWorldAtlas\?\.alternateFaces\|\|\{\}\)/);
  assert.match(pack,/const image=await sprite\(variant\.name\)/);
  assert.match(pack,/for\(const \[variantIndex,variant\] of \[extra,extra\.extra\]\.entries\(\)\)/);
  assert.match(pack,/if\(faces\|\|directionalFaces\|\|modelDirectionalFaces\|\|state\.active\)await writeAtlas\(finalCanvas\)/);
  assert.match(pack,/totalFaces:169\*3/);
  assert.match(pack,/atlasH=1024/);
  assert.equal(atlasTestBottom(pack,158,2),'dark_oak_planks');
  assert.equal(atlasTestBottom(pack,161,2),'birch_planks');
  assert.match(pack,/state\.active=faces\+directionalFaces\+modelDirectionalFaces>0/);
});
function atlasTestBottom(source,id,face){
  const m=source.match(new RegExp('bind\\('+id+",'[^']+','[^']+','([^']+)'\\)"));
  return m&&face===2?m[1]:null;
}
