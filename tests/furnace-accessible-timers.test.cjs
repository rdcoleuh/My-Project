/* Regression: furnace UI uses each station's own cooking duration. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'..','furnace-ui.js'),'utf8');
test('station help uses engine cooking duration instead of a fixed ten seconds',()=>{
 assert.match(source,/const cookDuration=window\.MineWorldFurnace\.KINDS\[m\.kind\]\.cook/);
 assert.match(source,/One item takes '\+cookDuration\+' seconds to smelt/);
});
test('native progress elements expose remaining time to assistive technology',()=>{
 assert.match(source,/mw-furnace-flame'\)\.setAttribute\('aria-valuetext'/);
 assert.match(source,/mw-furnace-cook'\)\.setAttribute\('aria-valuetext'/);
 assert.match(source,/Math\.max\(0,Math\.ceil\(cookDuration-m\.progress\)\)/);
});
