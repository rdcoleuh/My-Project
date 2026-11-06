const test = require('node:test');
const assert = require('node:assert/strict');
const furnace = require('../furnace-core.js');

test('malformed saved burn without a matching total cannot provide free smelts', () => {
 const restored = furnace.deserialize({input:{id:'sand',count:2},burn:400,burnTotal:0,progress:199});
 assert.equal(restored.burn,0);
 assert.equal(restored.burnTotal,0);
 const after = furnace.tick(restored,2);
 assert.equal(after.output,null);
 assert.equal(after.progress,195);
 assert.equal(after.input.count,2);
});

test('saved burn is bounded by recorded total, not promoted to a new total', () => {
 const restored = furnace.state({burn:900,burnTotal:25});
 assert.equal(restored.burn,25);
 assert.equal(restored.burnTotal,25);
});

test('valid burning furnace still completes smelting after snapshot round trip', () => {
 const before={input:{id:'sand',count:1},burn:150,burnTotal:1600,progress:100};
 const restored=furnace.deserialize(JSON.parse(JSON.stringify(furnace.serialize(before))));
 const after=furnace.tick(restored,100);
 assert.deepEqual(after.output,{id:'glass',count:1});
 assert.equal(after.burn,50);
});
