'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const hud=require('../survival-hud-core.js');
test('ten icons always represent the 0–20 survival range',()=>{
 for(let n=0;n<=20;n++){const icons=hud.icons(n);assert.equal(icons.length,10);assert.equal(icons.filter(x=>x==='full').length,n>>1);assert.equal(icons.filter(x=>x==='half').length,n%2);}
});
test('fractional values quantize down to half icons and clamp invalid inputs',()=>{
 assert.deepEqual(hud.icons(19.9).slice(-2),['full','half']);
 assert.equal(hud.normalize(-10),0);
 assert.equal(hud.normalize(Infinity),0);
 assert.equal(hud.normalize(NaN),0);
 assert.equal(hud.normalize(100),20);
});
test('health and food have independent accessible labels',()=>{
 const m=hud.model(7,13);
 assert.equal(m.healthLabel,'Health 7 of 20');
 assert.equal(m.foodLabel,'Food 13 of 20');
 assert.equal(m.hearts.filter(x=>x==='half').length,1);
 assert.equal(m.hunger.filter(x=>x==='half').length,1);
});
