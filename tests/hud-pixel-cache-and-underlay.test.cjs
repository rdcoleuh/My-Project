'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const context=vm.createContext({window:{},Uint8ClampedArray});
vm.runInContext(read('classic-hud-art.js'),context);
const art=context.window.MineWorldHudArt;

test('cached procedural heart/food pixels cannot be mutated by callers',()=>{
 for(const kind of ['heart','food'])for(const fill of ['full','half','empty']){
  const original=art.pixels(kind,fill);
  const expected=Array.from(original);
  original.fill(0);
  const again=art.pixels(kind,fill);
  assert.deepEqual(Array.from(again),expected,kind+':'+fill);
  assert.notStrictEqual(again,original);
  assert.equal(again.length,11*11*4);
 }
});
test('cached HUD art retains all twenty-one health and food states',()=>{
 for(let value=0;value<=20;value++){
  const states=Array.from(art.slots(value));
  assert.equal(states.length,10);
  assert.equal(states.reduce((n,s)=>n+(s==='full'?2:s==='half'?1:0),0),value);
  for(const fill of states)assert.ok(art.pixels('heart',fill)&&art.pixels('food',fill));
 }
});
test('player-imported transparent empty sprites cannot become half-icon underlays',()=>{
 const source=read('local-resource-pack.js');
 assert.ok(source.includes('!window.MineWorldHotbarUV?.validStatSprite(underlay.width,underlay.height)||'));
 assert.ok(source.includes('!visibleCandidate(underlay)'));
 assert.ok(source.includes('if(underlay)ctx.drawImage(underlay,0,0,canvas.width,canvas.height)'));
});
