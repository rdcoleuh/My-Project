'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const window={};
const source=fs.readFileSync(path.join(__dirname,'..','classic-hud-art.js'),'utf8');
vm.runInNewContext(source,{window,Uint8ClampedArray,Number,Math,Array,Object,globalThis:{}});
const art=window.MineWorldHudArt;
test('ten icons encode all 21 integral values without overstating health',()=>{
 for(let amount=0;amount<=20;amount++){
  const icons=Array.from(art.slots(amount));
  assert.equal(icons.length,10);
  assert.equal(icons.reduce((sum,fill)=>sum+(fill==='full'?2:fill==='half'?1:0),0),amount);
  assert.ok(icons.every(fill=>['full','half','empty'].includes(fill)));
 }
});
test('clamps malformed, fractional and extreme HUD values',()=>{
 for(const [value,expected] of [[-5,0],[25,20],[19.9,19],[1.9,1],[NaN,0],[Infinity,0],['oops',0],[null,0]]){
  assert.equal(art.points(value),expected);
 }
});
test('half icons are used for odd values of both stats',()=>{
 assert.equal(art.slots(1)[0],'half');
 assert.equal(art.slots(19)[9],'half');
 assert.equal(art.slots(20)[9],'full');
 assert.equal(art.slots(0)[0],'empty');
 assert.equal(art.description('Hunger',19),'Hunger: 19 of 20');
});
test('original artwork has transparent backgrounds and independent half fill',()=>{
 const full=art.pixels('heart','full'),half=art.pixels('heart','half'),empty=art.pixels('heart','empty');
 assert.equal(full.length,11*11*4);
 assert.equal(full[3],0);
 const left=(3*11+3)*4,right=(3*11+7)*4;
 assert.deepEqual(Array.from(half.slice(left,left+4)),Array.from(full.slice(left,left+4)));
 assert.deepEqual(Array.from(half.slice(right,right+4)),Array.from(empty.slice(right,right+4)));
});
