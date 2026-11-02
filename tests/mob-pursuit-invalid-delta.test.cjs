/* Invalid browser frame deltas must never corrupt mob pursuit memory. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const context=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'mob-ai-rules.js'),'utf8'),context);
const pursuit=context.window.MineWorldMobAIRules.pursuitPoint;
const last={x:12,y:-30,z:5,ttl:2};

test('nonnumeric and nonfinite frame times cannot erase pursuit memory',()=>{
 for(const dt of [Infinity,-Infinity,NaN,'2','0.5',null,undefined,{},[],true]){
  const result=pursuit(last,null,dt);
  assert.equal(result.ttl,2,'invalid delta '+String(dt)+' must not age memory');
  assert.equal(result.x,12);
 }
});
test('valid elapsed seconds expire pursuit memory at the real deadline',()=>{
 assert.equal(pursuit(last,null,.25).ttl,1.75);
 assert.equal(pursuit(last,null,1.5).ttl,.5);
 assert.equal(pursuit(last,null,2),null);
 assert.equal(pursuit(last,null,120),null,'finite tab-suspension time still expires memory');
 assert.equal(pursuit(last,null,-1).ttl,2);
});
test('a new sighting refreshes the target independently of frame validity',()=>{
 const visible={x:15,y:-31,z:8};
 const result=pursuit(last,visible,Infinity);
 assert.equal(result.ttl,2);
 assert.equal(result.x,15);
 assert.equal(result.y,-31);
 assert.equal(result.z,8);
 assert.equal(pursuit(null,{x:Infinity,y:0,z:0},.5),null);
});
test('the deployed service worker includes the updated mob AI module',()=>{
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert.match(sw,/const VERSION='mineworld-6-\\d+-[a-z0-9-]+';/);
 assert.ok(sw.includes("'./mob-ai-rules.js'"));
});
