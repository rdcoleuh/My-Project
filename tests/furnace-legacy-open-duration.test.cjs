/* Regression: legacy station kinds must not crash on initial modal help. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'..','furnace-ui.js'),'utf8');
test('initial furnace help guards unknown station cooking duration',()=>{
 const open=source.slice(source.indexOf(' function open(position,'),source.indexOf(' function close(){'));
 assert.ok(open.includes('Number.isFinite(window.MineWorldFurnace.KINDS?.[station]?.cook)'));
 assert.ok(open.includes('window.MineWorldFurnace.KINDS[station].cook>0'));
 assert.ok(open.includes(':10)'));
 assert.ok(!open.includes("+'; one item takes '+window.MineWorldFurnace.KINDS[station].cook+"));
});
test('render retains unknown-kind cooking duration fallback',()=>{
 assert.match(source,/const cookDuration=Number\.isFinite\(station\?\.cook\)&&station\.cook>0\?station\.cook:10/);
});
