'use strict';
// Regression guard: a corrupt imported PNG must not hide the accessible
// procedural/text fallback before the browser has decoded the image.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../furnace-ui.js'),'utf8');
test('furnace slot icon stays text until image load succeeds',()=>{
 const begin=source.indexOf('function slotArt(');
 const end=source.indexOf(' function el(id)',begin);
 assert.ok(begin>=0&&end>begin);
 const slot=source.slice(begin,end);
 assert.match(slot,/img\.onload\s*=\s*\(\)\s*=>/);
 assert.match(slot,/img\.onerror\s*=\s*\(\)\s*=>/);
 assert.match(slot,/if\(node\.dataset\.artStamp!==stamp\)return/);
 assert.ok(slot.indexOf('img.onload=')<slot.indexOf('img.src=src'));
 assert.ok(slot.indexOf('img.onerror=')<slot.indexOf('img.src=src'));
 assert.match(slot,/img\.onerror=[\s\S]*?img\.hidden=true;letters\.hidden=false/);
 assert.match(slot,/img\.onload=[\s\S]*?img\.hidden=false;letters\.hidden=true/);
});
