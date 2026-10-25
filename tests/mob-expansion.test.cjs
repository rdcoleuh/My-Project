/* Independent mobile-safe expanded mob catalog and procedural models. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const ctx={window:{},console};vm.createContext(ctx);
vm.runInContext(read('mob-expansion.js'),ctx,{filename:'mob-expansion.js'});
const mobs=ctx.window.MineWorldMobExpansion;
test('Wiki reviewed catalog provides >=55 additional species with distinct playable definitions',()=>{
 assert.ok(mobs.count>=55);
 assert.equal(mobs.count,Object.keys(mobs.catalog).length);
 for(const kind of ['allay','armadillo','axolotl','bee','camel_husk','copper_golem',
   'creaking','drowned','guardian','iron_golem','nautilus','parched','phantom',
   'pufferfish','ravager','sniffer','snow_golem','tropical_fish','warden','witch','zombie_nautilus']){
  const m=mobs.catalog[kind];
  assert.ok(m,kind+' missing');
  assert.ok(m.hp>0&&m.hp<=40,'mob network HP guard incompatible: '+kind);
  assert.ok(['passive','neutral','hostile','boss'].includes(m.kind));
  assert.ok(m.speed>0&&Number.isFinite(m.speed));
  assert.equal(m.body.length,3);
  assert.ok(m.body.every(n=>n>=0&&n<=1));
 }
 assert.equal(mobs.catalog.bee.kind,'neutral');
 assert.equal(mobs.catalog.warden.kind,'hostile');
 assert.equal(mobs.catalog.snow_golem.kind,'passive');
});
test('every new mob has an original block model within budget and finite color/position',()=>{
 for(const [kind,m] of Object.entries(mobs.catalog)){
  const parts=[];
  const okay=mobs.draw({id:1,kind,x:5000,y:16,z:5000},(...args)=>parts.push(args),4);
  assert.equal(okay,true,'missing model: '+kind);
  assert.ok(parts.length>=3&&parts.length<=55,kind+' geometry budget');
  for(const p of parts){
   assert.equal(p.length,7,kind);
   assert.ok(p.slice(0,6).every(Number.isFinite),kind+' nonfinite geometry');
   assert.ok(p[3]>0&&p[4]>0&&p[5]>0,kind+' nonpositive cuboid');
   assert.equal(p[6].length,3);
   assert.ok(p[6].every(c=>Number.isFinite(c)&&c>=0&&c<=1),kind+' invalid color');
  }
 }
 assert.equal(mobs.draw({kind:'unknown',x:0,y:0,z:0},()=>{}),false);
});
test('new mobs obey region filters and swimming tags',()=>{
 assert.equal(mobs.pickBiome('Swamp',0), 'frog');
 assert.equal(mobs.pickBiome('Desert',0), 'rabbit');
 assert.equal(mobs.pickBiome('Savanna',0), 'armadillo');
 assert.equal(mobs.pickBiome('Mushroom Fields',0), 'mooshroom');
 assert.equal(mobs.pickBiome('Swamp',0,true), 'bogged');
 assert.equal(mobs.pickBiome('Snowy Plains',0,true), 'stray');
 assert.equal(mobs.pickBiome('Open Ocean',0),null);
 assert.equal(mobs.isAquatic('cod'),true);
 assert.equal(mobs.isAquatic('guardian'),true);
 assert.equal(mobs.isAquatic('cow'),false);
 assert.equal(mobs.eligible('rabbit','Desert'),true);
 assert.equal(mobs.eligible('frog','Desert'),false);
});
test('creatures integrate with real game rendering, sampling, safe spawns and old world saves',()=>{
 const html=read('index.html'),sw=read('sw.js');
 assert.ok(html.includes('src="./mob-expansion.js"'));
 assert.ok(sw.includes("'./mob-expansion.js'"));
 for(const fragment of ['Object.assign(SPECIES,extraMobs.catalog)','extraMobs?.draw(m,',
   'window.MineWorldMobExpansion','extraMobs.pickBiome(biome',
   'extraMobs?.isAquatic(kind)','window.MineWorldMobBridge=Object.freeze',
   'mineworld-selfhost-v1']){
  assert.ok(html.includes(fragment),'missing integration: '+fragment);
 }
 assert.ok(!read('mob-expansion.js').includes('textures/entity/'),'No copied vanilla mob texture assets');
});
