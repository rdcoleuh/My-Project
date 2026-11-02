'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'mob-ai-rules.js'),'utf8'),ctx);
const ai=ctx.window.MineWorldMobAIRules;

test('overlapping targets remain visible instead of becoming blind inside one voxel',()=>{
 const a={x:1.25,y:2.5,z:3.25};
 assert.equal(ai.rayClear(a,{...a},()=>true),true,'exact overlap');
 assert.equal(ai.rayClear(a,{x:1.25001,y:2.5,z:3.25},()=>true),true,'sub-millimeter separation');
 assert.equal(ai.rayClear(a,{...a},()=>true,0),false,'invalid sight radius remains rejected');
});

test('short rays along a voxel face still respect opaque adjacent blocks',()=>{
 const a={x:1,y:2.25,z:3.5},b={x:1,y:2.2501,z:3.5};
 assert.equal(ai.rayClear(a,b,()=>true),true);
 assert.equal(ai.rayClear(a,b,(x)=>x!==0),false,'neighboring wall touches the stationary face');
 assert.equal(ai.rayClear(a,{...a},(x)=>x!==0),false,'zero-length boundary rays retain cover');
});

test('existing long-range wall checks are preserved',()=>{
 const a={x:.5,y:1.5,z:.5},b={x:4.5,y:1.5,z:.5};
 assert.equal(ai.rayClear(a,b,()=>true),true);
 assert.equal(ai.rayClear(a,b,(x)=>x!==2),false);
});
