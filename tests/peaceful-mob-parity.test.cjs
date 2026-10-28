/* Peaceful-difficulty parity: hostile despawns, neutral exceptions and dragon safety. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const context={window:{}};vm.runInNewContext(read('mob-ai-rules.js'),context);
const rules=context.window.MineWorldMobAIRules;

test('peaceful removes hostiles and selected neutral monsters but preserves harmless End residents',()=>{
 for(const [kind,category] of [['zombie','hostile'],['creeper','hostile'],['blaze','hostile'],
   ['wither','boss'],['hoglin','hostile'],['spider','neutral'],['cave_spider','neutral'],
   ['enderman','neutral'],['zombified_piglin','neutral']]){
   assert.equal(rules.peacefulDisposition(kind,category),'despawn',kind);
 }
 for(const [kind,category] of [['ender_dragon','boss'],['shulker','hostile'],
   ['piglin','neutral'],['cow','passive'],['sheep','passive'],['bee','neutral']]){
   assert.equal(rules.peacefulDisposition(kind,category),'passive',kind);
 }
 assert.equal(rules.peacefulDisposition('', 'hostile'),'despawn');
 assert.equal(rules.peacefulDisposition(null,'hostile'),'despawn');
 assert.equal(rules.peacefulDisposition('warden','hostile'),'despawn');
});

test('changing to peaceful immediately removes monsters without deleting dragon, shulker, piglin or livestock',()=>{
 const html=read('index.html');
 const start=html.indexOf('function setDifficulty(level){');
 const end=html.indexOf('  function respawn(){',start);
 assert.ok(start>=0&&end>start);
 const mobs=['zombie','spider','enderman','wither','shulker','ender_dragon','piglin','cow']
   .map(kind=>({kind}));
 const SPECIES=Object.fromEntries(mobs.map(m=>[m.kind,{kind:({zombie:'hostile',spider:'neutral',enderman:'neutral',wither:'boss',shulker:'hostile',ender_dragon:'boss',piglin:'neutral',cow:'passive'})[m.kind]}]));
 const local={mobs,SPECIES,mobAI:rules,difficulty:'normal',markSave(){},toast(){},$(id){return {value:id}}};
 vm.runInNewContext(html.slice(start,end)+'\nsetDifficulty("peaceful");',local);
 assert.equal(local.difficulty,'peaceful');
 assert.deepEqual(local.mobs.map(m=>m.kind),['shulker','ender_dragon','piglin','cow']);
});

test('peaceful prevents monster spawn and aggression while dragon flight remains non-damaging',()=>{
 const html=read('index.html');
 const spawn=html.slice(html.indexOf('function spawnOne(kind,x,z){'),html.indexOf('window.MineWorldMobBridge='));
 assert.ok(spawn.includes("if(difficulty==='peaceful'&&mobAI.peacefulDisposition(kind,SPECIES[kind].kind)==='despawn')return null;"));
 assert.ok(html.includes("const aggressive=difficulty!=='peaceful'&&(type.kind==='hostile'"));
 assert.ok(html.includes("if(difficulty!=='peaceful'&&Math.hypot(player.x-m.x,player.z-m.z)<7&&m.attack<=0)"));
 const filter="mobs=mobs.filter(m=>SPECIES[m.kind]&&mobAI.peacefulDisposition(m.kind,SPECIES[m.kind].kind)!=='despawn')";
 assert.equal(html.split(filter).length-1,2,'both difficulty switch and simulation filter must agree');
 assert.ok(html.includes('mineworld-selfhost-v1'),'world save format unchanged');
});
