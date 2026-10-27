'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','survival-hunger.js'),'utf8'),ctx);
const h=ctx.window.MineWorldHunger;

test('normal exhaustion consumes saturation first, then food',()=>{
  const first=h.consume(20,5,0,4);
  assert.equal(first.hunger,20);
  assert.equal(first.saturation,4);
  assert.equal(first.exhaustion,0);
  const next=h.consume(18,2,3,2);
  assert.equal(next.hunger,18);
  assert.equal(next.saturation,1);
  assert.equal(next.exhaustion,1);
});
test('a fractional saturation point absorbs one complete exhaustion tick',()=>{
  const out=h.consume(20,.5,0,8);
  assert.equal(out.saturation,0);
  assert.equal(out.hunger,19);
});
test('large finite exhaustion never freezes the game loop',()=>{
  const out=h.consume(20,0,0,1e9);
  assert.equal(out.hunger,0);
  assert.equal(out.saturation,0);
  assert.equal(out.exhaustion,0);
  const huge=h.consume(20,20,0,Number.MAX_VALUE);
  assert.equal(huge.hunger,0);
  assert.ok(Number.isFinite(huge.exhaustion));
  assert.ok(huge.exhaustion>=0&&huge.exhaustion<4);
});
test('invalid exhaustion or food amounts cannot poison saved survival stats',()=>{
  const consumed=h.consume(20,5,0,Infinity);
  assert.equal(consumed.hunger,20);
  assert.equal(consumed.saturation,5);
  const eaten=h.eat(18,4,Infinity);
  assert.equal(eaten.hunger,18);
  assert.equal(eaten.saturation,4);
  const normal=h.eat(18,4,2);
  assert.equal(normal.hunger,20);
  assert.ok(normal.saturation>4);
});
