/* A corrupted mob save or non-finite frame delta must not instantly detonate creepers. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','mob-ai-rules.js'),'utf8'),ctx);
const {creeperTick}=ctx.window.MineWorldMobAIRules;
test('invalid saved fuse values cannot instantly trigger an explosion',()=>{
 for(const fuse of [Infinity,-Infinity,NaN,'1.5','Infinity',{},null]){
  const result=creeperTick(fuse,.1,true);
  assert.equal(result.explode,false,'invalid fuse '+String(fuse));
  assert.equal(result.fuse,.1,'invalid fuse must restart at a safe zero baseline');
 }
});
test('invalid frame deltas cannot advance a live fuse',()=>{
 for(const dt of [Infinity,-Infinity,NaN,'.1',null,undefined,-2]){
  const result=creeperTick(1.2,dt,true);
  assert.equal(result.explode,false,'invalid delta '+String(dt));
  assert.equal(result.fuse,1.2,'invalid delta must not advance fuse');
 }
});
test('normal finite fuses still prime, defuse and cap background frame catch-up',()=>{
 assert.equal(creeperTick(1.4,.1,true).explode,true);
 assert.equal(creeperTick(0,100,true).fuse,.1);
 assert.ok(creeperTick(1,.1,false).fuse<1);
 assert.equal(creeperTick(0,0,true).fuse,0);
});
test('service worker invalidates cached mob AI on deployment',()=>{
 const sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
 assert.match(sw,/mineworld-6-177-creeper-fuse-validation/);
 assert.ok(sw.includes("'./mob-ai-rules.js'"));
});
