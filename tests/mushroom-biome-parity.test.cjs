/* Biome spawn parity: no ordinary livestock or natural hostile spawns on mushroom islands. */
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const ctx={window:{}};vm.createContext(ctx);
for(const file of ['animal-behavior.js','mob-ai-rules.js'])vm.runInContext(read(file),ctx,{filename:file});
const animals=ctx.window.MineWorldAnimalBehavior,mobs=ctx.window.MineWorldMobAIRules;
test('mushroom fields spawn mooshrooms rather than ordinary farm animals',()=>{
 for(const biome of ['Mushroom Fields','mushroom_fields','Mushroom Island']){
  for(let seed=0;seed<30;seed++)assert.equal(animals.pickNatural(biome,seed),'mooshroom');
  for(const kind of ['cow','sheep','pig','chicken','horse','donkey','llama','camel'])
   assert.equal(animals.habitat(kind,biome),false,kind+' in '+biome);
 }
 assert.equal(animals.pickNatural('Desert',123),'camel');
 assert.ok(['cow','sheep','pig','chicken','horse','donkey'].includes(animals.pickNatural('Plains',2)));
});
test('mushroom fields block natural hostile spawns without disabling other biomes',()=>{
 for(const biome of ['Mushroom Fields','mushroom_fields','MUSHROOM ISLAND'])
  assert.equal(mobs.naturalHostileAllowed(biome),false);
 for(const biome of ['Plains','Desert','Forest','Nether Wastes',''])
  assert.equal(mobs.naturalHostileAllowed(biome),true);
 const html=read('index.html');
 assert.ok(html.includes("if(dimension==='overworld'&&!mobAI.naturalHostileAllowed("),
   'host simulation must check biome before choosing natural hostile mobs');
 assert.ok(html.includes("spawnOne(special||animals.pickNatural(biome"),
   'natural passive spawns must use the mooshroom-aware picker');
 assert.ok(html.includes('window.MineWorldMobBridge'),
   'creative summon path must remain available');
});
