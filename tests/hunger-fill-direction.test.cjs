'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const window={};
vm.runInNewContext(read('classic-hud-art.js'),{window,Uint8ClampedArray,Number,Math,Array,Object,globalThis:{}});
const art=window.MineWorldHudArt;
const pixel=(data,x,y)=>Array.from(data.slice((y*11+x)*4,(y*11+x)*4+4));

test('food half sprite fills from the right while hearts fill from the left',()=>{
 const foodFull=art.pixels('food','full'),foodHalf=art.pixels('food','half'),foodEmpty=art.pixels('food','empty');
 const heartFull=art.pixels('heart','full'),heartHalf=art.pixels('heart','half'),heartEmpty=art.pixels('heart','empty');
 assert.deepEqual(pixel(foodHalf,8,3),pixel(foodFull,8,3));
 assert.deepEqual(pixel(foodHalf,5,3),pixel(foodEmpty,5,3));
 assert.deepEqual(pixel(heartHalf,3,3),pixel(heartFull,3,3));
 assert.deepEqual(pixel(heartHalf,7,3),pixel(heartEmpty,7,3));
});

test('both stat bars preserve exact 0-20 values with half-icons',()=>{
 for(let amount=0;amount<=20;amount++){
  const states=Array.from(art.slots(amount));
  assert.equal(states.length,10);
  assert.equal(states.reduce((sum,s)=>sum+(s==='full'?2:s==='half'?1:0),0),amount);
 }
});

test('survival hunger row and imported half-sprite fallbacks use right-hand pixels',()=>{
 const html=read('index.html'),pack=read('local-resource-pack.js');
 assert.match(html,/#hunger-text\{flex-direction:row-reverse!important\}/);
 assert.match(html,/#hunger-text \.mw-pack-stat-clipped\{clip-path:inset\(0 0 0 50%\)!important\}/);
 assert.ok(pack.includes("const fromX=kind==='food'?image.width-half:0;"));
 assert.ok(pack.includes("ctx.drawImage(image,fromX,0,half,image.height,fromX,0,half,canvas.height)"));
 assert.ok(html.includes("aria-label',window.MineWorldHudArt?.description?.(kind,points)"));
});
