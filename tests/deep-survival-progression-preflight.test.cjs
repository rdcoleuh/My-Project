/* Preserve survival and progression before any opt-in 384-layer migration. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'world-depth.js'),'utf8'),ctx);
const plan=ctx.window.MineWorldWorldDepth.planLegacySaveMigration;
const base={version:13,worldSize:8,edits:[],netherEdits:[],endEdits:[]};
const preview=save=>plan({...base,...save},{width:8,depth:8});
const plain=value=>JSON.parse(JSON.stringify(value));
const achievements=()=>({version:1,completed:['story/stone_age'],
 biomes:{nether:['nether_wastes'],overworld:['plains']},foods:['apple'],killKinds:['zombie']});
test('survival meters, controls and endgame progress survive a detached height-migration preview',()=>{
 const save={health:15,hunger:13,saturation:4.5,exhaustion:2.75,
  gameMode:'survival',difficulty:'hard',equipped:'sword',cameraMode:2,dayClock:19876.25,
  dragonDefeated:true,eyesPlaced:12,netherPortalBuilt:true,
  netherPortalPosition:{x:4.5,z:3.5},advancements:achievements()};
 const before=plain(save),result=preview(save);
 assert.deepEqual(plain(result.survivalState),{
  health:15,hunger:13,saturation:4.5,exhaustion:2.75,gameMode:'survival',
  difficulty:'hard',equipped:'sword',cameraMode:2,dayClock:19876.25});
 assert.deepEqual(plain(result.progressionState),{
  dragonDefeated:true,eyesPlaced:12,netherPortalBuilt:true,
  netherPortalPosition:{x:4.5,z:3.5},advancements:achievements()});
 assert.equal(result.status,'preview-only');
 assert.ok(Object.isFrozen(result.survivalState));
 assert.ok(Object.isFrozen(result.progressionState));
 assert.ok(Object.isFrozen(result.progressionState.advancements.completed));
 save.advancements.completed.push('story/diamonds');
 save.netherPortalPosition.x=1;
 assert.deepEqual(plain(result.progressionState.advancements),before.advancements);
 assert.equal(result.progressionState.netherPortalPosition.x,4.5);
});
test('old saves without survival/progression fields are still previewable',()=>{
 const result=preview({version:11});
 assert.ok(Object.values(result.survivalState).every(value=>value===null));
 assert.ok(Object.values(result.progressionState).every(value=>value===null));
});
test('invalid survival meters fail closed instead of being clamped during migration',()=>{
 for(const [field,value] of [['health',-1],['health',21],['health','20'],
  ['hunger',Infinity],['hunger',-0.1],['saturation',21],['exhaustion',4],
  ['exhaustion',NaN],['dayClock',Infinity],['difficulty','nightmare'],
  ['gameMode','spectator'],['equipped','axe'],['cameraMode',9]]){
  assert.throws(()=>preview({[field]:value}),/Invalid saved/,field);
 }
 assert.throws(()=>preview({hunger:4,saturation:5}),/saturation exceeds hunger/);
});
test('invalid boss, portal and End-eye state is rejected without changing the save',()=>{
 for(const [field,value] of [['dragonDefeated','yes'],['eyesPlaced',13],
  ['eyesPlaced',3.5],['netherPortalBuilt',1],
  ['netherPortalPosition',{x:9,z:2}],
  ['netherPortalPosition',{x:2,z:Infinity}],
  ['netherPortalPosition',[2,3]]]){
  const save={...base,edits:[[0,11]],[field]:value},before=plain(save);
  assert.throws(()=>preview(save),/Invalid saved/,field);
  assert.deepEqual(plain(save),before,'preflight never mutates the source');
 }
});
test('advancement lists are preserved and malformed metadata cannot execute accessors',()=>{
 const a=achievements();
 const result=preview({advancements:a});
 a.biomes.nether.push('soul_sand_valley');
 assert.deepEqual(plain(result.progressionState.advancements.biomes.nether),['nether_wastes']);
 for(const advancements of [
  {version:2,completed:[],biomes:{nether:[],overworld:[]},foods:[],killKinds:[]},
  {...achievements(),completed:[123]},
  {...achievements(),foods:Array(101).fill('apple')},
  {...achievements(),biomes:{nether:[],overworld:'plains'}},
  'broken'
 ])assert.throws(()=>preview({advancements}),/Invalid saved/);
 const accessor=achievements();
 Object.defineProperty(accessor,'completed',{enumerable:true,get(){throw Error('executed');}});
 assert.throws(()=>preview({advancements:accessor}),/Invalid saved advancements metadata/);
});
test('preflight does not activate 384-layer live worlds or alter existing save format',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/const W=10000, D=10000, H=48, SEA=14/);
 assert.match(html,/verticalProfile:window.MineWorldWorldDepth.LEGACY_PROFILE/);
 assert.equal(preview({health:20,eyesPlaced:0}).targetProfile,ctx.window.MineWorldWorldDepth.DEEP_PROFILE);
});
