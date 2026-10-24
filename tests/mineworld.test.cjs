/* MineWorld portable smoke tests. Run from repository root: node --test tests/mineworld.test.cjs
   No dependencies or internet access; uses original project modules and save contracts. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function load(files){
  const context=vm.createContext({window:{}});
  for(const file of files)vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  return context.window;
}
test('classic textures cover all 169 block IDs and have valid opaque pixels',()=>{
  const w=load(['pixel-materials.js','texture-refinement.js','texture-details.js','texture-polish.js']);
  const paint=w.MineWorldPixelMaterials.paint;
  assert.equal(w.MineWorldTexturePolish.texturePixels,16);
  for(let b=1;b<=169;b++)for(let f=0;f<3;f++)for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const pixel=paint(b,f,x,y);
    assert.equal(pixel.length,4);
    for(const c of pixel)assert.ok(Number.isFinite(c)&&c>=0&&c<=255);
    assert.equal(pixel[3],255);
  }
  const tile=(b,f)=>Array.from({length:16},(_,y)=>Array.from({length:16},(_,x)=>paint(b,f,x,y).join(','))).flat().join('|');
  assert.notEqual(tile(1,0),tile(1,1),'grass top must differ from side');
  assert.notEqual(tile(1,1),tile(2,1),'grass side must differ from dirt');
  assert.notEqual(tile(3,0),tile(4,0),'stone must differ from sand');
  assert.notEqual(tile(11,1),tile(52,1),'different planks require distinct colors');
  assert.notEqual(tile(6,0),tile(41,0),'oak and cherry foliage must be recognizable');
});
test('render settings choose 10–50 bounded 16x16 chunks without duplicates',()=>{
  const w=load(['chunk-planner.js']);
  const p=w.MineWorldChunkPlanner;
  assert.equal(p.limit(-100),10);assert.equal(p.limit(5000),50);
  for(const point of [[300,300],[0,0],[624,624]]){
    for(const n of [10,16,32,50]){
      const set=p.choose(point[0],point[1],n,625,625);
      assert.equal(set.length,n);
      assert.equal(new Set(set.map(c=>c.cx+','+c.cz)).size,n);
      for(const c of set){assert.ok(c.cx>=0&&c.cz>=0&&c.cx<625&&c.cz<625);}
    }
  }
  assert.ok(p.adapt(50,50,15,true)<50,'low iPhone FPS reduces load');
  assert.ok(p.adapt(10,50,60,true)>10,'stable iPhone FPS recovers distance');
});
test('desktop and mobile sprint/sneak obey speed, hunger, hitbox rules',()=>{
  const w=load(['movement-modes.js','survival-hunger.js']);
  const m=w.MineWorldMovement,h=w.MineWorldHunger;
  const walk=m.resolve({forward:1,hunger:20});
  const sprint=m.resolve({forward:1,holdSprint:true,hunger:20});
  const touch=m.resolve({forward:1,toggleSprint:true,hunger:20});
  const crouch=m.resolve({forward:1,toggleCrouch:true,hunger:20});
  assert.ok(sprint.speed>walk.speed);
  assert.equal(touch.speed,sprint.speed);
  assert.ok(crouch.speed<walk.speed);
  assert.equal(crouch.bodyHeight,1.5);
  assert.equal(m.resolve({forward:1,holdSprint:true,hunger:6}).sprinting,false);
  assert.equal(m.resolve({forward:1,holdSprint:true,holdCrouch:true}).sprinting,false);
  assert.equal(m.resolve({forward:1,holdCrouch:true}).eyeHeight,1.27);
  assert.ok(m.sprintHunger(40,true)>m.sprintHunger(40,false));
  const consumed=h.consume(20,5,0,m.sprintHunger(40,true));
  assert.equal(consumed.saturation,4,'running 40 meters costs one saturation point');
});
test('original 64-stacks and legacy save restoration remain intact',()=>{
  const w=load(['stack-inventory.js']);const store=w.MineWorldStackInventory.create(()=>64);
  assert.equal(store.add('stone',130),130);
  assert.deepEqual(Array.from(store.snapshot(),s=>s.qty),[64,64,2]);
  const saved=store.snapshot();
  store.clear();
  store.restore(saved,{stone:130});
  assert.equal(store.count('stone'),130);
  assert.equal(store.take('stone',64,saved[0].id),64);
  assert.equal(store.count('stone'),66);
  store.clear();
  store.restore(null,{stone:130});
  assert.equal(store.snapshot().length,3,'older counter-only saves still migrate to stacks');
});
test('published HTML keeps save keys, controls, renderer wiring and offline cache',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
  for(const name of ['mineworld-selfhost-v1','survivalHotbar','MineWorldMovement.resolve','MineWorldChunkPlanner','touch-sprint-btn','touch-crouch-btn','texture-polish.js','visibleChunkKeys']){
    assert.ok(html.includes(name),name+' missing');
  }
  assert.ok(sw.includes("'./texture-polish.js'"));
  const script=/\<script(?:\s[^>]*)?\>([\s\S]*?)\<\/script\>/gi;let match,count=0;
  while((match=script.exec(html))!==null)if(match[1].trim()){new vm.Script(match[1]);count++;}
  assert.ok(count>=2,'parse inline browser scripts');
});