'use strict';
// Original MineWorld regression coverage for idle/blocked furnace batching.
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../furnace-core.js');
function compare(raw,steps){
 const fast=core.tick(raw,steps);
 let stepped=core.state(raw);
 for(let i=0;i<steps;i++)stepped=core.tick(stepped,1);
 assert.deepEqual(fast,stepped);
 return fast;
}
test('empty furnace with paid burn time exhausts fuel without cooking',()=>{
 const result=compare({burn:200,burnTotal:1600,progress:17},12000);
 assert.equal(result.burn,0);
 assert.equal(result.progress,0);
});
test('blocked output advances burn without consuming ingredient or stored fuel',()=>{
 const initial={input:{id:'sand',count:4},output:{id:'glass',count:64},fuel:{id:'coal',count:2},burn:900,burnTotal:1600,progress:123};
 const result=compare(initial,12000);
 assert.deepEqual(result.input,initial.input);
 assert.deepEqual(result.output,initial.output);
 assert.deepEqual(result.fuel,initial.fuel);
 assert.equal(result.burn,0);
 assert.equal(result.progress,0);
});
test('unsupported input leaves paid burn accounting intact',()=>{
 const result=compare({input:{id:'unknown',count:1},fuel:{id:'coal',count:1},burn:350,burnTotal:1600},100);
 assert.equal(result.burn,250);
 assert.deepEqual(result.fuel,{id:'coal',count:1});
});
test('zero ticks normalize blocked progress but preserve paid burn',()=>{
 const result=compare({output:{id:'glass',count:64},input:{id:'sand',count:1},burn:70,burnTotal:1600,progress:199},0);
 assert.equal(result.burn,70);
 assert.equal(result.progress,0);
});
