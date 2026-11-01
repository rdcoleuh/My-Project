/* Villager trading is player progression, not terrain. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'world-depth.js'),'utf8'),ctx);
const plan=ctx.window.MineWorldWorldDepth.planLegacySaveMigration;
const base={version:13,worldSize:8,edits:[],netherEdits:[],endEdits:[]};
const preview=fields=>plan({...base,...fields},{width:8,depth:8});
const plain=value=>JSON.parse(JSON.stringify(value));
test('villager experience, offer usage and restock survive without aliases',()=>{
 const villagers={'3,4:2':{xp:135,uses:{0:12,1:3},restock:27},
  '-1,7:4':{xp:32,uses:{2:1},restock:8}};
 const result=preview({villagerProgress:villagers});
 assert.deepEqual(plain(result.progressionState.villagerProgress),villagers);
 assert.ok(Object.isFrozen(result.progressionState.villagerProgress));
 assert.ok(Object.isFrozen(result.progressionState.villagerProgress['3,4:2'].uses));
 villagers['3,4:2'].xp=0;villagers['3,4:2'].uses[0]=0;
 assert.equal(result.progressionState.villagerProgress['3,4:2'].xp,135);
 assert.equal(result.progressionState.villagerProgress['3,4:2'].uses[0],12);
});
test('old saves without villager trading remain previewable',()=>{
 assert.equal(preview({version:5}).progressionState.villagerProgress,null);
 assert.deepEqual(plain(preview({villagerProgress:{}}).progressionState.villagerProgress),{});
});
test('invalid IDs, XP, restock and offer usage abort migration',()=>{
 const invalid=[
  {'not-an-id':{xp:1,uses:{},restock:0}},
  {'1,2:3':{xp:'135',uses:{},restock:0}},
  {'1,2:3':{xp:100000,uses:{},restock:0}},
  {'1,2:3':{xp:10,uses:{},restock:1.5}},
  {'1,2:3':{xp:10,uses:{0:-1},restock:0}},
  {'1,2:3':{xp:10,uses:{0:Infinity},restock:0}},
  {'1,2:3':{xp:10,uses:{'01':1},restock:0}},
  {'1,2:3':{xp:10,uses:[],restock:0}}
 ];
 for(const villagerProgress of invalid)
  assert.throws(()=>preview({villagerProgress}),/Invalid saved villager/);
});
test('hostile accessors, prototype keys and oversized collections fail closed',()=>{
 const state={xp:10,uses:{0:2},restock:1};
 Object.defineProperty(state,'xp',{enumerable:true,get(){throw Error('getter executed');}});
 assert.throws(()=>preview({villagerProgress:{'1,2:3':state}}),/Invalid saved villager trading metadata/);
 const poisoned=JSON.parse('{"1,2:3":{"xp":1,"uses":{"__proto__":3},"restock":0}}');
 assert.throws(()=>preview({villagerProgress:poisoned}),/Invalid saved villager trading metadata/);
 const tooMany={};
 for(let i=0;i<501;i++)tooMany[i+',2:3']={xp:0,uses:{},restock:0};
 assert.throws(()=>preview({villagerProgress:tooMany}),/Invalid saved villager/);
});
test('preview remains read-only and the live Overworld is still 48 layers',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/const W=10000, D=10000, H=48, SEA=14/);
 assert.match(html,/villagerProgress,gameMode,experienceTotal/);
 const result=preview({villagerProgress:{'1,2:3':{xp:10,uses:{0:1},restock:3}}});
 assert.equal(result.status,'preview-only');
 assert.equal(result.targetProfile,ctx.window.MineWorldWorldDepth.DEEP_PROFILE);
});
