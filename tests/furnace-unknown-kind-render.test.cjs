/* Unknown legacy station types must not crash the interactive redraw. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../furnace-ui.js'),'utf8');
const render=source.slice(source.indexOf('function render(){'),source.indexOf('function open(position,kind=',source.indexOf('function render(){')));
test('unknown station kind gets a safe positive cooking duration',()=>{
 assert.ok(render.includes('KINDS?.[m.kind]'));
 assert.ok(render.includes('Number.isFinite(station?.cook)'));
 assert.ok(render.includes('station.cook>0?station.cook:10'));
});
test('both progress displays use the guarded duration',()=>{
 assert.equal(render.split('m.progress/cookDuration').length-1,2);
 assert.ok(!render.includes('m.progress/window.MineWorldFurnace.KINDS[m.kind].cook'));
});
