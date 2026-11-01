/* Regression: legacy and signed deep-world entity hitbox boundaries. */
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'entity-hitboxes.js'),'utf8'),sandbox);
const hit=sandbox.window.MineWorldEntityHitboxes;
const empty=()=>0,shape=()=>({left:0,right:1,bottom:0,top:1,front:0,back:1}),solid=id=>id!==0;
const fits=(x,y,z,bounds)=>hit.canOccupy({kind:'player',x,y,z},empty,shape,solid,bounds);
test('legacy 48-layer world rejects head above ceiling but allows exactly fitting player',()=>{
 const bounds={width:10,height:48,depth:10};
 assert.equal(fits(5,47,5,bounds),false);
 assert.equal(fits(5,46.2,5,bounds),true);
 assert.equal(fits(5,-.01,5,bounds),false);
 assert.equal(fits(.2,5,5,bounds),false,'horizontal legacy bounds unchanged');
});
test('signed deep world supports Y -64 through 319 and rejects out-of-bounds entities',()=>{
 const bounds={width:10,height:384,depth:10,minY:-64};
 assert.equal(fits(5,-64,5,bounds),true,'player feet may stand at -64');
 assert.equal(fits(5,-64.01,5,bounds),false,'feet below bedrock are invalid');
 assert.equal(fits(5,318.2,5,bounds),true,'head may touch upper world boundary 320');
 assert.equal(fits(5,318.3,5,bounds),false,'head cannot exceed world ceiling');
});
test('signed horizontal origins preserve complete player bounding box',()=>{
 const bounds={width:256,height:384,depth:256,minX:-128,minY:-64,minZ:-128};
 assert.equal(fits(-127.7,-60,-127.7,bounds),true);
 assert.equal(fits(-127.8,-60,-127.7,bounds),false);
 assert.equal(fits(127.8,-60,127.7,bounds),false);
 assert.equal(fits(0,-60,0,bounds),true);
});
test('invalid or zero world spans fail closed without probing block storage',()=>{
 let calls=0;const probe=()=>{calls++;return 0;};
 for(const bounds of [{width:10,height:NaN,depth:10},{width:10,height:0,depth:10},
  {width:Infinity,height:48,depth:10},{width:10,height:48,depth:10,minY:Infinity}]){
  assert.equal(hit.canOccupy({kind:'player',x:5,y:5,z:5},probe,shape,solid,bounds),false);
 }
 assert.equal(calls,0);
});
test('collision still checks occupied blocks at negative Y',()=>{
 const bounds={width:10,height:384,depth:10,minY:-64};
 const obstacle=(x,y,z)=>x===5&&y===-63&&z===5?1:0;
 assert.equal(hit.canOccupy({kind:'player',x:5.5,y:-64,z:5.5},obstacle,shape,solid,bounds),false);
 assert.equal(hit.canOccupy({kind:'player',x:6.5,y:-64,z:5.5},obstacle,shape,solid,bounds),true);
});
