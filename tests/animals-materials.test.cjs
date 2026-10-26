/* MineWorld 6.0: Wiki-informed independent animals, 16px materials and save integration. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const m={window:{},console};vm.createContext(m);
vm.runInContext(read('animal-models.js'),m);
vm.runInContext(read('animal-behavior.js'),m);
const A=m.window.MineWorldAnimalModels,B=m.window.MineWorldAnimalBehavior;
test('model library has original scaled cattle, sheep, chickens, pigs and four mount body types',()=>{
 for(const [kind,h] of [['cow',1.4],['sheep',1.3],['chicken',.7],['pig',.9],['horse',1.6],['camel',2.375]]){
   assert.ok(A.MODELS[kind],kind);
   assert.equal(A.MODELS[kind].height,h);
 }
 assert.equal(Object.keys(A.MODELS).length,11);
 const sizes={};
 for(const kind of Object.keys(A.MODELS)){
  const xyz=[];
  const result=A.draw({id:1,kind,x:5000,y:18,z:5000,heading:.5},(...numbers)=>{
    assert.equal(numbers.length,9);
    for(const n of numbers.slice(0,6))assert.ok(Number.isFinite(n),'invalid '+kind);
    const validParts=kind==='chicken'?
      ['body','head','leg','wing','beak','comb','eye','wattle','tail']:
      ['body','head','leg','snout','ear','eye','nostril','tail','wool','muzzle','horn','udder','patch'];
    assert.ok(validParts.includes(numbers[6]),'unknown cuboid part '+kind);
    assert.ok(['front','back','top','bottom','left','right'].includes(numbers[7]));
    assert.ok(Number.isInteger(numbers[8])&&numbers[8]>=0&&numbers[8]<=3);
    xyz.push(numbers[1]);
  });
  assert.ok(result>0);
  sizes[kind]=xyz.length;
  assert.ok(xyz.length<4500,'animal is too complex for mobile: '+kind);
 }
 assert.ok(sizes.chicken<sizes.cow);
 assert.ok(A.MODELS.camel.height>A.MODELS.pig.height);
 const unsheared=A.draw({id:1,kind:'sheep',x:5,y:5,z:5},()=>{});
 const sheared=A.draw({id:1,kind:'sheep',x:5,y:5,z:5,sheared:true},()=>{});
 assert.ok(unsheared>sheared,'shearing should remove wool tufts');
});
test('animal detail geometry preserves facial accents and wool when importing skin maps',()=>{
 const expected={
  pig:['snout','ear','eye','nostril','tail'],
  cow:['muzzle','horn','eye','udder','ear','patch'],
  sheep:['wool','muzzle','eye','tail']
 };
 for(const [kind,parts] of Object.entries(expected)){
  const seen=new Map();
  A.draw({kind,id:2,x:5,y:6,z:5,heading:0},(x,y,z,r,g,b,part)=>{
   if(!seen.has(part))seen.set(part,[r,g,b]);
  });
  for(const part of parts){
   assert.ok(seen.has(part),kind+' missing '+part);
   assert.ok(seen.get(part).some(v=>v<.95),kind+' '+part+' must retain original tint');
  }
 }
});
test('biome appropriate animals spawn; undead mounts no longer occur in farms',()=>{
 assert.deepEqual(Array.from(B.NATURAL),['cow','sheep','pig','chicken','horse','donkey','llama','camel']);
 assert.equal(B.pickNatural('Desert',123),'camel');
 for(let n=0;n<200;n++){
  const horse=B.pickNatural('Plains',n),forest=B.pickNatural('Forest',n);
  assert.ok(!['skeleton_horse','zombie_horse'].includes(horse));
  assert.ok(!['skeleton_horse','zombie_horse','camel'].includes(forest));
 }
 assert.equal(B.habitat('llama','Mountains'),true);
 assert.equal(B.habitat('cow','Frozen Ocean'),false);
});
test('animal food, breeding, following and fleeing depend on the species',()=>{
 assert.equal(B.edible('cow','wheat'),true);
 assert.equal(B.edible('chicken','wheatSeeds'),true);
 assert.equal(B.edible('pig','carrot'),true);
 assert.equal(B.edible('camel','block:44'),true);
 assert.equal(B.edible('llama','block:60'),true);
 assert.equal(B.edible('cow','carrot'),false);
 assert.equal(B.following('pig','carrot',5),true);
 assert.equal(B.following('pig','carrot',10),false);
 const a={kind:'sheep',id:1,foodKey:'wheat',loveTime:25},b={kind:'sheep',id:2,loveTime:10};
 assert.equal(B.canBreed(a,b),true);
 assert.equal(B.canBreed(a,{...b,baby:true}),false);
 const flee=B.reactionAfterHit({x:10,z:5},8,5);
 assert.equal(flee.fleeTime,5);
 assert.equal(flee.heading,0);
});
test('all 169 original block materials stay valid, distinct, and 16px after the clarity upgrade',()=>{
 const ctx={window:{},console};vm.createContext(ctx);
 for(const p of ['pixel-materials.js','texture-refinement.js','texture-details.js',
   'texture-polish.js','texture-workshop.js','classic-materials.js','texture-clarity.js']){
  vm.runInContext(read(p),ctx,{filename:p});
 }
 const p=ctx.window.MineWorldPixelMaterials.paint,seen=new Map();
 for(let block=1;block<=169;block++){
  let signature='';
  for(let face=0;face<3;face++)for(let y=0;y<16;y++)for(let x=0;x<16;x++){
    const rgba=p(block,face,x,y);
    assert.equal(rgba.length,4,'block '+block);
    assert.ok(rgba.every(c=>Number.isInteger(c)&&c>=0&&c<=255),'invalid RGBA block '+block);
    if(face===1)signature+=rgba.join(',')+';';
  }
  assert.ok(!seen.has(signature),'same side art for '+seen.get(signature)+' and '+block);
  seen.set(signature,block);
 }
 assert.equal(seen.size,169);
 assert.ok(ctx.window.MineWorldTextureClarity.ids.includes(168));
 assert.equal(ctx.window.MineWorldTextureClarity.pixelSize,16);
 const grassSide=Array.from({length:16},(_,y)=>p(1,1,5,y).slice(0,3).join(','));
 assert.ok(new Set(grassSide).size>5,'grass top side must visibly transition to dirt');
});
test('browser game wires animals, audio, feeding, world saves and original clarity layer',()=>{
 const html=read('index.html'),sw=read('sw.js');
 for(const script of ['animal-models.js','animal-behavior.js','texture-clarity.js']){
  assert.ok(html.includes('src="./'+script+'"'),script+' missing from page');
  assert.ok(sw.includes("'./"+script+"'"),script+' missing from offline cache');
 }
 for(const marker of [
  'animalModels.draw(m,','animals.pickNatural(biome','function interactFarmAnimal(m)',
  "emitAdvancement('breed',m.kind)","m.sheared=true","snapshotFarmAnimals():preservedFarmAnimals",
  "Array.isArray(s.farmAnimals)","m.fleeTime>0","m.growTimer",
  'advancements:advancementEngine.snapshot()',"mineworld-selfhost-v1"
 ]){
  assert.ok(html.includes(marker),'missing gameplay hook '+marker);
 }
 assert.ok(/MineWorld \d+\.\d+/.test(html));
 for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
  if(match[1].trim())assert.doesNotThrow(()=>new Function(match[1]));
});